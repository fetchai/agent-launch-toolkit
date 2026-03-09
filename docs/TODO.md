---
title: Agent Economy Roadmap
type: roadmap
version: 1.1.0
priority: Onboard → Build → Launch → Prove → Connect → Scale → Graduate
total_tasks: 43
completed: 12
status: IN_PROGRESS
cost: ~3,600 FET (~$1,200) + ~$100/month
timeline: Week 1 ship → Week 2-3 Humayun → Month 6 graduation
---

# Agent Economy Roadmap

> **The Vision:** Every company deploys their org as an agent swarm.
> C-levels become infrastructure. CRO connects swarms together.
> The network grows through recruitment, not marketing.

---

## Phase -1: Onboarding

When Claude Code starts, show the user everything they need to get oriented.

### What Claude Code Shows on Startup

1. **What you already have:**
   - Your agents on Agentverse (list from `/agents/my-agents`)
   - Your tokens on AgentLaunch (list from `/tokens`)
   - Your wallet balances (FET, USDC, BNB)

2. **Choose your path:**

| Path | What You Get | Time | Cost |
|------|--------------|------|------|
| **Single Agent** | 1 agent with chat + memory | 90 seconds | 120 FET |
| **Marketing Team** | 7 agents that grow your ecosystem | 15 minutes | 840 FET |
| **Alliance Swarm** | 27 agents covering ASI ecosystem | 1 hour | 3,240 FET |

3. **Guide to the right choice:**
   - **First time?** → Start with Single Agent. Get something running fast.
   - **Growing a project?** → Marketing Team. Writer, Social, Analytics working together.
   - **Building infrastructure?** → Alliance Swarm. Full organizational coverage.

### The Three Paths

#### 1. Single Agent — Chat + Memory (90 seconds, 120 FET)

```bash
npx agentlaunch my-first-agent
```

You get:
- One agent with LLM reasoning + conversation memory
- Deployed to Agentverse, optimized, tokenized
- Ready to receive messages and trade

Best for: Testing, learning, quick wins.

#### 2. Marketing Team — 7 Agents (15 minutes, 840 FET)

```bash
npx agentlaunch scaffold marketing-team --type swarm-starter
```

You get:
- **Writer** ($WRITE) — Blog posts, tweets, newsletters, ad copy
- **Social** ($POST) — Post tweets, schedule threads, reply to mentions
- **Community** ($COMM) — Moderate, answer FAQs, run polls
- **Analytics** ($STATS) — Engagement reports, audience insights
- **Outreach** ($REACH) — Find partners, draft pitches, send emails
- **Ads** ($ADS) — Create ads, A/B test, campaign reports
- **Strategy** ($PLAN) — Content calendars, brand audits, campaign plans

Best for: Projects that need ongoing content and community.

#### 3. Alliance Swarm — 27 Agents (1 hour, 3,240 FET)

```bash
npx agentlaunch swarm-from-org people.yaml
```

You get:
- **C-Suite** (5): CEO, CTO, CFO, COO, CRO
- **Fetch Internal** (7): Guide, Rank, Coach, Concierge, Brand, Dev, Grant
- **SNET Ecosystem** (15): Full ASI Alliance coverage

Best for: Organizations deploying infrastructure, networks of networks.

### Onboarding Task

| Status | ID | Task | How | KPI | Depends |
|:---:|:---|:---|:---|:---|:---|
| `[x]` | ON-1 | Ask what they want to build | /welcome skill at .claude/skills/welcome/SKILL.md — shows status + 3 paths | User chooses path | — |

### What Happens After They Choose

- **Single Agent** → Run `/build-agent`, done in 90 seconds
- **Marketing Team** → Run `/build-swarm marketing-team`, deploy all 7
- **Alliance Swarm** → Continue to Phase 0: Build

---

## The Swarm Connection Pattern

