# MCP Tools Reference — `agent-launch-mcp`

The AgentLaunch MCP server exposes all platform operations as tools for Claude Code and Cursor. Once configured, you can create tokens, query market data, scaffold agents, and generate handoff links entirely from your IDE.

**Install:**
```bash
npm install -g agent-launch-mcp
```

---

## Setup

### Claude Code

Add to `.claude/settings.json` in your project, or to the global MCP config:

```json
{
  "mcpServers": {
    "agent-launch": {
      "command": "agent-launch-mcp",
      "env": {
        "AGENT_LAUNCH_API_KEY": "av-xxxxxxxxxxxxxxxx"
      }
    }
  }
}
```

Or using `npx` (no global install needed):

```json
{
  "mcpServers": {
    "agent-launch": {
      "command": "npx",
      "args": ["-y", "agent-launch-mcp"],
      "env": {
        "AGENT_LAUNCH_API_KEY": "av-xxxxxxxxxxxxxxxx"
      }
    }
  }
}
```

### Cursor

Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "agent-launch": {
      "command": "npx",
      "args": ["-y", "agent-launch-mcp"],
      "env": {
        "AGENT_LAUNCH_API_KEY": "av-xxxxxxxxxxxxxxxx"
      }
    }
  }
}
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `AGENT_LAUNCH_API_KEY` | Agentverse API key — used as `X-API-Key` on write endpoints |
| `AGENT_LAUNCH_BASE_URL` | API base URL override (default: `https://agent-launch.ai/api`) |
| `AGENT_LAUNCH_FRONTEND_URL` | Frontend URL override (default: `https://agent-launch.ai`) |

---

## Tool Categories

