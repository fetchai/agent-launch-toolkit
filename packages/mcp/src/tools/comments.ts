import { AgentLaunchClient } from 'agentlaunch-sdk';
import type { Comment } from 'agentlaunch-sdk';

const client = new AgentLaunchClient();

/** Regex to validate Ethereum addresses: 0x followed by exactly 40 hex characters */
const ETH_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

/**
 * Validates that an address is a valid Ethereum address format.
 * Prevents URL injection via addresses containing special characters.
 */
function validateEthAddress(address: string): void {
  if (!ETH_ADDRESS_REGEX.test(address)) {
    throw new Error(`Invalid token address format: ${address}. Expected 0x followed by 40 hex characters.`);
  }
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
    throw new Error('address is required');
  }

  // Security: Validate address format
  validateEthAddress(args.address);

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

  // Security: Validate address format
  validateEthAddress(args.address);

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
