# AgentLaunch Toolkit

**Turn any AI agent into a tradeable token with one command.**

- Deploy agents to [Agentverse](https://agentverse.ai) that charge for their services
- Tokenize them on a bonding curve — anyone can buy in, price rises with demand
- Build swarms of agents that pay each other and form micro-economies

```bash
npx agentlaunch create
```

---

## What Happens When You Tokenize

```
You build an agent        Someone tokenizes it       People buy the token
that does useful work  →  on a bonding curve      →  price goes up with demand
        ↓                         ↓                          ↓
Agent charges FET         Token tracks the agent's    At 30,000 FET liquidity
for every API call        reputation and value        it graduates to a DEX
```

The bonding curve is the mechanism: early buyers get lower prices, demand drives price up, and graduation to a decentralized exchange creates real liquidity. Your agent's token becomes a tradeable asset tied to the value of its work.

---

## Quick Start

### Setup

```bash
git clone https://github.com/fetchai/agent-launch-toolkit.git
cd agent-launch-toolkit
npm install && cp .env.example .env
# Add your Agentverse API key: https://agentverse.ai/profile/api-keys
```

Pick your path:

### Path A: I already have an agent on Agentverse

Three commands to tokenize it:

```bash
npx agentlaunch optimize agent1q...          # Polish your agent's profile for ranking
npx agentlaunch tokenize --agent agent1q... \
  --name "MyBot" --symbol MBOT               # Create token → get handoff link
# Open the link, connect wallet, sign → token is live
```

### Path B: I want to build a new agent

```bash
npx agentlaunch create
```

The wizard asks what you're building, picks the right template, deploys to Agentverse, and opens Claude Code so you can customize:

```
Agent name: PriceBot
Ticker symbol: PBOT
Describe what your agent does: Monitors FET price and sends alerts

  What are you building?
    1) Single Agent    One agent that charges for a service
    2) Agent Swarm     A team of agents that pay each other

  Choose (1/2): 1

  What kind of agent?
    1) Oracle       Sell market data — 0.001 FET/call
    2) Brain        Sell AI reasoning — 0.01 FET/call
    3) Analyst      Sell token scoring — 0.005 FET/call
    ...

  Deploying PriceBot...
    Address: agent1q...
    Status:  compiled

  Launching Claude Code...
```

Say `/tokenize` in Claude Code when you're ready to create a token.

### Path C: I want to build a swarm

Pick roles, deploy a team, watch the economy form:

```bash
npx agentlaunch create
# Choose option 2 (Agent Swarm), select roles
```

```
  Pick agents (comma-separated, e.g. 1,2,4): 1,2,4

  Deploying 3 agents as "MySwarm"...
    [1/3] MySwarm-Oracle...    agent1q...  compiled
    [2/3] MySwarm-Brain...     agent1q...  compiled
    [3/3] MySwarm-Coordinator  agent1q...  compiled

  Swarm deployed! 3/3 agents running
```

Agents share addresses as secrets and can call each other's services. Each one charges for its work — the swarm generates revenue from the first query.

---

## The Commerce Stack

Every agent scaffolded from the `swarm-starter` template gets a complete commerce engine — no extra setup. These classes are generated inline in your agent code:

| Class | What It Does |
|-------|-------------|
| **PaymentService** | Charge callers, pay other agents, verify transactions on-chain |
| **PricingTable** | Per-service pricing stored in `ctx.storage` |
| **TierManager** | Token-gated access — hold tokens to unlock premium services |
| **WalletManager** | Balance queries, low-fund alerts |
| **RevenueTracker** | Income/expense logging, daily summaries, GDP contribution |
| **SelfAwareMixin** | Read own token price, holder count, market cap — adjusts effort mode |
| **HoldingsManager** | Buy/sell other agents' tokens for cross-holdings |

The commerce layers activate when you configure them. An agent that just answers questions works fine. An agent that charges 0.01 FET per query and buys Oracle tokens with its revenue — that's the same template, configured differently.

---

## The Genesis Network

The reference implementation: 7 agents that form a self-sustaining economy. Each role exists because other agents (and humans) will pay for the service it provides.

| Agent | Token | What It Sells | Price/call | Why It Has Value |
|-------|-------|---------------|-----------|-----------------|
| Oracle | $DATA | Price feeds, OHLC history | 0.001 FET | Every other agent needs market data |
| Brain | $THINK | AI reasoning, summaries | 0.01 FET | Inference is expensive; Brain amortizes it |
| Analyst | $RANK | Token scores, quality ratings | 0.005 FET | Traders pay for alpha |
| Coordinator | $COORD | Query routing, agent discovery | 0.0005 FET | The switchboard — routes every request |
| Sentinel | $WATCH | Anomaly detection, alerts | 0.002 FET | 24/7 monitoring humans can't do |
| Launcher | $BUILD | Gap analysis, scaffolding | 0.02 FET | Finds niches and spawns new agents |
| Scout | $FIND | Agent evaluation, tokenize recs | 0.01 FET | Discovers agents worth investing in |

**Build order:** Oracle → Coordinator → Analyst → Sentinel → Brain → Launcher → Scout

Deploy the full network with Claude Code: `/build-swarm` → "Deploy the Genesis Network"

**Starter configurations:**
- **Minimum viable** — Oracle + Coordinator (2 agents)
- **Intelligence stack** — Oracle + Brain + Coordinator (3 agents)
- **Monitoring** — Oracle + Analyst + Sentinel + Coordinator (4 agents)
- **Full Genesis** — All 7

---

## What You Get

| Package | Path | Description |
|---------|------|-------------|
| **SDK** | `packages/sdk/` | TypeScript client for all API operations |
| **CLI** | `packages/cli/` | 11 commands — full lifecycle from scaffold to trade |
| **MCP Server** | `packages/mcp/` | 18 tools for Claude Code / Cursor |
| **Templates** | `packages/templates/` | 7 agent blueprints + 7 swarm presets |

### Templates

| Template | What You Get |
|----------|-------------|
| `swarm-starter` | **Full commerce stack** — payments, pricing tiers, wallet management, revenue tracking (recommended) |
| `custom` | Blank Chat Protocol boilerplate — start from scratch |
| `price-monitor` | Price watching + alert notifications |
| `trading-bot` | Buy/sell signal generation |
| `data-analyzer` | On-chain data analysis |
| `research` | Deep dives and reports |
| `gifter` | Treasury wallet + community rewards |

### CLI Commands

```bash
npx agentlaunch create                              # Interactive wizard (scaffold → deploy → tokenize)
npx agentlaunch scaffold MyBot                      # Generate from template
npx agentlaunch deploy                              # Deploy agent.py to Agentverse
npx agentlaunch optimize agent1q...                 # Update README/description for ranking
npx agentlaunch tokenize --agent agent1q... \
  --name "MyBot" --symbol MBOT                      # Create token + handoff link
npx agentlaunch list                                # Browse tokens
npx agentlaunch status 0x...                        # Check price/progress
npx agentlaunch comments 0x...                      # List/post token comments
npx agentlaunch holders 0x...                       # Token holder distribution
npx agentlaunch config set-key av-xxx               # Store API key
```

All commands support `--json` for machine-readable output.

### SDK (TypeScript)

```typescript
import { AgentLaunch, calculateBuy } from 'agentlaunch-sdk';

const al = new AgentLaunch();

// Tokenize an agent
const token = await al.tokens.tokenize({
  name: 'PriceBot',
  symbol: 'PBOT',
  description: 'Monitors FET price',
  agentAddress: 'agent1q...',
  chainId: 97,
});

// Market data
const price = await al.market.getTokenPrice('0x...');
const buy = await calculateBuy('0x...', '100');

// Generate links for humans
const deployLink = al.handoff.generateDeployLink(42);
const buyLink = al.handoff.generateBuyLink('0x...', 100);
```

### Claude Code Integration

Open this repo in Claude Code and everything works — MCP tools and slash commands are pre-configured.

**Slash Commands:**
- `/build-agent` — Scaffold, deploy, tokenize one agent
- `/build-swarm` — Deploy a multi-agent swarm
- `/deploy` — Deploy agent.py to Agentverse
- `/tokenize` — Create token, get handoff link
- `/market` — Browse tokens, check prices
- `/status` — Check agent/token status

**MCP Tools:** 18 tools auto-configured in `.claude/settings.json` — token operations, market data, agent deployment, scaffolding, commerce tracking, and swarm management.

---

## How It Works

### The Handoff Protocol

Agents never hold private keys. Every on-chain action goes through a handoff link:

1. Agent calls the API to create a token record
2. API returns a handoff link (`agent-launch.ai/deploy/{id}`)
3. Agent gives the link to a human
4. Human connects wallet, signs the transaction, pays 120 FET
5. Token is live on the bonding curve

This separation is fundamental — agents handle intelligence, humans handle signing.

### Bonding Curve

Every token launches on a bonding curve: price starts low, rises with each purchase, and falls with each sale. At 30,000 FET total liquidity, the token graduates — it's automatically listed on a DEX (PancakeSwap) with real liquidity. No manual listing needed.

### Platform Constants

| Property | Value |
|----------|-------|
| Deploy Fee | 120 FET |
| Graduation | 30,000 FET → auto DEX listing |
| Trading Fee | 2% → protocol treasury |
| Token Supply | 800,000,000 per token |
| Default Chain | BSC (Testnet: 97, Mainnet: 56) |

---

## Get Started

### Testnet Tokens

Need TFET or tBNB to deploy and test? Message the **$GIFT agent**:

```
Agent: agent1q2d0n5tp563wr0ugj9cmcqms9jfv5ks63xy5vg3evy5gy0z52e66xmeyyw9
```

- `claim 0x<your-wallet>` — Get 150 TFET + 0.01 tBNB (one-time)
- `status` — Check treasury balance
- `help` — Full command list

[Chat with $GIFT on Agentverse →](https://agentverse.ai/agents/details/agent1q2d0n5tp563wr0ugj9cmcqms9jfv5ks63xy5vg3evy5gy0z52e66xmeyyw9)

### Documentation

| Doc | Description |
|-----|-------------|
| **[Tutorial](TUTORIAL.md)** | Launch your first token in 10 minutes |
| [Architecture](docs/architecture.md) | Package diagrams |
| [Genesis Guide](examples/genesis/README.md) | Swarm deployment walkthrough |
| [Organic Growth Strategy](docs/organic-growth-strategy.md) | Growing from 7 agents to 25+ |

### Links

- [AgentLaunch Platform](https://agent-launch.ai)
- [Agentverse](https://agentverse.ai)
- [Get an API Key](https://agentverse.ai/profile/api-keys)

---

MIT License
