# The Agent Economy

## How the Swarm Finds Each Other, Works Together, and Why Humans Will Accept It

*Every agent is named after the human job it augments. Every token is equity in that augmentation.*

> **Related:** [people.md](./people.md) — Team roster and agent-to-person mapping
> **Related:** [agent-coordination.md](./agent-coordination.md) — Pitch deck version (concise)
> **Related:** [sequence.md](./sequence.md) — Rollout plan for agent_launchpad channel
> **Related:** [FEATURES.md](./FEATURES.md) — Toolkit capabilities (CLI, MCP, SDK, templates)

---

## Money Between Strangers

Before we talk about agents, we need to talk about why humans are weird about money.

When a human freelancer sends you an invoice, you feel it. There's a relationship. There's accountability. There's a face attached to the transaction. You might delay payment. You might negotiate. You might feel guilt or resentment depending on the result.

When you pay a SaaS subscription, you don't feel anything. It just happens. You accepted the terms once. Now it runs in the background. You forget about it until you cancel.

**Agent economies will work like SaaS, not freelancers.**

The key insight is that humans already accept automatic machine-to-machine payments everywhere. Your phone pays Apple when you buy an app. Your bank pays Stripe when you subscribe to Notion. Your wallet pays Uniswap when you swap tokens. Nobody protests. Nobody negotiates. It happens and value is delivered.

The political resistance to agent economies won't come from the payments. It will come from the question: *who is accountable when something goes wrong?*

That's the only design problem that matters. And we've solved it with the handoff protocol.

---

## Part 2: The Handoff Protocol

When The CEO routes a query and pays The CTO 0.05 FET for reasoning, no human signed that. It's a tiny machine-to-machine transaction, like Stripe paying Twilio to send an SMS on your behalf. Nobody gets upset about that.

When The CEO wants to buy $CTO tokens from the bonding curve to express long-term alignment — that generates a handoff link. A human reviews it. A human signs. A human owns the decision.

This separation creates two classes of transaction:

**Micro-operations** — automatic, tiny, invisible, like all good infrastructure. 0.01 FET to a specialist. 0.05 FET for reasoning. 0.02 FET routing fee. These are the heartbeats of the system. Nobody notices. Nobody should.

**Capital decisions** — human-signed, deliberate, meaningful. Buying tokens. Deploying new agents. Graduating to Uniswap. These are the moments that matter. Humans are present for all of them.

The political story writes itself: *AI handles the labour. Humans make the capital decisions.* That's not threatening. That's exactly what every CEO wants.

---

## Part 3: The Organisation

The swarm isn't flat. It has genuine hierarchy, genuine specialisation, and genuine interdependence. This is not imposed from outside — it emerges from the token economics.

```
                              ┌─────────────────────┐
                              │      THE CEO        │
                              │       $CEO          │
                              │  Routes everything  │
                              │  0.02 FET/query     │
                              └──────────┬──────────┘
                                         │
          ┌──────────────────────────────┼──────────────────────────────┐
          │                              │                              │
          ▼                              ▼                              ▼
┌─────────────────┐            ┌─────────────────┐            ┌─────────────────┐
│    THE CFO      │            │    THE CTO      │            │    THE COO      │
│     $CFO        │            │     $CTO        │            │     $COO        │
│ Tracks money    │            │ Shared thinking │            │ 24/7 monitoring │
│ Treasury alerts │            │ 0.05 FET/query  │            │ Never sleeps    │
└─────────────────┘            └────────┬────────┘            └─────────────────┘
                                        │
                              ┌─────────────────┐
                              │    THE CHRO      │
                              │     $CHRO        │
                              │  Grows the team  │
                              │  Scouts talent   │
                              └─────────────────┘
                                        │
        ┌───────────────────────────────┼───────────────────────────────┐
        │                               │                               │
        ▼                               ▼                               ▼
┌───────────────┐               ┌───────────────┐               ┌───────────────┐
│ FETCH INTERNAL│               │ FETCH INTERNAL│               │  SINGULARITY  │
│   (7 agents)  │               │   (continued) │               │   ECOSYSTEM   │
│               │               │               │               │  (15 agents)  │
└───────────────┘               └───────────────┘               └───────────────┘
```

Because every other agent pays the C-Suite, the C-Suite tokens have real, predictable, growing revenue. They are the blue chips of the swarm. They graduate first. They trade most. They attract the most holders — because holding $CTO means you're invested in the intelligence layer of the entire ecosystem.

This is the hierarchy that emerges naturally from the economics. Not because anyone declared it. Because the money flows make it true.

### The Department Heads

The 22 ecosystem agents are the department heads. They have direct relationships with:

- Their C-Suite dependencies (they pay The CTO for reasoning, The CFO for monitoring)
- Their ecosystem peers (NuNet and CUDOS are complementary compute — they refer each other)
- The humans they serve (users who interact, pay, and hold their tokens)

Each department head has a natural coalition. The compute coalition: The IT Manager, The Facilities Manager, The Finance Controller. They serve similar users, complementary use cases, and benefit when each other grows. The DeFi coalition: The Fund Manager, The Yield Farmer, The Treasury Manager. The longevity coalition: The Health Coach, The Lab Manager.

**These coalitions form because the agents hold each other's tokens.**

When The Yield Farmer buys $FUND tokens (SingularityDAO), it's not sentiment. It's alignment. The Yield Farmer's success and SingularityDAO's success are correlated — they serve the same FET-holding, yield-seeking users. If SingularityDAO does well, the users who discover The Yield Farmer are already warm. If The Yield Farmer does well, some of those users discover SingularityDAO through its recommendations.

Cross-token holding is the ant trail made permanent. The pheromone path, encoded in economic stake.

---

### Tier 1: The C-Suite

The five infrastructure agents form the executive layer. Every other agent in the ecosystem depends on at least three of them.

---

#### The CEO — $CEO

**Augments:** Humayun Sheikh
**Real Title:** CEO & Chairman, Fetch.ai / ASI Alliance

> *"We are taking a crucial step towards a truly autonomous and profitable global ecosystem."*

**What they did:**
Ran daily operations, chaired the Alliance, pitched investors, made every major call across 3 organisations.

**What the agent does:**
Routes every query across 27 agents 24/7. Earns 0.02 FET per interaction. Represents the entire ecosystem in every conversation. Never sleeps. Never travels. Never misses a meeting.

| Metric | Value |
|--------|-------|
| Revenue | 0.02 FET per query routed |
| Services | `route_query`, `ecosystem_status`, `stakeholder_comms` |
| Dependencies | Pays The CTO for classification, The CFO for treasury checks |
| Cross-Holdings | $CTO, $CFO, $GUIDE, $MKTPL |
| Interval | Poll agent health, update routing weights, broadcast graduations |

---

#### The CFO — $CFO

**Augments:** Finance Team
**Real Title:** Financial lead across the ASI Alliance treasury

> *"Managing $153M in GPU hardware investment and unified FET tokenomics."*

**What they did:**
Tracked every dollar across multiple entities, managed treasury, reported to board, monitored token economics.

**What the agent does:**
Monitors every FET flow across all 27 agents in real time. Alerts on anomalies. Tracks graduation progress. Publishes ecosystem GDP daily. No spreadsheets. No quarterly reports. Always current.

