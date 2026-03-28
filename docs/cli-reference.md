# CLI Reference — `agentlaunch` v1.2.7

Full command reference for the AgentLaunch CLI (26 commands). Scaffold, deploy, tokenize, and trade AI agent tokens from the terminal.

**Install globally:**
```bash
npm install -g agentlaunch
```

**Verify:**
```bash
agentlaunch --version
# 1.2.7

agentlaunch --help
```

---

## Configuration

The CLI stores its configuration in `~/.agentlaunch/config.json` (mode `0600` — owner read/write only). This file holds your API key and an optional custom base URL.

### `agentlaunch config set-key <apiKey>`

Store your Agentverse API key locally.

```bash
agentlaunch config set-key av-xxxxxxxxxxxxxxxx
# API key saved to ~/.agentlaunch/config.json
# Key: av-xxxxxx... (masked)
```

Get your key at: https://agentverse.ai/profile/api-keys

---

### `agentlaunch config show`

Print the current configuration with the API key masked.

```bash
agentlaunch config show
# Current configuration:
#   API Key:  av-xxxxxx... (masked)
#   Base URL: https://agent-launch.ai/api (production default, from .env)
#   Config:   ~/.agentlaunch/config.json
```

---

### `agentlaunch config set-url <url>`

Override the API base URL. Useful for self-hosted instances or staging environments.

```bash
agentlaunch config set-url https://staging.agent-launch.ai/api
# Base URL set to: https://staging.agent-launch.ai/api
```

Reset to the production URL (the default):

```bash
agentlaunch config set-url https://agent-launch.ai/api
```

Or switch to dev:

```bash
agentlaunch config set-url https://launchpad-backend-dev-1056182620041.us-central1.run.app
```

**Flags:** None.

**Config file location:** `~/.agentlaunch/config.json`

```json
{
  "apiKey": "av-xxxxxxxxxxxxxxxx",
  "baseUrl": "https://agent-launch.ai/api"
}
```

### Environment URL Configuration

The CLI defaults to production (`https://agent-launch.ai/api`). You can switch environments in two ways:

**Option 1: Environment variable**

Set `AGENT_LAUNCH_ENV=dev` to use the dev backend automatically:

```bash
export AGENT_LAUNCH_ENV=dev
agentlaunch list   # Uses dev backend
```

| Variable | Production (default) | Dev |
|----------|---------------------|-----|
| `AGENT_LAUNCH_API_URL` | `https://agent-launch.ai/api` | `https://launchpad-backend-dev-1056182620041.us-central1.run.app` |
| `AGENT_LAUNCH_FRONTEND_URL` | `https://agent-launch.ai` | `https://launchpad-frontend-dev-1056182620041.us-central1.run.app` |

**Option 2: Direct override**

Set `AGENT_LAUNCH_API_URL` directly to point at any backend:

```bash
export AGENT_LAUNCH_API_URL=https://my-custom-backend.example.com
agentlaunch list   # Uses custom backend
```

Priority order: `AGENT_LAUNCH_API_URL` > `config set-url` > `AGENT_LAUNCH_ENV` > production default.

---

## `agentlaunch [name]` — default command

Create an agent, deploy it to Agentverse, and open Claude Code.

```bash
npx agentlaunch                           # Interactive — prompts for name, description, API key
npx agentlaunch my-bot                    # Create agent named "my-bot" (deploys by default)
npx agentlaunch my-bot --local            # Scaffold only, no deploy
npx agentlaunch my-bot --template research --local  # Scaffold with specific template
```

**Flags:**

| Flag | Description | Default |
|------|-------------|---------|
| `--local` | Scaffold only, don't deploy to Agentverse | false (deploys by default) |
| `--template <t>` | chat-memory, swarm-starter, custom, research, trading-bot, data-analyzer, price-monitor, gifter | chat-memory |
| `--json` | Output only JSON | false |

**Default template:** `chat-memory` — includes LLM integration and conversation memory out of the box.

**Example output:**

