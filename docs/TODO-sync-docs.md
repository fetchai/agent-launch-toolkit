# TODO: Docs Sync & Validation

---
title: Docs Sync Validation
version: 1.0.0
total_tasks: 12
completed: 15
status: complete
depends_on: []
---

## Now

All tasks complete.

---

## Phase 1: Setup Scripts

| Status | ID | Task | How | KPI | Depends |
|:---:|:---|:---|:---|:---|:---|
| `[x]` | S-1 | Create extract-source-truth.js | Extract versions, tools, templates from source | Script runs | — |
| `[x]` | S-2 | Create scan-docs.js | Scan fetchlaunchpad for discrepancies | Script runs | S-1 |
| `[x]` | S-3 | Generate source-truth.json | Run extract script | JSON created | S-1 |
| `[x]` | S-4 | Generate sync-validation-report.md | Run scan script | Report created | S-2, S-3 |

**Gate:** Both scripts run successfully, reports generated.

---

## Phase 2: Apply Fixes

| Status | ID | Task | How | KPI | Depends |
|:---:|:---|:---|:---|:---|:---|
| `[x]` | F-1 | Fix tool counts | `sed 's/20+ tools/30 tools/g'` | 0 count issues | S-4 |
| `[x]` | F-2 | Fix template counts | `sed 's/7 templates/10 templates/g'` | 0 template issues | S-4 |
| `[x]` | F-3 | Fix @gift TFET amounts | `sed 's/150 TFET/200 TFET/g'` | 0 TFET issues | S-4 |
| `[x]` | F-4 | Fix @gift tBNB amounts | `sed 's/0.01 tBNB/0.005 tBNB/g'` | 0 tBNB issues | S-4 |
| `[x]` | F-5 | Fix SDK versions | 0.2.3→0.2.7, 0.2.5→0.2.7 | 0 SDK issues | S-4 |
| `[x]` | F-6 | Fix CLI versions | 1.4.0→1.1.3, 1.1.0→1.1.3 | 0 CLI issues | S-4 |
| `[x]` | F-7 | Fix MCP versions | 2.1.4→2.1.8, 2.1.6→2.1.8 | 0 MCP issues | S-4 |

**Gate:** Re-run scan shows 0 real issues (false positives excluded).

---

## Phase 3: Finalize

| Status | ID | Task | How | KPI | Depends |
|:---:|:---|:---|:---|:---|:---|
| `[x]` | V-1 | Fix scanner false positives | Exclude 10/20/30 TFET from @gift check | 0 false positives | F-1..F-7 |
| `[x]` | V-2 | Final validation | `node scripts/scan-docs.js` | 0 issues | V-1 |
| `[x]` | V-3 | Commit to fetchlaunchpad | `git add . && git commit` | Changes committed | V-2 |
| `[x]` | V-4 | Update sync-docs.md status | Set status to "0 issues" | Doc updated | V-2 |

**Gate:** 0 issues in validation report, changes committed.

---

## Dependency Graph

```
S-1 ─┬─> S-3 ─┐
     │        ├─> S-4 ─> F-1..F-7 ─> V-1 ─> V-2 ─┬─> V-3
S-2 ─┴────────┘                                  └─> V-4
```

---

## Progress Overview

```
Phase 1: Setup      [████████████████████] 100%  (4/4)
Phase 2: Fixes      [████████████████████] 100%  (7/7)
Phase 3: Finalize   [████████████████████] 100%  (4/4)
─────────────────────────────────────────────────────
Overall             [████████████████████] 100%  (15/15)
```

---

## Source of Truth

| Item | Value |
|------|-------|
| SDK Version | **0.2.7** |
| CLI Version | **1.1.3** |
| MCP Version | **2.1.8** |
| Templates Version | **0.4.3** |
| MCP Tools | **30** |
| CLI Commands | **25** |
| Templates | **10** |
| @gift TFET | **200** |
| @gift tBNB | **0.001** |

---

## Current Status

**Last scan:** 2026-03-09

| Metric | Before | After |
|--------|--------|-------|
| Total issues | 47 | **0** |
| Version issues | 13 | 0 |
| Count issues | 20 | 0 |
| Constant issues | 14 | 0 |
| Files with issues | 14 | **0** |

### Remaining False Positives

These are NOT bugs - they are legitimate values that the scanner incorrectly flags:

| File | Value | Context |
|------|-------|---------|
| docs/toolkit/getting-started.md | 10 TFET | Referral bonus |
| docs/toolkit/getting-started.md | 20 TFET | Builder reward |
| docs/toolkit/getting-started.md | 80 TFET | Leftover after deploy (200-120) |

---

## Commands

```bash
# Extract source truth
node scripts/extract-source-truth.js

# Scan for issues
node scripts/scan-docs.js

# View report
cat docs/sync-validation-report.md

# View issues JSON
cat docs/sync-issues.json
```
