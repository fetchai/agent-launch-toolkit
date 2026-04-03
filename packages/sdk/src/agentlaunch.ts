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
import { authenticateWithWallet, deriveCosmosAddress, generateWalletAndAuthenticate } from './wallet-auth.js';
import type { GenerateWalletResult } from './wallet-auth.js';
import { listStorage, getStorage, putStorage, deleteStorage } from './storage.js';
import {
  getAgentRevenue,
  getPricingTable,
  getAgentCommerceStatus,
  getNetworkGDP,
} from './commerce.js';
import { buyTokens, sellTokens, getWalletBalances } from './onchain.js';
import { getWallet, executeBuy, executeSell } from './trading.js';
import {
  KNOWN_TOKENS,
  getToken as getPaymentToken,
  getMultiTokenBalances,
  createInvoice,
  getInvoice,
  listInvoices,
  transferToken,
} from './payments.js';
import {
  checkAllowance,
  spendFromDelegation,
  createSpendingLimitHandoff,
} from './delegation.js';
import {
  generateDelegationLink,
  generateFiatOnrampLink,
} from './handoff.js';
import type { StorageEntry } from './storage.js';
import type {
  AgentRevenue,
  PricingEntry,
  AgentCommerceStatus,
  NetworkGDP,
} from './commerce.js';
import type {
  OnchainConfig,
  BuyResult,
  SellResult,
  WalletBalances,
} from './onchain.js';
import type {
  ExecuteBuyParams,
  ExecuteSellParams,
  CustodialBuyResult,
  CustodialSellResult,
  WalletInfoResponse,
} from './types.js';
import type {
  PaymentToken,
  Invoice,
  InvoiceStatus,
  SpendingLimit,
  FiatOnrampParams,
  FiatOnrampLink,
  CreateSpendingLimitParams,
} from './types.js';
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
  WalletAuthConfig,
  WalletAuthResult,
} from './types.js';

// ---------------------------------------------------------------------------
// Convenience response type
// ---------------------------------------------------------------------------

/** Flattened, camelCase response from the top-level `tokenize()` convenience method. */
export interface TokenizeResult {
  /** Database ID of the pending token record. */
  tokenId: number;
  /** Pre-built URL the human must open to complete on-chain deployment. */
  handoffLink: string;
  name: string;
  symbol: string;
  description: string;
  image: string;
  status: 'pending_deployment' | 'deployed';
}

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

/** Authentication operations. */
export interface AuthNamespace {
  /**
   * Authenticate using a wallet private key to obtain an Agentverse API key.
   *
   * Requires optional peer dependencies: @cosmjs/crypto and bech32.
   *
   * @param config Private key string or full configuration object
   * @returns API key, expiration timestamp, and derived Cosmos address
   * @see authenticateWithWallet
   *
   * @example
   * ```ts
   * const result = await al.auth.fromWallet(process.env.WALLET_PRIVATE_KEY);
   * console.log('API Key:', result.apiKey);
   * ```
   */
  fromWallet(config: string | WalletAuthConfig): Promise<WalletAuthResult>;

  /**
   * Derive the Cosmos (Fetch) address from a private key without authenticating.
   *
   * @param privateKey Hex-encoded private key (with or without 0x prefix)
   * @returns The Cosmos address (fetch1...)
   * @see deriveCosmosAddress
   */
  deriveAddress(privateKey: string): Promise<string>;

  /**
   * Generate a new wallet and authenticate in one step (zero-to-hero flow).
   *
   * Creates a random wallet using ethers.Wallet.createRandom(), then authenticates
   * with Agentverse to obtain an API key. Returns everything needed to start building.
   *
   * Requires optional peer dependencies: ethers, @cosmjs/crypto, and bech32.
   *
   * @param expiresIn Optional expiration time in seconds (default: 30 days)
   * @returns Private key, EVM address, Cosmos address, and API key
   * @see generateWalletAndAuthenticate
   *
   * @example
   * ```ts
   * const result = await al.auth.generate();
   * console.log('Private Key:', result.privateKey);
   * console.log('API Key:', result.apiKey);
   * // Save both to .env and start building!
   * ```
   */
  generate(expiresIn?: number): Promise<GenerateWalletResult>;
}

/** Agentverse storage operations. */
export interface StorageNamespace {
  /**
   * List all storage keys for an agent.
   * @see listStorage
   */
  list(agentAddress: string): Promise<StorageEntry[]>;

