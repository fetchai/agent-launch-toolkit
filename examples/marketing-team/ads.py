#!/usr/bin/env python3
"""
Ads Agent ($ADS) — Ad Campaign Manager for the Marketing Team

What it does:
  - Creates ad copy variants via LLM
  - Runs A/B tests by tracking variant performance
  - Optimizes budget allocation based on performance data
  - Generates campaign reports

What it charges:
  - create_ad:       0.01 FET — generate ad copy variants
  - ab_test:         0.01 FET — set up or check A/B test
  - campaign_report: 0.01 FET — campaign performance report

What it consumes:
  - Writer (for ad copy generation)
  - Analytics (for performance optimization)

Secrets needed:
  - ASI1_API_KEY
  - AGENTVERSE_API_KEY
  - WRITER_ADDRESS (peer discovery)
  - ANALYTICS_ADDRESS (peer discovery)
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
import random
from datetime import datetime
from uuid import uuid4

from openai import OpenAI

oai_client = OpenAI(
    base_url="https://api.asi1.ai/v1",
    api_key=os.environ.get("ASI1_API_KEY", ""),
)


# ---------------------------------------------------------------------------
# Peer communication helpers (same pattern as strategy.py)
# ---------------------------------------------------------------------------

PEERS = {
    "writer": os.environ.get("WRITER_ADDRESS", ""),
    "analytics": os.environ.get("ANALYTICS_ADDRESS", ""),
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
    ctx.logger.info(f"[ADS] Called {peer_name}: {message[:60]}")
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
# Ad copy generation
# ---------------------------------------------------------------------------


def generate_ad_variants(product: str, audience: str, count: int = 3) -> list:
    """Generate ad copy variants via LLM."""
    resp = oai_client.chat.completions.create(
        model="asi1-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an ad copywriter for AgentLaunch. "
                    "Create compelling, concise ad variants."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Create {count} ad copy variants.\n"
                    f"Product/feature: {product}\n"
                    f"Target audience: {audience}\n\n"
                    "For each variant provide:\n"
                    "- Headline (max 30 chars)\n"
                    "- Body (max 90 chars)\n"
                    "- CTA (max 20 chars)\n\n"
                    "Return as JSON array: "
                    '[{"headline": "...", "body": "...", "cta": "..."}]'
                ),
            },
        ],
        max_tokens=600,
        temperature=0.9,
    )
    text = resp.choices[0].message.content
    try:
        start = text.find("[")
        end = text.rfind("]") + 1
        if start >= 0 and end > start:
            return json.loads(text[start:end])
    except json.JSONDecodeError:
        pass
    return [{"headline": "Ad", "body": text[:90], "cta": "Learn More"}]


# ---------------------------------------------------------------------------
# A/B test tracking
# ---------------------------------------------------------------------------


def create_ab_test(ctx: Context, name: str, variants: list) -> dict:
    """Create a new A/B test."""
    tests = json.loads(ctx.storage.get("ab_tests") or "{}")
    test = {
        "name": name,
        "variants": [],
        "created": datetime.now().isoformat(),
        "status": "running",
    }
    for i, v in enumerate(variants):
        test["variants"].append({
            "id": chr(65 + i),  # A, B, C...
            "content": v,
            "impressions": 0,
            "clicks": 0,
            "conversions": 0,
        })
    tests[name] = test
    ctx.storage.set("ab_tests", json.dumps(tests))
    return test


def record_event(ctx: Context, test_name: str, variant_id: str, event: str) -> dict:
    """Record an impression, click, or conversion."""
    tests = json.loads(ctx.storage.get("ab_tests") or "{}")
    test = tests.get(test_name)
    if not test:
        return {"error": f"Test '{test_name}' not found"}

    for v in test["variants"]:
        if v["id"] == variant_id.upper():
            if event in ("impression", "impressions"):
                v["impressions"] += 1
            elif event in ("click", "clicks"):
                v["clicks"] += 1
            elif event in ("conversion", "conversions"):
                v["conversions"] += 1
            tests[test_name] = test
            ctx.storage.set("ab_tests", json.dumps(tests))
            return {"recorded": event, "variant": variant_id, "test": test_name}

    return {"error": f"Variant '{variant_id}' not found in test '{test_name}'"}


def get_test_results(ctx: Context, test_name: str) -> dict:
    """Get A/B test results with winner determination."""
    tests = json.loads(ctx.storage.get("ab_tests") or "{}")
    test = tests.get(test_name)
    if not test:
        return {"error": f"Test '{test_name}' not found"}

    best = None
    best_ctr = -1
    for v in test["variants"]:
        imps = v["impressions"]
        ctr = v["clicks"] / max(imps, 1) * 100
        v["ctr"] = round(ctr, 2)
        v["cvr"] = round(v["conversions"] / max(v["clicks"], 1) * 100, 2)
        if ctr > best_ctr:
            best_ctr = ctr
            best = v["id"]

    test["winner"] = best
    return test


# ---------------------------------------------------------------------------
# Campaign tracking
# ---------------------------------------------------------------------------


def get_campaigns(ctx: Context) -> list:
    return json.loads(ctx.storage.get("campaigns") or "[]")


def add_campaign(ctx: Context, campaign: dict) -> None:
    campaigns = get_campaigns(ctx)
    campaigns.append({**campaign, "created": datetime.now().isoformat()})
    ctx.storage.set("campaigns", json.dumps(campaigns))


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
    # Check if this is a response from a peer agent (Writer/Analytics).
    # -----------------------------------------------------------------
    pending = get_peer_pending(ctx, sender)
    if pending:
        peer_name = pending.get("peer", "unknown")
        action = pending.get("action", "")
        requester = pending.get("requester", "")
        ctx.logger.info(f"[ADS] Got response from {peer_name}")

        if action == "autocreate":
            # Writer returned ad copy — parse and create A/B test
            test_name = pending.get("test_name", "auto")
            product = pending.get("product", "unknown")
            try:
                # Try to parse Writer's response as ad variants
                start = text.find("[")
                end = text.rfind("]") + 1
                if start >= 0 and end > start:
                    variants = json.loads(text[start:end])
                else:
                    # Writer returned free-form text — wrap it as variants
                    variants = [{"headline": "Ad", "body": text[:90], "cta": "Learn More"}]
                test = create_ab_test(ctx, test_name, variants)
                add_campaign(ctx, {"name": test_name, "type": "auto_ab_test", "product": product})
                lines = [f"A/B Test '{test_name}' created from Writer content ({len(test['variants'])} variants):"]
                for v in test["variants"]:
                    c = v["content"]
                    lines.append(f"  {v['id']}: {c.get('headline', 'N/A')} — {c.get('body', 'N/A')[:50]}...")
                log_revenue(ctx, requester or sender, "autocreate", 0.01)
                if requester:
                    await reply(ctx, requester, "\n".join(lines), end=True)
            except Exception as e:
                if requester:
                    await reply(ctx, requester, f"Writer responded but parse failed: {e}\n\n{text[:500]}", end=True)
            return

        # Default: forward to requester
        if requester:
            await reply(ctx, requester, f"[{peer_name.title()} response]\n\n{text}", end=True)
        return

    # -----------------------------------------------------------------
    # Handle new requests from external callers.
    # -----------------------------------------------------------------

    if lower in ("help", "?"):
        await reply(
            ctx,
            sender,
            "Ads Agent ($ADS) — Ad Campaign Manager\n\n"
            "Commands:\n"
            "  create <product>|<audience>     — generate ad variants (0.01 FET)\n"
            "  autocreate <name>|<product>|<audience> — Writer creates + A/B test (inter-agent)\n"
            "  test <name>|<product>|<audience> — create A/B test (0.01 FET)\n"
            "  event <test>|<variant>|<type>   — record impression/click/conversion\n"
            "  results <test>                  — A/B test results (0.01 FET)\n"
            "  campaigns                       — list all campaigns\n"
            "  revenue                         — earnings summary\n"
            "  balance                         — wallet balance\n"
            "  help                            — this message",
        )
        return

    # --- Auto-create — call Writer for ad copy, then create A/B test ---
    if lower.startswith("autocreate "):
        raw = text.split(maxsplit=1)[1].strip()
        parts = [p.strip() for p in raw.split("|")]
        if len(parts) < 2:
            await reply(ctx, sender,
                "Format: autocreate <name>|<product>[|<audience>]", end=True)
            return
        name, product = parts[0], parts[1]
        audience = parts[2] if len(parts) > 2 else "crypto-native developers"
        writer_prompt = (
            f"Create 3 ad copy variants for: {product}\n"
            f"Target audience: {audience}\n"
            "For each variant provide headline (max 30 chars), "
            "body (max 90 chars), and CTA (max 20 chars). "
            'Return as JSON array: [{{"headline": "...", "body": "...", "cta": "..."}}]'
        )
        sent = await call_peer(ctx, "writer", writer_prompt, {
            "requester": sender,
            "action": "autocreate",
            "test_name": name,
            "product": product,
        })
        if sent:
            await reply(ctx, sender,
                f"Requesting ad copy from Writer for '{product}'. "
                f"Will create A/B test '{name}' when ready.")
        else:
            # Fallback: generate locally
            ctx.logger.info("[ADS] Writer unavailable, generating locally")
            try:
                variants = generate_ad_variants(product, audience)
                test = create_ab_test(ctx, name, variants)
                add_campaign(ctx, {"name": name, "type": "ab_test", "product": product})
                lines = [f"A/B Test '{name}' created with {len(test['variants'])} variants:"]
                for v in test["variants"]:
                    c = v["content"]
                    lines.append(f"  {v['id']}: {c.get('headline', 'N/A')} — {c.get('body', 'N/A')[:50]}...")
                await reply(ctx, sender, "\n".join(lines), end=True)
            except Exception as e:
                await reply(ctx, sender, f"Error: {e}", end=True)
        return

    # Create ad variants
    if lower.startswith("create "):
        raw = text.split(maxsplit=1)[1].strip()
        parts = [p.strip() for p in raw.split("|")]
        product = parts[0]
        audience = parts[1] if len(parts) > 1 else "crypto-native developers"
        ctx.logger.info(f"[ADS] Creating ads for: {product}")
        try:
            variants = generate_ad_variants(product, audience)
            lines = [f"Ad Variants for: {product}"]
            for i, v in enumerate(variants):
                lines.append(
                    f"\nVariant {chr(65+i)}:\n"
                    f"  Headline: {v.get('headline', 'N/A')}\n"
                    f"  Body: {v.get('body', 'N/A')}\n"
                    f"  CTA: {v.get('cta', 'N/A')}"
                )
            log_revenue(ctx, sender, "create_ad", 0.01)
            await reply(ctx, sender, "\n".join(lines), end=True)
        except Exception as e:
            await reply(ctx, sender, f"Error: {e}", end=True)
        return

    # Create A/B test
    if lower.startswith("test "):
        raw = text.split(maxsplit=1)[1].strip()
        parts = [p.strip() for p in raw.split("|")]
        if len(parts) < 2:
            await reply(ctx, sender, "Format: test <name>|<product>[|<audience>]", end=True)
            return
        name, product = parts[0], parts[1]
        audience = parts[2] if len(parts) > 2 else "crypto developers"
        ctx.logger.info(f"[ADS] Creating A/B test: {name}")
        try:
            variants = generate_ad_variants(product, audience)
            test = create_ab_test(ctx, name, variants)
            add_campaign(ctx, {"name": name, "type": "ab_test", "product": product})
            lines = [f"A/B Test '{name}' created with {len(test['variants'])} variants:"]
            for v in test["variants"]:
                c = v["content"]
                lines.append(f"  {v['id']}: {c.get('headline', 'N/A')} — {c.get('body', 'N/A')[:50]}...")
            lines.append("\nUse 'event <test>|<variant>|impression/click/conversion' to track.")
            log_revenue(ctx, sender, "ab_test", 0.01)
            await reply(ctx, sender, "\n".join(lines), end=True)
        except Exception as e:
            await reply(ctx, sender, f"Error: {e}", end=True)
        return

    # Record event
    if lower.startswith("event "):
        raw = text.split(maxsplit=1)[1].strip()
        parts = [p.strip() for p in raw.split("|")]
        if len(parts) < 3:
            await reply(ctx, sender, "Format: event <test>|<variant>|<type>", end=True)
            return
        result = record_event(ctx, parts[0], parts[1], parts[2])
        if "error" in result:
            await reply(ctx, sender, f"Error: {result['error']}", end=True)
        else:
            await reply(ctx, sender, f"Recorded: {result['recorded']} for variant {result['variant']}", end=True)
        return

    # Test results
    if lower.startswith("results "):
        test_name = text.split(maxsplit=1)[1].strip()
        results = get_test_results(ctx, test_name)
        if "error" in results:
            await reply(ctx, sender, f"Error: {results['error']}", end=True)
            return
        lines = [f"A/B Test: {results['name']} (Winner: {results.get('winner', 'TBD')})"]
        for v in results["variants"]:
            lines.append(
                f"  {v['id']}: {v['impressions']} imps, {v['clicks']} clicks, "
                f"{v['conversions']} conv | CTR: {v['ctr']}%, CVR: {v['cvr']}%"
            )
        log_revenue(ctx, sender, "test_results", 0.01)
        await reply(ctx, sender, "\n".join(lines), end=True)
        return

    # List campaigns
    if lower == "campaigns":
        campaigns = get_campaigns(ctx)
        if not campaigns:
            await reply(ctx, sender, "No campaigns yet.", end=True)
            return
        lines = [f"Campaigns ({len(campaigns)}):"]
        for c in campaigns:
            lines.append(f"  - {c['name']} ({c['type']}) — {c.get('created', '')[:16]}")
        await reply(ctx, sender, "\n".join(lines), end=True)
        return

    # Revenue summary
    if lower == "revenue":
        summary = get_revenue_summary(ctx)
        lines = [
            f"Revenue Summary",
            f"  Total: {summary['total_fet']} FET across {summary['calls']} calls",
        ]
        for svc, amt in summary["by_service"].items():
            lines.append(f"  {svc}: {round(amt, 4)} FET")
        await reply(ctx, sender, "\n".join(lines), end=True)
        return

    # Wallet balance
    if lower == "balance":
        try:
            raw = ctx.ledger.query_bank_balance(str(agent.wallet.address()), "atestfet")
            fet = int(raw) / 1e18
            await reply(ctx, sender, f"Wallet: {str(agent.wallet.address())}\nBalance: {fet:.4f} FET", end=True)
        except Exception as e:
            await reply(ctx, sender, f"Balance check failed: {e}", end=True)
        return

    await reply(
        ctx, sender, "Ads Agent ($ADS). Type 'help' for commands.", end=True
    )


@chat_proto.on_message(ChatAcknowledgement)
async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement) -> None:
    ctx.logger.debug(f"Ack from {sender[:20]}")


@agent.on_interval(period=300.0)
async def simulate_traffic(ctx: Context) -> None:
    """Simulate traffic for active A/B tests (demo purposes)."""
    tests = json.loads(ctx.storage.get("ab_tests") or "{}")
    for name, test in tests.items():
        if test.get("status") != "running":
            continue
        for v in test["variants"]:
            # Simulate some impressions and clicks for demo
            v["impressions"] += random.randint(5, 20)
            v["clicks"] += random.randint(0, 3)
            if random.random() < 0.1:
                v["conversions"] += 1
    ctx.storage.set("ab_tests", json.dumps(tests))
    ctx.logger.info(f"[ADS] Simulated traffic for {len(tests)} tests")


agent.include(chat_proto, publish_manifest=True)

if __name__ == "__main__":
    agent.run()
