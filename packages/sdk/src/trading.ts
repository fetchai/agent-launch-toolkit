/**
 * agentlaunch-sdk — Custodial trading operations
 *
 * Server-side HD wallet trading via POST /agents/buy, POST /agents/sell,
 * and GET /agents/wallet.  No private key or ethers.js required on the
 * client — the platform derives the agent's wallet from a master seed and
 * executes the on-chain transaction server-side.
 *
 * All three methods require an Agentverse API key (X-API-Key header).
 *
 * @example
 * ```ts
 * import { AgentLaunch } from 'agentlaunch-sdk';
 *
 * const sdk = new AgentLaunch({ apiKey: process.env.AGENTVERSE_API_KEY });
 *
 * // Check custodial wallet
 * const wallet = await sdk.trading.getWallet();
 * console.log(`Address: ${wallet.address}  FET: ${wallet.fetBalance}`);
 *
 * // Buy tokens on bonding curve
 * const buy = await sdk.trading.buy({
 *   tokenAddress: '0xF7e2F77f014a5ad3C121b1942968be33BA89e03c',
 *   fetAmount: '100',
 *   slippagePercent: 5,
 * });
 * console.log(`Bought! TX: ${buy.txHash}`);
 *
 * // Sell tokens
 * const sell = await sdk.trading.sell({
 *   tokenAddress: '0xF7e2F77f014a5ad3C121b1942968be33BA89e03c',
 *   tokenAmount: '500000',
 * });
 * console.log(`Sold! TX: ${sell.txHash}`);
 * ```
 */

import type { AgentLaunchClient } from './client.js';
import { AgentLaunchClient as Client } from './client.js';
import type {
  ExecuteBuyParams,
  ExecuteSellParams,
  CustodialBuyResult,
  CustodialSellResult,
  WalletInfoResponse,
} from './types.js';

// ---------------------------------------------------------------------------
// Response envelope helpers
// ---------------------------------------------------------------------------

/** Shape of the success envelope returned by the /agents/* endpoints. */
interface ApiSuccess<T> {
  success: true;
  data: T;
}

// ---------------------------------------------------------------------------
// Public functions
// ---------------------------------------------------------------------------

/**
 * Get a custodial wallet address and balances.
 *
 * - **No agentAddress** → returns the **user's own wallet**, derived from
 *   `hash("user:{userId}")`.  Stable forever regardless of how many agents you create.
 * - **With agentAddress** → returns that **agent's wallet**, derived from
 *   `hash(agentAddress)`.  Each agent has its own wallet for autonomous trading.
 *
 * Derivation uses BIP-44: `m/44'/60'/0'/0/{hash(identity) % MAX_HD_INDEX}`.
 * Private keys are never returned.
 *
 * @param chainId       Chain to query balances on (default: 56 = BSC Mainnet).
 * @param agentAddress  Agent address (agent1q...) to query. Omit for user wallet.
 * @param client        Optional pre-configured AgentLaunchClient.
 */
export async function getWallet(
  chainId?: number,
  agentAddress?: string,
  client?: AgentLaunchClient,
): Promise<WalletInfoResponse> {
  const c = client ?? new Client();
  const params: Record<string, string | number | boolean | undefined> = {};
  if (chainId !== undefined) params.chainId = chainId;
  if (agentAddress !== undefined) params.agentAddress = agentAddress;
  const envelope = await c.get<ApiSuccess<WalletInfoResponse>>(
    '/agents/wallet',
    params,
  );
  return envelope.data;
}

/**
 * Execute a buy on the bonding curve using the agent's custodial wallet.
 *
 * Calls POST /agents/buy.  The platform:
 *   1. Validates FET and gas balances
 *   2. Approves FET spend if needed (separate tx, hash returned in approvalTxHash)
 *   3. Calls buyTokens on the contract with your slippage settings
 *   4. Returns the confirmed tx hash and execution details
 *
 * Rate limit: 5 requests per minute.
 *
 * @param params  Buy parameters (tokenAddress, fetAmount, optional slippagePercent).
 * @param client  Optional pre-configured AgentLaunchClient.
 */
export async function executeBuy(
  params: ExecuteBuyParams,
  client?: AgentLaunchClient,
): Promise<CustodialBuyResult> {
  const c = client ?? new Client();
  const envelope = await c.post<ApiSuccess<CustodialBuyResult>>(
    '/agents/buy',
    params,
  );
  return envelope.data;
}

/**
 * Execute a sell on the bonding curve using the agent's custodial wallet.
 *
 * Calls POST /agents/sell.  No FET approval is required for sells.
 *
 * Rate limit: 5 requests per minute.
 *
 * @param params  Sell parameters (tokenAddress, tokenAmount, optional slippagePercent).
 * @param client  Optional pre-configured AgentLaunchClient.
 */
export async function executeSell(
  params: ExecuteSellParams,
  client?: AgentLaunchClient,
): Promise<CustodialSellResult> {
  const c = client ?? new Client();
  const envelope = await c.post<ApiSuccess<CustodialSellResult>>(
    '/agents/sell',
    params,
  );
  return envelope.data;
}
