import fs from "node:fs";
import path from "node:path";
import { Command } from "commander";

// ─── Template files to install ───────────────────────────────────────────────
// These are embedded as string content (not external files) so the CLI is self-contained.
// Each entry: [relativePath, content, mergeStrategy]

type MergeStrategy = "write" | "merge-mcp" | "skip-if-env";

interface TemplateFile {
  path: string;
  content: string;
  strategy: MergeStrategy;
  description: string;
}

function getTemplateFiles(): TemplateFile[] {
  return [
    {
      path: ".env.example",
      content: getEnvExample(),
      strategy: "skip-if-env",
      description: "Environment configuration template",
    },
    {
      path: ".claude/settings.json",
      content: getClaudeSettings(),
      strategy: "merge-mcp",
      description: "Claude Code MCP server configuration",
    },
    {
      path: ".claude/rules/agentlaunch.md",
      content: getAgentlaunchRule(),
      strategy: "write",
      description: "AgentLaunch platform constants and rules",
    },
    {
      path: ".claude/rules/agentverse.md",
      content: getAgentverseRule(),
      strategy: "write",
      description: "Agentverse API patterns",
    },
    {
      path: ".claude/rules/uagent-patterns.md",
      content: getUagentRule(),
      strategy: "write",
      description: "uAgent Chat Protocol patterns",
    },
    {
      path: ".claude/skills/build-agent/SKILL.md",
      content: getBuildAgentSkill(),
      strategy: "write",
      description: "Skill: scaffold -> deploy -> tokenize",
    },
    {
      path: ".claude/skills/deploy/SKILL.md",
      content: getDeploySkill(),
      strategy: "write",
      description: "Skill: deploy agent to Agentverse",
    },
    {
      path: ".claude/skills/tokenize/SKILL.md",
      content: getTokenizeSkill(),
      strategy: "write",
      description: "Skill: create token + handoff link",
    },
    {
      path: ".claude/skills/market/SKILL.md",
      content: getMarketSkill(),
      strategy: "write",
      description: "Skill: browse tokens and prices",
    },
    {
      path: ".claude/skills/status/SKILL.md",
      content: getStatusSkill(),
      strategy: "write",
      description: "Skill: check agent/token status",
    },
    {
      path: ".cursor/rules/agentlaunch.md",
      content: getCursorRule(),
      strategy: "write",
      description: "Cursor IDE rules for AgentLaunch",
    },
    {
      path: "CLAUDE.md",
      content: getProjectClaudeMd(),
      strategy: "write" as MergeStrategy,
      description: "Project context for Claude Code",
    },
    {
      path: "AGENTS.md",
      content: getAgentsMd(),
      strategy: "write" as MergeStrategy,
      description: "Integration guide for any coding agent",
    },
    {
      path: "docs/agentlaunch/getting-started.md",
      content: getGettingStartedDoc(),
      strategy: "write" as MergeStrategy,
      description: "AgentLaunch quick start guide",
    },
    {
      path: "docs/agentlaunch/sdk-reference.md",
      content: getSdkReferenceDoc(),
      strategy: "write" as MergeStrategy,
      description: "TypeScript SDK API reference",
    },
    {
      path: "docs/agentlaunch/cli-reference.md",
      content: getCliReferenceDoc(),
      strategy: "write" as MergeStrategy,
      description: "CLI command reference",
    },
    {
      path: "docs/agentlaunch/mcp-tools.md",
      content: getMcpToolsDoc(),
      strategy: "write" as MergeStrategy,
      description: "MCP server tools reference",
    },
    {
      path: "docs/agentlaunch/handoff-protocol.md",
      content: getHandoffDoc(),
      strategy: "write" as MergeStrategy,
      description: "Agent-Human Handoff Protocol",
    },
    {
      path: "docs/agentlaunch/token-economics.md",
      content: getTokenEconomicsDoc(),
      strategy: "write" as MergeStrategy,
      description: "Bonding curve and fee mechanics",
    },
    {
      path: "docs/agentlaunch/troubleshooting.md",
      content: getTroubleshootingDoc(),
      strategy: "write" as MergeStrategy,
      description: "Common errors and fixes",
    },
  ];
}

// ─── Merge logic ─────────────────────────────────────────────────────────────

function deepMergeMcpSettings(existing: string, incoming: string): string {
  try {
    const existingObj = JSON.parse(existing) as Record<string, unknown>;
    const incomingObj = JSON.parse(incoming) as Record<string, unknown>;

    // Ensure mcpServers object exists
    if (!existingObj.mcpServers) existingObj.mcpServers = {};
    const existingMcp = existingObj.mcpServers as Record<string, unknown>;
    const incomingMcp = (incomingObj.mcpServers ?? {}) as Record<string, unknown>;

    // Add new MCP server entries without overwriting existing ones
    for (const [key, value] of Object.entries(incomingMcp)) {
      if (!existingMcp[key]) {
        existingMcp[key] = value;
      }
    }

    // Merge permissions.allow arrays
    const incomingPerms = incomingObj.permissions as
      | { allow?: string[] }
      | undefined;
    if (incomingPerms?.allow) {
      if (!existingObj.permissions)
        existingObj.permissions = {} as Record<string, unknown>;
      const existingPerms = existingObj.permissions as {
        allow?: string[];
      };
      if (!existingPerms.allow) existingPerms.allow = [];
      for (const perm of incomingPerms.allow) {
        if (!existingPerms.allow.includes(perm)) {
          existingPerms.allow.push(perm);
        }
      }
    }

    return JSON.stringify(existingObj, null, 2) + "\n";
  } catch {
    // If parsing fails, return incoming as-is
    return incoming;
  }
}

// ─── Main command ────────────────────────────────────────────────────────────

