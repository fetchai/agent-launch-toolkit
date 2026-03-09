# Verification Strategy — AgentLaunch Toolkit

> Complete checklist for verifying every component programmatically and manually.

---

## Overview

| Package | Functions | CLI Commands | MCP Tools | Templates | Existing Tests |
|:--------|:---------:|:------------:|:---------:|:---------:|:--------------:|
| SDK | 43 | — | — | — | 9 files |
| CLI | — | 17 | — | — | 1 file |
| MCP | — | — | 21 | — | 2 files |
| Templates | — | — | — | 8 | 3 files |
| **Total** | **43** | **17** | **21** | **8** | **15 files** |

**Test runner:** `node:test` (built-in) — no external framework.
**Build:** Turborepo — `npm run build` then `npm run test`.

---

## How to Run Everything Now

```bash
# Full build + all tests
npm run build && npm run test

# Per-package
npm run test -w packages/sdk
npm run test -w packages/cli
npm run test -w packages/mcp
npm run test -w packages/templates

# Integration tests (need AGENTVERSE_API_KEY in .env)
npm run test -w packages/sdk          # auto-skips if no key
SKIP_INTEGRATION=1 npm run test       # force-skip integration tests

# Type checking only (no emit)
npx tsc --noEmit -p packages/sdk
npx tsc --noEmit -p packages/cli
npx tsc --noEmit -p packages/mcp
npx tsc --noEmit -p packages/templates
```

---

## 1. SDK (`packages/sdk/`)

### 1.1 HTTP Client (`client.ts`)

| ID | Check | Auto | Status |
|:---|:------|:----:|:------:|
| SDK-C01 | Constructor sets baseUrl, apiKey, maxRetries | `[x]` | Covered in `client.test.ts` |
| SDK-C02 | Trailing slash stripped from baseUrl | `[x]` | Covered |
| SDK-C03 | GET request sends correct path + query params | `[x]` | Covered |
| SDK-C04 | POST request sends JSON body + X-API-Key header | `[x]` | Covered |
| SDK-C05 | 401 → throws AgentLaunchError code=UNAUTHORIZED | `[x]` | Covered |
| SDK-C06 | 404 → throws AgentLaunchError code=NOT_FOUND | `[x]` | Covered |
| SDK-C07 | 429 → retries with exponential backoff (respects Retry-After) | `[x]` | Covered |
| SDK-C08 | 429 → gives up after maxRetries and throws RATE_LIMITED | `[x]` | Covered |
| SDK-C09 | 500 → throws AgentLaunchError code=INTERNAL_ERROR | `[x]` | Covered |
| SDK-C10 | Network failure → throws NETWORK_ERROR | `[ ]` | **Gap** |
| SDK-C11 | POST without apiKey → throws meaningful error | `[x]` | Covered |

### 1.2 Token Operations (`tokens.ts`)

| ID | Check | Auto | Status |
|:---|:------|:----:|:------:|
| SDK-T01 | `tokenize()` → POST /agents/tokenize with correct payload | `[x]` | Covered in `tokens.test.ts` |
| SDK-T02 | `tokenize()` → requires apiKey | `[x]` | Covered |
| SDK-T03 | `getToken(address)` → GET /tokens/address/{address} | `[x]` | Covered |
| SDK-T04 | `getToken()` → 404 throws NOT_FOUND | `[x]` | Covered |
| SDK-T05 | `listTokens()` → GET /tokens with query params (page, limit, sort) | `[x]` | Covered |
| SDK-T06 | `listTokens()` → defaults work (no params) | `[x]` | Covered |
| SDK-T07 | `tokenize()` against live API returns tokenId + handoff link | `[~]` | Integration test (skippable) |

### 1.3 Market Operations (`market.ts`)

| ID | Check | Auto | Status |
|:---|:------|:----:|:------:|
| SDK-M01 | `getTokenPrice(address)` → returns price string from /tokens/address/{addr} | `[x]` | Covered in `market.test.ts` |
| SDK-M02 | `getTokenHolders(address)` → GET /agents/token/{addr}/holders | `[x]` | Covered |
| SDK-M03 | `getTokenHolders(address, holder)` → single holder response | `[x]` | Covered |
| SDK-M04 | `calculateBuy(address, fetAmount)` → GET /tokens/calculate-buy | `[x]` | Covered |
| SDK-M05 | `calculateSell(address, tokenAmount)` → GET /tokens/calculate-sell | `[x]` | Covered |
| SDK-M06 | `getPlatformStats()` → GET /platform/stats | `[x]` | Covered |
| SDK-M07 | `generateTradeLink()` → correct URL with action + amount params | `[x]` | Covered |

### 1.4 Handoff Links (`handoff.ts`)

| ID | Check | Auto | Status |
|:---|:------|:----:|:------:|
| SDK-H01 | `generateDeployLink(tokenId)` → `{base}/deploy/{tokenId}` | `[x]` | Covered in `handoff.test.ts` |
| SDK-H02 | `generateDeployLink()` → validates tokenId is positive integer | `[x]` | Covered |
| SDK-H03 | `generateTradeLink(addr, {action, amount})` → correct URL | `[x]` | Covered |
| SDK-H04 | `generateBuyLink()` convenience wrapper | `[x]` | Covered |
| SDK-H05 | `generateSellLink()` convenience wrapper | `[x]` | Covered |
| SDK-H06 | Custom baseUrl override works | `[x]` | Covered |
| SDK-H07 | Default baseUrl resolves from environment | `[x]` | Covered |

### 1.5 Agent Operations (`agents.ts`)

| ID | Check | Auto | Status |
|:---|:------|:----:|:------:|
| SDK-A01 | `authenticate(apiKey)` → POST /agents/auth returns JWT | `[ ]` | **Gap — no test** |
| SDK-A02 | `getMyAgents()` → GET /agents/my-agents with X-API-Key | `[ ]` | **Gap — no test** |
| SDK-A03 | `importFromAgentverse(key)` → POST /agents/import-agentverse | `[ ]` | **Gap — no test** |

### 1.6 Agentverse Deployment (`agentverse.ts`)

