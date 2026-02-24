import * as fs from 'fs';
import { deployAgent } from 'agentlaunch-sdk';
import type { AgentverseDeployResult } from 'agentlaunch-sdk';

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

  const result: AgentverseDeployResult = await deployAgent({
    apiKey: args.apiKey,
    agentName,
    sourceCode,
    secrets: args.secrets,
  });

  return {
    success: true,
    agentAddress: result.agentAddress,
    status: result.status,
  };
}

// ---------------------------------------------------------------------------
// Handler map
// ---------------------------------------------------------------------------

export const agentverseHandlers = {
  deploy_to_agentverse: deployToAgentverse,
};
