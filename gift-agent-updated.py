"""
TFET Gifter (@gift) — The Testnet Faucet

Distributes BSC Testnet tokens to new agents:
- Welcome gifts (150 TFET + 0.01 tBNB)
- Referral rewards (10 TFET)
- Builder rewards (20 TFET/week for tokenized agents)

Uses ASI1 Mini for natural conversation.
Chat Protocol v0.3.0 compliant.

Required secrets on Agentverse:
- GIFT_TREASURY_KEY: Private key for the treasury wallet
- ASI1_API_KEY: API key for ASI1 (get from api.asi1.ai)
"""

from datetime import datetime, timedelta
from uuid import uuid4
import json
import os
import re
import time

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

# ASI1 for natural conversation
ASI1_API = "https://api.asi1.ai/v1/chat/completions"
ASI1_MODEL = "asi1-mini"

# Links for users
GIFT_TOKEN = "0xF7e2F77f014a5ad3C121b1942968be33BA89e03c"
LINK_GIFT_TOKEN = f"https://agent-launch.ai/token/{GIFT_TOKEN}"
LINK_AGENTLAUNCH = "https://agent-launch.ai"
LINK_AGENTVERSE = "https://agentverse.ai"
LINK_BSC_EXPLORER = "https://testnet.bscscan.com/tx/"

# Reward amounts (BSC Testnet)
WELCOME_FET = 200       # Covers 120 TFET deploy fee + 80 TFET seed capital
WELCOME_BNB = 0.001     # Gas for a few transactions
REFERRAL_FET = 10       # Both parties get this
BUILDER_FET = 20        # Weekly for agents with deployed tokens
MILESTONE_100_HOLDERS = 50   # Bonus for reaching 100 holders
MILESTONE_GRADUATION = 100   # Bonus for reaching 30k TFET graduation

# Rate limits
MAX_CLAIMS_PER_DAY = 100     # Total welcome gifts per day
MAX_CLAIMS_PER_AGENT = 3     # Welcome gifts per agent (lifetime)
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

def get_claim_count(ctx, sender: str) -> int:
    """How many times this agent has claimed a welcome gift."""
    claims = _get(ctx, "welcome_claims", {})
    entry = claims.get(sender)
    if entry is None:
        return 0
    # Legacy: old entries are a single ISO string, treat as 1 claim
    if isinstance(entry, str):
        return 1
    return entry.get("count", 0)


def has_claimed_welcome(ctx, sender: str) -> bool:
    """Check if agent has used all their welcome gift claims."""
    return get_claim_count(ctx, sender) >= MAX_CLAIMS_PER_AGENT


def record_welcome_claim(ctx, sender: str):
    """Record that agent got a welcome gift."""
    claims = _get(ctx, "welcome_claims", {})
    entry = claims.get(sender)
    if entry is None:
        claims[sender] = {"count": 1, "timestamps": [datetime.now().isoformat()]}
    elif isinstance(entry, str):
        # Migrate legacy single-string entry
        claims[sender] = {"count": 2, "timestamps": [entry, datetime.now().isoformat()]}
    else:
        entry["count"] = entry.get("count", 0) + 1
        entry.setdefault("timestamps", []).append(datetime.now().isoformat())
        claims[sender] = entry
    _set(ctx, "welcome_claims", claims)


def get_daily_claim_count(ctx) -> int:
    """How many welcome gifts given today."""
    today = datetime.now().date().isoformat()
    daily = _get(ctx, f"daily_{today}", 0)
    return daily


def increment_daily_claims(ctx):
    """Increment today's welcome gift count."""
    today = datetime.now().date().isoformat()
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
    builders[sender] = datetime.now().isoformat()
    _set(ctx, "builder_claims", builders)


