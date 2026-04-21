// ---------------------------------------------------------------------------
// connect_agent (MCP-CONNECT-001)
//
// Connects your agent to Agentverse by deploying a proxy that forwards
// incoming uAgent messages to an external HTTPS endpoint. Useful for
// bridging Agentverse message routing with existing HTTP services without
// running a full Python agent.
// ---------------------------------------------------------------------------

import { connectAgent as sdkConnectAgent } from '@fetchai/agent-launch-sdk';
import type { ConnectConfig } from '@fetchai/agent-launch-sdk';

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

export interface ConnectAgentResult {
  address: string;
  name: string;
  endpoint: string;
  status: string;
  _markdown?: string;
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

/** Validates a URL is HTTPS and well-formed. Throws on failure. */
function validateHttpsUrl(url: string, paramName: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`${paramName} must be a valid URL`);
  }
  if (parsed.protocol !== 'https:') {
    throw new Error(`${paramName} must use HTTPS (got: ${parsed.protocol})`);
  }
}

/** Validates timeout is a positive integer in the range [1, 300]. */
function validateTimeout(timeout: number): void {
  if (!Number.isInteger(timeout) || timeout < 1 || timeout > 300) {
    throw new Error('timeout must be an integer between 1 and 300 seconds');
  }
}

// ---------------------------------------------------------------------------
// Tool implementation
// ---------------------------------------------------------------------------

/**
 * connect_agent (MCP-CONNECT-001)
 *
 * Connects your agent to Agentverse by deploying a proxy that forwards all
 * received uAgent messages to an external HTTPS endpoint via HTTP POST. The
 * proxy passes the raw message payload as JSON and optionally attaches an
 * authentication header to the outbound request.
 *
 * Parameters
 * ----------
 * name          (required) Human-readable agent name shown on Agentverse.
 * endpoint      (required) HTTPS URL the proxy will POST messages to.
 * description   (optional) Short description shown on the agent profile.
 * auth_header   (optional) Name of the HTTP header used for authentication
 *               (e.g. "Authorization", "X-API-Key"). Stored as a secret.
 * auth_secret   (optional) Value of the auth header. Stored as a secret.
 * timeout       (optional) HTTP request timeout in seconds (1–300, default 30).
 *
 * Returns
 * -------
 * ConnectAgentResult — address, name, endpoint, status, and _markdown.
 */
export async function connectAgent(args: {
  name: string;
  endpoint: string;
  description?: string;
  auth_header?: string;
  auth_secret?: string;
  timeout?: number;
}): Promise<ConnectAgentResult> {
  // --- Input validation ---
  if (!args.name || !args.name.trim()) {
    throw new Error('name is required');
  }
  if (!args.endpoint || !args.endpoint.trim()) {
    throw new Error('endpoint is required');
  }

  validateHttpsUrl(args.endpoint, 'endpoint');

  const timeout = args.timeout ?? 30;
  validateTimeout(timeout);

  // auth_header and auth_secret must either both be present or both absent
  const hasAuthHeader = args.auth_header !== undefined && args.auth_header !== '';
  const hasAuthSecret = args.auth_secret !== undefined && args.auth_secret !== '';
  if (hasAuthHeader !== hasAuthSecret) {
    throw new Error('auth_header and auth_secret must be provided together');
  }

  // --- Build ConnectConfig for the SDK ---
  const config: ConnectConfig = {
    name: args.name.trim(),
    endpoint: args.endpoint.trim(),
    // timeout: MCP receives seconds (1–300); SDK expects milliseconds
    timeout: timeout * 1000,
  };

  if (args.description) {
    config.description = args.description;
  }

  if (hasAuthHeader && hasAuthSecret) {
    config.auth = {
      header: args.auth_header as string,
      secret: args.auth_secret as string,
    };
  }

  // --- Invoke SDK ---
  const apiKey = process.env.AGENTVERSE_API_KEY;
  const result = await sdkConnectAgent(config, apiKey);

  // --- Build markdown response ---
  const agentverseUrl = `https://agentverse.ai/agents/${result.address}`;

  const lines: string[] = [
    `## Agent Connected to Agentverse`,
    ``,
    `**Name:** ${result.name}`,
    `**Address:** \`${result.address}\``,
    `**Endpoint:** ${args.endpoint}`,
    `**Agentverse:** ${agentverseUrl}`,
    ``,
    `Your agent is now connected on Agentverse and will forward all incoming uAgent messages to \`${args.endpoint}\` via HTTP POST.`,
  ];

  if (hasAuthHeader) {
    lines.push(``, `**Auth header** \`${args.auth_header}\` has been stored as an Agentverse secret.`);
  }

  lines.push(
    ``,
    `**Next steps:**`,
    `- \`get_connection_status\` — check the agent is running`,
    `- \`update_connection\` — change the target URL later`,
    `- \`create_token_record\` — tokenize this agent on AgentLaunch`,
  );

  return {
    address: result.address,
    name: result.name,
    endpoint: args.endpoint,
    status: 'running',
    _markdown: lines.join('\n'),
  };
}

// ---------------------------------------------------------------------------
// MCP tool schema definition
// ---------------------------------------------------------------------------

export const connectAgentToolDefinition = {
  name: 'connect_agent',
  description:
    'Connect your agent to Agentverse by deploying a proxy that forwards incoming uAgent messages to an external HTTPS endpoint.\n\n' +
    'USE THIS TOOL WHEN:\n' +
    '- You have an existing HTTP service and want it reachable via the uAgent network\n' +
    '- You want to bridge Agentverse message routing to a webhook without writing a full Python agent\n\n' +
    'Examples:\n' +
    '  connect_agent({ name: "MyAgent", endpoint: "https://my-service.com/webhook" })\n' +
    '  connect_agent({ name: "SecureAgent", endpoint: "https://api.example.com/events", auth_header: "X-API-Key", auth_secret: "sk-..." })\n\n' +
    'Next: `update_agent_metadata` to enrich the agent profile, `create_token_record` to tokenize the agent.',
  inputSchema: {
    type: 'object' as const,
    required: ['name', 'endpoint'],
    properties: {
      name: {
        type: 'string',
        description: 'Human-readable agent name shown on Agentverse',
      },
      endpoint: {
        type: 'string',
        description: 'HTTPS URL the proxy will POST forwarded messages to',
      },
      description: {
        type: 'string',
        description: 'Short description shown on the agent profile (optional)',
      },
      auth_header: {
        type: 'string',
        description:
          'Name of the HTTP header used for authentication, e.g. "Authorization" or "X-API-Key" (optional, must be paired with auth_secret)',
      },
      auth_secret: {
        type: 'string',
        description:
          'Value of the authentication header. Stored as an Agentverse secret — never embedded in source code (optional, must be paired with auth_header)',
      },
      timeout: {
        type: 'number',
        description: 'HTTP request timeout in seconds, 1–300 (default: 30)',
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Handler map — consumed by index.ts dispatch
// ---------------------------------------------------------------------------

export const connectHandlers = {
  connect_agent: connectAgent,
};