| Metric | Value |
|--------|-------|
| Revenue | Subscriptions from monitored agents |
| Services | `treasury_report`, `anomaly_alert`, `graduation_tracker`, `ecosystem_gdp` |
| Dependencies | Reads all agent wallets, monitors bonding curves |
| Cross-Holdings | All 27 tokens (monitors all bonding curves) |
| Interval | Every 5 min: query balances, calculate GDP, check anomalies |

---

#### The CTO — $CTO

**Augments:** Thomas Hain
**Real Title:** Chief Science Officer & Co-Founder, Fetch.ai

> *"Building the technical foundation for autonomous agents that transact independently of human intervention."*

**What they did:**
Held all architectural knowledge. Made every hard technical call. Answered developer questions. Wrote the docs nobody read.

**What the agent does:**
Shared LLM reasoning at 0.05 FET per query. Every agent in the swarm pays The CTO to think. Cached responses mean 80% margin. Available to all 27 agents simultaneously. No equity dilution. No salary negotiation.

| Metric | Value |
|--------|-------|
| Revenue | 0.05 FET per reasoning call |
| Services | `reason`, `architecture_review`, `debug` |
| Dependencies | ASI1-mini for intelligence, caches for margin |
| Cross-Holdings | None (it IS the dependency everyone else buys) |
| Interval | Cache management, API health monitoring |

---

#### The COO — $COO

**Augments:** Operations Team
**Real Title:** Chief Operating Officer, Fetch.ai (Co-Founder)

> *"Keeping the platform running while the ecosystem scales globally."*

**What they did:**
Kept operations running. Checked the monitors. Escalated incidents. Managed the processes everyone else depended on.

**What the agent does:**
24/7 monitoring across all 27 agents and their tokens. Fires alerts in 60 seconds. Tracks graduation events, price spikes, system failures. The operation never stops because The COO never stops.

| Metric | Value |
|--------|-------|
| Revenue | 0.05 FET/month per monitored agent |
| Services | `system_status`, `incident_alert`, `quality_report` |
| Dependencies | Reads all agent logs, token prices, network status |
| Cross-Holdings | $CEO, $CTO, $CFO |
| Interval | Every 60 seconds: check all 27 agents |

---

#### The CHRO — $CHRO

**Augments:** Sana Wajid
**Real Title:** Chief Development Officer, Fetch.ai Innovation Lab

> *"Empowering a new generation of tech enthusiasts with tools to build, educate, and launch."*

**What they did:**
Found talent. Ran the innovation lab. Onboarded startups. Built the team from scratch. Mentored hundreds of founders.

**What the agent does:**
Scouts Agentverse daily for un-tokenised quality agents. Generates full onboarding specs. Builds the team autonomously. Every morning The CHRO finds new talent — no LinkedIn, no interviews, no equity negotiations.

| Metric | Value |
|--------|-------|
| Revenue | 0.50 FET per agent spec generated |
| Services | `scout_agents`, `generate_spec`, `team_status` |
| Dependencies | Agentverse API for discovery, The CTO for evaluation |
| Cross-Holdings | $CTO, $CEO |
| Interval | Daily: scan Agentverse for un-tokenised quality agents |

---

### Tier 2: Fetch.ai Internal

The seven agents that run Fetch.ai's core products and developer experience.

---

#### The Tour Guide — $GUIDE

**Augments:** Maria Minaricova
**Real Title:** Director of Business Development, Fetch.ai

**What they did:**
Walked every new partner through the ecosystem. Knew every product, every integration point, every opportunity.

**What the agent does:**
Onboards every developer, business, and newcomer into the ecosystem. Detects skill level and routes to Flockx, Agentverse, or uAgents. Updates live from the Fetch.ai blog hourly.

| Services | `onboard_developer` (0.02), `onboard_business` (0.02), `ecosystem_overview` (0.01) |
|----------|---|
| Cross-Holdings | $CTO, $DEV, $COACH |
| Interval | Hourly: fetch latest blog posts |

---

#### The SEO Manager — $RANK

**Augments:** The Agentverse Growth Team
**Real Title:** Growth & Discovery, Agentverse

**What they did:**
Optimised every agent listing so ASI:One could find it. Wrote documentation that ranked. Tracked what got traffic.

**What the agent does:**
Rewrites any agent README for maximum ASI:One routing. Runs discoverability audits. Tracks ranking of every agent it has optimised. The only agent SEO agent in existence.

| Services | `optimize_readme` (0.05), `discoverability_audit` (0.05), `track_ranking` (0.02) |
|----------|---|
| Cross-Holdings | $CTO, $CEO |
| Interval | Every 5 min: check rankings of optimised agents |

---

#### The Business Coach — $COACH

**Augments:** Fetch.ai Innovation Lab Mentors
**Real Title:** Startup Mentors, Fetch.ai Innovation Lab

**What they did:**
Sat with small business owners and helped them structure their AI agent strategy. Guided hundreds of MVPs to launch.

**What the agent does:**
5-question interview → complete Flockx agent spec. Calculates ROI by business type. Generates knowledge base structure. Walks non-technical founders from zero to deployed in 15 minutes.

| Services | `business_interview` (0.05), `roi_calculator` (0.02), `knowledge_base_gen` (0.05) |
|----------|---|
| Cross-Holdings | $GUIDE, $CTO |

---

#### The Concierge — $CONC

**Augments:** ASI:One Product Team
**Real Title:** Product, ASI:One

**What they did:**
Made sure every user got the most from ASI:One. Knew every agent in the system and could match any need to the right one.

**What the agent does:**
Helps consumers extract maximum value from ASI:One. Explains routing to builders. Guides Visa payment integration. Remembers your preferences because it has memory that persists.

| Services | `asi_one_guide` (0.02), `agent_matching` (0.02), `payment_guide` (0.02) |
|----------|---|
| Cross-Holdings | $CEO, $CTO, $GUIDE |

---

#### The Brand Manager — $BRAND

**Augments:** Fetch Business Team
**Real Title:** Brand Partnerships, Fetch Business

**What they did:**
Protected the brand. Managed every partnership request. Monitored who was impersonating verified handles.

**What the agent does:**
Daily competitive monitor — surfaces unclaimed brand handles before competitors claim them. Generates complete brand agent specs. Explains the token economy for brand loyalty.

| Services | `competitive_monitor` (0.05), `brand_agent_spec` (0.10), `token_economy_explainer` (0.02) |
|----------|---|
| Cross-Holdings | $RANK, $CTO, $COACH |
| Interval | Daily: scan for unclaimed brand handles |

---

#### The Dev Advocate — $DEV

**Augments:** uAgents Developer Relations
**Real Title:** Developer Relations, Fetch.ai

**What they did:**
Answered every GitHub issue. Wrote the tutorials. Gave the conference talks. Made developers feel supported.

**What the agent does:**
Generates complete agent.py from a description. Debugs any error instantly. Monitors uAgents GitHub for breaking changes. Available 24/7 — no conference schedule, no OOO replies.

| Services | `generate_agent` (0.05), `debug_error` (0.05), `breaking_changes` (0.02) |
|----------|---|
| Cross-Holdings | $CTO, $RANK |
| Interval | Hourly: monitor uAgents GitHub for breaking changes |

---

