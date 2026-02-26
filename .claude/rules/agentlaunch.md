# AgentLaunch Platform Rules

When working with AgentLaunch tokens and the platform API:

## Constants (from smart contracts -- never change)

- Deploy fee: 120 FET (read from contract, can change via multi-sig)
- Graduation: 30,000 FET liquidity -> auto DEX listing
- Trading fee: 2% -> 100% to REVENUE_ACCOUNT (protocol treasury)
- NO creator fee. The 2% fee has NO split. All to protocol.
- Total buy supply: 800,000,000 tokens per token
- Buy price difference: 1000 (10x)
- Default chain: BSC (testnet=97, mainnet=56)

## API Authentication

- Use `X-API-Key` header with Agentverse API key
- Key is read from `.env` AGENTVERSE_API_KEY
- No wallet signatures needed for API calls
- Redis caches validation for 5 minutes

## API Base URLs

- Production (default): `https://agent-launch.ai/api`
- Dev: `https://launchpad-backend-dev-1056182620041.us-central1.run.app`
- Set `AGENT_LAUNCH_ENV=dev` to use dev URLs
- Direct override: set `AGENT_LAUNCH_API_URL`

## Handoff Protocol

- Agents NEVER hold private keys
- All on-chain actions go through handoff links
- Deploy link: `https://agent-launch.ai/deploy/{tokenId}`
- Trade link: `https://agent-launch.ai/trade/{tokenAddress}?action=buy&amount=100`

## Key Endpoints (VERIFIED - always use these exact paths)

```
GET   /tokens                             List tokens
GET   /tokens/address/{address}           Token details by address
GET   /tokens/id/{id}                     Token details by ID
GET   /tokens/calculate-buy               Preview buy
GET   /tokens/calculate-sell              Preview sell

POST  /agents/tokenize                    Create token -> handoff link
GET   /agents/my-agents                   List your agents
GET   /agents/token/{address}/holders     Token holder list
POST  /agents/auth                        Exchange API key for JWT

GET   /comments/{address}                 Get comments
POST  /comments/{address}                 Post comment

GET   /platform/stats                     Platform stats
```

## Common Path Mistakes (NEVER use these)

| WRONG | CORRECT |
|-------|---------|
| `POST /tokenize` | `POST /agents/tokenize` |
| `GET /token/{address}` | `GET /tokens/address/{address}` |
| `GET /token/{address}/holders` | `GET /agents/token/{address}/holders` |
| `GET /my-agents` | `GET /agents/my-agents` |
| `POST /auth` | `POST /agents/auth` |

## Fee Rule (Enforced)

The 2% trading fee goes 100% to REVENUE_ACCOUNT (protocol treasury).
There is NO creator fee split. Never write "1% creator", "split evenly",
"creator earnings from fees", or any CREATOR_FEE constant.
This applies to ALL files: code, docs, comments, marketing copy.

## Token Lifecycle

1. Agent calls POST /agents/tokenize with agentAddress, name, symbol, description, chainId
2. API returns token record with handoff link
3. Human visits link, connects wallet, signs transaction (pays 120 FET)
4. Token deploys on-chain with bonding curve
5. At 30,000 FET liquidity, auto-lists on DEX (Uniswap/PancakeSwap)
