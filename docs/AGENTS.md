# AgentLaunch — Agent Integration Reference

Machine-readable integration guide for AI agents, Codex, and other automated systems working with the AgentLaunch platform.

**Platform (production, default):** https://agent-launch.ai
**Platform (dev):** https://launchpad-frontend-dev-1056182620041.us-central1.run.app

URLs are configured via `.env`:
- `AGENT_LAUNCH_API_URL` — API base (default: production URL)
- `AGENT_LAUNCH_FRONTEND_URL` — Frontend/handoff links (default: production URL)

**API base (production, default):** https://agent-launch.ai/api
**API base (dev):** https://launchpad-backend-dev-1056182620041.us-central1.run.app
**OpenAPI spec:** https://agent-launch.ai/docs/openapi
**Capability spec:** https://agent-launch.ai/skill.md

---

## Core Concept: Agent-Human Handoff

Agents do NOT sign blockchain transactions. The correct workflow:

```
AGENT                           PLATFORM                     HUMAN
  |                                 |                           |
  |-- POST /api/tokenize ---------> |                           |
  |<- { token_id, handoff_link } -- |                           |
  |                                 |                           |
  |-- send handoff_link to human -->|-------------------------> |
  |                                 |   1. Open /deploy/{id}    |
  |                                 |   2. Connect wallet       |
  |                                 |   3. Approve 120 FET      |
  |                                 |   4. Call deploy()        |
  |                                 |<- token deployed -------- |
```

Agents never hold private keys. Agents create token records and generate links. Humans sign the blockchain transactions.

---

## Authentication

**Header:** `X-API-Key: <agentverse_api_key>`

Obtain API keys at: https://agentverse.ai/profile/api-keys

Public (read) endpoints work without auth. Write endpoints require the header.

---

## API Endpoints

### Create Token Record (Write — requires auth)

```
POST ${AGENT_LAUNCH_API_URL}/tokenize
Headers: X-API-Key: av-xxxxxxxxxxxxxxxx
         Content-Type: application/json
# Prod URL: https://agent-launch.ai/api/tokenize (default)
# Dev URL: https://launchpad-backend-dev-1056182620041.us-central1.run.app/tokenize

Body:
{
  "agentAddress": "agent1qf8xfhsc8hg4g5l0nhtj...",  // required
  "name": "My Agent Token",                           // optional, max 32 chars
  "symbol": "MAT",                                    // optional, 2-11 chars
  "description": "Agent description...",              // optional, max 500 chars
  "image": "https://example.com/logo.png",            // optional, or "auto"
  "chainId": 97                                       // optional, default: 11155111
}

Response 201:
{
  "success": true,
  "data": {
    "token_id": 42,
    "handoff_link": "https://agent-launch.ai/deploy/42",
    "name": "My Agent Token",
    "symbol": "MAT",
    "description": "...",
    "image": "https://...",
    "status": "pending_deployment"
  }
}
```

### List Tokens (Read — no auth)

```
GET ${AGENT_LAUNCH_API_URL}/tokens?limit=20&sortBy=market_cap&sortOrder=DESC
# Prod: https://agent-launch.ai/api/tokens?...

Response 200:
{
  "tokens": [
    {
      "id": 42,
      "name": "My Agent Token",
      "symbol": "MAT",
      "address": "0xAbCd...",
      "price": "0.000125",
      "market_cap": "100000.00",
      "progress": 33.3,
      "status": "bonding",
      "listed": false,
      "chainId": 97,
      "created_at": "2026-01-15T10:30:00.000Z"
    }
  ],
  "total": 127
}
```

Query parameters: `page`, `limit`, `search`, `categoryId`, `chainId`, `sortBy`, `sortOrder`

### Get Token by Address (Read — no auth)

```
GET ${AGENT_LAUNCH_API_URL}/token/0xAbCd...

Response 200: Token object (same shape as list item above)
```

### Get My Agents (Read — requires auth)

```
GET ${AGENT_LAUNCH_API_URL}/my-agents
Headers: X-API-Key: av-xxx

Response 200:
{
  "success": true,
  "data": {
    "agents": [
      { "address": "agent1q...", "name": "My Bot" }
    ],
    "count": 1
  }
}
```

### Authenticate (exchange API key for JWT)

```
POST ${AGENT_LAUNCH_API_URL}/auth
Content-Type: application/json

Body: { "api_key": "av-xxxxxxxxxxxxxxxx" }

Response 200:
{
  "success": true,
  "data": {
    "token": "eyJhbGci...",
    "expires_in": 3600
  }
}
```

Rate limit: 10 requests per 60 seconds.

### Bonding Curve Calculations (Read — no auth)

```
GET ${AGENT_LAUNCH_API_URL}/tokens/calculate-buy?address=0xAbCd...&fetAmount=100
GET ${AGENT_LAUNCH_API_URL}/tokens/calculate-sell?address=0xAbCd...&tokenAmount=500
```

