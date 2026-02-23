import { apiGet, apiPost } from "../client.js";

// ---------------------------------------------------------------------------
// Response shape
// ---------------------------------------------------------------------------

export interface Comment {
  id: number;
  message: string;
  createdAt: string;
  user: {
    address: string;
  };
}

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
    throw new Error("address is required");
  }

  return apiGet<Comment[]>(`/comments/${args.address}`);
}

/**
 * post_comment
 *
 * Posts a comment on a token identified by its contract address.
 * Requires AGENT_LAUNCH_API_KEY to be set (enforced by apiPost).
 */
export async function postComment(args: {
  address: string;
  message: string;
}): Promise<unknown> {
  if (!args.address || !args.address.trim()) {
    throw new Error("address is required");
  }
  if (!args.message || !args.message.trim()) {
    throw new Error("message is required");
  }

  return apiPost<unknown>(`/comments/${args.address}`, {
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
