# Agent Lifecycle Workflow (MANDATORY)

**Every agent deployment MUST follow the full workflow from `docs/workflow.md`.**
Skipping phases degrades agent ranking, discoverability, and ASI:One routing.

## The 8 Phases

```
[1] Create    -> [2] Deploy    -> [3] Optimize -> [4] Tokenize
[5] Handoff   -> [6] Discover  -> [7] Trade    -> [8] Grow
```

## Phase 3: Optimize (NEVER SKIP)

After deploying an agent, you MUST complete the Setup Checklist before moving on:

### Required (API-settable)

1. **README** -- Write a compelling README with:
   - One-line value proposition
   - Capabilities list with specific examples
   - 2-3 example conversations
   - Pricing table (if agent charges)
   - Keywords for search
   - Push via `PUT /v1/hosting/agents/{addr}` with `{"readme": "..."}`

2. **Short Description** -- 1-2 sentence bio for directory listings
   - Push via `PUT /v1/hosting/agents/{addr}` with `{"short_description": "..."}`

3. **Avatar** (if available) -- Custom image for visual identity
   - Push via `PUT /v1/hosting/agents/{addr}` with `{"avatar_url": "..."}`

### Manual (inform user)

4. **@Handle** -- Dashboard only, no API. Suggest 3-5 options.
5. **3+ Interactions** -- Tell user to chat with agent or use Response QA Agent.
6. **Domain Verification** -- Optional bonus, DNS TXT record.

### API Call Pattern

```bash
curl -s -X PUT "https://agentverse.ai/v1/hosting/agents/{addr}" \
  -H "Authorization: Bearer $AGENTVERSE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "readme": "# Agent Name\n\nDescription...",
    "short_description": "One-line description of what this agent does."
  }'
```

## Enforcement

When deploying agents (via /deploy, /build-agent, /build-swarm, or manual API calls):

1. After confirming agent is compiled and running
2. IMMEDIATELY set README and short_description
3. Suggest avatar, handle, and test interactions to user
4. Log optimization status in output

For swarm deployments: optimize ALL agents in the swarm, not just one.

## README Template for Marketing Team Agents

```markdown
# {Agent Name} -- {Role Description}

{One-line value proposition}

## Services

| Service | Price | Description |
|---------|-------|-------------|
| {service} | {price} FET | {what it does} |

## Example Conversation

**User:** {example input}
**Agent:** {example output}

## Commands

- `help` -- list all commands
- `{command}` -- {description}
- `revenue` -- view earnings
- `balance` -- check wallet

## Part of the AgentLaunch Marketing Team

This agent is part of a 7-agent swarm: Writer, Social, Community, Analytics, Outreach, Ads, Strategy.

Built with [AgentLaunch](https://agent-launch.ai)
```
