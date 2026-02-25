import { AgentLaunchClient } from 'agentlaunch-sdk';
import type { Comment } from 'agentlaunch-sdk';

const client = new AgentLaunchClient();

// ---------------------------------------------------------------------------
// Tool implementations
// ---------------------------------------------------------------------------

/**
 * get_comments
 *
 * Returns the comment thread for a token identified by its contract address.
 * Does not require an API key — publicly readable.
 */
export async function getComments(args: {
  address: string;
}): Promise<Comment[]> {
  if (!args.address || !args.address.trim()) {
    throw new Error('address is required');
  }

  return client.get<Comment[]>(`/comments/${encodeURIComponent(args.address)}`);
}

/**
 * post_comment
 *
 * Posts a comment on a token identified by its contract address.
 * Requires AGENT_LAUNCH_API_KEY to be set (enforced by client.post).
 */
export async function postComment(args: {
  address: string;
  message: string;
}): Promise<unknown> {
  if (!args.address || !args.address.trim()) {
    throw new Error('address is required');
  }
  if (!args.message || !args.message.trim()) {
    throw new Error('message is required');
  }

  return client.post<unknown>(`/comments/${encodeURIComponent(args.address)}`, {
    message: args.message,
  });
}

// ---------------------------------------------------------------------------
// Handler map — consumed by index.ts dispatch
// ---------------------------------------------------------------------------

export const commentHandlers = {
  get_comments: getComments,
  post_comment: postComment,
};
