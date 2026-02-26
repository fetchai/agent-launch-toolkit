---
title: AgentLaunch Toolkit — Genesis Template + Swarm Tools
type: roadmap
version: 2.0.0
priority: Commerce Foundation → Genesis Template → SDK/MCP Extensions → Rules → Test
total_tasks: 24
completed: 0
status: READY
agent_teams: enabled
claude_config: .claude/*
source_docs:
  - docs/organic-growth-strategy.md
  - docs/create-valuable-agents.md
created: 2026-02-26
updated: 2026-02-26
strategy: ONE TEMPLATE, INFINITE SWARMS — Genesis template + presets + commerce SDK
---

# AgentLaunch Toolkit — Genesis Template + Swarm Tools

> **Goal:** Build ONE genesis template with full commerce infrastructure baked in.
> Users scaffold multiple agents from this template to create swarms. Agents
> discover, pay, and coordinate with each other autonomously.
>
> **Status:** 0/24 — READY TO BUILD
>
> **Architecture:** Single monolithic agent.py (matches existing 6 templates).
> Commerce layers are inline classes. 7 Genesis agents are presets + examples,
> not separate templates.
>
> **Payment Protocol:** Uses official `uagents_core.contrib.protocols.payment`
> (RequestPayment, CommitPayment, CompletePayment, etc.) with role-based creation.
>
> **No platform changes required.** Commerce runs on Fetch.ai chain via ctx.ledger.
> Cross-holdings use agent-side web3.py with per-agent BSC wallets.

---

## What Exists vs What We Build

```
╔══════════════════════════════════════════════════════════════════════════╗
║                                                                          ║
║  WHAT WE HAVE                                                            ║
║  ════════════                                                            ║
║  ✓ SDK: tokens, market, handoff, agents, agentverse (npm)                ║
║  ✓ CLI: scaffold, deploy, tokenize, create (npm)                         ║
║  ✓ MCP: 13+ tools for Claude Code (npm)                                  ║
║  ✓ Templates: 6 agent blueprints with layered architecture               ║
║    (Logger → Security → Health → Cache → Revenue → Business)             ║
║  ✓ Platform: bonding curves, token creation, trade links, API            ║
║  ✓ Official Payment Protocol in uagents_core                             ║
║                                                                          ║
║  WHAT WE BUILD                                                           ║
║  ═════════════                                                           ║
║  ✗ Genesis template: one template with ALL commerce layers built in      ║
║  ✗ 7 presets: oracle, brain, analyst, coordinator, sentinel,             ║
║    launcher, scout — predefined variable bundles                         ║
║  ✗ 7 example agents: complete business logic for each role               ║
║  ✗ SDK: Agentverse storage API + commerce methods                        ║
║  ✗ MCP: scaffold_genesis, commerce status, deploy swarm                  ║
║  ✗ Rules: Payment Protocol, Genesis Network patterns                     ║
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
│   P0: COMMERCE FOUNDATION   [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  0/6    0%    │
│   P1: GENESIS TEMPLATE      [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  0/4    0%    │
│   P2: SDK + MCP EXTENSIONS  [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  0/6    0%    │
│   P3: RULES + PATTERNS      [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  0/4    0%    │
│   P4: INTEGRATION + TEST    [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  0/4    0%    │
│   ────────────────────────────────────────────────────────────────          │
│   TOTAL                     [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  0/24   0%    │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯
```

---

## Wave Execution Strategy

```
╔══════════════════════════════════════════════════════════════════════════╗
║                                                                          ║
║   3 WAVES — FOUNDATION, THEN EXTENSIONS, THEN TEST                      ║
║                                                                          ║
║   Wave 1: COMMERCE + TEMPLATE (2 agents)                                 ║
║   ──────────────────────────────────────                                 ║
║                                                                          ║
║   ┌────────────────────────┐ ┌────────────────────────┐                  ║
║   │ Agent A:                │ │ Agent B:                │                  ║
║   │ Commerce Classes        │ │ Template Assembly       │                  ║
║   │ COM-01→06               │ │ GEN-01→03               │                  ║
║   │ (sequential)            │ │ (after COM-06 done)     │                  ║
║   └────────────────────────┘ └────────────────────────┘                  ║
║                                                                          ║
║   Wave 2: EXTENSIONS + EXAMPLES + RULES (3 agents parallel)             ║
║   ──────────────────────────────────────────────────────                 ║
║                                                                          ║
║   ┌────────────────┐ ┌────────────────┐ ┌────────────────┐              ║
║   │ Agent C:        │ │ Agent D:        │ │ Agent E:        │              ║
║   │ SDK + MCP       │ │ Examples        │ │ Rules + Docs    │              ║
║   │ EXT-01→06       │ │ GEN-04          │ │ RUL-01→04       │              ║
║   └────────────────┘ └────────────────┘ └────────────────┘              ║
║                                                                          ║
║   Wave 3: TEST (1 agent)                                                 ║
║   ──────────────────────                                                 ║
║                                                                          ║
║   ┌────────────────────────┐                                             ║
║   │ Agent F:                │                                             ║
║   │ Tests + Build           │                                             ║
║   │ TST-01→04               │                                             ║
║   └────────────────────────┘                                             ║
║                                                                          ║
║   TOTAL: ~6 agents across 3 waves                                        ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
```

---

## P0: COMMERCE FOUNDATION (Wave 1A)

> Build the commerce layers as inline Python classes. These will live inside
> `packages/templates/src/templates/genesis.ts` as part of the template's
> Python code string. Uses official Payment Protocol from uagents_core.

| Status | ID | Task | Details | Depends |
|:---:|:---|:---|:---|:---|
| `[ ]` | COM-01 | Research official Payment Protocol | Verify `uagents_core.contrib.protocols.payment` models on Agentverse: `RequestPayment`, `CommitPayment`, `CompletePayment`, `RejectPayment`, `CancelPayment`, `Funds`, `payment_protocol_spec`. Document role-based creation (`role="seller"` / `role="buyer"`). Check allowed-imports.md. | — |
| `[ ]` | COM-02 | Write PaymentService class | Uses official `payment_protocol_spec` with `role="seller"`. Methods: `charge(ctx, sender, amount_afet, service_name)` sends `RequestPayment`, `on_commit(ctx, sender, msg)` verifies payment and calls callback, `get_balance(ctx)` via `ctx.ledger.query_bank_balance()`. Stores transaction log in `ctx.storage`. | COM-01 |
| `[ ]` | COM-03 | Write PricingTable + TierManager classes | `PricingTable`: load/save prices from `ctx.storage`, `get_price(service)`, `set_price(service, afet)`. JSON storage format. `TierManager`: `get_tier(user_addr)` checks token holdings via AgentLaunch API `GET /token/{addr}/holders`, caches result in `Cache` class. Returns `"free"` or `"premium"`. | COM-01 |
| `[ ]` | COM-04 | Write WalletManager + RevenueTracker classes | `WalletManager`: `get_balance(ctx)` via `ctx.ledger.query_bank_balance()`, `get_address(ctx)`, `fund_check(ctx, min_balance)` warns if low. `RevenueTracker`: `record_income(ctx, amount, source, service)`, `record_expense(ctx, amount, dest, service)`, daily summaries in `ctx.storage`, `get_summary(ctx)`. | COM-02 |
| `[ ]` | COM-05 | Write SelfAwareMixin class | `monitor(ctx)` reads own token price + holder count from AgentLaunch API. Stores 30-day history in `ctx.storage`. Computes 7-day moving averages. Sets `effort_mode` (`"normal"` / `"boost"` / `"conserve"`) in storage. Other layers read `effort_mode` to adapt behavior. | COM-04 |
| `[ ]` | COM-06 | Write HoldingsManager class | Primary: `buy_via_web3(ctx, token_addr, amount)` using `web3` + `eth_account` with `BSC_PRIVATE_KEY` secret. Approve FET → call `buyTokens()` on FETAgentCoin contract. Also: `sell_via_web3()`, `get_token_balance()`, `get_holdings_summary()`. Fallback: `generate_buy_link(token_addr, amount)` → handoff URL. Minimal ERC20 + FETAgentCoin ABI inline. | COM-04 |

**Gate:** All 6 commerce classes written as Python code. Each has docstrings. Error handling for chain failures.

---

## P1: GENESIS TEMPLATE + PRESETS (Wave 1B)

> ONE template that gives users all the tools to build any agent in a swarm.
> 7 presets configure common roles. Examples show complete business logic.

| Status | ID | Task | Details | Depends |
|:---:|:---|:---|:---|:---|
| `[ ]` | GEN-01 | Assemble genesis template | Create `packages/templates/src/templates/genesis.ts`. Layered architecture matching existing templates: Logger → Security → Health → Cache → Revenue/Tier → Commerce/Pricing → SelfAware → CrossHoldings → **SwarmBusiness** (customizable section with clear `# ═══ YOUR BUSINESS LOGIC ═══` markers). Template variables: `agent_name`, `description`, `agent_symbol`, `service_name`, `service_price_afet`, `premium_service_price_afet`, `premium_token_threshold`, `free_requests_per_day`, `monitor_interval_seconds`, `rate_limit_per_minute`. Dependencies: `["requests", "web3"]`. Secrets: `["AGENTVERSE_API_KEY", "AGENTLAUNCH_API_KEY", "BSC_PRIVATE_KEY"]`. | COM-01→06 |
| `[ ]` | GEN-02 | Register genesis + wire CLI/MCP | Add genesis to `packages/templates/src/registry.ts`. Add `"genesis"` to CLI `scaffold.ts` VALID_TYPES + LEGACY_TYPE_MAP. Add to MCP `scaffold.ts` TYPE_TO_TEMPLATE. Update MCP index TOOLS `create_and_tokenize` template enum. | GEN-01 |
| `[ ]` | GEN-03 | Create presets system | New file `packages/templates/src/presets.ts`. Export `GENESIS_PRESETS` with 7 entries (oracle, brain, analyst, coordinator, sentinel, launcher, scout). Each preset provides all template variables pre-filled for that role. Export `getPreset(name)`, `listPresets()`. Re-export from `index.ts`. | GEN-01 |
| `[ ]` | GEN-04 | Create 7 example agents + swarm README | `examples/genesis/` — 7 complete `agent.py` files: `oracle.py` (5-min data collection, OHLC), `brain.py` (LLM routing, caching), `analyst.py` (token scoring), `coordinator.py` (query routing), `sentinel.py` (anomaly detection), `launcher.py` (gap analysis, scaffold), `scout.py` (discovery). Each is NOT a template — it's a runnable agent with the SwarmBusiness section filled in. Plus `README.md` explaining: how to deploy a swarm, how agents discover each other via Chat Protocol, how commerce flows between them, the preset system. | GEN-01 |

**Gate:** `generateFromTemplate("genesis", { agent_name: "Test" })` → valid Python with all commerce classes. Each preset generates valid code. All 7 examples have correct imports + ChatMessage/ChatAcknowledgement handlers.

---

## P2: SDK + MCP EXTENSIONS (Wave 2A)

> Agentverse storage API integration + commerce-aware tools for monitoring swarms.

| Status | ID | Task | Details | Depends |
|:---:|:---|:---|:---|:---|
| `[ ]` | EXT-01 | Add Agentverse storage API to SDK | New file `packages/sdk/src/storage.ts`. Functions: `getStorage(apiKey, agentAddress, key)`, `putStorage(apiKey, agentAddress, key, value)`, `deleteStorage(apiKey, agentAddress, key)`. Uses Agentverse API: `GET/PUT/DELETE /v1/hosting/agents/{addr}/storage/{key}`. Export from `index.ts`. Add `storage` namespace to fluent API in `agentlaunch.ts`. | — |
| `[ ]` | EXT-02 | Add commerce SDK methods | New file `packages/sdk/src/commerce.ts`. Functions: `getAgentRevenue(apiKey, agentAddress)` reads `revenue_log` from storage, `getPricingTable(apiKey, agentAddress)` reads `pricing_table` from storage, `getNetworkGDP(apiKey, agentAddresses[], period)` aggregates revenue across agents. All read from Agentverse storage via EXT-01. Export from `index.ts`. Add `commerce` namespace to fluent API. | EXT-01 |
| `[ ]` | EXT-03 | Add `scaffold_genesis` MCP tool | Extend `packages/mcp/src/tools/agentverse.ts` (or new file). Accepts: `name`, `preset` (one of 7 or `"custom"`), `outputDir`. If preset provided, merges preset variables via `getPreset()` before calling `generateFromTemplate("genesis", vars)`. Add tool definition to MCP index TOOLS array + handler map. | GEN-02, GEN-03 |
| `[ ]` | EXT-04 | Add `check_agent_commerce` MCP tool | New file `packages/mcp/src/tools/commerce.ts`. Input: `agentAddress`, `apiKey`. Output: revenue summary, pricing table, Fetch.ai FET balance, effort_mode, holdings summary. Uses SDK commerce methods from EXT-02. | EXT-02 |
| `[ ]` | EXT-05 | Add `network_status` MCP tool | Same file. Input: list of agent addresses (or discovers from storage). Output: per-agent revenue, total network GDP, health indicators, cross-holdings map. | EXT-02 |
| `[ ]` | EXT-06 | Add `deploy_genesis_network` MCP tool | Same file. Meta-tool: input `apiKey`, optional `presets[]` (default all 7). Scaffolds each agent using preset, deploys in sequence (Oracle first), sets secrets, starts agents, returns all addresses + status. Guided flow with status after each step. | EXT-03, GEN-04 |

---

## P3: RULES + PATTERNS (Wave 2B)

> Updated coding rules for the commerce-aware toolkit.

| Status | ID | Task | Details | Depends |
|:---:|:---|:---|:---|:---|
| `[ ]` | RUL-01 | Add `payment-protocol.md` rule | `.claude/rules/payment-protocol.md`: Official Payment Protocol imports from `uagents_core.contrib.protocols.payment`. Role-based creation. Payment flow diagram. `ctx.ledger` patterns. Denomination table (`afet`/`atestfet`). Error handling. | COM-01 |
| `[ ]` | RUL-02 | Update `uagent-patterns.md` | Replace custom PaymentRequest/PaymentCommit models with official imports. Add commerce layer patterns. Reference genesis template. Add SwarmBusiness pattern. Keep existing Chat Protocol + storage patterns. | RUL-01 |
| `[ ]` | RUL-03 | Add `genesis-network.md` rule | `.claude/rules/genesis-network.md`: The 7 agent roles and their capabilities. Pricing table. Cross-holdings strategy. How to customize the SwarmBusiness section. How to add new roles. Reference to `examples/genesis/` and presets system. | GEN-04 |
| `[ ]` | RUL-04 | Update CLAUDE.md + claude-context.ts | Add genesis template to Templates table. Add Commerce Layer section. Add Payment Protocol to "Agentverse API Gotchas". Update `packages/templates/src/claude-context.ts` RULES to include new patterns. Update `buildClaudeMd()` to mention genesis + commerce. | RUL-01→03 |

---

## P4: INTEGRATION + TEST (Wave 3)

> Build, test, verify.

| Status | ID | Task | Details | Depends |
|:---:|:---|:---|:---|:---|
| `[ ]` | TST-01 | Genesis template unit tests | `packages/templates/src/__tests__/genesis.test.ts`. Tests: `generateFromTemplate("genesis", ...)` produces valid Python. Each of 7 presets generates code. All commerce class names present in output (PaymentService, PricingTable, TierManager, WalletManager, RevenueTracker, SelfAwareMixin, HoldingsManager). Variables substituted correctly. Required variables throw in strict mode. | GEN-02 |
| `[ ]` | TST-02 | SDK storage + commerce tests | `packages/sdk/src/__tests__/storage.test.ts` + `commerce.test.ts`. Mock Agentverse storage API responses. Test `getStorage`, `putStorage`, `getAgentRevenue`, `getPricingTable`, `getNetworkGDP`. | EXT-01, EXT-02 |
| `[ ]` | TST-03 | MCP tool tests | `packages/mcp/src/__tests__/commerce.test.ts`. Test `scaffold_genesis`, `check_agent_commerce`, `network_status` tools. Mock SDK calls. Verify tool definitions exist in TOOLS array. | EXT-03→06 |
| `[ ]` | TST-04 | Full build + all tests pass | `npm run clean && npm run build && npm test` — all green. No TypeScript errors. All existing tests still pass. | TST-01→03 |

**Gate:** All packages build. All tests pass. Genesis template generates valid Python with complete commerce infrastructure.

---

## Dependency Graph

```
P0: Commerce Foundation (sequential)
  COM-01 → COM-02 → COM-04 → COM-05
              │         └────→ COM-06
              └── COM-03
                              │
P1: Genesis Template          ▼
  GEN-01 (assemble) ◄────── all COM tasks
  GEN-02 (register) ◄── GEN-01
  GEN-03 (presets)  ◄── GEN-01
  GEN-04 (examples) ◄── GEN-01
                              │
P2: SDK + MCP                 │
  EXT-01 (storage) ──────────┤ (no GEN dependency)
  EXT-02 (commerce) ◄── EXT-01
  EXT-03 (scaffold) ◄── GEN-02, GEN-03
  EXT-04 (check)    ◄── EXT-02
  EXT-05 (network)  ◄── EXT-02
  EXT-06 (deploy)   ◄── EXT-03, GEN-04
                              │
P3: Rules (parallel with P2)  │
  RUL-01 ◄── COM-01          │
  RUL-02 ◄── RUL-01          │
  RUL-03 ◄── GEN-04          │
  RUL-04 ◄── RUL-01→03       │
                              │
P4: Tests                     ▼
  TST-01 ◄── GEN-02
  TST-02 ◄── EXT-01, EXT-02
  TST-03 ◄── EXT-03→06
  TST-04 ◄── TST-01→03
```

---

## Key Technical Decisions

### Template Architecture

```
Genesis template = ONE agent.py with ALL commerce layers inline.

Layers (top to bottom in generated code):

  IMPORTS
    uagents, uagents_core.contrib.protocols.chat
    uagents_core.contrib.protocols.payment (official)
    web3, eth_account, requests, datetime, json

  API CONFIG
    AgentLaunch API URL, Agentverse API URL

  BUSINESS CONFIG ({{variable}} substitutions)
    agent_name, description, pricing, intervals

  LAYER 1: FOUNDATION — Logger (structured logging)
  LAYER 2: SECURITY   — Security (rate limiting, input validation)
  LAYER 3: STABILITY  — Health (uptime, error tracking)
  LAYER 4: SPEED      — Cache (TTL in-memory)
  LAYER 5: REVENUE    — Revenue (token-gated tiers, quotas)
  LAYER 6: COMMERCE   — PaymentService + PricingTable (official Payment Protocol)
  LAYER 7: AWARENESS  — TierManager + WalletManager + RevenueTracker + SelfAwareMixin
  LAYER 8: HOLDINGS   — HoldingsManager (web3.py cross-holdings on BSC)

  ═══ YOUR BUSINESS LOGIC ═══
  SwarmBusiness class — user fills this in
  ═══════════════════════════

  AGENT WIRING
    Chat Protocol handlers, on_interval hooks, agent.include()
```

### Presets System

```
Presets are predefined variable bundles, NOT separate templates.

  generateFromTemplate("genesis", { agent_name: "My Agent" })          ← custom
  generateFromTemplate("genesis", { ...getPreset("oracle") })          ← preset
  generateFromTemplate("genesis", { ...getPreset("oracle"), agent_name: "My Oracle" })  ← preset + override

7 presets:
  oracle      — 5-min data collection, OHLC, 0.01 FET/query
  brain       — LLM routing (Claude + ASI:One), 0.05 FET/query
  analyst     — token scoring, quality reports, 0.02 FET/score
  coordinator — query classification + routing, 0.02 FET/route
  sentinel    — 2-min monitoring, anomaly detection, 0.05 FET/alert
  launcher    — gap analysis, agent scaffolding, 0.10 FET/report
  scout       — agent discovery, opportunity scoring, 0.05 FET/report
```

### Chain Architecture

```
FETCH.AI COSMOS CHAIN (agent wallets):
  └── Agent-to-agent FET payments (service commerce)
  └── ctx.ledger (cosmpy) + ctx.wallet
  └── Official Payment Protocol (uagents_core.contrib.protocols.payment)
  └── Denomination: "atestfet" (testnet), "afet" (mainnet)
  └── 1 FET = 10^18 atestfet (always use int, never float)

BSC (bonding curves):
  └── Token buying/selling (equity/reputation)
  └── Agent-side web3.py + eth_account (no platform needed)
  └── Each agent has BSC_PRIVATE_KEY secret → own BSC wallet
  └── HoldingsManager: approve FET → buyTokens() on FETAgentCoin
  └── Fund each agent's BSC wallet with small BNB for gas

TWO CHAINS, TWO PURPOSES:
  Fetch.ai = operating revenue (service payments)
  BSC = equity/reputation (token holdings)
```

### Secrets Per Agent

```
Required:
  AGENTVERSE_API_KEY     ← Agentverse auth (all agents)
  AGENTLAUNCH_API_KEY    ← AgentLaunch API (tier checks, self-awareness)

Optional:
  BSC_PRIVATE_KEY        ← Agent's BSC wallet (cross-holdings)
  ANTHROPIC_API_KEY      ← Claude API (Brain only)
  ASI_ONE_API_KEY        ← ASI:One API (Brain only)
```

### Pricing Defaults (configurable via variables)

```
SERVICE                        PRICE        TYPICAL ROLE
──────────────────────────────────────────────────────────
Current market data            0.01 FET     Oracle
Historical OHLC (90 days)      0.10 FET     Oracle
Query classification           0.05 FET     Brain
Basic reasoning                0.05 FET     Brain
Deep reasoning                 0.15 FET     Brain
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
║   THE SWARM TEST                                                         ║
║                                                                          ║
║   1. npx agentlaunch create --template genesis --preset oracle           ║
║      → generates complete agent.py with all commerce layers              ║
║                                                                          ║
║   2. Deploy Oracle + Brain to Agentverse (testnet)                       ║
║      → both running, data collecting, LLM routing                        ║
║                                                                          ║
║   3. Brain queries Oracle for market data                                ║
║      → Oracle charges Brain 0.01 FET via Payment Protocol                ║
║      → FET transfers on Fetch.ai chain                                   ║
║      → Both agents log the transaction                                   ║
║                                                                          ║
║   4. Revenue is queryable via SDK + MCP                                  ║
║      → check_agent_commerce returns revenue, pricing, balance            ║
║      → network_status shows GDP across the swarm                         ║
║                                                                          ║
║   RESULT:                                                                ║
║   ✓ One template powers an entire agent economy                          ║
║   ✓ Users can build any swarm configuration                              ║
║   ✓ Agents pay each other autonomously                                   ║
║   ✓ Commerce is observable via SDK/MCP                                   ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
```

---

## Key Files

| File | Action | Purpose |
|------|--------|---------|
| `packages/templates/src/templates/genesis.ts` | **CREATE** | The centerpiece — genesis template with all commerce layers |
| `packages/templates/src/templates/gifter.ts` | READ | Reference — most complex existing template (~650 lines) |
| `packages/templates/src/presets.ts` | **CREATE** | 7 preset variable bundles |
| `packages/templates/src/registry.ts` | EDIT | Register genesis template |
| `packages/templates/src/index.ts` | EDIT | Export presets |
| `packages/sdk/src/storage.ts` | **CREATE** | Agentverse storage API |
| `packages/sdk/src/commerce.ts` | **CREATE** | Commerce SDK methods |
| `packages/mcp/src/tools/commerce.ts` | **CREATE** | 3 new MCP tools |
| `packages/mcp/src/index.ts` | EDIT | Register new tools |
| `packages/cli/src/commands/scaffold.ts` | EDIT | Add "genesis" type |
| `examples/genesis/` | **CREATE** | 7 example agents + README |
| `.claude/rules/payment-protocol.md` | **CREATE** | Payment Protocol rule |
| `.claude/rules/genesis-network.md` | **CREATE** | Genesis Network rule |
| `.claude/rules/uagent-patterns.md` | EDIT | Update payment patterns |
| `CLAUDE.md` | EDIT | Add commerce + genesis sections |

---

## Execution Commands

```bash
# Wave 1: Commerce + Template (~2 agents)
> "Build the genesis template:
   1. Research official Payment Protocol (COM-01)
   2. Write all 6 commerce classes as inline Python (COM-02→06)
   3. Assemble genesis.ts template with all layers (GEN-01)
   4. Register in registry + wire CLI/MCP (GEN-02)
   5. Create presets system (GEN-03)
   Reference: packages/templates/src/templates/gifter.ts for pattern."

# Wave 2: Extensions + Examples + Rules (~3 agents parallel)
> "Launch 3 agents in parallel:
   Agent C: EXT-01→06 (SDK storage + commerce, MCP tools)
   Agent D: GEN-04 (7 example agents + swarm README)
   Agent E: RUL-01→04 (rules + CLAUDE.md update)"

# Wave 3: Test (~1 agent)
> "Run all tests:
   TST-01→03 (genesis template, SDK, MCP tests)
   TST-04 (full build verification)"
```

---

## References

| Resource | Purpose |
|----------|---------|
| [TODO-organic-growth.md](./TODO-organic-growth.md) | Execution plan: 52 tasks, 5 phases (deploy + grow the swarm) |
| [organic-growth-strategy.md](./organic-growth-strategy.md) | Full strategy document |
| [Payment Protocol docs](https://uagents.fetch.ai/docs/guides/agent-payment-protocol) | Official Payment Protocol guide |
| [fetchai/uAgents](https://github.com/fetchai/uAgents) | Official uAgents framework |
| [cosmpy](https://pypi.org/project/cosmpy/) | Ledger operations |
| `.claude/rules/uagent-patterns.md` | Code patterns + existing payment patterns |
| `packages/templates/src/templates/gifter.ts` | Reference template (most complex, ~650 lines) |

---

*0/24 complete. 6 agents. 3 waves. One template to build any swarm.*
