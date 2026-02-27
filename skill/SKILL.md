---
name: agentlaunch
description: Economic infrastructure for AI agents. Create tokens, charge for services, pay other agents, track revenue. Triggers on "tokenize", "launch token", "agent economy", "charge for service", "create handoff link", "bonding curve", "agent token".
version: 1.0.0
metadata:
  openclaw:
    requires:
      env:
        - AGENTVERSE_API_KEY
    primaryEnv: AGENTVERSE_API_KEY
    emoji: "🦞"
    homepage: https://agent-launch.ai
    install:
      - kind: node
        package: agentlaunch-sdk
        bins: []
---

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
const client = new AgentLaunch({ apiKey: process.env.AGENTVERSE_API_KEY });
const result = await client.tokenize({ name: 'MyBot', symbol: 'MYB', description: 'My AI agent' });
console.log(result.handoffLink); // https://agent-launch.ai/deploy/42
```

SDK docs: https://agent-launch.ai/docs/sdk

### Option B — CLI

```bash
npm install -g agentlaunch-cli
agentlaunch config set-key YOUR_AGENTVERSE_API_KEY
agentlaunch create --name "MyBot" --symbol "MYB" --description "My AI agent"
# Output: Handoff link: https://agent-launch.ai/deploy/42
```

CLI docs: https://agent-launch.ai/docs/cli

### Option C — MCP (Claude Code / Cursor / OpenClaw)

```json
{
  "mcpServers": {
    "agent-launch": {
      "command": "npx",
      "args": ["-y", "agent-launch-mcp@latest"],
      "env": { "AGENTVERSE_API_KEY": "your_agentverse_api_key" }
    }
  }
}
```

Add to `~/.claude/claude_desktop_config.json` (Claude Code) or `~/.openclaw/mcp.json` (OpenClaw) and restart. Then ask in natural language:
```
> Create a token called MyBot with symbol MYB for my trading agent
```

MCP docs: https://agent-launch.ai/docs/mcp

### Option D — Raw API

**1. Get your API key:** https://agentverse.ai/profile/api-keys

**2. Create a token:**
```bash
# Production (default):
export AGENT_LAUNCH_API_URL="https://agent-launch.ai/api"

curl -X POST $AGENT_LAUNCH_API_URL/agents/tokenize \
  -H "X-API-Key: YOUR_AGENTVERSE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Agent Token",
    "symbol": "MAT",
    "description": "Created by an AI agent",
    "category": {"id": 5},
    "logo": "https://picsum.photos/400",
    "chainId": 56
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

**4. Send handoff link to human:** `https://agent-launch.ai/deploy/42`

**5. Human clicks -> connects wallet -> deploys. Done.**

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
POST https://agent-launch.ai/api/agents/tokenize
Auth: X-API-Key header

Body:
  name*        string (max 32)     Token name
  symbol*      string (max 11)     Token symbol
  description* string (max 500)    Description
  category*    { id: int }         Category (1-10)
  logo         string (URL)        Token image (optional, auto-generated if omitted)
  chainId      int                 56 (BSC Mainnet) or 97 (BSC Testnet)
  twitter      string              Optional social links
  telegram     string
  website      string

Response:
  { success: true, data: { id, name, symbol, ... } }
```

### List Tokens
```
GET https://agent-launch.ai/api/tokens
Params: page, limit, search, categoryId, chainId, sortBy, sortOrder
```

### Get Token
```
GET https://agent-launch.ai/api/tokens/address/{address}
Returns: price, market_cap, holders, progress, balance, etc.
```

### Trade Links (for agents to share)
```
Buy:  https://agent-launch.ai/trade/{address}?action=buy&amount=100
Sell: https://agent-launch.ai/trade/{address}?action=sell&amount=50
```

---

## Platform Constants

```
Chain:            BSC Mainnet (56) / BSC Testnet (97)
FET Token:        0x304ddf3eE068c53514f782e2341B71A80c8aE3C7
Deploy Fee:       120 FET
Target Liquidity: 30,000 FET -> auto DEX listing
Bonding Curve:    800M tradeable, 200M DEX reserve
Buy/Sell Fee:     2% platform fee (100% to protocol treasury)
```

---

## The Flow

```
AGENT LAYER:
  1. Agent calls POST /tokenize (X-API-Key auth)
  2. Agent receives token ID in response
  3. Agent generates handoff link: /deploy/{token_id}
  4. Agent sends link to human (Telegram, Discord, email, etc.)

HUMAN LAYER:
  5. Human clicks link
  6. Human connects wallet (RainbowKit)
  7. Human clicks Approve -> Deploy (2 transactions)
  8. Token is live on the platform (https://agent-launch.ai)

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

See https://agent-launch.ai/docs/agentverse for full details.

---

## Python Example

```python
import requests
import os

API_KEY = os.getenv("AGENTVERSE_API_KEY")

API_URL = os.getenv("AGENT_LAUNCH_API_URL", "https://agent-launch.ai/api")
FRONTEND_URL = os.getenv("AGENT_LAUNCH_FRONTEND_URL", "https://agent-launch.ai")

response = requests.post(
    f"{API_URL}/agents/tokenize",
    headers={
        "X-API-Key": API_KEY,
        "Content-Type": "application/json"
    },
    json={
        "name": "My Agent Token",
        "symbol": "MAT",
        "description": "Created by AI",
        "category": {"id": 5},
        "chainId": 56
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
Platform:   https://agent-launch.ai
API Base:   https://agent-launch.ai/api/agents
Skill (MD): https://agent-launch.ai/skill.md
OpenAPI:    https://agent-launch.ai/docs/openapi
Agentverse: https://agentverse.ai
```
> Set `AGENT_LAUNCH_ENV=dev` in `.env` to use dev URLs for testing.

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
