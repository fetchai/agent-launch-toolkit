/**
 * Tests for spending delegation module.
 *
 * Tests handoff link generation, type correctness, and storage-backed
 * delegation tracking (SDK-DL06, SDK-DL07).
 * On-chain tests are skipped unless WALLET_PRIVATE_KEY is set.
 */

import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import type { SpendingLimit, PaymentToken } from '../types.js';

// ---------------------------------------------------------------------------
// Fetch mock helpers (used by SDK-DL06, SDK-DL07 storage tests)
// ---------------------------------------------------------------------------

type FetchMock = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

const originalFetch = globalThis.fetch;

function installFetchMock(mock: FetchMock): () => void {
  globalThis.fetch = mock as typeof globalThis.fetch;
  return () => {
    globalThis.fetch = originalFetch;
  };
}

function makeResponse(body: unknown, status = 200, statusText = 'OK'): Response {
  const jsonStr = JSON.stringify(body);
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(jsonStr),
    headers: new Headers(),
  } as unknown as Response;
}

let restoreFn: (() => void) | undefined;
afterEach(() => {
  if (restoreFn) {
    restoreFn();
    restoreFn = undefined;
  }
});

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const TEST_API_KEY = 'av-test-delegation-key';
const TEST_AGENT = 'agent1qdelegation';

const STORAGE_BASE = `https://agentverse.ai/v1/hosting/agents/${TEST_AGENT}/storage`;

const TEST_TOKEN: PaymentToken = {
  symbol: 'FET',
  contractAddress: '0x304ddf3eE068c53514f782e2341B71A80c8aE3C7',
  decimals: 18,
  chainId: 97,
  isStablecoin: false,
};

const TEST_DELEGATION: SpendingLimit = {
  owner: '0xOwner1234567890abcdef1234567890abcdef1234',
  spender: '0xSpender234567890abcdef1234567890abcdef1234',
  token: TEST_TOKEN,
  maxAmount: '500',
  spent: '0',
  remaining: '500',
};

/**
 * Creates a fetch mock backed by an in-memory storage map.
 * Tracks all URLs and methods called for assertion.
 */
function createStorageMock(initial: Record<string, string> = {}) {
  const store = new Map<string, string>(Object.entries(initial));
  const calls: { url: string; method: string; body?: unknown }[] = [];

  const mock: FetchMock = async (input, init) => {
    const url = String(input);
    const method = init?.method ?? 'GET';
    let body: unknown;
    if (init?.body) {
      try {
        body = JSON.parse(init.body as string);
      } catch {
        body = init.body;
      }
    }
    calls.push({ url, method, body });

    // Handle PUT to /storage (key in body) — used by putStorage()
    if (url === STORAGE_BASE && method === 'PUT') {
      const putBody = body as { key: string; value: string };
      store.set(putBody.key, putBody.value);
      return {
        ok: true,
        status: 204,
        statusText: 'No Content',
        json: () => Promise.resolve({}),
        text: () => Promise.resolve(''),
        headers: new Headers(),
      } as unknown as Response;
    }

    // Handle GET/DELETE to /storage/{key} — used by getStorage(), deleteStorage()
    const storagePrefix = STORAGE_BASE + '/';
    if (url.startsWith(storagePrefix)) {
      const key = decodeURIComponent(url.slice(storagePrefix.length));

      if (method === 'GET') {
        const value = store.get(key);
        if (value === undefined) {
          return makeResponse({ message: 'Not found' }, 404, 'Not Found');
        }
        return makeResponse({ value }, 200);
      }

      if (method === 'DELETE') {
        store.delete(key);
        return {
          ok: true,
          status: 204,
          statusText: 'No Content',
          json: () => Promise.resolve({}),
          text: () => Promise.resolve(''),
          headers: new Headers(),
        } as unknown as Response;
      }
    }

    return makeResponse({ message: 'Unexpected request' }, 500, 'Internal Server Error');
  };

  return { mock, store, calls };
}

