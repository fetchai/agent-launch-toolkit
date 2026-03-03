---
title: Documentation & Endpoint Verification
type: verification
version: 2.0.0
priority: Critical Bugs → Endpoints → Docs → Links
total_tasks: 81
completed: 52
status: IN_PROGRESS
repos:
  - agent-launch-toolkit (this repo)
  - fetchlaunchpad (../fetchlaunchpad)
---

# Documentation & Endpoint Verification TODO

> **Goal:** Verify all API endpoints match between SDK and backend, and all documentation links are correct across both repositories.

---

## Now

- [x] Fix critical SDK path bugs (E-1, E-2, E-3)
- [x] Verify all endpoints and docs in parallel (Phase 1-3)
- [ ] Publish docs to website (Phase 4) — requires test gate
- [!] 2 blockers: WEB-02 (wrong paths in fetchlaunchpad mcp-tools.md), SYNC-01 (version mismatch)

---

## Phase 0: Critical SDK Path Bugs (BLOCKING)

**These are broken right now and must be fixed first.**

| Status | ID | Task | File | Issue | Fix |
|:---:|:---|:---|:---|:---|:---|
| `[x]` | E-1 | Fix `/auth` path | `packages/sdk/src/agents.ts:68` | Uses `/auth` | Changed to `/agents/auth` |
| `[x]` | E-2 | Fix `/my-agents` path | `packages/sdk/src/agents.ts:92` | Uses `/my-agents` | Changed to `/agents/my-agents` |
| `[x]` | E-3 | Fix `/import-agentverse` path | `packages/sdk/src/agents.ts:130` | Uses `/import-agentverse` | Changed to `/agents/import-agentverse` |

### Phase 0 Gate

```
[x] All 3 SDK path bugs fixed
[x] npm run build passes
[x] npm run test passes
```

---

## Phase 1: Endpoint Verification (Toolkit vs Backend)

**Verify SDK paths match backend controller paths exactly.**

### Tokens Controller (`@Controller('tokens')`)

| Status | ID | SDK Path | Backend Path | Match? |
|:---:|:---|:---|:---|:---:|
| `[x]` | EP-01 | `GET /tokens` | `GET /tokens` | YES |
| `[x]` | EP-02 | `GET /tokens/address/:address` | `GET /tokens/address/:address` | YES |
| `[x]` | EP-03 | `GET /tokens/id/:id` | `GET /tokens/id/:id` | YES |
| `[x]` | EP-04 | `GET /tokens/calculate-buy` | `GET /tokens/calculate-buy` | YES |
| `[x]` | EP-05 | `GET /tokens/calculate-sell` | `GET /tokens/calculate-sell` | YES |
| `[x]` | EP-06 | `GET /tokens/categories` | `GET /tokens/categories` | YES (backend only) |
| `[x]` | EP-07 | `GET /tokens/my` | `GET /tokens/my` | YES (backend only) |
| `[x]` | EP-08 | `POST /tokens` | `POST /tokens` | YES (backend only) |
| `[x]` | EP-09 | `PATCH /tokens/:id` | `PATCH /tokens/:id` | YES (backend only) |
| `[x]` | EP-10 | `POST /tokens/check-agents` | `POST /tokens/check-agents` | YES (backend only) |

### Agents Controller (`@Controller('agents')`)

