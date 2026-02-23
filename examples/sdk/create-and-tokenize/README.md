# Example: Create and Tokenize

Demonstrates the full agent-human handoff flow using `agentlaunch-sdk`:

1. Authenticate with your Agentverse API key
2. List your Agentverse agents
3. Create a token record for the first agent
4. Print the deploy handoff link for a human to complete on-chain deployment

## Prerequisites

- Node.js 18+
- An Agentverse API key — get one at https://agentverse.ai/profile/api-keys
- (Optional) An Agentverse agent deployed — the example falls back to a demo address if none exist

## How to Run

### Option A: From source with ts-node

```bash
cd packages/examples/create-and-tokenize
npm install
AGENTVERSE_API_KEY=av-xxxxxxxxxxxxxxxx npm start
```

### Option B: Compile then run

```bash
cd packages/examples/create-and-tokenize
npm install
npm run build
AGENTVERSE_API_KEY=av-xxxxxxxxxxxxxxxx npm run start:js
```

### Option C: Pass chain ID

```bash
# BSC Mainnet (production)
AGENTVERSE_API_KEY=av-xxx CHAIN_ID=56 npm start

# BSC Testnet (default — safe for testing)
AGENTVERSE_API_KEY=av-xxx CHAIN_ID=97 npm start
```

### Option D: Override API URL (production or custom backend)

```bash
# Point at production backend
AGENTVERSE_API_KEY=av-xxx \
  AGENT_LAUNCH_API_URL=https://agent-launch.ai/api \
  AGENT_LAUNCH_FRONTEND_URL=https://agent-launch.ai \
  npm start

# Point at a local backend
AGENTVERSE_API_KEY=av-xxx \
  AGENT_LAUNCH_API_URL=http://localhost:3000 \
  AGENT_LAUNCH_FRONTEND_URL=http://localhost:3001 \
  npm start
```

Environment variables:
- `AGENT_LAUNCH_API_URL` — Backend API base URL (default: dev Cloud Run backend)
- `AGENT_LAUNCH_FRONTEND_URL` — Frontend base URL used for handoff/trade links (default: dev Cloud Run frontend)

## Expected Output

```
AgentLaunch — Create and Tokenize Example
Platform: https://launchpad-frontend-dev-1056182620041.us-central1.run.app

──────────────────────────────────────────────────
Step 1: Authenticate
──────────────────────────────────────────────────
JWT token obtained (expires in 3600s)
Token prefix: eyJhbGciOiJIUzI1NiIs...

──────────────────────────────────────────────────
Step 2: List My Agentverse Agents
──────────────────────────────────────────────────
Found 2 agent(s)
Using agent: My Research Bot
Address:     agent1qf8xfhsc8hg4g5l0nhtj...

──────────────────────────────────────────────────
Step 3: Create Token Record
──────────────────────────────────────────────────
Creating token for: My Research Bot
Agent address:      agent1qf8xfhsc8hg4g5l0nhtj...
Chain ID:           97

Token record created successfully.
  Token ID:   42
  Name:       My Research Bot
  Symbol:     MYRE
  Status:     pending_deployment
  Image:      https://launchpad-frontend-dev-1056182620041.us-central1.run.app/images/placeholder-42.png

──────────────────────────────────────────────────
Step 4: Handoff Links
──────────────────────────────────────────────────
Deploy handoff link (send to a human with FET wallet):
  https://launchpad-frontend-dev-1056182620041.us-central1.run.app/deploy/42

Trade link (share after deployment):
  https://launchpad-frontend-dev-1056182620041.us-central1.run.app/trade/42?action=buy&amount=100

──────────────────────────────────────────────────
Summary
──────────────────────────────────────────────────
The agent-human handoff is complete on the agent side.

Next steps for the HUMAN:
  1. Open the deploy link in a browser
     https://launchpad-frontend-dev-1056182620041.us-central1.run.app/deploy/42
  2. Connect a wallet with 120+ FET and BNB for gas
  3. Click "Approve FET" (tx 1)
  4. Click "Deploy Token" (tx 2)
  5. Token is live on the bonding curve in ~30 seconds

Platform constants (from deployed contracts):
  - Deployment fee:    120 FET
  - Graduation target: 30,000 FET → auto DEX listing
  - Trading fee:       2% → 100% to protocol treasury
  - No creator fee
```

## What Happens Next

After the human deploys on-chain:
- The token goes live on the bonding curve immediately
- Anyone can buy and sell via the platform
- At 30,000 FET raised, the token auto-lists on a DEX
- Liquidity is locked — no rug pull possible

## Resources

- [AgentLaunch Dev Platform](https://launchpad-frontend-dev-1056182620041.us-central1.run.app)
- [SDK Reference](../../docs/toolkit/sdk-reference.md)
- [Getting Started Guide](../../docs/toolkit/getting-started.md)
- [OpenAPI Docs](https://launchpad-backend-dev-1056182620041.us-central1.run.app/docs/openapi)
