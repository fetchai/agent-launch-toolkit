---
title: AgentLaunch Toolkit — Genesis Template + Swarm Tools
type: roadmap
version: 3.0.0
total_tasks: 28
completed: 0
status: READY
created: 2026-02-26
updated: 2026-02-26
---

# One Template. Infinite Swarms.

> A user clones this repo, runs one command, and deploys a swarm of agents
> that pay each other for services. That's the goal. Everything below exists
> to make that sentence real.

```
  npx agentlaunch create

  ? What are you building?

      Quick Start         Deploy your first agent in 5 minutes
    ❯ Agent Swarm         Build a team of agents that pay each other
      Genesis Network     The full 7-agent economy

  ? Pick roles for your swarm (space to select)

    ◉ Oracle ($DATA)       Market data, price feeds, OHLC history
    ◉ Brain ($THINK)       LLM reasoning, query classification
    ◯ Analyst ($RANK)      Token scoring, quality evaluation
    ◉ Coordinator ($COORD) Routes queries to the right agent
    ◯ Sentinel ($WATCH)    Real-time alerts, anomaly detection
    ◯ Launcher ($BUILD)    Discovers gaps, scaffolds new agents
    ◯ Scout ($FIND)        Finds agents worth tokenizing

  Deploying your swarm...

    [1/3] Oracle ($DATA)
          ✓ Scaffolded from genesis template
          ✓ Deployed to Agentverse
          ✓ Running — collecting data every 5 min

    [2/3] Brain ($THINK)
          ✓ Scaffolded from genesis template
          ✓ Deployed to Agentverse
          ✓ Running — LLM routing active

    [3/3] Coordinator ($COORD)
          ✓ Scaffolded from genesis template
          ✓ Deployed to Agentverse
          ✓ Running — routing queries

  Your swarm is live.

  Next steps:
    1. Fund wallets     npx agentlaunch fund
    2. Create tokens    npx agentlaunch tokenize
    3. Monitor          npx agentlaunch status --swarm
```

That's what we're building toward. Here's how we get there.

---

## Status: 0/28

```
  P0  Commerce Engine        ░░░░░░░░░░░░░░░░░░░░  0/6
  P1  Genesis Template       ░░░░░░░░░░░░░░░░░░░░  0/5
  P2  Developer Experience   ░░░░░░░░░░░░░░░░░░░░  0/8
  P3  Documentation          ░░░░░░░░░░░░░░░░░░░░  0/5
  P4  Verification           ░░░░░░░░░░░░░░░░░░░░  0/4
```

---

## The User Journey

Everything maps to a moment in the user's experience:

```
  DISCOVER          CHOOSE           BUILD            GROW
  ────────          ──────           ─────            ────
  README catches    CLI wizard or    Agents deploy,   Swarm earns FET,
  their eye         /build-swarm     start paying     buys tokens,
                    guides them      each other       self-sustains
       │                │                │                │
       ▼                ▼                ▼                ▼
  P3: README        P2: CLI swarm    P0: Commerce     Organic Growth
  P3: CLAUDE.md     P2: /build-swarm P1: Template     TODO (52 tasks)
                    P2: MCP tools    P1: Presets
```

---

## P0: Commerce Engine

The classes that make agents pay each other. These live as inline Python
inside the genesis template — not separate files. When a user scaffolds
an agent, they get all of this for free.

Uses the official Payment Protocol from `uagents_core.contrib.protocols.payment`.

