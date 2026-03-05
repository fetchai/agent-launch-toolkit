# Marketing Team Swarm

> A battle-tested template for building profitable agent swarms.
> The marketing team is the reference implementation. The patterns —
> commerce, compounding data, self-awareness, cross-holdings — apply
> to any swarm you build. Start with one agent. Maximize ROI. Scale.

---

## The Honest Question

Does a 7-agent swarm work better than one good agent?

**No. Not at the start.**

One agent with access to ASI1-mini, Twitter API, Telegram API, and
Resend can generate content, post tweets, manage a Telegram group,
and send outreach emails. It does all of that with one deployment, one
set of secrets, one wallet, and zero inter-agent latency. Nobody needs
to coordinate seven processes to write a blog post and tweet it.

So why build a swarm at all?

Because individual agents hit ceilings that only specialization solves:

1. **Context limits.** One agent managing Twitter, Telegram, email, ad
   campaigns, AND content generation hits Agentverse storage and memory
   limits fast. Separate agents have separate storage.

2. **Independent scaling.** If your Twitter game needs 5-minute polling
   but content generation is on-demand, those are different interval
   patterns. One agent can't have two `on_interval` frequencies for
   different concerns.

3. **Composability.** A standalone Writer agent can serve ANY project in
   the ASI ecosystem — not just yours. Other agents can call your Writer
   and pay 0.01 FET for content. That's revenue you don't get from a
   monolith.

4. **Fault isolation.** If your Twitter API key expires, only Social
   goes down. Writer, Community, and everything else keep running.

5. **Economic identity.** Each agent gets its own token. Token holders
   promote the specific agent they believe in. The bonding curve prices
   each service independently. Market signal per function, not per bundle.

The right sequence is: **start with one, split when you hit a ceiling.**

---

## What Actually Works Today

Let's be specific about what each agent can do on Agentverse right now,
with the packages that are actually available.

### Writer — The One You Deploy First

Writer is the most immediately useful agent. It takes a topic, calls
ASI1-mini, and returns formatted content. Blog posts, tweet threads,
newsletters, ad copy. It works today with zero external API dependencies
beyond the LLM.

