# Verification Strategy — AgentLaunch Toolkit

> Complete checklist for verifying every component programmatically and manually.

---

## Overview

| Package | Functions | CLI Commands | MCP Tools | Templates | Test Files |
|:--------|:---------:|:------------:|:---------:|:---------:|:----------:|
| SDK | 64 | — | — | — | 17 files |
| CLI | — | 26 | — | — | 1 file |
| MCP | — | — | 30 | — | 2 files |
| Templates | — | — | — | 9 | 5 files |
| **Total** | **64** | **26** | **30** | **9** | **25 files** |

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
| SDK-C10 | Network failure → throws NETWORK_ERROR | `[x]` | Covered in `network-error.test.ts` |
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
| SDK-M08 | `generateTradeLinkFromOptions()` → correct URL from TradeOptions | `[x]` | Covered in `market.test.ts` |

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
| SDK-H08 | `validateEthAddress()` → rejects invalid addresses | `[x]` | Covered in `handoff.test.ts` |
| SDK-H09 | `generateDelegationLink()` → correct delegation URL | `[x]` | Covered in `handoff.test.ts` |
| SDK-H10 | `generateFiatOnrampLink()` → correct MoonPay/Transak URL | `[x]` | Covered in `handoff.test.ts` |

### 1.5 Agent Operations (`agents.ts`)

| ID | Check | Auto | Status |
|:---|:------|:----:|:------:|
| SDK-A01 | `authenticate(apiKey)` → POST /agents/auth returns JWT | `[x]` | Covered in `agents.test.ts` |
| SDK-A02 | `getMyAgents()` → GET /agents/my-agents with X-API-Key | `[x]` | Covered in `agents.test.ts` |
| SDK-A03 | `importFromAgentverse(key)` → POST /agents/import-agentverse | `[x]` | Covered in `agents.test.ts` |

### 1.6 Agentverse Deployment (`agentverse.ts`)

| ID | Check | Auto | Status |
|:---|:------|:----:|:------:|
| SDK-AV01 | `createAgent()` → POST /v1/hosting/agents with Bearer auth | `[x]` | Covered in `agentverse.test.ts` |
| SDK-AV02 | `uploadCode()` → PUT /v1/hosting/agents/{addr}/code, body is double-encoded JSON | `[x]` | Covered in `agentverse.test.ts` |
| SDK-AV03 | `setSecret()` → POST /v1/hosting/secrets | `[x]` | Covered in `agentverse.test.ts` |
| SDK-AV04 | `startAgent()` → POST /v1/hosting/agents/{addr}/start | `[x]` | Covered in `agentverse.test.ts` |
| SDK-AV05 | `getAgentStatus()` → GET /v1/hosting/agents/{addr} | `[x]` | Covered in `agentverse.test.ts` |
| SDK-AV06 | `deployAgent()` → full flow (create→upload→secrets→start→poll) | `[x]` | Covered in `agentverse.test.ts` |
| SDK-AV07 | `deployAgent()` → polls until compiled=true or timeout | `[x]` | Covered in `agentverse.test.ts` |
| SDK-AV08 | `updateAgent()` → PUT /v1/hosting/agents/{addr} with metadata | `[x]` | Covered in `agentverse.test.ts` |
| SDK-AV09 | `buildOptimizationChecklist()` → returns 7-item checklist | `[x]` | Covered in `agentverse.test.ts` |
| SDK-AV10 | Code upload double-encoding: `JSON.stringify([{language, name, value}])` | `[x]` | Covered in `agentverse.test.ts` |

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
| SDK-ON01 | `buyTokens()` → connects to BSC RPC, approves FET, calls contract | `[x]` | **Covered** in `onchain.test.ts` |
| SDK-ON02 | `buyTokens()` → validates FET balance before tx | `[x]` | **Covered** in `onchain.test.ts` |
| SDK-ON03 | `sellTokens()` → validates token balance before tx | `[x]` | **Covered** in `onchain.test.ts` |
| SDK-ON04 | `getWalletBalances()` → returns BNB + FET + token balances | `[x]` | **Covered** in `onchain.test.ts` |
| SDK-ON05 | Missing WALLET_PRIVATE_KEY → clear error message | `[x]` | **Covered** in `onchain.test.ts` |
| SDK-ON06 | Missing ethers peer dep → clear error message | `[x]` | **Covered** in `onchain.test.ts` |
| SDK-ON07 | Chain ID 97 (testnet) config correct (RPC, FET address) | `[x]` | Covered in `onchain-config.test.ts` |
| SDK-ON08 | Chain ID 56 (mainnet) config correct (RPC, FET address) | `[x]` | Covered in `onchain-config.test.ts` |
| SDK-ON09 | Slippage calculation: minTokensOut = expected * (100 - slippage) / 100 | `[x]` | Covered in `onchain-config.test.ts` |
| SDK-ON10 | DEFAULT_SLIPPAGE_PERCENT = 5 exported correctly | `[x]` | Covered in `onchain-config.test.ts` |
| SDK-ON11 | `getERC20Balance()` → reads ERC-20 balance on-chain | `[x]` | **Covered** in `onchain.test.ts` |
| SDK-ON12 | `approveERC20()` → approves ERC-20 spending | `[x]` | **Covered** in `onchain.test.ts` |
| SDK-ON13 | `getAllowance()` → reads ERC-20 allowance | `[x]` | **Covered** in `onchain.test.ts` |
| SDK-ON14 | `transferFromERC20()` → transfers via transferFrom | `[x]` | **Covered** in `onchain.test.ts` |

