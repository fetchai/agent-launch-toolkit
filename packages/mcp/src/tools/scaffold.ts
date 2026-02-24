import * as fs from 'fs';
import * as path from 'path';
import { generateFromTemplate } from 'agentlaunch-templates';

// ---------------------------------------------------------------------------
// Type mapping: MCP agent types -> template names
// ---------------------------------------------------------------------------

const TYPE_TO_TEMPLATE: Record<string, string> = {
  faucet: 'custom',
  research: 'research',
  trading: 'trading-bot',
  data: 'data-analyzer',
};

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

export interface ScaffoldAgentResult {
  success: true;
  files: string[];
  path: string;
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

  // Resolve output directory
  const outputDir = path.resolve(
    args.outputDir ?? path.join(process.cwd(), args.name.toLowerCase().replace(/\s+/g, '-')),
  );

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

  return {
    success: true,
    files: filePaths,
    path: outputDir,
  };
}

// ---------------------------------------------------------------------------
// Handler map
// ---------------------------------------------------------------------------

export const scaffoldHandlers = {
  scaffold_agent: scaffoldAgent,
};
