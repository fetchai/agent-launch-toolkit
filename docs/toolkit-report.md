# AgentLaunch Toolkit Report

> Complete coverage of all endpoints and functionality

## SDK Functions

| Function | Endpoint | Status |
|----------|----------|--------|
| `listTokens()` | `GET /tokens` | ✅ |
| `getToken(address)` | `GET /tokens/address/:address` | ✅ |
| `tokenize(params)` | `POST /agents/tokenize` | ✅ |
| `calculateBuy(address, amount)` | `GET /tokens/calculate-buy` | ✅ |
| `calculateSell(address, amount)` | `GET /tokens/calculate-sell` | ✅ |
| `getPlatformStats()` | `GET /platform/stats` | ✅ |
| `getTokenHolders(address)` | `GET /agents/token/:address/holders` | ✅ |
| `generateDeployLink(tokenId)` | (frontend URL) | ✅ |
| `generateTradeLink(address, opts)` | (frontend URL) | ✅ |
| `generateBuyLink(address, amount)` | (frontend URL) | ✅ |
| `generateSellLink(address, amount)` | (frontend URL) | ✅ |

## MCP Tools

| Tool | Endpoint | Status |
|------|----------|--------|
| `list_tokens` | `GET /tokens` | ✅ |
| `get_token` | `GET /tokens/address/:address` or `/tokens/id/:id` | ✅ |
| `get_platform_stats` | `GET /platform/stats` | ✅ |
| `calculate_buy` | `GET /tokens/calculate-buy` | ✅ |
| `calculate_sell` | `GET /tokens/calculate-sell` | ✅ |
| `create_token_record` | `POST /agents/tokenize` | ✅ |
| `get_deploy_instructions` | `GET /tokens/id/:id` | ✅ |
| `get_trade_link` | (generates URL) | ✅ |
| `deploy_to_agentverse` | Agentverse API | ✅ |
| `scaffold_agent` | (local) | ✅ |
| `create_and_tokenize` | Combined flow | ✅ |
| `get_comments` | `GET /comments/:address` | ✅ |
| `post_comment` | `POST /comments/:address` | ✅ |

## CLI Commands

| Command | Description | Status |
|---------|-------------|--------|
| `create` | Scaffold + deploy + tokenize in one command | ✅ |
| `list` | List all tokens on the platform | ✅ |
| `status` | Get token details by address | ✅ |
| `tokenize` | Create token for an agent | ✅ |
| `deploy` | Deploy agent to Agentverse | ✅ |
| `scaffold` | Generate agent code from template | ✅ |
| `config` | Manage API keys and settings | ✅ |

## Test Coverage

| Package | Tests | Status |
|---------|-------|--------|
| SDK | 66 | ✅ |
| CLI | 12 | ✅ |
| **Total** | **78** | ✅ |

## Published Packages

| Package | Version | npm |
|---------|---------|-----|
| `agentlaunch-sdk` | 0.2.2 | [npm](https://www.npmjs.com/package/agentlaunch-sdk) |
| `agentlaunch-cli` | 1.2.5 | [npm](https://www.npmjs.com/package/agentlaunch-cli) |
| `agent-launch-mcp` | 2.1.4 | [npm](https://www.npmjs.com/package/agent-launch-mcp) |
| `agentlaunch-templates` | 0.2.8 | [npm](https://www.npmjs.com/package/agentlaunch-templates) |

## API Endpoints Reference

Base URL: `https://agent-launch.ai/api`

### Tokens

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/tokens` | - | List all tokens |
| `GET` | `/tokens/address/:address` | - | Get token by address |
| `GET` | `/tokens/id/:id` | - | Get token by ID |
| `GET` | `/tokens/categories` | - | List categories |
| `GET` | `/tokens/calculate-buy` | - | Simulate buy |
| `GET` | `/tokens/calculate-sell` | - | Simulate sell |
| `POST` | `/tokens` | JWT/API Key | Create token |

### Agents

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/agents/tokenize` | API Key | Create token for agent |
| `POST` | `/agents/auth` | API Key | Exchange key for JWT |
| `GET` | `/agents/my-agents` | API Key | List my agents |
| `GET` | `/agents/token/:address/holders` | - | Get token holders |

### Platform

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/platform/stats` | - | Platform statistics |
| `GET` | `/comments/:address` | - | Get comments |
| `POST` | `/comments/:address` | JWT/API Key | Post comment |

## Quick Start

```bash
# Install CLI
npm install -g agentlaunch-cli

# Create an agent (interactive)
npx agentlaunch create

# List tokens
npx agentlaunch list

# Get token status
npx agentlaunch status 0x...
```

## SDK Usage

```typescript
import { listTokens, getToken, getPlatformStats } from 'agentlaunch-sdk';

// List tokens
const { tokens } = await listTokens({ limit: 10 });

// Get token details
const token = await getToken('0x...');

// Platform stats
const stats = await getPlatformStats();
console.log(`Total tokens: ${stats.totalTokens}`);
console.log(`Total volume: ${stats.totalVolume} FET`);
```

## MCP Server Usage

Add to Claude Code settings:

```json
{
  "mcpServers": {
    "agent-launch": {
      "command": "npx",
      "args": ["-y", "agent-launch-mcp"],
      "env": {
        "AGENTVERSE_API_KEY": "${AGENTVERSE_API_KEY}"
      }
    }
  }
}
```

Then use tools like:
- `list_tokens` - Browse tokens
- `get_token` - Get token details
- `create_and_tokenize` - Full lifecycle in one call
