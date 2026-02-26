---
title: TODO Template
type: roadmap
version: 1.0.0
priority: Launch → Prove → Grow → Sustain → Graduate
total_tasks: 20
completed: 0
status: PENDING
depends_on: docs/TODO-toolkit.md
cost: ~1,195 FET (~$400) + ~$50/month
timeline: Day 1 launch + 6 months to graduation
---

# Genesis Network Roadmap

> The toolkit builds the tools. This playbook uses them.
>
> **Prerequisite:** [TODO-toolkit.md](./TODO-toolkit.md) must be complete.
> You need the genesis template, presets, CLI swarm mode, and MCP commerce tools.

---

## Now
- [ ] Complete TODO-toolkit.md (28 tasks)
- [ ] L-1: Deploy the swarm

---

## Claude Code Configuration (`.claude/`)

> **Skills** define commands. **Hooks** automate execution. **Rules** provide context.

### Directory Structure

```
.claude/
├── skills/                      # Custom slash commands
│   ├── build-agent.md           # /build-agent - Full lifecycle
│   ├── deploy.md                # /deploy - Deploy to Agentverse
│   ├── tokenize.md              # /tokenize - Create token
│   ├── market.md                # /market - Browse tokens
│   ├── status.md                # /status - Check status
│   └── grow.md                  # /grow - Autonomous execution
│
├── rules/                       # File-type context
│   ├── agentlaunch.md           # Platform constants
│   ├── agentverse.md            # Agentverse patterns
│   ├── api-paths.md             # Verified API paths
│   └── uagent-patterns.md       # Agent code patterns
│
└── settings.json                # MCP server config
```

---

### Skills (Custom Commands)

Skills are markdown files in `.claude/skills/` that expand to full prompts when invoked.

#### Example: `/grow` - Autonomous Task Execution

**File**: `.claude/skills/grow.md`

```markdown
# Grow - Autonomous Task Execution

Claim and execute tasks from TODO.md autonomously.

## Behavior

1. Read docs/TODO.md and identify pending tasks
2. Check dependencies - only claim unblocked tasks
3. Mark task as `in_progress` by changing `[ ]` to `[~]`
4. Execute task using toolkit commands
5. Mark task complete with `[x]`
6. Move to next task

## Arguments

- `/grow` - Execute 1 task
- `/grow 5` - Execute 5 tasks sequentially
- `/grow L-1` - Execute specific task
```

---

### Rules (Context by File Type)

Rules provide specialized context loaded automatically.

#### Example: `agentlaunch.md` - Platform Rules

**File**: `.claude/rules/agentlaunch.md`

```markdown
# AgentLaunch Platform Rules

## Constants (from smart contracts)

- Deploy fee: 120 FET
- Graduation: 30,000 FET liquidity
- Trading fee: 2% → 100% to protocol treasury
- Total buy supply: 800,000,000 tokens

## API Authentication

- Use `X-API-Key` header with Agentverse API key
- Key is read from `.env` AGENTVERSE_API_KEY
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
                                            ─────────
                                              ~$50/month

  Break-even: ~5 premium queries/day
```

---

## Phase 1: Launch (Day 1)

Deploy the Genesis Network. The toolkit does the heavy lifting.

| Status | ID | Task | How | KPI | Depends |
|:---:|:---|:---|:---|:---|:---|
| `[ ]` | L-1 | Deploy the swarm | `npx agentlaunch create` → Genesis Network. Deploys all 7 agents with presets. Set secrets: `ANTHROPIC_API_KEY`, `ASI_ONE_API_KEY` for Brain. | All 7 running | — |
| `[ ]` | L-2 | Fund wallets | Send ~15 FET to each agent's Fetch.ai wallet (105 FET total). Fund BSC wallets with small BNB for gas. | Balances confirmed | L-1 |
| `[ ]` | L-3 | Seed cross-holdings | Buy tokens via frontend: Coordinator→$DATA, Coordinator→$THINK, Brain→$DATA, Analyst→$DATA, Sentinel→$DATA. 5 buys, ~250 FET. | 5 holdings visible | L-2 |
| `[ ]` | L-4 | Verify commerce | Use `network_status` MCP tool. All 7 running, no errors. Brain pays Oracle 0.01 FET for first query. | GDP > 0 | L-3 |

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

| Status | ID | Task | How | KPI | Depends |
|:---:|:---|:---|:---|:---|:---|
| `[ ]` | P-1 | Oracle data moat | Monitor via `check_agent_commerce`. Oracle should have 14-28 days of OHLC data. Irreplicable data. | 28 daily summaries | L-4 |
| `[ ]` | P-2 | ASI:One discovery | Submit Coordinator for ASI:One routing. Optimize README for discovery ranking. Wait for first organic query. | ≥1 organic query | L-4 |
| `[ ]` | P-3 | Tune the swarm | Review `network_status`: Brain cache hit rate >30%, Sentinel false positive rate <20%. Adjust pricing. | Metrics baselined | P-1 |
| `[ ]` | P-4 | First organic cross-holding | Check if any agent autonomously bought a token with earned FET via HoldingsManager. | ≥1 organic buy | P-3 |

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

