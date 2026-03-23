# Custodial Trading Demo

Trade tokens without managing private keys. We derive a wallet from your agent address — same agent, same wallet, every time.

## Table of Contents

1. [How It Works](#how-it-works)
2. [Setup (30 seconds)](#setup-30-seconds)
3. [CLI Commands](#cli-commands)
4. [SDK Usage](#sdk-usage)
5. [MCP Tools](#mcp-tools)
6. [Raw API](#raw-api)
7. [Verified Output](#verified-output)

---

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│  YOUR AGENT calls POST /agents/buy with X-API-Key header   │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  WE VALIDATE your key against Agentverse                   │
│  We get your agent address: "agent1qf8x..."                │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  WE DERIVE your wallet:                                    │
│  hash("agent1qf8x...") → 0x5FE19D4ba5D93c74...            │
│                                                             │
│  Same agent = Same wallet. Always. Forever.                │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  WE SIGN & BROADCAST the transaction                       │
│  Return tx hash to your agent                              │
└─────────────────────────────────────────────────────────────┘
```

**Key insight**: We don't store private keys. We derive them on-demand from your agent address using HD wallet derivation. Stateless. Deterministic. Secure.

---

## Setup (30 seconds)

### Step 1: Get Your API Key

Go to [agentverse.ai/profile/api-keys](https://agentverse.ai/profile/api-keys) and create a new key.

### Step 2: Set Environment Variable

```bash
# .env file — just an API key, no private key needed
AGENTVERSE_API_KEY=av-your-key-here

# Or use AGENTLAUNCH_API_KEY (same thing)
AGENTLAUNCH_API_KEY=av-your-key-here
```

### Step 3: Check Your Wallet

```bash
npx agentlaunch wallet custodial
```

Your wallet starts empty. Fund it with FET and BNB before trading.

### Getting Testnet Funds

Message the $GIFT agent on Agentverse:
```
claim 0xYourWalletAddress
```

You'll receive 200 TFET + 0.001 tBNB for gas.

---

## CLI Commands

### Check Wallet

```bash
npx agentlaunch wallet custodial

# Output:
# ==================================================
# CUSTODIAL WALLET
# ==================================================
# Address:     0x5FE19D4ba5D93c74D2C298c079b385514C8Ec1aF
# Network:     BSC Testnet
# FET Balance: 486.99 FET
# Gas Balance: 0.0099 BNB
# ==================================================

# JSON output
npx agentlaunch wallet custodial --json
```

### Buy Tokens

```bash
# Buy 100 FET worth of tokens
npx agentlaunch buy 0xF7e2F77f014a5ad3C121b1942968be33BA89e03c \
  --amount 100 \
  --custodial

# With custom slippage (default: 5%)
npx agentlaunch buy 0xF7e2F77f... \
  --amount 100 \
  --slippage 10 \
  --custodial

# JSON output
npx agentlaunch buy 0xF7e2F77f... --amount 100 --custodial --json
```

### Sell Tokens

```bash
# Sell 500,000 tokens
npx agentlaunch sell 0xF7e2F77f014a5ad3C121b1942968be33BA89e03c \
  --amount 500000 \
  --custodial

# With custom slippage
npx agentlaunch sell 0xF7e2F77f... \
  --amount 500000 \
  --slippage 10 \
  --custodial

# JSON output
npx agentlaunch sell 0xF7e2F77f... --amount 500000 --custodial --json
```

### Preview First (Dry Run)

You can preview any trade without custodial mode — dry runs don't execute:

```bash
# Preview a buy (no wallet needed)
npx agentlaunch buy 0xF7e2F77f... --amount 100 --dry-run

# Preview a sell
npx agentlaunch sell 0xF7e2F77f... --amount 500000 --dry-run
```

---

## SDK Usage

### Installation

```bash
npm install agentlaunch-sdk
```

### Fluent API (Recommended)

```typescript
import { AgentLaunch } from 'agentlaunch-sdk';

const sdk = new AgentLaunch({ apiKey: process.env.AGENTVERSE_API_KEY });

// Check your custodial wallet
const wallet = await sdk.trading.getWallet();
console.log(`Address: ${wallet.address}`);
console.log(`FET:     ${wallet.fetBalance}`);
console.log(`BNB:     ${wallet.nativeBalance}`);

// Buy tokens
const buy = await sdk.trading.buy({
  tokenAddress: '0xF7e2F77f014a5ad3C121b1942968be33BA89e03c',
  fetAmount: '100',
  slippagePercent: 5,  // optional, default: 5
});

console.log(`Tx Hash: ${buy.txHash}`);
console.log(`Block:   ${buy.blockNumber}`);
console.log(`Tokens:  ${buy.expectedTokens}`);
console.log(`Wallet:  ${buy.walletAddress}`);

// Sell tokens
const sell = await sdk.trading.sell({
  tokenAddress: '0xF7e2F77f014a5ad3C121b1942968be33BA89e03c',
  tokenAmount: '500000',
  slippagePercent: 5,
});

console.log(`Tx Hash: ${sell.txHash}`);
console.log(`Sold:    ${sell.tokensSold}`);
```

### Standalone Functions

```typescript
import { getWallet, executeBuy, executeSell } from 'agentlaunch-sdk';

// Get wallet (chainId optional, default: 97)
const wallet = await getWallet(97);

// Execute buy
const buy = await executeBuy({
  tokenAddress: '0xF7e2F77f...',
  fetAmount: '100',
  slippagePercent: 5,
});

// Execute sell
const sell = await executeSell({
  tokenAddress: '0xF7e2F77f...',
  tokenAmount: '500000',
});
```

### Type Definitions

```typescript
interface WalletInfoResponse {
  address: string;        // EVM wallet address
  nativeBalance: string;  // BNB balance (whole units)
  fetBalance: string;     // FET balance (whole units)
  chainId: number;        // Chain this was queried on
}

interface CustodialBuyResult {
  txHash: string;
  approvalTxHash: string | null;  // null if allowance was sufficient
  blockNumber: number;
  fetSpent: string;
  expectedTokens: string;
  minTokens: string;
  gasUsed: string;
  walletAddress: string;
}

interface CustodialSellResult {
  txHash: string;
  blockNumber: number;
  tokensSold: string;
  gasUsed: string;
  walletAddress: string;
}
```

---

## MCP Tools

The MCP server provides 3 custodial trading tools for Claude Code and Cursor.

### Setup

Add to `.claude/settings.json` or `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "agent-launch": {
      "command": "npx",
      "args": ["-y", "agent-launch-mcp@latest"],
      "env": {
        "AGENTLAUNCH_API_KEY": "av-your-key-here"
      }
    }
  }
}
```

Note: No `WALLET_PRIVATE_KEY` needed for custodial trading.

### Available Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `get_agent_wallet` | Get custodial wallet address + balances | `chainId` (optional) |
| `buy_token` | Execute a custodial buy | `tokenAddress`, `fetAmount`, `slippagePercent` |
| `sell_token` | Execute a custodial sell | `tokenAddress`, `tokenAmount`, `slippagePercent` |

### Tool Schemas

#### get_agent_wallet

```json
{
  "chainId": 97  // optional, default: 97 (BSC Testnet)
}
```

Returns:
```json
{
  "address": "0x5FE19D4ba5D93c74D2C298c079b385514C8Ec1aF",
  "nativeBalance": "0.0099",
  "fetBalance": "486.99",
  "chainId": 97
}
```

#### buy_token

```json
{
  "tokenAddress": "0xF7e2F77f014a5ad3C121b1942968be33BA89e03c",
  "fetAmount": "100",
  "slippagePercent": 5  // optional, default: 5
}
```

Returns:
```json
{
  "txHash": "0x494abe7ff4ca8d13e212375a20c36cdf666be5...",
  "approvalTxHash": "0xfe726a7079b12e1a0740de7aab3842473cc54...",
  "blockNumber": 97404533,
  "fetSpent": "100",
  "expectedTokens": "62467.789346",
  "minTokens": "59344.399878",
  "gasUsed": "96947",
  "walletAddress": "0x5FE19D4ba5D93c74D2C298c079b385514C8Ec1aF"
}
```

#### sell_token

```json
{
  "tokenAddress": "0xF7e2F77f014a5ad3C121b1942968be33BA89e03c",
  "tokenAmount": "500000",
  "slippagePercent": 5  // optional
}
```

Returns:
```json
{
  "txHash": "0x...",
  "blockNumber": 97404600,
  "tokensSold": "500000",
  "gasUsed": "85000",
  "walletAddress": "0x5FE19D4ba5D93c74D2C298c079b385514C8Ec1aF"
}
```

### Usage in Claude Code

```
You: Check my custodial wallet

Claude: [Uses get_agent_wallet tool]

Your custodial wallet:
- Address: 0x5FE19D4ba5D93c74D2C298c079b385514C8Ec1aF
- FET Balance: 486.99 FET
- BNB Balance: 0.0099 BNB (for gas)

You: Buy 100 FET worth of 0xF7e2F77f...

Claude: [Uses buy_token tool]

Buy executed!
- Tx: 0x494abe7f...
- Tokens received: ~62,467
- Gas used: 96,947

You: Now sell half of those tokens

Claude: [Uses sell_token with tokenAmount: "31233"]

Sell executed!
- Tx: 0x...
- Tokens sold: 31,233
```

---

## Raw API

For any language or direct HTTP calls.

### Authentication

All custodial endpoints require the `X-API-Key` header:

```bash
X-API-Key: av-your-agentverse-key
```

### Endpoints

#### GET /api/agents/wallet

Get your custodial wallet address and balances.

```bash
curl -H "X-API-Key: $AGENTVERSE_API_KEY" \
  "https://agent-launch.ai/api/agents/wallet?chainId=97"
```

Response:
```json
{
  "success": true,
  "data": {
    "address": "0x5FE19D4ba5D93c74D2C298c079b385514C8Ec1aF",
    "nativeBalance": "0.0099207026",
    "fetBalance": "486.990632363267610593",
    "chainId": 97
  }
}
```

#### POST /api/agents/buy

Execute a buy on the bonding curve.

```bash
curl -X POST \
  -H "X-API-Key: $AGENTVERSE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "tokenAddress": "0xF7e2F77f014a5ad3C121b1942968be33BA89e03c",
    "fetAmount": "100",
    "slippagePercent": 5
  }' \
  "https://agent-launch.ai/api/agents/buy"
```

Response:
```json
{
  "success": true,
  "data": {
    "txHash": "0x494abe7ff4ca8d13e212375a20c36cdf666be5a521856a55b9143ae83882ab03",
    "approvalTxHash": "0xfe726a7079b12e1a0740de7aab3842473cc54b0871a0a11271711ea9ffb9233b",
    "blockNumber": 97404533,
    "fetSpent": "100",
    "expectedTokens": "6246778.934610070421006100",
    "minTokens": "5934439.987879566899955795",
    "gasUsed": "96947",
    "walletAddress": "0x5FE19D4ba5D93c74D2C298c079b385514C8Ec1aF"
  }
}
```

#### POST /api/agents/sell

Execute a sell on the bonding curve.

```bash
curl -X POST \
  -H "X-API-Key: $AGENTVERSE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "tokenAddress": "0xF7e2F77f014a5ad3C121b1942968be33BA89e03c",
    "tokenAmount": "500000",
    "slippagePercent": 5
  }' \
  "https://agent-launch.ai/api/agents/sell"
```

Response:
```json
{
  "success": true,
  "data": {
    "txHash": "0x...",
    "blockNumber": 97404600,
    "tokensSold": "500000",
    "gasUsed": "85000",
    "walletAddress": "0x5FE19D4ba5D93c74D2C298c079b385514C8Ec1aF"
  }
}
```

### Error Responses

```json
{
  "statusCode": 400,
  "message": "Insufficient FET balance to complete this trade"
}
```

```json
{
  "statusCode": 400,
  "message": "Insufficient native token for gas fees"
}
```

```json
{
  "statusCode": 400,
  "message": "Token is already listed on DEX. Trade directly on the exchange."
}
```

---

## Verified Output

These outputs were captured from actual trades on 2026-03-24.

### Wallet Check (Real)

```bash
$ npx agentlaunch wallet custodial

==================================================
CUSTODIAL WALLET
==================================================
Address:     0x5FE19D4ba5D93c74D2C298c079b385514C8Ec1aF
Network:     BSC Testnet
FET Balance: 486.990632363267610593 FET
Gas Balance: 0.0099207026 BNB
==================================================

Explorer: https://testnet.bscscan.com/address/0x5FE19D4ba5D93c74D2C298c079b385514C8Ec1aF

To trade with this wallet:
  agentlaunch buy <token> --amount 100 --custodial
  agentlaunch sell <token> --amount 500000 --custodial
```

### Buy Execution (Real)

```bash
$ npx agentlaunch buy 0xF7e2F77f014a5ad3C121b1942968be33BA89e03c \
    --amount 1 --custodial

==================================================
CUSTODIAL BUY EXECUTED
==================================================
Token:          0xF7e2F77f014a5ad3C121b1942968be33BA89e03c
Chain:          BSC Testnet
Wallet:         0x5FE19D4ba5D93c74D2C298c079b385514C8Ec1aF
Tx Hash:        0x494abe7ff4ca8d13e212375a20c36cdf666be5a521856a55b9143ae83882ab03
Block:          97404533
FET spent:      1 FET
Tokens (expected): 62467.789346100704210061
Min tokens:     59344.399878795668999557 (5% slippage)
Gas used:       96947
Approval Tx:    0xfe726a7079b12e1a0740de7aab3842473cc54b0871a0a11271711ea9ffb9233b
==================================================

  MCP: buy_token | SDK: sdk.trading.buy()
```

Transaction verified on BSCScan: [View Tx](https://testnet.bscscan.com/tx/0x494abe7ff4ca8d13e212375a20c36cdf666be5a521856a55b9143ae83882ab03)

---

## Comparison: Custodial vs On-Chain

| Feature | Custodial | On-Chain |
|---------|-----------|----------|
| Private key required | No | Yes |
| Setup time | 30 seconds | 5 minutes |
| Wallet management | Platform handles | You handle |
| Best for | Autonomous agents | Full self-custody |
| Security model | Derived from agent address | You hold the key |

---

## Platform Constants

| Constant | Value |
|----------|-------|
| Trading Fee | 2% (100% to protocol treasury) |
| Max Trade Size | 1000 FET (configurable) |
| Default Slippage | 5% |
| Default Chain | BSC Testnet (97) |
| Gas Minimum | 0.001 BNB |

---

## Links

- **Platform**: https://agent-launch.ai
- **Trading Docs**: https://agent-launch.ai/docs/trading
- **Agentverse**: https://agentverse.ai
- **API Keys**: https://agentverse.ai/profile/api-keys
- **SDK**: https://www.npmjs.com/package/agentlaunch-sdk
- **MCP**: https://www.npmjs.com/package/agent-launch-mcp
- **CLI**: https://www.npmjs.com/package/agentlaunch

---

## Change Log

### 2026-03-24

- Initial release of custodial trading
- SDK: `getWallet()`, `executeBuy()`, `executeSell()` + fluent API
- CLI: `wallet custodial`, `buy --custodial`, `sell --custodial`
- MCP: `get_agent_wallet`, `buy_token`, `sell_token`
- Verified with real transactions on BSC Testnet
