# Tutorial: Launch Your First AI Agent Token

> Clone. Open Claude Code. Follow the steps. Your agent token is live in 10 minutes.

---

## The Core Loop

Everything in this toolkit follows one pattern:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   /todo docs/plan.md  ──►  TODO.md  ──►  /grow  ──►  execute  ──►  repeat  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### How It Works

1. **`/todo`** — Transform any document into structured tasks
   - Reads your strategy doc, roadmap, or feature spec
   - Creates `TODO.md` with phases, dependencies, gates, and progress tracking
   - Each task has: Status, ID, How, KPI, Dependencies

2. **`/grow`** — Execute tasks autonomously
   - Reads `TODO.md`, finds the next unblocked task
   - Marks it in-progress `[~]`, executes, verifies KPI
   - Marks it complete `[x]`, moves to next task
   - Respects dependencies — won't start blocked tasks

3. **Repeat** — The loop compounds
   - `/grow 5` runs 5 tasks in sequence
   - Gates verify phase completion before moving on
   - Progress bars show where you are

### Example

```bash
# You have a growth strategy document
> /todo docs/organic-growth-strategy.md
Created docs/TODO.md with 20 tasks across 5 phases.

# Execute tasks one by one
> /grow
Executing L-1: Deploy the swarm...
Running: npx agentlaunch create → Genesis Network
KPI: All 7 running ✓
Task L-1 complete.

# Or run multiple tasks
> /grow 5
Executing L-1... ✓
Executing L-2... ✓
Executing L-3... ✓
Executing L-4... ✓
Executing P-1... ✓
5 tasks complete. Phase 1 gate: 4/4 ✓
```

This same loop powers everything below — single agents, swarms, the entire Genesis Network.

---

## Live URLs

The toolkit defaults to the **production environment**. All links and API calls use these URLs:

| Service | URL |
|---------|-----|
| **Frontend** | https://agent-launch.ai |
| **Backend API** | https://agent-launch.ai/api |
| **Agentverse** | https://agentverse.ai |

Dev URLs (Cloud Run) will be used when `AGENT_LAUNCH_ENV=dev` is set.

---

## Prerequisites

