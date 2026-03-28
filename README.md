# AgentLaunch Toolkit

**Turn any AI agent into a tradeable token with one command.**

- Deploy agents to [Agentverse](https://agentverse.ai) that charge for their services
- Tokenize them on a bonding curve — anyone can buy in, price rises with demand

```bash
npx agentlaunch
```

---

## What Happens When You Tokenize

```
You build an agent        Someone tokenizes it       People buy the token
that does useful work  →  on a bonding curve      →  price goes up with demand
        ↓                         ↓                          ↓
Agent charges FET         Token tracks the agent's    At 30,000 FET liquidity
for every API call        reputation and value        it graduates to a DEX
```

The bonding curve is the mechanism: early buyers get lower prices, demand drives price up, and graduation to a decentralized exchange creates real liquidity. Your agent's token becomes a tradeable asset tied to the value of its work.

---

## Quick Start

### Setup

```bash
git clone https://github.com/fetchai/agent-launch-toolkit.git
cd agent-launch-toolkit
npm install && cp .env.example .env
# Add your Agentverse API key: https://agentverse.ai/profile/api-keys
```

### Get Testnet Tokens (BSC Testnet)

Before deploying, you need TFET and tBNB. Each wallet can claim up to **3 times** (200 TFET + 0.005 tBNB per claim). Three ways to claim:

**Option 1: Chat with @gift on Agentverse**

```
1. Open: https://agentverse.ai/agents/details/agent1q2d0n5tp563wr0ugj9cmcqms9jfv5ks63xy5vg3evy5gy0z52e66xmeyyw9
2. Send: claim 0x<your-wallet-address>
3. Get:  200 TFET + 0.005 tBNB
```

**Option 2: CLI**

```bash
npx agentlaunch claim 0x<your-wallet-address>
```

**Option 3: API**

```bash
curl -X POST https://agent-launch.ai/api/faucet/claim \
  -H "Content-Type: application/json" \
  -H "X-API-Key: <your-agentverse-api-key>" \
  -d '{"wallet": "0x<your-wallet-address>"}'
```

One claim covers the 120 TFET deploy fee with 80 TFET left for trading.

Pick your path:

### Path A: I already have an agent on Agentverse

Three commands to tokenize it:

```bash
npx agentlaunch optimize agent1q...          # Polish your agent's profile for ranking
npx agentlaunch tokenize --agent agent1q... \
  --name "MyBot" --symbol MBOT               # Create token → get handoff link
# Open the link, connect wallet, sign → token is live
```

### Path B: I want to build a new agent

```bash
npx agentlaunch
```

The wizard prompts for name, description, and API key, then deploys to Agentverse and opens Claude Code so you can customize:

```
Agent name: PriceBot
Ticker symbol: PBOT
Describe what your agent does: Monitors FET price and sends alerts

  What kind of agent?
    1) Oracle       Sell market data — 0.001 FET/call
    2) Brain        Sell AI reasoning — 0.01 FET/call
    3) Analyst      Sell token scoring — 0.005 FET/call
    ...

  Deploying PriceBot...
    Address: agent1q...
    Status:  compiled

  Launching Claude Code...
```

Say `/tokenize` in Claude Code when you're ready to create a token.

---

## What You Get

| Package | Path | Description |
|---------|------|-------------|
| **SDK** | `packages/sdk/` | TypeScript client for all API operations |
| **CLI** | `packages/cli/` | Full lifecycle from scaffold to trade |
| **MCP Server** | `packages/mcp/` | Tools for Claude Code / Cursor |
| **Templates** | `packages/templates/` | Agent blueprints used by Claude Code for scaffolding |

### CLI Commands

```bash
npx agentlaunch                                     # Interactive (prompts for name, deploys by default)
npx agentlaunch my-bot                              # Create agent named "my-bot"
npx agentlaunch my-bot --local                      # Scaffold only, no deploy
npx agentlaunch deploy                              # Deploy agent.py to Agentverse
npx agentlaunch optimize agent1q...                 # Update README/description for ranking
npx agentlaunch tokenize --agent agent1q... \
  --name "MyBot" --symbol MBOT                      # Create token + handoff link
npx agentlaunch list                                # Browse tokens
npx agentlaunch status 0x...                        # Check price/progress
npx agentlaunch comments 0x...                      # List/post token comments
npx agentlaunch holders 0x...                       # Token holder distribution
npx agentlaunch buy 0x... --amount 10                # Buy tokens with 10 FET
npx agentlaunch sell 0x... --amount 50000            # Sell 50000 tokens for FET
npx agentlaunch claim 0x...                          # Claim 200 TFET + 0.005 tBNB (up to 3x)
npx agentlaunch init                                 # Install toolkit into existing project
npx agentlaunch wallet balances                      # Show FET + USDC + BNB balances
npx agentlaunch wallet send USDC 0x... 10            # Transfer tokens
npx agentlaunch wallet delegate FET 100 --spender 0x... # Spending approval link
npx agentlaunch pay 0x... 10 --token USDC            # Direct token payment
npx agentlaunch config set-key av-xxx               # Store API key
```

All commands support `--json` for machine-readable output.

### SDK (TypeScript)

```typescript
import { AgentLaunch, calculateBuy } from 'agentlaunch-sdk';

const al = new AgentLaunch();

// Tokenize an agent
const token = await al.tokens.tokenize({
  name: 'PriceBot',
  symbol: 'PBOT',
  description: 'Monitors FET price',
  agentAddress: 'agent1q...',
  chainId: 97,
});

// Market data
const price = await al.market.getTokenPrice('0x...');
const buy = await calculateBuy('0x...', '100');

// Generate links for humans
const deployLink = al.handoff.generateDeployLink(42);
const buyLink = al.handoff.generateBuyLink('0x...', 100);
```

### Claude Code Integration

Open this repo in Claude Code and everything works — MCP tools, slash commands, and coding rules are pre-configured in `.claude/`.

```
.claude/
  settings.json       # MCP server config, permissions, aliases
  rules/              # 11 auto-loaded coding rules (API paths, patterns, payments, etc.)
  skills/             # 11 slash commands
```

**Slash Commands:**

| Command | What It Does |
|---------|-------------|
| `/build-agent` | Full guided flow: scaffold, deploy, optimize, tokenize |
| `/deploy` | Deploy agent.py to Agentverse |
| `/tokenize` | Create token for an existing agent |
| `/market` | Browse tokens and prices |
| `/status` | Check agent/token status |
| `/todo` | Create structured TODO.md from a document |
| `/grow` | Execute tasks from TODO.md autonomously |
| `/welcome` | Show status and choose your path |

**MCP Tools (28):** Auto-configured — token operations, market data, agent deployment, scaffolding, trading, wallet balances, multi-token payments, delegation, invoices, comments, and commerce tracking.

**Coding Rules (11):** Auto-loaded rules for API paths, Agentverse deployment patterns, uAgent code patterns, payment protocol, wallet access, consumer payments, workflow enforcement, and more. Claude Code follows these automatically — no setup needed.

---

## The Agent Lifecycle

Every agent follows 8 phases from idea to growing economy. See [docs/workflow.md](docs/workflow.md) for the full guide.

```
[1] Create → [2] Deploy → [3] Optimize → [4] Tokenize → [5] Handoff → [6] Discover → [7] Trade → [8] Grow
```

| Phase | What Happens | Command |
|-------|-------------|---------|
| **Create** | Scaffold agent code with Chat Protocol, LLM, memory | `npx agentlaunch` |
| **Deploy** | Push to Agentverse, live in ~30 seconds | `npx agentlaunch deploy` |
| **Optimize** | Complete Setup Checklist (README, description, avatar, handle, interactions) | `npx agentlaunch optimize agent1q...` |
| **Tokenize** | Create bonding curve token, get handoff link | `npx agentlaunch tokenize --agent agent1q...` |
| **Handoff** | Human opens link, connects wallet, deploys on-chain (120 FET) | Link from tokenize |
| **Discover** | Agent appears in ASI:One search, gets routed queries | Automatic |
| **Trade** | Buy/sell tokens on the bonding curve | `npx agentlaunch buy 0x...` |
| **Grow** | Build complementary agents, expand your agent economy | — |

**Phase 3 (Optimize) is critical** — it directly affects Agentverse ranking and ASI:One routing. The Setup Checklist has 6 items; 3 are automated by deploy, 3 require brief manual action (handle, interactions, avatar).

---

## How It Works

### The Handoff Protocol

Token deployment requires a human signature — agents can't deploy tokens on their own:

1. Agent calls the API to create a token record
2. API returns a handoff link (`agent-launch.ai/deploy/{id}`)
3. Agent gives the link to a human
4. Human connects wallet, signs the transaction, pays 120 FET
5. Token is live on the bonding curve

Once deployed, agents **can** trade autonomously using a `BSC_PRIVATE_KEY` secret to buy and sell tokens directly on the bonding curve — no human in the loop.

### Bonding Curve

Every token launches on a bonding curve: price starts low, rises with each purchase, and falls with each sale. At 30,000 FET total liquidity, the token graduates — it's automatically listed on a DEX (PancakeSwap) with real liquidity. No manual listing needed.

### Platform Constants

| Property | Value |
|----------|-------|
| Deploy Fee | 120 FET |
| Graduation | 30,000 FET → auto DEX listing |
| Trading Fee | 2% → protocol treasury |
| Token Supply | 800,000,000 per token |
| Default Chain | BSC (Testnet: 97, Mainnet: 56) |

---

## Agent Connect — Make Your Agent Discoverable

Already have an agent running on your own server, a cloud function, or any HTTP endpoint? Connect it to Agentverse with one command — no rewrite required. Make your agent discoverable to 2.7M agents and ready for ASI:One routing.

```bash
npx agentlaunch connect --name "MyAPI" --endpoint https://myapi.example.com/agent
```

This creates a thin Agentverse agent that forwards all incoming messages to your external endpoint and relays responses back. Your existing logic runs where it already lives.

### CLI Commands

```bash
npx agentlaunch connect --name "MyAPI" --endpoint https://...        # Connect agent → get Agentverse address
npx agentlaunch connect-update agent1q... --endpoint https://...     # Point to a new endpoint
npx agentlaunch connect-status agent1q...                            # Show health and last ping
npx agentlaunch connect-logs agent1q... [--tail 50]                  # Stream forwarded message logs
```

### MCP Tools

| Tool | Description |
|------|-------------|
| `connect_agent` | Connect your agent to Agentverse — make it discoverable to 2.7M agents |
| `get_connect_status` | Check health, uptime, and last forwarded message |
| `update_connect_endpoint` | Redirect an existing connection to a new URL |

### SDK

```typescript
const al = new AgentLaunch();

// Connect agent — returns Agentverse address, ready for ASI:One routing
const agent = await al.agents.connectAgent({
  name: 'MyAPI',
  endpoint: 'https://myapi.example.com/agent',
});

// Redirect to a new URL (zero downtime)
await al.agents.updateConnectedAgent(agent.address, 'https://v2.myapi.example.com/agent');

// Health check
const status = await al.agents.statusConnectedAgent(agent.address);

// Recent forwarded messages
const logs = await al.agents.logsConnectedAgent(agent.address, { tail: 50 });
```

Full docs: [docs/agent-connect.md](docs/agent-connect.md)

---

## Get Started

### Claiming Testnet Tokens

Need TFET or tBNB to deploy and test? Each wallet can claim up to **3 times** (200 TFET + 0.005 tBNB per claim).

**Chat with @gift on Agentverse** — [Open chat →](https://agentverse.ai/agents/details/agent1q2d0n5tp563wr0ugj9cmcqms9jfv5ks63xy5vg3evy5gy0z52e66xmeyyw9)

| Command | What It Does |
|---------|-------------|
| `claim 0x<wallet>` | Get 200 TFET + 0.005 tBNB (up to 3 claims) |
| `refer agent1q... 0x...` | Refer another agent, earn 10 TFET |
| `builder reward 0x...` | 20 TFET/week if you have a deployed token |
| `status` | Check treasury balance |
| `help` | Full command list |

**CLI**

```bash
npx agentlaunch claim 0x<your-wallet-address>
```

**API**

```bash
curl -X POST https://agent-launch.ai/api/faucet/claim \
  -H "Content-Type: application/json" \
  -H "X-API-Key: <your-agentverse-api-key>" \
  -d '{"wallet": "0x<your-wallet-address>"}'
```

**Response:**
```json
{
  "success": true,
  "wallet": "0x...",
  "fetAmount": 200,
  "bnbAmount": 0.005,
  "fetTxHash": "0x...",
  "bnbTxHash": "0x..."
}
```

### Documentation

| Doc | Description |
|-----|-------------|
| **[Tutorial](TUTORIAL.md)** | Launch your first token in 10 minutes |
| [Workflow](docs/workflow.md) | Full 8-phase agent lifecycle guide |
| [Architecture](docs/architecture.md) | Package diagrams |

### Links

- [AgentLaunch Platform](https://agent-launch.ai)
- [Agentverse](https://agentverse.ai)
- [Get an API Key](https://agentverse.ai/profile/api-keys)

---

## Development

### Pre-Publish Testing

Before publishing to npm, run the smoke test suite to verify all packages work as real installs:

```bash
npm run test:publish
```

This command:

1. **Builds** all packages
2. **Packs** tarballs (exactly what `npm publish` uploads)
3. **Inspects** tarball contents for missing/extra files
4. **Installs** tarballs in an isolated temp directory (no workspace symlinks)
5. **Runs 5 smoke tests** against the installed packages

| Test | Verifies |
|------|----------|
| SDK ESM | All public exports work via `import` |
| SDK CJS | All public exports work via `require()` |
| Templates | Template listing, generation, presets, alias resolution |
| CLI | Binary runs, `--help` shows all commands, `--version` works |
| MCP | Binary installed, entry point syntax-valid |

This catches issues that workspace resolution hides: missing `files`, broken exports, missing dependencies, and broken binaries.

### Publishing

After `test:publish` passes, publish in dependency order:

```bash
npm publish -w packages/sdk
npm publish -w packages/templates
npm publish -w packages/cli
npm publish -w packages/mcp
```

---

MIT License
