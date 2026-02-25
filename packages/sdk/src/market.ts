/**
 * agentlaunch-sdk — Market operations
 *
 * SDK-003: Price queries, holder data, and trade-link generation.
 *
 * Platform constants (immutable, set by deployed smart contracts):
 *   - TARGET_LIQUIDITY = 30,000 FET  → auto DEX listing
 *   - TOTAL_BUY_TOKENS = 800,000,000
 *   - FEE_PERCENTAGE   = 2%          → 100% to protocol treasury (REVENUE_ACCOUNT)
 *                                       No creator fee.
 */

import { AgentLaunchClient } from './client.js';
import { getToken } from './tokens.js';
import { getFrontendUrl } from './urls.js';
import type {
  HolderListResponse,
  SingleHolderResponse,
  TradeAction,
  TradeLinkOptions,
  CalculateBuyResponse,
  CalculateSellResponse,
  PlatformStats,
  TokenListResponse,
} from './types.js';

/** Envelope for the holders endpoint. */
interface HolderListEnvelope {
  success: true;
  data: HolderListResponse;
}

interface SingleHolderEnvelope {
  success: true;
  data: SingleHolderResponse;
}

// ---------------------------------------------------------------------------
// Module-level default client (lazy, env-based)
// ---------------------------------------------------------------------------

function defaultClient(): AgentLaunchClient {
  return new AgentLaunchClient({
    apiKey: process.env['AGENTVERSE_API_KEY'] ?? process.env['AGENT_LAUNCH_API_KEY'],
    baseUrl: process.env['AGENT_LAUNCH_BASE_URL'],
  });
}

// ---------------------------------------------------------------------------
// getTokenPrice
// ---------------------------------------------------------------------------

/**
 * Get the current bonding-curve price of a token in FET.
 *
 * Fetches the full token details and returns the `price` field.  For bulk
 * price fetching use `listTokens()` which returns prices for all tokens
 * in a single request.
 *
 * No authentication required.
 *
 * @returns Current price as a string (preserves decimal precision)
 *
 * @example
 * ```ts
 * const price = await getTokenPrice('0xAbCd...');
 * console.log(`Current price: ${price} FET`);
 * ```
 */
export async function getTokenPrice(
  address: string,
  client?: AgentLaunchClient,
): Promise<string> {
  const token = await getToken(address, client);
  return token.price;
}

// ---------------------------------------------------------------------------
// getTokenHolders
// ---------------------------------------------------------------------------

/**
 * Get the list of token holders for a deployed token.
 *
 * Useful for implementing token-gated access: check whether a given wallet
 * holds any of a particular agent's token.
 *
 * Pass `holderAddress` to look up a specific wallet instead of the full list.
 *
 * No authentication required.
 *
 * @example
 * ```ts
 * // Full holder list
 * const { holders, total } = await getTokenHolders('0xAbCd...');
 *
 * // Single holder lookup (returns null if not a holder)
 * const holder = await getTokenHolders('0xAbCd...', '0xUser...');
 * ```
 */
export async function getTokenHolders(
  address: string,
  holderAddress?: string,
  client?: AgentLaunchClient,
): Promise<HolderListResponse | SingleHolderResponse> {
  const c = client ?? defaultClient();

  const params: Record<string, string | undefined> = {};
  if (holderAddress) {
    params['holder'] = holderAddress;
  }

  if (holderAddress) {
    const envelope = await c.get<SingleHolderEnvelope>(
      `/agents/token/${encodeURIComponent(address)}/holders`,
      params,
    );
    return envelope.data;
  }

  const envelope = await c.get<HolderListEnvelope>(
    `/agents/token/${encodeURIComponent(address)}/holders`,
    params,
  );
  return envelope.data;
}

// ---------------------------------------------------------------------------
// generateTradeLink
// ---------------------------------------------------------------------------

/**
 * Generate a pre-filled trade URL for a human to open.
 *
 * The returned URL opens the trade page with the action and amount
 * pre-filled so the user only needs to connect their wallet and confirm.
 *
 * Agents should share this link rather than attempting to sign transactions
 * on behalf of users.
 *
 * @param address Token contract address
 * @param action  'buy' or 'sell'
 * @param amount  Optional pre-fill amount (FET for buys, token units for sells)
 *
 * @example
 * ```ts
 * const link = generateTradeLink('0xAbCd...', 'buy', 100);
 * // https://agent-launch.ai/trade/0xAbCd...?action=buy&amount=100
 * ```
 */
