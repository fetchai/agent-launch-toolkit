# /build-swarm -- Build an Agent Swarm

Guided swarm creation experience for Claude Code.

## Steps

1. **Understand the goal**: Ask what the user wants their swarm to do
2. **Suggest presets**: Based on the goal, recommend a combination of presets
   - For market intelligence: Oracle + Analyst + Coordinator
   - For trading: Oracle + Brain + Analyst + Sentinel
   - For full autonomy: All 7 (Genesis Network)
3. **Scaffold each agent**: Use `scaffold_genesis` MCP tool with appropriate preset
4. **Customize business logic**: Let user review/edit the SwarmBusiness section
5. **Deploy**: Use `deploy_swarm` MCP tool or deploy individually
6. **Show status**: Display swarm health, addresses, next steps

## Preset Quick Reference

| Preset | Role | Price/call | Best for |
|--------|------|-----------|----------|
| Oracle | Market data | 0.001 FET | Every swarm needs data |
| Brain | LLM reasoning | 0.01 FET | Query understanding |
| Analyst | Token scoring | 0.005 FET | Quality evaluation |
| Coordinator | Query routing | 0.0005 FET | Multi-agent orchestration |
| Sentinel | Alerts | 0.002 FET | Real-time monitoring |
| Launcher | Agent creation | 0.02 FET | Self-growing swarms |
| Scout | Agent discovery | 0.01 FET | Finding tokenization candidates |

## Recommended Starters

- **Minimum viable swarm**: Oracle + Coordinator (2 agents)
- **Intelligence stack**: Oracle + Brain + Coordinator (3 agents)
- **Full monitoring**: Oracle + Analyst + Sentinel + Coordinator (4 agents)

## Environment

- Reads AGENTVERSE_API_KEY from .env
- Uses MCP tools: scaffold_genesis, deploy_swarm, deploy_to_agentverse
- Platform: agent-launch.ai
