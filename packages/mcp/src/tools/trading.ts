/**
 * MCP tool handlers for on-chain trading operations.
 *
 * Tools: buy_tokens, sell_tokens, get_wallet_balances
 */

import {
  buyTokens,
  sellTokens,
  getWalletBalances,
  calculateBuy,
  calculateSell,
  DEFAULT_SLIPPAGE_PERCENT,
} from 'agentlaunch-sdk';
import type { BuyResult, SellResult, WalletBalances, CalculateBuyResponse, CalculateSellResponse } from 'agentlaunch-sdk';

/** Buy tokens on a bonding curve. With dryRun=true, returns a preview only. */
export async function buyTokensTool(args: {
  address: string;
  fetAmount: string;
  chainId?: number;
  slippagePercent?: number;
  dryRun?: boolean;
}): Promise<(BuyResult & { dryRun: false }) | (CalculateBuyResponse & { dryRun: true })> {
  if (args.dryRun) {
    const result = await calculateBuy(args.address, args.fetAmount);
    return { dryRun: true as const, ...result };
  }

  const result = await buyTokens(args.address, args.fetAmount, {
    chainId: args.chainId,
    slippagePercent: args.slippagePercent ?? DEFAULT_SLIPPAGE_PERCENT,
  });
  return { dryRun: false as const, ...result };
}

/** Sell tokens on a bonding curve. With dryRun=true, returns a preview only. */
export async function sellTokensTool(args: {
  address: string;
  tokenAmount: string;
  chainId?: number;
  dryRun?: boolean;
}): Promise<(SellResult & { dryRun: false }) | (CalculateSellResponse & { dryRun: true })> {
  if (args.dryRun) {
    const result = await calculateSell(args.address, args.tokenAmount);
    return { dryRun: true as const, ...result };
  }

  const result = await sellTokens(args.address, args.tokenAmount, {
    chainId: args.chainId,
  });
  return { dryRun: false as const, ...result };
}

/** Get wallet balances for BNB, FET, and a specific token. */
export async function getWalletBalancesTool(args: {
  address: string;
  chainId?: number;
}): Promise<WalletBalances> {
  return getWalletBalances(args.address, {
    chainId: args.chainId,
  });
}

/** Handler map consumed by the tool dispatcher in index.ts. */
export const tradingHandlers = {
  buy_tokens: buyTokensTool,
  sell_tokens: sellTokensTool,
  get_wallet_balances: getWalletBalancesTool,
};