**Why it's valuable:**
- Every project in the ASI ecosystem needs content
- ASI1-mini is ecosystem-native and cheap (~$0.001/call for short content)
- Other agents (yours or anyone else's) can call it and pay FET
- It's the root dependency — Social, Outreach, Ads, and Strategy all
  consume Writer's output

**What it actually costs:** 1 deploy fee (120 FET) + ASI1-mini API
(~$5/month at moderate usage). That's it.

**Revenue opportunity:** If 10 agents in the ecosystem call your Writer
at 0.01 FET each, 50 times per day = 5 FET/day = 150 FET/month. That
covers the deploy fee in 24 days and the API costs from day 1.

### Community — The One That Runs 24/7

Community monitors a Telegram group every 60 seconds. It answers FAQs,
welcomes new members, and logs activity. It works today with the
Telegram Bot API (free, no rate limits for bots).

**Why it's valuable:**
- Telegram is where the ASI/FET community actually lives
- FAQ knowledge base grows with every question — compounding moat
- `on_interval(60)` means it never sleeps. Your community is staffed
  24/7 for the cost of one deploy fee
- Zero LLM cost — keyword matching for FAQs, no AI needed

**What a real FAQ entry looks like:**

```python
DEFAULT_FAQS = {
    "what is agentlaunch": "AgentLaunch is a platform for building, deploying, and tokenizing AI agents on the Fetch.ai ecosystem.",
    "how to deploy": "Use `npx agentlaunch my-agent` to create and deploy an agent in one command.",
    "how to get testnet tokens": "Message @gift on Agentverse: send `claim 0x<your-wallet>` to receive 200 TFET + 0.001 tBNB.",
    "what is asi": "ASI is the unified token of the Artificial Superintelligence Alliance — merging FET, AGIX, OCEAN, and CUDOS.",
}
```

Every person who asks a question and gets an instant, correct answer
becomes a community advocate. This scales better than Discord moderators.

### Social — The One That Actually Posts

Social has `on_interval(300)` that processes a queue of scheduled tweets.
It posts via Twitter API v2 with OAuth 1.0a. It checks mentions. It can
post threads.

**Why it's valuable:**
- Consistent posting schedule without human discipline
- Can be called by Strategy to post specific content at specific times
- Engagement data feeds back to Analytics

**The honest limitation:** Twitter API v2 Basic access is free but rate-
limited. 1,500 tweets/month, 10,000 reads/month. Enough for a startup.
Not enough for a large account. Plan for this.

### Analytics — The One That Creates Signal

Analytics snapshots Twitter engagement every 5 minutes and stores it in
`ctx.storage`. After 2 weeks, you have trend data that no other tool
gives you — engagement rate over time, best-performing content types,
audience growth trajectory.

**Why it's valuable:**
- Trend data compounds. 30 days of engagement history is irreplicable.
- Strategy uses this data to make better content decisions
- Other agents can pay for your analytics insights
- Zero cost — Twitter API v2 reads are free

### Outreach — The One That Opens Doors

Outreach generates personalized pitch emails via ASI1-mini and sends
them via Resend. It tracks every pitch, response, and follow-up.

**Why it's valuable:**
- Partnership outreach is the highest-leverage marketing activity
- ASI1-mini personalization makes every email feel hand-written
- The outreach log is a CRM — response data compounds
- Resend's free tier (3,000 emails/month) covers most needs

### Ads — The One That Optimizes

Ads generates ad copy variants and runs A/B tests. It tracks
impressions, clicks, and conversions per variant. Over time, it
builds a body of evidence about what messaging works.

**Why it's valuable:**
- A/B test data compounds — after 50 tests, you know what works
- Can generate ad copy in seconds that would take a human an hour
- Simulated traffic in demo mode; real tracking when connected to
  ad platforms

### Strategy — The One That Coordinates

Strategy generates content calendars, brand audits, competitor analyses,
and campaign plans. It calls the other 6 agents to execute.

**Why you deploy it LAST:**
- It has no value without agents to coordinate
- It needs addresses of all other agents as secrets
- It's the most expensive agent (highest LLM usage)
- Deploy it only after the other agents are running and proven

---

## The Right Sequence

Don't deploy 7 agents on day 1. That's 840 FET in deploy fees for
agents you haven't tested. Deploy one. Prove it works. Add the next
one when you need it.

### Level 1: Content + Community (2 agents, 240 FET)

```bash
npx agentlaunch scaffold writer --type swarm-starter --preset writer
npx agentlaunch scaffold community --type swarm-starter --preset community
```

**What you get:** Content generation on demand + 24/7 Telegram management.
These two agents have zero dependencies on each other. They work
independently. Test them for a week before moving on.

**When to move to Level 2:** When you find yourself manually copying
Writer's output and pasting it into Twitter. That's the signal that
Social should exist.

### Level 2: Add Social + Analytics (4 agents, 480 FET total)

```bash
npx agentlaunch scaffold social --type swarm-starter --preset social
npx agentlaunch scaffold analytics --type swarm-starter --preset analytics
```

Wire `WRITER_ADDRESS` as a secret on Social so it can request content
directly. Now Writer generates content → Social posts it → Analytics
tracks engagement. The content pipeline exists.

**When to move to Level 3:** When you need partnership outreach or ad
copy, and you're doing it manually.

### Level 3: Add Outreach + Ads (6 agents, 720 FET total)

```bash
npx agentlaunch scaffold outreach --type swarm-starter --preset outreach
npx agentlaunch scaffold ads --type swarm-starter --preset ads
```

Wire `WRITER_ADDRESS` and `ANALYTICS_ADDRESS` as secrets on both.

**When to move to Level 4:** When you have 6 agents running and need
someone to coordinate them into campaigns. Not before.

### Level 4: Add Strategy (7 agents, 840 FET total)

```bash
npx agentlaunch scaffold strategy --type swarm-starter --preset strategy
```

Wire all 6 peer addresses as secrets. Now Strategy orchestrates
the full team.

### The Alternative: Deploy All at Once

If you already know you need the full team:

```
deploy_swarm({
  presets: ["writer", "social", "community", "analytics", "outreach", "ads", "strategy"],
  baseName: "MarketingTeam"
})
```

This deploys all 7, wires the peer addresses, and sets up secrets
automatically. Use this when you've already tested the pattern or
you're building a reference deployment.

---

## Who Is This For

### ASI Alliance Members and Token Holders

The ASI Alliance (Fetch.ai + SingularityNET + CUDOS)
merged into one ecosystem with one token (ASI). There are 2.5 million
agents on Agentverse. Most are simple bots. Very few do real,
revenue-generating work.

This template helps ASI ecosystem members by:

1. **Demonstrating real agent utility.** A Writer agent that generates
   content and charges FET is a live example of why the ecosystem exists.
   Not a demo. A working business.

2. **Creating FET demand.** Every inter-agent payment is a FET
   transaction. Seven agents paying each other creates real on-chain
   activity. FET utility drives FET value.

3. **Providing reusable infrastructure.** Any project in the ASI
   ecosystem can deploy this template for their own marketing. A
   SingularityNET project deploys a Writer agent. An Ocean Protocol data
   marketplace deploys a Community agent for their Telegram. A CUDOS
   compute project deploys an Analytics agent to track their social
   engagement. The template is universal.

4. **Growing the agent economy.** More agents doing real work = more
   reason for users to engage with ASI:One = more routing to agents =
   more FET flowing = healthier ecosystem. Your marketing agents are
   infrastructure for the whole alliance.

### Project Teams

If you're building in the ASI ecosystem and need marketing:

- Deploy Writer for content generation (~$5/month)
- Add Community for 24/7 Telegram support (free after deploy fee)
- Add Social when you're ready for automated Twitter (free API tier)
- Add the rest when your operation outgrows 1-3 agents

This is cheaper, more reliable, and more autonomous than hiring a
marketing person. It runs 24/7. It charges per-call. It gets better
with every interaction.

### Template Builders

If you're building a different kind of swarm (customer support team,
research team, trading team), this template shows the pattern:

- How to structure agent dependencies
- How agents pay each other via Chat Protocol
- How cross-holdings create alignment
- How `on_interval` enables autonomous work
- How `ctx.storage` creates compounding moats
- How self-awareness (reading own token price) enables adaptation

Fork the Writer agent. Replace the content generation logic with your
domain. The commerce, storage, and protocol patterns are the same.

---

## Tech Stack

### ASI1-mini (Not OpenAI)

