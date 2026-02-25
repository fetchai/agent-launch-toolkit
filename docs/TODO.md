# TODO - Production URL Migration

> **Priority:** Complete before any public release or npm publish
> **Goal:** All code, docs, and examples use `agent-launch.ai` as default
> **Updated:** 2026-02-25

---

## Where We Are

```
PRODUCTION URL MIGRATION
══════════════════════════════════════════════════════════════

Production URLs:
  API:       https://agent-launch.ai/api
  Frontend:  https://agent-launch.ai

Dev URLs (for AGENT_LAUNCH_ENV=dev only):
  API:       https://launchpad-backend-dev-1056182620041.us-central1.run.app
  Frontend:  https://launchpad-frontend-dev-1056182620041.us-central1.run.app

WHAT'S DONE:
  ✅ SDK urls.ts - production as default
  ✅ SDK endpoint paths - removed /agents/ prefix
  ✅ CLI config.ts - production as default
  ✅ CLAUDE.md - updated
  ✅ .claude/rules/agentlaunch.md - updated
  ✅ .env.example - updated

WHAT'S NOT DONE:
  45 files still reference dev URLs
  Examples hardcoded to dev
  Templates hardcoded to dev
  Docs reference dev URLs
══════════════════════════════════════════════════════════════
```

---

## Priority 1: SDK & Core (Must Fix)

| # | File | Status | Notes |
|---|------|--------|-------|
| SDK-01 | `packages/sdk/src/urls.ts` | ✅ DONE | Production default |
| SDK-02 | `packages/sdk/README.md` | TODO | Update examples |
| SDK-03 | `packages/cli/src/config.ts` | ✅ DONE | Production default |
| SDK-04 | `packages/cli/src/commands/init.ts` | TODO | Check for hardcoded URLs |
| SDK-05 | `packages/cli/src/__tests__/config.test.ts` | TODO | Update test expectations |
| SDK-06 | `packages/cli/README.md` | TODO | Update examples |
| SDK-07 | `packages/mcp/README.md` | TODO | Update examples |
| SDK-08 | `packages/README.md` | TODO | Update overview |

---

## Priority 2: Templates (Generate Correct Code)

| # | File | Status | Notes |
|---|------|--------|-------|
| TPL-01 | `packages/templates/src/generator.ts` | TODO | Check URL generation |
| TPL-02 | `packages/templates/src/templates/custom.ts` | TODO | Update hardcoded URLs |
| TPL-03 | `packages/templates/src/templates/price-monitor.ts` | TODO | Update hardcoded URLs |
| TPL-04 | `packages/templates/src/templates/trading-bot.ts` | TODO | Update hardcoded URLs |
| TPL-05 | `packages/templates/src/templates/data-analyzer.ts` | TODO | Update hardcoded URLs |
| TPL-06 | `packages/templates/src/templates/research.ts` | TODO | Update hardcoded URLs |
| TPL-07 | `packages/templates/src/templates/gifter.ts` | TODO | Update hardcoded URLs |

---

## Priority 3: Examples (Show Correct Usage)

| # | File | Status | Notes |
|---|------|--------|-------|
| EX-01 | `examples/agents/launcher-agent.py` | TODO | Update API URLs |
| EX-02 | `examples/agents/price-monitor-agent.py` | TODO | Update API URLs |
| EX-03 | `examples/agents/trading-agent.py` | TODO | Update API URLs |
| EX-04 | `examples/agents/research-agent.py` | TODO | Update API URLs |
| EX-05 | `examples/agents/gifter-agent.py` | TODO | Update API URLs |
| EX-06 | `examples/agents/data-agent.py` | TODO | Update API URLs |
| EX-07 | `examples/scripts/launch-headless.py` | TODO | Update API URLs |
| EX-08 | `examples/sdk/create-and-tokenize/index.ts` | TODO | Update examples |
| EX-09 | `examples/sdk/create-and-tokenize/README.md` | TODO | Update docs |
| EX-10 | `examples/sdk/monitor-and-trade/index.ts` | TODO | Update examples |
| EX-11 | `examples/sdk/monitor-and-trade/README.md` | TODO | Update docs |

