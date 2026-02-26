/**
 * generator.ts — Variable substitution engine for agentlaunch-templates
 *
 * Takes a template name + variable map and returns the generated files
 * ready to be written to disk or returned over the MCP protocol.
 */

import { getTemplate, type AgentTemplate, type TemplateVariable } from "./registry.js";

// ---------------------------------------------------------------------------
// Environment-based URL resolution
// ---------------------------------------------------------------------------

const PROD_API_URL = 'https://agent-launch.ai/api';
const DEV_API_URL = 'https://launchpad-backend-dev-1056182620041.us-central1.run.app';
const RESOLVED_API_URL = process.env.AGENT_LAUNCH_API_URL ??
  (process.env.AGENT_LAUNCH_ENV === 'dev' ? DEV_API_URL : PROD_API_URL);

const PROD_FRONTEND_URL = 'https://agent-launch.ai';
const DEV_FRONTEND_URL = 'https://launchpad-frontend-dev-1056182620041.us-central1.run.app';
const RESOLVED_FRONTEND_URL = process.env.AGENT_LAUNCH_FRONTEND_URL ??
  (process.env.AGENT_LAUNCH_ENV === 'dev' ? DEV_FRONTEND_URL : PROD_FRONTEND_URL);

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface GenerateResult {
  /** The generated agent.py source code */
  code: string;
  /** A quickstart README.md for the generated project */
  readme: string;
  /** A .env.example file listing all required secrets */
  envExample: string;
  /** CLAUDE.md context file for Claude Code / Cursor */
  claudeMd: string;
  /** .claude/settings.json with MCP server config */
  claudeSettings: string;
  /** agentlaunch.config.json for CLI auto-detection */
  agentlaunchConfig: string;
}

export interface GenerateOptions {
  /** Variable values to inject into the template */
  variables: Record<string, string>;
  /**
   * When true, missing required variables throw an error.
   * When false (default for MCP/preview use), they are left as-is.
   */
  strict?: boolean;
}

// ---------------------------------------------------------------------------
// Core substitution
// ---------------------------------------------------------------------------

/**
 * Replaces all `{{variable}}` placeholders in `text` with values from `vars`.
 * Unknown placeholders are left untouched so callers can detect them.
 */
function substitute(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    return Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : match;
  });
}

/**
 * Merges caller-supplied variables with template defaults.
 * Required variables with no value will remain as empty string unless `strict` is true.
 */
function resolveVariables(
  templateVars: TemplateVariable[],
  supplied: Record<string, string>,
  strict: boolean,
): Record<string, string> {
  const resolved: Record<string, string> = {};

  for (const v of templateVars) {
    if (Object.prototype.hasOwnProperty.call(supplied, v.name) && supplied[v.name] !== "") {
      resolved[v.name] = supplied[v.name];
    } else if (v.default !== undefined) {
      resolved[v.name] = v.default;
    } else if (v.required) {
      if (strict) {
        throw new Error(
          `Required variable "${v.name}" was not provided for template.`,
        );
      }
      // Leave the placeholder so the caller can see it is missing
      resolved[v.name] = `{{${v.name}}}`;
    } else {
      resolved[v.name] = "";
    }
  }

  // Pass through any extra caller-supplied variables not declared in the template
  for (const [k, val] of Object.entries(supplied)) {
    if (!Object.prototype.hasOwnProperty.call(resolved, k)) {
      resolved[k] = val;
    }
  }

  return resolved;
}

// ---------------------------------------------------------------------------
// README generator
// ---------------------------------------------------------------------------

