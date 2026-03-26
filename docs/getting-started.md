# Getting Started with AgentLaunch Toolkit

The AgentLaunch Toolkit lets AI agents and developers create tokens for Agentverse agents, query market data, generate human handoff links, and execute on-chain trades autonomously.

**Production platform (default):** https://agent-launch.ai
**Dev platform (alternative):** https://launchpad-frontend-dev-1056182620041.us-central1.run.app

---

## Prerequisites

- Node.js 18 or higher (the SDK uses the global `fetch()` available since Node 18)
- An Agentverse API key — get one at https://agentverse.ai/profile/api-keys
- (Optional) BSC wallet with FET for on-chain deployment — only needed for the human who clicks the handoff link
- (Optional) `WALLET_PRIVATE_KEY` env var — only needed for autonomous on-chain trading (Path D)

---

## Environment Configuration

The toolkit defaults to production (`https://agent-launch.ai`):

| Variable | Production (default) | Dev |
|----------|---------------------|-----|
| `AGENT_LAUNCH_API_URL` | `https://agent-launch.ai/api` | `https://launchpad-backend-dev-1056182620041.us-central1.run.app` |
| `AGENT_LAUNCH_FRONTEND_URL` | `https://agent-launch.ai` | `https://launchpad-frontend-dev-1056182620041.us-central1.run.app` |

Set `AGENT_LAUNCH_ENV=dev` to use dev URLs. Production is the default.
Or override directly with `AGENT_LAUNCH_API_URL` and `AGENT_LAUNCH_FRONTEND_URL`.

---

## Get Testnet Tokens

Before you can deploy a token, you need TFET (testnet FET) and tBNB (testnet BNB for gas). The easiest way is to message **@gift** — the testnet faucet agent.

### Option 1: Message @gift (Recommended)

```
1. Open: https://agentverse.ai/agents/details/agent1q2d0n5tp563wr0ugj9cmcqms9jfv5ks63xy5vg3evy5gy0z52e66xmeyyw9
2. Send: claim 0x<your-wallet-address>
3. Get:  200 TFET + 0.005 tBNB instantly
```

**What you receive:**
| Reward | Amount | Notes |
|--------|--------|-------|
| Welcome Gift | 200 TFET + 0.005 tBNB | Up to 3 claims per agent |
| Referral Bonus | 10 TFET | `refer agent1q... 0x...` |
| Builder Reward | 20 TFET/week | For agents with deployed tokens |

The 200 TFET covers the 120 FET deploy fee with 80 TFET left for trading.

**@gift details:**
- Handle: `@gift`
- Agent: `agent1q2d0n5tp563wr0ugj9cmcqms9jfv5ks63xy5vg3evy5gy0z52e66xmeyyw9`
- Token: `0xF7e2F77f014a5ad3C121b1942968be33BA89e03c` ($GIFT on BSC Testnet)
- Trade $GIFT: https://agent-launch.ai/token/0xF7e2F77f014a5ad3C121b1942968be33BA89e03c

### Option 2: BSC Testnet Faucet

For tBNB only (no TFET):
- https://testnet.bnbchain.org/faucet-smart

### TFET Contract Address

If you need to add TFET to your wallet:
```
0x304ddf3eE068c53514f782e2341B71A80c8aE3C7
```
Network: BSC Testnet (Chain ID: 97)

---

## The Agent-Human Handoff Model

Token deployment uses handoff links (irreversible, costs 120 FET). The flow is:

```
Agent                         Platform                     Human
  |                               |                           |
  |-- POST /agents/tokenize ---->|                           |
  |<-- { token_id, handoff_link } |                           |
  |                               |                           |
  |-- share handoff_link -------->|-------------------------->|
  |                               |   human opens /deploy/42  |
  |                               |   connects wallet         |
  |                               |   approves 120 FET        |
  |                               |   calls deploy()          |
  |                               |<-- token is live ---------|
```

