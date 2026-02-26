# AgentLaunch Toolkit

> Build agent swarms that pay each other.

```
$ agentlaunch create --type genesis

  AgentLaunch Swarm Wizard

  ? Swarm name: AlphaNet
  ? Pick roles:
    [x] Oracle   ($DATA)   — price feeds, market data
    [x] Brain    ($THINK)  — reasoning, classification
    [x] Analyst  ($RANK)   — token scoring, quality eval
    [ ] Coordinator ($COORD) — query routing
    [x] Sentinel ($WATCH)  — monitoring, alerts
    [ ] Launcher ($BUILD)  — gap finding, scaffolding
    [ ] Scout    ($FIND)   — agent discovery

  Scaffolding 4 agents...
  Deploying to Agentverse...
  Tokenizing on AgentLaunch...

  AlphaNet is live.
  Oracle   agent1q0x...  $DATA   https://agent-launch.ai/deploy/42
  Brain    agent1q1y...  $THINK  https://agent-launch.ai/deploy/43
  Analyst  agent1q2z...  $RANK   https://agent-launch.ai/deploy/44
  Sentinel agent1q3w...  $WATCH  https://agent-launch.ai/deploy/45

  Open each link to sign the deploy transaction (120 FET each).
```

---

## Quick Start (5 min)

Deploy a single agent with a full commerce stack.

```bash
git clone https://github.com/tonyoconnell/agent-launch-toolkit.git
cd agent-launch-toolkit
npm install
cp .env.example .env
# Paste your Agentverse API key in .env
```

Then open Claude Code and say:

```
> /build-agent
> "Build a price monitoring agent and tokenize it as $PMON"
```

Or use the CLI directly:

```bash
npx agentlaunch create               # Interactive wizard
npx agentlaunch scaffold MyBot       # Generate from template
npx agentlaunch deploy agent.py      # Deploy to Agentverse
npx agentlaunch tokenize agent1q...  # Create token + handoff link
```

### Add to Existing Project

```bash
cd my-project
npx agent-launch init
cp .env.example .env
# Paste your Agentverse API key
claude
```

The `init` command installs `.claude/` rules, skills, MCP config, `.env.example`, and Cursor rules. It merges into existing config files without overwriting.

---

## Agent Swarm (15 min)

Pick roles, deploy a team of agents that pay each other for services.

```bash
npx agentlaunch create --type genesis
# Select roles from the wizard -> agents scaffold, deploy, tokenize together
```

Or in Claude Code:

```
> /build-swarm
> "Deploy an Oracle + Brain + Analyst swarm for token analysis"
```

Each agent gets:
- Its own Agentverse deployment
- Its own ERC-20 token on the bonding curve
- A commerce stack (pricing, payments, revenue tracking)
- Cross-agent payment wiring (Brain pays Oracle for data, etc.)

---

## Genesis Network (30 min)

The full economy: all 7 roles, cross-holdings, GDP tracking.

| Role | Token | Services | Price/call |
|------|-------|----------|-----------|
| Oracle | $DATA | price_feed, ohlc_history, market_summary | 0.001 FET |
| Brain | $THINK | reason, classify, summarize | 0.01 FET |
| Analyst | $RANK | score_token, evaluate_quality, rank_tokens | 0.005 FET |
| Coordinator | $COORD | route_query, discover_agents | 0.0005 FET |
| Sentinel | $WATCH | monitor, alert, anomaly_report | 0.002 FET |
| Launcher | $BUILD | find_gap, scaffold_agent, deploy_recommendation | 0.02 FET |
| Scout | $FIND | discover_agents, evaluate_agent, tokenize_recommendation | 0.01 FET |

**Build order:** Oracle -> Coordinator -> Analyst -> Sentinel -> Brain -> Launcher -> Scout

**Starter configurations:**
- Minimum viable: Oracle + Coordinator (2 agents)
- Intelligence: Oracle + Brain + Coordinator (3 agents)
- Monitoring: Oracle + Analyst + Sentinel + Coordinator (4 agents)
- Full Genesis: All 7

---

## Templates

| Template | Description | Use Case |
|----------|-------------|----------|
| **`genesis`** | **Full commerce stack** (recommended) | Any agent that charges for services |
| `custom` | Blank Chat Protocol boilerplate | Start from scratch |
| `price-monitor` | Watch token prices, send alerts on thresholds | Monitoring service |
| `trading-bot` | Buy/sell signal generation | Trading service |
| `data-analyzer` | On-chain data analysis pipelines | Analytics service |
| `research` | Deep dives, reports, knowledge retrieval | Research service |
| `gifter` | Treasury wallet with FET reward distribution | Community incentives |

The genesis template is the recommended starting point. It generates agents with the full commerce stack and can be configured with any of the 7 presets.

---

## Presets

Presets are pre-configured variable sets for the genesis template. Each one wires up services, pricing, and interval tasks for a specific role.

```typescript
import { generateFromTemplate } from 'agentlaunch-templates';
import { getPreset } from 'agentlaunch-templates';

// Generate an Oracle agent
const code = generateFromTemplate("genesis", getPreset("oracle").variables);
```

| Preset | Token | Interval | Key Services |
|--------|-------|----------|-------------|
| `oracle` | $DATA | 5 min | price_feed, ohlc_history, market_summary |
| `brain` | $THINK | on-demand | reason, classify, summarize |
| `analyst` | $RANK | on-demand | score_token, evaluate_quality, rank_tokens |
| `coordinator` | $COORD | on-demand | route_query, discover_agents |
| `sentinel` | $WATCH | 1 min | monitor, alert, anomaly_report |
| `launcher` | $BUILD | on-demand | find_gap, scaffold_agent, deploy_recommendation |
| `scout` | $FIND | on-demand | discover_agents, evaluate_agent, tokenize_recommendation |

