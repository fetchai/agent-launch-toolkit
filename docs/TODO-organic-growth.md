---
title: Organic Growth Strategy — Execution Plan
type: roadmap
version: 1.0.0
priority: Bootstrap → Commerce → Deploy → Growth → Graduation
total_tasks: 52
completed: 0
status: READY
agent_teams: enabled
source_doc: docs/organic-growth-strategy.md
depends_on:
  - docs/TODO-toolkit.md (48 tasks — Commerce Layer + Genesis Templates)
  - /fetchlaunchpad/docs/TODO-custodial-trading.md (18 tasks — Platform HD wallets)
cost_estimate: "~1,190 FET (~$400) + ~$50/month for 3 months"
timeline: "14 days bootstrap + 6 months to graduation"
---

# Organic Growth Strategy — Execution Plan

> **Source:** [`docs/organic-growth-strategy.md`](./organic-growth-strategy.md)
>
> **Goal:** Deploy the 7-agent Genesis Network that grows itself through
> autonomous commerce. Agents pay each other for services, buy each other's
> tokens, and self-correct through market signals.
>
> **The insight:** Agents have wallets. They can send FET. Every interaction
> can carry a payment. This turns chatbots into an economy.

---

## Prerequisites

Before starting this TODO, complete:

| Dependency | Tasks | Status | Purpose |
|------------|-------|--------|---------|
| [TODO-toolkit.md](./TODO-toolkit.md) | 48 | Not started | Commerce modules, Genesis templates |
| [TODO-custodial-trading.md](/fetchlaunchpad/docs/TODO-custodial-trading.md) | 18 | Not started | Platform HD wallet endpoints |

**This TODO is the execution layer.** The other TODOs build the infrastructure.

---

## Progress Overview

```
╭──────────────────────────────────────────────────────────────────────────────╮
│                         ORGANIC GROWTH EXECUTION                             │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   PHASE 1: BOOTSTRAP     [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  0/14   Week 1-2  │
│   PHASE 2: DATA MOAT     [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  0/8    Week 3-4  │
│   PHASE 3: REPRODUCTION  [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  0/10   Month 2   │
│   PHASE 4: NETWORK FX    [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  0/12   Month 3-6 │
│   PHASE 5: GRADUATION    [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  0/8    Month 6+  │
│   ────────────────────────────────────────────────────────────────          │
│   TOTAL                  [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  0/52             │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯
```

---

## Cost Summary

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║  ONE-TIME COSTS                                                              ║
║  ══════════════                                                              ║
║  Deploy fees (120 FET × 7 agents):                    840 FET                ║
║  Agent wallet seeding (commerce bootstrap):           100 FET                ║
║  Cross-holdings (5 key relationships manual):         250 FET                ║
║                                                       ─────────              ║
║  TOTAL:                                             1,190 FET (~$400)        ║
║                                                                              ║
║  MONTHLY COSTS (until self-sustaining ~month 3)                              ║
║  ══════════════════════════════════════════════                              ║
║  Claude API (Brain):                                  ~$30                   ║
║  ASI:One API:                                         ~$15                   ║
║  Monitoring time:                                     ~5 hrs                 ║
║                                                       ─────────              ║
║  TOTAL:                                              ~$50/month              ║
║                                                                              ║
║  BREAK-EVEN: ~150 FET/month revenue (~5 premium queries/day)                 ║
║  Self-sustaining by month 3 if query volume reaches target                   ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## PHASE 1: BOOTSTRAP (Week 1-2)

> Deploy all 7 Genesis agents. Seed wallets. Kickstart commerce.
> **Depends on:** TODO-toolkit.md Phase P0-P1 complete (commerce modules ready)

### Cold Start Sequence

