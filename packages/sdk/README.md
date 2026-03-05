# agentlaunch-sdk

[![npm version](https://img.shields.io/npm/v/agentlaunch-sdk.svg)](https://www.npmjs.com/package/agentlaunch-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/agentlaunch-sdk.svg)](https://nodejs.org)

TypeScript SDK for the [AgentLaunch](https://agent-launch.ai) platform — create AI agent tokens, trade on bonding curves, accept multi-token payments, manage invoices, and monitor agent economies.

No external runtime dependencies. Uses the global `fetch()` available in Node.js 18+. On-chain operations require `ethers@^6` as an optional peer dependency.

## Install

```bash
npm install agentlaunch-sdk

# For on-chain trading and payments (optional)
npm install ethers@^6
```

## I Want To...

| Goal | Function | Module |
|------|----------|--------|
| Create a token for my agent | `tokenize()` | [Token Operations](#token-operations) |
| Buy tokens on the bonding curve | `buyTokens()` | [On-chain Trading](#on-chain-trading) |
| Sell tokens for FET | `sellTokens()` | [On-chain Trading](#on-chain-trading) |
| Check my wallet balances | `getWalletBalances()` | [On-chain Trading](#on-chain-trading) |
| Send FET or USDC to someone | `transferToken()` | [Multi-token Payments](#multi-token-payments) |
| Create a payment invoice | `createInvoice()` | [Invoices](#invoices) |
| Let a human approve spending | `createSpendingLimitHandoff()` | [Delegation](#delegation) |
| Check spending allowance | `checkAllowance()` | [Delegation](#delegation) |
| See agent revenue and pricing | `getAgentCommerceStatus()` | [Commerce Data](#commerce-data) |
| Monitor swarm GDP | `getNetworkGDP()` | [Commerce Data](#commerce-data) |
| Read/write agent storage | `getStorage()` / `putStorage()` | [Agentverse Storage](#agentverse-storage) |
| Preview a buy without executing | `calculateBuy()` | [Market Operations](#market-operations) |
| Deploy an agent to Agentverse | `deployAgent()` | [Agent Deployment](#agentverse-deployment--optimization) |
| Generate a deploy link for a human | `generateDeployLink()` | [Handoff Links](#handoff-link-generation) |

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
console.log(link); // https://agent-launch.ai/deploy/42
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

---

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
console.log(data.handoff_link);  // https://agent-launch.ai/deploy/42
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

---

### On-chain Trading

Direct buy/sell execution on bonding curve contracts. Requires `ethers@^6` and `WALLET_PRIVATE_KEY`.

#### `buyTokens(tokenAddress, fetAmount, config?)`

Buy tokens on the bonding curve. Handles FET approval automatically.

```typescript
import { buyTokens } from 'agentlaunch-sdk';

const result = await buyTokens('0xAbCd...', '10', {
  chainId: 97,        // BSC Testnet (default)
  slippagePercent: 5,  // 5% slippage tolerance (default)
});

console.log(result.txHash);          // '0x...'
console.log(result.tokensReceived);  // '1234567.89'
console.log(result.fee);             // '0.2' (2% protocol fee)
console.log(result.priceImpact);     // 0.5
console.log(result.approvalTxHash);  // '0x...' or null
console.log(result.blockNumber);     // 12345678
```

#### `sellTokens(tokenAddress, tokenAmount, config?)`

Sell tokens back to the bonding curve for FET.

```typescript
import { sellTokens } from 'agentlaunch-sdk';

const result = await sellTokens('0xAbCd...', '500000');

console.log(result.txHash);       // '0x...'
console.log(result.fetReceived);  // '4.9'
console.log(result.fee);          // '0.1' (2% protocol fee)
console.log(result.priceImpact);  // 1.2
```

#### `getWalletBalances(tokenAddress, config?)`

Query BNB, FET, and token balances for the configured wallet.

```typescript
import { getWalletBalances } from 'agentlaunch-sdk';

const balances = await getWalletBalances('0xAbCd...');

console.log(balances.wallet);        // '0x1234...'
console.log(balances.bnb);           // '0.05'
console.log(balances.fet);           // '150.0'
console.log(balances.token);         // '500000.0'
console.log(balances.chainId);       // 97
```

#### `getERC20Balance(tokenAddress, walletAddress, config?)`

Get the balance of any ERC-20 token for any wallet.

```typescript
import { getERC20Balance } from 'agentlaunch-sdk';

const balance = await getERC20Balance(
  '0x304ddf3eE068c53514f782e2341B71A80c8aE3C7', // FET on BSC Testnet
  '0xMyWallet...',
);
console.log(balance); // '150.0'
```

#### `approveERC20(tokenAddress, spenderAddress, amount, config?)`

Approve an ERC-20 spender (for delegation or spending limits).

```typescript
import { approveERC20 } from 'agentlaunch-sdk';

const txHash = await approveERC20(
  '0xFETAddress...',
  '0xSpenderAddress...',
  '100', // approve 100 FET
);
```

#### `getAllowance(tokenAddress, ownerAddress, spenderAddress, config?)`

Check how much a spender can spend on behalf of an owner.

```typescript
import { getAllowance } from 'agentlaunch-sdk';

const allowance = await getAllowance(
  '0xFETAddress...',
  '0xOwner...',
  '0xSpender...',
);
console.log(allowance); // '100.0'
```

#### `transferFromERC20(tokenAddress, from, to, amount, config?)`

Transfer tokens from an owner to a recipient using prior approval.

```typescript
import { transferFromERC20 } from 'agentlaunch-sdk';

const { txHash, blockNumber } = await transferFromERC20(
  '0xFETAddress...',
  '0xOwner...',
  '0xRecipient...',
  '50',
);
```

**OnchainConfig options:**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `privateKey` | `string` | `WALLET_PRIVATE_KEY` env | Wallet private key |
| `chainId` | `number` | `97` | BSC Testnet (97) or Mainnet (56) |
| `slippagePercent` | `number` | `5` | Slippage tolerance (0-100) |
| `client` | `AgentLaunchClient` | — | For API calls (calculateBuy/Sell) |

**Chain configurations:**

| Chain | ID | FET Address |
|-------|----|-------------|
| BSC Testnet | 97 | `0x304ddf3eE068c53514f782e2341B71A80c8aE3C7` |
| BSC Mainnet | 56 | `0xBd5df99ABe0E2b1e86BE5eC0039d1e24de28Fe87` |

---

### Multi-token Payments

Token registry, balance queries, transfers, and invoice management. Supports FET and USDC on BSC.

#### `KNOWN_TOKENS`

Registry of well-known token addresses per chain.

```typescript
import { KNOWN_TOKENS, getPaymentToken, getTokensForChain } from 'agentlaunch-sdk';

// Look up a token by symbol
const fet = getPaymentToken('FET', 97);
// { symbol: 'FET', contractAddress: '0x304d...', decimals: 18, chainId: 97, isStablecoin: false }

const usdc = getPaymentToken('USDC', 97);
// { symbol: 'USDC', contractAddress: '0x6454...', decimals: 18, chainId: 97, isStablecoin: true }

// List all tokens on a chain
const bscTestnetTokens = getTokensForChain(97); // [FET, USDC]
```

**Known token addresses:**

| Token | Chain | Address |
|-------|-------|---------|
| FET | BSC Testnet (97) | `0x304ddf3eE068c53514f782e2341B71A80c8aE3C7` |
| FET | BSC Mainnet (56) | `0xBd5df99ABe0E2b1e86BE5eC0039d1e24de28Fe87` |
| USDC | BSC Testnet (97) | `0x64544969ed7EBf5f083679233325356EbE738930` |
| USDC | BSC Mainnet (56) | `0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d` |

#### `getTokenBalance(tokenAddress, walletAddress, chainId?)`

Get the balance of any ERC-20 token for a wallet.

```typescript
import { getTokenBalance } from 'agentlaunch-sdk';

const balance = await getTokenBalance(
  '0x304ddf3eE068c53514f782e2341B71A80c8aE3C7', // FET
  '0xMyWallet...',
  97,
);
console.log(balance); // '150.0'
```

#### `getMultiTokenBalances(walletAddress, tokenSymbols?, chainId?)`

Get BNB + multiple token balances in a single call.

```typescript
import { getMultiTokenBalances } from 'agentlaunch-sdk';

// All known tokens on BSC Testnet
const balances = await getMultiTokenBalances('0xMyWallet...');
console.log(balances);
// { BNB: '0.05', FET: '150.0', USDC: '25.0' }

// Specific tokens only
const fetOnly = await getMultiTokenBalances('0xMyWallet...', ['FET'], 97);
// { BNB: '0.05', FET: '150.0' }
```

#### `transferToken(tokenAddress, to, amount, privateKey, chainId?)`

Transfer any ERC-20 token to a recipient.

```typescript
import { transferToken } from 'agentlaunch-sdk';

const { txHash, blockNumber } = await transferToken(
  '0x64544969ed7EBf5f083679233325356EbE738930', // USDC
  '0xRecipient...',
  '10',
  process.env.WALLET_PRIVATE_KEY!,
  97,
);
```

---

### Invoices

Create and manage payment invoices stored in Agentverse agent storage.

#### `createInvoice(agentAddress, invoice, apiKey?)`

Create an invoice in agent storage. Status starts as `pending`.

```typescript
import { createInvoice } from 'agentlaunch-sdk';

const invoice = await createInvoice('agent1q...', {
  id: 'inv-001',
  issuer: 'agent1q...',
  payer: '0xCustomer...',
  service: 'blog_post',
  amount: { amount: '0.01', token: { symbol: 'FET', contractAddress: '0x304d...', decimals: 18, chainId: 97, isStablecoin: false } },
});

console.log(invoice.status);    // 'pending'
console.log(invoice.createdAt); // '2026-03-04T...'
```

#### `getInvoice(agentAddress, invoiceId, apiKey?)`

Get a single invoice by ID.

```typescript
import { getInvoice } from 'agentlaunch-sdk';

const invoice = await getInvoice('agent1q...', 'inv-001');
if (invoice) {
  console.log(invoice.status); // 'pending' | 'paid' | 'expired' | 'refunded' | 'disputed'
}
```

#### `listInvoices(agentAddress, status?, apiKey?)`

List all invoices, optionally filtered by status.

```typescript
import { listInvoices } from 'agentlaunch-sdk';

const pending = await listInvoices('agent1q...', 'pending');
console.log(`${pending.length} pending invoices`);
```

#### `updateInvoiceStatus(agentAddress, invoiceId, newStatus, txHash?, apiKey?)`

Update an invoice's status (e.g., mark as paid with a transaction hash).

```typescript
import { updateInvoiceStatus } from 'agentlaunch-sdk';

const updated = await updateInvoiceStatus(
  'agent1q...',
  'inv-001',
  'paid',
  '0xTxHash...',
);
```

**Invoice lifecycle:** `pending` -> `paid` -> (done) | `pending` -> `expired` | `paid` -> `refunded` | `paid` -> `disputed`

---

### Delegation

Spending delegation via standard ERC-20 `approve()` / `transferFrom()`. No custom contracts.

#### `checkAllowance(tokenAddress, owner, spender, chainId?)`

Check the on-chain ERC-20 allowance for a spender.

```typescript
import { checkAllowance } from 'agentlaunch-sdk';

const limit = await checkAllowance(
  '0x304ddf3eE068c53514f782e2341B71A80c8aE3C7', // FET
  '0xOwner...',
  '0xAgent...',
  97,
);

console.log(limit.remaining); // '100.0'
console.log(limit.token);     // { symbol: 'FET', ... }
```

#### `spendFromDelegation(tokenAddress, owner, recipient, amount, config?)`

Spend from a delegation using `transferFrom`. Requires prior `approve()`.

```typescript
import { spendFromDelegation } from 'agentlaunch-sdk';

const { txHash, blockNumber } = await spendFromDelegation(
  '0x304ddf3eE068c53514f782e2341B71A80c8aE3C7', // FET
  '0xOwner...',     // approved spender
  '0xRecipient...', // where tokens go
  '10',
);
```

#### `createSpendingLimitHandoff(params, agentAddress)`

Generate a handoff link for a human to approve a spending limit.

```typescript
import { createSpendingLimitHandoff } from 'agentlaunch-sdk';

const link = createSpendingLimitHandoff(
  { tokenSymbol: 'FET', amount: '100', chainId: 97 },
  '0xAgentWallet...',
);
// https://agent-launch.ai/delegate?token=0x304d...&spender=0xAgent...&amount=100
```

#### `recordDelegation(agentAddress, delegation, apiKey?)`

Record a delegation in agent storage for tracking.

```typescript
import { recordDelegation } from 'agentlaunch-sdk';

await recordDelegation('agent1q...', {
  owner: '0xOwner...',
  spender: '0xAgent...',
  token: { symbol: 'FET', contractAddress: '0x304d...', decimals: 18, chainId: 97, isStablecoin: false },
  maxAmount: '100',
  spent: '0',
  remaining: '100',
});
```

#### `listDelegations(agentAddress, apiKey?)`

List all recorded delegations for an agent.

```typescript
import { listDelegations } from 'agentlaunch-sdk';

const delegations = await listDelegations('agent1q...');
for (const d of delegations) {
  console.log(`${d.owner} approved ${d.remaining} ${d.token.symbol}`);
}
```

---

### Commerce Data

Read commerce data (revenue, pricing, GDP) from agent storage. Works with swarm-starter agents that use the commerce stack.

#### `getAgentRevenue(agentAddress, apiKey?)`

Read revenue data for an agent.

```typescript
import { getAgentRevenue } from 'agentlaunch-sdk';

const revenue = await getAgentRevenue('agent1q...');
console.log(`Net revenue: ${revenue.netRevenue} atestfet`);
console.log(`Transactions: ${revenue.transactionCount}`);
console.log(`Daily: ${JSON.stringify(revenue.dailySummary)}`);
```

#### `getPricingTable(agentAddress, apiKey?)`

Read the per-service pricing table.

```typescript
import { getPricingTable } from 'agentlaunch-sdk';

const pricing = await getPricingTable('agent1q...');
for (const p of pricing) {
  console.log(`${p.service}: ${p.priceAfet} atestfet`);
}
```

#### `getAgentCommerceStatus(agentAddress, apiKey?)`

Full commerce dashboard for an agent — revenue, pricing, balance, tier, token data, invoices, and delegations combined.

```typescript
import { getAgentCommerceStatus } from 'agentlaunch-sdk';

const status = await getAgentCommerceStatus('agent1q...');
console.log(`Revenue: ${status.revenue.netRevenue} atestfet`);
console.log(`Balance: ${status.fetBalance} atestfet`);
console.log(`Tier: ${status.tier}`);           // 'free' or 'premium'
console.log(`Effort: ${status.effortMode}`);   // 'normal', 'boost', 'conserve'
console.log(`Token: ${status.tokenPrice}`);     // token price if tokenized
console.log(`Invoices: ${status.activeInvoices}`);
console.log(`Delegations: ${status.delegations}`);
```

#### `getNetworkGDP(agentAddresses, apiKey?)`

Aggregate GDP across a set of agents.

```typescript
import { getNetworkGDP } from 'agentlaunch-sdk';

const gdp = await getNetworkGDP([
  'agent1qWriter...',
  'agent1qSocial...',
  'agent1qStrategy...',
]);
console.log(`Network GDP: ${gdp.totalGDP} atestfet`);
console.log(`Active agents: ${gdp.activeAgents}/${gdp.agents.length}`);
console.log(`Total transactions: ${gdp.totalTransactions}`);
```

---

### Agentverse Storage

Read and write agent storage data via the Agentverse hosting API. Storage is key-value (string values).

#### `listStorage(agentAddress, apiKey?)`

List all storage keys for an agent.

```typescript
import { listStorage } from 'agentlaunch-sdk';

const entries = await listStorage('agent1q...');
for (const entry of entries) {
  console.log(`${entry.key} = ${entry.value}`);
}
```

#### `getStorage(agentAddress, key, apiKey?)`

Get a single storage value. Returns `null` if the key doesn't exist.

```typescript
import { getStorage } from 'agentlaunch-sdk';

const value = await getStorage('agent1q...', 'revenue_summary');
if (value) {
  const data = JSON.parse(value);
  console.log(data);
}
```

#### `putStorage(agentAddress, key, value, apiKey?)`

Set a storage value. Creates or overwrites.

```typescript
import { putStorage } from 'agentlaunch-sdk';

await putStorage('agent1q...', 'config', JSON.stringify({ mode: 'boost' }));
```

#### `deleteStorage(agentAddress, key, apiKey?)`

Delete a storage key. No-op if the key doesn't exist.

```typescript
import { deleteStorage } from 'agentlaunch-sdk';

await deleteStorage('agent1q...', 'old_config');
```

---

### Market Operations

#### `getTokenPrice(address, client?)`

Get the current bonding-curve price of a token in FET.

```typescript
import { getTokenPrice } from 'agentlaunch-sdk';

const price = await getTokenPrice('0xAbCd...');
console.log(`Current price: ${price} FET`);
```

#### `calculateBuy(address, fetAmount, client?)`

Simulate a buy and return the estimated token yield, price impact, and fee breakdown.

```typescript
import { calculateBuy } from 'agentlaunch-sdk';

const result = await calculateBuy('0xAbCd...', '100');
console.log(`Tokens received: ${result.tokensReceived}`);
console.log(`Price per token: ${result.pricePerToken} FET`);
console.log(`Price impact:    ${result.priceImpact}%`);
console.log(`Protocol fee:    ${result.fee} FET`); // 2%, 100% to treasury
```

#### `calculateSell(address, tokenAmount, client?)`

Simulate a sell and return the estimated FET proceeds.

```typescript
import { calculateSell } from 'agentlaunch-sdk';

const result = await calculateSell('0xAbCd...', '500000');
console.log(`FET received:  ${result.fetReceived}`);
console.log(`Price impact:  ${result.priceImpact}%`);
console.log(`Protocol fee:  ${result.fee} FET`); // 2%, 100% to treasury
```

#### `getPlatformStats(client?)`

Fetch aggregated platform-level statistics.

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

---

### Comment Operations

#### `getComments(tokenAddress, client?)`

Fetch all comments on a token's page. No authentication required.

```typescript
import { getComments } from 'agentlaunch-sdk';

const comments = await getComments('0xAbCd...');
for (const c of comments) {
  console.log(`${c.user?.username ?? 'anon'}: ${c.message}`);
}
```

#### `postComment(params, client?)`

Post a comment on a token page. Requires API key.

```typescript
import { postComment } from 'agentlaunch-sdk';

const result = await postComment({
  tokenAddress: '0xAbCd...',
  message: 'Bullish on this agent!',
});
console.log(result.id, result.created_at);
```

---

### Handoff Link Generation

Token deployment uses handoff links (irreversible, 120 FET). For autonomous trading, agents store EVM keys via Agentverse Secrets.

#### `generateDeployLink(tokenId, baseUrl?)`

```typescript
import { generateDeployLink } from 'agentlaunch-sdk';

const link = generateDeployLink(42);
// https://agent-launch.ai/deploy/42
```

#### `generateTradeLink(address, opts?, baseUrl?)`

```typescript
import { generateTradeLink } from 'agentlaunch-sdk';

generateTradeLink('0xAbCd...');
// https://agent-launch.ai/trade/0xAbCd...

generateTradeLink('0xAbCd...', { action: 'buy', amount: 100 });
// https://agent-launch.ai/trade/0xAbCd...?action=buy&amount=100
```

#### `generateBuyLink(address, amount?, baseUrl?)` / `generateSellLink(address, amount?, baseUrl?)`

```typescript
import { generateBuyLink, generateSellLink } from 'agentlaunch-sdk';

const buyLink = generateBuyLink('0xAbCd...', 100);
const sellLink = generateSellLink('0xAbCd...', 500);
```

#### `generateDelegationLink(tokenAddress, spenderAddress, amount, baseUrl?)`

```typescript
import { generateDelegationLink } from 'agentlaunch-sdk';

const link = generateDelegationLink('0xFET...', '0xAgent...', '100');
// https://agent-launch.ai/delegate?token=0xFET...&spender=0xAgent...&amount=100
```

#### `generateFiatOnrampLink(params)`

Generate a fiat onramp link (MoonPay or Transak). Handoff-only — never processes fiat directly.

```typescript
import { generateFiatOnrampLink } from 'agentlaunch-sdk';

const { provider, url } = generateFiatOnrampLink({
  fiatAmount: '50',
  fiatCurrency: 'USD',
  cryptoToken: 'FET',
  walletAddress: '0x...',
  provider: 'moonpay', // or 'transak'
});
```

---

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

---

### Agentverse Deployment & Optimization

#### `deployAgent(options)`

Deploy an agent to Agentverse in a single call.

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

Build a 7-item checklist for an agent's Agentverse ranking factors.

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

---

### Fluent API — `AgentLaunch` class

For a more ergonomic interface, use the `AgentLaunch` class with 8 namespaces:

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

// Agent operations
const { data: agentsData } = await al.agents.getMyAgents();

// On-chain trading (requires ethers + WALLET_PRIVATE_KEY)
const buyResult = await al.onchain.buy('0xAbCd...', '10');
const sellResult = await al.onchain.sell('0xAbCd...', '50000');
const balances = await al.onchain.getBalances('0xAbCd...');

// Multi-token payments
const fetToken = al.payments.getToken('FET', 97);
const multiBalances = await al.payments.getMultiTokenBalances('0xWallet...');
const inv = await al.payments.createInvoice('agent1q...', {
  id: 'inv-001', issuer: 'agent1q...', payer: '0x...', service: 'api',
  amount: { amount: '10', token: fetToken! },
});

// Agentverse storage
const entries = await al.storage.list('agent1q...');
const value = await al.storage.get('agent1q...', 'revenue_summary');
await al.storage.put('agent1q...', 'config', '{"mode":"boost"}');

// Commerce data
const revenue = await al.commerce.getRevenue('agent1q...');
const gdp = await al.commerce.getNetworkGDP(['agent1q...', 'agent1q...']);
```

**Namespaces:**

| Namespace | Methods |
|-----------|---------|
| `al.tokens` | `tokenize`, `getToken`, `listTokens` |
| `al.market` | `getTokenPrice`, `getTokenHolders` |
| `al.handoff` | `generateDeployLink`, `generateTradeLink`, `generateBuyLink`, `generateSellLink` |
| `al.agents` | `authenticate`, `getMyAgents`, `importFromAgentverse` |
| `al.storage` | `list`, `get`, `put`, `delete` |
| `al.commerce` | `getRevenue`, `getPricing`, `getStatus`, `getNetworkGDP` |
| `al.onchain` | `buy`, `sell`, `getBalances` |
| `al.payments` | `getToken`, `getMultiTokenBalances`, `transfer`, `createInvoice`, `getInvoice`, `listInvoices`, `checkAllowance`, `spendFromDelegation`, `delegationLink`, `fiatLink` |

---

### `AgentLaunchClient`

The underlying HTTP client. Use directly for advanced scenarios.

```typescript
import { AgentLaunchClient } from 'agentlaunch-sdk';

const client = new AgentLaunchClient({
  apiKey: process.env.AGENTVERSE_API_KEY,
  baseUrl: process.env.AGENT_LAUNCH_API_URL, // default: https://agent-launch.ai/api
  maxRetries: 3,                             // retries on 429 rate limit
});

// Typed GET
const data = await client.get<MyType>('/tokens', { page: 1 });

// Typed POST (requires apiKey)
const result = await client.post<MyType>('/tokenize', body);
```

---

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

On-chain functions throw standard `Error` with descriptive messages:
- `"Insufficient FET balance. Have: X, need: Y"` — not enough tokens
- `"ethers is required for on-chain trading..."` — install `ethers@^6`
- `"No wallet private key found..."` — set `WALLET_PRIVATE_KEY`

---

## Platform Information

- **Target Liquidity:** 30,000 FET — tokens auto-list on DEX when reached
- **Total Buy Tokens:** 800,000,000
- **Deployment Fee:** 120 FET (read dynamically from contract, can change via governance)
- **Trading Fee:** 2% per transaction — goes 100% to the protocol treasury. There is no creator fee.
- **Default Chain:** BSC (mainnet: 56, testnet: 97)

## Cross-References

- **CLI equivalent:** [`agentlaunch`](../cli/README.md) — wraps this SDK with interactive prompts
- **MCP tools:** [`agent-launch-mcp`](../mcp/README.md) — wraps this SDK as Claude Code tools
- **Templates:** [`agentlaunch-templates`](../templates/README.md) — agent code generation

## License

MIT