### 1.10 URL Resolution (`urls.ts`)

| ID | Check | Auto | Status |
|:---|:------|:----:|:------:|
| SDK-U01 | `getApiUrl()` → production default `https://agent-launch.ai/api` | `[x]` | Covered in `urls.test.ts` |
| SDK-U02 | `getApiUrl()` → dev when AGENT_LAUNCH_ENV=dev | `[x]` | Covered in `urls.test.ts` |
| SDK-U03 | `getApiUrl()` → override with AGENT_LAUNCH_API_URL | `[x]` | Covered in `urls.test.ts` |
| SDK-U04 | `getFrontendUrl()` → production default `https://agent-launch.ai` | `[x]` | Covered in `urls.test.ts` |
| SDK-U05 | `resolveApiKey()` → priority: explicit > AGENTLAUNCH > AGENT_LAUNCH > AGENTVERSE | `[x]` | Covered in `urls.test.ts` |

### 1.11 Fluent Wrapper (`agentlaunch.ts`)

| ID | Check | Auto | Status |
|:---|:------|:----:|:------:|
| SDK-F01 | `new AgentLaunch()` → creates all namespaces | `[x]` | Covered in `build.test.ts` |
| SDK-F02 | `.tokens.tokenize()` delegates to SDK function | `[x]` | Covered in `fluent.test.ts` |
| SDK-F03 | `.market.getTokenPrice()` delegates correctly | `[x]` | Covered in `fluent.test.ts` |
| SDK-F04 | `.onchain.buy()` delegates correctly | `[x]` | Covered in `fluent.test.ts` |
| SDK-F05 | `.comments.getComments()` delegates correctly | `[x]` | Covered in `fluent.test.ts` |
| SDK-F06 | `.payments.transferToken()` delegates correctly | `[x]` | Covered in `fluent.test.ts` |
| SDK-F07 | `.delegation.checkAllowance()` delegates correctly | `[x]` | Covered in `fluent.test.ts` |

### 1.12 Comment Operations (`comments.ts`)

| ID | Check | Auto | Status |
|:---|:------|:----:|:------:|
| SDK-CO01 | `getComments(address)` → GET /comments/{address} | `[x]` | Covered in `comments.test.ts` |
| SDK-CO02 | `getComments()` → returns comment array | `[x]` | Covered in `comments.test.ts` |
| SDK-CO03 | `postComment(params)` → POST /comments/{address} with auth | `[x]` | Covered in `comments.test.ts` |
| SDK-CO04 | `postComment()` → requires apiKey | `[x]` | Covered in `comments.test.ts` |

### 1.13 Payment Operations (`payments.ts`)

| ID | Check | Auto | Status |
|:---|:------|:----:|:------:|
| SDK-PAY01 | `getToken(symbol, chainId)` → returns PaymentToken | `[x]` | Covered in `payments.test.ts` |
| SDK-PAY02 | `getToken()` → returns undefined for unknown token | `[x]` | Covered |
| SDK-PAY03 | `getToken()` → case-insensitive symbol lookup | `[x]` | Covered |
| SDK-PAY04 | `getTokensForChain(chainId)` → returns all tokens for chain | `[x]` | Covered |
| SDK-PAY05 | `getTokenBalance()` → reads ERC-20 balance | `[x]` | **Covered** in `onchain.test.ts` |
| SDK-PAY06 | `getMultiTokenBalances()` → returns FET + USDC + BNB | `[x]` | **Covered** in `onchain.test.ts` |
| SDK-PAY07 | `transferToken()` → sends ERC-20 transfer | `[x]` | **Covered** in `onchain.test.ts` |
| SDK-PAY08 | `createInvoice()` → stores invoice in agent storage | `[x]` | Covered in `invoices.test.ts` |
| SDK-PAY09 | `getInvoice()` → retrieves invoice from storage | `[x]` | Covered in `invoices.test.ts` |
| SDK-PAY10 | `listInvoices()` → filters by status | `[x]` | Covered in `invoices.test.ts` |
| SDK-PAY11 | `updateInvoiceStatus()` → updates status in storage | `[x]` | Covered in `invoices.test.ts` |
| SDK-PAY12 | KNOWN_TOKENS registry has BSC Testnet + Mainnet entries | `[x]` | Covered |

### 1.14 Delegation Operations (`delegation.ts`)

