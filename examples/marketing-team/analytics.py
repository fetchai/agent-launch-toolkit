#!/usr/bin/env python3
"""
Analytics Agent ($STATS) — Engagement Tracker for the Marketing Team

What it does:
  - Tracks Twitter engagement metrics via the v2 API
  - Generates engagement reports (likes, retweets, impressions)
  - Provides audience insights and content performance rankings
  - Logs trends over time in ctx.storage

What it charges:
  - engagement_report:   0.005 FET — engagement summary for recent tweets
  - audience_insights:   0.005 FET — follower growth, top interactions
  - content_performance: 0.005 FET — best/worst performing content

What it consumes:
  - Nothing (Analytics is a standalone data provider)

Secrets needed:
  - TWITTER_BEARER_TOKEN
  - AGENTVERSE_API_KEY
"""

from uagents import Agent, Context, Protocol
from uagents_core.contrib.protocols.chat import (
    ChatAcknowledgement,
    ChatMessage,
    EndSessionContent,
    TextContent,
    chat_protocol_spec,
)

import json
import os
from datetime import datetime
from uuid import uuid4

import requests

TWITTER_BEARER_TOKEN = os.environ.get("TWITTER_BEARER_TOKEN", "")
TWITTER_API_BASE = "https://api.twitter.com/2"
HEADERS = {"Authorization": f"Bearer {TWITTER_BEARER_TOKEN}"}


# ---------------------------------------------------------------------------
# Twitter Analytics API helpers
# ---------------------------------------------------------------------------


def get_user_id() -> str:
    """Get the authenticated user's Twitter ID."""
    r = requests.get(
        f"{TWITTER_API_BASE}/users/me",
        headers=HEADERS,
        timeout=10,
    )
    if r.status_code == 200:
        return r.json().get("data", {}).get("id", "")
    return ""


def get_user_tweets(user_id: str, max_results: int = 10) -> list:
    """Get recent tweets with public metrics."""
    r = requests.get(
        f"{TWITTER_API_BASE}/users/{user_id}/tweets",
        headers=HEADERS,
        params={
            "max_results": min(max_results, 100),
            "tweet.fields": "public_metrics,created_at",
        },
        timeout=10,
    )
    if r.status_code == 200:
        return r.json().get("data", [])
    return []


def get_user_profile(user_id: str) -> dict:
    """Get user profile with follower count."""
    r = requests.get(
        f"{TWITTER_API_BASE}/users/{user_id}",
        headers=HEADERS,
        params={"user.fields": "public_metrics,created_at,description"},
        timeout=10,
    )
    if r.status_code == 200:
        return r.json().get("data", {})
    return {}


# ---------------------------------------------------------------------------
# Analytics calculations
# ---------------------------------------------------------------------------


def calculate_engagement(tweets: list) -> dict:
    """Calculate engagement metrics across tweets."""
    if not tweets:
        return {"error": "No tweets to analyze"}

    total_likes = 0
    total_retweets = 0
    total_replies = 0
    total_impressions = 0

    for tweet in tweets:
        metrics = tweet.get("public_metrics", {})
        total_likes += metrics.get("like_count", 0)
        total_retweets += metrics.get("retweet_count", 0)
        total_replies += metrics.get("reply_count", 0)
        total_impressions += metrics.get("impression_count", 0)

    count = len(tweets)
    return {
        "tweet_count": count,
        "total_likes": total_likes,
        "total_retweets": total_retweets,
        "total_replies": total_replies,
        "total_impressions": total_impressions,
        "avg_likes": round(total_likes / count, 1),
        "avg_retweets": round(total_retweets / count, 1),
        "avg_replies": round(total_replies / count, 1),
        "engagement_rate": (
            round((total_likes + total_retweets + total_replies) / max(total_impressions, 1) * 100, 2)
        ),
    }


def rank_content(tweets: list) -> list:
    """Rank tweets by engagement score."""
    scored = []
    for tweet in tweets:
        m = tweet.get("public_metrics", {})
        score = m.get("like_count", 0) * 2 + m.get("retweet_count", 0) * 3 + m.get("reply_count", 0)
        scored.append({
            "text": tweet.get("text", "")[:80],
            "score": score,
            "likes": m.get("like_count", 0),
            "retweets": m.get("retweet_count", 0),
            "created": tweet.get("created_at", ""),
        })
    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored


