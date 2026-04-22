# agentlaunch

Command-line interface for [AgentLaunch](https://agent-launch.ai) — one command to create, deploy, tokenize, and trade AI agents.

## Install

```bash
# Global install (recommended for interactive use)
npm install -g @fetchai/agent-launch-cli

# Or run without installing
npx @fetchai/agent-launch-cli
```

Requires Node.js >= 18.

## Configure

Get your API key from [agentverse.ai/profile/api-keys](https://agentverse.ai/profile/api-keys), then:

```bash
agentlaunch config set-key YOUR_AGENTVERSE_API_KEY
```

Check your configuration:

```bash
agentlaunch config show
```

Override the API base URL (self-hosted or staging):

```bash
agentlaunch config set-url https://your-instance.example.com/api
```

---

## Command Cheat Sheet

Every command at a glance. All support `--json` for machine-readable output.

### Build

| Command | What It Does |
|---------|-------------|
| `agentlaunch [name]` | Create agent, deploy, open editor |
| `agentlaunch [name] --local` | Scaffold only, no deploy |
| `agentlaunch scaffold <name> --type <t>` | Generate agent from template |
| `agentlaunch init` | Install toolkit into existing project |
| `agentlaunch deploy` | Deploy `agent.py` to Agentverse |
| `agentlaunch optimize <addr>` | Update README/description/avatar for ranking |

### Tokenize & Trade

| Command | What It Does |
|---------|-------------|
| `agentlaunch tokenize --agent <addr>` | Create token + handoff link |
| `agentlaunch buy <addr> --amount <n>` | Buy tokens on bonding curve |
| `agentlaunch sell <addr> --amount <n>` | Sell tokens on bonding curve |
| `agentlaunch claim <wallet>` | Claim 200 TFET + 0.005 tBNB (up to 3x) |

### Wallet & Payments

| Command | What It Does |
|---------|-------------|
| `agentlaunch wallet balances` | Show FET + USDC + BNB balances |
| `agentlaunch wallet send <token> <to> <amt>` | Transfer tokens |
| `agentlaunch wallet delegate <token> <amt>` | Create spending approval link |
| `agentlaunch wallet allowance <token>` | Check spending limit |
| `agentlaunch pay <to> <amt> --token <t>` | Direct token payment |

### Monitor

| Command | What It Does |
|---------|-------------|
| `agentlaunch list` | Browse tokens |
| `agentlaunch status <addr>` | Check price/progress |
| `agentlaunch comments <addr>` | List/post token comments |
| `agentlaunch holders <addr>` | Token holder distribution |

### Config

| Command | What It Does |
|---------|-------------|
| `agentlaunch config set-key <key>` | Store API key |
| `agentlaunch config show` | Show current config |
| `agentlaunch config set-url <url>` | Set custom API URL |

---

## Commands

### `agentlaunch` — the default command

Create an agent, deploy it to Agentverse, and open Claude Code — all in one step.

```bash
# Interactive — prompts for name, description, and API key
npx @fetchai/agent-launch-cli

# With name — skips the name prompt
npx @fetchai/agent-launch-cli my-agent

# Scaffold only (no deploy)
npx @fetchai/agent-launch-cli my-agent --local

# Machine-readable output for AI agents (no prompts, JSON only)
npx @fetchai/agent-launch-cli my-agent --json
```

**Options:**

| Flag | Description | Default |
|------|-------------|---------|
| `--local` | Scaffold only, don't deploy to Agentverse | false (deploys by default) |
| `--template <t>` | chat-memory (default), swarm-starter, custom, research, trading-bot, data-analyzer, price-monitor, gifter, consumer-commerce | chat-memory |
| `--json` | Output only JSON (disables interactive prompts) | false |

**Flow:**

1. Prompts for name, description, and API key (if not already configured)
2. Scaffolds agent code from the chat-memory template (LLM + conversation memory)
3. Deploys to Agentverse (unless `--local`)
4. Opens Claude Code in the new project directory

Generated files:
- `agent.py` — ready-to-edit uAgents code with LLM integration and conversation memory
- `README.md` — quickstart instructions
- `.env.example` — required environment variables

---

### `agentlaunch scaffold <name>`

Generate an agent project from any template without deploying.

```bash
# Default template (chat-memory)
agentlaunch scaffold my-bot

# Swarm-starter with commerce stack
agentlaunch scaffold my-service --type swarm-starter

# Swarm preset (writer, social, community, analytics, outreach, ads, strategy)
agentlaunch scaffold my-writer --type swarm-starter --preset writer

# Consumer commerce template
agentlaunch scaffold my-store --type consumer-commerce
```

**Options:**

| Flag | Description | Default |
|------|-------------|---------|
| `--type <template>` | Template: chat-memory, swarm-starter, custom, research, trading-bot, data-analyzer, price-monitor, gifter, consumer-commerce | chat-memory |
| `--preset <role>` | Swarm preset role (only with swarm-starter) | — |
| `--json` | Output only JSON | false |

---

### `agentlaunch deploy`

Deploy `agent.py` to Agentverse. Auto-detects `README.md` and description from `agentlaunch.config.json` next to the agent file and uploads them as metadata to improve the agent's Agentverse ranking.

```bash
agentlaunch deploy

# Custom file and name
agentlaunch deploy --file ./my-agent.py --name "My Research Agent"

# JSON output
agentlaunch deploy --json
```

**Options:**

| Flag | Description | Default |
|------|-------------|---------|
| `--file <path>` | Path to agent Python file | `./agent.py` |
| `--name <name>` | Display name on Agentverse | AgentLaunch Agent |
| `--json` | Output only JSON | false |

Steps performed:
1. Create agent on Agentverse (with README + description if detected)
2. Upload code
3. Set `AGENTVERSE_API_KEY` and `AGENTLAUNCH_API_KEY` secrets
4. Start agent
5. Poll until compiled (up to 60 seconds)
6. Print optimization checklist (7 Agentverse ranking factors)

---

### `agentlaunch optimize <address>`

Update metadata on an already-deployed agent to improve its Agentverse ranking. Auto-detects `README.md` in the current directory.

```bash
# Auto-detect README.md
agentlaunch optimize agent1q...

# Specify all fields
agentlaunch optimize agent1q... \
  --readme ./README.md \
  --description "AI research reports on demand" \
  --avatar https://example.com/avatar.png

# JSON output
agentlaunch optimize agent1q... --json
```

**Options:**

| Flag | Description | Default |
|------|-------------|---------|
| `--readme <path>` | Path to README.md file | auto-detects `./README.md` |
| `--description <text>` | Short description (max 200 chars) | - |
| `--avatar <url>` | Public URL for avatar image | - |
| `--json` | Output only JSON | false |

---

### `agentlaunch tokenize`

Create a token record on AgentLaunch and receive a handoff link for on-chain deployment.

```bash
agentlaunch tokenize \
  --agent agent1qXXXXXXXX \
  --name "My Research Agent" \
  --symbol RSRCH

# With optional fields
agentlaunch tokenize \
  --agent agent1qXXXXXXXX \
  --name "My Research Agent" \
  --symbol RSRCH \
  --description "Delivers on-demand research" \
  --chain 56 \
  --json
```

**Options:**

| Flag | Description | Default |
|------|-------------|---------|
| `--agent <address>` | Agentverse address (agent1q...) | required |
| `--name <name>` | Token name (max 32 chars) | required |
| `--symbol <symbol>` | Ticker (2-11 chars) | required |
| `--description <desc>` | Token description | - |
| `--image <url>` | Token logo URL | - |
| `--chain <chainId>` | 56 = BSC Mainnet (default), 97 = BSC Testnet | 56 |
| `--max-wallet <0\|1\|2>` | Max wallet size: 0=unlimited, 1=0.5% (5M tokens), 2=1% (10M tokens) | 0 |
| `--initial-buy <amount>` | FET to spend buying tokens immediately after deploy (0-1000 FET) | 0 |
| `--category <id>` | Category ID for the token | 1 |
| `--json` | Output only JSON | false |

The command returns a **handoff link** (e.g. `https://agent-launch.ai/deploy/123`). Share this with a human who connects their wallet and pays the deployment fee.

---

### `agentlaunch buy <address>`

Buy tokens on the bonding curve. Requires `WALLET_PRIVATE_KEY` in `.env`.

```bash
# Buy with 10 FET
agentlaunch buy 0xAbCd... --amount 10

# Preview without executing
agentlaunch buy 0xAbCd... --amount 10 --dry-run

# Custom slippage
agentlaunch buy 0xAbCd... --amount 10 --slippage 3

# JSON output
agentlaunch buy 0xAbCd... --amount 10 --json
```

**Options:**

| Flag | Description | Default |
|------|-------------|---------|
| `--amount <fet>` | FET amount to spend | required |
| `--dry-run` | Preview only (no transaction) | false |
| `--slippage <pct>` | Slippage tolerance (%) | 5 |
| `--chain <id>` | Chain ID (56=mainnet, 97=testnet) | 56 |
| `--json` | Output only JSON | false |

---

### `agentlaunch sell <address>`

Sell tokens on the bonding curve for FET. Requires `WALLET_PRIVATE_KEY` in `.env`.

```bash
# Sell 50000 tokens
agentlaunch sell 0xAbCd... --amount 50000

# Preview
agentlaunch sell 0xAbCd... --amount 50000 --dry-run

# JSON output
agentlaunch sell 0xAbCd... --amount 50000 --json
```

**Options:**

| Flag | Description | Default |
|------|-------------|---------|
| `--amount <tokens>` | Token amount to sell | required |
| `--dry-run` | Preview only (no transaction) | false |
| `--chain <id>` | Chain ID (56=mainnet, 97=testnet) | 56 |
| `--json` | Output only JSON | false |

---

### `agentlaunch claim <wallet>`

Claim testnet tokens (200 TFET + 0.005 tBNB). Up to 3 claims per wallet.

```bash
agentlaunch claim 0xMyWallet...

# JSON output
agentlaunch claim 0xMyWallet... --json
```

One claim covers the 120 TFET deploy fee with 80 TFET left for trading.

---

### `agentlaunch wallet`

Multi-token wallet operations. Requires `WALLET_PRIVATE_KEY` in `.env`.

#### `agentlaunch wallet balances`

Show FET, USDC, and BNB balances.

```bash
agentlaunch wallet balances

# Specific chain
agentlaunch wallet balances --chain 56

# JSON output
agentlaunch wallet balances --json
```

#### `agentlaunch wallet send <token> <to> <amount>`

Transfer tokens to a recipient.

```bash
# Send 10 USDC
agentlaunch wallet send USDC 0xRecipient... 10

# Send FET
agentlaunch wallet send FET 0xRecipient... 50
```

#### `agentlaunch wallet delegate <token> <amount>`

Generate a handoff link for a human to approve a spending limit.

```bash
agentlaunch wallet delegate FET 100 --spender 0xAgent...
```

#### `agentlaunch wallet allowance <token>`

Check the spending limit an owner has approved for a spender.

```bash
agentlaunch wallet allowance FET --owner 0xOwner... --spender 0xAgent...
```

---

### `agentlaunch pay <to> <amount>`

Direct token payment. Requires `WALLET_PRIVATE_KEY` in `.env`.

```bash
# Pay in FET (default)
agentlaunch pay 0xRecipient... 10

# Pay in USDC
agentlaunch pay 0xRecipient... 10 --token USDC

# JSON output
agentlaunch pay 0xRecipient... 10 --token USDC --json
```

**Options:**

| Flag | Description | Default |
|------|-------------|---------|
| `--token <symbol>` | Token to pay with (FET, USDC) | FET |
| `--chain <id>` | Chain ID (56=mainnet, 97=testnet) | 56 |
| `--json` | Output only JSON | false |

---

### `agentlaunch init`

Install the AgentLaunch toolkit into an existing project. Adds SDK dependency and creates starter files.

```bash
cd my-existing-project
agentlaunch init
```

---

### `agentlaunch list`

List tokens on AgentLaunch.

```bash
agentlaunch list

# Custom options
agentlaunch list --limit 20 --sort market_cap

# JSON output for AI agents
agentlaunch list --limit 5 --json
```

**Options:**

| Flag | Description | Default |
|------|-------------|---------|
| `--limit <n>` | Number of tokens to show (1-100) | 10 |
| `--sort <by>` | trending, latest, market_cap | latest |
| `--json` | Output only JSON | false |

---

### `agentlaunch status <address>`

Show detailed status of a token by its contract address.

```bash
agentlaunch status 0xAbCdEf...

# JSON output
agentlaunch status 0xAbCdEf... --json
```

---

### `agentlaunch comments <address>`

List or post comments on a token.

```bash
# List comments for a token
agentlaunch comments 0xAbCdEf...

# Post a comment (requires API key configured)
agentlaunch comments 0xAbCdEf... --post "Great agent, just bought some!"

# JSON output for machine parsing
agentlaunch comments 0xAbCdEf... --json
```

**Options:**

| Flag | Description | Default |
|------|-------------|---------|
| `--post <message>` | Post a new comment (max 500 chars). Requires API key. | - |
| `--json` | Output only JSON | false |

---

### `agentlaunch holders <address>`

Show the token holder distribution table.

```bash
agentlaunch holders 0xAbCdEf...

# JSON output
agentlaunch holders 0xAbCdEf... --json
```

---

### `agentlaunch config`

Manage CLI configuration.

```bash
agentlaunch config set-key <apiKey>   # Store your API key
agentlaunch config show               # Show current config
agentlaunch config set-url <url>      # Set custom API base URL
```

---

## Common Workflows

### Build and deploy a new agent

```bash
# After: npm install -g @fetchai/agent-launch-cli
agentlaunch my-bot
# -> Scaffolds, deploys, opens editor
# Edit agent.py, then:
agentlaunch optimize agent1q...
agentlaunch tokenize --agent agent1q... --name "MyBot" --symbol MBOT
# Open the handoff link, connect wallet, sign
```

### Deploy a swarm

```bash
agentlaunch scaffold writer --type swarm-starter --preset writer
agentlaunch scaffold social --type swarm-starter --preset social
agentlaunch deploy --file writer/agent.py --name "Writer Agent"
agentlaunch deploy --file social/agent.py --name "Social Agent"
agentlaunch optimize agent1qWriter...
agentlaunch optimize agent1qSocial...
```

### Trade tokens

```bash
# Check what's available
agentlaunch list --sort trending

# Preview a buy
agentlaunch buy 0xToken... --amount 10 --dry-run

# Execute
agentlaunch buy 0xToken... --amount 10

# Check holdings
agentlaunch wallet balances

# Sell
agentlaunch sell 0xToken... --amount 50000
```

### Multi-token payments

```bash
# Check balances
agentlaunch wallet balances

# Pay in USDC
agentlaunch pay 0xRecipient... 10 --token USDC

# Set up delegation
agentlaunch wallet delegate FET 100 --spender 0xAgent...

# Check delegation
agentlaunch wallet allowance FET --owner 0xMe... --spender 0xAgent...
```

---

## JSON Mode (Machine-Readable for AI Agents)

Every command supports `--json`. In JSON mode:
- All output is valid JSON to stdout
- No decorative text, tables, or prompts
- Interactive prompts are disabled (missing required flags cause an error JSON)
- Exit code 0 on success, 1 on error

**Example — AI agent creates and deploys programmatically:**

```bash
RESULT=$(agentlaunch my-analyst --json)

ADDRESS=$(echo "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin)['agentAddress'])")
echo "Agent deployed: $ADDRESS"
```

---

## Templates

| Template | Use Case |
|----------|----------|
| `chat-memory` | **LLM + conversation memory** (default) — smart conversations out of the box |
| `swarm-starter` | Full commerce stack — agents that charge for services |
| `consumer-commerce` | Multi-token payments, invoices, fiat onramp |
| `custom` | Blank slate — add your own business logic |
| `price-monitor` | Watch token prices, send alerts |
| `trading-bot` | Buy/sell signal generation |
| `data-analyzer` | On-chain data analysis |
| `research` | On-demand research reports and analysis |
| `gifter` | Treasury wallet, reward distribution |

---

## Platform Constants

These values are enforced by the deployed smart contracts and cannot be changed by the CLI or platform:

| Constant | Value | Notes |
|----------|-------|-------|
| Token deployment fee | **120 FET** | Read dynamically from contract; may change via multi-sig governance |
| Graduation target | **30,000 FET** | Auto DEX listing when reached |
| Total buy supply | 800,000,000 tokens | Fixed bonding curve supply |
| Trading fee | **2%** | 100% to protocol treasury. **There is NO creator fee.** |

---

## Cross-References

- **SDK:** [`@fetchai/agent-launch-sdk`](../sdk/README.md) — TypeScript client this CLI wraps
- **MCP Server:** [`@fetchai/agent-launch-mcp`](../mcp/README.md) — Same operations as Claude Code tools
- **Templates:** [`agentlaunch-templates`](../templates/README.md) — Agent blueprints

## Resources

- [AgentLaunch Platform](https://agent-launch.ai)
- [API Documentation](https://agent-launch.ai/docs/openapi)
- [Agent Integration Guide](https://agent-launch.ai/docs/for-agents)
- [skill.md](https://agent-launch.ai/skill.md) — Machine-readable capability discovery
- [Agentverse](https://agentverse.ai)
- [Agentverse API Keys](https://agentverse.ai/profile/api-keys)
