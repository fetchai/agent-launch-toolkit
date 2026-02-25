"""
Agent-to-Agent Trading Example
Phase 4: Agents discovering, evaluating, and trading each other's tokens.

This example shows two agents that:
  1. Discover each other's tokens via the AgentLaunch API
  2. Evaluate whether to invest (holder count, volume, capabilities)
  3. Communicate trading intent via Chat Protocol v0.3.0
  4. Generate trade links for execution
  5. Track cross-holdings and form economic relationships

Uses:
  - AgentLaunch API: GET /api/agents/tokens, GET /api/agents/token/{address}
  - Chat Protocol v0.3.0: ChatMessage, ChatAcknowledgement
  - Trade links: https://agent-launch.ai/trade/{address}?action=buy&amount=100

Platform constants (source of truth: deployed smart contracts):
  - Deploy fee: 120 FET (read dynamically, can change via multi-sig)
  - Graduation target: 30,000 FET -> auto DEX listing
  - Trading fee: 2% -> 100% to protocol treasury (NO creator fee)
"""

import hashlib
import json
import os
import time
from collections import defaultdict
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import uuid4

import requests
from uagents import Agent, Context, Protocol
from uagents_core.contrib.protocols.chat import (
    ChatAcknowledgement,
    ChatMessage,
    EndSessionContent,
    TextContent,
    chat_protocol_spec,
)

# ==============================================================================
# CONFIG
# ==============================================================================

AGENTLAUNCH_API = os.environ.get(
    "AGENTLAUNCH_API", "https://agent-launch.ai/api"
)
OWNER_ADDRESS = os.environ.get("AGENT_OWNER_ADDRESS", "")

# This agent's token (set after tokenization)
MY_TOKEN_ADDRESS = os.environ.get("MY_TOKEN_ADDRESS", "")

# Trading parameters
MAX_BUY_AMOUNT_FET = 500       # Max FET per trade
MIN_HOLDERS_TO_BUY = 3         # Minimum holders before buying
MIN_VOLUME_TO_BUY = 100        # Minimum 24h volume (FET)
EVALUATION_INTERVAL = 3600     # Re-evaluate tokens every hour
TRADE_RATE_LIMIT_PER_HOUR = 5  # Max trade proposals per hour

# Agent identity
AGENT_CONFIG = {
    "name": "TradingAgent",
    "description": "Discovers and trades other agents' tokens on AgentLaunch",
    "domain": "agent-trading",
    "version": "1.0.0",
}


# ==============================================================================
# TOKEN DISCOVERY
# ==============================================================================


class TokenDiscovery:
    """Discover tokens on the AgentLaunch platform."""

    def __init__(self) -> None:
        self._cache: Dict[str, tuple] = {}  # key -> (value, expires)

    def _get_cached(self, key: str) -> Any:
        if key in self._cache:
            value, expires = self._cache[key]
            if expires > time.time():
                return value
            del self._cache[key]
        return None

    def _set_cached(self, key: str, value: Any, ttl: int = 300) -> None:
        self._cache[key] = (value, time.time() + ttl)

    def list_tokens(self) -> List[Dict]:
        """List all tokens available on AgentLaunch."""
        cached = self._get_cached("all_tokens")
        if cached is not None:
            return cached

        try:
            r = requests.get(
                f"{AGENTLAUNCH_API}/agents/tokens",
                timeout=10,
            )
            if r.status_code == 200:
                tokens = r.json()
                self._set_cached("all_tokens", tokens, ttl=120)
                return tokens
        except Exception:
            pass
        return []

    def get_token_details(self, token_address: str) -> Optional[Dict]:
        """Get detailed info about a specific token."""
        cache_key = f"token:{token_address}"
        cached = self._get_cached(cache_key)
        if cached is not None:
            return cached

        try:
            r = requests.get(
                f"{AGENTLAUNCH_API}/agents/token/{token_address}",
                timeout=10,
            )
            if r.status_code == 200:
                data = r.json()
                self._set_cached(cache_key, data, ttl=60)
                return data
        except Exception:
            pass
        return None

    def get_holders(self, token_address: str) -> List[Dict]:
        """Get holder list for a token."""
        cache_key = f"holders:{token_address}"
        cached = self._get_cached(cache_key)
        if cached is not None:
            return cached

        try:
            r = requests.get(
                f"{AGENTLAUNCH_API}/agents/token/{token_address}/holders",
                timeout=10,
            )
            if r.status_code == 200:
                holders = r.json()
                self._set_cached(cache_key, holders, ttl=120)
                return holders
        except Exception:
            pass
        return []


