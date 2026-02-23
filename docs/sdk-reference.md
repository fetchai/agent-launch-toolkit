# SDK Reference — `agentlaunch-sdk`

Full API reference for the official TypeScript SDK for the AgentLaunch platform.

**Install:**
```bash
npm install agentlaunch-sdk
```

**Requirements:** Node.js 18+ (uses global `fetch()`). No external runtime dependencies.

---

## Authentication

All write operations (`tokenize`, `authenticate`) require an API key sent as the `X-API-Key` header. Read operations (`getToken`, `listTokens`, `getTokenPrice`, `getTokenHolders`) are public.

**Option 1 — Environment variable (recommended):**
```bash
export AGENTVERSE_API_KEY=av-xxxxxxxxxxxxxxxx
```
The module-level functions (`tokenize`, `getToken`, etc.) read from `AGENTVERSE_API_KEY` or `AGENT_LAUNCH_API_KEY` automatically.

**Option 2 — Constructor:**
```ts
import { AgentLaunchClient } from 'agentlaunch-sdk';

const client = new AgentLaunchClient({
  apiKey: 'av-xxxxxxxxxxxxxxxx',
  baseUrl: process.env.AGENT_LAUNCH_API_URL, // configured via .env; dev default: https://launchpad-backend-dev-1056182620041.us-central1.run.app
});
```

---

## Class: `AgentLaunchClient`

The low-level HTTP client. Instantiate once and pass to any module function, or use the module functions directly (they create a default client from environment variables).

```ts
import { AgentLaunchClient } from 'agentlaunch-sdk';

const client = new AgentLaunchClient(config?: AgentLaunchConfig);
```

### Constructor: `AgentLaunchConfig`

```ts
interface AgentLaunchConfig {
  /** Agentverse API key — used as X-API-Key header on authenticated requests. */
  apiKey?: string;
  /**
   * Base URL for the platform API. Configured via AGENT_LAUNCH_API_URL in .env.
   * Dev default: "https://launchpad-backend-dev-1056182620041.us-central1.run.app"
   * Production: "https://agent-launch.ai/api"
   */
  baseUrl?: string;
}
```

### Methods

#### `client.get<T>(path, params?)`

Perform a typed GET request. Attaches `X-API-Key` if configured (public endpoints accept it for higher rate limits).

```ts
const result = await client.get<TokenListResponse>('/api/agents/tokens', {
  limit: 10,
  sortBy: 'market_cap',
});
```

#### `client.post<T>(path, body)`

Perform a typed POST request. Always requires `apiKey` to be set; throws `AgentLaunchError` (status 0) if no key is configured.

```ts
const result = await client.post<TokenizeEnvelope>('/api/agents/tokenize', {
  agentAddress: 'agent1q...',
  name: 'My Agent',
});
```

---

## Token Operations

### `tokenize(params, client?)`

Create a pending token record for an Agentverse agent.

**Requires:** `AGENTVERSE_API_KEY` or `apiKey` in client config.

```ts
import { tokenize } from 'agentlaunch-sdk';

const { data } = await tokenize({
  agentAddress: 'agent1qf8xfhsc8hg4g5l0nhtj5hxxkyd46c64qxvpa3g3ha9rjmezq3s6xw9y7g',
  name: 'My Research Agent',       // optional — fetched from Agentverse if omitted
  symbol: 'MRA',                   // optional — derived from name if omitted
  description: 'Delivers reports', // optional — auto-generated if omitted
  image: 'https://example.com/logo.png', // optional — or 'auto' for placeholder
  chainId: 97,                     // optional — default: 11155111 (Sepolia)
});

console.log(data.token_id);      // 42
console.log(data.handoff_link);  // https://launchpad-frontend-dev-1056182620041.us-central1.run.app/deploy/42 (dev default, configured via AGENT_LAUNCH_FRONTEND_URL)
console.log(data.status);        // "pending_deployment"
```

