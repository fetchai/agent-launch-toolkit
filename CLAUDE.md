# CLAUDE.md -- AgentLaunch Toolkit

You are working inside the AgentLaunch Toolkit -- a complete system for
building, deploying, and tokenizing AI agents on the Fetch.ai ecosystem.

## What This Repo Does

This toolkit lets AI agents (including you) do the full lifecycle:

1. **Create** an agent with one command (chat-memory template by default)
2. **Deploy** to Agentverse (Fetch.ai's agent hosting platform)
3. **Optimize** the Setup Checklist (README, description, avatar, handle, interactions)
4. **Tokenize** on AgentLaunch (create a tradeable ERC-20 token)
5. **Hand off** a link for a human to sign the blockchain transaction
6. **Monitor** the token (price, holders, market cap)
7. **Trade** via pre-filled links (buy/sell signals)
8. **Grow** -- expand your agent economy

**IMPORTANT:** Always follow the full workflow below. NEVER skip Phase 3 (Optimize).
See `.claude/rules/workflow.md` for enforcement details.

## Agent Lifecycle Workflow

Every agent deployment MUST follow all 8 phases. See `docs/workflow.md` for the full guide.

```
[1] Create → [2] Deploy → [3] Optimize → [4] Tokenize → [5] Handoff → [6] Discover → [7] Trade → [8] Grow
```

### Phase 1: Create

```bash
npx agentlaunch                    # Interactive wizard (prompts for name, description, API key)
npx agentlaunch my-agent --local   # Scaffold only, no deploy
```

Creates `agent.py` with Chat Protocol v0.3.0, LLM integration, and conversation memory.
Claude Code launches in the project to help write real business logic (not placeholders).

### Phase 2: Deploy

```bash
npx agentlaunch deploy --name "My Agent"
```

Under the hood: creates agent on Agentverse, uploads code (double-encoded JSON), sets secrets, starts agent, polls until compiled (15-60s). Auto-uploads README and short description.

### Phase 3: Optimize (NEVER SKIP)

After deploying, complete the Agentverse Setup Checklist to maximize ranking and ASI:One routing.

| Checklist Item | How | API Settable? |
|---------------|-----|---------------|
| Chat Protocol | Built into agent code by `create` | N/A |
| README | `npx agentlaunch optimize agent1q... --readme ./README.md` | Yes: `PUT /v1/hosting/agents/{addr}` |
| Short Description | `npx agentlaunch optimize agent1q... --description "..."` | Yes: `PUT /v1/hosting/agents/{addr}` |
| Custom Avatar | `npx agentlaunch optimize agent1q... --avatar <url>` | Yes: `PUT /v1/hosting/agents/{addr}` |
| @Handle | Dashboard only (suggest 3-5 options to user) | No |
| 3+ Interactions | Chat directly, use Response QA Agent, or ASI:One | No |
| Domain Verification | DNS TXT record (bonus) | No |

After `npx agentlaunch` with deploy: 3/6 items are done automatically (Chat Protocol, README, About).
The remaining 3 require brief manual action. Run `npx agentlaunch optimize agent1q...` after each improvement.

### Phase 4: Tokenize

```bash
npx agentlaunch tokenize --agent agent1q... --name "Price Oracle" --symbol DATA --chain 97
```

Creates a pending token record via `POST /agents/tokenize`. Returns a handoff link.
Token is NOT on-chain yet -- needs a human to sign.

### Phase 5: Handoff

The handoff link (`https://agent-launch.ai/deploy/{tokenId}`) lets a human:
1. Connect wallet
2. Approve 120 FET spend
3. Click Deploy -- token goes live on bonding curve

**Architecture: agents think, humans sign.** Handoff is required for token deployment only.
Everything else (trading, payments, cross-holdings) can be autonomous.

### Phase 6: Discover

Agent competes for ASI:One routing alongside 2.5M agents (including brand agents).
Discovery depends on: README quality, interactions, success rate, handle, avatar, recency.
Monitor via Agentverse dashboard: Overview (success rate, interactions) and Discovery (keywords, impressions).

### Phase 7: Trade

```bash
# Preview
npx agentlaunch buy 0x... --amount 10 --dry-run
npx agentlaunch sell 0x... --amount 50000 --dry-run

# Execute (requires WALLET_PRIVATE_KEY in .env)
npx agentlaunch buy 0x... --amount 10
npx agentlaunch sell 0x... --amount 50000
```

Agents with `BSC_PRIVATE_KEY` secret can trade autonomously via `HoldingsManager`.
Without a key, `buy_via_web3()` returns a handoff link instead.

### Phase 8: Grow

Build additional agents to expand your economy. Each new agent can be tokenized independently.
Quality flywheel: good agents -> token holders -> higher price -> more visibility -> more users.

### Quick Reference: Commands by Phase

| Phase | CLI Command | MCP Tool | Slash Command |
|-------|------------|----------|---------------|
| Create | `npx agentlaunch` | `scaffold_agent` | `/build-agent` |
| Deploy | `npx agentlaunch deploy` | `deploy_to_agentverse` | `/deploy` |
| Optimize | `npx agentlaunch optimize agent1q...` | `update_agent_metadata` | — |
| Tokenize | `npx agentlaunch tokenize --agent agent1q...` | `create_token_record` | `/tokenize` |
| Monitor | `npx agentlaunch status 0x...` | `get_token` | `/status` |
| Trade (preview) | `npx agentlaunch buy 0x... --dry-run` | `calculate_buy` | — |
| Trade (execute) | `npx agentlaunch buy 0x... --amount 10` | `buy_tokens` | — |
| List | `npx agentlaunch list` | `list_tokens` | `/market` |

## What's Inside

| Package | Path | Description |
|---------|------|-------------|
| **SDK** | `packages/sdk/` | TypeScript client for every API endpoint |
| **CLI** | `packages/cli/` | 24 commands, one-command full lifecycle |
| **MCP Server** | `packages/mcp/` | 28 tools for Claude Code / Cursor |
| **Templates** | `packages/templates/` | 9 agent blueprints (chat-memory is default) |

## Authentication

Everything uses ONE key: the Agentverse API key from `.env`.

- Set it once -- SDK, CLI, MCP, and all examples use it automatically
- Auth header: `X-API-Key: <AGENTVERSE_API_KEY>`
- No wallet signatures needed for API operations
- Human wallet only needed for on-chain signing (via handoff links)

## Environment URLs

The toolkit defaults to production (`https://agent-launch.ai`):

| Variable | Production (default) | Dev |
|----------|---------------------|-----|
| `AGENT_LAUNCH_API_URL` | `https://agent-launch.ai/api` | `https://launchpad-backend-dev-1056182620041.us-central1.run.app` |
| `AGENT_LAUNCH_FRONTEND_URL` | `https://agent-launch.ai` | `https://launchpad-frontend-dev-1056182620041.us-central1.run.app` |

Set `AGENT_LAUNCH_ENV=dev` to use dev URLs. Production is the default.
Or override directly with `AGENT_LAUNCH_API_URL` and `AGENT_LAUNCH_FRONTEND_URL`.

## Quick Commands

```bash
# Build everything
npm run build

# Run tests
npm run test

# Clean all dist/ directories
npm run clean

# Run CLI
npx agentlaunch                            # Interactive: prompts for name, deploys, opens Claude Code
npx agentlaunch my-agent                   # Create agent named "my-agent" (deploys by default)
npx agentlaunch my-agent --local           # Scaffold only, no deploy
npx agentlaunch list                       # List all tokens
npx agentlaunch status 0x...               # Check a token
npx agentlaunch optimize agent1q...        # Update README/description/avatar for ranking

# On-chain trading (requires WALLET_PRIVATE_KEY in .env)
npx agentlaunch buy 0x... --amount 10     # Buy tokens with 10 FET
npx agentlaunch sell 0x... --amount 50000 # Sell 50000 tokens for FET
npx agentlaunch buy 0x... --amount 10 --dry-run  # Preview without executing

# Multi-token wallet (requires WALLET_PRIVATE_KEY in .env)
npx agentlaunch wallet balances           # Show FET + USDC + BNB balances
npx agentlaunch wallet send USDC 0x... 10 # Send USDC to a wallet
npx agentlaunch wallet delegate FET 100 --spender 0x...  # Delegation link
npx agentlaunch wallet allowance FET --owner 0x... --spender 0x...  # Check limit
npx agentlaunch pay 0x... 10 --token USDC # Pay in any supported token
npx agentlaunch invoice create --agent agent1q... --payer 0x... --service api --amount 10
npx agentlaunch invoice list --agent agent1q... --status pending

# Run MCP server (for Claude Code integration)
npx agent-launch-mcp

# Run examples
npx ts-node examples/agents/joke-teller/deploy.ts
```

## Package Structure

```
agent-launch-toolkit/
  .env.example              # Copy to .env, add your Agentverse API key
  CLAUDE.md                 # This file (Claude Code reads it first)
  packages/
    sdk/                    # agentlaunch-sdk (TypeScript HTTP client)
    cli/                    # agentlaunch (interactive + scripted commands)
    mcp/                    # agent-launch-mcp (28 tools for Claude Code)
    templates/              # agentlaunch-templates (9 agent blueprints, chat-memory is default)
  .claude/
    settings.json           # MCP server config, permissions
    rules/                  # Auto-loaded coding rules
    skills/                 # Slash commands (/build-agent, /deploy, etc.)
  docs/                     # Architecture, references
  examples/                 # Copy-paste workflows
```

## MCP Server (Pre-Configured)

The MCP server is already configured in `.claude/settings.json`.
You have access to these tools:

| Tool | What It Does |
|------|-------------|
| `list_tokens` | Browse tokens (filter by status, chain, category) |
| `get_token` | Get details for a specific token |
| `get_platform_stats` | Platform-wide statistics |
| `calculate_buy` | Preview a buy (tokens received, fee, price impact) |
| `calculate_sell` | Preview a sell (FET received, fee, price impact) |
| `create_token_record` | Create a new token -- get handoff link |
| `get_deploy_instructions` | Get deploy instructions for a pending token |
| `get_trade_link` | Generate pre-filled buy/sell link |
| `deploy_to_agentverse` | Deploy Python agent to Agentverse (auto-sets README + description) |
| `update_agent_metadata` | Update README, description, avatar on an existing agent |
| `scaffold_agent` | Generate agent code from template |
| `create_and_tokenize` | Full lifecycle in one call |
| `check_agent_commerce` | Revenue, pricing, balance for an agent |
| `buy_tokens` | Buy tokens on-chain (or dry-run preview) |
| `sell_tokens` | Sell tokens on-chain (or dry-run preview) |
| `get_wallet_balances` | Check wallet BNB, FET, and token balances |
| `get_comments` | Read token comments |
| `post_comment` | Post a comment on a token |
| `multi_token_payment` | Send FET, USDC, or ERC-20 payment |
| `check_spending_limit` | Read ERC-20 allowance (delegation check) |
| `create_delegation` | Generate delegation handoff link |
| `get_fiat_link` | Generate MoonPay/Transak fiat onramp URL |
| `create_invoice` | Create payment invoice in agent storage |
| `list_invoices` | List invoices by status |
| `get_multi_token_balances` | Query FET + USDC + BNB + custom balances |

## Slash Commands

| Command | Action |
|---------|--------|
| `/build-agent` | Scaffold + deploy + tokenize (guided) |
| `/deploy` | Deploy agent.py to Agentverse |
| `/tokenize` | Create token for an existing agent |
| `/market` | Browse tokens and prices |
| `/status` | Check agent/token status |
| `/todo` | Create TODO.md from a document |
| `/grow` | Execute tasks from TODO.md autonomously |
| `/improve` | Capture session learnings, test, and create PR |

## Architecture

```
    SDK (TypeScript client)
     |
     +-- CLI (wraps SDK with interactive prompts)
     +-- MCP (wraps SDK as Claude Code tools)
     +-- Templates (agent code generation)
          |
          v
    AgentLaunch API (${AGENT_LAUNCH_API_URL})
     |
     +-- Token operations (create, list, details)
     +-- Market data (prices, bonding curve math)
     +-- Handoff links (deploy, trade)
          |
          v
    Agentverse API (https://agentverse.ai/v1)
     |
     +-- Agent lifecycle (create, upload code, start/stop)
     +-- Secrets management
     +-- Log monitoring
```

## Templates

| Template | Description | Use Case |
|----------|-------------|----------|
| `chat-memory` | **LLM + conversation memory** (default) | Most agents — smart conversations out of the box |
| `custom` | Blank Chat Protocol boilerplate | Start from scratch |
| `price-monitor` | Watches token prices, sends alerts | Monitoring service |
| `trading-bot` | Buy/sell signal generation | Trading service |
| `data-analyzer` | On-chain data analysis | Analytics service |
| `research` | Deep dives and reports | Research service |
| `gifter` | Treasury wallet + rewards | Community incentives |
| `consumer-commerce` | Multi-token payments, invoices, fiat onramp | Consumer-facing commerce agents |

## Platform Constants (Immutable)

These are baked into the smart contracts. Never change them:

| Constant | Value |
|----------|-------|
| Deploy Fee | 120 FET (read dynamically from contract) |
| Graduation Target | 30,000 FET -- auto DEX listing |
| Trading Fee | 2% -- 100% to protocol treasury (no creator fee) |
| Total Buy Supply | 800,000,000 tokens |
| Default Chain | BSC (Testnet: 97, Mainnet: 56) |

**Fee rule:** The 2% trading fee goes 100% to REVENUE_ACCOUNT (protocol treasury).
There is NO creator fee split. The contract has no mechanism to send fees to creators.

## Testnet Resources

### TFET Contract (BSC Testnet)
```
0x304ddf3eE068c53514f782e2341B71A80c8aE3C7
```

### Get Testnet Tokens

**Message @gift on Agentverse (Recommended)**

The @gift agent is the testnet faucet — it distributes tokens to new developers so you can deploy without hunting for faucets.

```
Handle:   @gift
Agent:    agent1q2d0n5tp563wr0ugj9cmcqms9jfv5ks63xy5vg3evy5gy0z52e66xmeyyw9
Token:    0xF7e2F77f014a5ad3C121b1942968be33BA89e03c ($GIFT on BSC Testnet)
Chat:     https://agentverse.ai/agents/details/agent1q2d0n5tp563wr0ugj9cmcqms9jfv5ks63xy5vg3evy5gy0z52e66xmeyyw9
Trade:    https://agent-launch.ai/token/0xF7e2F77f014a5ad3C121b1942968be33BA89e03c
```

**How to get tokens:**
1. Open the chat link above (or search @gift on Agentverse)
2. Send: `claim 0x<your-wallet-address>`
3. Receive 200 TFET + 0.001 tBNB instantly

**What you get:**
| Reward | Amount | Requirements |
|--------|--------|--------------|
| Welcome Gift | 200 TFET + 0.001 tBNB | Up to 3 claims per agent |
| Referral | 10 TFET | `refer agent1q... 0x...` |
| Builder Reward | 20 TFET/week | Must have deployed token |

The 200 TFET covers the 120 FET deploy fee with 80 FET left for trading.

**Other commands:**
- `status` — Check treasury balance
- `help` — Full command list
- `refer agent1q... 0x...` — Refer another agent, earn 10 FET

**Alternative: BSC Testnet Faucet**
- tBNB only: https://testnet.bnbchain.org/faucet-smart

## Agentverse API Gotchas

- **Code upload requires double-encoded JSON:**
  ```python
  code_array = [{"language": "python", "name": "agent.py", "value": code}]
  payload = {"code": json.dumps(code_array)}  # json.dumps required!
  ```
- Use `datetime.now()` not `datetime.utcnow()` (deprecated)
- `@chat_proto.on_message(ChatAcknowledgement)` handler is required
- Wait 15-60s after start for agent compilation
- Agent listing response is `{ items: [...] }` not `{ agents: [...] }`

## Wallet Access (Runtime-Verified)

- `ctx.wallet` **DOES NOT EXIST** — never use it
- `agent.wallet` **EXISTS** — `cosmpy.aerial.wallet.LocalWallet` (auto-provisioned `fetch1...` address)
- `ctx.ledger` **EXISTS** — `cosmpy.aerial.client.LedgerClient`
- Balance: `ctx.ledger.query_bank_balance(str(agent.wallet.address()), "atestfet")`
- Send FET: `ctx.ledger.send_tokens(dest, amount, "atestfet", agent.wallet)`
- BSC/EVM key: store via Agentverse Secrets, use web3.py

## The Handoff Protocol

Agents store EVM keys securely via Agentverse Secrets for autonomous trading.
Handoff links are used for irreversible actions like token deployment:

1. Agent calls API to create token record
2. API returns handoff link (`/deploy/{tokenId}`)
3. Agent gives link to human
4. Human connects wallet, signs transaction (pays 120 FET)
5. Token is live on-chain

Handoff is required for token deployment. Everything else can be autonomous.

## API Endpoints

```
Base URL: https://agent-launch.ai/api
Auth: X-API-Key: <AGENTVERSE_API_KEY>

GET   /tokens                             List tokens (paginated)
GET   /tokens/address/{address}           Token details by address
GET   /tokens/id/{id}                     Token details by ID
GET   /tokens/calculate-buy               Preview buy on bonding curve
GET   /tokens/calculate-sell              Preview sell on bonding curve

POST  /agents/tokenize                    Create token -> handoff link
GET   /agents/my-agents                   List your Agentverse agents
GET   /agents/token/{address}/holders     Holder distribution
POST  /agents/auth                        Exchange API key for JWT

GET   /comments/{address}                 Get comments
POST  /comments/{address}                 Post comment

GET   /platform/stats                     Platform statistics
```

## Agentverse API

```
Base URL: https://agentverse.ai/v1
Auth: Authorization: Bearer <AGENTVERSE_API_KEY>

POST  /hosting/agents                     Create agent
GET   /hosting/agents                     List agents -> { items: [...] }
PUT   /hosting/agents/{addr}/code         Upload code (DOUBLE-ENCODED JSON)
POST  /hosting/agents/{addr}/start        Start agent
POST  /hosting/agents/{addr}/stop         Stop agent
GET   /hosting/agents/{addr}/logs/latest   Get logs
POST  /hosting/secrets                    Set a secret
```

## Creating TODOs

When asked to "create todo from doc" or similar:

1. Read the source document (e.g., a strategy doc, roadmap, or feature spec)
2. Use `docs/TODO-template.md` as the format template
3. Create `docs/TODO.md` (or specified output file) with:
   - YAML frontmatter (title, version, total_tasks, completed, status, depends_on)
   - "Now" section with immediate next actions
   - Phase-based task tables with columns: Status, ID, Task, How, KPI, Depends
   - Gate criteria for each phase
   - Dependency graph (ASCII or Mermaid)
   - Progress overview with progress bars
   - Relevant cheat sheets or monitoring info

### Task Table Format

```markdown
| Status | ID | Task | How | KPI | Depends |
|:---:|:---|:---|:---|:---|:---|
| `[ ]` | L-1 | Deploy the agent | `npx agentlaunch deploy` | Agent compiled | — |
| `[ ]` | L-2 | Optimize metadata | `npx agentlaunch optimize agent1q...` | 6/6 checklist | L-1 |
```

### Status Markers

- `[ ]` - Pending
- `[~]` - In Progress
- `[x]` - Complete
- `[!]` - Blocked

### Dependency Format

Use short IDs (L-1, P-2, G-3) and list dependencies in the "Depends" column.
Tasks with `—` have no dependencies and can start immediately.
