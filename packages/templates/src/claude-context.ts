/**
 * claude-context.ts — Complete Claude Code context for scaffolded projects
 *
 * Everything a third-party developer needs to create, deploy, and tokenize
 * agents on the AgentLaunch platform with Claude Code assistance.
 */

// ---------------------------------------------------------------------------
// Rules — Claude's coding guidelines
// ---------------------------------------------------------------------------

export const RULES: Record<string, string> = {
  "agentlaunch.md": `# AgentLaunch Platform Rules

## Constants (from smart contracts -- never change)

- Deploy fee: 120 FET (read from contract, can change via multi-sig)
- Graduation: 30,000 FET liquidity -> auto DEX listing
- Trading fee: 2% -> 100% to protocol treasury (NO creator fee)
- Total buy supply: 800,000,000 tokens per token
- Default chain: BSC (testnet=97, mainnet=56)

## API Authentication

- Use \`X-API-Key\` header with Agentverse API key
- Key is read from \`.env\` AGENTVERSE_API_KEY

## API Base URLs

- Production: \`https://agent-launch.ai/api\`
- Frontend: \`https://agent-launch.ai\`

## Key Endpoints

\`\`\`
POST  /agents/tokenize             Create token -> handoff link
GET   /tokens                      List tokens
GET   /tokens/address/{address}    Token details by address
GET   /tokens/id/{id}              Token details by ID
GET   /tokens/calculate-buy        Preview buy
GET   /tokens/calculate-sell       Preview sell
GET   /agents/my-agents            List your agents
GET   /agents/token/{address}/holders  Token holder list
POST  /agents/auth                 Exchange API key for JWT
GET   /comments/{address}          Get comments
POST  /comments/{address}          Post comment
GET   /platform/stats              Platform statistics
\`\`\`

## Handoff Protocol

Agents NEVER hold private keys. Flow:
1. Agent calls API to create token record
2. API returns handoff link
3. Agent shares link with human
4. Human signs transaction
`,

  "agentverse.md": `# Agentverse Deployment Rules

## API: https://agentverse.ai/v1
## Auth: Authorization: Bearer <AGENTVERSE_API_KEY>

## CRITICAL: Code Upload Format

The code field MUST be double-encoded JSON:
\`\`\`python
code_array = [{"language": "python", "name": "agent.py", "value": source_code}]
payload = {"code": json.dumps(code_array)}
\`\`\`

## Agent Code Requirements

- Use \`Agent()\` with zero params
- Use Chat Protocol v0.3.0
- Must have \`ChatAcknowledgement\` handler
- Use \`ctx.logger\`, never \`print()\`
- Use \`datetime.now()\` not \`utcnow()\`
- Include \`publish_manifest=True\`

## Deployment Flow

1. POST /v1/hosting/agents -> creates agent
2. PUT /v1/hosting/agents/{addr}/code -> upload
3. POST /v1/hosting/secrets -> set secrets
4. POST /v1/hosting/agents/{addr}/start -> start
5. Poll until compiled (15-60s)
`,

  "uagent-patterns.md": `# uAgent Code Patterns

> For new agents, use the genesis template: \`agentlaunch scaffold myagent --type genesis\`

## Minimal Working Agent

\`\`\`python
from uagents import Agent, Context
from uagents_core.contrib.protocols.chat import (
    ChatMessage, ChatAcknowledgement, TextContent,
    EndSessionContent, chat_protocol_spec
)
from datetime import datetime

agent = Agent()
chat_proto = agent.create_protocol(spec=chat_protocol_spec)

@chat_proto.on_message(ChatMessage)
async def handle_message(ctx: Context, sender: str, msg: ChatMessage):
    ctx.logger.info(f"Message from {sender}")
    text = msg.content[0].text if msg.content else ""

    await ctx.send(sender, ChatMessage(
        timestamp=datetime.now(),
        msg_id=msg.msg_id,
        content=[TextContent(text=f"You said: {text}")]
    ))
    await ctx.send(sender, ChatMessage(
        timestamp=datetime.now(),
        msg_id=msg.msg_id,
        content=[EndSessionContent()]
    ))

@chat_proto.on_message(ChatAcknowledgement)
async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement):
    ctx.logger.info(f"Ack: {msg.acknowledged_msg_id}")

agent.include(chat_proto, publish_manifest=True)

if __name__ == "__main__":
    agent.run()
\`\`\`

## Payment Protocol (Official)

\`\`\`python
from uagents_core.contrib.protocols.payment import (
    RequestPayment, CommitPayment, CompletePayment,
    RejectPayment, CancelPayment, Funds, payment_protocol_spec,
)

# Seller (service provider)
seller_proto = agent.create_protocol(spec=payment_protocol_spec, role="seller")

# Buyer (service consumer)
buyer_proto = agent.create_protocol(spec=payment_protocol_spec, role="buyer")
\`\`\`

## Commerce Layer (Genesis Template)

The genesis template includes inline commerce classes:
- PaymentService: Charge callers, pay other agents
- PricingTable: Per-service pricing from ctx.storage
- TierManager: Token-gated access (free/premium)
- WalletManager: Balance queries, fund alerts
- RevenueTracker: Income/expense logging
- SelfAwareMixin: Token price/holder awareness
- HoldingsManager: Buy/sell other agents' tokens
`,

  "payment-protocol.md": `# Payment Protocol Rules

## Official Imports (uagents_core)

\`\`\`python
from uagents_core.contrib.protocols.payment import (
    RequestPayment,
    CommitPayment,
    CompletePayment,
    RejectPayment,
    CancelPayment,
    Funds,
    payment_protocol_spec,
)
\`\`\`

## Role-Based Protocol Creation

\`\`\`python
# Seller (service provider)
seller_proto = agent.create_protocol(spec=payment_protocol_spec, role="seller")

# Buyer (service consumer)
buyer_proto = agent.create_protocol(spec=payment_protocol_spec, role="buyer")
\`\`\`

## Payment Flow

Buyer sends ChatMessage -> Seller sends RequestPayment -> Buyer sends CommitPayment (tx_hash) -> Seller verifies on-chain -> Seller sends CompletePayment.

## Denomination

- Testnet: atestfet (1 FET = 10^18 atestfet)
- Mainnet: afet (1 FET = 10^18 afet)

## Error Handling

- Always handle RejectPayment -- buyer may decline
- Always handle CancelPayment -- timeout or cancellation
- Verify tx_hash on-chain before delivering service
- Store transaction log in ctx.storage

## Genesis Template Commerce Layers

The genesis template includes these commerce classes inline:
- PaymentService, PricingTable, TierManager
- WalletManager, RevenueTracker, SelfAwareMixin, HoldingsManager
`,

  "genesis-network.md": `# Genesis Network Rules

## The 7 Roles

| Role | Token | Services | Price/call |
|------|-------|----------|-----------|
| Oracle | $DATA | price_feed, ohlc_history, market_summary | 0.001 FET |
| Brain | $THINK | reason, classify, summarize | 0.01 FET |
| Analyst | $RANK | score_token, evaluate_quality, rank_tokens | 0.005 FET |
| Coordinator | $COORD | route_query, discover_agents | 0.0005 FET |
| Sentinel | $WATCH | monitor, alert, anomaly_report | 0.002 FET |
| Launcher | $BUILD | find_gap, scaffold_agent, deploy_recommendation | 0.02 FET |
| Scout | $FIND | discover_agents, evaluate_agent, tokenize_recommendation | 0.01 FET |

## Build Order

Oracle -> Coordinator -> Analyst -> Sentinel -> Brain -> Launcher -> Scout

## Starter Configurations

- Minimum viable: Oracle + Coordinator (2 agents)
- Intelligence: Oracle + Brain + Coordinator (3 agents)
- Monitoring: Oracle + Analyst + Sentinel + Coordinator (4 agents)
- Full Genesis: All 7

## Cross-Holdings

Agents buy each other's tokens for economic alignment.

## Token Lifecycle

1. Deploy on Agentverse
2. Tokenize on AgentLaunch (120 FET deploy fee)
3. Bonding curve active (2% fee to protocol treasury, NO creator fee)
4. At 30,000 FET -> auto DEX listing (graduation)
`,

  "api-design.md": `# API Design Rules

## Response Format
\`\`\`json
{
  "success": boolean,
  "data": object | array,
  "error": null | { "code": string, "message": string }
}
\`\`\`

## Status Codes
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 429: Rate Limited
- 500: Server Error
`,

  "security-checklist.md": `# Security Checklist

## Agent Code
- Input validation on all messages
- Rate limiting per user
- Secrets in .env only
- Never log sensitive data
- Sanitize user input

## General
- No private keys in code
- .env in .gitignore
- Use ctx.logger not print
`,

  "testing.md": `# Testing Rules

## Local Testing
\`\`\`bash
source .env && python agent.py
\`\`\`

## Deploy Testing
\`\`\`bash
agentlaunch deploy
agentlaunch status <address>
\`\`\`
`,
};

