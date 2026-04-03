/**
 * agentlaunch-sdk — Wallet Authentication
 *
 * W-1: Authenticate with a wallet private key to obtain an Agentverse API key.
 *
 * This module implements the Fetch.ai wallet authentication flow:
 * 1. Derive Cosmos address from private key
 * 2. Request challenge from accounts.fetch.ai
 * 3. Sign challenge in ADR-036 format
 * 4. Verify signature and get auth code
 * 5. Exchange code for API key
 *
 * @example
 * ```ts
 * import { authenticateWithWallet } from 'agentlaunch-sdk';
 *
 * const result = await authenticateWithWallet(process.env.WALLET_PRIVATE_KEY);
 * console.log('API Key:', result.apiKey);
 * console.log('Expires:', new Date(result.expiresAt));
 * ```
 */

import { AgentLaunchError } from './types.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Configuration for wallet authentication. */
export interface WalletAuthConfig {
  /** Hex-encoded private key (with or without 0x prefix). */
  privateKey: string;
  /** OAuth client ID. Defaults to 'agentverse'. */
  clientId?: string;
  /** OAuth scope. Defaults to 'av'. */
  scope?: string;
  /** Expiration time in seconds. Defaults to 30 days (2592000). */
  expiresIn?: number;
  /** Accounts API base URL. Defaults to 'https://accounts.fetch.ai/v1'. */
  accountsApiUrl?: string;
}

/** Result of successful wallet authentication. */
export interface WalletAuthResult {
  /** The Agentverse API key (av-...). */
  apiKey: string;
  /** Unix timestamp (ms) when the key expires. */
  expiresAt: number;
  /** Cosmos address derived from the private key (fetch1...). */
  cosmosAddress: string;
}

// ---------------------------------------------------------------------------
// Internal types for API responses
// ---------------------------------------------------------------------------

interface ChallengeResponse {
  challenge: string;
  nonce: string;
}

interface VerifyResponse {
  code: string;
}

interface TokenResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
}

// ---------------------------------------------------------------------------
// Crypto helpers (conditional imports)
// ---------------------------------------------------------------------------

import { createRequire } from 'module';

/** Check if @cosmjs/crypto is available at runtime. Works in both CJS and ESM. */
function hasCosmjsCrypto(): boolean {
  try {
    // Use createRequire for ESM compatibility
    const require = createRequire(import.meta.url);
    require.resolve('@cosmjs/crypto');
    return true;
  } catch {
    return false;
  }
}

/** Check if bech32 is available at runtime. Works in both CJS and ESM. */
function hasBech32(): boolean {
  try {
    const require = createRequire(import.meta.url);
    require.resolve('bech32');
    return true;
  } catch {
    return false;
  }
}

/**
 * Canonical JSON stringify with sorted keys and compact separators.
 * Matches Python: json.dumps(obj, sort_keys=True, separators=(",", ":"))
 */
function canonicalStringify(obj: unknown): string {
  if (typeof obj !== 'object' || obj === null) {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalStringify).join(',') + ']';
  }
  const keys = Object.keys(obj as Record<string, unknown>).sort();
  const pairs = keys.map(k => `"${k}":${canonicalStringify((obj as Record<string, unknown>)[k])}`);
  return '{' + pairs.join(',') + '}';
}

/**
 * Build the ADR-036 sign document for arbitrary data signing.
 */
function buildSignDoc(data: string, signerAddress: string): object {
  return {
    chain_id: '',
    account_number: '0',
    sequence: '0',
    fee: {
      gas: '0',
      amount: [],
    },
    msgs: [
      {
        type: 'sign/MsgSignData',
        value: {
          signer: signerAddress,
          data: Buffer.from(data).toString('base64'),
        },
      },
    ],
    memo: '',
  };
}

// ---------------------------------------------------------------------------
// Main authentication function
// ---------------------------------------------------------------------------

const ACCOUNTS_API_URL = 'https://accounts.fetch.ai/v1';
const DEFAULT_CLIENT_ID = 'agentverse';
const DEFAULT_SCOPE = 'av';
const DEFAULT_EXPIRES_IN = 2592000; // 30 days

/**
 * Authenticate using a wallet private key to obtain an Agentverse API key.
 *
 * This implements the Fetch.ai wallet authentication flow:
 * 1. Derive Cosmos address from private key: ripemd160(sha256(compressed_pubkey)) -> bech32
 * 2. Request challenge from accounts.fetch.ai
 * 3. Sign challenge in ADR-036 format with 64-byte R||S signature
 * 4. Verify signature and get auth code
 * 5. Exchange code for API key
 *
 * Requires optional peer dependencies:
 * - @cosmjs/crypto for secp256k1 operations
 * - bech32 for address encoding
 *
 * @param config Configuration object or just the private key string
 * @returns The API key, expiration timestamp, and derived Cosmos address
 *
 * @example
 * ```ts
 * // Simple usage
 * const result = await authenticateWithWallet(process.env.WALLET_PRIVATE_KEY);
 *
 * // With options
 * const result = await authenticateWithWallet({
 *   privateKey: process.env.WALLET_PRIVATE_KEY,
 *   expiresIn: 86400, // 1 day
 * });
 * ```
 */