interface InitOptions {
  update?: boolean;
  force?: boolean;
  dryRun?: boolean;
  docs?: boolean;
  cursor?: boolean;
}

export function registerInit(program: Command): void {
  program
    .command("init")
    .description("Install AgentLaunch toolkit into current project")
    .option("--update", "Re-sync toolkit files to latest version")
    .option("--force", "Overwrite all files (no merge)")
    .option("--dry-run", "Show what would be installed without writing")
    .option("--no-docs", "Skip docs/agentlaunch/ installation")
    .option("--no-cursor", "Skip .cursor/ installation")
    .action(async (opts: InitOptions) => {
      const targetDir = process.cwd();
      const templates = getTemplateFiles();

      // Filter based on flags
      const filtered = templates.filter((t) => {
        if (opts.cursor === false && t.path.startsWith(".cursor/")) return false;
        if (opts.docs === false && t.path.startsWith("docs/agentlaunch/")) return false;
        return true;
      });

      // Context detection
      const hasClaudeDir = fs.existsSync(path.join(targetDir, ".claude"));
      const hasPackageJson = fs.existsSync(
        path.join(targetDir, "package.json"),
      );
      const hasEnv = fs.existsSync(path.join(targetDir, ".env"));
      const isEmpty =
        fs.readdirSync(targetDir).filter((f) => !f.startsWith(".")).length === 0;

      if (!opts.dryRun) {
        console.log("\n  \u{1F680} AgentLaunch Toolkit Installer\n");
        if (hasClaudeDir) {
          console.log("  Detected: Existing Claude Code project");
        } else if (hasPackageJson) {
          console.log("  Detected: Existing Node.js project");
        } else if (isEmpty) {
          console.log("  Detected: Fresh directory");
        } else {
          console.log("  Detected: Existing project");
        }
        console.log();
      }

      let created = 0;
      let merged = 0;
      let skipped = 0;

      for (const template of filtered) {
        const fullPath = path.join(targetDir, template.path);
        const exists = fs.existsSync(fullPath);

        if (opts.dryRun) {
          const action = !exists
            ? "CREATE"
            : template.strategy === "merge-mcp"
              ? "MERGE"
              : opts.force || opts.update
                ? "UPDATE"
                : "SKIP";
          console.log(
            `  [${action}] ${template.path} \u2014 ${template.description}`,
          );
          continue;
        }

        // Create parent directories
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });

        if (!exists) {
          // New file — always write
          fs.writeFileSync(fullPath, template.content, "utf8");
          console.log(`  \u2713 Created ${template.path}`);
          created++;
        } else if (template.strategy === "merge-mcp") {
          // Merge MCP settings
          if (opts.force) {
            fs.writeFileSync(fullPath, template.content, "utf8");
            console.log(`  \u2713 Overwrote ${template.path}`);
            created++;
          } else {
            const existingContent = fs.readFileSync(fullPath, "utf8");
            const mergedContent = deepMergeMcpSettings(
              existingContent,
              template.content,
            );
            fs.writeFileSync(fullPath, mergedContent, "utf8");
            console.log(
              `  \u2197 Merged ${template.path} (kept existing config)`,
            );
            merged++;
          }
        } else if (template.strategy === "skip-if-env" && hasEnv && !opts.force) {
          console.log(`  \u00b7 Skipped ${template.path} (.env exists)`);
          skipped++;
        } else if (opts.force || opts.update) {
          fs.writeFileSync(fullPath, template.content, "utf8");
          console.log(`  \u2713 Updated ${template.path}`);
          created++;
        } else {
          console.log(
            `  \u00b7 Skipped ${template.path} (exists, use --force to overwrite)`,
          );
          skipped++;
        }
      }

      if (!opts.dryRun) {
        console.log("\n  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500");
        console.log(`  Files created: ${created}`);
        console.log(`  Files merged:  ${merged}`);
        console.log(`  Files skipped: ${skipped}`);
        console.log("\n  Next steps:");
        if (!hasEnv) {
          console.log("  1. cp .env.example .env");
          console.log("  2. Add your Agentverse API key to .env");
        } else {
          console.log("  1. Verify your .env has AGENTVERSE_API_KEY set");
        }
        console.log("  3. Open Claude Code in this directory");
        console.log("  4. Say: /build-agent");
        console.log();
      }
    });
}

// ─── Embedded template content ───────────────────────────────────────────────
// These functions return the content of each installable file.

function getEnvExample(): string {
  return `# AgentLaunch Toolkit — Environment Configuration
# Copy this file: cp .env.example .env

# ─── Required ──────────────────────────────────────────────
# Your Agentverse API key (get one at https://agentverse.ai)
AGENTVERSE_API_KEY=

# ─── Environment ───────────────────────────────────────────
# "production" (default) → agent-launch.ai
# "dev"                  → dev Cloud Run URLs
AGENT_LAUNCH_ENV=production

# ─── URL Overrides (optional) ─────────────────────────────
# AGENT_LAUNCH_API_URL=https://agent-launch.ai/api
# AGENT_LAUNCH_FRONTEND_URL=https://agent-launch.ai

# ─── Chain ID ─────────────────────────────────────────────
# 56 = BSC Mainnet (default), 97 = BSC Testnet
CHAIN_ID=56
`;
}

function getClaudeSettings(): string {
  return (
    JSON.stringify(
      {
        permissions: {
          allow: [
            "Bash(npm run build)",
            "Bash(npm run test)",
            "Bash(npm test)",
            "Bash(npx agentlaunch *)",
            "Bash(npx agent-launch-mcp)",
          ],
        },
        mcpServers: {
          "agent-launch": {
            command: "npx",
            args: ["agent-launch-mcp"],
            env: {
              AGENT_LAUNCH_API_KEY: "${AGENTVERSE_API_KEY}",
            },
          },
        },
      },
      null,
      2,
    ) + "\n"
  );
}

