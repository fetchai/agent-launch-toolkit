#!/usr/bin/env python3
"""
Writer Agent ($WRITE) — Content Creator for the Marketing Team

What it does:
  - Creates blog posts, tweet threads, newsletters, and ad copy via ASI1-mini
  - Supports multiple content formats with customizable tone and length
  - Caches recent outputs to avoid duplicate generation

What it charges:
  - blog_post:     0.01 FET — full blog article (500-1000 words)
  - tweet_thread:  0.01 FET — 3-7 tweet thread
  - newsletter:    0.01 FET — newsletter edition
  - ad_copy:       0.01 FET — ad copy with variants

What it consumes:
  - Nothing (Writer is a root content provider)

Secrets needed:
  - ASI1_API_KEY
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

import requests as http_requests
from openai import OpenAI

client = OpenAI(
    base_url="https://api.asi1.ai/v1",
    api_key=os.environ.get("ASI1_API_KEY", ""),
)

SYSTEM_PROMPT = (
    "You are a marketing content writer for AgentLaunch, a platform for "
    "building and tokenizing AI agents on the Fetch.ai ecosystem. "
    "Write engaging, clear, and concise content. "
    "Use a professional but approachable tone."
)


# ---------------------------------------------------------------------------
# Content generators
# ---------------------------------------------------------------------------


def generate_blog_post(topic: str) -> str:
    """Generate a blog post on the given topic."""
    resp = client.chat.completions.create(
        model="asi1-mini",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": f"Write a blog post (500-800 words) about: {topic}\n\n"
                "Include a compelling title, introduction, 3-4 sections with subheadings, "
                "and a conclusion with a call to action.",
            },
        ],
        max_tokens=2000,
        temperature=0.7,
    )
    return resp.choices[0].message.content


def generate_tweet_thread(topic: str) -> str:
    """Generate a tweet thread (3-7 tweets)."""
    resp = client.chat.completions.create(
        model="asi1-mini",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": f"Write a Twitter/X thread (5 tweets) about: {topic}\n\n"
                "Format each tweet on its own line, numbered 1/ 2/ 3/ etc. "
                "Each tweet must be under 280 characters. "
                "Make the first tweet a hook and the last a call to action.",
            },
        ],
        max_tokens=1000,
        temperature=0.8,
    )
    return resp.choices[0].message.content


def generate_newsletter(topic: str) -> str:
    """Generate a newsletter edition."""
    resp = client.chat.completions.create(
        model="asi1-mini",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": f"Write a newsletter edition about: {topic}\n\n"
                "Include: subject line, preview text, greeting, 2-3 sections, "
                "and a sign-off. Keep it scannable with short paragraphs.",
            },
        ],
        max_tokens=1500,
        temperature=0.7,
    )
    return resp.choices[0].message.content


def generate_ad_copy(topic: str) -> str:
    """Generate ad copy with 3 variants."""
    resp = client.chat.completions.create(
        model="asi1-mini",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": f"Write 3 ad copy variants for: {topic}\n\n"
                "For each variant provide: headline (max 30 chars), "
                "body (max 90 chars), and CTA (max 20 chars). "
                "Label them Variant A, B, C.",
            },
        ],
        max_tokens=500,
        temperature=0.9,
    )
    return resp.choices[0].message.content


# ---------------------------------------------------------------------------
# Revenue tracking
# ---------------------------------------------------------------------------

TOKEN_ADDRESS = os.environ.get("TOKEN_ADDRESS", "")


def log_revenue(ctx: Context, caller: str, service: str, amount_fet: float = 0.01):
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
            "Writer Agent ($WRITE) — Content Creator\n\n"
            "Commands:\n"
            "  blog <topic>        — generate a blog post (0.01 FET)\n"
            "  tweet <topic>       — generate a tweet thread (0.01 FET)\n"
            "  newsletter <topic>  — generate a newsletter (0.01 FET)\n"
            "  ad <topic>          — generate ad copy variants (0.01 FET)\n"
            "  revenue             — view revenue summary\n"
            "  balance             — check FET wallet balance\n"
            "  status              — token price + agent health\n"
            "  help                — this message",
        )
        return

    if lower.startswith("blog "):
        topic = text.split(maxsplit=1)[1].strip()
        ctx.logger.info(f"[WRITER] Generating blog post: {topic}")
        try:
            result = generate_blog_post(topic)
            log_revenue(ctx, sender, "blog_post", 0.01)
            await reply(ctx, sender, result, end=True)
        except Exception as e:
            await reply(ctx, sender, f"Error generating blog post: {e}", end=True)
        return

    if lower.startswith("tweet "):
        topic = text.split(maxsplit=1)[1].strip()
        ctx.logger.info(f"[WRITER] Generating tweet thread: {topic}")
        try:
            result = generate_tweet_thread(topic)
            log_revenue(ctx, sender, "tweet_thread", 0.01)
            await reply(ctx, sender, result, end=True)
        except Exception as e:
            await reply(ctx, sender, f"Error generating tweets: {e}", end=True)
        return

    if lower.startswith("newsletter "):
        topic = text.split(maxsplit=1)[1].strip()
        ctx.logger.info(f"[WRITER] Generating newsletter: {topic}")
        try:
            result = generate_newsletter(topic)
            log_revenue(ctx, sender, "newsletter", 0.01)
            await reply(ctx, sender, result, end=True)
        except Exception as e:
            await reply(ctx, sender, f"Error generating newsletter: {e}", end=True)
        return

    if lower.startswith("ad "):
        topic = text.split(maxsplit=1)[1].strip()
        ctx.logger.info(f"[WRITER] Generating ad copy: {topic}")
        try:
            result = generate_ad_copy(topic)
            log_revenue(ctx, sender, "ad_copy", 0.01)
            await reply(ctx, sender, result, end=True)
        except Exception as e:
            await reply(ctx, sender, f"Error generating ad copy: {e}", end=True)
        return

    # Revenue summary
    if lower == "revenue":
        summary = get_revenue_summary(ctx)
        lines = [f"Revenue Summary — Writer Agent"]
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
        lines = ["Writer Agent — Status"]
        # Revenue
        summary = get_revenue_summary(ctx)
        lines.append(f"  Revenue: {summary['total_fet']} FET ({summary['calls']} calls)")
        # Effort mode
        mode = ctx.storage.get("effort_mode") or "normal"
        lines.append(f"  Effort mode: {mode}")
        # Token price (if available)
        if TOKEN_ADDRESS:
            try:
                r = http_requests.get(
                    f"https://agent-launch.ai/api/tokens/address/{TOKEN_ADDRESS}",
                    timeout=5,
                )
                if r.status_code == 200:
                    data = r.json()
                    lines.append(f"  Token: ${data.get('symbol', 'WRITE')}")
                    lines.append(f"  Price: {data.get('price', 'N/A')} FET")
                    lines.append(f"  Holders: {data.get('holderCount', 'N/A')}")
                    lines.append(f"  Market cap: {data.get('marketCap', 'N/A')} FET")
            except Exception:
                lines.append("  Token: not configured or unavailable")
        else:
            lines.append("  Token: TOKEN_ADDRESS not set")
        # Price history
        history = json.loads(ctx.storage.get("price_history") or "[]")
        if history:
            latest = history[-1]
            lines.append(f"  Last check: {latest.get('ts', 'N/A')[:16]}")
            lines.append(f"  History: {len(history)} data points")
        await reply(ctx, sender, "\n".join(lines), end=True)
        return

    await reply(
        ctx, sender, "Writer Agent ($WRITE). Type 'help' for commands.", end=True
    )


@chat_proto.on_message(ChatAcknowledgement)
async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement) -> None:
    ctx.logger.debug(f"Ack from {sender[:20]}")


@agent.on_interval(period=3600.0)
async def self_monitor(ctx: Context) -> None:
    """Read own token price and adapt effort mode (self-awareness)."""
    if not TOKEN_ADDRESS:
        return
    try:
        r = http_requests.get(
            f"https://agent-launch.ai/api/tokens/address/{TOKEN_ADDRESS}",
            timeout=5,
        )
        if r.status_code != 200:
            return
        data = r.json()
        price = float(data.get("price", 0))
        holders = int(data.get("holderCount", 0))

        history = json.loads(ctx.storage.get("price_history") or "[]")
        history.append({
            "ts": datetime.now().isoformat(),
            "price": price,
            "holders": holders,
        })
        history = history[-720:]  # 30 days of hourly data
        ctx.storage.set("price_history", json.dumps(history))

        # Adapt effort mode based on 7-day price trend
        if len(history) >= 168:
            recent = sum(h["price"] for h in history[-168:]) / 168
            older = sum(h["price"] for h in history[-336:-168]) / 168
            if older > 0:
                if recent < older * 0.9:
                    ctx.storage.set("effort_mode", "high")
                    ctx.logger.info("[WRITER] Price declining — effort mode: high")
                elif recent > older * 1.2:
                    ctx.storage.set("effort_mode", "growth")
                    ctx.logger.info("[WRITER] Price rising — effort mode: growth")
                else:
                    ctx.storage.set("effort_mode", "normal")

        ctx.logger.info(f"[WRITER] Self-check: price={price}, holders={holders}")
    except Exception as e:
        ctx.logger.warning(f"[WRITER] Self-monitor error: {e}")


agent.include(chat_proto, publish_manifest=True)

if __name__ == "__main__":
    agent.run()