export async function authenticateWithWallet(
  config: string | WalletAuthConfig,
): Promise<WalletAuthResult> {
  // Normalize config
  const opts: WalletAuthConfig = typeof config === 'string' ? { privateKey: config } : config;

  const {
    privateKey,
    clientId = DEFAULT_CLIENT_ID,
    scope = DEFAULT_SCOPE,
    expiresIn = DEFAULT_EXPIRES_IN,
    accountsApiUrl = ACCOUNTS_API_URL,
  } = opts;

  if (!privateKey) {
    throw new AgentLaunchError(
      'Private key is required for wallet authentication.',
      0,
    );
  }

  // Check for required dependencies
  if (!hasCosmjsCrypto()) {
    throw new AgentLaunchError(
      'Wallet authentication requires @cosmjs/crypto. ' +
      'Install it with: npm install @cosmjs/crypto',
      0,
    );
  }

  if (!hasBech32()) {
    throw new AgentLaunchError(
      'Wallet authentication requires bech32. ' +
      'Install it with: npm install bech32',
      0,
    );
  }

  // Dynamic imports (verified available above)
  const { Secp256k1, sha256 } = await import('@cosmjs/crypto');
  const { bech32 } = await import('bech32');
  const crypto = await import('crypto');

  // Parse private key
  const privateKeyHex = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
  if (!/^[0-9a-fA-F]{64}$/.test(privateKeyHex)) {
    throw new AgentLaunchError(
      'Invalid private key format. Expected 32-byte hex string (64 characters).',
      0,
    );
  }
  const privateKeyBytes = Buffer.from(privateKeyHex, 'hex');

  // Derive public key
  const { pubkey: pubkeyBytes } = await Secp256k1.makeKeypair(privateKeyBytes);
  const compressedPubkey = Secp256k1.compressPubkey(pubkeyBytes);

  // Derive Cosmos address: ripemd160(sha256(compressed_pubkey)) -> bech32
  const pubkeyHash = crypto.createHash('sha256').update(compressedPubkey).digest();
  const addressBytes = crypto.createHash('ripemd160').update(pubkeyHash).digest();
  const cosmosAddress = bech32.encode('fetch', bech32.toWords(addressBytes));

  // Step 1: Get challenge
  const challengeRes = await fetch(`${accountsApiUrl}/auth/login/wallet/challenge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address: cosmosAddress, client_id: clientId, scope }),
  });

  if (!challengeRes.ok) {
    const errorText = await challengeRes.text().catch(() => '');
    throw new AgentLaunchError(
      `Failed to get authentication challenge: ${challengeRes.status} ${challengeRes.statusText}` +
      (errorText ? ` — ${errorText}` : ''),
      challengeRes.status,
    );
  }

  const { challenge, nonce } = (await challengeRes.json()) as ChallengeResponse;

  // Step 2: Sign the challenge in ADR-036 format
  const signDoc = buildSignDoc(challenge, cosmosAddress);
  const rawSignDoc = canonicalStringify(signDoc);
  const docBytes = Buffer.from(rawSignDoc);

  // Sign with sha256 hash and secp256k1
  const hash = sha256(docBytes);
  const signature = await Secp256k1.createSignature(hash, privateKeyBytes);

  // Get 64-byte R||S signature (no recovery byte)
  const fullSig = signature.toFixedLength();
  const rs = fullSig.slice(0, 64);
  const signatureBase64 = Buffer.from(rs).toString('base64');

  // Step 3: Verify signature and get auth code
  const verifyPayload = {
    address: cosmosAddress,
    public_key: {
      value: Buffer.from(compressedPubkey).toString('base64'),
      type: 'tendermint/PubKeySecp256k1',
    },
    nonce,
    challenge,
    signature: signatureBase64,
    client_id: clientId,
    scope,
  };

  const verifyRes = await fetch(`${accountsApiUrl}/auth/login/wallet/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(verifyPayload),
  });

  if (!verifyRes.ok) {
    const errorText = await verifyRes.text().catch(() => '');
    throw new AgentLaunchError(
      `Signature verification failed: ${verifyRes.status} ${verifyRes.statusText}` +
      (errorText ? ` — ${errorText}` : ''),
      verifyRes.status,
    );
  }

  const { code } = (await verifyRes.json()) as VerifyResponse;

  // Step 4: Exchange code for API key
  const tokenPayload = {
    grant_type: 'api_key',
    client_id: clientId,
    code,
    scope,
    expires_in: expiresIn,
  };

  const tokenRes = await fetch(`${accountsApiUrl}/tokens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tokenPayload),
  });

  if (!tokenRes.ok) {
    const errorText = await tokenRes.text().catch(() => '');
    throw new AgentLaunchError(
      `Failed to exchange code for API key: ${tokenRes.status} ${tokenRes.statusText}` +
      (errorText ? ` — ${errorText}` : ''),
      tokenRes.status,
    );
  }

  const tokenData = (await tokenRes.json()) as TokenResponse;

  if (!tokenData.access_token) {
    throw new AgentLaunchError(
      'API key exchange succeeded but no access_token was returned.',
      0,
    );
  }

  return {
    apiKey: tokenData.access_token,
    expiresAt: Date.now() + (tokenData.expires_in ?? expiresIn) * 1000,
    cosmosAddress,
  };
}

/**
 * Derive the Cosmos (Fetch) address from a private key without authenticating.
 *
 * Useful for getting the wallet address before deciding to authenticate.
 *
 * @param privateKey Hex-encoded private key (with or without 0x prefix)
 * @returns The Cosmos address (fetch1...)
 *
 * @example
 * ```ts
 * const address = await deriveCosmosAddress(process.env.WALLET_PRIVATE_KEY);
 * console.log('Wallet address:', address);
 * ```
 */
export async function deriveCosmosAddress(privateKey: string): Promise<string> {
  if (!privateKey) {
    throw new AgentLaunchError('Private key is required.', 0);
  }

  if (!hasCosmjsCrypto()) {
    throw new AgentLaunchError(
      'Address derivation requires @cosmjs/crypto. ' +
      'Install it with: npm install @cosmjs/crypto',
      0,
    );
  }

  if (!hasBech32()) {
    throw new AgentLaunchError(
      'Address derivation requires bech32. ' +
      'Install it with: npm install bech32',
      0,
    );
  }

  const { Secp256k1 } = await import('@cosmjs/crypto');
  const { bech32 } = await import('bech32');
  const crypto = await import('crypto');

  const privateKeyHex = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
  if (!/^[0-9a-fA-F]{64}$/.test(privateKeyHex)) {
    throw new AgentLaunchError(
      'Invalid private key format. Expected 32-byte hex string (64 characters).',
      0,
    );
  }
  const privateKeyBytes = Buffer.from(privateKeyHex, 'hex');

  const { pubkey: pubkeyBytes } = await Secp256k1.makeKeypair(privateKeyBytes);
  const compressedPubkey = Secp256k1.compressPubkey(pubkeyBytes);

  const pubkeyHash = crypto.createHash('sha256').update(compressedPubkey).digest();
  const addressBytes = crypto.createHash('ripemd160').update(pubkeyHash).digest();

  return bech32.encode('fetch', bech32.toWords(addressBytes));
}

/** Result of generating a wallet and authenticating. */
export interface GenerateWalletResult extends WalletAuthResult {
  /** The generated private key (hex with 0x prefix). */
  privateKey: string;
  /** The EVM address (0x...). */
  evmAddress: string;
}

/**
 * Generate a new wallet and authenticate to obtain an Agentverse API key.
 *
 * This is the zero-to-hero function: creates a wallet from scratch and
 * returns everything needed to start building agents.
 *
 * @param expiresIn Optional expiration time in seconds (default: 30 days)
 * @returns Private key, EVM address, Cosmos address, and API key
 *
 * @example
 * ```ts
 * const wallet = await generateWalletAndAuthenticate();
 * console.log('Private Key:', wallet.privateKey);
 * console.log('EVM Address:', wallet.evmAddress);
 * console.log('Cosmos Address:', wallet.cosmosAddress);
 * console.log('API Key:', wallet.apiKey);
 *
 * // Save to .env
 * fs.writeFileSync('.env', `WALLET_PRIVATE_KEY=${wallet.privateKey}\nAGENTVERSE_API_KEY=${wallet.apiKey}\n`);
 * ```
 */
export async function generateWalletAndAuthenticate(expiresIn?: number): Promise<GenerateWalletResult> {
  // Dynamic import ethers for wallet generation
  let ethers;
  try {
    ethers = await import('ethers');
  } catch {
    throw new AgentLaunchError(
      'Wallet generation requires ethers. Install it with: npm install ethers',
      0,
    );
  }

  // Generate random wallet
  const wallet = ethers.Wallet.createRandom();
  const privateKey = wallet.privateKey;
  const evmAddress = wallet.address;

  // Authenticate with the new wallet
  const authResult = await authenticateWithWallet({
    privateKey,
    expiresIn,
  });

  return {
    ...authResult,
    privateKey,
    evmAddress,
  };
}
