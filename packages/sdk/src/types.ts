/**
 * agentlaunch-sdk — TypeScript types
 *
 * SDK-006: Canonical types for all AgentLaunch API operations.
 */

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Configuration passed to AgentLaunchClient on construction. */
export interface AgentLaunchConfig {
  /** Agentverse API key used as X-API-Key header on authenticated requests. */
  apiKey?: string;
  /**
   * Base URL for the AgentLaunch platform.
   * @default Resolved from AGENT_LAUNCH_ENV (production URLs by default)
   */
  baseUrl?: string;
  /**
   * Maximum number of retry attempts on HTTP 429 (rate limit) responses.
   * Retries use exponential backoff: 1s, 2s, 4s, …
   * @default 3
   */
  maxRetries?: number;
}

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

/** Typed error thrown by every SDK method on a non-2xx response. */
export class AgentLaunchError extends Error {
  /** HTTP status code returned by the server (0 if network-level failure). */
  readonly status: number;
  /** Original server message when available. */
  readonly serverMessage: string | undefined;

  constructor(message: string, status: number, serverMessage?: string) {
    super(message);
    this.name = 'AgentLaunchError';
    this.status = status;
    this.serverMessage = serverMessage;
    // Restore prototype chain when targeting older runtimes
    Object.setPrototypeOf(this, AgentLaunchError.prototype);
  }
}

// ---------------------------------------------------------------------------
// Token types
// ---------------------------------------------------------------------------

/** Parameters for POST /agents/tokenize */
export interface TokenizeParams {
  /**
   * Agentverse agent address (agent1q…) or Ethereum address (0x…).
   * Required — this is the agent being tokenized.
   */
  agentAddress: string;
  /**
   * Token name (max 32 characters).
   * When omitted the platform fetches the name from Agentverse metadata.
   */
  name?: string;
  /**
   * Token ticker symbol (max 11 characters, auto-uppercased).
   * When omitted the platform derives it from the first 4 characters of name.
   */
  symbol?: string;
  /**
   * Token description (max 500 characters).
   * When omitted an auto-generated description is used.
   */
  description?: string;
  /**
   * Token image: a public URL, a base64 data URI (data:image/…), or "auto"
   * to request an auto-generated placeholder.
   */
  image?: string;
  /**
   * Agentverse-hosted avatar URL (https://agentverse.ai/…).
   * Used when image is "auto" — preferred over the generated placeholder.
   */
  agentverse_avatar_url?: string;
  /**
   * Chain ID for deployment.
   * Supported values: 56 (BSC Mainnet), 97 (BSC Testnet), 1 (ETH Mainnet), 11155111 (Sepolia).
   * @default 11155111
   */
  chainId?: number;
  /**
   * Max wallet limit: 0=unlimited (default), 1=0.5% (5M tokens), 2=1% (10M tokens).
   * Controls the maximum number of tokens a single wallet may hold.
   */
  maxWalletAmount?: 0 | 1 | 2;
  /**
   * FET amount to buy immediately after deploy (in FET, not wei). Max 1000.
   * When set, the platform triggers an initial buy transaction on behalf of the
   * deploying wallet immediately after the token goes live.
   */
  initialBuyAmount?: string;
  /**
   * Category ID for the token. Fetch available categories from /tokens/categories.
   */
  category?: number;
}

/** Data returned by POST /agents/tokenize */
export interface TokenizeResponse {
  /** Database ID of the pending token record. Used to build handoff links. */
  token_id: number;
  /** Pre-built URL the human must open to complete on-chain deployment. */
  handoff_link: string;
  name: string;
  symbol: string;
  description: string;
  /** Resolved token image URL. */
  image: string;
  /** "pending_deployment" until on-chain deploy is complete; "deployed" after. */
  status: 'pending_deployment' | 'deployed';
}

/** A token as returned in list and detail responses. */
export interface Token {
  id: number;
  name: string;
  symbol: string;
  /** Contract address — null while the token is pending deployment. */
  address: string | null;
  description: string;
  logo: string;
  /** Deployment status. */
  status: 'pending' | 'bonding' | 'listed';
  /** Current price in FET (string to preserve precision). */
  price: string;
  /** Market cap in FET (string). */
  market_cap: string;
  /** Bonding-curve progress toward 30,000 FET graduation (0–100). */
  progress: number;
  chainId: number;
  creator?: string;
  agentId?: string | null;
  listed: boolean;
  created_at: string;
}

/** Query parameters for GET /agents/tokens */
export interface TokenListParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: number;
  chainId?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

/** Response from GET /agents/tokens */
export interface TokenListResponse {
  tokens: Token[];
  /** Total count matching the query (before pagination). */
  total?: number;
  mainToken?: Token | null;
}

// ---------------------------------------------------------------------------
// Holder types
// ---------------------------------------------------------------------------

/** A single token holder entry. */
export interface Holder {
  address: string;
  balance: string;
  /** Percentage of total supply held (0–100). */
  percentage?: number;
}

/** Response from GET /agents/token/:address/holders */
export interface HolderListResponse {
  holders: Holder[];
  total: number;
}

