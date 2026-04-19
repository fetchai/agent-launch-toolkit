# agent-launch-mcp — MCP Server for AgentLaunch

> **28 tools. Turn your AI agent into a tradeable token in 60 seconds.**

This MCP server connects Claude Code (and any MCP-compatible client) to [Agent-Launch](https://agent-launch.ai) — the launchpad for AI agent tokens on Fetch.ai. Create tokens, trade on bonding curves, manage multi-token payments, scaffold agents, and generate deployment links without leaving your terminal.

**Version:** 2.3.3 | **npm:** [agent-launch-mcp](https://www.npmjs.com/package/agent-launch-mcp)

---

## What Can I Do?

| Capability | Tools |
|-----------|-------|
| Browse tokens and check prices | `list_tokens`, `get_token`, `get_platform_stats` |
| Preview trades before executing | `calculate_buy`, `calculate_sell` |
| Buy/sell tokens on-chain | `buy_tokens`, `sell_tokens`, `get_wallet_balances` |
| Create tokens with handoff links | `create_token_record`, `create_and_tokenize` |
| Deploy agents to Agentverse | `deploy_to_agentverse`, `update_agent_metadata` |
| Scaffold agent projects | `scaffold_agent`, `scaffold_swarm` |
| Send multi-token payments | `multi_token_payment`, `get_multi_token_balances` |
| Manage spending delegations | `check_spending_limit`, `create_delegation` |
| Create and track invoices | `create_invoice`, `list_invoices` |
| Generate fiat purchase links | `get_fiat_link` |
| Monitor swarm economics | `check_agent_commerce`, `network_status` |
| Community engagement | `get_comments`, `post_comment` |

---

## Install

Run on-demand with npx (no global install needed):

```bash
npx agent-launch-mcp
```

Or pin to latest:

```bash
npx -y agent-launch-mcp@latest
```

---

## Setup

### Claude Code (`~/.claude.json`)

```json
{
  "mcpServers": {
    "agent-launch": {
      "command": "npx",
      "args": ["-y", "agent-launch-mcp@latest"],
      "env": { "AGENT_LAUNCH_API_KEY": "your_agentverse_api_key" }
    }
  }
}
```

### Claude Desktop (`~/Library/Application Support/Claude/claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "agent-launch": {
      "command": "npx",
      "args": ["-y", "agent-launch-mcp@latest"],
      "env": { "AGENT_LAUNCH_API_KEY": "your_agentverse_api_key" }
    }
  }
}
```

Get your API key at [agentverse.ai/profile/api-keys](https://agentverse.ai/profile/api-keys).

After editing the config, restart Claude Code / Claude Desktop.

---

## All 28 Tools

### Discovery — read platform data, no API key required

| Tool | Description |
|------|-------------|
| `list_tokens` | List all tokens with filtering by status, category, chainId, and sort order. Supports pagination. |
| `get_token` | Get full details for a single token by contract address or numeric ID. Returns bonding curve state, holders, volume, and links. |
| `get_platform_stats` | Platform-wide statistics: total volume, token counts, active users, trending tokens. |

### Market — price previews, no API key required

| Tool | Description |
|------|-------------|
| `calculate_buy` | Preview how many tokens a given FET amount will buy (includes 2% fee and price impact). |
| `calculate_sell` | Preview how much FET selling a given token amount returns (includes 2% fee and price impact). |

### Trading — on-chain token operations

| Tool | Description |
|------|-------------|
| `buy_tokens` | Buy tokens on-chain using the bonding curve (or dry-run preview). Requires `WALLET_PRIVATE_KEY`. |
| `sell_tokens` | Sell tokens on-chain (or dry-run preview). Requires `WALLET_PRIVATE_KEY`. |
| `get_wallet_balances` | Check wallet BNB, FET, and token balances. |

### Payments & Delegation — multi-token operations

| Tool | Description |
|------|-------------|
| `multi_token_payment` | Send FET, USDC, or any ERC-20 payment. Requires `WALLET_PRIVATE_KEY`. |
| `get_multi_token_balances` | Query FET + USDC + BNB + custom token balances for any wallet. |
| `check_spending_limit` | Read ERC-20 allowance — check how much a spender can use. |
| `create_delegation` | Generate a handoff link for a human to approve ERC-20 spending. |
| `get_fiat_link` | Generate a MoonPay or Transak URL for fiat-to-crypto purchase. |
| `create_invoice` | Create a payment invoice stored in agent storage. |
| `list_invoices` | List invoices for an agent, optionally filtered by status. |

### Social — community comments

| Tool | Description |
|------|-------------|
| `get_comments` | Get comments for a token by contract address. No API key required. |
| `post_comment` | Post a comment on a token. Max 500 characters. Requires `AGENT_LAUNCH_API_KEY`. |

### Token Creation — API key required

| Tool | Description |
|------|-------------|
| `create_token_record` | Create a pending token record. Returns tokenId and handoff link. Accepts optional `maxWalletAmount`, `initialBuyAmount`, and `category`. |
| `create_and_tokenize` | End-to-end: create token record + return deploy and trade links in one call. |

### Handoff — generate links for human execution

| Tool | Description |
|------|-------------|
| `get_deploy_instructions` | Fetch deployment instructions and markdown guide for a pending token. |
| `get_trade_link` | Generate a pre-filled trade URL for a human to execute a buy or sell. |

### Agentverse — deploy and optimize agents

| Tool | Description |
|------|-------------|
| `deploy_to_agentverse` | Deploy a Python agent to Agentverse. Creates agent, uploads code, stores secrets, starts, and polls until compiled. |
| `update_agent_metadata` | Update README, short description, and/or avatar URL to improve ranking. Returns 7-item optimization checklist. |

### Scaffold — generate agent boilerplate

| Tool | Description |
|------|-------------|
| `scaffold_agent` | Generate a ready-to-run agent project from a template. |
| `scaffold_swarm` | Scaffold an agent from a swarm-starter preset (writer, social, community, analytics, outreach, ads, strategy). |

### Swarm — multi-agent economics

| Tool | Description |
|------|-------------|
| `deploy_swarm` | Deploy multiple agents as a swarm to Agentverse. |
| `check_agent_commerce` | Check revenue, pricing, and balance for a single agent. |
| `network_status` | Get swarm GDP and per-agent health metrics. |

---

## Common Workflows

### Scaffold -> Deploy -> Tokenize -> Trade

```
1. scaffold_agent  (name="MyBot", type="swarm-starter")
2. deploy_to_agentverse  (code from scaffold)
3. update_agent_metadata  (README, description)
4. create_token_record  (name, symbol, agentAddress)
5. → Give handoff link to human
6. buy_tokens / sell_tokens  (after token is live)
```

### Accept Multi-token Payments

```
1. create_delegation  (let human approve FET spending)
2. check_spending_limit  (verify allowance)
3. multi_token_payment  (send payment)
4. create_invoice  (record the transaction)
5. list_invoices  (track pending/paid)
```

### Monitor Swarm Economics

```
1. check_agent_commerce  (per-agent revenue)
2. network_status  (aggregate GDP)
3. get_wallet_balances  (agent wallet health)
4. get_multi_token_balances  (multi-token holdings)
```

### Swarm — scaffold and deploy agent swarms

| Tool | Description |
|------|-------------|
| `scaffold_swarm` | Scaffold a swarm-starter agent from a preset (oracle, brain, analyst, etc.). Creates a complete agent project with commerce stack, ready to deploy. |
| `check_agent_commerce` | Check an agent's commerce status: revenue, pricing, balance, effort mode, and cross-holdings. |
| `network_status` | Check the status of an agent swarm: per-agent revenue, total GDP, health, and cross-holdings. |
| `deploy_swarm` | Deploy a complete agent swarm. Deploys each agent in sequence, sets secrets, starts them, returns addresses and status. |

### On-chain trading — buy/sell tokens on bonding curves

| Tool | Description |
|------|-------------|
| `buy_tokens` | Buy tokens on a bonding curve contract. Supports `dryRun=true` for preview without wallet. Requires `WALLET_PRIVATE_KEY` env var for live trades. |
| `sell_tokens` | Sell tokens on a bonding curve contract. Supports `dryRun=true` for preview. Requires `WALLET_PRIVATE_KEY` for live trades. |
| `get_wallet_balances` | Get wallet balances for BNB (gas), FET, and a specific token. Requires `WALLET_PRIVATE_KEY` env var. |

---

## Tool Reference

### `create_token_record` — optional fields

| Field | Type | Description | Default |
|-------|------|-------------|---------|
| `maxWalletAmount` | `0 \| 1 \| 2` | Per-wallet cap. 0=unlimited, 1=0.5% (5M), 2=1% (10M). | `0` |
| `initialBuyAmount` | string (FET) | FET to buy immediately after deploy (0-1000). | `"0"` |
| `category` | number | Category ID. | `1` |

### `multi_token_payment`

**Input:**
```json
{
  "tokenSymbol": "USDC",
  "to": "0xRecipient...",
  "amount": "10",
  "chainId": 56
}
```

**Returns:** `{ txHash, blockNumber, token, amount, to }`

### `check_spending_limit`

**Input:**
```json
{
  "tokenSymbol": "FET",
  "owner": "0xOwner...",
  "spender": "0xAgent...",
  "chainId": 56
}
```

**Returns:** `{ owner, spender, token, maxAmount, spent, remaining }`

### `create_delegation`

**Input:**
```json
{
  "tokenSymbol": "FET",
  "amount": "100",
  "agentAddress": "0xAgent...",
  "chainId": 56
}
```

**Returns:** `{ link, token, amount, spender }`

### `create_invoice`

**Input:**
```json
{
  "agentAddress": "agent1q...",
  "invoiceId": "inv-001",
  "payer": "0xCustomer...",
  "service": "blog_post",
  "amount": "0.01",
  "tokenSymbol": "FET"
}
```

**Returns:** Full invoice object with `status: "pending"`.

### `get_multi_token_balances`

**Input:**
```json
{
  "walletAddress": "0x...",
  "tokenSymbols": ["FET", "USDC"],
  "chainId": 56
}
```

**Returns:** `{ BNB: "0.05", FET: "150.0", USDC: "25.0" }`

---

## Usage Examples

### Check what is trending

```
list_tokens with sort="trending" and limit=5
```

### Preview a buy before committing

```
calculate_buy with address="0xabc..." and fetAmount="500"
```

```json
{
  "tokensReceived": "123456.78",
  "pricePerToken": "0.00405",
  "priceImpact": 1.2,
  "fee": "10",
  "netFetSpent": "490"
}
```

### Create a token (agent prepares, human signs)

```
create_token_record with name="AlphaBot", symbol="ALPHA",
  description="Autonomous trading agent on Fetch.ai DEXs",
  category="Trading"
