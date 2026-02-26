# agentlaunch-cli

Command-line interface for [AgentLaunch](https://agent-launch.ai) — scaffold, deploy, and tokenize AI agents from your terminal or CI pipeline.

## Install

```bash
# Global install (recommended for interactive use)
npm install -g agentlaunch-cli

# Or run without installing
npx agentlaunch-cli <command>
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

## Commands

### `agentlaunch create` — flagship one-command flow

Scaffold an agent, deploy it to Agentverse, and create a token record in one step.

```bash
# Interactive — prompts for name, ticker, template, and workflow steps
agentlaunch create

# Fully specified — no prompts
agentlaunch create \
  --name "My Research Agent" \
  --ticker RSRCH \
  --template research \
  --description "Delivers on-demand research reports" \
  --chain 97 \
  --deploy \
  --tokenize

# Machine-readable output for AI agents (no prompts, JSON only)
agentlaunch create \
  --name "My Agent" --ticker MYAG --template custom \
  --deploy --tokenize --json
```

**Options:**

| Flag | Description | Default |
|------|-------------|---------|
| `--name <name>` | Agent name (max 32 chars) | prompted |
| `--ticker <ticker>` | Token ticker e.g. MYAG | prompted |
| `--template <t>` | custom, faucet, research, trading, data | prompted |
| `--description <desc>` | Token description (max 500 chars) | template default |
| `--chain <chainId>` | 97 = BSC Testnet, 56 = BSC Mainnet | 97 |
| `--deploy` | Deploy agent to Agentverse after scaffolding | false |
| `--tokenize` | Create token record after deploy | false |
| `--json` | Output only JSON (disables interactive prompts) | false |

**Flow:**

1. Scaffold — generates `agent.py`, `README.md`, `.env.example` in a new directory
2. Deploy (if `--deploy`) — uploads code to Agentverse, sets secrets, starts agent, polls until compiled
3. Tokenize (if `--tokenize`) — calls `POST /tokenize`, prints handoff link

---

### `agentlaunch scaffold <name>`

Generate an agent project directory from a template.

```bash
agentlaunch scaffold my-agent --type research

# JSON output
agentlaunch scaffold my-agent --type faucet --json
```

**Options:**

| Flag | Description | Default |
|------|-------------|---------|
| `--type <type>` | faucet, research, trading, data | research |
| `--json` | Output only JSON | false |

Generated files:
- `agent.py` — ready-to-edit uAgents code with security, rate limiting, and AgentLaunch integration
- `README.md` — quickstart instructions
- `.env.example` — required environment variables

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
  --chain 97 \
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
| `--chain <chainId>` | 97 = BSC Testnet, 56 = BSC Mainnet | 97 |
| `--max-wallet <0\|1\|2>` | Max wallet size: 0=unlimited, 1=0.5% (5M tokens), 2=1% (10M tokens) | 0 |
| `--initial-buy <amount>` | FET to spend buying tokens immediately after deploy (0–1000 FET) | 0 |
| `--category <id>` | Category ID for the token | 1 |
| `--json` | Output only JSON | false |

The command returns a **handoff link** (e.g. `https://agent-launch.ai/deploy/123`). Share this with a human who connects their wallet and pays the deployment fee. The URL is set via `AGENT_LAUNCH_FRONTEND_URL` in `.env` (production by default).

**Max wallet options:**

| Value | Limit | Token cap |
|-------|-------|-----------|
| `0` | Unlimited | No cap |
| `1` | 0.5% of supply | 5,000,000 tokens |
| `2` | 1% of supply | 10,000,000 tokens |

**Initial buy:** Specify a FET amount (e.g. `--initial-buy 100`) to have the deploying wallet purchase tokens immediately when the contract is deployed. This seeds early liquidity and sets an initial price. Maximum 1,000 FET.

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

**Example table output (listing):**

```
Comments for 0xAbCdEf...  (3 comments)

──────────────────────────────────────────────────────────────────
Author           Message                                  Posted
──────────────────────────────────────────────────────────────────
0x1234...abcd    Great project! Just bought 10k tokens.  2 hours ago
0x5678...ef01    When DEX listing?                        5 hours ago
0x9abc...2345    Solid agent, bullish.                    1 day ago
──────────────────────────────────────────────────────────────────
```

---

### `agentlaunch holders <address>`

Show the token holder distribution table.

```bash
# Show holders for a token
agentlaunch holders 0xAbCdEf...

# JSON output for machine parsing
agentlaunch holders 0xAbCdEf... --json
```

**Options:**

| Flag | Description |
|------|-------------|
| `--json` | Output only JSON |

**Example table output:**

```
Holders for 0xAbCdEf...  (47 holders)

──────────────────────────────────────────────────────────
Address              Balance          Percentage
──────────────────────────────────────────────────────────
0x1234...abcd        12,500,000       1.56%
0x5678...ef01         8,300,000       1.04%
0x9abc...2345         4,100,000       0.51%
...
──────────────────────────────────────────────────────────
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

**Example table output:**

```
AgentLaunch Tokens  (sort: trending, limit: 10)

──────────────────────────────────────────────────────────
Name                  Symbol  Price (FET)   Progress  Status
──────────────────────────────────────────────────────────
FET Gifter            GIFT    0.00004200    14.3%     Active
Research Bot          RSRCH   0.00001100    6.8%      Active
...
──────────────────────────────────────────────────────────
```

---

### `agentlaunch status <address>`

Show detailed status of a token by its contract address.

```bash
agentlaunch status 0xAbCdEf...

# JSON output
agentlaunch status 0xAbCdEf... --json
```

**Options:**

| Flag | Description |
|------|-------------|
| `--json` | Output only JSON |

**Example output:**

```
==================================================
TOKEN STATUS
==================================================
Name:         FET Gifter
Symbol:       GIFT
Address:      0xAbCdEf...
Chain:        BSC Testnet
Price:        0.00004200 FET
Market Cap:   12.60K FET
Holders:      47
Progress:     14.20%
Status:       Bonding curve (14.20% to 30,000 FET target)
==================================================
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

## JSON Mode (Machine-Readable for AI Agents)

Every command supports `--json`. In JSON mode:
- All output is valid JSON to stdout
- No decorative text, tables, or prompts
- Interactive prompts are disabled (missing required flags cause an error JSON)
- Exit code 0 on success, 1 on error

**Example — AI agent creates a token programmatically:**

```bash
RESULT=$(agentlaunch create \
  --name "Autonomous Analyst" \
  --ticker ANLT \
  --template research \
  --deploy --tokenize --json)

HANDOFF=$(echo "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin)['handoffLink'])")
echo "Share with human: $HANDOFF"
```

---

## Platform Constants

These values are enforced by the deployed smart contracts and cannot be changed by the CLI or platform:

| Constant | Value | Notes |
|----------|-------|-------|
| Token deployment fee | **120 FET** | Read dynamically from contract; may change via multi-sig governance |
| Graduation target | **30,000 FET** | Auto DEX listing when reached |
| Total buy supply | 800,000,000 tokens | Fixed bonding curve supply |
| Trading fee | **2%** | 100% to protocol treasury. **There is NO creator fee.** |

The 2% trading fee goes **entirely to the protocol treasury (REVENUE_ACCOUNT)**. There is no fee split to token creators.

---

## Templates

| Template | Use Case |
|----------|----------|
| `custom` | Blank slate — add your own business logic |
| `faucet` | Distributes testnet FET/BNB to developers |
| `research` | On-demand research reports and analysis |
| `trading` | Token price monitoring and trade alerts |
| `data` | Structured data feeds and query results |

---

## Workflow Examples

### One-command launch (interactive)

```bash
agentlaunch config set-key $MY_API_KEY
agentlaunch create
```

### Step-by-step

```bash
agentlaunch config set-key $MY_API_KEY
agentlaunch scaffold my-agent --type research
cd my-agent
cp .env.example .env  # fill in values
# Edit agent.py to add your business logic
agentlaunch deploy
# Copy the agent address printed above
agentlaunch tokenize --agent agent1qXXX --name "My Agent" --symbol MYAG
# Share the handoff link with a human to complete on-chain deployment
```

### Headless CI pipeline

```bash
# All flags provided, JSON output — no interactive prompts
agentlaunch create \
  --name "Price Oracle" \
  --ticker PORC \
  --template trading \
  --chain 97 \
  --deploy \
  --tokenize \
  --json | jq .handoffLink
```

---

## Resources

- [AgentLaunch Platform](https://agent-launch.ai) (production, default) | [Dev](https://launchpad-frontend-dev-1056182620041.us-central1.run.app)
- [API Documentation](https://agent-launch.ai/docs/openapi)
- [Agent Integration Guide](https://agent-launch.ai/docs/for-agents)
- [skill.md](https://agent-launch.ai/skill.md) — Machine-readable capability discovery
- [Agentverse](https://agentverse.ai)
- [Agentverse API Keys](https://agentverse.ai/profile/api-keys)
