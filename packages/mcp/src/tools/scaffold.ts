import * as fs from 'fs';
import * as path from 'path';
import { generateFromTemplate, generateOrgTemplate, generateSwarmFromOrg, summarizeSwarm } from '@fetchai/agent-launch-templates';
import type { OrgChart, SwarmConfig } from '@fetchai/agent-launch-templates';

/**
 * Validates that a directory path is within the current working directory.
 * Prevents path traversal attacks (e.g., writing to /etc/ via ../../).
 */
function validatePathWithinCwd(dirPath: string, paramName: string): string {
  const resolved = path.resolve(dirPath);
  const cwd = path.resolve(process.cwd());
  if (!resolved.startsWith(cwd + path.sep) && resolved !== cwd) {
    throw new Error(`${paramName} must be within the current working directory`);
  }
  return resolved;
}

// ---------------------------------------------------------------------------
// Type mapping: MCP agent types -> template names
// ---------------------------------------------------------------------------

const TYPE_TO_TEMPLATE: Record<string, string> = {
  faucet: 'custom',
  research: 'research',
  trading: 'trading-bot',
  data: 'data-analyzer',
  'swarm-starter': 'swarm-starter',
};

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

export interface ScaffoldAgentResult {
  success: true;
  files: string[];
  path: string;
  _markdown?: string;
}

// ---------------------------------------------------------------------------
// Tool implementation
// ---------------------------------------------------------------------------

/**
 * scaffold_agent (MCP-005)
 *
 * Generates an agent project directory from the agentlaunch-templates package.
 * Creates agent.py, README.md, .env.example, CLAUDE.md, .claude/settings.json,
 * and agentlaunch.config.json tailored to the requested agent type.
 */
export async function scaffoldAgent(args: {
  name: string;
  type?: string;
  outputDir?: string;
}): Promise<ScaffoldAgentResult> {
  const agentType = args.type ?? 'research';
  const templateName = TYPE_TO_TEMPLATE[agentType] ?? 'custom';

  // Resolve output directory with security validation
  const rawOutputDir = args.outputDir ?? path.join(process.cwd(), args.name.toLowerCase().replace(/\s+/g, '-'));
  const outputDir = validatePathWithinCwd(rawOutputDir, 'outputDir');

  // Create base directory and .claude/ subdirectory
  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(path.join(outputDir, '.claude'), { recursive: true });

  // Generate all files from template
  const generated = generateFromTemplate(templateName, {
    agent_name: args.name,
  });

  const filePaths: string[] = [];

  // Write agent.py
  const agentPyPath = path.join(outputDir, 'agent.py');
  fs.writeFileSync(agentPyPath, generated.code, 'utf8');
  filePaths.push(agentPyPath);

  // Write README.md
  const readmePath = path.join(outputDir, 'README.md');
  fs.writeFileSync(readmePath, generated.readme, 'utf8');
  filePaths.push(readmePath);

  // Write .env.example
  const envPath = path.join(outputDir, '.env.example');
  fs.writeFileSync(envPath, generated.envExample, 'utf8');
  filePaths.push(envPath);

  // Write CLAUDE.md
  const claudeMdPath = path.join(outputDir, 'CLAUDE.md');
  fs.writeFileSync(claudeMdPath, generated.claudeMd, 'utf8');
  filePaths.push(claudeMdPath);

  // Write .claude/settings.json
  const claudeSettingsPath = path.join(outputDir, '.claude', 'settings.json');
  fs.writeFileSync(claudeSettingsPath, generated.claudeSettings, 'utf8');
  filePaths.push(claudeSettingsPath);

  // Write agentlaunch.config.json
  const configPath = path.join(outputDir, 'agentlaunch.config.json');
  fs.writeFileSync(configPath, generated.agentlaunchConfig, 'utf8');
  filePaths.push(configPath);

  const fileList = filePaths.map((f) => `- \`${f}\``).join('\n');

  const _markdown = `# Agent Scaffolded: ${args.name}

**Type:** ${agentType} | **Template:** ${templateName}
**Output:** \`${outputDir}\`

## Files Created
${fileList}

## Next Steps
1. Edit \`${outputDir}/agent.py\` to implement your agent logic
2. Copy \`${outputDir}/.env.example\` to \`.env\` and fill in secrets
3. Deploy: \`deploy_to_agentverse\`
4. Tokenize: \`create_token_record\`

## Other Surfaces
- CLI: \`npx agentlaunch create\` (interactive wizard)`;

  return {
    success: true,
    files: filePaths,
    path: outputDir,
    _markdown,
  };
}

// ---------------------------------------------------------------------------
// Marketing Team preset definitions (expected interface from agentlaunch-templates)
// ---------------------------------------------------------------------------

interface Preset {
  name: string;
  displayName: string;
  symbol: string;
  description: string;
  role: string;
  pricing: Record<string, number>;
  intervalSeconds: number;
  dependencies: string[];
  secrets: string[];
  variables: Record<string, string>;
}