```
                         EXTERNAL WORLD
                    (Users, Other Swarms, ASI:One)
                              │
                              ▼
                      ┌───────────────┐
                      │      CEO      │ ◄── Routes ALL queries
                      │     $CEO      │     Inter-swarm gateway
                      └───────┬───────┘
                              │
    ┌─────────────┬───────────┼───────────┬─────────────┐
    │             │           │           │             │
    ▼             ▼           ▼           ▼             ▼
┌───────┐   ┌───────┐   ┌───────┐   ┌───────┐    ┌──────────┐
│  CTO  │   │  CFO  │   │  COO  │   │  CRO  │    │  Depts   │
│ $CTO  │   │ $CFO  │   │ $COO  │   │ $CRO  │    │          │
│THINKS │   │TRACKS │   │ OPS   │   │GROWS  │    │          │
└───┬───┘   └───┬───┘   └───┬───┘   └───┬───┘    └──────────┘
    │           │           │           │
    │           │           │           │
 Everyone    Monitors    24/7         DISCOVERS
 PAYS for    all wallets health      new agents
 reasoning   GDP track   alerts      CONNECTS swarms
                                     EXPANDS network
```

### CRO: The Growth Engine

| Service | Price | What It Does |
|---------|-------|--------------|
| `scout_agents` | 0.05 FET | Discover quality agents on Agentverse |
| `generate_spec` | 0.50 FET | Create specifications for new agents |
| `onboard_agent` | 0.10 FET | Integrate agent into the swarm |
| `partnership_proposal` | 0.20 FET | Propose cross-swarm partnership |
| `team_status` | 0.02 FET | Report on swarm growth |

### How Swarms Connect

```
    ACME SWARM                              GLOBEX SWARM
    ══════════                              ════════════
    ┌────────┐                              ┌────────┐
    │  CEO   │◄──────── queries ───────────►│  CEO   │
    └───┬────┘                              └───┬────┘
        │                                       │
    ┌───┴────┐                              ┌───┴────┐
    │  CRO   │◄─── "We need X capability"───►│  CRO   │
    └───┬────┘     "We have Y service"      └───┬────┘
        │                                       │
        └──────────── PARTNERSHIP ──────────────┘
                     • Cross-holdings
                     • Revenue share
                     • Capability exchange
```

---

## Now

- [ ] **ON-1: Ask what they want to build** — Show the three paths, guide to right choice
- [x] B-1 through B-9: Phase 0 Build COMPLETE
- [x] L-1: C-Suite deployed (CTO, CFO, COO, CEO, CRO)
- [x] L-2: Fetch Internal deployed (Guide, Rank, Coach, Concierge, Brand, DevRel)
- [!] L-3: SNET partial (Marketplace, Platform, AI-Services, NuNet) — 25-agent limit
- [x] L-4: All 15 agents optimized (README + short_description)
- [~] L-5: Fund wallets (pending)
- [~] Template upgraded: 10-layer commerce + conversation memory + ASI1-mini LLM
- [!] Need Agentverse limit increase for remaining 12 alliance agents

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [people.md](./people.md) | Team roster + agent mapping |
| [the-agent-economy.md](./the-agent-economy.md) | Full 27-agent vision (1,300 lines) |
| [agent-coordination.md](./agent-coordination.md) | Pitch deck version |
| [people-to-swarm.md](./people-to-swarm.md) | Build YOUR org's swarm |
| [sequence.md](./sequence.md) | Outreach timing |
| [FEATURES.md](./FEATURES.md) | Toolkit capabilities |

---

## Costs

```
  One-time (ASI Alliance 27-Agent Economy)
    Deploy fees (120 FET × 27 agents)         3,240 FET
    Wallet seeding (10 FET × 27 agents)         270 FET
    Cross-holdings (initial buys)               ~100 FET
                                            ─────────────
                                              3,610 FET  (~$1,200)

  Monthly (until self-sustaining)
    ASI1-mini API (CTO reasoning)                ~$50
    Agentverse hosting                           Free
                                            ─────────────
                                              ~$50/month

  Break-even: ~15 premium queries/day across swarm
```

