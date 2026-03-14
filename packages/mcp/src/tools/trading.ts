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
}): Promise<(BuyResult & { dryRun: false; _markdown: string }) | (CalculateBuyResponse & { dryRun: true; _markdown: string })> {
  if (args.dryRun) {
    const result = await calculateBuy(args.address, args.fetAmount);

    const _markdown = `# Buy Preview (Dry Run)

| | Value |
|---|---|
| FET to spend | ${args.fetAmount} FET |
| Tokens received | ${result.tokensReceived} |
| Price per token | ${result.pricePerToken} FET |
| Price impact | ${result.priceImpact}% |
| Fee (2%) | ${result.fee} FET |

_No transaction submitted._

## Next Steps
- Execute: call \`buy_tokens\` again with \`dryRun: false\`
- Check balance: \`get_wallet_balances({ address: "${args.address}" })\`

## Other Surfaces
- CLI: \`npx agentlaunch buy ${args.address} --amount ${args.fetAmount} --dry-run\``;

    return { dryRun: true as const, ...result, _markdown };
  }

  const result = await buyTokens(args.address, args.fetAmount, {
    chainId: args.chainId,
    slippagePercent: args.slippagePercent ?? DEFAULT_SLIPPAGE_PERCENT,
  });

  const bscscan = `https://testnet.bscscan.com/tx/${result.txHash}`;

  const _markdown = `# Buy Executed

| | Value |
|---|---|
| Tx Hash | [${result.txHash}](${bscscan}) |
| FET spent | ${args.fetAmount} FET |
| Tokens received | ${result.tokensReceived} |
| Block | ${result.blockNumber} |

## Next Steps
- Verify balance: \`get_wallet_balances({ address: "${args.address}" })\`
- Sell later: \`sell_tokens({ address: "${args.address}", tokenAmount: "AMOUNT" })\`

## Other Surfaces
- CLI: \`npx agentlaunch buy ${args.address} --amount ${args.fetAmount}\`
- BSCScan: ${bscscan}`;

  return { dryRun: false as const, ...result, _markdown };
}

/** Sell tokens on a bonding curve. With dryRun=true, returns a preview only. */
export async function sellTokensTool(args: {
  address: string;
  tokenAmount: string;
  chainId?: number;
  dryRun?: boolean;
}): Promise<(SellResult & { dryRun: false; _markdown: string }) | (CalculateSellResponse & { dryRun: true; _markdown: string })> {
  if (args.dryRun) {
    const result = await calculateSell(args.address, args.tokenAmount);

    const _markdown = `# Sell Preview (Dry Run)

| | Value |
|---|---|
| Tokens to sell | ${args.tokenAmount} |
| FET received | ${result.fetReceived} FET |
| Price per token | ${result.pricePerToken} FET |
| Price impact | ${result.priceImpact}% |
| Fee (2%) | ${result.fee} FET |

_No transaction submitted._

## Next Steps
- Execute: call \`sell_tokens\` again with \`dryRun: false\`
- Check balance: \`get_wallet_balances({ address: "${args.address}" })\`

## Other Surfaces
- CLI: \`npx agentlaunch sell ${args.address} --amount ${args.tokenAmount} --dry-run\``;

    return { dryRun: true as const, ...result, _markdown };
  }

  const result = await sellTokens(args.address, args.tokenAmount, {
    chainId: args.chainId,
  });

  const bscscan = `https://testnet.bscscan.com/tx/${result.txHash}`;

  const _markdown = `# Sell Executed

| | Value |
|---|---|
| Tx Hash | [${result.txHash}](${bscscan}) |
| Tokens sold | ${args.tokenAmount} |
| FET received | ${result.fetReceived} FET |
| Block | ${result.blockNumber} |

## Next Steps
- Verify balance: \`get_wallet_balances({ address: "${args.address}" })\`
- Buy again: \`buy_tokens({ address: "${args.address}", fetAmount: "AMOUNT" })\`

## Other Surfaces
- CLI: \`npx agentlaunch sell ${args.address} --amount ${args.tokenAmount}\`
- BSCScan: ${bscscan}`;

  return { dryRun: false as const, ...result, _markdown };
}

/** Get wallet balances for BNB, FET, and a specific token. */
export async function getWalletBalancesTool(args: {
  address: string;
  chainId?: number;
}): Promise<WalletBalances & { _markdown: string }> {
  const result = await getWalletBalances(args.address, {
    chainId: args.chainId,
  });

  const _markdown = `# Wallet Balances

| Token | Balance |
|-------|---------|
| BNB | ${result.bnb} |
| FET | ${result.fet} |
| Token | ${result.token} |

## Next Steps
- Buy tokens: \`buy_tokens({ address: "${args.address}", fetAmount: "100" })\`
- Sell tokens: \`sell_tokens({ address: "${args.address}", tokenAmount: "AMOUNT" })\`
- Browse market: \`list_tokens({ sort: "trending" })\`

## Other Surfaces
- CLI: \`npx agentlaunch wallet\`
- SDK: \`client.getWalletBalances()\``;

  return { ...result, _markdown };
}

/** Handler map consumed by the tool dispatcher in index.ts. */
export const tradingHandlers = {
  buy_tokens: buyTokensTool,
  sell_tokens: sellTokensTool,
  get_wallet_balances: getWalletBalancesTool,
};