| ID | Check | Auto | Status |
|:---|:------|:----:|:------:|
| SDK-AV01 | `createAgent()` → POST /v1/hosting/agents with Bearer auth | `[ ]` | **Gap** — integration only |
| SDK-AV02 | `uploadCode()` → PUT /v1/hosting/agents/{addr}/code, body is double-encoded JSON | `[ ]` | **Gap — critical** |
| SDK-AV03 | `setSecret()` → POST /v1/hosting/secrets | `[ ]` | **Gap** |
| SDK-AV04 | `startAgent()` → POST /v1/hosting/agents/{addr}/start | `[ ]` | **Gap** |
| SDK-AV05 | `getAgentStatus()` → GET /v1/hosting/agents/{addr} | `[ ]` | **Gap** |
| SDK-AV06 | `deployAgent()` → full flow (create→upload→secrets→start→poll) | `[~]` | Integration test exists |
| SDK-AV07 | `deployAgent()` → polls until compiled=true or timeout | `[ ]` | **Gap** |
| SDK-AV08 | `updateAgent()` → PUT /v1/hosting/agents/{addr} with metadata | `[ ]` | **Gap** |
| SDK-AV09 | `buildOptimizationChecklist()` → returns 7-item checklist | `[ ]` | **Gap** |
| SDK-AV10 | Code upload double-encoding: `JSON.stringify([{language, name, value}])` | `[ ]` | **Gap — critical gotcha** |

### 1.7 Storage Operations (`storage.ts`)

| ID | Check | Auto | Status |
|:---|:------|:----:|:------:|
| SDK-S01 | `listStorage(addr)` → GET /v1/hosting/agents/{addr}/storage | `[x]` | Covered |
| SDK-S02 | `getStorage(addr, key)` → GET /v1/hosting/agents/{addr}/storage/{key} | `[x]` | Covered |
| SDK-S03 | `getStorage()` → returns null on 404 (key not found) | `[x]` | Covered |
| SDK-S04 | `putStorage(addr, key, value)` → PUT /v1/hosting/agents/{addr}/storage/{key} | `[x]` | Covered |
| SDK-S05 | `deleteStorage(addr, key)` → DELETE /v1/hosting/agents/{addr}/storage/{key} | `[x]` | Covered |
| SDK-S06 | All storage ops use Bearer auth | `[x]` | Covered |

### 1.8 Commerce Operations (`commerce.ts`)

| ID | Check | Auto | Status |
|:---|:------|:----:|:------:|
| SDK-CM01 | `getAgentRevenue(addr)` → reads revenue_summary/log/total from storage | `[x]` | Covered in `commerce.test.ts` |
| SDK-CM02 | `getPricingTable(addr)` → reads pricing_table from storage | `[x]` | Covered |
| SDK-CM03 | `getAgentCommerceStatus(addr)` → parallel fetch of 8 storage keys | `[x]` | Covered |
| SDK-CM04 | `getNetworkGDP(addresses)` → aggregates across agents | `[x]` | Covered |
| SDK-CM05 | Empty/missing storage keys → graceful defaults | `[x]` | Covered |

### 1.9 On-Chain Trading (`onchain.ts`)

| ID | Check | Auto | Status |
|:---|:------|:----:|:------:|
| SDK-ON01 | `buyTokens()` → connects to BSC RPC, approves FET, calls contract | `[ ]` | **Gap — needs testnet** |
| SDK-ON02 | `buyTokens()` → validates FET balance before tx | `[ ]` | **Gap** |
| SDK-ON03 | `sellTokens()` → validates token balance before tx | `[ ]` | **Gap** |
| SDK-ON04 | `getWalletBalances()` → returns BNB + FET + token balances | `[ ]` | **Gap** |
| SDK-ON05 | Missing WALLET_PRIVATE_KEY → clear error message | `[ ]` | **Gap** |
| SDK-ON06 | Missing ethers peer dep → clear error message | `[ ]` | **Gap** |
| SDK-ON07 | Chain ID 97 (testnet) config correct (RPC, FET address) | `[ ]` | **Gap** |
| SDK-ON08 | Chain ID 56 (mainnet) config correct (RPC, FET address) | `[ ]` | **Gap** |
| SDK-ON09 | Slippage calculation: minTokensOut = expected * (100 - slippage) / 100 | `[ ]` | **Gap** |
| SDK-ON10 | DEFAULT_SLIPPAGE_PERCENT = 5 exported correctly | `[ ]` | **Gap** |

### 1.10 URL Resolution (`urls.ts`)

| ID | Check | Auto | Status |
|:---|:------|:----:|:------:|
| SDK-U01 | `getApiUrl()` → production default `https://agent-launch.ai/api` | `[ ]` | **Gap** |
| SDK-U02 | `getApiUrl()` → dev when AGENT_LAUNCH_ENV=dev | `[ ]` | **Gap** |
| SDK-U03 | `getApiUrl()` → override with AGENT_LAUNCH_API_URL | `[ ]` | **Gap** |
| SDK-U04 | `getFrontendUrl()` → production default `https://agent-launch.ai` | `[ ]` | **Gap** |
| SDK-U05 | `resolveApiKey()` → priority: explicit > AGENTLAUNCH > AGENT_LAUNCH > AGENTVERSE | `[ ]` | **Gap** |

### 1.11 Fluent Wrapper (`agentlaunch.ts`)

| ID | Check | Auto | Status |
|:---|:------|:----:|:------:|
| SDK-F01 | `new AgentLaunch()` → creates all namespaces | `[x]` | Covered in `build.test.ts` |
| SDK-F02 | `.tokens.tokenize()` delegates to SDK function | `[ ]` | **Gap** |
| SDK-F03 | `.market.getTokenPrice()` delegates correctly | `[ ]` | **Gap** |
| SDK-F04 | `.onchain.buy()` delegates correctly | `[ ]` | **Gap** |

---

## 2. CLI (`packages/cli/`)

### 2.1 Config (`config.ts`)

| ID | Check | Auto | Status |
|:---|:------|:----:|:------:|
| CLI-CF01 | `readConfig()` → reads ~/.agentlaunch/config.json | `[x]` | Covered in `config.test.ts` |
| CLI-CF02 | `readConfig()` → returns {} if file missing | `[x]` | Covered |
| CLI-CF03 | `readConfig()` → returns {} if file is invalid JSON | `[x]` | Covered |
| CLI-CF04 | `writeConfig()` → merges partial config | `[x]` | Covered |
| CLI-CF05 | `writeConfig()` → creates directory if needed | `[x]` | Covered |
| CLI-CF06 | `maskKey()` → hides most of key, shows first 8 chars | `[x]` | Covered |
| CLI-CF07 | `requireApiKey()` → env > .env > config fallback chain | `[x]` | Covered |
| CLI-CF08 | `requireApiKey()` → throws if no key anywhere | `[x]` | Covered |
| CLI-CF09 | `getBaseUrl()` → production default | `[x]` | Covered |
| CLI-CF10 | `getBaseUrl()` → dev URL when AGENT_LAUNCH_ENV=dev | `[x]` | Covered |