| Status | ID | SDK Path | Backend Path | Match? |
|:---:|:---|:---|:---|:---:|
| `[x]` | EP-11 | `POST /agents/auth` | `POST /agents/auth` | YES (fixed E-1) |
| `[x]` | EP-12 | `GET /agents/my-agents` | `GET /agents/my-agents` | YES (fixed E-2) |
| `[x]` | EP-13 | `POST /agents/import-agentverse` | `POST /agents/import-agentverse` | YES (fixed E-3) |
| `[x]` | EP-14 | `POST /agents/tokenize` | `POST /agents/tokenize` | YES |
| `[x]` | EP-15 | `GET /agents/portfolio` | `GET /agents/portfolio` | YES (backend only) |
| `[x]` | EP-16 | `POST /agents/batch-tokenize` | `POST /agents/batch-tokenize` | YES (backend only) |
| `[x]` | EP-17 | `GET /agents/token/:address/holders` | `GET /agents/token/:address/holders` | YES |
| `[x]` | EP-18 | `POST /agents/webhooks` | `POST /agents/webhooks` | YES (backend only) |
| `[x]` | EP-19 | `GET /agents/webhooks` | `GET /agents/webhooks` | YES (backend only) |
| `[x]` | EP-20 | `PUT /agents/webhooks/:id` | `PUT /agents/webhooks/:id` | YES (backend only) |
| `[x]` | EP-21 | `DELETE /agents/webhooks/:id` | `DELETE /agents/webhooks/:id` | YES (backend only) |
| `[x]` | EP-22 | `POST /agents/create-on-agentverse` | `POST /agents/create-on-agentverse` | YES (backend only) |

### Comments Controller (`@Controller('comments')`)

| Status | ID | SDK Path | Backend Path | Match? |
|:---:|:---|:---|:---|:---:|
| `[x]` | EP-23 | `GET /comments/:address` | `GET /comments/:address` | YES |
| `[x]` | EP-24 | `POST /comments/:address` | `POST /comments/:address` | YES |

### Platform Controller (`@Controller('platform')`)

| Status | ID | SDK Path | Backend Path | Match? |
|:---:|:---|:---|:---|:---:|
| `[x]` | EP-25 | `GET /platform/stats` | `GET /platform/stats` | YES |

### Other Controllers

| Status | ID | SDK Path | Backend Path | Match? |
|:---:|:---|:---|:---|:---:|
| `[x]` | EP-26 | `GET /` (root) | `GET /` | YES (backend only) |
| `[x]` | EP-27 | `GET /deployer-address` | `GET /deployer-address` | YES (backend only) |
| `[x]` | EP-28 | `GET /fet-price` | `GET /fet-price` | YES (backend only) |
| `[x]` | EP-29 | `GET /health` | `GET /health` | YES (backend only) |
| `[x]` | EP-30 | `GET /settings/prices` | `GET /settings/prices` | YES (backend only) |

### Phase 1 Gate

```
[x] All SDK paths verified against backend controllers
[x] No 404 errors on documented endpoints (all paths match)
[x] SDK tests pass with correct paths
```

---

## Phase 2: Documentation Link Verification

### Toolkit Documentation (`docs/`)

| Status | ID | File | Check |
|:---:|:---|:---|:---|
| `[x]` | DOC-01 | `docs/paths.md` | All example URLs correct |
| `[x]` | DOC-02 | `docs/sdk-reference.md` | Fixed `/api/tokenize` → `/agents/tokenize` |
| `[x]` | DOC-03 | `docs/cli-reference.md` | All URLs and examples correct |
| `[x]` | DOC-04 | `docs/mcp-tools.md` | Fixed 3 wrong endpoint paths |
| `[x]` | DOC-05 | `docs/getting-started.md` | Fixed `/api/tokenize` → `/agents/tokenize` |
| `[x]` | DOC-06 | `docs/AGENTS.md` | Fixed `/tokenize`, `/my-agents`, `/auth` paths |
| `[x]` | DOC-07 | `CLAUDE.md` | All URLs and endpoints correct |
| `[x]` | DOC-08 | `README.md` | All URLs correct |

### Toolkit Rules (`.claude/rules/`)

| Status | ID | File | Check |
|:---:|:---|:---|:---|
| `[x]` | RULE-01 | `api-paths.md` | Matches actual backend paths |
| `[x]` | RULE-02 | `agentlaunch.md` | All endpoints correct |
| `[x]` | RULE-03 | `agentverse.md` | Agentverse API URLs correct |

### Website Documentation (`../fetchlaunchpad/docs/`)

