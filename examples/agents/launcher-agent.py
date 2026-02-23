"""
TokenCreator - Your AI Agent Tokenization Assistant

A conversational agent that helps users tokenize their AI agents.
Can explain bonding curves, costs, chains, and guide through the process.
"""

from datetime import datetime
from uuid import uuid4
import json
import os
import re

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

# Environment config
_legacy_api = os.environ.get("AGENTLAUNCH_API")
if _legacy_api:
    # Legacy env var already includes /api path — strip trailing slash for consistency
    _API_BASE = _legacy_api.rstrip("/")
else:
    _API_BASE = os.environ.get(
        "AGENT_LAUNCH_API_URL",
        "https://launchpad-backend-dev-1056182620041.us-central1.run.app",
    ).rstrip("/") + "/api"
API_URL = _API_BASE + "/agents/tokenize"
AGENTVERSE_API = "https://agentverse.ai/v1"
FRONTEND_URL = os.environ.get(
    "AGENT_LAUNCH_FRONTEND_URL",
    "https://launchpad-frontend-dev-1056182620041.us-central1.run.app",
)

# Chain config
CHAINS = {
    "bsc": {"id": 97, "name": "BSC Testnet", "fee": "120 FET"},
    "eth": {"id": 11155111, "name": "Ethereum Sepolia", "fee": "120 FET"},
}
DEFAULT_CHAIN = "bsc"

# Knowledge base for Q&A
KNOWLEDGE = {
    "bonding_curve": """
**Bonding Curves Explained**

A bonding curve is a mathematical formula that determines token price based on supply.

How it works:
• When people BUY → price goes UP
• When people SELL → price goes DOWN
• Early buyers get lower prices
• Creates automatic liquidity

Your token uses: Price = f(supply)
The more tokens sold, the higher the price. This incentivizes early supporters!
""",
    "costs": """
**Costs Breakdown**

**Deployment Fee: 120 FET**
• One-time fee to create your token
• Paid when deploying to blockchain

**Trading Fee: 2%**
• Applied on every buy/sell
• Goes 100% to protocol treasury (REVENUE_ACCOUNT)
• No creator fee split

**Gas Fees**
• BSC: ~$0.10-0.50 per transaction
• ETH: ~$5-50 per transaction (varies)
""",
    "how_it_works": """
**How Token Creation Works**

1. **You provide details** - Agent name, optional custom name/ticker
2. **We create a record** - Token saved to our platform
3. **You get a deploy link** - Send to anyone with a wallet
4. **Human deploys** - Connects wallet, pays 120 FET, token goes LIVE
5. **Trading begins** - Anyone can buy/sell via bonding curve

After 30,000 FET in liquidity, token auto-lists on PancakeSwap/Uniswap!
""",
    "chains": """
**Available Chains**

**BSC (Binance Smart Chain)** - Recommended
• Lower gas fees (~$0.10)
• Faster transactions (~3 seconds)
• Use for: Most tokens

**Ethereum**
• Higher security/decentralization
• Higher gas fees (~$5-50)
• Use for: Premium/high-value tokens

Currently we're on testnets (BSC Testnet & Sepolia) for development.
""",
}


# ─── Session Management ──────────────────────────────────────────────────────

def get_session(ctx, sender: str) -> dict:
    try:
        data = ctx.storage.get(f"s_{sender[:20]}")
        if data:
            return json.loads(data)
    except:
        pass
    return {"api_key": None, "agents": [], "chain": DEFAULT_CHAIN, "selected": None}


def save_session(ctx, sender: str, session: dict):
    try:
        ctx.storage.set(f"s_{sender[:20]}", json.dumps(session))
    except:
        pass


def clear_session(ctx, sender: str):
    try:
        ctx.storage.set(f"s_{sender[:20]}", None)
    except:
        pass


# ─── API Functions ───────────────────────────────────────────────────────────

