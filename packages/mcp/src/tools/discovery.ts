import { apiGet } from "../client.js";
import type {
  TokenListResponse,
  TokenDetails,
  PlatformStats,
} from "../types/api.js";

/**
 * List tokens on the Agent-Launch platform with optional filtering and pagination.
 *
 * Maps to: GET /agents/tokens
 */
export async function listTokens(args: {
  status?: string;
  category?: string;
  chainId?: number;
  sort?: string;
  limit?: number;
  offset?: number;
}): Promise<TokenListResponse> {
  const params = new URLSearchParams();

  if (args.status) params.set("status", args.status);
  if (args.category) params.set("category", args.category);
  if (args.chainId) params.set("chainId", String(args.chainId));
  if (args.sort) params.set("sort", args.sort);
  if (args.limit !== undefined) params.set("limit", String(args.limit));
  if (args.offset !== undefined) params.set("offset", String(args.offset));

  const query = params.toString();
  return apiGet<TokenListResponse>(
    `/agents/tokens${query ? `?${query}` : ""}`,
  );
}

/**
 * Get full details for a single token by contract address or numeric ID.
 *
 * Maps to:
 *   GET /agents/token/:address  (when address is provided)
 *   GET /tokens/:id             (when id is provided)
 *
 * At least one of address or id must be supplied.
 */
export async function getToken(args: {
  address?: string;
  id?: number;
}): Promise<TokenDetails> {
  if (args.address) {
    return apiGet<TokenDetails>(`/agents/token/${args.address}`);
  }

  if (args.id !== undefined) {
    return apiGet<TokenDetails>(`/tokens/${args.id}`);
  }

  throw new Error("Either address or id is required");
}

/**
 * Get platform-wide statistics including total volume, token counts, and
 * trending tokens.
 *
 * Maps to: GET /platform/stats
 */
export async function getPlatformStats(): Promise<PlatformStats> {
  return apiGet<PlatformStats>("/platform/stats");
}

/**
 * Handler map consumed by index.ts to dispatch incoming MCP tool calls.
 */
export const discoveryHandlers = {
  list_tokens: listTokens,
  get_token: getToken,
  get_platform_stats: getPlatformStats,
};
