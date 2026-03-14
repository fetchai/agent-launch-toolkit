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
}): Promise<CalculateBuyResponse & { _markdown: string }> {
  const result = await client.get<CalculateBuyResponse>('/tokens/calculate-buy', {
    address: args.address,
    fetAmount: args.fetAmount,
  });

  const r = result as any;
  const addr = args.address;
  const _markdown = `# Buy Preview

| | Value |
|---|---|
| FET to spend | ${args.fetAmount} FET |
| Tokens received | ${r.tokensReceived ?? r.tokens ?? '—'} |
| Price per token | ${r.pricePerToken ?? '—'} FET |
| Price impact | ${r.priceImpact ?? '—'}% |
| Fee (2%) | ${r.fee ?? '—'} FET |
| Net cost | ${r.netCost ?? r.netFetSpent ?? args.fetAmount} FET |

## Next Steps
- Execute: \`buy_tokens({ address: "${addr}", fetAmount: "${args.fetAmount}" })\`
- Safe preview: \`buy_tokens({ address: "${addr}", fetAmount: "${args.fetAmount}", dryRun: true })\`
- Human trade: https://agent-launch.ai/trade/${addr}?action=buy&amount=${args.fetAmount}

## Other Surfaces
- CLI: \`npx agentlaunch buy ${addr} --amount ${args.fetAmount}\`
- SDK: \`client.buyTokens({ address: "${addr}", fetAmount: "${args.fetAmount}" })\``;

  return { ...result, _markdown };
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
}): Promise<CalculateSellResponse & { _markdown: string }> {
  const result = await client.get<CalculateSellResponse>('/tokens/calculate-sell', {
    address: args.address,
    tokenAmount: args.tokenAmount,
  });

  const r = result as any;
  const addr = args.address;
  const _markdown = `# Sell Preview

| | Value |
|---|---|
| Tokens to sell | ${args.tokenAmount} |
| FET received | ${r.fetReceived ?? r.fetAmount ?? '—'} FET |
| Price per token | ${r.pricePerToken ?? '—'} FET |
| Price impact | ${r.priceImpact ?? '—'}% |
| Fee (2%) | ${r.fee ?? '—'} FET |
| Net proceeds | ${r.netProceeds ?? r.netFetReceived ?? '—'} FET |

## Next Steps
- Execute: \`sell_tokens({ address: "${addr}", tokenAmount: "${args.tokenAmount}" })\`
- Safe preview: \`sell_tokens({ address: "${addr}", tokenAmount: "${args.tokenAmount}", dryRun: true })\`
- Human trade: https://agent-launch.ai/trade/${addr}?action=sell&amount=${args.tokenAmount}

## Other Surfaces
- CLI: \`npx agentlaunch sell ${addr} --amount ${args.tokenAmount}\`
- SDK: \`client.sellTokens({ address: "${addr}", tokenAmount: "${args.tokenAmount}" })\``;

  return { ...result, _markdown };
}

/** Handler map consumed by the tool dispatcher in index.ts. */
export const calculateHandlers = {
  calculate_buy: calculateBuy,
  calculate_sell: calculateSell,
};
