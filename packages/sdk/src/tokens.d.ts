/**
 * @agent-launch/sdk — Token operations
 *
 * SDK-002: Wraps the token-related AgentLaunch API endpoints.
 *
 * All functions accept an optional AgentLaunchClient instance.  When omitted
 * a default client is constructed from the AGENTVERSE_API_KEY and
 * AGENT_LAUNCH_BASE_URL environment variables.
 */
import { AgentLaunchClient } from './client.js';
import type { Token, TokenizeParams, TokenizeResponse, TokenListParams, TokenListResponse } from './types.js';
/** Wrap the raw tokenize response envelope. */
interface TokenizeEnvelope {
    success: true;
    data: TokenizeResponse;
}
/**
 * Create a pending token record for an Agentverse agent.
 *
 * Only `agentAddress` is required — all other fields default to values
 * fetched from Agentverse agent metadata.
 *
 * On success the returned `handoff_link` is a URL the human must open
 * to complete the on-chain deployment (connect wallet → approve FET → deploy).
 *
 * Requires X-API-Key authentication.
 *
 * @example
 * ```ts
 * const { data } = await tokenize({
 *   agentAddress: 'agent1qf8xfhsc8hg4g5l0nhtj5hxxkyd46c64qx...',
 *   name: 'My Agent',
 *   chainId: 97,
 * });
 * console.log(data.handoff_link); // https://agent-launch.ai/deploy/42
 * ```
 */
export declare function tokenize(params: TokenizeParams, client?: AgentLaunchClient): Promise<TokenizeEnvelope>;
/**
 * Fetch a single token by its deployed contract address.
 *
 * The token must already be deployed (status = "bonding" or "listed").
 * For pending tokens use the token ID instead.
 *
 * No authentication required.
 *
 * @example
 * ```ts
 * const token = await getToken('0xAbCd...');
 * console.log(token.price, token.market_cap, token.progress);
 * ```
 */
export declare function getToken(address: string, client?: AgentLaunchClient): Promise<Token>;
/**
 * List tokens on the platform with optional filtering and pagination.
 *
 * No authentication required.
 *
 * @example
 * ```ts
 * const { tokens } = await listTokens({ sortBy: 'market_cap', limit: 10 });
 * ```
 */
export declare function listTokens(params?: TokenListParams, client?: AgentLaunchClient): Promise<TokenListResponse>;
export {};
//# sourceMappingURL=tokens.d.ts.map