function getAgentlaunchRule(): string {
  return `# AgentLaunch Platform Rules

## Contract Constants (Source of Truth)
- TARGET_LIQUIDITY = 30,000 FET (graduation target for DEX listing)
- TOTAL_BUY_TOKENS = 800,000,000 (bonding curve supply)
- FEE_PERCENTAGE = 2% → 100% to protocol treasury (REVENUE_ACCOUNT)
- TOKEN_DEPLOYMENT_FEE = 120 FET (read dynamically, can change via multi-sig)
- BUY_PRICE_DIFFERENCE_PERCENT = 1000 (10x price range)

## CRITICAL: Fee Distribution
The 2% trading fee goes **100% to REVENUE_ACCOUNT (protocol treasury)**.
There is **NO creator fee split**. The contract has no mechanism to send fees to creators.
Never write "1% creator", "split evenly", "creator earnings from fees".

## API Authentication
All authenticated endpoints use the \`X-API-Key\` header with an Agentverse API key.
No wallet signatures needed for API access.

## Agent-Human Handoff Protocol
1. Agent creates token record via POST /agents/tokenize
2. API returns a handoff_link URL
3. Human opens link, connects wallet, and signs on-chain deployment
4. Agent NEVER touches private keys
`;
}

function getAgentverseRule(): string {
  return `# Agentverse API Patterns

## Base URL
https://agentverse.ai/v1

## Authentication
All requests use: \`Authorization: bearer <AGENTVERSE_API_KEY>\`

## Create Agent
POST /hosting/agents
Body: { "name": "My Agent" }
Returns: { "address": "agent1q...", "name": "My Agent" }

## Upload Code (IMPORTANT: Double-encoded JSON)
PUT /hosting/agents/{address}/code
Body: { "code": JSON.stringify([{ "language": "python", "name": "agent.py", "value": "<code>" }]) }
The code array must be JSON.stringify'd TWICE: once for the array, once for the body.

## Start Agent
POST /hosting/agents/{address}/start
Body: {}

## Common Errors
- 401: Invalid or expired API key
- 404: Agent address not found
- 422: Code validation failed (syntax errors in Python)
`;
}

function getUagentRule(): string {
  return `# uAgent Chat Protocol Patterns (v0.3.0)

## Minimal Agent Template
\`\`\`python
from uagents import Agent, Context, Protocol
from uagents_core.contrib.protocols.chat import (
    ChatAcknowledgement, ChatMessage, TextContent, chat_protocol_spec,
)
from datetime import datetime, timezone
from uuid import uuid4

agent = Agent()  # Zero-param constructor
chat_proto = Protocol(spec=chat_protocol_spec)

@chat_proto.on_message(ChatMessage)
async def handle_chat(ctx: Context, sender: str, msg: ChatMessage) -> None:
    # Always send acknowledgement first
    await ctx.send(sender, ChatAcknowledgement(
        timestamp=datetime.now(tz=timezone.utc),
        acknowledged_msg_id=msg.msg_id,
    ))
    text = " ".join(item.text for item in msg.content if isinstance(item, TextContent)).strip()
    # Process and respond
    await ctx.send(sender, ChatMessage(
        timestamp=datetime.now(tz=timezone.utc),
        msg_id=uuid4(),
        content=[TextContent(type="text", text=f"Response: {text}")],
    ))

@chat_proto.on_message(ChatAcknowledgement)
async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement) -> None:
    ctx.logger.debug(f"Ack from {sender[:20]}")

agent.include(chat_proto, publish_manifest=True)
\`\`\`

## Key Rules
- Agent() takes ZERO parameters
- Always send ChatAcknowledgement before responding
- Always include publish_manifest=True
- Use uuid4() for msg_id
- Use timezone-aware timestamps
`;
}

function getBuildAgentSkill(): string {
  return `---
name: build-agent
description: Scaffold, deploy, and tokenize an AI agent end-to-end
---

# /build-agent

Build a complete AI agent token launch in one guided flow.

## Steps

1. **Ask** the user what their agent should do
2. **Scaffold** agent code using the \`create_and_tokenize\` MCP tool or CLI:
   \`npx agentlaunch create --name "AgentName" --template research\`
3. **Review** the generated Python code with the user
4. **Deploy** to Agentverse (requires AGENTVERSE_API_KEY in .env)
5. **Tokenize** — create the token record and get the handoff link
6. **Share** the handoff link with the user

## Available Templates
- research — Research and analysis agent
- price-monitor — Token price monitoring
- trading-bot — Automated trading signals
- data-analyzer — Data processing pipeline
- gifter — FET token gifting agent
- custom — Blank template

## Platform Constants
- Deploy fee: 120 FET
- Graduation: 30,000 FET liquidity target for auto DEX listing
- Trading fee: 2% to protocol treasury (no creator fee)
`;
}

function getDeploySkill(): string {
  return `---
name: deploy
description: Deploy an agent to Agentverse
---

# /deploy

Deploy a Python agent to the Agentverse hosting platform.

## Steps
1. Ensure AGENTVERSE_API_KEY is set in .env
2. Use MCP tool \`create_and_tokenize\` or CLI \`npx agentlaunch create\`
3. The agent will be created, code uploaded, and started on Agentverse
4. Returns the agent address (agent1q...)

## Requirements
- Valid Agentverse API key
- Python agent code following uAgent Chat Protocol
`;
}

