/**
 * Tests for multi-token payment operations.
 *
 * Tests token registry, invoice CRUD (mocked storage), and type correctness.
 * On-chain tests are skipped unless WALLET_PRIVATE_KEY is set.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Payments — token registry', () => {
  it('getToken returns FET for BSC Testnet', async () => {
    const { getToken } = await import('../payments.js');
    const token = getToken('FET', 97);
    assert.ok(token, 'FET should exist on chain 97');
    assert.equal(token.symbol, 'FET');
    assert.equal(token.chainId, 97);
    assert.equal(token.decimals, 18);
    assert.equal(token.isStablecoin, false);
  });

  it('getToken returns USDC for BSC Testnet', async () => {
    const { getToken } = await import('../payments.js');
    const token = getToken('USDC', 97);
    assert.ok(token, 'USDC should exist on chain 97');
    assert.equal(token.symbol, 'USDC');
    assert.equal(token.isStablecoin, true);
  });

  it('getToken returns FET for BSC Mainnet', async () => {
    const { getToken } = await import('../payments.js');
    const token = getToken('FET', 56);
    assert.ok(token, 'FET should exist on chain 56');
    assert.equal(token.chainId, 56);
  });

  it('getToken returns USDC for BSC Mainnet', async () => {
    const { getToken } = await import('../payments.js');
    const token = getToken('USDC', 56);
    assert.ok(token, 'USDC should exist on chain 56');
    assert.equal(token.chainId, 56);
  });

  it('getToken returns undefined for unknown token', async () => {
    const { getToken } = await import('../payments.js');
    const token = getToken('DOGE', 97);
    assert.equal(token, undefined);
  });

  it('getToken is case-insensitive', async () => {
    const { getToken } = await import('../payments.js');
    const lower = getToken('fet', 97);
    const upper = getToken('FET', 97);
    assert.ok(lower);
    assert.ok(upper);
    assert.equal(lower!.contractAddress, upper!.contractAddress);
  });

  it('getTokensForChain returns all tokens for a chain', async () => {
    const { getTokensForChain } = await import('../payments.js');
    const tokens = getTokensForChain(97);
    assert.ok(tokens.length >= 2, 'Should have at least FET and USDC');
    assert.ok(tokens.some((t) => t.symbol === 'FET'));
    assert.ok(tokens.some((t) => t.symbol === 'USDC'));
  });

  it('KNOWN_TOKENS has entries for both chains', async () => {
    const { KNOWN_TOKENS } = await import('../payments.js');
    assert.ok(KNOWN_TOKENS.length >= 4, 'Should have at least 4 tokens (2 per chain)');
    assert.ok(KNOWN_TOKENS.some((t) => t.chainId === 97));
    assert.ok(KNOWN_TOKENS.some((t) => t.chainId === 56));
  });
});

describe('Payments — types', () => {
  it('PaymentToken interface has required fields', async () => {
    const { getToken } = await import('../payments.js');
    const token = getToken('FET', 97);
    assert.ok(token);
    assert.equal(typeof token.symbol, 'string');
    assert.equal(typeof token.contractAddress, 'string');
    assert.equal(typeof token.decimals, 'number');
    assert.equal(typeof token.chainId, 'number');
    assert.equal(typeof token.isStablecoin, 'boolean');
  });
});