# ---------------------------------------------------------------------------
# Revenue tracking
# ---------------------------------------------------------------------------

TOKEN_ADDRESS = os.environ.get("TOKEN_ADDRESS", "")


def log_revenue(ctx: Context, caller: str, service: str, amount_fet: float):
    log = json.loads(ctx.storage.get("revenue_log") or "[]")
    log.append({
        "caller": caller[:20],
        "service": service,
        "amount": amount_fet,
        "ts": datetime.now().isoformat(),
    })
    log = log[-500:]
    ctx.storage.set("revenue_log", json.dumps(log))


def get_revenue_summary(ctx: Context) -> dict:
    log = json.loads(ctx.storage.get("revenue_log") or "[]")
    total = sum(e.get("amount", 0) for e in log)
    by_service = {}
    for e in log:
        svc = e.get("service", "unknown")
        by_service[svc] = by_service.get(svc, 0) + e.get("amount", 0)
    return {"total_fet": round(total, 4), "calls": len(log), "by_service": by_service}


# ---------------------------------------------------------------------------
# Reply helper
# ---------------------------------------------------------------------------


async def reply(ctx, sender, text, end=False):
    content = [TextContent(type="text", text=text)]
    if end:
        content.append(EndSessionContent(type="end-session"))
    await ctx.send(
        sender,
        ChatMessage(timestamp=datetime.now(), msg_id=uuid4(), content=content),
    )


# ---------------------------------------------------------------------------
# Agent setup
# ---------------------------------------------------------------------------

agent = Agent()
chat_proto = Protocol(spec=chat_protocol_spec)