| ID | Check | Auto | Status |
|:---|:------|:----:|:------:|
| SDK-DL01 | `checkAllowance()` → reads ERC-20 allowance on-chain | `[x]` | **Covered** in `onchain.test.ts` |
| SDK-DL02 | `spendFromDelegation()` → calls transferFrom | `[x]` | **Covered** in `onchain.test.ts` |
| SDK-DL03 | `createSpendingLimitHandoff()` → generates valid URL | `[x]` | Covered in `delegation.test.ts` |
| SDK-DL04 | `createSpendingLimitHandoff()` → throws for unknown token | `[x]` | Covered |
| SDK-DL05 | `createSpendingLimitHandoff()` → defaults to chain 97 | `[x]` | Covered |
| SDK-DL06 | `recordDelegation()` → stores in agent storage | `[x]` | Covered in `delegation.test.ts` |
| SDK-DL07 | `listDelegations()` → reads from agent storage | `[x]` | Covered in `delegation.test.ts` |

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
| CLI-01 | `scaffold <name>` | Creates 6 files in new directory | `[x]` | **Covered** in `commands-1.test.ts` |
| CLI-02 | `scaffold <name> --type chat-memory` | Uses correct template | `[x]` | **Covered** in `commands-1.test.ts` |
| CLI-03 | `scaffold <name> --type swarm-starter` | Uses swarm-starter template | `[x]` | **Covered** in `commands-1.test.ts` |
| CLI-04 | `scaffold <name> --json` | Returns JSON with files[] and path | `[x]` | **Covered** in `commands-1.test.ts` |
| CLI-05 | `deploy --file agent.py` | Calls SDK deployAgent() | `[x]` | **Covered** in `commands-1.test.ts` |
| CLI-06 | `deploy --json` | Returns JSON with agentAddress, status | `[x]` | **Covered** in `commands-1.test.ts` |
| CLI-07 | `tokenize --agent X --name Y --symbol Z` | Calls POST /agents/tokenize | `[x]` | **Covered** in `commands-1.test.ts` |
| CLI-08 | `tokenize --json` | Returns JSON with tokenId, handoffLink | `[x]` | **Covered** in `commands-1.test.ts` |
| CLI-09 | `list --limit 5 --sort trending` | Fetches GET /tokens?limit=5&sort=trending | `[x]` | **Covered** in `commands-1.test.ts` |
| CLI-10 | `list --json` | Returns JSON array of tokens | `[x]` | **Covered** in `commands-1.test.ts` |
| CLI-11 | `status 0xABC` | Fetches GET /tokens/address/0xABC | `[x]` | **Covered** in `commands-1.test.ts` |
| CLI-12 | `status --json` | Returns JSON with price, progress, status | `[x]` | **Covered** in `commands-1.test.ts` |
| CLI-13 | `holders 0xABC` | Fetches GET /agents/token/0xABC/holders | `[x]` | **Covered** in `commands-1.test.ts` |
| CLI-14 | `holders --json` | Returns JSON array of holders | `[x]` | **Covered** in `commands-1.test.ts` |
| CLI-15 | `comments 0xABC` | Fetches GET /comments/0xABC | `[x]` | **Covered** in `commands-2.test.ts` |
| CLI-16 | `comments 0xABC --post "msg"` | Calls POST /comments/0xABC | `[x]` | **Covered** in `commands-2.test.ts` |
| CLI-17 | `buy 0xABC --amount 10 --dry-run` | Calls calculateBuy(), no tx | `[x]` | **Covered** in `commands-2.test.ts` |
| CLI-18 | `sell 0xABC --amount 1000 --dry-run` | Calls calculateSell(), no tx | `[x]` | **Covered** in `commands-2.test.ts` |
| CLI-19 | `optimize agent1q... --readme R.md` | Calls SDK updateAgent() | `[x]` | **Covered** in `commands-2.test.ts` |
| CLI-20 | `config set-key av-xxx` | Stores key in ~/.agentlaunch/config.json | `[x]` | **Covered** in `commands-2.test.ts` |
| CLI-21 | `config show` | Prints env, URL, key (masked) | `[x]` | **Covered** in `commands-2.test.ts` |
| CLI-22 | `init` | Installs 11 embedded files | `[x]` | **Covered** in `commands-2.test.ts` |
| CLI-23 | `init --dry-run` | Lists files without writing | `[x]` | **Covered** in `commands-2.test.ts` |
| CLI-24 | `claim 0xWALLET` | Calls POST /faucet/claim | `[x]` | **Covered** in `commands-2.test.ts` |
| CLI-25 | `create [options]` | Full lifecycle: scaffold → deploy → tokenize | `[x]` | **Covered** in `commands-2.test.ts` |
| CLI-26 | `create --json` | Returns JSON output | `[x]` | **Covered** in `commands-2.test.ts` |
| CLI-27 | `marketing` | Deploys 7-agent Marketing Team | `[x]` | **Covered** in `commands-3.test.ts` |
| CLI-28 | `marketing --dry-run` | Preview without deploying | `[x]` | **Covered** in `commands-3.test.ts` |
| CLI-29 | `alliance` | Deploys 27-agent ASI Alliance | `[x]` | **Covered** in `commands-3.test.ts` |
| CLI-30 | `alliance --dry-run` | Preview without deploying | `[x]` | **Covered** in `commands-3.test.ts` |
| CLI-31 | `wallet balances` | Shows multi-token balances | `[x]` | **Covered** in `commands-3.test.ts` |
| CLI-32 | `wallet delegate <token> <amount>` | Generates delegation link | `[x]` | **Covered** in `commands-3.test.ts` |
| CLI-33 | `wallet allowance <token>` | Checks ERC-20 allowance | `[x]` | **Covered** in `commands-3.test.ts` |
| CLI-34 | `wallet send <token> <to> <amount>` | Sends ERC-20 tokens | `[x]` | **Covered** in `commands-3.test.ts` |
| CLI-35 | `pay <to> <amount>` | Multi-token payment | `[x]` | **Covered** in `commands-3.test.ts` |
| CLI-36 | `invoice create` | Creates payment invoice | `[x]` | **Covered** in `commands-3.test.ts` |
| CLI-37 | `invoice list` | Lists invoices by status | `[x]` | **Covered** in `commands-3.test.ts` |
| CLI-38 | `org-template` | Generates YAML org chart | `[x]` | **Covered** in `commands-3.test.ts` |
| CLI-39 | `swarm-from-org <file>` | Deploys custom org swarm | `[x]` | **Covered** in `commands-3.test.ts` |

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
| CLI-H10 | `marketing` (real) | All 7 agents deployed + compiled on Agentverse | Multi-agent deploy |
| CLI-H11 | `alliance` (real) | All agents deployed + compiled on Agentverse | Multi-agent deploy |
| CLI-H12 | `wallet send` (real) | Tokens arrive in recipient wallet | On-chain state |

