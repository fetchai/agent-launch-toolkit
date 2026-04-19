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

/** Error codes for semantic error handling */
export type AgentLaunchErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_ERROR'
  | 'NETWORK_ERROR';

/** Map HTTP status to error code */
function statusToCode(status: number): AgentLaunchErrorCode {
  switch (status) {
    case 401: return 'UNAUTHORIZED';
    case 403: return 'FORBIDDEN';
    case 404: return 'NOT_FOUND';
    case 429: return 'RATE_LIMITED';
    case 422: return 'VALIDATION_ERROR';
    case 0: return 'NETWORK_ERROR';
    default: return status >= 500 ? 'INTERNAL_ERROR' : 'VALIDATION_ERROR';
  }
}

/** Typed error thrown by every SDK method on a non-2xx response. */
export class AgentLaunchError extends Error {
  /** HTTP status code returned by the server (0 if network-level failure). */
  readonly status: number;
  /** Original server message when available. */
  readonly serverMessage: string | undefined;
  /** Semantic error code for switch-based handling. */
  readonly code: AgentLaunchErrorCode;
  /** Additional error details when available. */
  readonly details?: Record<string, unknown>;
  /** Retry delay in ms for rate-limited requests (from Retry-After header). */
  readonly retryAfterMs?: number;