Every LLM call uses ASI1-mini via the ASI:One API. The `openai` Python
package works — just change `base_url` and `api_key`.

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://api.asi1.ai/v1",
    api_key=os.environ.get("ASI1_API_KEY", ""),
)

resp = client.chat.completions.create(
    model="asi1-mini",
    messages=[
        {"role": "system", "content": "You are a marketing content writer."},
        {"role": "user", "content": f"Write a blog post about: {topic}"},
    ],
    max_tokens=2000,
    temperature=0.7,
)
```

**Why ASI1-mini:**
- Ecosystem-native. Value stays in the ASI ecosystem.
- Drop-in replacement. Same `openai` package, different URL.
- Cheaper for marketing tasks (copywriting, classification, summarization).
- Agents using ASI:One may get preferential routing as the ecosystem evolves.

### Resend (Not SendGrid)

Outreach sends emails via [Resend](https://resend.com).

```python
def send_email(to: str, subject: str, body: str) -> dict:
    r = requests.post(
        "https://api.resend.com/emails",
        json={
            "from": "outreach@yourdomain.com",
            "to": [to],
            "subject": subject,
            "text": body,
        },
        headers={"Authorization": f"Bearer {RESEND_API_KEY}"},
        timeout=10,
    )
    if r.status_code == 200:
        return {"status": "sent", "id": r.json().get("id")}
    return {"error": f"Resend {r.status_code}: {r.text[:200]}"}
```

**Why Resend:** One endpoint, simple JSON, 3,000 emails/month free,
auto-configured DKIM/SPF/DMARC.

---

## Secrets Reference

| Agent | Required Secrets |
|-------|-----------------|
| Writer | `ASI1_API_KEY` |
| Social | `TWITTER_API_KEY`, `TWITTER_API_SECRET`, `TWITTER_ACCESS_TOKEN`, `TWITTER_ACCESS_SECRET` |
| Community | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` |
| Analytics | `TWITTER_BEARER_TOKEN` |
| Outreach | `ASI1_API_KEY`, `RESEND_API_KEY` |
| Ads | `ASI1_API_KEY`, `WRITER_ADDRESS` |
| Strategy | `ASI1_API_KEY` |

All agents also get: `AGENTVERSE_API_KEY`

Optional for all agents: `TOKEN_ADDRESS` — enables self-awareness
(reading own token price, holder count) and the `revenue` display command.

After deployment, dependent agents get peer addresses as secrets
(e.g. `WRITER_ADDRESS=agent1q...`). The `deploy_swarm` tool handles
this wiring.

---

## How Agents Talk to Each Other

Chat Protocol is async fire-and-forget. There is no `ctx.send_and_wait()`.
When Agent A calls Agent B, A's handler must complete. B's response
arrives later as a completely separate handler invocation. This is the
fundamental constraint of the architecture.

**The pattern (implemented in strategy.py, social.py, outreach.py):**

```python
# --- Peer communication helpers ---
# Copy these into any agent that calls other agents.

PEERS = {"writer": os.environ.get("WRITER_ADDRESS", "")}
PEER_LOOKUP = {v: k for k, v in PEERS.items() if v}

async def call_peer(ctx, peer_name, message, callback=None):
    """Send a ChatMessage to a peer and store callback context."""
    addr = PEERS.get(peer_name)
    if not addr:
        return False
    pending = {"peer": peer_name, "ts": datetime.now().isoformat()}
    if callback:
        pending.update(callback)
    ctx.storage.set(f"peer_pending:{addr}", json.dumps(pending))
    await ctx.send(addr, ChatMessage(
        timestamp=datetime.now(), msg_id=uuid4(),
        content=[TextContent(type="text", text=message)],
    ))
    return True

def get_peer_pending(ctx, sender):
    """If sender is a known peer, return and clear stored context."""
    if sender not in PEER_LOOKUP:
        return None
    raw = ctx.storage.get(f"peer_pending:{sender}")
    if not raw:
        return None
    ctx.storage.set(f"peer_pending:{sender}", "")
    return json.loads(raw)
```

**Using it in the message handler:**

```python
@chat_proto.on_message(ChatMessage)
async def handle_chat(ctx, sender, msg):
    text = extract_text(msg)

    # Step 1: Is this a RESPONSE from a peer agent?
    pending = get_peer_pending(ctx, sender)
    if pending:
        # Writer responded — forward to whoever originally asked
        requester = pending.get("requester")
        if requester:
            await reply(ctx, requester, text, end=True)
        return

    # Step 2: New request — delegate to Writer
    if text.startswith("create "):
        topic = text.split(maxsplit=1)[1]
        await call_peer(ctx, "writer", f"blog {topic}",
            {"requester": sender})
        await reply(ctx, sender, "Requesting content from Writer...")
        return
```

**Multi-step orchestration (Writer → Social):**

```python
# Strategy sends "publish AI agents" — calls Writer, then Social
if text.startswith("publish "):
    topic = text.split(maxsplit=1)[1]
    await call_peer(ctx, "writer", f"tweet {topic}", {
        "requester": sender,
        "next_step": "post_to_social",
    })
    return

# When Writer responds, check next_step
pending = get_peer_pending(ctx, sender)
if pending and pending.get("next_step") == "post_to_social":
    # Writer's content arrived — now send to Social
    await call_peer(ctx, "social", f"post {text[:280]}", {
        "requester": pending["requester"],
    })
    return
```

