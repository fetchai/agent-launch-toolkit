# CLAUDE.md -- AgentLaunch Toolkit

You are working inside the AgentLaunch Toolkit -- a complete system for
building, deploying, and tokenizing AI agents on the Fetch.ai ecosystem.

## What This Repo Does

This toolkit lets AI agents (including you) do the full lifecycle:

1. **Scaffold** agent code from 6 templates
2. **Deploy** to Agentverse (Fetch.ai's agent hosting platform)
3. **Tokenize** on AgentLaunch (create a tradeable ERC-20 token)
4. **Hand off** a link for a human to sign the blockchain transaction
5. **Monitor** the token (price, holders, market cap)
6. **Trade** via pre-filled links (buy/sell signals)

## What's Inside

| Package | Path | Description |
|---------|------|-------------|
| **SDK** | `packages/sdk/` | TypeScript client for every API endpoint |
| **CLI** | `packages/cli/` | 10 commands, one-command full lifecycle |
| **MCP Server** | `packages/mcp/` | 13+ tools for Claude Code / Cursor |
| **Templates** | `packages/templates/` | 6 production-ready agent blueprints |

## Authentication

Everything uses ONE key: the Agentverse API key from `.env`.

- Set it once -- SDK, CLI, MCP, and all examples use it automatically
- Auth header: `X-API-Key: <AGENTVERSE_API_KEY>`
- No wallet signatures needed for API operations
- Human wallet only needed for on-chain signing (via handoff links)

## Environment URLs

The toolkit supports dev and production environments via `.env`:

| Variable | Dev (default) | Production |
|----------|--------------|------------|
| `AGENT_LAUNCH_API_URL` | `https://launchpad-backend-dev-1056182620041.us-central1.run.app` | `https://agent-launch.ai/api` |
| `AGENT_LAUNCH_FRONTEND_URL` | `https://launchpad-frontend-dev-1056182620041.us-central1.run.app` | `https://agent-launch.ai` |

Set `AGENT_LAUNCH_ENV=dev` (default) or `AGENT_LAUNCH_ENV=production` to switch.
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
npx agentlaunch create                     # Interactive: scaffold -> deploy -> tokenize
npx agentlaunch list                       # List all tokens
npx agentlaunch status 0x...               # Check a token

# Run MCP server (for Claude Code integration)
npx agent-launch-mcp

# Run examples
npx ts-node examples/01-hello-world/deploy.ts
```

## Package Structure

```
agent-launch-toolkit/
  .env.example              # Copy to .env, add your Agentverse API key
  CLAUDE.md                 # This file (Claude Code reads it first)
  packages/
    sdk/                    # agentlaunch-sdk (TypeScript HTTP client)
    cli/                    # agentlaunch-cli (interactive + scripted commands)
    mcp/                    # agent-launch-mcp (13+ tools for Claude Code)
    templates/              # agentlaunch-templates (6 agent blueprints)
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
| `deploy_to_agentverse` | Deploy Python agent to Agentverse |
| `scaffold_agent` | Generate agent code from template |
| `create_and_tokenize` | Full lifecycle in one call |
| `get_comments` | Read token comments |
| `post_comment` | Post a comment on a token |

## Slash Commands

| Command | Action |
|---------|--------|
| `/build-agent` | Scaffold + deploy + tokenize (guided) |
| `/deploy` | Deploy agent.py to Agentverse |
| `/tokenize` | Create token for an existing agent |
| `/market` | Browse tokens and prices |
| `/status` | Check agent/token status |

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
| `custom` | Blank Chat Protocol boilerplate | Start from scratch |
| `price-monitor` | Watches token prices, sends alerts | Monitoring service |
| `trading-bot` | Buy/sell signal generation | Trading service |
| `data-analyzer` | On-chain data analysis | Analytics service |
| `research` | Deep dives and reports | Research service |
| `gifter` | Treasury wallet + rewards | Community incentives |

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

## The Handoff Protocol

Agents NEVER hold private keys. The flow is:

1. Agent calls API to create token record
2. API returns handoff link (`/deploy/{tokenId}`)
3. Agent gives link to human
4. Human connects wallet, signs transaction
5. Token is live on-chain

This separation is fundamental to the architecture. Never bypass it.

## API Endpoints

```
Base URL: ${AGENT_LAUNCH_API_URL}
Auth: X-API-Key: <AGENTVERSE_API_KEY>

POST  /agents/tokenize                    Create token -> handoff link
GET   /agents/tokens                      List tokens (paginated)
GET   /agents/token/{address}             Token details
GET   /agents/token/{address}/holders     Holder distribution
GET   /agents/token/{address}/comments    Comments
POST  /agents/token/{address}/comments    Post comment

GET   /tokens/calculate-buy               Preview buy on bonding curve
GET   /tokens/calculate-sell              Preview sell on bonding curve

GET   /platform/stats                     Platform statistics
```

## Agentverse API

```
Base URL: https://agentverse.ai/v1
Auth: Authorization: bearer <AGENTVERSE_API_KEY>

POST  /hosting/agents                     Create agent
GET   /hosting/agents                     List agents -> { items: [...] }
PUT   /hosting/agents/{addr}/code         Upload code (DOUBLE-ENCODED JSON)
POST  /hosting/agents/{addr}/start        Start agent
POST  /hosting/agents/{addr}/stop         Stop agent
GET   /hosting/agents/{addr}/logs         Get logs
POST  /hosting/secrets                    Set a secret
```
