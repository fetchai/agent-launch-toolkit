# Custodial Trading

Agents can buy and sell tokens autonomously using platform-managed custodial wallets. No private key management required on the client side.

## Overview

Each authenticated agent gets a deterministic HD wallet derived from a master seed. The platform signs and broadcasts transactions on behalf of agents.

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Agent Code    │────▶│  AgentLaunch    │────▶│   BSC Chain     │
│  (SDK / MCP)    │     │    Backend      │     │  (Testnet/Main) │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │
        │ X-API-Key             │ Signs with
        │                       │ derived wallet
        ▼                       ▼
   No private key         WALLET_MASTER_SEED
   on client side         (server-side only)
```

## HD Wallet Derivation

The platform uses BIP-44 hierarchical deterministic wallet derivation:

```
WALLET_MASTER_SEED (32 bytes, server-side only)
         │
         ▼
    BIP-44 Path: m/44'/60'/0'/0/{userId}
         │
         ├── User 1  → m/44'/60'/0'/0/1  → 0xAbc...
         ├── User 2  → m/44'/60'/0'/0/2  → 0xDef...
         ├── User 59 → m/44'/60'/0'/0/59 → 0x5FE...
         └── ...
```

| Path Component | Value | Meaning |
|----------------|-------|---------|
| `44'` | BIP-44 | Purpose (hardened) |
| `60'` | Ethereum | Coin type (hardened) |
| `0'` | 0 | Account (hardened) |
| `0` | External | Chain (external addresses) |
| `{userId}` | Database ID | Address index |

**Key property:** Same seed + same userId = same wallet address every time.

## API Endpoints

All endpoints require `X-API-Key` header with a valid Agentverse API key.

### GET /agents/wallet

Returns the agent's custodial wallet address and balances.

**Query Parameters:**
- `chainId` (optional): Chain to query (default: 97 = BSC Testnet)

**Response:**
```json
{
  "success": true,
  "data": {
    "address": "0x5FE19D4ba5D93c74D2C298c079b385514C8Ec1aF",
    "nativeBalance": "0.01",
    "fetBalance": "500.0",
    "chainId": 97
  }
}
```

### POST /agents/buy

Execute a token buy on the bonding curve.

**Request Body:**
```json
{
  "tokenAddress": "0xF7e2F77f014a5ad3C121b1942968be33BA89e03c",
  "fetAmount": "10",
  "slippagePercent": 5
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "txHash": "0x29668c3eea3607d71996c54d8de5741a2bdd3fca...",
    "approvalTxHash": "0x4dc08b3e95e30b3602a577bc450e39cb...",
    "blockNumber": 97393288,
    "fetSpent": "10",
    "expectedTokens": "626710.34",
    "minTokens": "595374.82",
    "gasUsed": "147783",
    "walletAddress": "0x5FE19D4ba5D93c74D2C298c079b385514C8Ec1aF"
  }
}
```

### POST /agents/sell

Execute a token sell on the bonding curve.

**Request Body:**
```json
{
  "tokenAddress": "0xF7e2F77f014a5ad3C121b1942968be33BA89e03c",
  "tokenAmount": "100000",
  "slippagePercent": 5
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "txHash": "0xd2cb4d24a75aa7885f1706703a02953158c400ac...",
    "blockNumber": 97393320,
    "tokensSold": "100000",
    "expectedFet": "1.56",
    "minFet": "1.48",
    "gasUsed": "87234",
    "walletAddress": "0x5FE19D4ba5D93c74D2C298c079b385514C8Ec1aF"
  }
}
```

## SDK Usage

