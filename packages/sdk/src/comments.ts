/**
 * agentlaunch-sdk — Comment operations
 *
 * CF-039: Read and post comments attached to token pages.
 *
 * - getComments  — public read, no auth required
 * - postComment  — requires X-API-Key authentication
 *
 * All functions accept an optional AgentLaunchClient instance.  When omitted
 * a default client is constructed from the AGENTVERSE_API_KEY and
 * AGENT_LAUNCH_BASE_URL environment variables.
 */

import { AgentLaunchClient } from './client.js';
import type { Comment, PostCommentParams, PostCommentResponse } from './types.js';

// ---------------------------------------------------------------------------
// Module-level default client (lazy, env-based)
// ---------------------------------------------------------------------------

function defaultClient(): AgentLaunchClient {
  return new AgentLaunchClient({
    apiKey: process.env['AGENTVERSE_API_KEY'] ?? process.env['AGENT_LAUNCH_API_KEY'],
    baseUrl: process.env['AGENT_LAUNCH_BASE_URL'],
  });
}

// ---------------------------------------------------------------------------
// getComments
// ---------------------------------------------------------------------------

/**
 * Fetch all comments for a deployed token.
 *
 * Returns the comments in chronological order (oldest first).  Comments are
 * visible to anyone — no authentication is required.
 *
 * @param tokenAddress  Contract address of the token
 * @param client        Optional pre-configured AgentLaunchClient
 *
 * @example
 * ```ts
 * import { getComments } from 'agentlaunch-sdk';
 *
 * const comments = await getComments('0xAbCd...');
 * for (const c of comments) {
 *   console.log(`${c.user?.username ?? 'anon'}: ${c.message}`);
 * }
 * ```
 */
export async function getComments(
  tokenAddress: string,
  client?: AgentLaunchClient,
): Promise<Comment[]> {
  const c = client ?? defaultClient();
  return c.get<Comment[]>(`/comments/${encodeURIComponent(tokenAddress)}`);
}

// ---------------------------------------------------------------------------
// postComment
// ---------------------------------------------------------------------------

/**
 * Post a comment on a token page.
 *
 * Requires X-API-Key authentication.  The comment is attributed to the
 * account associated with the API key.
 *
 * @param params  `tokenAddress` and `message` to post
 * @param client  Optional pre-configured AgentLaunchClient
 *
 * @example
 * ```ts
 * import { postComment } from 'agentlaunch-sdk';
 *
 * const result = await postComment({
 *   tokenAddress: '0xAbCd...',
 *   message: 'Bullish on this agent!',
 * });
 * console.log(result.id, result.created_at);
 * ```
 */
export async function postComment(
  params: PostCommentParams,
  client?: AgentLaunchClient,
): Promise<PostCommentResponse> {
  const c = client ?? defaultClient();
  return c.post<PostCommentResponse>(
    `/comments/${encodeURIComponent(params.tokenAddress)}`,
    { message: params.message },
  );
}
