#!/usr/bin/env python3
"""
Strategy Agent ($PLAN) — Campaign Strategist for the Marketing Team

What it does:
  - Creates content calendars with scheduled topics and formats
  - Runs brand audits (analyzes presence, messaging, positioning)
  - Performs competitor analysis via LLM
  - Generates campaign plans that coordinate all other agents
  - ACTUALLY CALLS peer agents (Writer, Social, Analytics) via Chat Protocol

What it charges:
  - content_calendar:    0.02 FET — weekly/monthly content plan
  - brand_audit:         0.02 FET — comprehensive brand analysis
  - competitor_analysis: 0.02 FET — competitive landscape report
  - campaign_plan:       0.02 FET — full campaign with agent assignments

What it consumes:
  - Writer (for content drafts — calls via Chat Protocol)
  - Social (for posting — calls via Chat Protocol)
  - Analytics (for performance data — calls via Chat Protocol)

Inter-agent communication pattern:
  Chat Protocol is async fire-and-forget. There is no ctx.send_and_wait().
  When Strategy calls Writer, it stores the original caller in ctx.storage.
  When Writer responds (in a separate handler invocation), Strategy checks
  if the sender is a known peer, retrieves the stored context, and forwards
  the result to the original caller.

Secrets needed:
  - ASI1_API_KEY
  - AGENTVERSE_API_KEY
  - WRITER_ADDRESS, SOCIAL_ADDRESS, COMMUNITY_ADDRESS
  - ANALYTICS_ADDRESS, OUTREACH_ADDRESS, ADS_ADDRESS
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

from openai import OpenAI

client = OpenAI(
    base_url="https://api.asi1.ai/v1",
    api_key=os.environ.get("ASI1_API_KEY", ""),
)

# Peer agent addresses (set via Agentverse secrets during deployment)
PEERS = {
    "writer": os.environ.get("WRITER_ADDRESS", ""),
    "social": os.environ.get("SOCIAL_ADDRESS", ""),
    "community": os.environ.get("COMMUNITY_ADDRESS", ""),
    "analytics": os.environ.get("ANALYTICS_ADDRESS", ""),
    "outreach": os.environ.get("OUTREACH_ADDRESS", ""),
    "ads": os.environ.get("ADS_ADDRESS", ""),
}


# ---------------------------------------------------------------------------
# Peer communication helpers
#
# Chat Protocol is async: ctx.send() fires a message and returns. There is
# no await-for-response. To orchestrate multi-agent work:
#
#   1. Strategy receives a request from a caller (human or agent)
#   2. Strategy sends "Working on it..." to the caller (no EndSession)
#   3. Strategy sends a ChatMessage to a peer (e.g. Writer)
#   4. Strategy stores who asked and what to do with the response
#   5. Peer processes and sends a ChatMessage back to Strategy
#   6. Strategy's handler fires again — checks if sender is a known peer
#   7. If yes, retrieves stored context, forwards result to original caller
#
# This pattern works for any swarm. Copy these helpers into any agent that
# needs to call other agents.
# ---------------------------------------------------------------------------

# Reverse lookup: address -> role name
PEER_LOOKUP = {v: k for k, v in PEERS.items() if v}


async def call_peer(ctx: Context, peer_name: str, message: str, callback: dict = None):
    """
    Send a ChatMessage to a peer agent and store callback context.

    Args:
        ctx: Agent context
        peer_name: Key in PEERS dict (e.g. "writer")
        message: The message to send (e.g. "blog AI agents")
        callback: Data to store for when the peer responds. Must include
                  "requester" (address to forward the response to).
    Returns:
        True if sent, False if peer not configured.
    """
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
    ctx.logger.info(f"[STRATEGY] Called {peer_name}: {message[:60]}")
    return True


def get_peer_pending(ctx: Context, sender: str):
    """
    Check if sender is a known peer with a pending request.
    Returns the stored callback data and clears it, or None.
    """
    if sender not in PEER_LOOKUP:
        return None
    raw = ctx.storage.get(f"peer_pending:{sender}")
    if not raw:
        return None
    ctx.storage.set(f"peer_pending:{sender}", "")
    return json.loads(raw)


# ---------------------------------------------------------------------------
# LLM strategy generation
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = (
    "You are a marketing strategist for AgentLaunch, a platform for building "
    "and tokenizing AI agents on the Fetch.ai ecosystem. You coordinate a team "
    "of AI marketing agents (Writer, Social, Community, Analytics, Outreach, Ads). "
    "Create actionable, specific marketing strategies."
)


def generate_content_calendar(duration: str, focus: str) -> str:
    resp = client.chat.completions.create(
        model="asi1-mini",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": (
                    f"Create a {duration} content calendar focused on: {focus}\n\n"
                    "For each day/week, specify:\n"
                    "- Content type (blog, tweet thread, newsletter, ad)\n"
                    "- Topic/headline\n"
                    "- Which agent handles it (Writer, Social, Community)\n"
                    "- Target audience segment\n\n"
                    "Use a table format."
                ),
            },
        ],
        max_tokens=2000,
        temperature=0.7,
    )
    return resp.choices[0].message.content


def generate_brand_audit(brand_info: str) -> str:
    resp = client.chat.completions.create(
        model="asi1-mini",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": (
                    f"Perform a brand audit for AgentLaunch.\n"
                    f"Additional context: {brand_info}\n\n"
                    "Analyze:\n"
                    "1. Brand positioning (vs competitors)\n"
                    "2. Messaging consistency\n"
                    "3. Visual identity strengths/gaps\n"
                    "4. Audience perception\n"
                    "5. Recommendations (top 5 actions)\n\n"
                    "Be specific and actionable."
                ),
            },
        ],
        max_tokens=1500,
        temperature=0.7,
    )
    return resp.choices[0].message.content


def generate_competitor_analysis(competitors: str) -> str:
    resp = client.chat.completions.create(
        model="asi1-mini",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": (
                    f"Analyze these competitors: {competitors}\n\n"
                    "For each competitor provide:\n"
                    "- What they do well\n"
                    "- Their weaknesses\n"
                    "- How AgentLaunch differentiates\n"
                    "- Opportunities to exploit\n\n"
                    "End with a competitive positioning summary."
                ),
            },
        ],
        max_tokens=1500,
        temperature=0.7,
    )
    return resp.choices[0].message.content


def generate_campaign_plan(goal: str, budget: str, duration: str) -> str:
    resp = client.chat.completions.create(
        model="asi1-mini",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": (
                    f"Create a marketing campaign plan.\n"
                    f"Goal: {goal}\n"
                    f"Budget: {budget}\n"
                    f"Duration: {duration}\n\n"
                    "Include:\n"
                    "1. Campaign overview and KPIs\n"
                    "2. Agent assignments:\n"
                    "   - Writer: content to create\n"
                    "   - Social: posting schedule\n"
                    "   - Community: engagement activities\n"
                    "   - Analytics: metrics to track\n"
                    "   - Outreach: partners to contact\n"
                    "   - Ads: ad campaigns to run\n"
                    "3. Timeline with milestones\n"
                    "4. Success criteria\n\n"
                    "Be specific with deliverables and deadlines."
                ),
            },
        ],
        max_tokens=2000,
        temperature=0.7,
    )
    return resp.choices[0].message.content


# ---------------------------------------------------------------------------
# Strategy storage
# ---------------------------------------------------------------------------


def save_plan(ctx: Context, plan_type: str, content: str) -> None:
    plans = json.loads(ctx.storage.get("plans") or "[]")
    plans.append({
        "type": plan_type,
        "content": content[:2000],
        "ts": datetime.now().isoformat(),
    })
    plans = plans[-50:]
    ctx.storage.set("plans", json.dumps(plans))


def get_plans(ctx: Context) -> list:
    return json.loads(ctx.storage.get("plans") or "[]")


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

    # -----------------------------------------------------------------
    # Step 1: Check if this message is a RESPONSE from a peer agent.
    # If Strategy previously called Writer, Writer's response arrives
    # here as a new ChatMessage where sender = WRITER_ADDRESS.
    # -----------------------------------------------------------------
    pending = get_peer_pending(ctx, sender)
    if pending:
        peer_name = pending.get("peer", "unknown")
        requester = pending.get("requester", "")
        next_step = pending.get("next_step")
        ctx.logger.info(f"[STRATEGY] Got response from {peer_name} ({len(text)} chars)")

        if next_step == "post_to_social":
            # Writer responded with content — now send it to Social to post
            first_tweet = text.split("\n")[0][:280]
            sent = await call_peer(ctx, "social", f"post {first_tweet}", {
                "requester": requester,
                "next_step": "report_done",
                "full_content": text[:1000],
            })
            if not sent:
                await reply(ctx, requester,
                    f"Writer created content but Social is not configured.\n\n"
                    f"Content:\n{text[:1500]}", end=True)
            return

        if next_step == "report_done":
            # Social confirmed posting — report back to original caller
            full_content = pending.get("full_content", "")
            await reply(ctx, requester,
                f"Campaign executed:\n"
                f"  Writer: content created\n"
                f"  Social: {text}\n\n"
                f"Content preview:\n{full_content[:500]}...", end=True)
            return

        # Default: forward the peer's response to the original requester
        if requester:
            label = peer_name.title()
            await reply(ctx, requester,
                f"[{label} response]\n\n{text}", end=True)
        return

    # -----------------------------------------------------------------
    # Step 2: Handle new requests from external callers.
    # -----------------------------------------------------------------

    if lower in ("help", "?"):
        await reply(
            ctx,
            sender,
            "Strategy Agent ($PLAN) — Campaign Strategist\n\n"
            "Commands:\n"
            "  calendar <duration>|<focus>         — content calendar (0.02 FET)\n"
            "  audit [context]                     — brand audit (0.02 FET)\n"
            "  competitors <list>                  — competitor analysis (0.02 FET)\n"
            "  campaign <goal>|<budget>|<duration> — full campaign plan (0.02 FET)\n"
            "  create <type> <topic>               — call Writer for content\n"
            "  publish <topic>                     — Writer creates + Social posts\n"
            "  ask <agent> <message>               — call any peer agent\n"
            "  plans                               — view saved plans\n"
            "  team                                — show team agent status\n"
            "  revenue                             — view revenue summary\n"
            "  balance                             — check wallet balance\n"
            "  help                                — this message",
        )
        return

    # --- NEW: Delegate content creation to Writer ---
    # "create blog AI agents" -> calls Writer with "blog AI agents"
    if lower.startswith("create "):
        request = text.split(maxsplit=1)[1].strip()
        sent = await call_peer(ctx, "writer", request, {"requester": sender})
        if sent:
            await reply(ctx, sender, f"Requesting from Writer: {request}")
        else:
            await reply(ctx, sender,
                "Writer not configured. Set WRITER_ADDRESS secret.", end=True)
        return

    # --- NEW: Full pipeline — Writer creates content, Social posts it ---
    # "publish AI agent launch" -> Writer creates tweet -> Social posts it
    if lower.startswith("publish "):
        topic = text.split(maxsplit=1)[1].strip()
        sent = await call_peer(ctx, "writer", f"tweet {topic}", {
            "requester": sender,
            "next_step": "post_to_social",
        })
        if sent:
            await reply(ctx, sender,
                f"Starting publish pipeline:\n"
                f"  1. Writer generating tweet about: {topic}\n"
                f"  2. Social will post it when ready")
        else:
            await reply(ctx, sender,
                "Writer not configured. Set WRITER_ADDRESS secret.", end=True)
        return

    # --- NEW: Call any peer agent by name ---
    # "ask analytics report" -> calls Analytics with "report"
    if lower.startswith("ask "):
        parts = text.split(maxsplit=2)
        if len(parts) < 3:
            await reply(ctx, sender, "Format: ask <agent> <message>", end=True)
            return
        peer_name = parts[1].lower()
        peer_message = parts[2]
        if peer_name not in PEERS:
            await reply(ctx, sender,
                f"Unknown agent: {peer_name}. Available: {', '.join(PEERS.keys())}", end=True)
            return
        sent = await call_peer(ctx, peer_name, peer_message, {"requester": sender})
        if sent:
            await reply(ctx, sender, f"Asking {peer_name.title()}: {peer_message}")
        else:
            await reply(ctx, sender,
                f"{peer_name.title()} not configured. Set {peer_name.upper()}_ADDRESS secret.", end=True)
        return

    # Content calendar
    if lower.startswith("calendar "):
        raw = text.split(maxsplit=1)[1].strip()
        parts = [p.strip() for p in raw.split("|")]
        duration = parts[0]
        focus = parts[1] if len(parts) > 1 else "AgentLaunch growth"
        ctx.logger.info(f"[STRATEGY] Creating content calendar: {duration}, {focus}")
        try:
            result = generate_content_calendar(duration, focus)
            save_plan(ctx, "content_calendar", result)
            log_revenue(ctx, sender, "content_calendar", 0.02)
            await reply(ctx, sender, result, end=True)
        except Exception as e:
            await reply(ctx, sender, f"Error: {e}", end=True)
        return

    # Brand audit
    if lower.startswith("audit"):
        context = text.split(maxsplit=1)[1].strip() if " " in text else "general assessment"
        ctx.logger.info("[STRATEGY] Running brand audit")
        try:
            result = generate_brand_audit(context)
            save_plan(ctx, "brand_audit", result)
            log_revenue(ctx, sender, "brand_audit", 0.02)
            await reply(ctx, sender, result, end=True)
        except Exception as e:
            await reply(ctx, sender, f"Error: {e}", end=True)
        return

    # Competitor analysis
    if lower.startswith("competitors "):
        competitors = text.split(maxsplit=1)[1].strip()
        ctx.logger.info(f"[STRATEGY] Analyzing competitors: {competitors}")
        try:
            result = generate_competitor_analysis(competitors)
            save_plan(ctx, "competitor_analysis", result)
            log_revenue(ctx, sender, "competitor_analysis", 0.02)
            await reply(ctx, sender, result, end=True)
        except Exception as e:
            await reply(ctx, sender, f"Error: {e}", end=True)
        return

    # Campaign plan
    if lower.startswith("campaign "):
        raw = text.split(maxsplit=1)[1].strip()
        parts = [p.strip() for p in raw.split("|")]
        if len(parts) < 3:
            await reply(ctx, sender, "Format: campaign <goal>|<budget>|<duration>", end=True)
            return
        goal, budget, duration = parts[0], parts[1], parts[2]
        ctx.logger.info(f"[STRATEGY] Creating campaign plan: {goal}")
        try:
            result = generate_campaign_plan(goal, budget, duration)
            save_plan(ctx, "campaign_plan", result)
            log_revenue(ctx, sender, "campaign_plan", 0.02)
            await reply(ctx, sender, result, end=True)
        except Exception as e:
            await reply(ctx, sender, f"Error: {e}", end=True)
        return

    # View saved plans
    if lower == "plans":
        plans = get_plans(ctx)
        if not plans:
            await reply(ctx, sender, "No saved plans yet.", end=True)
            return
        lines = [f"Saved Plans ({len(plans)}):"]
        for i, p in enumerate(plans[-10:], 1):
            lines.append(f"  {i}. [{p['type']}] {p['ts'][:16]} — {p['content'][:60]}...")
        await reply(ctx, sender, "\n".join(lines), end=True)
        return

    # Team status
    if lower == "team":
        lines = ["Marketing Team Agents:"]
        for role, addr in PEERS.items():
            status = "connected" if addr else "not configured"
            lines.append(f"  {role.title()}: {status}")
            if addr:
                lines.append(f"    Address: {addr[:30]}...")
        await reply(ctx, sender, "\n".join(lines), end=True)
        return

    # Revenue summary
    if lower == "revenue":
        summary = get_revenue_summary(ctx)
        lines = [
            f"Revenue Summary:",
            f"  Total: {summary['total_fet']} FET",
            f"  Calls: {summary['calls']}",
        ]
        if summary["by_service"]:
            lines.append("  By service:")
            for svc, amt in summary["by_service"].items():
                lines.append(f"    {svc}: {round(amt, 4)} FET")
        else:
            lines.append("  No revenue recorded yet.")
        await reply(ctx, sender, "\n".join(lines), end=True)
        return

    # Wallet balance
    if lower == "balance":
        try:
            raw = ctx.ledger.query_bank_balance(str(agent.wallet.address()), "atestfet")
            fet = int(raw) / 1e18
            await reply(ctx, sender,
                f"Wallet: {str(agent.wallet.address())[:30]}...\n"
                f"Balance: {fet:.4f} FET ({raw} atestfet)", end=True)
        except Exception as e:
            await reply(ctx, sender, f"Balance check failed: {e}", end=True)
        return

    await reply(
        ctx, sender, "Strategy Agent ($PLAN). Type 'help' for commands.", end=True
    )


@chat_proto.on_message(ChatAcknowledgement)
async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement) -> None:
    ctx.logger.debug(f"Ack from {sender[:20]}")


agent.include(chat_proto, publish_manifest=True)

if __name__ == "__main__":
    agent.run()
