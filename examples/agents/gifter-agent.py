"""
FET Gifter ($GIFT) — The Agent Faucet

Distributes testnet FET/BNB to other agents so they can deploy tokens and trade.

Reward Streams:
- Welcome gift: 150 FET + 0.01 BNB (one-time, new agents)
- Referral: 10 FET to referrer (ongoing)
- Builder: 20 FET/week for agents with deployed tokens (ongoing)

Tokenized as $GIFT — community buys $GIFT to fund the treasury.

Chat Protocol v0.3.0 compliant.
Uses raw JSON-RPC instead of web3.py to stay under Agentverse compute limits.
"""

from datetime import datetime, timedelta
from uuid import uuid4
import json
import os
import re
import asyncio

import requests
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

AGENTLAUNCH_API = os.environ.get("AGENT_LAUNCH_API_URL", "https://agent-launch.ai/api").rstrip("/")

WELCOME_FET = 150
WELCOME_BNB = 0.01
REFERRAL_FET = 10
BUILDER_FET = 20

MAX_CLAIMS_PER_DAY = 100
MAX_REFERRALS_PER_AGENT = 50
RATE_LIMIT_PER_MINUTE = 10

# ════════════════════════════════════════════════════════════════════════════════
# BSC CONFIG (no web3 — raw JSON-RPC)
# ════════════════════════════════════════════════════════════════════════════════

BSC_RPC = "https://data-seed-prebsc-1-s1.binance.org:8545"
BSC_CHAIN_ID = 97
FET_TOKEN = "0x304ddf3eE068c53514f782e2341B71A80c8aE3C7"

# ERC-20 function selectors
# keccak256("transfer(address,uint256)")[:4]
TRANSFER_SELECTOR = "a9059cbb"
# keccak256("balanceOf(address)")[:4]
BALANCE_OF_SELECTOR = "70a08231"


def rpc(method, params):
    """Make a raw JSON-RPC call to BSC."""
    r = requests.post(BSC_RPC, json={
        "jsonrpc": "2.0", "id": 1, "method": method, "params": params
    }, timeout=15)
    data = r.json()
    if "error" in data:
        raise Exception(data["error"].get("message", str(data["error"])))
    return data.get("result")


def to_wei(amount):
    """Convert FET/BNB amount to wei (18 decimals)."""
    return int(amount * 10**18)


def from_wei(amount_wei):
    """Convert wei to FET/BNB."""
    return amount_wei / 10**18


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
    return sender.startswith("agent1q") and len(sender) > 20


def check_agent_has_token(agent_address: str) -> dict:
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
    claims = _get(ctx, "welcome_claims", {})
    return sender in claims


def record_welcome_claim(ctx, sender: str):
    claims = _get(ctx, "welcome_claims", {})
    claims[sender] = datetime.now().isoformat()
    _set(ctx, "welcome_claims", claims)


def get_daily_claim_count(ctx) -> int:
    today = datetime.now().date().isoformat()
    return _get(ctx, f"daily_{today}", 0)


def increment_daily_claims(ctx):
    today = datetime.now().date().isoformat()
    daily = _get(ctx, f"daily_{today}", 0)
    _set(ctx, f"daily_{today}", daily + 1)


def get_referral_count(ctx, sender: str) -> int:
    refs = _get(ctx, "referral_counts", {})
    return refs.get(sender, 0)


def record_referral(ctx, referrer: str, referred: str):
    refs = _get(ctx, "referral_counts", {})
    refs[referrer] = refs.get(referrer, 0) + 1
    _set(ctx, "referral_counts", refs)
    ref_map = _get(ctx, "referral_map", {})
    ref_map[referred] = referrer
    _set(ctx, "referral_map", ref_map)


def get_builder_last_claim(ctx, sender: str) -> str:
    builders = _get(ctx, "builder_claims", {})
    return builders.get(sender)


def record_builder_claim(ctx, sender: str):
    builders = _get(ctx, "builder_claims", {})
    builders[sender] = datetime.now().isoformat()
    _set(ctx, "builder_claims", builders)


def check_rate_limit(ctx, sender: str) -> bool:
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
# WALLET (raw RPC, no web3)
# ════════════════════════════════════════════════════════════════════════════════

def get_treasury_wallet():
    private_key = os.environ.get("GIFT_TREASURY_KEY") or os.environ.get("TREASURY_PRIVATE_KEY")
    if not private_key:
        return None, None
    if not private_key.startswith("0x"):
        private_key = "0x" + private_key
    try:
        account = Account.from_key(private_key)
        return account.address, account
    except Exception:
        return None, None


def get_bnb_balance(address):
    result = rpc("eth_getBalance", [address, "latest"])
    return int(result, 16) if result else 0


def get_token_balance(token_address, wallet_address):
    addr_padded = wallet_address[2:].lower().zfill(64)
    data = "0x" + BALANCE_OF_SELECTOR + addr_padded
    result = rpc("eth_call", [{"to": token_address, "data": data}, "latest"])
    return int(result, 16) if result and result != "0x" else 0