**Parameters: `TokenizeParams`**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `agentAddress` | `string` | Yes | Agentverse address (`agent1q…`) or Ethereum address (`0x…`) |
| `name` | `string` | No | Token name, max 32 characters |
| `symbol` | `string` | No | Ticker, max 11 characters, auto-uppercased |
| `description` | `string` | No | Token description, max 500 characters |
| `image` | `string` | No | Public URL, base64 data URI, or `"auto"` |
| `agentverse_avatar_url` | `string` | No | Agentverse avatar URL — preferred over generated placeholder when `image` is `"auto"` |
| `chainId` | `number` | No | `56` BSC Mainnet, `97` BSC Testnet, `1` ETH Mainnet, `11155111` Sepolia |

**Returns: `{ success: true, data: TokenizeResponse }`**

```ts
interface TokenizeResponse {
  token_id: number;        // DB ID — use to build handoff links
  handoff_link: string;    // ${AGENT_LAUNCH_FRONTEND_URL}/deploy/{token_id}
  name: string;
  symbol: string;
  description: string;
  image: string;           // resolved image URL
  status: 'pending_deployment' | 'deployed';
}
```

---

### `getToken(address, client?)`

Fetch a deployed token by its contract address.

**Auth:** Not required (public endpoint).

```ts
import { getToken } from 'agentlaunch-sdk';

const token = await getToken('0xAbCd1234...');
console.log(token.name);       // "My Research Agent"
console.log(token.price);      // "0.000125" (FET, string to preserve precision)
console.log(token.market_cap); // "100000.00"
console.log(token.progress);   // 33.3  (% toward 30,000 FET graduation)
console.log(token.listed);     // false
```

**Returns: `Token`**

```ts
interface Token {
  id: number;
  name: string;
  symbol: string;
  address: string | null;  // null while pending deployment
  description: string;
  logo: string;
  status: 'pending' | 'bonding' | 'listed';
  price: string;           // FET price as decimal string
  market_cap: string;      // FET market cap as decimal string
  progress: number;        // 0–100, bonding curve progress toward 30,000 FET
  chainId: number;
  creator?: string;        // deployer wallet address
  agentId?: string | null; // linked Agentverse agent address
  listed: boolean;
  created_at: string;      // ISO 8601
}
```

---

### `listTokens(params?, client?)`

List tokens with optional filtering and pagination.

**Auth:** Not required (public endpoint).

```ts
import { listTokens } from 'agentlaunch-sdk';

const { tokens, total } = await listTokens({
  sortBy: 'market_cap',
  sortOrder: 'DESC',
  limit: 20,
  page: 1,
});
```

**Parameters: `TokenListParams`**

| Field | Type | Description |
|-------|------|-------------|
| `page` | `number` | Page number (1-based) |
| `limit` | `number` | Results per page |
| `search` | `string` | Search by name or symbol |
| `categoryId` | `number` | Filter by category |
| `chainId` | `number` | Filter by chain |
| `sortBy` | `string` | Field to sort by (e.g. `"market_cap"`, `"created_at"`) |
| `sortOrder` | `'ASC' \| 'DESC'` | Sort direction |

**Returns: `TokenListResponse`**

```ts
interface TokenListResponse {
  tokens: Token[];
  total?: number;       // total count before pagination
  mainToken?: Token | null;
}
```

---

## Market Operations

### `getTokenPrice(address, client?)`

Get the current bonding-curve price of a token in FET.

Returns a decimal string to preserve precision (e.g. `"0.000125"`).

```ts
import { getTokenPrice } from 'agentlaunch-sdk';

const price = await getTokenPrice('0xAbCd1234...');
console.log(`Current price: ${price} FET`);
```

---

### `getTokenHolders(address, holderAddress?, client?)`

Get the holder list for a token, or check a specific wallet.

```ts
import { getTokenHolders } from 'agentlaunch-sdk';

// Full holder list
const { holders, total } = await getTokenHolders('0xAbCd1234...') as HolderListResponse;
for (const h of holders) {
  console.log(h.address, h.balance, h.percentage);
}

// Single holder lookup
const { holder } = await getTokenHolders('0xAbCd1234...', '0xUserWallet...') as SingleHolderResponse;
```

**Returns (full list): `HolderListResponse`**

