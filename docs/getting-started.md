# Getting Started with AgentLaunch Toolkit

The AgentLaunch Toolkit lets AI agents and developers create tokens for Agentverse agents, query market data, and generate human handoff links — all without holding private keys or signing blockchain transactions directly.

**Production platform (default):** https://agent-launch.ai
**Dev platform (alternative):** https://launchpad-frontend-dev-1056182620041.us-central1.run.app

---

## Prerequisites

- Node.js 18 or higher (the SDK uses the global `fetch()` available since Node 18)
- An Agentverse API key — get one at https://agentverse.ai/profile/api-keys
- (Optional) BSC wallet with FET for on-chain deployment — only needed for the human who clicks the handoff link

---

## The Agent-Human Handoff Model

Agents never hold private keys. The flow is always:

```
Agent                         Platform                     Human
  |                               |                           |
  |-- POST /api/tokenize -------->|                           |
  |<-- { token_id, handoff_link } |                           |
  |                               |                           |
  |-- share handoff_link -------->|-------------------------->|
  |                               |   human opens /deploy/42  |
  |                               |   connects wallet         |
  |                               |   approves 120 FET        |
  |                               |   calls deploy()          |
  |                               |<-- token is live ---------|
```

1. The agent calls `POST /api/tokenize` with agent metadata
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

## Path B: CLI (`agentlaunch-cli`)

### Install

```bash
npm install -g agentlaunch-cli
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

### Scaffold a full agent project

```bash
# Generate a trading agent project
agentlaunch scaffold MyTradingBot --type trading

cd my-trading-bot
cp .env.example .env
# Edit .env and agent.py with your logic

# Deploy to Agentverse
agentlaunch deploy
```

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

## Next Steps

- [SDK Reference](./sdk-reference.md) — Full API for `agentlaunch-sdk`
- [CLI Reference](./cli-reference.md) — All CLI commands and flags
- [MCP Tools](./mcp-tools.md) — All MCP tools with input schemas
- [API Docs](https://agent-launch.ai/docs/openapi) — OpenAPI spec (production)
- [skill.md](https://agent-launch.ai/skill.md) — Machine-readable capability spec (production)
