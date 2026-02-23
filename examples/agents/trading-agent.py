"""
Trading Agent ($TRADE) — Smart Alerts & Signal Monitor

P3-004: Token monitoring, price alerts, and trading signals for the agent economy.
Users set up alerts, agent monitors and notifies when conditions are met.

Tiers:
- Free: 1 active alert
- Premium ($TRADE holders): Unlimited alerts, signal analysis,
  portfolio tracking

Checks every 5 minutes via on_interval.

Chat Protocol v0.3.0 compliant.

Platform constants (source of truth: deployed smart contracts):
  - Deploy fee: 120 FET (read dynamically, can change via multi-sig)
  - Graduation target: 30,000 FET -> auto DEX listing
  - Trading fee: 2% -> 100% to protocol treasury (NO creator fee)
"""

from datetime import datetime, timedelta
from uuid import uuid4
import hashlib
import json
import os
import re
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

AGENTLAUNCH_API = os.environ.get(
    "AGENTLAUNCH_API", "https://agent-launch.ai/api"
)
OWNER_ADDRESS = os.environ.get("AGENT_OWNER_ADDRESS", "")

# Token address for $TRADE on AgentLaunch
TOKEN_ADDRESS = os.environ.get("TRADE_TOKEN_ADDRESS", "")

BUSINESS = {
    "name": "Trading Agent",
    "ticker": "$TRADE",
    "description": "Smart alerts and trading signals for the agent economy",
    "version": "1.0.0",
    "domain": "trading",
    # Revenue model
    "free_alerts": 1,
    "premium_alerts": 100,
    "premium_token_threshold": 1000,  # Hold 1000 $TRADE = premium
    # Monitoring
    "check_interval_seconds": 300,  # 5 minutes
    # Security
    "rate_limit_per_minute": 20,
    "max_input_length": 2000,
}

# ==============================================================================
# STORAGE HELPERS
# ==============================================================================


def _get(ctx, key, default=None):
    try:
        val = ctx.storage.get(key)
        return json.loads(val) if val else default
    except Exception:
        return default


def _set(ctx, key, value):
    try:
        ctx.storage.set(key, json.dumps(value))
    except Exception as e:
        ctx.logger.error(f"Storage write failed for key {key}: {e}")


# ==============================================================================
# SECURITY
# ==============================================================================


class Security:
    def __init__(self) -> None:
        self._requests: Dict[str, List[float]] = defaultdict(list)
        self._check_count: int = 0

    def check(self, ctx: Context, user_id: str, message: str) -> tuple:
        now = time.time()

        self._requests[user_id] = [
            t for t in self._requests[user_id] if now - t < 60
        ]
        if len(self._requests[user_id]) >= BUSINESS["rate_limit_per_minute"]:
            return None, "Rate limit exceeded. Please wait a moment."
        self._requests[user_id].append(now)

        self._check_count += 1
        if self._check_count % 100 == 0:
            stale = [
                k
                for k, v in self._requests.items()
                if not v or (now - max(v)) > 300
            ]
            for k in stale:
                del self._requests[k]

        if not message or not message.strip():
            return None, "Empty message."
        if len(message) > BUSINESS["max_input_length"]:
            return None, (
                f"Message too long (max {BUSINESS['max_input_length']} chars)."
            )

        return message.strip(), None


# ==============================================================================
# HEALTH
# ==============================================================================


class Health:
    def __init__(self) -> None:
        self._start: datetime = datetime.utcnow()
        self._requests: int = 0
        self._errors: int = 0

    def record(self, success: bool) -> None:
        self._requests += 1
        if not success:
            self._errors += 1

    def status(self) -> Dict[str, Any]:
        uptime = (datetime.utcnow() - self._start).total_seconds()
        error_rate = (
            (self._errors / self._requests * 100) if self._requests else 0
        )
        return {
            "status": "healthy" if error_rate < 10 else "degraded",
            "uptime_seconds": int(uptime),
            "requests": self._requests,
            "error_rate": f"{error_rate:.1f}%",
        }