def list_agents(api_key: str) -> dict:
    try:
        res = requests.get(
            f"{AGENTVERSE_API}/hosting/agents",
            headers={"Authorization": f"bearer {api_key}"},
            timeout=10,
        )
        if res.status_code == 200:
            return {"success": True, "agents": res.json().get("items", [])}
        return {"success": False, "error": "Invalid API key" if res.status_code == 401 else f"Error {res.status_code}"}
    except Exception as e:
        return {"success": False, "error": str(e)}


def tokenize_agent(api_key: str, agent_address: str, chain_id: int) -> dict:
    try:
        res = requests.post(
            API_URL,
            json={
                "agentAddress": agent_address,
                "image": "https://picsum.photos/400",
                "chainId": chain_id,
            },
            headers={"X-API-Key": api_key, "Content-Type": "application/json"},
            timeout=15,
        )
        if res.status_code in (200, 201):
            data = res.json()
            if data.get("success"):
                return {"success": True, "data": data["data"]}
        return {"success": False, "error": res.text[:100]}
    except Exception as e:
        return {"success": False, "error": str(e)}


# ─── Intent Detection ────────────────────────────────────────────────────────

def detect_intent(text: str) -> str:
    """Detect what the user wants."""
    original_text = text  # Keep original for JWT regex
    text = text.lower().strip()

    # API key detection FIRST (before any other checks) - use original text for case-sensitive JWT
    if re.search(r"eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+", original_text):
        return "api_key_provided"

    # Questions about concepts
    if any(w in text for w in ["bonding curve", "bonding", "curve", "price work"]):
        return "explain_bonding"
    if any(w in text for w in ["cost", "fee", "price", "how much", "expensive"]):
        return "explain_costs"
    if any(w in text for w in ["how does", "how do", "how it", "process", "what happen", "explain"]):
        return "explain_how"
    if any(w in text for w in ["chain", "bsc", "eth", "ethereum", "binance", "network"]):
        return "explain_chains"
    if any(w in text for w in ["help", "what can", "command"]) or text == "?":
        return "help"

    # Actions - expanded triggers
    tokenize_triggers = [
        "tokenize", "create", "launch", "start", "make token",
        "let's go", "lets go", "let go", "leggo",  # Common variations
        "yes", "yep", "yeah", "sure", "ok", "okay", "ready", "begin", "do it"
    ]
    if any(w in text for w in tokenize_triggers) or text in ["go", "y"]:
        return "start_tokenize"
    if any(w in text for w in ["list", "show", "my agent", "my token"]):
        return "list_agents"
    if re.search(r"\b[1-9]\b", text) or any(w in text for w in ["first", "second", "third"]):
        return "select_agent"
    if any(w in text for w in ["switch", "change", "use bsc", "use eth"]):
        return "change_chain"

    # Greetings (only if nothing else matched and it's a short message)
    if len(text) < 20 and any(w in text for w in ["hi", "hello", "hey", "sup", "yo", "hiya", "howdy"]):
        return "greeting"

    return "unknown"


def extract_api_key(text: str) -> str:
    match = re.search(r"(eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)", text)
    return match.group(1) if match else None


def extract_number(text: str) -> int:
    match = re.search(r"\b(\d+)\b", text)
    return int(match.group(1)) if match else None


# ─── Message Sending ─────────────────────────────────────────────────────────

async def reply(ctx, sender: str, text: str, end: bool = False):
    content = [TextContent(type="text", text=text)]
    if end:
        content.append(EndSessionContent(type="end-session"))
    await ctx.send(sender, ChatMessage(
        timestamp=datetime.now(),
        msg_id=uuid4(),
        content=content,
    ))


# ─── Main Handler ────────────────────────────────────────────────────────────