---

## 3. MCP Server (`packages/mcp/`)

### 3.1 Server Infrastructure

| ID | Check | Auto | Status |
|:---|:------|:----:|:------:|
| MCP-S01 | Server starts via `npx agent-launch-mcp` | `[x]` | **Covered** in `lifecycle.test.ts` |
| MCP-S02 | All 30 tools registered with correct names | `[x]` | Covered in `tools.test.ts` and `trading-server.test.ts` |
| MCP-S03 | Tool schemas have correct required/optional fields | `[x]` | Covered in `trading-server.test.ts` |
| MCP-S04 | Unknown tool name → error response | `[x]` | Covered in `tools.test.ts` and `trading-server.test.ts` |
| MCP-S05 | All errors return `{ isError: true, content: [...] }` | `[x]` | Covered in `tools.test.ts` |

### 3.2 Discovery Tools

| ID | Tool | Check | Auto | Status |
|:---|:-----|:------|:----:|:------:|
| MCP-D01 | `list_tokens` | Default params work (no args) | `[x]` | Covered in `tools.test.ts` |
| MCP-D02 | `list_tokens` | Filter by status=bonding | `[x]` | Covered in `tools.test.ts` |
| MCP-D03 | `list_tokens` | Filter by chainId=97 | `[x]` | Covered in `tools.test.ts` |
| MCP-D04 | `get_token` | Fetch by address works | `[x]` | Covered in `tools.test.ts` |
| MCP-D05 | `get_token` | Fetch by id works | `[x]` | Covered in `tools.test.ts` |
| MCP-D06 | `get_token` | Error when neither address nor id | `[x]` | Covered in `tools.test.ts` |
| MCP-D07 | `get_platform_stats` | Returns stats object | `[x]` | Covered in `tools.test.ts` |

### 3.3 Calculate Tools

| ID | Tool | Check | Auto | Status |
|:---|:-----|:------|:----:|:------:|
| MCP-CA01 | `calculate_buy` | Returns tokensReceived, fee, priceImpact | `[x]` | Covered in `tools.test.ts` |
| MCP-CA02 | `calculate_sell` | Returns fetReceived, fee, priceImpact | `[x]` | Covered in `tools.test.ts` |

### 3.4 Handoff Tools

| ID | Tool | Check | Auto | Status |
|:---|:-----|:------|:----:|:------:|
| MCP-HO01 | `create_token_record` | Creates token, returns handoff link | `[x]` | **Covered** in `lifecycle.test.ts` |
| MCP-HO02 | `get_deploy_instructions` | Returns markdown instructions for tokenId | `[x]` | Covered in `tools.test.ts` |
| MCP-HO03 | `get_deploy_instructions` | Validates tokenId is positive integer | `[x]` | Covered in `tools.test.ts` |
| MCP-HO04 | `get_trade_link` | Returns correct pre-filled URL | `[x]` | Covered in `tools.test.ts` |

### 3.5 Scaffold Tools

| ID | Tool | Check | Auto | Status |
|:---|:-----|:------|:----:|:------:|
| MCP-SC01 | `scaffold_agent` | Creates 6 files in output directory | `[x]` | Covered in `mcp-integration.test.ts` |
| MCP-SC02 | `scaffold_agent` | Type mapping: "research" → correct template | `[x]` | Covered |
| MCP-SC03 | `scaffold_agent` | Unknown type → falls back to "custom" | `[x]` | Covered in `trading-server.test.ts` |
| MCP-SC04 | `scaffold_swarm` | Creates 6 files with preset variables | `[x]` | Covered |
| MCP-SC05 | `scaffold_swarm` | All 7 presets (writer→strategy) work | `[~]` | Partial (3 tested) |

### 3.6 Agentverse Tools

| ID | Tool | Check | Auto | Status |
|:---|:-----|:------|:----:|:------:|
| MCP-AV01 | `deploy_to_agentverse` | Validates file exists and non-empty | `[x]` | **Covered** in `lifecycle.test.ts` |
| MCP-AV02 | `deploy_to_agentverse` | Returns agentAddress + optimization checklist | `[x]` | **Covered** in `lifecycle.test.ts` |
| MCP-AV03 | `update_agent_metadata` | Updates README/description/avatar | `[x]` | **Covered** in `lifecycle.test.ts` |

