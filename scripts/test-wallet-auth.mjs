#!/usr/bin/env node
/**
 * Test wallet-based API key creation via accounts.fetch.ai
 *
 * Testing approaches:
 * 1. JiwaniZakir: Compressed secp256k1 (33 bytes, base64) + raw sign
 * 2. Cosmos/Tendermint: type "tendermint/PubKeySecp256k1" + SHA256 + R||S base64
 */

import { Wallet, SigningKey, getBytes, hexlify, toUtf8Bytes } from 'ethers';
import { createHash } from 'crypto';
import { bech32 } from 'bech32';
import * as dotenv from 'dotenv';
dotenv.config();

/**
 * Derive Cosmos address (fetch1...) from compressed public key
 * Uses: ripemd160(sha256(pubkey)) then bech32 encode
 */
function deriveCosmosAddress(compressedPubKeyHex, prefix = 'fetch') {
  const pubKeyBytes = getBytes(compressedPubKeyHex);
  const sha256Hash = createHash('sha256').update(pubKeyBytes).digest();
  const ripemd160Hash = createHash('ripemd160').update(sha256Hash).digest();
  const words = bech32.toWords(ripemd160Hash);
  return bech32.encode(prefix, words);
}

const ACCOUNTS_API = 'https://accounts.fetch.ai/v1';
const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY;

if (!PRIVATE_KEY) {
  console.error('Missing WALLET_PRIVATE_KEY in .env');
  process.exit(1);
}

const wallet = new Wallet(PRIVATE_KEY);
const compressedPubKey = new SigningKey(wallet.privateKey).compressedPublicKey;
const cosmosAddress = deriveCosmosAddress(compressedPubKey);

console.log('EVM address:', wallet.address);
console.log('Cosmos address:', cosmosAddress);

/**
 * Get compressed public key (33 bytes)
 */
function getCompressedPublicKey(wallet) {
  const signingKey = new SigningKey(wallet.privateKey);
  // compressedPublicKey is 33 bytes hex (0x02... or 0x03...)
  return signingKey.compressedPublicKey;
}

/**
 * Convert hex to base64
 */
function hexToBase64(hex) {
  const bytes = getBytes(hex);
  return Buffer.from(bytes).toString('base64');
}

/**
 * Sign raw bytes (no EIP-191 prefix)
 */
async function signRawBytes(wallet, message) {
  const signingKey = new SigningKey(wallet.privateKey);
  // Hash the message directly (no prefix)
  const { keccak256 } = await import('ethers');
  const messageHash = keccak256(toUtf8Bytes(message));
  const signature = signingKey.sign(messageHash);
  return signature.serialized;
}

/**
 * Sign with eth_sign style (hash then sign, no prefix)
 */
async function signEthSign(wallet, message) {
  const signingKey = new SigningKey(wallet.privateKey);
  const { keccak256 } = await import('ethers');
  // eth_sign hashes the raw message bytes
  const messageHash = keccak256(toUtf8Bytes(message));
  const sig = signingKey.sign(messageHash);
  return sig.serialized;
}

// secp256k1 curve order
const SECP256K1_N = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141');
const SECP256K1_HALF_N = SECP256K1_N / 2n;

/**
 * Normalize S to lower-S form (required by Cosmos/Tendermint)
 */
function toLowerS(sBigInt) {
  if (sBigInt > SECP256K1_HALF_N) {
    return SECP256K1_N - sBigInt;
  }
  return sBigInt;
}

/**
 * Sign Cosmos/Tendermint style: SHA256 hash, return R||S (64 bytes) base64
 * With lower-S normalization
 */
function signCosmos(wallet, message) {
  const signingKey = new SigningKey(wallet.privateKey);
  // SHA256 hash the message
  const hash = createHash('sha256').update(message).digest();
  const sig = signingKey.sign(hash);

  // Extract R and S, normalize S to lower form
  const r = BigInt(sig.r);
  const s = toLowerS(BigInt(sig.s));

  // Convert to 32-byte buffers
  const rBytes = Buffer.from(r.toString(16).padStart(64, '0'), 'hex');
  const sBytes = Buffer.from(s.toString(16).padStart(64, '0'), 'hex');

  const rs = Buffer.concat([rBytes, sBytes]);
  return rs.toString('base64');
}

/**
 * Sign Cosmos style with hex bytes as input (with lower-S normalization)
 */
function signCosmosHex(wallet, hexString) {
  const signingKey = new SigningKey(wallet.privateKey);
  // Convert hex to bytes, then SHA256
  const bytes = getBytes('0x' + hexString);
  const hash = createHash('sha256').update(bytes).digest();
  const sig = signingKey.sign(hash);

  // Extract R and S, normalize S to lower form
  const r = BigInt(sig.r);
  const s = toLowerS(BigInt(sig.s));

  // Convert to 32-byte buffers
  const rBytes = Buffer.from(r.toString(16).padStart(64, '0'), 'hex');
  const sBytes = Buffer.from(s.toString(16).padStart(64, '0'), 'hex');

  const rs = Buffer.concat([rBytes, sBytes]);
  return rs.toString('base64');
}