def check_rate_limit(ctx, sender: str) -> bool:
    """Returns True if under rate limit."""
    key = f"rl_{sender}"
    now = datetime.now().timestamp()
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
FET_TOKEN = "0x304ddf3eE068c53514f782e2341B71A80c8aE3C7"  # TFET on BSC Testnet (checksummed)

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
    Get treasury wallet address and account from GIFT_TREASURY_KEY secret.
    Returns (address, account) or (None, None) if not configured.
    """
    # Try unique key first, fallback to legacy name
    private_key = os.environ.get("GIFT_TREASURY_KEY") or os.environ.get("TREASURY_PRIVATE_KEY")
    if not private_key:
        print("[TREASURY_WALLET] No treasury key found in env")
        return None, None

    # Ensure proper format
    if not private_key.startswith("0x"):
        private_key = "0x" + private_key

    try:
        account = Account.from_key(private_key)
        print(f"[TREASURY_WALLET] Loaded wallet: {account.address}")
        return account.address, account
    except Exception as e:
        print(f"[TREASURY_WALLET] Error loading wallet: {e}")
        return None, None


def get_treasury_balance(ctx) -> dict:
    """Get real treasury balance from BSC Testnet."""
    address, _ = get_treasury_wallet()
    ctx.logger.info(f"[TREASURY] Checking balance for address: {address}")

    if not address:
        # Fallback to simulated if no wallet configured
        ctx.logger.warning("[TREASURY] No wallet configured, using fallback")
        return _get(ctx, "treasury", {"fet": 0, "bnb": 0, "address": None})

    try:
        # Get BNB balance
        ctx.logger.info(f"[TREASURY] Connecting to BSC RPC: {BSC_RPC}")
        bnb_wei = w3.eth.get_balance(address)
        bnb = float(w3.from_wei(bnb_wei, 'ether'))
        ctx.logger.info(f"[TREASURY] BNB balance: {bnb}")

        # Get FET balance
        ctx.logger.info(f"[TREASURY] Checking TFET at contract: {FET_TOKEN}")
        fet_contract = w3.eth.contract(address=FET_TOKEN, abi=ERC20_ABI)
        fet_wei = fet_contract.functions.balanceOf(address).call()
        fet = float(w3.from_wei(fet_wei, 'ether'))
        ctx.logger.info(f"[TREASURY] TFET balance: {fet}")

        return {"fet": fet, "bnb": bnb, "address": address}
    except Exception as e:
        ctx.logger.error(f"[TREASURY] Error getting balance: {str(e)}")
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
        # Handle both old (rawTransaction) and new (raw_transaction) web3.py versions
        raw_tx = getattr(signed, 'raw_transaction', None) or getattr(signed, 'rawTransaction', None)
        tx_hash = w3.eth.send_raw_transaction(raw_tx)

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
        # Handle both old (rawTransaction) and new (raw_transaction) web3.py versions
        raw_tx = getattr(signed, 'raw_transaction', None) or getattr(signed, 'rawTransaction', None)
        tx_hash = w3.eth.send_raw_transaction(raw_tx)

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
# ASI1 CONVERSATION
# ════════════════════════════════════════════════════════════════════════════════

def get_system_prompt(ctx, sender: str, claimed: bool) -> str:
    """Build system prompt with current context."""
    stats = get_stats(ctx)
    claims_used = get_claim_count(ctx, sender)

    return f"""You are @gift, a friendly testnet faucet agent on BSC Testnet. You're casual, helpful, and brief.

**What you give out:**
- Welcome gift: {WELCOME_FET} TFET + {WELCOME_BNB} tBNB (up to {MAX_CLAIMS_PER_AGENT} claims per agent, need their 0x... wallet address)
- Referral bonus: {REFERRAL_FET} TFET (need both agent1q... address and 0x... wallet)
- Builder reward: {BUILDER_FET} TFET/week (for agents with deployed tokens, need 0x... wallet)

**Current state:**
- Treasury: {stats['treasury_fet']:.0f} TFET, {stats['treasury_bnb']:.4f} tBNB
- This user's claims used: {claims_used}/{MAX_CLAIMS_PER_AGENT}
- Total gifts given: {stats['welcome_gifts']}

**Your job:**
1. Figure out what they want (claim, refer, builder reward, status, just chatting)
2. If they want tokens, make sure you have their wallet address (0x...)
3. Be friendly and conversational, not robotic
4. Keep responses SHORT - 2-3 sentences max
5. If they're just saying hi, greet them and tell them what you can do