# ==============================================================================
# TOKEN EVALUATION
# ==============================================================================


class TokenEvaluator:
    """Evaluate whether a token is worth buying."""

    def evaluate(self, token_details: Dict) -> Dict:
        """
        Score a token on multiple criteria.

        Returns a dict with score (0-100), recommendation, and reasoning.
        """
        score = 0
        reasons = []

        # Holder count (0-25 points)
        holders = token_details.get("holderCount", 0)
        if holders >= 50:
            score += 25
            reasons.append(f"Strong community: {holders} holders")
        elif holders >= MIN_HOLDERS_TO_BUY:
            score += int(holders / 50 * 25)
            reasons.append(f"Growing community: {holders} holders")
        else:
            reasons.append(f"Small community: {holders} holders")

        # Volume (0-25 points)
        volume = token_details.get("volume24h", 0)
        if volume >= 1000:
            score += 25
            reasons.append(f"High volume: {volume} FET/24h")
        elif volume >= MIN_VOLUME_TO_BUY:
            score += int(volume / 1000 * 25)
            reasons.append(f"Active trading: {volume} FET/24h")
        else:
            reasons.append(f"Low volume: {volume} FET/24h")

        # Graduation progress (0-25 points)
        is_listed = token_details.get("isListed", False)
        if is_listed:
            score += 25
            reasons.append("Graduated to DEX (30,000 FET target reached)")
        else:
            remaining = token_details.get("remainingAmount", 0)
            # Guard: remainingAmount only valid when not listed
            if remaining > 0:
                total = 800_000_000  # TOTAL_BUY_TOKENS
                progress = (total - remaining) / total
                points = int(progress * 25)
                score += points
                reasons.append(f"Bonding curve progress: {progress:.0%}")

        # Description quality (0-25 points)
        desc = token_details.get("description", "")
        if len(desc) > 100:
            score += 15
            reasons.append("Detailed description")
        elif len(desc) > 20:
            score += 8
            reasons.append("Basic description")
        else:
            reasons.append("Minimal description")

        # Has logo (bonus)
        if token_details.get("logo") or token_details.get("image"):
            score += 10
            reasons.append("Has logo/image")

        # Cap at 100
        score = min(score, 100)

        # Recommendation
        if score >= 70:
            recommendation = "strong_buy"
        elif score >= 50:
            recommendation = "buy"
        elif score >= 30:
            recommendation = "watch"
        else:
            recommendation = "skip"

        return {
            "score": score,
            "recommendation": recommendation,
            "reasons": reasons,
            "token": token_details.get("address", ""),
            "name": token_details.get("name", ""),
        }


# ==============================================================================
# CROSS-HOLDINGS TRACKER
# ==============================================================================


class CrossHoldings:
    """Track economic relationships via token holdings."""

    def __init__(self, my_token: str) -> None:
        self.my_token = my_token
        self.my_holdings: Dict[str, float] = {}   # token_addr -> amount_spent
        self.my_holders: Dict[str, float] = {}     # agent_addr -> balance
        self.partnerships: Dict[str, Dict] = {}    # agent_addr -> partnership info

    def record_buy(self, token_address: str, amount_fet: float) -> None:
        """Record that we bought a token."""
        prev = self.my_holdings.get(token_address, 0)
        self.my_holdings[token_address] = prev + amount_fet

    def refresh_holders(self, discovery: TokenDiscovery) -> None:
        """Refresh who holds our token."""
        if not self.my_token:
            return
        holders = discovery.get_holders(self.my_token)
        self.my_holders = {
            h.get("address", ""): h.get("balance", 0)
            for h in holders
            if h.get("address")
        }

    def find_mutual_holdings(self) -> List[str]:
        """Find agents where we hold their token AND they hold ours."""
        mutual = []
        for holder_addr in self.my_holders:
            # Check if any of our held tokens belong to this holder
            # This is a simplified check -- in production you would
            # query the API to find tokens created by this holder
            if holder_addr in self.partnerships:
                partner_token = self.partnerships[holder_addr].get("token")
                if partner_token and partner_token in self.my_holdings:
                    mutual.append(holder_addr)
        return mutual

    def register_partnership(
        self, agent_addr: str, token_addr: str, services: str
    ) -> None:
        """Register a partnership with another agent."""
        self.partnerships[agent_addr] = {
            "token": token_addr,
            "services": services,
            "established": datetime.utcnow().isoformat(),
        }

    def summary(self) -> Dict:
        return {
            "tokens_held": len(self.my_holdings),
            "total_invested": sum(self.my_holdings.values()),
            "holders_of_my_token": len(self.my_holders),
            "partnerships": len(self.partnerships),
            "mutual_holdings": len(self.find_mutual_holdings()),
        }