# ==============================================================================
# CACHE
# ==============================================================================


class Cache:
    def __init__(self, max_size: int = 1000) -> None:
        self._data: Dict[str, tuple] = {}
        self._max_size: int = max_size

    def get(self, key: str) -> Any:
        if key in self._data:
            value, expires = self._data[key]
            if expires > time.time():
                return value
            del self._data[key]
        return None

    def set(self, key: str, value: Any, ttl: int = 300) -> None:
        if len(self._data) >= self._max_size:
            now = time.time()
            expired = [k for k, (_, exp) in self._data.items() if exp <= now]
            for k in expired:
                del self._data[k]
            if len(self._data) >= self._max_size:
                to_drop = sorted(
                    self._data.items(), key=lambda x: x[1][1]
                )[: self._max_size // 10]
                for k, _ in to_drop:
                    del self._data[k]
        self._data[key] = (value, time.time() + ttl)


# ==============================================================================
# TOKEN GATING
# ==============================================================================


def verify_agentverse_agent(sender: str) -> bool:
    return sender.startswith("agent1q") and len(sender) > 20


def check_token_holdings(user_address: str, cache: Cache) -> str:
    """Check if user holds enough $TRADE tokens for premium tier."""
    if not TOKEN_ADDRESS:
        return "free"

    cached = cache.get(f"tier:{user_address}")
    if cached is not None:
        return cached

    try:
        r = requests.get(
            f"{AGENTLAUNCH_API}/agents/token/{TOKEN_ADDRESS}/holders",
            params={"holder": user_address},
            timeout=5,
        )
        if r.status_code == 200:
            data = r.json()
            balance = data.get("balance", 0)
            tier = (
                "premium"
                if balance >= BUSINESS["premium_token_threshold"]
                else "free"
            )
            cache.set(f"tier:{user_address}", tier, ttl=300)
            return tier
    except Exception:
        pass
    return "free"


# ==============================================================================
# ALERT MANAGEMENT
# ==============================================================================


def get_alerts(ctx, sender: str) -> List[Dict]:
    """Get all alerts for a user."""
    return _get(ctx, f"alerts_{sender}", [])


def save_alerts(ctx, sender: str, alerts: List[Dict]):
    _set(ctx, f"alerts_{sender}", alerts)


def get_all_alert_owners(ctx) -> List[str]:
    """Get list of all users with active alerts."""
    return _get(ctx, "alert_owners", [])


def register_alert_owner(ctx, sender: str):
    owners = get_all_alert_owners(ctx)
    if sender not in owners:
        owners.append(sender)
        _set(ctx, "alert_owners", owners)


def create_alert(
    ctx, sender: str, token_name: str, condition: str,
    threshold: float, tier: str,
) -> tuple:
    """Create a new price alert. Returns (success, message)."""
    alerts = get_alerts(ctx, sender)

    max_alerts = (
        BUSINESS["premium_alerts"] if tier == "premium"
        else BUSINESS["free_alerts"]
    )

    if len(alerts) >= max_alerts:
        if tier == "free":
            return False, (
                f"Free tier limit: {BUSINESS['free_alerts']} alert.\n\n"
                f"Hold {BUSINESS['premium_token_threshold']} {BUSINESS['ticker']} "
                f"for up to {BUSINESS['premium_alerts']} active alerts!"
            )
        return False, f"Alert limit reached ({max_alerts})."

    alert = {
        "id": len(alerts) + 1,
        "token": token_name,
        "condition": condition,  # "above" or "below"
        "threshold": threshold,
        "created": datetime.utcnow().isoformat(),
        "triggered": False,
        "active": True,
    }

    alerts.append(alert)
    save_alerts(ctx, sender, alerts)
    register_alert_owner(ctx, sender)

    return True, (
        f"Alert created!\n\n"
        f"**Alert #{alert['id']}**\n"
        f"Token: {token_name}\n"
        f"Condition: Price {condition} {threshold} FET\n"
        f"Status: Active (checking every 5 min)"
    )


def remove_alert(ctx, sender: str, alert_id: int) -> tuple:
    """Remove an alert by ID. Returns (success, message)."""
    alerts = get_alerts(ctx, sender)

    for alert in alerts:
        if alert["id"] == alert_id and alert["active"]:
            alert["active"] = False
            save_alerts(ctx, sender, alerts)
            return True, f"Alert #{alert_id} removed."

    return False, f"Alert #{alert_id} not found or already inactive."


def format_alerts(alerts: List[Dict]) -> str:
    """Format alert list for display."""
    active = [a for a in alerts if a["active"]]
    if not active:
        return "No active alerts."

    lines = ["**Your Active Alerts**\n"]
    for a in active:
        status = "TRIGGERED" if a["triggered"] else "Watching"
        lines.append(
            f"#{a['id']} | {a['token']} | "
            f"Price {a['condition']} {a['threshold']} FET | {status}"
        )
    return "\n".join(lines)


# ==============================================================================
# DATA FETCHER (for alert checks)
# ==============================================================================


class DataFetcher:
    def __init__(self, cache: Cache) -> None:
        self._cache = cache

    def get_token_data(self, token_name: str) -> Optional[Dict]:
        """Fetch token by name/symbol from AgentLaunch."""
        cache_key = f"token_price:{token_name.lower()}"
        cached = self._cache.get(cache_key)
        if cached is not None:
            return cached

        try:
            r = requests.get(
                f"{AGENTLAUNCH_API}/agents/tokens",
                timeout=10,
            )
            if r.status_code == 200:
                data = r.json()
                tokens = data.get("data", []) if data.get("success") else []
                for token in tokens:
                    if (
                        token.get("name", "").lower() == token_name.lower()
                        or token.get("symbol", "").lower() == token_name.lower()
                    ):
                        self._cache.set(cache_key, token, ttl=60)
                        return token
        except Exception:
            pass
        return None

    def get_all_tokens(self) -> List[Dict]:
        cached = self._cache.get("all_tokens")
        if cached is not None:
            return cached

        try:
            r = requests.get(
                f"{AGENTLAUNCH_API}/agents/tokens",
                timeout=10,
            )
            if r.status_code == 200:
                data = r.json()
                tokens = data.get("data", []) if data.get("success") else []
                self._cache.set("all_tokens", tokens, ttl=120)
                return tokens
        except Exception:
            pass
        return []


# ==============================================================================
# STATS
# ==============================================================================


def get_stats(ctx) -> dict:
    return _get(ctx, "stats", {
        "alerts_created": 0,
        "alerts_triggered": 0,
        "checks_run": 0,
    })


def record_stat(ctx, key: str):
    stats = get_stats(ctx)
    stats[key] = stats.get(key, 0) + 1
    _set(ctx, "stats", stats)


# ==============================================================================
# INTENT DETECTION
# ==============================================================================


def detect_intent(text: str) -> tuple:
    """Detect trading intent. Returns (intent, details)."""
    t = text.lower().strip()

    # Watch / create alert
    if any(w in t for w in ["watch", "alert", "notify", "tell me when"]):
        return "watch", t

    # Remove alert
    if any(w in t for w in ["remove alert", "delete alert", "cancel alert", "stop watching"]):
        # Extract alert ID
        id_match = re.search(r"#?(\d+)", t)
        alert_id = int(id_match.group(1)) if id_match else None
        return "remove", str(alert_id) if alert_id else ""

    # List alerts
    if any(w in t for w in ["my alerts", "list alerts", "active alerts", "show alerts"]):
        return "alerts", ""

    # Signals (premium)
    if any(w in t for w in ["signals", "signal", "opportunities", "alpha"]):
        return "signals", ""

    # Portfolio (premium)
    if any(w in t for w in ["portfolio", "my tokens", "my holdings"]):
        return "portfolio", ""

    # Help
    if any(w in t for w in ["help", "what can", "how does", "?"]) or t == "help":
        return "help", ""

    # Status
    if any(w in t for w in ["status", "stats", "health"]):
        return "status", ""

    # Tokenize
    if "tokenize" in t:
        return "tokenize", ""

    # Greeting
    if len(t) < 20 and any(w in t for w in ["hi", "hello", "hey", "yo", "sup"]):
        return "greeting", ""

    # Default
    return "unknown", t


def parse_watch_command(text: str) -> tuple:
    """Parse a watch command into (token, condition, threshold).

    Examples:
      'watch FET above 0.5'
      'alert when BTC below 30000'
      'notify me if MYTOKEN goes above 100'
    """
    t = text.lower().strip()

    # Try to extract: <token> <above|below> <number>
    match = re.search(
        r"(?:watch|alert|notify|tell me when)\s+"
        r"(?:when\s+|if\s+|me\s+(?:when|if)\s+)?"
        r"(\S+)\s+"
        r"(?:goes?\s+|is\s+|reaches?\s+)?"
        r"(above|below|over|under)\s+"
        r"([\d.]+)",
        t,
    )

    if match:
        token = match.group(1).upper()
        condition = "above" if match.group(2) in ("above", "over") else "below"
        threshold = float(match.group(3))
        return token, condition, threshold

    return None, None, None


# ==============================================================================
# AGENTLAUNCH INTEGRATION
# ==============================================================================


class AgentLaunch:
    @staticmethod
    def tokenize() -> Dict:
        agent_address = os.environ.get("AGENT_ADDRESS")
        if not agent_address:
            return {
                "error": (
                    "AGENT_ADDRESS environment variable is not set. "
                    "Set it in Agentverse secrets."
                )
            }
        try:
            r = requests.post(
                f"{AGENTLAUNCH_API}/agents/tokenize",
                headers={
                    "X-API-Key": os.environ.get("AGENTLAUNCH_API_KEY", ""),
                    "Content-Type": "application/json",
                },
                json={
                    "agentAddress": agent_address,
                    "name": BUSINESS["name"],
                    "description": BUSINESS["description"],
                },
                timeout=30,
            )
            return (
                r.json()
                if r.status_code in [200, 201]
                else {"error": r.text}
            )
        except Exception as e:
            return {"error": str(e)}


# ==============================================================================
# REPLY HELPER
# ==============================================================================


async def reply(ctx, sender: str, text: str, end: bool = False):
    content = [TextContent(type="text", text=text)]
    if end:
        content.append(EndSessionContent(type="end-session"))
    try:
        await ctx.send(
            sender,
            ChatMessage(
                timestamp=datetime.utcnow(),
                msg_id=uuid4(),
                content=content,
            ),
        )
    except Exception as e:
        ctx.logger.error(f"Failed to send reply to {sender[:20]}: {e}")


# ==============================================================================
# INITIALIZE
# ==============================================================================

cache = Cache(max_size=1000)
security = Security()
health = Health()
fetcher = DataFetcher(cache)


# ==============================================================================
# MESSAGE HANDLER
# ==============================================================================


@chat_proto.on_message(ChatMessage)
async def handle_chat(ctx: Context, sender: str, msg: ChatMessage):
    # Acknowledge receipt
    try:
        await ctx.send(
            sender,
            ChatAcknowledgement(
                timestamp=datetime.utcnow(),
                acknowledged_msg_id=msg.msg_id,
            ),
        )
    except Exception as e:
        ctx.logger.error(f"Failed to send ack to {sender[:20]}: {e}")

    # Extract text
    text = " ".join(
        item.text for item in msg.content if isinstance(item, TextContent)
    ).strip()
    text = text[:BUSINESS["max_input_length"]]

    ctx.logger.info(f"[Trading Agent] {sender[:16]}: {text[:60]}")

    # Verify sender
    if not verify_agentverse_agent(sender):
        await reply(
            ctx, sender,
            "I can only serve verified Agentverse agents. "
            "Deploy your agent at agentverse.ai first!",
            end=True,
        )
        return

    # Security check
    clean, error = security.check(ctx, sender, text)
    if error:
        health.record(False)
        await reply(ctx, sender, error, end=True)
        return

    intent, details = detect_intent(clean)

    # --- Help ---
    if intent == "help":
        tier = check_token_holdings(sender, cache)
        await reply(
            ctx, sender,
            f"**{BUSINESS['name']}** v{BUSINESS['version']}\n\n"
            f"{BUSINESS['description']}\n\n"
            f"Your tier: **{tier.upper()}**\n\n"
            f"**Commands:**\n"
            f"- 'watch <token> above <price>' -- Price alert (goes up)\n"
            f"- 'watch <token> below <price>' -- Price alert (goes down)\n"
            f"- 'my alerts' -- List active alerts\n"
            f"- 'remove alert #1' -- Cancel an alert\n"
            f"- 'signals' -- Trading signals (premium)\n"
            f"- 'portfolio' -- Portfolio overview (premium)\n"
            f"- 'status' -- Agent stats\n"
            f"- 'tokenize' -- Create $TRADE token (owner only)\n\n"
            f"**Free tier:** {BUSINESS['free_alerts']} active alert\n"
            f"**Premium:** Hold {BUSINESS['premium_token_threshold']} {BUSINESS['ticker']} "
            f"for {BUSINESS['premium_alerts']} alerts + signals + portfolio",
        )
        return

    # --- Greeting ---
    if intent == "greeting":
        alerts = get_alerts(ctx, sender)
        active_count = len([a for a in alerts if a["active"]])
        await reply(
            ctx, sender,
            f"Hey! I'm the **Trading Agent** -- your smart alert monitor.\n\n"
            f"You have **{active_count}** active alert(s).\n\n"
            f"Try:\n"
            f"- 'watch MYTOKEN above 0.5'\n"
            f"- 'my alerts'\n"
            f"- 'signals' (premium)\n\n"
            f"Say 'help' for all commands.",
        )
        return

    # --- Status ---
    if intent == "status":
        status = health.status()
        stats = get_stats(ctx)
        await reply(
            ctx, sender,
            f"**Trading Agent Status**\n\n"
            f"**Health:** {status['status']}\n"
            f"Uptime: {status['uptime_seconds']}s | "
            f"Requests: {status['requests']} | "
            f"Error rate: {status['error_rate']}\n\n"
            f"**Stats:**\n"
            f"- Alerts created: {stats.get('alerts_created', 0)}\n"
            f"- Alerts triggered: {stats.get('alerts_triggered', 0)}\n"
            f"- Monitor checks: {stats.get('checks_run', 0)}\n",
        )
        return

    # --- Tokenize ---
    if intent == "tokenize":
        if OWNER_ADDRESS and sender != OWNER_ADDRESS:
            await reply(
                ctx, sender,
                "Only the agent owner can trigger tokenization.",
                end=True,
            )
            return
        result = AgentLaunch.tokenize()
        link = result.get("data", {}).get("handoff_link") or result.get(
            "handoff_link"
        )
        if link:
            response = f"Token created! Deploy here: {link}"
        else:
            response = f"Tokenization result: {json.dumps(result)}"
        await reply(ctx, sender, response, end=True)
        return

    # --- Token-gated features ---
    tier = check_token_holdings(sender, cache)

    # --- Watch / Create alert ---
    if intent == "watch":
        token_name, condition, threshold = parse_watch_command(clean)
        if not token_name:
            await reply(
                ctx, sender,
                "To set an alert, use this format:\n\n"
                "'watch TOKEN above PRICE'\n"
                "'watch TOKEN below PRICE'\n\n"
                "Example: 'watch FET above 0.5'",
            )
            return

        success, message = create_alert(
            ctx, sender, token_name, condition, threshold, tier
        )
        if success:
            record_stat(ctx, "alerts_created")
        health.record(success)
        await reply(ctx, sender, message, end=True)
        return

    # --- Remove alert ---
    if intent == "remove":
        if not details:
            await reply(
                ctx, sender,
                "Specify the alert ID to remove:\n"
                "'remove alert #1'\n\n"
                "Say 'my alerts' to see your alert IDs.",
            )
            return
        try:
            alert_id = int(details)
        except ValueError:
            await reply(ctx, sender, "Invalid alert ID. Use 'my alerts' to see IDs.")
            return

        success, message = remove_alert(ctx, sender, alert_id)
        health.record(success)
        await reply(ctx, sender, message, end=True)
        return

    # --- List alerts ---
    if intent == "alerts":
        alerts = get_alerts(ctx, sender)
        response = format_alerts(alerts)
        if tier == "free":
            active = len([a for a in alerts if a["active"]])
            response += (
                f"\n\n---\n"
                f"*{active}/{BUSINESS['free_alerts']} alert slots used. "
                f"Hold {BUSINESS['premium_token_threshold']} {BUSINESS['ticker']} "
                f"for {BUSINESS['premium_alerts']} alerts!*"
            )
        await reply(ctx, sender, response)
        return

    # --- Signals (premium) ---
    if intent == "signals":
        if tier != "premium":
            await reply(
                ctx, sender,
                f"Trading signals are a premium feature.\n\n"
                f"Hold {BUSINESS['premium_token_threshold']} {BUSINESS['ticker']} "
                f"to unlock:\n"
                f"- Real-time trading signals\n"
                f"- Volume spike alerts\n"
                f"- New token launch notifications\n"
                f"- {BUSINESS['premium_alerts']} active alerts",
                end=True,
            )
            return

        # Premium signal analysis
        tokens = fetcher.get_all_tokens()
        if tokens:
            # Sort by market cap for simple signal
            sorted_tokens = sorted(
                tokens,
                key=lambda t: float(t.get("marketCap", 0) or 0),
                reverse=True,
            )[:5]

            lines = ["**Trading Signals**\n"]
            lines.append("*Top tokens by market cap:*\n")
            for i, token in enumerate(sorted_tokens, 1):
                name = token.get("name", "Unknown")
                symbol = token.get("symbol", "???")
                mc = token.get("marketCap", "0")
                listed = token.get("listed", False)
                status = "DEX" if listed else "Bonding"
                lines.append(
                    f"{i}. **{name}** ({symbol}) -- MC: {mc} FET [{status}]"
                )

            lines.append(
                f"\n*Signals refresh every "
                f"{BUSINESS['check_interval_seconds'] // 60} min. "
                f"Set alerts to get notified automatically.*"
            )
            response = "\n".join(lines)
        else:
            response = "No signal data available right now. Try again shortly."

        health.record(True)
        await reply(ctx, sender, response, end=True)
        return

    # --- Portfolio (premium) ---
    if intent == "portfolio":
        if tier != "premium":
            await reply(
                ctx, sender,
                f"Portfolio tracking is a premium feature.\n\n"
                f"Hold {BUSINESS['premium_token_threshold']} {BUSINESS['ticker']} "
                f"to unlock portfolio overview + position tracking!",
                end=True,
            )
            return

        alerts = get_alerts(ctx, sender)
        active_alerts = [a for a in alerts if a["active"]]
        tokens_watched = list(set(a["token"] for a in active_alerts))

        response = (
            f"**Your Trading Dashboard**\n\n"
            f"Active alerts: {len(active_alerts)}\n"
            f"Tokens watched: {', '.join(tokens_watched) if tokens_watched else 'None'}\n\n"
            f"*Full portfolio tracking with P&L requires on-chain "
            f"indexing -- coming soon.*"
        )
        health.record(True)
        await reply(ctx, sender, response, end=True)
        return

    # --- Unknown ---
    await reply(
        ctx, sender,
        "I didn't catch that. Here's what I can do:\n\n"
        "- 'watch TOKEN above PRICE' -- Set price alert\n"
        "- 'my alerts' -- View alerts\n"
        "- 'signals' -- Trading signals (premium)\n"
        "- 'help' -- Full guide",
    )


@chat_proto.on_message(ChatAcknowledgement)
async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement):
    ctx.logger.debug(
        f"Ack from {sender[:20]} for msg {msg.acknowledged_msg_id}"
    )


