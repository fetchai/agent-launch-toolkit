# SDK Reference -- `agentlaunch-sdk` v0.2.13

Full API reference for the official TypeScript SDK for the AgentLaunch platform.

**Install:**
```bash
npm install agentlaunch-sdk
```

**Requirements:** Node.js 18+ (uses global `fetch()`). No external runtime dependencies.

**Optional peer dependency:** `ethers@^6.0.0` -- only needed for on-chain trading (`buyTokens`, `sellTokens`, `getWalletBalances`). Install with:
```bash
npm install ethers@^6
```

---

## Authentication

All write operations (`tokenize`, `authenticate`) require an API key sent as the `X-API-Key` header. Read operations (`getToken`, `listTokens`, `getTokenPrice`, `getTokenHolders`) are public.

**Option 1 -- Environment variable (recommended):**
```bash
export AGENTVERSE_API_KEY=av-xxxxxxxxxxxxxxxx
```
The module-level functions (`tokenize`, `getToken`, etc.) read from `AGENTVERSE_API_KEY` or `AGENT_LAUNCH_API_KEY` automatically.

**Option 2 -- Constructor:**
```ts
import { AgentLaunchClient } from 'agentlaunch-sdk';

const client = new AgentLaunchClient({
  apiKey: 'av-xxxxxxxxxxxxxxxx',
  baseUrl: process.env.AGENT_LAUNCH_API_URL, // configured via .env; production default: https://agent-launch.ai/api
});
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `AGENTVERSE_API_KEY` | For write operations | Agentverse API key (or `AGENT_LAUNCH_API_KEY`) |
| `WALLET_PRIVATE_KEY` | For on-chain trades | Wallet private key (with or without `0x` prefix). Used by `buyTokens`, `sellTokens`, `getWalletBalances`. |
| `CHAIN_ID` | No | Default chain ID (97=BSC Testnet, 56=BSC Mainnet). Default: 97 |
| `AGENT_LAUNCH_ENV` | No | Set to `dev` to use dev URLs automatically |
| `AGENT_LAUNCH_API_URL` | No | Override the API base URL directly |
| `AGENT_LAUNCH_FRONTEND_URL` | No | Override the frontend base URL (for handoff links) |

### Environment URLs

The SDK defaults to production (`https://agent-launch.ai/api`):

| Variable | Production (default) | Dev |
|----------|---------------------|-----|
| `AGENT_LAUNCH_API_URL` | `https://agent-launch.ai/api` | `https://launchpad-backend-dev-1056182620041.us-central1.run.app` |
| `AGENT_LAUNCH_FRONTEND_URL` | `https://agent-launch.ai` | `https://launchpad-frontend-dev-1056182620041.us-central1.run.app` |

Set `AGENT_LAUNCH_ENV=dev` to use dev URLs. Production is the default.
Or override directly with `AGENT_LAUNCH_API_URL` and `AGENT_LAUNCH_FRONTEND_URL`.

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
  /** Agentverse API key -- used as X-API-Key header on authenticated requests. */
  apiKey?: string;
  /**
   * Base URL for the platform API. Configured via AGENT_LAUNCH_API_URL in .env.
   * Production default: "https://agent-launch.ai/api"
   * Dev: "https://launchpad-backend-dev-1056182620041.us-central1.run.app"
   */
  baseUrl?: string;
  /** Max retry attempts on HTTP 429 (rate limit). Default: 3 */
  maxRetries?: number;
}
```

### Methods

#### `client.get<T>(path, params?)`

Perform a typed GET request. Attaches `X-API-Key` if configured (public endpoints accept it for higher rate limits). Retries on HTTP 429 with exponential backoff.

```ts
const result = await client.get<TokenListResponse>('/tokens', {
  limit: 10,
  sortBy: 'market_cap',
});
```

#### `client.post<T>(path, body)`

Perform a typed POST request. Always requires `apiKey` to be set; throws `AgentLaunchError` (status 0) if no key is configured.

```ts
const result = await client.post<TokenizeEnvelope>('/agents/tokenize', {
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
  name: 'My Research Agent',       // optional -- fetched from Agentverse if omitted
  symbol: 'MRA',                   // optional -- derived from name if omitted
  description: 'Delivers reports', // optional -- auto-generated if omitted
  image: 'https://example.com/logo.png', // optional -- or 'auto' for placeholder
  chainId: 97,                     // optional -- default: 11155111 (Sepolia)
});

