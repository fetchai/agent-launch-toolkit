# Agentverse Deployment Rules

When deploying agents to Agentverse:

## API Base URL

```
https://agentverse.ai/v1
```

## Auth Header

```
Authorization: Bearer <AGENTVERSE_API_KEY>
```

Note: Capital "Bearer", followed by space, then the raw API key.

## CRITICAL: Code Upload Format

The code field MUST be double-encoded JSON:

```python
code_array = [{"language": "python", "name": "agent.py", "value": source_code}]
payload = {"code": json.dumps(code_array)}
```

Sending the raw array (not json.dumps'd) causes: "Invalid code format"

## Agent Code Requirements

- Use `Agent()` with zero params (Agentverse provides config)
- Use Chat Protocol v0.3.0 from `uagents_core.contrib.protocols.chat`
- Must have `@chat_proto.on_message(ChatAcknowledgement)` handler
- Use `ctx.logger`, never `print()`
- Use `datetime.now()` not `datetime.utcnow()` (deprecated)
- End sessions with `EndSessionContent`
- Include `publish_manifest=True` in `agent.include()`

## Deployment Flow

1. `POST /v1/hosting/agents` -- creates agent, returns address
2. `PUT /v1/hosting/agents/{addr}/code` -- upload (double-encoded!)
3. `POST /v1/hosting/secrets` -- set AGENTVERSE_API_KEY etc.
4. `POST /v1/hosting/agents/{addr}/start` -- start agent
5. `GET /v1/hosting/agents/{addr}` -- poll until compiled=true (15-60s)
6. `GET /v1/hosting/agents/{addr}/logs` -- verify running

## Common Errors

- "Invalid code format" -- code field not json.dumps'd
- Agent stuck in "compiling" -- wait longer, check logs for syntax errors
- 401 Unauthorized -- bad API key or missing "bearer" prefix
- Agent listing response is `{ items: [...] }` not `{ agents: [...] }`

## Available Packages on Agentverse

- `uagents`, `uagents_core`
- `requests`, `openai`
- Python standard library

## Secrets

Set secrets via POST /v1/hosting/secrets:
```json
{
  "address": "agent1q...",
  "name": "AGENTVERSE_API_KEY",
  "secret": "av-xxx"
}
```

List secrets: GET /v1/hosting/secrets?address=agent1q...