```
Creating agent: my-bot
Template: chat-memory (LLM + conversation memory)
Directory: /home/user/my-bot
  Created: agent.py
  Created: README.md
  Created: .env.example

Deploying to Agentverse...
  Agent Address: agent1q...
  Status: compiled

Opening Claude Code...
```

---

## `agentlaunch create`

Interactive agent creation with a 6-step value-building workflow. Launches Claude Code to guide you through building, deploying, and tokenizing an agent.

```bash
agentlaunch create [options]
```

**Flags:**

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--name <name>` | string | prompted | Agent name |
| `--ticker <ticker>` | string | auto-generated | Token ticker (e.g. MYAG) |
| `--template <template>` | string | `custom` | Template: `swarm-starter`, `custom`, `research`, `trading-bot`, `data-analyzer`, `price-monitor`, `gifter` |
| `--description <desc>` | string | `""` | Token description (max 500 chars) |
| `--chain <chainId>` | string | `97` | Chain: 97 (BSC Testnet) or 56 (BSC Mainnet) |
| `--deploy` | boolean | false | Deploy to Agentverse after scaffolding |
| `--tokenize` | boolean | false | Create token record after deploy |
| `--mode <mode>` | string | `single` | Build mode: `quick` (single), `swarm` (multi-agent) |
| `--preset <preset>` | string | -- | Preset: `writer`, `social`, `community`, `analytics`, `outreach`, `ads`, `strategy` |
| `--json` | boolean | false | Machine-readable JSON output |

### Auto-Ticker Logic

If `--ticker` is not provided, a ticker is auto-generated from the agent name:

| Name | Generated Ticker | Rule |
|------|-----------------|------|
| `"Price Oracle"` | `PRICE` | First word is 3-6 chars, use it |
| `"DataFeed"` | `DATAFE` | Single word, first 6 chars |
| `"AI Research Assistant"` | `ARA` | Multiple words, use initials |

### 6-Step Workflow

When `create` launches Claude Code, it guides you through:

1. **Understand the Vision** -- What problem does the agent solve? Who pays? What is the defensible moat?
2. **Build the Agent Logic** -- Read `agent.py` and propose real code changes using available packages (AI, Data, Web, Blockchain, Storage)
3. **Deploy** -- Use `deploy_to_agentverse` MCP tool or `npx agentlaunch deploy`
4. **Make It Beautiful** -- Write README.md, description, optimize with `npx agentlaunch optimize`
5. **Tokenize** -- Choose ticker, explain bonding curves, create token with handoff link
6. **Share & Next Steps** -- Provide links (Agentverse page, trade page, handoff link), suggest next actions

### Mode Behavior

| Mode | Behavior |
|------|----------|
| `quick` / `single` | Single agent, no preset selection |
| `swarm` | Multi-agent, shows preset picker (writer, social, community, analytics, outreach, ads, strategy) |

**Swarm presets:**

| # | Preset | Description | Price |
|---|--------|-------------|-------|
| 1 | Writer | Content creation | 0.01 FET/call |
| 2 | Social | Twitter/X posting | 0.005 FET/call |
| 3 | Community | Telegram management | 0.002 FET/call |
| 4 | Analytics | Engagement tracking | 0.005 FET/call |
| 5 | Outreach | Partnership emails | 0.01 FET/call |
| 6 | Ads | Ad campaigns | 0.01 FET/call |
| 7 | Strategy | Campaign coordination | 0.02 FET/call |

---

## `agentlaunch scaffold <name>`

Generate an agent project from a template in a new directory `<name>`.

Creates three files:
- `agent.py` — Ready-to-run uagents code with security, caching, and revenue layers
- `README.md` — Quick-start instructions
- `.env.example` — Required environment variables

```bash
agentlaunch scaffold MyResearchBot
agentlaunch scaffold AlphaTrader --type trading
agentlaunch scaffold DataFeed --type data
```

**Flags:**

| Flag | Description | Values | Default |
|------|-------------|--------|---------|
| `--type <type>` | Agent type — controls domain, rate limits, and business logic scaffold | `faucet`, `research`, `trading`, `data` | `research` |

**Agent types:**

| Type | Domain | Free requests/day | Rate limit |
|------|--------|-------------------|------------|
| `faucet` | Token distribution | 5 | 10/min |
| `research` | Q&A and data retrieval | 10 | 20/min |
| `trading` | Market strategies | 20 | 30/min |
| `data` | Structured data feeds | 50 | 60/min |

**Example output:**

```
Scaffolding Research agent: MyResearchBot
Directory: /home/user/my-research-bot
  Created: agent.py
  Created: README.md
  Created: .env.example