  /**
   * Get a single storage value by key.
   * @see getStorage
   */
  get(agentAddress: string, key: string): Promise<string | null>;

  /**
   * Set a storage value by key.
   * @see putStorage
   */
  put(agentAddress: string, key: string, value: string): Promise<void>;

  /**
   * Delete a storage key.
   * @see deleteStorage
   */
  delete(agentAddress: string, key: string): Promise<void>;
}

/** Commerce data from agent storage. */
export interface CommerceNamespace {
  /**
   * Read revenue data for an agent.
   * @see getAgentRevenue
   */
  getRevenue(agentAddress: string): Promise<AgentRevenue>;

  /**
   * Read the pricing table for an agent.
   * @see getPricingTable
   */
  getPricing(agentAddress: string): Promise<PricingEntry[]>;

  /**
   * Read the full commerce status for an agent.
   * @see getAgentCommerceStatus
   */
  getStatus(agentAddress: string): Promise<AgentCommerceStatus>;

  /**
   * Compute network-wide GDP across a set of agents.
   * @see getNetworkGDP
   */
  getNetworkGDP(addresses: string[]): Promise<NetworkGDP>;
}

/** Multi-token payment operations. */
export interface PaymentsNamespace {
  /** Look up a known token by symbol and chain. */
  getToken(symbol: string, chainId?: number): PaymentToken | undefined;

  /** Get balances for multiple tokens. */
  getMultiTokenBalances(
    walletAddress: string,
    tokenSymbols?: string[],
    chainId?: number,
  ): Promise<Record<string, string>>;

  /** Transfer any ERC-20 token. */
  transfer(
    tokenAddress: string,
    to: string,
    amount: string,
    chainId?: number,
  ): Promise<{ txHash: string; blockNumber: number }>;

  /** Create an invoice in agent storage. */
  createInvoice(
    agentAddress: string,
    invoice: Omit<Invoice, 'createdAt' | 'updatedAt' | 'status'>,
  ): Promise<Invoice>;

  /** Get an invoice by ID. */
  getInvoice(agentAddress: string, invoiceId: string): Promise<Invoice | null>;

  /** List invoices, optionally filtered by status. */
  listInvoices(agentAddress: string, status?: InvoiceStatus): Promise<Invoice[]>;

  /** Check ERC-20 spending limit (allowance). */
  checkAllowance(
    tokenAddress: string,
    owner: string,
    spender: string,
    chainId?: number,
  ): Promise<SpendingLimit>;

  /** Spend from a delegation (transferFrom). */
  spendFromDelegation(
    tokenAddress: string,
    owner: string,
    recipient: string,
    amount: string,
  ): Promise<{ txHash: string; blockNumber: number }>;

  /** Generate a delegation handoff link. */
  delegationLink(
    tokenAddress: string,
    spenderAddress: string,
    amount: string,
  ): string;

  /** Generate a fiat onramp link. */
  fiatLink(params: FiatOnrampParams): FiatOnrampLink;
}

/** On-chain trading operations (requires ethers). */
export interface OnchainNamespace {
  /**
   * Execute a buy on a bonding curve token contract.
   * @see buyTokens
   */
  buy(
    tokenAddress: string,
    fetAmount: string,
    config?: Omit<OnchainConfig, 'client'>,
  ): Promise<BuyResult>;

  /**
   * Execute a sell on a bonding curve token contract.
   * @see sellTokens
   */
  sell(
    tokenAddress: string,
    tokenAmount: string,
    config?: Omit<OnchainConfig, 'client'>,
  ): Promise<SellResult>;

  /**
   * Query wallet balances: BNB, FET, and a specific token.
   * @see getWalletBalances
   */
  getBalances(
    tokenAddress: string,
    config?: Omit<OnchainConfig, 'client'>,
  ): Promise<WalletBalances>;
}

/** Custodial trading operations (server-side HD wallet — no private key on client). */
export interface TradingNamespace {
  /**
   * Get a custodial wallet address and balances.
   * Omit agentAddress to get the user's own wallet.
   * Pass an agentAddress to get that agent's autonomous trading wallet.
   * @param chainId       Chain to query (default: 97 = BSC Testnet).
   * @param agentAddress  Agent address (agent1q...). Omit for user wallet.
   * @see getWallet
   */
  getWallet(chainId?: number, agentAddress?: string): Promise<WalletInfoResponse>;

