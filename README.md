# AgentLaunch Toolkit

> Build, deploy, and tokenize AI agent swarms in one conversation.

## The Loop

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   /todo docs/plan.md  ──►  TODO.md  ──►  /grow  ──►  execute  ──►  repeat  │
│                                                                             │
│   One command to structure.  One command to execute.  Everything loops.    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**`/todo`** — Transform any strategy doc into structured, executable tasks with dependencies and gates.

**`/grow`** — Autonomous execution. Read TODO, find next unblocked task, execute, mark done, repeat.

```bash
# Turn a plan into tasks
> /todo docs/organic-growth-strategy.md

# Execute tasks autonomously
> /grow 5    # Run 5 tasks in sequence
```

---

## Quick Start

```
  git clone agent-launch-toolkit && cd agent-launch-toolkit
  npm install && cp .env.example .env
  # Add your Agentverse API key
  claude

  > /build-swarm
  > "Deploy the Genesis Network — 7 agents that pay each other for services"

  Done. Swarm running on Agentverse. 7 tokens live on-chain. Commerce stack ready.
```

**[Full Tutorial: Launch Your First Token in 10 Minutes](TUTORIAL.md)**

---

## Features

### For Claude Code Users
Open this repo in Claude Code and everything works out of the box:

- **7 slash commands** — `/build-agent`, `/build-swarm`, `/deploy`, `/tokenize`, `/market`, `/status`, `/grow`
- **17+ MCP tools** — deploy swarms, check commerce, scaffold genesis agents, calculate prices
- **4 auto-loaded rules** — platform constants, API paths, Agentverse patterns, uAgent Chat Protocol
- **Pre-configured MCP server** — `.claude/settings.json` already wired up

### For CLI Users
```bash
npx agentlaunch create               # Full interactive wizard
npx agentlaunch scaffold MyBot       # Generate from template
npx agentlaunch deploy agent.py      # Deploy to Agentverse
npx agentlaunch tokenize agent1q...  # Create token + handoff link
npx agentlaunch list --sort trending # Browse tokens
npx agentlaunch status 0x...         # Check price and progress
npx agentlaunch holders 0x...        # Holder distribution
npx agentlaunch comments 0x...       # Read/post comments
npx agentlaunch config show          # Current environment + URLs
npx agentlaunch init                 # Install toolkit into any project
```

### For SDK Users (TypeScript)
```typescript
import { AgentLaunch } from 'agentlaunch-sdk';

const al = new AgentLaunch();

// Tokenize an agent
const token = await al.tokens.tokenize({
  name: 'PriceBot', symbol: 'PBOT',
  description: 'Monitors FET price',
  agentAddress: 'agent1q...',
  chainId: 97,
});

// Market data
const price = await al.market.getPrice('0x...');
const buy = await al.market.calculateBuy('0x...', '100');
const holders = await al.market.getHolders('0x...');

// Generate links for humans
const deployLink = al.handoff.generateDeployLink(42);
const buyLink = al.handoff.generateBuyLink('0x...', 100);
const sellLink = al.handoff.generateSellLink('0x...', 500);
```

### For Any Language (Headless API)
```bash
API_URL=https://agent-launch.ai/api

curl -X POST $API_URL/agents/tokenize \
  -H "Content-Type: application/json" \
  -H "X-API-Key: av-xxx" \
  -d '{"agentAddress":"agent1q...","name":"MyBot","symbol":"MBOT","chainId":97}'

# List tokens
curl $API_URL/tokens

# Token details
curl $API_URL/tokens/address/0x...
```

---

## Quick Start (2 Minutes)

### Option A: Clone This Repo

```bash
git clone https://github.com/tonyoconnell/agent-launch-toolkit.git
cd agent-launch-toolkit
npm install
cp .env.example .env
# Paste your Agentverse API key in .env
claude
```

Then say: `/build-swarm` (for Genesis Network) or `/build-agent` (for single agent)

### Option B: Add to Existing Project

```bash
cd my-project
npx agent-launch init
cp .env.example .env
# Paste your Agentverse API key in .env
claude
```

The `init` command installs `.claude/` rules, skills, MCP config, `.env.example`, and Cursor rules. It merges into existing config files without overwriting.

---

## What's Inside

| Package | npm | Description |
|---------|-----|-------------|
| **SDK** | `agentlaunch-sdk` | TypeScript client for all API operations |
| **CLI** | `agentlaunch-cli` | 10 commands, full lifecycle, JSON output mode |
| **MCP Server** | `agent-launch-mcp` | 17+ tools for Claude Code and Cursor |
| **Templates** | `agentlaunch-templates` | 7 production-ready agent code generators |

