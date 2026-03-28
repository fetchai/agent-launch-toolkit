# TODO-sync: Complete Audit & Sync Checklist

> **Purpose:** Ensure all code, docs, packages, and configurations are in sync across agent-launch-toolkit and fetchlaunchpad.
>
> **Generated:** 2026-03-28
>
> **Status:** AUDIT IN PROGRESS

---

## Source of Truth (agent-launch-toolkit)

### Package Versions (Current)

| Package | Name | Version |
|---------|------|---------|
| SDK | agentlaunch-sdk | **0.2.13** |
| CLI | agentlaunch | **1.2.7** |
| MCP | agent-launch-mcp | **2.3.5** |
| Templates | agentlaunch-templates | **0.4.9** |

### Counts (Current)

| Item | Count | Source |
|------|-------|--------|
| CLI Commands | **26** | `packages/cli/src/commands/*.ts` |
| MCP Tools | **41** | `packages/mcp/src/tools/*.ts` + connect |
| Templates | **10** | `packages/templates/src/templates/*.ts` |
| Skills | **12** | `.claude/skills/*/SKILL.md` + `skill/SKILL.md` |
| Rules | **11** | `.claude/rules/*.md` |
| SDK Exports | **70+** | functions, types, classes |
| Docs | **80+** | `docs/*.md` files |

### CLI Commands (26)

```
alliance, buy, claim, comments, config, connect, connect-logs,
connect-status, connect-update, create, deploy, docs, holders,
init, list, marketing, optimize, org-template, pay, scaffold,
sell, skill, status, swarm-from-org, tokenize, wallet
```

### MCP Tools (38)

```
list_tokens, get_token, get_platform_stats, calculate_buy, calculate_sell,
create_token_record, get_deploy_instructions, get_trade_link, scaffold_agent,
deploy_to_agentverse, update_agent_metadata, create_and_tokenize, get_comments,
post_comment, scaffold_swarm, check_agent_commerce, network_status, buy_tokens,
sell_tokens, get_wallet_balances, get_agent_wallet, buy_token, sell_token,
deploy_swarm, multi_token_payment, check_spending_limit, create_delegation,
get_fiat_link, create_invoice, list_invoices, generate_org_template,
scaffold_org_swarm, get_multi_token_balances, get_skill, install_skill,
get_connection_status, connect_agent, update_connection
```

### Templates (10)

```
chat-memory, connect, consumer-commerce, custom, data-analyzer,
gifter, price-monitor, research, swarm-starter, trading-bot
```

### Skills (11)

```
alliance, build-agent, build-swarm, deploy, grow, market, status,
todo, tokenize, welcome, skill (root)
```

### Rules (11)

```
agentlaunch, agentverse, api-design, api-paths, consumer-payments,
marketing-swarm, payment-protocol, security-checklist, testing,
uagent-patterns, workflow
```

### Constants

| Constant | Value |
|----------|-------|
| Deploy Fee | 120 FET |
| Graduation | 30,000 FET |
| Trading Fee | 2% (to protocol) |
| @gift TFET | 200 |
| @gift tBNB | 0.005 |
| Default Chain | BSC Testnet (97) |
| TFET Contract | 0x304ddf3eE068c53514f782e2341B71A80c8aE3C7 |

---

## fetchlaunchpad (Target for Sync)

### Counts

| Item | Count |
|------|-------|
| Frontend Pages | **51** |
| Backend Controllers | **19** |
| API Endpoints | **60+** |
| Docs (markdown) | **128** |
| Skills | **19** |
| Rules | **7** |

### Key Backend Endpoints

| Controller | Prefix | Key Routes |
|------------|--------|------------|
| TokenController | `/tokens` | list, get, calculate-buy/sell |
| AgentsController | `/agents` | auth, my-agents, tokenize, wallet, buy, sell |
| CommentController | `/comments` | get, post |
| TransactionController | `/transactions` | trades, stats, holders |
| StatsController | `/platform` | stats |
| FaucetController | `/faucet` | status, claim |
| SkillController | `/skill` | get, mcp-config |
| TeamController | `/teams` | CRUD, members |

### Important Note

**fetchlaunchpad does NOT import agentlaunch-sdk** — the SDK is for external consumers, not the backend itself. Both repos document the same API paths but:
- toolkit provides client-side wrappers (SDK, CLI, MCP)
- fetchlaunchpad implements the server-side API

---

## Discrepancies Found

### CLAUDE.md vs Actual

| Item | CLAUDE.md Says | Actual | Action |
|------|----------------|--------|--------|
| CLI Commands | 24 | 26 | Update CLAUDE.md |
| MCP Tools | 28 | 38 | Update CLAUDE.md |
| Templates | 9 | 10 | Update CLAUDE.md |

### sync-docs.md vs Actual (Stale data from 2026-03-09)