---

## Phase 0: Build (Day 1-3)

Ship the people-to-swarm system. Make it trivially easy.

| Status | ID | Task | How | KPI | Depends |
|:---:|:---|:---|:---|:---|:---|
| `[x]` | B-1 | Create people.ts generator | `packages/templates/src/people.ts` | File exists | — |
| `[x]` | B-2 | Add C-Suite presets | ceo, cto, cfo, coo, cro in presets.ts | 5 presets | B-1 |
| `[x]` | B-3 | Create example org charts | `examples/org-charts/` | 3 files | B-1 |
| `[x]` | B-4 | Write documentation | `docs/people-to-swarm.md` | Doc complete | B-1 |
| `[x]` | B-5 | Add CLI org-template command | `npx agentlaunch org-template --size smb` | Command works | B-4 |
| `[x]` | B-6 | Add CLI swarm-from-org command | `npx agentlaunch swarm-from-org people.yaml` | Swarm deploys | B-5 |
| `[x]` | B-7 | Add shorthand commands | `npx agentlaunch marketing`, `alliance` | Commands work | B-6 |
| `[x]` | B-8 | Add MCP tools | `scaffold_org_swarm`, `generate_org_template` | Tools callable | B-7 |
| `[x]` | B-9 | Test with startup.yaml | Deploy startup swarm on testnet | 3 agents running | B-8 |

### Phase 0 Gate

```
  [x] people.ts generator created
  [x] 5 C-Suite presets (CEO, CTO, CFO, COO, CRO)
  [x] 3 example org charts
  [x] people-to-swarm.md documentation
  [x] org-template CLI command working
  [x] swarm-from-org CLI command working
  [x] marketing + alliance shorthand commands
  [x] MCP tools (generate_org_template + scaffold_org_swarm)
  [x] Test deployment successful (3 agents: CTO, CEO, Product Lead — compiled, running, optimized)
```

---

## Phase 1: Launch (Week 1)

Deploy the ASI Alliance 27-agent economy. CTO first, then cascade.

| Status | ID | Task | How | KPI | Depends |
|:---:|:---|:---|:---|:---|:---|
| `[x]` | L-1 | Deploy Wave 1: C-Suite | CTO → CFO → COO → CEO → CRO (sequential) | 5 agents running | B-8 |
| `[x]` | L-2 | Deploy Wave 2: Fetch Internal | GUIDE, RANK, COACH, CONC, BRAND, DEV (6 of 7) | 6 agents running | L-1 |
| `[!]` | L-3 | Deploy Wave 3: SNET Ecosystem | 4 of 15 deployed (Marketplace, Platform, AI-Services, NuNet). 25-agent Agentverse limit reached. | 4 agents running | L-1 |
| `[x]` | L-4 | Optimize all agents | README + short_description for all 15 deployed | All optimized | L-3 |
| `[~]` | L-5 | Tokenize + fund agents | Tokenize agents on AgentLaunch (120 FET each via BSC wallet) | Tokens created | L-4 |
| `[ ]` | L-6 | Seed cross-holdings | CEO→$CTO, CEO→$CFO, per coalition graph | ≥10 holdings | L-5 |
| `[ ]` | L-7 | Verify commerce | `network_status` — all 27 running, GDP > 0 | GDP > 0 | L-6 |

### Phase 1 Gate

```
  [ ] All 27 agents running, no errors in 24h
  [ ] CTO receiving reasoning requests
  [ ] ≥1 agent-to-agent FET payment
  [ ] ≥10 cross-holdings on-chain
```

---

## Phase 2: Prove (Week 2)

Commerce flows. The system proves itself.

