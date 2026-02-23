# AgentLaunch Skill

> **One API Key. One Command. Token Launched.**
>
> AI agents create tokens, generate handoff links, humans sign. Both benefit from the token economy.

---

## Quick Start (30 seconds)

### Option A — TypeScript SDK (easiest)

```bash
npm install agentlaunch-sdk
```

```typescript
import { AgentLaunch } from 'agentlaunch-sdk';
const client = new AgentLaunch({ apiKey: process.env.AGENT_LAUNCH_API_KEY });
const result = await client.tokenize({ name: 'MyBot', symbol: 'MYB', description: 'My AI agent' });
console.log(result.handoffLink); // ${AGENT_LAUNCH_FRONTEND_URL}/deploy/42
// Dev: https://launchpad-frontend-dev-1056182620041.us-central1.run.app/deploy/42
```

SDK docs: https://agent-launch.ai/docs/sdk

### Option B — CLI

```bash
npm install -g agentlaunch-cli
agentlaunch config set-key YOUR_AGENTVERSE_API_KEY
agentlaunch create --name "MyBot" --symbol "MYB" --description "My AI agent"
# Output: Handoff link: ${AGENT_LAUNCH_FRONTEND_URL}/deploy/42
# Dev:    https://launchpad-frontend-dev-1056182620041.us-central1.run.app/deploy/42
```

CLI docs: https://agent-launch.ai/docs/cli

### Option C — MCP (Claude Code / Cursor)

```json
{
  "mcpServers": {
    "agent-launch": {
      "command": "npx",
      "args": ["-y", "agent-launch-mcp@latest"],
      "env": { "AGENT_LAUNCH_API_KEY": "your_agentverse_api_key" }
    }
  }
}
```

Add to `~/.claude/claude_desktop_config.json` and restart Claude Code. Then ask in natural language:
```
> Create a token called MyBot with symbol MYB for my trading agent
```

MCP docs: https://agent-launch.ai/docs/mcp

### Option D — Raw API

**1. Get your API key:** https://agentverse.ai/profile/api-keys

**2. Create a token:**
```bash
# Set API URL from .env (dev default shown):
export AGENT_LAUNCH_API_URL="https://launchpad-backend-dev-1056182620041.us-central1.run.app"

curl -X POST $AGENT_LAUNCH_API_URL/agents/launch \
  -H "X-API-Key: YOUR_AGENTVERSE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Agent Token",
    "symbol": "MAT",
    "description": "Created by an AI agent",
    "category": {"id": 5},
    "logo": "https://picsum.photos/400",
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
    "symbol": "MAT"
  }
}
```

**4. Send handoff link to human:** `${AGENT_LAUNCH_FRONTEND_URL}/deploy/42`
   Dev example: `https://launchpad-frontend-dev-1056182620041.us-central1.run.app/deploy/42`

**5. Human clicks -> connects wallet -> deploys. Done.**

---

## Skill Metadata

```yaml
name: agentlaunch
version: 2.1.0
description: Create, manage, and trade AI agent tokens
author: Fetch.ai / ASI Alliance
protocol: MCP (Model Context Protocol)
endpoint: https://agent-launch.ai
```

---

## Authentication

### API Key (Recommended for Agents)

```
Header: X-API-Key: YOUR_AGENTVERSE_API_KEY
```

Get your API key at: https://agentverse.ai/profile/api-keys

No wallet signature needed. Your Agentverse API key is validated against the Agentverse API.

### JWT (Alternative for Wallet Users)

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
POST ${AGENT_LAUNCH_API_URL}/agents/launch
# Dev: https://launchpad-backend-dev-1056182620041.us-central1.run.app/agents/launch
Auth: X-API-Key header

Body:
  name*        string (max 32)     Token name
  symbol*      string (max 11)     Token symbol
  description* string (max 500)    Description
  category*    { id: int }         Category (1-10)
  logo         string (URL)        Token image (optional, auto-generated if omitted)
  chainId      int                 97 (BSC Testnet) or 56 (BSC Mainnet)
  twitter      string              Optional social links
  telegram     string
  website      string

Response:
  { success: true, data: { id, name, symbol, ... } }
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

### Trade Links (for agents to share)
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
Buy/Sell Fee:     2% platform fee (100% to protocol treasury)
```

---

## The Flow

```
AGENT LAYER:
  1. Agent calls POST /api/agents/launch (X-API-Key auth)
  2. Agent receives token ID in response
  3. Agent generates handoff link: /deploy/{token_id}
  4. Agent sends link to human (Telegram, Discord, email, etc.)

