/**
 * MCP tool handler for updating an agent's connection endpoint.
 *
 * update_connection — changes the HTTPS URL (and optionally the auth
 * credentials) that a connected agent forwards requests to.
 */

import { updateConnection as sdkUpdateConnection } from '@fetchai/agent-launch-sdk';
import type { ConnectConfig } from '@fetchai/agent-launch-sdk';

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

export interface UpdateConnectionResult {
  success: boolean;
  _markdown?: string;
}

// ---------------------------------------------------------------------------
// Tool implementation
// ---------------------------------------------------------------------------

/**
 * update_connection
 *
 * Updates the target endpoint of a connected agent on Agentverse.
 *
 * Maps to (Wave 3): PUT /api/proxy/agents/{address}/endpoint
 *
 * @param address     - The agent1q... address of the agent to update.
 * @param endpoint    - New HTTPS URL the agent should forward requests to.
 * @param auth_header - Optional auth header name (e.g. "Authorization").
 * @param auth_secret - Optional auth header value (e.g. "Bearer sk-...").
 */
export async function updateConnectionTool(args: {
  address: string;
  endpoint: string;
  auth_header?: string;
  auth_secret?: string;
}): Promise<UpdateConnectionResult> {
  // Validate address format
  if (!args.address.startsWith('agent1q')) {
    throw new Error(
      `Invalid agent address "${args.address}": must start with "agent1q"`,
    );
  }

  // Validate endpoint is HTTPS
  if (!args.endpoint.startsWith('https://')) {
    throw new Error(
      `Invalid endpoint "${args.endpoint}": must be an HTTPS URL`,
    );
  }

  // Validate that auth_header and auth_secret are provided together
  if (
    (args.auth_header && !args.auth_secret) ||
    (!args.auth_header && args.auth_secret)
  ) {
    throw new Error(
      'auth_header and auth_secret must be provided together',
    );
  }

  // Build the partial ConnectConfig to pass to sdkUpdateConnection
  const config: Partial<ConnectConfig> = {
    endpoint: args.endpoint,
  };

  if (args.auth_header && args.auth_secret) {
    config.auth = {
      header: args.auth_header,
      secret: args.auth_secret,
    };
  }

  const apiKey = process.env.AGENTVERSE_API_KEY;

  await sdkUpdateConnection(args.address, config, apiKey);

  const _markdown = `# Agent Connection Updated

| Field | Value |
|-------|-------|
| Agent | \`${args.address}\` |
| New Endpoint | ${args.endpoint} |
| Auth Header | ${args.auth_header ?? '(unchanged)'} |

## Next Steps
- Verify traffic is routing correctly to the new endpoint
- Update any stored endpoint references in your agent code`;

  return { success: true, _markdown };
}

// ---------------------------------------------------------------------------
// Tool definition — consumed by index.ts TOOLS array
// ---------------------------------------------------------------------------

export const UPDATE_CONNECTION_TOOL = {
  name: 'update_connection',
  description:
    'Update the target endpoint of a connected agent.\n\nUSE THIS TOOL WHEN:\n- You need to point an existing agent connection at a new backend URL\n- You are rotating auth credentials for a connected service\n\nExamples: update_connection({ address: "agent1q...", endpoint: "https://api.example.com/v2" })\n\nPREREQUISITE: The agent must already be connected on Agentverse.\n\nNext: `deploy_to_agentverse` to redeploy with updated config, `get_skill` for full capability list.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      address: {
        type: 'string',
        description: 'The agent1q... address of the agent to update',
      },
      endpoint: {
        type: 'string',
        description: 'New HTTPS URL the agent should forward requests to',
      },
      auth_header: {
        type: 'string',
        description:
          'New auth header name (e.g. "Authorization"). Must be provided together with auth_secret.',
      },
      auth_secret: {
        type: 'string',
        description:
          'New auth header value (e.g. "Bearer sk-..."). Must be provided together with auth_header.',
      },
    },
    required: ['address', 'endpoint'],
  },
};

// ---------------------------------------------------------------------------
// Handler map — consumed by index.ts dispatch
// ---------------------------------------------------------------------------

export const connectHandlers = {
  update_connection: updateConnectionTool,
};
