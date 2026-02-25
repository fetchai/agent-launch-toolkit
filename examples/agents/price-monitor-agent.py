"""
Price Monitor Agent ($WATCH) — Token Price Alerts

Monitors token prices on AgentLaunch and sends alerts when price thresholds
are crossed. Supports multiple tokens per user with configurable thresholds.

Tiers:
- Free: 3 active watches, 10 checks/day
- Premium ($WATCH holders): Unlimited watches, real-time alerts

Chat Protocol v0.3.0 compliant.

Platform constants (source of truth: deployed smart contracts):
  - Deploy fee: 120 FET (read dynamically, can change via multi-sig)
  - Graduation target: 30,000 FET -> auto DEX listing
  - Trading fee: 2% -> 100% to protocol treasury (NO creator fee)
"""

from datetime import datetime
from uuid import uuid4
import json
import os
import time
from collections import defaultdict
from typing import Any, Dict, List, Optional

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

_legacy_api = os.environ.get("AGENTLAUNCH_API")
if _legacy_api:
    import warnings
    warnings.warn(
        "AGENTLAUNCH_API is deprecated. Use AGENT_LAUNCH_API_URL instead.",
        DeprecationWarning,
        stacklevel=2,
    )

DEV_API_URL = "https://launchpad-backend-dev-1056182620041.us-central1.run.app"
PROD_API_URL = "https://agent-launch.ai/api"
ENV = os.environ.get("AGENT_LAUNCH_ENV", "dev")
BASE_API = os.environ.get("AGENT_LAUNCH_API_URL") or _legacy_api or (
    PROD_API_URL if ENV == "production" else DEV_API_URL
)

BUSINESS = {
    "name": "PriceWatch",
    "symbol": "WATCH",
    "version": "1.0.0",
    "description": "Token price monitoring with customizable alerts",
    "default_threshold_pct": 5.0,
    "free_watches": 3,
    "free_checks_per_day": 10,
    "premium_token_threshold": 1000,
    "rate_limit_per_minute": 20,
    "max_input_length": 2000,
}

# ==============================================================================
# STATE
# ==============================================================================

# user_id -> list of watch configs
watches: Dict[str, List[Dict]] = defaultdict(list)

# user_id -> list of timestamps (for daily limit)
daily_usage: Dict[str, List[str]] = defaultdict(list)

# user_id -> list of request times (for rate limiting)
rate_limits: Dict[str, List[float]] = defaultdict(list)

# token_address -> price history
price_cache: Dict[str, List[Dict]] = defaultdict(list)


# ==============================================================================
# HELPERS
# ==============================================================================


def fetch_token_price(token_address: str) -> Optional[float]:
    """Fetch current price from AgentLaunch API."""
    try:
        r = requests.get(f"{BASE_API}/agents/token/{token_address}", timeout=10)
        if r.status_code == 200:
            data = r.json()
            price = data.get("price") or (data.get("data") or {}).get("price")
            return float(price) if price is not None else None
    except Exception:
        pass
    return None


def get_tier(user_address: str) -> str:
    """Check if user holds enough tokens for premium tier."""
    try:
        r = requests.get(f"{BASE_API}/agents/token/{user_address}", timeout=5)
        if r.status_code == 200:
            balance = r.json().get("balance", 0)
            if balance >= BUSINESS["premium_token_threshold"]:
                return "premium"
    except Exception:
        pass
    return "free"


def check_rate_limit(user_id: str) -> Optional[str]:
    """Returns error message if rate limited, None if OK."""
    now = time.time()
    rate_limits[user_id] = [t for t in rate_limits[user_id] if now - t < 60]
    if len(rate_limits[user_id]) >= BUSINESS["rate_limit_per_minute"]:
        return "Rate limit exceeded. Please wait a moment."
    rate_limits[user_id].append(now)
    return None


def check_daily_limit(user_id: str, tier: str) -> Optional[str]:
    """Returns error message if daily limit reached, None if OK."""
    today = datetime.now().date().isoformat()
    daily_usage[user_id] = [t for t in daily_usage[user_id] if t.startswith(today)]
    limit = 1000 if tier == "premium" else BUSINESS["free_checks_per_day"]
    if len(daily_usage[user_id]) >= limit:
        if tier == "free":
            return (
                f"Daily limit reached ({limit}/day). "
                f"Hold {BUSINESS['premium_token_threshold']} $WATCH for premium!"
            )
        return f"Daily limit reached ({limit}/day)."
    daily_usage[user_id].append(datetime.now().isoformat())
    return None