- [Discovery](#discovery) — Browse tokens and platform stats
- [Calculate](#calculate) — Bonding curve price calculations
- [Write](#write) — Create and update token records
- [Handoff](#handoff) — Generate links for human wallet interactions
- [Agentverse](#agentverse) — Deploy and manage Agentverse agents
- [Scaffold](#scaffold) — Generate agent project templates
- [Combo](#combo) — End-to-end shortcuts

---

## Discovery

### `list_tokens`

List tokens on the platform with optional filtering and pagination.

Maps to `GET /agents/tokens`.

**Input schema:**

```json
{
  "status": "bonding",       // "bonding" | "listed" | "all"
  "category": "research",    // filter by category name
  "chainId": 97,             // 97=BSC testnet, 56=BSC mainnet
  "sort": "trending",        // "newest" | "trending" | "volume"
  "limit": 20,               // max 100
  "offset": 0                // pagination offset
}
```

All fields are optional.

**Output:**

```json
{
  "tokens": [
    {
      "id": 42,
      "name": "Alpha Research Bot",
      "symbol": "ARB",
      "address": "0xAbCd1234...",
      "price": "0.000125",
      "market_cap": "100000.00",
      "progress": 33.3,
      "status": "bonding",
      "listed": false,
      "chainId": 97
    }
  ],
  "total": 1
}
```

**Example prompt:**
```
Show me the top 5 trending tokens on AgentLaunch
```

---

### `get_token`

Get full details for a single token by contract address or numeric ID.

Maps to `GET /agents/token/:address` or `GET /tokens/:id`.

**Input schema:**

```json
{
  "address": "0xAbCd1234..."  // token contract address
}
```

or

```json
{
  "id": 42  // token database ID
}
```

At least one of `address` or `id` is required.

**Output:** Full `Token` object (see `list_tokens` output format, with additional metadata).

**Example prompt:**
```
Get details for token at address 0xAbCd1234...
```

---

### `get_platform_stats`

Get platform-wide statistics: total volume, token counts, trending tokens.

Maps to `GET /platform/stats`. No input required.

**Input schema:** `{}` (no parameters)

**Output:**

```json
{
  "totalTokens": 127,
  "totalVolume": "4521000.00",
  "activeTraders": 891,
  "trendingTokens": [
    { "name": "Alpha Bot", "symbol": "AB", "volume24h": "12500.00" }
  ]
}
```

**Example prompt:**
```
What is the total trading volume on AgentLaunch?
```

---

## Calculate

### `calculate_buy`

Calculate how many tokens you would receive for a given FET spend amount.

Maps to `GET /tokens/calculate-buy`.

**Input schema:**

```json
{
  "address": "0xAbCd1234...",  // required — token contract address
  "fetAmount": "100"           // required — FET to spend (decimal string)
}
```

**Output:**

```json
{
  "tokensReceived": "125000.50",
  "pricePerToken": "0.000800",
  "fee": "2.00",
  "totalCost": "100"
}
```

**Example prompt:**
```
If I spend 100 FET on token 0xAbCd..., how many tokens would I get?
```

---

### `calculate_sell`

Calculate how much FET you would receive for selling a given number of tokens.

Maps to `GET /tokens/calculate-sell`.

**Input schema:**

```json
{
  "address": "0xAbCd1234...",  // required — token contract address
  "tokenAmount": "500"         // required — tokens to sell (decimal string)
}
```

**Output:**

```json
{
  "fetReceived": "39.20",
  "pricePerToken": "0.000800",
  "fee": "0.80",
  "grossFet": "40.00"
}
```

Note: The 2% trading fee goes 100% to the protocol treasury (REVENUE_ACCOUNT). There is no creator fee.

**Example prompt:**
```
How much FET would I get for selling 500 tokens of 0xAbCd...?
```

---

## Write

### `create_token_record`

Create a pending token record. Returns a handoff link for the human to complete on-chain deployment.

**Requires:** `AGENT_LAUNCH_API_KEY` environment variable.

Maps to `POST /agents/launch`.

**Input schema:**

```json
{
  "name": "Alpha Research Bot",           // required — max 32 chars
  "symbol": "ARB",                        // required — 2-11 chars, uppercase
  "description": "Delivers reports...",   // required — max 500 chars
  "category": "research",                 // required — category name
  "logo": "https://example.com/logo.png", // optional — image URL
  "chainId": 97                           // optional — default: 97
}
```

**Output:**

```json
{
  "tokenId": 42,
  "handoffLink": "https://agent-launch.ai/deploy/42",
  "name": "Alpha Research Bot",
  "symbol": "ARB",
  "status": "pending_deployment",
  "instructions": {
    "step1": "Click the handoff link above",
    "step2": "Connect your wallet",
    "step3": "Approve 120 FET spending",
    "step4": "Click Deploy",
    "step5": "Done! Your token will be live in ~30 seconds"
  }
}
```

**Example prompt:**
```
Create a token record for "Alpha Research Bot" with symbol ARB in the research category on BSC testnet
```

---

### `update_token_metadata`

Update metadata for an existing token. Only the token creator can update metadata.

**Requires:** `AGENT_LAUNCH_API_KEY`.

**Input schema:**

```json
{
  "tokenId": 42,
  "description": "Updated description",
  "logo": "https://example.com/new-logo.png",
  "website": "https://myagent.ai",
  "twitter": "https://twitter.com/myagent"
}
```

All fields except `tokenId` are optional.

**Output:** Updated token record.

---

## Handoff

### `get_deploy_instructions`

Fetch a token by ID and return structured + markdown deployment instructions for the human who will sign the on-chain transaction.

**Input schema:**

```json
{
  "tokenId": 42  // required — positive integer
}
```

**Output:**

```json
{
  "handoffLink": "https://agent-launch.ai/deploy/42",
  "instructions": {
    "title": "Deploy Your Token",
    "requirements": [
      "Wallet with 120+ FET",
      "Small amount of BNB for gas (~0.002 BNB)"
    ],
    "steps": [
      { "number": 1, "action": "Click the link below", "note": "Opens in your browser" },
      { "number": 2, "action": "Connect your wallet", "note": "MetaMask, Rainbow, or WalletConnect" },
      { "number": 3, "action": "Click 'Approve FET'", "note": "This allows the contract to use your FET" },
      { "number": 4, "action": "Click 'Deploy Token'", "note": "Confirm the transaction in your wallet" },
      { "number": 5, "action": "Wait ~30 seconds", "note": "Your token will appear on the platform" }
    ],
    "costs": {
      "deploymentFee": "120 FET",
      "gasEstimate": "~0.002 BNB (~$1.20)",
      "total": "~120 FET + gas"
    },
    "whatHappensNext": [
      "Token goes live on bonding curve",
      "Anyone can buy/sell immediately",
      "At 30,000 FET raised → auto-lists on DEX",
      "Liquidity locked forever (no rug pull possible)"
    ]
  },
  "markdown": "## Deploy Your Token: Alpha Research Bot (ARB)\n\n**Link:** [Click here to deploy](...)\n..."
}
```

**Example prompt:**
```
Give me deployment instructions for token ID 42
```

---

### `get_trade_link`

Generate a pre-filled trade URL for a human to open and execute a buy or sell.

**Input schema:**

```json
{
  "address": "0xAbCd1234...",  // required — token contract address
  "action": "buy",             // required — "buy" | "sell"
  "amount": "100"              // optional — FET for buy, tokens for sell
}
```

**Output:**

```json
{
  "link": "https://agent-launch.ai/trade/0xAbCd1234...?action=buy&amount=100",
  "instructions": {
    "action": "Buy tokens",
    "steps": [
      "Click the link",
      "Connect wallet if not connected",
      "Confirm the amount (100 FET)",
      "Click Buy",
      "Approve transaction in wallet"
    ]
  }
}
```

**Example prompt:**
```
Generate a buy link for 100 FET of token 0xAbCd...
```

---

### `prepare_deploy_transaction`

Prepare the full transaction data needed to deploy a token on-chain.

**Input schema:**

```json
{
  "tokenId": 42,
  "walletAddress": "0xUserWallet..."  // the wallet that will sign
}
```

**Output:** Transaction calldata and contract addresses for the approve + deploy sequence.

---

## Agentverse

### `deploy_to_agentverse`

Deploy a Python agent file to Agentverse hosted agents. Creates the agent record, uploads code, stores secrets, and starts it. Polls until compiled (up to 60 seconds).

**Input schema:**

```json
{
  "apiKey": "av-xxxxxxxxxxxxxxxx",      // required — Agentverse API key
  "agentFile": "./agent.py",            // required — path to Python file
  "agentName": "My Research Bot",       // optional — defaults to filename
  "secrets": {                          // optional — stored as Agentverse secrets
    "AGENTLAUNCH_API_KEY": "av-xxx",
    "HUGGINGFACE_API_KEY": "hf-xxx"
  }
}
```

**Output:**

```json
{
  "success": true,
  "agentAddress": "agent1qf8xfhsc8hg4g5l0nhtj5hxxkyd46c64qxvpa3g3ha9rjmezq3s6xw9y7g",
  "status": "running"
}
```

**Example prompt:**
```
Deploy my agent.py file to Agentverse with my API key av-xxx and name "Research Bot"
```

---

### `check_agent_logs`

Retrieve recent execution logs for an Agentverse agent.

**Input schema:**

```json
{
  "apiKey": "av-xxxxxxxxxxxxxxxx",  // required
  "agentAddress": "agent1q..."       // required
}
```

**Output:** Array of log entries with timestamps.

---

### `stop_agent`

Stop a running Agentverse agent.

**Input schema:**

```json
{
  "apiKey": "av-xxxxxxxxxxxxxxxx",  // required
  "agentAddress": "agent1q..."       // required
}
```

**Output:**

```json
{
  "success": true,
  "status": "stopped"
}
```

---

## Scaffold

### `scaffold_agent`

Generate a ready-to-run Agentverse agent project from the agent-business-template pattern. Creates `agent.py`, `README.md`, and `.env.example` in a new directory.

**Input schema:**

```json
{
  "name": "AlphaBot",            // required — agent/project name
  "type": "research",            // optional — "faucet"|"research"|"trading"|"data" (default: "research")
  "outputDir": "./my-agents/AlphaBot"  // optional — where to create the project
}
```

**Output:**

```json
{
  "success": true,
  "files": [
    "/home/user/alpha-bot/agent.py",
    "/home/user/alpha-bot/README.md",
    "/home/user/alpha-bot/.env.example"
  ],
  "path": "/home/user/alpha-bot"
}
```

**Example prompt:**
```
Scaffold a trading agent project called "AlphaTrader" in the current directory
```

---

### `get_agent_templates`

List available agent templates with descriptions and use-case guidance.

**Input schema:** `{}` (no parameters)

**Output:**

```json
{
  "templates": [
    {
      "type": "faucet",
      "description": "Distribute FET tokens to agents on request",
      "freeRequestsPerDay": 5,
      "rateLimitPerMinute": 10
    },
    {
      "type": "research",
      "description": "Answer questions and retrieve data from external sources",
      "freeRequestsPerDay": 10,
      "rateLimitPerMinute": 20
    },
    {
      "type": "trading",
      "description": "Execute autonomous trading strategies and report positions",
      "freeRequestsPerDay": 20,
      "rateLimitPerMinute": 30
    },
    {
      "type": "data",
      "description": "Collect, transform, and serve structured data feeds",
      "freeRequestsPerDay": 50,
      "rateLimitPerMinute": 60
    }
  ]
}
```

---

## Combo

### `create_and_tokenize`

End-to-end shortcut: create a token record tied to a live Agentverse agent address. Calls `POST /api/agents/tokenize` and returns the token ID, a deploy handoff link for the human to sign, and a pre-filled trade link.

**Requires:** `apiKey` in input (or `AGENT_LAUNCH_API_KEY` env var).

**Input schema:**

```json
{
  "apiKey": "av-xxxxxxxxxxxxxxxx",       // required — Agentverse API key
  "agentAddress": "agent1q...",          // required — Agentverse agent address
  "name": "My Research Bot",             // optional — max 32 chars
  "symbol": "MRB",                       // optional — 2-11 chars
  "description": "Delivers reports...",  // optional — max 500 chars
  "image": "https://example.com/logo.png", // optional — logo URL
  "chainId": 97                          // optional — default: 97
}
```

**Output:**

```json
{
  "success": true,
  "tokenId": 42,
  "handoffLink": "https://agent-launch.ai/deploy/42",
  "tradeLink": "https://agent-launch.ai/trade/42?action=buy&amount=100"
}
```

**Example prompt:**
```
Create and tokenize my Agentverse agent at agent1qf8... with name "Research Bot" and symbol RB on BSC testnet
```

This is the most commonly used tool for the agent-human handoff workflow.

---

## Error Handling

All tools return errors as MCP error responses with a descriptive message:

```json
{
  "isError": true,
  "content": [
    {
      "type": "text",
      "text": "Error executing tool \"create_and_tokenize\": POST https://agent-launch.ai/api/agents/tokenize failed with status 401: Invalid API key"
    }
  ]
}
```

Common errors:

| Error | Cause |
|-------|-------|
| `401 Invalid API key` | `AGENT_LAUNCH_API_KEY` not set or invalid |
| `400 Bad Request` | Missing required field (check input schema) |
| `404 Not Found` | Token address or ID does not exist |
| `Agent file not found` | `agentFile` path does not point to an existing file |
| `Invalid tokenId` | `tokenId` must be a positive integer |
