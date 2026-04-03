# /build-swarm -- Build an Agent Swarm

Guided swarm creation experience for Claude Code.

## Steps

0. **Check authentication**: Before anything else, verify an API key exists.
   - If `AGENTVERSE_API_KEY` is set in `.env`, proceed
   - If not, offer the zero-to-hero flow:
     ```bash
     npx agentlaunch auth wallet --generate
     ```
     This creates a new wallet AND API key in one command.
   - Alternative: user can get a key from https://agentverse.ai/profile/api-keys

1. **Understand the goal**: Ask what the user wants their swarm to do
2. **Suggest presets**: Based on the goal, recommend a combination of presets
   - For content marketing: Writer + Social + Analytics
   - For community growth: Writer + Community + Social
   - For full marketing team: All 7
3. **Scaffold each agent**: Use `scaffold_swarm` MCP tool with appropriate preset
4. **Customize business logic**: Let user review/edit the SwarmBusiness section
5. **Deploy**: Use `deploy_swarm` MCP tool or deploy individually
   - Follow build order: Level 0 (no deps) first, then Level 1, etc.
   - Set peer address secrets so agents can call each other
6. **Optimize EVERY agent** (MANDATORY -- Phase 3 of `docs/workflow.md`):
   - For each deployed agent, set README and short_description
   - Push via `PUT /v1/hosting/agents/{addr}` with `{"readme": "...", "short_description": "..."}`
   - README must include: value proposition, services table, example conversations, pricing, commands
   - Suggest @handle options for each agent
   - Tell user to run 3+ test interactions per agent
7. **Show status**: Display swarm health, addresses, optimization score, next steps

## Preset Quick Reference

| Preset | Role | Price/call | Best for |
|--------|------|-----------|----------|
| Writer | Content creation | 0.01 FET | Every swarm needs content |
| Social | Twitter/X posting | 0.005 FET | Social media presence |
| Community | Telegram management | 0.002 FET | Community engagement |
| Analytics | Engagement tracking | 0.005 FET | Data-driven decisions |
| Outreach | Partnership emails | 0.01 FET | Business development |
| Ads | Ad campaigns | 0.01 FET | Paid marketing |
| Strategy | Campaign coordination | 0.02 FET | Orchestrates all agents |

## Recommended Starters

- **Content only**: Writer (1 agent)
- **Social presence**: Writer + Social (2 agents)
- **Community**: Writer + Community + Social (3 agents)
- **Full team**: All 7

## Environment

- Reads AGENTVERSE_API_KEY from .env
- Uses MCP tools: scaffold_swarm, deploy_swarm, deploy_to_agentverse
- Platform: agent-launch.ai
