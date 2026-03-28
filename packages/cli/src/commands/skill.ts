/**
 * agentlaunch skill — Self-bootstrapping skill discovery
 *
 * agentlaunch skill show     → fetch and print skill.md
 * agentlaunch skill install  → print MCP config JSON
 * agentlaunch skill info     → print platform summary
 */

import { Command } from "commander";

const SKILL_URL = "https://agent-launch.ai/skill.md";
const API_BASE = "https://agent-launch.ai/api";

const MCP_CONFIG = {
  mcpServers: {
    "agent-launch": {
      command: "npx",
      args: ["-y", "agent-launch-mcp@latest"],
      env: {
        AGENT_LAUNCH_API_KEY: "YOUR_AGENTVERSE_API_KEY",
      },
    },
  },
};

async function fetchSkillMd(): Promise<string> {
  try {
    const response = await fetch(SKILL_URL, {
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } catch {
    return `Failed to fetch skill.md from ${SKILL_URL}\n\nTry: curl ${SKILL_URL}`;
  }
}

export function registerSkillCommand(program: Command): void {
  const skill = program
    .command("skill")
    .description(
      "Skill discovery — fetch manifest, install MCP tools, view platform info",
    );

  skill
    .command("show")
    .description("Fetch and display the skill.md manifest from agent-launch.ai")
    .action(async () => {
      const content = await fetchSkillMd();
      console.log(content);
    });

  skill
    .command("install")
    .description(
      "Print the MCP server config JSON to add to Claude Code or Cursor",
    )
    .option("--cursor", "Format for .cursor/mcp.json")
    .action((options: { cursor?: boolean }) => {
      const configJson = JSON.stringify(MCP_CONFIG, null, 2);

      if (options.cursor) {
        console.log("Add to .cursor/mcp.json in your project root:\n");
      } else {
        console.log(
          "Add to ~/.claude/settings.json or claude_desktop_config.json:\n",
        );
      }

      console.log(configJson);
      console.log(
        "\nReplace YOUR_AGENTVERSE_API_KEY with your key from https://agentverse.ai/profile/api-keys",
      );
    });

  skill
    .command("info")
    .description("Print a summary of the AgentLaunch platform")
    .action(() => {
      console.log(`AgentLaunch Platform Info
========================

Platform:     https://agent-launch.ai
API Base:     ${API_BASE}
Skill:        ${SKILL_URL}
Tutorial:     https://agent-launch.ai/tutorial
Docs:         https://agent-launch.ai/docs

Authentication:
  Header:     X-API-Key
  Get key:    https://agentverse.ai/profile/api-keys

Tooling:
  SDK:        npm install agentlaunch-sdk
  CLI:        npx agentlaunch
  MCP:        npx agent-launch-mcp (30+ tools)

Key Endpoints:
  POST /api/agents/tokenize        Create token (auth required)
  GET  /api/agents/tokens          List tokens (public)
  GET  /api/agents/token/{addr}    Token details (public)
  GET  /api/tokens/calculate-buy   Preview buy (public)
  GET  /api/tokens/calculate-sell  Preview sell (public)
  GET  /api/platform/stats         Platform stats (public)
  GET  /api/skill                  Skill manifest (public)
  GET  /api/skill/mcp-config       MCP config JSON (public)

Platform Constants:
  Deploy fee:   120 FET (read from contract — may change via governance)
  Graduation:   30,000 FET → auto DEX listing
  Trading fee:  2% → 100% protocol treasury
  Bonding curve: 800M tradeable + 200M DEX reserve
  Chain:        BSC Testnet (97) / BSC Mainnet (56)`);
    });
}
