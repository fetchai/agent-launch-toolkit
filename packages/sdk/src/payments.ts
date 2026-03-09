/**
 * agentlaunch-sdk — Multi-token payment operations
 *
 * Token registry, ERC-20 balance queries, transfers, and invoice management
 * via Agentverse storage.
 *
 * Uses standard ERC-20 patterns — no custom smart contracts required.
 * ethers is an optional peer dependency — only needed for on-chain calls.
 */

import type {
  PaymentToken,
  TokenAmount,
  Invoice,
  InvoiceStatus,
} from './types.js';
import { getStorage, putStorage } from './storage.js';
import { CHAIN_CONFIGS, ERC20_ABI } from './onchain.js';
import { validateEthAddress } from './handoff.js';

// ---------------------------------------------------------------------------
// Token Registry
// ---------------------------------------------------------------------------

/** Well-known token addresses per chain. */
export const KNOWN_TOKENS: PaymentToken[] = [
  // BSC Testnet (97)
  {
    symbol: 'FET',
    contractAddress: '0x304ddf3eE068c53514f782e2341B71A80c8aE3C7',
    decimals: 18,
    chainId: 97,
    isStablecoin: false,
  },
  {
    symbol: 'USDC',
    contractAddress: '0x64544969ed7EBf5f083679233325356EbE738930',
    decimals: 18,
    chainId: 97,
    isStablecoin: true,
  },
  // BSC Mainnet (56)
  {
    symbol: 'FET',
    contractAddress: '0xBd5df99ABe0E2b1e86BE5eC0039d1e24de28Fe87',
    decimals: 18,
    chainId: 56,
    isStablecoin: false,
  },
  {
    symbol: 'USDC',
    contractAddress: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    decimals: 18,
    chainId: 56,
    isStablecoin: true,
  },
];

/**
 * Look up a known token by symbol and chain.
 *
 * @param symbol - Token symbol (e.g. "FET", "USDC")
 * @param chainId - Chain ID (default: 97)
 * @returns PaymentToken or undefined if not found
 */
export function getToken(symbol: string, chainId = 97): PaymentToken | undefined {
  return KNOWN_TOKENS.find(
    (t) => t.symbol.toUpperCase() === symbol.toUpperCase() && t.chainId === chainId,
  );
}

/**
 * List all known tokens for a chain.
 */
export function getTokensForChain(chainId = 97): PaymentToken[] {
  return KNOWN_TOKENS.filter((t) => t.chainId === chainId);
}

// ---------------------------------------------------------------------------
// On-chain balance queries (requires ethers)
// ---------------------------------------------------------------------------

/** Dynamic import of ethers. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadEthers(): Promise<any> {
  try {
    return await import('ethers');
  } catch {
    throw new Error(
      'ethers is required for on-chain operations but not installed. ' +
      'Install it with: npm install ethers@^6',
    );
  }
}

/**
 * Get balance of a specific ERC-20 token for a wallet.
 *
 * @param tokenAddress - ERC-20 contract address
 * @param walletAddress - Wallet to check
 * @param chainId - Chain ID (default: 97)
 * @returns Balance as a decimal string
 */
export async function getTokenBalance(
  tokenAddress: string,
  walletAddress: string,
  chainId = 97,
): Promise<string> {
  validateEthAddress(tokenAddress);
  validateEthAddress(walletAddress);
  const ethers = await loadEthers();
  const chain = CHAIN_CONFIGS[chainId];
  if (!chain) throw new Error(`Unsupported chain ID: ${chainId}`);

  const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
  const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
  const balance = await contract.balanceOf(walletAddress);

  // Use token decimals if available, otherwise query on-chain
  const knownToken = KNOWN_TOKENS.find(
    (t) => t.contractAddress.toLowerCase() === tokenAddress.toLowerCase() && t.chainId === chainId,
  );
  const decimals = knownToken?.decimals ?? 18;
  return ethers.formatUnits(balance, decimals);
}

/**
 * Get balances for multiple tokens at once.
 *
 * @param walletAddress - Wallet to check
 * @param tokenSymbols - Array of token symbols (default: all known tokens for chain)
 * @param chainId - Chain ID (default: 97)
 * @returns Record of symbol -> balance string
 */