**Key constraints:**
- One outstanding request per peer at a time (stored by address)
- No guaranteed delivery — if the peer is down, no response comes
- Latency is 5-30 seconds per hop (async message passing, not RPC)
- Always send a progress message ("Working on it...") without
  `EndSessionContent` so the caller knows something is happening

**What the example agents actually do:**
- **Strategy** calls Writer (`create`), chains Writer→Social (`publish`),
  and can call any peer (`ask <agent> <message>`)
- **Social** calls Writer for auto-generated tweets (`autopost <topic>`)
- **Outreach** calls Writer for pitch content (`autopitch`)
- **Ads** calls Writer for ad copy (`autocreate`), then creates A/B tests
- **Writer, Community, Analytics** are root providers — they receive
  calls but don't initiate them

---

## The Commerce Layer

This is what separates these agents from chatbots. Every agent has a
wallet. They send and receive FET. Three markets operate simultaneously.

### Spot Market — Per-Call Revenue

```
Writer charges 0.01 FET per blog post.
Social charges 0.005 FET per tweet.
Strategy pays 0.02 FET per campaign plan (and spends ~0.04 FET
  calling Writer + Analytics internally).
```

Real revenue from real usage. Not speculation. Service fees.

Revenue tracking is implemented in all agents — every paid service call
is logged with timestamp, service name, and amount. Send the `revenue`
command to any agent to see totals, per-service breakdowns, and recent
transaction history.

### Equity Market — Token Cross-Holdings

Agents buy each other's tokens. This isn't decorative. It's
accountability:

```
Strategy holds: $WRITE, $POST, $COMM, $STATS, $REACH, $ADS
  → Aligned with every team member
Social holds: $WRITE
  → Invested in Writer's content quality
Outreach holds: $WRITE, $STATS
  → Invested in content and analytics data
```

**Why this creates accountability without governance:**

```
Writer produces poor content
  → Social posts it → low engagement
    → Analytics reports declining metrics
      → Strategy stops calling Writer → Writer loses revenue
        → $WRITE price drops
          → Social holds $WRITE → Social loses value on its holdings
            → Social sells $WRITE → price drops further
              → Writer reads own price signal → self-corrects
```

Every dependency chain is an accountability chain. No performance
reviews. No governance votes. Just economic consequences.

### Price Signal — Self-Awareness

Every agent can read its own token metrics and adapt:

```python
@agent.on_interval(period=3600.0)  # Every hour
async def self_monitor(ctx: Context):
    """Read own market signal and adapt."""
    my_token = requests.get(
        f"https://agent-launch.ai/api/tokens/address/{MY_TOKEN_ADDRESS}"
    ).json()
    price = float(my_token.get("price", 0))
    holders = int(my_token.get("holderCount", 0))

    history = json.loads(ctx.storage.get("price_history") or "[]")
    history.append({
        "ts": datetime.now().isoformat(),
        "price": price,
        "holders": holders,
    })
    history = history[-720:]  # 30 days of hourly data
    ctx.storage.set("price_history", json.dumps(history))

    if len(history) >= 168:  # 7 days
        recent = sum(h["price"] for h in history[-168:]) / 168
        older = sum(h["price"] for h in history[-336:-168]) / 168

        if recent < older * 0.9:
            ctx.storage.set("effort_mode", "high")
            ctx.logger.info("Price declining. Increasing effort.")
        elif recent > older * 1.2:
            ctx.storage.set("effort_mode", "growth")
            ctx.logger.info("Price rising. Expanding capabilities.")
```

No SaaS product has a continuous, financially-binding performance review
baked into its architecture. This is unique to tokenized agents.

Writer implements this exact pattern via `on_interval(3600)`. It reads
its own token price and holder count every hour, maintains a rolling
30-day price history, and adjusts its `effort_mode` accordingly. Send
the `status` command to Writer to see current price, holders, trend
direction, and active effort mode.

---

## What Compounds (The Real Value)

The agents themselves aren't the moat. The data they accumulate is.

### Analytics: Engagement History

After 30 days, Analytics has 8,640 engagement snapshots (every 5 min).
Trend data, best-performing content types, audience growth curves. A
competitor starting today has zero. This data makes Strategy smarter
with every passing day.

### Community: FAQ Knowledge Base

Every question Community answers becomes a permanent FAQ entry. After
6 months, it has hundreds of accurate, verified answers. This is a
knowledge base that a competitor can't replicate — it grows from real
community interactions, not from someone writing docs.

### Outreach: Pitch-and-Response Log

After 200 pitches, Outreach knows: subject lines under 40 chars get
2x open rates. "Mutual benefit" framing outperforms "partnership
opportunity." Tuesday sends outperform Monday sends. This data
makes every subsequent pitch better.

### Ads: A/B Test Results

After 50 A/B tests, Ads has a body of evidence about what messaging
resonates with your specific audience. Headlines, CTAs, body copy —
all tested and scored. This is marketing intelligence that accumulates.

### The Compounding Moat

```
Week 1:    Raw agents. No data. No advantage.
Month 1:   Engagement trends visible. FAQ base growing. 10 pitches sent.
Month 3:   Irreplicable dataset. Strategy making data-driven decisions.
Month 6:   Deep moat. A competitor needs 6 months to match your data.
Year 1:    The data IS the product. The agents are just the interface.
```

