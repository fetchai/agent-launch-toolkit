/**
 * agentlaunch-sdk — Spending delegation via ERC-20 approve/transferFrom
 *
 * No custom smart contracts — uses standard ERC-20 allowance mechanism.
 *
 * Flow:
 *   1. Human approves agent wallet as spender (via handoff link or wallet UI)
 *   2. Agent checks allowance on-chain
 *   3. Agent calls transferFrom to spend from the delegation
 *   4. Metadata stored in Agentverse storage for tracking
 */

import type { SpendingLimit, PaymentToken } from './types.js';
import { getAllowance, transferFromERC20 } from './onchain.js';
import type { OnchainConfig } from './onchain.js';
import { getToken, KNOWN_TOKENS } from './payments.js';
import { generateDelegationLink, validateEthAddress } from './handoff.js';
import { getStorage, putStorage } from './storage.js';

// ---------------------------------------------------------------------------
// On-chain operations
// ---------------------------------------------------------------------------

/**
 * Check the ERC-20 allowance for a spender on behalf of an owner.
 *
 * @param tokenAddress - ERC-20 contract address
 * @param owner - Address that granted the allowance
 * @param spender - Address allowed to spend
 * @param chainId - Chain ID (default: 56)
 * @returns SpendingLimit with on-chain data
 */
export async function checkAllowance(
  tokenAddress: string,
  owner: string,
  spender: string,
  chainId = 56,
): Promise<SpendingLimit> {
  validateEthAddress(tokenAddress);
  validateEthAddress(owner);
  validateEthAddress(spender);
  const remaining = await getAllowance(tokenAddress, owner, spender, { chainId });

  // Look up token info
  const knownToken = findTokenByAddress(tokenAddress, chainId);

  return {
    owner,
    spender,
    token: knownToken ?? {
      symbol: 'UNKNOWN',
      contractAddress: tokenAddress,
      decimals: 18,
      chainId,
      isStablecoin: false,
    },
    maxAmount: remaining, // On-chain we only see the remaining allowance
    spent: '0', // Not tracked on-chain
    remaining,
  };
}

/**
 * Spend from a delegation — calls ERC-20 transferFrom.
 *
 * Requires that the caller's wallet has been approved as spender by the owner.
 *
 * @param tokenAddress - ERC-20 contract address
 * @param owner - Address that granted the allowance
 * @param recipient - Address to receive the tokens
 * @param amount - Amount to transfer (decimal string)
 * @param config - Wallet and chain configuration
 * @returns Transaction hash and block number
 */
export async function spendFromDelegation(
  tokenAddress: string,
  owner: string,
  recipient: string,
  amount: string,
  config?: OnchainConfig,
): Promise<{ txHash: string; blockNumber: number }> {
  validateEthAddress(tokenAddress);
  validateEthAddress(owner);
  validateEthAddress(recipient);
  return transferFromERC20(tokenAddress, owner, recipient, amount, config);
}

// ---------------------------------------------------------------------------
// Handoff link generation
// ---------------------------------------------------------------------------

/**
 * Generate a handoff link for creating a spending limit.
 *
 * @param params - Token symbol, amount, and optional chain ID
 * @param agentAddress - The agent wallet that will be the spender
 * @returns Handoff URL string
 */
export function createSpendingLimitHandoff(
  params: { tokenSymbol: string; amount: string; chainId?: number },
  agentAddress: string,
): string {
  const chainId = params.chainId ?? 56;
  const token = getToken(params.tokenSymbol, chainId);
  if (!token) {
    throw new Error(
      `Unknown token: ${params.tokenSymbol} on chain ${chainId}`,
    );
  }

  return generateDelegationLink(
    token.contractAddress,
    agentAddress,
    params.amount,
  );
}

// ---------------------------------------------------------------------------
// Storage-backed delegation metadata
// ---------------------------------------------------------------------------

const DELEGATIONS_INDEX_KEY = 'delegations';

function delegationKey(owner: string, symbol: string, spender: string): string {
  return `delegation_${owner}_${symbol}_${spender}`;
}

/**
 * Record a delegation in agent storage for tracking purposes.
 */
export async function recordDelegation(
  agentAddress: string,
  delegation: SpendingLimit,
  apiKey?: string,
): Promise<void> {
  const key = delegationKey(delegation.owner, delegation.token.symbol, delegation.spender);
  await putStorage(agentAddress, key, JSON.stringify(delegation), apiKey);

  // Update index
  const indexRaw = await getStorage(agentAddress, DELEGATIONS_INDEX_KEY, apiKey);
  const index: string[] = indexRaw ? JSON.parse(indexRaw) : [];
  if (!index.includes(key)) {
    index.push(key);
    await putStorage(agentAddress, DELEGATIONS_INDEX_KEY, JSON.stringify(index), apiKey);
  }
}

/**
 * List all recorded delegations for an agent.
 */
export async function listDelegations(
  agentAddress: string,
  apiKey?: string,
): Promise<SpendingLimit[]> {
  const indexRaw = await getStorage(agentAddress, DELEGATIONS_INDEX_KEY, apiKey);
  if (!indexRaw) return [];

  const index: string[] = JSON.parse(indexRaw);
  const delegations: SpendingLimit[] = [];

  for (const key of index) {
    const raw = await getStorage(agentAddress, key, apiKey);
    if (raw) {
      try {
        delegations.push(JSON.parse(raw) as SpendingLimit);
      } catch {
        // skip invalid entries
      }
    }
  }

  return delegations;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Find a known token by contract address and chain. */
function findTokenByAddress(address: string, chainId: number): PaymentToken | undefined {
  return KNOWN_TOKENS.find(
    (t) =>
      t.contractAddress.toLowerCase() === address.toLowerCase() &&
      t.chainId === chainId,
  );
}
