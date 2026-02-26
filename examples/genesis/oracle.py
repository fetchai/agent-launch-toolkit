#!/usr/bin/env python3
"""
Oracle Agent ($DATA) — Market Data Provider for the Genesis Network

What it does:
  - Fetches live token prices, OHLC history, and market summaries from AgentLaunch
  - Caches data with TTL to reduce API calls
  - Serves price feeds to other agents in the swarm (Analyst, Sentinel, etc.)

What it charges:
  - price_feed:     0.001 FET — current price for a token
  - ohlc_history:   0.001 FET — price history (up to 30 days)
  - market_summary: 0.001 FET — platform-wide market overview

What it consumes:
  - Nothing (the Oracle is a root data provider)

Secrets needed:
  - AGENTVERSE_API_KEY
  - AGENTLAUNCH_API_KEY
  - AGENT_ADDRESS
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
from datetime import datetime
from uuid import uuid4

import requests

AGENTLAUNCH_API = os.environ.get("AGENTLAUNCH_API", "https://agent-launch.ai/api")

# ---------------------------------------------------------------------------
# In-memory cache (shared across handlers)
# ---------------------------------------------------------------------------

_cache: dict = {}


def cache_get(key: str, ttl: int = 300):
    if key in _cache:
        val, exp = _cache[key]
        if exp > time.time():
            return val
        del _cache[key]
    return None


def cache_set(key: str, val, ttl: int = 300):
    _cache[key] = (val, time.time() + ttl)


# ---------------------------------------------------------------------------
# Oracle data fetchers
# ---------------------------------------------------------------------------


def fetch_token_price(address: str) -> dict:
    """Get current price for a single token."""
    cached = cache_get(f"price:{address}", ttl=60)
    if cached:
        return cached
    try:
        r = requests.get(
            f"{AGENTLAUNCH_API}/tokens/address/{address}", timeout=5
        )
        if r.status_code == 200:
            data = r.json()
            token = data if "price" in data else data.get("token", data.get("data", {}))
            result = {
                "address": address,
                "name": token.get("name", "Unknown"),
                "symbol": token.get("symbol", "???"),
                "price": float(token.get("price", token.get("currentPrice", 0))),
                "holders": int(token.get("holders", token.get("holderCount", 0))),
                "market_cap": float(token.get("marketCap", token.get("market_cap", 0))),
                "volume_24h": float(token.get("volume24h", token.get("volume", 0))),
                "ts": datetime.now().isoformat(),
            }
            cache_set(f"price:{address}", result, ttl=60)
            return result
    except Exception as e:
        return {"error": str(e)}
    return {"error": "Token not found"}


def fetch_market_summary() -> dict:
    """Platform-wide market overview."""
    cached = cache_get("market_summary", ttl=120)
    if cached:
        return cached
    try:
        r = requests.get(f"{AGENTLAUNCH_API}/platform/stats", timeout=5)
        if r.status_code == 200:
            stats = r.json()
            result = {
                "total_tokens": stats.get("totalTokens", stats.get("total_tokens", 0)),
                "total_volume": stats.get("totalVolume", stats.get("total_volume", 0)),
                "active_tokens": stats.get("activeTokens", stats.get("active_tokens", 0)),
                "ts": datetime.now().isoformat(),
            }
            cache_set("market_summary", result, ttl=120)
            return result
    except Exception as e:
        return {"error": str(e)}
    return {"error": "Could not fetch stats"}


def fetch_token_list(limit: int = 10) -> list:
    """Top tokens by activity."""
    cached = cache_get("token_list", ttl=120)
    if cached:
        return cached
    try:
        r = requests.get(
            f"{AGENTLAUNCH_API}/tokens", params={"limit": limit}, timeout=5
        )
        if r.status_code == 200:
            data = r.json()
            tokens = data if isinstance(data, list) else data.get("tokens", data.get("items", []))
            result = []
            for t in tokens[:limit]:
                result.append({
                    "name": t.get("name", "?"),
                    "symbol": t.get("symbol", "?"),
                    "address": t.get("address", t.get("tokenAddress", "")),
                    "price": float(t.get("price", t.get("currentPrice", 0))),
                    "holders": int(t.get("holders", t.get("holderCount", 0))),
                })
            cache_set("token_list", result, ttl=120)
            return result
    except Exception:
        pass
    return []


# ---------------------------------------------------------------------------
# Price history (stored in ctx.storage for persistence)
# ---------------------------------------------------------------------------


def record_price(ctx: Context, address: str, price: float) -> None:
    """Append a price point to storage-based history."""
    key = f"ohlc:{address}"
    history = json.loads(ctx.storage.get(key) or "[]")
    history.append({"price": price, "ts": datetime.now().isoformat()})
    history = history[-720:]  # 30 days of hourly
    ctx.storage.set(key, json.dumps(history))


def get_price_history(ctx: Context, address: str) -> list:
    key = f"ohlc:{address}"
    return json.loads(ctx.storage.get(key) or "[]")


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
        await reply(ctx, sender,
            "Oracle Agent ($DATA) — Market Data Provider\n\n"
            "Commands:\n"
            "  price <address>    — current token price (0.001 FET)\n"
            "  history <address>  — price history (0.001 FET)\n"
            "  market             — platform market summary (0.001 FET)\n"
            "  top [N]            — top N tokens by activity\n"
            "  help               — this message"
        )
        return

    # price <address>
    if lower.startswith("price "):
        addr = text.split(maxsplit=1)[1].strip()
        data = fetch_token_price(addr)
        if "error" in data:
            await reply(ctx, sender, f"Error: {data['error']}", end=True)
            return
        record_price(ctx, addr, data["price"])
        await reply(ctx, sender,
            f"{data['name']} ({data['symbol']})\n"
            f"  Price: {data['price']:.8f} FET\n"
            f"  Holders: {data['holders']}\n"
            f"  Market Cap: {data['market_cap']:.2f} FET\n"
            f"  Volume 24h: {data['volume_24h']:.2f} FET\n"
            f"  Updated: {data['ts']}",
            end=True,
        )
        return

    # history <address>
    if lower.startswith("history "):
        addr = text.split(maxsplit=1)[1].strip()
        history = get_price_history(ctx, addr)
        if not history:
            await reply(ctx, sender, "No price history yet. Query 'price <address>' first.", end=True)
            return
        recent = history[-24:]
        lines = [f"Price history for {addr[:16]}... (last {len(recent)} points):"]
        for p in recent:
            lines.append(f"  {p['ts']}: {p['price']:.8f} FET")
        await reply(ctx, sender, "\n".join(lines), end=True)
        return

    # market summary
    if lower in ("market", "summary", "stats"):
        data = fetch_market_summary()
        if "error" in data:
            await reply(ctx, sender, f"Error: {data['error']}", end=True)
            return
        await reply(ctx, sender,
            f"Market Summary\n"
            f"  Total tokens: {data['total_tokens']}\n"
            f"  Active tokens: {data['active_tokens']}\n"
            f"  Total volume: {data['total_volume']} FET\n"
            f"  Updated: {data['ts']}",
            end=True,
        )
        return

    # top tokens
    if lower.startswith("top"):
        parts = text.split()
        limit = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else 10
        tokens = fetch_token_list(limit)
        if not tokens:
            await reply(ctx, sender, "Could not fetch token list.", end=True)
            return
        lines = [f"Top {len(tokens)} tokens:"]
        for i, t in enumerate(tokens, 1):
            lines.append(f"  {i}. {t['name']} ({t['symbol']}) — {t['price']:.8f} FET, {t['holders']} holders")
        await reply(ctx, sender, "\n".join(lines), end=True)
        return

    await reply(ctx, sender,
        "Oracle Agent ($DATA). Type 'help' for commands.",
        end=True,
    )


@chat_proto.on_message(ChatAcknowledgement)
async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement) -> None:
    ctx.logger.debug(f"Ack from {sender[:20]}")


@agent.on_interval(period=300.0)
async def refresh_cache(ctx: Context) -> None:
    """Periodically refresh market data so it is warm when agents query."""
    fetch_market_summary()
    tokens = fetch_token_list(20)
    for t in tokens[:5]:
        addr = t.get("address", "")
        if addr:
            data = fetch_token_price(addr)
            if "error" not in data:
                record_price(ctx, addr, data["price"])
    ctx.logger.info(f"[ORACLE] Cache refreshed. {len(tokens)} tokens indexed.")


agent.include(chat_proto, publish_manifest=True)

if __name__ == "__main__":
    agent.run()