/** Response when a single holder address is queried. */
export interface SingleHolderResponse {
  holder: Holder;
}

// ---------------------------------------------------------------------------
// Comment types
// ---------------------------------------------------------------------------

/** A single comment attached to a token. */
export interface Comment {
  id: number;
  message: string;
  userId: number;
  tokenId: number;
  created_at: string;
  updated_at: string;
  /** Author details — present when the server expands the user relation. */
  user?: {
    id: number;
    username?: string;
    address?: string;
    avatar?: string;
  };
}

/** Parameters for POST /comments/:tokenAddress */
export interface PostCommentParams {
  /** Contract address of the token to comment on. */
  tokenAddress: string;
  /** Comment text body. */
  message: string;
}

/** Response from POST /comments/:tokenAddress */
export interface PostCommentResponse {
  id: number;
  message: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Market calculation types
// ---------------------------------------------------------------------------

/** Response from GET /tokens/calculate-buy */
export interface CalculateBuyResponse {
  /** Number of tokens the buyer will receive (string to preserve precision). */
  tokensReceived: string;
  /** Effective price per token in FET (string). */
  pricePerToken: string;
  /** Price impact as a percentage (0–100). */
  priceImpact: number;
  /** Protocol fee deducted in FET (2% of spend, 100% to treasury). */
  fee: string;
  /** Net FET amount spent after fee deduction (string). */
  netFetSpent: string;
}

/** Response from GET /tokens/calculate-sell */
export interface CalculateSellResponse {
  /** Amount of FET the seller will receive (string to preserve precision). */
  fetReceived: string;
  /** Effective price per token in FET (string). */
  pricePerToken: string;
  /** Price impact as a percentage (0–100). */
  priceImpact: number;
  /** Protocol fee deducted in FET (2% of proceeds, 100% to treasury). */
  fee: string;
  /** Net FET received after fee deduction (string). */
  netFetReceived: string;
}

/** Aggregated platform-level statistics. */
export interface PlatformStats {
  /** Total number of token records in the database. */
  totalTokens: number;
  /** Number of tokens that have graduated to a DEX listing. */
  totalListed: number;
  /** Number of tokens still trading on the bonding curve. */
  totalBonding: number;
}

// ---------------------------------------------------------------------------
// Market types
// ---------------------------------------------------------------------------

/** 'buy' or 'sell' — used in trade link generation. */
export type TradeAction = 'buy' | 'sell';

/** Options for trade link generation. */
export interface TradeLinkOptions {
  action?: TradeAction;
  /** Pre-fill amount (FET for buys, token units for sells). */
  amount?: number | string;
}

// ---------------------------------------------------------------------------
// Agent auth / import types
// ---------------------------------------------------------------------------

/** Response from POST /agents/auth */
export interface AgentAuthResponse {
  success: true;
  data: {
    token: string;
    expires_in: number;
  };
}

/** A single Agentverse agent entry returned by GET /agents/my-agents */
export interface AgentverseAgent {
  address: string;
  name: string;
  [key: string]: unknown;
}

/** Response from GET /agents/my-agents */
export interface MyAgentsResponse {
  success: true;
  data: {
    agents: AgentverseAgent[];
    count: number;
  };
}

/** Response from POST /agents/import-agentverse */
export interface ImportAgentverseResponse {
  agents: AgentverseAgent[];
  count: number;
}

// ---------------------------------------------------------------------------
// Agentverse deployment types
// ---------------------------------------------------------------------------

/** Options for deploying an agent to Agentverse hosting. */
export interface AgentverseDeployOptions {
  /** Agentverse API key. Falls back to env vars if omitted. */
  apiKey?: string;
  /** Display name for the agent on Agentverse (max 64 chars). */
  agentName: string;
  /** Python source code to upload. */
  sourceCode: string;
  /** Additional secrets to set on the agent. AGENTVERSE_API_KEY and AGENTLAUNCH_API_KEY are set automatically. */
  secrets?: Record<string, string>;
  /** Max number of poll attempts for compilation (default: 12, each 5s apart = 60s). */
  maxPolls?: number;
}

/** Result from a successful Agentverse deployment. */
export interface AgentverseDeployResult {
  /** The agent's Agentverse address (agent1q...). */
  agentAddress: string;
  /** The agent's Fetch wallet address (if available after compilation). */
  walletAddress?: string;
  /** Final status: 'starting', 'compiled', or 'running'. */
  status: 'starting' | 'compiled' | 'running';
  /** Code digest from upload (if returned). */
  digest?: string;
  /** Any errors from setting secrets (non-fatal). */
  secretErrors?: string[];
}

/** Response from POST /hosting/agents on Agentverse. */
export interface AgentverseCreateResponse {
  address: string;
  name: string;
  running?: boolean;
  compiled?: boolean;
  wallet_address?: string;
}

/** Response from GET /hosting/agents/:address on Agentverse. */
export interface AgentverseStatusResponse {
  address: string;
  name: string;
  running: boolean;
  compiled: boolean;
  wallet_address?: string;
  code_digest?: string;
  revision?: number;
}