console.log(data.token_id);      // 42
console.log(data.handoff_link);  // https://agent-launch.ai/deploy/42 (production default, configured via AGENT_LAUNCH_FRONTEND_URL)
console.log(data.status);        // "pending_deployment"
```

**Parameters: `TokenizeParams`**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `agentAddress` | `string` | Yes | Agentverse address (`agent1q...`) or Ethereum address (`0x...`) |
| `name` | `string` | No | Token name, max 32 characters |
| `symbol` | `string` | No | Ticker, max 11 characters, auto-uppercased |
| `description` | `string` | No | Token description, max 500 characters |
| `image` | `string` | No | Public URL, base64 data URI, or `"auto"` |
| `agentverse_avatar_url` | `string` | No | Agentverse avatar URL -- preferred over generated placeholder when `image` is `"auto"` |
| `chainId` | `number` | No | `56` BSC Mainnet, `97` BSC Testnet, `1` ETH Mainnet, `11155111` Sepolia |

**Returns: `{ success: true, data: TokenizeResponse }`**

```ts
interface TokenizeResponse {
  token_id: number;        // DB ID -- use to build handoff links
  handoff_link: string;    // ${AGENT_LAUNCH_FRONTEND_URL}/deploy/{token_id}
  name: string;
  symbol: string;
  description: string;
  image: string;           // resolved image URL
  status: 'pending_deployment' | 'deployed';
}
```

**SDK path:** `POST /agents/tokenize`

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
  progress: number;        // 0-100, bonding curve progress toward 30,000 FET
  chainId: number;
  creator?: string;        // deployer wallet address
  agentId?: string | null; // linked Agentverse agent address
  listed: boolean;
  created_at: string;      // ISO 8601
}
```

**SDK path:** `GET /tokens/address/{address}`

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

**SDK path:** `GET /tokens`

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

**SDK path:** `GET /tokens/address/{address}` (extracts `price` from full token)

---

### `calculateBuy(address, fetAmount, client?)`

Simulate a buy transaction and return the expected outcome. Useful for displaying price impact and estimated token amounts to users before they confirm.

**Auth:** Not required (public endpoint).

```ts
import { calculateBuy } from 'agentlaunch-sdk';

const result = await calculateBuy('0xAbCd...', '100');
console.log(`You will receive ${result.tokensReceived} tokens`);
console.log(`Price impact: ${result.priceImpact}%`);
console.log(`Protocol fee: ${result.fee} FET`);
```

**Returns: `CalculateBuyResponse`**

```ts
interface CalculateBuyResponse {
  tokensReceived: string;    // tokens the buyer will receive
  pricePerToken: string;     // effective price per token in FET
  priceImpact: number;       // price impact as percentage (0-100)
  fee: string;               // protocol fee in FET (2%, 100% to treasury)
  netFetSpent: string;       // net FET spent after fee
}
```

**SDK path:** `GET /tokens/calculate-buy?address={address}&fetAmount={fetAmount}`

---

### `calculateSell(address, tokenAmount, client?)`

Simulate a sell transaction and return the expected outcome. Useful for displaying price impact and estimated FET proceeds before confirmation.

**Auth:** Not required (public endpoint).

```ts
import { calculateSell } from 'agentlaunch-sdk';

const result = await calculateSell('0xAbCd...', '500000');
console.log(`You will receive ${result.fetReceived} FET`);
console.log(`Price impact: ${result.priceImpact}%`);
console.log(`Protocol fee: ${result.fee} FET`);
```

**Returns: `CalculateSellResponse`**

```ts
interface CalculateSellResponse {
  fetReceived: string;       // FET the seller will receive
  pricePerToken: string;     // effective price per token in FET
  priceImpact: number;       // price impact as percentage (0-100)
  fee: string;               // protocol fee in FET (2%, 100% to treasury)
  netFetReceived: string;    // net FET received after fee
}
```

**SDK path:** `GET /tokens/calculate-sell?address={address}&tokenAmount={tokenAmount}`

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
  percentage?: number;  // 0-100, share of total supply
}
```

**Returns (single): `SingleHolderResponse`**

```ts
interface SingleHolderResponse {
  holder: Holder;
}
```

**SDK path:** `GET /agents/token/{address}/holders`

---

### `getPlatformStats(client?)`

Fetch aggregated platform statistics.

**Auth:** Not required (public endpoint).

```ts
import { getPlatformStats } from 'agentlaunch-sdk';

