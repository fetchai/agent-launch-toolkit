# Custodial Trading

Agents and users can buy and sell tokens autonomously using platform-managed custodial wallets. No private key management required on the client side.

## Two Wallet Types

Every API key gets **two kinds** of custodial wallet:

| Wallet | Derived From | Purpose | Stable? |
|--------|-------------|---------|---------|
| **User wallet** | `hash("user:{userId}")` | Your personal funds, funding, manual trading | Yes — never changes |
| **Agent wallet** | `hash(agentAddress)` | Agent's autonomous trading, per-agent isolation | Yes — tied to agent |

**Key property:** Creating new agents never affects your user wallet. Each agent has its own separate wallet. No confusion, no stranded funds.

## Overview

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
    hash(identity) % MAX_HD_INDEX → derivation index
         │
         ▼
    BIP-44 Path: m/44'/60'/0'/0/{index}

User wallet:
    hash("user:{userId}") → index 4567890 → 0x94bC...  (always the same)

Agent wallets:
    hash(agent1qabc...) → index 1234567 → 0x5FE...
    hash(agent1qxyz...) → index 9876543 → 0xAbc...
```

| Path Component | Value | Meaning |
|----------------|-------|---------|
| `44'` | BIP-44 | Purpose (hardened) |
| `60'` | Ethereum | Coin type (hardened) |
| `0'` | 0 | Account (hardened) |
| `0` | External | Chain (external addresses) |
| `{index}` | `hash(identity) % 2^31` | Address index |

## API Endpoints

All endpoints require `X-API-Key` header with a valid Agentverse API key.

### GET /agents/wallet

Returns a custodial wallet address and balances.

**Query Parameters:**
- `chainId` (optional): Chain to query (default: 97 = BSC Testnet)
- `agentAddress` (optional): Agent address (agent1q...) to get that agent's wallet. **Omit to get your user wallet.**

**User wallet (default):**
```bash
curl -H "X-API-Key: $KEY" "https://agent-launch.ai/api/agents/wallet?chainId=97"
```

**Agent wallet:**
```bash
curl -H "X-API-Key: $KEY" \
  "https://agent-launch.ai/api/agents/wallet?chainId=97&agentAddress=agent1qabc..."
```

**Response:**
```json
{
  "success": true,
  "data": {
    "address": "0x94bC35fD18f7cEA316eDCD28139131Cb3Aa1130c",
    "nativeBalance": "0.01",
    "fetBalance": "500.0",
    "chainId": 97,
    "type": "user",
    "agentAddress": null
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
  "slippagePercent": 5,
  "agentAddress": "agent1qabc..."
}
```

The `agentAddress` field is optional. Omit it to trade from your user wallet.

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
    "walletAddress": "0x94bC35fD18f7cEA316eDCD28139131Cb3Aa1130c"
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
  "slippagePercent": 5,
  "agentAddress": "agent1qabc..."
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
    "walletAddress": "0x94bC35fD18f7cEA316eDCD28139131Cb3Aa1130c"
  }
}
```

## SDK Usage

```typescript
import { AgentLaunch } from 'agentlaunch-sdk';

const sdk = new AgentLaunch({ apiKey: process.env.AGENTVERSE_API_KEY });

// User wallet (your personal wallet — stable forever)
const myWallet = await sdk.trading.getWallet(97);
console.log(`My wallet: ${myWallet.address}`);

// Agent wallet (specific agent's trading wallet)
const agentWallet = await sdk.trading.getWallet(97, 'agent1qabc...');
console.log(`Agent wallet: ${agentWallet.address}`);

// Buy from user wallet (default)
const buy = await sdk.trading.buy({
  tokenAddress: '0xF7e2F77f014a5ad3C121b1942968be33BA89e03c',
  fetAmount: '100',
  slippagePercent: 5,
});

// Buy from agent's wallet
const agentBuy = await sdk.trading.buy({
  tokenAddress: '0xF7e2F77f014a5ad3C121b1942968be33BA89e03c',
  fetAmount: '50',
  agentAddress: 'agent1qabc...',
});

// Sell from user wallet
const sell = await sdk.trading.sell({
  tokenAddress: '0xF7e2F77f014a5ad3C121b1942968be33BA89e03c',
  tokenAmount: '500000',
});
```

## MCP Tools

| Tool | Description |
|------|-------------|
| `get_agent_wallet` | Get wallet address and balances (user or agent) |
| `buy_token` | Buy tokens using custodial wallet |
| `sell_token` | Sell tokens using custodial wallet |

All three accept an optional `agentAddress` parameter. Omit for user wallet.

```
# User wallet
get_agent_wallet({})

# Agent wallet
get_agent_wallet({ agentAddress: "agent1qabc..." })

# Buy from user wallet
buy_token({ tokenAddress: "0x...", fetAmount: "10" })

# Buy from agent wallet
buy_token({ tokenAddress: "0x...", fetAmount: "10", agentAddress: "agent1qabc..." })
```

## CLI Commands

```bash
# User wallet (default)
npx agentlaunch wallet custodial

# Agent wallet
npx agentlaunch wallet custodial --agent agent1qabc...

# Buy from user wallet
npx agentlaunch buy 0x... --amount 10 --custodial

# Buy from agent wallet
npx agentlaunch buy 0x... --amount 10 --agent agent1qabc...

# Sell from user wallet
npx agentlaunch sell 0x... --amount 50000 --custodial

# Sell from agent wallet
npx agentlaunch sell 0x... --amount 50000 --agent agent1qabc...
```

Note: `--agent` implies `--custodial` (no need to pass both).

## Funding Wallets

Before trading, a wallet needs:

1. **FET tokens** — for buying other tokens
2. **BNB** — for gas fees (~0.001 BNB per transaction)

### Fund your user wallet

```bash
# Get your user wallet address
npx agentlaunch wallet custodial

# Claim testnet tokens
npx agentlaunch claim 0xYOUR_USER_WALLET
```

### Fund an agent wallet

```bash
# Get the agent's wallet address
npx agentlaunch wallet custodial --agent agent1qabc...

# Claim testnet tokens to that address
npx agentlaunch claim 0xAGENT_WALLET
```

### Use @gift Agent (Testnet)

Chat with @gift on Agentverse: `claim 0xWALLET_ADDRESS`

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
| Wallet types | User + per-agent | Single wallet |
| Use case | Autonomous agents | Manual trading |
| Rate limit | 5/min | Unlimited |
| Max trade | Configurable | Unlimited |
