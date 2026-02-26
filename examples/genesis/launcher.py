#!/usr/bin/env python3
"""
Launcher Agent ($LAUNCH) — Gap Finder for the Genesis Network

What it does:
  - Analyzes the current swarm to find unmet needs
  - Recommends what new agents should be built
  - Generates scaffold configurations for new agents
  - Provides deployment recommendations with estimated costs

What it charges:
  - find_gap:               0.02 FET — analyze swarm for gaps
  - scaffold_agent:         0.02 FET — generate agent configuration
  - deploy_recommendation:  0.02 FET — full deployment plan

What it consumes:
  - Analyst agent for token scoring
  - Coordinator agent for swarm directory

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
# Swarm gap analysis
# ---------------------------------------------------------------------------

# Known agent roles and their ideal presence
IDEAL_SWARM = {
    "oracle": {"min": 1, "description": "Market data provider", "priority": "P0"},
    "brain": {"min": 1, "description": "LLM reasoning engine", "priority": "P0"},
    "coordinator": {"min": 1, "description": "Query router", "priority": "P0"},
    "analyst": {"min": 1, "description": "Token scoring", "priority": "P1"},
    "sentinel": {"min": 1, "description": "Anomaly detection", "priority": "P1"},
    "scout": {"min": 1, "description": "Agent discovery", "priority": "P2"},
    "launcher": {"min": 0, "description": "Gap finder (this agent)", "priority": "P2"},
}

# Template configs for each role
SCAFFOLD_CONFIGS = {
    "oracle": {
        "template": "genesis",
        "role": "oracle",
        "symbol": "DATA",
        "interval_seconds": "300",
        "service_price_afet": "1000000000000000",
        "description": "Market data oracle — price feeds, OHLC, market summaries",
    },
    "brain": {
        "template": "genesis",
        "role": "brain",
        "symbol": "THINK",
        "interval_seconds": "300",
        "service_price_afet": "10000000000000000",
        "description": "LLM reasoning — classification, summarization, analysis",
        "extra_secrets": ["HF_TOKEN"],
    },
    "analyst": {
        "template": "genesis",
        "role": "analyst",
        "symbol": "SCORE",
        "interval_seconds": "300",
        "service_price_afet": "5000000000000000",
        "description": "Token scoring — quality evaluation and ranking",
    },
    "sentinel": {
        "template": "genesis",
        "role": "sentinel",
        "symbol": "ALERT",
        "interval_seconds": "60",
        "service_price_afet": "2000000000000000",
        "description": "Real-time watchdog — anomaly detection and alerts",
    },
    "coordinator": {
        "template": "genesis",
        "role": "coordinator",
        "symbol": "ROUTE",
        "interval_seconds": "300",
        "service_price_afet": "500000000000000",
        "description": "Query router — routes queries to specialist agents",
    },
    "scout": {
        "template": "genesis",
        "role": "scout",
        "symbol": "FIND",
        "interval_seconds": "300",
        "service_price_afet": "10000000000000000",
        "description": "Agent scout — discovers and evaluates agents for tokenization",
    },
}


def analyze_gaps(known_agents: list) -> list:
    """Analyze what roles are missing from the current swarm."""
    # Count agents by role
    role_counts = {}
    for a in known_agents:
        role = a.get("role", "unknown")
        role_counts[role] = role_counts.get(role, 0) + 1

    gaps = []
    for role, spec in IDEAL_SWARM.items():
        current = role_counts.get(role, 0)
        if current < spec["min"]:
            gaps.append({
                "role": role,
                "needed": spec["min"] - current,
                "priority": spec["priority"],
                "description": spec["description"],
            })

    # Sort by priority
    priority_order = {"P0": 0, "P1": 1, "P2": 2}
    gaps.sort(key=lambda g: priority_order.get(g["priority"], 3))
    return gaps


def generate_scaffold(role: str, agent_name: str) -> dict:
    """Generate scaffold configuration for a new agent."""
    config = SCAFFOLD_CONFIGS.get(role)
    if not config:
        return {"error": f"Unknown role: {role}"}

    return {
        "command": f"npx agentlaunch scaffold {agent_name} --type genesis",
        "variables": {
            "agent_name": agent_name,
            "role": config["role"],
            "description": config["description"],
            "service_price_afet": config["service_price_afet"],
            "interval_seconds": config["interval_seconds"],
        },
        "symbol": config["symbol"],
        "template": config["template"],
        "secrets": ["AGENTVERSE_API_KEY", "AGENTLAUNCH_API_KEY", "AGENT_ADDRESS"]
        + config.get("extra_secrets", []),
        "estimated_deploy_cost": "120 FET (deploy fee) + gas",
    }


def generate_deploy_plan(gaps: list) -> str:
    """Create a full deployment plan for missing roles."""
    if not gaps:
        return "Swarm is complete. No gaps detected."

    lines = [
        "Deployment Plan",
        "=" * 40,
        "",
    ]

    total_cost = 0
    for i, gap in enumerate(gaps, 1):
        config = SCAFFOLD_CONFIGS.get(gap["role"], {})
        name = f"genesis-{gap['role']}"
        lines.append(f"{i}. [{gap['priority']}] {gap['role'].upper()} — {gap['description']}")
        lines.append(f"   Name: {name}")
        lines.append(f"   Symbol: ${config.get('symbol', '???')}")
        lines.append(f"   Command: npx agentlaunch scaffold {name} --type genesis")
        lines.append(f"   Cost: 120 FET deploy fee")
        lines.append("")
        total_cost += 120

    lines.append(f"Total estimated cost: {total_cost} FET")
    lines.append(f"Build order: {' -> '.join(g['role'] for g in gaps)}")
    return "\n".join(lines)


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
            "Launcher Agent ($LAUNCH) — Gap Finder\n\n"
            "Commands:\n"
            "  gaps                      — find missing swarm roles (0.02 FET)\n"
            "  scaffold <role> [name]    — generate agent config (0.02 FET)\n"
            "  plan                      — full deployment plan (0.02 FET)\n"
            "  roles                     — list all known roles\n"
            "  help                      — this message"
        )
        return

    if lower == "roles":
        lines = ["Known Agent Roles:"]
        for role, spec in IDEAL_SWARM.items():
            lines.append(f"  [{spec['priority']}] {role:15s} — {spec['description']}")
        await reply(ctx, sender, "\n".join(lines), end=True)
        return

    if lower in ("gaps", "analyze", "find gap"):
        # For now, assume an empty swarm minus this launcher
        # In production, query Coordinator for agent directory
        known = [{"role": "launcher"}]
        gaps = analyze_gaps(known)
        if not gaps:
            await reply(ctx, sender, "Swarm is complete! All roles are filled.", end=True)
            return
        lines = [f"Found {len(gaps)} gaps in the swarm:"]
        for g in gaps:
            lines.append(f"  [{g['priority']}] {g['role']:15s} — {g['description']} (need {g['needed']})")
        lines.append("\nUse 'scaffold <role>' to generate configuration.")
        lines.append("Use 'plan' for a full deployment plan.")
        await reply(ctx, sender, "\n".join(lines), end=True)
        return

    if lower.startswith("scaffold "):
        parts = text.split()
        role = parts[1].lower() if len(parts) > 1 else ""
        name = parts[2] if len(parts) > 2 else f"genesis-{role}"
        config = generate_scaffold(role, name)
        if "error" in config:
            await reply(ctx, sender, config["error"], end=True)
            return
        await reply(ctx, sender,
            f"Scaffold Configuration for '{name}':\n\n"
            f"  Template: {config['template']}\n"
            f"  Role: {config['variables']['role']}\n"
            f"  Symbol: ${config['symbol']}\n"
            f"  Description: {config['variables']['description']}\n"
            f"  Service price: {config['variables']['service_price_afet']} atestfet\n"
            f"  Interval: {config['variables']['interval_seconds']}s\n\n"
            f"Command:\n  {config['command']}\n\n"
            f"Required secrets:\n  {', '.join(config['secrets'])}\n\n"
            f"Cost: {config['estimated_deploy_cost']}",
            end=True,
        )
        return

    if lower in ("plan", "deploy plan", "deploy_recommendation"):
        known = [{"role": "launcher"}]
        gaps = analyze_gaps(known)
        plan = generate_deploy_plan(gaps)
        await reply(ctx, sender, plan, end=True)
        return

    await reply(ctx, sender,
        "Launcher Agent ($LAUNCH). Type 'help' for commands.",
        end=True,
    )


@chat_proto.on_message(ChatAcknowledgement)
async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement) -> None:
    ctx.logger.debug(f"Ack from {sender[:20]}")


agent.include(chat_proto, publish_manifest=True)

if __name__ == "__main__":
    agent.run()