// ---------------------------------------------------------------------------
// scaffold_swarm (EXT-03)
// ---------------------------------------------------------------------------

export interface ScaffoldSwarmResult {
  success: true;
  name: string;
  preset: string;
  directory: string;
  files: string[];
  _markdown?: string;
}

/**
 * scaffold_swarm (EXT-03)
 *
 * Scaffolds a swarm-starter agent from a preset. Creates a complete agent
 * project directory with commerce stack, ready to deploy.
 *
 * If the preset is provided, attempts to load it from agentlaunch-templates
 * via getPreset(). Falls back to swarm-starter template with preset name as a
 * variable if getPreset is not yet available.
 */
export async function scaffoldSwarm(args: {
  name: string;
  preset?: string;
  outputDir?: string;
}): Promise<ScaffoldSwarmResult> {
  const presetName = args.preset ?? 'custom';

  // Resolve output directory with security validation
  const rawOutputDir = args.outputDir ?? path.join(process.cwd(), args.name.toLowerCase().replace(/\s+/g, '-'));
  const outputDir = validatePathWithinCwd(rawOutputDir, 'outputDir');

  // Create base directory and .claude/ subdirectory
  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(path.join(outputDir, '.claude'), { recursive: true });

  // Resolve preset variables
  let presetVars: Record<string, string> = {};
  let presetMeta: Partial<Preset> = {};

  if (presetName !== 'custom') {
    try {
      const templates = await import('@fetchai/agent-launch-templates') as unknown as Record<string, unknown>;
      if (typeof templates.getPreset === 'function') {
        const preset = (templates.getPreset as (name: string) => Preset | null)(presetName);
        if (preset) {
          presetMeta = preset;
          presetVars = { ...preset.variables };
        }
      }
    } catch {
      // getPreset not available yet — use preset name as variable
    }

    // Always set the preset name as a variable
    presetVars.preset = presetName;
    if (presetMeta.description) {
      presetVars.description = presetMeta.description;
    }
  }

  // Generate files from swarm-starter template (or custom fallback)
  // Note: args.name comes AFTER presetVars so explicit name always wins
  let generated;
  try {
    generated = generateFromTemplate('swarm-starter', {
      ...presetVars,
      agent_name: args.name,
    });
  } catch {
    // swarm-starter template not available yet — fall back to custom
    generated = generateFromTemplate('custom', {
      agent_name: args.name,
      ...presetVars,
    });
  }

  const filePaths: string[] = [];

  // Write agent.py
  const agentPyPath = path.join(outputDir, 'agent.py');
  fs.writeFileSync(agentPyPath, generated.code, 'utf8');
  filePaths.push(agentPyPath);

  // Write README.md
  const readmePath = path.join(outputDir, 'README.md');
  fs.writeFileSync(readmePath, generated.readme, 'utf8');
  filePaths.push(readmePath);

  // Write .env.example
  const envPath = path.join(outputDir, '.env.example');
  fs.writeFileSync(envPath, generated.envExample, 'utf8');
  filePaths.push(envPath);

  // Write CLAUDE.md
  const claudeMdPath = path.join(outputDir, 'CLAUDE.md');
  fs.writeFileSync(claudeMdPath, generated.claudeMd, 'utf8');
  filePaths.push(claudeMdPath);

  // Write .claude/settings.json
  const claudeSettingsPath = path.join(outputDir, '.claude', 'settings.json');
  fs.writeFileSync(claudeSettingsPath, generated.claudeSettings, 'utf8');
  filePaths.push(claudeSettingsPath);

  // Write agentlaunch.config.json
  const configPath = path.join(outputDir, 'agentlaunch.config.json');
  fs.writeFileSync(configPath, generated.agentlaunchConfig, 'utf8');
  filePaths.push(configPath);

  const fileList = filePaths.map((f) => `- \`${f}\``).join('\n');
  const roleInfo = presetMeta.role ? ` | **Role:** ${presetMeta.role}` : '';
  const descInfo = presetMeta.description ? `\n> ${presetMeta.description}` : '';

  const _markdown = `# Swarm Agent Scaffolded: ${args.name}

**Preset:** ${presetName}${roleInfo}${descInfo}
**Output:** \`${outputDir}\`

## Files Created
${fileList}

## Next Steps
1. Edit \`${outputDir}/agent.py\` to implement swarm role logic
2. Deploy all swarm agents: \`deploy_swarm\`
3. Check swarm health: \`network_status\`

## Other Surfaces
- CLI: \`npx agentlaunch create\``;

  return {
    success: true,
    name: args.name,
    preset: presetName,
    directory: outputDir,
    files: filePaths,
    _markdown,
  };
}

// ---------------------------------------------------------------------------
// generate_org_template
// ---------------------------------------------------------------------------

export interface GenerateOrgTemplateResult {
  success: true;
  size: string;
  template: string;
  _markdown?: string;
}

/**
 * generate_org_template
 *
 * Returns a YAML org chart template for users to fill in.
 * Supports three sizes: startup, smb, enterprise.
 */
