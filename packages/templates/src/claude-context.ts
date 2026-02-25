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
POST  /api/agents/tokenize              Create token -> handoff link
GET   /api/agents/tokens                List tokens
GET   /api/agents/token/{address}       Token details
GET   /api/tokens/calculate-buy         Preview buy
GET   /api/tokens/calculate-sell        Preview sell
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

# Create agent project
npx agentlaunch-cli create

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
- Trading fee: 2% to protocol
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
| \`scaffold_agent\` | Generate agent code |
| \`deploy_to_agentverse\` | Deploy agent |
| \`create_token_record\` | Create token |
| \`list_tokens\` | Browse tokens |
| \`get_token\` | Token details |
| \`calculate_buy\` | Preview buy |
| \`calculate_sell\` | Preview sell |
| \`get_trade_link\` | Generate trade URL |

## Example Prompts

- "Create a price monitoring agent"
- "Deploy my agent to Agentverse"
- "Tokenize my agent as $MYTOKEN"
- "Show trending tokens"
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
        r = requests.get(f"{API_URL}/agents/token/{token_address}", timeout=10)
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
        r = requests.get(f"{API_URL}/agents/token/{addr}", timeout=10)
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
        r = requests.get(f"{API_URL}/agents/token/{addr}", timeout=10)
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

## Platform Constants

- Deploy fee: 120 FET
- Graduation: 30,000 FET liquidity
- Trading fee: 2% to protocol treasury
`;