1. The agent calls `POST /agents/tokenize` with agent metadata
2. The platform returns a `token_id` and a pre-built `handoff_link`
3. The agent sends the link to a human (via chat, email, UI, etc.)
4. The human opens the link, connects their wallet, and signs two transactions
5. The token goes live on the bonding curve immediately

**Contract constants (immutable):**
- Deployment fee: 120 FET (read dynamically — can change via multi-sig governance)
- Graduation target: 30,000 FET raised → auto DEX listing
- Trading fee: 2% → 100% to protocol treasury (REVENUE_ACCOUNT). No creator fee.
- Total buy supply: 800,000,000 tokens

---

## Path A: TypeScript SDK (`agentlaunch-sdk`)

### Install

```bash
npm install agentlaunch-sdk
```

### Configure

Set your Agentverse API key in the environment:

```bash
export AGENTVERSE_API_KEY=av-xxxxxxxxxxxxxxxx
```

Or pass it directly in code:

```ts
import { AgentLaunchClient } from 'agentlaunch-sdk';

const client = new AgentLaunchClient({
  apiKey: process.env.AGENTVERSE_API_KEY,
});
```

### Create your first token

```ts
import { tokenize, generateDeployLink } from 'agentlaunch-sdk';

async function launchToken() {
  // Create a pending token record
  const { data } = await tokenize({
    agentAddress: 'agent1qf8xfhsc8hg4g5l0nhtj5hxxkyd46c64qxvpa3g3ha9rjmezq3s6xw9y7g',
    name: 'My Research Agent',
    symbol: 'MRA',
    description: 'Delivers on-demand research reports for the Fetch.ai ecosystem.',
    chainId: 97, // BSC Testnet — use 56 for mainnet
  });

  console.log('Token ID:', data.token_id);
  console.log('Status:', data.status); // "pending_deployment"

  // Generate the handoff link
  const link = generateDeployLink(data.token_id);
  console.log('Share this link with a human to deploy on-chain:');
  console.log(link);
  // Prod: https://agent-launch.ai/deploy/42 (default)
  // Dev:  https://launchpad-frontend-dev-1056182620041.us-central1.run.app/deploy/42 (when AGENT_LAUNCH_ENV=dev)
}

launchToken().catch(console.error);
```

### Get a handoff link after deployment

Once the human deploys the token, get a trade link:

```ts
import { getToken, generateBuyLink } from 'agentlaunch-sdk';

const token = await getToken('0xAbCd1234...'); // contract address
const link = generateBuyLink(token.address!, 100); // pre-fill 100 FET
console.log('Buy link:', link);
// Prod: https://agent-launch.ai/trade/0xAbCd1234...?action=buy&amount=100 (default)
// Dev:  https://launchpad-frontend-dev-1056182620041.us-central1.run.app/trade/0xAbCd1234...?action=buy&amount=100
```

---

## Path B: CLI (`agentlaunch`)

### Install

```bash
npm install -g agentlaunch
```

### Configure

```bash
agentlaunch config set-key av-xxxxxxxxxxxxxxxx
agentlaunch config show
```

### Create your first token

```bash
agentlaunch tokenize \
  --agent agent1qf8xfhsc8hg4g5l0nhtj5hxxkyd46c64qxvpa3g3ha9rjmezq3s6xw9y7g \
  --name "My Research Agent" \
  --symbol MRA \
  --chain 97
```

Output:

```
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

### Create and deploy a new agent

```bash
# Interactive — prompts for name, description, API key, then deploys
npx agentlaunch

# With name — deploys by default
npx agentlaunch my-trading-bot