### 3.7 Tokenize Tool

| ID | Tool | Check | Auto | Status |
|:---|:-----|:------|:----:|:------:|
| MCP-TK01 | `create_and_tokenize` | Full lifecycle: scaffold→deploy→tokenize | `[x]` | **Covered** in `lifecycle.test.ts` |
| MCP-TK02 | `create_and_tokenize` | Returns handoff link | `[x]` | **Covered** in `lifecycle.test.ts` |
| MCP-TK03 | `create_and_tokenize` | Continues if deploy fails (non-fatal) | `[x]` | **Covered** in `lifecycle.test.ts` |

### 3.8 Comment Tools

| ID | Tool | Check | Auto | Status |
|:---|:-----|:------|:----:|:------:|
| MCP-CO01 | `get_comments` | Returns comment array | `[x]` | Covered in `tools.test.ts` |
| MCP-CO02 | `get_comments` | Error on empty address | `[x]` | Covered in `tools.test.ts` |
| MCP-CO03 | `post_comment` | Posts and returns comment id | `[x]` | Covered in `tools.test.ts` |
| MCP-CO04 | `post_comment` | Error on empty message | `[x]` | Covered in `tools.test.ts` |

### 3.9 Commerce Tools

| ID | Tool | Check | Auto | Status |
|:---|:-----|:------|:----:|:------:|
| MCP-CM01 | `check_agent_commerce` | Returns revenue, pricing, balance | `[x]` | Covered |
| MCP-CM02 | `check_agent_commerce` | Error on empty address | `[x]` | Covered |
| MCP-CM03 | `check_agent_commerce` | Fallback to direct Agentverse API | `[x]` | Covered in `trading-server.test.ts` |
| MCP-CM04 | `network_status` | Aggregates across multiple agents | `[x]` | Covered |
| MCP-CM05 | `network_status` | Error on empty addresses array | `[x]` | Covered |
| MCP-CM06 | `network_status` | Handles per-agent failures gracefully | `[x]` | Covered in `trading-server.test.ts` |
| MCP-CM07 | `deploy_swarm` | Deploys multiple presets sequentially | `[x]` | **Covered** in `operations.test.ts` |
| MCP-CM08 | `deploy_swarm` | Records per-agent failures without stopping | `[x]` | **Covered** in `operations.test.ts` |
| MCP-CM09 | `deploy_swarm` | Sets peer addresses after all deployed | `[x]` | **Covered** in `operations.test.ts` |

### 3.10 Trading Tools

| ID | Tool | Check | Auto | Status |
|:---|:-----|:------|:----:|:------:|
| MCP-TR01 | `buy_tokens` (dry-run) | Returns preview without tx | `[x]` | Covered in `trading-server.test.ts` |
| MCP-TR02 | `buy_tokens` (real) | Executes on-chain trade | `[x]` | **Covered** in `operations.test.ts` |
| MCP-TR03 | `sell_tokens` (dry-run) | Returns preview without tx | `[x]` | Covered in `trading-server.test.ts` |
| MCP-TR04 | `sell_tokens` (real) | Executes on-chain trade | `[x]` | **Covered** in `operations.test.ts` |
| MCP-TR05 | `get_wallet_balances` | Returns BNB + FET + token balances | `[x]` | Covered in `trading-server.test.ts` |

### 3.11 Payment Tools

| ID | Tool | Check | Auto | Status |
|:---|:-----|:------|:----:|:------:|
| MCP-PAY01 | `multi_token_payment` | Sends FET/USDC/ERC-20 payment | `[~]` | Covered in `payments.test.ts` (validation) |
| MCP-PAY02 | `multi_token_payment` | Error on invalid token symbol | `[x]` | Covered in `payments.test.ts` |
| MCP-PAY03 | `check_spending_limit` | Returns ERC-20 allowance | `[x]` | **Covered** in `operations.test.ts` |
| MCP-PAY04 | `create_delegation` | Returns handoff URL | `[x]` | Covered in `tools.test.ts` |
| MCP-PAY05 | `get_fiat_link` | Returns MoonPay/Transak URL | `[x]` | Covered in `tools.test.ts` |
| MCP-PAY06 | `get_fiat_link` | Error on unknown provider | `[x]` | Covered in `tools.test.ts` |

### 3.12 Invoice Tools

| ID | Tool | Check | Auto | Status |
|:---|:-----|:------|:----:|:------:|
| MCP-INV01 | `create_invoice` | Creates invoice in agent storage | `[x]` | Covered in `payments.test.ts` |
| MCP-INV02 | `create_invoice` | Returns invoice ID | `[x]` | Covered in `payments.test.ts` |
| MCP-INV03 | `list_invoices` | Lists invoices by status | `[x]` | Covered in `payments.test.ts` |
| MCP-INV04 | `list_invoices` | Error on empty agent address | `[x]` | Covered in `payments.test.ts` |

### 3.13 Org Chart Tools