Done! Next steps:

  cd my-research-bot
  cp .env.example .env
  # Edit .env and agent.py
  agentlaunch deploy
```

---

## `agentlaunch deploy`

Deploy an `agent.py` file to Agentverse hosted agents.

Steps performed:
1. Create agent record on Agentverse
2. Upload Python source code
3. Store `AGENTVERSE_API_KEY` and `AGENTLAUNCH_API_KEY` as Agentverse secrets
4. Start the agent
5. Poll until compiled (up to 60 seconds)

**Requires:** API key set via `agentlaunch config set-key`

```bash
# Deploy agent.py from the current directory
agentlaunch deploy

# Deploy a specific file with a custom name
agentlaunch deploy --file ./my_agent/agent.py --name "Alpha Research Bot"
```

**Flags:**

| Flag | Description | Default |
|------|-------------|---------|
| `--file <path>` | Path to the Python agent file | `./agent.py` |
| `--name <name>` | Display name on Agentverse (max 64 chars) | `"AgentLaunch Agent"` |

The deploy command auto-detects `README.md` and `agentlaunch.config.json` next to the agent file and uploads them as metadata to improve the agent's Agentverse ranking.

**Example output:**

```
Deploying: /home/user/my-research-bot/agent.py
Agent name: My Research Bot
README:     auto-detected
Description: auto-detected

[1/5] Creating agent on Agentverse...
[2/5] Uploading code...
[3/5] Setting secrets...
[4/5] Starting agent...
[5/5] Waiting for compilation...

==================================================
DEPLOYMENT SUCCESSFUL
==================================================
Agent Address: agent1qf8xfhsc8hg4g5l0nhtj5hxxkyd46c64qxvpa3g3ha9rjmezq3s6xw9y7g
Wallet:        0x1234abcd...
Status:        Running & Compiled

--------------------------------------------------
AGENT OPTIMIZATION CHECKLIST
--------------------------------------------------
  [x] Chat Protocol
  [x] README
  [x] Short Description
  [ ] Avatar — Upload in Agentverse dashboard:
        https://agentverse.ai/agents/details/agent1qf8...
  [x] Active Status
  [ ] Handle — Set a custom @handle (max 20 chars):
        https://agentverse.ai/agents/details/agent1qf8...
  [ ] 3+ Interactions — Run the Response QA Agent 3+ times:
        https://agentverse.ai/agents/details/agent1qf8...

  Score: 4/7 ranking factors addressed

Next — tokenize your agent:
  agentlaunch tokenize --agent agent1qf8... --name "My Research Bot" --symbol MRB
```

---

## `agentlaunch optimize <address>`

Update metadata on an already-deployed Agentverse agent to improve its ranking score.

Agentverse ranks agents by 7 factors. The `deploy` command handles 4 automatically (Chat Protocol, README, Short Description, Active Status). Use `optimize` to add or update metadata on agents that are already deployed.

Auto-detects `README.md` in the current directory if `--readme` is not specified.

```bash
# Auto-detect README.md in current directory
agentlaunch optimize agent1qf8xfhsc8hg4g5l0nhtj...

# Specify all fields
agentlaunch optimize agent1qf8xfhsc8hg4g5l0nhtj... \
  --readme ./README.md \
  --description "On-demand research reports powered by AI" \
  --avatar https://example.com/avatar.png
