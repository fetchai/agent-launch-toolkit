import { AgentLaunchClient } from 'agentlaunch-sdk';
import type { CalculateBuyResponse, CalculateSellResponse } from 'agentlaunch-sdk';

const client = new AgentLaunchClient();

/**
 * Calculate how many tokens would be received for a given FET spend amount.
 *
 * Calls GET /tokens/calculate-buy?address=...&fetAmount=...
 *
 * @param args.address   Token contract address
 * @param args.fetAmount Amount of FET to spend (as a decimal string, e.g. "100")
 */
export async function calculateBuy(args: {
  address: string;
  fetAmount: string;
}): Promise<CalculateBuyResponse> {
  return client.get<CalculateBuyResponse>('/tokens/calculate-buy', {
    address: args.address,
    fetAmount: args.fetAmount,
  });
}

/**
 * Calculate how much FET would be received for selling a given token amount.
 *
 * Calls GET /tokens/calculate-sell?address=...&tokenAmount=...
 *
 * @param args.address     Token contract address
 * @param args.tokenAmount Number of tokens to sell (as a decimal string, e.g. "500")
 */
export async function calculateSell(args: {
  address: string;
  tokenAmount: string;
}): Promise<CalculateSellResponse> {
  return client.get<CalculateSellResponse>('/tokens/calculate-sell', {
    address: args.address,
    tokenAmount: args.tokenAmount,
  });
}

/** Handler map consumed by the tool dispatcher in index.ts. */
export const calculateHandlers = {
  calculate_buy: calculateBuy,
  calculate_sell: calculateSell,
};