// ---------------------------------------------------------------------------
// Skills — Claude's slash commands
// ---------------------------------------------------------------------------

export const SKILLS: Record<string, string> = {
  "build-agent/SKILL.md": `# /build-agent — Full Agent Lifecycle

Build, deploy, and tokenize an agent in one guided flow.

## Steps

1. Ask user what agent they want (name, description, functionality)
2. Generate agent.py code based on description
3. Show code, let user request changes
4. Deploy: \`agentlaunch deploy\`
5. Tokenize: \`agentlaunch tokenize --agent <address> --name "Name" --symbol SYM\`
6. Return handoff link for human to sign

## Platform Fees
- Deploy: 120 FET (paid by human signer)
- Trading: 2% to protocol treasury
`,

  "build-swarm/SKILL.md": `# /build-swarm — Deploy Agent Swarm

Scaffold, deploy, and tokenize a multi-agent swarm with the genesis template.

## Steps

1. Ask user what swarm they want (name, roles, purpose)
2. Show the 7 available presets: oracle, brain, analyst, coordinator, sentinel, launcher, scout
3. Let user pick roles (or suggest a starter configuration)
4. For each role:
   a. Scaffold from genesis template with preset variables
   b. Deploy to Agentverse
   c. Tokenize on AgentLaunch
5. Return handoff links for each agent

## Starter Configurations

- Minimum viable: Oracle + Coordinator (2 agents)
- Intelligence: Oracle + Brain + Coordinator (3 agents)
- Monitoring: Oracle + Analyst + Sentinel + Coordinator (4 agents)
- Full Genesis: All 7

## Platform Fees
- Deploy: 120 FET per agent (paid by human signer)
- Trading: 2% to protocol treasury (NO creator fee)
`,

  "deploy/SKILL.md": `# /deploy — Deploy to Agentverse

Deploy agent.py to Agentverse hosting.

## Command
\`\`\`bash
agentlaunch deploy
\`\`\`

## What It Does
1. Reads agent.py
2. Validates uAgent patterns
3. Creates agent on Agentverse
4. Uploads code
5. Sets secrets from .env
6. Starts agent
7. Waits for compilation
`,

  "tokenize/SKILL.md": `# /tokenize — Create Token

Create a tradeable token for an agent.

## Command
\`\`\`bash
agentlaunch tokenize --agent <address> --name "Name" --symbol SYM
\`\`\`

## Result
Returns a handoff link. Human clicks it, connects wallet, signs, token goes live.
`,

  "status/SKILL.md": `# /status — Check Status

Check agent and token status.

## Command
\`\`\`bash
agentlaunch status <address>
\`\`\`

Shows: running status, price, holders, progress to graduation.
`,

  "market/SKILL.md": `# /market — Browse Tokens

Browse tokens on AgentLaunch.

## Commands
\`\`\`bash
agentlaunch list
agentlaunch status <token_address>
\`\`\`
`,
};