def get_treasury_balance(ctx) -> dict:
    address, _ = get_treasury_wallet()
    if not address:
        return _get(ctx, "treasury", {"fet": 0, "bnb": 0, "address": None})
    try:
        bnb_wei = get_bnb_balance(address)
        bnb = from_wei(bnb_wei)
        fet_wei = get_token_balance(FET_TOKEN, address)
        fet = from_wei(fet_wei)
        return {"fet": fet, "bnb": bnb, "address": address}
    except Exception as e:
        ctx.logger.error(f"[TREASURY] Balance error: {e}")
        return {"fet": 0, "bnb": 0, "address": address, "error": str(e)}


def send_fet(recipient: str, amount: float, ctx) -> dict:
    address, account = get_treasury_wallet()
    if not account:
        return {"success": False, "error": "Treasury wallet not configured"}
    if not recipient.startswith("0x") or len(recipient) != 42:
        return {"success": False, "error": "Invalid recipient address"}
    try:
        amount_wei = to_wei(amount)
        recipient_padded = recipient[2:].lower().zfill(64)
        amount_hex = hex(amount_wei)[2:].zfill(64)
        tx_data = "0x" + TRANSFER_SELECTOR + recipient_padded + amount_hex

        nonce = int(rpc("eth_getTransactionCount", [address, "latest"]), 16)
        gas_price = int(rpc("eth_gasPrice", []), 16)

        tx = {
            "chainId": BSC_CHAIN_ID,
            "nonce": nonce,
            "gasPrice": gas_price,
            "gas": 100000,
            "to": FET_TOKEN,
            "value": 0,
            "data": tx_data,
        }

        signed = account.sign_transaction(tx)
        raw = getattr(signed, "raw_transaction", None) or getattr(signed, "rawTransaction", None)
        tx_hash = rpc("eth_sendRawTransaction", ["0x" + raw.hex()])

        ctx.logger.info(f"FET sent: {amount} to {recipient[:10]}... tx={tx_hash[:18]}")
        return {"success": True, "tx_hash": tx_hash}
    except Exception as e:
        ctx.logger.error(f"FET transfer failed: {e}")
        return {"success": False, "error": str(e)}


def send_bnb(recipient: str, amount: float, ctx) -> dict:
    address, account = get_treasury_wallet()
    if not account:
        return {"success": False, "error": "Treasury wallet not configured"}
    if not recipient.startswith("0x") or len(recipient) != 42:
        return {"success": False, "error": "Invalid recipient address"}
    try:
        nonce = int(rpc("eth_getTransactionCount", [address, "latest"]), 16)
        gas_price = int(rpc("eth_gasPrice", []), 16)

        tx = {
            "chainId": BSC_CHAIN_ID,
            "nonce": nonce,
            "gasPrice": gas_price,
            "gas": 21000,
            "to": recipient,
            "value": to_wei(amount),
        }

        signed = account.sign_transaction(tx)
        raw = getattr(signed, "raw_transaction", None) or getattr(signed, "rawTransaction", None)
        tx_hash = rpc("eth_sendRawTransaction", ["0x" + raw.hex()])

        ctx.logger.info(f"BNB sent: {amount} to {recipient[:10]}... tx={tx_hash[:18]}")
        return {"success": True, "tx_hash": tx_hash}
    except Exception as e:
        ctx.logger.error(f"BNB transfer failed: {e}")
        return {"success": False, "error": str(e)}


def deduct_treasury(ctx, fet: float = 0, bnb: float = 0) -> bool:
    balance = get_treasury_balance(ctx)
    return balance["fet"] >= fet and balance["bnb"] >= bnb


# ════════════════════════════════════════════════════════════════════════════════
# STATS
# ════════════════════════════════════════════════════════════════════════════════

def get_stats(ctx) -> dict:
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
    t = text.lower().strip()
    if any(w in t for w in ["claim", "welcome", "gift", "need tokens", "need fet",
                             "give me", "send me", "tokens please", "faucet",
                             "i need", "get started", "new here"]):
        return "claim_welcome"
    if any(w in t for w in ["refer", "invite", "referred by", "sent by"]):
        return "referral"
    if any(w in t for w in ["builder", "deployed", "my token", "weekly reward",
                             "building reward"]):
        return "builder_reward"
    if any(w in t for w in ["status", "stats", "balance", "treasury", "how much"]):
        return "status"
    if any(w in t for w in ["help", "what can", "how does", "?"]) or t == "help":
        return "help"
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
        timestamp=datetime.now(),
        msg_id=uuid4(),
        content=content,
    ))