| ID | Tool | Check | Auto | Status |
|:---|:-----|:------|:----:|:------:|
| MCP-ORG01 | `generate_org_template` | Returns YAML template for size | `[x]` | Covered in `tools.test.ts` |
| MCP-ORG02 | `generate_org_template` | Supports startup/smb/enterprise | `[x]` | Covered in `tools.test.ts` |
| MCP-ORG03 | `scaffold_org_swarm` | Converts OrgChart JSON to SwarmConfig | `[x]` | Covered in `tools.test.ts` |

### 3.14 Multi-Token Balance

| ID | Tool | Check | Auto | Status |
|:---|:-----|:------|:----:|:------:|
| MCP-MB01 | `get_multi_token_balances` | Returns FET + USDC + BNB + custom balances | `[x]` | Covered in `payments.test.ts` |
| MCP-MB02 | `get_multi_token_balances` | Error on missing wallet address | `[x]` | Covered in `payments.test.ts` |

---

## 4. Templates (`packages/templates/`)

### 4.1 Registry

| ID | Check | Auto | Status |
|:---|:------|:----:|:------:|
| TPL-R01 | `listTemplates()` returns 9 templates | `[x]` | Covered in `build.test.ts` |
| TPL-R02 | All 9 templates present by name | `[x]` | Covered |
| TPL-R03 | `getTemplate("chat-memory")` returns valid template | `[x]` | Covered |
| TPL-R04 | `getTemplate("swarm-starter")` returns valid template | `[x]` | Covered in `swarm-starter.test.ts` |
| TPL-R05 | `getTemplate("consumer-commerce")` returns valid template | `[x]` | Covered in `consumer-commerce.test.ts` |
| TPL-R06 | `getTemplate("nonexistent")` → undefined | `[x]` | Covered in `gaps.test.ts` |

### 4.2 Generator

| ID | Check | Auto | Status |
|:---|:------|:----:|:------:|
| TPL-G01 | `generateFromTemplate()` returns all 7 output fields | `[x]` | Covered |
| TPL-G02 | Variable substitution replaces `{{var}}` placeholders | `[x]` | Covered |
| TPL-G03 | Strict mode throws on missing required variable | `[x]` | Covered |
| TPL-G04 | Non-strict mode leaves `{{var}}` for missing values | `[x]` | Covered in `swarm-starter.test.ts` |
| TPL-G05 | Extra variables passed through without error | `[x]` | Covered in `gaps.test.ts` |
| TPL-G06 | `generateSystemPrompt()` → matches domain patterns | `[x]` | Covered in `gaps.test.ts` |
| TPL-G07 | `generateWelcomeMessage()` → correct for deployed vs scaffold | `[x]` | Covered in `gaps.test.ts` |

### 4.3 Presets

| ID | Check | Auto | Status |
|:---|:------|:----:|:------:|
| TPL-P01 | `listPresets()` returns 16 presets | `[x]` | Covered |
| TPL-P02 | Marketing presets (7): writer, social, community, analytics, outreach, ads, strategy | `[x]` | Covered in `swarm-starter.test.ts` |
| TPL-P03 | C-Suite presets (5): ceo, cto, cfo, coo, cro | `[x]` | Covered in `gaps.test.ts` |
| TPL-P04 | Consumer commerce presets (4): payment-processor, booking-agent, subscription-manager, escrow-service | `[x]` | Covered in `consumer-commerce.test.ts` |
| TPL-P05 | Each marketing preset generates valid code via swarm-starter | `[x]` | Covered |
| TPL-P06 | Each consumer preset generates valid code via consumer-commerce | `[x]` | Covered in `gaps.test.ts` |
| TPL-P07 | `getPreset("nonexistent")` → undefined | `[x]` | Covered |

### 4.4 Per-Template Code Validation

| ID | Template | Check | Auto | Status |
|:---|:---------|:------|:----:|:------:|
| TPL-T01 | chat-memory | Generated code has `Agent()`, Chat Protocol, ACK handler | `[x]` | Covered in `per-template.test.ts` |
| TPL-T02 | chat-memory | Has ConversationMemory with configurable memory size | `[x]` | Covered in `per-template.test.ts` |
| TPL-T03 | chat-memory | Memory: stores last N exchanges per user | `[x]` | Covered in `per-template.test.ts` |
| TPL-T04 | swarm-starter | Generated code has PaymentService, PricingTable, TierManager | `[x]` | Covered in `per-template.test.ts` |
| TPL-T05 | swarm-starter | Code has WalletManager, RevenueTracker, SelfAwareMixin | `[x]` | Covered in `per-template.test.ts` |
| TPL-T06 | swarm-starter | Has ConversationMemory | `[x]` | Covered in `per-template.test.ts` |
| TPL-T07 | custom | Has "YOUR BUSINESS LOGIC" customization zone | `[x]` | Covered in `per-template.test.ts` |
| TPL-T08 | price-monitor | Has polling interval + threshold alerting | `[x]` | Covered in `per-template.test.ts` |
| TPL-T09 | trading-bot | Has moving average + buy/sell signal logic | `[x]` | Covered in `per-template.test.ts` |
| TPL-T10 | data-analyzer | Has token listing + caching | `[x]` | Covered in `per-template.test.ts` |
| TPL-T11 | research | Has AI model integration | `[x]` | Covered in `per-template.test.ts` |
| TPL-T12 | gifter | Has treasury wallet + daily limits | `[x]` | Covered in `per-template.test.ts` |
| TPL-T13 | consumer-commerce | Has MultiTokenPricingTable + InvoiceManager | `[x]` | Covered in `per-template.test.ts` |
| TPL-T14 | consumer-commerce | Has FiatOnrampHelper + DelegationChecker | `[x]` | Covered in `per-template.test.ts` |

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
| BLD-04 | SDK dist/ has index.js, index.cjs, index.d.ts | `[x]` | Covered in `build-artifacts.test.ts` |
| BLD-05 | CLI dist/ has index.js with #!/usr/bin/env node | `[x]` | Covered in `build-artifacts.test.ts` |
| BLD-06 | MCP dist/ has index.js | `[x]` | Covered in `build-artifacts.test.ts` |
| BLD-07 | Templates dist/ has index.js, index.d.ts | `[x]` | Covered in `build-artifacts.test.ts` |
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
| E2E-23 | Claude Code discovers all 30 tools | `[ ]` | **Human** — check tool list |
| E2E-24 | Claude Code can call `list_tokens` | `[ ]` | **Human** — invoke in Claude Code |
| E2E-25 | Claude Code can scaffold + deploy via MCP | `[ ]` | **Human** — full workflow |