---

## Priority 4: Documentation (Accurate Guidance)

| # | File | Status | Notes |
|---|------|--------|-------|
| DOC-01 | `CLAUDE.md` | ✅ DONE | Updated |
| DOC-02 | `README.md` | TODO | Update getting started |
| DOC-03 | `TUTORIAL.md` | TODO | Update walkthrough |
| DOC-04 | `docs/getting-started.md` | TODO | Update setup instructions |
| DOC-05 | `docs/sdk-reference.md` | TODO | Update API reference |
| DOC-06 | `docs/cli-reference.md` | TODO | Update CLI docs |
| DOC-07 | `docs/mcp-tools.md` | TODO | Update MCP docs |
| DOC-08 | `docs/AGENTS.md` | TODO | Update agent docs |
| DOC-09 | `docs/agents/build-guide.md` | TODO | Update build guide |
| DOC-10 | `docs/agents/handoff-protocol.md` | TODO | Update handoff docs |
| DOC-11 | `docs/agents/mode-a-claude-code.md` | TODO | Update mode A docs |
| DOC-12 | `docs/agents/mode-b-agentverse.md` | TODO | Update mode B docs |
| DOC-13 | `docs/agents/mode-c-headless.md` | TODO | Update mode C docs |
| DOC-14 | `docs/agents/troubleshooting.md` | TODO | Update troubleshooting |
| DOC-15 | `docs/agents/SKILL.md` | TODO | Update skill docs |

---

## Priority 5: Config & Rules

| # | File | Status | Notes |
|---|------|--------|-------|
| CFG-01 | `.env.example` | ✅ DONE | Production default |
| CFG-02 | `.claude/rules/agentlaunch.md` | ✅ DONE | Updated |
| CFG-03 | `.cursor/rules/agentlaunch.md` | TODO | Mirror .claude rules |
| CFG-04 | `skill/skill.md` | TODO | Update skill definition |

---

## Checklist for Each File

When updating a file, check for:

```
[ ] Dev backend URL: launchpad-backend-dev-1056182620041.us-central1.run.app
[ ] Dev frontend URL: launchpad-frontend-dev-1056182620041.us-central1.run.app
[ ] Old endpoint paths: /agents/tokenize, /agents/tokens, /agents/token/
[ ] Correct endpoint paths: /tokenize, /tokens, /token/
[ ] Production API URL: https://agent-launch.ai/api
[ ] Production frontend URL: https://agent-launch.ai
[ ] Environment variable mentions: AGENT_LAUNCH_ENV default is now production
[ ] Comments mentioning "dev" as default
```

---

## Verification Commands

After updates, run these to verify:

```bash
# Search for remaining dev URLs
grep -r "launchpad-backend-dev" --include="*.ts" --include="*.py" --include="*.md"
grep -r "launchpad-frontend-dev" --include="*.ts" --include="*.py" --include="*.md"

# Search for old endpoint paths
grep -r "/agents/tokenize" --include="*.ts" --include="*.py"
grep -r "/agents/tokens" --include="*.ts" --include="*.py"

# Test SDK with production
node -e "import('agentlaunch-sdk').then(m => m.listTokens({limit:1}).then(console.log))"

# Test CLI with production
npx agentlaunch list --limit 1
```

---

## What NOT to Do

1. **Don't remove dev URLs entirely** -- they're needed for `AGENT_LAUNCH_ENV=dev`
2. **Don't hardcode production URLs in code** -- use environment resolution
3. **Don't update .env files in examples** -- use .env.example pattern
4. **Don't break existing functionality** -- test after each change

---

## Completed

```
2026-02-25: Initial migration
══════════════════════════════
- SDK urls.ts updated (production default)
- SDK endpoint paths fixed (removed /agents/ prefix)
- CLI config.ts updated (production default)
- CLAUDE.md updated
- .claude/rules/agentlaunch.md updated
- .env.example updated
- SDK tested and working with production API
```