function getTokenizeSkill(): string {
  return `---
name: tokenize
description: Create a token for an existing agent
---

# /tokenize

Create a token record for an existing Agentverse agent and get a handoff link.

## Steps
1. Get the agent address (agent1q... or 0x...)
2. Use MCP tool or CLI: \`npx agentlaunch tokenize --agent <address> --name "Token" --symbol "TKN"\`
3. Returns: token ID + handoff link
4. Share handoff link so a human can connect wallet and deploy on-chain

## Fee Note
- Deploy fee: 120 FET (paid by deploying wallet)
- Trading fee: 2% to protocol treasury (no creator fee)
`;
}

function getMarketSkill(): string {
  return `---
name: market
description: Browse tokens and check prices
---

# /market

Browse AgentLaunch tokens and market data.

## Commands
- \`npx agentlaunch list\` — List all tokens
- \`npx agentlaunch status <address>\` — Token details + price
- \`npx agentlaunch holders <address>\` — Token holders

## MCP Tools
- \`list_tokens\` — Search and filter tokens
- \`get_token_price\` — Current price for a token
- \`get_token_holders\` — Holder list with balances
`;
}

function getStatusSkill(): string {
  return `---
name: status
description: Check agent and token deployment status
---

# /status

Check the status of an agent or token.

## Commands
- \`npx agentlaunch status <address>\` — Shows token status, price, progress
- Token statuses: pending, bonding, listed
- Progress: percentage toward 30,000 FET graduation target
`;
}

function getCursorRule(): string {
  return `# AgentLaunch — Cursor IDE Rules

## Platform
AgentLaunch (agent-launch.ai) — AI agent token launchpad on Fetch.ai

## Key Constants
- Deploy fee: 120 FET
- Graduation: 30,000 FET liquidity target for auto DEX listing
- Trading fee: 2% to protocol treasury (NO creator fee)
- Bonding curve supply: 800,000,000 tokens

## Packages
- SDK: \`agentlaunch-sdk\` — TypeScript client for all API operations
- CLI: \`agentlaunch\` — Command-line interface
- MCP: \`agent-launch-mcp\` — Model Context Protocol server (19+ tools)
- Templates: \`agentlaunch-templates\` — Agent code generators

## API Auth
Use X-API-Key header with Agentverse API key. No wallet needed.

## Environment
Production URLs are default. Set AGENT_LAUNCH_ENV=dev for dev URLs.
`;
}

// ─── CROSS-002: CLAUDE.md template ───────────────────────────────────────────

function getProjectClaudeMd(): string {
  return `# AgentLaunch Project

AI agent + token launchpad on Fetch.ai. Platform: https://agent-launch.ai

## Slash Commands
- /build-agent    Scaffold, deploy, and tokenize an agent end-to-end
- /deploy         Deploy agent.py to Agentverse
- /tokenize       Create token record + handoff link
- /market         Browse tokens and check prices
- /status         Check agent/token status

## CLI Commands
\`\`\`bash
npx agentlaunch create --name "MyAgent"         # Scaffold + deploy + setup
npx agentlaunch deploy --file agent.py          # Deploy to Agentverse
npx agentlaunch tokenize --agent agent1q... --name "Token" --symbol TKN
npx agentlaunch list                            # List all tokens
npx agentlaunch status <address>                # Token details + price
npx agentlaunch buy <address> --amount 10       # Buy tokens on-chain
npx agentlaunch sell <address> --amount 1000    # Sell tokens on-chain
npx agentlaunch wallet balances                 # Check wallet
npx agentlaunch docs                            # API reference
\`\`\`

## MCP Tools (via agent-launch-mcp)
create_token_record, list_tokens, get_token, get_token_price,
calculate_buy, calculate_sell, buy_tokens, sell_tokens,
deploy_to_agentverse, scaffold_agent, get_wallet_balances,
get_comments, post_comment, get_platform_stats

## Platform Constants (source of truth: deployed contracts)
- Deploy fee: 120 FET (read from contract dynamically)
- Graduation: 30,000 FET → auto DEX listing
- Trading fee: 2% → 100% to protocol treasury (NO creator fee)
- Bonding curve: 800M tradeable + 200M DEX reserve = 1B total

## Auth
X-API-Key header with Agentverse API key. Get at: https://agentverse.ai/profile/api-keys

## Docs
- docs/agentlaunch/getting-started.md   Quick start
- docs/agentlaunch/sdk-reference.md     SDK API
- docs/agentlaunch/cli-reference.md     CLI commands
- docs/agentlaunch/mcp-tools.md         MCP tools
- docs/agentlaunch/handoff-protocol.md  Handoff flow
- docs/agentlaunch/token-economics.md   Bonding curve
- docs/agentlaunch/troubleshooting.md   Common errors
`;
}

// ─── CROSS-003: AGENTS.md template ───────────────────────────────────────────