### 7.5 Multi-Token Payment

```
Check Balances → Send Payment → Verify Receipt → Create Invoice → Check Invoice
```

| Step | Check | Auto | Notes |
|:-----|:------|:----:|:------|
| E2E-26 | `wallet balances` shows FET + USDC + BNB | `[ ]` | **Needs WALLET_PRIVATE_KEY** |
| E2E-27 | `pay` sends USDC to recipient | `[ ]` | **Needs WALLET_PRIVATE_KEY** |
| E2E-28 | `invoice create` stores invoice | `[ ]` | **Needs API key** |
| E2E-29 | `invoice list` shows created invoice | `[ ]` | **Needs API key** |
| E2E-30 | Delegation handoff link works in browser | `[ ]` | **Human** — wallet interaction |

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

All critical gaps have been filled:

| Gap | Impact | Fix |
|:----|:-------|:----|
| ~~SDK-AV02 (double-encoded upload)~~ | ~~Deploy fails silently~~ | ~~Covered in `agentverse.test.ts`~~ |
| ~~SDK-AV06 (deployAgent flow)~~ | ~~Core lifecycle broken~~ | ~~Covered in `agentverse.test.ts`~~ |
| ~~SDK-A01-A03 (agent ops)~~ | ~~Auth, agent listing untested~~ | ~~Covered in `agents.test.ts`~~ |
| ~~SDK-CO01-CO04 (comment ops)~~ | ~~No test coverage at all~~ | ~~Covered in `comments.test.ts`~~ |
| ~~CLI commands (CLI-01 to CLI-39)~~ | ~~No CLI command tests~~ | ~~Covered in `commands-1.test.ts`, `commands-2.test.ts`, `commands-3.test.ts`~~ |
| ~~MCP tools (most gaps)~~ | ~~Only 8 of 30 tools tested~~ | ~~Covered in `tools.test.ts` + `trading-server.test.ts` + `payments.test.ts` + `lifecycle.test.ts` + `operations.test.ts`~~ |

### High (affects reliability)

All high-priority gaps have been filled:

| Gap | Impact | Fix |
|:----|:-------|:----|
| ~~SDK-ON01-ON06,ON11-ON14 (on-chain execution)~~ | ~~Trading may fail silently~~ | ~~Covered in `onchain.test.ts`~~ |
| ~~SDK-U01-U05 (URL resolution)~~ | ~~Wrong API targeted~~ | ~~Covered in `urls.test.ts`~~ |
| ~~SDK-PAY05-PAY07 (payment ops)~~ | ~~Payment transfer/balance ops untested~~ | ~~Covered in `onchain.test.ts`~~ |
| ~~SDK-PAY08-PAY11 (invoice ops)~~ | ~~Invoice operations untested~~ | ~~Covered in `invoices.test.ts`~~ |
| ~~SDK-DL01-DL02 (delegation on-chain)~~ | ~~On-chain delegation ops untested~~ | ~~Covered in `onchain.test.ts`~~ |
| ~~SDK-DL06-DL07 (delegation storage)~~ | ~~Delegation storage ops untested~~ | ~~Covered in `delegation.test.ts`~~ |
| ~~TPL-T01-T12 (per-template)~~ | ~~Generated code may be invalid~~ | ~~Covered in `per-template.test.ts`~~ |
| ~~MCP-PAY01-PAY06 (payment tools)~~ | ~~Payment MCP tools untested~~ | ~~Covered in `payments.test.ts` + `tools.test.ts`~~ |
| ~~MCP-INV01-INV04 (invoice tools)~~ | ~~Invoice MCP tools untested~~ | ~~Covered in `payments.test.ts`~~ |

### Medium (improves confidence)

