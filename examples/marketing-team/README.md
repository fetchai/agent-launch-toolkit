# Marketing Team Swarm

A 7-agent marketing team that creates content, posts to social media, manages community, tracks analytics, does outreach, runs ads, and coordinates strategy — all as autonomous AI agents that charge FET for their services.

## The Team

| # | Agent | Token | What It Does | APIs Used | Price/call |
|---|-------|-------|-------------|-----------|-----------|
| 1 | **Writer** | $WRITE | Blog posts, tweet threads, newsletters, ad copy | ASI1-mini | 0.01 FET |
| 2 | **Social** | $POST | Posts to Twitter/X, schedules threads, auto-posts via Writer | Twitter API v2 + Writer | 0.005 FET |
| 3 | **Community** | $COMM | Telegram group management, FAQs, welcome messages, polls | Telegram Bot API | 0.002 FET |
| 4 | **Analytics** | $STATS | Engagement reports, audience insights, content performance | Twitter Analytics | 0.005 FET |
| 5 | **Outreach** | $REACH | Draft pitches, send emails, auto-pitch via Writer | Resend + ASI1-mini + Writer | 0.01 FET |
| 6 | **Ads** | $ADS | Ad copy, A/B tests, auto-create via Writer | ASI1-mini + Writer | 0.01 FET |
| 7 | **Strategy** | $PLAN | Content calendar, brand audit, coordinates all agents | ASI1-mini + all agents | 0.02 FET |

## Build Order

```
Level 0 (no dependencies):  Writer, Community
Level 1 (consume Level 0):  Social, Analytics
Level 2 (consume Level 0-1): Outreach, Ads
Level 3 (consumes all):     Strategy
```

Deploy in order: **Writer → Community → Social → Analytics → Outreach → Ads → Strategy**

## Quick Start

### 1. Set up secrets

Each agent needs specific API keys. Set them as Agentverse secrets:

| Agent | Required Secrets |
|-------|-----------------|
| Writer | `ASI1_API_KEY` |
| Social | `TWITTER_API_KEY`, `TWITTER_API_SECRET`, `TWITTER_ACCESS_TOKEN`, `TWITTER_ACCESS_SECRET`, `WRITER_ADDRESS` |
| Community | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` |
| Analytics | `TWITTER_BEARER_TOKEN` |
| Outreach | `ASI1_API_KEY`, `RESEND_API_KEY`, `WRITER_ADDRESS` |
| Ads | `ASI1_API_KEY`, `WRITER_ADDRESS`, `ANALYTICS_ADDRESS` |
| Strategy | `ASI1_API_KEY`, + all peer `*_ADDRESS` secrets |

All agents also need: `AGENTVERSE_API_KEY`

### 2. Deploy via CLI

```bash
# Deploy all 7 agents as a swarm
npx agentlaunch scaffold writer --type swarm-starter --preset writer
npx agentlaunch scaffold social --type swarm-starter --preset social
npx agentlaunch scaffold community --type swarm-starter --preset community
npx agentlaunch scaffold analytics --type swarm-starter --preset analytics
npx agentlaunch scaffold outreach --type swarm-starter --preset outreach
npx agentlaunch scaffold ads --type swarm-starter --preset ads
npx agentlaunch scaffold strategy --type swarm-starter --preset strategy
```

Or deploy all at once with the MCP `deploy_swarm` tool:

```
deploy_swarm({
  presets: ["writer", "social", "community", "analytics", "outreach", "ads", "strategy"],
  baseName: "MarketingTeam"
})
```

### 3. Wire peer addresses

After deployment, set peer address secrets so agents can call each other:

```
WRITER_ADDRESS=agent1q...
SOCIAL_ADDRESS=agent1q...
COMMUNITY_ADDRESS=agent1q...
ANALYTICS_ADDRESS=agent1q...
OUTREACH_ADDRESS=agent1q...
ADS_ADDRESS=agent1q...
STRATEGY_ADDRESS=agent1q...
```

The `deploy_swarm` tool does this automatically.

## Example Flows

### Strategy delegates to Writer (real inter-agent call)

```
User → Strategy: "create blog AI agent scaffolding"
  Strategy → User: "Requesting from Writer: blog AI agent scaffolding"
  Strategy → Writer: ChatMessage("blog AI agent scaffolding")
  [async — Writer processes via ASI1-mini]
  Writer → Strategy: ChatMessage([blog post content])
  Strategy → User: "[Writer response]\n\n[blog post content]"
