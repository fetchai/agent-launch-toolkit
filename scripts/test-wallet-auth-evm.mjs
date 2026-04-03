#!/usr/bin/env node
/**
 * Test JiwaniZakir's exact suggestion:
 * - EVM address (0x...)
 * - type: "secp256k1"
 * - Compressed pubkey (33 bytes, base64)
 * - Sign RAW nonce bytes (no EIP-191 prefix)
 */

import { Wallet, SigningKey, getBytes, keccak256 } from 'ethers';
import * as dotenv from 'dotenv';
dotenv.config();

const ACCOUNTS_API = 'https://accounts.fetch.ai/v1';
const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY;

if (!PRIVATE_KEY) {
  console.error('Missing WALLET_PRIVATE_KEY in .env');
  process.exit(1);
}

const wallet = new Wallet(PRIVATE_KEY);
const signingKey = new SigningKey(wallet.privateKey);

console.log('EVM address:', wallet.address);
console.log('Compressed pubkey (hex):', signingKey.compressedPublicKey);
console.log('Compressed pubkey (base64):', Buffer.from(getBytes(signingKey.compressedPublicKey)).toString('base64'));

async function getChallenge(address) {
  const res = await fetch(`${ACCOUNTS_API}/auth/login/wallet/challenge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, client_id: 'agentverse', scope: 'av' }),
  });
  if (!res.ok) throw new Error(`Challenge failed: ${res.status}`);
  return res.json();
}

async function verify(payload) {
  console.log('\nVerify payload:', JSON.stringify(payload, null, 2));
  const res = await fetch(`${ACCOUNTS_API}/auth/login/wallet/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  console.log('Response:', res.status, data);
  return { status: res.status, data };
}

/**
 * Sign raw bytes directly - NO EIP-191 prefix, NO hashing
 * Just sign the 32-byte nonce directly
 */
function signRawDirect(nonceHex) {
  // Nonce is 32 bytes hex - sign it directly as the "message hash"
  const nonceBytes = getBytes('0x' + nonceHex);
  const sig = signingKey.sign(nonceBytes);
  return sig.serialized; // 65 bytes with v
}

/**
 * Sign with keccak256 hash of raw nonce (no EIP-191 prefix)
 */
function signKeccakRaw(nonceHex) {
  // keccak256 of the raw nonce hex bytes
  const hash = keccak256('0x' + nonceHex);
  const sig = signingKey.sign(hash);
  return sig.serialized;
}

/**
 * Sign nonce string with keccak256 (no EIP-191 prefix)
 */
function signKeccakString(nonceString) {
  const hash = keccak256(Buffer.from(nonceString));
  const sig = signingKey.sign(hash);
  return sig.serialized;
}

/**
 * Return R||S (64 bytes) without v, base64 encoded
 */
function signRawRS(nonceHex) {
  const nonceBytes = getBytes('0x' + nonceHex);
  const sig = signingKey.sign(nonceBytes);
  // Extract r and s (without v)
  const r = getBytes(sig.r);
  const s = getBytes(sig.s);
  const rs = new Uint8Array(64);
  rs.set(r, 0);
  rs.set(s, 32);
  return Buffer.from(rs).toString('base64');
}

async function main() {
  const { challenge, nonce } = await getChallenge(wallet.address);
  console.log('\nChallenge received, nonce:', nonce);

  const compressedBase64 = Buffer.from(getBytes(signingKey.compressedPublicKey)).toString('base64');

  const tests = [
    {
      label: 'EVM + secp256k1 + raw direct sign (65 bytes hex)',
      signature: signRawDirect(nonce),
      format: 'hex',
    },
    {
      label: 'EVM + secp256k1 + raw direct sign (65 bytes base64)',
      signature: Buffer.from(getBytes(signRawDirect(nonce))).toString('base64'),
      format: 'base64',
    },
    {
      label: 'EVM + secp256k1 + R||S only (64 bytes base64)',
      signature: signRawRS(nonce),
      format: 'base64',
    },
    {
      label: 'EVM + secp256k1 + keccak256(nonce_hex) (65 bytes hex)',
      signature: signKeccakRaw(nonce),
      format: 'hex',
    },
    {
      label: 'EVM + secp256k1 + keccak256(nonce_string) (65 bytes hex)',
      signature: signKeccakString(nonce),
      format: 'hex',
    },
    {
      label: 'EVM + secp256k1 + keccak256(nonce_hex) base64',
      signature: Buffer.from(getBytes(signKeccakRaw(nonce))).toString('base64'),
      format: 'base64',
    },
  ];

  console.log('\n=== Testing EVM address with type: secp256k1 ===\n');

  for (const test of tests) {
    console.log(`\n--- ${test.label} ---`);

    // Get fresh challenge for each test
    const fresh = await getChallenge(wallet.address);

    let sig;
    if (test.label.includes('raw direct')) {
      sig = test.format === 'hex'
        ? signRawDirect(fresh.nonce)
        : Buffer.from(getBytes(signRawDirect(fresh.nonce))).toString('base64');
    } else if (test.label.includes('R||S')) {
      sig = signRawRS(fresh.nonce);
    } else if (test.label.includes('keccak256(nonce_hex)')) {
      sig = test.format === 'hex'
        ? signKeccakRaw(fresh.nonce)
        : Buffer.from(getBytes(signKeccakRaw(fresh.nonce))).toString('base64');
    } else if (test.label.includes('keccak256(nonce_string)')) {
      sig = signKeccakString(fresh.nonce);
    }

    const result = await verify({
      client_id: 'agentverse',
      address: wallet.address,
      public_key: { type: 'secp256k1', value: compressedBase64 },
      nonce: fresh.nonce,
      challenge: fresh.challenge,
      signature: sig,
      scope: 'av',
    });

    if (result.status === 200) {
      console.log('\n✅ SUCCESS!');
      break;
    }
  }
}

main().catch(console.error);