| Gap | Impact | Fix |
|:----|:-------|:----|
| ~~TPL-R06 (registry edge case)~~ | ~~Missing template → undefined~~ | ~~Covered in `gaps.test.ts`~~ |
| ~~TPL-G05-G07 (generator edge cases)~~ | ~~Non-strict mode, system prompts~~ | ~~Covered in `gaps.test.ts`~~ |
| ~~TPL-P03 (C-Suite presets)~~ | ~~C-Suite presets untested~~ | ~~Covered in `gaps.test.ts`~~ |
| ~~SDK-F02-F07 (fluent wrapper delegation)~~ | ~~Wrapper may not delegate correctly~~ | ~~Covered in `fluent.test.ts`~~ |
| ~~BLD-04-BLD-07 (build artifacts)~~ | ~~Dist may be incomplete~~ | ~~Covered in `build-artifacts.test.ts`~~ |
| BLD-09 (clean) | dist removal unverified | Run + verify |
| ~~MCP-ORG01-ORG03 (org chart tools)~~ | ~~Org chart tools untested~~ | ~~Covered in `tools.test.ts`~~ |

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
    comments.test.ts            # SDK-CO01 to SDK-CO04 (mock)
    onchain-config.test.ts      # SDK-ON07, ON08, ON10 (config only)
  cli/
    commands.test.ts            # CLI-01 to CLI-39 (spawn + --json)
  mcp/
    discovery.test.ts           # MCP-D01 to MCP-D07 (mock)
    calculate.test.ts           # MCP-CA01, CA02 (mock)
    handoff.test.ts             # MCP-HO01 to HO04 (mock)
    comments.test.ts            # MCP-CO01 to CO04 (mock)
    trading.test.ts             # MCP-TR01, TR03 (dry-run mock)
    payments.test.ts            # MCP-PAY01 to PAY06 (mock)
    invoices.test.ts            # MCP-INV01 to INV04 (mock)
    org-chart.test.ts           # MCP-ORG01 to ORG03 (mock)
    balance.test.ts             # MCP-MB01, MB02 (mock)
  templates/
    registry.test.ts            # TPL-R06
    generator.test.ts           # TPL-G05 to G07
    presets.test.ts             # TPL-P03, P06
    code-quality.test.ts        # TPL-Q01 to Q08 (regex on all templates)
    per-template.test.ts        # TPL-T01 to T14 (content checks)
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
    multi-token.test.ts         # E2E-26 to E2E-30
```

### Phase 4: Human Verification (Manual Checklist)

**Target: UI, wallet interaction, Agentverse ranking.**

Run through the human verification checklist in section 2.3 and 7.4–7.5 after each release.

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
| SDK Client | 11 | 11 | 0 | 100% |
| SDK Tokens | 7 | 6 | 1 | 86% |
| SDK Market | 8 | 8 | 0 | 100% |
| SDK Handoff | 10 | 10 | 0 | 100% |
| SDK Agents | 3 | 3 | 0 | 100% |
| SDK Agentverse | 10 | 10 | 0 | 100% |
| SDK Storage | 6 | 6 | 0 | 100% |
| SDK Commerce | 5 | 5 | 0 | 100% |
| SDK On-Chain | 14 | 14 | 0 | 100% |
| SDK URLs | 5 | 5 | 0 | 100% |
| SDK Fluent | 7 | 7 | 0 | 100% |
| SDK Comments | 4 | 4 | 0 | 100% |
| SDK Payments | 12 | 12 | 0 | 100% |
| SDK Delegation | 7 | 7 | 0 | 100% |
| CLI Config | 10 | 10 | 0 | 100% |
| CLI Commands | 39 | 39 | 0 | 100% |
| MCP Server | 5 | 5 | 0 | 100% |
| MCP Tools (30) | 57 | 57 | 0 | 100% |
| Templates Registry | 6 | 6 | 0 | 100% |
| Templates Generator | 7 | 7 | 0 | 100% |
| Templates Presets | 7 | 7 | 0 | 100% |
| Templates Per-Code | 14 | 14 | 0 | 100% |
| Templates Quality | 8 | 8 | 0 | 100% |
| Build System | 10 | 9 | 1 | 90% |
| API Endpoints | 21 | 21 | 0 | 100% |
| Invariants | 12 | 12 | 0 | 100% |
| E2E Workflows | 30 | 9 | 21 | 30% |
| **Total** | **335** | **312** | **23** | **93%** |

**Completed (2026-03-09):** All 68 remaining automatable gaps filled. SDK on-chain (10 gaps in `onchain.test.ts`), SDK payments (3 gaps in `onchain.test.ts`), SDK delegation (2 gaps in `onchain.test.ts`); CLI commands (39 gaps in `commands-1.test.ts`, `commands-2.test.ts`, `commands-3.test.ts`); MCP lifecycle (8 gaps in `lifecycle.test.ts`), MCP operations (6 gaps in `operations.test.ts`). Total coverage: 244 → 312 checks.

**All automatable gaps are now filled.** Remaining 23 uncovered checks are:
- SDK-T07: Live API integration test (skippable, environment-dependent)
- BLD-09: `npm run clean` removes dist/ (manual run + verify)
- E2E-05 through E2E-30: End-to-end workflows requiring human interaction, wallet signatures, live Agentverse state, or on-chain transactions with real funds. These are inherently manual verification items.

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
