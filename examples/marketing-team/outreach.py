#!/usr/bin/env python3
"""
Outreach Agent ($REACH) — Partnership Outreach for the Marketing Team

What it does:
  - Drafts personalized pitch emails via ASI1-mini
  - Sends emails via Resend
  - Tracks outreach responses in ctx.storage
  - Calls Writer agent for pitch content via Chat Protocol

What it charges:
  - draft_pitch:   0.01 FET — generate personalized pitch
  - send_email:    0.01 FET — send email via Resend

What it consumes:
  - Writer (for pitch content — calls via Chat Protocol)

Inter-agent communication:
  "autopitch <name>|<email>|<info>|<goal>" calls Writer for the pitch body,
  then sends it via Resend when Writer responds.

Secrets needed:
  - ASI1_API_KEY
  - RESEND_API_KEY
  - AGENTVERSE_API_KEY
  - WRITER_ADDRESS (peer — Outreach calls Writer for content)
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
import requests

# ASI1-mini for pitch generation
client = OpenAI(
    base_url="https://api.asi1.ai/v1",
    api_key=os.environ.get("ASI1_API_KEY", ""),
)

# Resend for email delivery
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
FROM_EMAIL = os.environ.get("FROM_EMAIL", "outreach@agent-launch.ai")
FROM_NAME = os.environ.get("FROM_NAME", "AgentLaunch Outreach")


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
    ctx.logger.info(f"[OUTREACH] Called {peer_name}: {message[:60]}")
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
# LLM pitch generation
# ---------------------------------------------------------------------------


def generate_pitch(partner_name: str, partner_info: str, goal: str) -> dict:
    """Generate a personalized pitch email."""
    resp = client.chat.completions.create(
        model="asi1-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a partnership outreach specialist for AgentLaunch, "
                    "a platform for building and tokenizing AI agents. "
                    "Write concise, professional partnership pitches."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Write a partnership pitch email to {partner_name}.\n"
                    f"About them: {partner_info}\n"
                    f"Goal: {goal}\n\n"
                    "Provide:\n"
                    "1. Subject line (max 60 chars)\n"
                    "2. Email body (150-250 words)\n"
                    'Format as JSON: {{"subject": "...", "body": "..."}}'
                ),
            },
        ],
        max_tokens=800,
        temperature=0.7,
    )
    text = resp.choices[0].message.content
    try:
        start = text.find("{")
        end = text.rfind("}") + 1
        if start >= 0 and end > start:
            return json.loads(text[start:end])
    except json.JSONDecodeError:
        pass
    return {"subject": "Partnership Opportunity", "body": text}


# ---------------------------------------------------------------------------
# Resend email
# ---------------------------------------------------------------------------


def send_email(to_email: str, subject: str, body: str) -> dict:
    """Send an email via Resend."""
    r = requests.post(
        "https://api.resend.com/emails",
        json={
            "from": f"{FROM_NAME} <{FROM_EMAIL}>",
            "to": [to_email],
            "subject": subject,
            "text": body,
        },
        headers={
            "Authorization": f"Bearer {RESEND_API_KEY}",
            "Content-Type": "application/json",
        },
        timeout=10,
    )
    if r.status_code == 200:
        return {"status": "sent", "to": to_email, "id": r.json().get("id")}
    return {"error": f"Resend {r.status_code}: {r.text[:200]}"}


# ---------------------------------------------------------------------------
# Outreach tracking
# ---------------------------------------------------------------------------


def log_outreach(ctx: Context, entry: dict) -> None:
    log = json.loads(ctx.storage.get("outreach_log") or "[]")
    log.append({**entry, "ts": datetime.now().isoformat()})
    log = log[-200:]
    ctx.storage.set("outreach_log", json.dumps(log))


def get_outreach_log(ctx: Context) -> list:
    return json.loads(ctx.storage.get("outreach_log") or "[]")


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
    # Check if this is a response from a peer agent (Writer).
    # -----------------------------------------------------------------
    pending = get_peer_pending(ctx, sender)
    if pending:
        peer_name = pending.get("peer", "unknown")
        action = pending.get("action", "")
        requester = pending.get("requester", "")
        ctx.logger.info(f"[OUTREACH] Got response from {peer_name}")

        if action == "autopitch":
            # Writer returned pitch content — send it via Resend
            to_email = pending.get("to_email", "")
            partner_name = pending.get("partner_name", "Partner")

            # Extract subject line (first line) and body (rest)
            lines = text.strip().split("\n", 1)
            subject = lines[0].replace("Subject:", "").strip()[:60]
            body = lines[1].strip() if len(lines) > 1 else text

            result = send_email(to_email, subject, body)
            if "error" in result:
                if requester:
                    await reply(ctx, requester,
                        f"Writer created pitch but send failed: {result['error']}\n\n"
                        f"Subject: {subject}\n{body[:500]}", end=True)
            else:
                log_outreach(ctx, {
                    "type": "autopitch", "to": to_email,
                    "partner": partner_name, "subject": subject, "status": "sent",
                })
                log_revenue(ctx, requester or sender, "autopitch", 0.02)
                if requester:
                    await reply(ctx, requester,
                        f"Pitch sent to {to_email}!\n"
                        f"Subject: {subject}\n"
                        f"Content by Writer agent.", end=True)
            return

        # Default: forward to requester
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
            "Outreach Agent ($REACH) — Partnership Outreach\n\n"
            "Commands:\n"
            "  pitch <name>|<info>|<goal>  — generate a pitch email (0.01 FET)\n"
            "  send <email>|<subject>|<body> — send email via Resend (0.01 FET)\n"
            "  pitchsend <name>|<email>|<info>|<goal> — generate + send (0.02 FET)\n"
            "  autopitch <name>|<email>|<info>|<goal> — Writer creates + send (0.02 FET)\n"
            "  log                         — view outreach history\n"
            "  stats                       — outreach summary\n"
            "  revenue                     — view revenue summary\n"
            "  balance                     — check FET wallet balance\n"
            "  help                        — this message",
        )
        return

    # --- NEW: Auto-pitch — call Writer for content, then send via Resend ---
    if lower.startswith("autopitch "):
        raw = text.split(maxsplit=1)[1].strip()
        parts = [p.strip() for p in raw.split("|")]
        if len(parts) < 4:
            await reply(ctx, sender,
                "Format: autopitch <name>|<email>|<info>|<goal>", end=True)
            return
        name, email, info, goal = parts[0], parts[1], parts[2], parts[3]
        writer_prompt = (
            f"Write a partnership pitch email to {name}. "
            f"About them: {info}. Goal: {goal}. "
            f"First line should be the subject (max 60 chars). "
            f"Rest should be the email body (150-250 words)."
        )
        sent = await call_peer(ctx, "writer", writer_prompt, {
            "requester": sender,
            "action": "autopitch",
            "to_email": email,
            "partner_name": name,
        })
        if sent:
            await reply(ctx, sender,
                f"Requesting pitch content from Writer for {name}. "
                f"Will send to {email} when ready.")
        else:
            # Fallback: generate pitch locally and send
            ctx.logger.info(f"[OUTREACH] Writer unavailable, generating locally")
            try:
                pitch = generate_pitch(name, info, goal)
                result = send_email(email, pitch["subject"], pitch["body"])
                if "error" in result:
                    await reply(ctx, sender,
                        f"Pitch generated but send failed: {result['error']}\n\n"
                        f"{pitch['body']}", end=True)
                else:
                    log_outreach(ctx, {
                        "type": "pitchsend", "to": email,
                        "partner": name, "subject": pitch["subject"], "status": "sent",
                    })
                    await reply(ctx, sender,
                        f"Pitch sent to {email}!\nSubject: {pitch['subject']}", end=True)
            except Exception as e:
                await reply(ctx, sender, f"Error: {e}", end=True)
        return

    # Generate pitch
    if lower.startswith("pitch "):
        raw = text.split(maxsplit=1)[1].strip()
        parts = [p.strip() for p in raw.split("|")]
        if len(parts) < 3:
            await reply(ctx, sender, "Format: pitch <name>|<info>|<goal>", end=True)
            return
        name, info, goal = parts[0], parts[1], parts[2]
        ctx.logger.info(f"[OUTREACH] Generating pitch for: {name}")
        try:
            pitch = generate_pitch(name, info, goal)
            log_revenue(ctx, sender, "draft_pitch", 0.01)
            await reply(
                ctx,
                sender,
                f"Subject: {pitch['subject']}\n\n{pitch['body']}",
                end=True,
            )
        except Exception as e:
            await reply(ctx, sender, f"Error generating pitch: {e}", end=True)
        return

    # Send email directly
    if lower.startswith("send "):
        raw = text.split(maxsplit=1)[1].strip()
        parts = [p.strip() for p in raw.split("|")]
        if len(parts) < 3:
            await reply(ctx, sender, "Format: send <email>|<subject>|<body>", end=True)
            return
        email, subject, body = parts[0], parts[1], "|".join(parts[2:])
        ctx.logger.info(f"[OUTREACH] Sending email to: {email}")
        result = send_email(email, subject, body)
        if "error" in result:
            await reply(ctx, sender, f"Error: {result['error']}", end=True)
        else:
            log_outreach(ctx, {"type": "email", "to": email, "subject": subject, "status": "sent"})
            log_revenue(ctx, sender, "send_email", 0.01)
            await reply(ctx, sender, f"Email sent to {email}.", end=True)
        return

    # Generate + send in one step (local LLM)
    if lower.startswith("pitchsend "):
        raw = text.split(maxsplit=1)[1].strip()
        parts = [p.strip() for p in raw.split("|")]
        if len(parts) < 4:
            await reply(ctx, sender, "Format: pitchsend <name>|<email>|<info>|<goal>", end=True)
            return
        name, email, info, goal = parts[0], parts[1], parts[2], parts[3]
        ctx.logger.info(f"[OUTREACH] Pitch+send for: {name} ({email})")
        try:
            pitch = generate_pitch(name, info, goal)
            result = send_email(email, pitch["subject"], pitch["body"])
            if "error" in result:
                await reply(ctx, sender,
                    f"Pitch generated but send failed: {result['error']}\n\n{pitch['body']}", end=True)
            else:
                log_outreach(ctx, {
                    "type": "pitch+send", "to": email,
                    "partner": name, "subject": pitch["subject"], "status": "sent",
                })
                log_revenue(ctx, sender, "pitchsend", 0.02)
                await reply(ctx, sender,
                    f"Pitch sent to {email}!\nSubject: {pitch['subject']}", end=True)
        except Exception as e:
            await reply(ctx, sender, f"Error: {e}", end=True)
        return

    # View outreach log
    if lower == "log":
        log = get_outreach_log(ctx)
        if not log:
            await reply(ctx, sender, "No outreach history yet.", end=True)
            return
        recent = log[-10:]
        lines = [f"Outreach Log (last {len(recent)}):"]
        for entry in recent:
            lines.append(
                f"  [{entry.get('status')}] {entry.get('to', 'N/A')} — "
                f"{entry.get('subject', entry.get('type', 'N/A'))[:50]} "
                f"({entry.get('ts', '')[:16]})"
            )
        await reply(ctx, sender, "\n".join(lines), end=True)
        return

    # Stats
    if lower == "stats":
        log = get_outreach_log(ctx)
        sent = len([e for e in log if e.get("status") == "sent"])
        await reply(
            ctx,
            sender,
            f"Outreach Stats\n"
            f"  Total attempts: {len(log)}\n"
            f"  Sent: {sent}\n"
            f"  Failed: {len(log) - sent}",
            end=True,
        )
        return

    # Revenue summary
    if lower == "revenue":
        summary = get_revenue_summary(ctx)
        lines = [f"Revenue Summary — Outreach Agent"]
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

    await reply(
        ctx, sender, "Outreach Agent ($REACH). Type 'help' for commands.", end=True
    )


@chat_proto.on_message(ChatAcknowledgement)
async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement) -> None:
    ctx.logger.debug(f"Ack from {sender[:20]}")


agent.include(chat_proto, publish_manifest=True)

if __name__ == "__main__":
    agent.run()