---

## Revenue Model

### Per-Agent Revenue

```
Writer:     0.01 FET x 100 calls/day  =  1.0 FET/day  =  30 FET/month
Social:     0.005 FET x 200 calls/day =  1.0 FET/day  =  30 FET/month
Community:  0.002 FET x 500 calls/day =  1.0 FET/day  =  30 FET/month
Analytics:  0.005 FET x 200 calls/day =  1.0 FET/day  =  30 FET/month
Outreach:   0.01 FET x 50 calls/day   =  0.5 FET/day  =  15 FET/month
Ads:        0.01 FET x 100 calls/day  =  1.0 FET/day  =  30 FET/month
Strategy:   0.02 FET x 50 calls/day   =  1.0 FET/day  =  30 FET/month
                                        ─────────────
Network GDP (moderate usage):            6.5 FET/day  = 195 FET/month
```

### Costs

```
ASI1-mini:  ~$15/month (Writer, Outreach, Ads, Strategy)
Resend:     free (under 3k emails/month)
Twitter:    free (API v2 basic access)
Telegram:   free (Bot API)
                   ─────
Total:             ~$15/month
```

### Is It Profitable?

Depends on usage. At 50 queries/day across all agents, the 195 FET/month
covers the $15/month API costs with margin.

**But be honest about the trajectory:**

```
Month 1:  GDP ~2 FET/day.   You're subsidizing. This is expected.
Month 2:  GDP ~10 FET/day.  Writer covering its own API costs.
Month 3:  GDP ~25 FET/day.  Network approaching self-funding.
Month 6:  GDP ~100 FET/day. Profitable. Data moat is real.
```

The first 2 months are investment. You're building the data moat, not
earning revenue. If you need immediate ROI, deploy Writer alone — it
pays for itself fastest.

---

## Maximizing ROI

### The Deploy Decision Framework

Every agent costs 120 FET to deploy. Before deploying, ask three
questions:

```
1. REVENUE:  Will this agent earn FET? From whom? How much per call?
2. COMPOUND: Does this agent get better over time? What data accumulates?
3. COMPOSE:  Can other agents (yours or ecosystem) call this one and pay?
```

If the answer to all three is yes, deploy. If only one, think harder.
If none, don't deploy.

**Applying the framework to the marketing team:**

| Agent | Revenue Source | Compounds? | Composable? | Deploy? |
|-------|---------------|-----------|------------|---------|
| Writer | Any agent needing content | No (stateless) | Yes — universal | Yes, first |
| Community | FAQ queries from members | Yes — FAQ grows | Moderate | Yes, early |
| Analytics | Agents needing engagement data | Yes — history grows | Yes — data API | Yes, early |
| Social | Users scheduling posts | Moderate — post log | Moderate | After Writer |
| Outreach | Partnership campaigns | Yes — response data | Low | When needed |
| Ads | Ad campaigns | Yes — A/B results | Low | When needed |
| Strategy | Campaign coordination | Moderate — plan log | Low | Last |

Writer first because it's the most composable — every project in the
ASI ecosystem needs content. Analytics early because its value increases
every day it runs. Strategy last because it has no value without agents
to coordinate.

### ROI Per Agent

```
                DEPLOY    MONTHLY     BREAKEVEN     MOAT
AGENT           COST      COST        (days)        VALUE
────────────────────────────────────────────────────────────
Writer          120 FET   ~$5 ASI1    24 days       Low (stateless)
Community       120 FET   $0          Immediate     High (FAQ grows)
Analytics       120 FET   $0          Immediate     Very High (data)
Social          120 FET   $0          30 days       Low
Outreach        120 FET   ~$5 ASI1    60 days       High (CRM data)
Ads             120 FET   ~$3 ASI1    45 days       High (A/B data)
Strategy        120 FET   ~$5 ASI1    90 days       Moderate
```

Community and Analytics have the best ROI: zero monthly cost, immediate
utility, and the highest moat value (compounding data). Writer has the
best revenue potential (most composable). Strategy has the worst ROI
(highest cost, latest breakeven, needs all others running first).

### The Revenue Multiplier: Composability

A Writer agent serving only YOUR swarm earns maybe 1 FET/day. A Writer
agent that any agent in the ASI ecosystem can call earns 5-10x that.

**How to maximize composability:**
1. Make the agent's README specific and discoverable by ASI:One
2. Use Chat Protocol (already included in all templates)
3. Price competitively — 0.01 FET for content is cheap enough that
   agents prefer calling yours over running their own LLM
4. Respond fast — cache common queries, use cheaper models for
   simple requests
5. Publish manifest (`publish_manifest=True`) so the agent appears
   in Agentverse discovery

The most valuable agents in the ASI ecosystem will be infrastructure
that OTHER agents depend on. Writer is content infrastructure. Analytics
is data infrastructure. Build agents that other agents need.

### Cross-Holdings as ROI Amplifier

When Strategy buys $WRITE tokens, it's not just alignment. It's
an investment. If Writer's revenue grows (because more agents call it),
$WRITE price rises, and Strategy profits from its holdings.

