# AgentLaunch Platform Issues

**Source:** POC Team Review (Fetch.ai)
**Date:** 2026-03-03
**Last Updated:** 2026-03-03
**Status:** Most toolkit issues fixed, API/frontend issues pending

---

## Status Summary

| Issue | Description | Status | Notes |
|-------|-------------|--------|-------|
| CLI-001 | scaffold command not registered | **FIXED** | Added import/registration |
| CLI-002 | buy/sell commands not working | **FIXED** | Was npm version issue |
| CLI-003 | Claude Code login prompt | **FIXED** | Added --no-editor flag |
| CLI-004 | create_protocol error | **FIXED** | Fixed all files |
| CLI-005 | --template vs --type | **FIXED** | CLI uses --type (correct) |
| SDK-001 | API shape mismatch | **FIXED** | AgentLaunch class complete |
| SDK-002 | Error fields missing | **FIXED** | Added code/details/retryAfterMs |
| SDK-003 | Version mismatch | **LOW PRIORITY** | Minor doc sync issue |
| API-001 | /agents/tokens 404 | **NOT FIXED** | Docs wrong, /tokens works |
| API-002 | /agents/launch 404 | **NOT FIXED** | Docs wrong, /agents/tokenize works |
| API-003 | Search API 500 | **NOT FIXED** | Agentverse returns 422 |
| WEB-001 | Frontend search error | **PARTIAL** | Token search works |
| WEB-002 | Addresses not clickable | **NOT FIXED** | Only tx links implemented |

### Progress

| Category | Fixed | Partial | Not Fixed | Total |
|----------|-------|---------|-----------|-------|
| CLI | 5 | 0 | 0 | 5 |
| SDK | 2 | 0 | 0 | 2 |
| API | 0 | 0 | 3 | 3 |
| Web | 0 | 1 | 1 | 2 |
| **Total** | **7** | **1** | **4** | **12** |

---

## Human Verification Checklist

Before merging/releasing, verify the following fixes work correctly:

### CLI-001: Scaffold Command
```bash
cd /Users/toc/Server/agent-launch-toolkit
npm run build
npx agentlaunch scaffold --help
# Expected: Shows scaffold command help with --type option
npx agentlaunch scaffold test-agent --type chat-memory
# Expected: Creates test-agent/ directory with agent.py, README.md, etc.
rm -rf test-agent  # cleanup
```

### CLI-002: Buy/Sell Commands
```bash
npx agentlaunch buy --help
# Expected: Shows buy command with --amount, --slippage, --chain, --dry-run options
npx agentlaunch sell --help
# Expected: Shows sell command with --amount, --chain, --dry-run options
```

### CLI-003: No-Editor Flag
```bash
npx agentlaunch test-no-editor --local --no-editor
# Expected: Creates directory but does NOT prompt for editor selection
# Should show: "To open in an editor later: cd test-no-editor && claude"
rm -rf test-no-editor  # cleanup
```

### CLI-004: Protocol Pattern
```bash
grep -n "agent.create_protocol" examples/agents/joke-teller/agent.py
# Expected: No output (pattern should not exist)
grep -n "Protocol(spec=" examples/agents/joke-teller/agent.py
# Expected: Shows line 10 with correct pattern

grep -n "agent.create_protocol" docs/demo-commerce.md
# Expected: No output (pattern should not exist)
grep -n "Protocol(spec=" docs/demo-commerce.md
# Expected: Shows lines with correct pattern
```

### SDK-002: Error Fields
```bash
grep -n "code:" packages/sdk/src/types.ts | head -5
# Expected: Shows "code: AgentLaunchErrorCode" field in AgentLaunchError class
grep -n "AgentLaunchErrorCode" packages/sdk/src/index.ts
# Expected: Shows the type is exported
```

### Full Build Test
```bash
npm run build
# Expected: All 4 packages compile without errors
npm run test  # if tests exist
```

---

## CLI Issues (All Fixed)

### CLI-001: `scaffold` command not registered
**Status:** FIXED
**GitHub:** https://github.com/tonyoconnell/agent-launch-toolkit/issues/2

**Fix Applied:**
- Added `import { registerScaffoldCommand } from "./commands/scaffold.js";` to index.ts
- Added `registerScaffoldCommand(program);` to register the command

---

### CLI-002: `buy` and `sell` commands not working
**Status:** FIXED
**GitHub:** https://github.com/tonyoconnell/agent-launch-toolkit/issues/1

**Resolution:** Commands work in current codebase. User had old npm version.

---

### CLI-003: Claude Code login prompt during agent creation
**Status:** FIXED
**GitHub:** https://github.com/tonyoconnell/agent-launch-toolkit/issues/3

**Fix Applied:**
- Added `--no-editor` flag to skip editor launching
- Usage: `npx agentlaunch myagent --no-editor`

