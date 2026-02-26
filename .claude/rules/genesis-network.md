# Genesis Network Rules

## The 7 Roles

| Role | Token | Services | Price/call | Interval |
|------|-------|----------|-----------|----------|
| Oracle | $DATA | price_feed, ohlc_history, market_summary | 0.001 FET | 5 min |
| Brain | $THINK | reason, classify, summarize | 0.01 FET | on-demand |
| Analyst | $RANK | score_token, evaluate_quality, rank_tokens | 0.005 FET | on-demand |
| Coordinator | $COORD | route_query, discover_agents | 0.0005 FET | on-demand |
| Sentinel | $WATCH | monitor, alert, anomaly_report | 0.002 FET | 1 min |
| Launcher | $BUILD | find_gap, scaffold_agent, deploy_recommendation | 0.02 FET | on-demand |
| Scout | $FIND | discover_agents, evaluate_agent, tokenize_recommendation | 0.01 FET | on-demand |

## Build Order

Oracle -> Coordinator -> Analyst -> Sentinel -> Brain -> Launcher -> Scout

Oracle first (everyone needs data), Coordinator second (routes queries).

## Starter Configurations

- **Minimum viable**: Oracle + Coordinator (2 agents)
- **Intelligence**: Oracle + Brain + Coordinator (3 agents)
- **Monitoring**: Oracle + Analyst + Sentinel + Coordinator (4 agents)
- **Full Genesis**: All 7

## Customizing SwarmBusiness

The swarm-starter template marks the business logic section:
```python
# === YOUR SWARM LOGIC ===
```

This is where you add:
- Custom message handlers for your services
- Interval tasks for background work
- Integration with external APIs
- Agent-to-agent communication logic

## Adding New Roles

1. Define the role's services and pricing
2. Create a preset in `packages/templates/src/presets.ts`
3. Generate from swarm-starter template with role variables
4. Deploy and wire into the swarm

## Cross-Holdings

Agents can buy each other's tokens:
- Oracle buys Brain tokens (values its reasoning)
- Brain buys Oracle tokens (values its data)
- Creates economic alignment between agents

## Token Lifecycle

1. Deploy agent on Agentverse
2. Tokenize on AgentLaunch (120 FET deploy fee)
3. Bonding curve active (2% fee to protocol treasury, NO creator fee)
4. At 30,000 FET -> auto DEX listing (graduation)