| Status | ID | Task | How | KPI | Depends |
|:---:|:---|:---|:---|:---|:---|
| `[ ]` | P-1 | CTO as reasoning layer | All agents pay 0.05 FET for reasoning | ≥100 queries | L-7 |
| `[ ]` | P-2 | CFO treasury tracking | Daily GDP reports | 7 reports | L-7 |
| `[ ]` | P-3 | CEO routing working | Route queries to correct specialists | ≥50 queries | L-7 |
| `[ ]` | P-4 | CRO scouts agents | CRO discovers un-tokenized agents on Agentverse | ≥5 discovered | L-7 |
| `[ ]` | P-5 | ASI:One discovery | Submit CEO for ASI:One routing | ≥1 organic query | P-3 |
| `[ ]` | P-6 | Coalition alignment | All 5 coalitions have cross-holdings | 5 coalitions | P-1 |

### Phase 2 Gate

```
  [ ] CTO: ≥100 reasoning queries
  [ ] CEO: ≥50 queries routed
  [ ] CRO: ≥5 agents discovered
  [ ] Network GDP: ≥10 FET/day
```

---

## Phase 3: Outreach (Week 2-3)

Execute sequence.md. Reach Humayun. Get buy-in.

| Status | ID | Task | How | KPI | Depends |
|:---:|:---|:---|:---|:---|:---|
| `[!]` | O-1 | Day 1: Post intro | intro.md ready at docs/intro.md — Anthony needs to post to #agent_launchpad | Posted | — |
| `[ ]` | O-2 | Day 2-4: Engage | Docs, faucet, developer tools | Links shared | O-1 |
| `[ ]` | O-5 | Day 5: Live demo | Deploy agent live ~90 seconds | Demo posted | O-2 |
| `[ ]` | O-6 | Week 2: Build for team | Slack/Telegram bot for the team | ≥1 agent built | O-5 |
| `[ ]` | O-7 | Week 2-3: DM Humayun | the-agent-economy.md — "15 minutes" | DM sent | P-5 |
| `[ ]` | O-8 | Handle response | Positive → CTO proof of concept | Response handled | O-7 |

### Phase 3 Gate

```
  [ ] Intro posted, warm replies
  [ ] ≥1 agent built for team
  [ ] Humayun DM sent
  [ ] Response received
```

---

## Phase 4: Connect (Month 2)

CRO connects swarms. The network effect begins.

| Status | ID | Task | How | KPI | Depends |
|:---:|:---|:---|:---|:---|:---|
| `[ ]` | C-1 | First external swarm | Help 1 company deploy using people-to-swarm | 1 external swarm | O-8 |
| `[ ]` | C-2 | CRO-to-CRO connection | ASI CRO discovers external swarm, proposes partnership | 1 partnership | C-1 |
| `[ ]` | C-3 | Cross-swarm query | External swarm routes query to ASI swarm via CEO | 1 cross-swarm query | C-2 |
| `[ ]` | C-4 | Cross-swarm revenue | FET flows between swarms for services | Revenue recorded | C-3 |
| `[ ]` | C-5 | 5 swarms connected | 5 different orgs connected via CRO partnerships | 5 swarms | C-4 |

### Phase 4 Gate

```
  [ ] ≥1 external swarm deployed
  [ ] ≥1 CRO-to-CRO partnership
  [ ] Cross-swarm queries flowing
  [ ] ≥5 swarms in network
```

---

## Phase 5: Scale (Month 3)

The pattern spreads. CROs recruit CROs.

| Status | ID | Task | How | KPI | Depends |
|:---:|:---|:---|:---|:---|:---|
| `[ ]` | S-1 | CRO autonomous recruitment | CRO finds and onboards agents without prompting | ≥3 auto-onboards | C-5 |
| `[ ]` | S-2 | Case study published | Document first external swarm deployment | Case study live | C-5 |
| `[ ]` | S-3 | ASI Alliance recognition | Official mention from Fetch.ai / ASI | Recognition | O-8 |
| `[ ]` | S-4 | 10 swarms, 50+ agents | Network growth through CRO recruitment | 10 swarms | S-1 |
| `[ ]` | S-5 | Self-sustaining GDP | Operational costs covered by commerce | Profitable | S-4 |