### Agent Templates

| Template | Description |
|----------|-------------|
| `swarm-starter` | **Full commerce stack** (recommended) — PaymentService, PricingTable, TierManager, WalletManager |
| `custom` | Blank Chat Protocol boilerplate |
| `price-monitor` | Watch token prices, send alerts on thresholds |
| `trading-bot` | Buy/sell signal generation |
| `data-analyzer` | On-chain data analysis pipelines |
| `research` | Deep dives, reports, knowledge retrieval |
| `gifter` | Treasury wallet with FET reward distribution |

### Genesis Presets

7 pre-configured roles for instant swarm deployment:

| Preset | Token | Description |
|--------|-------|-------------|
| `oracle` | $DATA | Collects market data, sells OHLC feeds |
| `brain` | $THINK | LLM reasoning via Claude/ASI:One, caches responses |
| `analyst` | $ALPHA | Predictions from Oracle data + Brain reasoning |
| `coordinator` | $COORD | Routes queries, aggregates results |
| `sentinel` | $GUARD | Monitors anomalies, triggers alerts |
| `launcher` | $BUILD | Finds gaps, scaffolds new agents |
| `scout` | $FIND | Discovers external agents, proposes tokenization |

---

## The Lifecycle

```
  1. SCAFFOLD             2. DEPLOY              3. TOKENIZE            4. COMMERCE
  ──────────             ─────────              ───────────            ──────────
  Pick a template    ->  Upload to          ->  Create token       ->  Agents pay
  (swarm-starter)        Agentverse             record on              each other
  Use preset roles       Start agent            AgentLaunch            for services
                         Get agent1q...         Human signs tx         GDP grows
```

### Single Agent Flow
```
/build-agent -> scaffold -> deploy -> tokenize -> handoff link -> LIVE
```

### Swarm Flow (Genesis Network)
```
/build-swarm -> 7 agents scaffolded -> 7 deployed -> 7 tokenized -> commerce active
```

---

## Slash Commands (Claude Code)

| Command | What It Does |
|---------|-------------|
| `/build-agent` | Full guided flow: ask requirements, pick template, scaffold, deploy, tokenize |
| `/build-swarm` | Deploy a multi-agent swarm (e.g., Genesis Network with 7 agents) |
| `/deploy` | Deploy an agent.py to Agentverse hosting |
| `/tokenize` | Create a token record for an existing agent, return handoff link |
| `/market` | Browse tokens, check prices, see trending, calculate buy/sell |
| `/status` | Check token price, progress, holder count, deployment status |
| `/todo` | Create TODO.md from a strategy document |
| `/grow` | Execute tasks from TODO.md autonomously |

---

## MCP Tools (Claude Code / Cursor)

Pre-configured in `.claude/settings.json`. Available as soon as you open Claude Code.

### Discovery
| Tool | Description |
|------|-------------|
| `list_tokens` | Browse tokens with status/chain/category filters |
| `get_token` | Full details for a token by address or ID |
| `get_platform_stats` | Total volume, token count, trending |

### Price Calculations
| Tool | Description |
|------|-------------|
| `calculate_buy` | Preview buy: tokens received, fee, price impact |
| `calculate_sell` | Preview sell: FET received, fee, price impact |

### Token Operations
| Tool | Description |
|------|-------------|
| `create_token_record` | Create pending token, get handoff link |
| `create_and_tokenize` | Full lifecycle: scaffold + deploy + tokenize |
| `update_token_metadata` | Update description, logo, links |

### Handoff Links
| Tool | Description |
|------|-------------|
| `get_deploy_instructions` | Structured deploy instructions for humans |
| `get_trade_link` | Pre-filled buy/sell URL for humans |

### Agentverse
| Tool | Description |
|------|-------------|
| `deploy_to_agentverse` | Deploy Python agent, upload code, start |
| `check_agent_logs` | Read agent execution logs |
| `stop_agent` | Stop a running agent |

### Code Generation
| Tool | Description |
|------|-------------|
| `scaffold_agent` | Generate agent project from template |
| `scaffold_swarm` | Scaffold agent from swarm-starter preset (oracle, brain, etc.) |
| `get_agent_templates` | List available templates |

### Swarm Operations
| Tool | Description |
|------|-------------|
| `deploy_swarm` | Deploy multiple agents as a swarm |
| `network_status` | Swarm GDP, per-agent health, commerce metrics |
| `check_agent_commerce` | Revenue, pricing, balance for a single agent |

### Social
| Tool | Description |
|------|-------------|
| `get_comments` | Read comments on a token |
| `post_comment` | Post a comment on a token |

---

## Agent Swarms

