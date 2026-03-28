/**
 * Connection status tool — query the live status of a connected agent by address.
 *
 * get_connection_status: Fetch address, name, endpoint, status, and lastActivity
 *                        for a given agent1q... address.
 */

import { connectionStatus as sdkConnectionStatus } from 'agentlaunch-sdk';

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

export interface ConnectionStatus {
  /** The agent1q... address queried */
  address: string;
  /** Human-readable agent name */
  name: string;
  /** REST or WebSocket endpoint the agent exposes */
  endpoint: string;
  /** Current lifecycle state, e.g. "running" | "stopped" | "error" */
  status: string;
  /** ISO-8601 timestamp of the most recent activity, or null if never active */
  lastActivity: string | null;
}

export interface GetConnectionStatusResult extends ConnectionStatus {
  _markdown: string;
}

// ---------------------------------------------------------------------------
// Tool implementation
// ---------------------------------------------------------------------------

/**
 * get_connection_status
 *
 * Returns the current connection status of an agent identified by its
 * agent1q... address.
 */
export async function getConnectionStatus(args: {
  address: string;
}): Promise<GetConnectionStatusResult> {
  const apiKey = process.env.AGENTVERSE_API_KEY;

  const result = await sdkConnectionStatus(args.address, apiKey);

  const lastActivity = result.lastActivity ?? null;

  const statusLabel =
    result.status === 'running'
      ? 'Running'
      : result.status === 'stopped'
        ? 'Stopped'
        : 'Error';

  const _markdown = `# Agent Connection Status

| Field | Value |
|-------|-------|
| Address | \`${result.address}\` |
| Name | ${result.name} |
| Status | ${statusLabel} |
| Endpoint | ${result.endpoint || '(not configured)'} |
| Compilation | ${result.compilationStatus ?? 'unknown'} |
| Last Activity | ${lastActivity ?? 'No activity recorded'} |

## Next Steps
${result.status === 'running'
  ? '- Agent is live and accepting traffic\n- Use `update_connection` to change the upstream target'
  : result.status === 'stopped'
    ? '- Agent is stopped — restart it via Agentverse or reconnect with `connect_agent`'
    : '- Agent encountered an error — check logs and consider reconnecting with `connect_agent`'}`;

  return {
    address: result.address,
    name: result.name,
    endpoint: result.endpoint,
    status: result.status,
    lastActivity,
    _markdown,
  };
}

// ---------------------------------------------------------------------------
// MCP tool schema definition
// ---------------------------------------------------------------------------

export const GET_CONNECTION_STATUS_TOOL = {
  name: 'get_connection_status',
  description:
    'Get the current connection status of an agent by its Agentverse address.\n\n' +
    'USE THIS TOOL WHEN:\n' +
    '- You need to check whether a connected agent is running or stopped\n' +
    '- You want to confirm the upstream endpoint an agent is forwarding to\n' +
    '- You are polling readiness after a `connect_agent` call\n\n' +
    'Examples:\n' +
    '  get_connection_status({ address: "agent1q..." })\n\n' +
    'Next: `update_connection` to change the upstream URL, `connect_agent` to reconnect.',
  inputSchema: {
    type: 'object' as const,
    required: ['address'],
    properties: {
      address: {
        type: 'string',
        description: 'Agentverse agent address (agent1q...)',
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Handler map — consumed by index.ts dispatch
// ---------------------------------------------------------------------------

export const connectHandlers = {
  get_connection_status: getConnectionStatus,
};