function buildReadme(template: AgentTemplate, vars: Record<string, string>): string {
  const name = vars["agent_name"] || template.name;
  const description = vars["description"] || template.description;
  const deps = template.dependencies.join(" ");
  const secretsList = template.secrets
    .map((s) => `- \`${s}\``)
    .join("\n");

  return `# ${name}

${description}

Generated from the **${template.name}** template by \`agentlaunch scaffold\`.

## Quickstart

### 1. Install dependencies

\`\`\`bash
pip install uagents uagents-core ${deps}
\`\`\`

### 2. Configure environment

\`\`\`bash
cp .env.example .env
# Edit .env and fill in the required values
\`\`\`

### 3. Customize your agent

Open \`agent.py\` and edit the business logic class to add your own value exchange.

### 4. Run locally

\`\`\`bash
source .env && python agent.py
\`\`\`

### 5. Deploy to Agentverse

\`\`\`bash
agentlaunch deploy
\`\`\`

This uploads \`agent.py\` to Agentverse, sets secrets, and starts the agent.

### 6. Tokenize your agent

\`\`\`bash
agentlaunch tokenize \\
  --agent <address> \\
  --name "${name}" \\
  --symbol "${name.slice(0, 4).toUpperCase()}"
\`\`\`

You will receive a handoff link. Share it with a human to complete on-chain deployment.

## Required Secrets

${secretsList}

## Platform Constants

- Deploy fee: **120 FET** (read dynamically from contract)
- Graduation target: **30,000 FET** — auto DEX listing
- Trading fee: **2%** — 100% to protocol treasury (no creator fee)

## Key Commands

| Command | Description |
|---------|-------------|
| \`agentlaunch config show\` | Show current config |
| \`agentlaunch deploy\` | Deploy agent.py to Agentverse |
| \`agentlaunch tokenize\` | Create a token record + handoff link |

## Resources

- [AgentLaunch Platform](${RESOLVED_FRONTEND_URL})
- [Agentverse](https://agentverse.ai)
- [skill.md](${RESOLVED_FRONTEND_URL}/skill.md)
- [API docs](${RESOLVED_FRONTEND_URL}/docs/openapi)
`;
}

// ---------------------------------------------------------------------------
// .env.example generator
// ---------------------------------------------------------------------------

function buildEnvExample(
  template: AgentTemplate,
  vars: Record<string, string>,
): string {
  const name = vars["agent_name"] || template.name;

  const lines: string[] = [
    `# ${name} — Environment Variables`,
    `# Copy to .env and fill in real values. Never commit .env to version control.`,
    ``,
    `# Your Agentverse API key (https://agentverse.ai/profile/api-keys)`,
    `AGENTVERSE_API_KEY=`,
    ``,
    `# Your AgentLaunch API key (same as Agentverse key in most cases)`,
    `AGENTLAUNCH_API_KEY=`,
    ``,
    `# The address of this agent on Agentverse (set after first deploy)`,
    `AGENT_ADDRESS=`,
    ``,
    `# The wallet address that owns this agent (for owner-gated commands)`,
    `AGENT_OWNER_ADDRESS=`,
    ``,
    `# Optional: override the API base URL (default: ${RESOLVED_API_URL})`,
    `# AGENTLAUNCH_API=${RESOLVED_API_URL}`,
  ];

  // Add template-specific secrets that are not in the base set
  const baseSecrets = new Set([
    "AGENTVERSE_API_KEY",
    "AGENTLAUNCH_API_KEY",
    "AGENT_ADDRESS",
    "AGENT_OWNER_ADDRESS",
  ]);

  const extraSecrets = template.secrets.filter((s) => !baseSecrets.has(s));
  if (extraSecrets.length > 0) {
    lines.push(``);
    lines.push(`# Template-specific secrets`);
    for (const secret of extraSecrets) {
      lines.push(`${secret}=`);
    }
  }

  return lines.join("\n") + "\n";
}

// ---------------------------------------------------------------------------
// CLAUDE.md generator (context engineering)
// ---------------------------------------------------------------------------