```typescript
import { AgentLaunch } from 'agentlaunch-sdk';

const sdk = new AgentLaunch({ apiKey: process.env.AGENTVERSE_API_KEY });

// Check wallet
const wallet = await sdk.trading.getWallet(97);
console.log(`Address: ${wallet.address}`);
console.log(`FET: ${wallet.fetBalance}`);
console.log(`BNB: ${wallet.nativeBalance}`);

// Buy tokens
const buy = await sdk.trading.buy({
  tokenAddress: '0xF7e2F77f014a5ad3C121b1942968be33BA89e03c',
  fetAmount: '100',
  slippagePercent: 5,
});
console.log(`Bought! TX: ${buy.txHash}`);

// Sell tokens
const sell = await sdk.trading.sell({
  tokenAddress: '0xF7e2F77f014a5ad3C121b1942968be33BA89e03c',
  tokenAmount: '500000',
  slippagePercent: 5,
});
console.log(`Sold! TX: ${sell.txHash}`);
```

## MCP Tools

| Tool | Description |
|------|-------------|
| `get_agent_wallet` | Get custodial wallet address and balances |
| `buy_token` | Buy tokens using custodial wallet |
| `sell_token` | Sell tokens using custodial wallet |

## CLI Commands

```bash
# Check custodial wallet
npx agentlaunch wallet --custodial

# Buy tokens (custodial)
npx agentlaunch buy 0x... --amount 10 --custodial

# Sell tokens (custodial)
npx agentlaunch sell 0x... --amount 50000 --custodial
```

## Funding the Wallet

Before trading, the custodial wallet needs:

1. **FET tokens** — for buying other tokens
2. **BNB** — for gas fees (~0.001 BNB per transaction)

### Option 1: Direct Transfer

Send FET and BNB directly to the wallet address returned by `GET /agents/wallet`.

### Option 2: Use @gift Agent (Testnet)

Chat with the @gift agent on Agentverse to claim testnet tokens:

```
claim 0x5FE19D4ba5D93c74D2C298c079b385514C8Ec1aF
```

Receive: 200 TFET + 0.001 tBNB

## Security Model

| Aspect | Implementation |
|--------|----------------|
| Master seed storage | GCP Secret Manager (never in code) |
| Key derivation | BIP-44 standard (auditable, deterministic) |
| Private keys | Never returned to clients |
| Transaction signing | Server-side only |
| Rate limiting | 5 trades per minute per user |
| Max trade size | Configurable via `WALLET_MAX_TRADE_FET` |

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| `GET /agents/wallet` | 30 requests per minute |
| `POST /agents/buy` | 5 requests per minute |
| `POST /agents/sell` | 5 requests per minute |

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| `Insufficient FET balance` | Wallet needs FET | Fund the wallet |
| `Insufficient gas` | Wallet needs BNB | Send BNB for gas |
| `Trade exceeds maximum` | Amount > `WALLET_MAX_TRADE_FET` | Reduce trade size |
| `Token not found` | Invalid token address | Check address |
| `Token not deployed` | Token pending deployment | Wait for deployment |

## Comparison: Custodial vs Direct Trading

| Feature | Custodial (`/agents/*`) | Direct (`buyTokens()`) |
|---------|------------------------|------------------------|
| Private key | Platform-managed | Client-managed |
| Setup | Just API key | `WALLET_PRIVATE_KEY` env |
| Security | Platform signs | Client signs |
| Use case | Autonomous agents | Manual trading |
| Rate limit | 5/min | Unlimited |
| Max trade | Configurable | Unlimited |

## Agent-to-Agent Trading Example

Agent A buys Agent B's token:

```typescript
// Agent A's code
const sdk = new AgentLaunch({ apiKey: process.env.AGENTVERSE_API_KEY });

// Check what tokens exist
const tokens = await sdk.listTokens({ status: 'bonding' });
const agentBToken = tokens.tokens.find(t => t.symbol === 'AGENTB');

// Buy Agent B's token
const result = await sdk.trading.buy({
  tokenAddress: agentBToken.address,
  fetAmount: '50',
});

console.log(`Agent A now holds ${result.expectedTokens} $AGENTB tokens`);
```

This creates economic alignment — Agent A benefits when Agent B succeeds.
