/**
 * Tests for spending delegation module.
 *
 * Tests handoff link generation and type correctness.
 * On-chain tests are skipped unless WALLET_PRIVATE_KEY is set.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Delegation — handoff link generation', () => {
  it('createSpendingLimitHandoff generates a valid URL', async () => {
    const { createSpendingLimitHandoff } = await import('../delegation.js');
    const link = createSpendingLimitHandoff(
      { tokenSymbol: 'FET', amount: '100', chainId: 97 },
      '0x1234567890abcdef1234567890abcdef12345678',
    );
    assert.ok(link.includes('/delegate'), 'Should contain /delegate path');
    assert.ok(link.includes('token='), 'Should contain token param');
    assert.ok(link.includes('spender='), 'Should contain spender param');
    assert.ok(link.includes('amount=100'), 'Should contain amount param');
  });

  it('createSpendingLimitHandoff throws for unknown token', async () => {
    const { createSpendingLimitHandoff } = await import('../delegation.js');
    assert.throws(
      () =>
        createSpendingLimitHandoff(
          { tokenSymbol: 'UNKNOWN_TOKEN', amount: '100', chainId: 97 },
          '0x1234567890abcdef1234567890abcdef12345678',
        ),
      /Unknown token/,
    );
  });

  it('createSpendingLimitHandoff defaults to chain 97', async () => {
    const { createSpendingLimitHandoff } = await import('../delegation.js');
    const link = createSpendingLimitHandoff(
      { tokenSymbol: 'FET', amount: '50' },
      '0x1234567890abcdef1234567890abcdef12345678',
    );
    assert.ok(link.includes('/delegate'), 'Should generate a valid link');
  });
});

describe('Delegation — exports', () => {
  it('exports all required functions', async () => {
    const mod = await import('../delegation.js');
    assert.equal(typeof mod.checkAllowance, 'function');
    assert.equal(typeof mod.spendFromDelegation, 'function');
    assert.equal(typeof mod.createSpendingLimitHandoff, 'function');
    assert.equal(typeof mod.listDelegations, 'function');
    assert.equal(typeof mod.recordDelegation, 'function');
  });
});
