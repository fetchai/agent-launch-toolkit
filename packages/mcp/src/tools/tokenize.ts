import { AgentLaunchClient, getFrontendUrl, deployAgent, resolveApiKey } from 'agentlaunch-sdk';
import { generateFromTemplate } from 'agentlaunch-templates';

const client = new AgentLaunchClient();
const FRONTEND_BASE_URL = getFrontendUrl();

// ---------------------------------------------------------------------------
// Type mapping: MCP template types -> template names
// ---------------------------------------------------------------------------

const TYPE_TO_TEMPLATE: Record<string, string> = {
  faucet: 'custom',
  research: 'research',
  trading: 'trading-bot',
  data: 'data-analyzer',
};

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

export interface CreateAndTokenizeResult {
  success: true;
  agentCode: string;
  agentAddress: string | null;
  tokenId: number;
  handoffLink: string;
  deployLink: string;
  maxWalletAmount?: number;
  initialBuyAmount?: string;
  category?: number;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Derive a ticker from the agent name — uppercase, letters only, max 8 chars. */
function deriveTicker(name: string): string {
  return name
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase()
    .slice(0, 8) || 'TOKEN';
}

// ---------------------------------------------------------------------------
// Tool implementation
// ---------------------------------------------------------------------------

/**
 * create_and_tokenize (MCP-004)
 *
 * Full end-to-end combo tool:
 *   1. Scaffold Agentverse agent code from agentlaunch-templates
 *   2. If AGENT_LAUNCH_API_KEY is present, deploy agent to Agentverse
 *   3. Call POST /tokenize to create the token record
 *   4. Return agentCode, agentAddress, tokenId, handoffLink, deployLink
 *
 * The human still needs to click the handoffLink to sign the on-chain
 * deployment transaction — this tool never touches private keys.
 *
 * Fee note: 2% trading fee goes 100% to protocol treasury — no creator fee.
 */
export async function createAndTokenize(args: {
  name: string;
  description: string;
  template?: string;
  ticker?: string;
  chainId?: number;
  maxWalletAmount?: number;
  initialBuyAmount?: string;
  category?: number;
}): Promise<CreateAndTokenizeResult> {
  if (!args.name || !args.name.trim()) {
    throw new Error('name is required');
  }
  if (!args.description || !args.description.trim()) {
    throw new Error('description is required');
  }

  const templateKey = args.template ?? 'research';
  const templateName = TYPE_TO_TEMPLATE[templateKey] ?? 'custom';
  const ticker = args.ticker ?? deriveTicker(args.name);
  const chainId = args.chainId ?? 97;

  // Step 1: Scaffold agent code from template
  const generated = generateFromTemplate(templateName, {
    agent_name: args.name,
    description: args.description,
  });
  const agentCode = generated.code;

  // Step 2: Optionally deploy to Agentverse if API key is available
  let agentAddress: string | null = null;
  const apiKey = resolveApiKey();

  if (apiKey) {
    try {
      const result = await deployAgent({
        apiKey,
        agentName: args.name,
        sourceCode: agentCode,
      });
      agentAddress = result.agentAddress;
    } catch (err) {
      // Deployment failure is non-fatal — we proceed without an agent address
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[create_and_tokenize] Agentverse deploy skipped: ${msg}`);
    }
  }

  // Step 3: Call POST /tokenize
  if (!apiKey) {
    throw new Error(
      'AGENT_LAUNCH_API_KEY environment variable is required for create_and_tokenize. ' +
        'Add it to the MCP server env config.',
    );
  }

  const payload: Record<string, unknown> = {
    name: args.name,
    symbol: ticker,
    description: args.description,
    chainId,
  };

  if (agentAddress) {
    payload['agentAddress'] = agentAddress;
  }
  if (args.maxWalletAmount !== undefined) {
    payload['maxWalletAmount'] = args.maxWalletAmount;
  }
  if (args.initialBuyAmount !== undefined) {
    payload['initialBuyAmount'] = args.initialBuyAmount;
  }
  if (args.category !== undefined) {
    payload['category'] = { id: args.category };
  }

  interface TokenizeApiResponse {
    tokenId?: number;
    token_id?: number;
    id?: number;
    handoffLink?: string;
    handoff_link?: string;
    address?: string;
    data?: {
      tokenId?: number;
      token_id?: number;
      handoffLink?: string;
      handoff_link?: string;
      address?: string;
    };
  }

  const raw = await client.post<TokenizeApiResponse>('/agents/tokenize', payload);
  const nested = raw.data ?? raw;

  const tokenId =
    nested.tokenId ??
    nested.token_id ??
    raw.tokenId ??
    raw.token_id;

  if (tokenId === undefined || tokenId === null) {
    throw new Error(
      `Unexpected response from /tokenize — no tokenId found: ${JSON.stringify(raw)}`,
    );
  }

  const handoffLink =
    nested.handoffLink ??
    nested.handoff_link ??
    `${FRONTEND_BASE_URL}/deploy/${tokenId}`;

  const tokenAddress = nested.address;
  const tradeTarget = tokenAddress ?? String(tokenId);
  const deployLink = `${FRONTEND_BASE_URL}/trade/${tradeTarget}?action=buy&amount=100`;

  return {
    success: true,
    agentCode,
    agentAddress,
    tokenId,
    handoffLink,
    deployLink,
    ...(args.maxWalletAmount !== undefined && { maxWalletAmount: args.maxWalletAmount }),
    ...(args.initialBuyAmount !== undefined && { initialBuyAmount: args.initialBuyAmount }),
    ...(args.category !== undefined && { category: args.category }),
  };
}

// ---------------------------------------------------------------------------
// Handler map — consumed by index.ts dispatch
// ---------------------------------------------------------------------------

export const tokenizeHandlers = {
  create_and_tokenize: createAndTokenize,
};