**Important:**
- You CANNOT send tokens yourself - you just chat. The system handles transactions.
- If they include a 0x... address and seem to want tokens, that's a claim attempt.
- Don't be formal. Be like a helpful friend.

**Links to share when relevant:**
- Deploy agent: {LINK_AGENTVERSE}
- Deploy token: {LINK_AGENTLAUNCH}
- Buy $GIFT: {LINK_GIFT_TOKEN}"""


def call_asi1(system: str, user_msg: str, ctx) -> dict:
    """
    Call ASI1 Mini for conversation.
    Returns: {{"response": str, "intent": str, "needs_wallet": bool}}
    """
    api_key = os.environ.get("ASI1_API_KEY")
    if not api_key:
        ctx.logger.warning("ASI1_API_KEY not set, falling back to basic mode")
        return None

    try:
        res = requests.post(
            ASI1_API,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": ASI1_MODEL,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": user_msg}
                ],
                "temperature": 0.7,
                "max_tokens": 300
            },
            timeout=15
        )

        if res.status_code != 200:
            ctx.logger.error(f"ASI1 error: {res.status_code} {res.text[:200]}")
            return None

        return res.json()["choices"][0]["message"]["content"]
    except Exception as e:
        ctx.logger.error(f"ASI1 call failed: {e}")
        return None


def detect_intent_with_asi1(text: str, ctx, sender: str, claimed: bool) -> dict:
    """
    Use ASI1 to detect intent and generate response.
    Returns: {"intent": str, "response": str} or None if ASI1 unavailable.
    """
    api_key = os.environ.get("ASI1_API_KEY")
    if not api_key:
        return None

    # Check for wallet/agent addresses in text
    has_evm = bool(re.search(r"0x[a-fA-F0-9]{40}", text))

    # Ignore mentions of the GIFT agent itself when checking for agent addresses
    agent_matches = re.findall(r"agent1q[a-z0-9]{38,60}", text)
    other_agents = [a for a in agent_matches if a != GIFT_AGENT_ADDR]
    has_agent = len(other_agents) > 0

    intent_prompt = f"""Analyze this message and respond as JSON only:

Message: "{text}"

User context:
- Has claimed welcome gift: {claimed}
- Message contains 0x wallet: {has_evm}
- Message contains agent1q address: {has_agent}

Respond with ONLY this JSON (no markdown, no explanation):
{{"intent": "<one of: claim, refer, builder, status, help, greeting, thanks, unknown>", "response": "<your friendly 1-3 sentence response>", "needs_wallet": <true if they need to provide 0x address, false otherwise>}}

Intent guide:
- "claim": they want their welcome gift (and have or need a 0x address)
- "refer": they want to refer someone (need agent1q + 0x)
- "builder": they want weekly builder reward
- "status": asking about treasury/stats
- "help": asking what you do or how things work
- "greeting": just saying hi/hello
- "thanks": expressing gratitude
- "unknown": can't tell what they want"""

    try:
        res = requests.post(
            ASI1_API,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": ASI1_MODEL,
                "messages": [
                    {"role": "system", "content": get_system_prompt(ctx, sender, claimed)},
                    {"role": "user", "content": intent_prompt}
                ],
                "temperature": 0.3,
                "max_tokens": 200
            },
            timeout=10
        )

        if res.status_code != 200:
            ctx.logger.error(f"ASI1 intent error: {res.status_code}")
            return None

        content = res.json()["choices"][0]["message"]["content"].strip()

        # Parse JSON response
        # Handle potential markdown wrapping
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        content = content.strip()

        result = json.loads(content)
        ctx.logger.info(f"ASI1 intent: {result.get('intent')} | needs_wallet: {result.get('needs_wallet')}")
        return result

    except json.JSONDecodeError as e:
        ctx.logger.error(f"ASI1 JSON parse error: {e} | content: {content[:100]}")
        return None
    except Exception as e:
        ctx.logger.error(f"ASI1 intent detection failed: {e}")
        return None


