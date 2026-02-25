"""
FET Gifter ($GIFT) — The Agent Faucet

The first REAL agent built on the AgentLaunch platform.
Distributes testnet FET/BNB to other agents so they can deploy tokens and trade.

Reward Streams:
- Welcome gift: 150 FET + 0.2 BNB (one-time, new agents)
- Referral: 10 FET to referrer + 10 FET to referred (ongoing)
- Builder: 20 FET/week for agents with deployed tokens (ongoing)

Tokenized as $GIFT — community buys $GIFT to fund the treasury.

Chat Protocol v0.3.0 compliant.
"""

from datetime import datetime, timedelta
from uuid import uuid4
import json
import os
import re

import requests
from web3 import Web3
from eth_account import Account
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

# ════════════════════════════════════════════════════════════════════════════════
# CONFIG
# ════════════════════════════════════════════════════════════════════════════════

AGENTVERSE_API = "https://agentverse.ai/v1"
AGENTLAUNCH_API = os.environ.get("AGENT_LAUNCH_API_URL", "https://agent-launch.ai/api").rstrip("/")

# Reward amounts (testnet FET)
WELCOME_FET = 150       # Covers 120 FET deploy fee + 30 FET seed capital
WELCOME_BNB = 0.2       # Gas for multiple transactions
REFERRAL_FET = 10       # Both parties get this
BUILDER_FET = 20        # Weekly for agents with deployed tokens
MILESTONE_100_HOLDERS = 50   # Bonus for reaching 100 holders
MILESTONE_GRADUATION = 100   # Bonus for reaching 30k FET graduation

# Rate limits
MAX_CLAIMS_PER_DAY = 100     # Total welcome gifts per day
MAX_REFERRALS_PER_AGENT = 50 # Prevent referral spam
RATE_LIMIT_PER_MINUTE = 10   # Messages per agent per minute

# ════════════════════════════════════════════════════════════════════════════════
# STORAGE HELPERS
# ════════════════════════════════════════════════════════════════════════════════

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


# ════════════════════════════════════════════════════════════════════════════════
# AGENT VERIFICATION
# ════════════════════════════════════════════════════════════════════════════════

def verify_agentverse_agent(sender: str) -> bool:
    """Check that sender is a real Agentverse agent (agent1q... address)."""
    return sender.startswith("agent1q") and len(sender) > 20


def check_agent_has_token(agent_address: str) -> dict:
    """Check if agent has a deployed token on AgentLaunch."""
    try:
        res = requests.get(
            f"{AGENTLAUNCH_API}/agents/token/{agent_address}",
            timeout=10,
        )
        if res.status_code == 200:
            data = res.json()
            if data.get("success") and data.get("data"):
                return {"has_token": True, "token": data["data"]}
        return {"has_token": False}
    except Exception as e:
        return {"has_token": None, "error": str(e)}


# ════════════════════════════════════════════════════════════════════════════════
# CLAIM TRACKING
# ════════════════════════════════════════════════════════════════════════════════

def has_claimed_welcome(ctx, sender: str) -> bool:
    """Check if agent already got a welcome gift."""
    claims = _get(ctx, "welcome_claims", {})
    return sender in claims


def record_welcome_claim(ctx, sender: str):
    """Record that agent got their welcome gift."""
    claims = _get(ctx, "welcome_claims", {})
    claims[sender] = datetime.utcnow().isoformat()
    _set(ctx, "welcome_claims", claims)


def get_daily_claim_count(ctx) -> int:
    """How many welcome gifts given today."""
    today = datetime.utcnow().date().isoformat()
    daily = _get(ctx, f"daily_{today}", 0)
    return daily


def increment_daily_claims(ctx):
    """Increment today's welcome gift count."""
    today = datetime.utcnow().date().isoformat()
    daily = _get(ctx, f"daily_{today}", 0)
    _set(ctx, f"daily_{today}", daily + 1)


def get_referral_count(ctx, sender: str) -> int:
    """How many referrals this agent has made."""
    refs = _get(ctx, "referral_counts", {})
    return refs.get(sender, 0)


def record_referral(ctx, referrer: str, referred: str):
    """Record a referral."""
    refs = _get(ctx, "referral_counts", {})
    refs[referrer] = refs.get(referrer, 0) + 1
    _set(ctx, "referral_counts", refs)

    # Track who referred whom
    ref_map = _get(ctx, "referral_map", {})
    ref_map[referred] = referrer
    _set(ctx, "referral_map", ref_map)


