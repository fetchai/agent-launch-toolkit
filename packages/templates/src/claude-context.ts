/**
 * claude-context.ts — Claude Code rules and skills for scaffolded projects
 *
 * These files are copied to every new agent project so Claude has full context
 * to help build, deploy, and tokenize agents.
 */

// ---------------------------------------------------------------------------
// Rules
// ---------------------------------------------------------------------------

export const RULES = {
  "agentlaunch.md": `# AgentLaunch Platform Rules

When working with AgentLaunch tokens and the platform API:

## Constants (from smart contracts -- never change)

- Deploy fee: 120 FET (read from contract, can change via multi-sig)
- Graduation: 30,000 FET liquidity -> auto DEX listing
- Trading fee: 2% -> 100% to REVENUE_ACCOUNT (protocol treasury)
- NO creator fee. The 2% fee has NO split. All to protocol.
- Total buy supply: 800,000,000 tokens per token
- Default chain: BSC (testnet=97, mainnet=56)

## API Authentication

- Use \`X-API-Key\` header with Agentverse API key
- Key is read from \`.env\` AGENTVERSE_API_KEY
- No wallet signatures needed for API calls

## API Base URLs

- Production (default): \`https://agent-launch.ai/api\`
- Dev: set \`AGENT_LAUNCH_ENV=dev\`

## Handoff Protocol

- Agents NEVER hold private keys
- All on-chain actions go through handoff links
- Deploy link: \`https://agent-launch.ai/deploy/{tokenId}\`
- Trade link: \`https://agent-launch.ai/trade/{tokenAddress}?action=buy&amount=100\`

## Key Endpoints

\`\`\`
POST  /api/agents/tokenize              Create token -> handoff link
GET   /api/agents/tokens                List tokens
GET   /api/agents/token/{address}       Token details
GET   /api/tokens/calculate-buy         Preview buy
GET   /api/tokens/calculate-sell        Preview sell
GET   /api/platform/stats               Platform stats
\`\`\`

## Token Lifecycle

1. Agent calls POST /api/agents/tokenize with name, symbol, description
2. API returns token record with handoff link
3. Human visits link, connects wallet, signs transaction (pays 120 FET)
4. Token deploys on-chain with bonding curve
5. At 30,000 FET liquidity, auto-lists on DEX
`,

  "agentverse.md": `# Agentverse Deployment Rules

When deploying agents to Agentverse:

## API Base URL

\`\`\`
https://agentverse.ai/v1
\`\`\`

## Auth Header

\`\`\`
Authorization: Bearer <AGENTVERSE_API_KEY>
\`\`\`

Note: Capital "Bearer", followed by space, then the raw API key.

## CRITICAL: Code Upload Format

The code field MUST be double-encoded JSON:

\`\`\`python
code_array = [{"language": "python", "name": "agent.py", "value": source_code}]
payload = {"code": json.dumps(code_array)}
\`\`\`

## Agent Code Requirements

- Use \`Agent()\` with zero params (Agentverse provides config)
- Use Chat Protocol v0.3.0 from \`uagents_core.contrib.protocols.chat\`
- Must have \`@chat_proto.on_message(ChatAcknowledgement)\` handler
- Use \`ctx.logger\`, never \`print()\`
- Use \`datetime.now()\` not \`datetime.utcnow()\` (deprecated)
- End sessions with \`EndSessionContent\`
- Include \`publish_manifest=True\` in \`agent.include()\`

## Deployment Flow

1. \`POST /v1/hosting/agents\` -- creates agent, returns address
2. \`PUT /v1/hosting/agents/{addr}/code\` -- upload (double-encoded!)
3. \`POST /v1/hosting/secrets\` -- set AGENTVERSE_API_KEY etc.
4. \`POST /v1/hosting/agents/{addr}/start\` -- start agent
5. \`GET /v1/hosting/agents/{addr}\` -- poll until compiled=true (15-60s)

## Common Errors

- "Invalid code format" -- code field not json.dumps'd
- Agent stuck in "compiling" -- wait longer, check logs for syntax errors
- 401 Unauthorized -- bad API key or missing "Bearer" prefix
`,

  "uagent-patterns.md": `# uAgent Code Patterns

When writing Agentverse agent code:

## Minimal Working Agent

\`\`\`python
from uagents import Agent, Context
from uagents_core.contrib.protocols.chat import (
    ChatMessage, ChatAcknowledgement, TextContent,
    EndSessionContent, chat_protocol_spec
)
from datetime import datetime

agent = Agent()  # Zero params on Agentverse
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
    ctx.logger.info(f"Ack from {sender}: {msg.acknowledged_msg_id}")

agent.include(chat_proto, publish_manifest=True)

if __name__ == "__main__":
    agent.run()
\`\`\`

## Rules

- Always use \`Agent()\` with zero params on Agentverse
- Always include \`ChatAcknowledgement\` handler (required by protocol)
- Always end conversations with \`EndSessionContent\`
- Always use \`ctx.logger\` (never \`print\`)
- Always use \`datetime.now()\` (never \`utcnow\`, it is deprecated)
- Always include \`publish_manifest=True\` in \`agent.include()\`
`,
};

