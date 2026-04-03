#!/usr/bin/env python3
"""
Community Agent ($COMM) — Community Manager for the Marketing Team

What it does:
  - Manages a Telegram group via Bot API
  - Answers FAQs from a configurable knowledge base
  - Sends welcome messages to new members
  - Runs polls and tracks engagement

What it charges:
  - moderate:    0.002 FET — moderation check
  - answer_faq:  0.002 FET — FAQ lookup
  - run_poll:    0.002 FET — create a poll

What it consumes:
  - Nothing (Community is a root service provider)

Secrets needed:
  - TELEGRAM_BOT_TOKEN
  - TELEGRAM_CHAT_ID
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

TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID", "")
TELEGRAM_API = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}"

# Default FAQ entries — can be updated via ctx.storage
DEFAULT_FAQS = {
    "what is agentlaunch": "AgentLaunch is a platform for building, deploying, and tokenizing AI agents on the Fetch.ai ecosystem.",
    "how to deploy": "Use `npx agentlaunch my-agent` to create and deploy an agent in one command.",
    "how to tokenize": "After deploying, use `npx agentlaunch tokenize` or the `/tokenize` slash command.",
    "what is fet": "FET is the native token of the Fetch.ai ecosystem, used for agent services and trading.",
    "deploy fee": "The deploy fee is 120 FET, paid when tokenizing an agent on-chain.",
    "how to get testnet tokens": "Message @gift on Agentverse: send `claim 0x<your-wallet>` to receive 200 TFET + 0.005 tBNB.",
}


# ---------------------------------------------------------------------------
# Telegram API helpers
# ---------------------------------------------------------------------------


def tg_send_message(chat_id: str, text: str, parse_mode: str = "Markdown") -> dict:
    """Send a message to a Telegram chat."""
    r = requests.post(
        f"{TELEGRAM_API}/sendMessage",
        json={"chat_id": chat_id, "text": text, "parse_mode": parse_mode},
        timeout=10,
    )
    return r.json() if r.status_code == 200 else {"error": r.text[:200]}


def tg_send_poll(chat_id: str, question: str, options: list) -> dict:
    """Send a poll to a Telegram chat."""
    r = requests.post(
        f"{TELEGRAM_API}/sendPoll",
        json={
            "chat_id": chat_id,
            "question": question,
            "options": options[:10],  # Telegram max 10 options
            "is_anonymous": False,
        },
        timeout=10,
    )
    return r.json() if r.status_code == 200 else {"error": r.text[:200]}


def tg_get_updates(offset: int = 0) -> list:
    """Get recent updates from Telegram."""
    r = requests.get(
        f"{TELEGRAM_API}/getUpdates",
        params={"offset": offset, "limit": 20, "timeout": 5},
        timeout=15,
    )
    if r.status_code == 200:
        return r.json().get("result", [])
    return []


def tg_get_chat_member_count(chat_id: str) -> int:
    """Get member count for a chat."""
    r = requests.get(
        f"{TELEGRAM_API}/getChatMemberCount",
        params={"chat_id": chat_id},
        timeout=10,
    )
    if r.status_code == 200:
        return r.json().get("result", 0)
    return 0


# ---------------------------------------------------------------------------
# FAQ system
# ---------------------------------------------------------------------------


def get_faqs(ctx: Context) -> dict:
    """Load FAQs from storage or use defaults."""
    stored = ctx.storage.get("faqs")
    if stored:
        return json.loads(stored)
    return DEFAULT_FAQS.copy()


def find_faq_answer(ctx: Context, question: str) -> str:
    """Find the best FAQ match for a question."""
    faqs = get_faqs(ctx)
    q_lower = question.lower().strip("?").strip()

    # Exact match
    if q_lower in faqs:
        return faqs[q_lower]

    # Keyword match
    for key, answer in faqs.items():
        keywords = key.split()
        matches = sum(1 for kw in keywords if kw in q_lower)
        if matches >= len(keywords) * 0.6:
            return answer

    return ""


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
            "Community Agent ($COMM) — Community Manager\n\n"
            "Commands:\n"
            "  send <message>         — send message to Telegram group\n"
            "  poll <q>|<opt1>|<opt2> — create a poll (pipe-separated)\n"
            "  faq <question>         — look up FAQ answer\n"
            "  addfaq <q>|<answer>    — add a FAQ entry\n"
            "  stats                  — group member count + activity\n"
            "  welcome <name>         — send welcome message\n"
            "  revenue                — revenue summary by service\n"
            "  balance                — wallet balance in FET\n"
            "  help                   — this message",
        )
        return

    # Send a message to Telegram
    if lower.startswith("send "):
        message = text.split(maxsplit=1)[1].strip()
        ctx.logger.info(f"[COMMUNITY] Sending to Telegram: {message[:50]}...")
        result = tg_send_message(TELEGRAM_CHAT_ID, message)
        if "error" in result:
            await reply(ctx, sender, f"Error: {result['error']}", end=True)
        else:
            log_revenue(ctx, sender, "send_message", 0.002)
            await reply(ctx, sender, "Message sent to Telegram group.", end=True)
        return

    # Create a poll
    if lower.startswith("poll "):
        raw = text.split(maxsplit=1)[1].strip()
        parts = [p.strip() for p in raw.split("|") if p.strip()]
        if len(parts) < 3:
            await reply(
                ctx,
                sender,
                "Format: poll <question>|<option1>|<option2>[|<option3>...]",
                end=True,
            )
            return
        question = parts[0]
        options = parts[1:]
        ctx.logger.info(f"[COMMUNITY] Creating poll: {question}")
        result = tg_send_poll(TELEGRAM_CHAT_ID, question, options)
        if "error" in result:
            await reply(ctx, sender, f"Error: {result['error']}", end=True)
        else:
            log_revenue(ctx, sender, "create_poll", 0.002)
            await reply(
                ctx, sender, f"Poll created: {question} ({len(options)} options)", end=True
            )
        return

    # FAQ lookup
    if lower.startswith("faq "):
        question = text.split(maxsplit=1)[1].strip()
        answer = find_faq_answer(ctx, question)
        if answer:
            log_revenue(ctx, sender, "faq_lookup", 0.002)
            await reply(ctx, sender, f"FAQ: {answer}", end=True)
        else:
            faqs = get_faqs(ctx)
            topics = ", ".join(faqs.keys())
            await reply(
                ctx,
                sender,
                f"No FAQ match found. Available topics: {topics}",
                end=True,
            )
        return

    # Add FAQ entry
    if lower.startswith("addfaq "):
        raw = text.split(maxsplit=1)[1].strip()
        parts = raw.split("|", 1)
        if len(parts) < 2:
            await reply(ctx, sender, "Format: addfaq <question>|<answer>", end=True)
            return
        faqs = get_faqs(ctx)
        faqs[parts[0].strip().lower()] = parts[1].strip()
        ctx.storage.set("faqs", json.dumps(faqs))
        await reply(ctx, sender, f"FAQ added. Total: {len(faqs)} entries.", end=True)
        return

    # Group stats
    if lower in ("stats", "status"):
        count = tg_get_chat_member_count(TELEGRAM_CHAT_ID)
        activity = json.loads(ctx.storage.get("activity_log") or "[]")
        await reply(
            ctx,
            sender,
            f"Community Stats\n"
            f"  Members: {count}\n"
            f"  Messages processed: {len(activity)}\n"
            f"  FAQs: {len(get_faqs(ctx))}\n"
            f"  Chat ID: {TELEGRAM_CHAT_ID}",
            end=True,
        )
        return

    # Welcome message
    if lower.startswith("welcome "):
        name = text.split(maxsplit=1)[1].strip()
        welcome_msg = (
            f"Welcome to the AgentLaunch community, {name}!\n\n"
            "Here's how to get started:\n"
            "1. Create your first agent: `npx agentlaunch my-agent`\n"
            "2. Get testnet tokens: message @gift on Agentverse\n"
            "3. Ask questions anytime — we're here to help!"
        )
        result = tg_send_message(TELEGRAM_CHAT_ID, welcome_msg)
        if "error" in result:
            await reply(ctx, sender, f"Error: {result['error']}", end=True)
        else:
            log_revenue(ctx, sender, "welcome", 0.002)
            await reply(ctx, sender, f"Welcome message sent for {name}.", end=True)
        return

    # Revenue summary
    if lower in ("revenue", "rev"):
        summary = get_revenue_summary(ctx)
        lines = [
            "Revenue Summary",
            f"  Total: {summary['total_fet']} FET",
            f"  Calls: {summary['calls']}",
            "  By service:",
        ]
        for svc, amt in summary["by_service"].items():
            lines.append(f"    {svc}: {round(amt, 4)} FET")
        if TOKEN_ADDRESS:
            lines.append(f"  Token: {TOKEN_ADDRESS}")
        await reply(ctx, sender, "\n".join(lines), end=True)
        return

    # Wallet balance
    if lower in ("balance", "bal"):
        try:
            raw = ctx.ledger.query_bank_balance(
                str(agent.wallet.address()), "atestfet"
            )
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
        ctx, sender, "Community Agent ($COMM). Type 'help' for commands.", end=True
    )


@chat_proto.on_message(ChatAcknowledgement)
async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement) -> None:
    ctx.logger.debug(f"Ack from {sender[:20]}")


@agent.on_interval(period=60.0)
async def monitor_group(ctx: Context) -> None:
    """Check for new Telegram messages and log activity."""
    last_update = int(ctx.storage.get("last_update_id") or "0")
    updates = tg_get_updates(offset=last_update + 1)
    if not updates:
        return

    activity = json.loads(ctx.storage.get("activity_log") or "[]")
    for update in updates:
        update_id = update.get("update_id", 0)
        message = update.get("message", {})
        if message:
            activity.append({
                "from": message.get("from", {}).get("first_name", "unknown"),
                "text": message.get("text", "")[:100],
                "ts": datetime.now().isoformat(),
            })
        ctx.storage.set("last_update_id", str(update_id))

    # Keep last 500 entries
    activity = activity[-500:]
    ctx.storage.set("activity_log", json.dumps(activity))
    ctx.logger.info(f"[COMMUNITY] Processed {len(updates)} updates. Activity log: {len(activity)}")


agent.include(chat_proto, publish_manifest=True)

if __name__ == "__main__":
    agent.run()
