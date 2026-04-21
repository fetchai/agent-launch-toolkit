/**
 * MCP Tools — Wallet Authentication
 *
 * W-14, W-15: Tools for authenticating with Agentverse using a wallet private key.
 */

import { authenticateWithWallet, generateWalletAndAuthenticate, AgentLaunchClient } from '@fetchai/agent-launch-sdk';
import type { WalletAuthResult, GenerateWalletResult, MyAgentsResponse } from '@fetchai/agent-launch-sdk';

// ---------------------------------------------------------------------------
// Return types
// ---------------------------------------------------------------------------

export interface WalletAuthToolResult {
  success: true;
  apiKey: string;
  expiresAt: number;
  expiresIn: string;
  cosmosAddress: string;
  _markdown?: string;
}

export interface CheckAuthResult {
  success: boolean;
  valid: boolean;
  agentCount?: number;
  error?: string;
  _markdown?: string;
}

// ---------------------------------------------------------------------------
// wallet_auth (W-14)
// ---------------------------------------------------------------------------

/**
 * Get an Agentverse API key using a wallet private key.
 *
 * This implements the Fetch.ai wallet authentication flow:
 * 1. Derive Cosmos address from private key
 * 2. Request challenge from accounts.fetch.ai
 * 3. Sign challenge in ADR-036 format
 * 4. Exchange signed challenge for API key
 *
 * Security: The private key is used only for signing and is never logged.
 */
export async function walletAuth(args: {
  private_key: string;
  expires_in?: number;
}): Promise<WalletAuthToolResult> {
  if (!args.private_key) {
    throw new Error('private_key is required');
  }

  const result: WalletAuthResult = await authenticateWithWallet({
    privateKey: args.private_key,
    expiresIn: args.expires_in,
  });

  const expiresDate = new Date(result.expiresAt);
  const nowMs = Date.now();
  const remainingMs = result.expiresAt - nowMs;
  const remainingDays = Math.floor(remainingMs / (1000 * 60 * 60 * 24));

  const _markdown = `# Wallet Authentication Successful

| Field | Value |
|-------|-------|
| API Key | \`${result.apiKey.slice(0, 8)}...${result.apiKey.slice(-4)}\` |
| Cosmos Address | \`${result.cosmosAddress}\` |
| Expires | ${expiresDate.toISOString()} (~${remainingDays} days) |

## Next Steps

1. Save the API key to your \`.env\` file:
   \`\`\`
   AGENTVERSE_API_KEY=${result.apiKey}
   \`\`\`

2. Use \`list_tokens\` or \`deploy_to_agentverse\` to start building

The full API key is returned in the response data.`;

  return {
    success: true,
    apiKey: result.apiKey,
    expiresAt: result.expiresAt,
    expiresIn: `${remainingDays} days`,
    cosmosAddress: result.cosmosAddress,
    _markdown,
  };
}

// ---------------------------------------------------------------------------
// check_auth (W-15)
// ---------------------------------------------------------------------------

/**
 * Check if the current Agentverse API key (from AGENTVERSE_API_KEY or
 * AGENT_LAUNCH_API_KEY env var) is valid.
 *
 * Validates by calling the /agents/my-agents endpoint and checking for
 * a successful response.
 */
export async function checkAuth(): Promise<CheckAuthResult> {
  const apiKey = process.env.AGENTVERSE_API_KEY || process.env.AGENT_LAUNCH_API_KEY;

  if (!apiKey) {
    const _markdown = `# Authentication Check

**Status:** No API key configured

Set \`AGENTVERSE_API_KEY\` or \`AGENT_LAUNCH_API_KEY\` in your environment, or use \`wallet_auth\` to authenticate with a wallet.`;

    return {
      success: true,
      valid: false,
      error: 'No API key found in AGENTVERSE_API_KEY or AGENT_LAUNCH_API_KEY',
      _markdown,
    };
  }

  try {
    const client = new AgentLaunchClient({ apiKey });
    const response: MyAgentsResponse = await client.get('/agents/my-agents');
    const agentCount = response.data?.agents?.length ?? 0;

    const _markdown = `# Authentication Check

**Status:** Valid

| Field | Value |
|-------|-------|
| API Key | \`${apiKey.slice(0, 8)}...${apiKey.slice(-4)}\` |
| Agents Accessible | ${agentCount} |

Your API key is working. You can use all AgentLaunch tools.`;

    return {
      success: true,
      valid: true,
      agentCount,
      _markdown,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    const _markdown = `# Authentication Check

**Status:** Invalid or Expired

| Field | Value |
|-------|-------|
| API Key | \`${apiKey.slice(0, 8)}...${apiKey.slice(-4)}\` |
| Error | ${message} |

## Fix Options

1. **Regenerate key:** Visit [agentverse.ai/profile/api-keys](https://agentverse.ai/profile/api-keys)
2. **Wallet auth:** Use \`wallet_auth\` with your wallet private key`;

    return {
      success: true,
      valid: false,
      error: message,
      _markdown,
    };
  }
}

// ---------------------------------------------------------------------------
// generate_wallet
// ---------------------------------------------------------------------------

export interface GenerateWalletToolResult {
  success: true;
  privateKey: string;
  evmAddress: string;
  cosmosAddress: string;
  apiKey: string;
  expiresAt: number;
  expiresIn: string;
  _markdown?: string;
}

/**
 * Generate a new wallet and authenticate in one step.
 *
 * This is the zero-to-hero tool: creates a wallet from scratch and returns
 * everything needed to start building agents. No existing keys required.
 */
export async function generateWallet(args: {
  expires_in?: number;
}): Promise<GenerateWalletToolResult> {
  const result: GenerateWalletResult = await generateWalletAndAuthenticate(args.expires_in);

  const expiresDate = new Date(result.expiresAt);
  const nowMs = Date.now();
  const remainingMs = result.expiresAt - nowMs;
  const remainingDays = Math.floor(remainingMs / (1000 * 60 * 60 * 24));

  const _markdown = `# New Wallet Created & Authenticated

| Field | Value |
|-------|-------|
| EVM Address | \`${result.evmAddress}\` |
| Cosmos Address | \`${result.cosmosAddress}\` |
| API Key | \`${result.apiKey.slice(0, 8)}...${result.apiKey.slice(-4)}\` |
| Expires | ${expiresDate.toISOString()} (~${remainingDays} days) |

## Save to .env

\`\`\`
WALLET_PRIVATE_KEY=${result.privateKey}
AGENTVERSE_API_KEY=${result.apiKey}
\`\`\`

## Next Steps

1. Save the keys above to \`.env\`
2. Run \`npx agentlaunch my-first-agent\` to create and deploy an agent

## Important — Back Up Your .env

Your \`.env\` file contains your wallet private key. This wallet can hold real funds.

- **Back it up** somewhere safe (password manager, secure drive)
- **Never commit** \`.env\` to git (add to \`.gitignore\`)
- **Never share** your \`.env\` file with anyone

The full keys are in the response data.`;

  return {
    success: true,
    privateKey: result.privateKey,
    evmAddress: result.evmAddress,
    cosmosAddress: result.cosmosAddress,
    apiKey: result.apiKey,
    expiresAt: result.expiresAt,
    expiresIn: `${remainingDays} days`,
    _markdown,
  };
}

// ---------------------------------------------------------------------------
// Handler map for registration
// ---------------------------------------------------------------------------

export const authHandlers = {
  wallet_auth: walletAuth,
  check_auth: checkAuth,
  generate_wallet: generateWallet,
};