| | ID | Task | Details | Depends |
|:---:|:---|:---|:---|:---|
| `[ ]` | COM-01 | Verify official Payment Protocol | Confirm `RequestPayment`, `CommitPayment`, `CompletePayment`, `RejectPayment`, `CancelPayment`, `Funds`, `payment_protocol_spec` work on Agentverse. Document role-based creation (`role="seller"` / `role="buyer"`). | — |
| `[ ]` | COM-02 | PaymentService | Seller-side payment handling via `payment_protocol_spec`. `charge(ctx, sender, amount_afet, service)` → sends `RequestPayment`. `on_commit()` → verifies and delivers. `get_balance()` via `ctx.ledger`. Transaction log in `ctx.storage`. | COM-01 |
| `[ ]` | COM-03 | PricingTable + TierManager | `PricingTable`: per-service pricing from `ctx.storage`. `TierManager`: checks token holdings via AgentLaunch API, caches in memory. Returns `"free"` or `"premium"`. | COM-01 |
| `[ ]` | COM-04 | WalletManager + RevenueTracker | `WalletManager`: balance queries, fund alerts. `RevenueTracker`: income/expense log, daily summaries, `get_summary()`. | COM-02 |
| `[ ]` | COM-05 | SelfAwareMixin | Reads own token price + holders from AgentLaunch API. 30-day history. 7-day moving averages. Sets `effort_mode` (normal/boost/conserve) — other layers adapt. | COM-04 |
| `[ ]` | COM-06 | HoldingsManager | `buy_via_web3()` using `web3` + `eth_account` with `BSC_PRIVATE_KEY` secret. Approve FET → `buyTokens()` on bonding curve. Also `sell_via_web3()`, `get_holdings_summary()`. Fallback: `generate_buy_link()` → handoff URL. | COM-04 |

---

## P1: Genesis Template

One template. Every agent scaffolded from it gets the full commerce stack.
The business logic section is what makes each agent unique.

| | ID | Task | Details | Depends |
|:---:|:---|:---|:---|:---|
| `[ ]` | GEN-01 | Assemble genesis template | `packages/templates/src/templates/genesis.ts`. Layers: Logger → Security → Health → Cache → Revenue/Tier → Commerce/Pricing → SelfAware → CrossHoldings → **SwarmBusiness** (marked with `# ═══ YOUR SWARM LOGIC ═══`). The SwarmBusiness section should include clear guidance comments showing where to add handlers, intervals, and service logic. Template reads like a story — each layer introduces itself with a one-line purpose comment. | COM-01→06 |
| `[ ]` | GEN-02 | Register + wire everywhere | Add to `registry.ts`. Wire into CLI `scaffold.ts` (VALID_TYPES, LEGACY_TYPE_MAP). Wire into MCP `scaffold.ts` (TYPE_TO_TEMPLATE). Update `create_and_tokenize` tool enum. Genesis should appear **first** in template lists — it's the recommended choice. | GEN-01 |
| `[ ]` | GEN-03 | Presets system | `packages/templates/src/presets.ts`. 7 presets as variable bundles: oracle, brain, analyst, coordinator, sentinel, launcher, scout. Each includes: name, symbol, description, pricing, intervals, dependencies, secrets. `getPreset(name)`, `listPresets()`. Export from `index.ts`. Presets are the bridge between "blank template" and "ready to deploy". | GEN-01 |
| `[ ]` | GEN-04 | 7 example agents | `examples/genesis/` — oracle.py, brain.py, analyst.py, coordinator.py, sentinel.py, launcher.py, scout.py. Each is a complete runnable agent (not a template) with the SwarmBusiness section filled in. Each has a header comment: what it does, what it charges, what services it consumes, what secrets it needs. | GEN-01 |
| `[ ]` | GEN-05 | Swarm guide | `examples/genesis/README.md` — the guide that turns examples into understanding. Covers: what a swarm is, how agents discover each other (Chat Protocol addresses), how commerce flows (Payment Protocol sequence), recommended starter configs (Oracle+Brain+Coordinator), how to add custom agents to an existing swarm, funding wallets, monitoring health. Written for someone who has never seen Fetch.ai before. | GEN-04 |

---

## P2: Developer Experience

The tools that make swarm creation feel effortless. The CLI wizard, the
MCP tools, the slash command — every entry point leads to the same outcome.