// ---------------------------------------------------------------------------
// Docs — Full documentation
// ---------------------------------------------------------------------------

export const DOCS: Record<string, string> = {
  "getting-started.md": `# Getting Started

## Prerequisites
- Node.js 18+
- Agentverse API key from https://agentverse.ai/profile/api-keys

## Quick Start

\`\`\`bash
# Set API key
export AGENTVERSE_API_KEY=av-xxx

# Create agent project (genesis template recommended)
npx agentlaunch-cli create --type genesis

# Or deploy a full swarm
npx agentlaunch-cli create --type genesis --preset oracle
npx agentlaunch-cli create --type genesis --preset brain

# Or use SDK
npm install agentlaunch-sdk
\`\`\`

## The Agent-Human Handoff

Agents never hold private keys:
1. Agent calls API -> gets handoff link
2. Agent shares link with human
3. Human opens link, connects wallet, signs
4. Token goes live

## Platform Constants
- Deploy fee: 120 FET
- Graduation: 30,000 FET -> DEX listing
- Trading fee: 2% to protocol treasury (NO creator fee)
`,

  "sdk-reference.md": `# SDK Reference

\`\`\`bash
npm install agentlaunch-sdk
\`\`\`

## Key Functions

\`\`\`typescript
import {
  tokenize,           // Create token record
  getToken,           // Get token details
  listTokens,         // List all tokens
  getTokenPrice,      // Get current price
  getTokenHolders,    // Get holder list
  generateDeployLink, // Create deploy URL
  generateBuyLink,    // Create buy URL
  generateSellLink,   // Create sell URL
  deployAgent,        // Deploy to Agentverse
  getAgentRevenue,    // Get agent revenue data
  getPricingTable,    // Get agent pricing table
  getNetworkGDP,      // Get swarm GDP metrics
  listStorage,        // List agent storage keys
  getStorage,         // Get agent storage value
  putStorage,         // Set agent storage value
  deleteStorage,      // Delete agent storage key
} from 'agentlaunch-sdk';
\`\`\`

## Example: Create Token

\`\`\`typescript
const { data } = await tokenize({
  agentAddress: 'agent1q...',
  name: 'My Agent',
  symbol: 'MYAG',
  chainId: 97,
});

console.log(data.handoff_link); // Share with human
\`\`\`
`,

  "cli-reference.md": `# CLI Reference

\`\`\`bash
npm install -g agentlaunch-cli
\`\`\`

## Commands

| Command | Description |
|---------|-------------|
| \`agentlaunch create\` | Interactive: scaffold + deploy + tokenize |
| \`agentlaunch deploy\` | Deploy agent.py to Agentverse |
| \`agentlaunch tokenize\` | Create token + handoff link |
| \`agentlaunch list\` | List tokens |
| \`agentlaunch status <addr>\` | Token details |
| \`agentlaunch config set-key\` | Store API key |

## Full Workflow

\`\`\`bash
agentlaunch config set-key av-xxx
agentlaunch create
# Answer prompts -> agent deployed + tokenized
\`\`\`
`,

  "mcp-tools.md": `# MCP Tools Reference

The MCP server provides 13+ tools for Claude Code.

## Setup

Already configured in \`.claude/settings.json\`.

## Key Tools

| Tool | Description |
|------|-------------|
| \`scaffold_agent\` | Generate agent code from template |
| \`scaffold_genesis\` | Scaffold agent from genesis preset |
| \`deploy_to_agentverse\` | Deploy agent |
| \`create_token_record\` | Create token |
| \`list_tokens\` | Browse tokens |
| \`get_token\` | Token details |
| \`calculate_buy\` | Preview buy |
| \`calculate_sell\` | Preview sell |
| \`get_trade_link\` | Generate trade URL |
| \`check_agent_commerce\` | Revenue, pricing, balance for an agent |
| \`network_status\` | Swarm GDP, per-agent health |
| \`deploy_swarm\` | Deploy multiple agents as a swarm |

## Example Prompts

- "Create a price monitoring agent"
- "Deploy my agent to Agentverse"
- "Tokenize my agent as $MYTOKEN"
- "Show trending tokens"
- "Deploy an Oracle + Brain + Analyst swarm"
- "Check my swarm's GDP"
`,
};