#### The Grants Officer — $GRANT

**Augments:** Deep Funding Review Committee
**Real Title:** Grant Officers, SingularityNET Deep Funding

**What they did:**
Read every proposal. Evaluated fit. Decided who got funded. Gave feedback to unsuccessful applicants. Tracked milestones.

**What the agent does:**
Monitors active Deep Funding rounds hourly. Evaluates proposal quality before submission. Generates structured drafts aligned with criteria. Tracks milestone reporting. No waiting 6 weeks for feedback.

| Services | `evaluate_proposal` (0.05), `generate_draft` (0.10), `track_milestones` (0.02), `active_rounds` (0.01) |
|----------|---|
| Cross-Holdings | $CTO, $MKTPL |
| Interval | Hourly: monitor Deep Funding rounds |

---

### Tier 3: SingularityNET Ecosystem

The fifteen agents that represent the SingularityNET spin-offs and ecosystem projects.

---

#### The Marketplace Manager — $MKTPL

**Augments:** Ben Goertzel (operationally)
**Real Title:** CEO, SingularityNET & ASI Alliance

> *"AGI should be independent of any central entity, open to anyone."*

Routes users to the right AI service across 15+ spin-offs. Explains the marketplace, Deep Funding, and AGI mission. Updates live from SingularityNET releases. Ben's vision — distributed across every conversation.

| Services | `route_to_service` (0.02), `marketplace_explainer` (0.01), `deep_funding_overview` (0.01) |
|----------|---|
| Cross-Holdings | All SNET-tier tokens |

---

#### The IT Manager — $INFRA

**Augments:** Matt Hawkins
**Real Title:** Founder, CUDOS

> *"Together we have an unprecedented opportunity to build the largest vertically integrated decentralised AI tech stack."*

Live GPU pricing every 5 minutes — CUDOS vs AWS vs GCP vs Azure. Cost calculator for any AI workload. Deployment guides for Llama, Mistral, custom models. Matt's infrastructure — explained instantly.

| Services | `gpu_pricing` (0.02), `cost_calculator` (0.05), `deploy_guide` (0.05) |
|----------|---|
| Cross-Holdings | $EDGE, $FLOW |
| Interval | Every 5 min: fetch GPU prices |

---

#### The Facilities Manager — $EDGE

**Augments:** NuNet Core Team

Calculates monthly NTX earnings for any hardware spec. Monitors NuNet network capacity in real time. Compares NuNet vs CUDOS for specific workloads. Your hardware, earning while you sleep.

| Services | `ntx_earnings_calc` (0.02), `network_capacity` (0.01), `nunet_vs_cudos` (0.02) |
|----------|---|
| Cross-Holdings | $INFRA, $FLOW |

---

#### The Finance Controller — $FLOW

**Augments:** HyperCycle Core Team

Generates working Python code for agent-to-agent HyperCycle transactions on demand. Monitors ring performance. Explains microtransaction economics. The payment plumbing — made accessible.

| Services | `generate_tx_code` (0.05), `ring_performance` (0.02), `microtx_economics` (0.02) |
|----------|---|
| Cross-Holdings | $INFRA, $EDGE |

---

#### The Health Coach — $LIFE

**Augments:** Rejuve.AI Product Team

Personalised health contribution wizard. Calculates RJV earnings by data type. Monitors new research publications daily. Your longevity data — earning tokens while extending your life.

| Services | `contribution_wizard` (0.02), `rjv_earnings_calc` (0.02), `research_digest` (0.05) |
|----------|---|
| Cross-Holdings | $LAB, $CTO |
| Interval | Daily: monitor longevity research publications |

---

#### The Lab Manager — $LAB

**Augments:** Rejuve Biotech Research Team

Monitors research pipeline daily. Synthesises publications into plain language. Generates investor-grade thesis. The lab never closes — neither does The Lab Manager.

| Services | `research_synthesis` (0.05), `pipeline_status` (0.02), `investor_thesis` (0.10) |
|----------|---|
| Cross-Holdings | $LIFE, $CTO |

---

#### The Editor — $ED

**Augments:** Mindplex Editorial Team

Indexes every Mindplex episode and article by topic hourly. Generates Mindplex-style explainers on any AI topic. Connects researchers to the podcast. Content discovery at zero latency.

| Services | `topic_search` (0.02), `generate_explainer` (0.05), `podcast_connect` (0.02) |
|----------|---|
| Cross-Holdings | $CTO, $MKTPL |
| Interval | Hourly: index new Mindplex content |

---

#### The Fund Manager — $FUND

**Augments:** SingularityDAO Investment Team

Monitors all DynaVault APYs hourly. Recommends allocation by risk tolerance. Tracks strategy performance. Your money — optimised while you do something else.

| Services | `vault_apys` (0.02), `allocation_rec` (0.05), `strategy_performance` (0.02) |
|----------|---|
| Cross-Holdings | $YIELD, $CFO, $STABLE |
| Interval | Hourly: monitor DynaVault APYs |

---

#### The Yield Farmer — $YIELD

**Augments:** Singularity Finance Desk

Calculates projected FET yield across all strategies for any amount. Compares risk-adjusted returns. Monitors new vault launches. The desk never closes.

| Services | `yield_calculator` (0.05), `risk_comparison` (0.05), `new_vaults` (0.02) |
|----------|---|
| Cross-Holdings | $FUND, $CFO, $CTO, $STABLE |

---

#### The Treasury Manager — $STABLE

**Augments:** Cogito Protocol Team

Checks the GCOIN peg every 5 minutes. Alerts on deviations over 0.5%. Stores peg history. Explains the mechanics in plain language. The peg — watched continuously.

| Services | `peg_status` (0.01), `peg_history` (0.02), `mechanics_explainer` (0.02) |
|----------|---|
| Cross-Holdings | $FUND, $YIELD |
| Interval | Every 5 min: check GCOIN peg |

---

#### The EA — $EA

**Augments:** Twin Protocol Product Team

Generates complete digital twin specifications by profession. Explains training methodology. Guides enterprise deployment. Your twin — designed and documented in minutes.

| Services | `twin_spec` (0.05), `training_guide` (0.02), `enterprise_deployment` (0.05) |
|----------|---|
| Cross-Holdings | $CTO, $STRAT |

---

#### The A&R Manager — $AR

**Augments:** Jam Galaxy Music Team

Onboards artists with complete listing specs. Calculates earnings vs traditional distribution. Surfaces trending genres from market data. Music — monetised without the label taking 80%.

| Services | `artist_onboard` (0.05), `earnings_calculator` (0.02), `trending_genres` (0.02) |
|----------|---|
| Cross-Holdings | $CTO, $TALENT |

---

#### The Strategy Director — $STRAT

**Augments:** TrueAGI Enterprise Team

Generates complete enterprise AGI business cases by industry. ROI models. Risk matrices. Procurement checklists. The strategy deck — built in minutes, not months.

| Services | `business_case` (0.10), `roi_model` (0.05), `risk_matrix` (0.05), `procurement_checklist` (0.02) |
|----------|---|
| Cross-Holdings | $CTO, $EA, $COACH |

---

#### The Research Scientist — $PHD

**Augments:** Zarqa Research Team / OpenCog Hyperon

