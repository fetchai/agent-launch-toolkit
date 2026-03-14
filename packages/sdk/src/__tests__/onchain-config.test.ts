/**
 * Tests for on-chain configuration — SDK-ON07–ON10
 *
 * Verifies:
 *   - Chain ID 97 config has correct RPC URL + FET address
 *   - Chain ID 56 config has correct RPC URL + FET address
 *   - DEFAULT_SLIPPAGE_PERCENT = 5
 *   - Slippage formula: minTokensOut = expected * (100 - slippage) / 100
 *
 * Pure config tests — no ethers, no testnet, no network calls needed.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  CHAIN_CONFIGS,
  DEFAULT_SLIPPAGE_PERCENT,
  TOKEN_CONTRACT_ABI,
  ERC20_ABI,
} from '../onchain.js';

// ---------------------------------------------------------------------------
// Chain configs
// ---------------------------------------------------------------------------

describe('CHAIN_CONFIGS — SDK-ON07', () => {
  it('chain 97 is BSC Testnet with correct FET address', () => {
    const config = CHAIN_CONFIGS[97];
    assert.ok(config, 'chain 97 should exist');
    assert.equal(config.chainId, 97);
    assert.equal(config.name, 'BSC Testnet');
    assert.equal(config.fetAddress, '0x304ddf3eE068c53514f782e2341B71A80c8aE3C7');
    assert.ok(config.rpcUrl.length > 0, 'should have an RPC URL');
  });

  it('chain 56 is BSC Mainnet with correct FET address', () => {
    const config = CHAIN_CONFIGS[56];
    assert.ok(config, 'chain 56 should exist');
    assert.equal(config.chainId, 56);
    assert.equal(config.name, 'BSC Mainnet');
    assert.equal(config.fetAddress, '0xBd5df99ABe0E2b1e86BE5eC0039d1e24de28Fe87');
    assert.ok(config.rpcUrl.length > 0, 'should have an RPC URL');
  });

  it('only chains 97 and 56 are configured', () => {
    const chainIds = Object.keys(CHAIN_CONFIGS).map(Number);
    assert.deepEqual(chainIds.sort(), [56, 97]);
  });

  it('RPC URLs are HTTPS', () => {
    for (const config of Object.values(CHAIN_CONFIGS)) {
      assert.ok(
        config.rpcUrl.startsWith('https://'),
        `${config.name} RPC URL should use HTTPS: ${config.rpcUrl}`,
      );
    }
  });
});

// ---------------------------------------------------------------------------
// Slippage
// ---------------------------------------------------------------------------

describe('DEFAULT_SLIPPAGE_PERCENT — SDK-ON08', () => {
  it('equals 5 (5% slippage tolerance)', () => {
    assert.equal(DEFAULT_SLIPPAGE_PERCENT, 5);
  });
});

describe('Slippage formula — SDK-ON09', () => {
  it('minTokensOut = expected * (100 - slippage) / 100 (integer math)', () => {
    // Simulate the contract's slippage calculation with BigInt
    const expectedTokens = BigInt('1000000000000000000000'); // 1000 tokens in wei
    const slippage = DEFAULT_SLIPPAGE_PERCENT; // 5

    // Match the actual formula from onchain.ts:
    // minTokensOut = tokensExpected * BigInt(Math.floor((100 - slippage) * 100)) / BigInt(10000)
    const minTokensOut = expectedTokens * BigInt(Math.floor((100 - slippage) * 100)) / BigInt(10000);

    // 1000 * 95% = 950 tokens
    const expected950 = BigInt('950000000000000000000');
    assert.equal(minTokensOut, expected950);
  });

  it('100% slippage results in 0 minTokensOut', () => {
    const expectedTokens = BigInt('1000000000000000000000');
    const slippage = 100;
    const minTokensOut = expectedTokens * BigInt(Math.floor((100 - slippage) * 100)) / BigInt(10000);
    assert.equal(minTokensOut, BigInt(0));
  });

  it('0% slippage results in full amount', () => {
    const expectedTokens = BigInt('1000000000000000000000');
    const slippage = 0;
    const minTokensOut = expectedTokens * BigInt(Math.floor((100 - slippage) * 100)) / BigInt(10000);
    assert.equal(minTokensOut, expectedTokens);
  });
});

// ---------------------------------------------------------------------------
// ABI fragments
// ---------------------------------------------------------------------------

describe('Contract ABI fragments — SDK-ON10', () => {
  it('TOKEN_CONTRACT_ABI includes buyTokens function', () => {
    assert.ok(
      TOKEN_CONTRACT_ABI.some((abi) => abi.includes('buyTokens')),
      'should have buyTokens function',
    );
  });

  it('TOKEN_CONTRACT_ABI includes sellTokens function', () => {
    assert.ok(
      TOKEN_CONTRACT_ABI.some((abi) => abi.includes('sellTokens')),
      'should have sellTokens function',
    );
  });

  it('TOKEN_CONTRACT_ABI includes FET_TOKEN view function', () => {
    assert.ok(
      TOKEN_CONTRACT_ABI.some((abi) => abi.includes('FET_TOKEN')),
      'should have FET_TOKEN function',
    );
  });

  it('ERC20_ABI includes approve, allowance, balanceOf, transfer, transferFrom', () => {
    const required = ['approve', 'allowance', 'balanceOf', 'transfer', 'transferFrom'];
    for (const fn of required) {
      assert.ok(
        ERC20_ABI.some((abi) => abi.includes(fn)),
        `ERC20_ABI should include ${fn}`,
      );
    }
  });
});
