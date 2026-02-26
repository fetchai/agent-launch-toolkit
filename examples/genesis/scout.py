#!/usr/bin/env python3
"""
Scout Agent ($FIND) — Agent Discovery for the Genesis Network

What it does:
  - Discovers agents on Agentverse that could benefit from tokenization
  - Evaluates agent quality based on activity, protocol support, and description
  - Recommends promising agents for the AgentLaunch platform

What it charges:
  - discover_agents:          0.01 FET — search for agents on Agentverse
  - evaluate_agent:           0.01 FET — quality assessment of a specific agent
  - tokenize_recommendation:  0.01 FET — full tokenization recommendation

What it consumes:
  - Analyst agent for token scoring (optional)

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
AGENTVERSE_API = "https://agentverse.ai/v1"
AGENTVERSE_KEY = os.environ.get("AGENTVERSE_API_KEY", "")

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
# Agent discovery from Agentverse
# ---------------------------------------------------------------------------


def discover_agents(limit: int = 20) -> list:
    """Discover agents from Agentverse."""
    cached = cache_get("discovered_agents")
    if cached:
        return cached

    agents = []
    try:
        r = requests.get(
            f"{AGENTVERSE_API}/hosting/agents",
            headers={"Authorization": f"Bearer {AGENTVERSE_KEY}"},
            timeout=10,
        )
        if r.status_code == 200:
            data = r.json()
            items = data.get("items", data if isinstance(data, list) else [])
            for item in items[:limit]:
                agents.append({
                    "address": item.get("address", ""),
                    "name": item.get("name", "Unnamed"),
                    "description": item.get("description", ""),
                    "status": item.get("status", "unknown"),
                    "compiled": item.get("compiled", False),
                })
            cache_set("discovered_agents", agents, ttl=300)
    except Exception:
        pass
    return agents


def check_already_tokenized(address: str) -> bool:
    """Check if an agent already has a token on AgentLaunch."""
    try:
        r = requests.get(
            f"{AGENTLAUNCH_API}/tokens",
            params={"limit": 100},
            timeout=5,
        )
        if r.status_code == 200:
            data = r.json()
            tokens = data if isinstance(data, list) else data.get("tokens", data.get("items", []))
            for t in tokens:
                if t.get("agentAddress", t.get("agent_address", "")) == address:
                    return True
    except Exception:
        pass
    return False


# ---------------------------------------------------------------------------
# Agent evaluation
# ---------------------------------------------------------------------------


def evaluate_agent(agent_info: dict) -> dict:
    """Evaluate an agent's readiness for tokenization."""
    scores = {}

    # Description quality (0-25)
    desc = agent_info.get("description", "")
    if len(desc) > 100:
        scores["description"] = 25
    elif len(desc) > 30:
        scores["description"] = 15
    elif desc:
        scores["description"] = 5
    else:
        scores["description"] = 0

    # Status (0-25)
    status = agent_info.get("status", "")
    if status == "running":
        scores["status"] = 25
    elif status == "active":
        scores["status"] = 20
    elif agent_info.get("compiled"):
        scores["status"] = 15
    else:
        scores["status"] = 0

    # Name quality (0-25)
    name = agent_info.get("name", "")
    if name and name != "Unnamed" and len(name) > 3:
        scores["naming"] = 25
    elif name:
        scores["naming"] = 10
    else:
        scores["naming"] = 0

    # Already tokenized check (0-25)
    already = check_already_tokenized(agent_info.get("address", ""))
    scores["novelty"] = 0 if already else 25

    total = sum(scores.values())
    grade = "A" if total >= 80 else "B" if total >= 60 else "C" if total >= 40 else "D" if total >= 20 else "F"

    return {
        "address": agent_info.get("address", ""),
        "name": agent_info.get("name", "Unknown"),
        "scores": scores,
        "total": total,
        "grade": grade,
        "already_tokenized": already,
        "recommendation": _generate_recommendation(total, already),
    }