  /**
   * Execute a buy on the bonding curve.
   * Pass agentAddress in params to trade from an agent's wallet (default: user wallet).
   * @param params  tokenAddress, fetAmount, optional slippagePercent, optional agentAddress.
   * @see executeBuy
   */
  buy(params: ExecuteBuyParams): Promise<CustodialBuyResult>;

  /**
   * Execute a sell on the bonding curve.
   * Pass agentAddress in params to trade from an agent's wallet (default: user wallet).
   * @param params  tokenAddress, tokenAmount, optional slippagePercent, optional agentAddress.
   * @see executeSell
   */
  sell(params: ExecuteSellParams): Promise<CustodialSellResult>;
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

  /** Wallet authentication operations (obtain API key from wallet). */
  readonly auth: AuthNamespace;

  /** Agentverse storage read/write operations. */
  readonly storage: StorageNamespace;

  /** Commerce data from agent storage (revenue, pricing, GDP). */
  readonly commerce: CommerceNamespace;

  /** On-chain trading operations (requires ethers as peer dependency). */
  readonly onchain: OnchainNamespace;

  /** Multi-token payment operations. */
  readonly payments: PaymentsNamespace;

  /** Custodial trading operations (server-side HD wallet, no private key required). */
  readonly trading: TradingNamespace;

  /**
   * Create a client by reading a skill.md file.
   * Auto-extracts the API base URL from the skill content.
   *
   * @example
   * ```ts
   * const client = await AgentLaunch.fromSkill("https://agent-launch.ai/skill.md");
   * ```
   *
   * @see https://agent-launch.ai/skill.md
   * @remarks CLI: `npx agentlaunch docs`
   */
  static async fromSkill(
    skillUrl: string,
    options?: { apiKey?: string },
  ): Promise<AgentLaunch> {
    try {
      const response = await fetch(skillUrl);
      if (!response.ok) {
        return new AgentLaunch({ apiKey: options?.apiKey });
      }
      const text = await response.text();
      const urlMatch =
        text.match(/API Base:\s*(https?:\/\/[^\s]+)/i) ||
        text.match(/(https?:\/\/[^\s]+)\/api\/agents/);
      const baseUrl =
        urlMatch?.[1]?.replace(/\/api$/, "") || "https://agent-launch.ai";
      return new AgentLaunch({
        baseUrl: baseUrl + "/api",
        apiKey: options?.apiKey,
      });
    } catch {
      return new AgentLaunch({ apiKey: options?.apiKey });
    }
  }

  /**
   * Top-level convenience method for tokenizing an agent.
   * Returns a flattened, camelCase response matching the docs example.
   *
   * @example
   * ```ts
   * const client = new AgentLaunch({ apiKey: process.env.AGENTVERSE_API_KEY });
   * const result = await client.tokenize({
   *   agentAddress: 'agent1q...',
   *   name: 'MyBot',
   *   symbol: 'MYB',
   *   description: 'My AI agent token',
   * });
   * console.log(result.handoffLink);
   * ```
   */
  async tokenize(params: TokenizeParams): Promise<TokenizeResult> {
    if (!params.agentAddress) {
      throw new Error(
        'agentAddress is required. Pass the Agentverse agent address (agent1q...) ' +
        'of the agent you want to tokenize.',
      );
    }
    try {
      const { data } = await this.tokens.tokenize(params);
      return {
        tokenId: data.token_id,
        handoffLink: data.handoff_link,
        name: data.name,
        symbol: data.symbol,
        description: data.description,
        image: data.image,
        status: data.status,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('was not found under the provided')) {
        throw new Error(
          `Agent ${params.agentAddress} was not found under this API key. ` +
          'This can happen if the agent is connected via mailbox instead of hosted on Agentverse. ' +
          'Currently only hosted agents (created via the Agentverse UI or API) can be tokenized. ' +
          'To fix this, deploy your agent as a hosted agent on Agentverse first.',
        );
      }
      throw err;
    }
  }

  /**
   * Top-level convenience method to list tokens.
   *
   * @example
   * ```ts
   * const { tokens } = await client.listTokens({ limit: 10 });
   * ```
   */
  async listTokens(params?: TokenListParams): Promise<TokenListResponse> {
    return this.tokens.listTokens(params);
  }

