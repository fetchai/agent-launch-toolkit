import { AgentLaunchClient, listTokens as sdkListTokens, getToken as sdkGetToken } from 'agentlaunch-sdk';
import type { TokenListResponse, Token, PlatformStats } from 'agentlaunch-sdk';

const client = new AgentLaunchClient();

/**
 * List tokens on the Agent-Launch platform with optional filtering and pagination.
 *
 * Maps to: GET /tokens
 */
export async function listTokens(args: {
  status?: string;
  category?: string;
  chainId?: number;
  sort?: string;
  limit?: number;
  offset?: number;
}): Promise<TokenListResponse> {
  return sdkListTokens(args, client);
}

/**
 * Get full details for a single token by contract address or ID.
 *
 * Maps to:
 *   GET /tokens/address/:address (by address)
 *   GET /tokens/id/:id (by ID)
 */
export async function getToken(args: {
  address?: string;
  id?: number;
}): Promise<Token> {
  if (args.address) {
    return sdkGetToken(args.address, client);
  }

  if (args.id !== undefined) {
    return client.get<Token>(`/tokens/id/${args.id}`);
  }

  throw new Error('Either address or id is required');
}

/**
 * Get platform-wide statistics including total volume, token counts, and
 * trending tokens.
 *
 * Maps to: GET /platform/stats
 */
export async function getPlatformStats(): Promise<PlatformStats> {
  return client.get<PlatformStats>('/platform/stats');
}

/**
 * Handler map consumed by index.ts to dispatch incoming MCP tool calls.
 */
export const discoveryHandlers = {
  list_tokens: listTokens,
  get_token: getToken,
  get_platform_stats: getPlatformStats,
};
