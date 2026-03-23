/**
 * MCP tool handlers for server-side custodial trading operations (W1-MCP).
 *
 * These tools delegate execution to the AgentLaunch backend — the server
 * derives the agent's HD wallet, executes on-chain transactions, and returns
 * results.  No private key is required in the MCP environment; authentication
 * is via AGENTLAUNCH_API_KEY (or AGENTVERSE_API_KEY) in the environment.
 *
 * Contrast with trading.ts which executes trades directly from a
 * WALLET_PRIVATE_KEY env var held by the MCP client.
 *
 * Tools: get_agent_wallet, buy_token, sell_token
 */

import { getWallet, executeBuy, executeSell } from 'agentlaunch-sdk';
import type { WalletInfoResponse, CustodialBuyResult, CustodialSellResult } from 'agentlaunch-sdk';

// ---------------------------------------------------------------------------
// Tool implementations
// ---------------------------------------------------------------------------

/**
 * get_agent_wallet
 *
 * Returns the agent's server-managed custodial wallet address and balances.
 * The wallet address is deterministic — it will not change between calls.
 * Requires AGENTLAUNCH_API_KEY or AGENTVERSE_API_KEY in env.
 *
 * Maps to: GET /api/agents/wallet?chainId={chainId}
 */
export async function getAgentWalletTool(args: {
  chainId?: number;
}): Promise<WalletInfoResponse & { _markdown: string }> {
  const chainId = args.chainId ?? 97;

  const info = await getWallet(chainId);

  const chainName =
    chainId === 56
      ? 'BSC Mainnet'
      : chainId === 97
        ? 'BSC Testnet'
        : chainId === 1
          ? 'Ethereum Mainnet'
          : chainId === 11155111
            ? 'Ethereum Sepolia'
            : `Chain ${chainId}`;

  const explorerBase =
    chainId === 56
      ? 'https://bscscan.com'
      : chainId === 97
        ? 'https://testnet.bscscan.com'
        : chainId === 1
          ? 'https://etherscan.io'
          : 'https://sepolia.etherscan.io';

  const gasSymbol = chainId === 1 || chainId === 11155111 ? 'ETH' : 'BNB';

  const _markdown = `# Agent Custodial Wallet

| Property | Value |
|----------|-------|
| Address | \`${info.address}\` |
| Network | ${chainName} |
| FET Balance | ${info.fetBalance} FET |
| Gas Balance | ${info.nativeBalance} ${gasSymbol} |

[View on Explorer](${explorerBase}/address/${info.address})

## Next Steps
- Fund with FET before trading (wallet needs FET to buy tokens)
- Fund with ${gasSymbol} for gas (minimum ~0.001 ${gasSymbol} per trade)
- Buy tokens: \`buy_token({ tokenAddress: "0x...", fetAmount: "100" })\`
- Sell tokens: \`sell_token({ tokenAddress: "0x...", tokenAmount: "500000" })\`

## Other Surfaces
- SDK: \`sdk.trading.getWallet()\`
- CLI: \`npx agentlaunch wallet --custodial\``;

  return { ...info, _markdown };
}

/**
 * buy_token
 *
 * Executes a bonding-curve buy using the agent's server-managed custodial
 * wallet.  The backend handles FET approval automatically if the current
 * allowance is insufficient.  Requires AGENTLAUNCH_API_KEY or AGENTVERSE_API_KEY.
 *
 * Maps to: POST /api/agents/buy
 */
export async function buyTokenTool(args: {
  tokenAddress: string;
  fetAmount: string;
  slippagePercent?: number;
}): Promise<CustodialBuyResult & { _markdown: string }> {
  const slippagePercent = args.slippagePercent ?? 5;

  const result = await executeBuy({
    tokenAddress: args.tokenAddress,
    fetAmount: args.fetAmount,
    slippagePercent,
  });

  const bscscan = `https://testnet.bscscan.com/tx/${result.txHash}`;
  const approvalLine =
    result.approvalTxHash
      ? `| Approval Tx | [${result.approvalTxHash.slice(0, 18)}…](https://testnet.bscscan.com/tx/${result.approvalTxHash}) |`
      : '';

  const _markdown = `# Custodial Buy Executed

| | Value |
|---|---|
| Tx Hash | [${result.txHash.slice(0, 18)}…](${bscscan}) |
${approvalLine}
| FET Spent | ${result.fetSpent} FET |
| Tokens Received (expected) | ${result.expectedTokens} |
| Min Tokens (slippage ${slippagePercent}%) | ${result.minTokens} |
| Block | ${result.blockNumber} |
| Gas Used | ${result.gasUsed} |
| Wallet | \`${result.walletAddress}\` |

## Next Steps
- Check wallet: \`get_agent_wallet({})\`
- Sell later: \`sell_token({ tokenAddress: "${args.tokenAddress}", tokenAmount: "AMOUNT" })\`
- View token: \`get_token({ address: "${args.tokenAddress}" })\`

## Other Surfaces
- SDK: \`sdk.trading.buy({ tokenAddress: "${args.tokenAddress}", fetAmount: "${args.fetAmount}" })\`
- BSCScan: ${bscscan}`;

  return { ...result, _markdown };
}

/**
 * sell_token
 *
 * Executes a bonding-curve sell using the agent's server-managed custodial
 * wallet.  No FET approval is required for sells.
 * Requires AGENTLAUNCH_API_KEY or AGENTVERSE_API_KEY.
 *
 * Maps to: POST /api/agents/sell
 */
export async function sellTokenTool(args: {
  tokenAddress: string;
  tokenAmount: string;
  slippagePercent?: number;
}): Promise<CustodialSellResult & { _markdown: string }> {
  const slippagePercent = args.slippagePercent ?? 5;

  const result = await executeSell({
    tokenAddress: args.tokenAddress,
    tokenAmount: args.tokenAmount,
    slippagePercent,
  });

  const bscscan = `https://testnet.bscscan.com/tx/${result.txHash}`;

  const _markdown = `# Custodial Sell Executed

| | Value |
|---|---|
| Tx Hash | [${result.txHash.slice(0, 18)}…](${bscscan}) |
| Tokens Sold | ${result.tokensSold} |
| Block | ${result.blockNumber} |
| Gas Used | ${result.gasUsed} |
| Wallet | \`${result.walletAddress}\` |

## Next Steps
- Check wallet balances: \`get_agent_wallet({})\`
- Buy again: \`buy_token({ tokenAddress: "${args.tokenAddress}", fetAmount: "AMOUNT" })\`
- View token: \`get_token({ address: "${args.tokenAddress}" })\`

## Other Surfaces
- SDK: \`sdk.trading.sell({ tokenAddress: "${args.tokenAddress}", tokenAmount: "${args.tokenAmount}" })\`
- BSCScan: ${bscscan}`;

  return { ...result, _markdown };
}

// ---------------------------------------------------------------------------
// Handler map — consumed by index.ts dispatch
// ---------------------------------------------------------------------------

export const custodialHandlers = {
  get_agent_wallet: getAgentWalletTool,
  buy_token: buyTokenTool,
  sell_token: sellTokenTool,
};
