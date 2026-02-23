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

const DEV_API_URL = 'https://launchpad-backend-dev-1056182620041.us-central1.run.app';
const PROD_API_URL = 'https://agent-launch.ai/api';
const RESOLVED_API_URL = process.env.AGENT_LAUNCH_API_URL ??
  (process.env.AGENT_LAUNCH_ENV === 'production' ? PROD_API_URL : DEV_API_URL);

const DEV_FRONTEND_URL = 'https://launchpad-frontend-dev-1056182620041.us-central1.run.app';
const PROD_FRONTEND_URL = 'https://agent-launch.ai';
const RESOLVED_FRONTEND_URL = process.env.AGENT_LAUNCH_FRONTEND_URL ??
  (process.env.AGENT_LAUNCH_ENV === 'production' ? PROD_FRONTEND_URL : DEV_FRONTEND_URL);

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
// Public API
// ---------------------------------------------------------------------------

/**
 * Generates agent files from a named template with variable substitution.
 *
 * @param templateName - The template slug (e.g. "price-monitor")
 * @param variables    - Key-value pairs for `{{variable}}` placeholders
 * @param options      - Generation options (strict mode, etc.)
 * @returns An object containing `code`, `readme`, and `envExample` strings
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
    const available = ["custom", "price-monitor", "trading-bot", "data-analyzer", "research", "gifter"];
    throw new Error(
      `Template "${templateName}" not found. Available templates: ${available.join(", ")}`,
    );
  }

  const strict = options.strict ?? false;
  const resolved = resolveVariables(template.variables, variables, strict);

  const code = substitute(template.code, resolved);
  const readme = buildReadme(template, resolved);
  const envExample = buildEnvExample(template, resolved);

  return { code, readme, envExample };
}