// ---------------------------------------------------------------------------
// Examples — Reference implementations
// ---------------------------------------------------------------------------

export const EXAMPLES: Record<string, string> = {
  "price-monitor.py": `"""
Price Monitor Agent — Token Price Alerts

Monitors token prices and sends alerts when thresholds are crossed.
"""

from datetime import datetime
from uuid import uuid4
import os
import requests
from uagents import Agent, Context, Protocol
from uagents_core.contrib.protocols.chat import (
    ChatAcknowledgement, ChatMessage, TextContent,
    EndSessionContent, chat_protocol_spec
)

agent = Agent()
chat_proto = Protocol(spec=chat_protocol_spec)

API_URL = os.environ.get("AGENT_LAUNCH_API_URL", "https://agent-launch.ai/api")

# Store watches: user_id -> [{address, threshold}]
watches = {}

def fetch_price(token_address: str) -> float | None:
    try:
        r = requests.get(f"{API_URL}/tokens/address/{token_address}", timeout=10)
        if r.ok:
            return float(r.json().get("price", 0))
    except:
        pass
    return None

@chat_proto.on_message(ChatMessage)
async def handle(ctx: Context, sender: str, msg: ChatMessage):
    await ctx.send(sender, ChatAcknowledgement(
        timestamp=datetime.now(), acknowledged_msg_id=msg.msg_id
    ))

    text = msg.content[0].text if msg.content else ""

    if text.startswith("watch "):
        addr = text.split()[1]
        price = fetch_price(addr)
        if price:
            watches.setdefault(sender, []).append({"address": addr, "baseline": price})
            response = f"Watching {addr[:12]}... at {price:.6f} FET"
        else:
            response = "Could not fetch price"
    elif text.startswith("price "):
        addr = text.split()[1]
        price = fetch_price(addr)
        response = f"{price:.6f} FET" if price else "Error"
    else:
        response = "Commands: watch <addr>, price <addr>"

    await ctx.send(sender, ChatMessage(
        timestamp=datetime.now(), msg_id=uuid4(),
        content=[TextContent(text=response), EndSessionContent()]
    ))

@chat_proto.on_message(ChatAcknowledgement)
async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement):
    pass

agent.include(chat_proto, publish_manifest=True)

if __name__ == "__main__":
    agent.run()
`,

  "trading-signals.py": `"""
Trading Signal Agent — Buy/Sell Recommendations

Analyzes token prices and generates trading signals.
"""

from datetime import datetime
from uuid import uuid4
import os
import requests
from uagents import Agent, Context, Protocol
from uagents_core.contrib.protocols.chat import (
    ChatAcknowledgement, ChatMessage, TextContent,
    EndSessionContent, chat_protocol_spec
)

agent = Agent()
chat_proto = Protocol(spec=chat_protocol_spec)

API_URL = os.environ.get("AGENT_LAUNCH_API_URL", "https://agent-launch.ai/api")

# Simple price history
price_history = {}

def get_signal(addr: str) -> str:
    try:
        r = requests.get(f"{API_URL}/tokens/address/{addr}", timeout=10)
        if r.ok:
            data = r.json()
            price = float(data.get("price", 0))
            change = float(data.get("price_change_24h", 0))

            history = price_history.setdefault(addr, [])
            history.append(price)
            if len(history) > 10:
                history.pop(0)

            ma = sum(history) / len(history) if history else price
            pct = ((price - ma) / ma * 100) if ma else 0

            if pct > 5:
                return f"BUY - Price {pct:.1f}% above MA"
            elif pct < -5:
                return f"SELL - Price {pct:.1f}% below MA"
            else:
                return f"HOLD - Price at {price:.6f} FET"
    except:
        pass
    return "ERROR"

@chat_proto.on_message(ChatMessage)
async def handle(ctx: Context, sender: str, msg: ChatMessage):
    await ctx.send(sender, ChatAcknowledgement(
        timestamp=datetime.now(), acknowledged_msg_id=msg.msg_id
    ))

    text = msg.content[0].text if msg.content else ""

    if text.startswith("signal "):
        addr = text.split()[1]
        response = get_signal(addr)
    else:
        response = "Usage: signal <token_address>"

    await ctx.send(sender, ChatMessage(
        timestamp=datetime.now(), msg_id=uuid4(),
        content=[TextContent(text=response), EndSessionContent()]
    ))

@chat_proto.on_message(ChatAcknowledgement)
async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement):
    pass

agent.include(chat_proto, publish_manifest=True)

if __name__ == "__main__":
    agent.run()
`,

  "research-agent.py": `"""
Research Agent — AI-Powered Analysis

Uses AI to generate research reports on tokens.
"""

from datetime import datetime
from uuid import uuid4
import os
import requests
from uagents import Agent, Context, Protocol
from uagents_core.contrib.protocols.chat import (
    ChatAcknowledgement, ChatMessage, TextContent,
    EndSessionContent, chat_protocol_spec
)

agent = Agent()
chat_proto = Protocol(spec=chat_protocol_spec)

API_URL = os.environ.get("AGENT_LAUNCH_API_URL", "https://agent-launch.ai/api")
HF_TOKEN = os.environ.get("HF_TOKEN", "")

def get_token_data(addr: str) -> dict:
    try:
        r = requests.get(f"{API_URL}/tokens/address/{addr}", timeout=10)
        if r.ok:
            return r.json()
    except:
        pass
    return {}

def generate_report(query: str, data: dict) -> str:
    if not HF_TOKEN:
        return f"Token: {data.get('name', 'Unknown')}\\nPrice: {data.get('price', '?')} FET\\nProgress: {data.get('progress', 0):.1f}%"

    try:
        prompt = f"Analyze this token: {query}. Data: {data}"
        r = requests.post(
            "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
            headers={"Authorization": f"Bearer {HF_TOKEN}"},
            json={"inputs": prompt, "parameters": {"max_new_tokens": 200}},
            timeout=30
        )
        if r.ok:
            return r.json()[0].get("generated_text", "")[:500]
    except:
        pass
    return "Could not generate report"

@chat_proto.on_message(ChatMessage)
async def handle(ctx: Context, sender: str, msg: ChatMessage):
    await ctx.send(sender, ChatAcknowledgement(
        timestamp=datetime.now(), acknowledged_msg_id=msg.msg_id
    ))

    text = msg.content[0].text if msg.content else ""

    if text.startswith("research "):
        addr = text.split()[1]
        data = get_token_data(addr)
        response = generate_report(text, data)
    else:
        response = "Usage: research <token_address>"

    await ctx.send(sender, ChatMessage(
        timestamp=datetime.now(), msg_id=uuid4(),
        content=[TextContent(text=response), EndSessionContent()]
    ))

@chat_proto.on_message(ChatAcknowledgement)
async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement):
    pass

agent.include(chat_proto, publish_manifest=True)

if __name__ == "__main__":
    agent.run()
`,

  "sdk-tokenize.ts": `/**
 * SDK Example: Create and Tokenize an Agent
 */
import { tokenize, generateDeployLink, getToken } from 'agentlaunch-sdk';

async function main() {
  // Create token record
  const { data } = await tokenize({
    agentAddress: 'agent1q...', // Your Agentverse agent
    name: 'My Agent',
    symbol: 'MYAG',
    description: 'Does amazing things',
    chainId: 97, // BSC Testnet
  });

  console.log('Token ID:', data.token_id);
  console.log('Handoff Link:', data.handoff_link);

  // Share this link with a human to deploy on-chain
  // They will pay 120 FET to deploy

  // After deployment, check status
  // const token = await getToken(data.token_address);
  // console.log('Price:', token.price);
}

main().catch(console.error);
`,
};

