import * as fs from 'fs';
import * as path from 'path';
import { deployAgent, updateAgent, buildOptimizationChecklist } from 'agentlaunch-sdk';
import type { AgentverseDeployResult, AgentMetadata, OptimizationCheckItem } from 'agentlaunch-sdk';

/**
 * Validates that a file path is within the current working directory.
 * Prevents path traversal attacks (e.g., reading /etc/passwd via ../../).
 */
function validatePathWithinCwd(filePath: string, paramName: string): string {
  const resolved = path.resolve(filePath);
  const cwd = path.resolve(process.cwd());
  if (!resolved.startsWith(cwd + path.sep) && resolved !== cwd) {
    throw new Error(`${paramName} must be within the current working directory`);
  }
  return resolved;
}

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

export interface DeployToAgentverseResult {
  success: true;
  agentAddress: string;
  status: string;
  _markdown?: string;
}

// ---------------------------------------------------------------------------
// Tool implementation
// ---------------------------------------------------------------------------

/**
 * deploy_to_agentverse (MCP-006)
 *
 * Deploys an agent Python file to Agentverse hosting via the SDK's deployAgent():
 *   1. Create agent record
 *   2. Upload Python source (double-encoded JSON)
 *   3. Store secrets
 *   4. Start agent
 *   5. Poll for compilation (up to 60s)
 */
export async function deployToAgentverse(args: {
  apiKey?: string;
  agentFile: string;
  agentName?: string;
  secrets?: Record<string, string>;
  readme?: string;
  shortDescription?: string;
}): Promise<DeployToAgentverseResult> {
  // Security: Validate file path is within current working directory
  const safeAgentFile = validatePathWithinCwd(args.agentFile, 'agentFile');

  // Read agent source code
  if (!fs.existsSync(safeAgentFile)) {
    throw new Error(`Agent file not found: ${args.agentFile}`);
  }

  const sourceCode = fs.readFileSync(safeAgentFile, 'utf8');
  if (!sourceCode.trim()) {
    throw new Error(`Agent file is empty: ${args.agentFile}`);
  }

  const agentName =
    args.agentName ??
    args.agentFile
      .split('/')
      .pop()
      ?.replace(/\.py$/, '') ??
    'MyAgent';

  // Build metadata from optional readme/shortDescription args
  const metadata: AgentMetadata | undefined =
    args.readme || args.shortDescription
      ? {
          readme: args.readme,
          short_description: args.shortDescription,
        }
      : undefined;

  const result: AgentverseDeployResult = await deployAgent({
    // Let SDK fall back to env vars if apiKey not provided
    ...(args.apiKey && { apiKey: args.apiKey }),
    agentName,
    sourceCode,
    secrets: args.secrets,
    metadata,
  });

  const _markdown = `# Agent Deployed: ${agentName}

| Field | Value |
|-------|-------|
| Address | \`${result.agentAddress}\` |
| Status | ${result.status} |
| File | ${args.agentFile} |

## Next Steps
1. Tokenize this agent: \`create_token_record\` (or \`create_and_tokenize\`)
2. Update profile: \`update_agent_metadata\`
3. Monitor commerce: \`check_agent_commerce({ address: "${result.agentAddress}" })\`

## Other Surfaces
- CLI: \`npx agentlaunch deploy\`
- SDK: \`deployAgent({ apiKey, agentName, sourceCode })\``;

  return {
    success: true,
    agentAddress: result.agentAddress,
    status: result.status,
    _markdown,
  };
}

// ---------------------------------------------------------------------------
// Update agent metadata
// ---------------------------------------------------------------------------

export interface UpdateAgentMetadataResult {
  success: boolean;
  updatedFields: string[];
  optimization: OptimizationCheckItem[];
  _markdown?: string;
}

/**
 * update_agent_metadata
 *
 * Updates README, short_description, and/or avatar_url on an existing
 * Agentverse agent. Returns the optimization checklist.
 */
export async function updateAgentMetadata(args: {
  apiKey?: string;
  agentAddress: string;
  readme?: string;
  shortDescription?: string;
  avatarUrl?: string;
}): Promise<UpdateAgentMetadataResult> {
  const result = await updateAgent({
    // Let SDK fall back to env vars if apiKey not provided
    ...(args.apiKey && { apiKey: args.apiKey }),
    agentAddress: args.agentAddress,
    metadata: {
      readme: args.readme,
      short_description: args.shortDescription,
      avatar_url: args.avatarUrl,
    },
  });

  const changedList = result.updatedFields.length > 0
    ? result.updatedFields.map((f) => `- ${f}`).join('\n')
    : '- (none)';

  const optimizationIssues = result.optimization
    .filter((item) => !item.done)
    .map((item) => `- ${item.factor}`)
    .join('\n') || '- All checks passed';

  const _markdown = `# Metadata Updated: ${args.agentAddress}

## Fields Changed
${changedList}

## Optimization Checklist
${optimizationIssues}

## Next Steps
- Run full optimization: \`npx agentlaunch optimize\`
- Deploy updated agent: \`deploy_to_agentverse\`
- View on Agentverse: https://agentverse.ai/agents/${args.agentAddress}`;

  return {
    success: result.success,
    updatedFields: result.updatedFields,
    optimization: result.optimization,
    _markdown,
  };
}

// ---------------------------------------------------------------------------
// Handler map
// ---------------------------------------------------------------------------

export const agentverseHandlers = {
  deploy_to_agentverse: deployToAgentverse,
  update_agent_metadata: updateAgentMetadata,
};