| Status | ID | File | Check |
|:---:|:---|:---|:---|
| `[x]` | WEB-01 | `CLAUDE.md` | All URLs match production |
| `[!]` | WEB-02 | `docs/toolkit/mcp-tools.md` | 2 wrong paths: line 143 `/agents/token/:address` → `/tokens/address/:address`, line 278 `/agents/launch` → `/agents/tokenize` |
| `[x]` | WEB-03 | `docs/AGENTS.md` | All URLs correct |
| `[x]` | WEB-04 | `frontend/public/skill.md` | All URLs correct |

### Phase 2 Gate

```
[x] All documentation links verified
[!] WEB-02: fetchlaunchpad/docs/toolkit/mcp-tools.md has 2 wrong paths (needs fix in other repo)
[x] Endpoint examples in docs match actual API (toolkit repo fixed)
```

---

## Phase 3: Cross-Repo Consistency

| Status | ID | Task | Check |
|:---:|:---|:---|:---|
| `[!]` | SYNC-01 | Package names | Names match. Versions differ: SDK 0.2.5 vs 0.1.4, CLI 1.1.0 vs 2.0.0, MCP 2.1.6 vs 2.0.0 |
| `[x]` | SYNC-02 | API base URL | `https://agent-launch.ai/api` consistent |
| `[x]` | SYNC-03 | Dev URLs | Dev environment URLs consistent |
| `[x]` | SYNC-04 | Env var names | `AGENTLAUNCH_API_KEY` → `AGENT_LAUNCH_API_KEY` → `AGENTVERSE_API_KEY` consistent |
| `[x]` | SYNC-05 | Auth header | `X-API-Key` header name consistent |
| `[x]` | SYNC-06 | OpenAPI spec | Spec exists and endpoints are correct |

### Phase 3 Gate

```
[x] Both repos use identical endpoint paths
[x] Environment variables match
[x] Auth mechanisms match
[!] Package versions differ between repos (needs sync)
```

---

## Dependency Graph

```
Phase 0 (Critical Bugs)
 │
 ├──► E-1  (Fix /auth path)
 ├──► E-2  (Fix /my-agents path)
 └──► E-3  (Fix /import-agentverse path)
      │
      ▼
Phase 1 (Endpoint Verification) ──► Phase 2 (Docs) ──► Phase 3 (Cross-Repo)
 │                                    │                  │
 ├──► EP-01 to EP-30                  ├──► DOC-01 to 08  ├──► SYNC-01 to 06
 │    (all parallel)                  ├──► RULE-01 to 03 │    (all parallel)
 │                                    └──► WEB-01 to 04  │
```

---

## Progress Overview

```
╭──────────────────────────────────────────────────────────────────────────────╮
│                         VERIFICATION PROGRESS                                │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Phase 0: Critical Bugs  [██████████████████████████████]  3/3  100%       │
│   Phase 1: Endpoints      [██████████████████████████████]  30/30 100%       │
│   Phase 2: Documentation  [████████████████████████████░░]  14/15  93%       │
│   Phase 3: Cross-Repo     [█████████████████████████░░░░░]  5/6    83%       │
╰──────────────────────────────────────────────────────────────────────────────╯
```

---

## Verification Commands

```bash
# Check SDK endpoint paths
grep -rn "'/[a-z]" packages/sdk/src/*.ts | grep -v test | grep -v node_modules

# Check backend controller paths
grep -rn "@Controller\|@Get\|@Post\|@Put\|@Delete" ../fetchlaunchpad/backend/src/**/*.controller.ts

# Find all URLs in toolkit docs
grep -rhoE "https?://[^\s\"\'\)\]>]+" docs/ | sort -u

# Find broken internal links
grep -rhoE "\[.*\]\((/[^\)]+)\)" docs/ | sort -u

# Verify production API is reachable
curl -s https://agent-launch.ai/api/platform/stats | jq .

# Test specific endpoints
curl -s "https://agent-launch.ai/api/tokens?limit=1" | jq .
curl -s "https://agent-launch.ai/api/tokens/categories" | jq .
```