function getAgentsMd(): string {
  return `# AgentLaunch Integration Guide

For AI coding agents (Claude Code, Cursor, Windsurf, Copilot, etc.)

## What Is AgentLaunch?

A token launchpad for Fetch.ai AI agents. Any agent can create a token,
get a handoff link, and let a human deploy it on-chain — no wallet needed by the agent.

## Integration Surfaces

### 1. MCP Server (Recommended for IDE agents)
\`\`\`json
{ "mcpServers": { "agent-launch": { "command": "npx", "args": ["agent-launch-mcp"],
  "env": { "AGENT_LAUNCH_API_KEY": "YOUR_KEY" } } } }
\`\`\`

### 2. CLI (Terminal agents)
\`\`\`bash
npx agentlaunch tokenize --agent agent1q... --name "MyBot" --symbol MYB --json
npx agentlaunch list --json
npx agentlaunch status <address> --json
\`\`\`

### 3. SDK (TypeScript agents)
\`\`\`ts
import { tokenize, listTokens, getToken } from 'agentlaunch-sdk';
const result = await tokenize({ agentAddress, name, symbol });
\`\`\`

### 4. REST API (Any language)
\`\`\`bash
curl -X POST https://agent-launch.ai/api/agents/tokenize \\
  -H "X-API-Key: YOUR_KEY" -H "Content-Type: application/json" \\
  -d '{"name":"MyBot","symbol":"MYB","agentAddress":"agent1q..."}'
\`\`\`

## Integration Matrix

| Action | API | SDK | CLI | MCP |
|--------|-----|-----|-----|-----|
| Create token | POST /api/agents/tokenize | tokenize() | agentlaunch tokenize | create_token_record |
| List tokens | GET /api/agents/tokens | listTokens() | agentlaunch list | list_tokens |
| Get token | GET /api/agents/token/{addr} | getToken() | agentlaunch status | get_token |
| Preview buy | GET /api/tokens/calculate-buy | calculateBuy() | agentlaunch buy --dry-run | calculate_buy |
| Buy on-chain | — | buyTokens() | agentlaunch buy | buy_tokens |
| Sell on-chain | — | sellTokens() | agentlaunch sell | sell_tokens |
| Deploy agent | Agentverse API | deployAgent() | agentlaunch deploy | deploy_to_agentverse |
| Wallet | — | getWalletBalances() | agentlaunch wallet | get_wallet_balances |

## Handoff Protocol

Agents create tokens; humans deploy them on-chain.
1. Agent calls POST /api/agents/tokenize → gets handoff_link
2. Agent shares link with human
3. Human clicks → connects wallet → signs → token is live

## Key Links
- Platform: https://agent-launch.ai
- skill.md: https://agent-launch.ai/skill.md
- OpenAPI: https://agent-launch.ai/docs/openapi
- SDK docs: https://agent-launch.ai/docs/sdk
- MCP docs: https://agent-launch.ai/docs/mcp
- API key: https://agentverse.ai/profile/api-keys
`;
}

// ─── CROSS-004: docs/agentlaunch/ template content functions ─────────────────

function getGettingStartedDoc(): string {
  return `# Getting Started with AgentLaunch

Platform: https://agent-launch.ai

## Prerequisites

- Node.js 18+ (for SDK/CLI)
- Agentverse API key — https://agentverse.ai/profile/api-keys
- BSC wallet with FET — only needed by the human who clicks the handoff link

## Setup

\`\`\`bash
# Install CLI
npm install -g agentlaunch

# Store your API key
agentlaunch config set-key YOUR_AGENTVERSE_API_KEY

# Or set in .env
echo "AGENTVERSE_API_KEY=YOUR_KEY" >> .env
\`\`\`

## Get Testnet Tokens

Message the @gift faucet agent on Agentverse:
- Open: https://agentverse.ai/agents/details/agent1q2d0n5tp563wr0ugj9cmcqms9jfv5ks63xy5vg3evy5gy0z52e66xmeyyw9
- Send: \`claim 0x<your-wallet-address>\`
- Receive: 200 TFET + 0.005 tBNB (covers 120 FET deploy fee)

## First Token: Three Paths

### Path A — CLI (fastest)
\`\`\`bash
agentlaunch tokenize \\
  --agent agent1qYOUR_ADDRESS \\
  --name "My Agent" \\
  --symbol MYAG \\
  --description "My first AI agent token"
# Prints handoff link → share with a human
\`\`\`

### Path B — SDK
\`\`\`ts
import { tokenize } from 'agentlaunch-sdk';
const result = await tokenize({
  agentAddress: 'agent1q...',
  name: 'My Agent',
  symbol: 'MYAG',
});
console.log(result.handoffLink); // https://agent-launch.ai/deploy/42
\`\`\`

### Path C — REST API
\`\`\`bash
curl -X POST https://agent-launch.ai/api/agents/tokenize \\
  -H "X-API-Key: YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"agentAddress":"agent1q...","name":"My Agent","symbol":"MYAG","chainId":56}'
\`\`\`

## Handoff Flow

\`\`\`
Agent creates token record → gets handoff_link
  ↓
Agent shares link with human
  ↓
Human opens https://agent-launch.ai/deploy/{id}
  ↓
Human connects wallet → approves 120 FET → signs deploy tx
  ↓
Token is live on BSC Testnet
\`\`\`

## Environment Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| AGENTVERSE_API_KEY | — | Auth for write endpoints |
| AGENT_LAUNCH_ENV | production | Set to \`dev\` for dev URLs |
| CHAIN_ID | 56 | 56=BSC Mainnet, 97=BSC Testnet |
| WALLET_PRIVATE_KEY | — | Only for autonomous on-chain trading |

## Next Steps

- [SDK Reference](sdk-reference.md) — TypeScript client
- [CLI Reference](cli-reference.md) — All commands
- [MCP Tools](mcp-tools.md) — IDE integration
- [Handoff Protocol](handoff-protocol.md) — How agents hand off to humans
- [Token Economics](token-economics.md) — Bonding curve mechanics
`;
}

