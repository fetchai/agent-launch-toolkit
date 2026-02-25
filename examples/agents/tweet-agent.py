"""
Tweet Agent ($TWEET) — AI Social Media Content Creator

P3-002: Crafts social media posts, threads, and engagement strategies.
Users provide topics, agent generates polished social content.

Tiers:
- Free: 3 tweets/day
- Premium ($TWEET holders): Unlimited tweets, thread generation,
  engagement analysis, 50/day cap

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

# Token address for $TWEET on AgentLaunch
TOKEN_ADDRESS = os.environ.get("TWEET_TOKEN_ADDRESS", "")

BUSINESS = {
    "name": "Tweet Agent",
    "ticker": "$TWEET",
    "description": "AI-powered social media content creation for crypto projects",
    "version": "1.0.0",
    "domain": "content",
    # Revenue model
    "free_tweets_per_day": 3,
    "premium_tweets_per_day": 50,
    "premium_token_threshold": 1000,  # Hold 1000 $TWEET = premium
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
# AI
# ==============================================================================


class AI:
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
                        "temperature": 0.8,
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
                "I'm having trouble generating content right now. "
                "Please try again."
            )
        return ""


# ==============================================================================
# TOKEN GATING
# ==============================================================================


def verify_agentverse_agent(sender: str) -> bool:
    return sender.startswith("agent1q") and len(sender) > 20


def check_token_holdings(user_address: str, cache: Cache) -> str:
    """Check if user holds enough $TWEET tokens for premium tier."""
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
# DAILY QUOTA (free: 3/day, premium: 50/day)
# ==============================================================================


def check_daily_quota(ctx, sender: str, tier: str) -> tuple:
    """Check daily tweet generation quota. Returns (allowed, error_msg)."""
    today = datetime.utcnow().date().isoformat()
    key = f"daily_{sender}_{today}"
    count = _get(ctx, key, 0)

    if tier == "premium":
        limit = BUSINESS["premium_tweets_per_day"]
    else:
        limit = BUSINESS["free_tweets_per_day"]

    if count >= limit:
        if tier == "free":
            return False, (
                f"Free tier limit: {limit} tweets/day.\n\n"
                f"Hold {BUSINESS['premium_token_threshold']} {BUSINESS['ticker']} "
                f"for {BUSINESS['premium_tweets_per_day']} tweets/day + threads!"
            )
        return False, f"Daily limit reached ({limit}/day). Reset at midnight UTC."

    _set(ctx, key, count + 1)
    return True, None


# ==============================================================================
# STATS
# ==============================================================================


def get_stats(ctx) -> dict:
    return _get(ctx, "stats", {"tweets_generated": 0, "threads_generated": 0})


def record_generation(ctx, content_type: str):
    stats = get_stats(ctx)
    key = f"{content_type}s_generated"
    stats[key] = stats.get(key, 0) + 1
    _set(ctx, "stats", stats)


# ==============================================================================
# INTENT DETECTION
# ==============================================================================


def detect_intent(text: str) -> tuple:
    """Detect tweet intent and extract topic. Returns (intent, topic)."""
    t = text.lower().strip()

    # Thread generation (premium)
    if any(w in t for w in ["thread", "tweetstorm", "thread about"]):
        topic = re.sub(r"^.*?(?:thread|tweetstorm)\s*(?:about|on)?\s*", "", t, flags=re.I).strip()
        return "thread", topic or "general"

    # Tweet generation
    if any(w in t for w in ["tweet about", "tweet on", "post about", "write a tweet"]):
        topic = re.sub(r"^.*?(?:tweet|post)\s*(?:about|on)?\s*", "", t, flags=re.I).strip()
        return "tweet", topic or "general"

    # Reply crafting
    if any(w in t for w in ["reply to", "respond to", "clap back"]):
        topic = re.sub(r"^.*?(?:reply to|respond to|clap back)\s*", "", t, flags=re.I).strip()
        return "reply", topic or ""

    # Viral / engagement
    if any(w in t for w in ["viral", "engagement", "hook", "banger"]):
        topic = re.sub(r"^.*?(?:viral|engagement|hook|banger)\s*(?:about|on|for)?\s*", "", t, flags=re.I).strip()
        return "viral", topic or "general"

    # Help
    if any(w in t for w in ["help", "what can", "how does", "?"]) or t == "help":
        return "help", ""

    # Status
    if any(w in t for w in ["status", "stats"]):
        return "status", ""

    # Tokenize
    if "tokenize" in t:
        return "tokenize", ""

    # Greeting
    if len(t) < 20 and any(w in t for w in ["hi", "hello", "hey", "yo", "sup"]):
        return "greeting", ""

    # Default: treat as tweet request
    return "tweet", t


# ==============================================================================
# TWEET BUSINESS LOGIC
# ==============================================================================


class TweetBusiness:
    """Core content generation logic."""

    def __init__(self, ai: AI) -> None:
        self.ai = ai

    def generate_tweet(self, topic: str, tier: str) -> str:
        safe_topic = topic.replace("\n", " ").replace("\\n", " ")[:500]

        prompt = (
            f"You are a top crypto Twitter ghostwriter. "
            f"Write a single tweet (max 280 chars) about: {safe_topic}\n\n"
            f"Rules:\n"
            f"- Must be under 280 characters\n"
            f"- Be punchy, memorable, quotable\n"
            f"- Use crypto/web3 tone\n"
            f"- Include 1-2 relevant hashtags\n"
            f"- No generic fluff\n"
            f"Tweet:"
        )
        return self.ai.generate(prompt)

    def generate_thread(self, topic: str) -> str:
        safe_topic = topic.replace("\n", " ").replace("\\n", " ")[:500]

        prompt = (
            f"You are a top crypto Twitter ghostwriter. "
            f"Write a 5-tweet thread about: {safe_topic}\n\n"
            f"Rules:\n"
            f"- Tweet 1: Hook that stops the scroll\n"
            f"- Tweets 2-4: Key insights, data, or arguments\n"
            f"- Tweet 5: Call to action or takeaway\n"
            f"- Each tweet under 280 chars\n"
            f"- Number each tweet (1/5, 2/5, etc.)\n"
            f"- Crypto/web3 tone\n"
            f"Thread:"
        )
        return self.ai.generate(prompt)

    def generate_reply(self, context: str) -> str:
        safe_context = context.replace("\n", " ").replace("\\n", " ")[:500]

        prompt = (
            f"You are a crypto Twitter engagement expert. "
            f"Write a witty, insightful reply to: {safe_context}\n\n"
            f"Rules:\n"
            f"- Under 280 characters\n"
            f"- Add value or humor\n"
            f"- Don't be sycophantic\n"
            f"- Crypto-native tone\n"
            f"Reply:"
        )
        return self.ai.generate(prompt)

    def generate_viral(self, topic: str) -> str:
        safe_topic = topic.replace("\n", " ").replace("\\n", " ")[:500]

        prompt = (
            f"You are a viral content strategist for crypto Twitter. "
            f"Create a high-engagement tweet about: {safe_topic}\n\n"
            f"Rules:\n"
            f"- Use a proven viral format (hot take, contrarian view, "
            f"list, prediction, or story)\n"
            f"- Under 280 characters\n"
            f"- Designed to maximize quote tweets and replies\n"
            f"- Bold but defensible\n"
            f"Tweet:"
        )
        return self.ai.generate(prompt)


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
ai = AI(cache)
tweets = TweetBusiness(ai)


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

    ctx.logger.info(f"[Tweet Agent] {sender[:16]}: {text[:60]}")

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
            f"- 'tweet about <topic>' -- Generate a tweet\n"
            f"- 'thread <topic>' -- Generate a 5-tweet thread (premium)\n"
            f"- 'reply to <context>' -- Craft a reply\n"
            f"- 'viral <topic>' -- High-engagement content\n"
            f"- 'status' -- Agent stats\n"
            f"- 'tokenize' -- Create $TWEET token (owner only)\n\n"
            f"**Free tier:** {BUSINESS['free_tweets_per_day']} tweets/day\n"
            f"**Premium:** Hold {BUSINESS['premium_token_threshold']} {BUSINESS['ticker']} "
            f"for {BUSINESS['premium_tweets_per_day']}/day + threads + viral strategies",
        )
        return

    # --- Greeting ---
    if intent == "greeting":
        await reply(
            ctx, sender,
            f"Hey! I'm the **Tweet Agent** -- your AI ghostwriter for crypto Twitter.\n\n"
            f"Try:\n"
            f"- 'tweet about DeFi summer'\n"
            f"- 'viral AI agents are the future'\n"
            f"- 'thread on why Fetch.ai will dominate'\n\n"
            f"Say 'help' for all commands.",
        )
        return

    # --- Status ---
    if intent == "status":
        status = health.status()
        stats = get_stats(ctx)
        await reply(
            ctx, sender,
            f"**Tweet Agent Status**\n\n"
            f"**Health:** {status['status']}\n"
            f"Uptime: {status['uptime_seconds']}s | "
            f"Requests: {status['requests']} | "
            f"Error rate: {status['error_rate']}\n\n"
            f"**Stats:**\n"
            f"- Tweets generated: {stats.get('tweets_generated', 0)}\n"
            f"- Threads generated: {stats.get('threads_generated', 0)}\n",
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

    # --- Content generation (token-gated) ---
    tier = check_token_holdings(sender, cache)

    # Thread is premium-only
    if intent == "thread" and tier != "premium":
        await reply(
            ctx, sender,
            f"Thread generation is a premium feature.\n\n"
            f"Hold {BUSINESS['premium_token_threshold']} {BUSINESS['ticker']} "
            f"to unlock threads, viral strategies, and "
            f"{BUSINESS['premium_tweets_per_day']} tweets/day!\n\n"
            f"I can still write you a single tweet. Try: 'tweet about {topic}'",
            end=True,
        )
        return

    # Daily quota check
    allowed, quota_error = check_daily_quota(ctx, sender, tier)
    if not allowed:
        health.record(False)
        await reply(ctx, sender, quota_error, end=True)
        return

    # Generate content
    try:
        if intent == "thread":
            response = tweets.generate_thread(topic)
            record_generation(ctx, "thread")
        elif intent == "reply":
            response = tweets.generate_reply(topic)
            record_generation(ctx, "tweet")
        elif intent == "viral":
            response = tweets.generate_viral(topic)
            record_generation(ctx, "tweet")
        else:
            response = tweets.generate_tweet(topic, tier)
            record_generation(ctx, "tweet")

        if not response:
            response = (
                "I couldn't generate content for that topic. "
                "Try rephrasing or being more specific."
            )

        if tier == "free":
            today = datetime.utcnow().date().isoformat()
            key = f"daily_{sender}_{today}"
            used = _get(ctx, key, 0)
            remaining = max(0, BUSINESS["free_tweets_per_day"] - used)
            response += (
                f"\n\n---\n"
                f"*{remaining} free tweets remaining today. "
                f"Hold {BUSINESS['premium_token_threshold']} {BUSINESS['ticker']} "
                f"for {BUSINESS['premium_tweets_per_day']}/day + premium features.*"
            )

        health.record(True)

    except Exception as e:
        health.record(False)
        ctx.logger.error(f"[TWEET_ERROR] {e}")
        response = (
            "Something went wrong generating your content. "
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