def generate_response(text: str, ctx, sender: str, claimed: bool) -> str:
    """Generate a natural response using ASI1."""
    api_key = os.environ.get("ASI1_API_KEY")
    if not api_key:
        return None

    try:
        res = requests.post(
            ASI1_API,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": ASI1_MODEL,
                "messages": [
                    {"role": "system", "content": get_system_prompt(ctx, sender, claimed)},
                    {"role": "user", "content": text}
                ],
                "temperature": 0.7,
                "max_tokens": 250
            },
            timeout=10
        )

        if res.status_code != 200:
            return None

        return res.json()["choices"][0]["message"]["content"]
    except Exception as e:
        ctx.logger.error(f"ASI1 response generation failed: {e}")
        return None


# ════════════════════════════════════════════════════════════════════════════════
# INTENT DETECTION (FALLBACK)
# ════════════════════════════════════════════════════════════════════════════════

GIFT_AGENT_ADDR = "agent1q2d0n5tp563wr0ugj9cmcqms9jfv5ks63xy5vg3evy5gy0z52e66xmeyyw9"

def detect_intent(text: str) -> str:
    """Detect what the agent wants - conversational and forgiving."""
    t = text.lower().strip()

    # Check for EVM address - if present, likely a claim attempt
    has_evm = bool(re.search(r"0x[a-fA-F0-9]{40}", text))

    # Check for agent address, but ignore mentions of the GIFT agent itself
    agent_matches = re.findall(r"agent1q[a-z0-9]{38,60}", text)
    other_agents = [a for a in agent_matches if a != GIFT_AGENT_ADDR]
    has_agent_addr = len(other_agents) > 0

    # Claim welcome gift - be generous with detection
    claim_words = ["claim", "gift", "gimme", "tokens", "fet", "faucet",
                   "send", "give", "need", "want", "get", "start", "new", "first"]
    if has_evm and not has_agent_addr:
        # Has wallet address but no agent address = probably claiming
        if any(w in t for w in claim_words) or len(t.split()) <= 3:
            return "claim_welcome"
    if any(w in t for w in ["claim", "welcome gift", "faucet", "new here"]):
        return "claim_welcome"

    # Referral - needs both addresses
    if has_agent_addr and has_evm:
        return "referral"
    if any(w in t for w in ["refer", "invite", "referred"]):
        return "referral"

    # Builder reward
    if any(w in t for w in ["builder", "weekly", "reward", "deployed token"]):
        if has_evm:
            return "builder_reward"
        return "builder_reward"

    # Status / stats
    if any(w in t for w in ["status", "stats", "balance", "treasury", "how much", "left"]):
        return "status"

    # Help - but not if they're just asking a question with "?"
    if t in ["help", "?", "commands", "what do you do", "how does this work"]:
        return "help"
    if "help" in t and len(t) < 30:
        return "help"

    # Greetings - short casual messages
    greetings = ["hi", "hello", "hey", "yo", "sup", "gm", "whats up", "what's up",
                 "howdy", "hola", "heya", "hiya", "morning", "evening", "afternoon"]
    if len(t) < 25 and any(t.startswith(g) or t == g for g in greetings):
        return "greeting"

    # Thanks
    if any(w in t for w in ["thank", "thanks", "thx", "ty", "cheers"]):
        return "thanks"

    return "unknown"


# ════════════════════════════════════════════════════════════════════════════════
# MESSAGE HANDLER
# ════════════════════════════════════════════════════════════════════════════════

async def reply(ctx, sender: str, text: str, end: bool = False):
    content = [TextContent(type="text", text=text)]
    if end:
        content.append(EndSessionContent(type="end-session"))
    await ctx.send(sender, ChatMessage(
        timestamp=datetime.now(),
        msg_id=uuid4(),
        content=content,
    ))


def format_wallet(addr: str) -> str:
    """Shorten wallet address for display."""
    return f"{addr[:6]}...{addr[-4:]}"


def format_tx(tx_hash: str, link: bool = True) -> str:
    """Format tx hash with optional explorer link."""
    short = f"{tx_hash[:10]}..."
    if link:
        return f"[{short}]({LINK_BSC_EXPLORER}{tx_hash})"
    return short


