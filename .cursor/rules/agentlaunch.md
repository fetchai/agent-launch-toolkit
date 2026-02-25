# AgentLaunch Development Rules for Cursor

These rules apply when working on the AgentLaunch project or integrating with the AgentLaunch platform (`agent-launch.ai`).

## Platform Overview

AgentLaunch is a token launchpad for Fetch.ai ecosystem AI agents. Agents create token records, receive handoff links, and humans complete on-chain deployment.

URLs are configured via `.env` (`AGENT_LAUNCH_API_URL`, `AGENT_LAUNCH_FRONTEND_URL`).

| Environment | API URL | Frontend URL |
|-------------|---------|--------------|
| Production (default) | `https://agent-launch.ai/api` | `https://agent-launch.ai` |
| Dev | `https://launchpad-backend-dev-1056182620041.us-central1.run.app` | `https://launchpad-frontend-dev-1056182620041.us-central1.run.app` |

- **Production URL:** https://agent-launch.ai
- **OpenAPI docs:** https://agent-launch.ai/docs/openapi
- **Agent capability spec:** https://agent-launch.ai/skill.md

---

## Critical: Fee Distribution Rule

**The 2% trading fee goes 100% to REVENUE_ACCOUNT (protocol treasury). There is NO creator fee.**

Never write any of the following:
- "1% creator fee"
- "split evenly"
- "creator earnings from fees"
- `CREATOR_FEE` in any context
- Any suggestion that token creators receive trading fees

This applies to: code, comments, documentation, UI text, error messages, tests — all files.

---

## Immutable Contract Constants

These values are set by deployed smart contracts and must match everywhere:

| Constant | Value |
|----------|-------|
| `TARGET_LIQUIDITY` | 30,000 FET |
| `TOTAL_BUY_TOKENS` | 800,000,000 |
| `FEE_PERCENTAGE` | 2% → 100% to REVENUE_ACCOUNT |
| `TOKEN_DEPLOYMENT_FEE` | 120 FET (read dynamically — do NOT hardcode as immutable) |
| Bonding curve divisor | 375 |
| `BUY_PRICE_DIFFERENCE` | 1000 (10x) |

---

## API Endpoints

Base URL: `https://agent-launch.ai/api`

### Write (requires `X-API-Key` header)

```
POST /tokenize                       Create token record → returns token_id + handoff_link
POST /auth                           Exchange API key for JWT
```

### Read (public)

```
GET  /tokens                         List tokens with pagination
GET  /token/:address                 Get token by contract address
GET  /tokens/:id                     Get token by database ID
GET  /tokens/calculate-buy           Bonding curve buy simulation
GET  /tokens/calculate-sell          Bonding curve sell simulation
GET  /my-agents                      List caller's Agentverse agents
POST /import-agentverse              Import agents by Agentverse API key
```

### Authentication

Use `X-API-Key: <agentverse_api_key>` header on all write endpoints. Public endpoints work without auth but accept the key for higher rate limits.

---

## Agent-Human Handoff Pattern

Agents NEVER sign blockchain transactions. The correct flow:

```
1. Agent calls POST /api/agents/tokenize
2. Agent receives { token_id, handoff_link }
3. Agent sends handoff_link to a human
4. Human opens /deploy/{token_id} in browser
5. Human connects wallet, approves 120 FET, deploys
6. Token goes live on bonding curve
```

**Handoff URLs** (use `${AGENT_LAUNCH_FRONTEND_URL}` — configured in `.env`):
- Deploy: `https://agent-launch.ai/deploy/{token_id}`
- Trade (buy): `https://agent-launch.ai/trade/{address}?action=buy&amount=100`
- Trade (sell): `https://agent-launch.ai/trade/{address}?action=sell&amount=500`

---

## TypeScript SDK — `agentlaunch-sdk`

```ts
import {
  tokenize,
  getToken,
  listTokens,
  getTokenPrice,
  getTokenHolders,
  generateDeployLink,
  generateBuyLink,
  generateSellLink,
  authenticate,
  getMyAgents,
  AgentLaunchClient,
  AgentLaunchError,
} from 'agentlaunch-sdk';

// Auth: set AGENTVERSE_API_KEY env var, or:
const client = new AgentLaunchClient({ apiKey: 'av-xxx' });

// Create token
const { data } = await tokenize({ agentAddress: 'agent1q...', name: 'My Bot', chainId: 97 });
const link = generateDeployLink(data.token_id);

// Errors
try { ... } catch (err) {
  if (err instanceof AgentLaunchError) {
    console.error(err.status, err.message);
  }
}
```

---

## CLI — `agentlaunch-cli`

```bash
# Configure once
agentlaunch config set-key av-xxx

# Scaffold, deploy, tokenize
agentlaunch scaffold MyBot --type research
agentlaunch deploy --name "My Bot"
agentlaunch tokenize --agent agent1q... --name "My Bot" --symbol MB --chain 97

# List tokens (supports --json for machine output)
agentlaunch list --limit 20 --sort market_cap --json
```

Config file: `~/.agentlaunch/config.json`

---

## MCP Tools — `agent-launch-mcp`

Configure in MCP settings:
```json
{
  "mcpServers": {
    "agent-launch": {
      "command": "agent-launch-mcp",
      "env": { "AGENT_LAUNCH_API_KEY": "av-xxx" }
    }
  }
}
```

Available tools:

| Tool | Category | Auth Required |
|------|----------|---------------|
| `list_tokens` | Discovery | No |
| `get_token` | Discovery | No |
| `get_platform_stats` | Discovery | No |
| `calculate_buy` | Calculate | No |
| `calculate_sell` | Calculate | No |
| `create_token_record` | Write | Yes |
| `get_deploy_instructions` | Handoff | No |
| `get_trade_link` | Handoff | No |
| `scaffold_agent` | Scaffold | No |
| `deploy_to_agentverse` | Agentverse | Yes (Agentverse key) |
| `create_and_tokenize` | Combo | Yes |

---

## Contract Safety Rules

1. Always call `isListed()` / check `listed` field before calling `getRemainingAmount()` — the contract reverts when the token is listed on DEX.
2. `listedStatus` is only present in `TokenBuy` events — NOT `TokenSell`.
3. Event ABIs must have `indexed` on the first three parameters (buyer/seller, token, amount).
4. Block range limits: BSC max 500 blocks, ETH max 2000 blocks per RPC call.
5. Gas: 200k for normal buys, 600k for buys that trigger DEX listing.
6. `TOKEN_DEPLOYMENT_FEE` must be read from the contract — do not hardcode it as a fixed constant.

---

## Multi-Chain

| Chain | ID | Status |
|-------|----|--------|
| BSC Mainnet | 56 | Production (primary) |
| BSC Testnet | 97 | Development |
| ETH Mainnet | 1 | Available (disabled at launch) |
| ETH Sepolia | 11155111 | Development |

Default chain for all operations: BSC (56 in prod, 97 in dev).

---

## Resources

- [Getting Started](docs/getting-started.md)
- [SDK Reference](docs/sdk-reference.md)
- [CLI Reference](docs/cli-reference.md)
- [MCP Tools](docs/mcp-tools.md)
- [Agent Integration](docs/AGENTS.md)
- [Skill Definition](skill/skill.md)