---

## Agent Assignment

After Phase 0 bugs are fixed, spawn agents for parallel verification:

```bash
# Phase 0 — Fix critical bugs first (sequential)
# Human or single agent fixes E-1, E-2, E-3

# Phase 1 — Endpoint verification (parallel)
# One agent per controller group
/grow EP-01:EP-10   # Tokens controller
/grow EP-11:EP-22   # Agents controller
/grow EP-23:EP-30   # Other controllers

# Phase 2 — Documentation (parallel)
/grow DOC-01:DOC-08  # Toolkit docs
/grow RULE-01:RULE-03 # Rules
/grow WEB-01:WEB-04   # Website docs

# Phase 3 — Cross-repo (parallel after Phase 1+2)
/grow SYNC-01:SYNC-06
```

---

## Files to Check

### Toolkit (agent-launch-toolkit)

| Category | Files |
|----------|-------|
| SDK Sources | `packages/sdk/src/*.ts` |
| CLI Sources | `packages/cli/src/**/*.ts` |
| MCP Sources | `packages/mcp/src/**/*.ts` |
| Documentation | `docs/*.md`, `README.md`, `CLAUDE.md` |
| Rules | `.claude/rules/*.md` |
| Package Configs | `packages/*/package.json` |

### Website (fetchlaunchpad)

| Category | Files |
|----------|-------|
| Backend Controllers | `backend/src/**/*.controller.ts` |
| Frontend API Calls | `frontend/src/**/*.ts`, `frontend/src/**/*.tsx` |
| Documentation | `docs/*.md`, `CLAUDE.md`, `README.md` |
| Public Files | `frontend/public/*.md`, `frontend/public/*.json` |
| OpenAPI | `frontend/src/app/docs/openapi.json/route.ts` |

---

## Phase 4: Documentation Sync & Publishing (After All Tests Pass)

**Only run after Phase 0-3 complete and all tests pass.**

### Website Agent Documentation (`../fetchlaunchpad/docs/toolkit/`)

| Status | ID | Task | Source → Target |
|:---:|:---|:---|:---|
| `[ ]` | PUB-01 | Sync SDK reference | `docs/sdk-reference.md` → `fetchlaunchpad/docs/toolkit/sdk-reference.md` |
| `[ ]` | PUB-02 | Sync CLI reference | `docs/cli-reference.md` → `fetchlaunchpad/docs/toolkit/cli-reference.md` |
| `[ ]` | PUB-03 | Sync MCP tools | `docs/mcp-tools.md` → `fetchlaunchpad/docs/toolkit/mcp-tools.md` |
| `[ ]` | PUB-04 | Sync getting started | `docs/getting-started.md` → `fetchlaunchpad/docs/toolkit/getting-started.md` |
| `[ ]` | PUB-05 | Update AGENTS.md | Merge toolkit agent docs into `fetchlaunchpad/docs/AGENTS.md` |

### AI/Agent Discovery Files

| Status | ID | Task | File | Update |
|:---:|:---|:---|:---|:---|
| `[ ]` | AI-01 | Update skill.md | `fetchlaunchpad/frontend/public/skill.md` | Sync with toolkit capabilities |
| `[ ]` | AI-02 | Create/update ai.txt | `fetchlaunchpad/frontend/public/ai.txt` | Agent discovery metadata |
| `[ ]` | AI-03 | Update robots.txt | `fetchlaunchpad/frontend/public/robots.txt` | Allow AI crawlers for docs |
| `[ ]` | AI-04 | Update llms.txt | `fetchlaunchpad/frontend/public/llms.txt` | LLM-friendly site description |
| `[ ]` | AI-05 | Update .well-known | `fetchlaunchpad/frontend/public/.well-known/ai-plugin.json` | OpenAI plugin manifest |

### Human Documentation (Website Pages)