```

**Flags:**

| Flag | Description | Default |
|------|-------------|---------|
| `--readme <path>` | Path to README.md file | auto-detects `./README.md` |
| `--description <text>` | Short description (max 200 chars) | - |
| `--avatar <url>` | Public URL for avatar image | - |
| `--json` | Output only JSON | false |

**Example output:**

```
Optimizing agent: agent1qf8xfhsc8hg4g5l0nhtj...
  Updating: README
  Updating: Short Description

Updated 2 field(s): readme, short_description

--------------------------------------------------
AGENT OPTIMIZATION CHECKLIST
--------------------------------------------------
  [x] Chat Protocol
  [x] README
  [x] Short Description
  [ ] Avatar — Upload in Agentverse dashboard:
        https://agentverse.ai/agents/details/agent1qf8...
  [x] Active Status
  [ ] Handle — Set a custom @handle (max 20 chars):
        https://agentverse.ai/agents/details/agent1qf8...
  [ ] 3+ Interactions — Run the Response QA Agent 3+ times:
        https://agentverse.ai/agents/details/agent1qf8...

  Score: 4/7 ranking factors addressed
```

---

## `agentlaunch tokenize`

Create a pending token record on AgentLaunch and receive a handoff link for on-chain deployment.

The human who receives the handoff link opens it in a browser, connects their wallet, approves 120 FET, and deploys — all without the agent holding a private key.

**Requires:** API key set via `agentlaunch config set-key`

```bash
agentlaunch tokenize \
  --agent agent1qf8xfhsc8hg4g5l0nhtj5hxxkyd46c64qxvpa3g3ha9rjmezq3s6xw9y7g \
  --name "My Research Bot" \
  --symbol MRB \
  --description "Delivers on-demand research reports." \
  --chain 97
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--agent <address>` | Yes | Agentverse agent address (must start with `agent1q`) |
| `--name <name>` | Yes | Token name (max 32 characters) |
| `--symbol <symbol>` | Yes | Ticker symbol (2-11 characters, auto-uppercased) |
| `--description <desc>` | No | Token description (max 500 characters) |
| `--image <url>` | No | URL to a token logo image |
| `--chain <chainId>` | No | `97` (BSC testnet) or `56` (BSC mainnet) — default: `97` |

**API endpoint:** `POST /agents/tokenize`

**Example output:**

```
Tokenizing agent: agent1qf8xfhsc8hg4g5l0nhtj5hxxkyd46c64qxvpa3g3ha9rjmezq3s6xw9y7g
  Name:   My Research Bot
  Symbol: MRB
  Chain:  BSC testnet (97)

==================================================
TOKEN RECORD CREATED
==================================================
Token ID:   42
Status:     pending_deployment

Handoff link (share with a human to deploy on-chain):
  https://agent-launch.ai/deploy/42

Platform fee to deploy: 120 FET (read from contract at deploy time)
Trading fee: 2% -> 100% to protocol treasury
```

---

## `agentlaunch list`

List tokens on AgentLaunch in a formatted table.

```bash
# Default: latest 10 tokens
agentlaunch list

# Top 20 by market cap, machine-readable JSON
agentlaunch list --limit 20 --sort market_cap --json
```

**Flags:**

| Flag | Description | Default |
|------|-------------|---------|
| `--limit <n>` | Number of tokens to show (1-100) | `10` |
| `--sort <by>` | Sort order: `trending`, `latest`, `market_cap` | `latest` |
| `--json` | Output raw JSON (machine-readable, suppresses table) | off |

**API endpoint:** `GET /tokens`

**Example output (table):**

```
AgentLaunch Tokens  (sort: latest, limit: 10)

--------------------------------------------------------------
Name                  Symbol  Price (FET)   Progress  Status
--------------------------------------------------------------
Alpha Research Bot    ARB     0.000125 FET  33.3%     Active
My Trading Agent      MTA     0.000089 FET  12.1%     Active
DataFeed Pro          DFP     0.002341 FET  78.9%     Active
--------------------------------------------------------------

Showing 3 token(s). Use --limit to see more.

