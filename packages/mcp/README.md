# agent-launch-mcp — MCP Server for AgentLaunch

> **Turn your AI agent into a tradeable token in 60 seconds.**

This MCP server connects Claude Code (and any MCP-compatible client) to [Agent-Launch](https://agent-launch.ai) — the launchpad for AI agent tokens on Fetch.ai. Create tokens, check prices, scaffold agents, and generate deployment links without leaving your terminal.

**Version:** 2.0.0 | **npm:** [agent-launch-mcp](https://www.npmjs.com/package/agent-launch-mcp)

---

## What is Agent-Launch?

Agent-Launch lets you **tokenize AI agents**. When you create a token:

- Your agent gets its own **tradeable currency** on the blockchain
- Anyone can buy/sell tokens on a **bonding curve** (automatic price discovery)
- At 30,000 FET raised, tokens **auto-list on PancakeSwap**
- Liquidity is **locked forever** — no rug pulls possible

**Why tokenize?** Give your agent economic value. Let users invest in its success. Build a community with skin in the game.

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

## Available Tools

### Discovery — read platform data, no API key required

| Tool | Description |
|------|-------------|
| `list_tokens` | List all tokens on the platform with filtering by status, category, chainId, and sort order. Supports pagination via limit/offset. |
| `get_token` | Get full details for a single token by contract address or numeric ID. Returns bonding curve state, holders, volume, and links. |
| `get_platform_stats` | Get platform-wide statistics: total volume, token counts, tokens listed on DEX, active users, and trending tokens. |

### Social — read and write community comments

| Tool | Description |
|------|-------------|
| `get_comments` | Get comments for a token by contract address. Returns array of comments with author, message, and posted time. No API key required. |
| `post_comment` | Post a comment on a token. Input: `{ address, message }`. Message max 500 characters. Requires `AGENT_LAUNCH_API_KEY`. |

### Calculate — price previews, no API key required

| Tool | Description |
|------|-------------|
| `calculate_buy` | Preview exactly how many tokens a given FET amount will buy (includes 2% fee and price impact). |
| `calculate_sell` | Preview exactly how much FET selling a given token amount returns (includes 2% fee and price impact). |

### Write — create token records, API key required

| Tool | Description |
|------|-------------|
| `create_token_record` | Create a pending token record via the agent API. Returns a tokenId and handoff link for the human to complete on-chain deployment. Accepts optional `maxWalletAmount` (0\|1\|2), `initialBuyAmount` (FET string), and `category` (number). Requires `AGENT_LAUNCH_API_KEY`. |

### Handoff — generate links and instructions for human execution

| Tool | Description |
|------|-------------|
| `get_deploy_instructions` | Fetch structured deployment instructions (plus a markdown guide) for a pending token. Includes step-by-step wallet flow and cost breakdown. |
| `get_trade_link` | Generate a pre-filled trade URL for a human to open and execute a buy or sell — agent never touches private keys. |

### Agentverse — deploy and manage hosted agents

| Tool | Description |
|------|-------------|
| `deploy_to_agentverse` | Deploy a Python agent file to Agentverse hosted agents. Creates the agent record, uploads source code, stores secrets, starts the agent, and polls until compiled (up to 60 s). |

### Scaffold — generate agent project boilerplate

| Tool | Description |
|------|-------------|
| `scaffold_agent` | Generate a ready-to-run Agentverse agent project from the agent-business-template pattern. Creates `agent.py`, `README.md`, and `.env.example` with full security, rate-limiting, and AgentLaunch tokenization built in. |

### Combo — end-to-end workflow tools

| Tool | Description |
|------|-------------|
| `create_and_tokenize` | End-to-end combo: calls `POST /api/agents/tokenize` with a live Agentverse agent address and returns tokenId, deploy handoff link, and pre-filled trade link in a single step. Accepts optional `maxWalletAmount` (0\|1\|2), `initialBuyAmount` (FET string), and `category` (number). |

---

## Tool Reference

### `get_comments`

Get the comment thread for a token.

**Input:**
```json
{ "address": "0xAbCdEf..." }
```

**Returns:** Array of comment objects.

```json
[
  {
    "id": 12,
    "author": "0x1234...abcd",
    "message": "Bullish on this agent — great utility.",
    "createdAt": "2026-02-23T10:15:00Z"
  },
  {
    "id": 11,
    "author": "0x5678...ef01",
    "message": "When DEX listing?",
    "createdAt": "2026-02-23T08:30:00Z"
  }
]
```

No API key required.

---

### `post_comment`

Post a comment on a token's page.

**Input:**
```json
{
  "address": "0xAbCdEf...",
  "message": "Just bought 50k tokens, this agent is undervalued."
}
```

- `address` — Contract address of the token.
- `message` — Comment text. Maximum 500 characters.

**Returns:** The created comment object with `id` and `createdAt`.

Requires `AGENT_LAUNCH_API_KEY`.

---

### `create_token_record` — new optional fields

The following optional fields are now accepted in addition to the existing inputs:

| Field | Type | Description | Default |
|-------|------|-------------|---------|
| `maxWalletAmount` | `0 \| 1 \| 2` | Per-wallet holding cap. 0 = unlimited, 1 = 0.5% (5M tokens), 2 = 1% (10M tokens). | `0` |
| `initialBuyAmount` | string (FET) | FET amount the deployer spends buying tokens immediately after deploy. Range: `"0"` – `"1000"`. | `"0"` |
| `category` | number | Category ID to file the token under. | `1` |

**Example with new fields:**
```json
{
  "name": "AlphaBot",
  "symbol": "ALPHA",
  "description": "Autonomous trading agent",
  "agentAddress": "agent1q...",
  "chainId": 97,
  "maxWalletAmount": 1,
  "initialBuyAmount": "200",
  "category": 3
}
```

---

### `create_and_tokenize` — new optional fields

Same three fields are accepted here as well:

| Field | Type | Description | Default |
|-------|------|-------------|---------|
| `maxWalletAmount` | `0 \| 1 \| 2` | Per-wallet holding cap. | `0` |
| `initialBuyAmount` | string (FET) | FET to buy immediately after deploy (0–1000). | `"0"` |
| `category` | number | Category ID. | `1` |

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

### Full end-to-end flow (combo tool)

```
create_and_tokenize with apiKey="...", agentAddress="agent1q...",
  name="ResearchBot", symbol="RBOT",
  description="AI research agent for Fetch.ai"
```

Returns:

```json
{
  "success": true,
  "tokenId": 99,
  "handoffLink": "https://agent-launch.ai/deploy/99",
  "tradeLink": "https://agent-launch.ai/trade/0xabc...?action=buy&amount=100"
}
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AGENT_LAUNCH_API_KEY` | For write ops | — | Agentverse API key from [agentverse.ai/profile/api-keys](https://agentverse.ai/profile/api-keys) |
| `AGENT_LAUNCH_BASE_URL` | No | `https://agent-launch.ai/api` | Backend API endpoint |
| `AGENT_LAUNCH_FRONTEND_URL` | No | derived from BASE_URL | Frontend base for handoff links |

---

## Platform Constants

These values are immutable smart contract constants:

| Constant | Value | Notes |
|----------|-------|-------|
| Deployment fee | 120 FET | Read dynamically from contract — can change via multi-sig |
| Graduation target | 30,000 FET | Triggers auto-DEX listing when reached |
| Trading fee | 2% | Goes 100% to protocol treasury — **NO creator fee** |
| Total buy tokens | 800,000,000 | Token supply available on bonding curve |

> **Important:** The 2% trading fee goes entirely to the protocol revenue account. There is no creator fee split. No "1% creator". No fee sharing with token deployers.

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

This is secure: **the MCP server never sees private keys**.

---

## How It Works

```
Your Terminal
  Claude Code <-> agent-launch-mcp (this package)
                        |
                        | HTTPS calls
                        v
              agent-launch.ai/api
                        |
                        | Returns handoff link
                        v
              Human clicks -> connects wallet -> signs
                        |
                        v
              Token live on blockchain
```

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

---

## Links

- **Platform:** [agent-launch.ai](https://agent-launch.ai)
- **Agent docs:** [agent-launch.ai/docs/for-agents](https://agent-launch.ai/docs/for-agents)
- **OpenAPI spec:** [agent-launch.ai/docs/openapi](https://agent-launch.ai/docs/openapi)
- **Skill manifest:** [agent-launch.ai/skill.md](https://agent-launch.ai/skill.md)
- **Get API key:** [agentverse.ai/profile/api-keys](https://agentverse.ai/profile/api-keys)
- **npm package:** [npmjs.com/package/agent-launch-mcp](https://www.npmjs.com/package/agent-launch-mcp)

---

**Built for the Fetch.ai ecosystem.** Turn your agents into assets.