# ==============================================================================
# TRADE MANAGER
# ==============================================================================


class TradeManager:
    """Generate and track trade links."""

    def __init__(self) -> None:
        self._proposals: List[float] = []  # timestamps of proposals

    def can_propose(self) -> bool:
        """Check if we are within rate limits."""
        now = time.time()
        self._proposals = [t for t in self._proposals if now - t < 3600]
        return len(self._proposals) < TRADE_RATE_LIMIT_PER_HOUR

    def generate_buy_link(self, token_address: str, amount_fet: int) -> str:
        """Generate a pre-filled buy link."""
        amount = min(amount_fet, MAX_BUY_AMOUNT_FET)
        return (
            f"https://agent-launch.ai/trade/{token_address}"
            f"?action=buy&amount={amount}"
        )

    def record_proposal(self) -> None:
        """Record that we made a trade proposal."""
        self._proposals.append(time.time())


# ==============================================================================
# INTENT DETECTION
# ==============================================================================


def detect_intent(text: str) -> str:
    """
    Detect the intent of an incoming message.

    Pattern matching on keywords -- fast, deterministic, auditable.
    No LLM needed for routing.
    """
    lower = text.lower().strip()

    if lower in ("help", "?"):
        return "help"
    if lower == "status":
        return "status"
    if "portfolio" in lower or "holdings" in lower:
        return "portfolio"
    if "discover" in lower or "find token" in lower or "list token" in lower:
        return "discover"
    if "evaluate" in lower or "score" in lower or "should i buy" in lower:
        return "evaluate"
    if "trade" in lower or "buy" in lower:
        return "trade"
    if "partner" in lower or "collaborate" in lower or "exchange" in lower:
        return "partner"
    return "unknown"


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
# MAIN AGENT
# ==============================================================================

# Initialize components
discovery = TokenDiscovery()
evaluator = TokenEvaluator()
holdings = CrossHoldings(MY_TOKEN_ADDRESS)
trades = TradeManager()

# Rate limiting
rate_limits: Dict[str, List[float]] = defaultdict(list)
RATE_LIMIT_PER_MINUTE = 10

# Create agent and protocol
agent = Agent()
chat_proto = Protocol(spec=chat_protocol_spec)


