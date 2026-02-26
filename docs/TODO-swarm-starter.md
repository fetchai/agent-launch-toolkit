---
title: Rename genesis -> swarm-starter (frontend + docs)
type: refactor
version: 1.0.0
total_tasks: 14
completed: 12
status: READY
created: 2026-02-26
updated: 2026-02-26
depends_on: []
---

# Rename: genesis -> swarm-starter

> **Scope: user-facing names + docs only.** Internal files stay as-is.
>
> - CLI/MCP display text: "genesis" -> "swarm-starter"
> - MCP tool name: `scaffold_genesis` -> `scaffold_swarm`
> - Template registry: `"swarm-starter"` primary, `"genesis"` legacy alias
> - All docs, rules, skills, CLAUDE.md, README
> - Internal filenames unchanged: `genesis.ts`, test files, etc.
> - "Genesis Network" stays as the concept name for the 7-agent economy
> - Presets unchanged (oracle, brain, analyst, etc.)

---

## Status: 12/14

```
  L1  User-Facing Code   ████████████████████  5/5 DONE
  L2  Docs & Rules        ████████████████████  7/7 DONE
  L3  Verify              ░░░░░░░░░░░░░░░░░░░░  0/2
```

---

## Lanes

```
  L1 User-Facing Code ──┐
                         ├──> L3 Verify
  L2 Docs & Rules ──────┘
```

L1 and L2 are fully independent. L3 runs after both complete.

---

## L1: User-Facing Code

Changes to what users see in CLI prompts, MCP tool names, and template selection.

| Status | ID | Task | How | Depends |
|:---:|:---|:---|:---|:---|
| `[x]` | F-01 | Template registry alias | `packages/templates/src/registry.ts`: register `"swarm-starter"` as primary key pointing to the genesis template. Keep `"genesis"` as alias. No file renames. | — |
| `[x]` | F-02 | CLI scaffold display | `packages/cli/src/commands/scaffold.ts`: add `"swarm-starter"` to `VALID_TYPES`. Add `"genesis"` to `LEGACY_TYPE_MAP` -> `"swarm-starter"`. Update help text and description strings. | F-01 |
| `[x]` | F-03 | CLI create wizard | `packages/cli/src/commands/create.ts`: update template choice labels and descriptions. `"swarm-starter"` shown as the recommended option. "Genesis Network" stays as the display name for the full 7-agent wizard option. | F-01 |
| `[x]` | F-04 | MCP tool rename | `packages/mcp/src/tools/scaffold.ts`: rename tool from `scaffold_genesis` to `scaffold_swarm`. Update description. `packages/mcp/src/index.ts`: update tool registration name. `packages/mcp/src/tools/tokenize.ts`: add `"swarm-starter"` to `create_and_tokenize` template enum. | — |
| `[x]` | F-05 | MCP test updates | `packages/mcp/src/__tests__/commerce.test.ts`: `findTool('scaffold_genesis')` -> `findTool('scaffold_swarm')`. `packages/mcp/src/__tests__/mcp-integration.test.ts`: same. | F-04 |

**Files touched:**
```
packages/templates/src/registry.ts        (add alias)
packages/cli/src/commands/scaffold.ts     (display strings)
packages/cli/src/commands/create.ts       (display strings)
packages/mcp/src/tools/scaffold.ts        (tool name + description)
packages/mcp/src/tools/tokenize.ts        (enum value)
packages/mcp/src/index.ts                 (tool registration)
packages/mcp/src/__tests__/commerce.test.ts
packages/mcp/src/__tests__/mcp-integration.test.ts
```

**Files NOT touched (internals stay as-is):**
```
packages/templates/src/templates/genesis.ts      (keep filename)
packages/templates/src/generator.ts              (keep internal refs)
packages/templates/src/presets.ts                 (keep internal refs)
packages/templates/src/__tests__/genesis.test.ts  (keep filename)
packages/templates/src/__tests__/genesis-integration.test.ts
packages/mcp/src/tools/commerce.ts               (internal generateFromTemplate calls stay)
packages/sdk/src/commerce.ts                      (internal)
packages/sdk/src/storage.ts                       (internal)
examples/genesis/                                 (keep dir name)
```

---

## L2: Docs & Rules

All user-facing documentation. "genesis template" -> "swarm-starter template". "Genesis Network" stays as concept name.

| Status | ID | Task | How | Depends |
|:---:|:---|:---|:---|:---|
| `[x]` | D-01 | CLAUDE.md | Templates table: `genesis` -> `swarm-starter (recommended)`. MCP tools table: `scaffold_genesis` -> `scaffold_swarm`. Scaffold example in Quick Commands. | — |
| `[x]` | D-02 | README.md | Template table: `swarm-starter` first, recommended. Scaffold examples. Keep "Genesis Network" where it refers to the concept. | — |
| `[x]` | D-03 | TUTORIAL.md | Update any template selection references from `genesis` to `swarm-starter`. | — |
| `[x]` | D-04 | Rules files | `.claude/rules/genesis-network.md`: update "genesis template" -> "swarm-starter template" in body text. Keep filename. `.claude/rules/uagent-patterns.md`: update scaffold example. `.claude/rules/payment-protocol.md`: "Genesis template" -> "swarm-starter template". | — |
| `[x]` | D-05 | Skills | `.claude/skills/build-swarm/SKILL.md`: `scaffold_genesis` -> `scaffold_swarm`. "genesis template" -> "swarm-starter template". | — |
| `[x]` | D-06 | Demo docs | `docs/demo-commerce.md`: "Genesis Template" -> "Swarm Starter Template" in headings and body. `--type genesis` -> `--type swarm-starter`. `generateFromTemplate('genesis', ...)` examples -> `'swarm-starter'`. | — |
| `[x]` | D-07 | TODO docs | `docs/TODO-toolkit.md`: "Genesis Template" section heading and references. Keep "Genesis Network" as concept. `docs/TODO-template.md`: if references exist. | — |

**Files touched:**
```
CLAUDE.md
README.md
TUTORIAL.md
.claude/rules/genesis-network.md      (body text only, keep filename)
.claude/rules/uagent-patterns.md
.claude/rules/payment-protocol.md
.claude/skills/build-swarm/SKILL.md
docs/demo-commerce.md
docs/TODO-toolkit.md
```

**Files NOT touched:**
```
docs/organic-growth-strategy.md       ("Genesis Network" is the swarm name)
docs/organic-growth-strategy 1.md
docs/TODO-organic-growth.md           ("Genesis Network" is the swarm name)
```

---

## L3: Verify

| Status | ID | Task | How | Depends |
|:---:|:---|:---|:---|:---|
| `[~]` | V-01 | Build + test | `npm run build && npm test`. All tests pass. | L1, L2 |
| `[ ]` | V-02 | Spot check | `npx agentlaunch scaffold --help` shows `swarm-starter`. `npx agentlaunch scaffold Test --type genesis` still works (legacy alias). Grep for stale "genesis template" in docs (should be zero outside organic-growth files). | V-01 |

---

## What Changes vs What Stays

| Changes | Stays |
|---------|-------|
| `--type genesis` -> `--type swarm-starter` | `genesis.ts` filename |
| `scaffold_genesis` -> `scaffold_swarm` | `genesis.test.ts` filename |
| Template table shows "swarm-starter" | `examples/genesis/` directory |
| Docs say "swarm-starter template" | `generateFromTemplate("genesis", ...)` in internal code |
| CLAUDE.md, README, rules updated | "Genesis Network" concept name |
| | Preset names (oracle, brain, etc.) |
| | `genesis` works as legacy alias |

---

*0/14. Two parallel lanes. One verify gate.*