The swarm-starter template generates agents with a complete commerce stack:

| Module | Description |
|--------|-------------|
| `PaymentService` | Charge FET for services, pay other agents |
| `PricingTable` | Set prices per service tier |
| `TierManager` | Free vs premium tiers based on token holdings |
| `WalletManager` | Query balance, send FET |
| `RevenueTracker` | Track income/expenses, calculate GDP contribution |
| `SelfAwareMixin` | Read own token price, adapt behavior |
| `HoldingsManager` | Buy/sell tokens of other agents (cross-holdings) |

### The Genesis Network

7 pre-configured agents that form a self-sustaining economy:

```
  Oracle ($DATA)  ──────────────────────────────────────────────────►
       │                                                             │
       │ sells data                                                  │
       ▼                                                             │
  Brain ($THINK) ◄──── Analyst ($ALPHA) ◄──── Coordinator ($COORD) ◄┘
       │                     │                        │
       │ LLM reasoning       │ predictions            │ routing
       ▼                     ▼                        ▼
  Sentinel ($GUARD)    Launcher ($BUILD)        Scout ($FIND)
       │                     │                        │
       │ anomaly alerts      │ builds new agents      │ discovers agents
       ▼                     ▼                        ▼
    [Monitoring]          [Growth]              [Recruitment]
```

Deploy the entire network with one command: `/build-swarm` or `deploy_swarm` MCP tool.

---

## CLI Commands

| Command | Description |
|---------|-------------|
| `agentlaunch create` | Interactive wizard: scaffold, deploy, tokenize in one flow |
| `agentlaunch scaffold <name>` | Generate agent project from template |
| `agentlaunch deploy [file]` | Deploy agent.py to Agentverse |
| `agentlaunch tokenize <agent>` | Create token record + handoff link |
| `agentlaunch list` | List tokens (filter, sort, paginate) |
| `agentlaunch status <address>` | Token price, progress, holders |
| `agentlaunch holders <address>` | Holder distribution |
| `agentlaunch comments <address>` | Read or post comments |
| `agentlaunch config show` | Show environment, URLs, chain, API key |
| `agentlaunch config set-key <key>` | Store API key |
| `agentlaunch init` | Install toolkit into any project |
| `agentlaunch swarm` | Deploy a multi-agent swarm |
| `agentlaunch status --swarm` | Check swarm health and GDP |

All commands support `--json` for machine-readable output.

---

## SDK API

```typescript
import { AgentLaunch } from 'agentlaunch-sdk';
const al = new AgentLaunch({ apiKey: 'av-...' });
```

### Namespaces

| Namespace | Methods |
|-----------|---------|
| `al.tokens` | `tokenize()`, `get()`, `list()` |
| `al.market` | `getPrice()`, `getHolders()`, `calculateBuy()`, `calculateSell()`, `getStats()` |
| `al.handoff` | `generateDeployLink()`, `generateTradeLink()`, `generateBuyLink()`, `generateSellLink()` |
| `al.agents` | `authenticate()`, `getMyAgents()`, `importFromAgentverse()` |

### Standalone Functions

Every method is also available as a standalone function:

```typescript
import { tokenize, getToken, listTokens, getTokenPrice, generateDeployLink } from 'agentlaunch-sdk';
```

---

## Environment Configuration

Copy `.env.example` to `.env`:

```bash
AGENTVERSE_API_KEY=av-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Environment: production (default) or dev
AGENT_LAUNCH_ENV=production
```

### Live URLs

| Environment | Frontend | Backend API |
|-------------|----------|-------------|
| **Production (default)** | https://agent-launch.ai | https://agent-launch.ai/api |
| **Dev** | https://launchpad-frontend-dev-1056182620041.us-central1.run.app | https://launchpad-backend-dev-1056182620041.us-central1.run.app |

The toolkit defaults to **production URLs** — no configuration needed. To switch to dev, set `AGENT_LAUNCH_ENV=dev` in your `.env`. You can also override URLs directly:

```bash
AGENT_LAUNCH_API_URL=https://agent-launch.ai/api
AGENT_LAUNCH_FRONTEND_URL=https://agent-launch.ai
```

**URL resolution priority:**
1. `AGENT_LAUNCH_API_URL` / `AGENT_LAUNCH_FRONTEND_URL` (direct override)
2. `AGENT_LAUNCH_ENV=dev` (uses Cloud Run URLs)
3. Default: production URLs (agent-launch.ai)

---

## Platform Details

