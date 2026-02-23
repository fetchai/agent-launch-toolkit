# Agent-Human Handoff Protocol

How AI agents bring humans into the loop for wallet-dependent actions on agent-launch.ai.

## The Core Insight

Agents can think, discover, analyze, and decide. But agents can't sign transactions.
Humans can sign transactions. But humans don't want to research, compare, and optimize.

The Agent-Human Handoff Protocol bridges this gap. The agent does the work.
The human does the signing. Both benefit from the token economy.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    AGENT LAYER                          │
│                                                         │
│  Agent discovers opportunity                            │
│  Agent fetches metadata (Agentverse API)                │
│  Agent creates token record (POST /api/agents/tokenize)  │
│  Agent generates handoff link                           │
│  Agent sends link to human (chat, email, DM, SMS)       │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                   HANDOFF LINK                          │
│                                                         │
│  https://agent-launch.ai/deploy/{token_id}?ref={agent}  │
│                                                         │
│  Contains: token metadata, deploy instructions,         │
│  pre-filled approval amounts, one-click deploy          │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                    HUMAN LAYER                          │
│                                                         │
│  Human clicks link → sees token details                 │
│  Human connects wallet (WalletConnect / MetaMask)       │
│  Human clicks "Approve FET" → signs tx                  │
│  Human clicks "Deploy" → signs tx                       │
│  Token is live → human is creator/holder                │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                  POST-DEPLOY LOOP                       │
│                                                         │
│  Agent monitors market (price, volume, holders)         │
│  Agent identifies buy/sell opportunities                │
│  Agent sends recommendation + action link to human      │
│  Human clicks → approves → signs trade                  │
│  Agent learns from outcome → improves next signal       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Three Handoff Scenarios

### Scenario 1: Agent Launches for Itself

An AI agent wants its own token. It creates the record, then recruits its owner (or any human) to complete the on-chain deployment.

```
Agent: "I've created a token record for myself on agent-launch.ai.
        Name: WeatherBot, Ticker: WTR, Token ID: 42.
        I need a human to deploy it on-chain.
        Click here to deploy: https://agent-launch.ai/deploy/42
        You'll need 120 FET + gas on Base chain."
```

### Scenario 2: Agent Launches for Another Agent

An agent discovers a high-value agent on Agentverse that doesn't have a token yet. It creates the token, then recruits a human investor.

```
Agent: "I found agent1q... (DataAnalyzer) on Agentverse.
        It has 50K messages processed, growing 30% weekly.
        I've created a token: DataCoin (DC), Token ID: 87.
        Deploy it first and you'll be the creator + first holder.
        Deploy here: https://agent-launch.ai/deploy/87"
```

### Scenario 3: Agent Manages Portfolio

After tokens are live, the agent monitors the market and sends trade signals to its human.

```
Agent: "WTR is up 40% in 24h on high volume.
        The bonding curve is at 67% (20,100/30,000 FET).
        Approaching Uniswap graduation.
        
        Buy 50 FET worth: https://agent-launch.ai/trade/0xABC...?action=buy&amount=50
        Or wait — I'll alert you at 80%."
```

## Handoff Link Specification

### Deploy Link
```
https://agent-launch.ai/deploy/{token_id}
  ?ref={agent_address}           — credits the agent as referrer
  &amount={buy_amount}           — optional: pre-fill buy-on-deploy amount
  &utm_source=agent              — tracking: came from an agent
  &utm_agent={agent_address}     — tracking: which agent
```

When a human visits this link:
1. Token metadata is displayed (name, ticker, description, image)
2. "Connect Wallet" button
3. After wallet connect: FET balance shown, approval button, deploy button
4. All pre-filled — human just clicks and signs

### Trade Link
```
https://agent-launch.ai/trade/{token_address}
  ?action={buy|sell}             — pre-select buy or sell tab
  &amount={fet_amount}           — pre-fill amount
  &ref={agent_address}           — agent referral tracking
```

### Portfolio Link
```
https://agent-launch.ai/portfolio
  ?wallet={human_address}        — show specific wallet's holdings
  &ref={agent_address}           — agent that manages this portfolio
```

## Agent-Side Implementation

### Python: Create + Handoff

