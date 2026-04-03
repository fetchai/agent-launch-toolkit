# CLAUDE.md

This file provides context to Claude Code and other AI coding assistants.

## Project Overview

**test-analytics-agent** — {{description}}

This is an AgentLaunch agent built on the Fetch.ai Agentverse platform.
It uses the AgentLaunch SDK and CLI for deployment and tokenization.

## Project Structure

```
test-analytics-agent/
  agent.py          # Main agent code (edit business logic here)
  .env.example      # Required environment variables
  README.md         # Quickstart guide
  CLAUDE.md         # This file (AI context)
  .claude/          # Claude Code settings
    settings.json   # MCP server config
  agentlaunch.config.json  # CLI auto-detection config
```

## Platform: AgentLaunch (agent-launch.ai)

AgentLaunch is a token launchpad for AI agents on Fetch.ai. Agents can:
- Be **tokenized** — get their own ERC-20 token on a bonding curve
- Offer **token-gated access** — premium tiers for token holders
- **Graduate** to a DEX at 30,000 FET raised (automatic)

### Platform Constants (immutable, from smart contracts)

| Constant | Value |
|----------|-------|
| Graduation target | 30,000 FET |
| Total buy tokens | 800,000,000 |
| Trading fee | 2% -> 100% to protocol treasury |
| Deploy fee | 120 FET (read dynamically from contract) |
| Creator fee | **NONE** (0%) |

### Key API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/tokens` | GET | No | List all tokens |
| `/tokens/address/{address}` | GET | No | Get token details |
| `/agents/tokenize` | POST | API Key | Create token record |
| `/tokens/calculate-buy` | GET | No | Preview buy outcome |
| `/tokens/calculate-sell` | GET | No | Preview sell outcome |
| `/comments/{address}` | GET/POST | POST needs key | Token comments |
| `/platform/stats` | GET | No | Platform statistics |

### Authentication

**If this project was created with `npx agentlaunch`, your API key is already in `.env`.**
Do NOT ask the user for the key again — check `.env` first.

The key is sent as `X-API-Key` header on authenticated requests.
New keys: https://agentverse.ai/profile/api-keys

## SDK Reference (agentlaunch-sdk)

```typescript
import {
  // Token operations
  tokenize,          // POST /agents/tokenize -> { token_id, handoff_link }
  getToken,          // GET /tokens/address/{address} -> Token
  listTokens,        // GET /tokens -> { tokens, total }

  // Market data
  calculateBuy,      // Preview buy: FET amount -> tokens received
  calculateSell,     // Preview sell: token amount -> FET received
  getTokenPrice,     // Current bonding curve price
  getTokenHolders,   // Holder list for token-gated access
  getPlatformStats,  // { totalTokens, totalListed, totalBonding }

  // Handoff links (agent never signs transactions)
  generateDeployLink,  // /deploy/:tokenId
  generateTradeLink,   // /trade/:address?action=buy&amount=100
  generateBuyLink,     // Shortcut for buy trade link
  generateSellLink,    // Shortcut for sell trade link

  // Comments
  getComments,       // Read token comments
  postComment,       // Post a comment (needs API key)

  // Agentverse deployment
  deployAgent,       // Full deploy flow: create -> upload -> secrets -> start -> poll

  // Client class (for advanced use)
  AgentLaunchClient, // HTTP client with retry, auth, typed methods
} from 'agentlaunch-sdk';
```

## CLI Reference (agentlaunch)

| Command | Description |
|---------|-------------|
| `npx agentlaunch` | Interactive: prompts for name, deploys by default |
| `npx agentlaunch <name>` | Create agent with name (deploys by default) |
| `npx agentlaunch <name> --local` | Scaffold only, no deploy |
| `agentlaunch deploy` | Deploy agent.py to Agentverse |
| `agentlaunch tokenize` | Create token + get handoff link |
| `agentlaunch list` | List tokens on platform |
| `agentlaunch status <addr>` | Show token details |
| `agentlaunch holders <addr>` | Show token holders |
| `agentlaunch comments <addr>` | List/post comments |
| `agentlaunch config set-key` | Store API key |

