"""
Telegram Bot Agent — Agentverse agent with Telegram integration.

Polls Telegram Bot API for messages, responds via sendMessage().
Also supports Agentverse Chat Protocol so it works on both platforms.

Setup:
  1. Talk to @BotFather on Telegram to create a bot and get your token
  2. Set TELEGRAM_BOT_TOKEN as an Agentverse secret
  3. Deploy this agent to Agentverse
  4. Message your bot on Telegram — the agent responds!

No external libraries needed — uses `requests` (available on Agentverse).
"""

from datetime import datetime
import json
import os

import requests
from uagents import Agent, Context, Protocol
from uagents_core.contrib.protocols.chat import (
    ChatAcknowledgement,
    ChatMessage,
    EndSessionContent,
    TextContent,
    chat_protocol_spec,
)

agent = Agent()
chat_proto = Protocol(spec=chat_protocol_spec)

# ==============================================================================
# CONFIG
# ==============================================================================

TG_API = "https://api.telegram.org/bot"
POLL_INTERVAL = 10.0  # seconds between Telegram polls


# ==============================================================================
# TELEGRAM HELPERS
# ==============================================================================


def tg_request(method: str, token: str, **kwargs) -> dict:
    """Call Telegram Bot API. Returns parsed JSON response."""
    try:
        r = requests.post(
            f"{TG_API}{token}/{method}",
            json=kwargs,
            timeout=5,
        )
        return r.json()
    except Exception as e:
        return {"ok": False, "description": str(e)}


def tg_send(token: str, chat_id: int, text: str, parse_mode: str = None) -> dict:
    """Send a message to a Telegram chat."""
    params = {"chat_id": chat_id, "text": text}
    if parse_mode:
        params["parse_mode"] = parse_mode
    return tg_request("sendMessage", token, **params)


# ==============================================================================
# STORAGE HELPERS
# ==============================================================================


def _get(ctx, key, default=None):
    val = ctx.storage.get(key)
    return json.loads(val) if val else default


def _set(ctx, key, value):
    ctx.storage.set(key, json.dumps(value))


# ==============================================================================
# YOUR AGENT LOGIC — customize this function
# ==============================================================================


def process_message(text: str, username: str, ctx: Context) -> str:
    """
    Process an incoming message and return a response.

    Replace this with your actual agent logic:
    - Call an LLM (OpenAI/HuggingFace APIs available on Agentverse)
    - Query on-chain data
    - Look up prices
    - Whatever your agent does!
    """
    # Example: simple command handling + echo
    cmd = text.strip().lower()

    if cmd == "/start":
        return (
            "Hello! I'm an AI agent running on Fetch.ai's Agentverse.\n\n"
            "Send me a message and I'll respond.\n"
            "Type /help for available commands."
        )

    if cmd == "/help":
        return (
            "Available commands:\n"
            "/start  - Welcome message\n"
            "/help   - This help text\n"
            "/status - Agent status\n\n"
            "Or just send me any message!"
        )

    if cmd == "/status":
        stats = _get(ctx, "tg_stats", {"messages": 0, "users": []})
        return (
            f"Agent Status: Running\n"
            f"Messages processed: {stats['messages']}\n"
            f"Unique users: {len(stats['users'])}\n"
            f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        )

    # Default: echo back (replace with your logic)
    return f"You said: {text}\n\n(Customize process_message() with your agent's logic)"


# ==============================================================================
# TELEGRAM POLLING
# ==============================================================================


@agent.on_interval(period=POLL_INTERVAL)
async def poll_telegram(ctx: Context):
    """Poll Telegram for new messages and respond."""
    token = os.environ.get("TELEGRAM_BOT_TOKEN")
    if not token:
        return

    offset = int(ctx.storage.get("tg_offset") or "0")

    result = tg_request(
        "getUpdates",
        token,
        offset=offset,
        timeout=0,
        allowed_updates=["message"],
    )

    if not result.get("ok"):
        ctx.logger.error(f"Telegram poll error: {result.get('description')}")
        return

    updates = result.get("result", [])
    if not updates:
        return

    stats = _get(ctx, "tg_stats", {"messages": 0, "users": []})

    for update in updates:
        update_id = update["update_id"]
        message = update.get("message", {})
        chat_id = message.get("chat", {}).get("id")
        text = message.get("text", "")
        username = message.get("from", {}).get("username", "unknown")
        user_id = str(message.get("from", {}).get("id", ""))

        if not chat_id or not text:
            ctx.storage.set("tg_offset", str(update_id + 1))
            continue

        ctx.logger.info(f"Telegram @{username}: {text[:100]}")

        # Track stats
        stats["messages"] += 1
        if user_id and user_id not in stats["users"]:
            stats["users"].append(user_id)

        # Process and respond
        reply = process_message(text, username, ctx)
        tg_send(token, chat_id, reply)

        # Advance offset past this update
        ctx.storage.set("tg_offset", str(update_id + 1))

    _set(ctx, "tg_stats", stats)
    ctx.storage.set("tg_last_poll", datetime.now().isoformat())


# ==============================================================================
# AGENTVERSE CHAT PROTOCOL (works alongside Telegram)
# ==============================================================================


@chat_proto.on_message(ChatMessage)
async def handle_chat(ctx: Context, sender: str, msg: ChatMessage):
    """Handle messages from Agentverse Chat Protocol."""
    text = msg.content[0].text if msg.content else ""
    ctx.logger.info(f"Agentverse chat from {sender}: {text[:100]}")

    reply = process_message(text, sender, ctx)

    await ctx.send(
        sender,
        ChatMessage(
            timestamp=datetime.now(),
            msg_id=msg.msg_id,
            content=[TextContent(text=reply)],
        ),
    )

    await ctx.send(
        sender,
        ChatMessage(
            timestamp=datetime.now(),
            msg_id=msg.msg_id,
            content=[EndSessionContent()],
        ),
    )


@chat_proto.on_message(ChatAcknowledgement)
async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement):
    ctx.logger.info(f"Ack: {msg.acknowledged_msg_id}")


agent.include(chat_proto, publish_manifest=True)

if __name__ == "__main__":
    agent.run()
