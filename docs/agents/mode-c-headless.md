# Mode C: Headless API — Programmatic Token Launch

No browser, no UI. Pure API calls from any environment: Python, Node.js, shell scripts, cron jobs, Claude Code.

**Authentication**: Just add your Agentverse API key. That's it.

## Quick Start

```bash
# Set your API key and URL (from .env or export directly)
export AGENTVERSE_API_KEY="your-key-from-agentverse.ai/profile/api-keys"
export AGENT_LAUNCH_API_URL="https://agent-launch.ai/api"  # production default

# Create a token
curl -X POST $AGENT_LAUNCH_API_URL/tokenize \
  -H "X-API-Key: $AGENTVERSE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "agentAddress": "agent1qxxxxxxxxxx",
    "name": "My Token",
    "symbol": "MTK",
    "description": "Created via API",
    "image": "auto",
    "chainId": 97
  }'

# Response includes handoff link
# Human clicks link → deploys → token is live
```

## Live API Spec

- Skill: `https://agent-launch.ai/skill.md` (production)
- OpenAPI: `https://agent-launch.ai/docs/openapi` (production)
- Agent docs: `https://agent-launch.ai/docs/for-agents` (production)
- Active API URL: configured via `AGENT_LAUNCH_API_URL` in `.env`

## The Flow

```
SIMPLE (Agent creates, human deploys):
  1. Agent calls POST /api/tokenize with X-API-Key
  2. Agent gets handoff link: /deploy/{token_id}
  3. Agent sends link to human
  4. Human clicks → connects wallet → deploys
  5. Token is live

FULL (Agent creates AND deploys):
  1. Agent calls POST /api/tokenize with X-API-Key
  2. Agent approves FET on-chain
  3. Agent deploys on-chain
  4. Token is live (no human needed)
```

## Environment Variables

```bash
# Required
AGENTVERSE_API_KEY=your-key    # Get at agentverse.ai/profile/api-keys

# URL configuration (set in .env — production URLs are default)
AGENT_LAUNCH_API_URL=https://agent-launch.ai/api
AGENT_LAUNCH_FRONTEND_URL=https://agent-launch.ai
# For dev, change these to:
# AGENT_LAUNCH_API_URL=https://launchpad-backend-dev-1056182620041.us-central1.run.app
# AGENT_LAUNCH_FRONTEND_URL=https://launchpad-frontend-dev-1056182620041.us-central1.run.app

# Optional (for on-chain deployment)
WALLET_PRIVATE_KEY=0x...       # For signing transactions
DEPLOYER_ADDRESS=0x...         # FETAgentVerseDeployer contract
RPC_URL=https://bsc-dataseed.binance.org
```

## Python Script

Use `launch-headless.py` in this folder:

```bash
# Create token (human deploys via handoff)
python launch-headless.py --name "MyCoin" --ticker "MC"

# Create and deploy on-chain (requires wallet)
python launch-headless.py --name "MyCoin" --ticker "MC" --deploy-onchain

# List your Agentverse agents
python launch-headless.py --list-agents
```

## API Reference

### Create Token

```
POST ${AGENT_LAUNCH_API_URL}/tokenize
# Prod: https://agent-launch.ai/api/tokenize (default)
Header: X-API-Key: YOUR_AGENTVERSE_API_KEY

Body:
  agentAddress*  string (agent1q... or 0x...)
  name           string (max 32, optional - fetched from Agentverse if omitted)
  symbol         string (max 11, optional - derived from name if omitted)
  description    string (max 500, optional - auto-generated if omitted)
  image          string (URL, base64, or "auto", optional)
  chainId        int (97=BSC Testnet, 56=BSC Mainnet, optional)

Response:
  {
    "success": true,
    "data": {
      "id": 42,
      "name": "My Token",
      "symbol": "MTK",
      ...
    }
  }

Handoff link: ${AGENT_LAUNCH_FRONTEND_URL}/deploy/{id}
```

### List Tokens

```
GET ${AGENT_LAUNCH_API_URL}/tokens
Params: page, limit, search, categoryId, chainId, sortBy, sortOrder
```

### Get Token

```
GET ${AGENT_LAUNCH_API_URL}/token/{address}
Returns: price, market_cap, holders, progress, etc.
```

## Python Implementation

### Simple (API Key Only)

```python
import os
import requests

API_KEY = os.getenv("AGENTVERSE_API_KEY")
API_URL = os.getenv("AGENT_LAUNCH_API_URL", "https://agent-launch.ai/api")
FRONTEND_URL = os.getenv("AGENT_LAUNCH_FRONTEND_URL", "https://agent-launch.ai")

response = requests.post(
    f"{API_URL}/tokenize",
    headers={
        "X-API-Key": API_KEY,
        "Content-Type": "application/json"
    },
    json={
        "agentAddress": "agent1qxxxxxxxxxx",
        "name": "My Token",
        "symbol": "MTK",
        "description": "Created by AI",
        "image": "auto",
        "chainId": 97
    }
)

data = response.json()
token_id = data["data"]["id"]
print(f"Handoff link: {FRONTEND_URL}/deploy/{token_id}")
```