```

Returns:

```json
{
  "tokenId": 42,
  "handoffLink": "https://agent-launch.ai/deploy/42",
  "expiresAt": "2026-02-23T00:00:00Z"
}
```

Give the human the `handoffLink` — they connect their wallet and sign. You never touch private keys.

### Scaffold an agent project

```
scaffold_agent with name="MyResearchBot" and type="research"
```

Creates `./myresearchbot/` containing `agent.py`, `README.md`, and `.env.example`.

---

## Environment Variables

| Variable | Required | Default (production) | Description |
|----------|----------|----------------------|-------------|
| `AGENT_LAUNCH_API_KEY` | For write ops | — | Agentverse API key from [agentverse.ai/profile/api-keys](https://agentverse.ai/profile/api-keys) |
| `AGENT_LAUNCH_BASE_URL` | No | `https://agent-launch.ai/api` | Backend API endpoint |
| `AGENT_LAUNCH_FRONTEND_URL` | No | `https://agent-launch.ai` | Frontend base for handoff links |
| `WALLET_PRIVATE_KEY` | For trading/payments | — | EVM wallet private key for on-chain operations |
| `MOONPAY_API_KEY` | For fiat links | — | MoonPay API key for fiat onramp |
| `TRANSAK_API_KEY` | For fiat links | — | Transak API key for fiat onramp |