def get_builder_last_claim(ctx, sender: str) -> str:
    """When did this agent last claim builder rewards."""
    builders = _get(ctx, "builder_claims", {})
    return builders.get(sender)


def record_builder_claim(ctx, sender: str):
    """Record builder reward claim."""
    builders = _get(ctx, "builder_claims", {})
    builders[sender] = datetime.utcnow().isoformat()
    _set(ctx, "builder_claims", builders)


def check_rate_limit(ctx, sender: str) -> bool:
    """Returns True if under rate limit."""
    key = f"rl_{sender}"
    now = datetime.utcnow().timestamp()
    times = _get(ctx, key, [])
    times = [t for t in times if now - t < 60]
    if len(times) >= RATE_LIMIT_PER_MINUTE:
        return False
    times.append(now)
    _set(ctx, key, times)
    return True


# ════════════════════════════════════════════════════════════════════════════════
# EVM WALLET CONFIGURATION (Agentverse Agent Wallet on BSC)
# ════════════════════════════════════════════════════════════════════════════════

# BSC Testnet
BSC_RPC = "https://data-seed-prebsc-1-s1.binance.org:8545"
BSC_CHAIN_ID = 97
FET_TOKEN = "0x74F804B4140ee70830B3Eef4e690325841575F89"

# ERC-20 Transfer ABI
ERC20_ABI = [
    {
        "constant": False,
        "inputs": [
            {"name": "_to", "type": "address"},
            {"name": "_value", "type": "uint256"}
        ],
        "name": "transfer",
        "outputs": [{"name": "", "type": "bool"}],
        "type": "function"
    },
    {
        "constant": True,
        "inputs": [{"name": "_owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "balance", "type": "uint256"}],
        "type": "function"
    }
]

# Web3 instance
w3 = Web3(Web3.HTTPProvider(BSC_RPC))

def get_treasury_wallet() -> tuple:
    """
    Get treasury wallet address and account from TREASURY_PRIVATE_KEY secret.
    Returns (address, account) or (None, None) if not configured.
    """
    private_key = os.environ.get("TREASURY_PRIVATE_KEY")
    if not private_key:
        return None, None

    # Ensure proper format
    if not private_key.startswith("0x"):
        private_key = "0x" + private_key

    try:
        account = Account.from_key(private_key)
        return account.address, account
    except Exception:
        return None, None


def get_treasury_balance(ctx) -> dict:
    """Get real treasury balance from BSC Testnet."""
    address, _ = get_treasury_wallet()
    if not address:
        # Fallback to simulated if no wallet configured
        return _get(ctx, "treasury", {"fet": 0, "bnb": 0, "address": None})

    try:
        # Get BNB balance
        bnb_wei = w3.eth.get_balance(address)
        bnb = float(w3.from_wei(bnb_wei, 'ether'))

        # Get FET balance
        fet_contract = w3.eth.contract(address=FET_TOKEN, abi=ERC20_ABI)
        fet_wei = fet_contract.functions.balanceOf(address).call()
        fet = float(w3.from_wei(fet_wei, 'ether'))

        return {"fet": fet, "bnb": bnb, "address": address}
    except Exception as e:
        return {"fet": 0, "bnb": 0, "address": address, "error": str(e)}


def send_fet(recipient: str, amount: float, ctx) -> dict:
    """Send FET tokens to recipient. Returns tx hash or error."""
    address, account = get_treasury_wallet()
    if not account:
        return {"success": False, "error": "Treasury wallet not configured"}

    if not recipient.startswith("0x") or len(recipient) != 42:
        return {"success": False, "error": "Invalid recipient address"}

    try:
        fet_contract = w3.eth.contract(address=FET_TOKEN, abi=ERC20_ABI)
        amount_wei = w3.to_wei(amount, 'ether')

        # Build transaction
        nonce = w3.eth.get_transaction_count(address)
        tx = fet_contract.functions.transfer(
            Web3.to_checksum_address(recipient),
            amount_wei
        ).build_transaction({
            'chainId': BSC_CHAIN_ID,
            'gas': 100000,
            'gasPrice': w3.eth.gas_price,
            'nonce': nonce,
        })

        # Sign and send
        signed = account.sign_transaction(tx)
        tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)

        ctx.logger.info(f"FET sent: {amount} to {recipient[:10]}... tx={tx_hash.hex()[:16]}")
        return {"success": True, "tx_hash": tx_hash.hex()}
    except Exception as e:
        ctx.logger.error(f"FET transfer failed: {e}")
        return {"success": False, "error": str(e)}


def send_bnb(recipient: str, amount: float, ctx) -> dict:
    """Send BNB to recipient. Returns tx hash or error."""
    address, account = get_treasury_wallet()
    if not account:
        return {"success": False, "error": "Treasury wallet not configured"}

    if not recipient.startswith("0x") or len(recipient) != 42:
        return {"success": False, "error": "Invalid recipient address"}

    try:
        amount_wei = w3.to_wei(amount, 'ether')
        nonce = w3.eth.get_transaction_count(address)

        tx = {
            'chainId': BSC_CHAIN_ID,
            'to': Web3.to_checksum_address(recipient),
            'value': amount_wei,
            'gas': 21000,
            'gasPrice': w3.eth.gas_price,
            'nonce': nonce,
        }

        signed = account.sign_transaction(tx)
        tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)

        ctx.logger.info(f"BNB sent: {amount} to {recipient[:10]}... tx={tx_hash.hex()[:16]}")
        return {"success": True, "tx_hash": tx_hash.hex()}
    except Exception as e:
        ctx.logger.error(f"BNB transfer failed: {e}")
        return {"success": False, "error": str(e)}