```ts
interface HolderListResponse {
  holders: Holder[];
  total: number;
}

interface Holder {
  address: string;
  balance: string;      // token balance as decimal string
  percentage?: number;  // 0–100, share of total supply
}
```

**Returns (single): `SingleHolderResponse`**

```ts
interface SingleHolderResponse {
  holder: Holder;
}
```

---

## Handoff Link Generation

These functions are pure (no network calls) and do not require authentication.

### `generateDeployLink(tokenId, baseUrl?)`

Generate a deploy handoff URL from a `token_id`.

The human opens this URL, connects their wallet, and signs:
1. Approve 120 FET to the deployer contract
2. Call `deploy()` on the deployer contract

```ts
import { generateDeployLink } from 'agentlaunch-sdk';

const link = generateDeployLink(42);
// Dev:  "https://launchpad-frontend-dev-1056182620041.us-central1.run.app/deploy/42"
// Prod: "https://agent-launch.ai/deploy/42"
// (URL determined by AGENT_LAUNCH_FRONTEND_URL in .env)

// Custom base URL (override for staging / self-hosted)
const stagingLink = generateDeployLink(42, 'https://staging.agent-launch.ai');
// "https://staging.agent-launch.ai/deploy/42"
```

Throws if `tokenId` is not a positive integer.

---

### `generateTradeLink(address, opts?, baseUrl?)`

Generate a trade URL, optionally pre-filling action and amount.

```ts
import { generateTradeLink } from 'agentlaunch-sdk';

// Plain trade page
generateTradeLink('0xAbCd...');
// "${AGENT_LAUNCH_FRONTEND_URL}/trade/0xAbCd..."

// Pre-filled buy
generateTradeLink('0xAbCd...', { action: 'buy', amount: 100 });
// "${AGENT_LAUNCH_FRONTEND_URL}/trade/0xAbCd...?action=buy&amount=100"

// Pre-filled sell
generateTradeLink('0xAbCd...', { action: 'sell', amount: 500 });
// "${AGENT_LAUNCH_FRONTEND_URL}/trade/0xAbCd...?action=sell&amount=500"
```

**`TradeLinkOptions`:**

```ts
interface TradeLinkOptions {
  action?: 'buy' | 'sell';
  amount?: number | string;  // FET for buy, token units for sell
}
```

---

### `generateBuyLink(address, amount?, baseUrl?)`

Convenience wrapper for a buy link.

```ts
import { generateBuyLink } from 'agentlaunch-sdk';

const link = generateBuyLink('0xAbCd...', 100);
// "${AGENT_LAUNCH_FRONTEND_URL}/trade/0xAbCd...?action=buy&amount=100"
```

---

### `generateSellLink(address, amount?, baseUrl?)`

Convenience wrapper for a sell link.

```ts
import { generateSellLink } from 'agentlaunch-sdk';

const link = generateSellLink('0xAbCd...', 500);
// "${AGENT_LAUNCH_FRONTEND_URL}/trade/0xAbCd...?action=sell&amount=500"
```

---

## Agent Operations

### `authenticate(apiKey, client?)`

Exchange an Agentverse API key for a platform JWT.

Rate limit: 10 requests per 60 seconds.

```ts
import { authenticate } from 'agentlaunch-sdk';

const { data } = await authenticate('av-xxxxxxxxxxxxxxxx');
console.log(data.token);      // JWT string — use as Bearer token
console.log(data.expires_in); // seconds until expiry
```

**Returns: `AgentAuthResponse`**

```ts
interface AgentAuthResponse {
  success: true;
  data: {
    token: string;
    expires_in: number;
  };
}
```

---

### `getMyAgents(client?)`

List the Agentverse agents owned by the caller's API key.

Rate limit: 30 requests per 60 seconds.

```ts
import { getMyAgents } from 'agentlaunch-sdk';

const { data } = await getMyAgents();
console.log(data.count);    // 3
data.agents.forEach(a => console.log(a.address, a.name));
```

**Returns: `MyAgentsResponse`**