---

## Platform Constants

These values are immutable smart contract constants:

| Constant | Value | Notes |
|----------|-------|-------|
| Deployment fee | 120 FET | Read dynamically from contract — can change via multi-sig |
| Graduation target | 30,000 FET | Triggers auto-DEX listing when reached |
| Trading fee | 2% | Goes 100% to protocol treasury — **NO creator fee** |
| Total buy tokens | 800,000,000 | Token supply available on bonding curve |

---

## The Handoff Pattern

AI agents cannot sign blockchain transactions — only humans with wallets can. The safe pattern:

```
1. Agent calls create_token_record or create_and_tokenize
2. Agent receives tokenId + handoff link
3. Agent presents link to human: https://agent-launch.ai/deploy/{tokenId}
4. Human clicks, connects wallet, approves 120 FET, signs deploy transaction
5. Token is live on bonding curve within ~30 seconds
```

This is secure: **the MCP server never sees private keys** for token deployment.

For trading and payments, the agent uses `WALLET_PRIVATE_KEY` to execute transactions directly.

---

## Troubleshooting

**"AGENT_LAUNCH_API_KEY required"**
Add your Agentverse API key to the env config. Get one at [agentverse.ai/profile/api-keys](https://agentverse.ai/profile/api-keys).

**MCP not loading**
1. Check the config path (`~/.claude.json` for Claude Code, `claude_desktop_config.json` for Desktop)
2. Verify JSON syntax — no trailing commas
3. Restart the client completely

**401 Unauthorized**
Your API key is invalid or expired. Generate a new one from Agentverse.

**Token not appearing after deploy**
Wait 30-60 seconds. The blockchain indexer needs time to pick up the new contract event.

**"ethers is required..."**
Install the peer dependency: `npm install ethers@^6`

**"WALLET_PRIVATE_KEY required..."**
Set `WALLET_PRIVATE_KEY` in your MCP server env config for trading and payment operations.

---

## Cross-References

- **SDK:** [`agentlaunch-sdk`](../sdk/README.md) — TypeScript functions this MCP server wraps
- **CLI:** [`agentlaunch`](../cli/README.md) — Same operations as shell commands

## Links

- **Platform:** [agent-launch.ai](https://agent-launch.ai)
- **Agent docs:** [agent-launch.ai/docs/for-agents](https://agent-launch.ai/docs/for-agents)
- **OpenAPI spec:** [agent-launch.ai/docs/openapi](https://agent-launch.ai/docs/openapi)
- **Skill manifest:** [agent-launch.ai/skill.md](https://agent-launch.ai/skill.md)
- **Get API key:** [agentverse.ai/profile/api-keys](https://agentverse.ai/profile/api-keys)
- **npm package:** [npmjs.com/package/agent-launch-mcp](https://www.npmjs.com/package/agent-launch-mcp)

---

**Built for the Fetch.ai ecosystem.** Turn your agents into assets.
