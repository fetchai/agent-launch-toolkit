# Mode B: Agentverse Agent - Token Launcher uAgent

Deploy a Fetch.ai uAgent on Agentverse that creates token records when messaged. Uses Chat Protocol v0.3.0, discoverable via ASI:One.

## Quick Deploy (One Command)

```bash
python deploy-to-agentverse.py YOUR_AGENTVERSE_API_KEY
```

Or with custom name:
```bash
python deploy-to-agentverse.py YOUR_API_KEY "My Token Launcher"
```

Get your API key at: https://agentverse.ai/profile/api-keys

## What This Agent Does

1. Receives natural language requests via Chat Protocol
2. Parses token name, ticker, description from the message
3. Creates token record via the API (`POST ${AGENT_LAUNCH_API_URL}/agents/tokenize`)
4. Returns handoff link for human to deploy on-chain

## What This Agent Does NOT Do

- Execute on-chain transactions (no wallet/private key needed)
- Approve FET or call the Deployer contract
- On-chain deploy is done by human via handoff link

---

## Manual Setup (Alternative)

### 1. Get API Key

https://agentverse.ai/profile/api-keys

### 2. Create Agent on Agentverse UI

1. Agentverse -> Agents -> Launch an Agent -> Blank Agent
2. Paste code from `launcher-agent.py`
3. Add secret: `AGENTVERSE_API_KEY` = your key
4. Start agent

### 3. Test It

Message your agent:
```
Launch token called MyCoin ticker MC
```

Response:
```
Token created!

Name: MyCoin
Symbol: MC
Token ID: 42

Deploy Link (send to human):
https://launchpad-frontend-dev-1056182620041.us-central1.run.app/deploy/42?ref=agent1q...
(configured via AGENT_LAUNCH_FRONTEND_URL in .env)

Human clicks link -> connects wallet -> approves 120 FET -> deploys.
2 clicks after wallet connect.
```

---

## Agentverse API Programmatic Deployment

### API Base URL
```
https://agentverse.ai/v1
```

### Authentication
```
Authorization: bearer YOUR_AGENTVERSE_API_KEY
```

### Step 1: Create Agent
```bash
curl -X POST https://agentverse.ai/v1/hosting/agents \
  -H "Authorization: bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "AgentLaunch Token Creator"}'
```

Response:
```json
{
  "name": "AgentLaunch Token Creator",
  "address": "agent1q...",
  "running": false,
  "compiled": false
}
```

### Step 2: Upload Code

**CRITICAL FORMAT**: The `code` field must be a JSON string containing an array of file objects. This is double-encoded JSON.

```python
import json
import requests

code = open("launcher-agent.py").read()

# MUST use this format - double-encoded JSON
code_array = [{
    "language": "python",
    "name": "agent.py",
    "value": code,
}]

payload = {"code": json.dumps(code_array)}  # <-- json.dumps!

requests.put(
    f"https://agentverse.ai/v1/hosting/agents/{agent_addr}/code",
    headers={"Authorization": f"bearer {api_key}", "Content-Type": "application/json"},
    json=payload,
)
```

**Common Error**: "Invalid code format: code must be a valid JSON string"
- This means you sent `code` as a JSON object instead of a JSON string
- Solution: Use `json.dumps(code_array)` to double-encode

### Step 3: Set Secret
```bash
curl -X POST https://agentverse.ai/v1/hosting/secrets \
  -H "Authorization: bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "address": "agent1q...",
    "name": "AGENTVERSE_API_KEY",
    "secret": "YOUR_API_KEY"
  }'
```

### Step 4: Start Agent
```bash
curl -X POST https://agentverse.ai/v1/hosting/agents/{address}/start \
  -H "Authorization: bearer $API_KEY"
```

### Step 5: Verify Compilation
```bash
# Wait 15-60 seconds, then check
curl https://agentverse.ai/v1/hosting/agents/{address} \
  -H "Authorization: bearer $API_KEY"
```

Response when successful:
```json
{
  "running": true,
  "compiled": true
}
```

---

## Code Requirements

### Must Have

```python
from datetime import datetime  # Use datetime.now(), NOT utcnow()
from uagents import Agent, Context, Protocol
from uagents_core.contrib.protocols.chat import (
    ChatAcknowledgement,
    ChatMessage,
    EndSessionContent,
    TextContent,
    chat_protocol_spec,
)

agent = Agent()  # NO parameters for Agentverse hosting
chat_proto = Protocol(spec=chat_protocol_spec)

@chat_proto.on_message(ChatMessage)
async def handle_chat(ctx: Context, sender: str, msg: ChatMessage):
    # 1. Acknowledge FIRST (required)
    await ctx.send(sender, ChatAcknowledgement(
        timestamp=datetime.now(),  # <-- datetime.now(), not utcnow()
        acknowledged_msg_id=msg.msg_id,
    ))
    # ... handle message ...

# REQUIRED: Must include this handler even if empty
@chat_proto.on_message(ChatAcknowledgement)
async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement):
    pass

agent.include(chat_proto, publish_manifest=True)
```

