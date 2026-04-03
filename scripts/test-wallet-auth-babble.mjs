#!/usr/bin/env node
/**
 * Test using EXACT method from fetchai/babble repo:
 * - Sign the CHALLENGE (not nonce!) in ADR-036 format
 * - Use canonical JSON (sorted keys, compact separators)
 * - Use ecdsa with sigencode_string_canonize (low-S)
 */

import { Secp256k1, sha256 } from '@cosmjs/crypto';
import { getBytes } from 'ethers';
import { bech32 } from 'bech32';
import { createHash } from 'crypto';
import * as dotenv from 'dotenv';
dotenv.config();

const ACCOUNTS_API = 'https://accounts.fetch.ai/v1';
const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY;

if (!PRIVATE_KEY) {
  console.error('Missing WALLET_PRIVATE_KEY in .env');
  process.exit(1);
}

// Get private key bytes
const privateKeyHex = PRIVATE_KEY.startsWith('0x') ? PRIVATE_KEY.slice(2) : PRIVATE_KEY;
const privateKeyBytes = Buffer.from(privateKeyHex, 'hex');

// Derive keys using cosmjs
const { pubkey: pubkeyBytes } = await Secp256k1.makeKeypair(privateKeyBytes);
const compressedPubkey = Secp256k1.compressPubkey(pubkeyBytes);

// Derive Cosmos address (fetch1...)
const pubkeyHash = createHash('sha256').update(compressedPubkey).digest();
const addressBytes = createHash('ripemd160').update(pubkeyHash).digest();
const cosmosAddress = bech32.encode('fetch', bech32.toWords(addressBytes));

console.log('Cosmos address:', cosmosAddress);
console.log('Public key (hex):', Buffer.from(compressedPubkey).toString('hex'));
console.log('Public key (base64):', Buffer.from(compressedPubkey).toString('base64'));

const CLIENT_ID = 'agentverse';  // Try different client IDs

async function getChallenge(address) {
  const res = await fetch(`${ACCOUNTS_API}/auth/login/wallet/challenge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, client_id: CLIENT_ID, scope: 'av' }),
  });
  if (!res.ok) throw new Error(`Challenge failed: ${res.status}`);
  return res.json();
}

/**
 * Sign arbitrary data using EXACT babble method:
 * 1. Create ADR-036 sign doc with data as base64
 * 2. JSON stringify with sorted keys and compact separators
 * 3. Sign with secp256k1 (canonical low-S)
 */
async function signArbitrary(data, signerAddress) {
  // Create the sign doc (exactly as in babble/crypto/identity.py)
  const signDoc = {
    chain_id: "",
    account_number: "0",
    sequence: "0",
    fee: {
      gas: "0",
      amount: [],
    },
    msgs: [
      {
        type: "sign/MsgSignData",
        value: {
          signer: signerAddress,
          data: Buffer.from(data).toString('base64'),
        },
      },
    ],
    memo: "",
  };

  // JSON stringify with sorted keys and compact separators
  // Python: json.dumps(sign_doc, sort_keys=True, separators=(",", ":"))
  const rawSignDoc = canonicalStringify(signDoc);
  console.log('Sign doc:', rawSignDoc);

  // Sign the raw sign doc bytes
  const docBytes = Buffer.from(rawSignDoc);
  const signature = await signCanonical(docBytes);

  return signature;
}

/**
 * Canonical JSON stringify (sorted keys, compact separators)
 */
function canonicalStringify(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalStringify).join(',') + ']';
  }
  const keys = Object.keys(obj).sort();
  const pairs = keys.map(k => `"${k}":${canonicalStringify(obj[k])}`);
  return '{' + pairs.join(',') + '}';
}

/**
 * Sign with secp256k1, canonical (low-S) signature, return base64
 * IMPORTANT: Return only R||S (64 bytes), NOT including recovery byte
 */
async function signCanonical(data) {
  // Use SHA256 hash for signing (cosmjs Secp256k1.createSignature expects 32-byte hash)
  const hash = sha256(data);
  const signature = await Secp256k1.createSignature(hash, privateKeyBytes);
  // toFixedLength returns 65 bytes (R || S || V), we need only 64 bytes (R || S)
  const fullSig = signature.toFixedLength();
  const rs = fullSig.slice(0, 64); // Remove recovery byte
  console.log('  Signature length:', rs.length, 'bytes');
  return Buffer.from(rs).toString('base64');
}

async function verify(payload) {
  console.log('\nVerify request:');
  console.log('  address:', payload.address);
  console.log('  public_key:', JSON.stringify(payload.public_key));
  console.log('  signature:', payload.signature.slice(0, 50) + '...');

  const res = await fetch(`${ACCOUNTS_API}/auth/login/wallet/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  console.log('Response:', res.status, JSON.stringify(data));
  return { status: res.status, data };
}

async function exchangeToken(loginResp) {
  console.log('\nExchanging for API key...');

  // Use ApiKeyGrant format
  const apiKeyRequest = {
    grant_type: 'api_key',
    client_id: CLIENT_ID,
    code: loginResp.code,
    scope: 'av',
    expires_in: 2592000, // 30 days in seconds
  };

  console.log('Token request:', JSON.stringify(apiKeyRequest, null, 2));

  const res = await fetch(`${ACCOUNTS_API}/tokens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(apiKeyRequest),
  });
  const data = await res.json();
  console.log('Token response:', res.status, JSON.stringify(data, null, 2));
  return data;
}

async function main() {
  console.log('\n=== Testing EXACT babble method ===\n');

  // Get challenge (use client_id: "uagent" like babble does)
  const { challenge, nonce } = await getChallenge(cosmosAddress);
  console.log('Challenge received');
  console.log('Nonce:', nonce);
  console.log('Challenge:', challenge.slice(0, 50) + '...');

  // Sign the CHALLENGE (not nonce!) using ADR-036 format
  const signature = await signArbitrary(challenge, cosmosAddress);
  console.log('\nSignature:', signature);

  // Build verify request exactly like babble
  const verifyPayload = {
    address: cosmosAddress,
    public_key: {
      value: Buffer.from(compressedPubkey).toString('base64'),
      type: 'tendermint/PubKeySecp256k1',
    },
    nonce: nonce,
    challenge: challenge,
    signature: signature,
    client_id: CLIENT_ID,
    scope: 'av',
  };

  const result = await verify(verifyPayload);

  if (result.status === 200 && result.data) {
    console.log('\n✅ SUCCESS! Attempting token exchange...');
    const tokenResp = await exchangeToken(result.data);
    if (tokenResp.access_token) {
      console.log('\n🎉 GOT ACCESS TOKEN!');
      console.log('Token:', tokenResp.access_token.slice(0, 50) + '...');
    }
  }
}

main().catch(console.error);