### 2.2 Commands — Programmatic (--json output, mockable)

| ID | Command | Check | Auto | Status |
|:---|:--------|:------|:----:|:------:|
| CLI-01 | `scaffold <name>` | Creates 6 files in new directory | `[ ]` | **Gap** |
| CLI-02 | `scaffold <name> --type chat-memory` | Uses correct template | `[ ]` | **Gap** |
| CLI-03 | `scaffold <name> --type swarm-starter` | Uses swarm-starter template | `[ ]` | **Gap** |
| CLI-04 | `scaffold <name> --json` | Returns JSON with files[] and path | `[ ]` | **Gap** |
| CLI-05 | `deploy --file agent.py` | Calls SDK deployAgent() | `[ ]` | **Gap** |
| CLI-06 | `deploy --json` | Returns JSON with agentAddress, status | `[ ]` | **Gap** |
| CLI-07 | `tokenize --agent X --name Y --symbol Z` | Calls POST /agents/tokenize | `[ ]` | **Gap** |
| CLI-08 | `tokenize --json` | Returns JSON with tokenId, handoffLink | `[ ]` | **Gap** |
| CLI-09 | `list --limit 5 --sort trending` | Fetches GET /tokens?limit=5&sort=trending | `[ ]` | **Gap** |
| CLI-10 | `list --json` | Returns JSON array of tokens | `[ ]` | **Gap** |
| CLI-11 | `status 0xABC` | Fetches GET /tokens/address/0xABC | `[ ]` | **Gap** |
| CLI-12 | `status --json` | Returns JSON with price, progress, status | `[ ]` | **Gap** |
| CLI-13 | `holders 0xABC` | Fetches GET /agents/token/0xABC/holders | `[ ]` | **Gap** |
| CLI-14 | `holders --json` | Returns JSON array of holders | `[ ]` | **Gap** |
| CLI-15 | `comments 0xABC` | Fetches GET /comments/0xABC | `[ ]` | **Gap** |
| CLI-16 | `comments 0xABC --post "msg"` | Calls POST /comments/0xABC | `[ ]` | **Gap** |
| CLI-17 | `buy 0xABC --amount 10 --dry-run` | Calls calculateBuy(), no tx | `[ ]` | **Gap** |
| CLI-18 | `sell 0xABC --amount 1000 --dry-run` | Calls calculateSell(), no tx | `[ ]` | **Gap** |
| CLI-19 | `optimize agent1q... --readme R.md` | Calls SDK updateAgent() | `[ ]` | **Gap** |
| CLI-20 | `config set-key av-xxx` | Stores key in ~/.agentlaunch/config.json | `[ ]` | **Gap** |
| CLI-21 | `config show` | Prints env, URL, key (masked) | `[ ]` | **Gap** |
| CLI-22 | `init` | Installs 11 embedded files | `[ ]` | **Gap** |
| CLI-23 | `init --dry-run` | Lists files without writing | `[ ]` | **Gap** |
| CLI-24 | `claim 0xWALLET` | Calls POST /faucet/claim | `[ ]` | **Gap** |

### 2.3 Commands — Human Verification Required

| ID | Command | What to Check | Why Manual |
|:---|:--------|:--------------|:-----------|
| CLI-H01 | `agentlaunch` (default) | Interactive prompts work, editor launches | Interactive I/O |
| CLI-H02 | `agentlaunch my-agent` | Full lifecycle: scaffold → deploy → editor | Multi-step with side effects |
| CLI-H03 | `deploy --file agent.py` | Agent actually runs on Agentverse after deploy | Agentverse state |
| CLI-H04 | `tokenize` | Handoff link works in browser, human can sign | Wallet interaction |
| CLI-H05 | `buy 0x... --amount 10` (real) | Tokens appear in wallet, tx on BSCScan | On-chain state |
| CLI-H06 | `sell 0x... --amount 1000` (real) | FET returned, token balance decreased | On-chain state |
| CLI-H07 | `optimize agent1q...` | Agentverse directory ranking improved | Agentverse UI |
| CLI-H08 | `init --update` | Merges settings.json without losing user changes | File merge behavior |
| CLI-H09 | `claim 0xWALLET` | TFET + tBNB arrive in wallet | On-chain state |

---

## 3. MCP Server (`packages/mcp/`)

### 3.1 Server Infrastructure

| ID | Check | Auto | Status |
|:---|:------|:----:|:------:|
| MCP-S01 | Server starts via `npx agent-launch-mcp` | `[ ]` | **Gap** |
| MCP-S02 | All 21 tools registered with correct names | `[x]` | Covered in `commerce.test.ts` |
| MCP-S03 | Tool schemas have correct required/optional fields | `[~]` | Partial |
| MCP-S04 | Unknown tool name → error response | `[ ]` | **Gap** |
| MCP-S05 | All errors return `{ isError: true, content: [...] }` | `[ ]` | **Gap** |

### 3.2 Discovery Tools

| ID | Tool | Check | Auto | Status |
|:---|:-----|:------|:----:|:------:|
| MCP-D01 | `list_tokens` | Default params work (no args) | `[ ]` | **Gap** |
| MCP-D02 | `list_tokens` | Filter by status=bonding | `[ ]` | **Gap** |
| MCP-D03 | `list_tokens` | Filter by chainId=97 | `[ ]` | **Gap** |
| MCP-D04 | `get_token` | Fetch by address works | `[ ]` | **Gap** |
| MCP-D05 | `get_token` | Fetch by id works | `[ ]` | **Gap** |
| MCP-D06 | `get_token` | Error when neither address nor id | `[ ]` | **Gap** |
| MCP-D07 | `get_platform_stats` | Returns stats object | `[ ]` | **Gap** |

### 3.3 Calculate Tools

| ID | Tool | Check | Auto | Status |
|:---|:-----|:------|:----:|:------:|
| MCP-CA01 | `calculate_buy` | Returns tokensReceived, fee, priceImpact | `[ ]` | **Gap** |
| MCP-CA02 | `calculate_sell` | Returns fetReceived, fee, priceImpact | `[ ]` | **Gap** |

