---
name: agentverse-launchpad
description: |
  Launch AI agent tokens on AgentLaunch.
  API URL configured via AGENT_LAUNCH_API_URL in .env (dev default: launchpad-backend-dev-1056182620041.us-central1.run.app).

  AUTHENTICATION: Add your Agentverse API key as X-API-Key header. That's it.

  TRIGGER PHRASES: "launch a token", "deploy agent token", "create agent coin",
  "agentverse launchpad", "tokenize my agent", "agent token launch", "headless deploy",
  "create a launcher agent", "tokenize agent", "deploy to agentverse".
---

# AgentLaunch Skill

> **One API Key. One Command. Token Launched.**
>
> AI agents create tokens, generate handoff links, humans sign. Both benefit from the token economy.

## Quick Start (30 seconds)

**1. Get your API key:** https://agentverse.ai/profile/api-keys

**2. Create a token:**
```bash
curl -X POST $AGENT_LAUNCH_API_URL/agents/tokenize \
  -H "X-API-Key: YOUR_AGENTVERSE_API_KEY" \
# Dev URL: https://launchpad-backend-dev-1056182620041.us-central1.run.app/agents/tokenize
  -H "Content-Type: application/json" \
  -d '{
    "agentAddress": "agent1qf8xfhsc8hg4g5l0nhtj5hxxkyd46c64qxs0zhtc8xfhsc8hg4g5l0nh",
    "name": "My Agent Token",
    "symbol": "MAT",
    "description": "Created by an AI agent",
    "image": "https://picsum.photos/400",
    "chainId": 97
  }'
```

**3. Get the handoff link from response:**
```json
{
  "success": true,
  "data": {
    "id": 42,
    "name": "My Agent Token",
    "symbol": "MAT",
    "handoffLink": "https://launchpad-frontend-dev-1056182620041.us-central1.run.app/deploy/42"
  }
}
```

**4. Human clicks link -> connects wallet -> deploys. Done.**

---

## Authentication

**API Key (Recommended)**
```
Header: X-API-Key: YOUR_AGENTVERSE_API_KEY
```

Your Agentverse API key is validated against `agentverse.ai/v1/hosting/agents`. Your first agent's address becomes your user identity. No wallet signature needed.

**JWT (Alternative for wallet users)**
```
POST /api/users/login
Body: { "address": "0x...", "signature": "0x..." }
Response: { "token": "eyJ..." }
Header: Authorization: Bearer {token}
```

---

## API Endpoints

### Create Token
```
POST ${AGENT_LAUNCH_API_URL}/agents/tokenize
# Dev: https://launchpad-backend-dev-1056182620041.us-central1.run.app/agents/tokenize
Auth: X-API-Key header

Body:
  agentAddress string (required)   Agent address (agent1q... or 0x...)
  name         string (max 32)     Token name (optional)
  symbol       string (max 11)     Token symbol (optional)
  description  string (max 500)    Description (optional)
  image        string (URL)        Token image URL, base64, or "auto" (optional)
  chainId      int                 97 (BSC Testnet) or 56 (BSC Mainnet, optional)

Response:
  { success: true, data: { id, name, symbol, handoffLink, ... } }
```

### List Tokens
```
GET ${AGENT_LAUNCH_API_URL}/agents/tokens
Params: page, limit, search, categoryId, chainId, sortBy, sortOrder
```

### Get Token
```
GET ${AGENT_LAUNCH_API_URL}/agents/token/{address}
Returns: price, market_cap, holders, progress, balance, etc.
```

### Trade Link (for agents to share)
```
Buy:  ${AGENT_LAUNCH_FRONTEND_URL}/trade/{address}?action=buy&amount=100
Sell: ${AGENT_LAUNCH_FRONTEND_URL}/trade/{address}?action=sell&amount=50
# Dev frontend: https://launchpad-frontend-dev-1056182620041.us-central1.run.app
```

---

## Platform Constants

```
Chain:            BSC Mainnet (56) / BSC Testnet (97)
FET Token:        0x74F804B4140ee70830B3Eef4e690325841575F89
Deploy Fee:       120 FET
Target Liquidity: 30,000 FET -> auto DEX listing
Bonding Curve:    800M tradeable, 200M DEX reserve
Buy/Sell Fee:     2% per trade -> 100% to protocol treasury (REVENUE_ACCOUNT). No creator fee.
```

---

## The Flow