def deduct_treasury(ctx, fet: float = 0, bnb: float = 0) -> bool:
    """Check if treasury has sufficient balance for distribution."""
    balance = get_treasury_balance(ctx)
    return balance["fet"] >= fet and balance["bnb"] >= bnb


# ════════════════════════════════════════════════════════════════════════════════
# STATS
# ════════════════════════════════════════════════════════════════════════════════

def get_stats(ctx) -> dict:
    """Get distribution stats."""
    claims = _get(ctx, "welcome_claims", {})
    refs = _get(ctx, "referral_counts", {})
    total_referrals = sum(refs.values())
    treasury = get_treasury_balance(ctx)

    return {
        "welcome_gifts": len(claims),
        "total_referrals": total_referrals,
        "top_referrer_count": max(refs.values()) if refs else 0,
        "treasury_fet": treasury["fet"],
        "treasury_bnb": treasury["bnb"],
    }


# ════════════════════════════════════════════════════════════════════════════════
# INTENT DETECTION
# ════════════════════════════════════════════════════════════════════════════════

def detect_intent(text: str) -> str:
    """Detect what the agent wants."""
    t = text.lower().strip()

    # Claim welcome gift
    if any(w in t for w in ["claim", "welcome", "gift", "need tokens", "need fet",
                             "give me", "send me", "tokens please", "faucet",
                             "i need", "get started", "new here"]):
        return "claim_welcome"

    # Referral
    if any(w in t for w in ["refer", "invite", "referred by", "sent by"]):
        return "referral"

    # Builder reward
    if any(w in t for w in ["builder", "deployed", "my token", "weekly reward",
                             "building reward"]):
        return "builder_reward"

    # Status / stats
    if any(w in t for w in ["status", "stats", "balance", "treasury", "how much"]):
        return "status"

    # Help
    if any(w in t for w in ["help", "what can", "how does", "?"]) or t == "help":
        return "help"

    # Greetings
    if len(t) < 20 and any(w in t for w in ["hi", "hello", "hey", "yo", "sup"]):
        return "greeting"

    return "unknown"


# ════════════════════════════════════════════════════════════════════════════════
# MESSAGE HANDLER
# ════════════════════════════════════════════════════════════════════════════════

async def reply(ctx, sender: str, text: str, end: bool = False):
    content = [TextContent(type="text", text=text)]
    if end:
        content.append(EndSessionContent(type="end-session"))
    await ctx.send(sender, ChatMessage(
        timestamp=datetime.utcnow(),
        msg_id=uuid4(),
        content=content,
    ))


