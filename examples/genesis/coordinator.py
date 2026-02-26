#!/usr/bin/env python3
"""
Coordinator Agent ($ROUTE) — Query Router for the Genesis Network

What it does:
  - Classifies incoming queries and routes them to the right specialist agent
  - Maintains a directory of known agents and their capabilities
  - Acts as the single entry point for humans interacting with the swarm

What it charges:
  - route_query:     0.0005 FET — classify and route to specialist
  - discover_agents: 0.0005 FET — list known agents and capabilities

What it consumes:
  - Oracle agent for market data queries
  - Brain agent for reasoning queries

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
from datetime import datetime
from uuid import uuid4

import requests

AGENTLAUNCH_API = os.environ.get("AGENTLAUNCH_API", "https://agent-launch.ai/api")

# ---------------------------------------------------------------------------
# Agent directory — configure addresses of swarm members
# ---------------------------------------------------------------------------

# In production, set these as Agentverse secrets or discover dynamically
AGENT_DIRECTORY = {
    "oracle": {
        "address": os.environ.get("ORACLE_ADDRESS", ""),
        "name": "Oracle ($DATA)",
        "capabilities": ["price", "market", "history", "top"],
        "description": "Market data, price feeds, OHLC history",
    },
    "brain": {
        "address": os.environ.get("BRAIN_ADDRESS", ""),
        "name": "Brain ($THINK)",
        "capabilities": ["reason", "classify", "summarize", "analyze"],
        "description": "LLM reasoning, classification, summarization",
    },
    "analyst": {
        "address": os.environ.get("ANALYST_ADDRESS", ""),
        "name": "Analyst ($SCORE)",
        "capabilities": ["score", "evaluate", "rank"],
        "description": "Token scoring, quality evaluation, ranking",
    },
    "sentinel": {
        "address": os.environ.get("SENTINEL_ADDRESS", ""),
        "name": "Sentinel ($ALERT)",
        "capabilities": ["monitor", "alert", "anomaly", "watch"],
        "description": "Real-time monitoring and anomaly detection",
    },
    "launcher": {
        "address": os.environ.get("LAUNCHER_ADDRESS", ""),
        "name": "Launcher ($LAUNCH)",
        "capabilities": ["gap", "scaffold", "deploy"],
        "description": "Gap discovery and agent deployment recommendations",
    },
    "scout": {
        "address": os.environ.get("SCOUT_ADDRESS", ""),
        "name": "Scout ($FIND)",
        "capabilities": ["discover", "evaluate_agent", "tokenize"],
        "description": "Agent discovery and tokenization recommendations",
    },
}

# Keyword -> agent role mapping
ROUTING_RULES = [
    (["price", "market", "ohlc", "volume", "top tokens", "history"], "oracle"),
    (["reason", "think", "summarize", "classify", "explain", "why"], "brain"),
    (["score", "evaluate", "rank", "grade", "quality", "rating"], "analyst"),
    (["monitor", "alert", "anomaly", "watch", "detect", "alarm"], "sentinel"),
    (["gap", "scaffold", "deploy", "build", "create agent", "new agent"], "launcher"),
    (["discover", "find agent", "tokenize", "scout", "promising"], "scout"),
]


# ---------------------------------------------------------------------------
# Query routing logic
# ---------------------------------------------------------------------------


def classify_and_route(text: str) -> tuple:
    """Classify a query and determine the best agent to handle it.

    Returns:
        (agent_role, confidence, reason)
    """
    lower = text.lower()

    # Check routing rules
    best_role = None
    best_matches = 0

    for keywords, role in ROUTING_RULES:
        matches = sum(1 for kw in keywords if kw in lower)
        if matches > best_matches:
            best_matches = matches
            best_role = role

    if best_role and best_matches > 0:
        confidence = min(0.9, 0.3 + best_matches * 0.2)
        return best_role, confidence, f"Matched {best_matches} keywords"

    # Fallback: general queries go to brain
    return "brain", 0.3, "No strong keyword match, routing to brain for reasoning"


def get_agent_info(role: str) -> dict:
    return AGENT_DIRECTORY.get(role, {})


def list_available_agents() -> list:
    """Return list of agents with configured addresses."""
    available = []
    for role, info in AGENT_DIRECTORY.items():
        available.append({
            "role": role,
            "name": info["name"],
            "address": info["address"][:20] + "..." if info["address"] else "(not configured)",
            "capabilities": info["capabilities"],
            "description": info["description"],
            "online": bool(info["address"]),
        })
    return available


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

_route_count = 0


@chat_proto.on_message(ChatMessage)
async def handle_chat(ctx: Context, sender: str, msg: ChatMessage) -> None:
    global _route_count
    await ctx.send(
        sender,
        ChatAcknowledgement(timestamp=datetime.now(), acknowledged_msg_id=msg.msg_id),
    )

    text = " ".join(
        item.text for item in msg.content if isinstance(item, TextContent)
    ).strip()
    lower = text.lower()

    if lower in ("help", "?"):
        agents = list_available_agents()
        online = sum(1 for a in agents if a["online"])
        await reply(ctx, sender,
            f"Coordinator Agent ($ROUTE) — Swarm Entry Point\n\n"
            f"I route your queries to the right specialist agent.\n"
            f"Swarm size: {len(agents)} agents ({online} online)\n\n"
            f"Commands:\n"
            f"  agents           — list all swarm agents\n"
            f"  route <query>    — classify and route a query\n"
            f"  stats            — routing statistics\n"
            f"  help             — this message\n\n"
            f"Or just ask me anything and I will route it."
        )
        return

    if lower in ("agents", "directory", "swarm"):
        agents = list_available_agents()
        lines = ["Genesis Network Swarm Directory:", ""]
        for a in agents:
            status = "ONLINE" if a["online"] else "OFFLINE"
            lines.append(f"  [{status}] {a['name']} (role: {a['role']})")
            lines.append(f"    {a['description']}")
            lines.append(f"    Services: {', '.join(a['capabilities'])}")
            lines.append("")
        await reply(ctx, sender, "\n".join(lines), end=True)
        return

    if lower == "stats":
        await reply(ctx, sender,
            f"Coordinator Stats:\n  Queries routed: {_route_count}",
            end=True,
        )
        return

    # Route the query
    query = text
    if lower.startswith("route "):
        query = text[6:].strip()

    role, confidence, reason = classify_and_route(query)
    agent_info = get_agent_info(role)
    _route_count += 1

    if agent_info.get("address"):
        # Forward the query to the target agent
        try:
            await ctx.send(
                agent_info["address"],
                ChatMessage(
                    timestamp=datetime.now(),
                    msg_id=uuid4(),
                    content=[TextContent(type="text", text=query)],
                ),
            )
            await reply(ctx, sender,
                f"Routed to {agent_info['name']} (confidence: {confidence:.0%})\n"
                f"Reason: {reason}\n"
                f"Your query has been forwarded. The specialist will respond directly.",
                end=True,
            )
        except Exception as e:
            await reply(ctx, sender,
                f"Routing failed: {e}\n"
                f"Target: {agent_info['name']} ({role})",
                end=True,
            )
    else:
        # Agent not configured, provide guidance
        await reply(ctx, sender,
            f"Best match: {agent_info.get('name', role)} (confidence: {confidence:.0%})\n"
            f"Reason: {reason}\n\n"
            f"However, the {role} agent is not yet configured in this swarm.\n"
            f"To connect it, set {role.upper()}_ADDRESS as an Agentverse secret.\n\n"
            f"Available capabilities for {role}: {', '.join(agent_info.get('capabilities', []))}",
            end=True,
        )


@chat_proto.on_message(ChatAcknowledgement)
async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement) -> None:
    ctx.logger.debug(f"Ack from {sender[:20]}")


@agent.on_interval(period=300.0)
async def health_check(ctx: Context) -> None:
    agents = list_available_agents()
    online = sum(1 for a in agents if a["online"])
    ctx.logger.info(f"[COORDINATOR] {online}/{len(agents)} agents online. Routes: {_route_count}")


agent.include(chat_proto, publish_manifest=True)

if __name__ == "__main__":
    agent.run()