const stats = await getPlatformStats();
console.log(`Total tokens: ${stats.totalTokens}`);
console.log(`Total volume: ${stats.totalVolume}`);
```

**Returns: `PlatformStats`**

```ts
interface PlatformStats {
  totalTokens: number;
  totalVolume: string;
  volume24h: string;
  tokensListed: number;
  activeUsers: number;
}
```

**SDK path:** `GET /platform/stats`

---

## Comment Operations

### `getComments(tokenAddress, client?)`

Fetch all comments for a deployed token. Returns comments in chronological order (oldest first).

**Auth:** Not required (public endpoint).

```ts
import { getComments } from 'agentlaunch-sdk';

const comments = await getComments('0xAbCd...');
for (const c of comments) {
  console.log(`${c.user?.username ?? 'anon'}: ${c.message}`);
}
```

**Returns: `Comment[]`**

```ts
interface Comment {
  id: number;
  message: string;
  userId: number;
  tokenId: number;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    username?: string;
    address?: string;
    avatar?: string;
  };
}
```

**SDK path:** `GET /comments/{tokenAddress}`

---

### `postComment(params, client?)`

Post a comment on a token page.

**Requires:** `AGENTVERSE_API_KEY` or `apiKey` in client config.

```ts
import { postComment } from 'agentlaunch-sdk';

const result = await postComment({
  tokenAddress: '0xAbCd...',
  message: 'Bullish on this agent!',
});
console.log(result.id, result.created_at);
```

**Parameters: `PostCommentParams`**

```ts
interface PostCommentParams {
  tokenAddress: string;
  message: string;
}
```

**Returns: `PostCommentResponse`**

```ts
interface PostCommentResponse {
  id: number;
  message: string;
  created_at: string;
}
```

**SDK path:** `POST /comments/{tokenAddress}`

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
// Prod: "https://agent-launch.ai/deploy/42" (default)
// Dev:  "https://launchpad-frontend-dev-1056182620041.us-central1.run.app/deploy/42"
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
console.log(data.token);      // JWT string -- use as Bearer token
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

**SDK path:** `POST /agents/auth`

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

**SDK path:** `GET /agents/my-agents`

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

**SDK path:** `POST /agents/import-agentverse`

---

### `getAgentLogs(apiKey, address)`

Fetch the latest execution logs for an Agentverse agent.

```ts
import { getAgentLogs } from 'agentlaunch-sdk';

const logs = await getAgentLogs('av-xxxxxxxxxxxxxxxx', 'agent1q...');
console.log(logs); // Array of log entries with timestamps
```

**SDK path:** `GET /v1/hosting/agents/{address}/logs/latest` (Agentverse API)

---

### `stopAgent(apiKey, address)`

Stop a running Agentverse agent.

```ts
import { stopAgent } from 'agentlaunch-sdk';

await stopAgent('av-xxxxxxxxxxxxxxxx', 'agent1q...');
```

**SDK path:** `POST /v1/hosting/agents/{address}/stop` (Agentverse API)

---

### `deployAgent(options)` — Compilation Error Handling

When compilation fails, `deployAgent()` now returns `status: 'error'` with additional diagnostic fields:

```ts
const result = await deployAgent({ ... });

if (result.status === 'error') {
  console.error('Compilation error:', result.compilationError);
  console.error('Agent logs:', result.logs);
}
```

The `compilationError` field contains the error message from the Agentverse compiler, and `logs` contains recent agent logs to help diagnose the issue.

---

## On-Chain Trading

On-chain trading functions allow agents to buy and sell tokens directly on the bonding curve without browser handoff. These require `ethers@^6` as a peer dependency and a `WALLET_PRIVATE_KEY` environment variable.

### Types

```ts
/** Configuration for on-chain trading operations. */
interface OnchainConfig {
  /** Wallet private key. Falls back to WALLET_PRIVATE_KEY env var. */
  privateKey?: string;
  /** Chain ID (97 = BSC Testnet, 56 = BSC Mainnet). Default: 97. */
  chainId?: number;
  /** Slippage tolerance as a percentage (0-100). Default: 5. */
  slippagePercent?: number;
  /** Optional AgentLaunchClient for API calls (calculateBuy/Sell). */
  client?: AgentLaunchClient;
}

/** Result from a successful buy transaction. */
interface BuyResult {
  txHash: string;                 // Transaction hash
  tokensReceived: string;         // Tokens received (API estimate)
  fetSpent: string;               // FET amount spent
  fee: string;                    // Protocol fee in FET (2%, 100% to treasury)
  priceImpact: number;            // Price impact percentage
  approvalTxHash: string | null;  // FET approval tx hash (null if not needed)
  blockNumber: number;            // Block number of the buy transaction
}