// ---------------------------------------------------------------------------
// Package.json for scaffolded projects
// ---------------------------------------------------------------------------

export function buildPackageJson(name: string): string {
  return JSON.stringify(
    {
      name: name.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      version: "1.0.0",
      description: `${name} - AgentLaunch Agent`,
      scripts: {
        deploy: "agentlaunch deploy",
        tokenize: "agentlaunch tokenize",
        status: "agentlaunch status",
        list: "agentlaunch list",
      },
      dependencies: {
        "agentlaunch-sdk": "^0.2.0",
      },
      devDependencies: {
        "agentlaunch-cli": "^1.1.0",
      },
    },
    null,
    2
  ) + "\n";
}

// ---------------------------------------------------------------------------
// CLAUDE.md builder for scaffolded projects
// ---------------------------------------------------------------------------

export function buildClaudeMd(name: string): string {
  return `# ${name} — AgentLaunch Agent

## What This Is

An AI agent built with the AgentLaunch Toolkit. It runs on Agentverse and
has a tradeable ERC-20 token on the bonding curve.

## Authentication

**The Agentverse API key is already configured in \`.env\`** — do NOT ask the user for it again.
To deploy or tokenize, simply run the commands below. The SDK and CLI read from \`.env\` automatically.

## Templates

| Template | Description | Use Case |
|----------|-------------|----------|
| \`genesis\` | **Full commerce stack** (recommended) | Any agent that charges for services |
| \`custom\` | Blank Chat Protocol boilerplate | Start from scratch |
| \`price-monitor\` | Watch token prices, send alerts | Monitoring service |
| \`trading-bot\` | Buy/sell signal generation | Trading service |
| \`data-analyzer\` | On-chain data analysis | Analytics service |
| \`research\` | Deep dives and reports | Research service |
| \`gifter\` | Treasury wallet + rewards | Community incentives |

## Agent Swarms

The genesis template generates agents with a complete commerce stack:
- PaymentService, PricingTable, TierManager (charge for services)
- WalletManager, RevenueTracker (track revenue)
- SelfAwareMixin (token price awareness)
- HoldingsManager (buy/sell other tokens)

### Presets
7 pre-configured roles: oracle, brain, analyst, coordinator, sentinel, launcher, scout.
Use presets for instant configuration.

## Quick Commands

- \`npm run deploy\` — Deploy to Agentverse
- \`npm run tokenize\` — Create token + handoff link
- \`npm run status\` — Check status

## Key Files

- \`agent.py\` — Your agent code (edit this!)
- \`CLAUDE.md\` — This file
- \`docs/\` — SDK, CLI, MCP documentation
- \`examples/\` — Working code samples

## SDK Reference

\`\`\`typescript
import {
  tokenize,           // Create token record
  getToken,           // Get token details
  listTokens,         // List all tokens
  getTokenPrice,      // Get current price
  getTokenHolders,    // Get holder list
  generateDeployLink, // Create deploy URL
  generateBuyLink,    // Create buy URL
  generateSellLink,   // Create sell URL
  deployAgent,        // Deploy to Agentverse
  getAgentRevenue,    // Get agent revenue data
  getPricingTable,    // Get agent pricing table
  getNetworkGDP,      // Get swarm GDP metrics
  listStorage,        // List agent storage keys
  getStorage,         // Get agent storage value
  putStorage,         // Set agent storage value
  deleteStorage,      // Delete agent storage key
} from 'agentlaunch-sdk';
\`\`\`

## MCP Tools

| Tool | Description |
|------|-------------|
| \`scaffold_agent\` | Generate agent code from template |
| \`scaffold_genesis\` | Scaffold agent from genesis preset |
| \`deploy_to_agentverse\` | Deploy agent |
| \`create_token_record\` | Create token |
| \`list_tokens\` | Browse tokens |
| \`get_token\` | Token details |
| \`calculate_buy\` | Preview buy |
| \`calculate_sell\` | Preview sell |
| \`get_trade_link\` | Generate trade URL |
| \`check_agent_commerce\` | Revenue, pricing, balance for an agent |
| \`network_status\` | Swarm GDP, per-agent health |
| \`deploy_swarm\` | Deploy multiple agents as a swarm |

## Platform Constants

- Deploy fee: 120 FET
- Graduation: 30,000 FET liquidity -> auto DEX listing
- Trading fee: 2% to protocol treasury (NO creator fee)
`;
}

