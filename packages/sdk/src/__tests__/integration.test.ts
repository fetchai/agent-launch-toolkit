/**
 * Integration tests for SDK — hit the real API
 *
 * These tests make actual HTTP requests to the AgentLaunch API.
 * They require:
 *   - AGENTVERSE_API_KEY environment variable (or tests will be skipped)
 *   - Network access to the API
 *
 * Run with: npm test
 * Skip integration tests: SKIP_INTEGRATION=1 npm test
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

import {
  listTokens,
  getToken,
  getPlatformStats,
  calculateBuy,
  calculateSell,
  getTokenHolders,
} from '../index.js';
import { AgentLaunchError } from '../types.js';
import type { HolderListResponse } from '../types.js';

// ---------------------------------------------------------------------------
// Test configuration
// ---------------------------------------------------------------------------

const SKIP_INTEGRATION =
  process.env['SKIP_INTEGRATION'] === '1' ||
  process.env['SKIP_INTEGRATION'] === 'true';

const API_KEY = process.env['AGENTVERSE_API_KEY'];

// Known token address on the platform (BSC testnet)
// This should be a token that exists and won't be deleted
let TEST_TOKEN_ADDRESS: string;

// ---------------------------------------------------------------------------
// Skip helper
// ---------------------------------------------------------------------------

function skipIf(condition: boolean, reason: string) {
  if (condition) {
    console.log(`  ⏭️  Skipping: ${reason}`);
    return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Integration tests
// ---------------------------------------------------------------------------

describe('Integration: listTokens()', { skip: SKIP_INTEGRATION }, () => {
  before(() => {
    if (skipIf(!API_KEY, 'No AGENTVERSE_API_KEY set')) return;
  });

  it('returns a list of tokens from the live API', async () => {
    if (!API_KEY) return;

    const result = await listTokens({ limit: 5 });

    assert.ok(Array.isArray(result.tokens), 'tokens should be an array');
    assert.ok(result.tokens.length > 0, 'should have at least one token');

    // Save the first token address for other tests
    if (result.tokens[0]?.address) {
      TEST_TOKEN_ADDRESS = result.tokens[0].address;
    }

    // Verify token structure
    const token = result.tokens[0];
    assert.ok(token.id, 'token should have id');
    assert.ok(token.name, 'token should have name');
    assert.ok(token.symbol, 'token should have symbol');
    assert.ok(token.address, 'token should have address');
    assert.ok(typeof token.price === 'string', 'price should be a string');
  });

  it('respects the limit parameter', async () => {
    if (!API_KEY) return;

    const result = await listTokens({ limit: 2 });
    assert.ok(result.tokens.length <= 2, 'should respect limit');
  });

  it('supports pagination', async () => {
    if (!API_KEY) return;

    const page1 = await listTokens({ limit: 1, page: 1 });
    const page2 = await listTokens({ limit: 1, page: 2 });

    // If there are multiple tokens, pages should be different
    if (page1.tokens.length > 0 && page2.tokens.length > 0) {
      assert.notEqual(
        page1.tokens[0]?.address,
        page2.tokens[0]?.address,
        'different pages should have different tokens'
      );
    }
  });
});

describe('Integration: getToken()', { skip: SKIP_INTEGRATION }, () => {
  before(async () => {
    if (skipIf(!API_KEY, 'No AGENTVERSE_API_KEY set')) return;

    // Ensure we have a test token address
    if (!TEST_TOKEN_ADDRESS) {
      const result = await listTokens({ limit: 1 });
      if (result.tokens[0]?.address) {
        TEST_TOKEN_ADDRESS = result.tokens[0].address;
      }
    }
  });

  it('returns token details for a valid address', async () => {
    if (!API_KEY || !TEST_TOKEN_ADDRESS) return;

    const token = await getToken(TEST_TOKEN_ADDRESS);

    assert.equal(token.address, TEST_TOKEN_ADDRESS);
    assert.ok(token.name, 'token should have name');
    assert.ok(token.symbol, 'token should have symbol');
    assert.ok(typeof token.price === 'string', 'price should be a string');
    assert.ok(typeof token.chainId === 'number', 'chainId should be a number');
  });

  it('throws AgentLaunchError for non-existent token', async () => {
    if (!API_KEY) return;

    const fakeAddress = '0x0000000000000000000000000000000000000000';

    await assert.rejects(
      () => getToken(fakeAddress),
      (err: unknown) => {
        assert.ok(err instanceof AgentLaunchError, 'should be AgentLaunchError');
        assert.equal((err as AgentLaunchError).status, 404);
        return true;
      }
    );
  });
});

describe('Integration: getPlatformStats()', { skip: SKIP_INTEGRATION }, () => {
  it('returns platform statistics', async () => {
    const stats = await getPlatformStats();

    assert.ok(
      typeof stats.totalTokens === 'number',
      'totalTokens should be a number'
    );
    assert.ok(stats.totalTokens >= 0, 'totalTokens should be non-negative');

    // totalVolume can be string or number
    assert.ok(
      stats.totalVolume !== undefined,
      'totalVolume should be defined'
    );
  });
});

describe('Integration: calculateBuy()', { skip: SKIP_INTEGRATION }, () => {
  before(async () => {
    if (skipIf(!API_KEY, 'No AGENTVERSE_API_KEY set')) return;

    if (!TEST_TOKEN_ADDRESS) {
      const result = await listTokens({ limit: 1 });
      if (result.tokens[0]?.address) {
        TEST_TOKEN_ADDRESS = result.tokens[0].address;
      }
    }
  });

  it('calculates buy preview for a valid token', async () => {
    if (!API_KEY || !TEST_TOKEN_ADDRESS) return;

    // Use dev client since prod has WAF issues
    const result = await calculateBuy(TEST_TOKEN_ADDRESS, '10');

    assert.ok(result.tokensReceived, 'should return tokensReceived');
    assert.ok(
      parseFloat(result.tokensReceived) > 0,
      'tokensReceived should be positive'
    );

    // Verify expected fields
    assert.ok(result.pricePerToken !== undefined, 'should have pricePerToken');
    assert.ok(result.fee !== undefined, 'should have fee');
  });

  it('returns correct fee calculation (2% protocol fee)', async () => {
    if (!API_KEY || !TEST_TOKEN_ADDRESS) return;

    const result = await calculateBuy(TEST_TOKEN_ADDRESS, '100');

    const fee = parseFloat(result.fee);
    const expectedFee = 100 * 0.02; // 2% of 100 FET

    assert.ok(
      Math.abs(fee - expectedFee) < 0.01,
      `Fee should be ~2 FET, got ${fee}`
    );
  });
});

describe('Integration: calculateSell()', { skip: SKIP_INTEGRATION }, () => {
  before(async () => {
    if (skipIf(!API_KEY, 'No AGENTVERSE_API_KEY set')) return;

    if (!TEST_TOKEN_ADDRESS) {
      const result = await listTokens({ limit: 1 });
      if (result.tokens[0]?.address) {
        TEST_TOKEN_ADDRESS = result.tokens[0].address;
      }
    }
  });

  it('calculates sell preview for a valid token', async () => {
    if (!API_KEY || !TEST_TOKEN_ADDRESS) return;

    // Use dev client since prod has WAF issues
    const result = await calculateSell(TEST_TOKEN_ADDRESS, '10000');

    assert.ok(result.fetReceived, 'should return fetReceived');
    assert.ok(
      parseFloat(result.fetReceived) >= 0,
      'fetReceived should be non-negative'
    );
  });
});

describe('Integration: getTokenHolders()', { skip: SKIP_INTEGRATION }, () => {
  before(async () => {
    if (skipIf(!API_KEY, 'No AGENTVERSE_API_KEY set')) return;

    if (!TEST_TOKEN_ADDRESS) {
      const result = await listTokens({ limit: 1 });
      if (result.tokens[0]?.address) {
        TEST_TOKEN_ADDRESS = result.tokens[0].address;
      }
    }
  });

  it('returns holder list for a valid token', async () => {
    if (!API_KEY || !TEST_TOKEN_ADDRESS) return;

    // When called without holderAddress, returns HolderListResponse
    const result = (await getTokenHolders(TEST_TOKEN_ADDRESS)) as HolderListResponse;

    assert.ok(Array.isArray(result.holders), 'holders should be an array');
    assert.ok(typeof result.total === 'number', 'total should be a number');

    // If there are holders, verify structure
    if (result.holders.length > 0) {
      const holder = result.holders[0];
      assert.ok(holder.address, 'holder should have address');
      assert.ok(holder.balance !== undefined, 'holder should have balance');
    }
  });
});