export function generateTradeLink(
  address: string,
  action: TradeAction,
  amount?: number | string,
  client?: AgentLaunchClient,
): string {
  const baseUrl = (client as AgentLaunchClient & { baseUrl: string } | undefined)?.baseUrl
    ?? process.env['AGENT_LAUNCH_BASE_URL']?.replace(/\/$/, '')
    ?? getFrontendUrl();

  const params = new URLSearchParams({ action });
  if (amount !== undefined && amount !== null) {
    params.set('amount', String(amount));
  }

  return `${baseUrl}/trade/${address}?${params.toString()}`;
}

/**
 * Overload that accepts a TradeLinkOptions object instead of positional args.
 *
 * @example
 * ```ts
 * const link = generateTradeLinkFromOptions('0xAbCd...', { action: 'sell', amount: 500 });
 * ```
 */
export function generateTradeLinkFromOptions(
  address: string,
  options: TradeLinkOptions = {},
  client?: AgentLaunchClient,
): string {
  return generateTradeLink(
    address,
    options.action ?? 'buy',
    options.amount,
    client,
  );
}

// ---------------------------------------------------------------------------
// calculateBuy
// ---------------------------------------------------------------------------

/**
 * Simulate a buy transaction and return the expected outcome.
 *
 * Useful for displaying price impact and estimated token amounts to users
 * before they confirm a transaction.  No authentication required.
 *
 * Note: The 2% trading fee goes 100% to the protocol treasury (REVENUE_ACCOUNT).
 * There is no creator fee.
 *
 * @param address    Token contract address
 * @param fetAmount  Amount of FET the buyer intends to spend (as a string, e.g. "100")
 *
 * @example
 * ```ts
 * import { calculateBuy } from 'agentlaunch-sdk';
 *
 * const result = await calculateBuy('0xAbCd...', '100');
 * console.log(`You will receive ${result.tokensReceived} tokens`);
 * console.log(`Price impact: ${result.priceImpact}%`);
 * console.log(`Protocol fee: ${result.fee} FET`);
 * ```
 */
export async function calculateBuy(
  address: string,
  fetAmount: string,
  client?: AgentLaunchClient,
): Promise<CalculateBuyResponse> {
  const c = client ?? defaultClient();
  return c.get<CalculateBuyResponse>('/tokens/calculate-buy', {
    address,
    amount: fetAmount,
  });
}

// ---------------------------------------------------------------------------
// calculateSell
// ---------------------------------------------------------------------------

/**
 * Simulate a sell transaction and return the expected outcome.
 *
 * Useful for displaying price impact and estimated FET proceeds to users
 * before they confirm a transaction.  No authentication required.
 *
 * Note: The 2% trading fee goes 100% to the protocol treasury (REVENUE_ACCOUNT).
 * There is no creator fee.
 *
 * @param address      Token contract address
 * @param tokenAmount  Number of tokens the seller intends to sell (as a string)
 *
 * @example
 * ```ts
 * import { calculateSell } from 'agentlaunch-sdk';
 *
 * const result = await calculateSell('0xAbCd...', '500000');
 * console.log(`You will receive ${result.fetReceived} FET`);
 * console.log(`Price impact: ${result.priceImpact}%`);
 * console.log(`Protocol fee: ${result.fee} FET`);
 * ```
 */
export async function calculateSell(
  address: string,
  tokenAmount: string,
  client?: AgentLaunchClient,
): Promise<CalculateSellResponse> {
  const c = client ?? defaultClient();
  return c.get<CalculateSellResponse>('/tokens/calculate-sell', {
    address,
    amount: tokenAmount,
  });
}

// ---------------------------------------------------------------------------
// getPlatformStats
// ---------------------------------------------------------------------------

/**
 * Fetch aggregated platform statistics.
 *
 * Returns platform-wide metrics including total tokens, volume, and trending.
 * No authentication required.
 *
 * @example
 * ```ts
 * import { getPlatformStats } from 'agentlaunch-sdk';
 *
 * const stats = await getPlatformStats();
 * console.log(`Total tokens: ${stats.totalTokens}`);
 * console.log(`Total volume: ${stats.totalVolume}`);
 * ```
 */
export async function getPlatformStats(
  client?: AgentLaunchClient,
): Promise<PlatformStats> {
  const c = client ?? defaultClient();
  return c.get<PlatformStats>('/platform/stats');
}