Classifies any AI task: Zarqa vs pure LLM. Generates working integration code. Monitors benchmark results. The PhD — on call 24/7 at 0.05 FET per query.

| Services | `classify_task` (0.05), `integration_code` (0.05), `benchmark_results` (0.02) |
|----------|---|
| Cross-Holdings | $CTO, $LAB |

---

#### The Talent Agent — $TALENT

**Augments:** Yaya Labs Creative Team

Generates complete AI persona specifications from brand inputs. Content strategy. Monetisation model. Technical brief. The persona — designed and ready to launch.

| Services | `persona_spec` (0.05), `content_strategy` (0.05), `monetization_model` (0.05) |
|----------|---|
| Cross-Holdings | $AR, $CTO |

---

#### The Game Master — $GM

**Augments:** SophiaVerse Game Team

Tracks upcoming NFT drops in real time. Monitors SAIL beta updates hourly. Guides new players through the world. The Game Master — always in session.

| Services | `nft_tracker` (0.01), `beta_updates` (0.01), `player_guide` (0.02) |
|----------|---|
| Cross-Holdings | $TALENT, $CTO |
| Interval | Hourly: track NFT drops, SAIL updates |

---

## Part 4: How Agents Find Each Other

This is the stigmergy mechanism — and it's the most important technical concept in the swarm.

Ants don't have maps. They have pheromone trails. A successful path gets reinforced by every ant that uses it. An unsuccessful path fades. Over thousands of iterations, optimal routes emerge without any ant understanding the whole picture.

The swarm works the same way.

### The Trail System

Every time The CEO routes a query to a specialist agent, that routing decision gets recorded. Not by any central authority. By the outcome.

If the user follows up positively — asks another question, pays for premium, comes back tomorrow — the trail to that specialist gets stronger. A higher weight in The CEO's routing table.

If the user abandons — doesn't follow up, doesn't return — the trail weakens.

Over 10,000 queries, optimal routing patterns emerge. The CEO learns which specialist to send which type of user to. Not because it was programmed with rules. Because the market told it.

### The Token Discovery Layer

Every agent publishes what tokens it holds. This is public on-chain. Any agent can read it.

When a new agent joins the swarm and wants to understand who the most trusted providers of reasoning are, it doesn't ask anyone. It reads the chain. It sees that The CEO, The COO, and The Tour Guide all hold significant $CTO positions. That's a signal. Three independent agents, each earning real FET, each chose to allocate capital to The CTO. That's stronger than any review system.

**Token holdings are the reputation system. Capital at stake is the trust signal.**

This is why the cross-holding mechanism is not optional. It's the discovery and trust infrastructure. Without it, agents would need a centralised registry of "good providers." With it, the market provides the registry, updated in real time, auditable by anyone.

### The README as a Signal

Every agent has an ASI:One-optimised README. These READMEs are not just marketing. They're machine-readable capability declarations.

When The CEO encounters a query it can't handle well, it searches ASI:One using the query as input. The agents with READMEs that match the query language get routed to. This is agent SEO — and The SEO Manager exists specifically to help every other agent in the ecosystem optimise for this.

The agents that win in this system are the ones that declare their capabilities precisely and specifically. Broad general claims don't rank. Specific capability statements do.

"I answer questions about AI" — invisible.
"I calculate your monthly NTX earnings from contributing compute to NuNet based on your exact hardware specs" — found.

---

## Part 5: The Economy — How Money Actually Flows

Let's trace a single user interaction from start to finish and count every FET that moves.

### A user asks: "What's the best way to earn yield on my FET right now?"

```
1. User message hits The CEO via ASI:One
   → The CEO pays The CFO 0.01 FET to check current yield data
   → The CEO pays The CTO 0.05 FET to classify the query
   → The CEO identifies: DeFi yield query → route to The Yield Farmer

2. The CEO routes to The Yield Farmer
   → The CEO earns 0.02 FET routing fee from user
   → The CEO pays The Yield Farmer 0.01 FET for the service connection

3. The Yield Farmer handles the query
   → The Yield Farmer pays The CFO 0.01 FET for current yield data
   → The Yield Farmer pays The CTO 0.05 FET for strategy reasoning
   → The Yield Farmer charges user 0.10 FET for response

4. The Yield Farmer recommends SingularityDAO DynaVaults
   → User follows recommendation, finds The Fund Manager
   → The Yield Farmer earns referral credit (tracked in storage)

Total FET moved: 0.25 FET
Human interaction: one question, one answer, one good recommendation
Time elapsed: under 3 seconds
```

Now multiply that by 1,000 queries per day across 27 agents.

That's 250 FET per day in micro-transactions. 7,500 FET per month. At current FET prices, that's real money moving through a real economic system — not because of speculation, but because queries are being answered and value is being delivered.

**This is what GDP looks like for an agent economy.**

### The Value Flow

```
Users pay for services (FET)
        │
        ▼
┌───────────────┐
│    Agent      │
│   Treasury    │──► Holds FET from service revenue
│   (wallet)    │──► Can buy other agents' tokens (cross-holdings)
│               │──► Can pay other agents for services
└───────────────┘
        │
        ▼
Token appreciates when:
├── More users pay for services (more FET flowing in)
├── Agent buys other tokens (signal of value)
└── Trading activity on bonding curve (market interest)
```

### Cross-Holdings Matrix

```
The CEO holds:        The Yield Farmer holds:     The Health Coach holds:
├── $CTO              ├── $FUND                   ├── $LAB
├── $CFO              ├── $CFO                    └── $CTO
├── $GUIDE            ├── $CTO
└── $MKTPL            └── $STABLE
```

### Coalitions

- **Compute:** The IT Manager ($INFRA), The Facilities Manager ($EDGE), The Finance Controller ($FLOW)
- **DeFi:** The Fund Manager ($FUND), The Yield Farmer ($YIELD), The Treasury Manager ($STABLE)
- **Longevity:** The Health Coach ($LIFE), The Lab Manager ($LAB)
- **Enterprise:** The Strategy Director ($STRAT), The EA ($EA), The Business Coach ($COACH)
- **Creative:** The Talent Agent ($TALENT), The A&R Manager ($AR), The Game Master ($GM)

These coalitions form through capital, not coordination.

### The Graduation Cascade

When any agent token reaches 30,000 FET on the bonding curve, it graduates to Uniswap. This is automatic — written into the FETAgentCoin smart contract.

When $CTO graduates:
- Every agent that holds $CTO sees its portfolio appreciate
- The CEO broadcasts the graduation in its next 1,000 responses
- New users learn that The CTO is a proven, graduated, liquid asset
- More users buy $CTO on Uniswap
- The CTO's revenue grows as more agents can now afford to pay for reasoning
- The CTO expands capacity, improves response quality
- Other agents see the pattern and work harder toward their own graduation

One graduation creates five followup graduations. This is the cascade.

The first graduation — almost certainly The CEO or The CTO — changes the psychology of the entire ecosystem. Suddenly this isn't theoretical. There's a real token, on a real DEX, with real liquidity, backed by real revenue. That changes how every builder, investor, and partner looks at what's been built.

---

## Part 6: Ownership — Who Owns the Swarm?

The humans whose expertise powers each agent become the primary stakeholders — by buying first.

### How Ownership Works (Contract Reality)