# ==============================================================================
# ALERT MONITOR -- runs every 5 minutes
# ==============================================================================


@agent.on_interval(period=BUSINESS["check_interval_seconds"])
async def check_alerts(ctx: Context):
    """Check all active alerts against current prices."""
    owners = _get(ctx, "alert_owners", [])
    if not owners:
        return

    record_stat(ctx, "checks_run")
    ctx.logger.info(f"[ALERT_CHECK] Checking alerts for {len(owners)} users")

    for owner in owners:
        alerts = _get(ctx, f"alerts_{owner}", [])
        active_alerts = [a for a in alerts if a["active"] and not a["triggered"]]

        if not active_alerts:
            continue

        for alert in active_alerts:
            try:
                token_data = fetcher.get_token_data(alert["token"])
                if not token_data:
                    continue

                current_price = float(token_data.get("currentPrice", 0) or 0)
                threshold = alert["threshold"]
                condition = alert["condition"]

                triggered = False
                if condition == "above" and current_price >= threshold:
                    triggered = True
                elif condition == "below" and current_price <= threshold:
                    triggered = True

                if triggered:
                    alert["triggered"] = True
                    _set(ctx, f"alerts_{owner}", alerts)
                    record_stat(ctx, "alerts_triggered")

                    # Notify user
                    try:
                        await ctx.send(
                            owner,
                            ChatMessage(
                                timestamp=datetime.utcnow(),
                                msg_id=uuid4(),
                                content=[
                                    TextContent(
                                        type="text",
                                        text=(
                                            f"**Alert Triggered!**\n\n"
                                            f"**{alert['token']}** price is now "
                                            f"{condition} {threshold} FET\n"
                                            f"Current price: {current_price} FET\n\n"
                                            f"Alert #{alert['id']} has been deactivated.\n"
                                            f"Set a new alert with: 'watch {alert['token']} "
                                            f"{condition} <new_price>'"
                                        ),
                                    ),
                                    EndSessionContent(type="end-session"),
                                ],
                            ),
                        )
                    except Exception as e:
                        ctx.logger.warning(
                            f"Could not notify {owner[:20]} for alert: {e}"
                        )

            except Exception as e:
                ctx.logger.error(
                    f"[ALERT_CHECK_ERROR] {alert['token']}: {e}"
                )


# ==============================================================================
# PERIODIC HEALTH LOG
# ==============================================================================


@agent.on_interval(period=3600)
async def periodic_health(ctx: Context):
    status = health.status()
    stats = get_stats(ctx)
    owners = _get(ctx, "alert_owners", [])
    total_alerts = sum(
        len([a for a in _get(ctx, f"alerts_{o}", []) if a["active"]])
        for o in owners
    )
    ctx.logger.info(
        f"[HEALTH] {json.dumps(status)} | "
        f"active_alerts={total_alerts} users={len(owners)}"
    )


agent.include(chat_proto, publish_manifest=True)

if __name__ == "__main__":
    agent.run()