---

### CLI-004: Agent fails to start - missing `create_protocol` method
**Status:** FIXED
**GitHub:** https://github.com/tonyoconnell/agent-launch-toolkit/issues/4

**Fix Applied:**
- Fixed `examples/agents/joke-teller/agent.py` (line 10)
- Fixed `docs/demo-commerce.md` (lines 161, 189)
- Changed `agent.create_protocol(spec=...)` to `Protocol(spec=...)`

---

### CLI-005: `--template` option doesn't exist on scaffold
**Status:** FIXED (was documentation issue)

**Resolution:** The scaffold command correctly uses `--type` not `--template`. Documentation should use `--type`.

---

## SDK Issues (All Fixed)

### SDK-001: API shape mismatch - docs vs implementation
**Status:** FIXED
**GitHub:** https://github.com/tonyoconnell/agent-launch-toolkit/issues/5

**Resolution:** AgentLaunch class has all documented namespaces and methods.

---

### SDK-002: AgentLaunchError missing documented fields
**Status:** FIXED
**GitHub:** https://github.com/tonyoconnell/agent-launch-toolkit/issues/6

**Fix Applied:**
- Added `AgentLaunchErrorCode` type
- Added `code`, `details`, `retryAfterMs` fields to AgentLaunchError
- Added `statusToCode()` helper function

---

## API Issues (Pending - fetchlaunchpaddao repo)

### API-001: `GET /api/agents/tokens` returns 404
**Status:** NOT FIXED (documentation issue in external docs)
**GitHub:** https://github.com/fetchai/launchpadDAO/issues/73

**Finding:** `/api/tokens` works, `/api/agents/tokens` does not exist.
**Action Needed:** Update external documentation to use correct path.

---

### API-002: `POST /api/agents/launch` returns 404
**Status:** NOT FIXED (documentation issue in external docs)
**GitHub:** https://github.com/fetchai/launchpadDAO/issues/74

**Finding:** `/api/agents/tokenize` works, `/api/agents/launch` does not exist.
**Action Needed:** Update external documentation to use correct path.

---

### API-003: Search API returns 500
**Status:** NOT FIXED
**GitHub:** https://github.com/fetchai/launchpadDAO/issues/75

**Finding:** Backend proxies to Agentverse which returns 422.
**Action Needed:** Fix request format or update Agentverse integration.

---

## Web Platform Issues (Pending - fetchlaunchpaddao repo)

### WEB-001: Search API 500 error on frontend
**Status:** PARTIALLY FIXED
**Note:** Token search via `/api/tokens?search=` works.

---

### WEB-002: Addresses not clickable/linked to explorer
**Status:** NOT FIXED
**GitHub:** https://github.com/fetchai/launchpadDAO/issues/76

**Finding:** Only transaction links implemented, not address links.
**Action Needed:** Add `ExplorerAddressLink` component.

---

## GitHub Issues Reference

### agent-launch-toolkit (tonyoconnell/agent-launch-toolkit)
| Issue | Title | Status |
|-------|-------|--------|
| [#1](https://github.com/tonyoconnell/agent-launch-toolkit/issues/1) | buy/sell commands not working | **CLOSED** |
| [#2](https://github.com/tonyoconnell/agent-launch-toolkit/issues/2) | scaffold command not registered | **CLOSED** |
| [#3](https://github.com/tonyoconnell/agent-launch-toolkit/issues/3) | Claude Code login prompt | **CLOSED** |
| [#4](https://github.com/tonyoconnell/agent-launch-toolkit/issues/4) | create_protocol error | **CLOSED** |
| [#5](https://github.com/tonyoconnell/agent-launch-toolkit/issues/5) | API shape mismatch | **CLOSED** |
| [#6](https://github.com/tonyoconnell/agent-launch-toolkit/issues/6) | AgentLaunchError missing fields | **CLOSED** |

### launchpadDAO (fetchai/launchpadDAO)
| Issue | Title | Status |
|-------|-------|--------|
| [#73](https://github.com/fetchai/launchpadDAO/issues/73) | /agents/tokens 404 | OPEN - Docs issue |
| [#74](https://github.com/fetchai/launchpadDAO/issues/74) | /agents/launch 404 | OPEN - Docs issue |
| [#75](https://github.com/fetchai/launchpadDAO/issues/75) | Search API 500 | OPEN |
| [#76](https://github.com/fetchai/launchpadDAO/issues/76) | Addresses not clickable | OPEN |

---

## Next Steps

1. **Commit the fixes** to agent-launch-toolkit
2. **Publish new npm versions** for agentlaunch and agentlaunch-sdk
3. **Update external docs** (landing page, etc.) to use correct API paths
4. **Fix launchpadDAO issues** (search API, address links)