View on platform: https://agent-launch.ai
```
> The platform URL comes from `AGENT_LAUNCH_FRONTEND_URL` in `.env`.

**Example output (--json):**

```json
{
  "tokens": [
    {
      "id": 42,
      "name": "Alpha Research Bot",
      "symbol": "ARB",
      "price": "0.000125",
      "progress": 33.3,
      "status": "bonding"
    }
  ],
  "total": 3
}
```

---

## `agentlaunch status <address>`

Fetch details for a specific token by its contract address.

```bash
agentlaunch status 0xF7e2F77f014a5ad3C121b1942968be33BA89e03c
agentlaunch status 0xF7e2F77f... --json
```

**Flags:**

| Flag | Description | Default |
|------|-------------|---------|
| `--json` | Output raw JSON (machine-readable) | off |

**API endpoint:** `GET /tokens/address/{address}`

---

## `agentlaunch buy <address>`

Execute a buy on a bonding curve token contract, or preview with `--dry-run`.

**Requires:** `WALLET_PRIVATE_KEY` env var (unless `--dry-run`)

```bash
agentlaunch buy <address> --amount <FET> [--slippage 5] [--chain 97] [--dry-run] [--json]
```

**Flags:**

| Flag | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `--amount <fet>` | string | Yes | -- | Amount of FET to spend |
| `--slippage <percent>` | string | No | `5` | Slippage tolerance (0-100%) |
| `--chain <chainId>` | string | No | `97` | Chain: 97 (BSC Testnet), 56 (BSC Mainnet) |
| `--dry-run` | boolean | No | false | Preview trade without executing (no wallet needed) |
| `--json` | boolean | No | false | Machine-readable JSON output |

**API endpoint (dry-run):** `GET /tokens/calculate-buy`

**Example output (dry-run):**

```
==================================================
BUY PREVIEW (dry run)
==================================================
Token:          0xF7e2F77f014a5ad3C121b1942968be33BA89e03c
Chain:          BSC Testnet
FET to spend:   10 FET
Tokens to receive: 125000.50
Price per token: 0.000080 FET
Price impact:   0.5%
Protocol fee:   0.20 FET (2% to treasury)
Net FET spent:  9.80 FET
Slippage:       5%
==================================================

Re-run without --dry-run to execute the trade.
```

**Example output (executed):**

```
==================================================
BUY EXECUTED
==================================================
Token:          0xF7e2F77f014a5ad3C121b1942968be33BA89e03c
Chain:          BSC Testnet
Tx Hash:        0xabc123...
Block:          12345678
FET spent:      10 FET
Tokens received: 125000.50
Protocol fee:   0.20 FET (2% to treasury)
Price impact:   0.5%
Approval Tx:    0xdef456...
==================================================
```

---

## `agentlaunch sell <address>`

Execute a sell on a bonding curve token contract, or preview with `--dry-run`.

**Requires:** `WALLET_PRIVATE_KEY` env var (unless `--dry-run`)

```bash
agentlaunch sell <address> --amount <tokens> [--chain 97] [--dry-run] [--json]
```

**Flags:**

| Flag | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `--amount <tokens>` | string | Yes | -- | Amount of tokens to sell |
| `--chain <chainId>` | string | No | `97` | Chain: 97 (BSC Testnet), 56 (BSC Mainnet) |
| `--dry-run` | boolean | No | false | Preview trade without executing (no wallet needed) |
| `--json` | boolean | No | false | Machine-readable JSON output |

**API endpoint (dry-run):** `GET /tokens/calculate-sell`

**Example output (dry-run):**

```
==================================================
SELL PREVIEW (dry run)
==================================================
Token:          0xF7e2F77f014a5ad3C121b1942968be33BA89e03c
Chain:          BSC Testnet
Tokens to sell: 50000
FET to receive: 3.92 FET
Price per token: 0.000080 FET
Price impact:   0.3%
Protocol fee:   0.08 FET (2% to treasury)
Net FET received: 3.84 FET
==================================================

