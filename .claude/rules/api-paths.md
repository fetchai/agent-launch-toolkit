# API Paths Reference (VERIFIED)

These paths have been tested against the live API and are the ONLY correct paths.
When writing code, tests, or documentation, ALWAYS use these exact paths.

## Base URL

```
https://agent-launch.ai/api
```

## Verified Endpoints

### Tokens

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/tokens` | List all tokens |
| `GET` | `/tokens/address/{address}` | Get token by contract address |
| `GET` | `/tokens/id/{id}` | Get token by numeric ID |
| `GET` | `/tokens/calculate-buy` | Simulate buy (params: address, fetAmount) |
| `GET` | `/tokens/calculate-sell` | Simulate sell (params: address, tokenAmount) |

### Agents

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/agents/tokenize` | Create token for an agent |
| `GET` | `/agents/my-agents` | List caller's Agentverse agents |
| `GET` | `/agents/token/{address}/holders` | Get token holder list |
| `POST` | `/agents/auth` | Exchange API key for JWT |

### Comments

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/comments/{address}` | Get comments for a token |
| `POST` | `/comments/{address}` | Post a comment |

### Platform

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/platform/stats` | Platform-wide statistics |

## WRONG vs CORRECT Paths

These mistakes are common. NEVER use the wrong paths:

| WRONG (will 404) | CORRECT |
|------------------|---------|
| `POST /tokenize` | `POST /agents/tokenize` |
| `GET /token/{address}` | `GET /tokens/address/{address}` |
| `GET /tokens/{address}` | `GET /tokens/address/{address}` |
| `GET /tokens/{id}` | `GET /tokens/id/{id}` |
| `GET /token/{address}/holders` | `GET /agents/token/{address}/holders` |
| `GET /my-agents` | `GET /agents/my-agents` |
| `POST /auth` | `POST /agents/auth` |
| `GET /stats` | `GET /platform/stats` |

## SDK Function to Path Mapping

| SDK Function | Correct Path |
|--------------|--------------|
| `listTokens()` | `GET /tokens` |
| `getToken(address)` | `GET /tokens/address/{address}` |
| `tokenize(params)` | `POST /agents/tokenize` |
| `calculateBuy(address, amount)` | `GET /tokens/calculate-buy` |
| `calculateSell(address, amount)` | `GET /tokens/calculate-sell` |
| `getTokenHolders(address)` | `GET /agents/token/{address}/holders` |
| `getComments(address)` | `GET /comments/{address}` |
| `postComment(params)` | `POST /comments/{address}` |
| `authenticate(key)` | `POST /agents/auth` |
| `getMyAgents()` | `GET /agents/my-agents` |
| `getPlatformStats()` | `GET /platform/stats` |

## Enforcement

When reviewing or writing code that makes API calls:
1. Check that the path matches this reference
2. If you see an old/wrong path, fix it immediately
3. Reference `docs/paths.md` for full documentation with examples