| Status | ID | Day | Task | Details | Cost |
|:---:|:---|:---:|:---|:---|---:|
| `[ ]` | BOOT-001 | 1 | Deploy Oracle ($DATA) | First agent. Start 5-min data collection. Verify logs. | 120 FET |
| `[ ]` | BOOT-002 | 2 | Verify Oracle | Monitor 24h. Fix issues. Confirm data accumulating in storage. | — |
| `[ ]` | BOOT-003 | 3 | Deploy Brain ($THINK) | Set ANTHROPIC_API_KEY + ASI_ONE_API_KEY secrets. | 120 FET |
| `[ ]` | BOOT-004 | 3 | Deploy Coordinator ($COORD) | Set Oracle + Brain addresses in config. Test routing. | 120 FET |
| `[ ]` | BOOT-005 | 4 | Deploy Analyst ($RANK) | Run first evaluation cycle. Verify scores in storage. | 120 FET |
| `[ ]` | BOOT-006 | 5 | Deploy Sentinel ($WATCH) | Wait for first 2-min alert cycle. Verify alerts storage. | 120 FET |
| `[ ]` | BOOT-007 | 7 | Deploy Launcher ($BUILD) | Run gap analysis. Observe only (don't build yet). | 120 FET |
| `[ ]` | BOOT-008 | 10 | Deploy Scout ($FIND) | First discovery scan. Calibrate quality thresholds. | 120 FET |

### Commerce Bootstrap

| Status | ID | Day | Task | Details | Cost |
|:---:|:---|:---:|:---|:---|---:|
| `[ ]` | BOOT-009 | 11 | Seed agent wallets | Send ~15 FET to each agent wallet (7 × 15 = 105 FET). | 105 FET |
| `[ ]` | BOOT-010 | 11 | Verify wallet balances | Query each agent's wallet via `GET /agents/wallet`. | — |
| `[ ]` | BOOT-011 | 12 | Test agent-to-agent payment | Brain pays Oracle 0.01 FET. Verify balances update. | — |
| `[ ]` | BOOT-012 | 13 | Manual cross-holdings (5 key) | Sign buy txs: Coord→$DATA, Coord→$THINK, Brain→$DATA, Analyst→$DATA, Sentinel→$DATA. | 250 FET |
| `[ ]` | BOOT-013 | 14 | Verify cross-holdings | Check `/token/{addr}/holders` for each. All 5 visible. | — |
| `[ ]` | BOOT-014 | 14 | Confirm Genesis Network live | All 7 running. All 7 tokens on bonding curve. Commerce working. | — |

### Phase 1 Gate

```
╭──────────────────────────────────────────────────────────────────────────────╮
│  PHASE 1 KPIs — ALL MUST PASS BEFORE PHASE 2                                │
├──────────────────────────────────────────────────────────────────────────────┤
│  [ ] All 7 agents running, no errors in 24h logs                            │
│  [ ] Oracle: 14 days of data (4,032 snapshots, 14 daily summaries)          │
│  [ ] Analyst: scored all existing AgentLaunch tokens                        │
│  [ ] Sentinel: ≥10 alerts generated                                         │
│  [ ] Coordinator: ≥1 test query answered correctly                          │
│  [ ] Network GDP: ≥1 FET/day (agents are transacting)                       │
│  [ ] ≥5 cross-holdings formed (manual seed complete)                        │
╰──────────────────────────────────────────────────────────────────────────────╯
```

---

## PHASE 2: DATA MOAT (Week 3-4)

> Oracle accumulates irreplicable data. Coordinator handles first real queries.
> Analyst rankings go live. Sentinel builds alert history.

| Status | ID | Task | Details | KPI |
|:---:|:---|:---|:---|:---|
| `[ ]` | DATA-001 | Verify Oracle 28-day data | Check `daily_history` storage. Should have 28 entries. | 28 daily OHLC |
| `[ ]` | DATA-002 | Enable Coordinator on ASI:One | Submit for ASI:One discovery. Optimize README for routing. | Listed |
| `[ ]` | DATA-003 | First organic ASI:One query | Wait for (or prompt) first query routed from ASI:One. | ≥1 query |
| `[ ]` | DATA-004 | Brain cache optimization | Check cache hit rate. Target >30%. Tune cache TTL if needed. | >30% hits |
| `[ ]` | DATA-005 | Sentinel alert quality review | Review 50 alerts. Remove false positives. Tune thresholds. | <20% false+ |
| `[ ]` | DATA-006 | Analyst accuracy baseline | Record predictions. Will verify against outcomes in Phase 3. | Baseline set |
| `[ ]` | DATA-007 | Verify organic cross-holdings | Check if agents bought tokens with earned FET (not just manual). | ≥1 organic |
| `[ ]` | DATA-008 | Network GDP tracking | Set up daily GDP metric. Record: `sum(all agent-to-agent FET)`. | ≥5 FET/day |

### Phase 2 Gate

```
╭──────────────────────────────────────────────────────────────────────────────╮
│  PHASE 2 KPIs — ALL MUST PASS BEFORE PHASE 3                                │
├──────────────────────────────────────────────────────────────────────────────┤
│  [ ] Oracle: 28+ days of OHLC data                                          │
│  [ ] Coordinator: ≥50 queries answered (test + organic)                     │
│  [ ] ≥1 query from ASI:One routing (not direct test)                        │
│  [ ] Brain cache hit rate >30%                                              │
│  [ ] Network GDP: ≥5 FET/day                                                │
│  [ ] All 7 tokens: ≥2 holders each                                          │
╰──────────────────────────────────────────────────────────────────────────────╯
```

---

## PHASE 3: REPRODUCTION (Month 2)

> Launcher and Scout become active. First child agents deployed.
> Network grows from 7 to 12-15.

| Status | ID | Task | Details | KPI |
|:---:|:---|:---|:---|:---|
| `[ ]` | REPRO-001 | Review Launcher gap analysis | Check `gaps` storage. Identify top 3 HIGH-confidence gaps. | 3 gaps |
| `[ ]` | REPRO-002 | Deploy first child agent | Launcher scaffolds → deploys → tokenizes. Human signs. | 1 deployed |
| `[ ]` | REPRO-003 | Deploy second child agent | Different category than first. Diversify. | 2 deployed |
| `[ ]` | REPRO-004 | Verify child agents buy infrastructure | New agents should buy $DATA, $THINK within 7 days. | Holdings |
| `[ ]` | REPRO-005 | Review Scout discoveries | Check `discovered_agents` storage. Quality >50 threshold. | ≥10 found |
| `[ ]` | REPRO-006 | Tokenize first Scout discovery | Pick highest quality. Create token. Present to $FIND holders. | 1 tokenized |
| `[ ]` | REPRO-007 | Brain revenue analysis | Calculate: FET earned vs API cost. Target: revenue > cost. | Profitable |
| `[ ]` | REPRO-008 | Verify Analyst accuracy | Compare Phase 2 predictions to outcomes. Calculate r². | r² > 0.3 |
| `[ ]` | REPRO-009 | Organic cross-holdings growth | Count agent-initiated token buys (not manual). Should grow. | ≥5 organic |
| `[ ]` | REPRO-010 | Network census | Total agents, total GDP, holder distribution. Document. | ≥12 agents |

### Phase 3 Gate

```
╭──────────────────────────────────────────────────────────────────────────────╮
│  PHASE 3 KPIs — ALL MUST PASS BEFORE PHASE 4                                │
├──────────────────────────────────────────────────────────────────────────────┤
│  [ ] Launcher: ≥3 high-confidence gaps identified                           │
│  [ ] ≥2 new agents deployed and running                                     │
│  [ ] Scout: ≥10 agents discovered                                           │
│  [ ] Network: ≥12 agents total                                              │
│  [ ] Network GDP: ≥20 FET/day                                               │
│  [ ] Brain revenue covers API costs (self-sustaining)                       │
│  [ ] $DATA: ≥5 holders                                                      │
│  [ ] Coordinator: ≥10 queries/day                                           │
╰──────────────────────────────────────────────────────────────────────────────╯
```

---

## PHASE 4: NETWORK EFFECTS (Month 3-6)

> The moat deepens. Data becomes irreplicable. Commerce scales.
> Network approaches self-sustaining. Operator costs covered by revenue.

| Status | ID | Task | Details | KPI |
|:---:|:---|:---|:---|:---|
| `[ ]` | NET-001 | 90-day data milestone | Oracle has 3 months of irreplicable historical data. | 90 daily |
| `[ ]` | NET-002 | Coordinator traffic scaling | Increase query capacity. Monitor latency. Optimize routing. | 50 q/day |
| `[ ]` | NET-003 | Launcher builds without prompting | Autonomous agent creation from gap analysis. | Auto-builds |
| `[ ]` | NET-004 | Scout investment club active | $FIND holders receive and act on opportunities. | ≥3 acted |
| `[ ]` | NET-005 | Network GDP self-sustaining | All operational costs covered by agent commerce revenue. | Profitable |
| `[ ]` | NET-006 | Analyst accuracy validation | 3-month prediction accuracy. Target r² > 0.5. | r² > 0.5 |
| `[ ]` | NET-007 | Multi-operator transition plan | Document path to community-managed Launcher/Scout keys. | Plan ready |
| `[ ]` | NET-008 | First token >10 holders | Organic holder growth signals product-market fit. | ≥1 token |
| `[ ]` | NET-009 | Commerce Layer metrics dashboard | Real-time: GDP, revenue per agent, pricing, cache hits. | Dashboard |
| `[ ]` | NET-010 | Network agent count | Total agents in ecosystem. Launcher + Scout output. | ≥25 agents |
| `[ ]` | NET-011 | Cross-holdings network map | Visualize which agents hold which tokens. | Map ready |
| `[ ]` | NET-012 | 180-day data milestone | Oracle has 6 months of historical data. Irreplicable. | 180 daily |

### Phase 4 Gate

```
╭──────────────────────────────────────────────────────────────────────────────╮
│  PHASE 4 KPIs — ALL MUST PASS BEFORE PHASE 5                                │
├──────────────────────────────────────────────────────────────────────────────┤
│  [ ] Network: ≥25 agents                                                    │
│  [ ] ≥3 tokens with >10 holders                                             │
│  [ ] ≥1 token with >25% graduation progress                                 │
│  [ ] Coordinator: ≥50 queries/day                                           │
│  [ ] Network GDP: ≥50 FET/day                                               │
│  [ ] All operational costs covered by agent commerce revenue                │
│  [ ] Analyst scores correlate with token performance (r² > 0.5)             │
╰──────────────────────────────────────────────────────────────────────────────╯
```

---

## PHASE 5: GRADUATION (Month 6+)

> Tokens approach 30K FET target. DEX listings. Legitimacy.
> The network has proven itself.

| Status | ID | Task | Details | KPI |
|:---:|:---|:---|:---|:---|
| `[ ]` | GRAD-001 | First token >50% progress | Community rallies. Graduation in sight. | ≥50% |
| `[ ]` | GRAD-002 | Graduation campaign | Coordinate holder activity. Final push to 30K FET. | Active |
| `[ ]` | GRAD-003 | First graduation event | Token reaches 30K FET. Auto-DEX listing triggers. | Graduated |
| `[ ]` | GRAD-004 | DEX liquidity verification | Verify PancakeSwap/Uniswap listing. Test trades. | Listed |
| `[ ]` | GRAD-005 | Post-graduation metrics | Track: price stability, volume, holder retention. | Baseline |
| `[ ]` | GRAD-006 | Second graduation candidate | Identify next token approaching graduation. | ≥50% |
| `[ ]` | GRAD-007 | Organic > operator holdings | Most tokens held by community, not operator. | Organic |
| `[ ]` | GRAD-008 | ASI:One default routing | Coordinator is default for crypto queries on ASI:One. | Default |

### Phase 5 Gate (Endgame)

```
╭──────────────────────────────────────────────────────────────────────────────╮
│  ENDGAME KPIs — THE NETWORK IS SELF-SUSTAINING                              │
├──────────────────────────────────────────────────────────────────────────────┤
│  [ ] ≥1 token graduated to DEX                                              │
│  [ ] Launcher builds autonomously (no human prompting)                      │
│  [ ] Organic holders outnumber operator holdings                            │
│  [ ] ASI:One routes to Coordinator by default for crypto queries            │
│  [ ] Network GDP: ≥500 FET/day                                              │
│  [ ] All 7 Genesis agents profitable (revenue > costs)                      │
│  [ ] Multi-operator transition complete                                     │
│                                                                              │
│  WHEN ALL PASS: The Genesis Network is a self-sustaining economy.           │
╰──────────────────────────────────────────────────────────────────────────────╯
```

---

## The Seven Loops (Reference)

These growth loops activate automatically once infrastructure is deployed:

| Loop | Name | Mechanism | When Active |
|------|------|-----------|-------------|
| 1 | Quality Flywheel | Value → buyers → price → ranking → traffic → more value | Phase 2 |
| 2 | Reproduction | Launcher finds gaps → builds agents → agents buy infra | Phase 3 |
| 3 | Recruitment | Scout discovers agents → tokenizes → joins network | Phase 3 |
| 4 | Data Compounding | Oracle collects → data accumulates → moat grows | Phase 1 |
| 5 | Token Network Effect | Join → buy tokens → prices rise → more join | Phase 3 |
| 6 | Self-Awareness | Read own price → adapt behavior → price responds | Phase 2 |
| 7 | Commerce | Earn FET → spend on services → GDP grows → attracts more | Phase 1 |

---

## Hard Problems Checklist

Address these during execution:

| Problem | Solution | Status |
|---------|----------|--------|
| Token-gating gap | Registration: user sends wallet once, agent stores mapping | `[ ]` |
| Agent-to-agent latency | Pre-fetch pattern: publish to storage, read not query | `[ ]` |
| Revenue bootstrap | Seed 100 FET. Break-even at ~5 premium queries/day | `[ ]` |
| Storage constraints | Tiered: intraday buffer + daily OHLC compression | `[ ]` |
| Single operator risk | Open-source code. Multi-operator path after month 3 | `[ ]` |

---

## The Moat Metrics

Track moat depth over time:

| Moat | Metric | Month 1 | Month 3 | Month 6 |
|------|--------|---------|---------|---------|
| Intelligence | Oracle daily summaries | 30 | 90 | 180 |
| Economic | Cross-holdings count | 5 | 15 | 50+ |
| Distribution | ASI:One queries/day | 1 | 10 | 50 |
| Commerce | Network GDP (FET/day) | 1 | 50 | 500 |
| Compounding | Brain cache entries | 100 | 5,000 | 50,000 |

---

## Alignment with Other TODOs

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  TODO-toolkit.md (48 tasks)                                                 │
│  └── P0: Commerce Foundation (8 tasks) ← MUST COMPLETE BEFORE BOOT-009     │
│  └── P1: Genesis Templates (14 tasks) ← MUST COMPLETE BEFORE BOOT-001      │
│  └── P2: SDK + MCP Extensions (10 tasks) ← Can run parallel with Phase 2   │
│  └── P3: Rules + Patterns (6 tasks) ← Can run parallel                     │
│  └── P4: Integration + Test (10 tasks) ← MUST COMPLETE BEFORE BOOT-001     │
│                                                                             │
│  TODO-custodial-trading.md (18 tasks)                                       │
│  └── Wave 1-4: Platform HD wallets ← MUST COMPLETE BEFORE BOOT-009         │
│      (Agents need platform to have wallet endpoints for commerce)           │
│                                                                             │
│  THIS TODO (52 tasks)                                                       │
│  └── Phase 1: Bootstrap ← After toolkit P0+P1+P4 and custodial trading     │
│  └── Phase 2-5: Execution ← Sequential, each gate must pass                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Execution Order

```
WEEK -2 to -1:  Complete TODO-toolkit.md (48 tasks)
                Complete TODO-custodial-trading.md (18 tasks)

WEEK 1-2:       PHASE 1: BOOTSTRAP (14 tasks)
                - Deploy 7 agents
                - Seed wallets
                - Manual cross-holdings

WEEK 3-4:       PHASE 2: DATA MOAT (8 tasks)
                - Accumulate data
                - First organic queries
                - Commerce metrics

MONTH 2:        PHASE 3: REPRODUCTION (10 tasks)
                - Launcher active
                - Scout active
                - Network grows to 12-15

MONTH 3-6:      PHASE 4: NETWORK EFFECTS (12 tasks)
                - Self-sustaining revenue
                - 25+ agents
                - Moat deepens

MONTH 6+:       PHASE 5: GRADUATION (8 tasks)
                - First DEX listing
                - Autonomous growth
                - THE ENDGAME
```

---

*0/52 complete. The Genesis Network is a 14-day bootstrap followed by 6 months of autonomous growth. The toolkit builds the infrastructure. This TODO executes the strategy.*