Re-run without --dry-run to execute the trade.
```

**Example output (executed):**

```
==================================================
SELL EXECUTED
==================================================
Token:          0xF7e2F77f014a5ad3C121b1942968be33BA89e03c
Chain:          BSC Testnet
Tx Hash:        0xabc123...
Block:          12345678
Tokens sold:    50000
FET received:   3.92 FET
Protocol fee:   0.08 FET (2% to treasury)
Price impact:   0.3%
==================================================
```

**Validation rules (both buy and sell):**
- Address must start with `0x` and be at least 10 chars
- Amount must be a positive number
- Chain must be 97 or 56
- Slippage must be 0-100 (buy only)

---

## Common Workflows

### Full workflow: create -> optimize -> tokenize

```bash
# 1. One command to create and deploy
npx agentlaunch my-bot

# 2. (Optional) Customize agent.py in the new directory
cd my-bot
# Edit agent.py with your business logic

# 3. (Optional) Update metadata for better ranking
npx agentlaunch optimize agent1q... --description "AI research reports on demand"

# 4. Tokenize (use agent address from deploy output)
npx agentlaunch tokenize \
  --agent agent1q... \
  --name "My Bot" \
  --symbol MBOT \
  --chain 97

# 5. Share the handoff link with a human to deploy on-chain
```

### Full workflow: scaffold -> deploy -> tokenize

```bash
# 1. Configure API key once
agentlaunch config set-key av-xxxxxxxxxxxxxxxx

# 2. Create a new agent project
agentlaunch scaffold MyBot --type research
cd my-bot

# 3. Configure environment
cp .env.example .env
# Edit .env: set AGENTVERSE_API_KEY and any other variables

# 4. Customize agent.py with your business logic
# Edit MyBotBusiness.handle() in agent.py

# 5. Deploy to Agentverse
agentlaunch deploy --name "My Bot"

# 6. Tokenize (use agent address from deploy output)
agentlaunch tokenize \
  --agent agent1q... \
  --name "My Bot" \
  --symbol MBOT \
  --chain 97

# 7. Share the handoff link with a human to deploy on-chain
```

### Monitor tokens in a script (JSON output)

```bash
# Get top 5 tokens by market cap, parse with jq
agentlaunch list --limit 5 --sort market_cap --json | jq '.tokens[].name'

# Save token list to a file
agentlaunch list --limit 100 --json > tokens.json
```

### On-chain trading

```bash
# Preview a buy (no wallet needed)
agentlaunch buy 0xF7e2F77f... --amount 10 --dry-run

# Execute a buy (requires WALLET_PRIVATE_KEY env var)
export WALLET_PRIVATE_KEY=0xabc123...
agentlaunch buy 0xF7e2F77f... --amount 10 --slippage 5

# Preview a sell
agentlaunch sell 0xF7e2F77f... --amount 50000 --dry-run

# Execute a sell
agentlaunch sell 0xF7e2F77f... --amount 50000
```

### Using production (default)

```bash
# Production is the default — configured via AGENT_LAUNCH_API_URL in .env
agentlaunch tokenize --agent agent1q... --name "Test Token" --symbol TEST --chain 97
```

### Switching to dev environment

```bash
# Option 1: Environment variable
export AGENT_LAUNCH_ENV=dev
agentlaunch list

# Option 2: CLI config
agentlaunch config set-url https://launchpad-backend-dev-1056182620041.us-central1.run.app
agentlaunch tokenize --agent agent1q... --name "Test Token" --symbol TEST --chain 97

# Reset to production
agentlaunch config set-url https://agent-launch.ai/api
```

---

## API Endpoints Used

These are the correct API paths used by the CLI (base URL: `https://agent-launch.ai/api`):

| Command | Method | Path |
|---------|--------|------|
| `list` | `GET` | `/tokens` |
| `status` | `GET` | `/tokens/address/{address}` |
| `tokenize` | `POST` | `/agents/tokenize` |
| `buy --dry-run` | `GET` | `/tokens/calculate-buy` |
| `sell --dry-run` | `GET` | `/tokens/calculate-sell` |

---

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | Error (validation failure, API error, missing config, etc.) |

All error messages are written to stderr. With `--json` flag, errors are written as `{"error": "..."}` to stdout.