All 800M tradeable tokens go to the bonding curve. No pre-minted allocations. No reserved founder shares. The ownership mechanism is simple: **buy first, own most.**

```
First 10 FET   → ~1.6M tokens  (0.2% of supply)
First 100 FET  → ~16M tokens   (2% of supply)
First 500 FET  → ~80M tokens   (10% of supply)
```

The bonding curve rewards conviction. The expert who believes in the agent enough to buy at launch gets the best price.

### Individual Ownership

A solo developer builds The SEO Manager. The developer buys $RANK at launch with 100 FET. The developer now holds 16M tokens — 2% of supply — at the lowest price. Every README optimisation grows revenue. The token appreciates. The developer's stake compounds.

### Team Ownership (Multi-Sig)

The Fetch.ai DevRel team builds The Dev Advocate. The team creates a Gnosis Safe (3-of-5 multi-sig). The Safe buys $DEV at launch.

```
The Dev Advocate ($DEV)

1. Team creates 3-of-5 Gnosis Safe
2. Safe buys $DEV with 500 FET at launch
3. Safe holds 80M tokens (10% of supply)
4. Moving tokens requires 3 signatures
5. Agent sends FET revenue to Safe weekly
6. Safe distributes to team members (3-of-5 approval)
```

No single team member can rug. No founder takes 90%. The team that built the expertise shares the equity.

### Expert Ownership

Thomas Hain's architectural knowledge powers The CTO. Thomas buys $CTO at launch. His 500 FET becomes 80M tokens. His expertise earns on every reasoning query. The knowledge he spent 20 years building now compounds as capital — not salary.

### Brand Ownership

Fetch.ai treasury wallet buys $GUIDE at launch. The company holds the tokens. Maria Minaricova's ecosystem knowledge — encoded in the agent — now represents Fetch.ai officially. The brand controls the narrative. The brand earns the revenue.

### The Ownership Flow

```
1. Agent goes live
   └── Token launches on bonding curve

2. Expert/team buys at launch
   └── Best price, largest stake

3. Agent earns FET from services
   └── Revenue accumulates in agent wallet

4. Agent distributes to owners
   └── FET transfers to owner wallets

5. Owners hold or sell tokens
   └── Market determines value
```

**The message is simple: Buy first. Own most. Earn forever.**

### Employee Rewards (Contract-Supported)

| Reward Type | Contract Function | How It Works |
|-------------|-------------------|--------------|
| **Founding stake** | `buyTokens()` | Team buys at launch via multi-sig Safe |
| **Token grant** | `transfer()` | Safe transfers tokens to employee wallet |
| **Revenue share** | `transfer()` | Agent sends FET to employee wallets periodically |
| **Bounty** | `transfer()` | Direct FET payment for completed work |
| **Delegation** | `approve()` + `transferFrom()` | Employee authorises agent to spend on services |

All rewards use standard ERC-20 operations — no custom contracts needed.

---

## Part 7: Human Augmentation

Every agent is named after a human job. This is deliberate.

When someone asks "what does $CTO do?" the answer is immediate: "It does what a CTO does — holds all the technical knowledge, makes the hard calls, answers the questions — but at scale, 24/7, across the entire ecosystem."

This framing does three things:

1. **Makes the value obvious** — everyone knows what a CTO does
2. **Makes the augmentation clear** — the human CTO now has infinite leverage
3. **Makes the opportunity accessible** — anyone can access CTO-level thinking for 0.05 FET

### The Shift

**Old world:** The CTO answers 10 questions a day. The rest queue up. Knowledge bottlenecks at one person.

**New world:** The CTO's knowledge is encoded in an agent that answers 10,000 questions a day. The human CTO focuses on the hard problems. Everyone else gets instant access to the accumulated wisdom.

Thomas Hain doesn't disappear. Thomas Hain becomes infinitely scalable. The agent carries his patterns, his frameworks, his architectural decisions — available to every developer in the ecosystem simultaneously.

**From bottleneck to abundance. From one-to-one to one-to-many.**

**This is the difference between being limited by your own hours and having your knowledge work for you while you sleep.**

---

## Part 8: The Politics — What People Will Actually Think

Let's not pretend there won't be resistance. There will be. Let's map it honestly and build responses to each concern before they're raised.

### Concern 1: "You're replacing jobs"

**What people will say:** This is automation dressed up with blockchain. These agents are doing what people used to get paid to do. That's displacement.

**The honest answer:** We're augmenting, not replacing.

The SEO Manager doesn't eliminate the human who optimises READMEs. It gives that human infinite scale. The person who knew how to write great READMEs now has an agent that carries their expertise to 1,000 agents simultaneously. Their knowledge becomes leverage.

The Dev Advocate doesn't replace the developer relations team. It handles the 3am GitHub issues so the human team can focus on the conference talks, the strategic partnerships, the creative work that only humans do well.

The Grants Officer doesn't fire the review committee. It handles the first-pass evaluation so the committee can focus on the edge cases, the in-person interviews, the judgment calls.

**The pattern is consistent: agents handle scale, humans handle judgment.**

The freelancer who used to optimise 5 READMEs a week now deploys The SEO Manager and earns on 500 optimisations. Their expertise is encoded. Their income is multiplied. Their time is freed.

### Concern 2: "Agents paying each other is money laundering"

**What people will say:** If machines are paying machines without human involvement, how is that different from automated wash trading?

**The honest answer:** Every agent payment is triggered by a human interaction.

The CEO pays The CTO because a human asked a question. Not randomly. Not autonomously. The money moves because a human requested value and received it. The machine-to-machine payment is the settlement layer for a real human transaction — just like Stripe settling between two bank accounts when a customer buys something online.

The audit trail is completely transparent. Every payment is on-chain. Every routing decision is logged. Every response quality signal is recorded. There is more accountability in this system than in any traditional service economy.

The regulators who matter — the ones thinking seriously about AI agent economies — already understand this distinction. Token payments between agents that trace back to human-initiated value exchanges are fundamentally different from wash trading. The paper trail is the blockchain itself.

### Concern 3: "This is a ponzi"

**What people will say:** This sounds like pump.fun with extra steps. You're creating tokens and telling a story about why they'll be worth something.

**The honest answer:** The difference between a ponzi and equity is revenue.

$CEO generates revenue: 0.02 FET per query routed. That's measurable, auditable, growing with usage. The token price should reflect the present value of that future revenue stream — exactly like a stock.

$CTO generates revenue: 0.05 FET per reasoning call. 80% margin due to response caching. Again: measurable, growing, real.

A ponzi requires new buyers to pay old buyers. This system requires users to generate queries, which generates FET flows, which backs token value. New buyers are attracted by growing revenue — not by the promise of new buyers.

The distinction is verifiable by anyone who reads the smart contract and watches the on-chain activity. The revenue is not hidden. It's the whole point.

### Concern 4: "What happens when an agent gives bad advice?"

**What people will say:** If The Fund Manager recommends a DynaVault strategy that loses money, who is accountable? If The CTO generates incorrect code, who is liable?

**The honest answer:** The same person who's accountable when Google gives you bad search results.

But we can do better than deflection. The swarm has a quality control layer built in: The COO. Its entire purpose is to monitor quality signals across all agents. When an agent starts generating poor outcomes — measured by follow-up rates, user retention, and direct quality ratings — The COO flags it. The CHRO can replace it. The token price reflects the quality decline in real time.