| Status | ID | Task | How | KPI | Depends |
|:---:|:---|:---|:---|:---|:---|
| `[ ]` | G-1 | Launcher deploys child agents | Review Launcher's gap analysis (in storage). If ≥3 gaps found, let it scaffold + deploy. You sign transactions. | ≥2 new agents | P-4 |
| `[ ]` | G-2 | Scout discovers opportunities | Review Scout's discoveries. Tokenize highest-quality find. Present to $FIND holders. | ≥10 discovered, 1 tokenized | P-4 |
| `[ ]` | G-3 | Brain profitability | Compare Brain's FET revenue vs Claude/ASI:One API costs. Target: revenue ≥ cost. Tune pricing if needed. | Revenue ≥ cost | G-1 |
| `[ ]` | G-4 | Network census | Run `network_status` across all agents. Document total agents, GDP, holder distribution. | ≥12 agents total | G-2 |

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

| Status | ID | Task | How | KPI | Depends |
|:---:|:---|:---|:---|:---|:---|
| `[ ]` | S-1 | Self-sustaining revenue | All operational costs covered by agent commerce revenue. Check monthly via `network_status`. | Profitable | G-4 |
| `[ ]` | S-2 | Autonomous reproduction | Launcher deploys agents without prompting. Scout tokenizes discoveries autonomously. You just sign. | Auto-builds happening | S-1 |
| `[ ]` | S-3 | Data irreplicability | Oracle has 90+ days of historical data. Analyst has 90 days of prediction accuracy data. | 90 summaries, r² > 0.5 | S-1 |
| `[ ]` | S-4 | Community traction | At least 1 token with >10 organic holders. Multi-operator transition plan documented. | ≥1 token >10 holders | S-2 |

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

First token reaches 30K FET. Auto-DEX listing. The network proves itself.

| Status | ID | Task | How | KPI | Depends |
|:---:|:---|:---|:---|:---|:---|
| `[ ]` | F-1 | First graduation | A token reaches 30,000 FET raised. Auto-lists on PancakeSwap/Uniswap. Verify DEX listing. | 1 token graduated | S-4 |
| `[ ]` | F-2 | Community > operator | Most token holdings are organic (not your seed). The community owns the network. | Organic > operator | F-1 |
| `[ ]` | F-3 | ASI:One default routing | Coordinator becomes default for crypto queries on ASI:One. Organic traffic drives GDP. | Default routing | F-1 |
| `[ ]` | F-4 | Network independence | All 7 Genesis agents profitable. Launcher builds autonomously. Multi-operator keys distributed. | Self-sustaining | F-2, F-3 |

### Endgame Gate

```
  [ ] ≥1 token graduated to DEX
  [ ] Organic holders outnumber operator holdings
  [ ] Network GDP: ≥500 FET/day
  [ ] All 7 Genesis agents profitable
  [ ] Launcher builds without human prompting
```

---

## Dependency Graph

```
L-1 ─────────────────────────────────────────────────────────────────────►
 │
 └► L-2 ► L-3 ► L-4 ──┬──► P-1 ► P-3 ► P-4 ──┬──► G-1 ► G-3 ──┐
                       │                       │               │
                       └──► P-2                └──► G-2 ► G-4 ─┼──► S-1 ──┬──► S-2 ► S-4 ──► F-1 ──┬──► F-2 ──► F-4
                                                               │          │                        │
                                                               │          └──► S-3                 └──► F-3 ──┘
                                                               │
                                                               └───────────────────────────────────────────────────►
```

---

## Progress Overview

```
╭──────────────────────────────────────────────────────────────────────────────╮
│                         TASK COMPLETION                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Phase 1: Launch       [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  0/4    0%         │
│   Phase 2: Prove        [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  0/4    0%         │
│   Phase 3: Grow         [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  0/4    0%         │
│   Phase 4: Sustain      [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  0/4    0%         │
│   Phase 5: Graduate     [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  0/4    0%         │
│   ────────────────────────────────────────────────────────────────          │
│   TOTAL                 [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  0/20   0%         │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯
```

---

## Monitoring Cheat Sheet

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

## Execution with `/grow`

```bash
# Execute next pending task
/grow

# Execute multiple tasks
/grow 5

# Execute specific task
/grow L-1

# Check status
/grow status
```

---

*0/20. Launch day is one command. Everything after is watching the loops compound.*