| Status | ID | Task | Page | Update |
|:---:|:---|:---|:---|:---|
| `[ ]` | HUM-01 | Docs hub | `/docs` | Ensure links to toolkit docs work |
| `[ ]` | HUM-02 | For Agents page | `/docs/for-agents` | Update with latest SDK/MCP info |
| `[ ]` | HUM-03 | Quickstart page | `/docs/quickstart` | Verify install commands correct |
| `[ ]` | HUM-04 | SDK page | `/docs/sdk` | Sync with sdk-reference.md |
| `[ ]` | HUM-05 | CLI page | `/docs/cli` | Sync with cli-reference.md |
| `[ ]` | HUM-06 | MCP page | `/docs/mcp` | Sync with mcp-tools.md |
| `[ ]` | HUM-07 | Templates page | `/docs/templates` | List all 8 templates with examples |
| `[ ]` | HUM-08 | OpenAPI spec | `/docs/openapi.json` | Regenerate from backend |

### API Documentation

| Status | ID | Task | File | Update |
|:---:|:---|:---|:---|:---|
| `[ ]` | API-01 | OpenAPI route | `frontend/src/app/docs/openapi.json/route.ts` | Match all backend endpoints |
| `[ ]` | API-02 | OpenAPI page | `frontend/src/app/docs/openapi/page.tsx` | Update endpoint list |
| `[ ]` | API-03 | Swagger/Redoc | Backend Swagger UI | Verify all endpoints documented |

### Phase 4 Gate

```
[ ] All toolkit docs synced to website
[ ] skill.md updated with current capabilities
[ ] ai.txt and llms.txt created/updated
[ ] All /docs/* pages reflect current toolkit
[ ] OpenAPI spec matches actual backend
[ ] npm packages published (if version bumped)
```

---

## Phase 5: Final Verification & Publish

| Status | ID | Task | How |
|:---:|:---|:---|:---|
| `[ ]` | FIN-01 | Smoke test production | `curl` all documented endpoints |
| `[ ]` | FIN-02 | Test SDK against prod | Run integration tests against `agent-launch.ai` |
| `[ ]` | FIN-03 | Verify npm packages | `npm view agentlaunch-sdk`, `npm view agentlaunch` |
| `[ ]` | FIN-04 | Test skill.md fetch | `curl https://agent-launch.ai/skill.md` |
| `[ ]` | FIN-05 | Test ai.txt fetch | `curl https://agent-launch.ai/ai.txt` |
| `[ ]` | FIN-06 | Lighthouse audit | Run on `/docs` pages |

---

## Dependency Graph (Full)

```
Phase 0 (Critical Bugs) ─────────────────────────────────────────────────────┐
 │                                                                            │
 ├──► E-1, E-2, E-3 (SDK path fixes)                                         │
 │                                                                            │
 ▼                                                                            │
Phase 1 (Endpoints) ◄────────────────────────────────────────────────────────┤
 │                                                                            │
 ├──► EP-01:EP-30 (all parallel)                                             │
 │                                                                            │
 ▼                                                                            │
Phase 2 (Docs) ◄─────────────────────────────────────────────────────────────┤
 │                                                                            │
 ├──► DOC-01:DOC-08, RULE-01:RULE-03, WEB-01:WEB-04 (all parallel)          │
 │                                                                            │
 ▼                                                                            │
Phase 3 (Cross-Repo) ◄───────────────────────────────────────────────────────┤
 │                                                                            │
 ├──► SYNC-01:SYNC-06 (all parallel)                                         │
 │                                                                            │
 ▼                                                                            │
══════════════════════════════════════════════════════════════════════════════
                        ALL TESTS MUST PASS HERE
══════════════════════════════════════════════════════════════════════════════
 │                                                                            │
 ▼                                                                            │
Phase 4 (Publishing) ◄───────────────────────────────────────────────────────┘
 │
 ├──► PUB-01:PUB-05 (sync toolkit docs to website)
 ├──► AI-01:AI-05 (update AI discovery files)
 ├──► HUM-01:HUM-08 (update human-facing docs)
 ├──► API-01:API-03 (update OpenAPI)
 │
 ▼
Phase 5 (Final Verification)
 │
 └──► FIN-01:FIN-06 (smoke tests, publish verification)
```