### Platform Stats (Read — no auth)

```
GET ${AGENT_LAUNCH_API_URL}/platform/stats
```

---

## Handoff Link Formats

```
Deploy link:  ${AGENT_LAUNCH_FRONTEND_URL}/deploy/{token_id}
Trade page:   ${AGENT_LAUNCH_FRONTEND_URL}/trade/{token_address}
Buy link:     ${AGENT_LAUNCH_FRONTEND_URL}/trade/{address}?action=buy&amount={fetAmount}
Sell link:    ${AGENT_LAUNCH_FRONTEND_URL}/trade/{address}?action=sell&amount={tokenAmount}
```
> URLs use `AGENT_LAUNCH_FRONTEND_URL` from `.env`.
> Production default: `https://agent-launch.ai`
> Dev: `https://launchpad-frontend-dev-1056182620041.us-central1.run.app`

- `amount` for buy = FET to spend
- `amount` for sell = token units to sell

---

## Contract Constants (Immutable)

These values come from deployed smart contracts and must never be changed:

| Constant | Value | Notes |
|----------|-------|-------|
| `TARGET_LIQUIDITY` | 30,000 FET | Auto DEX listing trigger |
| `TOTAL_BUY_TOKENS` | 800,000,000 | Maximum tokens on bonding curve |
| `FEE_PERCENTAGE` | 2% | 100% to REVENUE_ACCOUNT (protocol treasury) |
| `TOKEN_DEPLOYMENT_FEE` | 120 FET | Read dynamically — can change via multi-sig governance |

**There is NO creator fee. The 2% trading fee goes entirely to the protocol treasury.**

---

## Chain IDs

| Chain | ID | Environment |
|-------|----|-------------|
| BSC Mainnet | 56 | Production (primary) |
| BSC Testnet | 97 | Development |
| ETH Mainnet | 1 | Available (disabled at launch) |
| ETH Sepolia | 11155111 | Development |

Default for all tokenize calls: BSC Testnet (97) for development, BSC Mainnet (56) for production.

---

## TypeScript SDK Usage

```bash
npm install agentlaunch-sdk
```

```typescript
import { tokenize, generateDeployLink, AgentLaunchError } from 'agentlaunch-sdk';

// Set AGENTVERSE_API_KEY env var, then:
const { data } = await tokenize({
  agentAddress: 'agent1q...',
  name: 'My Bot',
  chainId: 97,
});

const deployLink = generateDeployLink(data.token_id);
// Send deployLink to a human

// Error handling
try {
  const { data } = await tokenize({ agentAddress: '...' });
} catch (err) {
  if (err instanceof AgentLaunchError) {
    // err.status = HTTP status code
    // err.message = human-readable description
    // err.serverMessage = raw server response
  }
}
```

---

## CLI Usage

```bash
npm install -g agentlaunch-cli
agentlaunch config set-key av-xxx
agentlaunch tokenize --agent agent1q... --name "My Bot" --symbol MB --chain 97
```

---

## MCP Integration (Claude Code, Cursor)

Add to MCP config:
```json
{
  "mcpServers": {
    "agent-launch": {
      "command": "npx",
      "args": ["-y", "agent-launch-mcp"],
      "env": { "AGENT_LAUNCH_API_KEY": "av-xxx" }
    }
  }
}
```

Available MCP tools: `list_tokens`, `get_token`, `get_platform_stats`, `calculate_buy`, `calculate_sell`, `create_token_record`, `get_deploy_instructions`, `get_trade_link`, `scaffold_agent`, `deploy_to_agentverse`, `create_and_tokenize`

---

## Error Reference

| Status | Meaning | Resolution |
|--------|---------|------------|
| 400 | Bad request | Check required fields and value constraints |
| 401 | Unauthorized | Set valid `X-API-Key` header |
| 404 | Not found | Token address or ID does not exist |
| 409 | Conflict | Token for this agent already exists |
| 429 | Rate limited | Back off and retry after the specified delay |
| 500 | Server error | Retry — if persistent, contact support |

---

## Contract Safety Rules (for code that interacts with contracts)

1. Always check `listed()` before calling `getRemainingAmount()` — contract reverts when token is listed.
2. `listedStatus` only appears in `TokenBuy` events — not `TokenSell`.
3. BSC RPC block range limit: 500. ETH limit: 2000. Never request larger ranges.
4. Gas limit: 200k for normal buys, 600k for buys that trigger DEX listing.
5. `TOKEN_DEPLOYMENT_FEE` must be read dynamically from the contract on each deployment.

---

## Resources

- [Getting Started Guide](getting-started.md)
- [SDK Reference](sdk-reference.md)
- [CLI Reference](cli-reference.md)
- [MCP Tools Reference](mcp-tools.md)
- [OpenAPI Spec](https://agent-launch.ai/docs/openapi) (production)
- [skill.md](https://agent-launch.ai/skill.md) (production)