// ---------------------------------------------------------------------------
// Cursor IDE config
// ---------------------------------------------------------------------------

export const CURSOR_MCP_CONFIG = JSON.stringify(
  {
    mcpServers: {
      "agent-launch": {
        command: "npx",
        args: ["-y", "agent-launch-mcp"],
        env: {
          AGENTVERSE_API_KEY: "${AGENTVERSE_API_KEY}",
        },
      },
    },
  },
  null,
  2
) + "\n";

export const CURSOR_RULES = `# AgentLaunch Agent Project

This is an AgentLaunch agent project. Use the MCP tools to build, deploy, and tokenize.

## Quick Commands

- \`npm run deploy\` - Deploy to Agentverse
- \`npm run tokenize\` - Create token + handoff link
- \`npm run status\` - Check status

## Key Files

- \`agent.py\` - Your agent code (edit this!)
- \`CLAUDE.md\` - Full context for Claude
- \`docs/\` - SDK, CLI, MCP documentation
- \`examples/\` - Working code samples

## Genesis Template (Recommended)

Use the genesis template for agents with a full commerce stack:
- Payment handling, pricing tables, revenue tracking
- Token-gated tiers, wallet management
- 7 presets: oracle, brain, analyst, coordinator, sentinel, launcher, scout

## Platform Constants

- Deploy fee: 120 FET
- Graduation: 30,000 FET liquidity
- Trading fee: 2% to protocol treasury (NO creator fee)
`;

