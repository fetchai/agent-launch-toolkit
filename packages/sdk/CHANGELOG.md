# Changelog

All notable changes to `agentlaunch-sdk` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.15] - 2026-04-03

### Added

- **Wallet authentication** (`wallet-auth.ts`) — Obtain Agentverse API key from wallet private key
  - `authenticateWithWallet(config)` — Full authentication flow via accounts.fetch.ai
  - `deriveCosmosAddress(privateKey)` — Derive Cosmos address without authenticating
  - Implements ADR-036 signing format with 64-byte R||S signatures
  - Requires optional peer dependencies: `@cosmjs/crypto`, `bech32`
- **AgentLaunch.auth namespace** — Fluent API for wallet authentication
  - `al.auth.fromWallet(privateKey)` — Authenticate and get API key
  - `al.auth.deriveAddress(privateKey)` — Get wallet address
- **New types**: `WalletAuthConfig`, `WalletAuthResult`

---

## [0.2.14] - 2026-03-29

### Added

- **Connect module** (`connect.ts`) — Agent-to-agent messaging via outbox pattern
  - `deployConnectedAgent()` — Deploy agent with webhook proxy for external HTTPS services
  - `getConnectionStatus()` — Check agent connection health and message stats
  - `updateConnection()` — Update webhook URL, secrets, and agent code
  - `sendOutboxMessage()` — Queue messages for agent-to-agent delivery

### Fixed

- **Error serialization** — API errors now properly serialize with status codes and messages
- **Auth flow** — Fixed JWT exchange edge cases with malformed API keys
- **Agent listing** — Correctly handles `{ items: [...] }` response shape in all code paths
- **Client security** — Input validation on all URL parameters to prevent injection

---

## [0.1.0] - 2026-02-22

### Added

- **`AgentLaunchClient`** — Core HTTP client with typed `get()` and `post()` methods
  - Automatic `X-API-Key` header injection from `apiKey` config or `AGENTVERSE_API_KEY` env var
  - Exponential backoff retry on HTTP 429 (rate limit) with configurable `maxRetries` (default: 3)
  - Query-string builder that omits `undefined` values
  - Typed `AgentLaunchError` with `status` and `serverMessage` properties

- **Token operations** (`tokens.ts`)
  - `tokenize(params)` — Create a pending token record, receive `token_id` and `handoff_link`
  - `getToken(address)` — Fetch a deployed token by contract address
  - `listTokens(params?)` — List tokens with pagination, filtering, and sorting

- **Market operations** (`market.ts`)
  - `getTokenPrice(address)` — Get current bonding-curve price in FET
  - `getTokenHolders(address, holderAddress?)` — List holders or look up a specific wallet
  - `generateTradeLink(address, action, amount?)` — Generate pre-filled trade URL (positional args)
  - `generateTradeLinkFromOptions(address, opts?)` — Generate trade URL from options object

- **Handoff link generation** (`handoff.ts`)
  - `generateDeployLink(tokenId, baseUrl?)` — Deploy page URL for pending tokens
  - `generateTradeLink(address, opts?, baseUrl?)` — Trade page URL for deployed tokens
  - `generateBuyLink(address, amount?, baseUrl?)` — Buy link convenience wrapper
  - `generateSellLink(address, amount?, baseUrl?)` — Sell link convenience wrapper

- **Agent operations** (`agents.ts`)
  - `authenticate(apiKey)` — Exchange Agentverse API key for platform JWT
  - `getMyAgents()` — List Agentverse agents owned by the caller
  - `importFromAgentverse(apiKey)` — Import agents by Agentverse API key

- **`AgentLaunch` class** (`agentlaunch.ts`) — Fluent namespaced API
  - `al.tokens.tokenize()`, `al.tokens.getToken()`, `al.tokens.listTokens()`
  - `al.market.getTokenPrice()`, `al.market.getTokenHolders()`
  - `al.handoff.generateDeployLink()`, `al.handoff.generateBuyLink()`, `al.handoff.generateSellLink()`
  - `al.agents.authenticate()`, `al.agents.getMyAgents()`, `al.agents.importFromAgentverse()`

- **TypeScript types** (`types.ts`)
  - `AgentLaunchConfig`, `AgentLaunchError`
  - `TokenizeParams`, `TokenizeResponse`, `Token`, `TokenListParams`, `TokenListResponse`
  - `Holder`, `HolderListResponse`, `SingleHolderResponse`
  - `TradeAction`, `TradeLinkOptions`
  - `AgentAuthResponse`, `AgentverseAgent`, `MyAgentsResponse`, `ImportAgentverseResponse`

- **Dual ESM + CJS exports** — Ships as ESM primary with CJS wrapper for CommonJS consumers
- **Zero runtime dependencies** — Uses Node.js 18+ built-in `fetch()`
- **Full test suite** — 4 test files covering client, handoff, market, and token operations

### Platform Constants (immutable, set by deployed smart contracts)

| Constant | Value |
|----------|-------|
| `TARGET_LIQUIDITY` | 30,000 FET |
| `TOTAL_BUY_TOKENS` | 800,000,000 |
| `FEE_PERCENTAGE` | 2% — 100% to protocol treasury |
| `TOKEN_DEPLOYMENT_FEE` | 120 FET (read dynamically) |

[0.1.0]: https://github.com/fetchai/agent-launch-toolkit/releases/tag/v0.1.0
