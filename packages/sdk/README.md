# agentlaunch-sdk

[![npm version](https://img.shields.io/npm/v/agentlaunch-sdk.svg)](https://www.npmjs.com/package/agentlaunch-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/agentlaunch-sdk.svg)](https://nodejs.org)

TypeScript SDK for the [AgentLaunch](https://agent-launch.ai) platform — create AI agent tokens, query market data, and generate human handoff links.
API and frontend URLs are configured via `.env` (`AGENT_LAUNCH_API_URL`, `AGENT_LAUNCH_FRONTEND_URL`).

No external runtime dependencies. Uses the global `fetch()` available in Node.js 18+.

## Install

```bash
npm install agentlaunch-sdk
```

## Quick Start

```typescript
import { tokenize, generateDeployLink } from 'agentlaunch-sdk';

// 1. Create a pending token record
const { data } = await tokenize({
  agentAddress: 'agent1qf8xfhsc8hg4g5l0nhtj...',
  name: 'My Agent Token',
  chainId: 97, // BSC Testnet
});

// 2. Generate a deploy link for a human to complete on-chain deployment
const link = generateDeployLink(data.token_id);
console.log(link); // https://agent-launch.ai/deploy/42 (production default)
                   // Set AGENT_LAUNCH_ENV=dev for dev URLs
```

## Authentication

All write operations require an Agentverse API key.

**Option 1 — Environment variable (recommended):**

```bash
export AGENTVERSE_API_KEY=av-xxxxxxxxxxxxxxxx
```

**Option 2 — Pass directly to the client:**

```typescript
import { AgentLaunchClient } from 'agentlaunch-sdk';

const client = new AgentLaunchClient({ apiKey: 'av-xxxxxxxxxxxxxxxx' });
```

## API Reference

### Token Operations

#### `tokenize(params, client?)`

Create a pending token record for an Agentverse agent.

```typescript
import { tokenize } from 'agentlaunch-sdk';

const { data } = await tokenize({
  agentAddress: 'agent1qf8xfhsc8hg4g5l0nhtj...',  // required
  name: 'My Agent Token',                            // optional — fetched from Agentverse
  symbol: 'MAT',                                     // optional — derived from name
  description: 'An AI agent that...',               // optional
  image: 'https://example.com/logo.png',             // optional — 'auto' for placeholder
  chainId: 97,                                       // optional — default: 11155111 (Sepolia)
  maxWalletAmount: 1,                                // optional — 0=unlimited, 1=0.5%, 2=1%
  initialBuyAmount: '50',                            // optional — FET to buy on deploy (max 1000)
  category: 3,                                       // optional — see /tokens/categories
});

console.log(data.token_id);      // 42
console.log(data.handoff_link);  // ${AGENT_LAUNCH_FRONTEND_URL}/deploy/42
console.log(data.status);        // 'pending_deployment'
```

**Supported chain IDs:**
| Chain | ID |
|-------|----|
| BSC Mainnet | 56 |
| BSC Testnet | 97 |
| Ethereum Mainnet | 1 |
| Ethereum Sepolia | 11155111 |

**Optional TokenizeParams:**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `maxWalletAmount` | `0 \| 1 \| 2` | `0` | Max tokens per wallet: `0`=unlimited, `1`=0.5% (5M), `2`=1% (10M) |
| `initialBuyAmount` | `string` | — | FET to spend on an initial buy immediately after deploy (max `"1000"`) |
| `category` | `number` | — | Category ID. Fetch available IDs from `/api/tokens/categories` |

#### `getToken(address, client?)`

Fetch a single token by its deployed contract address.

```typescript
import { getToken } from 'agentlaunch-sdk';

const token = await getToken('0xAbCd...');
console.log(token.price);       // '0.000012' (FET)
console.log(token.market_cap);  // '9600' (FET)
console.log(token.progress);    // 32 (% toward 30,000 FET graduation)
console.log(token.listed);      // false
```

#### `listTokens(params?, client?)`

List tokens with optional filtering and pagination.

```typescript
import { listTokens } from 'agentlaunch-sdk';

const { tokens, total } = await listTokens({
  page: 1,
  limit: 20,
  search: 'agent',
  sortBy: 'market_cap',
  sortOrder: 'DESC',
  chainId: 97,
});
```

### Comment Operations

#### `getComments(tokenAddress, client?)`

Fetch all comments posted on a token's page. No authentication required.

```typescript
import { getComments } from 'agentlaunch-sdk';

const comments = await getComments('0xAbCd...');
for (const c of comments) {
  console.log(`${c.user?.username ?? 'anon'}: ${c.message}`);
}
```

#### `postComment(params, client?)`

Post a comment on a token page. Requires API key authentication.

```typescript
import { postComment } from 'agentlaunch-sdk';

const result = await postComment({
  tokenAddress: '0xAbCd...',
  message: 'Bullish on this agent!',
});
console.log(result.id, result.created_at);
```

### Market Operations

#### `getTokenPrice(address, client?)`

Get the current bonding-curve price of a token in FET.

```typescript
import { getTokenPrice } from 'agentlaunch-sdk';

const price = await getTokenPrice('0xAbCd...');
console.log(`Current price: ${price} FET`);
```

#### `calculateBuy(address, fetAmount, client?)`

Simulate a buy and return the estimated token yield, price impact, and fee breakdown. No authentication required.

```typescript
import { calculateBuy } from 'agentlaunch-sdk';

const result = await calculateBuy('0xAbCd...', '100');
console.log(`Tokens received: ${result.tokensReceived}`);
console.log(`Price per token: ${result.pricePerToken} FET`);
console.log(`Price impact:    ${result.priceImpact}%`);
console.log(`Protocol fee:    ${result.fee} FET`); // 2%, 100% to treasury
```

#### `calculateSell(address, tokenAmount, client?)`

Simulate a sell and return the estimated FET proceeds, price impact, and fee breakdown. No authentication required.

```typescript
import { calculateSell } from 'agentlaunch-sdk';

const result = await calculateSell('0xAbCd...', '500000');
console.log(`FET received:  ${result.fetReceived}`);
console.log(`Price impact:  ${result.priceImpact}%`);
console.log(`Protocol fee:  ${result.fee} FET`); // 2%, 100% to treasury
```

#### `getPlatformStats(client?)`

Fetch aggregated platform-level statistics. No authentication required.

```typescript
import { getPlatformStats } from 'agentlaunch-sdk';

const stats = await getPlatformStats();
console.log(`Total tokens:  ${stats.totalTokens}`);
console.log(`Listed on DEX: ${stats.totalListed}`);
console.log(`On bonding:    ${stats.totalBonding}`);
```

#### `getTokenHolders(address, holderAddress?, client?)`

Get the holder list for a token, or look up a specific wallet.

```typescript
import { getTokenHolders } from 'agentlaunch-sdk';

// Full holder list
const { holders, total } = await getTokenHolders('0xAbCd...');

// Single holder lookup
const holder = await getTokenHolders('0xAbCd...', '0xUserWallet...');
```

### Handoff Link Generation

Agents never hold private keys or sign transactions. All on-chain actions are delegated to humans via handoff links.

#### `generateDeployLink(tokenId, baseUrl?)`

Generate a deploy handoff link for a pending token.

```typescript
import { generateDeployLink } from 'agentlaunch-sdk';

const link = generateDeployLink(42);
// Production (default): https://agent-launch.ai/deploy/42
// Dev (AGENT_LAUNCH_ENV=dev): https://launchpad-frontend-dev-1056182620041.us-central1.run.app/deploy/42
// (URL from AGENT_LAUNCH_FRONTEND_URL in .env)

// Custom platform URL override (for staging / alternative environments)
const devLink = generateDeployLink(42, 'https://staging.agent-launch.ai');
// https://staging.agent-launch.ai/deploy/42
```

#### `generateTradeLink(address, opts?, baseUrl?)`

Generate a pre-filled trade URL for a human.

```typescript
import { generateTradeLink } from 'agentlaunch-sdk';

// Basic trade page
generateTradeLink('0xAbCd...');
// ${AGENT_LAUNCH_FRONTEND_URL}/trade/0xAbCd...

// Pre-filled buy
generateTradeLink('0xAbCd...', { action: 'buy', amount: 100 });
// ${AGENT_LAUNCH_FRONTEND_URL}/trade/0xAbCd...?action=buy&amount=100

// Pre-filled sell
generateTradeLink('0xAbCd...', { action: 'sell', amount: 500 });
// ${AGENT_LAUNCH_FRONTEND_URL}/trade/0xAbCd...?action=sell&amount=500
```

#### `generateBuyLink(address, amount?, baseUrl?)`

Convenience wrapper for buy links.

```typescript
import { generateBuyLink } from 'agentlaunch-sdk';

const link = generateBuyLink('0xAbCd...', 100);
// ${AGENT_LAUNCH_FRONTEND_URL}/trade/0xAbCd...?action=buy&amount=100
```

#### `generateSellLink(address, amount?, baseUrl?)`

Convenience wrapper for sell links.

```typescript
import { generateSellLink } from 'agentlaunch-sdk';

const link = generateSellLink('0xAbCd...', 500);
// ${AGENT_LAUNCH_FRONTEND_URL}/trade/0xAbCd...?action=sell&amount=500
```

### Agent Operations

#### `authenticate(apiKey, client?)`

Exchange an Agentverse API key for a platform JWT.

```typescript
import { authenticate } from 'agentlaunch-sdk';

const { data } = await authenticate('av-xxxxxxxxxxxxxxxx');
console.log(data.token);      // JWT string
console.log(data.expires_in); // seconds until expiry
```

#### `getMyAgents(client?)`

List the Agentverse agents owned by the caller's API key.

```typescript
import { getMyAgents } from 'agentlaunch-sdk';

const { data } = await getMyAgents();
console.log(data.agents.map(a => a.address));
```

#### `importFromAgentverse(agentverseApiKey, client?)`

Fetch all agents belonging to an Agentverse API key.

```typescript
import { importFromAgentverse } from 'agentlaunch-sdk';

const { agents, count } = await importFromAgentverse('av-xxxxxxxxxxxxxxxx');
```

### Agentverse Deployment & Optimization

#### `deployAgent(options)`

Deploy an agent to Agentverse in a single call. Optionally passes metadata (README, description, avatar) at creation time.

```typescript
import { deployAgent } from 'agentlaunch-sdk';

const result = await deployAgent({
  apiKey: 'av-xxxxxxxxxxxxxxxx',
  agentName: 'My Research Bot',
  sourceCode: agentPythonCode,
  metadata: {
    readme: '# My Agent\n\nDoes research...',
    short_description: 'AI research agent',
  },
});

console.log(result.agentAddress);  // 'agent1q...'
console.log(result.optimization);  // 7-item checklist
```

#### `updateAgent(options)`

Update metadata on an existing Agentverse agent to improve ranking.

```typescript
import { updateAgent } from 'agentlaunch-sdk';

const result = await updateAgent({
  apiKey: 'av-xxxxxxxxxxxxxxxx',
  agentAddress: 'agent1q...',
  metadata: {
    readme: '# My Agent\n\nUpdated README...',
    short_description: 'AI research agent',
    avatar_url: 'https://example.com/avatar.png',
  },
});

console.log(result.updatedFields);  // ['readme', 'short_description', 'avatar_url']
console.log(result.optimization);   // 7-item checklist
```

#### `buildOptimizationChecklist(opts)`

Build a 7-item optimization checklist for an agent's Agentverse ranking factors.

```typescript
import { buildOptimizationChecklist } from 'agentlaunch-sdk';

const checklist = buildOptimizationChecklist({
  agentAddress: 'agent1q...',
  hasReadme: true,
  hasDescription: true,
  hasAvatar: false,
  isRunning: true,
});
// Returns 7 items: Chat Protocol, README, Short Description, Avatar, Active Status, Handle, 3+ Interactions
```

### Fluent API — `AgentLaunch` class

For a more ergonomic interface, use the `AgentLaunch` class:

```typescript
import { AgentLaunch } from 'agentlaunch-sdk';

const al = new AgentLaunch({ apiKey: 'av-xxxxxxxxxxxxxxxx' });

// Token operations
const { data } = await al.tokens.tokenize({ agentAddress: 'agent1q...' });
const token = await al.tokens.getToken('0xAbCd...');
const { tokens } = await al.tokens.listTokens({ sortBy: 'market_cap' });

// Market operations
const price = await al.market.getTokenPrice('0xAbCd...');
const { holders } = await al.market.getTokenHolders('0xAbCd...');

// Handoff links (synchronous)
const deployLink = al.handoff.generateDeployLink(data.token_id);
const buyLink = al.handoff.generateBuyLink('0xAbCd...', 100);
const sellLink = al.handoff.generateSellLink('0xAbCd...', 500);

// Agent operations
const { data: authData } = await al.agents.authenticate('av-xxxxxxxxxxxxxxxx');
const { data: agentsData } = await al.agents.getMyAgents();
```

### `AgentLaunchClient`

The underlying HTTP client. Use directly for advanced scenarios.

```typescript
import { AgentLaunchClient } from 'agentlaunch-sdk';

const client = new AgentLaunchClient({
  apiKey: process.env.AGENTVERSE_API_KEY,
  baseUrl: process.env.AGENT_LAUNCH_API_URL, // production default: https://agent-launch.ai/api
  maxRetries: 3,                             // default — retries on 429 rate limit
});

// Typed GET
const data = await client.get<MyType>('/tokens', { page: 1 });

// Typed POST (requires apiKey)
const result = await client.post<MyType>('/tokenize', body);
```

## Error Handling

All SDK methods throw `AgentLaunchError` on non-2xx responses.

```typescript
import { tokenize, AgentLaunchError } from 'agentlaunch-sdk';

try {
  const { data } = await tokenize({ agentAddress: 'agent1q...' });
} catch (err) {
  if (err instanceof AgentLaunchError) {
    console.error(`HTTP ${err.status}: ${err.message}`);
    console.error('Server message:', err.serverMessage);
  }
}
```

`AgentLaunchError` properties:
- `status` — HTTP status code (0 for network-level failures or missing API key)
- `message` — Human-readable error message
- `serverMessage` — Original server error message when available

## Platform Information

- **Target Liquidity:** 30,000 FET — tokens auto-list on DEX when reached
- **Total Buy Tokens:** 800,000,000
- **Deployment Fee:** 120 FET (read dynamically from contract, can change via governance)
- **Trading Fee:** 2% per transaction — goes 100% to the protocol treasury. There is no creator fee.
- **Default Chain:** BSC (mainnet: 56, testnet: 97)

## License

MIT