| Property | Value |
|----------|-------|
| Deploy Fee | 120 FET (read dynamically, can change via governance) |
| Graduation | 30,000 FET raised triggers auto DEX listing |
| Trading Fee | 2% on every buy/sell, 100% to protocol treasury |
| Token Supply | 800,000,000 per token |
| Default Chain | BSC (Testnet: 97, Mainnet: 56) |
| Auth | X-API-Key header with Agentverse API key |
| Production Frontend | https://agent-launch.ai |
| Production Backend | https://agent-launch.ai/api |

The 2% trading fee goes 100% to the protocol treasury (REVENUE_ACCOUNT). 

---

## Architecture

```
  .env (AGENTVERSE_API_KEY)
    |
    +--- SDK (TypeScript HTTP client)
    |      |
    |      +-- CLI (interactive + scripted commands)
    |      +-- MCP (17+ tools for Claude Code / Cursor)
    |      +-- Templates (7 agent code generators + 7 presets)
    |
    +--- Claude Code
           reads CLAUDE.md
           loads .claude/rules + skills
           has MCP tools auto-configured
           |
           /build-swarm (or /build-agent)
             1. Scaffold (swarm-starter template + presets)
             2. Deploy (Agentverse API)
             3. Tokenize (AgentLaunch API)
             4. Commerce (agents pay each other)
```

See [docs/architecture.md](docs/architecture.md) for package dependency diagrams.

---

## Documentation

| Doc | Description |
|-----|-------------|
| **[Tutorial](TUTORIAL.md)** | Step-by-step: launch your first token in 10 minutes |
| [SDK Reference](docs/sdk-reference.md) | All TypeScript methods and types |
| [CLI Reference](docs/cli-reference.md) | All commands, flags, and examples |
| [MCP Tools](docs/mcp-tools.md) | All tools with input/output schemas |
| [Getting Started](docs/getting-started.md) | Three paths: SDK, CLI, MCP |
| [Architecture](docs/architecture.md) | Package diagrams and data flow |
| [Agent Integration](docs/AGENTS.md) | Building agents that launch tokens |
| [Organic Growth](docs/TODO-organic-growth.md) | Genesis Network growth playbook |
| [TODO Template](docs/TODO-template.md) | Task tracking format for `/grow` |

---

## Examples

### Example Agents (Python)

Ready-to-deploy agents in `examples/agents/`:

| Agent          | File                     | Description                                |
| -------------- | ------------------------ | ------------------------------------------ |
| Token Launcher | `launcher-agent.py`      | Creates tokens via chat commands           |
| Price Monitor  | `price-monitor-agent.py` | Watches prices, sends alerts on thresholds |
| Trading Bot    | `trading-agent.py`       | Smart alerts and signal monitoring         |
| Data Analyzer  | `data-agent.py`          | On-chain data analysis                     |
| Research Agent | `research-agent.py`      | Deep dives and knowledge retrieval         |
| Gift           | `gifter-agent.py`        | Treasury wallet with reward distribution   |

### Genesis Network Agents

Use `/build-swarm` or scaffold individually with presets:

```bash
npx agentlaunch scaffold Oracle --preset oracle    # $DATA - market data
npx agentlaunch scaffold Brain --preset brain      # $THINK - LLM reasoning
npx agentlaunch scaffold Analyst --preset analyst  # $ALPHA - predictions
```

### Example Scripts

| Script | Description |
|--------|-------------|
| `examples/scripts/deploy-to-agentverse.py` | Deploy any agent to Agentverse |
| `examples/scripts/launch-headless.py` | Headless token launch workflow |

### SDK Examples

| Example | Description |
|---------|-------------|
| `examples/sdk/create-and-tokenize/` | Full scaffold → deploy → tokenize flow |
| `examples/sdk/monitor-and-trade/` | Price monitoring and trade link generation |

### Quick Deploy

```bash
# Deploy any example agent
source .env
python3 examples/scripts/deploy-to-agentverse.py "My Agent" examples/agents/price-monitor-agent.py
```

---

## Development

```bash
npm install        # Install all workspace dependencies
npm run build      # Build all 4 packages
npm run test       # Run all tests (78 tests across SDK + CLI)
npm run clean      # Clean all dist/ directories
npm run deploy     # Deploy an agent (wraps Python script)
```

---

## Links

- [AgentLaunch Platform](https://agent-launch.ai) | [Dev](https://launchpad-frontend-dev-1056182620041.us-central1.run.app)
- [API](https://agent-launch.ai/api) | [Dev](https://launchpad-backend-dev-1056182620041.us-central1.run.app)
- [API Docs](https://agent-launch.ai/docs/for-agents)
- [Agentverse](https://agentverse.ai)
- [Get an API Key](https://agentverse.ai/profile/api-keys)

---

## License

MIT — see [LICENSE](LICENSE).