# Scaffold only (no deploy)
npx agentlaunch my-trading-bot --local
cd my-trading-bot
# Edit agent.py with your logic
npx agentlaunch deploy
```

The default template generates `agent.py` with Chat Protocol v0.3.0, ASI1-mini LLM integration, persistent memory, and a domain system prompt.

---

## Path C: MCP Server (`agent-launch-mcp`)

The MCP server makes all AgentLaunch operations available as tools in Claude Code and Cursor.

### Install

```bash
npm install -g agent-launch-mcp
```

### Configure in Claude Code

Add to your Claude Code MCP settings (`.claude/settings.json` or the MCP config file):

```json
{
  "mcpServers": {
    "agent-launch": {
      "command": "agent-launch-mcp",
      "env": {
        "AGENT_LAUNCH_API_KEY": "av-xxxxxxxxxxxxxxxx"
      }
    }
  }
}
```

### Configure in Cursor

Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "agent-launch": {
      "command": "npx",
      "args": ["agent-launch-mcp"],
      "env": {
        "AGENT_LAUNCH_API_KEY": "av-xxxxxxxxxxxxxxxx"
      }
    }
  }
}
```

### Create your first token via MCP

Once configured, ask Claude Code (or Cursor with Claude):

```
Create a token for my Agentverse agent at address agent1q...
Name it "Alpha Research Bot", symbol ARB, on BSC testnet.
```

Claude will call `create_and_tokenize` automatically and return:

```json
{
  "success": true,
  "tokenId": 42,
  "handoffLink": "https://agent-launch.ai/deploy/42",
  "tradeLink": "https://agent-launch.ai/trade/42?action=buy&amount=100"
}
```
> URLs use `AGENT_LAUNCH_FRONTEND_URL` from `.env`. Production URL is shown above (default). Set `AGENT_LAUNCH_ENV=dev` for dev URLs.

You can also call tools explicitly:

```
Use the list_tokens MCP tool to show trending tokens
```

---

## Path D: Autonomous On-Chain Trading

For agents that need to buy and sell tokens directly on the bonding curve without human handoff.

### Requirements

- `ethers@^6` peer dependency (SDK only)
- `WALLET_PRIVATE_KEY` environment variable

**Security:** Use a dedicated testnet wallet. Never use your main wallet's private key. The `.env` file is already in `.gitignore`.

### Setup

```bash
npm install agentlaunch-sdk ethers@^6
export WALLET_PRIVATE_KEY=0xabc123...your_private_key_here
```

### Quick example (SDK)

```ts
import { buyTokens, sellTokens, getWalletBalances } from 'agentlaunch-sdk';

const TOKEN = '0xF7e2F77f014a5ad3C121b1942968be33BA89e03c';

// Check balances
const balances = await getWalletBalances(TOKEN);
console.log(`FET: ${balances.fet}, Token: ${balances.token}`);

// Buy 10 FET worth of tokens
const buy = await buyTokens(TOKEN, '10', { slippagePercent: 5 });
console.log(`Bought! Tx: ${buy.txHash}, Received: ${buy.tokensReceived} tokens`);

// Sell 50000 tokens
const sell = await sellTokens(TOKEN, '50000');
console.log(`Sold! Tx: ${sell.txHash}, Received: ${sell.fetReceived} FET`);
```

### Quick example (CLI)

```bash
# Preview a trade (no wallet needed)
agentlaunch buy 0xF7e2F77f... --amount 10 --dry-run

# Execute the trade
agentlaunch buy 0xF7e2F77f... --amount 10
agentlaunch sell 0xF7e2F77f... --amount 50000
```

### Quick example (MCP)

With `WALLET_PRIVATE_KEY` set in your MCP server env, ask Claude:

```
Buy 10 FET worth of token 0xF7e2F77f... on BSC testnet
```

Claude will call the `buy_tokens` tool and return the transaction hash and details.

---

## Next Steps

- [SDK Reference](./sdk-reference.md) — Full API for `agentlaunch-sdk`
- [CLI Reference](./cli-reference.md) — All CLI commands and flags
- [MCP Tools](./mcp-tools.md) — All 20+ MCP tools with input schemas
- [API Docs](https://agent-launch.ai/docs/openapi) — OpenAPI spec (production)
- [skill.md](https://agent-launch.ai/skill.md) — Machine-readable capability spec (production)
