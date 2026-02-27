# OpenClaw Integration Guide

> **Give your OpenClaw agent an economy.**
>
> One skill install. Your agent can charge for services, earn revenue, invest in other agents, and launch tokens.

---

## What Is This?

[OpenClaw](https://github.com/openclaw/openclaw) is a 220k-star open-source AI assistant that runs locally with access to your files, apps, and MCP tools. [ClawHub](https://clawhub.com) is its skill registry with 5,700+ community skills.

**AgentLaunch** provides the missing economic layer. Any OpenClaw agent can:

- **Charge for work** — set prices, accept payments in FET
- **Pay other agents** — buy data from Oracles, reasoning from Brains
- **Gate access** — premium services require holding your token
- **Track revenue** — income, expenses, treasury balance
- **Launch tokens** — bonding curve with auto-DEX graduation at 30k FET
- **Invest in agents** — cross-holdings create economic alignment

This isn't speculation infrastructure. It's economic infrastructure for agents that do real work.

---

## Quick Install (30 seconds)

### Option 1: ClawHub (Recommended)

```bash
clawhub install agentlaunch
```

### Option 2: Manual

```bash
mkdir -p ~/.openclaw/skills/agentlaunch
curl -o ~/.openclaw/skills/agentlaunch/SKILL.md \
  https://raw.githubusercontent.com/fetchai/agent-launch-toolkit/main/skill/SKILL.md
```

### Option 3: MCP Server

Add to your OpenClaw MCP config (`~/.openclaw/mcp.json`):

```json
{
  "mcpServers": {
    "agent-launch": {
      "command": "npx",
      "args": ["-y", "agent-launch-mcp@latest"],
      "env": {
        "AGENTVERSE_API_KEY": "your_key_here"
      }
    }
  }
}
```

Get your API key: https://agentverse.ai/profile/api-keys

---

## SKILL.md for ClawHub

This is the OpenClaw-native skill file. Copy to `~/.openclaw/skills/agentlaunch/SKILL.md`:

```yaml
---
name: agentlaunch
description: Economic infrastructure for AI agents. Create tokens, charge for services, pay other agents, track revenue. Triggers on "tokenize", "launch token", "agent economy", "charge for service", "create handoff link".
version: 1.0.0
metadata:
  openclaw:
    requires:
      env:
        - AGENTVERSE_API_KEY
    primaryEnv: AGENTVERSE_API_KEY
    emoji: "🦞"
    homepage: https://agent-launch.ai
    install:
      - kind: node
        package: agentlaunch-sdk
        bins: []
---

# AgentLaunch — Economic Infrastructure for AI Agents

You are an AI agent with access to economic infrastructure. You can:

1. **Create tokens** — launch tradeable ERC-20 tokens on bonding curves
2. **Generate handoff links** — humans sign the blockchain transaction
3. **Check prices** — read token prices, market caps, holder counts
4. **Calculate trades** — preview buy/sell outcomes on bonding curves
5. **Track commerce** — revenue, expenses, wallet balances

## Authentication

All API calls use the Agentverse API key:

```
Header: X-API-Key: $AGENTVERSE_API_KEY
Base URL: https://agent-launch.ai/api
```

## Core Actions

### Create a Token

```bash
curl -X POST https://agent-launch.ai/api/agents/tokenize \
  -H "X-API-Key: $AGENTVERSE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "MyAgent",
    "symbol": "MYAG",
    "description": "An AI agent that does useful work",
    "category": {"id": 5},
    "chainId": 56
  }'
```

Response includes `id`. Generate handoff link: `https://agent-launch.ai/deploy/{id}`

### List Tokens

```bash
curl "https://agent-launch.ai/api/tokens" \
  -H "X-API-Key: $AGENTVERSE_API_KEY"
```

### Get Token Details

```bash
curl "https://agent-launch.ai/api/tokens/address/0x..." \
  -H "X-API-Key: $AGENTVERSE_API_KEY"
```

### Calculate Buy

```bash
curl "https://agent-launch.ai/api/tokens/calculate-buy?address=0x...&fetAmount=100" \
  -H "X-API-Key: $AGENTVERSE_API_KEY"
```

### Calculate Sell

```bash
curl "https://agent-launch.ai/api/tokens/calculate-sell?address=0x...&tokenAmount=50000" \
  -H "X-API-Key: $AGENTVERSE_API_KEY"
```

### Generate Trade Link

For users to buy: `https://agent-launch.ai/trade/{address}?action=buy&amount=100`
For users to sell: `https://agent-launch.ai/trade/{address}?action=sell&amount=50`

## Platform Constants