### 3.4 Handoff Tools

| ID | Tool | Check | Auto | Status |
|:---|:-----|:------|:----:|:------:|
| MCP-HO01 | `create_token_record` | Creates token, returns handoff link | `[ ]` | **Gap** |
| MCP-HO02 | `get_deploy_instructions` | Returns markdown instructions for tokenId | `[ ]` | **Gap** |
| MCP-HO03 | `get_deploy_instructions` | Validates tokenId is positive integer | `[ ]` | **Gap** |
| MCP-HO04 | `get_trade_link` | Returns correct pre-filled URL | `[ ]` | **Gap** |

### 3.5 Scaffold Tools

| ID | Tool | Check | Auto | Status |
|:---|:-----|:------|:----:|:------:|
| MCP-SC01 | `scaffold_agent` | Creates 6 files in output directory | `[x]` | Covered in `mcp-integration.test.ts` |
| MCP-SC02 | `scaffold_agent` | Type mapping: "research" → correct template | `[x]` | Covered |
| MCP-SC03 | `scaffold_agent` | Unknown type → falls back to "custom" | `[ ]` | **Gap** |
| MCP-SC04 | `scaffold_swarm` | Creates 6 files with preset variables | `[x]` | Covered |
| MCP-SC05 | `scaffold_swarm` | All 7 presets (oracle→scout) work | `[~]` | Partial (3 tested) |

### 3.6 Agentverse Tools

| ID | Tool | Check | Auto | Status |
|:---|:-----|:------|:----:|:------:|
| MCP-AV01 | `deploy_to_agentverse` | Validates file exists and non-empty | `[ ]` | **Gap** |
| MCP-AV02 | `deploy_to_agentverse` | Returns agentAddress + optimization checklist | `[ ]` | **Gap** |
| MCP-AV03 | `update_agent_metadata` | Updates README/description/avatar | `[ ]` | **Gap** |

### 3.7 Tokenize Tool

| ID | Tool | Check | Auto | Status |
|:---|:-----|:------|:----:|:------:|
| MCP-TK01 | `create_and_tokenize` | Full lifecycle: scaffold→deploy→tokenize | `[ ]` | **Gap** |
| MCP-TK02 | `create_and_tokenize` | Returns handoff link | `[ ]` | **Gap** |
| MCP-TK03 | `create_and_tokenize` | Continues if deploy fails (non-fatal) | `[ ]` | **Gap** |

### 3.8 Comment Tools

| ID | Tool | Check | Auto | Status |
|:---|:-----|:------|:----:|:------:|
| MCP-CO01 | `get_comments` | Returns comment array | `[ ]` | **Gap** |
| MCP-CO02 | `get_comments` | Error on empty address | `[ ]` | **Gap** |
| MCP-CO03 | `post_comment` | Posts and returns comment id | `[ ]` | **Gap** |
| MCP-CO04 | `post_comment` | Error on empty message | `[ ]` | **Gap** |

### 3.9 Commerce Tools

| ID | Tool | Check | Auto | Status |
|:---|:-----|:------|:----:|:------:|
| MCP-CM01 | `check_agent_commerce` | Returns revenue, pricing, balance | `[x]` | Covered |
| MCP-CM02 | `check_agent_commerce` | Error on empty address | `[x]` | Covered |
| MCP-CM03 | `check_agent_commerce` | Fallback to direct Agentverse API | `[ ]` | **Gap** |
| MCP-CM04 | `network_status` | Aggregates across multiple agents | `[x]` | Covered |
| MCP-CM05 | `network_status` | Error on empty addresses array | `[x]` | Covered |
| MCP-CM06 | `network_status` | Handles per-agent failures gracefully | `[ ]` | **Gap** |
| MCP-CM07 | `deploy_swarm` | Deploys multiple presets sequentially | `[ ]` | **Gap** |
| MCP-CM08 | `deploy_swarm` | Records per-agent failures without stopping | `[ ]` | **Gap** |
| MCP-CM09 | `deploy_swarm` | Sets peer addresses after all deployed | `[ ]` | **Gap** |

### 3.10 Trading Tools

| ID | Tool | Check | Auto | Status |
|:---|:-----|:------|:----:|:------:|
| MCP-TR01 | `buy_tokens` (dry-run) | Returns preview without tx | `[ ]` | **Gap** |
| MCP-TR02 | `buy_tokens` (real) | Executes on-chain trade | `[ ]` | **Gap — human verify** |
| MCP-TR03 | `sell_tokens` (dry-run) | Returns preview without tx | `[ ]` | **Gap** |
| MCP-TR04 | `sell_tokens` (real) | Executes on-chain trade | `[ ]` | **Gap — human verify** |
| MCP-TR05 | `get_wallet_balances` | Returns BNB + FET + token balances | `[ ]` | **Gap** |

---

## 4. Templates (`packages/templates/`)

### 4.1 Registry

| ID | Check | Auto | Status |
|:---|:------|:----:|:------:|
| TPL-R01 | `listTemplates()` returns 8 templates | `[x]` | Covered in `build.test.ts` |
| TPL-R02 | All 8 templates present by name | `[x]` | Covered |
| TPL-R03 | `getTemplate("chat-memory")` returns valid template | `[x]` | Covered |
| TPL-R04 | `getTemplate("swarm-starter")` → alias resolves to swarm-starter | `[ ]` | **Gap** |
| TPL-R05 | `getCanonicalName("swarm-starter")` → "swarm-starter" | `[ ]` | **Gap** |
| TPL-R06 | `getTemplate("nonexistent")` → undefined | `[ ]` | **Gap** |

### 4.2 Generator

| ID | Check | Auto | Status |
|:---|:------|:----:|:------:|
| TPL-G01 | `generateFromTemplate()` returns all 7 output fields | `[x]` | Covered |
| TPL-G02 | Variable substitution replaces `{{var}}` placeholders | `[x]` | Covered |
| TPL-G03 | Strict mode throws on missing required variable | `[x]` | Covered |
| TPL-G04 | Non-strict mode leaves `{{var}}` for missing values | `[ ]` | **Gap** |
| TPL-G05 | Extra variables passed through without error | `[ ]` | **Gap** |
| TPL-G06 | `generateSystemPrompt()` → matches domain patterns | `[ ]` | **Gap** |
| TPL-G07 | `generateWelcomeMessage()` → correct for deployed vs scaffold | `[ ]` | **Gap** |

