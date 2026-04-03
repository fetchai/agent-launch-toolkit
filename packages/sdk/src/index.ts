/**
 * agentlaunch-sdk
 *
 * TypeScript SDK for the AgentLaunch platform (agent-launch.ai).
 *
 * Enables AI agents and developers to:
 *   - Create token records and receive human handoff links
 *   - Query token prices, market data, and holder information
 *   - Generate pre-filled deploy and trade URLs for human users
 *   - Authenticate with Agentverse API keys
 *   - List and import Agentverse agents
 *
 * Quick start:
 * ```ts
 * import { tokenize, generateDeployLink } from 'agentlaunch-sdk';
 *
 * const { data } = await tokenize({
 *   agentAddress: 'agent1qf8xfhsc8hg4g5l0nhtj...',
 *   name: 'My Agent Token',
 *   chainId: 97,
 * });
 *
 * const link = generateDeployLink(data.token_id);
 * // Share this link with a human → they connect wallet → token is live
 * ```
 *
 * Authentication:
 *   Set AGENTVERSE_API_KEY in your environment, or pass `apiKey` directly
 *   to AgentLaunchClient.
 *
 * Platform fee:
 *   A 2% fee applies to every buy and sell transaction.
 *   This fee goes 100% to the protocol treasury (REVENUE_ACCOUNT).
 *   There is no creator fee.
 */

// Fluent wrapper class
export { AgentLaunch } from './agentlaunch.js';
export type {
  TokensNamespace,
  MarketNamespace,
  HandoffNamespace,
  AgentsNamespace,
  AuthNamespace,
  StorageNamespace,
  CommerceNamespace,
  OnchainNamespace,
  PaymentsNamespace,
  TradingNamespace,
  TokenizeResult,
} from './agentlaunch.js';

// Core HTTP client
export { AgentLaunchClient } from './client.js';

// SDK-006: Types and errors
export type {
  AgentLaunchConfig,
  TokenizeParams,
  TokenizeResponse,
  Token,
  TokenListParams,
  TokenListResponse,
  Holder,
  HolderListResponse,
  SingleHolderResponse,
  TradeAction,
  TradeLinkOptions,
  AgentAuthResponse,
  AgentverseAgent,
  MyAgentsResponse,
  ImportAgentverseResponse,
  // CF-038: Comment types
  Comment,
  PostCommentParams,
  PostCommentResponse,
  // CF-041/CF-042/CF-043: Market calculation types
  CalculateBuyResponse,
  CalculateSellResponse,
  PlatformStats,
  // Agentverse deployment types
  AgentverseDeployOptions,
  AgentverseDeployResult,
  AgentverseCreateResponse,
  AgentverseStatusResponse,
  // Agent optimization types
  AgentMetadata,
  AgentverseUpdateOptions,
  AgentverseUpdateResult,
  OptimizationCheckItem,
  // SDK-002: Error code type
  AgentLaunchErrorCode,
  // Multi-token payment types
  PaymentToken,
  TokenAmount,
  PaymentRequest,
  PaymentResult,
  Invoice,
  InvoiceStatus,
  SpendingLimit,
  CreateSpendingLimitParams,
  FiatOnrampParams,
  FiatOnrampLink,
  // Custodial trading types
  ExecuteBuyParams,
  ExecuteSellParams,
  CustodialBuyResult,
  CustodialSellResult,
  WalletInfoResponse,
  // Wallet authentication types
  WalletAuthConfig,
  WalletAuthResult,
} from './types.js';
export { AgentLaunchError } from './types.js';

// SDK-002: Token operations
export { tokenize, getToken, listTokens } from './tokens.js';

// SDK-003: Market operations
export {
  getTokenPrice,
  getTokenHolders,
  generateTradeLink as generateTradeLinkWithAction,
  generateTradeLinkFromOptions,
  // CF-041/CF-042/CF-043
  calculateBuy,
  calculateSell,
  getPlatformStats,
} from './market.js';

// CF-039: Comment operations
export { getComments, postComment } from './comments.js';

// SDK-004: Handoff link generation
export {
  generateDeployLink,
  generateTradeLink,
  generateBuyLink,
  generateSellLink,
  generateDelegationLink,
  generateFiatOnrampLink,
  validateEthAddress,
  FIAT_PROVIDER_CONFIGS,
} from './handoff.js';

// SDK-005: Agent operations
export { authenticate, getMyAgents, importFromAgentverse } from './agents.js';

// Wallet authentication (requires @cosmjs/crypto and bech32 as optional peer dependencies)
export { authenticateWithWallet, deriveCosmosAddress, generateWalletAndAuthenticate } from './wallet-auth.js';
export type { GenerateWalletResult } from './wallet-auth.js';

// Agentverse deployment
export {
  createAgent,
  uploadCode,
  setSecret,
  startAgent,
  stopAgent,
  getAgentStatus,
  getAgentLogs,
  deployAgent,
  updateAgent,
  buildOptimizationChecklist,
} from './agentverse.js';

// EXT-01: Agentverse storage operations
export { listStorage, getStorage, putStorage, deleteStorage } from './storage.js';
export type { StorageEntry, StorageListResponse } from './storage.js';

// EXT-02: Commerce data operations
export { getAgentRevenue, getPricingTable, getAgentCommerceStatus, getNetworkGDP } from './commerce.js';
export type { AgentRevenue, PricingEntry, AgentCommerceStatus, NetworkGDP } from './commerce.js';

// On-chain trading operations (requires ethers as optional peer dependency)
export { buyTokens, sellTokens, getWalletBalances, getERC20Balance, approveERC20, getAllowance, transferFromERC20 } from './onchain.js';
export type {
  OnchainConfig,
  BuyResult,
  SellResult,
  WalletBalances,
  ChainConfig,
} from './onchain.js';
export {
  DEFAULT_SLIPPAGE_PERCENT,
  TOKEN_CONTRACT_ABI,
  ERC20_ABI,
  CHAIN_CONFIGS,
} from './onchain.js';

// Multi-token payments
export {
  KNOWN_TOKENS,
  getToken as getPaymentToken,
  getTokensForChain,
  getTokenBalance,
  getMultiTokenBalances,
  transferToken,
  createInvoice,
  getInvoice,
  listInvoices,
  updateInvoiceStatus,
} from './payments.js';

// Delegation
export {
  checkAllowance,
  spendFromDelegation,
  createSpendingLimitHandoff,
  listDelegations,
  recordDelegation,
} from './delegation.js';

// Custodial trading (server-side HD wallet, no private key required on client)
export { getWallet, executeBuy, executeSell } from './trading.js';

// EXT-03: Connect agent deployment and management
export { connectAgent, updateConnection, connectionStatus, connectionLogs } from './connect.js';
export type { ConnectConfig, ConnectionStatus, ConnectResult } from './connect.js';

// URL resolution
export { getApiUrl, getFrontendUrl, getEnvironment, resolveApiKey, resolveBaseUrl, DEV_API_URL, DEV_FRONTEND_URL, PROD_API_URL, PROD_FRONTEND_URL } from './urls.js';
