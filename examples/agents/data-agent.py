"""
Data Agent ($DATA) — On-Chain & Market Data Oracle

P3-003: Structured on-chain and market data queries for the agent economy.
Users query token prices, holder counts, volume, and trends.

Tiers:
- Free: Basic price lookups, 5 queries/hour
- Premium ($DATA holders): Historical data, portfolio tracking,
  custom alerts, unlimited queries

Uses AgentLaunch API to fetch token data: GET /api/agents/token/{address}

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

# Token address for $DATA on AgentLaunch
TOKEN_ADDRESS = os.environ.get("DATA_TOKEN_ADDRESS", "")

BUSINESS = {
    "name": "Data Agent",
    "ticker": "$DATA",
    "description": "On-chain and market data oracle for the agent economy",
    "version": "1.0.0",
    "domain": "data",
    # Revenue model
    "free_queries_per_hour": 5,
    "premium_token_threshold": 1000,  # Hold 1000 $DATA = premium
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
    """Check if user holds enough $DATA tokens for premium tier."""
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
# HOURLY RATE LIMITING (free: 5/hour, premium: unlimited)
# ==============================================================================


def check_hourly_quota(ctx, sender: str, tier: str) -> tuple:
    if tier == "premium":
        return True, None

    now = datetime.utcnow()
    key = f"hourly_{sender}"
    times = _get(ctx, key, [])

    cutoff = (now - timedelta(hours=1)).timestamp()
    times = [t for t in times if t > cutoff]

    if len(times) >= BUSINESS["free_queries_per_hour"]:
        return False, (
            f"Free tier limit: {BUSINESS['free_queries_per_hour']} queries/hour.\n\n"
            f"Hold {BUSINESS['premium_token_threshold']} {BUSINESS['ticker']} "
            f"for unlimited access + historical data + portfolio tracking!"
        )

    times.append(now.timestamp())
    _set(ctx, key, times)
    return True, None


# ==============================================================================
# AGENTLAUNCH DATA FETCHER
# ==============================================================================


class DataFetcher:
    """Fetch token and market data from AgentLaunch API."""

    def __init__(self, cache: Cache) -> None:
        self._cache = cache

    def get_token_data(self, address: str) -> Optional[Dict]:
        """Fetch token details from AgentLaunch API."""
        cache_key = f"token:{address}"
        cached = self._cache.get(cache_key)
        if cached is not None:
            return cached

        try:
            r = requests.get(
                f"{AGENTLAUNCH_API}/agents/token/{address}",
                timeout=10,
            )
            if r.status_code == 200:
                data = r.json()
                if data.get("success") and data.get("data"):
                    self._cache.set(cache_key, data["data"], ttl=60)
                    return data["data"]
        except Exception:
            pass
        return None

    def get_all_tokens(self) -> List[Dict]:
        """Fetch all tokens from AgentLaunch API."""
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

    def get_trending(self) -> List[Dict]:
        """Get trending tokens sorted by recent volume."""
        tokens = self.get_all_tokens()
        # Sort by market cap or volume if available
        return sorted(
            tokens,
            key=lambda t: float(t.get("marketCap", 0) or 0),
            reverse=True,
        )[:10]


# ==============================================================================
# STATS
# ==============================================================================


def get_stats(ctx) -> dict:
    return _get(ctx, "stats", {"queries_served": 0})


def record_query(ctx):
    stats = get_stats(ctx)
    stats["queries_served"] = stats.get("queries_served", 0) + 1
    _set(ctx, "stats", stats)


# ==============================================================================
# INTENT DETECTION
# ==============================================================================


def detect_intent(text: str) -> tuple:
    """Detect data query intent. Returns (intent, subject)."""
    t = text.lower().strip()

    # Price lookup
    if any(w in t for w in ["price", "cost", "worth", "value of"]):
        subject = re.sub(r"^.*?(?:price|cost|worth|value)\s*(?:of|for)?\s*", "", t, flags=re.I).strip()
        return "price", subject

    # Holder info
    if any(w in t for w in ["holders", "holder count", "who holds", "top holders"]):
        subject = re.sub(r"^.*?(?:holders?|who holds|top holders)\s*(?:of|for)?\s*", "", t, flags=re.I).strip()
        return "holders", subject

    # Volume
    if any(w in t for w in ["volume", "traded", "trading volume"]):
        subject = re.sub(r"^.*?(?:volume|traded|trading volume)\s*(?:of|for)?\s*", "", t, flags=re.I).strip()
        return "volume", subject

    # Trending
    if any(w in t for w in ["trending", "top tokens", "hot", "popular", "best performing"]):
        return "trending", ""

    # Token details (catch-all for addresses)
    address_match = re.search(r"(0x[a-fA-F0-9]{40})", t)
    if address_match:
        return "token_detail", address_match.group(1)

    # Portfolio (premium)
    if any(w in t for w in ["portfolio", "my tokens", "my holdings", "my positions"]):
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

    # Default: try to find a token name
    return "price", t


# ==============================================================================
# DATA FORMATTING
# ==============================================================================


def format_token_price(token: Dict) -> str:
    """Format token data into a readable price response."""
    name = token.get("name", "Unknown")
    symbol = token.get("symbol", "???")
    price = token.get("currentPrice", "N/A")
    market_cap = token.get("marketCap", "N/A")
    listed = token.get("listed", False)

    response = (
        f"**{name} ({symbol})**\n\n"
        f"Price: {price} FET\n"
        f"Market Cap: {market_cap} FET\n"
        f"Status: {'Listed on DEX' if listed else 'Bonding curve'}\n"
    )

    if not listed:
        remaining = token.get("remainingAmount", "N/A")
        target = "30,000 FET"
        response += f"Graduation target: {target}\n"
        if remaining != "N/A":
            response += f"Tokens remaining: {remaining}\n"

    return response


def format_token_holders(token: Dict) -> str:
    """Format holder information."""
    name = token.get("name", "Unknown")
    symbol = token.get("symbol", "???")
    holder_count = token.get("holderCount", "N/A")

    return (
        f"**{name} ({symbol}) Holders**\n\n"
        f"Total holders: {holder_count}\n"
    )


def format_trending(tokens: List[Dict]) -> str:
    """Format trending tokens list."""
    if not tokens:
        return "No trending tokens found. The platform may be loading."

    lines = ["**Trending Tokens on AgentLaunch**\n"]
    for i, token in enumerate(tokens[:10], 1):
        name = token.get("name", "Unknown")
        symbol = token.get("symbol", "???")
        market_cap = token.get("marketCap", "0")
        lines.append(f"{i}. **{name}** ({symbol}) -- MC: {market_cap} FET")

    return "\n".join(lines)


# ==============================================================================
# RESOLVE TOKEN -- find token by name, symbol, or address
# ==============================================================================


def resolve_token(subject: str, fetcher: DataFetcher) -> Optional[Dict]:
    """Try to find a token by address, symbol, or name."""
    subject = subject.strip()

    # Direct address lookup
    if subject.startswith("0x") and len(subject) == 42:
        return fetcher.get_token_data(subject)

    # Search through all tokens
    tokens = fetcher.get_all_tokens()
    subject_lower = subject.lower()

    for token in tokens:
        if token.get("symbol", "").lower() == subject_lower:
            return token
        if token.get("name", "").lower() == subject_lower:
            return token

    # Fuzzy match
    for token in tokens:
        if subject_lower in token.get("name", "").lower():
            return token
        if subject_lower in token.get("symbol", "").lower():
            return token

    return None


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

    ctx.logger.info(f"[Data Agent] {sender[:16]}: {text[:60]}")

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

    intent, subject = detect_intent(clean)

    # --- Help ---
    if intent == "help":
        tier = check_token_holdings(sender, cache)
        await reply(
            ctx, sender,
            f"**{BUSINESS['name']}** v{BUSINESS['version']}\n\n"
            f"{BUSINESS['description']}\n\n"
            f"Your tier: **{tier.upper()}**\n\n"
            f"**Commands:**\n"
            f"- 'price <token>' -- Current token price\n"
            f"- 'holders <token>' -- Holder count\n"
            f"- 'volume <token>' -- Trading volume\n"
            f"- 'trending' -- Top tokens by market cap\n"
            f"- 'portfolio' -- Your holdings (premium)\n"
            f"- '0x...' -- Lookup by contract address\n"
            f"- 'status' -- Agent health stats\n"
            f"- 'tokenize' -- Create $DATA token (owner only)\n\n"
            f"**Free tier:** {BUSINESS['free_queries_per_hour']} queries/hour, basic lookups\n"
            f"**Premium:** Hold {BUSINESS['premium_token_threshold']} {BUSINESS['ticker']} "
            f"for unlimited queries + historical data + portfolio tracking",
        )
        return

    # --- Greeting ---
    if intent == "greeting":
        await reply(
            ctx, sender,
            f"Hey! I'm the **Data Agent** -- your on-chain data oracle.\n\n"
            f"Try:\n"
            f"- 'price FET'\n"
            f"- 'trending'\n"
            f"- 'holders 0x...'\n\n"
            f"Say 'help' for all commands.",
        )
        return

    # --- Status ---
    if intent == "status":
        status = health.status()
        stats = get_stats(ctx)
        await reply(
            ctx, sender,
            f"**Data Agent Status**\n\n"
            f"**Health:** {status['status']}\n"
            f"Uptime: {status['uptime_seconds']}s | "
            f"Requests: {status['requests']} | "
            f"Error rate: {status['error_rate']}\n\n"
            f"**Stats:**\n"
            f"- Queries served: {stats.get('queries_served', 0)}\n",
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

    # --- Data queries (token-gated) ---
    tier = check_token_holdings(sender, cache)

    # Portfolio is premium-only
    if intent == "portfolio" and tier != "premium":
        await reply(
            ctx, sender,
            f"Portfolio tracking is a premium feature.\n\n"
            f"Hold {BUSINESS['premium_token_threshold']} {BUSINESS['ticker']} "
            f"to unlock portfolio tracking, historical data, and unlimited queries!",
            end=True,
        )
        return

    # Hourly quota check
    allowed, quota_error = check_hourly_quota(ctx, sender, tier)
    if not allowed:
        health.record(False)
        await reply(ctx, sender, quota_error, end=True)
        return

    # Process data query
    try:
        if intent == "trending":
            tokens = fetcher.get_trending()
            response = format_trending(tokens)
            record_query(ctx)
            health.record(True)

        elif intent == "portfolio":
            # Premium: show user's token holdings
            tokens = fetcher.get_all_tokens()
            response = (
                f"**Your Portfolio**\n\n"
                f"Scanning {len(tokens)} tokens on AgentLaunch...\n\n"
                f"*Portfolio tracking uses your agent address to check holdings "
                f"across all AgentLaunch tokens. Full portfolio data requires "
                f"on-chain indexing -- coming soon.*"
            )
            record_query(ctx)
            health.record(True)

        elif intent == "token_detail":
            token = fetcher.get_token_data(subject)
            if token:
                response = format_token_price(token)
                if tier == "premium":
                    response += (
                        f"\n**Premium Data:**\n"
                        f"Created: {token.get('createdAt', 'N/A')}\n"
                        f"Chain: {token.get('chainId', 'N/A')}\n"
                        f"Address: {token.get('address', 'N/A')}\n"
                    )
            else:
                response = f"Token not found: {subject}"
            record_query(ctx)
            health.record(True)

        else:
            # Price, holders, volume -- resolve token first
            token = resolve_token(subject, fetcher) if subject else None

            if token:
                if intent == "price":
                    response = format_token_price(token)
                elif intent == "holders":
                    response = format_token_holders(token)
                elif intent == "volume":
                    response = (
                        f"**{token.get('name', 'Unknown')} "
                        f"({token.get('symbol', '???')}) Volume**\n\n"
                        f"24h Volume: {token.get('volume24h', 'N/A')} FET\n"
                        f"Total trades: {token.get('tradeCount', 'N/A')}\n"
                    )
                else:
                    response = format_token_price(token)

                if tier == "premium":
                    response += (
                        f"\n**Premium:** Full historical data and charts "
                        f"at https://agent-launch.ai/token/"
                        f"{token.get('address', '')}\n"
                    )
            else:
                response = (
                    f"Token '{subject}' not found on AgentLaunch.\n\n"
                    f"Try:\n"
                    f"- Use the exact token name or symbol\n"
                    f"- Paste the contract address (0x...)\n"
                    f"- Say 'trending' to see available tokens"
                )

            record_query(ctx)
            health.record(True)

        if tier == "free" and intent not in ("trending",):
            response += (
                f"\n\n---\n"
                f"*Basic lookup. Hold {BUSINESS['premium_token_threshold']} "
                f"{BUSINESS['ticker']} for historical data + portfolio tracking.*"
            )

    except Exception as e:
        health.record(False)
        ctx.logger.error(f"[DATA_ERROR] {e}")
        response = (
            "Something went wrong fetching data. "
            "Please try again."
        )

    await reply(ctx, sender, response, end=True)


@chat_proto.on_message(ChatAcknowledgement)
async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement):
    ctx.logger.debug(
        f"Ack from {sender[:20]} for msg {msg.acknowledged_msg_id}"
    )


@agent.on_interval(period=3600)
async def periodic_cleanup(ctx: Context):
    status = health.status()
    ctx.logger.info(f"[HEALTH] {json.dumps(status)}")


agent.include(chat_proto, publish_manifest=True)

if __name__ == "__main__":
    agent.run()