@chat_proto.on_message(ChatMessage)
async def handle_chat(ctx: Context, sender: str, msg: ChatMessage) -> None:
    await ctx.send(
        sender,
        ChatAcknowledgement(timestamp=datetime.now(), acknowledged_msg_id=msg.msg_id),
    )

    text = " ".join(
        item.text for item in msg.content if isinstance(item, TextContent)
    ).strip()
    lower = text.lower()

    if lower in ("help", "?"):
        await reply(
            ctx,
            sender,
            "Analytics Agent ($STATS) — Engagement Tracker\n\n"
            "Commands:\n"
            "  report [N]       — engagement report for last N tweets (0.005 FET)\n"
            "  audience         — follower count and profile insights (0.005 FET)\n"
            "  top [N]          — top N performing tweets (0.005 FET)\n"
            "  trends           — engagement trends over time\n"
            "  revenue          — revenue summary (total, by service)\n"
            "  balance          — wallet balance in FET\n"
            "  help             — this message",
        )
        return

    # Engagement report
    if lower.startswith("report"):
        parts = text.split()
        n = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else 20
        user_id = get_user_id()
        if not user_id:
            await reply(ctx, sender, "Error: Could not authenticate with Twitter.", end=True)
            return
        tweets = get_user_tweets(user_id, n)
        metrics = calculate_engagement(tweets)
        if "error" in metrics:
            await reply(ctx, sender, f"Error: {metrics['error']}", end=True)
            return

        await reply(
            ctx,
            sender,
            f"Engagement Report (last {metrics['tweet_count']} tweets)\n"
            f"  Likes: {metrics['total_likes']} (avg {metrics['avg_likes']}/tweet)\n"
            f"  Retweets: {metrics['total_retweets']} (avg {metrics['avg_retweets']}/tweet)\n"
            f"  Replies: {metrics['total_replies']} (avg {metrics['avg_replies']}/tweet)\n"
            f"  Impressions: {metrics['total_impressions']}\n"
            f"  Engagement Rate: {metrics['engagement_rate']}%",
            end=True,
        )
        # Store for trend tracking
        history = json.loads(ctx.storage.get("engagement_history") or "[]")
        history.append({**metrics, "ts": datetime.now().isoformat()})
        history = history[-100:]
        ctx.storage.set("engagement_history", json.dumps(history))
        log_revenue(ctx, sender, "engagement_report", 0.005)
        return

    # Audience insights
    if lower in ("audience", "profile", "followers"):
        user_id = get_user_id()
        if not user_id:
            await reply(ctx, sender, "Error: Could not authenticate.", end=True)
            return
        profile = get_user_profile(user_id)
        if not profile:
            await reply(ctx, sender, "Error: Could not fetch profile.", end=True)
            return
        pm = profile.get("public_metrics", {})
        await reply(
            ctx,
            sender,
            f"Audience Insights\n"
            f"  Followers: {pm.get('followers_count', 0):,}\n"
            f"  Following: {pm.get('following_count', 0):,}\n"
            f"  Tweets: {pm.get('tweet_count', 0):,}\n"
            f"  Listed: {pm.get('listed_count', 0):,}\n"
            f"  Bio: {profile.get('description', 'N/A')[:100]}",
            end=True,
        )
        log_revenue(ctx, sender, "audience_insights", 0.005)
        return

    # Top performing content
    if lower.startswith("top"):
        parts = text.split()
        n = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else 5
        user_id = get_user_id()
        if not user_id:
            await reply(ctx, sender, "Error: Could not authenticate.", end=True)
            return
        tweets = get_user_tweets(user_id, 50)
        ranked = rank_content(tweets)[:n]
        if not ranked:
            await reply(ctx, sender, "No tweets to rank.", end=True)
            return
        lines = [f"Top {len(ranked)} tweets by engagement:"]
        for i, t in enumerate(ranked, 1):
            lines.append(
                f"  {i}. [{t['score']}pts] {t['text']}..."
                f"\n     Likes: {t['likes']} | RT: {t['retweets']}"
            )
        await reply(ctx, sender, "\n".join(lines), end=True)
        log_revenue(ctx, sender, "top_tweets", 0.005)
        return

    # Trends
    if lower == "trends":
        history = json.loads(ctx.storage.get("engagement_history") or "[]")
        if len(history) < 2:
            await reply(
                ctx,
                sender,
                "Not enough data for trends. Run 'report' a few times first.",
                end=True,
            )
            return
        recent = history[-5:]
        lines = ["Engagement Trends (last 5 snapshots):"]
        for h in recent:
            lines.append(
                f"  {h['ts'][:16]}: {h['engagement_rate']}% rate, "
                f"{h['avg_likes']} avg likes"
            )
        await reply(ctx, sender, "\n".join(lines), end=True)
        return

    # Revenue summary
    if lower == "revenue":
        summary = get_revenue_summary(ctx)
        lines = [
            f"Revenue Summary",
            f"  Total: {summary['total_fet']} FET across {summary['calls']} calls",
        ]
        for svc, amt in summary["by_service"].items():
            lines.append(f"  {svc}: {round(amt, 4)} FET")
        await reply(ctx, sender, "\n".join(lines), end=True)
        return

    # Wallet balance
    if lower == "balance":
        try:
            raw = ctx.ledger.query_bank_balance(str(agent.wallet.address()), "atestfet")
            fet = int(raw) / 10**18
            await reply(
                ctx,
                sender,
                f"Wallet Balance\n"
                f"  Address: {str(agent.wallet.address())}\n"
                f"  Balance: {fet:.4f} FET",
                end=True,
            )
        except Exception as e:
            await reply(ctx, sender, f"Balance check failed: {e}", end=True)
        return

    await reply(
        ctx, sender, "Analytics Agent ($STATS). Type 'help' for commands.", end=True
    )


@chat_proto.on_message(ChatAcknowledgement)
async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement) -> None:
    ctx.logger.debug(f"Ack from {sender[:20]}")


@agent.on_interval(period=300.0)
async def auto_track(ctx: Context) -> None:
    """Periodically snapshot engagement metrics."""
    user_id = get_user_id()
    if not user_id:
        return
    tweets = get_user_tweets(user_id, 20)
    if not tweets:
        return
    metrics = calculate_engagement(tweets)
    history = json.loads(ctx.storage.get("engagement_history") or "[]")
    history.append({**metrics, "ts": datetime.now().isoformat()})
    history = history[-100:]
    ctx.storage.set("engagement_history", json.dumps(history))
    ctx.logger.info(f"[ANALYTICS] Snapshot: {metrics['engagement_rate']}% engagement rate")


agent.include(chat_proto, publish_manifest=True)

if __name__ == "__main__":
    agent.run()