def record_price(token_address: str, price: float) -> None:
    """Store price in history cache."""
    history = price_cache[token_address]
    history.append({"price": price, "ts": datetime.now().isoformat()})
    if len(history) > 100:
        price_cache[token_address] = history[-100:]


def check_alert(token_address: str, current_price: float, threshold_pct: float) -> Optional[str]:
    """Check if price moved beyond threshold since first recorded price."""
    history = price_cache[token_address]
    if not history:
        return None
    baseline = history[0]["price"]
    if baseline == 0:
        return None
    change_pct = ((current_price - baseline) / baseline) * 100
    if abs(change_pct) >= threshold_pct:
        direction = "UP" if change_pct > 0 else "DOWN"
        return (
            f"ALERT: {token_address[:12]}... moved {direction} {change_pct:+.2f}% "
            f"(from {baseline:.6f} to {current_price:.6f} FET)"
        )
    return None


# ==============================================================================
# COMMAND HANDLERS
# ==============================================================================


def handle_watch(user_id: str, args: str, tier: str) -> str:
    """Add a new price watch."""
    parts = args.split()
    if not parts:
        return "Usage: watch <token_address> [threshold%]\nExample: watch 0x1234... 10"

    token_address = parts[0].strip()
    threshold = float(parts[1]) if len(parts) > 1 else BUSINESS["default_threshold_pct"]

    # Check watch limit for free tier
    if tier == "free" and len(watches[user_id]) >= BUSINESS["free_watches"]:
        return (
            f"Free tier limited to {BUSINESS['free_watches']} watches. "
            f"Hold {BUSINESS['premium_token_threshold']} $WATCH for unlimited!"
        )

    # Fetch initial price
    price = fetch_token_price(token_address)
    if price is None:
        return f"Could not fetch price for {token_address}. Check the address."

    record_price(token_address, price)
    watches[user_id].append({
        "address": token_address,
        "threshold": threshold,
        "baseline": price,
        "created": datetime.now().isoformat(),
    })

    return (
        f"Now watching {token_address[:12]}...\n"
        f"Current price: {price:.6f} FET\n"
        f"Alert threshold: {threshold}% change"
    )


def handle_list(user_id: str) -> str:
    """List all active watches."""
    user_watches = watches[user_id]
    if not user_watches:
        return "No active watches. Use: watch <token_address> [threshold%]"

    lines = [f"Active watches ({len(user_watches)}):"]
    for i, w in enumerate(user_watches, 1):
        lines.append(f"  {i}. {w['address'][:12]}... @ {w['threshold']}% threshold")
    return "\n".join(lines)


def handle_check(user_id: str, args: str) -> str:
    """Check current price and alert status."""
    parts = args.split()
    if not parts:
        return "Usage: check <token_address>"

    token_address = parts[0].strip()
    price = fetch_token_price(token_address)
    if price is None:
        return f"Could not fetch price for {token_address}."

    record_price(token_address, price)

    # Find watch config for threshold
    user_watches = watches[user_id]
    watch = next((w for w in user_watches if w["address"] == token_address), None)
    threshold = watch["threshold"] if watch else BUSINESS["default_threshold_pct"]

    alert = check_alert(token_address, price, threshold)
    if alert:
        return alert
    return f"No alert. {token_address[:12]}... at {price:.6f} FET"


def handle_price(args: str) -> str:
    """Quick price lookup."""
    parts = args.split()
    if not parts:
        return "Usage: price <token_address>"

    token_address = parts[0].strip()
    price = fetch_token_price(token_address)
    if price is None:
        return f"Could not fetch price for {token_address}."
    return f"{token_address[:12]}...: {price:.6f} FET"


def handle_remove(user_id: str, args: str) -> str:
    """Remove a watch."""
    parts = args.split()
    if not parts:
        return "Usage: remove <token_address or index>"

    target = parts[0].strip()
    user_watches = watches[user_id]

    # Try as index first
    try:
        idx = int(target) - 1
        if 0 <= idx < len(user_watches):
            removed = user_watches.pop(idx)
            return f"Removed watch for {removed['address'][:12]}..."
    except ValueError:
        pass

    # Try as address
    for i, w in enumerate(user_watches):
        if w["address"].startswith(target):
            removed = user_watches.pop(i)
            return f"Removed watch for {removed['address'][:12]}..."

    return f"No watch found for {target}"