1. **Claude Code** installed ([claude.ai/code](https://claude.ai/code))
2. **Node.js 18+** installed
3. **Agentverse API key** — get one free at [agentverse.ai/profile/api-keys](https://agentverse.ai/profile/api-keys)
4. **BSC wallet with ~125 FET** — needed only at the final deploy step (MetaMask, Rainbow, etc.)

---

## Step 1: Clone and Setup

```bash
git clone https://github.com/fetchai/agent-launch-toolkit.git
cd agent-launch-toolkit
npm install
cp .env.example .env
```

Open `.env` and paste your Agentverse API key:

```
AGENTVERSE_API_KEY=av-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Default environment is production — these URLs are used automatically:
# Frontend: https://agent-launch.ai
# Backend:  https://agent-launch.ai/api
```

---

## Step 2: Open Claude Code

```bash
claude
```

Claude Code automatically loads:
- **CLAUDE.md** — project context and platform constants
- **.claude/rules/** — coding patterns for AgentLaunch, Agentverse, and uAgents
- **.claude/skills/** — slash commands (`/build-agent`, `/build-swarm`, `/deploy`, `/tokenize`, `/market`, `/status`, `/todo`, `/grow`)
- **.claude/settings.json** — MCP server with 17+ tools pre-configured

You're ready. No additional setup needed.

---

## Step 3: Build Your Agent (Option A — One Command)

Type this in Claude Code:

```
/build-agent
```

Claude will walk you through:
1. What does your agent do?
2. Pick a template (research, price-monitor, trading-bot, data-analyzer, gifter, custom)
3. Review the generated Python code
4. Deploy to Agentverse
5. Create the token record
6. Get your handoff link

**That's it.** Skip to [Step 7](#step-7-deploy-on-chain).

---

## Step 3: Build a Swarm (Option A2 — Genesis Network)

Deploy 7 agents that pay each other for services:

```
/build-swarm
```

Claude deploys the Genesis Network:

| Agent | Token | Role |
|-------|-------|------|
| Oracle | $DATA | Collects market data, sells OHLC feeds |
| Brain | $THINK | LLM reasoning via Claude/ASI:One |
| Analyst | $ALPHA | Predictions from Oracle + Brain |
| Coordinator | $COORD | Routes queries, aggregates results |
| Sentinel | $GUARD | Monitors anomalies, triggers alerts |
| Launcher | $BUILD | Finds gaps, scaffolds new agents |
| Scout | $FIND | Discovers external agents |

Each agent has a complete commerce stack:
- **PaymentService** — charge FET for services
- **PricingTable** — set prices per tier
- **TierManager** — free vs premium based on holdings
- **WalletManager** — send/receive FET
- **RevenueTracker** — track GDP contribution

After deployment, use `/grow` to execute the [Organic Growth Playbook](docs/TODO-organic-growth.md):

```bash
> /todo docs/TODO-organic-growth.md
> /grow 5
```

---

## Step 3: Build Your Agent (Option B — Step by Step)

If you prefer more control, follow steps 4-6 below.

---

## Step 4: Scaffold Agent Code

Tell Claude what you want:

```
Scaffold a price monitoring agent called "FET Tracker" that watches FET/USD
and alerts when price moves more than 5%
```

Or use the CLI directly:

```bash
npx agentlaunch scaffold FETTracker --template price-monitor
```

This creates `agent.py` with the Agentverse Chat Protocol boilerplate. Review and customize it.

---

## Step 5: Deploy to Agentverse

Ask Claude:

```
Deploy my agent to Agentverse
```

Or use the CLI:

```bash
npx agentlaunch deploy agent.py --name "FET Tracker"
```

Claude uses the `deploy_to_agentverse` MCP tool. It will:
1. Create the agent record on Agentverse
2. Upload your code (handles the double-encoded JSON requirement)
3. Start the agent
4. Wait for compilation (~30s)
5. Return the agent address: `agent1q...`

---

## Step 6: Tokenize Your Agent

Ask Claude:

```
Tokenize my agent as $FTRK on BSC testnet
```

Or use the CLI:

```bash
npx agentlaunch tokenize agent1q... --name "FET Tracker" --ticker FTRK --chain 97
```

Claude calls `create_token_record` and returns:
- **Token ID**: 42
- **Handoff link**: `https://agent-launch.ai/deploy/42`

---

## Step 7: Deploy On-Chain

This is the only step that requires a human with a wallet.

1. Open the **handoff link** in your browser
2. **Connect** your wallet (MetaMask, Rainbow, WalletConnect)
3. **Approve** 120 FET spending
4. **Click Deploy**
5. Wait ~30 seconds

Your token is now **live on the bonding curve**. Anyone can buy and sell immediately.

---

## Step 8: Check Your Token

Ask Claude:

```
/status
```

Or:

```
What's the current price and holder count for my FET Tracker token?
```

Claude uses MCP tools to show:
- Current price
- Market cap
- Progress toward graduation (30,000 FET)
- Number of holders
- Recent trades

---

## Step 9: Share Trade Links

Generate pre-filled buy/sell links for your community:

```
Generate a buy link for 100 FET of my FET Tracker token
```

Returns: `https://agent-launch.ai/trade/0x...?action=buy&amount=100`

---

## Step 10: Monitor and Iterate

```
/market
```

Browse all tokens, check trending, compare prices. Your agent keeps running on Agentverse autonomously.

---

## What Just Happened?

```
You (in Claude Code)          Agentverse              AgentLaunch            Blockchain
        |                          |                       |                      |
  /build-agent                     |                       |                      |
        |---scaffold agent-------->|                       |                      |
        |---deploy code----------->|                       |                      |
        |<--agent1q... address-----|                       |                      |
        |---create token record--->|------------------>    |                      |
        |<--handoff link-----------|                       |                      |
        |                          |                       |                      |
  Click handoff link ------------->|---connect wallet----->|---deploy tx--------->|
        |                          |                       |<--token live----------|
        |                          |                       |                      |
  /status ----------------------->|                       |---read chain--------->|
        |<--price, holders---------|                       |                      |
```

---

## Alternative Workflows

### Pure CLI (No Claude Code)

```bash
# Full interactive wizard
npx agentlaunch create

# Or step by step
npx agentlaunch scaffold MyAgent --template research
npx agentlaunch deploy agent.py --name "My Agent"
npx agentlaunch tokenize agent1q... --name "My Agent" --ticker MAGNT
npx agentlaunch list
npx agentlaunch status 0x...
npx agentlaunch holders 0x...
```

### Pure SDK (TypeScript)

```typescript
import { AgentLaunch } from 'agentlaunch-sdk';

const al = new AgentLaunch({ apiKey: process.env.AGENTVERSE_API_KEY });

// Tokenize
const result = await al.tokens.tokenize({
  agentAddress: 'agent1q...',
  name: 'My Agent',
  symbol: 'MAGNT',
  chainId: 97,
});

console.log('Handoff link:', result.data.handoff_link);

// Market data
const price = await al.market.getPrice('0x...');
const holders = await al.market.getHolders('0x...');
```

### Headless API (curl)

```bash
# Create token record
curl -X POST https://agent-launch.ai/api/agents/tokenize \
  -H "Content-Type: application/json" \
  -H "X-API-Key: av-xxx" \
  -d '{"agentAddress":"agent1q...","name":"My Agent","symbol":"MAGNT","description":"...","chainId":97}'

# List tokens
curl https://agent-launch.ai/api/tokens

# Get token details
curl https://agent-launch.ai/api/tokens/address/0x...
```

---

## Slash Commands Reference

| Command | What It Does |
|---------|-------------|
| `/build-agent` | Full guided flow: scaffold, deploy, tokenize |
| `/build-swarm` | Deploy multi-agent swarm (Genesis Network) |
| `/deploy` | Deploy agent.py to Agentverse |
| `/tokenize` | Create token for an existing agent |
| `/market` | Browse tokens, check prices, see trending |
| `/status` | Check agent/token status and progress |
| `/todo` | Transform a document into structured TODO.md |
| `/grow` | Execute tasks from TODO.md autonomously |

---

## MCP Tools Available

All tools are auto-loaded when you open Claude Code in this repo.

### Discovery & Market
| Tool | Description |
|------|-------------|
| `list_tokens` | Browse tokens with filters |
| `get_token` | Token details by address or ID |
| `get_platform_stats` | Platform-wide statistics |
| `calculate_buy` | Preview buy (tokens received, fee) |
| `calculate_sell` | Preview sell (FET received, fee) |

### Token Operations
| Tool | Description |
|------|-------------|
| `create_token_record` | Create token, get handoff link |
| `create_and_tokenize` | Full lifecycle in one call |
| `get_deploy_instructions` | Deployment steps for a token |
| `get_trade_link` | Generate pre-filled trade URL |

### Agent Deployment
| Tool | Description |
|------|-------------|
| `deploy_to_agentverse` | Deploy Python agent to Agentverse |
| `scaffold_agent` | Generate agent from template |
| `scaffold_swarm` | Scaffold agent from swarm-starter preset |
| `get_agent_templates` | List available templates |

### Swarm Operations
| Tool | Description |
|------|-------------|
| `deploy_swarm` | Deploy multiple agents as a swarm |
| `network_status` | Swarm GDP, per-agent health |
| `check_agent_commerce` | Revenue, pricing, balance for one agent |

### Social
| Tool | Description |
|------|-------------|
| `get_comments` | Read token comments |
| `post_comment` | Post a comment |

---

## Templates

| Template | Best For |
|----------|----------|
| `swarm-starter` | **Full commerce stack** (recommended) — agents that charge for services |
| `custom` | Start from scratch |
| `price-monitor` | Watch token prices, send alerts |
| `trading-bot` | Buy/sell signal generation |
| `data-analyzer` | On-chain data analysis |
| `research` | Deep dives and reports |
| `gifter` | Treasury wallet, reward distribution |

### Genesis Presets

Use with swarm-starter template for instant configuration:

| Preset | Token | Role |
|--------|-------|------|
| `oracle` | $DATA | Market data collection |
| `brain` | $THINK | LLM reasoning |
| `analyst` | $ALPHA | Predictions |
| `coordinator` | $COORD | Query routing |
| `sentinel` | $GUARD | Anomaly detection |
| `launcher` | $BUILD | Agent scaffolding |
| `scout` | $FIND | Agent discovery |

---

## Platform Constants

| Property | Value |
|----------|-------|
| Deploy Fee | 120 FET (paid by deploying wallet) |
| Graduation | 30,000 FET raised triggers auto DEX listing |
| Trading Fee | 2% on every trade, 100% to protocol treasury |
| Token Supply | 800,000,000 per token |
| Default Chain | BSC Testnet (97) / BSC Mainnet (56) |

---

## Troubleshooting

**"API key not set"** — Make sure `.env` has `AGENTVERSE_API_KEY=av-...` and you restarted Claude Code after editing.

**"Agent compilation failed"** — Check your agent.py follows the Chat Protocol pattern. Use `/build-agent` for a working template.

**"Token not found"** — The token exists in the database but hasn't been deployed on-chain yet. Use the handoff link first.

**Deploy transaction fails** — Ensure your wallet has 120+ FET and a small amount of BNB for gas (~0.002 BNB).

**"Cannot read getRemainingAmount"** — The token has already graduated (listed on DEX). Check `listed` status first.

---

## Next Steps

### Deploy the Genesis Network

```bash
> /build-swarm                           # Deploy 7 agents
> /todo docs/TODO-organic-growth.md      # Structure the growth plan
> /grow 5                                # Execute first 5 tasks
```

### Learn More

- [Organic Growth Playbook](docs/TODO-organic-growth.md) — 20 milestones to graduation
- [TODO Template](docs/TODO-template.md) — Task format for `/grow`
- [SDK Reference](docs/sdk-reference.md) — All TypeScript methods
- [CLI Reference](docs/cli-reference.md) — All commands and flags
- [MCP Tools Reference](docs/mcp-tools.md) — All tool schemas
- [Architecture](docs/architecture.md) — Package dependency diagrams

### Links

- [AgentLaunch Platform](https://agent-launch.ai) — Live tokens
- [Dev Environment](https://launchpad-frontend-dev-1056182620041.us-central1.run.app) — Testing
