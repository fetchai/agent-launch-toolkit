---
title: AgentLaunch Toolkit — Swarm-Starter Template + Swarm Tools
type: roadmap
version: 3.0.0
total_tasks: 28
completed: 28
status: DONE
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
          ✓ Scaffolded from swarm-starter template
          ✓ Deployed to Agentverse
          ✓ Running — collecting data every 5 min

    [2/3] Brain ($THINK)
          ✓ Scaffolded from swarm-starter template
          ✓ Deployed to Agentverse
          ✓ Running — LLM routing active

    [3/3] Coordinator ($COORD)
          ✓ Scaffolded from swarm-starter template
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

## Status: 28/28 ✓

```
  P0  Commerce Engine        ████████████████████  6/6  ✓
  P1  Swarm-Starter Template ████████████████████  5/5  ✓
  P2  Developer Experience   ████████████████████  8/8  ✓
  P3  Documentation          ████████████████████  5/5  ✓
  P4  Verification           ████████████████████  4/4  ✓
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
inside the swarm-starter template — not separate files. When a user scaffolds
an agent, they get all of this for free.

Uses the official Payment Protocol from `uagents_core.contrib.protocols.payment`.

| | ID | Task | Details | Depends |
|:---:|:---|:---|:---|:---|
| `[x]` | COM-01 | Verify official Payment Protocol | Confirmed in `.claude/rules/payment-protocol.md`. | — |
| `[x]` | COM-02 | PaymentService | Implemented in genesis template. | COM-01 |
| `[x]` | COM-03 | PricingTable + TierManager | Implemented in genesis template. | COM-01 |
| `[x]` | COM-04 | WalletManager + RevenueTracker | Implemented in genesis template. | COM-02 |
| `[x]` | COM-05 | SelfAwareMixin | Implemented in genesis template. | COM-04 |
| `[x]` | COM-06 | HoldingsManager | Implemented in genesis template. | COM-04 |

---

## P1: Swarm-Starter Template

One template. Every agent scaffolded from it gets the full commerce stack.
The business logic section is what makes each agent unique.

| | ID | Task | Details | Depends |
|:---:|:---|:---|:---|:---|
| `[x]` | GEN-01 | Assemble genesis template | `packages/templates/src/templates/genesis.ts` — full commerce stack with all layers. | COM-01→06 |
| `[x]` | GEN-02 | Register + wire everywhere | Registered in `registry.ts`, CLI, MCP. Genesis is first in lists. | GEN-01 |
| `[x]` | GEN-03 | Presets system | `packages/templates/src/presets.ts` — 7 presets with `getPreset()`, `listPresets()`. | GEN-01 |
| `[x]` | GEN-04 | 7 example agents | `examples/genesis/*.py` — all 7 agents with full commerce stack. | GEN-01 |
| `[x]` | GEN-05 | Swarm guide | `examples/genesis/README.md` — complete swarm deployment guide. | GEN-04 |

---

## P2: Developer Experience

The tools that make swarm creation feel effortless. The CLI wizard, the
MCP tools, the slash command — every entry point leads to the same outcome.

| | ID | Task | Details | Depends |
|:---:|:---|:---|:---|:---|
| `[x]` | EXT-01 | Agentverse storage SDK | `packages/sdk/src/storage.ts` — `listStorage()`, `getStorage()`, `putStorage()`, `deleteStorage()`. | — |
| `[x]` | EXT-02 | Commerce SDK methods | `packages/sdk/src/commerce.ts` — `getAgentRevenue()`, `getPricingTable()`, `getNetworkGDP()`, fluent API. | EXT-01 |
| `[x]` | EXT-03 | `scaffold_genesis` MCP tool | Registered. Uses presets for variable bundles. | GEN-02, GEN-03 |
| `[x]` | EXT-04 | `check_agent_commerce` MCP tool | `packages/mcp/src/tools/commerce.ts` — reads revenue, pricing, balance. | EXT-02 |
| `[x]` | EXT-05 | `network_status` MCP tool | Returns GDP, per-agent stats, health. | EXT-02 |
| `[x]` | EXT-06 | `deploy_swarm` MCP tool | Deploys presets in sequence, sets secrets, starts agents. | EXT-03, GEN-05 |
| `[x]` | EXT-07 | CLI swarm mode | "What are you building?" prompt with Quick/Swarm/Genesis options. | EXT-06, GEN-02 |
| `[x]` | EXT-08 | `/build-swarm` skill | `.claude/skills/build-swarm/SKILL.md` — guided swarm creation. | EXT-06 |

---

## P3: Documentation

The words that make people want to try this. README is the storefront.
CLAUDE.md is the instruction manual. Rules are the reference.

| | ID | Task | Details | Depends |
|:---:|:---|:---|:---|:---|
| `[x]` | DOC-01 | Rewrite README.md | Progressive: one agent (5 min) → swarm (15 min) → Genesis (30 min). | EXT-07 |
| `[x]` | DOC-02 | `payment-protocol.md` rule | `.claude/rules/payment-protocol.md` — official imports, flow, denomination. | COM-01 |
| `[x]` | DOC-03 | `genesis-network.md` rule | `.claude/rules/genesis-network.md` — 7 roles, pricing, cross-holdings. | GEN-05 |
| `[x]` | DOC-04 | Update `uagent-patterns.md` | Official payment protocol, commerce layer reference, genesis recommended. | DOC-02 |
| `[x]` | DOC-05 | Update CLAUDE.md | Templates table has genesis. MCP Tools table has commerce tools. `/build-swarm` in Slash Commands. | DOC-01→04 |

---

## P4: Verification

Does it actually work? Every test maps to a user moment.

| | ID | Task | Details | Depends |
|:---:|:---|:---|:---|:---|
| `[x]` | TST-01 | Swarm-starter template tests | Genesis template generates valid Python. 7 presets work. | GEN-02 |
| `[x]` | TST-02 | SDK tests | 96/96 tests passing. Storage + commerce + fluent API verified. | EXT-01, EXT-02 |
| `[x]` | TST-03 | MCP tool tests | 16/16 commerce tests passing. All tools registered. | EXT-03→06 |
| `[x]` | TST-04 | Full build | `npm run build && npm test` — all green. 96 SDK + 16 MCP tests pass. | TST-01→03 |

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

**Commerce is invisible until it isn't.** The swarm-starter template includes all
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

*28/28. Complete. One template. Infinite swarms.*
