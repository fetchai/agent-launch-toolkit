"""
Agent Business Template
For creators building revenue-generating agents on Agentverse + AgentLaunch.

Fork this file to start your agent business.

Layers:
  1. Foundation   - Core logic + Chat Protocol v0.3.0
  2. Security     - Validation + rate limiting + audit logging
  3. Stability    - Error recovery + health checks
  4. Speed        - SHA256 caching + async + optimization
  5. Revenue      - Premium features + token gating
  6. Scale        - Agent discovery + delegation

Security hardened with lessons from FET Gifter (33 fixes applied):
  - UTC timestamps everywhere (no timezone bugs)
  - Prompt injection mitigation (truncation + newline stripping)
  - Memory leak prevention (periodic stale entry cleanup)
  - SHA256 cache keys (bounded memory, no collisions)
  - Typed handler signatures
  - Error handling at every boundary
  - Owner-gated tokenize command
  - Environment variable URLs (no hardcoded endpoints)

Platform constants (source of truth: deployed smart contracts):
  - Deploy fee: 120 FET (read dynamically, can change via multi-sig)
  - Graduation target: 30,000 FET -> auto DEX listing
  - Trading fee: 2% -> 100% to protocol treasury (NO creator fee)
"""

from uagents import Agent, Context, Protocol
from uagents_core.contrib.protocols.chat import (
    ChatAcknowledgement,
    ChatMessage,
    EndSessionContent,
    TextContent,
    chat_protocol_spec,
)

import hashlib
import json
import os
import time
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from uuid import uuid4

import requests


# ==============================================================================
# API CONFIG -- Override via environment variables, never hardcode
# ==============================================================================

AGENTLAUNCH_API = os.environ.get(
    "AGENTLAUNCH_API", "https://agent-launch.ai/api"
)

# ==============================================================================
# BUSINESS CONFIG -- Define your agent business here
# ==============================================================================

OWNER_ADDRESS = os.environ.get("AGENT_OWNER_ADDRESS", "")

BUSINESS = {
    "name": "YourAgent",
    "description": "What your agent does for customers",
    "version": "1.0.0",
    # What it does
    "domain": "your-domain",  # e.g., "research", "trading", "content"
    # Revenue model
    "free_requests_per_day": 10,
    "premium_token_threshold": 1000,  # Hold 1000 tokens = premium access
    # AI (optional -- remove if your agent doesn't use an LLM)
    "ai_model": "mistralai/Mistral-7B-Instruct-v0.2",
    # Security
    "rate_limit_per_minute": 20,
    "max_input_length": 5000,
}


# ==============================================================================
# LAYER 1: FOUNDATION -- Core infrastructure
# ==============================================================================


class Logger:
    """Structured logging with audit trail."""

    @staticmethod
    def info(ctx: Context, event: str, data: Optional[Dict] = None) -> None:
        ctx.logger.info(f"[{event}] {json.dumps(data or {})}")

    @staticmethod
    def audit(
        ctx: Context, user: str, action: str, data: Optional[Dict] = None
    ) -> None:
        ctx.logger.info(
            f"[AUDIT] user={user[:20]} action={action} "
            f"ts={datetime.utcnow().isoformat()}"
        )

    @staticmethod
    def error(ctx: Context, event: str, error: str) -> None:
        ctx.logger.error(f"[{event}] {error}")


# ==============================================================================
# LAYER 2: SECURITY -- Protect your agent
# ==============================================================================


class Security:
    """Rate limiting, input validation, memory-safe request tracking."""

    def __init__(self) -> None:
        self._requests: Dict[str, List[float]] = defaultdict(list)
        self._check_count: int = 0

    def check(
        self, ctx: Context, user_id: str, message: str
    ) -> tuple:
        """Run all security checks. Returns (clean_message, error_string)."""
        now = time.time()

        # Rate limiting -- prune expired entries for this user
        self._requests[user_id] = [
            t for t in self._requests[user_id] if now - t < 60
        ]
        if len(self._requests[user_id]) >= BUSINESS["rate_limit_per_minute"]:
            return None, "Rate limit exceeded. Please wait a moment."
        self._requests[user_id].append(now)

        # Memory cleanup -- periodically remove stale users
        self._check_count += 1
        if self._check_count % 100 == 0:
            stale = [
                k
                for k, v in self._requests.items()
                if not v or (now - max(v)) > 300
            ]
            for k in stale:
                del self._requests[k]

        # Input validation
        if not message or not message.strip():
            return None, "Empty message."
        if len(message) > BUSINESS["max_input_length"]:
            return None, (
                f"Message too long (max {BUSINESS['max_input_length']} chars)."
            )

        return message.strip(), None


# ==============================================================================
# LAYER 3: STABILITY -- Keep it running
# ==============================================================================


class Health:
    """Track uptime, request count, and error rate."""

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
# LAYER 4: SPEED -- Make it fast
# ==============================================================================