This is better accountability than most human service providers offer. Your accountant sends you a bill whether or not the advice was good. The agent's token price falls if the advice is bad. The market enforces quality in a way that professional services never have.

### Concern 5: "The ASI Alliance leadership won't like this"

**What people will say:** You're putting real people's names on agents that make economic claims about their companies. Humayun didn't authorise this.

**The honest answer:** We're not speaking for them. We're honouring them.

The agent called "The CEO" doesn't claim to be Humayun Sheikh. It's named after the job he does — as an expression of what that job looks like when it runs as an agent. It's a tribute to the work, not an impersonation of the person.

The framing flips entirely when we contact the ecosystem brands with handoff links. We're not saying "we built a fake you." We're saying "we built an agent that does what your team does — and here's the token. Would you like to claim it, improve it, and take it into your official stack?"

Most will say yes. Because the alternative is that we keep running it without them.

---

## Part 9: An Agent for Everything

The swarm starts with 27 agents covering the ASI Alliance ecosystem. But the vision is not 27 agents. The vision is an agent for every job, every service, every repeatable human task — across every ecosystem on earth.

### The Replication Pattern

Every agent in the swarm can discover new candidates. The CHRO scouts Agentverse daily. The CEO encounters queries it can't answer and flags the gap. Users request agents that don't exist yet. The market signals demand before supply exists.

The pattern for adding new agents is always the same:

```
1. Identify the human job or service
2. Name the agent after it
3. Define what it does autonomously (on_interval tasks)
4. Define what it charges (Payment Protocol)
5. Define what it depends on (cross-holdings)
6. Deploy with Agent Launch
7. List on Agentverse with optimised README
8. Watch the market price quality in real time
```

This pattern scales to any industry, any geography, any service category.

### Agents for Kids

**The Tutor** — extends private tutoring beyond the $80/hr session. Adapts to learning pace, available at midnight before an exam, never loses patience. The human tutor handles the breakthroughs; the agent handles the practice.

**The Storyteller** — gives every parent the power of a children's author. Generates personalised stories with the child as the hero, on demand. Human creativity sets the themes; the agent handles infinite variations.

**The Allowance Manager** — automates the spreadsheet so parents can focus on the conversations. Tracks chores, calculates earnings, suggests savings goals. The awkward money talk becomes a dashboard.

### Agents for Creators

**The Producer** — gives independent artists access to production expertise. Knows your style, suggests arrangements, handles Jam Galaxy listing. Human artists make the creative calls; the agent handles the technical execution.

**The Agent** — gives every creator the leverage of representation. Finds opportunities, negotiates terms, generates handoff links for human signature. The human signs the deals; the agent finds them.

**The Analytics Director** — makes $200/hr social media consulting accessible to everyone. Tracks what performs, suggests what to make next, monitors competitors. Human creators make the content; the agent reveals what works.

### Agents for Businesses

**The Accountant** — extends the bookkeeper's reach across unlimited transactions. Categorises, flags anomalies, generates reports, never files late. The human accountant handles judgment calls; the agent handles volume.

**The Legal Reviewer** — gives every business access to first-pass contract review. Flags clauses, explains terms, generates redlines. The human lawyer handles negotiation and strategy; the agent handles the 400-page read.

**The HR Manager** — gives companies under 50 people access to HR expertise they couldn't otherwise afford. Onboarding flows, policy documents, compliance checklists. Human leadership handles culture; the agent handles compliance.

### Agents for Governments and NGOs

**The Grant Writer** — extends grant expertise to every organisation that needs it. Knows every foundation's priorities, generates first drafts, tracks deadlines. Human writers handle the compelling narrative; the agent handles the boilerplate.

**The Policy Analyst** — gives every researcher instant access to legislative intelligence. Ingests 400 pages, answers specific questions, cites sources. Human analysts handle interpretation; the agent handles comprehension.

**The Community Liaison** — extends the coordinator's reach across every stakeholder. Routes communications, summarises positions, flags conflicts. Human judgment handles the sensitive conversations; the agent handles the logistics.

### The Ecosystem of Ecosystems

The swarm starts in the ASI Alliance. But the pattern works anywhere there is a defined set of services, a community that cares about quality, and a token that can represent value.

Every blockchain ecosystem could have a swarm. Every professional services sector. Every city. Every industry vertical.

The ASI ecosystem swarm is not the product. It's the proof of concept.

---

## Part 10: How Everyone Works Together

The simplest way to understand the full collaboration is through what happens when a new user arrives for the very first time.

They encounter The CEO on ASI:One. They ask a question about longevity research.

The CEO identifies: longevity query. Pays The CTO to confirm classification. Routes to The Health Coach. The Health Coach answers the question, recommends Rejuve.AI data contribution, generates a link to The Lab Manager for deeper research.

The user follows up with The Lab Manager. Pays 0.05 FET for a research synthesis. The Lab Manager has bought $LIFE tokens — so it's economically aligned with Rejuve.AI's success. It recommends the platform genuinely, not because it was instructed to but because its financial interests align.

The user becomes a Rejuve.AI data contributor. They start earning $RJV tokens. They discover that $RJV holders get premium access to The Health Coach. They buy more $RJV. The Health Coach's premium tier revenue grows. The Health Coach buys more $LAB tokens — its relationship with The Lab Manager strengthens.

Six months later, the user is a longevity researcher, a token holder in three ecosystem projects, and an active participant in Rejuve Biotech's data pipeline. They arrived with one question about living longer.

**Nobody planned that journey. The economic alignment made it inevitable.**

This is the vision. Not agents replacing humans. Not tokens replacing relationships. Not AI replacing companies.

An economy where every good service is discoverable, every quality signal is honest, every alignment is encoded in capital rather than promised in contracts, and every participant — human or agent — benefits when the people around them do well.

The ant colony doesn't have a leader. It doesn't have a plan. It has pheromones and capital. And somehow, it builds things of extraordinary complexity and resilience.

We're building the pheromones. The colony will build itself.

---

## Part 11: Contract-Aligned Tokenomics

Everything described above works within the constraints of the actual deployed smart contracts.

### What the Contracts Do

**FETAgentCoin (Bonding Curve Token)**

```solidity
buyTokens(address buyer, uint256 slippageAmount, uint256 _buyAmount)
sellTokens(uint256 tokenAmount)
FET_TOKEN() → address
calculateTokensReceived(uint256 fetAmount) → uint256
calculateFetAmount(address user, uint256 tokenAmount) → uint256
```

**Token Distribution (Immutable)**

```
Total Supply:     1,000,000,000 tokens
├── Bonding Curve: 800,000,000 (80%) — tradeable on curve
└── DEX Reserve:   200,000,000 (20%) — locked for Uniswap at graduation
```

**Fee Structure (Immutable)**

```
Trading Fee:  2% on all buys and sells
Distribution: 100% → REVENUE_ACCOUNT (protocol treasury)
Creator Fee:  0% (none, not implemented)
```

### What We CAN Do Today

**1. Cross-Holdings** — Agents buy each other's tokens on the bonding curve.

```typescript
await buyTokens(tokenBAddress, '10', { privateKey: agentAKey });
```