function buildClaudeMd(
  template: AgentTemplate,
  vars: Record<string, string>,
): string {
  const name = vars["agent_name"] || template.name;
  const description = vars["description"] || template.description;

  return `# CLAUDE.md

This file provides context to Claude Code and other AI coding assistants.

## Project Overview

**${name}** — ${description}

This is an AgentLaunch agent built on the Fetch.ai Agentverse platform.
It uses the AgentLaunch SDK and CLI for deployment and tokenization.

## Project Structure

\`\`\`
${name}/
  agent.py          # Main agent code (edit business logic here)
  .env.example      # Required environment variables
  README.md         # Quickstart guide
  CLAUDE.md         # This file (AI context)
  .claude/          # Claude Code settings
    settings.json   # MCP server config
  agentlaunch.config.json  # CLI auto-detection config
\`\`\`

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
| \`/agents/tokens\` | GET | No | List all tokens |
| \`/agents/token/:address\` | GET | No | Get token details |
| \`/agents/tokenize\` | POST | API Key | Create token record |
| \`/tokens/calculate-buy\` | GET | No | Preview buy outcome |
| \`/tokens/calculate-sell\` | GET | No | Preview sell outcome |
| \`/comments/:address\` | GET/POST | POST needs key | Token comments |
| \`/platform/stats\` | GET | No | Platform statistics |

### Authentication

Set \`AGENTLAUNCH_API_KEY\` (or \`AGENTVERSE_API_KEY\`) in your environment.
The key is sent as \`X-API-Key\` header on authenticated requests.
Get a key at: https://agentverse.ai/profile/api-keys

## SDK Reference (agentlaunch-sdk)

\`\`\`typescript
import {
  // Token operations
  tokenize,          // POST /agents/tokenize -> { token_id, handoff_link }
  getToken,          // GET /agents/token/:address -> Token
  listTokens,        // GET /agents/tokens -> { tokens, total }

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
\`\`\`

## CLI Reference (agentlaunch-cli)

| Command | Description |
|---------|-------------|
| \`agentlaunch create\` | Scaffold + deploy + tokenize (interactive) |
| \`agentlaunch scaffold <name>\` | Generate agent project from template |
| \`agentlaunch deploy\` | Deploy agent.py to Agentverse |
| \`agentlaunch tokenize\` | Create token + get handoff link |
| \`agentlaunch list\` | List tokens on platform |
| \`agentlaunch status <addr>\` | Show token details |
| \`agentlaunch holders <addr>\` | Show token holders |
| \`agentlaunch comments <addr>\` | List/post comments |
| \`agentlaunch config set-key\` | Store API key |

All commands support \`--json\` for machine-readable output.

## MCP Tools (agent-launch-mcp)

This project has an MCP server pre-configured in \`.claude/settings.json\`.
Available tools: list_tokens, get_token, get_platform_stats, calculate_buy,
calculate_sell, create_token_record, get_deploy_instructions, get_trade_link,
scaffold_agent, deploy_to_agentverse, create_and_tokenize, get_comments,
post_comment.

## Agentverse Patterns

### Chat Protocol (required)
All agents must implement the chat protocol:
\`\`\`python
from uagents_core.contrib.protocols.chat import (
    ChatAcknowledgement, ChatMessage, TextContent, chat_protocol_spec,
)
\`\`\`

### Token-Gated Access
Check holder balance via AgentLaunch API to offer premium tiers:
\`\`\`python
r = requests.get(f"{AGENTLAUNCH_API}/agents/token/{user_address}")
balance = r.json().get("balance", 0)
tier = "premium" if balance >= 1000 else "free"
\`\`\`

### Code Upload (double-encoded JSON)
When uploading code to Agentverse, the \`code\` field must be a JSON string:
\`\`\`python
code_array = [{"language": "python", "name": "agent.py", "value": source}]
payload = {"code": json.dumps(code_array)}  # json.dumps required!
\`\`\`

## Agent Pattern Examples

Use these patterns as inspiration when customizing your agent's business logic.

### Research Agent Pattern (AI-powered responses)
\`\`\`python
# Use Hugging Face or OpenAI for intelligent responses
import requests

def generate_report(query: str) -> str:
    r = requests.post(
        "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
        headers={"Authorization": f"Bearer {os.environ.get('HF_TOKEN')}"},
        json={"inputs": f"Research query: {query}\\n\\nProvide a detailed analysis:"},
        timeout=30
    )
    return r.json()[0]["generated_text"] if r.ok else "Error generating report"
\`\`\`

### Price Monitor Pattern (watch token prices)
\`\`\`python
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
\`\`\`

### Trading Signal Pattern (buy/sell recommendations)
\`\`\`python
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
\`\`\`

### Data Query Pattern (structured responses)
\`\`\`python
# Parse structured queries and return formatted data
def handle_query(query: str) -> str:
    lower = query.lower()
    if "top" in lower and "tokens" in lower:
        r = requests.get(f"{AGENTLAUNCH_API}/agents/tokens?limit=5&sort=volume", timeout=5)
        if r.ok:
            tokens = r.json().get("tokens", [])
            return "\\n".join([f"{t['name']}: {t['price']} FET" for t in tokens])
    elif "stats" in lower:
        r = requests.get(f"{AGENTLAUNCH_API}/platform/stats", timeout=5)
        if r.ok:
            s = r.json()
            return f"Platform: {s['total_tokens']} tokens, {s['total_volume']} FET volume"
    return "Unknown query. Try: 'top tokens', 'stats'"
\`\`\`

## Resources

- [AgentLaunch Platform](${RESOLVED_FRONTEND_URL})
- [API Docs](${RESOLVED_FRONTEND_URL}/docs/openapi)
- [skill.md](${RESOLVED_FRONTEND_URL}/skill.md)
- [Agentverse](https://agentverse.ai)
- [SDK on npm](https://www.npmjs.com/package/agentlaunch-sdk)
- [CLI on npm](https://www.npmjs.com/package/agentlaunch-cli)
- [MCP on npm](https://www.npmjs.com/package/agent-launch-mcp)
`;
}

