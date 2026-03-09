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
 * Token deployment is delegated to humans via handoff links (irreversible, 120 FET).
 * For autonomous trading, agents store EVM keys via Agentverse Secrets.
 */

import type { TradeLinkOptions, TradeAction, FiatOnrampParams, FiatOnrampLink } from './types.js';
import { getFrontendUrl } from './urls.js';

/** Regex to validate Ethereum addresses: 0x followed by exactly 40 hex characters */
const ETH_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

/**
 * Validates that an address is a valid Ethereum address format.
 * Prevents URL injection via addresses containing special characters like ? or #.
 */
export function validateEthAddress(address: string): void {
  if (!ETH_ADDRESS_REGEX.test(address)) {
    throw new Error(`Invalid token address format: ${address}. Expected 0x followed by 40 hex characters.`);
  }
}

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
  // Security: Validate address format to prevent URL injection
  validateEthAddress(address);

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

// ---------------------------------------------------------------------------
// generateDelegationLink
// ---------------------------------------------------------------------------

/**
 * Generate a handoff link for a human to approve an ERC-20 spending limit.
 *
 * The user opens this link, connects their wallet, and signs an `approve()`
 * transaction allowing the specified spender to transfer up to `amount` tokens.
 *
 * @param tokenAddress - ERC-20 contract address
 * @param spenderAddress - Agent wallet address to authorize
 * @param amount - Maximum amount to approve (decimal string)
 * @param baseUrl - Override the platform base URL
 *
 * @example
 * ```ts
 * const link = generateDelegationLink('0xFET...', '0xAgent...', '100');
 * // https://agent-launch.ai/delegate?token=0xFET...&spender=0xAgent...&amount=100
 * ```
 */
export function generateDelegationLink(
  tokenAddress: string,
  spenderAddress: string,
  amount: string,
  baseUrl?: string,
): string {
  validateEthAddress(tokenAddress);
  validateEthAddress(spenderAddress);

  const base = resolveBaseUrl(baseUrl);
  const params = new URLSearchParams({
    token: tokenAddress,
    spender: spenderAddress,
    amount,
  });

  return `${base}/delegate?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// Fiat onramp link generation
// ---------------------------------------------------------------------------

/** URL patterns and env var names for fiat onramp providers. */
export const FIAT_PROVIDER_CONFIGS = {
  moonpay: {
    baseUrl: 'https://buy.moonpay.com',
    apiKeyEnv: 'MOONPAY_API_KEY',
  },
  transak: {
    baseUrl: 'https://global.transak.com',
    apiKeyEnv: 'TRANSAK_API_KEY',
  },
} as const;

/** Map of crypto symbols to provider-specific currency codes. */
const CRYPTO_CODES: Record<string, { moonpay: string; transak: string }> = {
  FET: { moonpay: 'fet_bsc', transak: 'FET' },
  USDC: { moonpay: 'usdc_bsc', transak: 'USDC' },
  BNB: { moonpay: 'bnb_bsc', transak: 'BNB' },
};

/**
 * Generate a fiat onramp link for MoonPay or Transak.
 *
 * Returns a URL the user can open to purchase crypto with a credit card.
 * Never processes fiat directly — this is handoff-only.
 *
 * @param params - Onramp parameters
 * @returns Provider URL and metadata
 *
 * @example
 * ```ts
 * const link = generateFiatOnrampLink({
 *   fiatAmount: '50',
 *   fiatCurrency: 'USD',
 *   cryptoToken: 'FET',
 *   walletAddress: '0x...',
 *   provider: 'moonpay',
 * });
 * // { provider: 'moonpay', url: 'https://buy.moonpay.com?...' }
 * ```
 */
export function generateFiatOnrampLink(params: FiatOnrampParams): FiatOnrampLink {
  const provider = params.provider ?? 'moonpay';
  const config = FIAT_PROVIDER_CONFIGS[provider];
  const cryptoCodes = CRYPTO_CODES[params.cryptoToken.toUpperCase()];

  if (!cryptoCodes) {
    throw new Error(
      `Unsupported crypto token for fiat onramp: ${params.cryptoToken}. ` +
      `Supported: ${Object.keys(CRYPTO_CODES).join(', ')}`,
    );
  }

  const apiKey = process.env[config.apiKeyEnv] ?? '';

  let url: string;

  if (provider === 'moonpay') {
    const qs = new URLSearchParams({
      apiKey,
      currencyCode: cryptoCodes.moonpay,
      baseCurrencyCode: params.fiatCurrency.toLowerCase(),
      baseCurrencyAmount: params.fiatAmount,
      walletAddress: params.walletAddress,
    });
    if (params.returnUrl) qs.set('redirectURL', params.returnUrl);
    url = `${config.baseUrl}?${qs.toString()}`;
  } else {
    const qs = new URLSearchParams({
      apiKey,
      cryptoCurrencyCode: cryptoCodes.transak,
      fiatCurrency: params.fiatCurrency.toUpperCase(),
      fiatAmount: params.fiatAmount,
      walletAddress: params.walletAddress,
      network: 'bsc',
    });
    if (params.returnUrl) qs.set('redirectURL', params.returnUrl);
    url = `${config.baseUrl}?${qs.toString()}`;
  }

  return {
    provider,
    url,
  };
}
