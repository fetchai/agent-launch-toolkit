"""
Research Agent ($RESEARCH) — On-Demand Crypto & Protocol Analysis

P3-001: AI-powered research assistant for the agent economy.
Users ask research questions, agent provides structured analysis.

Tiers:
- Free: Basic analysis (short responses), 5 queries/hour
- Premium ($RESEARCH holders): Detailed reports, historical data,
  premium insights, unlimited queries

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

# Token address for $RESEARCH on AgentLaunch
TOKEN_ADDRESS = os.environ.get("RESEARCH_TOKEN_ADDRESS", "")

BUSINESS = {
    "name": "Research Agent",
    "ticker": "$RESEARCH",
    "description": "AI-powered crypto and protocol research on demand",
    "version": "1.0.0",
    "domain": "research",
    # Revenue model
    "free_queries_per_hour": 5,
    "premium_token_threshold": 1000,  # Hold 1000 $RESEARCH = premium
    # AI
    "ai_model": "mistralai/Mistral-7B-Instruct-v0.2",
    # Security
    "rate_limit_per_minute": 20,
    "max_input_length": 5000,
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
    """Rate limiting, input validation, memory-safe request tracking."""

    def __init__(self) -> None:
        self._requests: Dict[str, List[float]] = defaultdict(list)
        self._check_count: int = 0

    def check(self, ctx: Context, user_id: str, message: str) -> tuple:
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
# HEALTH
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
# CACHE
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
# AI
# ==============================================================================


class AI:
    """LLM integration with SHA256 response caching."""

    def __init__(self, cache: Cache) -> None:
        self._cache = cache

    def generate(self, prompt: str) -> str:
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
# TOKEN GATING -- Verify $RESEARCH holdings via AgentLaunch API
# ==============================================================================


def verify_agentverse_agent(sender: str) -> bool:
    """Check that sender is a real Agentverse agent (agent1q... address)."""
    return sender.startswith("agent1q") and len(sender) > 20


def check_token_holdings(user_address: str, cache: Cache) -> str:
    """Check if user holds enough $RESEARCH tokens for premium tier."""
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
        pass  # Fall back to free tier on error
    return "free"


# ==============================================================================
# HOURLY RATE LIMITING (free tier: 5/hour, premium: unlimited)
# ==============================================================================


def check_hourly_quota(ctx, sender: str, tier: str) -> tuple:
    """Check hourly query quota. Returns (allowed, error_msg)."""
    if tier == "premium":
        return True, None

    now = datetime.utcnow()
    key = f"hourly_{sender}"
    times = _get(ctx, key, [])

    # Prune entries older than 1 hour
    cutoff = (now - timedelta(hours=1)).timestamp()
    times = [t for t in times if t > cutoff]

    if len(times) >= BUSINESS["free_queries_per_hour"]:
        return False, (
            f"Free tier limit: {BUSINESS['free_queries_per_hour']} queries/hour.\n\n"
            f"Hold {BUSINESS['premium_token_threshold']} {BUSINESS['ticker']} "
            f"tokens for unlimited access!"
        )

    times.append(now.timestamp())
    _set(ctx, key, times)
    return True, None


# ==============================================================================
# TREASURY
# ==============================================================================


def get_treasury_balance(ctx) -> dict:
    return _get(ctx, "treasury", {"queries_served": 0, "premium_users": 0})


def record_query(ctx, tier: str):
    stats = get_treasury_balance(ctx)
    stats["queries_served"] = stats.get("queries_served", 0) + 1
    if tier == "premium":
        stats["premium_users"] = stats.get("premium_users", 0)
    _set(ctx, "treasury", stats)


# ==============================================================================
# INTENT DETECTION
# ==============================================================================


def detect_intent(text: str) -> tuple:
    """Detect research intent and extract topic. Returns (intent, topic)."""
    t = text.lower().strip()

    # Analyze / Research
    if any(w in t for w in ["analyze", "analysis", "analyse"]):
        topic = re.sub(r"^.*?(?:analyze|analysis|analyse)\s*", "", t, flags=re.I).strip()
        return "analyze", topic or "general"

    if any(w in t for w in ["research", "deep dive", "investigate"]):
        topic = re.sub(r"^.*?(?:research|deep dive|investigate)\s*", "", t, flags=re.I).strip()
        return "research", topic or "general"

    # Compare
    if any(w in t for w in ["compare", "versus", " vs "]):
        topic = re.sub(r"^.*?(?:compare|versus|vs)\s*", "", t, flags=re.I).strip()
        return "compare", topic or "general"

    # Report
    if any(w in t for w in ["report", "summary", "overview", "breakdown"]):
        topic = re.sub(r"^.*?(?:report|summary|overview|breakdown)\s*", "", t, flags=re.I).strip()
        return "report", topic or "general"

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

    # Default: treat as research query
    return "research", t


# ==============================================================================
# RESEARCH BUSINESS LOGIC
# ==============================================================================


class ResearchBusiness:
    """Core research logic -- generates analysis based on tier."""

    def __init__(self, ai: AI) -> None:
        self.ai = ai

    def generate_analysis(self, topic: str, intent: str, tier: str) -> str:
        """Generate research analysis. Premium gets deeper analysis."""
        # Sanitize user input for prompt safety
        safe_topic = topic.replace("\n", " ").replace("\\n", " ")[:500]

        if tier == "premium":
            prompt = (
                f"You are a senior crypto research analyst. "
                f"Provide a detailed {intent} on: {safe_topic}\n\n"
                f"Include: key findings, data points, risks, opportunities, "
                f"and a conclusion with actionable insights.\n"
                f"Format with markdown headers and bullet points.\n"
                f"Analyst:"
            )
        else:
            prompt = (
                f"You are a crypto research assistant. "
                f"Provide a brief {intent} on: {safe_topic}\n\n"
                f"Keep it concise (3-4 sentences). "
                f"Mention that detailed reports are available for token holders.\n"
                f"Assistant:"
            )

        return self.ai.generate(prompt)

    def generate_comparison(self, topic: str, tier: str) -> str:
        """Generate a comparison analysis."""
        safe_topic = topic.replace("\n", " ").replace("\\n", " ")[:500]

        if tier == "premium":
            prompt = (
                f"You are a senior crypto analyst. "
                f"Compare: {safe_topic}\n\n"
                f"Include: technology, tokenomics, team, ecosystem, "
                f"market position, and a final verdict.\n"
                f"Format as a structured comparison with pros/cons.\n"
                f"Analyst:"
            )
        else:
            prompt = (
                f"You are a crypto research assistant. "
                f"Briefly compare: {safe_topic}\n\n"
                f"Give a high-level 2-3 sentence comparison. "
                f"Mention detailed comparisons are available for token holders.\n"
                f"Assistant:"
            )

        return self.ai.generate(prompt)


# ==============================================================================
# AGENTLAUNCH INTEGRATION
# ==============================================================================


class AgentLaunch:
    """Create and manage tokens on AgentLaunch."""

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
ai = AI(cache)
research = ResearchBusiness(ai)


# ==============================================================================
# MESSAGE HANDLER
# ==============================================================================


@chat_proto.on_message(ChatMessage)
async def handle_chat(ctx: Context, sender: str, msg: ChatMessage):
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

    # Extract text
    text = " ".join(
        item.text for item in msg.content if isinstance(item, TextContent)
    ).strip()
    text = text[:BUSINESS["max_input_length"]]

    ctx.logger.info(f"[Research Agent] {sender[:16]}: {text[:60]}")

    # Verify sender is real agent
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

    intent, topic = detect_intent(clean)

    # --- Help ---
    if intent == "help":
        tier = check_token_holdings(sender, cache)
        await reply(
            ctx, sender,
            f"**{BUSINESS['name']}** v{BUSINESS['version']}\n\n"
            f"{BUSINESS['description']}\n\n"
            f"Your tier: **{tier.upper()}**\n\n"
            f"**Commands:**\n"
            f"- 'analyze <topic>' -- Get analysis on any crypto topic\n"
            f"- 'research <protocol>' -- Deep dive into a protocol\n"
            f"- 'compare <A> vs <B>' -- Side-by-side comparison\n"
            f"- 'report <topic>' -- Summary report\n"
            f"- 'status' -- Agent health stats\n"
            f"- 'tokenize' -- Create $RESEARCH token (owner only)\n\n"
            f"**Free tier:** {BUSINESS['free_queries_per_hour']} queries/hour, basic analysis\n"
            f"**Premium:** Hold {BUSINESS['premium_token_threshold']} {BUSINESS['ticker']} "
            f"for unlimited queries + detailed reports",
        )
        return

    # --- Greeting ---
    if intent == "greeting":
        await reply(
            ctx, sender,
            f"Hey! I'm the **Research Agent** -- your on-demand crypto analyst.\n\n"
            f"Try:\n"
            f"- 'analyze Fetch.ai ecosystem'\n"
            f"- 'compare Uniswap vs SushiSwap'\n"
            f"- 'research DeFi lending protocols'\n\n"
            f"Say 'help' for all commands.",
        )
        return

    # --- Status ---
    if intent == "status":
        status = health.status()
        stats = get_treasury_balance(ctx)
        await reply(
            ctx, sender,
            f"**Research Agent Status**\n\n"
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

    # --- Research queries (token-gated) ---
    tier = check_token_holdings(sender, cache)

    # Hourly quota check
    allowed, quota_error = check_hourly_quota(ctx, sender, tier)
    if not allowed:
        health.record(False)
        await reply(ctx, sender, quota_error, end=True)
        return

    # Generate response based on intent
    try:
        if intent == "compare":
            response = research.generate_comparison(topic, tier)
        else:
            response = research.generate_analysis(topic, intent, tier)

        if not response:
            response = (
                "I couldn't generate a response for that topic. "
                "Try rephrasing your question."
            )

        if tier == "free":
            response += (
                f"\n\n---\n"
                f"*Basic analysis. Hold {BUSINESS['premium_token_threshold']} "
                f"{BUSINESS['ticker']} for detailed reports + unlimited queries.*"
            )

        record_query(ctx, tier)
        health.record(True)

    except Exception as e:
        health.record(False)
        ctx.logger.error(f"[RESEARCH_ERROR] {e}")
        response = (
            "Something went wrong processing your research request. "
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
    """Periodic maintenance: log health status."""
    status = health.status()
    ctx.logger.info(f"[HEALTH] {json.dumps(status)}")


agent.include(chat_proto, publish_manifest=True)

if __name__ == "__main__":
    agent.run()
