/**
 * agentlaunch-sdk — AgentLaunch fluent wrapper class
 *
 * SDK-006: Provides a namespaced, ergonomic API wrapping all SDK modules.
 *
 * @example
 * ```ts
 * import { AgentLaunch } from 'agentlaunch-sdk';
 *
 * const al = new AgentLaunch({ apiKey: process.env.AGENTVERSE_API_KEY });
 *
 * const { data } = await al.tokens.tokenize({
 *   agentAddress: 'agent1qf8xfhsc8hg4g5l0nhtj...',
 *   chainId: 97,
 * });
 *
 * const link = al.handoff.generateDeployLink(data.token_id);
 * ```
 */

import { AgentLaunchClient } from './client.js';
import { tokenize, getToken, listTokens } from './tokens.js';
import { getTokenPrice, getTokenHolders } from './market.js';
import {
  generateDeployLink,
  generateTradeLink,
  generateBuyLink,
  generateSellLink,
} from './handoff.js';
import { authenticate, getMyAgents, importFromAgentverse } from './agents.js';
import type {
  AgentLaunchConfig,
  TokenizeParams,
  TokenListParams,
  TokenizeResponse,
  Token,
  TokenListResponse,
  HolderListResponse,
  SingleHolderResponse,
  TradeLinkOptions,
  AgentAuthResponse,
  MyAgentsResponse,
  ImportAgentverseResponse,
} from './types.js';

// ---------------------------------------------------------------------------
// Namespace interfaces
// ---------------------------------------------------------------------------

/** Token-related operations. */
export interface TokensNamespace {
  /**
   * Create a pending token record.
   * @see tokenize
   */
  tokenize(
    params: TokenizeParams,
  ): Promise<{ success: true; data: TokenizeResponse }>;

  /**
   * Fetch a deployed token by contract address.
   * @see getToken
   */
  getToken(address: string): Promise<Token>;

  /**
   * List tokens with optional filtering and pagination.
   * @see listTokens
   */
  listTokens(params?: TokenListParams): Promise<TokenListResponse>;
}

/** Market data operations. */
export interface MarketNamespace {
  /**
   * Get the current bonding-curve price in FET.
   * @see getTokenPrice
   */
  getTokenPrice(address: string): Promise<string>;

  /**
   * Get the holder list, or look up a specific wallet.
   * @see getTokenHolders
   */
  getTokenHolders(
    address: string,
    holderAddress?: string,
  ): Promise<HolderListResponse | SingleHolderResponse>;
}

/** Handoff link generation (synchronous). */
export interface HandoffNamespace {
  /**
   * Generate a deploy handoff link for a pending token.
   * @see generateDeployLink
   */
  generateDeployLink(tokenId: number, baseUrl?: string): string;

  /**
   * Generate a trade handoff link for a deployed token.
   * @see generateTradeLink
   */
  generateTradeLink(
    address: string,
    opts?: TradeLinkOptions,
    baseUrl?: string,
  ): string;

  /**
   * Generate a buy link with optional pre-filled FET amount.
   * @see generateBuyLink
   */
  generateBuyLink(
    address: string,
    amount?: number | string,
    baseUrl?: string,
  ): string;

  /**
   * Generate a sell link with optional pre-filled token amount.
   * @see generateSellLink
   */
  generateSellLink(
    address: string,
    amount?: number | string,
    baseUrl?: string,
  ): string;
}

/** Agent authentication and management. */
export interface AgentsNamespace {
  /**
   * Exchange an Agentverse API key for a platform JWT.
   * @see authenticate
   */
  authenticate(apiKey: string): Promise<AgentAuthResponse>;

  /**
   * List the Agentverse agents owned by the caller's API key.
   * @see getMyAgents
   */
  getMyAgents(): Promise<MyAgentsResponse>;

  /**
   * Import agents by Agentverse API key.
   * @see importFromAgentverse
   */
  importFromAgentverse(
    agentverseApiKey: string,
  ): Promise<ImportAgentverseResponse>;
}

// ---------------------------------------------------------------------------
// AgentLaunch class
// ---------------------------------------------------------------------------

/**
 * AgentLaunch
 *
 * Fluent, namespaced wrapper around the AgentLaunch SDK modules.  Instantiate
 * once and use the `tokens`, `market`, `handoff`, and `agents` namespaces to
 * access all platform operations.
 *
 * Authentication is shared across all namespaces via the underlying
 * `AgentLaunchClient` instance.
 *
 * @example
 * ```ts
 * import { AgentLaunch } from 'agentlaunch-sdk';
 *
 * const al = new AgentLaunch({ apiKey: 'av-xxxxxxxxxxxxxxxx' });
 *
 * // Create token
 * const { data } = await al.tokens.tokenize({ agentAddress: 'agent1q...' });
 *
 * // Generate links
 * const deployLink = al.handoff.generateDeployLink(data.token_id);
 * const buyLink    = al.handoff.generateBuyLink('0xAbCd...', 100);
 *
 * // Query market
 * const price   = await al.market.getTokenPrice('0xAbCd...');
 * const { holders } = await al.market.getTokenHolders('0xAbCd...');
 * ```
 */
export class AgentLaunch {
  /** The underlying HTTP client shared by all namespaces. */
  readonly client: AgentLaunchClient;

  /** Token CRUD and listing operations. */
  readonly tokens: TokensNamespace;

  /** Price, holder, and trade-link operations. */
  readonly market: MarketNamespace;

  /** Handoff URL generation (synchronous, no network calls). */
  readonly handoff: HandoffNamespace;

  /** Agent authentication and Agentverse management. */
  readonly agents: AgentsNamespace;

  constructor(config: AgentLaunchConfig = {}) {
    this.client = new AgentLaunchClient(config);

    // Capture client reference for closures
    const client = this.client;

    this.tokens = {
      tokenize: (params: TokenizeParams) => tokenize(params, client),
      getToken: (address: string) => getToken(address, client),
      listTokens: (params?: TokenListParams) => listTokens(params ?? {}, client),
    };

    this.market = {
      getTokenPrice: (address: string) => getTokenPrice(address, client),
      getTokenHolders: (address: string, holderAddress?: string) =>
        getTokenHolders(address, holderAddress, client),
    };

    // Handoff methods use the client's baseUrl for URL generation
    const baseUrl = this.client.baseUrl;
    this.handoff = {
      generateDeployLink: (tokenId: number, overrideBaseUrl?: string) =>
        generateDeployLink(tokenId, overrideBaseUrl ?? baseUrl),
      generateTradeLink: (
        address: string,
        opts?: TradeLinkOptions,
        overrideBaseUrl?: string,
      ) => generateTradeLink(address, opts, overrideBaseUrl ?? baseUrl),
      generateBuyLink: (
        address: string,
        amount?: number | string,
        overrideBaseUrl?: string,
      ) => generateBuyLink(address, amount, overrideBaseUrl ?? baseUrl),
      generateSellLink: (
        address: string,
        amount?: number | string,
        overrideBaseUrl?: string,
      ) => generateSellLink(address, amount, overrideBaseUrl ?? baseUrl),
    };

    this.agents = {
      authenticate: (apiKey: string) => authenticate(apiKey, client),
      getMyAgents: () => getMyAgents(client),
      importFromAgentverse: (agentverseApiKey: string) =>
        importFromAgentverse(agentverseApiKey, client),
    };
  }
}
