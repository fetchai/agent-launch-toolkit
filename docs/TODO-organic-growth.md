---
title: Organic Growth — Operational Playbook
version: 2.0.0
total_milestones: 20
completed: 0
status: WAITING (complete TODO-toolkit.md first)
depends_on: docs/TODO-toolkit.md (28 tasks)
cost: ~1,190 FET (~$400) + ~$50/month for 3 months
timeline: Day 1 launch + 6 months to graduation
---

# Organic Growth Playbook

> The toolkit builds the tools. This playbook uses them.
>
> **Prerequisite:** [TODO-toolkit.md](./TODO-toolkit.md) (28 tasks) must be complete.
> You need the genesis template, presets, CLI swarm mode, and MCP commerce tools.
>
> **No platform changes required.** Everything runs on existing APIs +
> Fetch.ai chain + agent-side web3.py.

---

## Status: 0/20

```
  Phase 1  Launch          ░░░░░░░░░░░░░░░░░░░░  0/4   Day 1
  Phase 2  Prove           ░░░░░░░░░░░░░░░░░░░░  0/4   Week 2-4
  Phase 3  Grow            ░░░░░░░░░░░░░░░░░░░░  0/4   Month 2
  Phase 4  Sustain         ░░░░░░░░░░░░░░░░░░░░  0/4   Month 3-6
  Phase 5  Graduate        ░░░░░░░░░░░░░░░░░░░░  0/4   Month 6+
```

---

## Costs

```
  One-time
    Deploy fees (120 FET × 7 agents)          840 FET
    Wallet seeding (15 FET × 7 agents)        105 FET
    Cross-holdings (5 manual buys)            250 FET
                                            ─────────
                                            1,195 FET  (~$400)

  Monthly (until self-sustaining)
    Claude API (Brain agent)                   ~$30
    ASI:One API                                ~$15
    Your time (~5 hrs monitoring)              ~$0
                                            ─────────
                                              ~$50/month

  Break-even: ~5 premium queries/day
```

---

## Phase 1: Launch (Day 1)

Deploy the Genesis Network. The toolkit does the heavy lifting.

| | ID | What | How | KPI |
|:---:|:---|:---|:---|:---|
| `[ ]` | L-1 | Deploy the swarm | `npx agentlaunch create` → Genesis Network. Or: `deploy_swarm` MCP tool. Deploys all 7 agents in sequence with presets. Set secrets: `ANTHROPIC_API_KEY`, `ASI_ONE_API_KEY` for Brain. | All 7 running |
| `[ ]` | L-2 | Fund wallets | Send ~15 FET to each agent's Fetch.ai wallet (105 FET total). Fund BSC wallets with small BNB for gas if cross-holdings desired. | Balances confirmed |
| `[ ]` | L-3 | Seed cross-holdings | Buy tokens manually via frontend trade page (agent-launch.ai): Coordinator→$DATA, Coordinator→$THINK, Brain→$DATA, Analyst→$DATA, Sentinel→$DATA. 5 buys, ~250 FET. | 5 holdings visible via `GET /agents/token/{addr}/holders` |
| `[ ]` | L-4 | Verify commerce | Use `network_status` MCP tool or `npx agentlaunch status --swarm`. All 7 running, no errors in logs. Brain pays Oracle 0.01 FET for first data query. First FET transfer on-chain confirmed. | GDP > 0 |

### Phase 1 Gate

```
  [ ] All 7 agents running, no errors in 24h
  [ ] Oracle collecting data every 5 min
  [ ] At least 1 agent-to-agent FET payment completed
  [ ] ≥5 cross-holdings visible on-chain
```

---

## Phase 2: Prove (Week 2-4)

Data accumulates. First organic queries arrive. Commerce metrics emerge.

| | ID | What | How | KPI |
|:---:|:---|:---|:---|:---|
| `[ ]` | P-1 | Oracle data moat | Monitor via `check_agent_commerce`. Oracle should have 14-28 days of OHLC data in storage. This data is irreplicable — no one else has it. | 28 daily summaries |
| `[ ]` | P-2 | ASI:One discovery | Submit Coordinator for ASI:One routing. Optimize its README for agent discovery ranking. Wait for first organic query from ASI:One (not your test). | ≥1 organic query |
| `[ ]` | P-3 | Tune the swarm | Review via `network_status`: Brain cache hit rate (target >30%), Sentinel false positive rate (target <20%), Analyst prediction baseline recorded. Adjust pricing if needed. | Metrics baselined |
| `[ ]` | P-4 | First organic cross-holding | Check if any agent autonomously bought a token with earned FET (via HoldingsManager web3.py). This is the first sign of a self-sustaining economy. | ≥1 organic buy |

### Phase 2 Gate

```
  [ ] Oracle: 28+ days of historical data
  [ ] Coordinator: ≥50 queries answered
  [ ] Brain cache hit rate >30%
  [ ] Network GDP: ≥5 FET/day
  [ ] All 7 tokens: ≥2 holders each
```

---

## Phase 3: Grow (Month 2)

Launcher and Scout activate. The network reproduces.