class Cache:
    """In-memory TTL cache with SHA256 keys and periodic cleanup."""

    def __init__(self, max_size: int = 1000) -> None:
        self._data: Dict[str, tuple] = {}
        self._max_size: int = max_size

    def get(self, key: str) -> Any:
        if key in self._data:
            value, expires = self._data[key]
            if expires > time.time():
                return value
            # Expired -- remove it
            del self._data[key]
        return None

    def set(self, key: str, value: Any, ttl: int = 300) -> None:
        # Evict oldest entries if at capacity
        if len(self._data) >= self._max_size:
            now = time.time()
            expired = [k for k, (_, exp) in self._data.items() if exp <= now]
            for k in expired:
                del self._data[k]
            # If still full, drop oldest 10%
            if len(self._data) >= self._max_size:
                to_drop = sorted(
                    self._data.items(), key=lambda x: x[1][1]
                )[: self._max_size // 10]
                for k, _ in to_drop:
                    del self._data[k]
        self._data[key] = (value, time.time() + ttl)


class AI:
    """LLM integration with SHA256 response caching."""

    def __init__(self, cache: Cache) -> None:
        self._cache = cache

    def generate(self, prompt: str) -> str:
        # SHA256 cache key -- bounded size, no collisions
        key = hashlib.sha256(prompt.encode()).hexdigest()
        cached = self._cache.get(key)
        if cached is not None:
            return cached

        try:
            r = requests.post(
                f"https://api-inference.huggingface.co/models/{BUSINESS['ai_model']}",
                headers={
                    "Authorization": f"Bearer {os.environ.get('HUGGINGFACE_API_KEY', '')}"
                },
                json={
                    "inputs": prompt,
                    "parameters": {
                        "max_new_tokens": 500,
                        "temperature": 0.7,
                    },
                },
                timeout=30,
            )
            if r.status_code == 200:
                result = r.json()
                if isinstance(result, list) and result:
                    text = result[0].get("generated_text", "")
                    self._cache.set(key, text)
                    return text
        except Exception:
            return (
                "I'm having trouble processing that right now. "
                "Please try again."
            )
        return ""


# ==============================================================================
# LAYER 5: REVENUE -- Token-gated premium features
# ==============================================================================


class Revenue:
    """Track usage quotas and token-gated access tiers."""

    def __init__(self, cache: Cache) -> None:
        self._cache = cache
        self._usage: Dict[str, List[str]] = defaultdict(list)

    def get_tier(self, user_address: str) -> str:
        """Check if user holds enough tokens for premium."""
        cached = self._cache.get(f"tier:{user_address}")
        if cached is not None:
            return cached

        try:
            r = requests.get(
                f"{AGENTLAUNCH_API}/agents/token/{user_address}",
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
                self._cache.set(f"tier:{user_address}", tier, ttl=300)
                return tier
        except Exception:
            pass  # Fall back to free tier on error
        return "free"

    def check_quota(self, user_id: str, tier: str) -> tuple:
        """Check if user has remaining quota. Returns (allowed, error)."""
        today = datetime.utcnow().date().isoformat()

        # Prune old entries to prevent memory growth
        self._usage[user_id] = [
            t for t in self._usage[user_id] if t.startswith(today)
        ]
        today_usage = len(self._usage[user_id])

        limit = 1000 if tier == "premium" else BUSINESS["free_requests_per_day"]
        if today_usage >= limit:
            if tier == "free":
                return False, (
                    f"Free limit reached ({limit}/day). "
                    f"Hold {BUSINESS['premium_token_threshold']} tokens "
                    f"for premium access!"
                )
            return False, f"Daily limit reached ({limit}/day)."

        self._usage[user_id].append(datetime.utcnow().isoformat())
        return True, None


# ==============================================================================
# LAYER 6: SCALE -- Agent discovery and delegation
# ==============================================================================


class Discovery:
    """Find other agents to delegate work to."""

    def __init__(self, cache: Cache) -> None:
        self._cache = cache

    def find_agents(self, capability: str) -> List[Dict]:
        """Find agents with a given capability on Agentverse."""
        cached = self._cache.get(f"agents:{capability}")
        if cached is not None:
            return cached

        try:
            r = requests.get(
                "https://agentverse.ai/v1/almanac/search",
                params={
                    "capability": capability,
                    "verified": True,
                    "limit": 5,
                },
                timeout=10,
            )
            if r.status_code == 200:
                agents = r.json().get("agents", [])
                self._cache.set(f"agents:{capability}", agents, ttl=3600)
                return agents
        except Exception:
            pass
        return []


# ==============================================================================
# AGENTLAUNCH INTEGRATION -- Tokenize your agent
# ==============================================================================


class AgentLaunch:
    """Create and manage tokens on AgentLaunch."""

    @staticmethod
    def tokenize() -> Dict:
        """Create a token for this agent. Owner-gated in the handler."""
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
# YOUR BUSINESS LOGIC -- Customize this section
# ==============================================================================


class YourBusiness:
    """
    YOUR CODE GOES HERE.

    The infrastructure above handles security, stability, speed, and revenue.
    You focus on what makes your agent valuable.

    The pattern from FET Gifter:
      Agent + Wallet + Chat + Value Exchange = Economy

    What value does YOUR agent exchange?
    """

    def __init__(self, ai: AI, discovery: Discovery) -> None:
        self.ai = ai
        self.discovery = discovery

    async def handle(
        self, ctx: Context, user_id: str, message: str, tier: str
    ) -> str:
        """
        Handle a customer request. CUSTOMIZE THIS for your business.

        Args:
            ctx: Agent context for logging and storage.
            user_id: Sender's agent address (agent1q...).
            message: Sanitized user message.
            tier: "free" or "premium" based on token holdings.

        Returns:
            Response text to send back.
        """
        # Sanitize user input for prompt safety --
        # strip newlines to prevent prompt injection
        safe_message = message.replace("\n", " ").replace("\\n", " ")[:500]

        prompt = (
            f"You are {BUSINESS['name']}, "
            f"an AI assistant for {BUSINESS['domain']}.\n"
            f"User tier: {tier}\n"
            f"User message: {safe_message}\n"
            f"Assistant:"
        )

        response = self.ai.generate(prompt)

        if tier == "free":
            response += (
                f"\n\n-- Hold {BUSINESS['premium_token_threshold']} "
                f"tokens for premium access! --"
            )

        return response


# ==============================================================================
# REPLY HELPER
# ==============================================================================


async def reply(
    ctx: Context,
    sender: str,
    text: str,
    end: bool = False,
) -> None:
    """Send a chat message back to the sender."""
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
# MAIN AGENT -- Wire everything together
# ==============================================================================

# Initialize layers
cache = Cache(max_size=1000)
security = Security()
health = Health()
revenue = Revenue(cache)
ai = AI(cache)
discovery = Discovery(cache)
business = YourBusiness(ai, discovery)

# Create agent and chat protocol
agent = Agent()
chat_proto = Protocol(spec=chat_protocol_spec)


@chat_proto.on_message(ChatMessage)
async def handle_chat(ctx: Context, sender: str, msg: ChatMessage) -> None:
    """Main message handler -- routes through all 6 layers."""

    # Acknowledge receipt (Chat Protocol v0.3.0 requirement)
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

    # Extract text from message content
    text = " ".join(
        item.text for item in msg.content if isinstance(item, TextContent)
    ).strip()

    # Truncate to prevent memory pressure
    text = text[:BUSINESS["max_input_length"]]

    # Layer 2: Security check
    clean, error = security.check(ctx, sender, text)
    if error:
        health.record(False)
        await reply(ctx, sender, error, end=True)
        return

    Logger.audit(ctx, sender, "request")

    # Built-in commands
    lower = clean.lower()

    if lower in ("help", "?"):
        tier = revenue.get_tier(sender)
        response = (
            f"**{BUSINESS['name']}** v{BUSINESS['version']}\n\n"
            f"{BUSINESS['description']}\n\n"
            f"Your tier: {tier.upper()}\n\n"
            f"Commands: help, status, tokenize"
        )
        await reply(ctx, sender, response)
        return

    if lower == "status":
        status = health.status()
        response = (
            f"**Status:** {status['status']}\n"
            f"Uptime: {status['uptime_seconds']}s | "
            f"Requests: {status['requests']} | "
            f"Error rate: {status['error_rate']}"
        )
        await reply(ctx, sender, response)
        return

    if "tokenize" in lower:
        # Owner-gated: only the agent owner can trigger tokenization
        if OWNER_ADDRESS and sender != OWNER_ADDRESS:
            await reply(
                ctx,
                sender,
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

    # Layer 5: Revenue check
    tier = revenue.get_tier(sender)
    allowed, quota_error = revenue.check_quota(sender, tier)
    if not allowed:
        health.record(False)
        await reply(ctx, sender, quota_error, end=True)
        return

    # Your business logic
    try:
        response = await business.handle(ctx, sender, clean, tier)
        health.record(True)
    except Exception as e:
        health.record(False)
        Logger.error(ctx, "business_handle", str(e))
        response = (
            "Something went wrong processing your request. "
            "Please try again."
        )

    await reply(ctx, sender, response, end=True)


@chat_proto.on_message(ChatAcknowledgement)
async def handle_ack(
    ctx: Context, sender: str, msg: ChatAcknowledgement
) -> None:
    """Handle acknowledgements (required by Chat Protocol)."""
    ctx.logger.debug(
        f"Ack from {sender[:20]} for msg {msg.acknowledged_msg_id}"
    )


# Periodic cleanup -- runs every hour
@agent.on_interval(period=3600)
async def periodic_cleanup(ctx: Context) -> None:
    """Periodic maintenance: log health status."""
    status = health.status()
    ctx.logger.info(f"[HEALTH] {json.dumps(status)}")


agent.include(chat_proto, publish_manifest=True)

if __name__ == "__main__":
    agent.run()
