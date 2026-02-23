# Example: Monitor and Trade

Demonstrates market monitoring and trade link generation using `agentlaunch-sdk`. No API key required — all operations are read-only.

## What It Does

1. Lists the top 10 tokens by market cap
2. Gets full details for the top deployed token
3. Checks the current bonding-curve price
4. Lists the top token holders
5. Demonstrates the token-gated access pattern (check if a wallet holds tokens)
6. Generates buy and sell handoff links for humans

## Prerequisites

- Node.js 18+
- No API key required for read-only operations

## How to Run

### Option A: From source with ts-node

```bash
cd packages/examples/monitor-and-trade
npm install
npm start
```

### Option B: Compile then run

```bash
cd packages/examples/monitor-and-trade
npm install
npm run build
npm run start:js
```

### Option C: Inspect a specific token

```bash
TOKEN_ADDRESS=0xAbCd1234... npm start
```

### Option D: Check a specific wallet for token holdings

```bash
TOKEN_ADDRESS=0xAbCd1234... WALLET_ADDRESS=0xYourWallet... npm start
```

### Option E: Override API URL (production or custom backend)

```bash
# Point at production backend
AGENT_LAUNCH_API_URL=https://agent-launch.ai/api \
  AGENT_LAUNCH_FRONTEND_URL=https://agent-launch.ai \
  npm start

# Point at a local backend
AGENT_LAUNCH_API_URL=http://localhost:3000 \
  AGENT_LAUNCH_FRONTEND_URL=http://localhost:3001 \
  npm start
```

Environment variables:
- `AGENT_LAUNCH_API_URL` — Backend API base URL (default: dev Cloud Run backend)
- `AGENT_LAUNCH_FRONTEND_URL` — Frontend base URL used for trade links (default: dev Cloud Run frontend)

## Expected Output

```
AgentLaunch — Monitor and Trade Example
Platform: https://launchpad-frontend-dev-1056182620041.us-central1.run.app

───────────────────────────────────────────────────────
Step 1: Top Tokens by Market Cap
───────────────────────────────────────────────────────
Showing 10 of 127 tokens

Name                    Price             Market Cap        Progress
──────────────────────────────────────────────────────────────────
Alpha Research Bot      0.002341 FET      1.87M FET         78.9%
DataFeed Pro            0.001205 FET      964.00K FET        54.2%
Trading Sentinel        0.000892 FET      713.60K FET        41.1%

───────────────────────────────────────────────────────
Step 2: Token Details — 0xAbCd1234...
───────────────────────────────────────────────────────
Name:        Alpha Research Bot
Symbol:      ARB
Address:     0xAbCd1234...
Chain ID:    97
Status:      bonding
Listed:      No — bonding curve
Price:       0.002341 FET
Market Cap:  1.87M FET
Progress:    78.92% toward 30,000 FET graduation

───────────────────────────────────────────────────────
Step 3: Current Price
───────────────────────────────────────────────────────
Current price: 0.002341 FET
(This is the bonding curve price — changes with each trade)

───────────────────────────────────────────────────────
Step 4: Token Holders
───────────────────────────────────────────────────────
Total holders: 42

Top holders:
   1. 0xAbCd123...abc123  125000 tokens (12.50%)
   2. 0xDef456...def456   98000 tokens (9.80%)
   3. 0x123abc...789def   75500 tokens (7.55%)

───────────────────────────────────────────────────────
Step 5: Token-Gated Access — Wallet 0x0000000001...
───────────────────────────────────────────────────────
Access: DENIED
Wallet 0x0000000001... holds 0 tokens.

───────────────────────────────────────────────────────
Step 6: Trade Links for Humans
───────────────────────────────────────────────────────
Trade page (no pre-fill):
  https://launchpad-frontend-dev-1056182620041.us-central1.run.app/trade/0xAbCd1234...

Buy links (pre-filled FET amounts):
    10 FET: https://launchpad-frontend-dev-1056182620041.us-central1.run.app/trade/0xAbCd1234...?action=buy&amount=10
    50 FET: https://launchpad-frontend-dev-1056182620041.us-central1.run.app/trade/0xAbCd1234...?action=buy&amount=50
   100 FET: https://launchpad-frontend-dev-1056182620041.us-central1.run.app/trade/0xAbCd1234...?action=buy&amount=100
   500 FET: https://launchpad-frontend-dev-1056182620041.us-central1.run.app/trade/0xAbCd1234...?action=buy&amount=500

Sell links (pre-filled token amounts):
     1,000 tokens: https://launchpad-frontend-dev-1056182620041.us-central1.run.app/trade/0xAbCd1234...?action=sell&amount=1000
    10,000 tokens: https://launchpad-frontend-dev-1056182620041.us-central1.run.app/trade/0xAbCd1234...?action=sell&amount=10000
   100,000 tokens: https://launchpad-frontend-dev-1056182620041.us-central1.run.app/trade/0xAbCd1234...?action=sell&amount=100000
```

## Token-Gated Access Pattern

Agents can use `getTokenHolders` to implement token-gated access:

```ts
import { getTokenHolders, AgentLaunchError } from 'agentlaunch-sdk';

async function hasAccess(tokenAddress: string, userWallet: string): Promise<boolean> {
  try {
    await getTokenHolders(tokenAddress, userWallet);
    return true;  // wallet holds tokens
  } catch (err) {
    if (err instanceof AgentLaunchError && err.status === 404) {
      return false; // not a holder
    }
    throw err;
  }
}
```

## Resources

- [AgentLaunch Dev Platform](https://launchpad-frontend-dev-1056182620041.us-central1.run.app)
- [SDK Reference](../../docs/toolkit/sdk-reference.md)
- [Getting Started Guide](../../docs/toolkit/getting-started.md)