export async function getMultiTokenBalances(
  walletAddress: string,
  tokenSymbols?: string[],
  chainId = 97,
): Promise<Record<string, string>> {
  validateEthAddress(walletAddress);
  const ethers = await loadEthers();
  const chain = CHAIN_CONFIGS[chainId];
  if (!chain) throw new Error(`Unsupported chain ID: ${chainId}`);

  const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
  const tokens = tokenSymbols
    ? tokenSymbols
        .map((s) => getToken(s, chainId))
        .filter((t): t is PaymentToken => t !== undefined)
    : getTokensForChain(chainId);

  // Query BNB + all tokens in parallel
  const [bnbBalance, ...tokenBalances] = await Promise.all([
    provider.getBalance(walletAddress),
    ...tokens.map(async (t) => {
      const contract = new ethers.Contract(t.contractAddress, ERC20_ABI, provider);
      return contract.balanceOf(walletAddress);
    }),
  ]);

  const result: Record<string, string> = {
    BNB: ethers.formatEther(bnbBalance), // BNB is always 18 decimals
  };

  tokens.forEach((t, i) => {
    result[t.symbol] = ethers.formatUnits(tokenBalances[i], t.decimals);
  });

  return result;
}

/**
 * Transfer an ERC-20 token to a recipient.
 *
 * @param tokenAddress - ERC-20 contract address
 * @param to - Recipient address
 * @param amount - Amount as decimal string
 * @param privateKey - Sender's private key
 * @param chainId - Chain ID (default: 97)
 * @returns Transaction hash
 */
export async function transferToken(
  tokenAddress: string,
  to: string,
  amount: string,
  privateKey: string,
  chainId = 97,
): Promise<{ txHash: string; blockNumber: number }> {
  validateEthAddress(tokenAddress);
  validateEthAddress(to);
  const ethers = await loadEthers();
  const chain = CHAIN_CONFIGS[chainId];
  if (!chain) throw new Error(`Unsupported chain ID: ${chainId}`);

  const key = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
  const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
  const wallet = new ethers.Wallet(key, provider);

  // ERC20_ABI already includes transfer function - no need to duplicate
  const contract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);

  // Use token decimals if known, otherwise default to 18
  const knownToken = KNOWN_TOKENS.find(
    (t) => t.contractAddress.toLowerCase() === tokenAddress.toLowerCase() && t.chainId === chainId,
  );
  const decimals = knownToken?.decimals ?? 18;
  const amountWei = ethers.parseUnits(amount, decimals);

  const tx = await contract.transfer(to, amountWei);
  const receipt = await tx.wait();

  return { txHash: receipt.hash, blockNumber: receipt.blockNumber };
}

// ---------------------------------------------------------------------------
// Invoice CRUD (Agentverse storage-backed)
// ---------------------------------------------------------------------------

const INVOICE_INDEX_KEY = 'invoice_index';

function invoiceKey(id: string): string {
  return `invoice_${id}`;
}

/**
 * Create an invoice in agent storage.
 */
export async function createInvoice(
  agentAddress: string,
  invoice: Omit<Invoice, 'createdAt' | 'updatedAt' | 'status'>,
  apiKey?: string,
): Promise<Invoice> {
  const now = new Date().toISOString();
  const full: Invoice = {
    ...invoice,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };

  // Store invoice
  await putStorage(agentAddress, invoiceKey(invoice.id), JSON.stringify(full), apiKey);

  // Update index
  const indexRaw = await getStorage(agentAddress, INVOICE_INDEX_KEY, apiKey);
  const index: string[] = indexRaw ? JSON.parse(indexRaw) : [];
  if (!index.includes(invoice.id)) {
    index.push(invoice.id);
    await putStorage(agentAddress, INVOICE_INDEX_KEY, JSON.stringify(index), apiKey);
  }

  return full;
}

/**
 * Get an invoice by ID from agent storage.
 */
export async function getInvoice(
  agentAddress: string,
  invoiceId: string,
  apiKey?: string,
): Promise<Invoice | null> {
  const raw = await getStorage(agentAddress, invoiceKey(invoiceId), apiKey);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Invoice;
  } catch {
    return null;
  }
}

/**
 * List invoices for an agent, optionally filtered by status.
 */
export async function listInvoices(
  agentAddress: string,
  status?: InvoiceStatus,
  apiKey?: string,
): Promise<Invoice[]> {
  const indexRaw = await getStorage(agentAddress, INVOICE_INDEX_KEY, apiKey);
  if (!indexRaw) return [];

  const index: string[] = JSON.parse(indexRaw);
  const invoices: Invoice[] = [];

  for (const id of index) {
    const inv = await getInvoice(agentAddress, id, apiKey);
    if (inv && (!status || inv.status === status)) {
      invoices.push(inv);
    }
  }

  return invoices;
}

/**
 * Update the status of an invoice.
 */
export async function updateInvoiceStatus(
  agentAddress: string,
  invoiceId: string,
  newStatus: InvoiceStatus,
  txHash?: string,
  apiKey?: string,
): Promise<Invoice | null> {
  const inv = await getInvoice(agentAddress, invoiceId, apiKey);
  if (!inv) return null;

  inv.status = newStatus;
  inv.updatedAt = new Date().toISOString();
  if (txHash) inv.txHash = txHash;

  await putStorage(agentAddress, invoiceKey(invoiceId), JSON.stringify(inv), apiKey);
  return inv;
}