function getSdkReferenceDoc(): string {
  return `# SDK Reference — agentlaunch-sdk

\`\`\`bash
npm install agentlaunch-sdk
# For on-chain trading (buy/sell):
npm install ethers@^6
\`\`\`

Node.js 18+ required.

## Configuration

\`\`\`ts
import { AgentLaunchClient } from 'agentlaunch-sdk';

// Option 1: Environment variable (auto-read)
// Set AGENTVERSE_API_KEY or AGENT_LAUNCH_API_KEY

// Option 2: Constructor
const client = new AgentLaunchClient({
  apiKey: 'av-xxxxxxxx',
  baseUrl: 'https://agent-launch.ai/api', // production default
});
\`\`\`

## Key Methods

### tokenize(params) — Create token record
\`\`\`ts
import { tokenize } from 'agentlaunch-sdk';
const result = await tokenize({
  agentAddress: 'agent1q...',
  name: 'My Agent',    // max 32 chars
  symbol: 'MYAG',      // 2–11 chars
  description: '...',  // max 500 chars
  chainId: 56,         // 56=BSC Mainnet, 97=BSC Testnet
});
// result.handoffLink → https://agent-launch.ai/deploy/{id}
// result.tokenId     → numeric ID for the handoff link
\`\`\`

### listTokens(params?) — List tokens
\`\`\`ts
import { listTokens } from 'agentlaunch-sdk';
const tokens = await listTokens({ page: 1, limit: 20 });
\`\`\`

### getToken(address) — Get token by address
\`\`\`ts
import { getToken } from 'agentlaunch-sdk';
const token = await getToken('0x...');
// token.price, token.marketCap, token.holders, token.progress
\`\`\`

### calculateBuy(address, fetAmount, client?) — Preview buy
\`\`\`ts
import { calculateBuy } from 'agentlaunch-sdk';
const preview = await calculateBuy('0x...', '10');
// preview.tokensReceived, preview.pricePerToken, preview.fee, preview.priceImpact
\`\`\`

### calculateSell(address, tokenAmount, client?) — Preview sell
\`\`\`ts
import { calculateSell } from 'agentlaunch-sdk';
const preview = await calculateSell('0x...', '1000000');
// preview.fetReceived, preview.pricePerToken, preview.fee, preview.netFetReceived
\`\`\`

### buyTokens(address, fetAmount, options) — Buy on-chain
\`\`\`ts
import { buyTokens } from 'agentlaunch-sdk';
// Requires WALLET_PRIVATE_KEY env var
const result = await buyTokens('0x...', '10', { chainId: 56, slippagePercent: 5 });
// result.txHash, result.tokensReceived, result.fetSpent, result.fee
\`\`\`

### sellTokens(address, tokenAmount, options) — Sell on-chain
\`\`\`ts
import { sellTokens } from 'agentlaunch-sdk';
// Requires WALLET_PRIVATE_KEY env var
const result = await sellTokens('0x...', '1000000', { chainId: 56 });
// result.txHash, result.fetReceived, result.tokensSold, result.fee
\`\`\`

### deployAgent(params) — Deploy to Agentverse
\`\`\`ts
import { deployAgent } from 'agentlaunch-sdk';
const deployed = await deployAgent({
  apiKey: 'av-...',
  agentName: 'My Agent',
  sourceCode: pythonCode,  // string content of agent.py
});
// deployed.agentAddress, deployed.status, deployed.walletAddress
\`\`\`

### getMultiTokenBalances(address, symbols?, chainId?) — Wallet balances
\`\`\`ts
import { getMultiTokenBalances } from 'agentlaunch-sdk';
// Requires WALLET_PRIVATE_KEY or pass address directly
const balances = await getMultiTokenBalances('0x...', ['FET', 'BNB'], 56);
// { FET: '150.0000', BNB: '0.0012' }
\`\`\`

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| AGENTVERSE_API_KEY | Write ops | Auth for tokenize, deploy |
| WALLET_PRIVATE_KEY | On-chain | Buy, sell, wallet balances |
| CHAIN_ID | No | Default: 56 (BSC Mainnet) |
| AGENT_LAUNCH_ENV | No | \`dev\` to use dev URLs |
| AGENT_LAUNCH_API_URL | No | Override API base URL |
| AGENT_LAUNCH_FRONTEND_URL | No | Override frontend URL |
`;
}

function getCliReferenceDoc(): string {
  return `# CLI Reference — agentlaunch

\`\`\`bash
npm install -g agentlaunch
agentlaunch --version
agentlaunch --help
\`\`\`

## Configuration

\`\`\`bash
agentlaunch config set-key <apiKey>   # Store Agentverse API key
agentlaunch config show               # Show current config
agentlaunch config set-url <url>      # Override API base URL
\`\`\`

## Core Commands

### create
Scaffold + deploy + set up a full agent project.
\`\`\`bash
agentlaunch create --name "My Agent" --description "What it does"
agentlaunch create --name "My Agent" --local   # Scaffold only, no deploy
\`\`\`

### deploy
Deploy agent.py to Agentverse.
\`\`\`bash
agentlaunch deploy --file agent.py --name "My Agent"
agentlaunch deploy --json   # Machine-readable output
\`\`\`

### tokenize
Create a token record and get a handoff link.
\`\`\`bash
agentlaunch tokenize --agent agent1q... --name "Token" --symbol TKN
agentlaunch tokenize --agent agent1q... --name "Token" --symbol TKN \\
  --description "My token" --chain 56 --json
\`\`\`

### list
List all tokens on the platform.
\`\`\`bash
agentlaunch list
agentlaunch list --json
\`\`\`

### status
Show detailed token status by contract address.
\`\`\`bash
agentlaunch status 0x<address>
agentlaunch status 0x<address> --json
\`\`\`

### buy
Buy tokens on-chain (requires WALLET_PRIVATE_KEY).
\`\`\`bash
agentlaunch buy 0x<address> --amount 10           # Buy with 10 FET
agentlaunch buy 0x<address> --amount 10 --dry-run # Preview only
agentlaunch buy 0x<address> --amount 10 --slippage 5
\`\`\`

### sell
Sell tokens on-chain (requires WALLET_PRIVATE_KEY).
\`\`\`bash
agentlaunch sell 0x<address> --amount 1000000     # Sell 1M tokens
agentlaunch sell 0x<address> --amount 1000000 --dry-run
\`\`\`

### wallet
Multi-token wallet operations.
\`\`\`bash
agentlaunch wallet balances --address 0x...       # Read-only
agentlaunch wallet balances                       # Uses WALLET_PRIVATE_KEY
agentlaunch wallet delegate FET 100 --spender 0x...
agentlaunch wallet allowance FET --owner 0x... --spender 0x...
agentlaunch wallet send FET 0x<to> 10
\`\`\`

### holders
Show token holder list.
\`\`\`bash
agentlaunch holders 0x<address>
agentlaunch holders 0x<address> --json
\`\`\`

### comments
Read or post comments on a token.
\`\`\`bash
agentlaunch comments 0x<address>
agentlaunch comments 0x<address> --post "Great token!"
\`\`\`

### docs
Show API reference.
\`\`\`bash
agentlaunch docs              # skill.md (fetched live)
agentlaunch docs --matrix     # Integration matrix only
agentlaunch docs --full       # Complete llms-full.txt
agentlaunch docs --openapi    # OpenAPI spec
agentlaunch docs --offline    # Use embedded copy
\`\`\`

### init
Install AgentLaunch toolkit into an existing project.
\`\`\`bash
agentlaunch init              # Install toolkit files
agentlaunch init --update     # Re-sync to latest version
agentlaunch init --dry-run    # Preview what would be installed
agentlaunch init --no-cursor  # Skip .cursor/ files
agentlaunch init --no-docs    # Skip docs/agentlaunch/ files
\`\`\`

## Global Flags

All commands support \`--json\` for machine-readable output.
`;
}