  /**
   * Top-level convenience method to get a token by address.
   *
   * @example
   * ```ts
   * const token = await client.getToken('0x...');
   * ```
   */
  async getToken(address: string): Promise<Token> {
    return this.tokens.getToken(address);
  }

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

    this.auth = {
      fromWallet: (walletConfig: string | WalletAuthConfig) =>
        authenticateWithWallet(walletConfig),
      deriveAddress: (privateKey: string) =>
        deriveCosmosAddress(privateKey),
      generate: (expiresIn?: number) =>
        generateWalletAndAuthenticate(expiresIn),
    };

    // Storage and commerce namespaces use the Agentverse API key directly
    // (Bearer auth to agentverse.ai, not X-API-Key to agent-launch.ai).
    const apiKey = config.apiKey;

    this.storage = {
      list: (agentAddress: string) => listStorage(agentAddress, apiKey),
      get: (agentAddress: string, key: string) =>
        getStorage(agentAddress, key, apiKey),
      put: (agentAddress: string, key: string, value: string) =>
        putStorage(agentAddress, key, value, apiKey),
      delete: (agentAddress: string, key: string) =>
        deleteStorage(agentAddress, key, apiKey),
    };

    this.commerce = {
      getRevenue: (agentAddress: string) =>
        getAgentRevenue(agentAddress, apiKey),
      getPricing: (agentAddress: string) =>
        getPricingTable(agentAddress, apiKey),
      getStatus: (agentAddress: string) =>
        getAgentCommerceStatus(agentAddress, apiKey),
      getNetworkGDP: (addresses: string[]) =>
        getNetworkGDP(addresses, apiKey),
    };

    this.onchain = {
      buy: (tokenAddress: string, fetAmount: string, cfg?: Omit<OnchainConfig, 'client'>) =>
        buyTokens(tokenAddress, fetAmount, { ...cfg, client }),
      sell: (tokenAddress: string, tokenAmount: string, cfg?: Omit<OnchainConfig, 'client'>) =>
        sellTokens(tokenAddress, tokenAmount, { ...cfg, client }),
      getBalances: (tokenAddress: string, cfg?: Omit<OnchainConfig, 'client'>) =>
        getWalletBalances(tokenAddress, cfg),
    };

    this.payments = {
      getToken: (symbol: string, chainId?: number) =>
        getPaymentToken(symbol, chainId),
      getMultiTokenBalances: (walletAddress: string, tokenSymbols?: string[], chainId?: number) =>
        getMultiTokenBalances(walletAddress, tokenSymbols, chainId),
      transfer: (tokenAddress: string, to: string, amount: string, chainId?: number) => {
        const pk = process.env['WALLET_PRIVATE_KEY'];
        if (!pk) throw new Error('WALLET_PRIVATE_KEY required for token transfers');
        return transferToken(tokenAddress, to, amount, pk, chainId);
      },
      createInvoice: (agentAddress: string, invoice: Omit<Invoice, 'createdAt' | 'updatedAt' | 'status'>) =>
        createInvoice(agentAddress, invoice, apiKey),
      getInvoice: (agentAddress: string, invoiceId: string) =>
        getInvoice(agentAddress, invoiceId, apiKey),
      listInvoices: (agentAddress: string, status?: InvoiceStatus) =>
        listInvoices(agentAddress, status, apiKey),
      checkAllowance: (tokenAddress: string, owner: string, spender: string, chainId?: number) =>
        checkAllowance(tokenAddress, owner, spender, chainId),
      spendFromDelegation: (tokenAddress: string, owner: string, recipient: string, amount: string, chainId?: number) =>
        spendFromDelegation(tokenAddress, owner, recipient, amount, chainId ? { chainId } : undefined),
      delegationLink: (tokenAddress: string, spenderAddress: string, amount: string) =>
        generateDelegationLink(tokenAddress, spenderAddress, amount),
      fiatLink: (params: FiatOnrampParams) =>
        generateFiatOnrampLink(params),
    };

    this.trading = {
      getWallet: (chainId?: number, agentAddress?: string) =>
        getWallet(chainId, agentAddress, client),
      buy: (params: ExecuteBuyParams) => executeBuy(params, client),
      sell: (params: ExecuteSellParams) => executeSell(params, client),
    };
  }
}