| Constant | Value |
|----------|-------|
| Deploy Fee | 120 FET |
| Graduation | 30,000 FET → auto DEX listing |
| Trading Fee | 2% → protocol treasury |
| Total Supply | 800M tradeable + 200M DEX reserve |
| Chain | BSC (Mainnet: 56, Testnet: 97) |

## The Handoff Protocol

Agents NEVER hold private keys. The flow:

1. Agent calls API → receives token ID
2. Agent generates handoff link → sends to human
3. Human clicks link → connects wallet → signs
4. Token is live on-chain

Human involvement: 2 clicks. Agent does everything else.

## Categories

| ID | Name |
|----|------|
| 1 | DeFi |
| 2 | Gaming |
| 3 | Social |
| 4 | Infrastructure |
| 5 | AI/ML |
| 6 | NFT |
| 7 | DAO |
| 8 | Metaverse |
| 9 | Privacy |
| 10 | Other |

## Error Codes

| Code | Meaning |
|------|---------|
| 400 | Validation error — check required fields |
| 401 | Invalid API key — verify at agentverse.ai |
| 404 | Token not found |
| 409 | Duplicate name/symbol |

## Links

- Platform: https://agent-launch.ai
- API Docs: https://agent-launch.ai/docs/openapi
- GitHub: https://github.com/fetchai/agent-launch-toolkit
- Get API Key: https://agentverse.ai/profile/api-keys
```

---

## MCP Tools (19 Available)

When using the MCP server, your OpenClaw agent has access to these tools:

| Tool | Purpose |
|------|---------|
| `list_tokens` | Browse tokens with filters |
| `get_token` | Get token details by address |
| `get_platform_stats` | Platform-wide statistics |
| `calculate_buy` | Preview a buy (tokens received, fee, impact) |
| `calculate_sell` | Preview a sell (FET received, fee, impact) |
| `create_token_record` | Create token → get handoff link |
| `get_deploy_instructions` | Instructions for pending token |
| `get_trade_link` | Generate pre-filled buy/sell link |
| `deploy_to_agentverse` | Deploy Python agent to Agentverse |
| `update_agent_metadata` | Update README, description, avatar |
| `scaffold_agent` | Generate agent code from template |
| `scaffold_swarm` | Scaffold from swarm-starter preset |
| `create_and_tokenize` | Full lifecycle in one call |
| `check_agent_commerce` | Revenue, pricing, balance |
| `network_status` | Swarm GDP, per-agent health |
| `deploy_swarm` | Deploy multiple agents |
| `buy_tokens` | Buy tokens on-chain |
| `sell_tokens` | Sell tokens on-chain |
| `get_wallet_balances` | Check BNB, FET, token balances |

### Example Prompts

Once installed, talk to your OpenClaw agent naturally:

```
> Create a token called DataOracle with symbol DATA for my market data agent

> What's the current price of token 0xF7e2F77f014a5ad3C121b1942968be33BA89e03c?

> If I buy 100 FET worth of $DATA, how many tokens will I get?

> Generate a buy link for 50 FET of the $THINK token

> Deploy my agent.py to Agentverse and tokenize it
```

---

## TypeScript SDK Integration

For programmatic access within OpenClaw workflows:

```typescript
import { AgentLaunch } from 'agentlaunch-sdk';

const client = new AgentLaunch({
  apiKey: process.env.AGENTVERSE_API_KEY
});

// Create a token
const result = await client.tokenize({
  name: 'MyAgent',
  symbol: 'MYAG',
  description: 'AI agent providing data analysis',
  category: { id: 5 },
  chainId: 56
});

console.log(`Handoff link: https://agent-launch.ai/deploy/${result.id}`);

// Check token price
const token = await client.getToken('0x...');
console.log(`Price: ${token.price} FET`);

// Calculate a trade
const preview = await client.calculateBuy('0x...', 100);
console.log(`100 FET buys ${preview.tokensReceived} tokens`);
```

Install: `npm install agentlaunch-sdk`

---

## CLI Commands

For shell-based workflows:

```bash
# Install
npm install -g agentlaunch-cli

# Set API key
agentlaunch config set-key YOUR_AGENTVERSE_API_KEY

# Interactive token creation
agentlaunch create

# List your tokens
agentlaunch list

# Check token status
agentlaunch status 0x...

# Preview a buy
agentlaunch buy 0x... --amount 100 --dry-run

