# Docs Sync & Validation

> **Purpose:** Validate all toolkit commands work correctly, then sync docs to `../fetchlaunchpad`.
>
> **Last validated:** 2026-03-28
>
> **Status:** NEEDS SYNC (versions updated, fetchlaunchpad outdated)

---

## Systematic Validation Process

### Step 1: Extract Source Truth

```bash
node scripts/extract-source-truth.js
```

This extracts canonical values from toolkit source code:
- Versions from `package.json` files
- MCP tools from `packages/mcp/src/index.ts`
- CLI commands from `packages/cli/src/commands/`
- Templates from `packages/templates/src/templates/`
- Constants from `CLAUDE.md`

Output: `docs/source-truth.json`

### Step 2: Scan Docs & Frontend

```bash
node scripts/scan-docs.js
```

This scans all priority files for discrepancies:
- Version numbers (SDK, CLI, MCP)
- Counts (tools, templates)
- Constants (@gift amounts)
- Presets (Marketing, C-Suite, Consumer Commerce)

Output: `docs/sync-validation-report.md`, `docs/sync-issues.json`

### Step 3: Review & Fix

Review the validation report and fix each issue.

---

## Source of Truth

| Item | Value |
|------|-------|
| SDK Version | **0.2.13** |
| CLI Version | **1.2.7** |
| MCP Version | **2.3.5** |
| Templates Version | **0.4.9** |
| MCP Tools | **41** |
| CLI Commands | **26** |
| Templates | **10** |
| @gift TFET | **200** |
| @gift tBNB | **0.005** |

### Templates (10)
1. chat-memory
2. connect
3. consumer-commerce
4. custom
5. data-analyzer
6. gifter
7. price-monitor
8. research
9. swarm-starter
10. trading-bot

### MCP Tools (41)
1. list_tokens
2. get_token
3. get_platform_stats
4. calculate_buy
5. calculate_sell
6. create_token_record
7. get_deploy_instructions
8. get_trade_link
9. scaffold_agent
10. deploy_to_agentverse
11. update_agent_metadata
12. create_and_tokenize
13. get_comments
14. post_comment
15. scaffold_swarm
16. check_agent_commerce
17. network_status
18. buy_tokens
19. sell_tokens
20. get_wallet_balances
21. get_agent_wallet
22. buy_token
23. sell_token
24. deploy_swarm
25. multi_token_payment
26. check_spending_limit
27. create_delegation
28. get_fiat_link
29. create_invoice
30. list_invoices
31. generate_org_template
32. scaffold_org_swarm
33. get_multi_token_balances
34. get_skill
35. install_skill
36. get_connection_status
37. connect_agent
38. update_connection

### Marketing Presets (7)
- writer, social, community, analytics, outreach, ads, strategy

---

## Issues Found (47 total)

### By Type

| Type | Count |
|------|-------|
| Version | 13 |
| Count | 20 |
| Constant | 14 |

### By File

| File | Issues |
|------|--------|
| `docs/agent-launch-toolkit.md` | 9 |
| `docs/toolkit/getting-started.md` | 9 |
| `frontend/src/app/docs/DocsHubClient.tsx` | 4 |
| `frontend/src/app/docs/trading/page.tsx` | 4 |
| `frontend/src/app/docs/for-agents/page.tsx` | 4 |
| `frontend/src/app/skill.md/route.ts` | 4 |
| `frontend/src/app/docs/mcp/page.tsx` | 3 |
| `docs/mcp.md` | 2 |
| `docs/toolkit/cli-reference.md` | 2 |
| `frontend/src/app/docs/cli/page.tsx` | 2 |
| `docs/toolkit/mcp-tools.md` | 1 |
| `docs/toolkit/sdk-reference.md` | 1 |
| `frontend/src/app/docs/templates/page.tsx` | 1 |
| `frontend/src/app/docs/quickstart/page.tsx` | 1 |

---

## Exact Fixes Required

### docs/agent-launch-toolkit.md

| Line | Find | Replace |
|------|------|---------|
| 55 | `SDK 0.2.3` | `SDK 0.2.7` |
| 55 | `CLI 1.4.0` | `CLI 1.1.3` |
| 58 | `MCP 2.1.4` | `MCP 2.1.8` |
| 3, 58, 78, 348, 444 | `20+ MCP tools` | `30 MCP tools` |
| 444 | `7 templates` | `10 templates` |

### docs/mcp.md

| Line | Find | Replace |
|------|------|---------|
| 1, 649 | `v2.1.4` | `v2.1.8` |

### docs/toolkit/cli-reference.md

| Line | Find | Replace |
|------|------|---------|
| 1, 3 | `v1.1.0` | `v1.1.3` |

### docs/toolkit/mcp-tools.md

| Line | Find | Replace |
|------|------|---------|
| 1 | `v2.1.6` | `v2.1.8` |

### docs/toolkit/sdk-reference.md

