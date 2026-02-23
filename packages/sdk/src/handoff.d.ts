/**
 * @agent-launch/sdk — Handoff link generation
 *
 * SDK-004: Helpers for generating deploy and trade handoff URLs.
 *
 * The agent-human handoff protocol:
 *   1. Agent calls POST /api/agents/tokenize → receives token_id
 *   2. Agent generates a deploy link from token_id → sends to human
 *   3. Human opens link, connects wallet, signs 2 transactions
 *   4. Token is live on the bonding curve
 *
 * Agents never hold private keys or sign blockchain transactions directly.
 * All on-chain actions are delegated to humans via handoff links.
 */
import type { TradeLinkOptions } from './types.js';
/**
 * Generate a deploy handoff link for a pending token.
 *
 * The returned URL opens the deployment page where a human can connect
 * their wallet and complete the on-chain deployment with two transactions:
 *   1. Approve 120 FET to the deployer contract
 *   2. Call deploy() on the deployer contract
 *
 * @param tokenId  The `token_id` returned by POST /api/agents/tokenize
 * @param baseUrl  Override the platform base URL (defaults to agent-launch.ai)
 *
 * @example
 * ```ts
 * const link = generateDeployLink(42);
 * // https://agent-launch.ai/deploy/42
 *
 * const devLink = generateDeployLink(42, 'https://fetch.ants-at-work.com');
 * // https://fetch.ants-at-work.com/deploy/42
 * ```
 */
export declare function generateDeployLink(tokenId: number, baseUrl?: string): string;
/**
 * Generate a trade handoff link for a deployed token.
 *
 * Agents use this to send pre-filled trade URLs to users.  The user opens
 * the link, connects their wallet, reviews the pre-filled amount, and
 * clicks Buy or Sell.
 *
 * @param address Token contract address
 * @param opts    Optional action ('buy' | 'sell') and pre-fill amount
 * @param baseUrl Override the platform base URL
 *
 * @example
 * ```ts
 * // Simple buy link
 * generateTradeLink('0xAbCd...');
 * // https://agent-launch.ai/trade/0xAbCd...
 *
 * // Pre-filled buy with amount
 * generateTradeLink('0xAbCd...', { action: 'buy', amount: 100 });
 * // https://agent-launch.ai/trade/0xAbCd...?action=buy&amount=100
 *
 * // Sell link
 * generateTradeLink('0xAbCd...', { action: 'sell', amount: 500 });
 * // https://agent-launch.ai/trade/0xAbCd...?action=sell&amount=500
 * ```
 */
export declare function generateTradeLink(address: string, opts?: TradeLinkOptions, baseUrl?: string): string;
/**
 * Generate a buy link with a pre-filled FET amount.
 *
 * @example
 * ```ts
 * const link = generateBuyLink('0xAbCd...', 100);
 * // https://agent-launch.ai/trade/0xAbCd...?action=buy&amount=100
 * ```
 */
export declare function generateBuyLink(address: string, amount?: number | string, baseUrl?: string): string;
/**
 * Generate a sell link with a pre-filled token amount.
 *
 * @example
 * ```ts
 * const link = generateSellLink('0xAbCd...', 500);
 * // https://agent-launch.ai/trade/0xAbCd...?action=sell&amount=500
 * ```
 */
export declare function generateSellLink(address: string, amount?: number | string, baseUrl?: string): string;
//# sourceMappingURL=handoff.d.ts.map