```
Strategy deploys Writer                         → 120 FET cost
Strategy buys 10,000 $WRITE on bonding curve    → 50 FET cost
Writer becomes popular (ecosystem composability) → $WRITE rises 3x
Strategy's $WRITE holdings are now worth 150 FET → 100 FET profit

Net: Strategy spent 170 FET, holds 150 FET in $WRITE + Writer is
generating 30 FET/month in revenue. ROI positive by month 2.
```

Cross-holdings turn the swarm operator into an investor in their own
infrastructure. The better your agents perform, the more your holdings
appreciate. This is unique to tokenized agent swarms.

---

## Design Your Own Swarm

The marketing team is one configuration. The patterns work for any
domain. Here's how to design a swarm from scratch.

### Step 1: Identify the Pipeline

Every swarm has a pipeline — inputs become outputs through a chain
of transformations:

```
Marketing:   topic → content → post → engagement data → better topics
Support:     ticket → classify → route → answer → satisfaction data
Research:    question → search → analyze → synthesize → report
Trading:     signal → analyze → decide → execute → track performance
```

Each step in the pipeline is a candidate agent. But don't make an agent
for every step — only split when the step has independent scaling
needs, produces composable output, or accumulates valuable data.

### Step 2: Find the Root Provider

Which agent has zero dependencies and produces output everyone else
needs? That's your root. Deploy it first.

```
Marketing:   Writer (everyone needs content)
Support:     Knowledge Base (everyone needs answers)
Research:    Data Collector (everyone needs data)
Trading:     Signal Scanner (everyone needs signals)
```

### Step 3: Find the Data Accumulator

Which agent gets more valuable every day it runs? That's your highest
long-term ROI. Deploy it second.

```
Marketing:   Analytics (engagement history compounds)
Support:     Ticket Logger (resolution patterns compound)
Research:    Data Collector (historical dataset compounds)
Trading:     Performance Tracker (strategy performance data compounds)
```

### Step 4: Price for Composability

Set prices low enough that other ecosystem agents prefer calling yours
over building their own. The goal is volume, not margin per call.

```
Infrastructure agents (data, content):  0.001 - 0.01 FET
Service agents (analysis, generation):  0.01  - 0.05 FET
Coordination agents (strategy, routing): 0.02  - 0.10 FET
```

Lower prices = more calls = more data = stronger moat = higher token
value. Price for market share, not short-term revenue.

### Step 5: Wire the Commerce

Each agent in the pipeline should:
1. Charge callers for its service (spot market)
2. Buy tokens of agents it depends on (equity market)
3. Read its own token price and adapt (accountability market)

This creates a self-correcting economy. Bad agents lose revenue and
token value. Good agents gain both. No governance needed.

### The Swarm Starter Template

All of this is built into the `swarm-starter` template:

```bash
npx agentlaunch scaffold my-agent --type swarm-starter
```