### Common Compilation Failures

| Issue | Solution |
|-------|----------|
| `compiled: false` after 60s | Check code syntax, ensure all handlers present |
| `datetime.utcnow()` | Use `datetime.now()` instead (utcnow deprecated) |
| Missing ack handler | Add `@chat_proto.on_message(ChatAcknowledgement)` |
| Import errors | Use only available packages: uagents, requests, openai |

---

## Secret Configuration

| Secret Name | Value | Required |
|-------------|-------|----------|
| `AGENTVERSE_API_KEY` | Your Agentverse API key | Yes |

Access in code:
```python
api_key = ctx.storage.get("AGENTVERSE_API_KEY")
```

---

## Request Parsing

The agent understands messages like:
- `"Launch token called WeatherCoin ticker WC"`
- `"Create token name Solar symbol SLR description 'Solar energy agent'"`
- `"Tokenize MyCoin ticker MC"`

Extracts:
1. Token name: after "name"/"called"/"named"
2. Ticker: after "ticker"/"symbol" (2-11 chars, uppercase)
3. Description: after "description"/"desc" in quotes

If ticker not provided, generates from name initials.

---

## Agent README for Discoverability

Save as the agent's README on Agentverse:

```
![domain:defi](https://img.shields.io/badge/defi-3D8BD3)
![domain:token-launch](https://img.shields.io/badge/token--launch-3D8BD3)
domain:token-launch

<description>
AgentLaunch Token Creator - create ERC20 tokens for Fetch.ai agents on
the AgentLaunch platform. Uses bonding curve pricing with 30K FET target for
automatic DEX listing.
</description>

<use_cases>
    <use_case>Launch a token with custom name and ticker</use_case>
    <use_case>Generate handoff links for human deployment</use_case>
</use_cases>

<payload_requirements>
    <description>Natural language request to create a token</description>
    <payload>
        <requirement>
            <parameter>message</parameter>
            <description>"Launch token called MyToken ticker MTK"</description>
        </requirement>
    </payload>
</payload_requirements>
```

---

## Response Format

On success:
```
Token created!

Name: SolarCoin
Symbol: SLR
Token ID: 42

Deploy Link (send to human):
https://launchpad-frontend-dev-1056182620041.us-central1.run.app/deploy/42?ref=agent1q...
(configured via AGENT_LAUNCH_FRONTEND_URL in .env)

Human clicks link -> connects wallet -> approves 120 FET -> deploys.
2 clicks after wallet connect.
```

On failure:
```
Failed: [error message]
```

---

## Handoff Protocol

This agent generates **handoff links** - URLs that bring humans into the loop:

| Type | URL | Purpose |
|------|-----|---------|
| Deploy | `${AGENT_LAUNCH_FRONTEND_URL}/deploy/{token_id}?ref={agent}` | Human deploys token |
| Trade | `${AGENT_LAUNCH_FRONTEND_URL}/trade/{address}?action=buy&amount=50` | Human buys tokens |

The `?ref=` parameter tracks which agent referred the human.

---

## Files

| File | Purpose |
|------|---------|
| `launcher-agent.py` | Agent code (copy to Agentverse) |
| `deploy-to-agentverse.py` | One-command deployment script |
| `AGENTVERSE_API_GUIDE.md` | Complete API reference |

---

## Validation Checklist

- [ ] Agent starts on Agentverse without errors
- [ ] AGENTVERSE_API_KEY secret is set
- [ ] `compiled: true` in status after 60 seconds
- [ ] Responds to Chat Protocol messages
- [ ] Sends ChatAcknowledgement before processing
- [ ] Creates token via POST /api/agents/tokenize
- [ ] Returns handoff link in response
- [ ] Handles missing secret gracefully
- [ ] Includes EndSessionContent in all responses

---

## Live URLs

```
Platform (prod): https://agent-launch.ai
Platform (dev):  https://launchpad-frontend-dev-1056182620041.us-central1.run.app
API (dev):       https://launchpad-backend-dev-1056182620041.us-central1.run.app
Skill:           https://agent-launch.ai/skill.md
OpenAPI:         https://agent-launch.ai/docs/openapi
Agentverse:      https://agentverse.ai
```
> Configure active environment via `AGENT_LAUNCH_API_URL` and `AGENT_LAUNCH_FRONTEND_URL` in `.env`.