// ---------------------------------------------------------------------------
// Existing tests
// ---------------------------------------------------------------------------

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

  it('createSpendingLimitHandoff defaults to chain 56', async () => {
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

// ---------------------------------------------------------------------------
// SDK-DL06: recordDelegation — storage-backed tracking
// ---------------------------------------------------------------------------

describe('recordDelegation — SDK-DL06', () => {
  it('stores delegation in agent storage via putStorage', async () => {
    const { recordDelegation } = await import('../delegation.js');
    const { mock, store, calls } = createStorageMock();
    restoreFn = installFetchMock(mock);

    await recordDelegation(TEST_AGENT, TEST_DELEGATION, TEST_API_KEY);

    // The delegation key is `delegation_${owner}_${symbol}_${spender}`
    const expectedKey = `delegation_${TEST_DELEGATION.owner}_${TEST_DELEGATION.token.symbol}_${TEST_DELEGATION.spender}`;

    // Verify the delegation was stored
    const storedRaw = store.get(expectedKey);
    assert.ok(storedRaw, 'delegation should be stored under the correct key');
    const stored = JSON.parse(storedRaw) as SpendingLimit;
    assert.equal(stored.owner, TEST_DELEGATION.owner);
    assert.equal(stored.spender, TEST_DELEGATION.spender);
    assert.equal(stored.token.symbol, 'FET');
    assert.equal(stored.maxAmount, '500');
    assert.equal(stored.remaining, '500');

    // Verify PUT was called with the delegation key in the body
    // (putStorage sends key in body, not URL)
    const putCalls = calls.filter((c) => c.method === 'PUT');
    assert.ok(putCalls.length >= 1, 'should have made at least one PUT call');
    const delegationPut = putCalls.find((c) => {
      const body = c.body as { key?: string } | undefined;
      return body?.key === expectedKey;
    });
    assert.ok(delegationPut, 'should have PUT with the delegation key in body');
  });

  it('adds the delegation key to the index', async () => {
    const { recordDelegation } = await import('../delegation.js');
    const { mock, store } = createStorageMock();
    restoreFn = installFetchMock(mock);

    await recordDelegation(TEST_AGENT, TEST_DELEGATION, TEST_API_KEY);

    const indexRaw = store.get('delegations');
    assert.ok(indexRaw, 'delegations index should be stored');
    const index: string[] = JSON.parse(indexRaw);
    const expectedKey = `delegation_${TEST_DELEGATION.owner}_${TEST_DELEGATION.token.symbol}_${TEST_DELEGATION.spender}`;
    assert.ok(index.includes(expectedKey), 'index should contain the delegation key');
  });

  it('does not duplicate keys in the index on re-record', async () => {
    const { recordDelegation } = await import('../delegation.js');
    const expectedKey = `delegation_${TEST_DELEGATION.owner}_${TEST_DELEGATION.token.symbol}_${TEST_DELEGATION.spender}`;

    // Pre-populate index with the same key
    const { mock, store } = createStorageMock({
      delegations: JSON.stringify([expectedKey]),
    });
    restoreFn = installFetchMock(mock);

    await recordDelegation(TEST_AGENT, TEST_DELEGATION, TEST_API_KEY);

    const indexRaw = store.get('delegations');
    assert.ok(indexRaw);
    const index: string[] = JSON.parse(indexRaw);
    const count = index.filter((k) => k === expectedKey).length;
    assert.equal(count, 1, 'index should not have duplicated the key');
  });

  it('uses correct Authorization header with apiKey', async () => {
    const { recordDelegation } = await import('../delegation.js');
    const capturedHeaders: Record<string, string>[] = [];

    restoreFn = installFetchMock(async (input, init) => {
      const url = String(input);
      const method = init?.method ?? 'GET';
      const headers = init?.headers as Record<string, string>;
      capturedHeaders.push(headers);

      const storagePrefix = STORAGE_BASE + '/';
      if (url.startsWith(storagePrefix)) {
        if (method === 'GET') {
          return makeResponse({ message: 'Not found' }, 404, 'Not Found');
        }
        if (method === 'PUT') {
          return {
            ok: true,
            status: 204,
            statusText: 'No Content',
            json: () => Promise.resolve({}),
            text: () => Promise.resolve(''),
            headers: new Headers(),
          } as unknown as Response;
        }
      }
      return makeResponse({}, 200);
    });

    await recordDelegation(TEST_AGENT, TEST_DELEGATION, TEST_API_KEY);

    // All requests should have the Bearer auth header
    for (const headers of capturedHeaders) {
      assert.equal(
        headers['Authorization'],
        `Bearer ${TEST_API_KEY}`,
        'should use Bearer auth with the provided API key',
      );
    }
  });
});

// ---------------------------------------------------------------------------
// SDK-DL07: listDelegations — read from storage
// ---------------------------------------------------------------------------

describe('listDelegations — SDK-DL07', () => {
  it('returns all delegations from agent storage', async () => {
    const { listDelegations } = await import('../delegation.js');

    const delegation1: SpendingLimit = {
      owner: '0xOwnerAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      spender: '0xSpenderBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
      token: TEST_TOKEN,
      maxAmount: '100',
      spent: '20',
      remaining: '80',
    };

    const delegation2: SpendingLimit = {
      owner: '0xOwnerCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC',
      spender: '0xSpenderDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
      token: { ...TEST_TOKEN, symbol: 'USDC', contractAddress: '0x64544969ed7EBf5f083679233325356EbE738930', isStablecoin: true },
      maxAmount: '1000',
      spent: '0',
      remaining: '1000',
    };

    const key1 = `delegation_${delegation1.owner}_${delegation1.token.symbol}_${delegation1.spender}`;
    const key2 = `delegation_${delegation2.owner}_${delegation2.token.symbol}_${delegation2.spender}`;

    const { mock } = createStorageMock({
      delegations: JSON.stringify([key1, key2]),
      [key1]: JSON.stringify(delegation1),
      [key2]: JSON.stringify(delegation2),
    });
    restoreFn = installFetchMock(mock);

    const result = await listDelegations(TEST_AGENT, TEST_API_KEY);

    assert.equal(result.length, 2);

    const owners = result.map((d) => d.owner);
    assert.ok(owners.includes(delegation1.owner));
    assert.ok(owners.includes(delegation2.owner));

    // Verify full SpendingLimit structure
    const first = result.find((d) => d.owner === delegation1.owner)!;
    assert.equal(first.maxAmount, '100');
    assert.equal(first.spent, '20');
    assert.equal(first.remaining, '80');
    assert.equal(first.token.symbol, 'FET');

    const second = result.find((d) => d.owner === delegation2.owner)!;
    assert.equal(second.maxAmount, '1000');
    assert.equal(second.token.symbol, 'USDC');
  });

  it('returns empty array when no delegations index exists', async () => {
    const { listDelegations } = await import('../delegation.js');
    const { mock } = createStorageMock();
    restoreFn = installFetchMock(mock);

    const result = await listDelegations(TEST_AGENT, TEST_API_KEY);
    assert.deepEqual(result, []);
  });

  it('skips entries with invalid JSON in storage', async () => {
    const { listDelegations } = await import('../delegation.js');

    const validDelegation: SpendingLimit = {
      owner: '0xOwnerEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE',
      spender: '0xSpenderFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
      token: TEST_TOKEN,
      maxAmount: '200',
      spent: '0',
      remaining: '200',
    };
    const validKey = `delegation_${validDelegation.owner}_${validDelegation.token.symbol}_${validDelegation.spender}`;

    const { mock } = createStorageMock({
      delegations: JSON.stringify([validKey, 'delegation_bad_entry']),
      [validKey]: JSON.stringify(validDelegation),
      delegation_bad_entry: '<<<not json>>>',
    });
    restoreFn = installFetchMock(mock);

    const result = await listDelegations(TEST_AGENT, TEST_API_KEY);

    // Should have only the valid delegation, bad entry skipped
    assert.equal(result.length, 1);
    assert.equal(result[0].owner, validDelegation.owner);
  });

  it('skips entries that no longer exist in storage', async () => {
    const { listDelegations } = await import('../delegation.js');

    const { mock } = createStorageMock({
      delegations: JSON.stringify(['delegation_exists', 'delegation_gone']),
      delegation_exists: JSON.stringify(TEST_DELEGATION),
      // delegation_gone is not in storage
    });
    restoreFn = installFetchMock(mock);

    const result = await listDelegations(TEST_AGENT, TEST_API_KEY);
    assert.equal(result.length, 1);
    assert.equal(result[0].owner, TEST_DELEGATION.owner);
  });
});