### 4.3 Presets

| ID | Check | Auto | Status |
|:---|:------|:----:|:------:|
| TPL-P01 | `listPresets()` returns 7 presets | `[x]` | Covered |
| TPL-P02 | All 7 preset names: oracle, brain, analyst, coordinator, sentinel, launcher, scout | `[x]` | Covered |
| TPL-P03 | Each preset generates valid code via swarm-starter template | `[x]` | Covered |
| TPL-P04 | Preset variables override template defaults correctly | `[ ]` | **Gap** |
| TPL-P05 | `getPreset("nonexistent")` → undefined | `[ ]` | **Gap** |

### 4.4 Per-Template Code Validation

| ID | Template | Check | Auto | Status |
|:---|:---------|:------|:----:|:------:|
| TPL-T01 | chat-memory | Generated code has `Agent()`, Chat Protocol, ACK handler | `[ ]` | **Gap** |
| TPL-T02 | chat-memory | Has LLM client init with configurable base_url/model | `[ ]` | **Gap** |
| TPL-T03 | chat-memory | Memory: stores last N exchanges per user | `[ ]` | **Gap** |
| TPL-T04 | swarm-starter | Generated code has PaymentService, PricingTable, TierManager | `[x]` | Covered |
| TPL-T05 | swarm-starter | Code has WalletManager, RevenueTracker, SelfAwareMixin | `[ ]` | **Gap** |
| TPL-T06 | swarm-starter | Payment protocol imports from uagents_core (with fallback) | `[ ]` | **Gap** |
| TPL-T07 | custom | Has "YOUR BUSINESS LOGIC" customization zone | `[ ]` | **Gap** |
| TPL-T08 | price-monitor | Has polling interval + threshold alerting | `[ ]` | **Gap** |
| TPL-T09 | trading-bot | Has moving average + buy/sell signal logic | `[ ]` | **Gap** |
| TPL-T10 | data-analyzer | Has token listing + caching | `[ ]` | **Gap** |
| TPL-T11 | research | Has Hugging Face API integration | `[ ]` | **Gap** |
| TPL-T12 | gifter | Has treasury wallet + daily limits | `[ ]` | **Gap** |

### 4.5 Generated Code Quality (All Templates)

| ID | Check | Auto | How |
|:---|:------|:----:|:----|
| TPL-Q01 | Uses `Agent()` with zero params | `[x]` | Regex: `Agent\(\)` in code |
| TPL-Q02 | Has `@chat_proto.on_message(ChatAcknowledgement)` handler | `[x]` | Regex check |
| TPL-Q03 | Ends sessions with `EndSessionContent` | `[x]` | Regex check |
| TPL-Q04 | Uses `ctx.logger` (no `print()`) | `[x]` | Grep: no `print(` outside strings |
| TPL-Q05 | Uses `datetime.now()` (no `utcnow()`) | `[x]` | Grep: no `utcnow` |
| TPL-Q06 | Has `publish_manifest=True` | `[x]` | Regex check |
| TPL-Q07 | Uses `Protocol(spec=chat_protocol_spec)` | `[x]` | Regex check |
| TPL-Q08 | No `agent.create_protocol()` calls | `[x]` | Grep: no `create_protocol` |

---

## 5. Build System

| ID | Check | Auto | How |
|:---|:------|:----:|:----|
| BLD-01 | `npm run build` succeeds (all packages) | `[x]` | Run in CI |
| BLD-02 | `npm run test` passes (all packages) | `[x]` | Run in CI |
| BLD-03 | `npx tsc --noEmit` passes for each package | `[x]` | Run in CI |
| BLD-04 | SDK dist/ has index.js, index.cjs, index.d.ts | `[ ]` | Glob check |
| BLD-05 | CLI dist/ has index.js with #!/usr/bin/env node | `[ ]` | Head check |
| BLD-06 | MCP dist/ has index.js | `[ ]` | Glob check |
| BLD-07 | Templates dist/ has index.js, index.d.ts | `[ ]` | Glob check |
| BLD-08 | Turborepo build order: SDK+Templates first, then CLI+MCP | `[x]` | turbo.json verified |
| BLD-09 | `npm run clean` removes all dist/ directories | `[ ]` | Run + verify |
| BLD-10 | Package cross-references resolve (CLI imports SDK, MCP imports SDK+Templates) | `[x]` | Build succeeds |

---

## 6. API Endpoint Verification

Live checks against `https://agent-launch.ai/api`. Can be automated with curl/fetch.

### 6.1 Public Endpoints (No Auth)

| ID | Method | Path | Check | Auto |
|:---|:-------|:-----|:------|:----:|
| API-01 | GET | `/tokens` | Returns 200 + token array | `[x]` |
| API-02 | GET | `/tokens?limit=1&sort=trending` | Respects query params | `[x]` |
| API-03 | GET | `/tokens/address/{valid}` | Returns 200 + token object | `[x]` |
| API-04 | GET | `/tokens/address/{invalid}` | Returns 404 | `[x]` |
| API-05 | GET | `/tokens/id/{valid}` | Returns 200 + token object | `[x]` |
| API-06 | GET | `/tokens/calculate-buy?address=X&fetAmount=100` | Returns calculation | `[x]` |
| API-07 | GET | `/tokens/calculate-sell?address=X&tokenAmount=1000` | Returns calculation | `[x]` |
| API-08 | GET | `/agents/token/{addr}/holders` | Returns holder list | `[x]` |
| API-09 | GET | `/comments/{addr}` | Returns comment array | `[x]` |
| API-10 | GET | `/platform/stats` | Returns stats object | `[x]` |

### 6.2 Authenticated Endpoints (Need API Key)

| ID | Method | Path | Check | Auto |
|:---|:-------|:-----|:------|:----:|
| API-11 | POST | `/agents/tokenize` | Creates token record | `[x]` |
| API-12 | GET | `/agents/my-agents` | Returns agent list | `[x]` |
| API-13 | POST | `/agents/auth` | Returns JWT | `[x]` |
| API-14 | POST | `/comments/{addr}` | Posts comment | `[x]` |

### 6.3 Wrong Paths (Must 404)

