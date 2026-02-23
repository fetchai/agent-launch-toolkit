# CLI Reference — `agentlaunch-cli`

Full command reference for the AgentLaunch CLI. Scaffold, deploy, and tokenize AI agents from the terminal.

**Install globally:**
```bash
npm install -g agentlaunch-cli
```

**Verify:**
```bash
agentlaunch --version
# 1.0.0

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
#   Base URL: https://launchpad-backend-dev-1056182620041.us-central1.run.app (dev default, from .env)
#   Config:   ~/.agentlaunch/config.json
```

---

### `agentlaunch config set-url <url>`

Override the API base URL. Useful for self-hosted instances or staging environments.

```bash
agentlaunch config set-url https://staging.agent-launch.ai/api
# Base URL set to: https://staging.agent-launch.ai/api
```

Reset to the production URL:

```bash
agentlaunch config set-url https://agent-launch.ai/api
```

Or reset to dev (the .env default):

```bash
agentlaunch config set-url https://launchpad-backend-dev-1056182620041.us-central1.run.app
```

**Flags:** None.

**Config file location:** `~/.agentlaunch/config.json`

```json
{
  "apiKey": "av-xxxxxxxxxxxxxxxx",
  "baseUrl": "https://launchpad-backend-dev-1056182620041.us-central1.run.app"
}
```

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

**Example output:**

```
Deploying: /home/user/my-research-bot/agent.py
Agent name: My Research Bot

[1/5] Creating agent on Agentverse...
      Address: agent1qf8xfhsc8hg4g5l0nhtj5hxxkyd46c64qxvpa3g3ha9rjmezq3s6xw9y7g
[2/5] Uploading code...
      Digest: d4e5f6a7b8c9d0e1...
[3/5] Setting secrets...
      Set: AGENTVERSE_API_KEY
      Set: AGENTLAUNCH_API_KEY
[4/5] Starting agent...
      Started.
[5/5] Waiting for compilation...
      Waiting... (5s)
      Compiled.

==================================================
DEPLOYMENT SUCCESSFUL
==================================================
Agent Address: agent1qf8xfhsc8hg4g5l0nhtj5hxxkyd46c64qxvpa3g3ha9rjmezq3s6xw9y7g
Wallet:        0x1234abcd...
Status:        Running & Compiled

View at: https://agentverse.ai/agents

Next — tokenize your agent:
  agentlaunch tokenize --agent agent1qf8... --name "My Research Bot" --symbol MRB
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
| `--symbol <symbol>` | Yes | Ticker symbol (2–11 characters, auto-uppercased) |
| `--description <desc>` | No | Token description (max 500 characters) |
| `--image <url>` | No | URL to a token logo image |
| `--chain <chainId>` | No | `97` (BSC testnet) or `56` (BSC mainnet) — default: `97` |

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
  https://launchpad-frontend-dev-1056182620041.us-central1.run.app/deploy/42

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
| `--limit <n>` | Number of tokens to show (1–100) | `10` |
| `--sort <by>` | Sort order: `trending`, `latest`, `market_cap` | `latest` |
| `--json` | Output raw JSON (machine-readable, suppresses table) | off |

**Example output (table):**

```
AgentLaunch Tokens  (sort: latest, limit: 10)

──────────────────────────────────────────────────────────────
Name                  Symbol  Price (FET)   Progress  Status
──────────────────────────────────────────────────────────────
Alpha Research Bot    ARB     0.000125 FET  33.3%     Active
My Trading Agent      MTA     0.000089 FET  12.1%     Active
DataFeed Pro          DFP     0.002341 FET  78.9%     Active
──────────────────────────────────────────────────────────────

Showing 3 token(s). Use --limit to see more.

View on platform: https://launchpad-frontend-dev-1056182620041.us-central1.run.app
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

## Common Workflows

### Full workflow: scaffold → deploy → tokenize

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

### Using the dev environment (default)

```bash
# Dev is the default — configured via AGENT_LAUNCH_API_URL in .env
agentlaunch config set-url https://launchpad-backend-dev-1056182620041.us-central1.run.app
agentlaunch tokenize --agent agent1q... --name "Test Token" --symbol TEST --chain 97
```

### Switching to production

```bash
agentlaunch config set-url https://agent-launch.ai/api
agentlaunch tokenize --agent agent1q... --name "Test Token" --symbol TEST --chain 97
```

---

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | Error (validation failure, API error, missing config, etc.) |

All error messages are written to stderr. With `--json` flag, errors are written as `{"error": "..."}` to stdout.
