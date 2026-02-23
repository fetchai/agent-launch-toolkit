import type { TokenListResponse, TokenDetails, PlatformStats } from "../types/api.js";
/**
 * List tokens on the Agent-Launch platform with optional filtering and pagination.
 *
 * Maps to: GET /agents/tokens
 */
export declare function listTokens(args: {
    status?: string;
    category?: string;
    chainId?: number;
    sort?: string;
    limit?: number;
    offset?: number;
}): Promise<TokenListResponse>;
/**
 * Get full details for a single token by contract address or numeric ID.
 *
 * Maps to:
 *   GET /agents/token/:address  (when address is provided)
 *   GET /tokens/:id             (when id is provided)
 *
 * At least one of address or id must be supplied.
 */
export declare function getToken(args: {
    address?: string;
    id?: number;
}): Promise<TokenDetails>;
/**
 * Get platform-wide statistics including total volume, token counts, and
 * trending tokens.
 *
 * Maps to: GET /platform/stats
 */
export declare function getPlatformStats(): Promise<PlatformStats>;
/**
 * Handler map consumed by index.ts to dispatch incoming MCP tool calls.
 */
export declare const discoveryHandlers: {
    list_tokens: typeof listTokens;
    get_token: typeof getToken;
    get_platform_stats: typeof getPlatformStats;
};
//# sourceMappingURL=discovery.d.ts.map