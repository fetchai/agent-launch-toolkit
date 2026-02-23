# /deploy -- Deploy Agent to Agentverse

Deploy a Python agent file to the Agentverse hosting platform.

## Usage

```
/deploy [path/to/agent.py]
```

If no path is given, look for `agent.py` in the current directory.

## Steps

1. **Read** the agent.py file
2. **Validate** it follows uAgent patterns:
   - Has `Agent()` with zero params
   - Imports Chat Protocol v0.3.0
   - Has `ChatAcknowledgement` handler
   - Uses `ctx.logger` not `print()`
3. **Create agent** on Agentverse via POST /v1/hosting/agents
4. **Upload code** using double-encoded JSON format
5. **Set secrets** from `.env` (AGENTVERSE_API_KEY at minimum)
6. **Start agent** via POST /v1/hosting/agents/{addr}/start
7. **Poll compilation** status (up to 60s)
8. **Show results**: agent address, compilation status, initial logs

## Auth

Uses AGENTVERSE_API_KEY from `.env` with header: `Authorization: bearer <key>`
