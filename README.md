# AgentLaunch Toolkit

> Build, deploy, and tokenize AI agents in one conversation.

```
    +---------------------------------------------------+
    |                                                     |
    |   git clone agent-launch-toolkit                    |
    |   echo "AGENTVERSE_API_KEY=av-xxx" > .env           |
    |   claude                                            |
    |                                                     |
    |   > "Build a price monitoring agent, deploy it,     |
    |      and tokenize it as $PMON"                      |
    |                                                     |
    |   Done. Agent running. Token live. Handoff ready.   |
    |                                                     |
    +---------------------------------------------------+
```

## Quick Start (30 seconds)

### Option A: Clone the repo

```bash
git clone https://github.com/anthropics/agent-launch-toolkit.git
cd agent-launch-toolkit
cp .env.example .env
# Add your Agentverse API key: https://agentverse.ai/profile/api-keys
npm install
claude
```

### Option B: Add to an existing project

```bash
cd my-project
npx agent-launch init
cp .env.example .env
# Add your Agentverse API key
claude
```

Then say:

> "Build a price monitoring agent and tokenize it as $PMON"

## What's Inside

| Package | Description | Install |
|---------|-------------|---------|
| **SDK** | TypeScript client for every API endpoint | `npm i agentlaunch-sdk` |
| **CLI** | 10 commands, one-command full lifecycle | `npm i -g agentlaunch-cli` |
| **MCP Server** | 13+ tools for Claude Code / Cursor | `npx agent-launch-mcp` |
| **Templates** | 6 production-ready agent blueprints | `npm i agentlaunch-templates` |

## The Lifecycle

```
  Scaffold          Deploy            Tokenize          Trade
  --------          ------            --------          -----
  Choose a      ->  Upload to     ->  Create token  ->  Human signs,
  template          Agentverse        record            token is LIVE

  Templates         Agentverse API    AgentLaunch API   Handoff link
  generate code     hosts agent       creates record    -> wallet -> chain
```

## For Claude Code Users

This repo comes pre-configured. Open Claude Code and you have:

**Slash commands:**

| Command | Action |
|---------|--------|
| `/build-agent` | Scaffold + deploy + tokenize (guided) |
| `/deploy` | Deploy agent.py to Agentverse |
| `/tokenize` | Create token for an existing agent |
| `/market` | Browse tokens and check prices |
| `/status` | Check agent/token deployment status |

**MCP tools:** 13+ tools auto-loaded via `.claude/settings.json`. List tokens,
calculate prices, deploy agents, create tokens -- all from the conversation.

## For CLI Users

```bash
# Full lifecycle (interactive wizard)
npx agentlaunch create

# Step by step
npx agentlaunch scaffold my-agent --template gifter
npx agentlaunch deploy my-agent/agent.py --name "FET Gifter"
npx agentlaunch tokenize agent1q... --name "FET Gifter" --ticker GIFT

# Market data
npx agentlaunch list --sort trending
npx agentlaunch status 0x1234...
npx agentlaunch holders 0x1234...
```

## For SDK Users

```typescript
import { AgentLaunch } from 'agentlaunch-sdk';

const al = new AgentLaunch();  // reads AGENTVERSE_API_KEY from .env

// Tokenize an agent
const token = await al.tokens.tokenize({
  name: 'PriceBot', symbol: 'PBOT',
  description: 'Monitors FET price',
  agentAddress: 'agent1q...',
  chainId: 97
});

// Get market data
const price = await al.market.calculateBuy('0x...', '100');

// Generate handoff links
const deployLink = al.handoff.generateDeployLink(42);
const tradeLink = al.handoff.generateBuyLink('0x...', 100);
```

## Templates

| Template | Description |
|----------|-------------|
| `custom` | Blank Chat Protocol boilerplate -- start from scratch |
| `price-monitor` | Watches token prices, sends alerts |
| `trading-bot` | Buy/sell signal generation |
| `data-analyzer` | On-chain data analysis |
| `research` | Deep dives and reports |
| `gifter` | Treasury wallet + reward distribution |

## Environment Configuration

Copy `.env.example` to `.env` and set your Agentverse API key:

```bash
AGENTVERSE_API_KEY=av-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Switching environments:**
- `AGENT_LAUNCH_ENV=dev` (default) -- uses Cloud Run dev URLs
- `AGENT_LAUNCH_ENV=production` -- uses agent-launch.ai URLs
- Set `AGENT_LAUNCH_API_URL` / `AGENT_LAUNCH_FRONTEND_URL` to override directly

## Architecture

```
  .env (AGENTVERSE_API_KEY)
    |
    +---> SDK (TypeScript client)
    |       |
    |       +-- CLI (interactive + scripted commands)
    |       +-- Templates (code generation)
    |       +-- Examples (working demos)
    |
    +---> MCP Server (13+ tools for Claude Code)
    |
    +---> Claude Code
            reads CLAUDE.md, loads .claude/ rules + skills
            has MCP tools, guided workflows
            |
            "Build me an agent"
              1. Scaffold (templates)
              2. Deploy (Agentverse API)
              3. Tokenize (AgentLaunch API)
              4. Handoff link -> Human signs -> Token LIVE
```

## Platform Details

| Property | Value |
|----------|-------|
| Deploy Fee | 120 FET (read dynamically from contract) |
| Graduation | 30,000 FET -- auto DEX listing |
| Trading Fee | 2% -- 100% to protocol treasury (no creator fee) |
| Total Supply | 800,000,000 tokens per token |
| Default Chain | BSC (Testnet: 97, Mainnet: 56) |

## Links

- [AgentLaunch Platform](https://agent-launch.ai)
- [API Documentation](https://agent-launch.ai/docs/for-agents)
- [OpenAPI Spec](https://agent-launch.ai/docs/openapi)
- [Skill Manifest](https://agent-launch.ai/skill.md)
- [Agentverse](https://agentverse.ai)
- [Architecture](docs/architecture.md)

## Development

```bash
npm install        # Install all workspace dependencies
npm run build      # Build all packages
npm run test       # Test all packages
npm run clean      # Clean all dist/ directories
```

## License

MIT -- see [LICENSE](LICENSE).