def handle_help(tier: str) -> str:
    """Show help message."""
    return (
        f"**{BUSINESS['name']}** v{BUSINESS['version']}\n\n"
        f"{BUSINESS['description']}\n\n"
        f"Your tier: {tier.upper()}\n\n"
        "Commands:\n"
        "  watch <addr> [%]  - Start monitoring (default 5%)\n"
        "  list              - Show active watches\n"
        "  check <addr>      - Check price + alert status\n"
        "  price <addr>      - Quick price lookup\n"
        "  remove <addr|#>   - Stop watching\n"
        "  help              - This message"
    )


# ==============================================================================
# CHAT HANDLER
# ==============================================================================


async def reply(ctx: Context, sender: str, text: str, end: bool = False) -> None:
    """Send a chat message reply."""
    content = [TextContent(type="text", text=text)]
    if end:
        content.append(EndSessionContent(type="end-session"))
    try:
        await ctx.send(
            sender,
            ChatMessage(timestamp=datetime.now(), msg_id=uuid4(), content=content),
        )
    except Exception as e:
        ctx.logger.error(f"Failed to send reply: {e}")


@chat_proto.on_message(ChatMessage)
async def handle_chat(ctx: Context, sender: str, msg: ChatMessage) -> None:
    """Process incoming chat messages."""
    # Acknowledge receipt
    try:
        await ctx.send(
            sender,
            ChatAcknowledgement(timestamp=datetime.now(), acknowledged_msg_id=msg.msg_id),
        )
    except Exception as e:
        ctx.logger.error(f"Failed to send ack: {e}")

    # Extract text
    text = " ".join(
        item.text for item in msg.content if isinstance(item, TextContent)
    ).strip()
    text = text[: BUSINESS["max_input_length"]]

    if not text:
        await reply(ctx, sender, "Empty message.", end=True)
        return

    # Rate limit check
    rate_error = check_rate_limit(sender)
    if rate_error:
        await reply(ctx, sender, rate_error, end=True)
        return

    ctx.logger.info(f"[AUDIT] user={sender[:20]} msg={text[:50]}")

    # Parse command
    lower = text.lower()
    parts = text.split(maxsplit=1)
    cmd = parts[0].lower()
    args = parts[1] if len(parts) > 1 else ""

    # Help (no quota needed)
    if cmd in ("help", "?"):
        tier = get_tier(sender)
        await reply(ctx, sender, handle_help(tier))
        return

    # List (no quota needed)
    if cmd == "list":
        await reply(ctx, sender, handle_list(sender))
        return

    # Commands that consume quota
    tier = get_tier(sender)
    quota_error = check_daily_limit(sender, tier)
    if quota_error:
        await reply(ctx, sender, quota_error, end=True)
        return

    if cmd == "watch" or cmd == "monitor":
        response = handle_watch(sender, args, tier)
    elif cmd == "check":
        response = handle_check(sender, args)
    elif cmd == "price":
        response = handle_price(args)
    elif cmd == "remove" or cmd == "unwatch":
        response = handle_remove(sender, args)
    else:
        response = handle_help(tier)

    await reply(ctx, sender, response, end=True)


@chat_proto.on_message(ChatAcknowledgement)
async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement) -> None:
    """Handle acknowledgement messages."""
    ctx.logger.debug(f"Ack from {sender[:20]} for {msg.acknowledged_msg_id}")


# ==============================================================================
# PERIODIC CHECKS
# ==============================================================================


@agent.on_interval(period=300)  # Every 5 minutes
async def check_all_watches(ctx: Context) -> None:
    """Check all active watches for alerts."""
    alerts_sent = 0
    for user_id, user_watches in watches.items():
        for watch in user_watches:
            price = fetch_token_price(watch["address"])
            if price is None:
                continue
            record_price(watch["address"], price)
            alert = check_alert(watch["address"], price, watch["threshold"])
            if alert:
                ctx.logger.info(f"[ALERT] {user_id[:20]}: {alert}")
                alerts_sent += 1
                # In production, send notification to user here

    if alerts_sent:
        ctx.logger.info(f"[PERIODIC] Sent {alerts_sent} alerts")


@agent.on_interval(period=3600)  # Every hour
async def log_health(ctx: Context) -> None:
    """Log health stats."""
    total_watches = sum(len(w) for w in watches.values())
    total_users = len(watches)
    ctx.logger.info(f"[HEALTH] users={total_users} watches={total_watches}")


# ==============================================================================
# MAIN
# ==============================================================================

agent.include(chat_proto, publish_manifest=True)

if __name__ == "__main__":
    agent.run()