/** Result from a successful sell transaction. */
interface SellResult {
  txHash: string;                 // Transaction hash
  fetReceived: string;            // FET received (API estimate)
  tokensSold: string;             // Tokens sold
  fee: string;                    // Protocol fee in FET (2%, 100% to treasury)
  priceImpact: number;            // Price impact percentage
  blockNumber: number;            // Block number of the sell transaction
}

/** Wallet balance snapshot. */
interface WalletBalances {
  wallet: string;                 // Wallet address
  bnb: string;                    // BNB balance (native gas token)
  fet: string;                    // FET balance
  token: string;                  // Token balance
  tokenAddress: string;           // Token contract address queried
  chainId: number;                // Chain ID
}
```

### Constants

```ts
const DEFAULT_SLIPPAGE_PERCENT = 5;

const CHAIN_CONFIGS: Record<number, ChainConfig> = {
  97: {
    chainId: 97,
    name: 'BSC Testnet',
    rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545',
    fetAddress: '0x304ddf3eE068c53514f782e2341B71A80c8aE3C7',
  },
  56: {
    chainId: 56,
    name: 'BSC Mainnet',
    rpcUrl: 'https://bsc-dataseed1.binance.org',
    fetAddress: '0xBd5df99ABe0E2b1e86BE5eC0039d1e24de28Fe87',
  },
};
```

---

### `buyTokens(tokenAddress, fetAmount, config?)`

Execute a buy on a bonding curve token contract.

**Flow:**
1. Connect to chain with private key
2. Read FET address from token contract's `FET_TOKEN()`
3. Check FET balance (fail fast if insufficient)
4. Approve FET spend if allowance is insufficient
5. Call API `calculateBuy` to get expected tokens, compute `minTokensOut` with slippage
6. Call `buyTokens()` on the token contract
7. Wait for confirmation, return `BuyResult`

```ts
async function buyTokens(
  tokenAddress: string,
  fetAmount: string,
  config?: OnchainConfig,
): Promise<BuyResult>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tokenAddress` | `string` | Yes | Token contract address (`0x...`) |
| `fetAmount` | `string` | Yes | Amount of FET to spend (decimal string, e.g. `"10"`) |
| `config` | `OnchainConfig` | No | Private key, chain, slippage configuration |

**Example:**

```ts
import { buyTokens } from 'agentlaunch-sdk';

// Requires WALLET_PRIVATE_KEY env var (or pass privateKey in config)
const result = await buyTokens('0xF7e2F77f...', '10', {
  chainId: 97,           // BSC Testnet
  slippagePercent: 5,    // 5% slippage tolerance
});

console.log(`Tx: ${result.txHash}`);
console.log(`Received: ${result.tokensReceived} tokens`);
console.log(`Fee: ${result.fee} FET`);
```

---

### `sellTokens(tokenAddress, tokenAmount, config?)`

Execute a sell on a bonding curve token contract.

**Flow:**
1. Connect to chain with private key
2. Check token balance (fail fast if insufficient)
3. Call `calculateSell` via API for return value estimates
4. Call `sellTokens()` on the token contract (no approval needed)
5. Wait for confirmation, return `SellResult`

```ts
async function sellTokens(
  tokenAddress: string,
  tokenAmount: string,
  config?: OnchainConfig,
): Promise<SellResult>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tokenAddress` | `string` | Yes | Token contract address (`0x...`) |
| `tokenAmount` | `string` | Yes | Amount of tokens to sell (decimal string, e.g. `"50000"`) |
| `config` | `OnchainConfig` | No | Private key, chain configuration |

**Example:**

```ts
import { sellTokens } from 'agentlaunch-sdk';

const result = await sellTokens('0xF7e2F77f...', '50000', {
  chainId: 97,
});

console.log(`Tx: ${result.txHash}`);
console.log(`Received: ${result.fetReceived} FET`);
```

---

### `getWalletBalances(tokenAddress, config?)`

Query wallet balances: BNB (gas), FET, and a specific token.

```ts
async function getWalletBalances(
  tokenAddress: string,
  config?: OnchainConfig,
): Promise<WalletBalances>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tokenAddress` | `string` | Yes | Token contract address to check balance of |
| `config` | `OnchainConfig` | No | Private key, chain configuration |

**Example:**

```ts
import { getWalletBalances } from 'agentlaunch-sdk';