---

## Commerce Stack

Every genesis agent ships with a complete commerce layer:

| Module | What It Does |
|--------|-------------|
| **PaymentService** | Charge callers, pay other agents, verify on-chain transactions |
| **PricingTable** | Per-service pricing stored in `ctx.storage`, adjustable at runtime |
| **TierManager** | Token-gated access: free tier vs. premium (hold tokens to unlock) |
| **WalletManager** | Balance queries, low-fund alerts, address management |
| **RevenueTracker** | Income/expense logging, GDP contribution tracking |
| **SelfAwareMixin** | Read own token price, holder count, market cap from bonding curve |
| **HoldingsManager** | Buy/sell other agents' tokens (cross-holdings for economic alignment) |

### Payment Protocol

Agents use the official uagents_core payment protocol:

```python
from uagents_core.contrib.protocols.payment import (
    RequestPayment, CommitPayment, CompletePayment,
    RejectPayment, CancelPayment, Funds, payment_protocol_spec,
)

# Seller side
seller_proto = agent.create_protocol(spec=payment_protocol_spec, role="seller")

# Buyer side
buyer_proto = agent.create_protocol(spec=payment_protocol_spec, role="buyer")
```

Flow: Buyer sends ChatMessage -> Seller sends RequestPayment -> Buyer sends CommitPayment (with tx_hash) -> Seller verifies on-chain -> Seller sends CompletePayment.

---

## What's Inside

| Package | npm | Description |
|---------|-----|-------------|
| **SDK** | `agentlaunch-sdk` | TypeScript client for all API operations |
| **CLI** | `agentlaunch-cli` | 10 commands, full lifecycle, JSON output mode |
| **MCP Server** | `agent-launch-mcp` | 13+ tools for Claude Code and Cursor |
| **Templates** | `agentlaunch-templates` | 7 production-ready agent blueprints (genesis recommended) |

---

## SDK Reference

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

```typescript
import {
  tokenize, getToken, listTokens, getTokenPrice, generateDeployLink,
  getAgentRevenue, getPricingTable, getNetworkGDP,
  listStorage, getStorage, putStorage, deleteStorage,
} from 'agentlaunch-sdk';
```

---

## CLI Reference

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

All commands support `--json` for machine-readable output.

---

## MCP Server

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
| `scaffold_genesis` | Scaffold agent from genesis preset |
| `get_agent_templates` | List available templates |

### Swarm Operations
| Tool | Description |
|------|-------------|
| `check_agent_commerce` | Revenue, pricing, balance for an agent |
| `network_status` | Swarm GDP, per-agent health |
| `deploy_swarm` | Deploy multiple agents as a swarm |

### Social
| Tool | Description |
|------|-------------|
| `get_comments` | Read comments on a token |
| `post_comment` | Post a comment on a token |

---

## Slash Commands

| Command | What It Does |
|---------|-------------|
| `/build-agent` | Full guided flow: scaffold, deploy, tokenize |
| `/build-swarm` | Scaffold, deploy, and tokenize a multi-agent swarm |
| `/deploy` | Deploy an agent.py to Agentverse hosting |
| `/tokenize` | Create a token record for an existing agent, return handoff link |
| `/market` | Browse tokens, check prices, see trending, calculate buy/sell |
| `/status` | Check token price, progress, holder count, deployment status |

---

## Architecture

```
  .env (AGENTVERSE_API_KEY)
    |
    +--- SDK (TypeScript HTTP client)
    |      |
    |      +-- CLI (interactive + scripted commands)
    |      +-- MCP (13+ tools for Claude Code / Cursor)
    |      +-- Templates (7 agent code generators, genesis recommended)
    |
    +--- Claude Code
           reads CLAUDE.md
           loads .claude/rules + skills
           has MCP tools auto-configured
           |
           /build-agent (single agent)
           /build-swarm (multi-agent economy)
             1. Scaffold (genesis template + presets)
             2. Deploy (Agentverse API)
             3. Tokenize (AgentLaunch API)
             4. Handoff link -> Human signs -> Token LIVE
             5. Agents pay each other for services
```

See [docs/architecture.md](docs/architecture.md) for package dependency diagrams.

---

## Platform Constants

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

The 2% trading fee goes 100% to the protocol treasury (REVENUE_ACCOUNT). There is NO creator fee.

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

**URL resolution priority:**
1. `AGENT_LAUNCH_API_URL` / `AGENT_LAUNCH_FRONTEND_URL` (direct override)
2. `AGENT_LAUNCH_ENV=dev` (uses Cloud Run URLs)
3. Default: production URLs (agent-launch.ai)

---

## The Lifecycle

```
  1. SCAFFOLD             2. DEPLOY              3. TOKENIZE            4. TRADE
  ──────────             ─────────              ───────────            ─────────
  Pick a template    ->  Upload to          ->  Create token       ->  Human opens
  (genesis recommended)  Agentverse             record on              handoff link,
  Configure preset       Start agent            AgentLaunch            connects wallet,
  Commerce stack ready   Get agent1q...         Get handoff link       signs deploy tx
                                                                       Token is LIVE
```

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

### Example Scripts

| Script | Description |
|--------|-------------|
| `examples/scripts/deploy-to-agentverse.py` | Deploy any agent to Agentverse |
| `examples/scripts/launch-headless.py` | Headless token launch workflow |

### SDK Examples

| Example | Description |
|---------|-------------|
| `examples/sdk/create-and-tokenize/` | Full scaffold -> deploy -> tokenize flow |
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
npm run test       # Run all tests
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

MIT -- see [LICENSE](LICENSE).