  constructor(
    message: string,
    status: number,
    serverMessage?: string,
    details?: Record<string, unknown>,
    retryAfterMs?: number
  ) {
    super(message);
    this.name = 'AgentLaunchError';
    this.status = status;
    this.serverMessage = serverMessage;
    this.code = statusToCode(status);
    this.details = details;
    this.retryAfterMs = retryAfterMs;
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

/** Aggregated platform-level statistics from GET /platform/stats. */
export interface PlatformStats {
  /** Total number of tokens on the platform. */
  totalTokens: number;
  /** Total trading volume in FET. */
  totalVolume: string;
  /** 24-hour trading volume in FET. */
  volume24h: string;
  /** Number of tokens listed on DEX. */
  tokensListed: number;
  /** Number of active users. */
  activeUsers: number;
  /** Trending tokens (top performers). */
  trending: Token[];
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

/** Metadata fields for Agentverse agent optimization (README, description, avatar). */
export interface AgentMetadata {
  /** Markdown README content uploaded to the agent profile. */
  readme?: string;
  /** Short description shown in Agentverse directory (max 200 chars). */
  short_description?: string;
  /** Public URL for the agent's avatar image. */
  avatar_url?: string;
}

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
  /** Optional metadata to set on the agent (README, description, avatar). */
  metadata?: AgentMetadata;
}

/** A single item in the agent optimization checklist. */
export interface OptimizationCheckItem {
  /** The ranking factor name. */
  factor: string;
  /** Whether this factor is addressed. */
  done: boolean;
  /** True if the factor requires manual action in the Agentverse UI. */
  manual_required?: boolean;
  /** Instruction or URL for manual steps. */
  hint?: string;
}

/** Result from a successful Agentverse deployment. */
export interface AgentverseDeployResult {
  /** The agent's Agentverse address (agent1q...). */
  agentAddress: string;
  /** The agent's Fetch wallet address (if available after compilation). */
  walletAddress?: string;
  /** Final status: 'starting', 'compiled', 'running', or 'error'. */
  status: 'starting' | 'compiled' | 'running' | 'error';
  /** Code digest from upload (if returned). */
  digest?: string;
  /** Any errors from setting secrets (non-fatal). */
  secretErrors?: string[];
  /** Post-deploy optimization checklist (7 ranking factors). */
  optimization?: OptimizationCheckItem[];
  /** Agent logs (populated on error or when compilation fails). */
  logs?: string;
  /** Compilation error message extracted from logs (if any). */
  compilationError?: string;
}

/** Options for updating an already-deployed agent's metadata on Agentverse. */
export interface AgentverseUpdateOptions {
  /** Agentverse API key. Falls back to env vars if omitted. */
  apiKey?: string;
  /** Agent address (agent1q...). */
  agentAddress: string;
  /** Metadata fields to update. */
  metadata: AgentMetadata;
}

/** Result from updating agent metadata. */
export interface AgentverseUpdateResult {
  /** Whether the update succeeded. */
  success: boolean;
  /** Which fields were updated. */
  updatedFields: string[];
  /** Post-update optimization checklist. */
  optimization: OptimizationCheckItem[];
}

/** Response from POST /hosting/agents on Agentverse. */
export interface AgentverseCreateResponse {
  address: string;
  name: string;
  running?: boolean;
  compiled?: boolean;
  wallet_address?: string;
  readme?: string;
  short_description?: string;
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

// ---------------------------------------------------------------------------
// Custodial trading types (server-side HD wallet, POST /agents/buy|sell)
// ---------------------------------------------------------------------------

/** Parameters for POST /agents/buy (custodial buy via server HD wallet). */
export interface ExecuteBuyParams {
  /** Token contract address to buy. */
  tokenAddress: string;
  /** FET amount to spend (whole units, not wei). */
  fetAmount: string;
  /** Slippage tolerance as a percentage (0.1–50). Default: 5. */
  slippagePercent?: number;
  /** Agent address to trade from (agent1q...). Omit to use the user's own wallet. */
  agentAddress?: string;
}

/** Parameters for POST /agents/sell (custodial sell via server HD wallet). */
export interface ExecuteSellParams {
  /** Token contract address to sell. */
  tokenAddress: string;
  /** Number of tokens to sell (whole units, not wei). */
  tokenAmount: string;
  /** Slippage tolerance as a percentage (0.1–50). Default: 5. */
  slippagePercent?: number;
  /** Agent address to trade from (agent1q...). Omit to use the user's own wallet. */
  agentAddress?: string;
}

/** Result from a successful custodial buy (POST /agents/buy). */
export interface CustodialBuyResult {
  /** On-chain transaction hash of the buy transaction. */
  txHash: string;
  /** On-chain transaction hash of the FET approval (null if allowance was sufficient). */
  approvalTxHash: string | null;
  /** Block number the buy was confirmed in. */
  blockNumber: number;
  /** FET amount spent (whole units). */
  fetSpent: string;
  /** Estimated token amount received (whole units). */
  expectedTokens: string;
  /** Minimum tokens accepted after slippage (whole units). */
  minTokens: string;
  /** Gas used by the buy transaction. */
  gasUsed: string;
  /** Custodial wallet address that executed the trade. */
  walletAddress: string;
}

/** Result from a successful custodial sell (POST /agents/sell). */
export interface CustodialSellResult {
  /** On-chain transaction hash of the sell transaction. */
  txHash: string;
  /** Block number the sell was confirmed in. */
  blockNumber: number;
  /** Number of tokens sold (whole units). */
  tokensSold: string;
  /** Gas used by the sell transaction. */
  gasUsed: string;
  /** Custodial wallet address that executed the trade. */
  walletAddress: string;
}

/** Response from GET /agents/wallet (custodial wallet info). */
export interface WalletInfoResponse {
  /** EVM wallet address (derived from user identity or agent address). */
  address: string;
  /** Native token balance (BNB on BSC, ETH on Ethereum) in whole units. */
  nativeBalance: string;
  /** FET token balance in whole units. */
  fetBalance: string;
  /** Chain ID this balance was queried on. */
  chainId: number;
  /** Whether this is a user wallet or an agent wallet. */
  type?: 'user' | 'agent';
  /** Agent address, if this is an agent wallet. */
  agentAddress?: string;
}

// ---------------------------------------------------------------------------
// Multi-token payment types
// ---------------------------------------------------------------------------

/** A known ERC-20 token on a specific chain. */
export interface PaymentToken {
  /** Human-readable symbol (e.g. "FET", "USDC"). */
  symbol: string;
  /** ERC-20 contract address. */
  contractAddress: string;
  /** Token decimals (usually 18 for FET, 18 for USDC on BSC). */
  decimals: number;
  /** Chain ID (56 = BSC Mainnet, 97 = BSC Testnet). */
  chainId: number;
  /** Whether this is a stablecoin (e.g. USDC, USDT). */
  isStablecoin: boolean;
}

/** An amount denominated in a specific token. */
export interface TokenAmount {
  /** Amount as a decimal string (e.g. "10.5"). */
  amount: string;
  /** The token this amount is denominated in. */
  token: PaymentToken;
}

/** A payment request issued by a service-providing agent. */
export interface PaymentRequest {
  /** Unique identifier for this payment request. */
  paymentId: string;
  /** Address of the agent requesting payment. */
  payee: string;
  /** Service being paid for. */
  service: string;
  /** Requested amount. */
  requested: TokenAmount;
  /** List of token symbols accepted as payment (e.g. ["FET", "USDC"]). */
  acceptedTokens: string[];
  /** ISO 8601 expiry timestamp. */
  expiresAt: string;
}

/** Result of a completed payment transaction. */
export interface PaymentResult {
  /** The payment request this fulfills. */
  paymentId: string;
  /** On-chain transaction hash. */
  txHash: string;
  /** Amount actually paid. */
  paid: TokenAmount;
  /** Block number the payment was confirmed in. */
  blockNumber: number;
  /** ISO 8601 confirmation timestamp. */
  confirmedAt: string;
}

/** Invoice status lifecycle. */
export type InvoiceStatus = 'pending' | 'paid' | 'expired' | 'refunded' | 'disputed';

/** An invoice stored in agent storage. */
export interface Invoice {
  /** Unique invoice ID. */
  id: string;
  /** Agent address of the issuer (seller). */
  issuer: string;
  /** Wallet or agent address of the payer (buyer). */
  payer: string;
  /** Service being invoiced. */
  service: string;
  /** Invoiced amount. */
  amount: TokenAmount;
  /** Current invoice status. */
  status: InvoiceStatus;
  /** ISO 8601 creation timestamp. */
  createdAt: string;
  /** ISO 8601 timestamp when status last changed. */
  updatedAt: string;
  /** Transaction hash when paid. */
  txHash?: string;
}

/** ERC-20 spending limit (delegation via approve/transferFrom). */
export interface SpendingLimit {
  /** Address of the token owner who granted the allowance. */
  owner: string;
  /** Address of the spender (agent) who can spend. */
  spender: string;
  /** Token being delegated. */
  token: PaymentToken;
  /** Maximum approved amount (decimal string). */
  maxAmount: string;
  /** Amount already spent (decimal string). */
  spent: string;
  /** Remaining allowance (decimal string). */
  remaining: string;
  /** ISO 8601 expiry (if tracked off-chain; on-chain allowance has no expiry). */
  expiresAt?: string;
}

/** Parameters for creating a spending limit (delegation). */
export interface CreateSpendingLimitParams {
  /** Token symbol (e.g. "FET", "USDC"). */
  tokenSymbol: string;
  /** Amount to approve (decimal string). */
  amount: string;
  /** Chain ID. */
  chainId?: number;
}

/** Parameters for generating a fiat onramp link. */
export interface FiatOnrampParams {
  /** Fiat amount to convert. */
  fiatAmount: string;
  /** Fiat currency code (e.g. "USD", "EUR"). */
  fiatCurrency: string;
  /** Target crypto token symbol (e.g. "FET", "USDC"). */
  cryptoToken: string;
  /** Wallet address to receive tokens. */
  walletAddress: string;
  /** URL to redirect after purchase. */
  returnUrl?: string;
  /** Onramp provider. */
  provider?: 'moonpay' | 'transak';
}

/** Generated fiat onramp link. */
export interface FiatOnrampLink {
  /** Provider used. */
  provider: 'moonpay' | 'transak';
  /** Full URL the user should open. */
  url: string;
  /** Estimated crypto amount the user will receive. */
  estimatedCrypto?: string;
  /** Estimated provider fee. */
  estimatedFee?: string;
}

// ---------------------------------------------------------------------------
// Wallet authentication types
// ---------------------------------------------------------------------------

/** Configuration for wallet authentication. */
export interface WalletAuthConfig {
  /** Hex-encoded private key (with or without 0x prefix). */
  privateKey: string;
  /** OAuth client ID. Defaults to 'agentverse'. */
  clientId?: string;
  /** OAuth scope. Defaults to 'av'. */
  scope?: string;
  /** Expiration time in seconds. Defaults to 30 days (2592000). */
  expiresIn?: number;
  /** Accounts API base URL. Defaults to 'https://accounts.fetch.ai/v1'. */
  accountsApiUrl?: string;
}

/** Result of successful wallet authentication. */
export interface WalletAuthResult {
  /** The Agentverse API key (av-...). */
  apiKey: string;
  /** Unix timestamp (ms) when the key expires. */
  expiresAt: number;
  /** Cosmos address derived from the private key (fetch1...). */
  cosmosAddress: string;
}