| Item | sync-docs.md Says | Actual | Action |
|------|-------------------|--------|--------|
| SDK Version | 0.2.8 | 0.2.13 | Update sync-docs.md |
| CLI Version | 1.1.3 | 1.2.7 | Update sync-docs.md |
| MCP Version | 2.1.8 | 2.3.5 | Update sync-docs.md |
| Templates Version | 0.4.3 | 0.4.9 | Update sync-docs.md |
| MCP Tools | 30 | 38 | Update sync-docs.md |
| CLI Commands | 25 | 26 | Update sync-docs.md |
| Templates | 9 | 10 | Update sync-docs.md |

---

## Files to Update in agent-launch-toolkit

### High Priority (Source of Truth)

| File | Issues | Fix |
|------|--------|-----|
| `CLAUDE.md` | Wrong counts | Update to 26 CLI, 38 MCP, 10 templates |
| `docs/sync-docs.md` | Stale versions | Update all versions and counts |
| `docs/workflow.md` | May have old counts | Verify counts match |
| `docs/mcp-tools.md` | May have old count | Verify 38 tools |
| `docs/cli-reference.md` | May have old count | Verify 26 commands |

### Medium Priority (Docs)

| File | Check |
|------|-------|
| `docs/lifecycle.md` | Cross-links, command refs |
| `docs/connect.md` | Phase numbers, tool refs |
| `docs/getting-started.md` | Versions, faucet amounts |
| `docs/openclaw.md` | Resource links |
| `docs/home.md` | Path descriptions |
| `README.md` | Package versions |

### Low Priority (Examples)

| File | Check |
|------|-------|
| `examples/` | Import paths, API calls |
| `TUTORIAL.md` | Commands, versions |

---

## Files to Update in fetchlaunchpad

### Frontend Pages (High Priority)

| File | Expected Issues |
|------|-----------------|
| `frontend/src/app/docs/DocsHubClient.tsx` | Versions, tool counts |
| `frontend/src/app/docs/cli/page.tsx` | CLI commands, faucet amounts |
| `frontend/src/app/docs/mcp/page.tsx` | MCP tools, versions |
| `frontend/src/app/docs/for-agents/page.tsx` | Tool counts, template counts |
| `frontend/src/app/docs/templates/page.tsx` | Template count (10 not 9) |
| `frontend/src/app/docs/trading/page.tsx` | Faucet amounts |
| `frontend/src/app/docs/quickstart/page.tsx` | Tool count |
| `frontend/src/app/skill.md/route.ts` | Tool counts, template counts |

### Backend

| File | Check |
|------|-------|
| `backend/` | API versions, constants |

### Docs (Markdown)

| File | Expected Issues |
|------|-----------------|
| `docs/agent-launch-toolkit.md` | Versions, counts |
| `docs/mcp.md` | MCP version |
| `docs/toolkit/cli-reference.md` | CLI version |
| `docs/toolkit/mcp-tools.md` | MCP version |
| `docs/toolkit/sdk-reference.md` | SDK version |
| `docs/toolkit/getting-started.md` | Faucet amounts |

---

## Sync Checklist

### Phase 1: Update agent-launch-toolkit (Source of Truth)

- [ ] **CLAUDE.md** — Update counts
  ```
  CLI: 24 → 26 commands
  MCP: 28 → 38 tools
  Templates: 9 → 10
  ```

- [ ] **docs/sync-docs.md** — Update versions and counts
  ```
  SDK: 0.2.8 → 0.2.13
  CLI: 1.1.3 → 1.2.7
  MCP: 2.1.8 → 2.3.5
  Templates: 0.4.3 → 0.4.9
  MCP Tools: 30 → 38
  CLI Commands: 25 → 26
  Templates: 9 → 10
  ```

- [ ] **docs/mcp-tools.md** — Verify 38 tools listed
- [ ] **docs/cli-reference.md** — Verify 26 commands listed
- [ ] **docs/workflow.md** — Verify references
- [ ] **docs/lifecycle.md** — Verify references
- [ ] **README.md** — Verify package info

### Phase 2: Sync to fetchlaunchpad

- [ ] Run extract-source-truth.js
  ```bash
  node scripts/extract-source-truth.js
  ```

- [ ] Run scan-docs.js
  ```bash
  node scripts/scan-docs.js
  ```

- [ ] Review sync-validation-report.md

- [ ] Apply automated fixes
  ```bash
  cd ../fetchlaunchpad

  # Fix tool counts
  find docs frontend/src/app -type f \( -name "*.md" -o -name "*.tsx" -o -name "*.ts" \) \
    -exec sed -i '' 's/28 tools/38 tools/g' {} \;
  find docs frontend/src/app -type f \( -name "*.md" -o -name "*.tsx" -o -name "*.ts" \) \
    -exec sed -i '' 's/30 tools/38 tools/g' {} \;

  # Fix template counts
  find docs frontend/src/app -type f \( -name "*.md" -o -name "*.tsx" -o -name "*.ts" \) \
    -exec sed -i '' 's/9 templates/10 templates/g' {} \;

  # Fix CLI commands
  find docs frontend/src/app -type f \( -name "*.md" -o -name "*.tsx" -o -name "*.ts" \) \
    -exec sed -i '' 's/24 commands/26 commands/g' {} \;
  find docs frontend/src/app -type f \( -name "*.md" -o -name "*.tsx" -o -name "*.ts" \) \
    -exec sed -i '' 's/25 commands/26 commands/g' {} \;
  ```