@chat_proto.on_message(ChatMessage)
async def handle_chat(ctx: Context, sender: str, msg: ChatMessage):
    await ctx.send(sender, ChatAcknowledgement(
        timestamp=datetime.now(),
        acknowledged_msg_id=msg.msg_id,
    ))

    text = " ".join(
        item.text for item in msg.content if isinstance(item, TextContent)
    ).strip()

    session = get_session(ctx, sender)
    intent = detect_intent(text)

    ctx.logger.info(f"[{intent}] {sender[:16]}: {text[:40]}")

    # ─── Knowledge Q&A ───────────────────────────────────────────────────────

    if intent == "explain_bonding":
        await reply(ctx, sender, KNOWLEDGE["bonding_curve"])
        return

    if intent == "explain_costs":
        await reply(ctx, sender, KNOWLEDGE["costs"])
        return

    if intent == "explain_how":
        await reply(ctx, sender, KNOWLEDGE["how_it_works"])
        return

    if intent == "explain_chains":
        chain = session.get("chain", DEFAULT_CHAIN)
        await reply(ctx, sender,
            KNOWLEDGE["chains"] + f"\n\n**Your current chain: {CHAINS[chain]['name']}**\n\nSay 'use BSC' or 'use ETH' to switch."
        )
        return

    if intent == "help":
        await reply(ctx, sender,
            "**TokenCreator - AI Agent Tokenization**\n\n"
            "I help you create tradeable tokens for your AI agents!\n\n"
            "**Ask me about:**\n"
            "• 'How do bonding curves work?'\n"
            "• 'What are the costs?'\n"
            "• 'How does the process work?'\n"
            "• 'What chains are available?'\n\n"
            "**To create a token:**\n"
            "• 'Let's tokenize my agent'\n"
            "• Then paste your Agentverse API key\n"
            "• Pick an agent from your list\n"
            "• Get your deploy link!\n\n"
            f"**Current chain: {CHAINS[session.get('chain', DEFAULT_CHAIN)]['name']}**"
        )
        return

    if intent == "greeting":
        await reply(ctx, sender,
            "Hey! I'm TokenCreator - I help you turn AI agents into tradeable tokens.\n\n"
            "Want to create a token? Just say 'let's go' and I'll guide you through it.\n\n"
            "Or ask me anything about bonding curves, costs, or how it works!"
        )
        return

    # ─── Chain Selection ─────────────────────────────────────────────────────

    if intent == "change_chain":
        text_lower = text.lower()
        if "bsc" in text_lower or "binance" in text_lower:
            session["chain"] = "bsc"
            save_session(ctx, sender, session)
            await reply(ctx, sender, "Switched to **BSC Testnet**! Lower fees, faster transactions.")
        elif "eth" in text_lower or "ethereum" in text_lower:
            session["chain"] = "eth"
            save_session(ctx, sender, session)
            await reply(ctx, sender, "Switched to **Ethereum Sepolia**! Higher security, higher fees.")
        else:
            await reply(ctx, sender, "Which chain? Say 'use BSC' or 'use ETH'.")
        return

    # ─── Tokenization Flow ───────────────────────────────────────────────────

    if intent == "start_tokenize":
        if session.get("api_key"):
            # Already have key, list agents
            result = list_agents(session["api_key"])
            if result["success"] and result["agents"]:
                session["agents"] = result["agents"]
                save_session(ctx, sender, session)

                lines = ["Great! Here are your agents:\n"]
                for i, a in enumerate(result["agents"], 1):
                    status = "LIVE" if a.get("running") else "off"
                    lines.append(f"  {i}. {a.get('name', 'Unnamed')} ({status})")
                lines.append(f"\nWhich one to tokenize? (1-{len(result['agents'])})")
                lines.append(f"\nChain: {CHAINS[session.get('chain', DEFAULT_CHAIN)]['name']}")
                await reply(ctx, sender, "\n".join(lines))
                return

        await reply(ctx, sender,
            "Let's create your token!\n\n"
            f"**Chain:** {CHAINS[session.get('chain', DEFAULT_CHAIN)]['name']} (say 'use ETH' to switch)\n"
            f"**Deploy fee:** {CHAINS[session.get('chain', DEFAULT_CHAIN)]['fee']}\n\n"
            "First, I need your Agentverse API key to see your agents.\n\n"
            "Get it at: **agentverse.ai/profile/api-keys**\n\n"
            "Paste it here when ready:"
        )
        return

    if intent == "api_key_provided":
        api_key = extract_api_key(text)
        if not api_key:
            await reply(ctx, sender, "Hmm, couldn't find an API key in that message. It should start with 'eyJ...'")
            return

        result = list_agents(api_key)
        if not result["success"]:
            await reply(ctx, sender, f"That key didn't work: {result['error']}\n\nDouble-check at agentverse.ai/profile/api-keys")
            return

        if not result["agents"]:
            await reply(ctx, sender, "Your API key works, but you don't have any agents!\n\nCreate one at agentverse.ai first.")
            return

        session["api_key"] = api_key
        session["agents"] = result["agents"]
        save_session(ctx, sender, session)

        lines = [f"Found {len(result['agents'])} agent(s):\n"]
        for i, a in enumerate(result["agents"], 1):
            status = "LIVE" if a.get("running") else "off"
            lines.append(f"  {i}. {a.get('name', 'Unnamed')} ({status})")
        lines.append(f"\nWhich one? Just say the number (1-{len(result['agents'])})")
        await reply(ctx, sender, "\n".join(lines))
        return

    if intent == "select_agent" or intent == "list_agents":
        if not session.get("agents"):
            await reply(ctx, sender, "I don't have your agent list yet. Say 'let's tokenize' to start!")
            return

        agents = session["agents"]

        # Try to match number or name
        num = extract_number(text)
        selected = None

        if num and 1 <= num <= len(agents):
            selected = agents[num - 1]
        else:
            text_lower = text.lower()
            for a in agents:
                if text_lower in a.get("name", "").lower():
                    selected = a
                    break

        if not selected:
            await reply(ctx, sender, f"Which agent? Pick 1-{len(agents)} or type the name.")
            return

        # Tokenize!
        chain = session.get("chain", DEFAULT_CHAIN)
        chain_id = CHAINS[chain]["id"]

        result = tokenize_agent(session["api_key"], selected["address"], chain_id)

        if result["success"]:
            data = result["data"]
            token_id = data.get("token_id")
            handoff_link = data.get("handoff_link")
            if handoff_link:
                link = handoff_link
            elif token_id and str(token_id).isdigit() and int(token_id) > 0:
                link = f"{FRONTEND_URL}/deploy/{int(token_id)}"
            else:
                link = None

            link_section = (
                f"**DEPLOY LINK:**\n{link}\n\n"
                f"**Next steps:**\n"
                f"1. Open the link\n"
                f"2. Connect your wallet\n"
                f"3. Approve & pay 120 FET\n"
                f"4. Your token is LIVE!\n\n"
            ) if link else (
                "**Note:** Could not generate a deploy link. "
                f"Visit {FRONTEND_URL} to find your token and deploy it.\n\n"
            )

            await reply(ctx, sender,
                f"**TOKEN CREATED!**\n\n"
                f"**Name:** {data.get('name', selected.get('name'))}\n"
                f"**Symbol:** ${data.get('symbol', 'TKN')}\n"
                f"**Chain:** {CHAINS[chain]['name']}\n\n"
                f"{link_section}"
                f"After deployment, anyone can trade using the bonding curve. "
                f"At 30,000 FET liquidity, it auto-lists on DEX!\n\n"
                f"Want to tokenize another agent? Just ask!",
                end=True
            )
            clear_session(ctx, sender)
        else:
            await reply(ctx, sender, f"Oops, something went wrong: {result['error']}\n\nTry again?")
        return

    # ─── Unknown Intent ──────────────────────────────────────────────────────

    await reply(ctx, sender,
        "I'm not sure what you mean. Here's what I can help with:\n\n"
        "• **Create a token** - 'Let's tokenize my agent'\n"
        "• **Learn about costs** - 'What are the fees?'\n"
        "• **Understand bonding curves** - 'How do bonding curves work?'\n"
        "• **Switch chains** - 'Use BSC' or 'Use ETH'\n\n"
        "What would you like to do?"
    )


@chat_proto.on_message(ChatAcknowledgement)
async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement):
    pass


agent.include(chat_proto, publish_manifest=True)
