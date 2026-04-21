import { AgentLaunchClient } from '@fetchai/agent-launch-sdk';
import type { Comment } from '@fetchai/agent-launch-sdk';

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
}): Promise<Comment[] & { _markdown?: string }> {
  if (!args.address || !args.address.trim()) {
    throw new Error('address is required');
  }

  // Security: Validate address format
  validateEthAddress(args.address);

  const result = await client.get<Comment[]>(`/comments/${encodeURIComponent(args.address)}`);

  const commentRows = result.length > 0
    ? result
        .slice(0, 10)
        .map((c) => {
          const author = (c.user?.address ?? c.user?.username ?? String(c.userId)).slice(0, 14) + '...';
          const msg = c.message.slice(0, 60);
          return `| ${author} | ${msg} |`;
        })
        .join('\n')
    : '| — | No comments yet |';

  const truncated = result.length > 10 ? `\n_Showing 10 of ${result.length} comments._` : '';

  const _markdown = `# Comments: ${args.address}

**Total:** ${result.length}

| Author | Message |
|--------|---------|
${commentRows}${truncated}

## Next Steps
- Post a comment: \`post_comment({ address: "${args.address}", message: "..." })\`
- View token: https://agent-launch.ai/trade/${args.address}`;

  return Object.assign(result, { _markdown });
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
}): Promise<Record<string, unknown>> {
  if (!args.address || !args.address.trim()) {
    throw new Error('address is required');
  }
  if (!args.message || !args.message.trim()) {
    throw new Error('message is required');
  }

  // Security: Validate address format
  validateEthAddress(args.address);

  const result = await client.post<Record<string, unknown>>(`/comments/${encodeURIComponent(args.address)}`, {
    message: args.message,
  });

  const _markdown = `# Comment Posted

| Field | Value |
|-------|-------|
| Token | \`${args.address}\` |
| Message | ${args.message} |

## Next Steps
- Read thread: \`get_comments({ address: "${args.address}" })\`
- View token page: https://agent-launch.ai/trade/${args.address}`;

  return { ...result, _markdown };
}

// ---------------------------------------------------------------------------
// Handler map — consumed by index.ts dispatch
// ---------------------------------------------------------------------------

export const commentHandlers = {
  get_comments: getComments,
  post_comment: postComment,
};