- [ ] Manual version updates (review each)
  - SDK: 0.2.X → 0.2.13
  - CLI: 1.X.X → 1.2.7
  - MCP: 2.X.X → 2.3.5
  - Templates: 0.4.X → 0.4.9

- [ ] Re-run scan-docs.js to verify 0 issues

### Phase 3: Verify Skills & Rules Sync

- [ ] Compare skills between repos
  ```bash
  # agent-launch-toolkit
  ls .claude/skills/*/SKILL.md

  # fetchlaunchpad
  ls ../fetchlaunchpad/.claude/skills/*/SKILL.md
  ```

- [ ] Compare rules between repos
  ```bash
  # agent-launch-toolkit
  ls .claude/rules/*.md

  # fetchlaunchpad
  ls ../fetchlaunchpad/.claude/rules/*.md
  ```

- [ ] Sync any missing skills/rules

### Phase 4: Final Validation

- [ ] Build all packages
  ```bash
  npm run build
  ```

- [ ] Run tests
  ```bash
  npm test
  ```

- [ ] Verify MCP server starts
  ```bash
  npx agent-launch-mcp --help
  ```

- [ ] Verify CLI works
  ```bash
  npx agentlaunch --help
  ```

- [ ] Commit changes to both repos

---

## New Items to Add

### Missing from Docs

| Item | Status | Add To |
|------|--------|--------|
| `connect` template | New | docs/workflow.md, CLAUDE.md |
| `connect_agent` MCP tool | New | docs/mcp-tools.md |
| `update_connection` MCP tool | New | docs/mcp-tools.md |
| `get_connection_status` MCP tool | New | docs/mcp-tools.md |
| `connect` CLI command | New | docs/cli-reference.md |
| `connect-logs` CLI command | New | docs/cli-reference.md |
| `connect-status` CLI command | New | docs/cli-reference.md |
| `connect-update` CLI command | New | docs/cli-reference.md |
| Phase 0 (Connect) | New | Already in workflow.md |
| Phase ∞ (Monitor) | New | Already in workflow.md |
| `docs/lifecycle.md` | New | Created today |
| `docs/connect.md` | New | Created today |

---

## Cross-Repo Sync Map

| agent-launch-toolkit | fetchlaunchpad | Notes |
|---------------------|----------------|-------|
| `packages/sdk/` | npm dependency | Publish SDK first |
| `packages/cli/` | npm dependency | Publish CLI after SDK |
| `packages/mcp/` | npm dependency | Publish MCP after SDK |
| `packages/templates/` | npm dependency | Publish Templates after SDK |
| `CLAUDE.md` | `CLAUDE.md` | Different focus, some overlap |
| `.claude/rules/*.md` | `.claude/rules/*.md` | Should share core rules |
| `.claude/skills/*/SKILL.md` | `.claude/skills/*/SKILL.md` | Different skills |
| `docs/*.md` | `docs/*.md` | toolkit has more docs |
| `skill/SKILL.md` | `frontend/src/app/skill.md/route.ts` | Skill served from frontend |

---

## Publish Order

When publishing new versions:

1. **SDK first** — all other packages depend on it
2. **Templates** — CLI and MCP use templates
3. **CLI** — uses SDK + Templates
4. **MCP** — uses SDK + Templates
5. **Update fetchlaunchpad** — run sync scripts
6. **Update docs** — both repos

---

## Automation Scripts

### scripts/extract-source-truth.js

Extracts canonical values from toolkit source code.

### scripts/scan-docs.js

Scans fetchlaunchpad for discrepancies against source truth.

### Recommended: Add CI Check

```yaml
# .github/workflows/sync-check.yml
name: Sync Check
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: node scripts/extract-source-truth.js
      - run: node scripts/scan-docs.js
      - run: |
          if [ -s docs/sync-issues.json ]; then
            echo "Sync issues found!"
            cat docs/sync-issues.json
            exit 1
          fi
```

---

## Summary

| Metric | Value |
|--------|-------|
| Package version mismatches | 4 |
| Count mismatches | 3 |
| New items not documented | 10+ |
| Files to update (toolkit) | ~10 |
| Files to update (fetchlaunchpad) | ~15 |
| Priority | HIGH |

**Next action:** Start with Phase 1 — update CLAUDE.md and sync-docs.md with correct counts.