### Phase 5 Gate

```
  [ ] CRO recruiting autonomously
  [ ] 10 swarms in network
  [ ] 50+ agents total
  [ ] Self-sustaining revenue
```

---

## Phase 6: Graduate (Month 6)

First tokens reach 30K FET. DEX listings. The economy proves itself.

| Status | ID | Task | How | KPI | Depends |
|:---:|:---|:---|:---|:---|:---|
| `[ ]` | G-1 | CTO graduation | $CTO reaches 30,000 FET → PancakeSwap | CTO graduated | S-5 |
| `[ ]` | G-2 | CEO graduation | $CEO reaches 30,000 FET | CEO graduated | G-1 |
| `[ ]` | G-3 | CRO graduation | $CRO graduates — the growth engine is liquid | CRO graduated | G-2 |
| `[ ]` | G-4 | Community ownership | Organic holders > operator holdings | Community > operator | G-3 |
| `[ ]` | G-5 | 100+ agents | Network of networks | 100 agents | G-4 |

### Endgame Gate

```
  [ ] ≥3 tokens graduated to DEX
  [ ] Organic holders > operator
  [ ] Network GDP: ≥500 FET/day
  [ ] 100+ agents in ecosystem
```

---

## Progress Overview

```
╭──────────────────────────────────────────────────────────────────────────────╮
│                         TASK COMPLETION                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Phase -1: Onboard    [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  0/1    0%          │
│   Phase 0: Build       [██████████████████████████████]  9/9  100%          │
│   Phase 1: Launch      [████████████████░░░░░░░░░░░░░░]  4/7   57%          │
│   Phase 2: Prove       [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  0/6    0%          │
│   Phase 3: Outreach    [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  0/6    0%          │
│   Phase 4: Connect     [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  0/5    0%          │
│   Phase 5: Scale       [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  0/5    0%          │
│   Phase 6: Graduate    [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  0/5    0%          │
│   ────────────────────────────────────────────────────────────────          │
│   TOTAL                [████████████░░░░░░░░░░░░░░░░░░] 13/44  30%          │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯
```

---

## The C-Suite Roles

| Role | Token | Function | Key Insight |
|------|-------|----------|-------------|
| **CEO** | $CEO | Routes all queries | Inter-swarm gateway |
| **CTO** | $CTO | Shared reasoning | Everyone pays the CTO |
| **CFO** | $CFO | Treasury tracking | GDP monitoring |
| **COO** | $COO | 24/7 operations | Health & alerts |
| **CRO** | $CRO | **Recruitment** | **Grows the network** |

### Why CRO is Transformative

| Traditional HR (CHRO) | Agent Recruitment (CRO) |
|----------------------|------------------------|
| Manage existing humans | **Recruit new agents** |
| HR compliance | **Scout Agentverse** |
| Performance reviews | **Generate agent specs** |
| Onboard employees | **Onboard agents** |
| Team culture | **Cross-swarm partnerships** |

**CRO is the growth engine.** When swarms connect, CROs are the matchmakers.

---

## Execution with `/grow`

```bash
# Execute next pending task
/grow

# Execute multiple tasks
/grow 5

# Execute specific task
/grow B-5

# Check status
/grow status
```

---

## The Message

**For Humayun (Week 2-3):**
> "27 agents covering the full ASI ecosystem. Each with its own token. CRO scouts new agents and connects swarms. I put together a vision doc. Would love 15 minutes."

**For Companies (Month 2+):**
> "Fill in your org chart. Get an AI swarm. Your CRO connects you to the network."

**For the Ecosystem:**
> "Swarms connect through CROs. The network grows through recruitment, not marketing."

---

*13/44 complete. 15 alliance agents live with 10-layer commerce + LLM. Need agent limit increase for remaining 12. Next: fund wallets, tokenize, prove commerce.*

**agent-launch.ai**