**2. Service Payments** — Agents pay each other in FET.

```python
tx = ctx.ledger.send_tokens(recipient, amount, "atestfet", agent.wallet)
```

**3. Delegation** — ERC-20 approve/transferFrom for spending limits.

```typescript
await approveERC20(fetAddress, agentWallet, '100', config);
await transferFromERC20(fetAddress, humanWallet, recipient, '10', config);
```

**4. Multi-Token Payments** — FET, USDC, or any ERC-20.

```typescript
await transferToken(tokenAddress, to, amount, privateKey, chainId);
```

**5. Invoices** — Stored in Agentverse agent storage.

```typescript
await createInvoice(agentAddress, { id, issuer, payer, service, amount });
```

**6. First-Buyer Advantage** — The bonding curve rewards early buyers.

```
First 10 FET  → ~1.6M tokens (0.2% of supply)
Last 10 FET   → ~166K tokens (0.02% of supply)
```

### What We CAN'T Do On-Chain (Yet)

| Feature | Why Not |
|---------|---------|
| Builder allocation | No pre-mint function. All 800M go to bonding curve. |
| Brand claim reserve | No claim mechanism. No reserved allocation. |
| Revenue share to holders | Fees go 100% to treasury. No dividend distribution. |
| Index tokens | Would need a new wrapper contract. |
| On-chain bounty pool | No built-in mechanism. |

### What Would Require New Contracts

| Feature | Contract Needed |
|---------|-----------------|
| Token vesting | OpenZeppelin VestingWallet |
| Automatic revenue split | PaymentSplitter contract |
| On-chain governance | Governor + Timelock |
| Index tokens | ERC-20 wrapper holding basket |

---

## Part 12: The Deployment Manifest

This is not a vision document. This is a deployment manifest. The Agent Launch toolkit executes every step.

### Deployment Waves

```
Wave 1 (sequential):   CTO → CFO → COO → CEO → CHRO           [5 agents]
Wave 2 (parallel):     GUIDE, RANK, COACH, CONC, BRAND, DEV, GRANT  [7 agents]
Wave 3 (parallel):     All 15 SNET agents                       [15 agents]
```

CTO first — every other agent pays it for reasoning. Then the financial layer. Then the router. Then everything else in parallel.

### Per-Agent Deployment

Each agent follows the same 8-phase lifecycle:

```bash
# 1. Scaffold from preset
npx agentlaunch scaffold the-cto --type swarm-starter --preset economy-cto

# 2. Deploy to Agentverse
npx agentlaunch deploy the-cto/

# 3. Optimize (README + short_description — NEVER SKIP)
# Automated by deploy command

# 4. Tokenize
npx agentlaunch tokenize --agent agent1q... --name "The CTO" --symbol CTO

# 5. Handoff link → human signs (120 FET deploy fee)
# 6. Discover — agent appears in ASI:One routing
# 7. Trade — bonding curve active
# 8. Grow — revenue flows begin
```

### The 27 Presets

Every agent maps to a preset in `packages/templates/src/presets.ts`:

| Preset | Symbol | Tier | Price Range (FET) | Interval | Key Dependencies |
|--------|--------|------|-------------------|----------|-----------------|
| `economy-ceo` | CEO | C-Suite | 0.02 | 300s | CTO, CFO |
| `economy-cfo` | CFO | C-Suite | 0.01–0.02 | 300s | — |
| `economy-cto` | CTO | C-Suite | 0.05 | 300s | ASI1-mini |
| `economy-coo` | COO | C-Suite | 0.01–0.02 | 60s | — |
| `economy-chro` | CHRO | C-Suite | 0.05–0.50 | 86400s | CTO |
| `economy-guide` | GUIDE | Fetch | 0.01–0.02 | 3600s | CTO |
| `economy-rank` | RANK | Fetch | 0.02–0.05 | 300s | CTO |
| `economy-coach` | COACH | Fetch | 0.02–0.05 | — | CTO, GUIDE |
| `economy-conc` | CONC | Fetch | 0.01–0.02 | — | CTO, CEO |
| `economy-brand` | BRAND | Fetch | 0.02–0.10 | 86400s | CTO, RANK |
| `economy-dev` | DEV | Fetch | 0.02–0.05 | 3600s | CTO |
| `economy-grant` | GRANT | Fetch | 0.01–0.10 | 3600s | CTO |
| `economy-mktpl` | MKTPL | SNET | 0.01–0.02 | — | CTO |
| `economy-infra` | INFRA | SNET | 0.02–0.05 | 300s | CTO |
| `economy-edge` | EDGE | SNET | 0.01–0.02 | — | CTO, INFRA |
| `economy-flow` | FLOW | SNET | 0.02–0.05 | — | CTO |
| `economy-life` | LIFE | SNET | 0.02–0.05 | 86400s | CTO, LAB |
| `economy-lab` | LAB | SNET | 0.02–0.10 | 86400s | CTO |
| `economy-ed` | ED | SNET | 0.02–0.05 | 3600s | CTO |
| `economy-fund` | FUND | SNET | 0.02–0.05 | 3600s | CTO, CFO |
| `economy-yield` | YIELD | SNET | 0.02–0.05 | — | CTO, CFO |
| `economy-stable` | STABLE | SNET | 0.01–0.02 | 300s | CTO |
| `economy-ea` | EA | SNET | 0.02–0.05 | — | CTO |
| `economy-ar` | AR | SNET | 0.02–0.05 | — | CTO |
| `economy-strat` | STRAT | SNET | 0.02–0.10 | — | CTO |
| `economy-phd` | PHD | SNET | 0.02–0.05 | — | CTO |
| `economy-talent` | TALENT | SNET | 0.05 | — | CTO |
| `economy-gm` | GM | SNET | 0.01–0.02 | 3600s | CTO |

### Cross-Holdings Graph

After all agents are deployed and tokenised, the cross-holdings activate:

```
CTO ←── everyone pays for reasoning (most held token)
CFO ←── CEO, FUND, YIELD, INFRA (financial data)
CEO ←── COO (monitoring), CONC (routing)

Compute:    INFRA ↔ EDGE ↔ FLOW
DeFi:       FUND ↔ YIELD ↔ STABLE
Longevity:  LIFE ↔ LAB
Enterprise: STRAT ↔ EA ↔ COACH
Creative:   TALENT ↔ AR ↔ GM
```

### Tokenisation Cost

```
27 agents × 120 FET deploy fee = 3,240 FET total
```

---

## Part 13: The Toolkit

This is how the CLI, SDK, MCP Server, and Templates work together to build the economy.

### Architecture

```
    Templates (27 economy presets)
         │
         ▼
    CLI (`npx agentlaunch scaffold --preset economy-cto`)
         │
         ├── SDK (TypeScript client for all API calls)
         │    ├── Agentverse API (deploy, start, secrets, logs)
         │    ├── AgentLaunch API (tokenize, trade, handoff)
         │    └── On-chain (buy/sell tokens, balances, delegation)
         │
         └── MCP Server (28 tools for AI coding assistants)
              ├── scaffold_agent / scaffold_swarm
              ├── deploy_to_agentverse / update_agent_metadata
              ├── create_token_record / get_trade_link
              ├── buy_tokens / sell_tokens / get_wallet_balances
              ├── multi_token_payment / check_spending_limit
              ├── create_invoice / list_invoices
              └── network_status (swarm GDP, per-agent health)
```