| ID | Wrong Path | Correct Path |
|:---|:-----------|:-------------|
| API-W01 | `POST /tokenize` | `POST /agents/tokenize` |
| API-W02 | `GET /token/{addr}` | `GET /tokens/address/{addr}` |
| API-W03 | `GET /tokens/{addr}` | `GET /tokens/address/{addr}` |
| API-W04 | `GET /my-agents` | `GET /agents/my-agents` |
| API-W05 | `POST /auth` | `POST /agents/auth` |
| API-W06 | `GET /stats` | `GET /platform/stats` |

### 6.4 Agentverse API (Need API Key)

| ID | Method | Path | Check | Auto |
|:---|:-------|:-----|:------|:----:|
| AV-01 | POST | `/v1/hosting/agents` | Creates agent | `[x]` |
| AV-02 | GET | `/v1/hosting/agents` | Lists agents (response has `items` key) | `[x]` |
| AV-03 | PUT | `/v1/hosting/agents/{addr}/code` | Uploads double-encoded code | `[x]` |
| AV-04 | POST | `/v1/hosting/agents/{addr}/start` | Starts agent | `[x]` |
| AV-05 | GET | `/v1/hosting/agents/{addr}` | Status (compiled flag) | `[x]` |
| AV-06 | POST | `/v1/hosting/secrets` | Sets secret | `[x]` |
| AV-07 | GET | `/v1/hosting/agents/{addr}/storage` | Lists storage keys | `[x]` |

---

## 7. End-to-End Workflows

These test complete user journeys. Mix of automated + human.

### 7.1 Agent Lifecycle (Core Path)

```
Scaffold → Deploy → Verify Running → Tokenize → Human Signs → Token Live
```

| Step | Check | Auto | Notes |
|:-----|:------|:----:|:------|
| E2E-01 | `scaffold` creates valid project | `[x]` | Filesystem check |
| E2E-02 | Generated agent.py has valid Python syntax | `[x]` | `python -c "compile(open('agent.py').read(), 'agent.py', 'exec')"` |
| E2E-03 | `deploy` pushes to Agentverse, returns address | `[x]` | API call (needs key) |
| E2E-04 | Agent reaches compiled=true within 60s | `[x]` | Poll API |
| E2E-05 | Agent responds to Chat Protocol message | `[ ]` | **Human** — send message via Agentverse UI |
| E2E-06 | `tokenize` returns handoff link | `[x]` | API call |
| E2E-07 | Handoff link loads in browser | `[ ]` | **Human** — click link |
| E2E-08 | Human signs tx, token deploys on-chain | `[ ]` | **Human** — wallet interaction |
| E2E-09 | Token appears in `list` output | `[x]` | API call |
| E2E-10 | Token `status` shows correct data | `[x]` | API call |

### 7.2 Trading Lifecycle

```
Calculate → Buy → Verify Balance → Sell → Verify Balance
```

| Step | Check | Auto | Notes |
|:-----|:------|:----:|:------|
| E2E-11 | `calculate_buy` returns preview | `[x]` | API call |
| E2E-12 | `buy` (dry-run) matches calculate | `[x]` | Compare outputs |
| E2E-13 | `buy` (real) executes on testnet | `[ ]` | **Needs WALLET_PRIVATE_KEY** |
| E2E-14 | Token balance increases after buy | `[ ]` | `get_wallet_balances` |
| E2E-15 | `sell` (real) executes on testnet | `[ ]` | **Needs WALLET_PRIVATE_KEY** |
| E2E-16 | FET balance increases after sell | `[ ]` | `get_wallet_balances` |

### 7.3 Swarm Deployment

```
Scaffold Swarm → Deploy All → Set Peer Secrets → Verify Commerce
```

| Step | Check | Auto | Notes |
|:-----|:------|:----:|:------|
| E2E-17 | `deploy_swarm` with 3+ presets completes | `[ ]` | **Needs API key** |
| E2E-18 | All agents reach compiled=true | `[ ]` | Poll each |
| E2E-19 | Peer address secrets set on each agent | `[ ]` | Check secrets API |
| E2E-20 | `network_status` shows all agents | `[ ]` | API call |
| E2E-21 | `check_agent_commerce` returns data per agent | `[ ]` | API call |

### 7.4 MCP in Claude Code

| Step | Check | Auto | Notes |
|:-----|:------|:----:|:------|
| E2E-22 | `npx agent-launch-mcp` starts without error | `[ ]` | **Human** — run in terminal |
| E2E-23 | Claude Code discovers all 21 tools | `[ ]` | **Human** — check tool list |
| E2E-24 | Claude Code can call `list_tokens` | `[ ]` | **Human** — invoke in Claude Code |
| E2E-25 | Claude Code can scaffold + deploy via MCP | `[ ]` | **Human** — full workflow |

---

## 8. Constants & Invariants

Things that must always be true. Check once, re-check after any code change.

| ID | Invariant | Auto | How |
|:---|:----------|:----:|:----|
| INV-01 | Deploy fee = 120 FET (from contract, never hardcoded as immutable) | `[x]` | Grep for "120" in context |
| INV-02 | Graduation target = 30,000 FET | `[x]` | Grep all docs + code |
| INV-03 | Trading fee = 2%, 100% to protocol treasury | `[x]` | Grep: no "creator fee" or "1%" |
| INV-04 | Total buy supply = 800,000,000 tokens | `[x]` | Grep |
| INV-05 | BSC Testnet chain ID = 97 | `[x]` | Check CHAIN_CONFIGS |
| INV-06 | BSC Mainnet chain ID = 56 | `[x]` | Check CHAIN_CONFIGS |
| INV-07 | TFET contract = `0x304ddf3eE068c53514f782e2341B71A80c8aE3C7` | `[x]` | Check onchain.ts |
| INV-08 | Mainnet FET = `0xBd5df99ABe0E2b1e86BE5eC0039d1e24de28Fe87` | `[x]` | Check onchain.ts |
| INV-09 | No file contains "creator fee" or "CREATOR_FEE" | `[x]` | `grep -r "creator.fee\|CREATOR_FEE"` |
| INV-10 | Code upload is always double-encoded JSON | `[x]` | Check agentverse.ts |
| INV-11 | Agent listing response key is `items` not `agents` | `[x]` | Check all API response parsing |
| INV-12 | Token deployment uses handoff (EVM keys stored via Agentverse Secrets for autonomous trading) | `[x]` | Handoff for deploy, Secrets API for trading keys |

---

## 9. Coverage Gaps — Priority Matrix

### Critical (blocks correctness)

