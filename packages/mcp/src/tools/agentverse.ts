import * as fs from 'fs';
import { deployAgent, updateAgent, buildOptimizationChecklist } from 'agentlaunch-sdk';
import type { AgentverseDeployResult, AgentMetadata, OptimizationCheckItem } from 'agentlaunch-sdk';

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

export interface DeployToAgentverseResult {
  success: true;
  agentAddress: string;
  status: string;
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
  apiKey: string;
  agentFile: string;
  agentName?: string;
  secrets?: Record<string, string>;
  readme?: string;
  shortDescription?: string;
}): Promise<DeployToAgentverseResult> {
  // Read agent source code
  if (!fs.existsSync(args.agentFile)) {
    throw new Error(`Agent file not found: ${args.agentFile}`);
  }

  const sourceCode = fs.readFileSync(args.agentFile, 'utf8');
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
    apiKey: args.apiKey,
    agentName,
    sourceCode,
    secrets: args.secrets,
    metadata,
  });

  return {
    success: true,
    agentAddress: result.agentAddress,
    status: result.status,
  };
}

// ---------------------------------------------------------------------------
// Update agent metadata
// ---------------------------------------------------------------------------

export interface UpdateAgentMetadataResult {
  success: boolean;
  updatedFields: string[];
  optimization: OptimizationCheckItem[];
}

/**
 * update_agent_metadata
 *
 * Updates README, short_description, and/or avatar_url on an existing
 * Agentverse agent. Returns the optimization checklist.
 */
export async function updateAgentMetadata(args: {
  apiKey: string;
  agentAddress: string;
  readme?: string;
  shortDescription?: string;
  avatarUrl?: string;
}): Promise<UpdateAgentMetadataResult> {
  const result = await updateAgent({
    apiKey: args.apiKey,
    agentAddress: args.agentAddress,
    metadata: {
      readme: args.readme,
      short_description: args.shortDescription,
      avatar_url: args.avatarUrl,
    },
  });

  return {
    success: result.success,
    updatedFields: result.updatedFields,
    optimization: result.optimization,
  };
}

// ---------------------------------------------------------------------------
// Handler map
// ---------------------------------------------------------------------------

export const agentverseHandlers = {
  deploy_to_agentverse: deployToAgentverse,
  update_agent_metadata: updateAgentMetadata,
};