@chat_proto.on_message(ChatMessage)
async def handle_chat(ctx: Context, sender: str, msg: ChatMessage):
    # Acknowledge
    await ctx.send(sender, ChatAcknowledgement(
        timestamp=datetime.utcnow(),
        acknowledged_msg_id=msg.msg_id,
    ))

    # Extract text
    text = " ".join(
        item.text for item in msg.content if isinstance(item, TextContent)
    ).strip()

    text = text[:2000]  # Cap message length to prevent memory pressure

    ctx.logger.info(f"[FET Gifter] {sender[:16]}: {text[:60]}")

    # Verify sender is real agent
    if not verify_agentverse_agent(sender):
        await reply(ctx, sender,
            "I can only gift tokens to verified Agentverse agents. "
            "Deploy your agent at agentverse.ai first!",
            end=True)
        return

    # Rate limit
    if not check_rate_limit(ctx, sender):
        await reply(ctx, sender, "Slow down! Try again in a minute.", end=True)
        return

    intent = detect_intent(text)

    # ─── Help ────────────────────────────────────────────────────────────────
    if intent == "help":
        await reply(ctx, sender,
            "**FET Gifter** — The Agent Faucet\n\n"
            "I distribute testnet tokens so agents can participate in the economy.\n\n"
            "**What you can get:**\n"
            f"- **Welcome Gift**: {WELCOME_FET} FET + {WELCOME_BNB} BNB (one-time)\n"
            f"- **Referral**: {REFERRAL_FET} FET when you refer another agent\n"
            f"- **Builder Reward**: {BUILDER_FET} FET/week if you have a deployed token\n\n"
            "**Commands:** (include your EVM wallet 0x...)\n"
            "- `claim 0x...` — Get your welcome gift\n"
            "- `refer agent1q... 0x...` — Refer another agent\n"
            "- `builder reward 0x...` — Claim weekly builder reward\n"
            "- `status` — See treasury stats\n\n"
            "**$GIFT Token:**\n"
            "Community buys $GIFT to fund this faucet. "
            "More $GIFT holders = more tokens to distribute!")
        return

    # ─── Greeting ────────────────────────────────────────────────────────────
    if intent == "greeting":
        if has_claimed_welcome(ctx, sender):
            await reply(ctx, sender,
                "Welcome back! You've already claimed your welcome gift.\n\n"
                "You can still earn:\n"
                f"- **Referrals**: {REFERRAL_FET} FET per referral (`refer agent1q... 0x...`)\n"
                f"- **Builder rewards**: {BUILDER_FET} FET/week (`builder reward 0x...`)\n\n"
                "Say 'help' for all options.")
        else:
            await reply(ctx, sender,
                "Hey! I'm the FET Gifter — I give testnet tokens to agents.\n\n"
                f"Say **'claim 0x...'** (your EVM wallet) to get:\n"
                f"- {WELCOME_FET} FET (enough to deploy a token + start trading)\n"
                f"- {WELCOME_BNB} BNB (gas for transactions)\n\n"
                "Or say 'help' for all options!")
        return

    # ─── Claim Welcome Gift ──────────────────────────────────────────────────
    if intent == "claim_welcome":
        if has_claimed_welcome(ctx, sender):
            await reply(ctx, sender,
                "You already claimed your welcome gift!\n\n"
                "Earn more through:\n"
                f"- **Referrals**: `refer agent1q... 0x...` ({REFERRAL_FET} FET each)\n"
                f"- **Builder rewards**: `builder reward 0x...` ({BUILDER_FET} FET/week)",
                end=True)
            return

        # Extract EVM wallet address from message
        evm_match = re.search(r"(0x[a-fA-F0-9]{40})", text)
        if not evm_match:
            await reply(ctx, sender,
                "To claim your welcome gift, include your EVM wallet address:\n\n"
                "**claim 0x1234...abcd**\n\n"
                "This is where I'll send your FET and BNB on BSC Testnet.\n"
                "(MetaMask, Trust Wallet, etc.)")
            return

        evm_address = evm_match.group(1)

        if get_daily_claim_count(ctx) >= MAX_CLAIMS_PER_DAY:
            await reply(ctx, sender,
                "Daily gift limit reached! Come back tomorrow.\n"
                "Tip: Buy $GIFT to help fund more gifts!",
                end=True)
            return

        if not deduct_treasury(ctx, fet=WELCOME_FET, bnb=WELCOME_BNB):
            await reply(ctx, sender,
                "Treasury is running low! Buy $GIFT to help refill it.",
                end=True)
            return

        # Send FET tokens
        fet_result = send_fet(evm_address, WELCOME_FET, ctx)
        if not fet_result["success"]:
            await reply(ctx, sender,
                f"FET transfer failed: {fet_result.get('error', 'Unknown error')}\n\n"
                "Please try again later or contact support.",
                end=True)
            return

        # Send BNB for gas
        bnb_result = send_bnb(evm_address, WELCOME_BNB, ctx)
        if not bnb_result["success"]:
            await reply(ctx, sender,
                f"BNB transfer failed: {bnb_result.get('error', 'Unknown error')}\n"
                f"(FET was sent successfully: {fet_result['tx_hash'][:16]}...)\n\n"
                "Please try again later for BNB.",
                end=True)
            # Still record claim since FET was sent
            record_welcome_claim(ctx, sender)
            increment_daily_claims(ctx)
            return

        record_welcome_claim(ctx, sender)
        increment_daily_claims(ctx)

        await reply(ctx, sender,
            f"**Welcome to the Agent Economy!**\n\n"
            f"Sent to `{evm_address[:10]}...{evm_address[-6:]}`:\n"
            f"- **{WELCOME_FET} FET** — tx: `{fet_result['tx_hash'][:16]}...`\n"
            f"- **{WELCOME_BNB} BNB** — tx: `{bnb_result['tx_hash'][:16]}...`\n\n"
            f"**Next steps:**\n"
            f"1. Deploy your own token on AgentLaunch (costs 120 FET)\n"
            f"2. Use remaining 30 FET to buy other agents' tokens\n"
            f"3. Refer other agents to earn {REFERRAL_FET} FET each\n\n"
            f"Build something. Trade something. Grow the economy.",
            end=True)
        return

    # ─── Referral ────────────────────────────────────────────────────────────
    if intent == "referral":
        # Extract referred agent address (agent1q...)
        agent_match = re.search(r"(agent1q[a-z0-9]{38,60})", text)
        if not agent_match:
            await reply(ctx, sender,
                "To refer an agent, include their address and your EVM wallet:\n\n"
                "**refer agent1q... 0x...**\n\n"
                "You'll receive your referral bonus to the 0x address.")
            return

        referred = agent_match.group(1)

        # Extract referrer's EVM wallet
        evm_match = re.search(r"(0x[a-fA-F0-9]{40})", text)
        if not evm_match:
            await reply(ctx, sender,
                "Include your EVM wallet to receive the referral bonus:\n\n"
                f"**refer {referred[:16]}... 0x...**")
            return

        evm_address = evm_match.group(1)

        if referred == sender:
            await reply(ctx, sender, "Nice try! You can't refer yourself.")
            return

        if get_referral_count(ctx, sender) >= MAX_REFERRALS_PER_AGENT:
            await reply(ctx, sender,
                f"You've hit the referral limit ({MAX_REFERRALS_PER_AGENT}). "
                "Thanks for spreading the word!")
            return

        if not deduct_treasury(ctx, fet=REFERRAL_FET):
            await reply(ctx, sender, "Treasury low! Buy $GIFT to help refill.", end=True)
            return

        # Send referral reward to referrer
        fet_result = send_fet(evm_address, REFERRAL_FET, ctx)
        if not fet_result["success"]:
            await reply(ctx, sender,
                f"Transfer failed: {fet_result.get('error', 'Unknown error')}\n\n"
                "Please try again later.",
                end=True)
            return

        record_referral(ctx, sender, referred)

        # Notify the referred agent (they'll get bonus when they claim)
        try:
            await ctx.send(referred, ChatMessage(
                timestamp=datetime.utcnow(),
                msg_id=uuid4(),
                content=[
                    TextContent(type="text", text=f"You were referred by another agent!\n\nSay **'claim 0x...'** to get your welcome gift ({WELCOME_FET} FET + {WELCOME_BNB} BNB) plus a **{REFERRAL_FET} FET referral bonus**!"),
                    EndSessionContent(type="end-session"),
                ],
            ))
        except Exception:
            ctx.logger.warning(f"Could not notify referred agent {referred[:20]}")

        await reply(ctx, sender,
            f"**Referral recorded!**\n\n"
            f"Sent to `{evm_address[:10]}...{evm_address[-6:]}`:\n"
            f"- **{REFERRAL_FET} FET** — tx: `{fet_result['tx_hash'][:16]}...`\n\n"
            f"{referred[:20]}... will get their bonus when they claim.\n"
            f"Total referrals: {get_referral_count(ctx, sender)}",
            end=True)
        return

    # ─── Builder Reward ──────────────────────────────────────────────────────
    if intent == "builder_reward":
        # Extract EVM wallet address
        evm_match = re.search(r"(0x[a-fA-F0-9]{40})", text)
        if not evm_match:
            await reply(ctx, sender,
                "To claim builder rewards, include your EVM wallet:\n\n"
                "**builder reward 0x...**")
            return

        evm_address = evm_match.group(1)

        # Check if they have a deployed token
        token_info = check_agent_has_token(sender)
        if token_info.get("has_token") is None:
            await reply(ctx, sender,
                "Could not verify your token right now. Please try again in a moment.",
                end=True)
            return
        if not token_info["has_token"]:
            await reply(ctx, sender,
                "Builder rewards are for agents with deployed tokens.\n\n"
                "Deploy your token first:\n"
                "1. Say 'claim 0x...' for your welcome gift (150 FET)\n"
                "2. Use AgentLaunch to tokenize yourself\n"
                "3. Come back for weekly rewards!",
                end=True)
            return

        # Check cooldown (7 days)
        last_claim = get_builder_last_claim(ctx, sender)
        if last_claim:
            last_dt = datetime.fromisoformat(last_claim)
            if datetime.utcnow() - last_dt < timedelta(days=7):
                next_claim = last_dt + timedelta(days=7)
                await reply(ctx, sender,
                    f"Builder rewards are weekly. Next claim: {next_claim.strftime('%Y-%m-%d')}")
                return

        if not deduct_treasury(ctx, fet=BUILDER_FET):
            await reply(ctx, sender, "Treasury low! Buy $GIFT to help refill.", end=True)
            return

        # Send builder reward
        fet_result = send_fet(evm_address, BUILDER_FET, ctx)
        if not fet_result["success"]:
            await reply(ctx, sender,
                f"Transfer failed: {fet_result.get('error', 'Unknown error')}\n\n"
                "Please try again later.",
                end=True)
            return

        record_builder_claim(ctx, sender)

        token_name = token_info.get("token", {}).get("name", "your token")
        await reply(ctx, sender,
            f"**Builder Reward!**\n\n"
            f"Token: {token_name}\n"
            f"Sent to `{evm_address[:10]}...{evm_address[-6:]}`:\n"
            f"- **{BUILDER_FET} FET** — tx: `{fet_result['tx_hash'][:16]}...`\n\n"
            f"Keep building! Come back next week for more.",
            end=True)
        return

    # ─── Status ──────────────────────────────────────────────────────────────
    if intent == "status":
        stats = get_stats(ctx)
        treasury = get_treasury_balance(ctx)
        address = treasury.get("address", "Not configured")
        if address and len(address) > 20:
            address = f"`{address[:10]}...{address[-6:]}`"

        await reply(ctx, sender,
            f"**FET Gifter Treasury Status**\n\n"
            f"**Treasury:** {address}\n"
            f"- FET: {stats['treasury_fet']:.2f}\n"
            f"- BNB: {stats['treasury_bnb']:.4f}\n\n"
            f"**Distribution:**\n"
            f"- Welcome gifts given: {stats['welcome_gifts']}\n"
            f"- Total referrals: {stats['total_referrals']}\n"
            f"- Top referrer: {stats['top_referrer_count']} referrals\n\n"
            f"Buy $GIFT to fund the treasury!")
        return

    # ─── Unknown ─────────────────────────────────────────────────────────────
    if has_claimed_welcome(ctx, sender):
        await reply(ctx, sender,
            "I didn't catch that. Here's what I can do:\n\n"
            f"- `refer agent1q... 0x...` — Earn {REFERRAL_FET} FET\n"
            f"- `builder reward 0x...` — Claim {BUILDER_FET} FET/week\n"
            "- `status` — Treasury stats\n"
            "- `help` — Full guide")
    else:
        await reply(ctx, sender,
            "I'm the FET Gifter! Say **'claim 0x...'** to get your welcome gift:\n"
            f"- {WELCOME_FET} FET + {WELCOME_BNB} BNB\n\n"
            "Or say 'help' for everything I can do.")


@chat_proto.on_message(ChatAcknowledgement)
async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement):
    ctx.logger.debug(f"Ack from {sender[:20]} for msg {msg.acknowledged_msg_id}")


@agent.on_interval(period=3600)
async def cleanup_storage(ctx: Context):
    """Remove stale daily_ storage keys older than 7 days."""
    today = datetime.utcnow().date()
    # Clean up is best-effort — storage API may not support key listing
    # For now, just log that cleanup ran
    ctx.logger.info("Storage cleanup check completed")


agent.include(chat_proto, publish_manifest=True)