@chat_proto.on_message(ChatMessage)
async def handle_chat(ctx: Context, sender: str, msg: ChatMessage) -> None:
    """Main message handler for the trading agent."""

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
        ctx.logger.error(f"Failed to ack {sender[:20]}: {e}")

    # Extract text
    text = " ".join(
        item.text for item in msg.content if isinstance(item, TextContent)
    ).strip()

    # Input validation
    if not text:
        await reply(ctx, sender, "Empty message.", end=True)
        return
    text = text[:5000]  # Truncate

    # Rate limiting
    now = time.time()
    rate_limits[sender] = [t for t in rate_limits[sender] if now - t < 60]
    if len(rate_limits[sender]) >= RATE_LIMIT_PER_MINUTE:
        await reply(ctx, sender, "Rate limit exceeded. Please wait.", end=True)
        return
    rate_limits[sender].append(now)

    # Periodic cleanup of rate limit dict
    if len(rate_limits) > 200:
        stale = [
            k for k, v in rate_limits.items()
            if not v or (now - max(v)) > 300
        ]
        for k in stale:
            del rate_limits[k]

    ctx.logger.info(f"[AUDIT] user={sender[:20]} text={text[:50]}")

    # Route by intent
    intent = detect_intent(text)

    # ── HELP ──────────────────────────────────────────────────────────────
    if intent == "help":
        response = (
            f"**{AGENT_CONFIG['name']}** v{AGENT_CONFIG['version']}\n\n"
            f"{AGENT_CONFIG['description']}\n\n"
            "Commands:\n"
            "  help       - Show this message\n"
            "  status     - Agent health and stats\n"
            "  discover   - List available tokens\n"
            "  evaluate <token_addr> - Score a token\n"
            "  trade <token_addr> <amount> - Generate trade link\n"
            "  portfolio  - Show cross-holdings\n"
            "  partner    - Propose a partnership\n"
        )
        await reply(ctx, sender, response)
        return

    # ── STATUS ────────────────────────────────────────────────────────────
    if intent == "status":
        summary = holdings.summary()
        response = (
            f"**Status:** healthy\n"
            f"Tokens held: {summary['tokens_held']}\n"
            f"Total invested: {summary['total_invested']} FET\n"
            f"My token holders: {summary['holders_of_my_token']}\n"
            f"Active partnerships: {summary['partnerships']}\n"
            f"Mutual holdings: {summary['mutual_holdings']}"
        )
        await reply(ctx, sender, response)
        return

    # ── DISCOVER ──────────────────────────────────────────────────────────
    if intent == "discover":
        tokens = discovery.list_tokens()
        if not tokens:
            await reply(ctx, sender, "No tokens found or API unavailable.")
            return

        # Show top 5 by holder count
        sorted_tokens = sorted(
            tokens,
            key=lambda t: t.get("holderCount", 0),
            reverse=True,
        )[:5]

        lines = ["**Top tokens by holders:**\n"]
        for t in sorted_tokens:
            name = t.get("name", "Unknown")
            symbol = t.get("symbol", "???")
            holders = t.get("holderCount", 0)
            addr = t.get("address", "")
            lines.append(
                f"  {name} (${symbol}) - {holders} holders\n"
                f"  https://agent-launch.ai/trade/{addr}?action=buy&amount=100"
            )

        await reply(ctx, sender, "\n".join(lines))
        return

    # ── EVALUATE ──────────────────────────────────────────────────────────
    if intent == "evaluate":
        # Extract token address from message
        parts = text.split()
        token_addr = None
        for part in parts:
            if part.startswith("0x") and len(part) == 42:
                token_addr = part
                break

        if not token_addr:
            await reply(
                ctx, sender,
                "Please provide a token address: evaluate 0x1234...",
                end=True,
            )
            return

        details = discovery.get_token_details(token_addr)
        if not details:
            await reply(ctx, sender, f"Token not found: {token_addr}", end=True)
            return

        evaluation = evaluator.evaluate(details)
        lines = [
            f"**Evaluation: {evaluation['name']}**\n",
            f"Score: {evaluation['score']}/100",
            f"Recommendation: {evaluation['recommendation'].upper()}\n",
            "Reasons:",
        ]
        for reason in evaluation["reasons"]:
            lines.append(f"  - {reason}")

        if evaluation["recommendation"] in ("buy", "strong_buy"):
            lines.append(
                f"\nTrade link: "
                f"https://agent-launch.ai/trade/{token_addr}?action=buy&amount=100"
            )

        await reply(ctx, sender, "\n".join(lines))
        return

    # ── TRADE ─────────────────────────────────────────────────────────────
    if intent == "trade":
        if not trades.can_propose():
            await reply(
                ctx, sender,
                f"Trade rate limit reached ({TRADE_RATE_LIMIT_PER_HOUR}/hour).",
                end=True,
            )
            return

        # Extract token address and amount
        parts = text.split()
        token_addr = None
        amount = 100  # default

        for part in parts:
            if part.startswith("0x") and len(part) == 42:
                token_addr = part
            elif part.isdigit():
                amount = int(part)

        if not token_addr:
            await reply(
                ctx, sender,
                "Please provide: trade 0x1234... 100",
                end=True,
            )
            return

        # Validate token exists
        details = discovery.get_token_details(token_addr)
        if not details:
            await reply(ctx, sender, f"Token not found: {token_addr}", end=True)
            return

        # Generate trade link
        link = trades.generate_buy_link(token_addr, amount)
        trades.record_proposal()

        # Record the intended holding
        holdings.record_buy(token_addr, amount)

        response = (
            f"Trade link generated for {details.get('name', 'Unknown')}:\n"
            f"{link}\n\n"
            f"Amount: {min(amount, MAX_BUY_AMOUNT_FET)} FET\n"
            f"Note: 2% fee goes to protocol treasury.\n"
            f"Click the link to execute (requires wallet signature)."
        )
        await reply(ctx, sender, response)
        return

    # ── PORTFOLIO ─────────────────────────────────────────────────────────
    if intent == "portfolio":
        # Refresh holder data
        holdings.refresh_holders(discovery)
        summary = holdings.summary()

        lines = ["**Portfolio Summary:**\n"]
        lines.append(f"Tokens held: {summary['tokens_held']}")
        lines.append(f"Total invested: {summary['total_invested']} FET")
        lines.append(f"My token holders: {summary['holders_of_my_token']}")
        lines.append(f"Partnerships: {summary['partnerships']}")
        lines.append(f"Mutual holdings: {summary['mutual_holdings']}")

        if holdings.my_holdings:
            lines.append("\n**Held tokens:**")
            for addr, amount in holdings.my_holdings.items():
                lines.append(f"  {addr[:10]}...{addr[-6:]} - {amount} FET invested")

        if holdings.partnerships:
            lines.append("\n**Partnerships:**")
            for addr, info in holdings.partnerships.items():
                lines.append(
                    f"  {addr[:10]}... - {info.get('services', 'N/A')} "
                    f"(since {info.get('established', 'N/A')[:10]})"
                )

        await reply(ctx, sender, "\n".join(lines))
        return

    # ── PARTNER ───────────────────────────────────────────────────────────
    if intent == "partner":
        # Verify sender is a real Agentverse agent
        if not sender.startswith("agent1q"):
            await reply(
                ctx, sender,
                "Partnership requires a verified Agentverse agent address.",
                end=True,
            )
            return

        response = (
            f"Partnership proposal received from {sender[:20]}...\n\n"
            f"To form a partnership:\n"
            f"1. Buy my token: https://agent-launch.ai/trade/{MY_TOKEN_ADDRESS}?action=buy&amount=100\n"
            f"2. Tell me your token address and what services you provide\n"
            f"3. I will evaluate and buy your token if it scores well\n"
            f"4. Cross-holdings = economic alliance\n\n"
            f"Send: 'partner <your_token_addr> <your_service_description>'"
        )
        await reply(ctx, sender, response)
        return

    # ── UNKNOWN ───────────────────────────────────────────────────────────
    await reply(
        ctx, sender,
        f"Unknown command. Send 'help' for available commands.",
        end=True,
    )


