/**
 * agentlaunch-sdk — Agent operations
 *
 * SDK-005: Authentication and Agentverse agent management.
 *
 * These endpoints let an agent:
 *   - Exchange an Agentverse API key for a platform JWT (POST /agents/auth)
 *   - List its own Agentverse agents (GET /agents/my-agents)
 *   - Import agent metadata by API key (POST /agents/import-agentverse)
 */

import { AgentLaunchClient } from './client.js';
import type {
  AgentAuthResponse,
  MyAgentsResponse,
  ImportAgentverseResponse,
} from './types.js';

// ---------------------------------------------------------------------------
// Module-level default client (lazy, env-based)
// ---------------------------------------------------------------------------

function defaultClient(apiKey?: string): AgentLaunchClient {
  return new AgentLaunchClient({
    apiKey: apiKey ?? process.env['AGENTVERSE_API_KEY'] ?? process.env['AGENT_LAUNCH_API_KEY'],
    baseUrl: process.env['AGENT_LAUNCH_BASE_URL'],
  });
}

// ---------------------------------------------------------------------------
// authenticate
// ---------------------------------------------------------------------------

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
export async function authenticate(
  apiKey: string,
  client?: AgentLaunchClient,
): Promise<AgentAuthResponse> {
  // authenticate uses a body field, not a header — use a temporary client
  // that does NOT need an API key header (the key goes in the body).
  const c = client ?? new AgentLaunchClient({
    baseUrl: process.env['AGENT_LAUNCH_BASE_URL'],
    // No apiKey — the key is passed in the request body for this endpoint
  });

  // The auth endpoint accepts the key in the body and does not require
  // an X-API-Key header, so we call post directly with no guard.
  // We build a one-off request to avoid the "apiKey required" guard.
  return (c as AgentLaunchClient & {
    post<T>(path: string, body: unknown): Promise<T>;
  }).post<AgentAuthResponse>('/api/agents/auth', { api_key: apiKey });
}

// ---------------------------------------------------------------------------
// getMyAgents
// ---------------------------------------------------------------------------

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
export async function getMyAgents(
  client?: AgentLaunchClient,
): Promise<MyAgentsResponse> {
  const c = client ?? defaultClient();
  return c.get<MyAgentsResponse>('/api/agents/my-agents');
}

// ---------------------------------------------------------------------------
// importFromAgentverse
// ---------------------------------------------------------------------------

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
export async function importFromAgentverse(
  agentverseApiKey: string,
  client?: AgentLaunchClient,
): Promise<ImportAgentverseResponse> {
  // This endpoint does not require platform auth — use a client without key
  const c = client ?? new AgentLaunchClient({
    baseUrl: process.env['AGENT_LAUNCH_BASE_URL'],
  });

  return (c as AgentLaunchClient & {
    post<T>(path: string, body: unknown): Promise<T>;
  }).post<ImportAgentverseResponse>('/api/agents/import-agentverse', {
    agentverseApiKey,
  });
}