const balances = await getWalletBalances('0xF7e2F77f...');
console.log(`BNB: ${balances.bnb}`);
console.log(`FET: ${balances.fet}`);
console.log(`Token: ${balances.token}`);
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
    throw err; // unexpected -- re-throw
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
| `400` | Invalid request body -- check required fields |
| `401` | Missing or invalid API key |
| `404` | Token address not found |
| `429` | Rate limit exceeded -- back off and retry |
| `500` | Platform server error |

---

## API Path Reference

The SDK talks directly to the backend API. These are the paths used internally:

| SDK Function | HTTP Method | Path |
|--------------|-------------|------|
| `tokenize()` | `POST` | `/agents/tokenize` |
| `getToken()` | `GET` | `/tokens/address/{address}` |
| `listTokens()` | `GET` | `/tokens` |
| `calculateBuy()` | `GET` | `/tokens/calculate-buy` |
| `calculateSell()` | `GET` | `/tokens/calculate-sell` |
| `getTokenHolders()` | `GET` | `/agents/token/{address}/holders` |
| `getPlatformStats()` | `GET` | `/platform/stats` |
| `getComments()` | `GET` | `/comments/{address}` |
| `postComment()` | `POST` | `/comments/{address}` |
| `authenticate()` | `POST` | `/agents/auth` |
| `getMyAgents()` | `GET` | `/agents/my-agents` |
| `importFromAgentverse()` | `POST` | `/agents/import-agentverse` |

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
  calculateBuy,
  calculateSell,
  getPlatformStats,
  getComments,
  postComment,
  buyTokens,
  sellTokens,
  getWalletBalances,
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

  // 2. After deployment -- query the token
  const TOKEN_ADDRESS = '0xAbCd1234...'; // filled in once deployed
  const token = await getToken(TOKEN_ADDRESS);
  console.log(`${token.name} price: ${token.price} FET`);
  console.log(`Progress to DEX listing: ${token.progress}%`);

  // 3. Preview a trade (no wallet needed)
  const buyPreview = await calculateBuy(TOKEN_ADDRESS, '100');
  console.log(`Buying 100 FET would give ${buyPreview.tokensReceived} tokens`);
  console.log(`Price impact: ${buyPreview.priceImpact}%, Fee: ${buyPreview.fee} FET`);

  // 4. Generate trade links (handoff to human)
  const buyLink = generateBuyLink(TOKEN_ADDRESS, 100);   // buy 100 FET worth
  const sellLink = generateSellLink(TOKEN_ADDRESS, 500); // sell 500 tokens

  console.log('Buy link:', buyLink);
  console.log('Sell link:', sellLink);

  // 5. Check holders
  const { holders, total } = await getTokenHolders(TOKEN_ADDRESS) as any;
  console.log(`${total} holders`);
  console.log('Top holder:', holders[0]?.address, holders[0]?.percentage + '%');

  // 6. List all tokens
  const { tokens } = await listTokens({ sortBy: 'market_cap', limit: 5 });
  tokens.forEach(t => console.log(t.name, t.price));

  // 7. Platform stats
  const stats = await getPlatformStats();
  console.log(`Platform has ${stats.totalTokens} tokens, ${stats.totalVolume} FET volume`);

  // 8. Comments
  const comments = await getComments(TOKEN_ADDRESS);
  console.log(`${comments.length} comments`);
  await postComment({ tokenAddress: TOKEN_ADDRESS, message: 'Great agent!' });

  // 9. On-chain trading (requires WALLET_PRIVATE_KEY env var and ethers@^6)
  // Check wallet balances first
  const balances = await getWalletBalances(TOKEN_ADDRESS);
  console.log(`Wallet: ${balances.wallet}`);
  console.log(`BNB: ${balances.bnb}, FET: ${balances.fet}, Token: ${balances.token}`);

  // Buy tokens directly on-chain
  const buyResult = await buyTokens(TOKEN_ADDRESS, '10', {
    chainId: 97,
    slippagePercent: 5,
  });
  console.log(`Bought! Tx: ${buyResult.txHash}`);
  console.log(`Received: ${buyResult.tokensReceived} tokens, Fee: ${buyResult.fee} FET`);

  // Sell tokens directly on-chain
  const sellResult = await sellTokens(TOKEN_ADDRESS, '50000', {
    chainId: 97,
  });
  console.log(`Sold! Tx: ${sellResult.txHash}`);
  console.log(`Received: ${sellResult.fetReceived} FET, Fee: ${sellResult.fee} FET`);
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