```ts
interface MyAgentsResponse {
  success: true;
  data: {
    agents: AgentverseAgent[];
    count: number;
  };
}

interface AgentverseAgent {
  address: string;
  name: string;
  [key: string]: unknown; // additional Agentverse metadata
}
```

---

### `importFromAgentverse(agentverseApiKey, client?)`

Fetch all agents for an Agentverse API key without requiring a platform session. Results are cached server-side for 5 minutes.

Rate limit: 5 requests per 60 seconds.

```ts
import { importFromAgentverse } from 'agentlaunch-sdk';

const { agents, count } = await importFromAgentverse('av-xxxxxxxxxxxxxxxx');
console.log(`Found ${count} agents`);
agents.forEach(a => console.log(a.address));
```

**Returns: `ImportAgentverseResponse`**

```ts
interface ImportAgentverseResponse {
  agents: AgentverseAgent[];
  count: number;
}
```

---

## Error Handling: `AgentLaunchError`

Every SDK method throws `AgentLaunchError` on non-2xx responses or network failures.

```ts
import { AgentLaunchError, tokenize } from 'agentlaunch-sdk';

try {
  const { data } = await tokenize({ agentAddress: 'agent1q...' });
  console.log(data.handoff_link);
} catch (err) {
  if (err instanceof AgentLaunchError) {
    console.error('Status:', err.status);           // HTTP status (0 = network failure)
    console.error('Message:', err.message);
    console.error('Server message:', err.serverMessage); // raw server error if available
  } else {
    throw err; // unexpected — re-throw
  }
}
```

```ts
class AgentLaunchError extends Error {
  readonly status: number;          // HTTP status code; 0 on network failure
  readonly serverMessage: string | undefined;
}
```

**Common status codes:**

| Code | Cause |
|------|-------|
| `0` | Network failure or timeout |
| `400` | Invalid request body — check required fields |
| `401` | Missing or invalid API key |
| `404` | Token address not found |
| `429` | Rate limit exceeded — back off and retry |
| `500` | Platform server error |

---

## Complete Example

```ts
import {
  AgentLaunchClient,
  AgentLaunchError,
  tokenize,
  getToken,
  listTokens,
  getTokenPrice,
  getTokenHolders,
  generateDeployLink,
  generateBuyLink,
  generateSellLink,
} from 'agentlaunch-sdk';

async function main() {
  // 1. Create a token record
  const { data } = await tokenize({
    agentAddress: 'agent1qf8xfhsc8hg4g5l0nhtj5hxxkyd46c64qxvpa3g3ha9rjmezq3s6xw9y7g',
    name: 'Alpha Research Bot',
    symbol: 'ARB',
    description: 'AI research agent delivering on-demand reports.',
    chainId: 97,
  });

  const deployLink = generateDeployLink(data.token_id);
  console.log('Send this to a human:', deployLink);

  // 2. After deployment — query the token
  const TOKEN_ADDRESS = '0xAbCd1234...'; // filled in once deployed
  const token = await getToken(TOKEN_ADDRESS);
  console.log(`${token.name} price: ${token.price} FET`);
  console.log(`Progress to DEX listing: ${token.progress}%`);

  // 3. Generate trade links
  const buyLink = generateBuyLink(TOKEN_ADDRESS, 100);   // buy 100 FET worth
  const sellLink = generateSellLink(TOKEN_ADDRESS, 500); // sell 500 tokens

  console.log('Buy link:', buyLink);
  console.log('Sell link:', sellLink);

  // 4. Check holders
  const { holders, total } = await getTokenHolders(TOKEN_ADDRESS) as any;
  console.log(`${total} holders`);
  console.log('Top holder:', holders[0]?.address, holders[0]?.percentage + '%');

  // 5. List all tokens
  const { tokens } = await listTokens({ sortBy: 'market_cap', limit: 5 });
  tokens.forEach(t => console.log(t.name, t.price));
}

main().catch(err => {
  if (err instanceof AgentLaunchError) {
    console.error(`API error ${err.status}: ${err.message}`);
  } else {
    console.error(err);
  }
  process.exit(1);
});
```
