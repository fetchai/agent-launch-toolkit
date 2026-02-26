/**
 * agentlaunch-sdk — On-chain trading operations
 *
 * Direct buy/sell execution on bonding curve token contracts via ethers.js.
 * ethers is an optional peer dependency — only needed if you call these functions.
 *
 * Reverse-engineered contract ABI:
 *   buyTokens(address buyer, uint256 fetAmount, uint256 minTokensOut) — 0xd2395dcd
 *   sell(uint256 tokenAmount) — 0x10d0ffdd
 *   fetToken() — 0x3ce59faa (returns FET ERC-20 address stored in contract)
 *
 * Buy flow:  Approve FET spend → call buyTokens → receive tokens
 * Sell flow: Call sell on token contract → receive FET (no approval needed)
 */

import { calculateBuy, calculateSell } from './market.js';
import type { AgentLaunchClient } from './client.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Configuration for on-chain trading operations. */
export interface OnchainConfig {
  /** Wallet private key. Falls back to WALLET_PRIVATE_KEY env var. */
  privateKey?: string;
  /** Chain ID (97 = BSC Testnet, 56 = BSC Mainnet). Default: 97. */
  chainId?: number;
  /** Slippage tolerance as a percentage (0-100). Default: 5. */
  slippagePercent?: number;
  /** Optional AgentLaunchClient for API calls (calculateBuy/Sell). */
  client?: AgentLaunchClient;
}

/** Result from a successful buy transaction. */
export interface BuyResult {
  /** Transaction hash. */
  txHash: string;
  /** Tokens received (from API estimate — actual may differ slightly). */
  tokensReceived: string;
  /** FET amount spent. */
  fetSpent: string;
  /** Protocol fee in FET (2%, 100% to treasury). */
  fee: string;
  /** Price impact percentage. */
  priceImpact: number;
  /** Whether FET approval was needed and executed. */
  approvalTxHash: string | null;
  /** Block number of the buy transaction. */
  blockNumber: number;
}

/** Result from a successful sell transaction. */
export interface SellResult {
  /** Transaction hash. */
  txHash: string;
  /** FET received (from API estimate — actual may differ slightly). */
  fetReceived: string;
  /** Tokens sold. */
  tokensSold: string;
  /** Protocol fee in FET (2%, 100% to treasury). */
  fee: string;
  /** Price impact percentage. */
  priceImpact: number;
  /** Block number of the sell transaction. */
  blockNumber: number;
}

/** Wallet balance snapshot. */
export interface WalletBalances {
  /** Wallet address. */
  wallet: string;
  /** BNB balance (native gas token) as a decimal string. */
  bnb: string;
  /** FET balance as a decimal string. */
  fet: string;
  /** Token balance as a decimal string. */
  token: string;
  /** Token contract address queried. */
  tokenAddress: string;
  /** Chain ID. */
  chainId: number;
}

/** Chain-specific configuration. */
export interface ChainConfig {
  /** Chain ID. */
  chainId: number;
  /** Human-readable name. */
  name: string;
  /** JSON-RPC URL. */
  rpcUrl: string;
  /** FET token contract address on this chain. */
  fetAddress: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default slippage tolerance (5%). */
export const DEFAULT_SLIPPAGE_PERCENT = 5;

/** Minimal ABI fragments for FETAgentCoin bonding curve token contract. */
export const TOKEN_CONTRACT_ABI = [
  // buyTokens(buyer, slippageAmount [min tokens out], _buyAmount [FET to spend])
  'function buyTokens(address buyer, uint256 slippageAmount, uint256 _buyAmount) external',
  'function sellTokens(uint256 tokenAmount) external',
  'function FET_TOKEN() external view returns (address)',
  'function balanceOf(address account) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)',
  'function name() external view returns (string)',
  'function calculateTokensReceived(uint256 fetAmount) external view returns (uint256)',
  'function calculateFetAmount(address user, uint256 tokenAmount) external view returns (uint256)',
];

/** Minimal ABI for ERC-20 (FET token approve + allowance + balanceOf). */
export const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)',
];