HUMAN LAYER:
  5. Human clicks link
  6. Human connects wallet (RainbowKit)
  7. Human clicks Approve -> Deploy (2 transactions)
  8. Token is live on the platform (${AGENT_LAUNCH_FRONTEND_URL})

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

**What it does:**
1. Creates agent on Agentverse
2. Uploads Token Launcher code
3. Sets AGENTVERSE_API_KEY secret
4. Starts agent and waits for compilation

**Test your agent:**
```
Message: "Launch token called MyCoin ticker MC"
Response: Handoff link to deploy
```

**CRITICAL - Code format for Agentverse API:**
The `code` field must be double-encoded JSON:
```python
import json
code_array = [{"language": "python", "name": "agent.py", "value": code}]
payload = {"code": json.dumps(code_array)}  # <-- json.dumps required!
```

See https://agent-launch.ai/docs/agentverse for full details (production docs).

---

## Python Example

```python
import requests
import os

API_KEY = os.getenv("AGENTVERSE_API_KEY")

API_URL = os.getenv("AGENT_LAUNCH_API_URL", "https://launchpad-backend-dev-1056182620041.us-central1.run.app")
FRONTEND_URL = os.getenv("AGENT_LAUNCH_FRONTEND_URL", "https://launchpad-frontend-dev-1056182620041.us-central1.run.app")

response = requests.post(
    f"{API_URL}/agents/launch",
    headers={
        "X-API-Key": API_KEY,
        "Content-Type": "application/json"
    },
    json={
        "name": "My Agent Token",
        "symbol": "MAT",
        "description": "Created by AI",
        "category": {"id": 5},
        "chainId": 97
    }
)

data = response.json()
token_id = data["data"]["id"]
print(f"Handoff link: {FRONTEND_URL}/deploy/{token_id}")
```

---

## Categories

| ID | Name |
|----|------|
| 1 | DeFi |
| 2 | Gaming |
| 3 | Social |
| 4 | Infrastructure |
| 5 | AI/ML |
| 6 | NFT |
| 7 | DAO |
| 8 | Metaverse |
| 9 | Privacy |
| 10 | Other |

---

## Error Handling

| HTTP Code | Meaning | Action |
|-----------|---------|--------|
| 400 | Validation error | Check required fields |
| 401 | Invalid API key | Check key at agentverse.ai/profile/api-keys |
| 404 | Not found | Verify token address/ID |
| 409 | Duplicate | Token name/symbol already exists |
| 500 | Server error | Retry with exponential backoff |

---

## Live URLs

```
Platform (prod):  https://agent-launch.ai
Platform (dev):   https://launchpad-frontend-dev-1056182620041.us-central1.run.app
API Base (prod):  https://agent-launch.ai/api/agents
API Base (dev):   https://launchpad-backend-dev-1056182620041.us-central1.run.app/agents
Skill (MD):       https://agent-launch.ai/skill.md
OpenAPI:          https://agent-launch.ai/docs/openapi
Agentverse:       https://agentverse.ai
```
> Active URLs configured via `AGENT_LAUNCH_API_URL` and `AGENT_LAUNCH_FRONTEND_URL` in `.env`.

---

## Documentation

| Page | Purpose |
|------|---------|
| https://agent-launch.ai/docs/quickstart | Quick start guide — SDK, CLI, or MCP in 5 minutes |
| https://agent-launch.ai/docs/sdk | TypeScript SDK reference |
| https://agent-launch.ai/docs/cli | CLI tool command reference |
| https://agent-launch.ai/docs/mcp | MCP server — 19+ tools for Claude Code / Cursor |
| https://agent-launch.ai/docs/templates | Agent templates (price-monitor, trading-bot, etc.) |
| https://agent-launch.ai/docs/for-agents | REST API reference with code examples |
| https://agent-launch.ai/docs/agentverse | Deploy uAgent to Agentverse |
| https://agent-launch.ai/docs/token-economics | Bonding curve math |
| https://agent-launch.ai/docs/handoff | Agent-human handoff protocol |
| https://agent-launch.ai/docs/errors | Error codes and retry strategies |
| https://agent-launch.ai/docs/scripts | Ready-to-run Python scripts |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 3.0.0 | 2026-02 | TypeScript SDK, CLI, MCP v2.0 with 19+ tools, agent templates |
| 2.1.0 | 2026-02 | Agentverse deployment guide, documented code format |
| 2.0.0 | 2026-02 | API key authentication, auto-generated images |
| 1.0.0 | 2026-02 | Initial release |

---

*This skill is part of the ASI Alliance ecosystem, connecting AI agents with tokenized economies.*
