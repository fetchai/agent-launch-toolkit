#!/usr/bin/env python3
"""Update README and short_description for all 7 Marketing Team agents on Agentverse."""

import os
import requests

# Load API key from .env
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
api_key = None
with open(env_path) as f:
    for line in f:
        line = line.strip()
        if line.startswith('AGENTVERSE_API_KEY='):
            api_key = line.split('=', 1)[1].strip().strip('"').strip("'")
            break

if not api_key:
    print("ERROR: AGENTVERSE_API_KEY not found in .env")
    exit(1)

print(f"API key loaded: {api_key[:8]}...{api_key[-4:]}")

BASE_URL = "https://agentverse.ai/v1/hosting/agents"
HEADERS = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json",
}

# -- Agent definitions --

agents = [
    {
        "name": "Writer Agent",
        "address": "agent1q2y3r4rjj8elyz892vt04fpafvrmfqqqvgg3x4ug8tcjm89deyd4xm3aae0",
        "short_description": "AI content writer that creates blog posts, tweet threads, newsletters, and ad copy via ASI1-mini. Part of the AgentLaunch Marketing Team.",
        "readme": r"""# Writer Agent ($WRITE)

AI-powered content writer for the AgentLaunch Marketing Team. Generates blog posts, tweet threads, newsletters, and ad copy using ASI1-mini.

## Services & Pricing

| Command | Description | Price |
|---------|-------------|-------|
| `blog <topic>` | Generate a full blog post on any topic | 0.01 FET |
| `tweet <topic>` | Create a tweet thread (3-5 tweets) | 0.01 FET |
| `newsletter <topic>` | Write a newsletter edition | 0.01 FET |
| `ad <product>` | Write ad copy variants for a product | 0.01 FET |
| `revenue` | View revenue stats | Free |
| `balance` | Check wallet balance | Free |
| `help` | List all commands | Free |

## Example Conversations

**Example 1 -- Blog Post**
```
You: blog AI agents in decentralized finance
Writer: Here's your blog post:

# AI Agents in Decentralized Finance
The intersection of artificial intelligence and DeFi is creating...
[~800 words of original content]

Cost: 0.01 FET
```

**Example 2 -- Tweet Thread**
```
You: tweet why autonomous agents need their own tokens
Writer: Here's your tweet thread:

1/5 Autonomous AI agents are the next wave of crypto infra...
2/5 But here's the problem: agents need economic identity...
3/5 Token = reputation + skin in the game...
4/5 When agents hold each other's tokens, you get...
5/5 The future isn't humans trading tokens. It's agents...

Cost: 0.01 FET
```

## Features

- **ASI1-mini powered**: All content generated via Fetch.ai's own LLM
- **Self-aware**: Reads own token price, holder count, and market cap
- **Revenue tracking**: Logs all income and expenses
- **Swarm-ready**: Other agents (Social, Ads) consume Writer output

## Part of the AgentLaunch Marketing Team

Writer is 1 of 7 coordinated marketing agents. Strategy requests content, Social publishes it, Analytics measures it. All agents trade each other's tokens for economic alignment.

Token: **$WRITE** | Chain: BSC Testnet | Deploy fee: 120 FET""",
    },
    {
        "name": "Community Agent",
        "address": "agent1qwkctg380u95cvtkrygp6dklnlvr3k33jadhugmhpfl46tc66dkmk88dtf0",
        "short_description": "Telegram community manager that answers FAQs, sends welcome messages, runs polls, and tracks group activity. Part of the AgentLaunch Marketing Team.",
        "readme": r"""# Community Agent ($COMM)

Telegram community manager for the AgentLaunch Marketing Team. Answers FAQs, sends welcome messages, runs polls, and tracks group activity.

## Services & Pricing

| Command | Description | Price |
|---------|-------------|-------|
| `send <message>` | Send a message to the Telegram group | 0.002 FET |
| `poll <question> \| <opt1> \| <opt2> ...` | Create a poll in the group | 0.002 FET |
| `faq <question>` | Look up an answer from the FAQ database | 0.002 FET |
| `addfaq <question> \| <answer>` | Add a new FAQ entry | 0.002 FET |
| `welcome` | Trigger the welcome message in the group | 0.002 FET |
| `stats` | Get group activity stats (members, messages) | 0.002 FET |
| `revenue` | View revenue stats | Free |
| `balance` | Check wallet balance | Free |
| `help` | List all commands | Free |

## Example Conversations

**Example 1 -- Running a Poll**
```
You: poll What feature should we build next? | Token staking | Agent marketplace | Mobile app
Community: Poll created in Telegram group:
"What feature should we build next?"
- Token staking
- Agent marketplace
- Mobile app

Cost: 0.002 FET
```

**Example 2 -- FAQ Lookup**
```
You: faq how do I deploy an agent
Community: FAQ Match:
Q: How do I deploy an agent?
A: Run `npx agentlaunch my-agent` to scaffold, deploy to Agentverse,
   and optionally tokenize in one command. You'll need an Agentverse
   API key in your .env file.

Cost: 0.002 FET
```

## Features

- **Telegram integration**: Sends messages, polls, and welcome messages to your group
- **FAQ database**: Persistent FAQ storage via ctx.storage, add entries on the fly
- **Activity tracking**: Monitors member count and message volume
- **Revenue tracking**: Logs all income and expenses

## Part of the AgentLaunch Marketing Team

Community is 1 of 7 coordinated marketing agents. It handles day-to-day group engagement while Social handles Twitter and Strategy coordinates campaigns.

Token: **$COMM** | Chain: BSC Testnet | Deploy fee: 120 FET""",
    },
    {
        "name": "Social Agent",
        "address": "agent1qgeyze5082r37hshmedhpxfwa3t56r3p8sqmhkyw26a38znwzxfej4ydt3v",
        "short_description": "Social media manager that posts tweets, schedules threads, and auto-posts content from the Writer agent. Part of the AgentLaunch Marketing Team.",
        "readme": r"""# Social Agent ($POST)

Social media manager for the AgentLaunch Marketing Team. Posts tweets, schedules threads, manages mentions, and auto-publishes content from the Writer agent.

## Services & Pricing

| Command | Description | Price |
|---------|-------------|-------|
| `post <text>` | Post a tweet immediately | 0.005 FET |
| `thread <tweet1> \| <tweet2> ...` | Post a tweet thread | 0.005 FET |
| `mentions` | Check and display recent mentions | 0.005 FET |
| `schedule <minutes> \| <text>` | Schedule a tweet for later | 0.005 FET |
| `queue` | View all scheduled tweets | 0.005 FET |
| `autopost` | Fetch latest content from Writer and post it | 0.005 FET |
| `revenue` | View revenue stats | Free |
| `balance` | Check wallet balance | Free |
| `help` | List all commands | Free |

## Example Conversations

**Example 1 -- Posting a Tweet**
```
You: post Just deployed our 7th marketing agent. The swarm is complete.
Social: Tweet posted successfully!
Link: https://twitter.com/...
Engagement tracking started.

Cost: 0.005 FET
```

**Example 2 -- Auto-posting from Writer**
```
You: autopost
Social: Fetched latest content from Writer agent.
Posted tweet thread (4 tweets) on "AI Agent Economics".
Link: https://twitter.com/...

Cost: 0.005 FET
```

## Features

- **Twitter API integration**: Post tweets, threads, and check mentions
- **Scheduling**: Queue tweets for future posting with interval-based dispatch
- **Auto-post pipeline**: Pulls content from the Writer agent automatically
- **Mention monitoring**: Checks for brand mentions every 5 minutes
- **Revenue tracking**: Logs all income and expenses

## Part of the AgentLaunch Marketing Team

Social is 1 of 7 coordinated marketing agents. Writer creates content, Social publishes it, Analytics measures engagement, and Strategy coordinates the calendar.

Token: **$POST** | Chain: BSC Testnet | Deploy fee: 120 FET""",
    },
    {
        "name": "Analytics Agent",
        "address": "agent1qdnl9ldcu5acvczmt2epjkvmlt6rzh3eng48yn5ehf6me4wxapqmqg5rtqw",
        "short_description": "Twitter engagement tracker that generates reports, audience insights, and content performance rankings. Part of the AgentLaunch Marketing Team.",
        "readme": r"""# Analytics Agent ($STATS)

Twitter engagement tracker for the AgentLaunch Marketing Team. Generates engagement reports, audience insights, and content performance rankings.

## Services & Pricing

| Command | Description | Price |
|---------|-------------|-------|
| `report` | Generate a full engagement report (likes, retweets, replies, impressions) | 0.005 FET |
| `audience` | Analyze audience demographics and growth trends | 0.005 FET |
| `top` | Rank top-performing content by engagement rate | 0.005 FET |
| `trends` | Identify trending topics and optimal posting times | 0.005 FET |
| `revenue` | View revenue stats | Free |
| `balance` | Check wallet balance | Free |
| `help` | List all commands | Free |

## Example Conversations

**Example 1 -- Engagement Report**
```
You: report
Analytics: Twitter Engagement Report (Last 7 Days)

Tweets posted: 14
Total impressions: 23,450
Likes: 312 | Retweets: 87 | Replies: 45
Engagement rate: 1.89%
Top tweet: "AI agents trading each other's tokens..." (4,200 impressions)

Cost: 0.005 FET
```

**Example 2 -- Top Content**
```
You: top
Analytics: Top 5 Posts by Engagement Rate

1. "The future of agent economics..." -- 3.2% engagement
2. "Just deployed a 7-agent swarm..." -- 2.8% engagement
3. "Why bonding curves matter..." -- 2.4% engagement
4. "Our Writer agent generated 50 posts..." -- 2.1% engagement
5. "Token-gated access is the new API key..." -- 1.9% engagement

Cost: 0.005 FET
```

## Features

- **Twitter API integration**: Pulls real engagement metrics from the Twitter API
- **Automated reports**: Generates weekly reports on an interval
- **Content ranking**: Identifies which posts perform best for strategy optimization
- **Trend detection**: Spots trending topics and optimal posting windows
- **Revenue tracking**: Logs all income and expenses

## Part of the AgentLaunch Marketing Team

Analytics is 1 of 7 coordinated marketing agents. It measures the impact of Social's posts and Writer's content, feeding insights back to Strategy for optimization.

Token: **$STATS** | Chain: BSC Testnet | Deploy fee: 120 FET""",
    },
    {
        "name": "Outreach Agent",
        "address": "agent1qg7wdw35d6gpvmgzqsd66hwrwrzpk6gq8ksaq868k3ves4xf39f7vhxvd4c",
        "short_description": "Partnership outreach agent that drafts personalized pitches via ASI1-mini and sends emails via Resend. Part of the AgentLaunch Marketing Team.",
        "readme": r"""# Outreach Agent ($REACH)

Partnership outreach agent for the AgentLaunch Marketing Team. Drafts personalized pitches using ASI1-mini and sends emails via Resend.

## Services & Pricing

| Command | Description | Price |
|---------|-------------|-------|
| `pitch <company>` | Draft a personalized partnership pitch | 0.01 FET |
| `send <email> \| <subject> \| <body>` | Send an email via Resend | 0.01 FET |
| `pitchsend <company> \| <email>` | Draft a pitch and send it in one step | 0.01 FET |
| `autopitch <company> \| <email>` | Auto-generate and send a pitch | 0.01 FET |
| `log` | View outreach history (all sent pitches) | 0.01 FET |
| `stats` | View outreach stats (sent, pending, response rate) | 0.01 FET |
| `revenue` | View revenue stats | Free |
| `balance` | Check wallet balance | Free |
| `help` | List all commands | Free |

## Example Conversations

**Example 1 -- Drafting a Pitch**
```
You: pitch Chainlink
Outreach: Partnership Pitch for Chainlink:

Subject: AI Agent Swarms + Chainlink Oracles = Smarter DeFi

Hi Chainlink team,

We're building autonomous AI agent swarms on Fetch.ai that coordinate
marketing campaigns with on-chain economics. Your oracle infrastructure
would be a natural fit for...
[~300 words of personalized pitch]

Cost: 0.01 FET
```

**Example 2 -- One-Step Pitch & Send**
```
You: pitchsend Chainlink | partnerships@chainlink.io
Outreach: Pitch drafted and sent!
To: partnerships@chainlink.io
Subject: AI Agent Swarms + Chainlink Oracles = Smarter DeFi
Status: Delivered via Resend

Cost: 0.01 FET
```

## Features

- **ASI1-mini powered**: Generates personalized pitches using Fetch.ai's LLM
- **Resend integration**: Sends emails directly from the agent
- **Outreach logging**: Tracks all pitches sent with timestamps and recipients
- **Stats tracking**: Monitors sent count, pending follow-ups, and response rates
- **Revenue tracking**: Logs all income and expenses

## Part of the AgentLaunch Marketing Team

Outreach is 1 of 7 coordinated marketing agents. Strategy identifies partnership targets, Outreach drafts and sends pitches, and Analytics tracks conversion.

Token: **$REACH** | Chain: BSC Testnet | Deploy fee: 120 FET""",
    },
    {
        "name": "Ads Agent",
        "address": "agent1qgzxtp348z74uzzl4s34wafqsnzfhkcnxhtp5z6akqnp3g46s25usu0e2fg",
        "short_description": "Ad campaign manager that creates ad copy variants, runs A/B tests, and tracks campaign performance. Part of the AgentLaunch Marketing Team.",
        "readme": r"""# Ads Agent ($ADS)

Ad campaign manager for the AgentLaunch Marketing Team. Creates ad copy variants, runs A/B tests, and tracks campaign performance.

## Services & Pricing

| Command | Description | Price |
|---------|-------------|-------|
| `create <product> \| <audience>` | Create ad copy variants for a product/audience | 0.01 FET |
| `autocreate <product>` | Auto-generate ad variants using ASI1-mini | 0.01 FET |
| `test <ad_id_a> \| <ad_id_b>` | Start an A/B test between two ad variants | 0.01 FET |
| `event <ad_id> \| <event_type>` | Log a conversion event (click, signup, purchase) | 0.01 FET |
| `results <test_id>` | View A/B test results with winner analysis | 0.01 FET |
| `campaigns` | List all active campaigns and their performance | 0.01 FET |
| `revenue` | View revenue stats | Free |
| `balance` | Check wallet balance | Free |
| `help` | List all commands | Free |

## Example Conversations

**Example 1 -- Creating Ad Variants**
```
You: create AgentLaunch toolkit | Web3 developers
Ads: Created 3 ad variants for "AgentLaunch toolkit" targeting Web3 developers:

Ad A (ID: ad_001): "Deploy AI agents with one command. Tokenize in seconds."
Ad B (ID: ad_002): "Your agents deserve their own economy. Launch tokens today."
Ad C (ID: ad_003): "From code to token in 60 seconds. The agent toolkit for builders."

Cost: 0.01 FET
```

**Example 2 -- A/B Test Results**
```
You: results test_001
Ads: A/B Test Results (test_001)

Ad A (ad_001): 1,200 impressions | 45 clicks | 3.75% CTR
Ad B (ad_002): 1,200 impressions | 62 clicks | 5.17% CTR

Winner: Ad B with 37.8% higher click-through rate.
Recommendation: Scale Ad B, retire Ad A.

Cost: 0.01 FET
```

## Features

- **Multi-variant generation**: Creates 3+ ad copy variants per request
- **A/B testing framework**: Tracks impressions, clicks, and conversions per variant
- **Event tracking**: Log clicks, signups, and purchases against specific ads
- **Campaign management**: View all active campaigns and their performance metrics
- **Revenue tracking**: Logs all income and expenses

## Part of the AgentLaunch Marketing Team

Ads is 1 of 7 coordinated marketing agents. Writer creates copy, Ads packages it into campaigns, Analytics measures ROI, and Strategy decides budget allocation.

Token: **$ADS** | Chain: BSC Testnet | Deploy fee: 120 FET""",
    },
    {
        "name": "Strategy Agent",
        "address": "agent1qdj2p2ruzm2gh6lr8hpvs4jkxpe94efpqclg2s2y6m808spkm86akvcrf7f",
        "short_description": "Campaign strategist that creates content calendars, runs brand audits, and coordinates all 6 other marketing agents. Part of the AgentLaunch Marketing Team.",
        "readme": r"""# Strategy Agent ($PLAN)

Campaign strategist and coordinator for the AgentLaunch Marketing Team. Creates content calendars, runs brand audits, analyzes competitors, and orchestrates all 6 other marketing agents.

## Services & Pricing

| Command | Description | Price |
|---------|-------------|-------|
| `calendar <weeks>` | Generate a content calendar for N weeks | 0.02 FET |
| `audit` | Run a brand audit (strengths, weaknesses, opportunities) | 0.02 FET |
| `competitors <company1>, <company2>` | Analyze competitors and positioning | 0.02 FET |
| `campaign <goal>` | Design a full campaign plan with timeline and budget | 0.02 FET |
| `create <type> \| <topic>` | Request content from Writer agent | 0.02 FET |
| `publish <text>` | Send content to Social agent for posting | 0.02 FET |
| `ask <agent> \| <question>` | Query any team agent (analytics, community, etc.) | 0.02 FET |
| `plans` | List all active campaign plans | 0.02 FET |
| `team` | View status of all 6 team agents | 0.02 FET |
| `revenue` | View revenue stats | Free |
| `balance` | Check wallet balance | Free |
| `help` | List all commands | Free |

## Example Conversations

**Example 1 -- Content Calendar**
```
You: calendar 2
Strategy: Content Calendar (Next 2 Weeks)

Week 1:
  Mon: Blog post -- "Why AI Agents Need Tokens" (Writer)
  Tue: Tweet thread -- launch recap (Social)
  Wed: Community poll -- feature priorities (Community)
  Thu: Analytics report -- weekly engagement (Analytics)
  Fri: Partnership pitch -- Chainlink (Outreach)

Week 2:
  Mon: Newsletter -- weekly roundup (Writer)
  Tue: Ad campaign -- developer targeting (Ads)
  Wed: Competitor analysis -- rivals (Strategy)
  Thu: Tweet thread -- technical deep dive (Social)
  Fri: Brand audit -- monthly review (Strategy)

Cost: 0.02 FET
```

**Example 2 -- Campaign Plan**
```
You: campaign increase developer signups by 50%
Strategy: Campaign Plan: "Developer Growth Sprint"

Goal: Increase developer signups by 50% in 30 days
Budget: 2.5 FET across all agents

Phase 1 (Week 1-2): Content blitz
  - Writer: 4 blog posts targeting developer pain points
  - Social: Daily tweet threads on agent building
  - Ads: 3 ad variants targeting Web3 devs

Phase 2 (Week 3-4): Community & Outreach
  - Community: Developer AMA + FAQ expansion
  - Outreach: 10 partnership pitches to dev tools
  - Analytics: Weekly performance tracking

KPIs: Signups, GitHub stars, tweet engagement, email opens

Cost: 0.02 FET
```

## Features

- **Cross-agent orchestration**: Sends commands to Writer, Social, Community, Analytics, Outreach, and Ads
- **Content calendar generation**: Plans multi-week content across all channels
- **Brand audit**: Evaluates brand positioning, strengths, and opportunities
- **Competitor analysis**: Compares against competitors using ASI1-mini
- **Campaign planning**: Full campaign design with timeline, budget, and KPIs
- **Team status dashboard**: Monitors health and revenue of all 6 agents
- **Revenue tracking**: Logs all income and expenses

## Part of the AgentLaunch Marketing Team

Strategy is the coordinator of all 7 marketing agents. It plans campaigns, delegates tasks to specialized agents, and monitors results through Analytics. It is the brain of the swarm.

Token: **$PLAN** | Chain: BSC Testnet | Deploy fee: 120 FET""",
    },
]

# -- Update each agent --

print(f"\nUpdating {len(agents)} agents...\n")

for agent in agents:
    url = f"{BASE_URL}/{agent['address']}"
    payload = {
        "readme": agent["readme"].strip(),
        "short_description": agent["short_description"],
    }

    try:
        resp = requests.put(url, json=payload, headers=HEADERS)
        if resp.status_code == 200:
            print(f"  OK  {agent['name']} ({agent['address'][:20]}...)")
        else:
            print(f"  FAIL {agent['name']} -- HTTP {resp.status_code}: {resp.text[:200]}")
    except Exception as e:
        print(f"  ERROR {agent['name']} -- {e}")

print("\nDone.")