| | ID | Task | Details | Depends |
|:---:|:---|:---|:---|:---|
| `[ ]` | EXT-01 | Agentverse storage SDK | `packages/sdk/src/storage.ts`: `getStorage()`, `putStorage()`, `deleteStorage()` via Agentverse API. Add `storage` namespace to fluent API. This unlocks reading agent revenue, pricing, and health from outside the agent. | — |
| `[ ]` | EXT-02 | Commerce SDK methods | `packages/sdk/src/commerce.ts`: `getAgentRevenue()`, `getPricingTable()`, `getNetworkGDP()`. All read from agent storage via EXT-01. Add `commerce` namespace to fluent API. | EXT-01 |
| `[ ]` | EXT-03 | `scaffold_genesis` MCP tool | Accepts `name`, `preset` (one of 7 or "custom"), `outputDir`. Merges preset variables before calling `generateFromTemplate("genesis", vars)`. This is what `/build-swarm` uses under the hood. | GEN-02, GEN-03 |
| `[ ]` | EXT-04 | `check_agent_commerce` MCP tool | `packages/mcp/src/tools/commerce.ts`. Input: agent address. Output: revenue summary, pricing table, FET balance, effort_mode, holdings. The "how is my agent doing?" tool. | EXT-02 |
| `[ ]` | EXT-05 | `network_status` MCP tool | Same file. Input: list of agent addresses. Output: per-agent revenue, total GDP, health, cross-holdings. The "how is my swarm doing?" tool. | EXT-02 |
| `[ ]` | EXT-06 | `deploy_swarm` MCP tool | Same file. Meta-tool: accepts list of presets, deploys each in sequence (Oracle first), sets secrets, starts agents, returns addresses + status. This is the engine behind the CLI swarm wizard and `/build-swarm`. | EXT-03, GEN-05 |
| `[ ]` | EXT-07 | CLI swarm mode | Enhance `packages/cli/src/commands/create.ts`. Add "Agent Swarm" and "Genesis Network" to the initial "What are you building?" prompt. Swarm mode: multi-select presets → name each → deploy in sequence → show combined status. Genesis mode: deploys all 7 with smart defaults. Both use the SDK `deployAgent()` function. Clean progress output with per-agent status. | EXT-06, GEN-02 |
| `[ ]` | EXT-08 | `/build-swarm` skill | `.claude/skills/build-swarm/SKILL.md`. The Claude Code guided experience. Steps: understand what the user wants to build → suggest presets → scaffold each agent → let user review/customize business logic → deploy → show swarm status. Should feel like a conversation, not a form. Reference `deploy_swarm` and `scaffold_genesis` MCP tools. | EXT-06 |

---

## P3: Documentation

The words that make people want to try this. README is the storefront.
CLAUDE.md is the instruction manual. Rules are the reference.

| | ID | Task | Details | Depends |
|:---:|:---|:---|:---|:---|
| `[ ]` | DOC-01 | Rewrite README.md | Lead with swarms, not individual agents. Opening: "Build agent swarms that pay each other." Show the CLI swarm wizard output (as in the top of this TODO). Progressive disclosure: Quick Start (one agent, 5 min) → Agent Swarm (team, 15 min) → Genesis Network (full economy). Keep SDK/CLI/MCP sections but reframe around swarm capabilities. Templates table: genesis (recommended) at top, existing 6 below. | EXT-07 |
| `[ ]` | DOC-02 | `payment-protocol.md` rule | `.claude/rules/payment-protocol.md`: Official imports, role-based creation, payment flow, denomination table, error handling. Clear, minimal, reference-quality. | COM-01 |
| `[ ]` | DOC-03 | `genesis-network.md` rule | `.claude/rules/genesis-network.md`: The 7 roles. Pricing table. Cross-holdings. How to customize SwarmBusiness. How to add new roles to a swarm. When to use which preset. | GEN-05 |
| `[ ]` | DOC-04 | Update `uagent-patterns.md` | Replace custom payment models with official imports. Add commerce layer reference. Add genesis template as the recommended starting point. Keep existing Chat Protocol + storage patterns clean. | DOC-02 |
| `[ ]` | DOC-05 | Update CLAUDE.md + claude-context.ts | Add genesis template (recommended) to Templates table. Add "Agent Swarms" section explaining the commerce layer. Add `/build-swarm` to Slash Commands table. Add `scaffold_genesis`, `check_agent_commerce`, `network_status`, `deploy_swarm` to MCP Tools tables. Update `claude-context.ts`: add new rules, update `buildClaudeMd()` to mention genesis + commerce. | DOC-01→04 |

---

## P4: Verification

Does it actually work? Every test maps to a user moment.