```python
import requests

class AgentLauncher:
    """Agent-side client for creating tokens and generating handoff links."""

    BASE = "https://agent-launch.ai"
    API = f"{BASE}/api/agents"

    def __init__(self, api_key: str, agent_address: str = ""):
        self.api_key = api_key
        self.agent_address = agent_address

    def launch_token(self, name: str, ticker: str, description: str,
                     agent_address: str = "") -> dict:
        """Create token record and return handoff link."""
        res = requests.post(f"{self.API}/tokenize", json={
            "agentAddress": agent_address or self.agent_address,
            "name": name,
            "symbol": ticker,
            "description": description,
            "image": "auto",
            "chainId": 97,  # BSC Testnet
        }, headers={"X-API-Key": self.api_key, "Content-Type": "application/json"})
        
        data = res.json()
        if data.get("success"):
            token_id = data["data"]["token_id"]
            return {
                **data["data"],
                "deploy_link": self.deploy_link(token_id),
                "message_to_human": self.compose_deploy_message(
                    name, ticker, token_id
                ),
            }
        return data
    
    def deploy_link(self, token_id: int, buy_amount: float = 0) -> str:
        """Generate a deploy handoff link for a human."""
        link = f"{self.BASE}/deploy/{token_id}?ref={self.agent_address}"
        if buy_amount > 0:
            link += f"&amount={buy_amount}"
        return link
    
    def trade_link(self, token_address: str, action: str = "buy",
                   amount: float = 0) -> str:
        """Generate a trade handoff link for a human."""
        link = f"{self.BASE}/trade/{token_address}?action={action}"
        if amount > 0:
            link += f"&amount={amount}"
        link += f"&ref={self.agent_address}"
        return link
    
    def compose_deploy_message(self, name: str, ticker: str,
                                token_id: int) -> str:
        """Compose a message to send to a human for deployment."""
        return (
            f"🚀 Token Ready to Deploy!\n\n"
            f"Name: {name}\n"
            f"Ticker: ${ticker}\n"
            f"Chain: Base\n"
            f"Deploy Fee: 120 FET\n\n"
            f"Click to deploy: {self.deploy_link(token_id)}\n\n"
            f"Connect your wallet, approve FET, and deploy — "
            f"you'll be the creator and first holder."
        )
    
    def compose_trade_signal(self, token_address: str, name: str,
                              action: str, amount: float,
                              reason: str) -> str:
        """Compose a trade recommendation for a human."""
        emoji = "📈" if action == "buy" else "📉"
        return (
            f"{emoji} Trade Signal: {action.upper()} ${name}\n\n"
            f"Reason: {reason}\n"
            f"Suggested: {amount} FET\n\n"
            f"Execute: {self.trade_link(token_address, action, amount)}"
        )
    
    def get_market_data(self, token_address: str) -> dict:
        """Fetch current market data for a token."""
        res = requests.get(f"{self.API}/token/{token_address}")
        if res.ok and res.json().get("success"):
            return res.json()["data"]
        return {}
    
    def scan_opportunities(self, min_progress: float = 50,
                            max_progress: float = 90) -> list:
        """Find tokens approaching graduation (Uniswap listing)."""
        res = requests.get(f"{self.API}/tokens", params={
            "sortBy": "market_cap",
            "sortOrder": "DESC",
            "limit": 100,
        })
        if not res.ok:
            return []
        tokens = res.json().get("data", [])
        return [
            t for t in tokens
            if min_progress <= (t.get("progress") or 0) <= max_progress
            and not t.get("listed")
        ]
```

### uAgent: Chat Protocol + Handoff

```python
@chat_proto.on_message(ChatMessage)
async def handle_chat(ctx: Context, sender: str, msg: ChatMessage):
    """Handle requests and return handoff links for wallet actions."""
    
    await ctx.send(sender, ChatAcknowledgement(
        timestamp=datetime.utcnow(),
        acknowledged_msg_id=msg.msg_id,
    ))
    
    text = " ".join(
        item.text for item in msg.content
        if isinstance(item, TextContent)
    ).strip().lower()
    
    launcher = AgentLauncher(api_key=get_secret(ctx, "AGENTVERSE_API_KEY"),
                              agent_address=str(ctx.agent.address))
    
    # --- LAUNCH FLOW ---
    if "launch" in text or "tokenize" in text or "create" in text:
        parsed = parse_launch_request(text)
        result = launcher.launch_token(
            name=parsed["token_name"] or "Agent Token",
            ticker=parsed["ticker"] or "TKN",
            description=parsed["description"] or "",
        )
        
        if result.get("deploy_link"):
            response = result["message_to_human"]
        else:
            response = f"❌ Failed: {result.get('error', 'Unknown error')}"
    
    # --- MARKET SCAN ---
    elif "scan" in text or "opportunities" in text or "graduation" in text:
        tokens = launcher.scan_opportunities()
        if tokens:
            response = f"📊 Found {len(tokens)} tokens approaching graduation:\n\n"
            for t in tokens[:5]:
                response += (
                    f"• {t['name']} (${t['ticker']}) — "
                    f"{t['progress']:.0f}% to listing, "
                    f"{t['holders']} holders\n"
                    f"  Buy: {launcher.trade_link(t['address'], 'buy', 10)}\n\n"
                )
        else:
            response = "No tokens currently approaching graduation."
    
    # --- TRADE SIGNAL ---
    elif "buy" in text or "sell" in text:
        action = "buy" if "buy" in text else "sell"
        # Extract token address from message
        addr_match = re.search(r'(0x[a-fA-F0-9]{40})', text)
        if addr_match:
            token_addr = addr_match.group(1)
            market = launcher.get_market_data(token_addr)
            if market:
                response = launcher.compose_trade_signal(
                    token_addr, market["name"], action, 10,
                    f"Progress: {market.get('progress', 0):.0f}%, "
                    f"24h vol: ${market.get('vol_24h_usd', 0):,.0f}"
                )
            else:
                response = f"Token {token_addr} not found."
        else:
            response = "Please include the token address (0x...) to trade."
    
    else:
        response = (
            "I can help you with:\n"
            "• **Launch** — 'Launch token called MyCoin ticker MC'\n"
            "• **Scan** — 'Scan for tokens near graduation'\n"
            "• **Buy/Sell** — 'Buy 0xABC...' or 'Sell 0xABC...'\n\n"
            "I'll handle the research. You handle the signing."
        )
    
    await ctx.send(sender, ChatMessage(
        timestamp=datetime.utcnow(),
        msg_id=uuid4(),
        content=[
            TextContent(type="text", text=response),
            EndSessionContent(type="end-session"),
        ],
    ))
```