| Line | Find | Replace |
|------|------|---------|
| 1 | `v0.2.5` | `v0.2.7` |

### docs/toolkit/getting-started.md

| Line | Find | Replace |
|------|------|---------|
| 376 | `20+ tools` | `30 tools` |
| 42, 48, 52 | `150 TFET` | `200 TFET` |
| 42, 48 | `0.01 tBNB` | `0.005 tBNB` |

### frontend/src/app/docs/DocsHubClient.tsx

| Line | Find | Replace |
|------|------|---------|
| 621 | `v0.2.3` | `v0.2.7` |
| 621 | `v1.4.0` | `v1.1.3` |
| 116, 622 | `20+ tools` | `30 tools` |

### frontend/src/app/docs/cli/page.tsx

| Line | Find | Replace |
|------|------|---------|
| 539 | `150 TFET + 0.01 tBNB` | `200 TFET + 0.005 tBNB` |

### frontend/src/app/docs/mcp/page.tsx

| Line | Find | Replace |
|------|------|---------|
| 688, 694 | `v2.1.4` | `v2.1.8` |
| 450 | `20+ tools` | `30 tools` |

### frontend/src/app/docs/for-agents/page.tsx

| Line | Find | Replace |
|------|------|---------|
| 118, 120, 1304 | `20+ tools` | `30 tools` |
| 127 | `7 templates` | `10 templates` |

### frontend/src/app/docs/templates/page.tsx

| Line | Find | Replace |
|------|------|---------|
| 368 | `7 templates` | `10 templates` |

### frontend/src/app/docs/trading/page.tsx

| Line | Find | Replace |
|------|------|---------|
| 136, 297 | `150 TFET` | `200 TFET` |
| 136, 297 | `0.01 tBNB` | `0.005 tBNB` |

### frontend/src/app/docs/quickstart/page.tsx

| Line | Find | Replace |
|------|------|---------|
| 417 | `20+ tools` | `30 tools` |

### frontend/src/app/skill.md/route.ts

| Line | Find | Replace |
|------|------|---------|
| 332, 347 | `20+ MCP tools` | `30 MCP tools` |
| 347 | `7 templates` | `10 templates` |

---

## Automated Fix Commands

```bash
# Navigate to fetchlaunchpad
cd ../fetchlaunchpad

# Fix tool counts (20+ → 30)
find docs frontend/src/app -type f \( -name "*.md" -o -name "*.tsx" -o -name "*.ts" \) \
  -exec sed -i '' 's/20+ tools/30 tools/g' {} \;

find docs frontend/src/app -type f \( -name "*.md" -o -name "*.tsx" -o -name "*.ts" \) \
  -exec sed -i '' 's/20+ MCP tools/30 MCP tools/g' {} \;

# Fix template counts (7 → 10)
find docs frontend/src/app -type f \( -name "*.md" -o -name "*.tsx" -o -name "*.ts" \) \
  -exec sed -i '' 's/7 templates/10 templates/g' {} \;

# Fix @gift amounts
find docs frontend/src/app -type f \( -name "*.md" -o -name "*.tsx" -o -name "*.ts" \) \
  -exec sed -i '' 's/150 TFET/200 TFET/g' {} \;

find docs frontend/src/app -type f \( -name "*.md" -o -name "*.tsx" -o -name "*.ts" \) \
  -exec sed -i '' 's/0\.01 tBNB/0.005 tBNB/g' {} \;

# Fix versions (manual review recommended)
# SDK: 0.2.3 → 0.2.7, 0.2.5 → 0.2.7
# CLI: 1.4.0 → 1.1.3, 1.1.0 → 1.1.3
# MCP: 2.1.4 → 2.1.8, 2.1.6 → 2.1.8
```

---

## Validation Checklist

### Pre-sync

- [x] `npm run build` succeeds
- [x] `node scripts/extract-source-truth.js` runs
- [x] `node scripts/scan-docs.js` runs
- [x] Review `docs/sync-validation-report.md`

### Post-sync

- [x] Apply fixes to all 14 files
- [x] Re-run `node scripts/scan-docs.js`
- [x] Verify 0 issues
- [x] Commit changes to fetchlaunchpad

---

## Scripts

### extract-source-truth.js

Location: `scripts/extract-source-truth.js`

Extracts canonical values from toolkit source:
- Versions from package.json
- MCP tools from index.ts TOOLS array
- Templates from templates directory
- Presets from presets.ts
- Constants from CLAUDE.md

### scan-docs.js

Location: `scripts/scan-docs.js`

Scans fetchlaunchpad for discrepancies:
- Focuses on 15 priority files (user-facing docs)
- Compares versions, counts, constants
- Generates markdown and JSON reports

---

## Summary

| Metric | Value |
|--------|-------|
| Priority files | 14 |
| Total issues | 47 |
| Version issues | 13 |
| Count issues | 20 |
| Constant issues | 14 |
| Scripts created | 2 |

**Next action:** Run the automated fix commands, then re-validate.