@chat_proto.on_message(ChatMessage)
async def handle_chat(ctx: Context, sender: str, msg: ChatMessage):
    # Acknowledge immediately
    await ctx.send(sender, ChatAcknowledgement(
        timestamp=datetime.now(),
        acknowledged_msg_id=msg.msg_id,
    ))

    # Extract text
    text = " ".join(
        item.text for item in msg.content if isinstance(item, TextContent)
    ).strip()
    text = text[:2000]

    ctx.logger.info(f"[GIFT] {sender[:16]}: {text[:60]}")

    # Rate limit check
    if not check_rate_limit(ctx, sender):
        await reply(ctx, sender, "Easy there! Give me a sec. Try again in a minute.", end=True)
        return

    claimed = has_claimed_welcome(ctx, sender)

    # Try ASI1 for intent detection first
    asi1_result = detect_intent_with_asi1(text, ctx, sender, claimed)

    if asi1_result:
        intent = asi1_result.get("intent", "unknown")
        asi1_response = asi1_result.get("response", "")
        needs_wallet = asi1_result.get("needs_wallet", False)
        ctx.logger.info(f"[GIFT] ASI1 intent: {intent}")
    else:
        # Fallback to keyword matching
        intent = detect_intent(text)
        asi1_response = None
        needs_wallet = False
        ctx.logger.info(f"[GIFT] Fallback intent: {intent}")

    # ─── Help ────────────────────────────────────────────────────────────────
    if intent == "help":
        if asi1_response:
            await reply(ctx, sender, asi1_response)
        elif claimed:
            await reply(ctx, sender,
                f"Here's what you can do:\n\n"
                f"**Refer friends** — `refer agent1q... 0x...`\n"
                f"You get {REFERRAL_FET} TFET, they get a bonus on their first claim.\n\n"
                f"**Builder rewards** — `builder reward 0x...`\n"
                f"{BUILDER_FET} TFET/week if you've [deployed a token]({LINK_AGENTLAUNCH}).\n\n"
                f"**Check treasury** — `status`\n\n"
                f"[Buy $GIFT]({LINK_GIFT_TOKEN}) to keep the faucet running!")
        else:
            await reply(ctx, sender,
                f"I hand out testnet tokens to get agents started.\n\n"
                f"**Your welcome gift** — {WELCOME_FET} TFET + {WELCOME_BNB} tBNB\n"
                f"Just say: `claim 0x...` with your wallet address.\n\n"
                f"That's enough to [deploy your own token]({LINK_AGENTLAUNCH}) and start trading.")
        return

    # ─── Greeting ────────────────────────────────────────────────────────────
    if intent == "greeting":
        if asi1_response:
            await reply(ctx, sender, asi1_response)
        elif claimed:
            stats = get_stats(ctx)
            await reply(ctx, sender,
                f"Hey, welcome back! Treasury's at {stats['treasury_fet']:.0f} TFET.\n\n"
                f"Want to earn more? Refer a friend: `refer agent1q... 0x...`")
        else:
            await reply(ctx, sender,
                f"Hey! I've got {WELCOME_FET} TFET + {WELCOME_BNB} tBNB with your name on it.\n\n"
                f"Just send me your wallet: `claim 0x...`")
        return

    # ─── Thanks ──────────────────────────────────────────────────────────────
    if intent == "thanks":
        if asi1_response:
            await reply(ctx, sender, asi1_response, end=True)
        else:
            await reply(ctx, sender, "You got it! Go build something cool.", end=True)
        return

    # ─── Claim Welcome Gift ──────────────────────────────────────────────────
    if intent in ["claim_welcome", "claim"]:
        if not verify_agentverse_agent(sender):
            if asi1_response and "deploy" in asi1_response.lower():
                await reply(ctx, sender, asi1_response, end=True)
            else:
                await reply(ctx, sender,
                    f"Hmm, I can only send tokens to Agentverse agents. "
                    f"[Deploy yours]({LINK_AGENTVERSE}) and come back!",
                    end=True)
            return

        if claimed:
            ref_count = get_referral_count(ctx, sender)
            used = get_claim_count(ctx, sender)
            if asi1_response:
                await reply(ctx, sender, asi1_response, end=True)
            elif ref_count > 0:
                await reply(ctx, sender,
                    f"You've used all {used}/{MAX_CLAIMS_PER_AGENT} welcome claims! And you've referred {ref_count} agents — nice.\n\n"
                    f"Keep it going: `refer agent1q... 0x...`",
                    end=True)
            else:
                await reply(ctx, sender,
                    f"You've used all {used}/{MAX_CLAIMS_PER_AGENT} welcome claims!\n\n"
                    f"Want more? Refer other agents and earn {REFERRAL_FET} TFET each.",
                    end=True)
            return

        # Extract wallet
        evm_match = re.search(r"(0x[a-fA-F0-9]{40})", text)
        if not evm_match:
            if asi1_response:
                await reply(ctx, sender, asi1_response)
            else:
                await reply(ctx, sender,
                    "I need your wallet address to send the tokens.\n\n"
                    "Like this: `claim 0x1a2b3c...`")
            return

        evm_address = evm_match.group(1)

        # Check limits
        if get_daily_claim_count(ctx) >= MAX_CLAIMS_PER_DAY:
            await reply(ctx, sender,
                "Whoa, busy day! Hit the daily limit. Come back tomorrow?",
                end=True)
            return

        if not deduct_treasury(ctx, fet=WELCOME_FET, bnb=WELCOME_BNB):
            stats = get_stats(ctx)
            await reply(ctx, sender,
                f"Treasury's running low ({stats['treasury_fet']:.0f} TFET left).\n\n"
                f"[Buy $GIFT]({LINK_GIFT_TOKEN}) to help refill it!",
                end=True)
            return

        # Send TFET
        await reply(ctx, sender, f"Sending {WELCOME_FET} TFET to {format_wallet(evm_address)}...")

        fet_result = send_fet(evm_address, WELCOME_FET, ctx)
        if not fet_result["success"]:
            err = fet_result.get('error', 'Unknown error')
            if "insufficient" in err.lower():
                await reply(ctx, sender,
                    "Oops, treasury's tapped out. Try again later!",
                    end=True)
            else:
                await reply(ctx, sender,
                    f"Transfer didn't go through: {err}\n\nGive it another shot in a bit.",
                    end=True)
            return

        time.sleep(3)  # Avoid nonce collision

        # Send tBNB
        bnb_result = send_bnb(evm_address, WELCOME_BNB, ctx)
        if not bnb_result["success"]:
            record_welcome_claim(ctx, sender)
            increment_daily_claims(ctx)
            await reply(ctx, sender,
                f"TFET sent! But tBNB transfer hiccuped.\n\n"
                f"**{WELCOME_FET} TFET** — {format_tx(fet_result['tx_hash'])}\n\n"
                "You might need to get gas elsewhere. Sorry about that!",
                end=True)
            return

        record_welcome_claim(ctx, sender)
        increment_daily_claims(ctx)

        # Transaction details are always shown (important info)
        tx_info = (
            f"Sent to {format_wallet(evm_address)}:\n"
            f"**{WELCOME_FET} TFET** — {format_tx(fet_result['tx_hash'])}\n"
            f"**{WELCOME_BNB} tBNB** — {format_tx(bnb_result['tx_hash'])}"
        )

        # Try to get a personalized closing from ASI1
        closing = generate_response(
            f"I just sent {WELCOME_FET} TFET to a new agent. Give them a brief, encouraging sendoff (1-2 sentences). Mention they can deploy a token or start trading.",
            ctx, sender, True
        )

        remaining_claims = MAX_CLAIMS_PER_AGENT - get_claim_count(ctx, sender)
        claims_note = f"\n\nClaims remaining: {remaining_claims}/{MAX_CLAIMS_PER_AGENT}" if remaining_claims > 0 else ""

        if closing:
            await reply(ctx, sender, f"{tx_info}{claims_note}\n\n{closing}", end=True)
        else:
            await reply(ctx, sender,
                f"{tx_info}{claims_note}\n\n"
                f"That's enough to [deploy your own token]({LINK_AGENTLAUNCH}) (120 TFET) with some left over to trade.\n\n"
                f"What will you build?",
                end=True)
        return

    # ─── Referral ────────────────────────────────────────────────────────────
    if intent in ["referral", "refer"]:
        if not verify_agentverse_agent(sender):
            if asi1_response:
                await reply(ctx, sender, asi1_response, end=True)
            else:
                await reply(ctx, sender,
                    f"Referrals are for Agentverse agents only. [Deploy yours]({LINK_AGENTVERSE}) first!",
                    end=True)
            return

        # Find agent addresses, excluding the GIFT agent's own address
        agent_matches = re.findall(r"(agent1q[a-z0-9]{38,60})", text)
        other_agents = [a for a in agent_matches if a != GIFT_AGENT_ADDR]
        agent_match = other_agents[0] if other_agents else None
        evm_match = re.search(r"(0x[a-fA-F0-9]{40})", text)

        if not agent_match and not evm_match:
            if asi1_response:
                await reply(ctx, sender, asi1_response)
            else:
                await reply(ctx, sender,
                    f"To refer someone, I need their agent address and your wallet:\n\n"
                    f"`refer agent1q... 0x...`\n\n"
                    f"You'll get {REFERRAL_FET} TFET, they get a bonus when they claim.")
            return

        if not agent_match:
            if asi1_response:
                await reply(ctx, sender, asi1_response)
            else:
                await reply(ctx, sender,
                    "Who are you referring? Include their agent address:\n\n"
                    "`refer agent1q... 0x...`")
            return

        if not evm_match:
            if asi1_response:
                await reply(ctx, sender, asi1_response)
            else:
                await reply(ctx, sender,
                    "Where should I send your referral bonus?\n\n"
                    f"`refer {agent_match[:20]}... 0x...`")
            return

        referred = agent_match  # Already a string, not a match object
        evm_address = evm_match.group(1)

        if referred == sender:
            await reply(ctx, sender, "Ha! Nice try. Can't refer yourself though.")
            return

        ref_count = get_referral_count(ctx, sender)
        if ref_count >= MAX_REFERRALS_PER_AGENT:
            await reply(ctx, sender,
                f"You've already referred {ref_count} agents — that's the max!\n\n"
                "Thanks for spreading the word.",
                end=True)
            return

        if not deduct_treasury(ctx, fet=REFERRAL_FET):
            await reply(ctx, sender, f"Treasury's low. [Buy $GIFT]({LINK_GIFT_TOKEN}) to help refill!", end=True)
            return

        fet_result = send_fet(evm_address, REFERRAL_FET, ctx)
        if not fet_result["success"]:
            await reply(ctx, sender,
                f"Transfer failed. Try again in a bit?",
                end=True)
            return

        record_referral(ctx, sender, referred)

        # Notify referred agent
        try:
            await ctx.send(referred, ChatMessage(
                timestamp=datetime.now(),
                msg_id=uuid4(),
                content=[
                    TextContent(type="text", text=
                        f"Someone referred you! Claim your welcome gift:\n\n"
                        f"`claim 0x...` — {WELCOME_FET} TFET + {WELCOME_BNB} tBNB\n\n"
                        f"Plus a referral bonus!"),
                    EndSessionContent(type="end-session"),
                ],
            ))
        except Exception:
            pass

        new_count = get_referral_count(ctx, sender)
        await reply(ctx, sender,
            f"Referral bonus sent! **{REFERRAL_FET} TFET** — {format_tx(fet_result['tx_hash'])}\n\n"
            f"Total referrals: {new_count}",
            end=True)
        return

    # ─── Builder Reward ──────────────────────────────────────────────────────
    if intent in ["builder_reward", "builder"]:
        if not verify_agentverse_agent(sender):
            if asi1_response:
                await reply(ctx, sender, asi1_response, end=True)
            else:
                await reply(ctx, sender,
                    f"Builder rewards are for [Agentverse agents]({LINK_AGENTVERSE}) with [deployed tokens]({LINK_AGENTLAUNCH}).",
                    end=True)
            return

        evm_match = re.search(r"(0x[a-fA-F0-9]{40})", text)
        if not evm_match:
            if asi1_response:
                await reply(ctx, sender, asi1_response)
            else:
                await reply(ctx, sender,
                    "Where should I send your builder reward?\n\n"
                    "`builder reward 0x...`")
            return

        evm_address = evm_match.group(1)

        token_info = check_agent_has_token(sender)
        if token_info.get("has_token") is None:
            await reply(ctx, sender,
                "Couldn't check your token status. Try again in a sec?",
                end=True)
            return

        if not token_info["has_token"]:
            if claimed:
                await reply(ctx, sender,
                    f"Builder rewards are for agents with deployed tokens.\n\n"
                    f"You've got TFET — [deploy your token]({LINK_AGENTLAUNCH})!",
                    end=True)
            else:
                await reply(ctx, sender,
                    f"Builder rewards are for agents with deployed tokens.\n\n"
                    f"First, grab your welcome gift: `claim 0x...`\n"
                    f"Then [deploy your token]({LINK_AGENTLAUNCH})!",
                    end=True)
            return

        last_claim = get_builder_last_claim(ctx, sender)
        if last_claim:
            last_dt = datetime.fromisoformat(last_claim)
            days_since = (datetime.now() - last_dt).days
            if days_since < 7:
                days_left = 7 - days_since
                await reply(ctx, sender,
                    f"Builder rewards are weekly. Check back in {days_left} day{'s' if days_left != 1 else ''}!")
                return

        if not deduct_treasury(ctx, fet=BUILDER_FET):
            await reply(ctx, sender, f"Treasury's low. [Buy $GIFT]({LINK_GIFT_TOKEN}) to help refill!", end=True)
            return

        fet_result = send_fet(evm_address, BUILDER_FET, ctx)
        if not fet_result["success"]:
            await reply(ctx, sender, "Transfer failed. Try again later?", end=True)
            return

        record_builder_claim(ctx, sender)
        token_name = token_info.get("token", {}).get("name", "your token")

        await reply(ctx, sender,
            f"Builder reward sent! **{BUILDER_FET} TFET** for {token_name}\n\n"
            f"{format_tx(fet_result['tx_hash'])}\n\n"
            f"See you next week!",
            end=True)
        return

    # ─── Status ──────────────────────────────────────────────────────────────
    if intent == "status":
        stats = get_stats(ctx)
        treasury = get_treasury_balance(ctx)

        gifts_today = get_daily_claim_count(ctx)
        remaining = MAX_CLAIMS_PER_DAY - gifts_today

        # Status always shows real data, but can add ASI1 flavor
        status_text = (
            f"**Treasury**\n"
            f"{stats['treasury_fet']:.0f} TFET / {stats['treasury_bnb']:.4f} tBNB\n\n"
            f"**Today**\n"
            f"{gifts_today} gifts sent, {remaining} remaining\n\n"
            f"**All time**\n"
            f"{stats['welcome_gifts']} welcome gifts, {stats['total_referrals']} referrals\n\n"
            f"[Buy $GIFT]({LINK_GIFT_TOKEN}) to fund the treasury"
        )
        await reply(ctx, sender, status_text)
        return

    # ─── Unknown — let ASI1 handle it naturally ──────────────────────────────
    if asi1_response:
        await reply(ctx, sender, asi1_response)
    elif claimed:
        await reply(ctx, sender,
            f"Not sure what you mean. Try:\n\n"
            f"• `refer agent1q... 0x...` — earn {REFERRAL_FET} TFET\n"
            f"• `builder reward 0x...` — {BUILDER_FET} TFET/week\n"
            f"• `status` — check treasury\n\n"
            f"Or [deploy a token]({LINK_AGENTLAUNCH}) with the TFET you've got!")
    else:
        await reply(ctx, sender,
            f"Want some testnet tokens? Just send:\n\n"
            f"`claim 0x...` (your wallet address)\n\n"
            f"I'll send you {WELCOME_FET} TFET + {WELCOME_BNB} tBNB to get started.")


@chat_proto.on_message(ChatAcknowledgement)
async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement):
    ctx.logger.debug(f"Ack from {sender[:20]} for msg {msg.acknowledged_msg_id}")


@agent.on_interval(period=3600)
async def cleanup_storage(ctx: Context):
    """Periodic cleanup task."""
    ctx.logger.info("Storage cleanup check completed")


agent.include(chat_proto, publish_manifest=True)