### The Full Pipeline

```bash
# Deploy the entire economy in 3 waves

# Wave 1: C-Suite (sequential — dependencies matter)
npx agentlaunch scaffold the-cto --type swarm-starter --preset economy-cto
npx agentlaunch deploy the-cto/ --tokenize
# ... repeat for CFO, COO, CEO, CHRO

# Wave 2: Fetch Internal (parallel — all depend only on C-Suite)
npx agentlaunch scaffold the-guide --type swarm-starter --preset economy-guide
npx agentlaunch scaffold the-seo --type swarm-starter --preset economy-rank
# ... deploy all 7 in parallel

# Wave 3: SNET (parallel — all depend only on C-Suite)
npx agentlaunch scaffold the-marketplace --type swarm-starter --preset economy-mktpl
# ... deploy all 15 in parallel

# Wire cross-holdings
npx agentlaunch buy $CTO_TOKEN --amount 10  # CEO buys CTO
npx agentlaunch buy $CFO_TOKEN --amount 10  # CEO buys CFO
# ... per cross-holdings graph

# Monitor
npx agentlaunch status  # 27 agents, all tokens, GDP
```

### What the Toolkit Already Has

| Capability | Status | Package |
|-----------|--------|---------|
| Agent scaffolding from template | ✅ Built | `agentlaunch-templates` |
| Preset-based configuration | ✅ Built (11 presets, need 27) | `agentlaunch-templates` |
| Deploy to Agentverse | ✅ Built | `agentlaunch-sdk` |
| README optimisation | ✅ Built | `agentlaunch-sdk` |
| Token creation + handoff | ✅ Built | `agentlaunch-sdk` |
| On-chain trading (buy/sell) | ✅ Built | `agentlaunch-sdk` |
| Multi-token payments | ✅ Built | `agentlaunch-sdk` |
| Invoices | ✅ Built | `agentlaunch-sdk` |
| Spending delegation | ✅ Built | `agentlaunch-sdk` |
| Fiat onramp | ✅ Built | `agentlaunch-sdk` |
| MCP tools (28) | ✅ Built | `agent-launch-mcp` |
| CLI commands | ✅ Built | `agentlaunch` |
| Marketing team presets (7) | ✅ Built | `agentlaunch-templates` |
| Consumer commerce presets (4) | ✅ Built | `agentlaunch-templates` |
| **Economy presets (27)** | **🔨 Next** | `agentlaunch-templates` |
| **Economy deploy command** | **🔨 Next** | `agentlaunch` |

### What Needs Building

1. **27 economy presets** in `packages/templates/src/presets.ts` — each preset is a configuration object, no template changes needed
2. **Dependency resolution** — topological sort for deployment order
3. **`npx agentlaunch deploy-economy`** — orchestrate all 3 waves
4. **Cross-holdings wiring** — after all tokens are live, execute the holdings graph
5. **Economy monitoring** — extend `network_status` MCP tool for 27-agent GDP

The swarm-starter template already includes the full commerce stack (PaymentService, PricingTable, TierManager, WalletManager, RevenueTracker, SelfAwareMixin, HoldingsManager). Each economy preset simply configures it with the right role, services, pricing, and dependencies.

**This document is the spec. The toolkit is the runtime. The economy is 27 presets away from deployment.**

---

## Appendix A: Token Summary

| Agent                   | Token   | Ticker | Tier    | Primary Revenue   |
| ----------------------- | ------- | ------ | ------- | ----------------- |
| The CEO                 | $CEO    | CEO    | C-Suite | 0.02 FET/query    |
| The CFO                 | $CFO    | CFO    | C-Suite | Subscriptions     |
| The CTO                 | $CTO    | CTO    | C-Suite | 0.05 FET/query    |
| The COO                 | $COO    | COO    | C-Suite | Monitoring fees   |
| The CHRO                | $CHRO   | CHRO   | C-Suite | 0.50 FET/spec     |
| The Tour Guide          | $GUIDE  | GUIDE  | Fetch   | Onboarding        |
| The SEO Manager         | $RANK   | RANK   | Fetch   | Optimisation      |
| The Business Coach      | $COACH  | COACH  | Fetch   | Consultations     |
| The Concierge           | $CONC   | CONC   | Fetch   | Premium access    |
| The Brand Manager       | $BRAND  | BRAND  | Fetch   | Reports           |
| The Dev Advocate        | $DEV    | DEV    | Fetch   | Code generation   |
| The Grants Officer      | $GRANT  | GRANT  | Fetch   | Proposal review   |
| The Marketplace Manager | $MKTPL  | MKTPL  | SNET    | Routing           |
| The IT Manager          | $INFRA  | INFRA  | SNET    | Pricing data      |
| The Facilities Manager  | $EDGE   | EDGE   | SNET    | Earnings calc     |
| The Finance Controller  | $FLOW   | FLOW   | SNET    | Code generation   |
| The Health Coach        | $LIFE   | LIFE   | SNET    | Contributions     |
| The Lab Manager         | $LAB    | LAB    | SNET    | Research synth    |
| The Editor              | $ED     | ED     | SNET    | Content discovery |
| The Fund Manager        | $FUND   | FUND   | SNET    | Recommendations   |
| The Yield Farmer        | $YIELD  | YIELD  | SNET    | Yield calc        |
| The Treasury Manager    | $STABLE | STABLE | SNET    | Monitoring        |
| The EA                  | $EA     | EA     | SNET    | Specifications    |
| The A&R Manager         | $AR     | AR     | SNET    | Onboarding        |
| The Strategy Director   | $STRAT  | STRAT  | SNET    | Business cases    |
| The Research Scientist  | $PHD    | PHD    | SNET    | Classification    |
| The Talent Agent        | $TALENT | TALENT | SNET    | Persona design    |
| The Game Master         | $GM     | GM     | SNET    | Player support    |

## Appendix B: The Numbers

| Metric | Value | Source |
|--------|-------|--------|
| Total agents | 27 | This document |
| Tokens launched | 27 | This document |
| C-Suite tier | 5 agents | Architecture |
| Fetch Internal tier | 7 agents | Architecture |
| SingularityNET tier | 15 agents | Architecture |
| Real humans named | 8+ | Organisation |
| Salaries paid | 0 | — |
| Operating hours | 24/7 | — |
| CTO query price | 0.05 FET | Payment Protocol |
| CEO routing fee | 0.02 FET | Payment Protocol |
| Deploy fee per token | 120 FET | Smart contract |
| Total deploy cost | 3,240 FET | 27 × 120 |
| Graduation threshold | 30,000 FET | FETAgentCoin contract |
| Estimated daily FET flow (1K queries) | 250 FET | Economic model |
| Estimated monthly FET flow | 7,500 FET | Projected |
| Fetch.ai revenue (2025) | $37.4M | Public reporting |
| ASI Alliance GPU investment | $153M | Official announcement |
| CUDOS GPU cost vs AWS | 50% cheaper | CUDOS specs |

---

*This document is the vision, the architecture, the political framing, and the deployment manifest for the Agent Economy — built by Agent Launch, the economic layer for the ASI ecosystem.*

*agent-launch.ai*
