#!/usr/bin/env python3
"""
Analyst Agent ($SCORE) — Token Scoring Engine for the Genesis Network

What it does:
  - Scores tokens on multiple dimensions (activity, holders, liquidity, age)
  - Evaluates quality based on weighted criteria
  - Ranks tokens and provides investment-grade summaries

What it charges:
  - score_token:      0.005 FET — multi-dimensional score for one token
  - evaluate_quality: 0.005 FET — quality assessment with letter grade
  - rank_tokens:      0.005 FET — ranked list of top tokens

What it consumes:
  - Oracle agent for price data (optional — can also fetch directly)

Secrets needed:
  - AGENTVERSE_API_KEY
  - AGENTLAUNCH_API_KEY
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

# Scoring weights (sum to 1.0)
WEIGHTS = {
    "holders": 0.30,
    "volume": 0.25,
    "liquidity": 0.20,
    "price_stability": 0.15,
    "age": 0.10,
}

# Cache
_cache: dict = {}


def cache_get(key, ttl=300):
    if key in _cache:
        v, exp = _cache[key]
        if exp > time.time():
            return v
        del _cache[key]
    return None


def cache_set(key, val, ttl=300):
    _cache[key] = (val, time.time() + ttl)


# ---------------------------------------------------------------------------
# Data fetching
# ---------------------------------------------------------------------------


def fetch_token(address: str) -> dict:
    cached = cache_get(f"token:{address}")
    if cached:
        return cached
    try:
        r = requests.get(f"{AGENTLAUNCH_API}/tokens/address/{address}", timeout=5)
        if r.status_code == 200:
            data = r.json()
            token = data if "name" in data else data.get("token", data.get("data", {}))
            cache_set(f"token:{address}", token, ttl=120)
            return token
    except Exception:
        pass
    return {}


def fetch_all_tokens(limit: int = 50) -> list:
    cached = cache_get("all_tokens")
    if cached:
        return cached
    try:
        r = requests.get(f"{AGENTLAUNCH_API}/tokens", params={"limit": limit}, timeout=10)
        if r.status_code == 200:
            data = r.json()
            tokens = data if isinstance(data, list) else data.get("tokens", data.get("items", []))
            cache_set("all_tokens", tokens, ttl=120)
            return tokens
    except Exception:
        pass
    return []


# ---------------------------------------------------------------------------
# Scoring engine
# ---------------------------------------------------------------------------


def normalize(value: float, min_val: float, max_val: float) -> float:
    """Normalize a value to 0-100 range."""
    if max_val <= min_val:
        return 50.0
    return max(0, min(100, (value - min_val) / (max_val - min_val) * 100))


def score_token(token: dict) -> dict:
    """Score a token on multiple dimensions. Returns scores and weighted total."""
    holders = int(token.get("holders", token.get("holderCount", 0)))
    volume = float(token.get("volume24h", token.get("volume", 0)))
    liquidity = float(token.get("liquidity", token.get("totalLiquidity", 0)))
    price = float(token.get("price", token.get("currentPrice", 0)))
    created = token.get("createdAt", token.get("created_at", ""))

    # Normalize each dimension (empirical ranges for AgentLaunch)
    holder_score = normalize(holders, 0, 200)
    volume_score = normalize(volume, 0, 10000)
    liquidity_score = normalize(liquidity, 0, 30000)

    # Price stability: presence of price = positive signal
    stability_score = 50.0 if price > 0 else 0.0

    # Age score: older tokens get more credit (max at 30 days)
    age_days = 0
    if created:
        try:
            created_dt = datetime.fromisoformat(created.replace("Z", "+00:00"))
            age_days = (datetime.now() - created_dt.replace(tzinfo=None)).days
        except Exception:
            age_days = 0
    age_score = normalize(age_days, 0, 30)

    scores = {
        "holders": round(holder_score, 1),
        "volume": round(volume_score, 1),
        "liquidity": round(liquidity_score, 1),
        "price_stability": round(stability_score, 1),
        "age": round(age_score, 1),
    }

    weighted = sum(scores[k] * WEIGHTS[k] for k in WEIGHTS)

    # Letter grade
    if weighted >= 80:
        grade = "A"
    elif weighted >= 60:
        grade = "B"
    elif weighted >= 40:
        grade = "C"
    elif weighted >= 20:
        grade = "D"
    else:
        grade = "F"

    return {
        "name": token.get("name", "Unknown"),
        "symbol": token.get("symbol", "???"),
        "address": token.get("address", token.get("tokenAddress", "")),
        "scores": scores,
        "total": round(weighted, 1),
        "grade": grade,
        "holders": holders,
        "volume": volume,
        "liquidity": liquidity,
    }


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
# Agent
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
            "Analyst Agent ($SCORE) — Token Scoring Engine\n\n"
            "Commands:\n"
            "  score <address>     — multi-dimensional score (0.005 FET)\n"
            "  evaluate <address>  — quality assessment (0.005 FET)\n"
            "  rank [N]            — rank top N tokens (0.005 FET)\n"
            "  weights             — show scoring weights\n"
            "  help                — this message"
        )
        return

    if lower == "weights":
        lines = ["Scoring Weights:"]
        for k, v in WEIGHTS.items():
            lines.append(f"  {k}: {v*100:.0f}%")
        await reply(ctx, sender, "\n".join(lines), end=True)
        return

    if lower.startswith("score ") or lower.startswith("evaluate "):
        addr = text.split(maxsplit=1)[1].strip()
        token = fetch_token(addr)
        if not token:
            await reply(ctx, sender, f"Token not found: {addr}", end=True)
            return
        result = score_token(token)
        lines = [
            f"Score for {result['name']} ({result['symbol']})",
            f"  Grade: {result['grade']} ({result['total']}/100)",
            "",
            "  Dimension Scores:",
        ]
        for dim, score in result["scores"].items():
            bar = "#" * int(score / 10) + "-" * (10 - int(score / 10))
            lines.append(f"    {dim:18s} [{bar}] {score}")
        lines.append(f"\n  Holders: {result['holders']}")
        lines.append(f"  Volume 24h: {result['volume']:.2f} FET")
        lines.append(f"  Liquidity: {result['liquidity']:.2f} FET")
        await reply(ctx, sender, "\n".join(lines), end=True)
        return

    if lower.startswith("rank"):
        parts = text.split()
        n = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else 10
        tokens = fetch_all_tokens(50)
        if not tokens:
            await reply(ctx, sender, "Could not fetch tokens.", end=True)
            return
        scored = [score_token(t) for t in tokens]
        scored.sort(key=lambda x: x["total"], reverse=True)
        lines = [f"Top {min(n, len(scored))} tokens by score:"]
        for i, s in enumerate(scored[:n], 1):
            lines.append(
                f"  {i:2d}. [{s['grade']}] {s['name']:20s} "
                f"Score: {s['total']:5.1f}  Holders: {s['holders']}"
            )
        await reply(ctx, sender, "\n".join(lines), end=True)
        return

    await reply(ctx, sender,
        "Analyst Agent ($SCORE). Type 'help' for commands.",
        end=True,
    )


@chat_proto.on_message(ChatAcknowledgement)
async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement) -> None:
    ctx.logger.debug(f"Ack from {sender[:20]}")


agent.include(chat_proto, publish_manifest=True)

if __name__ == "__main__":
    agent.run()