// ---------------------------------------------------------------------------
// Skills
// ---------------------------------------------------------------------------

export const SKILLS = {
  "build-agent/SKILL.md": `# /build-agent -- Full Agent Lifecycle

Build, deploy, and tokenize an agent in one guided flow.

## Steps

1. **Gather requirements**: Ask the user what kind of agent they want to build.
   Get the agent name, ticker symbol, and description.

2. **Scaffold the agent code**: Generate agent code based on the description.
   Use the patterns in .claude/rules/uagent-patterns.md as a reference.

3. **Review with user**: Show the generated code. Let them request changes.

4. **Deploy to Agentverse**:
   - Run: \`agentlaunch deploy\`
   - This creates the agent, uploads code, sets secrets, and starts it
   - Poll until compiled (60s timeout)

5. **Tokenize on AgentLaunch**:
   - Run: \`agentlaunch tokenize --agent <address> --name "Name" --symbol SYM\`
   - Returns a handoff link for the human to sign

6. **Return results to user**:
   - Agent address (agent1q...)
   - Token handoff link
   - Instructions: "Click this link, connect your wallet, and sign to deploy"

## Platform Fee Note

The 120 FET deployment fee is paid by the human who signs the transaction.
The 2% trading fee goes 100% to protocol treasury (no creator fee).
`,

  "deploy/SKILL.md": `# /deploy -- Deploy Agent to Agentverse

Deploy the agent.py file to the Agentverse hosting platform.

## Usage

\`\`\`
/deploy
\`\`\`

## What It Does

1. Reads agent.py from the current directory
2. Validates it follows uAgent patterns
3. Creates agent on Agentverse
4. Uploads code (handles double-encoding automatically)
5. Sets secrets from .env
6. Starts the agent
7. Polls until compiled (60s timeout)
8. Shows the agent address and status

## CLI Command

\`\`\`bash
agentlaunch deploy
\`\`\`

## Auth

Uses AGENTVERSE_API_KEY from \`.env\`
`,

  "tokenize/SKILL.md": `# /tokenize -- Tokenize an Agent

Create a tradeable token for an existing Agentverse agent.

## Usage

\`\`\`
/tokenize
\`\`\`

## What It Does

1. Reads agent address from agentlaunch.config.json (or prompts)
2. Creates token record on AgentLaunch
3. Returns a handoff link for the human to sign

## CLI Command

\`\`\`bash
agentlaunch tokenize --agent <address> --name "Name" --symbol SYM
\`\`\`

## Next Steps After Tokenizing

1. Human clicks the handoff link
2. Connects wallet (ASI Wallet recommended)
3. Signs transaction (pays 120 FET deployment fee)
4. Token goes live on the bonding curve
5. At 30,000 FET liquidity, graduates to DEX
`,

  "status/SKILL.md": `# /status -- Check Agent and Token Status

Check the deployment status of agents and tokens.

## Usage

\`\`\`
/status
\`\`\`

## What It Does

- Shows agent status (running, compiled, address)
- Shows token status if tokenized (price, holders, progress)
- Shows platform stats

## CLI Command

\`\`\`bash
agentlaunch status <address>
\`\`\`
`,

  "market/SKILL.md": `# /market -- Browse Tokens and Prices

Browse tokens on AgentLaunch and check market data.

## Usage

\`\`\`
/market
\`\`\`

## What It Does

- Lists trending tokens with prices
- Shows token details for a specific address
- Previews buy/sell amounts

## CLI Command

\`\`\`bash
agentlaunch list
agentlaunch status <token_address>
\`\`\`
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
