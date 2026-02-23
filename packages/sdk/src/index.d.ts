/**
 * @agent-launch/sdk
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
 * import { tokenize, generateDeployLink } from '@agent-launch/sdk';
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
export { AgentLaunchClient } from './client.js';
export type { AgentLaunchConfig, TokenizeParams, TokenizeResponse, Token, TokenListParams, TokenListResponse, Holder, HolderListResponse, SingleHolderResponse, TradeAction, TradeLinkOptions, AgentAuthResponse, AgentverseAgent, MyAgentsResponse, ImportAgentverseResponse, } from './types.js';
export { AgentLaunchError } from './types.js';
export { tokenize, getToken, listTokens } from './tokens.js';
export { getTokenPrice, getTokenHolders, generateTradeLink as generateTradeLinkWithAction, generateTradeLinkFromOptions, } from './market.js';
export { generateDeployLink, generateTradeLink, generateBuyLink, generateSellLink, } from './handoff.js';
export { authenticate, getMyAgents, importFromAgentverse } from './agents.js';
//# sourceMappingURL=index.d.ts.map