#!/usr/bin/env node
/**
 * Test wallet auth using @cosmjs for proper Cosmos signing
 */

import { Secp256k1, Secp256k1Signature, sha256 } from '@cosmjs/crypto';
import { makeSignDoc, serializeSignDoc } from '@cosmjs/amino';
import { Wallet, SigningKey, getBytes } from 'ethers';
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

// Get private key bytes (32 bytes)
const privateKeyHex = PRIVATE_KEY.startsWith('0x') ? PRIVATE_KEY.slice(2) : PRIVATE_KEY;
const privateKeyBytes = Buffer.from(privateKeyHex, 'hex');

// Derive public key using cosmjs
const { pubkey: pubkeyBytes } = await Secp256k1.makeKeypair(privateKeyBytes);
const compressedPubkey = Secp256k1.compressPubkey(pubkeyBytes);

console.log('Private key length:', privateKeyBytes.length);
console.log('Compressed pubkey:', Buffer.from(compressedPubkey).toString('hex'));
console.log('Compressed pubkey base64:', Buffer.from(compressedPubkey).toString('base64'));

// Derive Cosmos address
const pubkeyHash = createHash('sha256').update(compressedPubkey).digest();
const addressBytes = createHash('ripemd160').update(pubkeyHash).digest();
const cosmosAddress = bech32.encode('fetch', bech32.toWords(addressBytes));
console.log('Cosmos address:', cosmosAddress);

// Also get EVM address for comparison
const wallet = new Wallet(PRIVATE_KEY);
console.log('EVM address:', wallet.address);

async function getChallenge(address) {
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
  console.log('\nChallenge response:', res.status);
  if (!res.ok) throw new Error(`Challenge failed: ${res.status}`);
  return data;
}

async function verify(address, challenge, nonce, publicKey, signature) {
  const payload = {
    client_id: 'agentverse',
    address,
    public_key: publicKey,
    nonce,
    challenge,
    signature,
    scope: 'av',
  };

  console.log('\nVerify payload:');
  console.log('  address:', address);
  console.log('  public_key:', JSON.stringify(publicKey));
  console.log('  signature:', signature.slice(0, 40) + '...');

  const res = await fetch(`${ACCOUNTS_API}/auth/login/wallet/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  console.log('Verify response:', res.status, data);
  return { status: res.status, data };
}

// Sign using cosmjs Secp256k1 - with SHA256
async function signWithCosmJS(messageBytes) {
  const messageHash = sha256(messageBytes);
  const signature = await Secp256k1.createSignature(messageHash, privateKeyBytes);
  return Buffer.from(signature.toFixedLength()).toString('base64');
}

// Sign raw 32-byte message (no additional hash)
async function signRaw32Bytes(messageBytes) {
  // If message is already 32 bytes (like a hex nonce), sign directly
  if (messageBytes.length === 32) {
    const signature = await Secp256k1.createSignature(messageBytes, privateKeyBytes);
    return Buffer.from(signature.toFixedLength()).toString('base64');
  }
  // Otherwise hash first
  const messageHash = sha256(messageBytes);
  const signature = await Secp256k1.createSignature(messageHash, privateKeyBytes);
  return Buffer.from(signature.toFixedLength()).toString('base64');
}

// ADR-036 compliant signing using @cosmjs/amino (proper canonical serialization)
async function signADR036(signer, data) {
  // Use cosmjs makeSignDoc for proper ADR-036 format
  const signDoc = makeSignDoc(
    [{
      type: 'sign/MsgSignData',
      value: {
        signer: signer,
        data: Buffer.from(data).toString('base64')
      }
    }],
    { amount: [], gas: '0' },
    '',  // chain_id
    '',  // memo
    '0', // account_number
    '0'  // sequence
  );

  // Use cosmjs serializeSignDoc for canonical JSON
  const serialized = serializeSignDoc(signDoc);
  console.log('  ADR-036 serialized:', Buffer.from(serialized).toString().slice(0, 100) + '...');

  // SHA256 hash and sign
  const messageHash = sha256(serialized);
  const signature = await Secp256k1.createSignature(messageHash, privateKeyBytes);
  return Buffer.from(signature.toFixedLength()).toString('base64');
}

async function main() {
  // Test with Cosmos address
  console.log('\n=== Testing with Cosmos address ===');
  const { challenge, nonce } = await getChallenge(cosmosAddress);
  console.log('Nonce:', nonce);

  // ASI Wallet format: JSON wrapper with title/description/nonce
  async function signASIWalletFormat(nonce) {
    const message = JSON.stringify({
      title: "ASI Alliance Wallet Login",
      description: "Authentication message for accounts.fetch.ai",
      nonce: nonce
    });
    console.log('  ASI message:', message);
    const messageHash = sha256(Buffer.from(message));
    const signature = await Secp256k1.createSignature(messageHash, privateKeyBytes);
    return Buffer.from(signature.toFixedLength()).toString('base64');
  }

  const tests = [
    { label: 'ASI Wallet JSON format', asiFormat: true },
    { label: 'ADR-036 sign doc (nonce)', adr036: true },
    { label: 'Sign nonce hex bytes RAW (no hash)', raw32: true },
    { label: 'Sign nonce string (UTF-8 bytes) + SHA256' },
  ];

  for (const test of tests) {
    console.log(`\n--- ${test.label} ---`);

    // Get fresh challenge for each test
    const fresh = await getChallenge(cosmosAddress);

    let signature;
    if (test.asiFormat) {
      signature = await signASIWalletFormat(fresh.nonce);
    } else if (test.adr036) {
      signature = await signADR036(cosmosAddress, fresh.nonce);
    } else if (test.raw32) {
      // Sign nonce hex bytes directly (no additional hash)
      const nonceBytes = Buffer.from(fresh.nonce, 'hex');
      console.log('  Nonce bytes length:', nonceBytes.length);
      signature = await signRaw32Bytes(nonceBytes);
    } else if (test.hexBytes) {
      signature = await signWithCosmJS(Buffer.from(fresh.nonce, 'hex'));
    } else {
      signature = await signWithCosmJS(Buffer.from(fresh.nonce));
    }

    const result = await verify(
      cosmosAddress,
      fresh.challenge,
      fresh.nonce,
      { type: 'tendermint/PubKeySecp256k1', value: Buffer.from(compressedPubkey).toString('base64') },
      signature
    );

    if (result.status === 200) {
      console.log('SUCCESS! Got code:', result.data?.code);
      break;
    }
  }
}

main().catch(console.error);