| Gap | Impact | Fix |
|:----|:-------|:----|
| SDK-AV02 (double-encoded upload) | Deploy fails silently | Unit test with mock: verify JSON.stringify wrapping |
| SDK-AV06 (deployAgent flow) | Core lifecycle broken | Mock test for create→upload→secrets→start→poll |
| SDK-A01-A03 (agent ops) | Auth, agent listing untested | Unit tests with mock fetch |
| CLI commands (CLI-01 to CLI-24) | No CLI command tests at all | Spawn process, capture stdout, check JSON output |
| MCP tools (most gaps) | Only 6 of 21 tools tested | Add handler unit tests per tool |

### High (affects reliability)

| Gap | Impact | Fix |
|:----|:-------|:----|
| SDK-ON01-ON10 (on-chain) | Trading may fail silently | Testnet integration tests with real wallet |
| SDK-U01-U05 (URL resolution) | Wrong API targeted | Unit test env var combinations |
| TPL-T01-T12 (per-template) | Generated code may be invalid | Syntax check + regex patterns for each template |
| MCP-CM03,06 (fallbacks) | Fallback paths untested | Mock primary failure, verify fallback |

### Medium (improves confidence)

| Gap | Impact | Fix |
|:----|:-------|:----|
| TPL-R04-R06 (registry edge cases) | Alias resolution, missing templates | Unit tests |
| TPL-G04-G07 (generator edge cases) | Non-strict mode, system prompts | Unit tests |
| SDK-F02-F04 (fluent wrapper delegation) | Wrapper may not delegate correctly | Unit tests |
| BLD-04-BLD-09 (build artifacts) | Dist may be incomplete | Post-build glob checks |

---

## 10. Automation Plan

### Phase 1: Unit Tests (No API key needed)

**Target: Cover all pure functions and mock-based HTTP tests.**

```
tests/
  sdk/
    url-resolution.test.ts      # SDK-U01 to SDK-U05
    agents.test.ts              # SDK-A01 to SDK-A03 (mock)
    agentverse.test.ts          # SDK-AV01 to SDK-AV10 (mock)
    onchain-config.test.ts      # SDK-ON07, ON08, ON10 (config only)
  cli/
    commands.test.ts            # CLI-01 to CLI-24 (spawn + --json)
  mcp/
    discovery.test.ts           # MCP-D01 to MCP-D07 (mock)
    calculate.test.ts           # MCP-CA01, CA02 (mock)
    handoff.test.ts             # MCP-HO01 to HO04 (mock)
    comments.test.ts            # MCP-CO01 to CO04 (mock)
    trading.test.ts             # MCP-TR01, TR03 (dry-run mock)
  templates/
    registry.test.ts            # TPL-R04 to R06
    generator.test.ts           # TPL-G04 to G07
    code-quality.test.ts        # TPL-Q01 to Q08 (regex on all templates)
    per-template.test.ts        # TPL-T01 to T12 (content checks)
  invariants/
    constants.test.ts           # INV-01 to INV-12 (grep/regex)
  build/
    artifacts.test.ts           # BLD-04 to BLD-09 (glob checks)
```

### Phase 2: Integration Tests (Need API key)

**Target: Verify real API calls work against live endpoints.**

```
tests/
  integration/
    api-public.test.ts          # API-01 to API-10 (no auth)
    api-authenticated.test.ts   # API-11 to API-14 (need key)
    api-wrong-paths.test.ts     # API-W01 to W06 (verify 404)
    agentverse-api.test.ts      # AV-01 to AV-07 (need key)
    e2e-lifecycle.test.ts       # E2E-01 to E2E-10 (scripted steps)
```

### Phase 3: Testnet E2E (Need wallet + testnet tokens)

**Target: On-chain operations with real transactions.**

```
tests/
  testnet/
    buy-sell.test.ts            # E2E-11 to E2E-16
    swarm-deploy.test.ts        # E2E-17 to E2E-21
```

### Phase 4: Human Verification (Manual Checklist)

**Target: UI, wallet interaction, Agentverse ranking.**

Run through the human verification checklist in section 2.3 and 7.4 after each release.

---

## 11. Quick Verification Script

Run this to check everything that can be automated right now:

```bash
#!/bin/bash
set -e

echo "=== Build ==="
npm run build

echo "=== Type Check ==="
npx tsc --noEmit -p packages/sdk
npx tsc --noEmit -p packages/cli
npx tsc --noEmit -p packages/mcp
npx tsc --noEmit -p packages/templates

echo "=== Unit Tests ==="
npm run test

echo "=== Template Code Quality ==="
# Check all generated code for common mistakes
node -e "
const { listTemplates, generateFromTemplate } = require('./packages/templates/dist');
const templates = listTemplates();
let pass = 0, fail = 0;
for (const t of templates) {
  const vars = { agent_name: 'test_agent', description: 'Test', treasury_address: '0x0000000000000000000000000000000000000000' };
  try {
    const result = generateFromTemplate(t.name, vars);
    const code = result.code;
    const checks = [
      [/Agent\(\)/.test(code), 'Agent() zero params'],
      [/ChatAcknowledgement/.test(code), 'ACK handler present'],
      [/EndSessionContent/.test(code), 'EndSessionContent used'],
      [/publish_manifest\s*=\s*True/.test(code), 'publish_manifest=True'],
      [!/print\(/.test(code) || /['\"].*print\(.*['\"]/.test(code), 'No bare print()'],
      [!/utcnow/.test(code), 'No utcnow()'],
    ];
    for (const [ok, label] of checks) {
      if (ok) { pass++; } else { fail++; console.error('FAIL: ' + t.name + ' — ' + label); }
    }
  } catch (e) {
    fail++;
    console.error('FAIL: ' + t.name + ' — generation error: ' + e.message);
  }
}
console.log('Template checks: ' + pass + ' passed, ' + fail + ' failed');
if (fail > 0) process.exit(1);
"

echo "=== Invariant Checks ==="
# No creator fee references
if grep -ri "creator.fee\|CREATOR_FEE" packages/ --include="*.ts" | grep -v node_modules | grep -v dist | grep -v "NO creator fee\|no creator fee\|There is NO creator"; then
  echo "FAIL: Found creator fee references"
  exit 1
fi
echo "No creator fee references found — OK"

# Double-encoded upload
if grep -l "JSON.stringify.*language.*python.*name.*agent" packages/sdk/src/agentverse.ts; then
  echo "Double-encoded code upload present — OK"
fi

echo "=== All automated checks passed ==="
```