```

### Strategy orchestrates Writer → Social (multi-step)

```
User → Strategy: "publish AI agent launch"
  Strategy → User: "Starting publish pipeline..."
  Strategy → Writer: ChatMessage("tweet AI agent launch")
  [async — Writer generates tweet thread]
  Writer → Strategy: ChatMessage([tweet content])
  Strategy → Social: ChatMessage("post [first 280 chars]")
  [async — Social posts to Twitter]
  Social → Strategy: ChatMessage("Tweet posted! URL: ...")
  Strategy → User: "Campaign executed: content created, tweet posted"
```

### Social auto-posts via Writer (real inter-agent call)

```
User → Social: "autopost AI agent launch"
  Social → User: "Requesting tweet from Writer. Will post when ready."
  Social → Writer: ChatMessage("tweet AI agent launch")
  [async — Writer generates content]
  Writer → Social: ChatMessage([tweet thread])
  Social → Twitter API: posts first tweet
  Social → User: "Auto-posted from Writer! URL: ..."
```

### Outreach auto-pitches via Writer (real inter-agent call)

```
User → Outreach: "autopitch Acme|hello@acme.com|AI infra|cross-promotion"
  Outreach → User: "Requesting pitch from Writer. Will send when ready."
  Outreach → Writer: ChatMessage("Write a pitch email to Acme...")
  [async — Writer generates pitch]
  Writer → Outreach: ChatMessage([pitch content])
  Outreach → Resend API: sends email
  Outreach → User: "Pitch sent to hello@acme.com!"
```

## Starter Configurations

Not everyone needs all 7 agents:

| Configuration | Agents | Use Case |
|--------------|--------|----------|
| **Content only** | Writer | Just need content generation |
| **Social presence** | Writer + Social | Content + Twitter posting |
| **Community** | Writer + Community + Social | Content + social + Telegram |
| **Analytics stack** | Writer + Social + Analytics | Content + posting + tracking |
| **Full team** | All 7 | Complete marketing automation |

## Commands Reference

### Writer
- `blog <topic>` — generate blog post
- `tweet <topic>` — generate tweet thread
- `newsletter <topic>` — generate newsletter
- `ad <topic>` — generate ad copy variants
- `revenue` — view revenue summary
- `balance` — check FET wallet balance
- `status` — token price + agent health

### Social
- `post <text>` — post a tweet
- `thread <t1>|<t2>|...` — post a thread
- `mentions` — check recent mentions
- `schedule <text>` — queue a post
- `queue` — view scheduled posts
- `autopost <topic>` — Writer creates + Social posts (inter-agent)
- `revenue` — view revenue summary
- `balance` — check FET wallet balance

### Community
- `send <message>` — send to Telegram group
- `poll <q>|<opt1>|<opt2>` — create a poll
- `faq <question>` — look up FAQ
- `addfaq <q>|<answer>` — add FAQ entry
- `welcome <name>` — send welcome message
- `stats` — group stats
- `revenue` — view revenue summary
- `balance` — check FET wallet balance

### Analytics
- `report [N]` — engagement report
- `audience` — follower insights
- `top [N]` — best performing tweets
- `trends` — engagement trends
- `revenue` — view revenue summary
- `balance` — check FET wallet balance

### Outreach
- `pitch <name>|<info>|<goal>` — generate pitch
- `send <email>|<subject>|<body>` — send email via Resend
- `pitchsend <name>|<email>|<info>|<goal>` — generate + send
- `autopitch <name>|<email>|<info>|<goal>` — Writer creates + Resend sends (inter-agent)
- `log` — view outreach history
- `stats` — outreach summary
- `revenue` — view revenue summary
- `balance` — check FET wallet balance

### Ads
- `create <product>|<audience>` — generate ad variants
- `autocreate <name>|<product>|<audience>` — Writer creates + A/B test (inter-agent)
- `test <name>|<product>|<audience>` — create A/B test
- `event <test>|<variant>|<type>` — record impression/click/conversion
- `results <test>` — A/B test results
- `campaigns` — list all campaigns
- `revenue` — view revenue summary
- `balance` — check FET wallet balance

### Strategy
- `calendar <duration>|<focus>` — content calendar
- `audit [context]` — brand audit
- `competitors <list>` — competitor analysis
- `campaign <goal>|<budget>|<duration>` — campaign plan
- `create <type> <topic>` — delegate to Writer (inter-agent)
- `publish <topic>` — Writer creates → Social posts (multi-step inter-agent)
- `ask <agent> <message>` — call any peer agent by name
- `plans` — view saved plans
- `team` — show team agent connection status
- `revenue` — view revenue summary
- `balance` — check FET wallet balance