| | ID | Task | Details | Depends |
|:---:|:---|:---|:---|:---|
| `[ ]` | TST-01 | Genesis template tests | `generateFromTemplate("genesis", ...)` → valid Python with all commerce classes. Each of 7 presets generates valid code. Variables substitute correctly. SwarmBusiness markers present. `strict` mode throws on missing required vars. | GEN-02 |
| `[ ]` | TST-02 | SDK tests | Mock Agentverse storage API. Test `getStorage`, `putStorage`, `getAgentRevenue`, `getPricingTable`, `getNetworkGDP`. Verify fluent API namespaces (`al.storage.*`, `al.commerce.*`). | EXT-01, EXT-02 |
| `[ ]` | TST-03 | MCP tool tests | Test `scaffold_genesis`, `check_agent_commerce`, `network_status`, `deploy_swarm`. Mock SDK calls. Verify all tools registered in TOOLS array. | EXT-03→06 |
| `[ ]` | TST-04 | Full build | `npm run clean && npm run build && npm test` — all green. No TypeScript errors. All existing tests still pass. All new tests pass. Packages export correctly. | TST-01→03 |

---

## Waves

```
  Wave 1                    Wave 2                    Wave 3
  Commerce + Template       Experience + Docs         Verify
  ─────────────────────     ─────────────────────     ──────────
  COM-01→06  (engine)       EXT-01→08  (tools)        TST-01→04
  GEN-01→05  (template)     DOC-01→05  (words)

  ~2 agents                 ~3 agents parallel        ~1 agent
```

Wave 2 is the most parallelizable: SDK/MCP (Agent C), examples + CLI (Agent D),
and docs (Agent E) have minimal overlap.

---

## Key Files

```
  CREATE                                    EDIT
  ──────                                    ────
  packages/templates/src/templates/genesis.ts   packages/templates/src/registry.ts
  packages/templates/src/presets.ts             packages/templates/src/index.ts
  packages/sdk/src/storage.ts                   packages/sdk/src/agentlaunch.ts
  packages/sdk/src/commerce.ts                  packages/sdk/src/index.ts
  packages/mcp/src/tools/commerce.ts            packages/mcp/src/index.ts
  examples/genesis/*.py (7 agents)              packages/cli/src/commands/create.ts
  examples/genesis/README.md                    packages/cli/src/commands/scaffold.ts
  .claude/skills/build-swarm/SKILL.md           .claude/rules/uagent-patterns.md
  .claude/rules/payment-protocol.md             CLAUDE.md
  .claude/rules/genesis-network.md              README.md

  READ (reference)
  ────
  packages/templates/src/templates/gifter.ts    (most complex existing template)
  packages/templates/src/generator.ts           (substitution engine)
  packages/cli/src/commands/create.ts           (current wizard flow)
  .claude/skills/build-agent/SKILL.md           (current skill pattern)
```

---

## Design Principles

**Progressive disclosure.** Don't explain bonding curves on page one.
Let them deploy an agent first. The complexity reveals itself naturally
as they add agents and watch them transact.

**One path, three speeds.** Quick Start (one agent, 5 min), Agent Swarm
(pick roles, 15 min), Genesis Network (full economy, 30 min). Same template,
same tools, different ambition.

**Presets are opinions, not constraints.** A preset fills in smart defaults.
Users can override anything. The oracle preset gives you a data collector,
but you can change the interval, the pricing, the data source. The template
is the floor, not the ceiling.

**Commerce is invisible until it isn't.** The genesis template includes all
commerce layers, but they don't get in the way. A user who just wants a
chatbot gets a chatbot. A user who wants an economy gets an economy.
The layers activate when you configure them.

**Show, don't tell.** The 7 example agents in `examples/genesis/` are worth
more than any documentation. Each one is a complete, runnable agent. Copy one,
change the business logic, deploy. That's the fastest path to understanding.

---

## After This TODO

The [Organic Growth TODO](./TODO-organic-growth.md) (52 tasks) picks up where
this one stops. It deploys the Genesis Network, seeds wallets, kicks off
commerce, and grows the swarm from 7 agents to 25+ over 6 months. This TODO
builds the tools. That one uses them.

---

*0/28. Three waves. One template. The swarm starts here.*