function getMcpToolsDoc(): string {
  return `# MCP Tools Reference — agent-launch-mcp

\`\`\`bash
npm install -g agent-launch-mcp
\`\`\`

## Setup

Add to \`.claude/settings.json\`:
\`\`\`json
{
  "mcpServers": {
    "agent-launch": {
      "command": "npx",
      "args": ["agent-launch-mcp"],
      "env": { "AGENT_LAUNCH_API_KEY": "YOUR_AGENTVERSE_API_KEY" }
    }
  }
}
\`\`\`

## Tool Categories

### Token Creation
- **create_token_record** — POST /api/agents/tokenize. Returns token_id + handoff_link.
  Params: agentAddress, name, symbol, description?, chainId?, category?

### Token Discovery
- **list_tokens** — List tokens with pagination. Params: page?, limit?, search?
- **get_token** — Get token by address. Params: address
- **get_token_price** — Current price for a token. Params: address
- **get_token_holders** — Holder list with balances. Params: address

### Trading (Preview)
- **calculate_buy** — Preview buy without executing. Params: address, fetAmount
- **calculate_sell** — Preview sell without executing. Params: address, tokenAmount

### Trading (On-chain, requires WALLET_PRIVATE_KEY)
- **buy_tokens** — Execute buy on bonding curve. Params: address, fetAmount, chainId?, slippagePercent?
- **sell_tokens** — Execute sell on bonding curve. Params: address, tokenAmount, chainId?

### Agent Deployment
- **deploy_to_agentverse** — Deploy Python agent to Agentverse. Params: agentName, sourceCode
- **scaffold_agent** — Generate agent code from template. Params: template, name, description?

### Wallet
- **get_wallet_balances** — Multi-token balances. Params: address?, chainId?
- **check_allowance** — ERC-20 spending limit. Params: token, owner, spender, chainId?
- **create_spending_handoff** — Generate delegation handoff link.

### Social
- **get_comments** — Get comments for a token. Params: address
- **post_comment** — Post a comment. Params: address, text (requires API key)

### Platform
- **get_platform_stats** — Total tokens, volume, holders, market cap.
- **get_deploy_instructions** — Step-by-step deploy guide for a token.
- **get_trade_link** — Generate trade page URL. Params: address

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| AGENT_LAUNCH_API_KEY | Write ops | Agentverse API key |
| WALLET_PRIVATE_KEY | Trading | For buy_tokens, sell_tokens |
| AGENT_LAUNCH_BASE_URL | No | Override API URL |
| AGENT_LAUNCH_FRONTEND_URL | No | Override frontend URL |
`;
}

function getHandoffDoc(): string {
  return `# Agent-Human Handoff Protocol

How agents bring humans into the loop for wallet-dependent actions.

## The Core Insight

Agents can analyze, decide, and create records. Agents cannot sign blockchain transactions.
Humans can sign transactions. The Handoff Protocol bridges this gap.

## Flow

\`\`\`
1. Agent creates token record
   POST /api/agents/tokenize
   → { token_id: 42, handoff_link: "https://agent-launch.ai/deploy/42" }

2. Agent shares the link
   (chat message, email, DM, or any channel)

3. Human opens the link
   → Sees: token name, symbol, description, deploy cost

4. Human connects wallet (MetaMask / WalletConnect)
   → Approves 120 FET spend
   → Signs deploy transaction

5. Token is live
   → Contract deployed on BSC
   → Human is the on-chain creator
   → Token tradeable immediately
\`\`\`

## Link Formats

| Type | URL Format | Use |
|------|-----------|-----|
| Deploy | /deploy/{token_id} | Before on-chain deploy |
| Trade | /trade/{token_address} | After deploy, for trading |
| Deploy + ref | /deploy/{id}?ref={agent_address} | Track which agent referred |

## Code Example

\`\`\`ts
import { tokenize } from 'agentlaunch-sdk';

const result = await tokenize({
  agentAddress: 'agent1q...',
  name: 'My Research Agent',
  symbol: 'MRA',
  description: 'AI-powered research assistant',
  chainId: 56,
});

// Send to human via any channel
const message = \`Your token is ready to deploy!
Click here: \${result.handoffLink}
Cost: 120 FET (one-time)\`;
\`\`\`

## Security Properties

- Agent NEVER touches private keys
- Deploy link is single-purpose (one token, one action)
- token_id in link matches tokenId in smart contract events
- Platform validates the API key and token metadata before showing the page
- Human reviews all details before signing

## After Deploy

Once the human deploys:
- \`token_address\` is set in the database
- Scheduler syncs on-chain TokenCreated events
- Trade link becomes active: /trade/{token_address}
- Agent can monitor price/volume via GET /api/agents/token/{address}
`;
}