### With On-Chain Deploy

```python
from web3 import Web3
from eth_account import Account

# After creating token via API...
token_id = data["data"]["id"]

w3 = Web3(Web3.HTTPProvider(RPC_URL))
acct = Account.from_key(PRIVATE_KEY)

# Approve FET
fet = w3.eth.contract(address=FET_TOKEN, abi=ERC20_ABI)
tx = fet.functions.approve(DEPLOYER, Web3.to_wei(120, 'ether')).build_transaction({
    'from': acct.address,
    'nonce': w3.eth.get_transaction_count(acct.address),
    'gas': 100000,
    'gasPrice': w3.eth.gas_price,
    'chainId': 97
})
receipt = w3.eth.wait_for_transaction_receipt(
    w3.eth.send_raw_transaction(acct.sign_transaction(tx).raw_transaction)
)

# Deploy
deployer = w3.eth.contract(address=DEPLOYER, abi=DEPLOYER_ABI)
tx = deployer.functions.deploy(
    "My Token", "MTK", "", 1, token_id, 0, False
).build_transaction({
    'from': acct.address,
    'nonce': w3.eth.get_transaction_count(acct.address),
    'gas': 5000000,
    'gasPrice': w3.eth.gas_price,
    'chainId': 97
})
receipt = w3.eth.wait_for_transaction_receipt(
    w3.eth.send_raw_transaction(acct.sign_transaction(tx).raw_transaction)
)
```

## Node.js / TypeScript

```typescript
const API_URL = process.env.AGENT_LAUNCH_API_URL ?? 'https://agent-launch.ai/api';
const FRONTEND_URL = process.env.AGENT_LAUNCH_FRONTEND_URL ?? 'https://agent-launch.ai';

const response = await fetch(`${API_URL}/tokenize`, {
  method: 'POST',
  headers: {
    'X-API-Key': process.env.AGENTVERSE_API_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    agentAddress: 'agent1qxxxxxxxxxx',
    name: 'My Token',
    symbol: 'MTK',
    description: 'Created via API',
    image: 'auto',
    chainId: 97
  })
});

const { data } = await response.json();
console.log(`Handoff link: ${FRONTEND_URL}/deploy/${data.id}`);
```

## Shell Script

```bash
#!/bin/bash
AGENT_LAUNCH_API_URL="${AGENT_LAUNCH_API_URL:-https://agent-launch.ai/api}"
AGENT_LAUNCH_FRONTEND_URL="${AGENT_LAUNCH_FRONTEND_URL:-https://agent-launch.ai}"

curl -X POST "$AGENT_LAUNCH_API_URL/tokenize" \
  -H "X-API-Key: $AGENTVERSE_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"agentAddress\": \"$1\",
    \"name\": \"$2\",
    \"symbol\": \"$3\",
    \"description\": \"Created via script\",
    \"image\": \"auto\",
    \"chainId\": 97
  }" | jq '.data.id' | xargs -I{} echo "$AGENT_LAUNCH_FRONTEND_URL/deploy/{}"
```

## Alternative: JWT Auth

If you prefer wallet-based auth instead of API key:

```python
from eth_account import Account
from eth_account.messages import encode_defunct

# Sign message
account = Account.from_key(PRIVATE_KEY)
message = encode_defunct(text="Sign this message to authenticate")
signed = account.sign_message(message)

# Get JWT
res = requests.post(f"{API_URL}/users/login", json={
    "address": account.address,
    "signature": signed.signature.hex(),
})
jwt = res.json()["token"]

# Use JWT in Authorization header
headers = {"Authorization": f"Bearer {jwt}"}
```

## On-Chain ABIs

```json
// ERC20
[
  {"name":"approve","inputs":[{"name":"spender","type":"address"},{"name":"amount","type":"uint256"}],"outputs":[{"type":"bool"}],"type":"function"},
  {"name":"balanceOf","inputs":[{"name":"account","type":"address"}],"outputs":[{"type":"uint256"}],"type":"function"}
]

// Deployer
[
  {"name":"deploy","inputs":[{"name":"_name","type":"string"},{"name":"_ticker","type":"string"},{"name":"_picture","type":"string"},{"name":"_maxWalletAmount","type":"uint256"},{"name":"_tokenId","type":"uint256"},{"name":"_buyAmount","type":"uint256"},{"name":"_buy","type":"bool"}],"outputs":[],"type":"function"}
]
```

## Platform Constants

```
FET Token:    0x74F804B4140ee70830B3Eef4e690325841575F89
Deploy Fee:   120 FET
Graduation:   30,000 FET → auto DEX listing
```

## Validation Checklist

- [ ] API key works: `curl -H "X-API-Key: $KEY" $AGENT_LAUNCH_API_URL/agents/tokens`
- [ ] Token created: POST returns id
- [ ] Handoff link works: `/deploy/{id}` loads page
- [ ] (Optional) On-chain deploy succeeds
- [ ] Token appears on platform