/** Supported chain configurations. */
export const CHAIN_CONFIGS: Record<number, ChainConfig> = {
  97: {
    chainId: 97,
    name: 'BSC Testnet',
    rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545',
    fetAddress: '0x304ddf3eE068c53514f782e2341B71A80c8aE3C7',
  },
  56: {
    chainId: 56,
    name: 'BSC Mainnet',
    rpcUrl: 'https://bsc-dataseed1.binance.org',
    fetAddress: '0xBd5df99ABe0E2b1e86BE5eC0039d1e24de28Fe87',
  },
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Dynamic import of ethers — fails with a clear message if not installed. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadEthers(): Promise<any> {
  try {
    return await import('ethers');
  } catch {
    throw new Error(
      'ethers is required for on-chain trading but not installed. ' +
      'Install it with: npm install ethers@^6',
    );
  }
}

/** Resolve private key from config or WALLET_PRIVATE_KEY env var. */
function resolvePrivateKey(config?: OnchainConfig): string {
  const key = config?.privateKey ?? process.env['WALLET_PRIVATE_KEY'];
  if (!key) {
    throw new Error(
      'No wallet private key found. Set WALLET_PRIVATE_KEY in your environment ' +
      'or pass privateKey in the config.',
    );
  }
  return key.startsWith('0x') ? key : `0x${key}`;
}

/** Resolve chain configuration from chain ID. */
function resolveChain(config?: OnchainConfig): ChainConfig {
  const chainId = config?.chainId ?? Number(process.env['CHAIN_ID'] ?? 97);
  const chain = CHAIN_CONFIGS[chainId];
  if (!chain) {
    throw new Error(
      `Unsupported chain ID: ${chainId}. Supported: ${Object.keys(CHAIN_CONFIGS).join(', ')}`,
    );
  }
  return chain;
}

// ---------------------------------------------------------------------------
// buyTokens
// ---------------------------------------------------------------------------

/**
 * Execute a buy on a bonding curve token contract.
 *
 * Flow:
 * 1. Connect to chain with private key
 * 2. Read FET address from token contract (fallback to known address)
 * 3. Check FET balance (fail fast if insufficient)
 * 4. Approve FET spend if allowance is insufficient
 * 5. Call API calculateBuy to get expected tokens → compute minTokensOut with slippage
 * 6. Call buyTokens() on the token contract
 *
 * @param tokenAddress - Token contract address (0x...)
 * @param fetAmount - Amount of FET to spend (decimal string, e.g. "10")
 * @param config - Optional configuration (private key, chain, slippage)
 */
export async function buyTokens(
  tokenAddress: string,
  fetAmount: string,
  config?: OnchainConfig,
): Promise<BuyResult> {
  const ethers = await loadEthers();
  const privateKey = resolvePrivateKey(config);
  const chain = resolveChain(config);
  const slippage = config?.slippagePercent ?? DEFAULT_SLIPPAGE_PERCENT;

  // Connect
  const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  // Token contract
  const tokenContract = new ethers.Contract(tokenAddress, TOKEN_CONTRACT_ABI, wallet);

  // Read FET address from contract (fallback to known address)
  let fetAddress: string;
  try {
    fetAddress = await tokenContract.FET_TOKEN();
  } catch {
    fetAddress = chain.fetAddress;
  }

  // FET contract
  const fetContract = new ethers.Contract(fetAddress, ERC20_ABI, wallet);

  // Parse amount to wei (FET has 18 decimals)
  const fetAmountWei = ethers.parseEther(fetAmount);

  // Check FET balance
  const fetBalance = await fetContract.balanceOf(wallet.address);
  if (fetBalance < fetAmountWei) {
    const balanceFormatted = ethers.formatEther(fetBalance);
    throw new Error(
      `Insufficient FET balance. Have: ${balanceFormatted} FET, need: ${fetAmount} FET`,
    );
  }

  // Approve FET if needed (exact amount, not MAX_UINT)
  let approvalTxHash: string | null = null;
  const currentAllowance = await fetContract.allowance(wallet.address, tokenAddress);
  if (currentAllowance < fetAmountWei) {
    // Some ERC-20s require resetting to 0 before setting a new allowance
    if (currentAllowance > 0n) {
      const resetTx = await fetContract.approve(tokenAddress, 0);
      await resetTx.wait(1);
    }
    const approveTx = await fetContract.approve(tokenAddress, fetAmountWei);
    const approveReceipt = await approveTx.wait(1);
    approvalTxHash = approveReceipt.hash;

    // Verify allowance was actually set (BSC testnet nodes can lag)
    let verified = false;
    for (let i = 0; i < 5; i++) {
      const newAllowance = await fetContract.allowance(wallet.address, tokenAddress);
      if (newAllowance >= fetAmountWei) { verified = true; break; }
      await new Promise(r => setTimeout(r, 2000));
    }
    if (!verified) {
      throw new Error('FET approval transaction mined but allowance not reflected. Try again.');
    }
  }

  // Calculate expected tokens via API
  const calcResult = await calculateBuy(tokenAddress, fetAmount, config?.client);
  const tokensReceivedRaw = calcResult.tokensReceived;

  // Compute minTokensOut with slippage
  const tokensExpected = ethers.parseEther(tokensReceivedRaw);
  const minTokensOut = tokensExpected * BigInt(Math.floor((100 - slippage) * 100)) / BigInt(10000);

  // Execute buy: buyTokens(buyer, slippageAmount, _buyAmount)
  // Contract signature: buyTokens(address buyer, uint256 slippageAmount, uint256 _buyAmount)
  const buyTx = await tokenContract.buyTokens(wallet.address, minTokensOut, fetAmountWei);
  const receipt = await buyTx.wait();

  return {
    txHash: receipt.hash,
    tokensReceived: tokensReceivedRaw,
    fetSpent: fetAmount,
    fee: calcResult.fee,
    priceImpact: calcResult.priceImpact,
    approvalTxHash,
    blockNumber: receipt.blockNumber,
  };
}

// ---------------------------------------------------------------------------
// sellTokens
// ---------------------------------------------------------------------------

/**
 * Execute a sell on a bonding curve token contract.
 *
 * Flow:
 * 1. Connect to chain with private key
 * 2. Check token balance (fail fast if insufficient)
 * 3. Call sell() on the token contract
 *
 * @param tokenAddress - Token contract address (0x...)
 * @param tokenAmount - Amount of tokens to sell (decimal string, e.g. "100000")
 * @param config - Optional configuration (private key, chain)
 */
export async function sellTokens(
  tokenAddress: string,
  tokenAmount: string,
  config?: OnchainConfig,
): Promise<SellResult> {
  const ethers = await loadEthers();
  const privateKey = resolvePrivateKey(config);
  const chain = resolveChain(config);

  // Connect
  const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  // Token contract
  const tokenContract = new ethers.Contract(tokenAddress, TOKEN_CONTRACT_ABI, wallet);

  // Parse amount to wei (tokens have 18 decimals)
  const tokenAmountWei = ethers.parseEther(tokenAmount);

  // Check token balance
  const tokenBalance = await tokenContract.balanceOf(wallet.address);
  if (tokenBalance < tokenAmountWei) {
    const balanceFormatted = ethers.formatEther(tokenBalance);
    throw new Error(
      `Insufficient token balance. Have: ${balanceFormatted}, need: ${tokenAmount}`,
    );
  }

  // Calculate expected FET via API (for return value)
  const calcResult = await calculateSell(tokenAddress, tokenAmount, config?.client);

  // Execute sell
  const sellTx = await tokenContract.sellTokens(tokenAmountWei);
  const receipt = await sellTx.wait();

  return {
    txHash: receipt.hash,
    fetReceived: calcResult.fetReceived,
    tokensSold: tokenAmount,
    fee: calcResult.fee,
    priceImpact: calcResult.priceImpact,
    blockNumber: receipt.blockNumber,
  };
}

// ---------------------------------------------------------------------------
// getWalletBalances
// ---------------------------------------------------------------------------

/**
 * Query wallet balances: BNB (gas), FET, and a specific token.
 *
 * @param tokenAddress - Token contract address to check balance of
 * @param config - Optional configuration (private key, chain)
 */
export async function getWalletBalances(
  tokenAddress: string,
  config?: OnchainConfig,
): Promise<WalletBalances> {
  const ethers = await loadEthers();
  const privateKey = resolvePrivateKey(config);
  const chain = resolveChain(config);

  const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  // Read FET address from token contract (fallback to known)
  const tokenContract = new ethers.Contract(tokenAddress, TOKEN_CONTRACT_ABI, provider);
  let fetAddress: string;
  try {
    fetAddress = await tokenContract.FET_TOKEN();
  } catch {
    fetAddress = chain.fetAddress;
  }

  const fetContract = new ethers.Contract(fetAddress, ERC20_ABI, provider);

  // Parallel balance queries
  const [bnbBalance, fetBalance, tokenBalance] = await Promise.all([
    provider.getBalance(wallet.address),
    fetContract.balanceOf(wallet.address),
    tokenContract.balanceOf(wallet.address),
  ]);

  return {
    wallet: wallet.address,
    bnb: ethers.formatEther(bnbBalance),
    fet: ethers.formatEther(fetBalance),
    token: ethers.formatEther(tokenBalance),
    tokenAddress,
    chainId: chain.chainId,
  };
}
