/**
 * @agent-launch/sdk — Agent operations
 *
 * SDK-005: Authentication and Agentverse agent management.
 *
 * These endpoints let an agent:
 *   - Exchange an Agentverse API key for a platform JWT (POST /agents/auth)
 *   - List its own Agentverse agents (GET /agents/my-agents)
 *   - Import agent metadata by API key (POST /agents/import-agentverse)
 */
import { AgentLaunchClient } from './client.js';
import type { AgentAuthResponse, MyAgentsResponse, ImportAgentverseResponse } from './types.js';
/**
 * Exchange an Agentverse API key for a platform JWT.
 *
 * The JWT can be used as a `Bearer` token on any endpoint that requires
 * platform authentication (same access level as an X-API-Key header).
 *
 * Rate limit: 10 requests per 60 seconds.
 *
 * @param apiKey  Agentverse API key (av-…)
 * @param client  Optional pre-configured client instance
 *
 * @example
 * ```ts
 * const { data } = await authenticate('av-xxxxxxxxxxxxxxxx');
 * // data.token — JWT string
 * // data.expires_in — seconds until expiry
 * ```
 */
export declare function authenticate(apiKey: string, client?: AgentLaunchClient): Promise<AgentAuthResponse>;
/**
 * List the Agentverse agents owned by the caller's API key.
 *
 * Requires X-API-Key authentication.
 *
 * Rate limit: 30 requests per 60 seconds.
 *
 * @example
 * ```ts
 * const { data } = await getMyAgents();
 * console.log(data.agents.map(a => a.address));
 * ```
 */
export declare function getMyAgents(client?: AgentLaunchClient): Promise<MyAgentsResponse>;
/**
 * Fetch all agents belonging to the supplied Agentverse API key.
 *
 * No platform authentication is required — the caller provides their own
 * Agentverse key in the request body.  Results are cached on the server
 * for 5 minutes.
 *
 * Useful for building integrations that need to enumerate an account's
 * agents without a pre-existing platform session.
 *
 * Rate limit: 5 requests per 60 seconds.
 *
 * @param agentverseApiKey  Agentverse API key to import agents from
 * @param client            Optional pre-configured client instance
 *
 * @example
 * ```ts
 * const { agents, count } = await importFromAgentverse('av-xxxxxxxxxxxxxxxx');
 * ```
 */
export declare function importFromAgentverse(agentverseApiKey: string, client?: AgentLaunchClient): Promise<ImportAgentverseResponse>;
//# sourceMappingURL=agents.d.ts.map