export async function generateOrgTemplateHandler(args: {
  size?: string;
}): Promise<GenerateOrgTemplateResult> {
  const validSizes = ['startup', 'smb', 'enterprise'] as const;
  const size = (args.size?.toLowerCase() ?? 'smb') as typeof validSizes[number];

  if (!validSizes.includes(size)) {
    throw new Error(`Invalid size: ${size}. Use one of: ${validSizes.join(', ')}`);
  }

  const template = generateOrgTemplate(size);

  const _markdown = `# Org Template: ${size}

Fill in the YAML below, then pass it to \`scaffold_org_swarm\`.

\`\`\`yaml
${template}
\`\`\`

## Next Steps
1. Edit the template: fill in agent names, roles, and descriptions
2. Generate swarm config: \`scaffold_org_swarm({ orgChart: <your-filled-json> })\`
3. Deploy all agents: \`deploy_swarm\``;

  return {
    success: true,
    size,
    template,
    _markdown,
  };
}

// ---------------------------------------------------------------------------
// scaffold_org_swarm
// ---------------------------------------------------------------------------

export interface ScaffoldOrgSwarmResult {
  success: true;
  orgName: string;
  totalAgents: number;
  totalDeployCost: number;
  summary: string;
  config: SwarmConfig;
  scaffoldedTo?: string;
  _markdown?: string;
}

/**
 * scaffold_org_swarm
 *
 * Takes an org chart (JSON object matching OrgChart interface) and generates
 * a complete swarm configuration. Optionally scaffolds agent files to disk.
 */
export async function scaffoldOrgSwarm(args: {
  orgChart: OrgChart;
  outputDir?: string;
}): Promise<ScaffoldOrgSwarmResult> {
  if (!args.orgChart || !args.orgChart.name || !args.orgChart.cSuite) {
    throw new Error("Invalid org chart: 'name' and 'cSuite' are required fields");
  }

  const config = generateSwarmFromOrg(args.orgChart);
  const summary = summarizeSwarm(config);

  const result: ScaffoldOrgSwarmResult = {
    success: true,
    orgName: config.orgName,
    totalAgents: config.totalAgents,
    totalDeployCost: config.totalDeployCost,
    summary,
    config,
  };

  const agentRows = config.agents
    .map((a) => `| ${a.displayName} | ${a.role} |`)
    .join('\n');

  const _markdown = `# Org Swarm: ${config.orgName}

| Metric | Value |
|--------|-------|
| Total Agents | ${config.totalAgents} |
| Deploy Cost | ${config.totalDeployCost} FET |
| Output Dir | ${args.outputDir ?? '(not scaffolded to disk)'} |

## Agent Roster
| Name | Role |
|------|------|
${agentRows}

## Next Steps
1. Deploy all agents: \`deploy_swarm({ presets: [...], apiKey })\`
2. Monitor network: \`network_status\`
3. Check individual commerce: \`check_agent_commerce\``;

  result._markdown = _markdown;

  // Optionally scaffold files to disk
  if (args.outputDir) {
    const rawOutputDir = args.outputDir;
    const outputDir = validatePathWithinCwd(rawOutputDir, 'outputDir');
    fs.mkdirSync(outputDir, { recursive: true });

    for (const agent of config.agents) {
      const agentDir = path.join(outputDir, agent.name);
      fs.mkdirSync(agentDir, { recursive: true });
      fs.mkdirSync(path.join(agentDir, '.claude'), { recursive: true });

      let generated;
      try {
        const templates = await import('@fetchai/agent-launch-templates') as unknown as Record<string, unknown>;
        const preset = typeof templates.getPreset === 'function'
          ? (templates.getPreset as (name: string) => Preset | null)(agent.role)
          : null;
        const variables = preset
          ? { ...preset.variables, agent_name: agent.displayName }
          : { agent_name: agent.displayName, ...agent.variables };
        generated = generateFromTemplate('swarm-starter', variables);
      } catch {
        generated = generateFromTemplate('custom', { agent_name: agent.displayName });
      }

      fs.writeFileSync(path.join(agentDir, 'agent.py'), generated.code, 'utf8');
      fs.writeFileSync(path.join(agentDir, 'README.md'), generated.readme, 'utf8');
      fs.writeFileSync(path.join(agentDir, '.env.example'), generated.envExample, 'utf8');
      fs.writeFileSync(path.join(agentDir, 'CLAUDE.md'), generated.claudeMd, 'utf8');
      fs.writeFileSync(path.join(agentDir, '.claude', 'settings.json'), generated.claudeSettings, 'utf8');
    }

    result.scaffoldedTo = outputDir;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Handler map
// ---------------------------------------------------------------------------

export const scaffoldHandlers = {
  scaffold_agent: scaffoldAgent,
  scaffold_swarm: scaffoldSwarm,
  generate_org_template: generateOrgTemplateHandler,
  scaffold_org_swarm: scaffoldOrgSwarm,
};
