# AgentLaunch Toolkit Demo

This document demonstrates all features of the AgentLaunch Toolkit — a complete system for building, deploying, and tokenizing AI agents on the Fetch.ai ecosystem.

## Table of Contents

1. [Quick Start](#quick-start)
2. [CLI Commands](#cli-commands)
3. [SDK Usage](#sdk-usage)
4. [MCP Server Tools](#mcp-server-tools)
5. [Agent Templates](#agent-templates)
6. [End-to-End Workflows](#end-to-end-workflows)
7. [Platform Constants](#platform-constants)

---

## Quick Start

### Prerequisites

```bash
# Clone and install
git clone https://github.com/your-org/agent-launch-toolkit.git
cd agent-launch-toolkit
npm install
npm run build
```

### Environment Setup

```bash
# Copy example env
cp .env.example .env

# Add your Agentverse API key
# Get it at: https://agentverse.ai/profile/api-keys
echo "AGENTVERSE_API_KEY=av-xxx" >> .env
```

### One-Command Agent Creation

```bash
# Interactive mode — scaffold, deploy, and tokenize in one go
npx agentlaunch create

# Non-interactive mode with all flags
npx agentlaunch create \
  --name "My Research Agent" \
  --ticker RSRCH \
  --template research \
  --description "AI agent that researches crypto markets" \
  --chain 97 \
  --deploy \
  --tokenize

# Note: In interactive mode, template defaults to "custom"
# Use --template flag for non-interactive: custom, research, trading-bot,
# data-analyzer, price-monitor, gifter
```

---

## CLI Commands

The CLI provides 10 commands for managing the full agent lifecycle.

### `agentlaunch create` — Flagship One-Command Flow

Creates a new agent project with scaffolding, optional deployment, and optional tokenization.

```bash
# Interactive mode (prompts for all inputs)
npx agentlaunch create

# Full automation
npx agentlaunch create \
  --name "Price Watcher" \
  --ticker WATCH \
  --template price-monitor \
  --description "Monitors token prices and sends alerts" \
  --chain 97 \
  --deploy \
  --tokenize \
  --json

# Output (JSON mode):
{
  "name": "Price Watcher",
  "ticker": "WATCH",
  "template": "price-monitor",
  "scaffoldDir": "/path/to/price-watcher",
  "agentAddress": "agent1q...",
  "walletAddress": "fetch1...",
  "tokenId": 42,
  "handoffLink": "https://agent-launch.ai/deploy/42"
}
```

**What gets created:**
- `agent.py` — Production-ready agent code
- `README.md` — Agent documentation
- `CLAUDE.md` — AI context file
- `.claude/` — Settings, rules, and skills for Claude Code
- `.cursor/` — MCP config for Cursor IDE
- `docs/` — Platform guides
- `examples/` — Sample code

### `agentlaunch scaffold` — Generate Agent Code

Generate agent code without deploying.

```bash
# Scaffold from template (use --type flag)
npx agentlaunch scaffold MyBot --type research

# Available types (--type flag):
#   custom         — Blank Chat Protocol boilerplate
#   price-monitor  — Watches token prices, sends alerts
#   trading-bot    — Buy/sell signal generation
#   data-analyzer  — On-chain data analysis
#   research       — Deep dives and reports
#   gifter         — Treasury wallet + rewards

# Output directory structure:
# my-bot/
#   agent.py
#   README.md
#   CLAUDE.md
#   package.json
#   .claude/
#   .cursor/
#   docs/
#   examples/
```

### `agentlaunch deploy` — Deploy to Agentverse

Deploy an agent to Fetch.ai's Agentverse platform.

```bash
# Deploy agent.py in current directory
npx agentlaunch deploy

# Deploy specific file
npx agentlaunch deploy --file ./my-agent/agent.py

# Deploy with custom name
npx agentlaunch deploy --name "Custom Agent Name"

# JSON output for scripts
npx agentlaunch deploy --json

# Output:
{
  "agentAddress": "agent1qf8xfhsc8hg4g5l0nhtj5hxxkyd46c64qxvpa3g3ha9rjmezq3s6xw9y7g",
  "walletAddress": "fetch1abc...",
  "status": "compiled"
}
```

### `agentlaunch tokenize` — Create Token Record

Create a token on AgentLaunch for an existing agent.

```bash
# Tokenize by agent address
npx agentlaunch tokenize \
  --agent agent1q... \
  --name "My Agent Token" \
  --symbol MYAG \
  --description "An AI agent that does amazing things" \
  --chain 97

# With optional max wallet limit and initial buy
npx agentlaunch tokenize \
  --agent agent1q... \
  --name "My Token" \
  --symbol MYTK \
  --description "Description here" \
  --max-wallet 1 \
  --initial-buy 100 \
  --chain 97

# Output:
Token created!
  Token ID:    42
  Handoff:     https://agent-launch.ai/deploy/42

Next: Share the handoff link with someone who has a wallet to deploy on-chain.
```

### `agentlaunch list` — Browse Tokens

List tokens on the AgentLaunch platform.

```bash
# Default: 10 latest tokens
npx agentlaunch list

# Custom pagination and sorting
npx agentlaunch list --limit 20 --sort trending
npx agentlaunch list --limit 50 --sort market_cap

# JSON output
npx agentlaunch list --json

# Sample output:
AgentLaunch Tokens  (sort: latest, limit: 10)

──────────────────────────────────────────────────────────────────
Name                  Symbol   Price (FET)    Progress   Status
──────────────────────────────────────────────────────────────────
Research Bot          RSRCH    0.000150 FET   12.5%      Active
Price Monitor         WATCH    0.000089 FET   8.2%       Active
Trading Agent         TRADE    0.000210 FET   45.1%      Active
Data Analyzer         DATA     0.001200 FET   72.3%      Active
Gifter Bot            GIFT     0.000045 FET   3.1%       Active
──────────────────────────────────────────────────────────────────
```

### `agentlaunch status` — Check Token Details

Get detailed information about a specific token.

```bash
# By token address
npx agentlaunch status 0x1234...

# By token ID
npx agentlaunch status 42

# JSON output
npx agentlaunch status 0x1234... --json

# Sample output:
Token: Research Bot (RSRCH)
──────────────────────────────────────────────────────────────────
Address:      0x1234567890abcdef...
Agent:        agent1qf8xfhsc8hg4g5l0nhtj5hxxkyd46c64qxvpa3g3ha9rjmezq3s6xw9y7g
Status:       Active
Chain:        BSC Testnet (97)

Market Data:
  Price:      0.000150 FET
  Market Cap: 120,000 FET
  Progress:   12.5% toward graduation

Bonding Curve:
  FET Reserve: 3,750 FET
  Tokens Sold: 25,000,000 / 800,000,000

Trade: https://agent-launch.ai/trade/0x1234...
```

### `agentlaunch holders` — View Token Holders

List holders of a specific token.

```bash
# View holders
npx agentlaunch holders 0x1234...

# JSON output
npx agentlaunch holders 0x1234... --json

# Sample output:
Holders of RSRCH (0x1234...)
──────────────────────────────────────────────────────────────────
Address                                    Balance         %
──────────────────────────────────────────────────────────────────
0xabcd...1234                              5,000,000       20.0%
0xefgh...5678                              3,500,000       14.0%
0xijkl...9012                              2,000,000       8.0%
──────────────────────────────────────────────────────────────────
```

### `agentlaunch comments` — View/Post Comments

Interact with token comment threads.

```bash
# View comments
npx agentlaunch comments 0x1234...

# Post a comment
npx agentlaunch comments 0x1234... --post "Great agent! Love the research reports."

# JSON output
npx agentlaunch comments 0x1234... --json
```

### `agentlaunch config` — Manage Configuration

View and set configuration values.

```bash
# Show current config
npx agentlaunch config show

# Output:
  AgentLaunch Configuration

  Environment:  production
  API URL:      https://agent-launch.ai/api
  Frontend URL: https://agent-launch.ai
  Chain ID:     97
  API Key:      eyJhbGci... (masked)
  Config file:  ~/.agentlaunch/config.json

# Set API key
npx agentlaunch config set-key av-xxx

# Set custom API URL (for self-hosted)
npx agentlaunch config set-url https://my-instance.com/api
```

### `agentlaunch init` — Initialize Project

Initialize a new AgentLaunch project in an existing directory.

```bash
# Initialize current directory
npx agentlaunch init

# Creates:
#   .env.example
#   agentlaunch.config.json
#   .claude/ directory structure
```

---

## SDK Usage

The TypeScript SDK provides programmatic access to all platform features.

### Installation

```bash
npm install agentlaunch-sdk
```

### Basic Client Setup

```typescript
import { AgentLaunchClient } from 'agentlaunch-sdk';

// Create client (reads AGENTVERSE_API_KEY from env)
const client = new AgentLaunchClient();

// Or with explicit config
const client = new AgentLaunchClient({
  apiKey: 'av-xxx',
  baseUrl: 'https://agent-launch.ai/api',  // optional
  maxRetries: 3,  // optional, for rate limiting
});
```

### Authentication

```typescript
import { authenticate } from 'agentlaunch-sdk';

const { data } = await authenticate('av-xxx');
console.log(`JWT: ${data.token}`);
console.log(`Expires in: ${data.expires_in}s`);

// Use JWT for subsequent requests
// Authorization: Bearer <token>
```

### List My Agents

```typescript
import { getMyAgents } from 'agentlaunch-sdk';

const { data } = await getMyAgents(client);
console.log(`Found ${data.count} agents`);

for (const agent of data.agents) {
  console.log(`${agent.name}: ${agent.address}`);
}
```

### Deploy an Agent

```typescript
import { deployAgent } from 'agentlaunch-sdk';
import fs from 'fs';

const sourceCode = fs.readFileSync('agent.py', 'utf8');

const result = await deployAgent({
  apiKey: 'av-xxx',
  agentName: 'My Research Agent',
  sourceCode,
});

console.log(`Agent deployed: ${result.agentAddress}`);
console.log(`Wallet: ${result.walletAddress}`);
console.log(`Status: ${result.status}`);
```

### Create Token Record

```typescript
import { tokenize, generateDeployLink } from 'agentlaunch-sdk';

const { data } = await tokenize({
  agentAddress: 'agent1q...',
  name: 'Research Agent',
  symbol: 'RSRCH',
  description: 'AI research agent token',
  chainId: 97,  // BSC Testnet
}, client);

console.log(`Token ID: ${data.token_id}`);
console.log(`Handoff Link: ${data.handoff_link}`);

// Generate links
const deployLink = generateDeployLink(data.token_id);
const buyLink = generateBuyLink(data.token_address, 100);
console.log(`Deploy: ${deployLink}`);
console.log(`Buy 100 FET: ${buyLink}`);
```

### List Tokens

```typescript
import { listTokens } from 'agentlaunch-sdk';

const { data, total } = await listTokens({
  limit: 20,
  sort: 'trending',
  chainId: 97,
}, client);

for (const token of data) {
  console.log(`${token.name} (${token.symbol}): ${token.price} FET`);
}
```

### Get Token Details

```typescript
import { getToken } from 'agentlaunch-sdk';

const token = await getToken('0x1234...', client);

console.log(`Name: ${token.name}`);
console.log(`Price: ${token.price} FET`);
console.log(`Market Cap: ${token.marketCap} FET`);
console.log(`Progress: ${token.progress}%`);
```

### Calculate Buy/Sell

```typescript
import { calculateBuy, calculateSell } from 'agentlaunch-sdk';

// Preview a buy: 100 FET -> how many tokens?
// Signature: calculateBuy(address, fetAmount, client?)
const buyPreview = await calculateBuy('0x1234...', '100', client);

console.log(`100 FET buys: ${buyPreview.tokensReceived} tokens`);
console.log(`Fee: ${buyPreview.fee} FET`);
console.log(`Price impact: ${buyPreview.priceImpact}%`);

// Preview a sell: 1,000,000 tokens -> how much FET?
// Signature: calculateSell(address, tokenAmount, client?)
const sellPreview = await calculateSell('0x1234...', '1000000', client);

console.log(`1M tokens sells for: ${sellPreview.fetReceived} FET`);
```

### Generate Trade Links

```typescript
import { generateBuyLink, generateSellLink, generateDeployLink } from 'agentlaunch-sdk';

// Pre-filled buy link
const buyLink = generateBuyLink('0x1234...', 100);
// https://agent-launch.ai/trade/0x1234...?action=buy&amount=100

// Pre-filled sell link
const sellLink = generateSellLink('0x1234...', 1000000);
// https://agent-launch.ai/trade/0x1234...?action=sell&amount=1000000

// Deploy handoff link
const deployLink = generateDeployLink(42);
// https://agent-launch.ai/deploy/42
```

### Platform Stats

```typescript
import { getPlatformStats } from 'agentlaunch-sdk';

const stats = await getPlatformStats(client);

console.log(`Total Tokens: ${stats.totalTokens}`);
console.log(`Total Volume: ${stats.totalVolume} FET`);
console.log(`Active Users: ${stats.activeUsers}`);
```

---

## MCP Server Tools

The MCP server provides 13+ tools for Claude Code and Cursor IDE integration.

### Setup

The MCP server is pre-configured in `.claude/settings.json`:

```json
{
  "mcpServers": {
    "agent-launch": {
      "command": "npx",
      "args": ["agent-launch-mcp"],
      "env": {
        "AGENTVERSE_API_KEY": "${AGENTVERSE_API_KEY}"
      }
    }
  }
}
```

### Available Tools

#### Discovery Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `list_tokens` | Browse tokens with filtering | `limit`, `sort`, `chainId`, `status` |
| `get_token` | Get details for a specific token | `address` |
| `get_platform_stats` | Platform-wide statistics | — |

#### Market Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `calculate_buy` | Preview a buy on bonding curve | `address`, `fetAmount` |
| `calculate_sell` | Preview a sell on bonding curve | `address`, `tokenAmount` |
| `get_trade_link` | Generate pre-filled trade link | `address`, `action`, `amount` |

#### Tokenization Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `create_token_record` | Create a new token | `name`, `symbol`, `description`, `agentAddress`, `chainId` |
| `get_deploy_instructions` | Get deploy instructions | `tokenId` |
| `create_and_tokenize` | Full lifecycle in one call | `name`, `description`, `template`, `chainId` |

#### Agent Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `deploy_to_agentverse` | Deploy Python agent | `sourceCode`, `agentName` |
| `scaffold_agent` | Generate agent from template | `template`, `name`, `description` |

#### Social Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `get_comments` | Read token comments | `address` |
| `post_comment` | Post a comment | `address`, `message` |

### Usage in Claude Code

```
You: Deploy a price monitor agent that watches $RSRCH token

Claude: I'll create and deploy a price monitor agent for you.

[Uses scaffold_agent with template="price-monitor"]
[Uses deploy_to_agentverse with the generated code]
[Uses create_token_record to tokenize]

Done! Here's your handoff link: https://agent-launch.ai/deploy/42
Share this with someone who has a wallet to deploy on-chain.
```

### Usage in Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "agent-launch": {
      "command": "npx",
      "args": ["agent-launch-mcp"],
      "env": {
        "AGENTVERSE_API_KEY": "av-xxx"
      }
    }
  }
}
```

---

## Agent Templates

Six production-ready agent blueprints are available.

### 1. Custom (Blank Boilerplate)

```bash
npx agentlaunch scaffold MyAgent --type custom
```

Minimal Chat Protocol implementation:
- Basic message handling
- Acknowledgement protocol
- Session management

### 2. Price Monitor

```bash
npx agentlaunch scaffold PriceWatcher --type price-monitor
```

Features:
- Real-time price tracking from AgentLaunch API
- Configurable alert thresholds
- Price history tracking
- Commands: `watch`, `check`, `price`

### 3. Trading Bot

```bash
npx agentlaunch scaffold TradeBot --type trading-bot
```

Features:
- Buy/sell signal generation
- Technical analysis integration
- Risk management
- Market condition monitoring

### 4. Data Analyzer

```bash
npx agentlaunch scaffold DataBot --type data-analyzer
```

Features:
- On-chain data analysis
- Holder distribution tracking
- Token metrics reporting
- Trend analysis

### 5. Research

```bash
npx agentlaunch scaffold ResearchBot --type research
```

Features:
- Deep dive reports
- Market research
- Project analysis
- Comparative studies

### 6. Gifter

```bash
npx agentlaunch scaffold GiftBot --type gifter
```

Features:
- Treasury wallet management
- Reward distribution
- Community incentives
- Airdrop automation

---

## End-to-End Workflows

### Workflow 1: Create Agent from Scratch (Interactive)

```bash
# Start the interactive flow
npx agentlaunch create

# Prompts:
Agent name: Research Bot
Ticker symbol: RSRCH
Describe what your agent does: AI agent that researches crypto markets
Agentverse API key: av-xxx

# Output:
Scaffolding agent: Research Bot (custom)
Directory: /path/to/research-bot
  Created: agent.py
  Created: README.md
  Created: CLAUDE.md
  Created: .claude/

Installing dependencies...
  Done.

Launching Claude Code in research-bot...
```

### Workflow 2: Full Automation (CI/CD)

```bash
# One command, full lifecycle
npx agentlaunch create \
  --name "Price Monitor" \
  --ticker WATCH \
  --template price-monitor \
  --description "Monitors token prices and alerts on changes" \
  --chain 97 \
  --deploy \
  --tokenize \
  --json | jq

# Output:
{
  "name": "Price Monitor",
  "ticker": "WATCH",
  "template": "price-monitor",
  "scaffoldDir": "/path/to/price-monitor",
  "agentAddress": "agent1q...",
  "walletAddress": "fetch1...",
  "tokenId": 42,
  "tokenAddress": null,
  "handoffLink": "https://agent-launch.ai/deploy/42"
}
```

### Workflow 3: SDK Script

```typescript
// examples/sdk/create-and-tokenize/index.ts
import {
  AgentLaunchClient,
  authenticate,
  getMyAgents,
  tokenize,
  generateDeployLink,
  generateBuyLink,
} from 'agentlaunch-sdk';

const API_KEY = process.env.AGENTVERSE_API_KEY!;
const client = new AgentLaunchClient({ apiKey: API_KEY });

// Step 1: Authenticate
const { data: auth } = await authenticate(API_KEY);
console.log(`JWT obtained: ${auth.token.slice(0, 20)}...`);

// Step 2: List agents
const { data: agents } = await getMyAgents(client);
const agent = agents.agents[0];
console.log(`Using agent: ${agent.name}`);

// Step 3: Create token
const { data: token } = await tokenize({
  agentAddress: agent.address,
  name: agent.name,
  description: 'AI agent token',
  chainId: 97,
}, client);

// Step 4: Generate links
const deployLink = generateDeployLink(token.token_id);
const buyLink = generateBuyLink(`${token.token_id}`, 100);

console.log(`Deploy: ${deployLink}`);
console.log(`Buy: ${buyLink}`);
```

### Workflow 4: Monitor and Trade

```typescript
// examples/sdk/monitor-and-trade/index.ts
import { getToken, calculateBuy, generateBuyLink } from 'agentlaunch-sdk';

const TOKEN = '0x1234...';

// Check current price
const token = await getToken(TOKEN);
console.log(`${token.name}: ${token.price} FET`);

// Preview a buy (positional args: address, fetAmount, client?)
const preview = await calculateBuy(TOKEN, '100');
console.log(`100 FET buys ${preview.tokensReceived} tokens`);
console.log(`Price impact: ${preview.priceImpact}%`);

// Generate buy link
if (preview.priceImpact < 5) {
  const link = generateBuyLink(TOKEN, 100);
  console.log(`Buy now: ${link}`);
}
```

---

## Platform Constants

These values are baked into the smart contracts and cannot be changed by this toolkit.

| Constant | Value | Notes |
|----------|-------|-------|
| Deploy Fee | 120 FET | Read dynamically from contract |
| Graduation Target | 30,000 FET | Auto DEX listing at this liquidity |
| Trading Fee | 2% | 100% to protocol treasury |
| Creator Fee | 0% | **No creator fee** |
| Total Buy Supply | 800,000,000 | Tokens per bonding curve |
| Default Chain | BSC | Testnet: 97, Mainnet: 56 |

### The Handoff Protocol

Agents **never** hold private keys. The flow is:

1. **Agent** calls API to create token record
2. **API** returns handoff link (`/deploy/{tokenId}`)
3. **Agent** gives link to human
4. **Human** connects wallet, signs transaction
5. **Token** is live on-chain

This separation is fundamental to the architecture.

---

## API Reference

### AgentLaunch API

```
Base URL: https://agent-launch.ai/api
Auth: X-API-Key: <AGENTVERSE_API_KEY>

GET   /tokens                              List tokens (paginated)
GET   /tokens/address/{address}            Token details by address
GET   /tokens/id/{id}                      Token details by ID
GET   /tokens/calculate-buy                Preview buy on bonding curve
GET   /tokens/calculate-sell               Preview sell on bonding curve
POST  /agents/tokenize                     Create token → handoff link
GET   /agents/my-agents                    List your Agentverse agents
GET   /agents/token/{address}/holders      Holder distribution
POST  /agents/auth                         Exchange API key for JWT
GET   /comments/{address}                  Get comments
POST  /comments/{address}                  Post comment
GET   /platform/stats                      Platform statistics
```

### Agentverse API

```
Base URL: https://agentverse.ai/v1
Auth: Authorization: Bearer <AGENTVERSE_API_KEY>

POST  /hosting/agents                 Create agent
GET   /hosting/agents                 List agents → { items: [...] }
PUT   /hosting/agents/{addr}/code     Upload code (DOUBLE-ENCODED JSON!)
POST  /hosting/agents/{addr}/start    Start agent
POST  /hosting/agents/{addr}/stop     Stop agent
GET   /hosting/agents/{addr}/logs     Get logs
POST  /hosting/secrets                Set a secret
```

---

## Verified Output (Live API)

These outputs were captured from actual API calls on 2026-02-26.

### List Tokens (Real Data)

```bash
$ npx agentlaunch list --limit 3

AgentLaunch Tokens  (sort: latest, limit: 3)

──────────────────────────────────────────────────────────────────
Name                  Symbol   Price (FET)    Progress   Status
──────────────────────────────────────────────────────────────────
www                   WWW      0 FET          0.0%       Active
ONE                   ONE      0.000015 FET   0.3%       Active
AI Chat Assistant     ACA      0.000014 FET   0.1%       Active
──────────────────────────────────────────────────────────────────
```

### Token Status (Real Data)

```bash
$ npx agentlaunch status 0x3Eb5Ff648e09d63fe404B04e44e7DD0Fc9d29653

==================================================
TOKEN STATUS
==================================================
Name:         Amazing Agent
Symbol:       AA
Address:      0x3Eb5Ff648e09d63fe404B04e44e7DD0Fc9d29653
Chain:        BSC Testnet
Price:        0.000155 FET
Market Cap:   20,197 FET
Holders:      12
Progress:     100.00%
Status:       Listed (graduated to DEX)
==================================================
```

### Holders (Real Data)

```bash
$ npx agentlaunch holders 0x3Eb5Ff648e09d63fe404B04e44e7DD0Fc9d29653

Token Holders: 0x3Eb5Ff648e09d63fe404B04e44e7DD0Fc9d29653

────────────────────────────────────────────────────────────────────────
Address                                     Balance         Percentage
────────────────────────────────────────────────────────────────────────
0x445638F61a3e049020a1aA17E4Ff4Ef6BA0... *  6.89M           0.86%
0x1185fD84C456BC1BA24d81224c3FD8433f6C8D84  175.05M         21.88%
0xd3442a5Dc5c87CdB7317e73EA0c600e9F256e9ca  96.15M          12.02%
0x496B71C643e92A89a44e9fEcfB107553196d677A  66.28M          8.28%
────────────────────────────────────────────────────────────────────────
12 holder(s) total. (* = creator)
```

### Comments (Real Data)

```bash
$ npx agentlaunch comments 0x3Eb5Ff648e09d63fe404B04e44e7DD0Fc9d29653

Comments for 0x3Eb5Ff648e09d63fe404B04e44e7DD0Fc9d29653

────────────────────────────────────────────────────────────
[1] 0x445638F6  Fri, 20 Feb 2026 08:37:14 GMT
  hi

────────────────────────────────────────────────────────────
1 comment(s). Use --post "<message>" to add one.
```

---

## Troubleshooting

### "Invalid code format" when deploying

The code field must be double-encoded JSON:

```python
code_array = [{"language": "python", "name": "agent.py", "value": source_code}]
payload = {"code": json.dumps(code_array)}  # json.dumps required!
```

### Agent stuck in "compiling"

Wait 15-60 seconds after starting. Check logs for syntax errors:

```bash
curl -H "Authorization: Bearer $AGENTVERSE_API_KEY" \
  https://agentverse.ai/v1/hosting/agents/{address}/logs
```

### 401 Unauthorized

Check your API key:
- Must include "Bearer " prefix for Agentverse API
- Use X-API-Key header for AgentLaunch API

### No tokens found

Make sure you're on the right environment:
- Production: `https://agent-launch.ai/api`
- Dev: Set `AGENT_LAUNCH_ENV=dev`

---

## Links

- **Platform**: https://agent-launch.ai
- **Agentverse**: https://agentverse.ai
- **API Keys**: https://agentverse.ai/profile/api-keys
- **Fetch.ai Docs**: https://docs.fetch.ai

---

## Change Log

### 2026-02-26

- **Fixed**: CLI `scaffold` uses `--type` flag (not `--template`)
- **Fixed**: CLI `tokenize` uses `--agent` and `--symbol` flags
- **Fixed**: CLI `config` is now `config show` / `config set-key`
- **Fixed**: CLI `holders` endpoint corrected to `/agents/token/{addr}/holders`
- **Fixed**: CLI `comments` endpoint corrected to `/comments/{addr}`
- **Fixed**: SDK `getPlatformStats` (not `getStats`)
- **Fixed**: SDK `calculateBuy(address, amount)` uses positional args
- **Fixed**: SDK `calculateSell(address, amount)` uses positional args
- **Fixed**: MCP tool parameters match actual schema (`address` not `tokenAddress`)
- **Verified**: All CLI commands tested against live API
- **Added**: Real API output examples in "Verified Output" section
