/**
 * Skill discovery tools — self-bootstrapping entry point for AI agents.
 *
 * get_skill:     Fetch the skill.md manifest (live or structured JSON)
 * install_skill: Return MCP server config for Claude Code / Cursor
 */

const SKILL_URL = "https://agent-launch.ai/skill.md";

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

/**
 * Parse skill.md frontmatter and headings into a structured JSON summary.
 */
function parseSkillToJson(markdown: string): object {
  const phases: string[] = [];
  const endpoints: Record<string, string> = {};

  // Extract phase names from ## headings
  const phaseRegex = /^## (?:PHASE \d+: )?(\w+)/gim;
  let match: RegExpExecArray | null;
  while ((match = phaseRegex.exec(markdown)) !== null) {
    const name = match[1].toLowerCase();
    if (["discover", "tokenize", "economy"].includes(name)) {
      phases.push(name);
    }
  }
  if (phases.length === 0) phases.push("discover", "tokenize", "economy");

  // Extract endpoint patterns
  const endpointRegex =
    /(POST|GET|PUT|DELETE)\s+(\/api\/[^\s]+)/g;
  while ((match = endpointRegex.exec(markdown)) !== null) {
    const method = match[1];
    const path = match[2];
    // Derive a key from the path
    const key = path
      .replace(/\/api\//, "")
      .replace(/[/:{}]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");
    if (!endpoints[key]) {
      endpoints[key] = `${method} ${path}`;
    }
  }

  return {
    name: "agent-launch",
    version: "2.0.0",
    description:
      "Tokenize any AI agent — deploy to Agentverse, create bonding curve tokens, build agent economies",
    phases,
    tools: {
      sdk: "@fetchai/agent-launch-sdk",
      cli: "@fetchai/agent-launch-cli",
      mcp: "agent-launch-mcp",
    },
    auth: {
      header: "X-API-Key",
      provider: "https://agentverse.ai/profile/api-keys",
    },
    endpoints,
    mcp_config: MCP_CONFIG,
    urls: {
      platform: "https://agent-launch.ai",
      skill: SKILL_URL,
      tutorial: "https://agent-launch.ai/tutorial",
      docs: "https://agent-launch.ai/docs",
    },
  };
}

async function fetchSkillMd(): Promise<string> {
  try {
    const response = await fetch(SKILL_URL, {
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } catch {
    throw new Error(
      `Failed to fetch skill.md from ${SKILL_URL}. Check connectivity.`,
    );
  }
}

/**
 * Get the AgentLaunch skill manifest.
 */
export async function getSkill(args: {
  format?: string;
}): Promise<{ _markdown: string }> {
  const markdown = await fetchSkillMd();
  const format = args.format || "markdown";

  if (format === "json") {
    const structured = parseSkillToJson(markdown);
    const _markdown = `# AgentLaunch Skill Manifest (JSON)

\`\`\`json
${JSON.stringify(structured, null, 2)}
\`\`\`

## Next Steps
- Install MCP tools: \`install_skill()\`
- List tokens: \`list_tokens({ sort: "trending" })\`
- Create a token: \`create_and_tokenize({ name: "MyBot", description: "..." })\``;

    return { _markdown };
  }

  // Default: raw markdown
  const _markdown = `${markdown}

---
*Fetched live from ${SKILL_URL}*

## Next Steps
- Install MCP tools: \`install_skill()\`
- List tokens: \`list_tokens({ sort: "trending" })\`
- Create a token: \`create_and_tokenize({ name: "MyBot", description: "..." })\``;

  return { _markdown };
}

/**
 * Get the MCP server configuration for installing AgentLaunch tools.
 */
export async function installSkill(): Promise<{ _markdown: string }> {
  const configJson = JSON.stringify(MCP_CONFIG, null, 2);

  const _markdown = `# Install AgentLaunch MCP Tools

## For Claude Code / Claude Desktop

Add to \`~/.claude/settings.json\` or \`claude_desktop_config.json\`:

\`\`\`json
${configJson}
\`\`\`

## For Cursor

Add to \`.cursor/mcp.json\` in your project root:

\`\`\`json
${configJson}
\`\`\`

## For .claude/settings.json (project-level)

Add to \`.claude/settings.json\` in your project root:

\`\`\`json
${configJson}
\`\`\`

## Setup

1. Get your API key at https://agentverse.ai/profile/api-keys
2. Replace \`YOUR_AGENTVERSE_API_KEY\` with your actual key
3. Restart your editor / Claude Code session
4. The \`agent-launch\` tools will be available automatically

## Available Tools (${TOOL_COUNT}+)

| Category | Tools |
|----------|-------|
| Discovery | list_tokens, get_token, get_platform_stats |
| Trading | calculate_buy, calculate_sell, buy_tokens, sell_tokens |
| Custodial | get_agent_wallet, buy_token, sell_token |
| Creation | create_token_record, create_and_tokenize, scaffold_agent |
| Deployment | deploy_to_agentverse, update_agent_metadata |
| Commerce | check_agent_commerce, network_status, multi_token_payment |
| Skill | get_skill, install_skill |

## Quick Test

After installing, try: \`list_tokens({ sort: "trending", limit: 5 })\``;

  return { _markdown };
}

const TOOL_COUNT = 30;

/**
 * Handler map consumed by index.ts.
 */
export const skillHandlers = {
  get_skill: getSkill,
  install_skill: installSkill,
};