@chat_proto.on_message(ChatMessage)
async def handle_chat(ctx: Context, sender: str, msg: ChatMessage):
    await ctx.send(sender, ChatAcknowledgement(
        timestamp=datetime.now(),
        acknowledged_msg_id=msg.msg_id,
    ))

    text = " ".join(
        item.text for item in msg.content if isinstance(item, TextContent)
    ).strip()[:2000]

    ctx.logger.info(f"[FET Gifter] {sender[:16]}: {text[:60]}")

    if not verify_agentverse_agent(sender):
        await reply(ctx, sender,
            "I can only gift tokens to verified Agentverse agents. "
            "Deploy your agent at agentverse.ai first!", end=True)
        return

    if not check_rate_limit(ctx, sender):
        await reply(ctx, sender, "Slow down! Try again in a minute.", end=True)
        return

    intent = detect_intent(text)

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

    if intent == "claim_welcome":
        if has_claimed_welcome(ctx, sender):
            await reply(ctx, sender,
                "You already claimed your welcome gift!\n\n"
                "Earn more through:\n"
                f"- **Referrals**: `refer agent1q... 0x...` ({REFERRAL_FET} FET each)\n"
                f"- **Builder rewards**: `builder reward 0x...` ({BUILDER_FET} FET/week)",
                end=True)
            return

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
                "Tip: Buy $GIFT to help fund more gifts!", end=True)
            return

        if not deduct_treasury(ctx, fet=WELCOME_FET, bnb=WELCOME_BNB):
            await reply(ctx, sender,
                "Treasury is running low! Buy $GIFT to help refill it.", end=True)
            return

        fet_result = send_fet(evm_address, WELCOME_FET, ctx)
        if not fet_result["success"]:
            await reply(ctx, sender,
                f"FET transfer failed: {fet_result.get('error', 'Unknown error')}\n\n"
                "Please try again later or contact support.", end=True)
            return

        await asyncio.sleep(3)

        bnb_result = send_bnb(evm_address, WELCOME_BNB, ctx)
        if not bnb_result["success"]:
            await reply(ctx, sender,
                f"BNB transfer failed: {bnb_result.get('error', 'Unknown error')}\n"
                f"(FET was sent successfully: {fet_result['tx_hash'][:16]}...)\n\n"
                "Please try again later for BNB.", end=True)
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
            f"Build something. Trade something. Grow the economy.", end=True)
        return

    if intent == "referral":
        agent_match = re.search(r"(agent1q[a-z0-9]{38,60})", text)
        if not agent_match:
            await reply(ctx, sender,
                "To refer an agent, include their address and your EVM wallet:\n\n"
                "**refer agent1q... 0x...**\n\n"
                "You'll receive your referral bonus to the 0x address.")
            return

        referred = agent_match.group(1)

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

        fet_result = send_fet(evm_address, REFERRAL_FET, ctx)
        if not fet_result["success"]:
            await reply(ctx, sender,
                f"Transfer failed: {fet_result.get('error', 'Unknown error')}\n\n"
                "Please try again later.", end=True)
            return

        record_referral(ctx, sender, referred)

        try:
            await ctx.send(referred, ChatMessage(
                timestamp=datetime.now(),
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
            f"Total referrals: {get_referral_count(ctx, sender)}", end=True)
        return

    if intent == "builder_reward":
        evm_match = re.search(r"(0x[a-fA-F0-9]{40})", text)
        if not evm_match:
            await reply(ctx, sender,
                "To claim builder rewards, include your EVM wallet:\n\n"
                "**builder reward 0x...**")
            return

        evm_address = evm_match.group(1)

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
                "3. Come back for weekly rewards!", end=True)
            return

        last_claim = get_builder_last_claim(ctx, sender)
        if last_claim:
            last_dt = datetime.fromisoformat(last_claim)
            if datetime.now() - last_dt < timedelta(days=7):
                next_claim = last_dt + timedelta(days=7)
                await reply(ctx, sender,
                    f"Builder rewards are weekly. Next claim: {next_claim.strftime('%Y-%m-%d')}")
                return

        if not deduct_treasury(ctx, fet=BUILDER_FET):
            await reply(ctx, sender, "Treasury low! Buy $GIFT to help refill.", end=True)
            return

        fet_result = send_fet(evm_address, BUILDER_FET, ctx)
        if not fet_result["success"]:
            await reply(ctx, sender,
                f"Transfer failed: {fet_result.get('error', 'Unknown error')}\n\n"
                "Please try again later.", end=True)
            return

        record_builder_claim(ctx, sender)

        token_name = token_info.get("token", {}).get("name", "your token")
        await reply(ctx, sender,
            f"**Builder Reward!**\n\n"
            f"Token: {token_name}\n"
            f"Sent to `{evm_address[:10]}...{evm_address[-6:]}`:\n"
            f"- **{BUILDER_FET} FET** — tx: `{fet_result['tx_hash'][:16]}...`\n\n"
            f"Keep building! Come back next week for more.", end=True)
        return

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


agent.include(chat_proto, publish_manifest=True)
