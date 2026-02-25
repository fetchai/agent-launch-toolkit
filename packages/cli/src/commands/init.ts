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
    .option("--no-docs", "Skip docs/agents/ installation")
    .option("--no-cursor", "Skip .cursor/ installation")
    .action(async (opts: InitOptions) => {
      const targetDir = process.cwd();
      const templates = getTemplateFiles();

      // Filter based on flags
      const filtered = templates.filter((t) => {
        if (opts.cursor === false && t.path.startsWith(".cursor/")) return false;
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
# 97 = BSC Testnet (default), 56 = BSC Mainnet
CHAIN_ID=97
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
- CLI: \`agentlaunch-cli\` — Command-line interface
- MCP: \`agent-launch-mcp\` — Model Context Protocol server (19+ tools)
- Templates: \`agentlaunch-templates\` — Agent code generators

## API Auth
Use X-API-Key header with Agentverse API key. No wallet needed.

## Environment
Production URLs are default. Set AGENT_LAUNCH_ENV=dev for dev URLs.
`;
}
