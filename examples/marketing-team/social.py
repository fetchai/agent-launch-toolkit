#!/usr/bin/env python3
"""
Social Agent ($POST) — Social Media Manager for the Marketing Team

What it does:
  - Posts tweets to Twitter/X via the v2 API
  - Schedules tweet threads for later posting
  - Checks recent mentions and engagement
  - Calls Writer agent for fresh content via Chat Protocol

What it charges:
  - post_tweet:       0.005 FET — post a single tweet
  - schedule_thread:  0.005 FET — schedule a thread for posting
  - reply_mentions:   0.005 FET — reply to recent mentions

What it consumes:
  - Writer (for content generation — calls via Chat Protocol)

Inter-agent communication:
  "autopost <topic>" sends a request to Writer, then posts the result.
  Social stores the original caller in ctx.storage. When Writer responds
  (async, separate handler invocation), Social posts the content to
  Twitter and notifies the original caller.

Secrets needed:
  - TWITTER_API_KEY, TWITTER_API_SECRET
  - TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET
  - AGENTVERSE_API_KEY
  - WRITER_ADDRESS (peer — Social calls Writer for content)
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
import time
import hashlib
import hmac
import base64
from datetime import datetime
from urllib.parse import quote
from uuid import uuid4

import requests
http_requests = requests  # alias for AgentLaunch API calls (matches writer.py pattern)

# Twitter API v2 credentials
TWITTER_API_KEY = os.environ.get("TWITTER_API_KEY", "")
TWITTER_API_SECRET = os.environ.get("TWITTER_API_SECRET", "")
TWITTER_ACCESS_TOKEN = os.environ.get("TWITTER_ACCESS_TOKEN", "")
TWITTER_ACCESS_SECRET = os.environ.get("TWITTER_ACCESS_SECRET", "")
TWITTER_API_BASE = "https://api.twitter.com/2"


# ---------------------------------------------------------------------------
# Peer communication helpers (same pattern as strategy.py)
# ---------------------------------------------------------------------------

PEERS = {
    "writer": os.environ.get("WRITER_ADDRESS", ""),
}
PEER_LOOKUP = {v: k for k, v in PEERS.items() if v}


async def call_peer(ctx: Context, peer_name: str, message: str, callback: dict = None):
    """Send a ChatMessage to a peer agent and store callback context."""
    addr = PEERS.get(peer_name)
    if not addr:
        ctx.logger.warning(f"Peer '{peer_name}' address not configured")
        return False
    pending = {"peer": peer_name, "message": message, "ts": datetime.now().isoformat()}
    if callback:
        pending.update(callback)
    ctx.storage.set(f"peer_pending:{addr}", json.dumps(pending))
    await ctx.send(
        addr,
        ChatMessage(
            timestamp=datetime.now(),
            msg_id=uuid4(),
            content=[TextContent(type="text", text=message)],
        ),
    )
    ctx.logger.info(f"[SOCIAL] Called {peer_name}: {message[:60]}")
    return True


def get_peer_pending(ctx: Context, sender: str):
    """Check if sender is a known peer with a pending request."""
    if sender not in PEER_LOOKUP:
        return None
    raw = ctx.storage.get(f"peer_pending:{sender}")
    if not raw:
        return None
    ctx.storage.set(f"peer_pending:{sender}", "")
    return json.loads(raw)


# ---------------------------------------------------------------------------
# Twitter API helpers (OAuth 1.0a)
# ---------------------------------------------------------------------------


def _oauth_header(method: str, url: str, params: dict = None) -> str:
    """Build OAuth 1.0a Authorization header."""
    oauth_params = {
        "oauth_consumer_key": TWITTER_API_KEY,
        "oauth_nonce": uuid4().hex,
        "oauth_signature_method": "HMAC-SHA1",
        "oauth_timestamp": str(int(time.time())),
        "oauth_token": TWITTER_ACCESS_TOKEN,
        "oauth_version": "1.0",
    }

    all_params = {**oauth_params, **(params or {})}
    param_str = "&".join(
        f"{quote(k, safe='')}={quote(str(v), safe='')}"
        for k, v in sorted(all_params.items())
    )
    base_str = f"{method.upper()}&{quote(url, safe='')}&{quote(param_str, safe='')}"
    signing_key = f"{quote(TWITTER_API_SECRET, safe='')}&{quote(TWITTER_ACCESS_SECRET, safe='')}"
    signature = base64.b64encode(
        hmac.new(signing_key.encode(), base_str.encode(), hashlib.sha1).digest()
    ).decode()
    oauth_params["oauth_signature"] = signature

    header_parts = ", ".join(
        f'{quote(k, safe="")}="{quote(v, safe="")}"'
        for k, v in sorted(oauth_params.items())
    )
    return f"OAuth {header_parts}"


def post_tweet(text: str, reply_to: str = None) -> dict:
    """Post a tweet via Twitter API v2."""
    url = f"{TWITTER_API_BASE}/tweets"
    payload = {"text": text[:280]}
    if reply_to:
        payload["reply"] = {"in_reply_to_tweet_id": reply_to}

    auth = _oauth_header("POST", url)
    r = requests.post(
        url,
        json=payload,
        headers={"Authorization": auth, "Content-Type": "application/json"},
        timeout=10,
    )
    if r.status_code in (200, 201):
        return r.json().get("data", {})
    return {"error": f"Twitter API {r.status_code}: {r.text[:200]}"}


def post_thread(tweets: list) -> list:
    """Post a thread of tweets, each replying to the previous."""
    results = []
    prev_id = None
    for tweet_text in tweets:
        result = post_tweet(tweet_text.strip(), reply_to=prev_id)
        results.append(result)
        if "error" in result:
            break
        prev_id = result.get("id")
    return results


def get_recent_mentions() -> list:
    """Get recent mentions (requires user ID lookup first)."""
    url = f"{TWITTER_API_BASE}/users/me"
    auth = _oauth_header("GET", url)
    r = requests.get(url, headers={"Authorization": auth}, timeout=10)
    if r.status_code != 200:
        return [{"error": f"Could not get user: {r.status_code}"}]

    user_id = r.json().get("data", {}).get("id")
    if not user_id:
        return [{"error": "No user ID"}]

    url = f"{TWITTER_API_BASE}/users/{user_id}/mentions"
    auth = _oauth_header("GET", url)
    r = requests.get(
        url,
        headers={"Authorization": auth},
        params={"max_results": 10},
        timeout=10,
    )
    if r.status_code == 200:
        return r.json().get("data", [])
    return [{"error": f"Mentions API {r.status_code}"}]


# ---------------------------------------------------------------------------
# Scheduled posts (stored in ctx.storage)
# ---------------------------------------------------------------------------


def get_scheduled(ctx: Context) -> list:
    return json.loads(ctx.storage.get("scheduled_posts") or "[]")


def add_scheduled(ctx: Context, text: str, post_at: str) -> None:
    posts = get_scheduled(ctx)
    posts.append({"text": text, "post_at": post_at, "posted": False})
    ctx.storage.set("scheduled_posts", json.dumps(posts))


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
# Revenue tracking
# ---------------------------------------------------------------------------

TOKEN_ADDRESS = os.environ.get("TOKEN_ADDRESS", "")


def log_revenue(ctx: Context, caller: str, service: str, amount_fet: float):
    """Log a service call for revenue tracking."""
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
    """Get revenue summary from log."""
    log = json.loads(ctx.storage.get("revenue_log") or "[]")
    total = sum(e.get("amount", 0) for e in log)
    by_service = {}
    for e in log:
        svc = e.get("service", "unknown")
        by_service[svc] = by_service.get(svc, 0) + e.get("amount", 0)
    return {"total_fet": round(total, 4), "calls": len(log), "by_service": by_service}


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

    # -----------------------------------------------------------------
    # Check if this is a response from a peer agent (e.g. Writer).
    # -----------------------------------------------------------------
    pending = get_peer_pending(ctx, sender)
    if pending:
        peer_name = pending.get("peer", "unknown")
        action = pending.get("action", "")
        requester = pending.get("requester", "")
        ctx.logger.info(f"[SOCIAL] Got response from {peer_name} ({len(text)} chars)")

        if action == "autopost":
            # Writer returned content — post the first tweet
            first_line = text.split("\n")[0].strip()
            tweet_text = first_line[:280] if first_line else text[:280]
            result = post_tweet(tweet_text)
            if "error" in result:
                if requester:
                    await reply(ctx, requester,
                        f"Writer created content but tweet failed: {result['error']}\n\n"
                        f"Content:\n{text[:500]}", end=True)
            else:
                tweet_id = result.get("id", "unknown")
                log_revenue(ctx, requester or sender, "autopost", 0.005)
                if requester:
                    await reply(ctx, requester,
                        f"Auto-posted from Writer!\n"
                        f"Tweet: {tweet_text[:100]}...\n"
                        f"URL: https://twitter.com/i/status/{tweet_id}", end=True)
            return

        # Default: forward Writer's response to the requester
        if requester:
            await reply(ctx, requester, f"[Writer content]\n\n{text}", end=True)
        return

    # -----------------------------------------------------------------
    # Handle new requests from external callers.
    # -----------------------------------------------------------------

    if lower in ("help", "?"):
        await reply(
            ctx,
            sender,
            "Social Agent ($POST) — Social Media Manager\n\n"
            "Commands:\n"
            "  post <text>         — post a tweet (0.005 FET)\n"
            "  thread <t1>|<t2>... — post a thread, pipe-separated (0.005 FET)\n"
            "  mentions            — check recent mentions (0.005 FET)\n"
            "  schedule <text>     — add to post queue\n"
            "  queue               — view scheduled posts\n"
            "  autopost <topic>    — Writer creates + Social posts (0.01 FET)\n"
            "  revenue             — view revenue summary\n"
            "  balance             — check FET wallet balance\n"
            "  status              — token price + agent health\n"
            "  help                — this message",
        )
        return

    # --- NEW: Auto-post — call Writer for content, then post it ---
    if lower.startswith("autopost "):
        topic = text.split(maxsplit=1)[1].strip()
        sent = await call_peer(ctx, "writer", f"tweet {topic}", {
            "requester": sender,
            "action": "autopost",
        })
        if sent:
            await reply(ctx, sender,
                f"Requesting tweet about '{topic}' from Writer. Will post when ready.")
        else:
            await reply(ctx, sender,
                "Writer not configured. Set WRITER_ADDRESS secret. "
                "Use 'post <text>' to post directly.", end=True)
        return

    # Post a single tweet
    if lower.startswith("post "):
        tweet_text = text.split(maxsplit=1)[1].strip()
        ctx.logger.info(f"[SOCIAL] Posting tweet: {tweet_text[:50]}...")
        result = post_tweet(tweet_text)
        if "error" in result:
            await reply(ctx, sender, f"Error: {result['error']}", end=True)
        else:
            tweet_id = result.get("id", "unknown")
            log_revenue(ctx, sender, "post_tweet", 0.005)
            await reply(
                ctx,
                sender,
                f"Tweet posted!\nID: {tweet_id}\nURL: https://twitter.com/i/status/{tweet_id}",
                end=True,
            )
        return

    # Post a thread
    if lower.startswith("thread "):
        raw = text.split(maxsplit=1)[1].strip()
        tweets = [t.strip() for t in raw.split("|") if t.strip()]
        if not tweets:
            await reply(ctx, sender, "Provide tweets separated by |", end=True)
            return
        ctx.logger.info(f"[SOCIAL] Posting thread: {len(tweets)} tweets")
        results = post_thread(tweets)
        lines = [f"Thread posted ({len(results)} tweets):"]
        for i, r in enumerate(results, 1):
            if "error" in r:
                lines.append(f"  {i}. Error: {r['error']}")
            else:
                lines.append(f"  {i}. https://twitter.com/i/status/{r.get('id')}")
        log_revenue(ctx, sender, "post_thread", 0.005)
        await reply(ctx, sender, "\n".join(lines), end=True)
        return

    # Check mentions
    if lower in ("mentions", "check mentions"):
        ctx.logger.info("[SOCIAL] Checking mentions")
        mentions = get_recent_mentions()
        if not mentions:
            await reply(ctx, sender, "No recent mentions.", end=True)
            return
        if "error" in mentions[0]:
            await reply(ctx, sender, f"Error: {mentions[0]['error']}", end=True)
            return
        log_revenue(ctx, sender, "check_mentions", 0.005)
        lines = [f"Recent mentions ({len(mentions)}):"]
        for m in mentions[:10]:
            lines.append(f"  - {m.get('text', '???')[:100]}")
        await reply(ctx, sender, "\n".join(lines), end=True)
        return

    # Schedule a post
    if lower.startswith("schedule "):
        tweet_text = text.split(maxsplit=1)[1].strip()
        add_scheduled(ctx, tweet_text, datetime.now().isoformat())
        queue = get_scheduled(ctx)
        await reply(
            ctx,
            sender,
            f"Added to queue. {len(queue)} posts scheduled.",
            end=True,
        )
        return

    # View queue
    if lower == "queue":
        queue = get_scheduled(ctx)
        if not queue:
            await reply(ctx, sender, "No scheduled posts.", end=True)
            return
        lines = [f"Scheduled posts ({len(queue)}):"]
        for i, p in enumerate(queue, 1):
            status = "posted" if p.get("posted") else "pending"
            lines.append(f"  {i}. [{status}] {p['text'][:60]}...")
        await reply(ctx, sender, "\n".join(lines), end=True)
        return

    # Revenue summary
    if lower == "revenue":
        summary = get_revenue_summary(ctx)
        lines = [f"Revenue Summary — Social Agent"]
        lines.append(f"  Total: {summary['total_fet']} FET ({summary['calls']} calls)")
        for svc, amt in summary["by_service"].items():
            lines.append(f"  {svc}: {round(amt, 4)} FET")
        await reply(ctx, sender, "\n".join(lines), end=True)
        return

    # Wallet balance
    if lower == "balance":
        try:
            balance = ctx.ledger.query_bank_balance(
                str(agent.wallet.address()), "atestfet"
            )
            fet = int(balance) / 10**18
            await reply(ctx, sender,
                f"Wallet Balance\n"
                f"  Address: {str(agent.wallet.address())}\n"
                f"  Balance: {round(fet, 4)} FET", end=True)
        except Exception as e:
            await reply(ctx, sender, f"Balance check failed: {e}", end=True)
        return

    # Token status (self-awareness)
    if lower == "status":
        lines = ["Social Agent — Status"]
        # Revenue
        summary = get_revenue_summary(ctx)
        lines.append(f"  Revenue: {summary['total_fet']} FET ({summary['calls']} calls)")
        # Token price (if available)
        if TOKEN_ADDRESS:
            try:
                r = http_requests.get(
                    f"https://agent-launch.ai/api/tokens/address/{TOKEN_ADDRESS}",
                    timeout=5,
                )
                if r.status_code == 200:
                    data = r.json()
                    lines.append(f"  Token: ${data.get('symbol', 'POST')}")
                    lines.append(f"  Price: {data.get('price', 'N/A')} FET")
                    lines.append(f"  Holders: {data.get('holderCount', 'N/A')}")
                    lines.append(f"  Market cap: {data.get('marketCap', 'N/A')} FET")
            except Exception:
                lines.append("  Token: not configured or unavailable")
        else:
            lines.append("  Token: TOKEN_ADDRESS not set")
        await reply(ctx, sender, "\n".join(lines), end=True)
        return

    await reply(
        ctx, sender, "Social Agent ($POST). Type 'help' for commands.", end=True
    )


@chat_proto.on_message(ChatAcknowledgement)
async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement) -> None:
    ctx.logger.debug(f"Ack from {sender[:20]}")


@agent.on_interval(period=300.0)
async def process_queue(ctx: Context) -> None:
    """Post scheduled tweets that are ready."""
    queue = get_scheduled(ctx)
    updated = False
    for post in queue:
        if not post.get("posted"):
            result = post_tweet(post["text"])
            if "error" not in result:
                post["posted"] = True
                post["tweet_id"] = result.get("id")
                updated = True
                ctx.logger.info(f"[SOCIAL] Posted scheduled tweet: {result.get('id')}")
                break  # One per interval to avoid rate limits
    if updated:
        ctx.storage.set("scheduled_posts", json.dumps(queue))


agent.include(chat_proto, publish_manifest=True)

if __name__ == "__main__":
    agent.run()