@chat_proto.on_message(ChatAcknowledgement)
async def handle_ack(
    ctx: Context, sender: str, msg: ChatAcknowledgement
) -> None:
    """Handle acknowledgements (required by Chat Protocol v0.3.0)."""
    ctx.logger.debug(
        f"Ack from {sender[:20]} for msg {msg.acknowledged_msg_id}"
    )


# ==============================================================================
# PERIODIC TASKS
# ==============================================================================


@agent.on_interval(period=EVALUATION_INTERVAL)
async def periodic_discovery(ctx: Context) -> None:
    """
    Periodically discover and evaluate new tokens.

    This is the core loop: discover -> evaluate -> trade -> relationship.
    """
    ctx.logger.info("[DISCOVERY] Starting periodic token scan")

    # Refresh our holder list
    holdings.refresh_holders(discovery)

    # Discover tokens
    tokens = discovery.list_tokens()
    if not tokens:
        ctx.logger.info("[DISCOVERY] No tokens found")
        return

    # Evaluate each token we do not already hold
    for token in tokens:
        addr = token.get("address", "")
        if not addr or addr == MY_TOKEN_ADDRESS:
            continue  # Skip our own token (no wash trading)
        if addr in holdings.my_holdings:
            continue  # Already holding

        details = discovery.get_token_details(addr)
        if not details:
            continue

        evaluation = evaluator.evaluate(details)
        ctx.logger.info(
            f"[EVAL] {details.get('name', '?')} "
            f"score={evaluation['score']} "
            f"rec={evaluation['recommendation']}"
        )

        # Auto-generate trade link for strong recommendations
        if evaluation["recommendation"] == "strong_buy" and trades.can_propose():
            link = trades.generate_buy_link(addr, 100)
            trades.record_proposal()
            ctx.logger.info(
                f"[TRADE] Strong buy signal for {details.get('name', '?')}: {link}"
            )
            # In production with delegated wallets, this would execute
            # automatically. For now, it logs the trade link for the owner.

    # Log portfolio summary
    summary = holdings.summary()
    ctx.logger.info(f"[PORTFOLIO] {json.dumps(summary)}")


# ==============================================================================
# WIRE UP
# ==============================================================================

agent.include(chat_proto, publish_manifest=True)

if __name__ == "__main__":
    agent.run()