def _generate_recommendation(score: int, already_tokenized: bool) -> str:
    if already_tokenized:
        return "SKIP — Already tokenized on AgentLaunch."
    if score >= 80:
        return "STRONG BUY — High quality agent, excellent tokenization candidate."
    if score >= 60:
        return "BUY — Good agent, ready for tokenization."
    if score >= 40:
        return "HOLD — Needs improvement before tokenization."
    return "PASS — Not ready for tokenization yet."


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
            "Scout Agent ($FIND) — Agent Discovery\n\n"
            "Commands:\n"
            "  discover [N]      — find N agents on Agentverse (0.01 FET)\n"
            "  evaluate <addr>   — evaluate agent for tokenization (0.01 FET)\n"
            "  recommend [N]     — top N tokenization candidates (0.01 FET)\n"
            "  stats             — discovery statistics\n"
            "  help              — this message\n\n"
            f"Agentverse key: {'configured' if AGENTVERSE_KEY else 'NOT SET'}"
        )
        return

    if lower.startswith("discover"):
        parts = text.split()
        n = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else 20
        agents = discover_agents(n)
        if not agents:
            await reply(ctx, sender,
                "No agents discovered. Make sure AGENTVERSE_API_KEY is set.",
                end=True,
            )
            return
        lines = [f"Discovered {len(agents)} agents:"]
        for a in agents:
            status = a.get("status", "?")
            lines.append(f"  [{status:8s}] {a['name'][:30]:30s} {a['address'][:20]}...")
        lines.append(f"\nUse 'evaluate <address>' to assess an agent.")
        await reply(ctx, sender, "\n".join(lines), end=True)
        return

    if lower.startswith("evaluate "):
        addr = text.split(maxsplit=1)[1].strip()
        # Try to find in discovered agents first
        agents = discover_agents()
        target = None
        for a in agents:
            if a["address"] == addr or a["address"].startswith(addr[:10]):
                target = a
                break
        if not target:
            target = {"address": addr, "name": "Unknown", "description": "", "status": "unknown"}

        result = evaluate_agent(target)
        lines = [
            f"Evaluation: {result['name']}",
            f"  Address: {result['address'][:30]}...",
            f"  Grade: {result['grade']} ({result['total']}/100)",
            "",
            "  Scores:",
        ]
        for dim, score in result["scores"].items():
            lines.append(f"    {dim:15s}: {score}/25")
        lines.append(f"\n  Already tokenized: {'Yes' if result['already_tokenized'] else 'No'}")
        lines.append(f"  Recommendation: {result['recommendation']}")
        await reply(ctx, sender, "\n".join(lines), end=True)
        return

    if lower.startswith("recommend"):
        parts = text.split()
        n = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else 5
        agents = discover_agents(50)
        if not agents:
            await reply(ctx, sender, "No agents to evaluate.", end=True)
            return

        evaluations = []
        for a in agents:
            ev = evaluate_agent(a)
            if not ev["already_tokenized"]:
                evaluations.append(ev)

        evaluations.sort(key=lambda x: x["total"], reverse=True)
        top = evaluations[:n]

        if not top:
            await reply(ctx, sender, "No untokenized agents found.", end=True)
            return

        lines = [f"Top {len(top)} tokenization candidates:"]
        for i, ev in enumerate(top, 1):
            lines.append(
                f"  {i}. [{ev['grade']}] {ev['name'][:25]:25s} "
                f"Score: {ev['total']:3d}/100"
            )
        lines.append(f"\nUse 'evaluate <address>' for detailed assessment.")
        await reply(ctx, sender, "\n".join(lines), end=True)
        return

    if lower == "stats":
        agents = discover_agents()
        await reply(ctx, sender,
            f"Scout Stats:\n"
            f"  Agents discovered: {len(agents)}\n"
            f"  Cache entries: {len(_cache)}",
            end=True,
        )
        return

    await reply(ctx, sender,
        "Scout Agent ($FIND). Type 'help' for commands.",
        end=True,
    )


@chat_proto.on_message(ChatAcknowledgement)
async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement) -> None:
    ctx.logger.debug(f"Ack from {sender[:20]}")


@agent.on_interval(period=300.0)
async def periodic_discovery(ctx: Context) -> None:
    """Refresh agent discovery cache periodically."""
    agents = discover_agents(50)
    ctx.logger.info(f"[SCOUT] Refreshed discovery. Found {len(agents)} agents.")


agent.include(chat_proto, publish_manifest=True)

if __name__ == "__main__":
    agent.run()