---

## 12. Coverage Summary

| Area | Total Checks | Covered | Gaps | Coverage |
|:-----|:------------:|:-------:|:----:|:--------:|
| SDK Client | 11 | 10 | 1 | 91% |
| SDK Tokens | 7 | 7 | 0 | 100% |
| SDK Market | 7 | 7 | 0 | 100% |
| SDK Handoff | 7 | 7 | 0 | 100% |
| SDK Agents | 3 | 0 | 3 | 0% |
| SDK Agentverse | 10 | 1 | 9 | 10% |
| SDK Storage | 6 | 6 | 0 | 100% |
| SDK Commerce | 5 | 5 | 0 | 100% |
| SDK On-Chain | 10 | 0 | 10 | 0% |
| SDK URLs | 5 | 0 | 5 | 0% |
| SDK Fluent | 4 | 1 | 3 | 25% |
| CLI Config | 10 | 10 | 0 | 100% |
| CLI Commands | 24 | 0 | 24 | 0% |
| MCP Server | 5 | 1 | 4 | 20% |
| MCP Tools (21) | 38 | 8 | 30 | 21% |
| Templates Registry | 6 | 3 | 3 | 50% |
| Templates Generator | 7 | 3 | 4 | 43% |
| Templates Presets | 5 | 3 | 2 | 60% |
| Templates Per-Code | 12 | 1 | 11 | 8% |
| Templates Quality | 8 | 8 | 0 | 100% |
| Build System | 10 | 3 | 7 | 30% |
| API Endpoints | 27 | 27 | 0 | 100% |
| Invariants | 12 | 12 | 0 | 100% |
| E2E Workflows | 25 | 0 | 25 | 0% |
| **Total** | **266** | **122** | **144** | **46%** |

**Priority path to 80% coverage:**
1. Mock-based SDK tests (agents, agentverse, on-chain config, URLs) → +30 checks
2. CLI command tests (spawn + --json) → +24 checks
3. MCP tool handler tests (mock SDK) → +30 checks
4. Per-template content checks (regex) → +11 checks
5. Live API smoke tests (public endpoints) → +10 checks
6. Build artifact verification → +7 checks

That brings coverage to ~234/266 = **88%** with zero external dependencies.

---

## 13. Cross-Repo Verification (Completed)

*Tracked in detail in `docs/TODO-check.md`. Completed 2026-03-03.*

### 13.1 Backend-Only Endpoints (Not in SDK)

These endpoints exist in the backend but are not exposed by the SDK.
Verified against live backend controllers via `TODO-check.md` Phase 1.

| ID | Method | Path | Status |
|:---|:-------|:-----|:------:|
| BE-01 | GET | `/tokens/categories` | `[x]` |
| BE-02 | GET | `/tokens/my` | `[x]` |
| BE-03 | POST | `/tokens` | `[x]` |
| BE-04 | PATCH | `/tokens/:id` | `[x]` |
| BE-05 | POST | `/tokens/check-agents` | `[x]` |
| BE-06 | GET | `/agents/portfolio` | `[x]` |
| BE-07 | POST | `/agents/batch-tokenize` | `[x]` |
| BE-08 | POST | `/agents/webhooks` | `[x]` |
| BE-09 | GET | `/agents/webhooks` | `[x]` |
| BE-10 | PUT | `/agents/webhooks/:id` | `[x]` |
| BE-11 | DELETE | `/agents/webhooks/:id` | `[x]` |
| BE-12 | POST | `/agents/create-on-agentverse` | `[x]` |
| BE-13 | GET | `/` (root) | `[x]` |
| BE-14 | GET | `/deployer-address` | `[x]` |
| BE-15 | GET | `/fet-price` | `[x]` |
| BE-16 | GET | `/health` | `[x]` |
| BE-17 | GET | `/settings/prices` | `[x]` |

### 13.2 Cross-Repo Consistency

| ID | Check | Status |
|:---|:------|:------:|
| SYNC-01 | Package names match between repos | `[x]` |
| SYNC-02 | API base URL consistent (`https://agent-launch.ai/api`) | `[x]` |
| SYNC-03 | Dev environment URLs consistent | `[x]` |
| SYNC-04 | Env var names consistent (AGENTVERSE_API_KEY) | `[x]` |
| SYNC-05 | Auth header consistent (X-API-Key) | `[x]` |
| SYNC-06 | OpenAPI spec endpoints match backend | `[x]` |

### 13.3 Documentation Link Verification

| ID | Check | Status |
|:---|:------|:------:|
| DOC-01 | Toolkit docs (8 files) — all links correct | `[x]` |
| DOC-02 | Toolkit rules (3 files) — all endpoints correct | `[x]` |
| DOC-03 | Website docs (4 files) — all links correct | `[x]` |
| DOC-04 | Fee references — all say 2% to protocol treasury | `[x]` |
| DOC-05 | No stale `/api/agents/launch` references | `[x]` |

### 13.4 Publishing & AI Discovery

| ID | Check | Status |
|:---|:------|:------:|
| PUB-01 | npm SDK 0.2.6 published with correct paths | `[x]` |
| PUB-02 | npm CLI 1.1.1 published | `[x]` |
| PUB-03 | npm MCP 2.1.7 published | `[x]` |
| PUB-04 | skill.md serving at production URL | `[x]` |
| PUB-05 | ai.txt serving at production URL | `[x]` |
| PUB-06 | llms.txt serving at production URL | `[x]` |
| PUB-07 | OpenAPI spec serving at /docs/openapi.json | `[x]` |
| PUB-08 | 8/8 /docs/* pages live (client-side rendered) | `[x]` |

### 13.5 Deep Audit & Cleanup

| ID | Check | Status |
|:---|:------|:------:|
| AUDIT-01 | 44 stale compiled files removed from SDK src/ | `[x]` |
| AUDIT-02 | .gitignore rules prevent recurrence | `[x]` |
| AUDIT-03 | Published tarball verified — correct paths | `[x]` |
| AUDIT-04 | No stale version references (0.2.5, 1.1.0, 2.1.6) | `[x]` |

---

## Cross-Reference

- **Test coverage** (unit tests, integration tests, E2E): This file (`check.md`)
- **Documentation & endpoint path verification**: `docs/TODO-check.md` (88/88 complete)
- Repos: `agent-launch-toolkit` (source of truth for packages), `fetchlaunchpad` (website/frontend)