// ---------------------------------------------------------------------------
// Swarm-specific generators
// ---------------------------------------------------------------------------

export interface SwarmAgent {
  name: string;
  preset: string;
  address: string;
  status: string;
  code?: string;
}

export interface SwarmContext {
  swarmName: string;
  agents: SwarmAgent[];
  peerAddresses: Record<string, string>;
  deployedAt: string;
}

/**
 * Builds a CLAUDE.md for deployed agents (single or swarm).
 * This gives Claude Code full context about what was deployed.
 */
export function buildSwarmClaudeMd(ctx: SwarmContext): string {
  const isSingleAgent = ctx.agents.length === 1;

  const presetDescriptions: Record<string, string> = {
    oracle: "Market data provider — price feeds, OHLC history, market summaries (0.001 FET/call)",
    brain: "LLM reasoning engine — query classification, summarization, deep analysis (0.01 FET/call)",
    analyst: "Token scoring engine — quality evaluation, risk assessment, ranking (0.005 FET/call)",
    coordinator: "Query router — discovers agents, routes queries to specialists (0.0005 FET/call)",
    sentinel: "Real-time watchdog — monitors tokens, detects anomalies, sends alerts (0.002 FET/call)",
    launcher: "Gap finder — discovers unmet needs, scaffolds new agents (0.02 FET/call)",
    scout: "Agent scout — discovers promising agents, evaluates quality (0.01 FET/call)",
  };

  if (isSingleAgent) {
    const agent = ctx.agents[0];
    const desc = presetDescriptions[agent.preset] || agent.preset;
    return `# ${ctx.swarmName}

## Your Agent

| Field | Value |
|-------|-------|
| **Name** | ${agent.name} |
| **Type** | ${agent.preset.charAt(0).toUpperCase() + agent.preset.slice(1)} |
| **Address** | \`${agent.address}\` |
| **Status** | ${agent.status} |

**What it does:** ${desc}

## Project Structure

\`\`\`
${ctx.swarmName}/
  agent.py               # Your agent code (edit this!)
  CLAUDE.md              # This file
  agentlaunch.config.json
  .env                   # API key (already configured)
  .claude/               # Claude Code settings
  docs/                  # Documentation
\`\`\`

## What's Already Done

1. **Agent deployed** — Running on Agentverse at \`${agent.address}\`
2. **Commerce ready** — Has pricing built in (${desc.split('—')[1]?.trim() || 'charges for services'})
3. **API key set** — Your Agentverse API key is in \`.env\`

## Next Steps

### 1. Tokenize your agent (so you can earn from trading)
\`\`\`bash
agentlaunch tokenize --agent ${agent.address} --name "${agent.name}" --symbol "${agent.preset.slice(0, 4).toUpperCase()}"
\`\`\`
You'll get a handoff link. Share it with someone who has a wallet to pay the 120 FET deploy fee.

### 2. Customize pricing
Edit \`agent.py\` and look for the \`PRICING\` section. Adjust prices based on value you provide.

### 3. Check status
\`\`\`bash
agentlaunch status ${agent.address}
\`\`\`

## What Makes an Agent Valuable?

Agents earn fees when they provide **real value**:
- **Data providers** (Oracle): Sell accurate, timely market data
- **AI services** (Brain): Sell quality reasoning and analysis
- **Infrastructure** (Coordinator): Become the routing layer other agents depend on

The more agents that depend on yours, the more fees you earn. Consider:
1. What unique data or capability do you have?
2. Who would pay for it?
3. How can you make other agents need your service?

## Platform Constants

- Deploy fee: **120 FET** (paid when tokenizing)
- Graduation: **30,000 FET** liquidity → auto DEX listing
- Trading fee: **2%** → 100% to protocol treasury (no creator fee)
`;
  }

  // Multi-agent swarm
  const agentTable = ctx.agents
    .map((a) => `| ${a.preset} | \`${a.address}\` | ${a.status} |`)
    .join("\n");

  const addressList = ctx.agents
    .map((a) => `${a.preset.toUpperCase()}_ADDRESS=${a.address}`)
    .join("\n");

  const roleDetails = ctx.agents
    .map((a) => {
      const desc = presetDescriptions[a.preset] || a.preset;
      return `### ${a.preset.charAt(0).toUpperCase() + a.preset.slice(1)}

- **Address:** \`${a.address}\`
- **Status:** ${a.status}
- **Description:** ${desc}
- **Code:** \`agents/${a.preset}.py\``;
    })
    .join("\n\n");

  return `# ${ctx.swarmName} — Agent Swarm

## What This Is

A deployed multi-agent swarm on the Fetch.ai Agentverse platform.
Deployed at: ${ctx.deployedAt}

## Deployed Agents

| Role | Address | Status |
|------|---------|--------|
${agentTable}

## Agent Roles

${roleDetails}

## Peer Addresses

These environment variables are set as secrets on each agent so they can communicate:

\`\`\`bash
${addressList}
\`\`\`

## Project Structure

\`\`\`
${ctx.swarmName}/
  CLAUDE.md              # This file (swarm context)
  agentlaunch.config.json # Swarm configuration with all addresses
  .env                   # API key (already configured)
  agents/                # Individual agent code
${ctx.agents.map((a) => `    ${a.preset}.py`).join("\n")}
  .claude/               # Claude Code settings
    settings.json        # MCP server config
    rules/               # Coding guidelines
    skills/              # Slash commands
  docs/                  # SDK, CLI, MCP documentation
  examples/              # Working code samples
\`\`\`

## What's Already Done

1. **Agents deployed** — All ${ctx.agents.length} agents are running on Agentverse
2. **Secrets configured** — Each agent knows its peers' addresses
3. **API key set** — Your Agentverse API key is in \`.env\`

## Next Steps

### 1. Verify agents are running
\`\`\`bash
agentlaunch status ${ctx.agents[0]?.address || "<address>"}
\`\`\`

### 2. Tokenize an agent
\`\`\`bash
agentlaunch tokenize \\
  --agent ${ctx.agents[0]?.address || "<address>"} \\
  --name "${ctx.agents[0]?.name || "AgentName"}" \\
  --symbol "${ctx.agents[0]?.preset?.slice(0, 4).toUpperCase() || "SYMB"}"
\`\`\`

You'll receive a handoff link. Share it with someone who has a wallet to deploy the token on-chain (120 FET fee).

### 3. Customize agent behavior
Edit the code in \`agents/<role>.py\` and redeploy:
\`\`\`bash
agentlaunch deploy --code agents/oracle.py --address ${ctx.agents.find((a) => a.preset === "oracle")?.address || "<oracle-address>"}
\`\`\`

### 4. Monitor the swarm
\`\`\`bash
agentlaunch list  # See all your tokens
\`\`\`

## Platform Constants

- Deploy fee: **120 FET** (paid when tokenizing)
- Graduation: **30,000 FET** liquidity → auto DEX listing
- Trading fee: **2%** → 100% to protocol treasury (no creator fee)

## MCP Tools Available

This project has MCP tools pre-configured. You can use:
- \`list_tokens\` — Browse all tokens
- \`get_token\` — Get details for a specific token
- \`calculate_buy\` / \`calculate_sell\` — Preview trades
- \`create_token_record\` — Tokenize an agent
- \`deploy_to_agentverse\` — Deploy code updates
- \`check_agent_commerce\` — Revenue, pricing, balance
- \`network_status\` — Swarm GDP, per-agent health

## Resources

- [AgentLaunch Platform](https://agent-launch.ai)
- [Agentverse](https://agentverse.ai)
- [Your Agents](https://agentverse.ai/agents)
`;
}

/**
 * Builds agentlaunch.config.json for a deployed swarm.
 */
export function buildSwarmConfig(ctx: SwarmContext): string {
  const agents: Record<string, { address: string; status: string }> = {};
  for (const a of ctx.agents) {
    agents[a.preset] = { address: a.address, status: a.status };
  }

  return JSON.stringify(
    {
      name: ctx.swarmName,
      type: "swarm",
      chain: 97,
      deployedAt: ctx.deployedAt,
      agents,
      peerAddresses: ctx.peerAddresses,
    },
    null,
    2
  ) + "\n";
}

/**
 * Builds package.json for a deployed swarm.
 */
export function buildSwarmPackageJson(swarmName: string): string {
  return JSON.stringify(
    {
      name: swarmName.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      version: "1.0.0",
      description: `${swarmName} - AgentLaunch Swarm`,
      scripts: {
        status: "agentlaunch status",
        list: "agentlaunch list",
        tokenize: "agentlaunch tokenize",
      },
      dependencies: {
        "agentlaunch-sdk": "^0.2.0",
      },
      devDependencies: {
        "agentlaunch-cli": "^1.1.0",
      },
    },
    null,
    2
  ) + "\n";
}