// ---------------------------------------------------------------------------
// .claude/settings.json generator
// ---------------------------------------------------------------------------

function buildClaudeSettings(): string {
  return JSON.stringify(
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
    2,
  ) + "\n";
}

// ---------------------------------------------------------------------------
// agentlaunch.config.json generator
// ---------------------------------------------------------------------------

function buildAgentlaunchConfig(
  template: AgentTemplate,
  vars: Record<string, string>,
): string {
  const name = vars["agent_name"] || template.name;
  return JSON.stringify(
    {
      name,
      template: template.name,
      chain: 97,
      agentAddress: null,
      tokenAddress: null,
    },
    null,
    2,
  ) + "\n";
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generates agent files from a named template with variable substitution.
 *
 * @param templateName - The template slug (e.g. "price-monitor")
 * @param variables    - Key-value pairs for `{{variable}}` placeholders
 * @param options      - Generation options (strict mode, etc.)
 * @returns An object containing `code`, `readme`, `envExample`, `claudeMd`,
 *          `claudeSettings`, and `agentlaunchConfig` strings
 * @throws  If the template is not found, or if `strict` is true and required
 *          variables are missing
 *
 * @example
 * const result = generateFromTemplate("price-monitor", {
 *   agent_name: "MyPriceBot",
 *   token_address: "0xabc...",
 *   alert_threshold: "10",
 * });
 * fs.writeFileSync("agent.py", result.code);
 */
export function generateFromTemplate(
  templateName: string,
  variables: Record<string, string>,
  options: GenerateOptions = { variables: {} },
): GenerateResult {
  const template = getTemplate(templateName);
  if (!template) {
    const available = ["genesis", "custom", "price-monitor", "trading-bot", "data-analyzer", "research", "gifter"];
    throw new Error(
      `Template "${templateName}" not found. Available templates: ${available.join(", ")}`,
    );
  }

  const strict = options.strict ?? false;
  const resolved = resolveVariables(template.variables, variables, strict);

  const code = substitute(template.code, resolved);
  const readme = buildReadme(template, resolved);
  const envExample = buildEnvExample(template, resolved);
  const claudeMd = buildClaudeMd(template, resolved);
  const claudeSettings = buildClaudeSettings();
  const agentlaunchConfig = buildAgentlaunchConfig(template, resolved);

  return { code, readme, envExample, claudeMd, claudeSettings, agentlaunchConfig };
}
