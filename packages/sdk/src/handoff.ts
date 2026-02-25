/**
 * agentlaunch-sdk — Handoff link generation
 *
 * SDK-004: Helpers for generating deploy and trade handoff URLs.
 *
 * The agent-human handoff protocol:
 *   1. Agent calls POST /tokenize → receives token_id
 *   2. Agent generates a deploy link from token_id → sends to human
 *   3. Human opens link, connects wallet, signs 2 transactions
 *   4. Token is live on the bonding curve
 *
 * Agents never hold private keys or sign blockchain transactions directly.
 * All on-chain actions are delegated to humans via handoff links.
 */

import type { TradeLinkOptions, TradeAction } from './types.js';
import { getFrontendUrl } from './urls.js';

/** Resolve the platform base URL from the optional override or environment. */
function resolveBaseUrl(baseUrl?: string): string {
  return (
    (baseUrl ?? process.env['AGENT_LAUNCH_BASE_URL'])?.replace(/\/$/, '') ??
    getFrontendUrl()
  );
}

// ---------------------------------------------------------------------------
// generateDeployLink
// ---------------------------------------------------------------------------

/**
 * Generate a deploy handoff link for a pending token.
 *
 * The returned URL opens the deployment page where a human can connect
 * their wallet and complete the on-chain deployment with two transactions:
 *   1. Approve 120 FET to the deployer contract
 *   2. Call deploy() on the deployer contract
 *
 * @param tokenId  The `token_id` returned by POST /tokenize
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
export function generateDeployLink(tokenId: number, baseUrl?: string): string {
  if (!Number.isInteger(tokenId) || tokenId <= 0) {
    throw new Error(`generateDeployLink: tokenId must be a positive integer, got ${tokenId}`);
  }
  return `${resolveBaseUrl(baseUrl)}/deploy/${tokenId}`;
}

// ---------------------------------------------------------------------------
// generateTradeLink
// ---------------------------------------------------------------------------

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
export function generateTradeLink(
  address: string,
  opts: TradeLinkOptions = {},
  baseUrl?: string,
): string {
  const base = resolveBaseUrl(baseUrl);
  const params = new URLSearchParams();

  if (opts.action) {
    params.set('action', opts.action);
  }
  if (opts.amount !== undefined && opts.amount !== null) {
    params.set('amount', String(opts.amount));
  }

  const qs = params.toString();
  return qs
    ? `${base}/trade/${address}?${qs}`
    : `${base}/trade/${address}`;
}

// ---------------------------------------------------------------------------
// Convenience re-exports for common patterns
// ---------------------------------------------------------------------------

/**
 * Generate a buy link with a pre-filled FET amount.
 *
 * @example
 * ```ts
 * const link = generateBuyLink('0xAbCd...', 100);
 * // https://agent-launch.ai/trade/0xAbCd...?action=buy&amount=100
 * ```
 */
export function generateBuyLink(
  address: string,
  amount?: number | string,
  baseUrl?: string,
): string {
  return generateTradeLink(address, { action: 'buy' as TradeAction, amount }, baseUrl);
}

/**
 * Generate a sell link with a pre-filled token amount.
 *
 * @example
 * ```ts
 * const link = generateSellLink('0xAbCd...', 500);
 * // https://agent-launch.ai/trade/0xAbCd...?action=sell&amount=500
 * ```
 */
export function generateSellLink(
  address: string,
  amount?: number | string,
  baseUrl?: string,
): string {
  return generateTradeLink(address, { action: 'sell' as TradeAction, amount }, baseUrl);
}
