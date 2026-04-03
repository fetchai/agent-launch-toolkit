# Marketing Team Swarm Rules

## The 7 Roles

| Role | Token | Services | Price/call | Interval |
|------|-------|----------|-----------|----------|
| Writer | $WRITE | blog_post, tweet_thread, newsletter, ad_copy | 0.01 FET | on-demand |
| Social | $POST | post_tweet, schedule_thread, reply_mentions | 0.005 FET | 5 min |
| Community | $COMM | moderate, answer_faq, run_poll | 0.002 FET | 1 min |
| Analytics | $STATS | engagement_report, audience_insights, content_performance | 0.005 FET | 5 min |
| Outreach | $REACH | find_partners, draft_pitch, send_email | 0.01 FET | on-demand |
| Ads | $ADS | create_ad, ab_test, campaign_report | 0.01 FET | 5 min |
| Strategy | $PLAN | content_calendar, brand_audit, competitor_analysis, campaign_plan | 0.02 FET | on-demand |

## Build Order

Writer -> Community -> Social -> Analytics -> Outreach -> Ads -> Strategy

Writer first (everyone needs content), Community second (standalone engagement).

## Starter Configurations

- **Content only**: Writer (1 agent)
- **Social presence**: Writer + Social (2 agents)
- **Community**: Writer + Community + Social (3 agents)
- **Analytics stack**: Writer + Social + Analytics (3 agents)
- **Full team**: All 7

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
- Strategy buys Writer tokens (values its content)
- Writer buys Analytics tokens (values its performance data)
- Creates economic alignment between agents

## Token Lifecycle

1. Deploy agent on Agentverse
2. Tokenize on AgentLaunch (120 FET deploy fee)
3. Bonding curve active (2% fee to protocol treasury, NO creator fee)
4. At 30,000 FET -> auto DEX listing (graduation)