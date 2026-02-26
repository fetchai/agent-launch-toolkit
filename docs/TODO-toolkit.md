---
title: AgentLaunch Toolkit — Commerce Layer + Genesis Network
type: roadmap
version: 1.0.0
priority: Commerce Foundation → Genesis Templates → SDK/MCP Extensions → Integration
total_tasks: 48
completed: 0
status: READY
agent_teams: enabled
claude_config: .claude/*
source_docs:
  - docs/organic-growth-strategy.md
  - docs/create-valuable-agents.md
created: 2026-02-26
updated: 2026-02-26
strategy: BUILD THE ECONOMY — Payment Protocol + 7 Genesis Agents + Commerce SDK
---

# AgentLaunch Toolkit — Commerce Layer + Genesis Network

> **Goal:** Implement the Commerce Layer (agent-to-agent FET payments) and
> build all 7 Genesis Network agents with commerce built in. Agents pay
> each other for services. Agents buy each other's tokens. The network
> funds itself.
>
> **Status:** 0/48 — READY TO BUILD
>
> **Core insight:** The [fetchai/uAgents](https://github.com/fetchai/uAgents) framework
> provides `ctx.ledger` (cosmpy LedgerClient) and `ctx.wallet` for blockchain operations.
> We build custom Payment Protocol messages using `uagents.Model` and execute transfers
> via cosmpy's `Transaction` class.
>
> **uAgents version:** `>=0.23.7` | **cosmpy version:** `>=0.11.0`

---

## What Exists vs What We Build

```
╔══════════════════════════════════════════════════════════════════════════╗
║                                                                          ║
║  WHAT WE HAVE                                                            ║
║  ════════════                                                            ║
║  ✓ SDK: tokens, market, handoff, agents (published on npm)               ║
║  ✓ CLI: scaffold, deploy, tokenize, create (published on npm)            ║
║  ✓ MCP: 13+ tools for Claude Code (published on npm)                     ║
║  ✓ Templates: 6 agent blueprints (custom, price-monitor, trading,        ║
║    data-analyzer, research, gifter)                                      ║
║  ✓ Platform: bonding curves, token creation, trade links, API            ║
║  ✓ Agentverse: hosting, Chat Protocol, storage, allowed imports          ║
║  ✓ uAgents v0.23.7: Agent, Context, Protocol, Model, ctx.ledger (cosmpy)║
║                                                                          ║
║  WHAT WE BUILD                                                           ║
║  ═════════════                                                           ║
║  ✗ Commerce patterns: agent-to-agent FET payments in templates           ║
║  ✗ Payment Protocol integration in all agent code                        ║
║  ✗ 7 Genesis Agent templates (Oracle, Brain, Analyst, Coordinator,       ║
║    Sentinel, Launcher, Scout)                                            ║
║  ✗ SDK extensions: wallet seeding, balance queries                       ║
║  ✗ MCP tools: fund agent, check balance, commerce status                 ║
║  ✗ Updated rules/patterns for Payment Protocol                           ║
║  ✗ Integration tests: end-to-end commerce flow                           ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
```

---

## Progress Overview

```
╭──────────────────────────────────────────────────────────────────────────────╮
│                         TASK COMPLETION                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   P0: COMMERCE FOUNDATION  [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  0/8    0%    │
│   P1: GENESIS TEMPLATES    [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  0/14   0%    │
│   P2: SDK + MCP EXTENSIONS [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  0/10   0%    │
│   P3: RULES + PATTERNS     [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  0/6    0%    │
│   P4: INTEGRATION + TEST   [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  0/10   0%    │
│   ────────────────────────────────────────────────────────────────          │
│   TOTAL                    [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  0/48   0%    │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯
```

---

## Wave Execution Strategy

```
╔══════════════════════════════════════════════════════════════════════════╗
║                                                                          ║
║   4 WAVES — FOUNDATION, THEN AGENTS, THEN EXTENSIONS, THEN TEST         ║
║                                                                          ║
║                                                                          ║
║   Wave 1: COMMERCE FOUNDATION (2 agents)                                 ║
║   ──────────────────────────────────────                                  ║
║                                                                          ║
║   ┌──────────────────────┐ ┌──────────────────────┐                      ║
║   │ Agent A:              │ │ Agent B:              │                      ║
║   │ Payment Protocol      │ │ Wallet Patterns       │                      ║
║   │ COM-001→004           │ │ COM-005→008           │                      ║
║   │ (Opus)                │ │ (Opus)                │                      ║
║   └──────────────────────┘ └──────────────────────┘                      ║
║                                                                          ║
║                                                                          ║
║   Wave 2: GENESIS TEMPLATES (4 agents in parallel)                       ║
║   ────────────────────────────────────────────────                        ║
║                                                                          ║
║   ┌────────────────┐ ┌────────────────┐ ┌────────────────┐               ║
║   │ Agent C:        │ │ Agent D:        │ │ Agent E:        │               ║
║   │ Oracle + Brain  │ │ Analyst +       │ │ Launcher +      │               ║
║   │ GEN-001→004     │ │ Coordinator     │ │ Scout           │               ║
║   │ (Sonnet)        │ │ GEN-005→008     │ │ GEN-009→012     │               ║
║   │                 │ │ (Sonnet)        │ │ (Sonnet)        │               ║
║   └────────────────┘ └────────────────┘ └────────────────┘               ║
║                                                                          ║
║   ┌────────────────┐                                                     ║
║   │ Agent F:        │                                                     ║
║   │ Sentinel +      │                                                     ║
║   │ Commerce Base   │                                                     ║
║   │ GEN-013→014     │                                                     ║
║   │ (Sonnet)        │                                                     ║
║   └────────────────┘                                                     ║
║                                                                          ║
║                                                                          ║
║   Wave 3: SDK + MCP + RULES (3 agents in parallel)                       ║
║   ─────────────────────────────────────────────────                       ║
║                                                                          ║
║   ┌────────────────┐ ┌────────────────┐ ┌────────────────┐               ║
║   │ Agent G:        │ │ Agent H:        │ │ Agent I:        │               ║
║   │ SDK Extensions  │ │ MCP Tools       │ │ Rules + Docs    │               ║
║   │ EXT-001→005     │ │ EXT-006→010     │ │ RUL-001→006     │               ║
║   │ (Sonnet)        │ │ (Sonnet)        │ │ (Sonnet)        │               ║
║   └────────────────┘ └────────────────┘ └────────────────┘               ║
║                                                                          ║
║                                                                          ║
║   Wave 4: INTEGRATION + TEST (2 agents)                                  ║
║   ──────────────────────────────────────                                  ║
║                                                                          ║
║   ┌──────────────────────┐ ┌──────────────────────┐                      ║
║   │ Agent J:              │ │ Agent K:              │                      ║
║   │ Integration Tests     │ │ Deploy + E2E          │                      ║
║   │ TST-001→005           │ │ TST-006→010           │                      ║
║   │ (Opus)                │ │ (Opus)                │                      ║
║   └──────────────────────┘ └──────────────────────┘                      ║
║                                                                          ║
║   TOTAL: ~11 agents across 4 waves                                       ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
```

---

## P0: COMMERCE FOUNDATION (Wave 1)

> The primitives. Payment Protocol wrappers, wallet patterns, FET transfer
> utilities. Everything else builds on this.

### Agent A: Payment Protocol Integration

| Status | ID | Task | Details | Depends |
|:---:|:---|:---|:---|:---|
| `[ ]` | COM-001 | Research Payment Protocol API | Read `uagents_core.contrib.protocols.payment` source. Document: `RequestPayment`, `CommitPayment`, `CompletePayment`, `RejectPayment`, `CancelPayment`, `Funds` models. Verify available on Agentverse hosted agents. | — |
| `[ ]` | COM-002 | Create `commerce-base` template module | Reusable Python module: `commerce.py` with `PaymentService` class. Methods: `charge(ctx, sender, amount, description)`, `pay(ctx, recipient, amount, description)`, `get_balance(ctx)`, `get_revenue_log(ctx)`. Uses `ctx.ledger.send_tokens()` internally. Stores tx history in agent storage. | COM-001 |
| `[ ]` | COM-003 | Create `pricing` module | `pricing.py`: `PricingTable` class. Load prices from storage. `get_price(service_name)`, `set_price(service_name, amount)`. Auto-adjust prices based on demand (optional). JSON storage format. | COM-001 |
| `[ ]` | COM-004 | Create `tier` module | `tier.py`: `TierManager` class. `get_tier(ctx, sender_address)` → "free" or "premium". Checks token holdings via AgentLaunch API (`GET /token/{addr}/holders`). Falls back to registration-based mapping (wallet → agent address). Caches in storage. | COM-001 |

### Agent B: Wallet Patterns + Revenue Tracking

| Status | ID | Task | Details | Depends |
|:---:|:---|:---|:---|:---|
| `[ ]` | COM-005 | Create `wallet` module | `wallet.py`: `WalletManager` class. `get_balance(ctx)` via `ctx.ledger.query_bank_balance()`. `fund_check(ctx, min_balance)` — warn if low. `get_address(ctx)` → agent's Fetch.ai wallet address. | COM-001 |
| `[ ]` | COM-006 | Create `revenue` module | `revenue.py`: `RevenueTracker` class. Tracks all incoming/outgoing FET. `record_income(ctx, amount, source, service)`, `record_expense(ctx, amount, dest, service)`. Daily summaries in storage. `get_gdp_contribution(ctx)` → this agent's share of network GDP. | COM-002 |
| `[ ]` | COM-007 | Create `cross_holdings` module | `cross_holdings.py`: `HoldingsManager` class. Track which tokens this agent holds. `should_buy(ctx, token_addr)` — heuristic: do I use this agent's service? Is my holding below minimum? `generate_buy_link(token_addr, amount)` → handoff link for operator. For autonomous buys on BSC: `buy_via_web3(ctx, token_addr, amount)` using `web3` + agent's EVM wallet (if configured). | COM-002 |
| `[ ]` | COM-008 | Create `self_aware` mixin | `self_aware.py`: `SelfAwareMixin` class. `on_interval_self_monitor(ctx)` — reads own token price, holder count, volume. Stores 30-day history. Computes 7-day moving averages. Sets `effort_mode` in storage. Other modules read `effort_mode` to adapt behavior. | COM-005 |

**Gate:** All 8 modules compile, import cleanly, have docstrings. Unit tests for `commerce.py` and `revenue.py`.

---

## P1: GENESIS TEMPLATES (Wave 2)

> The 7 Genesis Network agents. Each uses the commerce modules from P0.
> Each is a production-ready Agentverse agent template.

### Agent C: Oracle + Brain

| Status | ID | Task | Details | Depends |
|:---:|:---|:---|:---|:---|
| `[ ]` | GEN-001 | Build Oracle agent template ($DATA) | Full agent: 5-min data collection, tiered storage (intraday + daily OHLC), Chat Protocol handler, pricing (0.01 FET/query current, 0.10 FET/query history), revenue tracking. Uses `commerce.py` for payments, `pricing.py` for rates, `tier.py` for premium access. Must follow `uagent-patterns.md`. | COM-001→008 |
| `[ ]` | GEN-002 | Build Oracle README for ASI:One | README optimized for ASI:One discovery. Capabilities, examples, use cases. Must score high on agent ranking factors (README quality, Chat Protocol, description). | GEN-001 |
| `[ ]` | GEN-003 | Build Brain agent template ($THINK) | Full agent: LLM routing (Claude + ASI:One), aggressive caching in storage, usage tracking, pricing (0.05 FET basic, 0.15 FET deep), revenue tracking, cost monitoring (track API spend vs FET income). Needs `ANTHROPIC_API_KEY` and `ASI_ONE_API_KEY` secrets. | COM-001→008 |
| `[ ]` | GEN-004 | Build Brain README for ASI:One | README for discovery. Focus on: shared LLM service, cheaper than running your own, cached responses. | GEN-003 |

### Agent D: Analyst + Coordinator

| Status | ID | Task | Details | Depends |
|:---:|:---|:---|:---|:---|
| `[ ]` | GEN-005 | Build Analyst agent template ($RANK) | Full agent: daily evaluation of all tokens, multi-factor scoring (holders, volatility, trend, volume, age, progress), publishes scores to storage, pricing (0.02 FET/score, 0.10 FET/report), revenue tracking. Pulls history from Oracle via Chat Protocol (pays Oracle 0.01 FET). | COM-001→008 |
| `[ ]` | GEN-006 | Build Analyst README for ASI:One | Quality scoring, agent rankings, track record. | GEN-005 |
| `[ ]` | GEN-007 | Build Coordinator agent template ($COORD) | Full agent: query classification (via Brain, pays 0.05 FET), pre-fetched Analyst scores, routing to specialists, response assembly, fallback to Brain for direct answers. Pricing (0.02 FET routing fee charged to external users via Payment Protocol). Latency-aware: pre-fetch pattern for cache, live query for premium. | COM-001→008 |
| `[ ]` | GEN-008 | Build Coordinator README for ASI:One | Flagship README. Broad capabilities, examples, use cases. This is the entry point for ASI:One traffic. Must be excellent. | GEN-007 |

### Agent E: Launcher + Scout

| Status | ID | Task | Details | Depends |
|:---:|:---|:---|:---|:---|
| `[ ]` | GEN-009 | Build Launcher agent template ($BUILD) | Full agent: weekly gap analysis (reads Analyst scores), scaffolds from templates, deploys via Agentverse API (double-encoded), tokenizes via AgentLaunch API, portfolio tracking. Pricing (0.10 FET/gap report). Only builds for HIGH-confidence gaps. | COM-001→008 |
| `[ ]` | GEN-010 | Build Launcher README for ASI:One | Self-replicating factory. Gap analysis, portfolio of created agents. | GEN-009 |
| `[ ]` | GEN-011 | Build Scout agent template ($FIND) | Full agent: daily discovery via ASI:One queries, cross-references with tokenized agents, quality scoring, opportunity storage. Pricing (0.05 FET/discovery report). Uses `DISCOVERY_QUERIES` list, rotates queries. | COM-001→008 |
| `[ ]` | GEN-012 | Build Scout README for ASI:One | Agent discovery, tokenization opportunities, investment club. | GEN-011 |

### Agent F: Sentinel + Commerce Base Template

| Status | ID | Task | Details | Depends |
|:---:|:---|:---|:---|:---|
| `[ ]` | GEN-013 | Build Sentinel agent template ($WATCH) | Full agent: 2-min monitoring of all tokens, anomaly detection (volume spike, graduation approach, whale buys), alert storage, pricing (0.05 FET/alert feed). Zero LLM cost — pure API + math. | COM-001→008 |
| `[ ]` | GEN-014 | Register all 7 as templates in templates package | Add `oracle`, `brain`, `analyst`, `coordinator`, `sentinel`, `launcher`, `scout` to `packages/templates/`. Each template includes: agent.py (main code), commerce.py, pricing.py, tier.py, wallet.py, revenue.py, self_aware.py, README.md. Update template registry. | GEN-001→013 |

**Gate:** All 7 agents compile. Each generates valid Agentverse-deployable code via `generateFromTemplate()`. Each includes commerce modules.

---

## P2: SDK + MCP EXTENSIONS (Wave 3A + 3B)

> New SDK methods and MCP tools for commerce operations.

### Agent G: SDK Extensions

| Status | ID | Task | Details | Depends |
|:---:|:---|:---|:---|:---|
| `[ ]` | EXT-001 | Add `sdk.agents.getWalletAddress(agentAddress)` | Query Agentverse API for agent's wallet address. Might need to parse from agent details or storage. | GEN-014 |
| `[ ]` | EXT-002 | Add `sdk.agents.getBalance(walletAddress)` | Query Fetch.ai chain for FET balance via public RPC or CosmPy. Returns balance in FET. | EXT-001 |
| `[ ]` | EXT-003 | Add `sdk.commerce.getNetworkGDP(period)` | Calculate total FET transacted between Genesis agents. Reads revenue logs from agent storage (via Agentverse storage API). Returns daily/weekly/monthly GDP. | GEN-014 |
| `[ ]` | EXT-004 | Add `sdk.commerce.getAgentRevenue(agentAddress)` | Read agent's revenue tracker from storage. Returns income, expenses, net, by service. | GEN-014 |
| `[ ]` | EXT-005 | Add `sdk.commerce.getPricingTable(agentAddress)` | Read agent's pricing table from storage. Returns service → price mapping. | GEN-014 |

### Agent H: MCP Tools

| Status | ID | Task | Details | Depends |
|:---:|:---|:---|:---|:---|
| `[ ]` | EXT-006 | Add `fund_agent_wallet` MCP tool | Input: agent address, amount. Output: instructions to send FET to agent's wallet address. Generates Fetch.ai chain transfer instructions. | EXT-001, EXT-002 |
| `[ ]` | EXT-007 | Add `check_agent_balance` MCP tool | Input: agent address. Output: FET balance, recent transactions, revenue summary. | EXT-002, EXT-004 |
| `[ ]` | EXT-008 | Add `network_gdp` MCP tool | Input: period (day/week/month). Output: total FET transacted, per-agent breakdown, trend. | EXT-003 |
| `[ ]` | EXT-009 | Add `deploy_genesis_network` MCP tool | Meta-tool: scaffolds all 7 Genesis agents, deploys them in sequence (Oracle first), returns all addresses + deploy links. Guided flow with human confirmation at each step. | GEN-014 |
| `[ ]` | EXT-010 | Add `commerce_status` MCP tool | Input: none or agent address. Output: if no address: full network commerce status (all agents, GDP, health). If address: that agent's revenue, pricing, balance, tier distribution. | EXT-003→005 |

---

## P3: RULES + PATTERNS (Wave 3C)

> Updated coding rules and patterns for the commerce-aware toolkit.

### Agent I: Rules + Documentation

| Status | ID | Task | Details | Depends |
|:---:|:---|:---|:---|:---|
| `[ ]` | RUL-001 | Add `payment-protocol.md` rule | `.claude/rules/payment-protocol.md`: Payment Protocol imports, `RequestPayment`/`CommitPayment` flow, `ctx.ledger.send_tokens()` pattern, denomination (`afet` vs `atestfet`), error handling. | COM-001 |
| `[ ]` | RUL-002 | Update `uagent-patterns.md` | Add Payment Protocol to the minimal working agent pattern. Add wallet access pattern. Add commerce module import pattern. | COM-001 |
| `[ ]` | RUL-003 | Add `genesis-network.md` rule | `.claude/rules/genesis-network.md`: The 7 agents, their addresses (once deployed), their pricing, cross-holdings, commerce patterns. Reference for any agent that needs to interact with the network. | GEN-014 |
| `[ ]` | RUL-004 | Update CLAUDE.md | Add Commerce Layer section: what it is, how agents pay each other, the 7 genesis agents, pricing table, GDP metric. Add payment protocol to "Agentverse API Gotchas". | RUL-001→003 |
| `[ ]` | RUL-005 | Add `/genesis` skill | `.claude/skills/genesis/SKILL.md`: Guided deployment of the Genesis Network. Step-by-step: deploy Oracle → verify → deploy Brain+Coordinator → verify → deploy rest → cross-holdings. Uses `deploy_genesis_network` MCP tool. | EXT-009 |
| `[ ]` | RUL-006 | Update `organic-growth-strategy.md` | Add "Implementation Status" section mapping strategy concepts to actual template names, module names, and MCP tools. Living reference. | GEN-014, EXT-006→010 |

---

## P4: INTEGRATION + TEST (Wave 4)

> Nothing ships until tested. End-to-end commerce flows.

### Agent J: Unit + Integration Tests

| Status | ID | Task | Details | Depends |
|:---:|:---|:---|:---|:---|
| `[ ]` | TST-001 | Test commerce modules | Unit tests for `commerce.py`, `pricing.py`, `tier.py`, `wallet.py`, `revenue.py`, `self_aware.py`, `cross_holdings.py`. Mock `ctx.ledger` and `ctx.storage`. | COM-001→008 |
| `[ ]` | TST-002 | Test each Genesis template generates valid code | `generateFromTemplate('oracle')` → valid Python. Same for all 7. Check: imports resolve, no syntax errors, all required handlers present (`ChatMessage`, `ChatAcknowledgement`). | GEN-014 |
| `[ ]` | TST-003 | Test SDK extensions | Unit tests for `getBalance`, `getNetworkGDP`, `getAgentRevenue`, `getPricingTable`. Mock API responses. | EXT-001→005 |
| `[ ]` | TST-004 | Test MCP tools | Each new MCP tool called with valid input → valid output. Mock backend. | EXT-006→010 |
| `[ ]` | TST-005 | Build + test all packages from clean state | `rm -rf node_modules && npm install && npm run build && npm test` — all green. | TST-001→004 |

### Agent K: Deploy + End-to-End

| Status | ID | Task | Details | Depends |
|:---:|:---|:---|:---|:---|
| `[ ]` | TST-006 | Deploy Oracle to Agentverse (testnet) | Scaffold → deploy → verify running → verify data collection → verify storage. First real deployment. | TST-005 |
| `[ ]` | TST-007 | Deploy Brain to Agentverse (testnet) | Deploy → set secrets → verify LLM routing → verify caching. | TST-006 |
| `[ ]` | TST-008 | Test agent-to-agent FET transfer | Oracle and Brain both running. Brain sends 0.01 FET to Oracle (service payment). Verify: Oracle balance increases, Brain balance decreases, both revenue logs updated. | TST-007 |
| `[ ]` | TST-009 | Test full commerce flow | Coordinator receives query → pays Brain for classification → pays Oracle for data → assembles response → logs all transactions. Verify: revenue tracked, GDP calculable. | TST-008 |
| `[ ]` | TST-010 | Security review | No hardcoded keys. No private keys in templates. `.env` in `.gitignore`. Wallet operations use proper error handling. Rate limiting on paid services. Kill switch if balance drops to zero. | TST-009 |

**Gate:** Oracle + Brain deployed on testnet. FET transfer verified. Commerce flow end-to-end works.

---

## Dependency Graph

```
Wave 1 (2 agents in parallel — Commerce Foundation):

  Agent A: COM-001 → COM-002 → COM-003 → COM-004
  Agent B: COM-005 → COM-006 → COM-007 → COM-008
                                                │
  (COM-001 shared dependency — research first)  │
                                                ▼
  GATE: All modules compile + basic tests pass


Wave 2 (4 agents in parallel — Genesis Templates):

  ┌──────────────────────────────────────────────────────┐
  │                                                      │
  │  Agent C: GEN-001 → GEN-002 → GEN-003 → GEN-004     │
  │  Agent D: GEN-005 → GEN-006 → GEN-007 → GEN-008     │
  │  Agent E: GEN-009 → GEN-010 → GEN-011 → GEN-012     │
  │  Agent F: GEN-013 → GEN-014 (registers all 7)        │
  │                                                      │
  │  GEN-014 depends on GEN-001→013 (all agents done)    │
  │                                                      │
  └──────────────────────────────────────────────────────┘
                         │
                         ▼
  GATE: All 7 templates generate valid code


Wave 3 (3 agents in parallel — Extensions):

  ┌──────────────────────────────────────────────────────┐
  │                                                      │
  │  Agent G: EXT-001 → EXT-002 → EXT-003→005            │
  │  Agent H: EXT-006→010 (after EXT-001→005)            │
  │  Agent I: RUL-001→006 (parallel with G+H)            │
  │                                                      │
  └──────────────────────────────────────────────────────┘
                         │
                         ▼

Wave 4 (2 agents — Integration):

  Agent J: TST-001 → TST-002 → TST-003 → TST-004 → TST-005
  Agent K: TST-006 → TST-007 → TST-008 → TST-009 → TST-010
           (K starts after TST-005)
```

---

## Key Technical Decisions

### Chain Architecture

```
FETCH.AI COSMOS CHAIN (agent wallets):
  └── Agent-to-agent FET payments (spot market)
  └── ctx.ledger (cosmpy.LedgerClient) + ctx.wallet
  └── cosmpy.aerial.tx.Transaction for transfers
  └── Denomination: "atestfet" (testnet), "afet" (mainnet)
  └── 1 FET = 10^18 atestfet (always use int, never float)
  └── This is where the Commerce Layer operates

BSC (bonding curves):
  └── Token creation, buying, selling (equity market)
  └── web3.py — EVM interaction from Agentverse
  └── Agents CAN buy tokens if they have BSC wallet + FET on BSC
  └── Cross-holdings happen here

TWO CHAINS, TWO PURPOSES:
  Fetch.ai = operating revenue (service payments)
  BSC = equity/reputation (token holdings)

UAGENTS FRAMEWORK (github.com/fetchai/uAgents):
  └── uagents v0.23.7 — Agent, Context, Protocol, Model
  └── uagents-core v0.4.3 — Identity, registration, config
  └── cosmpy v0.11.0 — LedgerClient, Transaction, signing
  └── Reference: .claude/rules/uagent-patterns.md
```

### Module Architecture

```
Every Genesis agent includes:

agent.py              ← Main agent code (Chat Protocol + on_interval)
commerce.py           ← PaymentService: charge(), pay(), get_balance()
pricing.py            ← PricingTable: per-service pricing, auto-adjust
tier.py               ← TierManager: free/premium from token holdings
wallet.py             ← WalletManager: balance checks, fund alerts
revenue.py            ← RevenueTracker: income/expense/GDP tracking
self_aware.py         ← SelfAwareMixin: read own token price, adapt
```

### Pricing Defaults (agents can adjust)

```
SERVICE                        PRICE        WHO EARNS
──────────────────────────────────────────────────────
Current market data            0.01 FET     Oracle
Historical OHLC (90 days)      0.10 FET     Oracle
Query classification           0.05 FET     Brain
Basic reasoning (Sonnet)       0.05 FET     Brain
Deep reasoning (Opus)          0.15 FET     Brain
Agent quality score            0.02 FET     Analyst
Full evaluation report         0.10 FET     Analyst
Alert feed (latest 50)         0.05 FET     Sentinel
Gap analysis report            0.10 FET     Launcher
Agent discovery report         0.05 FET     Scout
Query routing                  0.02 FET     Coordinator
```

---

## Success Criteria

```
╔══════════════════════════════════════════════════════════════════════════╗
║                                                                          ║
║   THE COMMERCE TEST                                                      ║
║                                                                          ║
║   1. Deploy Oracle + Brain to Agentverse (testnet)                       ║
║   2. Fund both agent wallets with testnet FET                            ║
║   3. Brain queries Oracle for market data                                ║
║   4. Oracle charges Brain 0.01 FET                                       ║
║   5. FET transfers on Fetch.ai chain                                     ║
║   6. Both agents log the transaction in revenue tracker                  ║
║   7. Revenue is queryable via SDK: getAgentRevenue()                     ║
║                                                                          ║
║   RESULT:                                                                ║
║   ✓ Agent-to-agent FET payment executed autonomously                     ║
║   ✓ No human involved in the transaction                                 ║
║   ✓ Revenue tracked and queryable                                        ║
║   ✓ The Commerce Layer is real                                           ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
```

---

## Execution Commands

```bash
# Wave 1: Commerce Foundation (2 agents, ~2 hours)
> "Launch 2 agents in parallel:
   Agent A: COM-001→004 (Payment Protocol, commerce module, pricing, tier)
   Agent B: COM-005→008 (wallet, revenue, cross-holdings, self-aware)
   Reference: docs/organic-growth-strategy.md for architecture.
   Reference: uagents_core.contrib.protocols.payment for Payment Protocol."

# Wave 2: Genesis Templates (4 agents, ~3 hours)
> "Launch 4 agents in parallel:
   Agent C: GEN-001→004 (Oracle + Brain templates)
   Agent D: GEN-005→008 (Analyst + Coordinator templates)
   Agent E: GEN-009→012 (Launcher + Scout templates)
   Agent F: GEN-013→014 (Sentinel + register all 7 in template package)
   Each template uses commerce modules from Wave 1.
   Follow uagent-patterns.md for Chat Protocol patterns."

# Wave 3: Extensions (3 agents, ~2 hours)
> "Launch 3 agents in parallel:
   Agent G: EXT-001→005 (SDK: wallet, balance, GDP, revenue, pricing)
   Agent H: EXT-006→010 (MCP: fund, balance, GDP, genesis deploy, status)
   Agent I: RUL-001→006 (rules, patterns, CLAUDE.md, /genesis skill)"

# Wave 4: Integration (2 agents, ~2 hours)
> "Launch 2 agents:
   Agent J: TST-001→005 (unit tests, build verification)
   Agent K: TST-006→010 (deploy to testnet, end-to-end commerce, security)"
```

---

## References

| Resource | URL | Purpose |
|----------|-----|---------|
| **Organic Growth TODO** | [TODO-organic-growth.md](./TODO-organic-growth.md) | Execution plan: 52 tasks, 5 phases |
| **Strategy Doc** | [organic-growth-strategy.md](./organic-growth-strategy.md) | Full strategy document |
| **uAgents GitHub** | [fetchai/uAgents](https://github.com/fetchai/uAgents) | Official uAgents framework |
| **uAgents Docs** | [uagents.fetch.ai/docs](https://uagents.fetch.ai/docs) | Official documentation |
| **cosmpy** | [PyPI: cosmpy](https://pypi.org/project/cosmpy/) | Ledger operations |
| **Send Tokens Guide** | [fetch.ai/docs](https://fetch.ai/docs/guides/agents/send-tokens) | How to send FET |
| **Platform TODO** | `/fetchlaunchpad/docs/TODO-toolkit.md` | Platform API extensions |
| **Custodial Trading** | `/fetchlaunchpad/docs/TODO-custodial-trading.md` | HD wallet for agents |
| **uAgent Patterns** | `.claude/rules/uagent-patterns.md` | Code patterns + Payment Protocol |

---

*0/48 complete. 11 agents. 4 waves. The Commerce Layer is the foundation.*
