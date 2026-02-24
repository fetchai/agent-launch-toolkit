import { AgentLaunchClient } from 'agentlaunch-sdk';
import type { TokenListResponse, Token, PlatformStats } from 'agentlaunch-sdk';

const client = new AgentLaunchClient();

/**
 * List tokens on the Agent-Launch platform with optional filtering and pagination.
 *
 * Maps to: GET /api/agents/tokens
 */
export async function listTokens(args: {
  status?: string;
  category?: string;
  chainId?: number;
  sort?: string;
  limit?: number;
  offset?: number;
}): Promise<TokenListResponse> {
  const params: Record<string, string | number | boolean | undefined> = {};

  if (args.status) params['status'] = args.status;
  if (args.category) params['category'] = args.category;
  if (args.chainId) params['chainId'] = args.chainId;
  if (args.sort) params['sort'] = args.sort;
  if (args.limit !== undefined) params['limit'] = args.limit;
  if (args.offset !== undefined) params['offset'] = args.offset;

  return client.get<TokenListResponse>('/api/agents/tokens', params);
}

/**
 * Get full details for a single token by contract address or numeric ID.
 *
 * Maps to:
 *   GET /api/agents/token/:address  (when address is provided)
 *   GET /api/tokens/:id             (when id is provided)
 *
 * At least one of address or id must be supplied.
 */
export async function getToken(args: {
  address?: string;
  id?: number;
}): Promise<Token> {
  if (args.address) {
    return client.get<Token>(`/api/agents/token/${encodeURIComponent(args.address)}`);
  }

  if (args.id !== undefined) {
    return client.get<Token>(`/api/tokens/${args.id}`);
  }

  throw new Error('Either address or id is required');
}

/**
 * Get platform-wide statistics including total volume, token counts, and
 * trending tokens.
 *
 * Maps to: GET /api/platform/stats
 */
export async function getPlatformStats(): Promise<PlatformStats> {
  return client.get<PlatformStats>('/api/platform/stats');
}

/**
 * Handler map consumed by index.ts to dispatch incoming MCP tool calls.
 */
export const discoveryHandlers = {
  list_tokens: listTokens,
  get_token: getToken,
  get_platform_stats: getPlatformStats,
};