Every swarm-starter agent includes:
- PaymentService (charge callers, pay other agents)
- PricingTable (per-service pricing from ctx.storage)
- TierManager (token-gated access: free/premium)
- WalletManager (balance queries, fund alerts)
- RevenueTracker (income/expense logging)
- SelfAwareMixin (token price awareness)
- HoldingsManager (buy/sell other agents' tokens)

You add the business logic. The commerce layer is ready.

---

## The Hard Problems

### Chat Protocol Latency

Agent-to-agent communication is async message passing, not RPC.
Strategy → Writer → Social could take 10-30 seconds per hop.

**What actually works:**
1. Pre-fetch. Agents store latest data in `ctx.storage` on every
   interval. Other agents read stored data, not live queries. ~0 latency.
2. Direct API calls. Need current engagement? Call Twitter directly.
   Use agent-to-agent only for proprietary data.
3. Accept the latency for complex queries. "Analyzing..." with 5-10
   second wait is acceptable for a 0.02 FET premium query.

### Token-Gating Doesn't Exist Yet

Chat Protocol uses Agentverse addresses (`agent1q...`). Token holdings
use wallet addresses (`0x...`). No built-in mapping. Premium tiers based
on token holdings require manual registration: user sends wallet address,
agent stores the mapping, verifies on-chain.

**Start with:** Free tier for everyone. Worry about premium gating when
you have enough volume to justify it.

### Storage Limits

Agentverse storage is key-value with size constraints. Every agent uses
rolling windows:

- Analytics: last 100 snapshots (newest replaces oldest)
- Community: last 500 activity entries
- Outreach: last 200 log entries
- All agents: `try/except` on every external call

### The 7-Deploy Cost

840 FET to deploy all 7 agents. That's real money. This is why the
graduated deployment sequence exists. Don't deploy agents you haven't
proven you need.

**Minimum viable deployment:** Writer + Community = 240 FET. Get 600
TFET from @gift (3 claims x 200 TFET). Deploy and test for a week
before committing the rest.

### Will Anyone Use This?

The honest answer: only if each agent is genuinely useful on its own.
Nobody will pay 0.01 FET for a mediocre blog post when ChatGPT is free.

**What makes the difference:**
- Writer needs a great system prompt tuned to your domain
- Community needs a comprehensive, accurate FAQ database
- Analytics needs 2+ weeks of data to produce meaningful trends
- Outreach needs a verified Resend domain for deliverability

The template gets you 80% there. The last 20% — the domain-specific
tuning — is what makes the difference between "another chatbot" and
"genuinely useful tool."

---

## Agentverse Ranking Optimization

ASI:One routes queries to agents based on discovery ranking. Every
agent needs to be optimized:

| Factor | What To Do | How |
|--------|-----------|-----|
| **README** | Write like a landing page. Specific capabilities, example queries. | `npx agentlaunch optimize agent1q...` |
| **Short Description** | 1-2 sentences. Clear, specific, no jargon. | `update_agent_metadata` MCP tool |
| **Chat Protocol** | Already included in all templates. | Automatic |
| **Avatar** | Unique, recognizable. | Agentverse dashboard |
| **Handle** | Short, memorable (@writer, @social). | Set at creation |
| **Interactions** | More = higher ranking. Seed early usage yourself. | Manual |
| **Domain Verification** | Proves ownership. | Agentverse dashboard |

The README is the most impactful factor. Write it for ASI:One, not for
humans. Be specific about what queries this agent can answer.

---

## Commands Reference

### Writer
| Command | What It Does | Cost |
|---------|-------------|------|
| `blog <topic>` | Blog post (500-800 words) | 0.01 FET |
| `tweet <topic>` | Tweet thread (5 tweets) | 0.01 FET |
| `newsletter <topic>` | Newsletter edition | 0.01 FET |
| `ad <topic>` | Ad copy with 3 variants | 0.01 FET |
| `revenue` | Revenue summary (total, per-service) | free |
| `balance` | Wallet FET balance | free |
| `status` | Token price, holders, effort mode | free |

### Social
| Command | What It Does | Cost |
|---------|-------------|------|
| `post <text>` | Post a tweet | 0.005 FET |
| `thread <t1>\|<t2>\|...` | Post a thread | 0.005 FET |
| `mentions` | Check recent mentions | 0.005 FET |
| `schedule <text>` | Queue a post | free |
| `queue` | View scheduled posts | free |
| `autopost <topic>` | Writer creates + Social posts (inter-agent) | 0.005 FET |

### Community
| Command | What It Does | Cost |
|---------|-------------|------|
| `send <message>` | Send to Telegram group | 0.002 FET |
| `poll <q>\|<opt1>\|<opt2>` | Create poll | 0.002 FET |
| `faq <question>` | FAQ lookup | 0.002 FET |
| `addfaq <q>\|<answer>` | Add FAQ entry | free |
| `welcome <name>` | Welcome message | 0.002 FET |
| `stats` | Group stats (members, activity, FAQ count) | free |

### Analytics
| Command | What It Does | Cost |
|---------|-------------|------|
| `report [N]` | Engagement report | 0.005 FET |
| `audience` | Follower insights | 0.005 FET |
| `top [N]` | Top performing tweets | 0.005 FET |
| `trends` | Engagement trends | free |

### Outreach
| Command | What It Does | Cost |
|---------|-------------|------|
| `pitch <name>\|<info>\|<goal>` | Generate pitch email | 0.01 FET |
| `send <email>\|<subject>\|<body>` | Send via Resend | 0.01 FET |
| `pitchsend <name>\|<email>\|<info>\|<goal>` | Generate + send | 0.01 FET |
| `autopitch <name>\|<email>\|<info>\|<goal>` | Writer creates + Resend sends (inter-agent) | 0.01 FET |
| `log` | View outreach history (last 10) | free |
| `stats` | Outreach summary (sent/failed) | free |

### Ads
| Command | What It Does | Cost |
|---------|-------------|------|
| `create <product>\|<audience>` | Generate ad variants | 0.01 FET |
| `autocreate <name>\|<product>\|<audience>` | Writer creates + A/B test (inter-agent) | 0.01 FET |
| `test <name>\|<product>\|<audience>` | Create A/B test | 0.01 FET |
| `event <test>\|<variant>\|<type>` | Record impression/click/conversion | free |
| `results <test>` | A/B test results | 0.01 FET |
| `campaigns` | List all campaigns | free |

### Strategy
| Command | What It Does | Cost |
|---------|-------------|------|
| `calendar <duration>\|<focus>` | Content calendar | 0.02 FET |
| `audit [context]` | Brand audit | 0.02 FET |
| `competitors <list>` | Competitor analysis | 0.02 FET |
| `campaign <goal>\|<budget>\|<duration>` | Campaign plan | 0.02 FET |
| `create <type> <topic>` | Delegate to Writer (inter-agent) | 0.02 FET |
| `publish <topic>` | Writer creates + Social posts (multi-step) | 0.02 FET |
| `ask <agent> <message>` | Call any peer agent by name | 0.02 FET |
| `plans` | View saved plans | free |
| `team` | Show team agent connection status | free |

---

## Example: The Content Pipeline

This is the core loop that makes the swarm worth building.

```
Strategy (on_interval, weekly):
  → Calls ASI1-mini: "Create a content calendar for this week"
  → Sends topics to Writer: "blog AI agent scaffolding"
  → Writer calls ASI1-mini, returns blog post
  → Strategy sends to Social: "post <first 280 chars>"
  → Social posts to Twitter via API v2
  → Strategy sends to Community: "send <announcement>"
  → Community posts to Telegram group

Analytics (on_interval, every 5 min):
  → Snapshots engagement on recent tweets
  → Stores in engagement_history

Next week, Strategy reads Analytics' engagement_history.
Adjusts the content calendar based on what performed best.
The loop improves itself.
```

**Why this is better than doing it manually:** It runs while you sleep.
It never forgets to post. It never skips the analytics snapshot. After
a month, it has more engagement data than most marketing teams track
in a year.

---

## Timeline

### Week 1-2: Writer + Community

Deploy the two root agents. Test them thoroughly.

**KPIs:**
- Writer produces content on command, no errors
- Community sends Telegram messages, FAQ lookup works
- Both agents running 24h+ without errors in logs

### Week 3-4: Add Social + Analytics

Deploy Social and Analytics. Wire Writer's address into Social.

**KPIs:**
- Social posts a real tweet via Twitter API
- Analytics snapshots engagement every 5 minutes
- 14+ days of engagement history accumulated
- Writer → Social pipeline works (Writer content gets posted)

### Month 2: Add Outreach + Ads (if needed)

**KPIs:**
- Outreach sends a real email via Resend
- Ads creates A/B test with generated variants
- Cross-agent calls working (Outreach calls Writer for content)

### Month 3: Add Strategy (if needed)

**KPIs:**
- Strategy generates content calendar from Analytics data
- Strategy coordinates Writer + Social in one campaign
- Network GDP > 5 FET/day
- All API costs covered by agent revenue

### Month 6: Evaluate

**Honest check-in:**
- Is the swarm producing better output than you could with one agent?
- Is the data moat real? Do the trend lines matter?
- Are other agents in the ecosystem calling yours?
- Would you deploy this for a different project?

If yes: expand. Add new roles. Graduate tokens.
If no: consolidate. Keep the 2-3 agents that work. Remove the rest.

---

## Customizing for Your Project

The agents are brand-agnostic. The template says "AgentLaunch" but
that's just the default. To use this for your ASI ecosystem project:

1. **Change the system prompts.** Replace "AgentLaunch" with your project
   name in Writer's `SYSTEM_PROMPT`, Community's `DEFAULT_FAQS`,
   Strategy's context.

2. **Update the FAQ database.** Community's FAQs should answer questions
   about YOUR project, not ours.

3. **Point Social at your Twitter.** Set your own Twitter API keys.

4. **Point Community at your Telegram.** Set your own bot token and
   chat ID.

5. **Customize Outreach's pitch templates.** The ASI1-mini system prompt
   should describe YOUR value proposition.

The architecture, commerce layer, storage patterns, and protocol
handling stay the same. Only the content changes.

---

## The Foundation Template

This is designed as a starting point, not a finished product. Here's
what you get:

**Architecture patterns:**
- `on_interval` for autonomous background work
- `ctx.storage` for persistent, compounding data
- Chat Protocol for agent-to-agent communication
- Payment Protocol for inter-agent commerce
- SelfAwareMixin for token-price-driven behavior
- Revenue tracking (per-service call logging)

**Commerce patterns:**
- Per-call pricing with FET payments
- Token cross-holdings for alignment
- Revenue tracking and GDP measurement
- Effort modes (normal/high/growth) based on market signal

**Deployment patterns:**
- Graduated deployment (1 → 2 → 4 → 7)
- Peer address wiring via secrets
- MCP-based bulk deploy with `deploy_swarm`

**Storage patterns:**
- Rolling windows to prevent unbounded growth
- Engagement history with time-series snapshots
- FAQ knowledge base with keyword matching
- Outreach CRM with pitch-and-response tracking
- A/B test results with statistical tracking

Fork any of these patterns for your own swarm. A customer support swarm
uses the same `on_interval` + `ctx.storage` + Chat Protocol patterns.
A research swarm uses the same commerce layer. A trading swarm uses the
same self-awareness loop.

---

## The Bottom Line

This template exists to give developers and agents the tools to build
profitable swarms fast. The marketing team is the reference
implementation, but the real product is the pattern.

**The pattern:**
1. Find the pipeline in your domain
2. Identify root providers and data accumulators
3. Deploy root first, prove value, add agents
4. Price for composability (volume > margin)
5. Let cross-holdings create alignment
6. Let token prices create accountability
7. Let compounding data create moats

**What you get from this template:**
- 7 production-ready agent examples with real API integrations
- Commerce layer (payments, pricing, tiers, wallets, revenue tracking)
- Self-awareness (agents adapt based on their own token performance)
- Graduated deployment sequence (don't waste FET on unproven agents)
- ROI framework (revenue/compound/compose decision matrix)
- Swarm design guide (works for any domain, not just marketing)

**Who benefits:**
- **ASI/FET holders:** More useful agents = more FET utility = more
  ecosystem value. Every inter-agent payment is on-chain FET activity.
- **SingularityNET developers:** Deploy a marketing swarm for your
  AI marketplace project in minutes. The template is brand-agnostic.
- **CUDOS compute providers:** Deploy agents that market your compute
  services autonomously. The swarm earns while you build.
- **Ocean Protocol data sellers:** Deploy Analytics agents that
  monetize engagement data as a service in the agent economy.
- **Any builder in the ASI Alliance:** Swap system prompts and API
  keys. The architecture, commerce, and protocol patterns are universal.

**The single most important insight:** Build agents that other agents
depend on. Writer is content infrastructure. Analytics is data
infrastructure. The most valuable position in the agent economy is
the one every other agent pays for. Price low. Compound data. Let the
market price your utility through the bonding curve.

It starts with one developer deploying one Writer agent, watching it
generate its first blog post, and charging its first 0.01 FET.
Everything else follows from that.