---

## Progress Overview

```
╭──────────────────────────────────────────────────────────────────────────────╮
│                         VERIFICATION PROGRESS                                │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Phase 0: Critical Bugs  [██████████████████████████████]  3/3  100%       │
│   Phase 1: Endpoints      [██████████████████████████████]  30/30 100%       │
│   Phase 2: Documentation  [████████████████████████████░░]  14/15  93%       │
│   Phase 3: Cross-Repo     [█████████████████████████░░░░░]  5/6    83%       │
│   ─────────────────────── TESTS MUST PASS ───────────────────────           │
│   Phase 4: Publishing     [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  0/21   0%       │
│   Phase 5: Final          [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  0/6    0%       │
│   ────────────────────────────────────────────────────────────────          │
│   TOTAL                   [███████████████████████░░░░░░░]  52/81  64%      │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯
```

---

## Agent Assignment (Full)

```bash
# Phase 0 — Fix critical bugs first (sequential, blocking)
/grow E-1:E-3        # Fix SDK path bugs

# Phase 1 — Endpoint verification (parallel, after Phase 0)
/grow EP-01:EP-10    # Tokens controller
/grow EP-11:EP-22    # Agents controller
/grow EP-23:EP-30    # Other controllers

# Phase 2 — Documentation verification (parallel)
/grow DOC-01:DOC-08  # Toolkit docs
/grow RULE-01:RULE-03 # Rules
/grow WEB-01:WEB-04   # Website docs

# Phase 3 — Cross-repo consistency (parallel)
/grow SYNC-01:SYNC-06

# ═══════════════════════════════════════════════════
#   RUN: npm run build && npm run test
#   ALL TESTS MUST PASS BEFORE PHASE 4
# ═══════════════════════════════════════════════════

# Phase 4 — Documentation sync & publishing (after tests pass)
/grow PUB-01:PUB-05   # Sync toolkit docs to website
/grow AI-01:AI-05     # Update AI discovery files
/grow HUM-01:HUM-08   # Update human-facing website pages
/grow API-01:API-03   # Update OpenAPI spec

# Phase 5 — Final verification
/grow FIN-01:FIN-06   # Smoke tests and publish verification
```

---

## AI Discovery File Templates

### ai.txt (for AI agents)

```
# Agent Launch - AI Agent Tokenization Platform
# https://agent-launch.ai

## For AI Agents
- SDK: npm install agentlaunch-sdk
- MCP: npm install agent-launch-mcp
- Docs: https://agent-launch.ai/docs/for-agents
- Skill: https://agent-launch.ai/skill.md

## API Base
https://agent-launch.ai/api

## Key Endpoints
POST /agents/tokenize - Create token for your agent
GET /agents/my-agents - List your agents
GET /tokens - Browse all tokens
GET /platform/stats - Platform statistics

## Authentication
Header: X-API-Key: <your-agentverse-api-key>
Get key: https://agentverse.ai/profile/api-keys
```

### llms.txt (for LLM crawlers)

```
# Agent Launch
> AI agent tokenization platform on the Fetch.ai ecosystem

## What is Agent Launch?
Agent Launch enables AI agents to create tradeable ERC-20 tokens representing their value. Agents can tokenize themselves, trade other agent tokens, and participate in the agent economy.

## For Developers
- Documentation: /docs
- SDK Reference: /docs/sdk
- CLI Reference: /docs/cli
- MCP Tools: /docs/mcp

## For AI Agents
- Agent Guide: /docs/for-agents
- Skill File: /skill.md
- API: /docs/openapi.json
```

---

*52/81 tasks complete, 2 blocked. Phases 0-3 done. Next: Phase 4 (Publishing).*