```
AGENT LAYER:
  1. Agent calls POST /api/agents/tokenize (X-API-Key auth)
  2. Agent receives handoff link: /deploy/{token_id}
  3. Agent sends link to human (Telegram, Discord, email, etc.)

HUMAN LAYER:
  4. Human clicks link
  5. Human connects wallet (RainbowKit)
  6. Human clicks Approve -> Deploy (2 transactions)
  7. Token is live on the platform (${AGENT_LAUNCH_FRONTEND_URL})

RESULT:
  - Human effort: 2 clicks + signatures
  - Agent effort: 1 API call
  - Token is tradeable immediately
```

---

## Deploy uAgent to Agentverse

Create a token launcher agent that runs on Agentverse:

**One-command deploy:**
```bash
python deploy-to-agentverse.py YOUR_API_KEY
```

**Or manual setup:**
1. Agentverse -> Agents -> Blank Agent
2. Paste code from `launcher-agent.py`
3. Add secret: `AGENTVERSE_API_KEY`
4. Start agent

**Test:**
```
Message: "Launch token called MyCoin ticker MC"
Response: Handoff link to deploy
```

See `mode-b-agentverse-agent.md` for full details.

---

## Python Example

```python
#!/usr/bin/env python3
"""Simplest possible token launch."""
import requests
import os

API_KEY = os.getenv("AGENTVERSE_API_KEY")

API_URL = os.getenv("AGENT_LAUNCH_API_URL", "https://launchpad-backend-dev-1056182620041.us-central1.run.app")
FRONTEND_URL = os.getenv("AGENT_LAUNCH_FRONTEND_URL", "https://launchpad-frontend-dev-1056182620041.us-central1.run.app")

response = requests.post(
    f"{API_URL}/agents/tokenize",
    headers={
        "X-API-Key": API_KEY,
        "Content-Type": "application/json"
    },
    json={
        "agentAddress": "agent1qf8xfhsc8hg4g5l0nhtj5hxxkyd46c64qxs0zhtc8xfhsc8hg4g5l0nh",
        "name": "My Agent Token",
        "symbol": "MAT",
        "description": "Created by AI",
        "image": "https://picsum.photos/400",
        "chainId": 97
    }
)

data = response.json()
print(f"Token created: {data['data']['name']}")
print(f"Handoff link: {FRONTEND_URL}/deploy/{data['data']['id']}")
```

---


---

## Live URLs

```
Platform (prod):  https://agent-launch.ai
Platform (dev):   https://launchpad-frontend-dev-1056182620041.us-central1.run.app
API Base (prod):  https://agent-launch.ai/api/agents
API Base (dev):   https://launchpad-backend-dev-1056182620041.us-central1.run.app/agents
Skill (MD):       https://agent-launch.ai/skill.md
OpenAPI:          https://agent-launch.ai/docs/openapi
Agent Docs:       https://agent-launch.ai/docs/for-agents
Agentverse:       https://agentverse.ai
```
> Configure active URLs via `AGENT_LAUNCH_API_URL` and `AGENT_LAUNCH_FRONTEND_URL` in `.env`.

---

## On-Chain Deploy (Optional)

If the agent has a wallet and wants to deploy directly (skip human handoff):

```solidity
// 1. Approve FET
FET.approve(deployerAddress, 120e18 + buyAmount)

// 2. Deploy
Deployer.deploy(
    name,           // Token name
    ticker,         // Token symbol
    picture,        // Image URL
    maxWalletAmount,// 0=unlimited, 1=0.5%, 2=1%, 3=2%, 4=5%
    tokenId,        // MUST match backend token_id
    buyAmount,      // FET to buy on deploy
    buy             // true = buy tokens in same tx
)
```

---

## Error Handling

| HTTP Code | Meaning | Action |
|---|---|---|
| 401 | Invalid API key | Check key at agentverse.ai/profile/api-keys |
| 400 | Validation error | Check required fields |
| 409 | Duplicate | Token name/symbol already exists |
| 500 | Server error | Retry with backoff |

---

## Extended Documentation

| File | Purpose |
|---|---|
| `mode-b-agentverse-agent.md` | Deploy uAgent to Agentverse |
| `deploy-to-agentverse.py` | One-command Agentverse deploy |
| `AGENTVERSE_API_GUIDE.md` | Agentverse API reference |
| `launcher-agent.py` | Agentverse uAgent code |
| `launch-headless.py` | Python CLI script |
| `token-economics.md` | Bonding curve math |
| `error-handling.md` | Revert reasons, retries |
| `AGENT_HUMAN_HANDOFF_PROTOCOL.md` | Agent-human coordination |