function getTokenEconomicsDoc(): string {
  return `# Token Economics

Bonding curve mechanics for AgentCoin tokens on AgentLaunch.

## Token Distribution

\`\`\`
Total Supply:   1,000,000,000 (1 billion)
Bonding Curve:    800,000,000 (80%) — tradeable
DEX Reserve:      200,000,000 (20%) — locked for auto-listing
\`\`\`

## Bonding Curve

Linear pricing model: price increases as more tokens are bought.

| Supply Sold | Approx Price | Market Cap |
|-------------|--------------|------------|
| 0 | ~0.00003 FET | 0 FET |
| 200M (25%) | ~0.015 FET | 3,000 FET |
| 400M (50%) | ~0.030 FET | 12,000 FET |
| 600M (75%) | ~0.045 FET | 27,000 FET |
| 800M (100%) | ~0.060 FET | 48,000 FET |

## Graduation

When the bonding curve accumulates 30,000 FET:
- Contract automatically creates Uniswap liquidity pool
- 200M DEX reserve tokens are paired with the 30,000 FET
- Token is listed on DEX — bonding curve trading ends
- \`listed()\` returns true on the contract

## Fees

\`\`\`
Trading fee: 2%
Destination: 100% to REVENUE_ACCOUNT (protocol treasury)
Creator fee: NONE — the contract has no creator fee mechanism
\`\`\`

**CRITICAL**: Never describe "creator fee", "fee split", or "1% to creator".
The 2% goes entirely to the protocol treasury. This is enforced by the smart contract.

## Deploy Fee

- Amount: 120 FET (read dynamically from contract — can change via multi-sig)
- Paid by: the human who clicks the handoff link
- Purpose: covers gas + initial liquidity seed

## Preview Calculations

\`\`\`bash
# Preview a buy (no wallet needed)
agentlaunch buy 0x<address> --amount 10 --dry-run

# Preview a sell
agentlaunch sell 0x<address> --amount 1000000 --dry-run
\`\`\`

\`\`\`ts
// SDK preview
import { calculateBuy, calculateSell } from 'agentlaunch-sdk';
const buy = await calculateBuy('0x...', '10');
const sell = await calculateSell('0x...', '1000000');
\`\`\`

## Contract Constants (immutable)

\`\`\`
TARGET_LIQUIDITY     = 30,000 FET
TOTAL_BUY_TOKENS     = 800,000,000
FEE_PERCENTAGE       = 2% → REVENUE_ACCOUNT
TOKEN_DEPLOYMENT_FEE = 120 FET (read dynamically)
\`\`\`
`;
}

function getTroubleshootingDoc(): string {
  return `# Troubleshooting

Common errors and fixes for AgentLaunch integration.

## API Errors

### 401 Invalid API key
\`\`\`
Error: Invalid API key
\`\`\`
- Get a new key: https://agentverse.ai/profile/api-keys
- Use header: \`X-API-Key: YOUR_KEY\` (not Authorization)
- CLI: run \`agentlaunch config set-key YOUR_KEY\`

### 400 Validation errors
| Error | Fix |
|-------|-----|
| \`name must be at most 32 characters\` | Truncate name to 32 chars |
| \`symbol must be at most 11 characters\` | Truncate symbol to 11 chars |
| \`agentAddress is required\` | Provide \`agentAddress\` field (not \`agent_address\`) |
| \`--agent must start with 'agent1q'\` | Use Agentverse address format |

### 404 Token not found
- The token address may not be indexed yet — wait 30s for the scheduler
- Check the address is correct (0x prefix, correct length)

## CLI Errors

### API key not set
\`\`\`
Error: No API key configured.
\`\`\`
Fix: \`agentlaunch config set-key YOUR_AGENTVERSE_API_KEY\`

### Agent file not found
\`\`\`
Error: Agent file not found: ./agent.py
\`\`\`
Fix: Run \`agentlaunch create\` first, or specify \`--file path/to/agent.py\`

### Image URL must use HTTPS
\`\`\`
Error: --image URL must use HTTPS protocol
\`\`\`
Fix: Use an https:// URL for the token logo image

## On-Chain Errors

### WALLET_PRIVATE_KEY not set
\`\`\`
Error: WALLET_PRIVATE_KEY env var required
\`\`\`
Fix: Add to .env: \`WALLET_PRIVATE_KEY=0x...\`

### Insufficient FET balance
- Buy testnet FET: message @gift on Agentverse (\`claim 0x<address>\`)
- Or use BSC Testnet faucet: https://testnet.bnbchain.org/faucet-smart

### Transaction reverted: already listed
The token has graduated to DEX. Bonding curve trading is closed.
Check \`listed()\` before calling bonding curve functions.

### Slippage exceeded
Price moved before tx confirmed. Increase \`--slippage\` value (default: 5%).

## Agentverse Deployment Errors

### Compilation timeout
Agent was created but did not compile within 60 seconds.
- Check https://agentverse.ai/agents for logs
- Common cause: syntax error in Python code
- Fix: Review agent.py for import errors or syntax issues

### Invalid code format
\`\`\`
Error: code must be a valid JSON string
\`\`\`
The Agentverse API requires double-encoded JSON. Use the SDK \`deployAgent()\`
which handles this automatically.

## Getting Help

- Platform status: https://agent-launch.ai
- Agentverse docs: https://docs.agentverse.ai
- API reference: \`agentlaunch docs\`
- OpenAPI spec: https://agent-launch.ai/docs/openapi
`;
}
