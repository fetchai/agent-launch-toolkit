/**
 * @agent-launch/sdk — Market operations
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
import type { HolderListResponse, SingleHolderResponse, TradeAction, TradeLinkOptions } from './types.js';
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
export declare function getTokenPrice(address: string, client?: AgentLaunchClient): Promise<string>;
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
export declare function getTokenHolders(address: string, holderAddress?: string, client?: AgentLaunchClient): Promise<HolderListResponse | SingleHolderResponse>;
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
export declare function generateTradeLink(address: string, action: TradeAction, amount?: number | string, client?: AgentLaunchClient): string;
/**
 * Overload that accepts a TradeLinkOptions object instead of positional args.
 *
 * @example
 * ```ts
 * const link = generateTradeLinkFromOptions('0xAbCd...', { action: 'sell', amount: 500 });
 * ```
 */
export declare function generateTradeLinkFromOptions(address: string, options?: TradeLinkOptions, client?: AgentLaunchClient): string;
//# sourceMappingURL=market.d.ts.map