/**
 * Step 1: Get challenge
 */
async function getChallenge(address) {
  console.log('\n=== Step 1: Get Challenge ===');

  const res = await fetch(`${ACCOUNTS_API}/auth/login/wallet/challenge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      address,
      client_id: 'agentverse',
      scope: 'av',
    }),
  });

  const data = await res.json();
  console.log('Status:', res.status);
  console.log('Response:', JSON.stringify(data, null, 2));

  if (!res.ok) {
    throw new Error(`Challenge failed: ${res.status}`);
  }

  return data;
}

/**
 * Step 2: Verify with different signing strategies
 */
async function verify(address, challenge, nonce, publicKey, signature, label) {
  console.log(`\n=== Step 2: Verify (${label}) ===`);
  console.log('Public key:', publicKey);
  console.log('Signature:', signature.slice(0, 40) + '...');

  const payload = {
    client_id: 'agentverse',
    address,
    public_key: publicKey,
    nonce,
    challenge,
    signature,
    scope: 'av',
  };

  console.log('Payload:', JSON.stringify(payload, null, 2));

  const res = await fetch(`${ACCOUNTS_API}/auth/login/wallet/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  let data;
  const text = await res.text();
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  console.log('Status:', res.status);
  console.log('Response:', typeof data === 'string' ? data : JSON.stringify(data, null, 2));

  return { status: res.status, data };
}

async function main() {
  try {
    // Step 1: Get challenge
    const { challenge, nonce } = await getChallenge(wallet.address);

    // Get public keys in different formats
    const compressedPubKeyHex = getCompressedPublicKey(wallet);
    const compressedPubKeyBase64 = hexToBase64(compressedPubKeyHex);
    const uncompressedPubKeyHex = wallet.signingKey.publicKey;
    const uncompressedPubKeyBase64 = hexToBase64(uncompressedPubKeyHex);

    console.log('\n=== Public Key Formats ===');
    console.log('Compressed hex:', compressedPubKeyHex);
    console.log('Compressed base64:', compressedPubKeyBase64);
    console.log('Uncompressed hex:', uncompressedPubKeyHex);
    console.log('Uncompressed base64:', uncompressedPubKeyBase64);

    // Sign in different ways
    const sigEIP191 = await wallet.signMessage(nonce); // Standard EIP-191
    const sigRawKeccak = await signRawBytes(wallet, nonce); // Raw keccak256 + sign

    console.log('\n=== Signatures ===');
    console.log('EIP-191 (signMessage):', sigEIP191.slice(0, 40) + '...');
    console.log('Raw keccak256:', sigRawKeccak.slice(0, 40) + '...');

    // Sign nonce as hex bytes (not UTF-8 string)
    const nonceHexBytes = getBytes('0x' + nonce);
    const sigHexBytes = await wallet.signMessage(nonceHexBytes);

    // Sign just the raw hex bytes with keccak (no EIP-191)
    const { keccak256 } = await import('ethers');
    const signingKey = new SigningKey(wallet.privateKey);
    const nonceHashDirect = keccak256('0x' + nonce);
    const sigRawHexBytes = signingKey.sign(nonceHashDirect).serialized;

    console.log('\n=== Additional Signatures ===');
    console.log('EIP-191 on hex bytes:', sigHexBytes.slice(0, 40) + '...');
    console.log('Raw keccak on hex:', sigRawHexBytes.slice(0, 40) + '...');

    // Cosmos/Tendermint style signatures
    const sigCosmosString = signCosmos(wallet, nonce); // SHA256(nonce string) -> R||S base64
    const sigCosmosHexBytes = signCosmosHex(wallet, nonce); // SHA256(nonce as hex bytes) -> R||S base64

    console.log('\n=== Cosmos-style Signatures ===');
    console.log('SHA256(string) R||S base64:', sigCosmosString.slice(0, 40) + '...');
    console.log('SHA256(hex bytes) R||S base64:', sigCosmosHexBytes.slice(0, 40) + '...');

    // Sign nonce directly (no hash) - maybe server hashes it
    function signDirect(wallet, message) {
      const signingKey = new SigningKey(wallet.privateKey);
      // Pad message to 32 bytes or hash if too long
      let hashBytes;
      if (message.length === 64) {
        // Nonce is 32 bytes hex (64 chars) - use as-is
        hashBytes = Buffer.from(message, 'hex');
      } else {
        hashBytes = createHash('sha256').update(message).digest();
      }
      const sig = signingKey.sign(hashBytes);
      const r = BigInt(sig.r);
      const s = toLowerS(BigInt(sig.s));
      const rBytes = Buffer.from(r.toString(16).padStart(64, '0'), 'hex');
      const sBytes = Buffer.from(s.toString(16).padStart(64, '0'), 'hex');
      return Buffer.concat([rBytes, sBytes]).toString('base64');
    }

    // ADR-036 sign doc format for arbitrary data
    function signADR036(wallet, signer, data) {
      const signDoc = {
        account_number: "0",
        chain_id: "",
        fee: { amount: [], gas: "0" },
        memo: "",
        msgs: [{
          type: "sign/MsgSignData",
          value: {
            signer: signer,
            data: Buffer.from(data).toString('base64')
          }
        }],
        sequence: "0"
      };
      // Canonical JSON (sorted keys)
      const canonical = JSON.stringify(signDoc, Object.keys(signDoc).sort());
      const hash = createHash('sha256').update(canonical).digest();

      const signingKey = new SigningKey(wallet.privateKey);
      const sig = signingKey.sign(hash);
      const r = BigInt(sig.r);
      const s = toLowerS(BigInt(sig.s));
      const rBytes = Buffer.from(r.toString(16).padStart(64, '0'), 'hex');
      const sBytes = Buffer.from(s.toString(16).padStart(64, '0'), 'hex');
      return Buffer.concat([rBytes, sBytes]).toString('base64');
    }

    // Sign challenge instead of nonce
    function signChallenge(wallet, challengeStr) {
      const signingKey = new SigningKey(wallet.privateKey);
      const hash = createHash('sha256').update(challengeStr).digest();
      const sig = signingKey.sign(hash);
      const r = BigInt(sig.r);
      const s = toLowerS(BigInt(sig.s));
      const rBytes = Buffer.from(r.toString(16).padStart(64, '0'), 'hex');
      const sBytes = Buffer.from(s.toString(16).padStart(64, '0'), 'hex');
      return Buffer.concat([rBytes, sBytes]).toString('base64');
    }

    // Try different combinations - use Cosmos address with tendermint type
    const tests = [
      // Sign challenge (not nonce)
      {
        label: 'COSMOS + tendermint + SHA256(challenge)',
        address: cosmosAddress,
        publicKey: { type: 'tendermint/PubKeySecp256k1', value: compressedPubKeyBase64 },
        signature: 'CHALLENGE',
      },
      // ADR-036 sign doc format with challenge
      {
        label: 'COSMOS + tendermint + ADR-036(challenge)',
        address: cosmosAddress,
        publicKey: { type: 'tendermint/PubKeySecp256k1', value: compressedPubKeyBase64 },
        signature: 'ADR036_CHALLENGE',
      },
      // Sign nonce hex bytes directly (nonce is already 32 bytes)
      {
        label: 'COSMOS + tendermint + sign(nonce_bytes)',
        address: cosmosAddress,
        publicKey: { type: 'tendermint/PubKeySecp256k1', value: compressedPubKeyBase64 },
        signature: 'DIRECT',
      },
      // SHA256(nonce string)
      {
        label: 'COSMOS + tendermint + SHA256(nonce)',
        address: cosmosAddress,
        publicKey: { type: 'tendermint/PubKeySecp256k1', value: compressedPubKeyBase64 },
        signature: sigCosmosString,
      },
    ];

    const results = [];
    for (const test of tests) {
      // Need to get a fresh challenge for each address since challenge is bound to address
      let testChallenge = challenge;
      let testNonce = nonce;
      if (test.address !== wallet.address) {
        const fresh = await getChallenge(test.address);
        testChallenge = fresh.challenge;
        testNonce = fresh.nonce;
        // Re-sign with fresh nonce/challenge
        if (test.signature === 'CHALLENGE') {
          test.signature = signChallenge(wallet, testChallenge);
        } else if (test.signature === 'ADR036_CHALLENGE') {
          test.signature = signADR036(wallet, test.address, testChallenge);
        } else if (test.signature === 'ADR036') {
          test.signature = signADR036(wallet, test.address, testNonce);
        } else if (test.signature === 'DIRECT' || test.label.includes('sign(nonce_bytes)')) {
          test.signature = signDirect(wallet, testNonce);
        } else if (test.label.includes('SHA256(nonce)') || test.label.includes('SHA256(string)')) {
          test.signature = signCosmos(wallet, testNonce);
        } else if (test.label.includes('SHA256(hex)')) {
          test.signature = signCosmosHex(wallet, testNonce);
        }
      }
      const result = await verify(
        test.address,
        testChallenge,
        testNonce,
        test.publicKey,
        test.signature,
        test.label
      );
      results.push({ ...test, ...result });

      // If we get a 200, we can try to get the API key
      if (result.status === 200 && result.data?.code) {
        console.log('\n=== SUCCESS! Attempting token exchange ===');
        await exchangeToken(result.data.code);
        break;
      }
    }

    console.log('\n=== Summary ===');
    for (const r of results) {
      console.log(`${r.status === 200 ? '✅' : '❌'} ${r.label}: ${r.status}`);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

/**
 * Step 3: Exchange code for API key
 */
async function exchangeToken(code) {
  console.log('Code:', code);

  const res = await fetch(`${ACCOUNTS_API}/tokens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'api_key',
      client_id: 'agentverse',
      code,
      scope: 'av',
      expires_in: 2592000, // 30 days
    }),
  });

  let data;
  const text = await res.text();
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  console.log('Status:', res.status);
  console.log('Response:', typeof data === 'string' ? data : JSON.stringify(data, null, 2));

  return { status: res.status, data };
}

main();
