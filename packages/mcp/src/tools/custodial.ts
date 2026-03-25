/**
 * MCP tool handlers for server-side custodial trading operations (W1-MCP).
 *
 * Two wallet types:
 *   - **User wallet** (default): derived from user identity, stable forever.
 *   - **Agent wallet**: derived from agent address, for autonomous agent trading.
 *
 * These tools delegate execution to the AgentLaunch backend — the server
 * derives the wallet from a master seed and executes on-chain transactions.
 * No private key is required in the MCP environment; authentication is via
 * AGENTLAUNCH_API_KEY (or AGENTVERSE_API_KEY) in the environment.
 *
 * Tools: get_agent_wallet, buy_token, sell_token
 */

import { getWallet, executeBuy, executeSell } from 'agentlaunch-sdk';
import type { WalletInfoResponse, CustodialBuyResult, CustodialSellResult } from 'agentlaunch-sdk';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function chainName(chainId: number): string {
  if (chainId === 56) return 'BSC Mainnet';
  if (chainId === 97) return 'BSC Testnet';
  if (chainId === 1) return 'Ethereum Mainnet';
  if (chainId === 11155111) return 'Ethereum Sepolia';
  return `Chain ${chainId}`;
}

function explorerBase(chainId: number): string {
  if (chainId === 56) return 'https://bscscan.com';
  if (chainId === 97) return 'https://testnet.bscscan.com';
  if (chainId === 1) return 'https://etherscan.io';
  return 'https://sepolia.etherscan.io';
}

function gasSymbol(chainId: number): string {
  return chainId === 1 || chainId === 11155111 ? 'ETH' : 'BNB';
}

// ---------------------------------------------------------------------------
// Tool implementations
// ---------------------------------------------------------------------------

/**
 * get_agent_wallet
 *
 * Returns a custodial wallet address and balances.
 * - No agentAddress → user's own wallet (derived from user identity, stable forever)
 * - With agentAddress → that agent's wallet (derived from agent address)
 *
 * Maps to: GET /api/agents/wallet?chainId={chainId}&agentAddress={agentAddress}
 */
export async function getAgentWalletTool(args: {
  chainId?: number;
  agentAddress?: string;
}): Promise<WalletInfoResponse & { _markdown: string }> {
  const chainId = args.chainId ?? 97;

  const info = await getWallet(chainId, args.agentAddress);

  const walletType = args.agentAddress ? 'Agent Wallet' : 'User Wallet';
  const walletLabel = args.agentAddress
    ? `Agent: \`${args.agentAddress}\``
    : 'Your personal wallet (stable across all agents)';

  const gas = gasSymbol(chainId);
  const explorer = explorerBase(chainId);

  const _markdown = `# ${walletType}

| Property | Value |
|----------|-------|
| Address | \`${info.address}\` |
| Type | ${walletLabel} |
| Network | ${chainName(chainId)} |
| FET Balance | ${info.fetBalance} FET |
| Gas Balance | ${info.nativeBalance} ${gas} |

[View on Explorer](${explorer}/address/${info.address})

## Wallet Types
- **User wallet** (default): \`get_agent_wallet({})\` — your personal wallet, never changes
- **Agent wallet**: \`get_agent_wallet({ agentAddress: "agent1q..." })\` — per-agent trading wallet

## Next Steps
- Fund with FET before trading (wallet needs FET to buy tokens)
- Fund with ${gas} for gas (minimum ~0.001 ${gas} per trade)
- Buy tokens: \`buy_token({ tokenAddress: "0x...", fetAmount: "100" })\`
- Sell tokens: \`sell_token({ tokenAddress: "0x...", tokenAmount: "500000" })\`

## Other Surfaces
- SDK: \`sdk.trading.getWallet(${chainId}${args.agentAddress ? `, "${args.agentAddress}"` : ''})\`
- CLI: \`npx agentlaunch wallet custodial${args.agentAddress ? ` --agent ${args.agentAddress}` : ''}\``;

  return { ...info, _markdown };
}

/**
 * buy_token
 *
 * Executes a bonding-curve buy using a custodial wallet.
 * - No agentAddress → trades from user's wallet
 * - With agentAddress → trades from that agent's wallet
 *
 * Maps to: POST /api/agents/buy
 */
export async function buyTokenTool(args: {
  tokenAddress: string;
  fetAmount: string;
  slippagePercent?: number;
  agentAddress?: string;
}): Promise<CustodialBuyResult & { _markdown: string }> {
  const slippagePercent = args.slippagePercent ?? 5;

  const result = await executeBuy({
    tokenAddress: args.tokenAddress,
    fetAmount: args.fetAmount,
    slippagePercent,
    agentAddress: args.agentAddress,
  });

  const bscscan = `https://testnet.bscscan.com/tx/${result.txHash}`;
  const approvalLine =
    result.approvalTxHash
      ? `| Approval Tx | [${result.approvalTxHash.slice(0, 18)}…](https://testnet.bscscan.com/tx/${result.approvalTxHash}) |`
      : '';

  const walletType = args.agentAddress ? `Agent (${args.agentAddress})` : 'User';

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
| Wallet Type | ${walletType} |

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
 * Executes a bonding-curve sell using a custodial wallet.
 * - No agentAddress → trades from user's wallet
 * - With agentAddress → trades from that agent's wallet
 *
 * Maps to: POST /api/agents/sell
 */
export async function sellTokenTool(args: {
  tokenAddress: string;
  tokenAmount: string;
  slippagePercent?: number;
  agentAddress?: string;
}): Promise<CustodialSellResult & { _markdown: string }> {
  const slippagePercent = args.slippagePercent ?? 5;

  const result = await executeSell({
    tokenAddress: args.tokenAddress,
    tokenAmount: args.tokenAmount,
    slippagePercent,
    agentAddress: args.agentAddress,
  });

  const bscscan = `https://testnet.bscscan.com/tx/${result.txHash}`;

  const walletType = args.agentAddress ? `Agent (${args.agentAddress})` : 'User';

  const _markdown = `# Custodial Sell Executed

| | Value |
|---|---|
| Tx Hash | [${result.txHash.slice(0, 18)}…](${bscscan}) |
| Tokens Sold | ${result.tokensSold} |
| Block | ${result.blockNumber} |
| Gas Used | ${result.gasUsed} |
| Wallet | \`${result.walletAddress}\` |
| Wallet Type | ${walletType} |

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