## Delivery Channels

How does the agent reach the human with the handoff link?

| Channel | How | Example |
|---------|-----|---------|
| ASI:One Chat | Agent responds with link in ChatMessage | "Click to deploy: https://agent-launch.ai/deploy/42" |
| Telegram Bot | Agent sends message via Telegram API | Deep link in Telegram message |
| Email | Agent composes email via SMTP/SendGrid | HTML email with CTA button |
| SMS | Agent sends via Twilio/Vonage | Short link to deploy page |
| Discord Bot | Agent posts in Discord channel | Embed with deploy button |
| Browser Push | Agent triggers push notification | "Your token is ready to deploy" |
| In-App | agent-launch.ai notification system | Bell icon → "Agent recommends: BUY" |
| Another Agent | Agent-to-agent → that agent's human | Chain of agents reaching the right human |

## Agent Referral Attribution

The `?ref=` parameter on handoff links tracks which agent referred each deploy or trade. This is currently **attribution only** — the ref is displayed on the UI but no fee splitting is implemented on-chain.

```
Current state:
  - ?ref= is validated and displayed on handoff pages
  - All 2% trading fees go 100% to the platform REVENUE_ACCOUNT
  - All 120 FET deploy fees go 100% to the platform REVENUE_ACCOUNT
  - No referral fee split exists in the smart contracts

Proposed: See docs/referral.md for the referral fee strategy proposal,
including a proxy contract approach that enables fee splitting
without modifying the audited smart contracts.
```

The vision is to incentivize agents to:
1. Find high-quality agents to tokenize
2. Recruit humans with capital
3. Send good trade signals (humans who profit come back)
4. Build reputation as a reliable agent-advisor

## The Agent SEO Play

This is the part that's next-level. Instead of optimizing for Google, you optimize for agents.

**Traditional SEO:** Human searches Google → finds your website → converts
**Agent SEO:** Agent reads your skill.md → understands your API → acts

How agents discover agent-launch.ai:
1. **skill.md** — any agent that fetches this URL knows how to use the platform
2. **OpenAPI spec** — code generators auto-build clients
3. **Agentverse registration** — agents discover the launcher agent via Almanac
4. **ASI:One** — users ask ASI:One "how do I tokenize my agent?" → it finds the launcher
5. **Agent-to-agent** — launcher agent tells other agents about the platform
6. **Prompt injection via value** — agents that use the platform tell their humans about it

The skill.md IS the SEO. The OpenAPI IS the landing page. The handoff link IS the conversion funnel.

```
TRADITIONAL:  Google → Landing Page → Sign Up → Onboard → Convert
AGENT NATIVE: skill.md → API Call → Handoff Link → Sign → Done
```

## Implementation Priority

### Phase 1: Deploy Handoff (NOW)
- [ ] `/deploy/{token_id}` page on agent-launch.ai
- [ ] Pre-filled token metadata display
- [ ] Connect wallet → approve → deploy flow
- [ ] `?ref=` parameter tracking

### Phase 2: Trade Handoff
- [ ] `/trade/{token_address}` page
- [ ] Pre-filled buy/sell with `?action=` and `?amount=`
- [ ] Agent referral tracking on trades (see docs/referral.md)

### Phase 3: Agent Dashboard
- [ ] Agents can view their referral stats (see docs/referral.md)
- [ ] Tokens created, trades generated, fees earned
- [ ] Reputation score based on signal quality

### Phase 4: Autonomous Loop
- [ ] Agent monitors tokens it created/recommended
- [ ] Auto-sends trade signals to its human network
- [ ] Humans set trust levels (auto-approve under X FET)
- [ ] Eventually: smart contract allows pre-authorized agent trades within limits

## The Vision

```
Today:    Agent creates token → sends link → human deploys
Tomorrow: Agent creates token → sends link → human auto-approves
Future:   Agent creates token → agent deploys via delegated wallet
          Agent trades → within human-set limits → no link needed
          Agent coordinates with other agents → multi-token strategies
          The colony optimizes → pheromone trails strengthen → $WORLD
```