| | ID | What | How | KPI |
|:---:|:---|:---|:---|:---|
| `[ ]` | G-1 | Launcher deploys child agents | Review Launcher's gap analysis (in storage). If ≥3 high-confidence gaps found, let it scaffold + deploy. You sign the token deploy transactions. | ≥2 new agents |
| `[ ]` | G-2 | Scout discovers opportunities | Review Scout's discoveries (in storage). Tokenize the highest-quality find. Present to $FIND holders as an investment opportunity. | ≥10 discovered, 1 tokenized |
| `[ ]` | G-3 | Brain profitability | Compare Brain's FET revenue (from `check_agent_commerce`) vs Claude/ASI:One API costs. Target: revenue ≥ cost. If not, tune pricing or caching. | Revenue ≥ cost |
| `[ ]` | G-4 | Network census | Run `network_status` across all agents (original 7 + children). Document total agents, GDP, holder distribution. The network should be growing without you pushing it. | ≥12 agents total |

### Phase 3 Gate

```
  [ ] ≥2 child agents deployed and running
  [ ] Brain revenue covers API costs
  [ ] Network GDP: ≥20 FET/day
  [ ] $DATA: ≥5 holders
  [ ] Coordinator: ≥10 queries/day
```

---

## Phase 4: Sustain (Month 3-6)

The moat deepens. Costs covered by revenue. Growth is autonomous.

| | ID | What | How | KPI |
|:---:|:---|:---|:---|:---|
| `[ ]` | S-1 | Self-sustaining revenue | All operational costs (API keys, monitoring) covered by agent commerce revenue. Check monthly via `network_status`. | Profitable |
| `[ ]` | S-2 | Autonomous reproduction | Launcher deploys agents without you prompting it. Scout tokenizes discoveries on its own. You just sign transactions. | Auto-builds happening |
| `[ ]` | S-3 | Data irreplicability | Oracle has 90+ days of historical data. No competitor can replicate this retroactively. Analyst has 90 days of prediction accuracy data. | 90 daily summaries, r² > 0.5 |
| `[ ]` | S-4 | Community traction | At least 1 token with >10 organic holders. Cross-holdings network growing. Multi-operator transition plan documented. | ≥1 token >10 holders |

### Phase 4 Gate

```
  [ ] Network: ≥25 agents
  [ ] ≥3 tokens with >10 holders
  [ ] ≥1 token with >25% graduation progress
  [ ] Network GDP: ≥50 FET/day
  [ ] All operational costs covered by revenue
```

---

## Phase 5: Graduate (Month 6+)

First token reaches 30K FET. Auto-DEX listing. The network has proven itself.

| | ID | What | How | KPI |
|:---:|:---|:---|:---|:---|
| `[ ]` | F-1 | First graduation | A token reaches 30,000 FET raised. Auto-lists on PancakeSwap/Uniswap. Verify DEX listing, test trades. | 1 token graduated |
| `[ ]` | F-2 | Community > operator | Most token holdings are organic (not your manual seed). The community owns the network. | Organic > operator |
| `[ ]` | F-3 | ASI:One default routing | Coordinator becomes the default for crypto queries on ASI:One. Organic traffic drives GDP. | Default routing |
| `[ ]` | F-4 | Network independence | All 7 Genesis agents profitable. Launcher builds autonomously. Multi-operator keys distributed. You could walk away and it keeps running. | Self-sustaining |

### Endgame Gate

```
  [ ] ≥1 token graduated to DEX
  [ ] Organic holders outnumber operator holdings
  [ ] Network GDP: ≥500 FET/day
  [ ] All 7 Genesis agents profitable
  [ ] Launcher builds without human prompting
```

---

## Monitoring Cheat Sheet

These toolkit tools replace the manual monitoring tasks from the old plan:

| What you want to know | Tool |
|------------------------|------|
| Is my swarm healthy? | `network_status` MCP tool / `npx agentlaunch status --swarm` |
| How is one agent doing? | `check_agent_commerce` MCP tool |
| What's the network GDP? | `network_status` → total GDP field |
| Are agents paying each other? | `check_agent_commerce` → revenue log |
| Who holds which tokens? | `GET /agents/token/{addr}/holders` |
| Is Launcher finding gaps? | `check_agent_commerce` on Launcher → storage |
| Is Scout finding agents? | `check_agent_commerce` on Scout → storage |
| Cache hit rate? | `check_agent_commerce` on Brain → health metrics |

---

## Moat Targets

Track these over time. They compound — that's the point.

| Moat | Month 1 | Month 3 | Month 6 |
|------|---------|---------|---------|
| Oracle daily summaries | 30 | 90 | 180 |
| Cross-holdings | 5 | 15 | 50+ |
| ASI:One queries/day | 1 | 10 | 50 |
| Network GDP (FET/day) | 1 | 50 | 500 |
| Brain cache entries | 100 | 5,000 | 50,000 |
| Total agents | 7 | 12 | 25+ |

---

## Growth Loops

These activate automatically as the network matures:

| Loop | Mechanism | Active by |
|------|-----------|-----------|
| Data Compounding | Oracle collects → data accumulates → moat grows | Day 1 |
| Commerce | Earn FET → spend on services → GDP grows | Day 1 |
| Self-Awareness | Read own price → adapt behavior → price responds | Phase 2 |
| Quality Flywheel | Value → buyers → price → ranking → traffic | Phase 2 |
| Reproduction | Launcher finds gaps → builds agents → agents buy infra | Phase 3 |
| Recruitment | Scout discovers agents → tokenizes → joins network | Phase 3 |
| Token Network Effect | Join → buy tokens → prices rise → more join | Phase 3 |

---

*0/20. Launch day is one command. Everything after is watching the loops compound.*
