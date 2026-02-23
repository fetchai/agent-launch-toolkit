# Agentverse API Guide

How to programmatically deploy agents to Agentverse.

## Authentication

All requests require the `Authorization` header:
```
Authorization: bearer YOUR_AGENTVERSE_API_KEY
```

Get your API key at: https://agentverse.ai/profile/api-keys

## API Base URL

```
https://agentverse.ai/v1
```

## Endpoints

### List Agents
```bash
GET /hosting/agents
```

Response:
```json
{
  "items": [
    {
      "name": "My Agent",
      "address": "agent1q...",
      "running": true,
      "compiled": true,
      "wallet_address": "fetch1..."
    }
  ]
}
```

### Create Agent
```bash
POST /hosting/agents
Content-Type: application/json

{"name": "My Agent Name"}
```

Response:
```json
{
  "name": "My Agent Name",
  "address": "agent1q...",
  "running": false,
  "compiled": false
}
```

### Upload Code

**CRITICAL FORMAT**: The `code` field must be a JSON STRING containing an array of file objects. This is double-encoded JSON.

```bash
PUT /hosting/agents/{address}/code
Content-Type: application/json

{
  "code": "[{\"language\": \"python\", \"name\": \"agent.py\", \"value\": \"from uagents import Agent\\nagent = Agent()\\n...\"}]"
}
```

In Python:
```python
import json

code = "from uagents import Agent\nagent = Agent()\n..."

code_array = [{
    "language": "python",
    "name": "agent.py",
    "value": code,
}]

# Double-encode: the code field is a JSON string containing JSON
payload = {"code": json.dumps(code_array)}

requests.put(f"{API}/hosting/agents/{addr}/code", json=payload, headers=headers)
```

Response:
```json
{
  "digest": "6abba9f985fac0d026c32259e8c9074d3c07470d8a5a954dc1851d47a67e8345"
}
```

### Set Secret
```bash
POST /hosting/secrets
Content-Type: application/json

{
  "address": "agent1q...",
  "name": "AGENTVERSE_API_KEY",
  "secret": "your-secret-value"
}
```

### List Secrets
```bash
GET /hosting/secrets?address=agent1q...
```

### Start Agent
```bash
POST /hosting/agents/{address}/start
```

### Stop Agent
```bash
POST /hosting/agents/{address}/stop
```

### Get Agent Status
```bash
GET /hosting/agents/{address}
```

Response:
```json
{
  "name": "My Agent",
  "address": "agent1q...",
  "running": true,
  "compiled": true,
  "code_digest": "6abba9f...",
  "wallet_address": "fetch1...",
  "revision": 2
}
```

## Complete Deployment Flow

```python
import json
import time
import requests

API = "https://agentverse.ai/v1"
headers = {"Authorization": f"bearer {api_key}", "Content-Type": "application/json"}

# 1. Create agent
res = requests.post(f"{API}/hosting/agents", headers=headers, json={"name": "My Agent"})
agent_addr = res.json()["address"]

# 2. Upload code (MUST use this format)
code_array = [{"language": "python", "name": "agent.py", "value": my_code}]
requests.put(
    f"{API}/hosting/agents/{agent_addr}/code",
    headers=headers,
    json={"code": json.dumps(code_array)},  # Double-encoded!
)

# 3. Set secrets
requests.post(
    f"{API}/hosting/secrets",
    headers=headers,
    json={"address": agent_addr, "name": "MY_SECRET", "secret": "value"},
)

# 4. Start agent
requests.post(f"{API}/hosting/agents/{agent_addr}/start", headers=headers)

# 5. Wait for compilation
for _ in range(12):
    time.sleep(5)
    res = requests.get(f"{API}/hosting/agents/{agent_addr}", headers=headers)
    if res.json().get("compiled"):
        print("Agent compiled and running!")
        break
```

## Common Issues

### "Invalid code format: code must be a valid JSON string"

The `code` field must be a JSON string, not a JSON object. Use `json.dumps()` twice:

```python
# WRONG
payload = {"code": [{"language": "python", "name": "agent.py", "value": code}]}

# CORRECT
code_array = [{"language": "python", "name": "agent.py", "value": code}]
payload = {"code": json.dumps(code_array)}
```

### Agent `compiled: false` after starting

- Wait at least 15-60 seconds for compilation
- Check for syntax errors in your code
- Use `datetime.now()` not `datetime.utcnow()` (deprecated)
- Include the `@chat_proto.on_message(ChatAcknowledgement)` handler
- Ensure all imports are available in the Agentverse environment

### Available Packages

Agentverse hosted agents have these packages available:
- `uagents`
- `uagents_core`
- `requests`
- `openai`
- Standard library

## Quick Deploy Script

```bash
python docs/agents/deploy-to-agentverse.py YOUR_API_KEY
```

Or with custom name:
```bash
python docs/agents/deploy-to-agentverse.py YOUR_API_KEY "My Custom Agent"
```
