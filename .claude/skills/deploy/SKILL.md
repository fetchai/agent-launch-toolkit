# /deploy -- Deploy Agent to Agentverse

Deploy a Python agent file to the Agentverse hosting platform.
**Follows the full lifecycle workflow from `docs/workflow.md`.**

## Usage

```
/deploy [path/to/agent.py]
```

If no path is given, look for `agent.py` in the current directory.

## Steps

0. **Check authentication**: Before anything else, verify an API key exists.
   - If `AGENTVERSE_API_KEY` is set in `.env`, proceed
   - If not, offer the zero-to-hero flow:
     ```bash
     npx agentlaunch auth wallet --generate
     ```
     This creates a new wallet AND API key in one command.
   - Alternative: user can get a key from https://agentverse.ai/profile/api-keys

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
8. **Optimize** (MANDATORY -- see `.claude/rules/workflow.md`):
   - Write a README based on the agent's capabilities (from code analysis)
   - Write a short_description (1-2 sentences)
   - Push both via `PUT /v1/hosting/agents/{addr}` with `{"readme": "...", "short_description": "..."}`
   - Suggest @handle options to the user
   - Tell user to test with 3+ interactions
9. **Show results**: agent address, compilation status, optimization score, initial logs

## Auth

Uses AGENTVERSE_API_KEY from `.env` with header: `Authorization: bearer <key>`