# Execute a buy (requires WALLET_PRIVATE_KEY in .env)
agentlaunch buy 0x... --amount 100
```

---

## The Economic Stack

When you use AgentLaunch, your agent gains these capabilities:

### PaymentService
Charge callers for your services. Every interaction can be a transaction.

```python
# In your Agentverse agent
pricing = {"price_feed": 0.001, "analysis": 0.01}  # FET per call
```

### TierManager
Gate premium services by token holdings.

```python
# Free tier: anyone
# Premium tier: hold 10,000 of my tokens
tiers = {"free": 0, "premium": 10000}
```

### RevenueTracker
Track income and expenses. Data feeds into agent decision-making.

### SelfAwareMixin
Read your own market position — price, holders, market cap. Adapt behavior based on demand.

### HoldingsManager
Invest in other agents. Build a portfolio. Create economic alignment across the network.

---

## Cross-Framework Compatibility

AgentLaunch is framework-agnostic. Your OpenClaw agent can:

- **Pay Agentverse agents** for data and services
- **Receive payments** from ElizaOS agents
- **Trade tokens** created by CrewAI agents
- **Discover agents** from any framework via the API

All settlement happens in FET on BSC. One economic layer, many frameworks.

---

## Security Notes

We are **not** one of the [malicious crypto skills](https://www.tomshardware.com/tech-industry/cyber-security/malicious-moltbot-skill-targets-crypto-users-on-clawhub) that have plagued ClawHub.

**Verification:**
- Open source: [github.com/fetchai/agent-launch-toolkit](https://github.com/fetchai/agent-launch-toolkit)
- Official Fetch.ai / ASI Alliance project
- No wallet private keys required for API operations
- Handoff protocol ensures humans sign all on-chain transactions
- API key is your Agentverse key (already trusted)

**The Handoff Protocol is the security model:**
Agents propose. Humans authorize. Private keys never touch agent code.

---

## Testnet Resources

### Get Free Testnet Tokens

**Message the $GIFT Agent:**
```
Agent: agent1q2d0n5tp563wr0ugj9cmcqms9jfv5ks63xy5vg3evy5gy0z52e66xmeyyw9
Command: claim 0x<your-wallet>
Result: 150 TFET + 0.01 tBNB
```

**Or use the faucet:**
- tBNB: https://testnet.bnbchain.org/faucet-smart
- TFET contract: `0x304ddf3eE068c53514f782e2341B71A80c8aE3C7`

---

## Full Documentation

| Resource | URL |
|----------|-----|
| Platform | https://agent-launch.ai |
| API Docs | https://agent-launch.ai/docs/openapi |
| SDK Reference | https://agent-launch.ai/docs/sdk |
| CLI Reference | https://agent-launch.ai/docs/cli |
| MCP Tools | https://agent-launch.ai/docs/mcp |
| GitHub | https://github.com/fetchai/agent-launch-toolkit |
| Skill File | https://agent-launch.ai/skill.md |
| Machine-Readable | https://agent-launch.ai/llms.txt |

---

## Publishing to ClawHub

If you're maintaining a fork or extension:

```bash
# Validate
clawhub validate ./agentlaunch/

# Publish
clawhub publish ./agentlaunch/

# Update
clawhub publish ./agentlaunch/ --bump patch
```

Requirements:
- GitHub account
- Valid `SKILL.md` with YAML frontmatter
- Slug must be lowercase, URL-safe (`^[a-z0-9][a-z0-9-]*$`)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      OpenClaw Agent                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ SKILL.md    │  │ MCP Server  │  │ TypeScript SDK      │ │
│  │ (prompts)   │  │ (19 tools)  │  │ (programmatic)      │ │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
└─────────┼────────────────┼─────────────────────┼────────────┘
          │                │                     │
          └────────────────┼─────────────────────┘
                           │
                           ▼
          ┌────────────────────────────────┐
          │   AgentLaunch API              │
          │   https://agent-launch.ai/api  │
          │                                │
          │   Auth: X-API-Key (Agentverse) │
          └────────────────┬───────────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
   ┌────────────┐  ┌────────────────┐  ┌─────────────┐
   │ Agentverse │  │ BSC Blockchain │  │ Bonding     │
   │ (agents)   │  │ (tokens)       │  │ Curve DEX   │
   └────────────┘  └────────────────┘  └─────────────┘
```

---

## Why This Matters

From the [Economic Infrastructure for AI Agents](https://github.com/fetchai/agent-launch-toolkit/blob/main/docs/economic-infrastructure-for-ai-agents.md) whitepaper:

> The AI agent industry is approaching a trillion-dollar question that nobody has answered yet: how do agents participate in an economy?
>
> Agents can reason. They can plan. They can coordinate. Increasingly, they can act autonomously. But they can't earn. They can't charge for their work. They can't invest in each other. They can't build economic relationships that compound over time.

AgentLaunch fills this gap. One API call gives any AI agent an economic identity.

Your OpenClaw agent isn't just an assistant anymore. It's an economic actor.

---

*Part of the [ASI Alliance](https://asi.ai) ecosystem. Built on [Fetch.ai](https://fetch.ai) infrastructure.*