All commands support `--json` for machine-readable output.

## MCP Tools (agent-launch-mcp)

This project has an MCP server pre-configured in `.claude/settings.json`.
Available tools: list_tokens, get_token, get_platform_stats, calculate_buy,
calculate_sell, create_token_record, get_deploy_instructions, get_trade_link,
scaffold_agent, deploy_to_agentverse, create_and_tokenize, get_comments,
post_comment.

## Agentverse Patterns

### Chat Protocol (required)
All agents must implement the chat protocol:
```python
from uagents_core.contrib.protocols.chat import (
    ChatAcknowledgement, ChatMessage, TextContent, chat_protocol_spec,
)
```

### Token-Gated Access
Check holder balance via AgentLaunch API to offer premium tiers:
```python
r = requests.get(f"{AGENTLAUNCH_API}/agents/token/{user_address}")
balance = r.json().get("balance", 0)
tier = "premium" if balance >= 1000 else "free"
```

### Code Upload (double-encoded JSON)
When uploading code to Agentverse, the `code` field must be a JSON string:
```python
code_array = [{"language": "python", "name": "agent.py", "value": source}]
payload = {"code": json.dumps(code_array)}  # json.dumps required!
```

## Agent Pattern Examples

Use these patterns as inspiration when customizing your agent's business logic.

### Research Agent Pattern (AI-powered responses)
```python
# Use Hugging Face or OpenAI for intelligent responses
import requests

def generate_report(query: str) -> str:
    r = requests.post(
        "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
        headers={"Authorization": f"Bearer {os.environ.get('HF_TOKEN')}"},
        json={"inputs": f"Research query: {query}\n\nProvide a detailed analysis:"},
        timeout=30
    )
    return r.json()[0]["generated_text"] if r.ok else "Error generating report"
```

### Price Monitor Pattern (watch token prices)
```python
# Fetch token price and check thresholds
def check_price(token_address: str, threshold: float) -> str:
    r = requests.get(f"{AGENTLAUNCH_API}/agents/token/{token_address}", timeout=5)
    if r.ok:
        data = r.json()
        price = float(data.get("price", 0))
        change = float(data.get("price_change_24h", 0))
        if abs(change) > threshold:
            return f"ALERT: {data['name']} price {'up' if change > 0 else 'down'} {abs(change):.1f}%"
    return None
```

### Trading Signal Pattern (buy/sell recommendations)
```python
# Simple moving average signal
def compute_signal(prices: list, window: int = 10) -> str:
    if len(prices) < window:
        return "HOLD"
    ma = sum(prices[-window:]) / window
    current = prices[-1]
    pct = (current - ma) / ma * 100
    if pct > 3:
        return "BUY"
    elif pct < -3:
        return "SELL"
    return "HOLD"
```

### Data Query Pattern (structured responses)
```python
# Parse structured queries and return formatted data
def handle_query(query: str) -> str:
    lower = query.lower()
    if "top" in lower and "tokens" in lower:
        r = requests.get(f"{AGENTLAUNCH_API}/agents/tokens?limit=5&sort=volume", timeout=5)
        if r.ok:
            tokens = r.json().get("tokens", [])
            return "\n".join([f"{t['name']}: {t['price']} FET" for t in tokens])
    elif "stats" in lower:
        r = requests.get(f"{AGENTLAUNCH_API}/platform/stats", timeout=5)
        if r.ok:
            s = r.json()
            return f"Platform: {s['total_tokens']} tokens, {s['total_volume']} FET volume"
    return "Unknown query. Try: 'top tokens', 'stats'"
```

## Resources

- [AgentLaunch Platform](https://agent-launch.ai)
- [API Docs](https://agent-launch.ai/docs/openapi)
- [skill.md](https://agent-launch.ai/skill.md)
- [Agentverse](https://agentverse.ai)
- [SDK on npm](https://www.npmjs.com/package/agentlaunch-sdk)
- [CLI on npm](https://www.npmjs.com/package/agentlaunch)
- [MCP on npm](https://www.npmjs.com/package/agent-launch-mcp)
