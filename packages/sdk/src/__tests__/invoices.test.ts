/**
 * Tests for invoice CRUD operations — SDK-PAY08 through SDK-PAY11
 *
 * Verifies:
 *   - SDK-PAY08: createInvoice() stores invoice via putStorage and returns it with status 'pending'
 *   - SDK-PAY09: getInvoice() retrieves invoice from storage by ID
 *   - SDK-PAY10: listInvoices() returns all or filters by status
 *   - SDK-PAY11: updateInvoiceStatus() updates status and optional txHash
 *
 * Source: packages/sdk/src/payments.ts
 * Storage backend: Agentverse agent storage (via putStorage/getStorage)
 */

import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  createInvoice,
  getInvoice,
  listInvoices,
  updateInvoiceStatus,
} from '../payments.js';

import type { PaymentToken, TokenAmount } from '../types.js';

// ---------------------------------------------------------------------------
// Fetch mock helpers
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

const TEST_API_KEY = 'av-test-invoice-key';
const TEST_AGENT = 'agent1qtest123';

const TEST_TOKEN: PaymentToken = {
  symbol: 'FET',
  contractAddress: '0x304ddf3eE068c53514f782e2341B71A80c8aE3C7',
  decimals: 18,
  chainId: 97,
  isStablecoin: false,
};

const TEST_AMOUNT: TokenAmount = {
  amount: '10',
  token: TEST_TOKEN,
};

const STORAGE_BASE = `https://agentverse.ai/v1/hosting/agents/${TEST_AGENT}/storage`;

// ---------------------------------------------------------------------------
// Storage mock — simulates Agentverse key-value storage in-memory
// ---------------------------------------------------------------------------

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

    // Parse storage key from URL
    // URL pattern: https://agentverse.ai/v1/hosting/agents/{addr}/storage/{key}
    const storagePrefix = STORAGE_BASE + '/';
    if (url.startsWith(storagePrefix)) {
      const key = decodeURIComponent(url.slice(storagePrefix.length));

      if (method === 'GET') {
        const value = store.get(key);
        if (value === undefined) {
          return makeResponse({ message: 'Not found' }, 404, 'Not Found');
        }
        // Return as JSON envelope with { value: ... }
        return makeResponse({ value }, 200);
      }

      if (method === 'PUT') {
        const putBody = body as { value: string };
        store.set(key, putBody.value);
        // 204 No Content — avStorageFetch handles empty body
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

    // Fallback for unexpected requests
    return makeResponse({ message: 'Unexpected request' }, 500, 'Internal Server Error');
  };

  return { mock, store, calls };
}

// ---------------------------------------------------------------------------
// SDK-PAY08: createInvoice
// ---------------------------------------------------------------------------

describe('createInvoice — SDK-PAY08', () => {
  it('stores invoice in storage and returns it with status pending and timestamps', async () => {
    const { mock, store } = createStorageMock();
    restoreFn = installFetchMock(mock);

    const result = await createInvoice(
      TEST_AGENT,
      {
        id: 'inv-001',
        issuer: TEST_AGENT,
        payer: '0xPayer1234567890abcdef1234567890abcdef1234',
        service: 'data-analysis',
        amount: TEST_AMOUNT,
      },
      TEST_API_KEY,
    );

    // Should return full Invoice with pending status
    assert.equal(result.id, 'inv-001');
    assert.equal(result.status, 'pending');
    assert.equal(result.issuer, TEST_AGENT);
    assert.equal(result.payer, '0xPayer1234567890abcdef1234567890abcdef1234');
    assert.equal(result.service, 'data-analysis');
    assert.equal(result.amount.amount, '10');
    assert.equal(result.amount.token.symbol, 'FET');

    // Should have timestamps
    assert.ok(result.createdAt, 'should have createdAt');
    assert.ok(result.updatedAt, 'should have updatedAt');
    // Timestamps should be valid ISO strings
    assert.ok(!isNaN(Date.parse(result.createdAt)), 'createdAt should be valid ISO date');
    assert.ok(!isNaN(Date.parse(result.updatedAt)), 'updatedAt should be valid ISO date');

    // Should have stored the invoice in the backing store
    const storedInvoice = store.get('invoice_inv-001');
    assert.ok(storedInvoice, 'invoice should be stored');
    const parsed = JSON.parse(storedInvoice);
    assert.equal(parsed.id, 'inv-001');
    assert.equal(parsed.status, 'pending');
  });

  it('updates the invoice index with the new invoice ID', async () => {
    const { mock, store } = createStorageMock();
    restoreFn = installFetchMock(mock);

    await createInvoice(
      TEST_AGENT,
      {
        id: 'inv-002',
        issuer: TEST_AGENT,
        payer: '0xPayer1234567890abcdef1234567890abcdef1234',
        service: 'report',
        amount: TEST_AMOUNT,
      },
      TEST_API_KEY,
    );

    // The index should contain the invoice ID
    const indexRaw = store.get('invoice_index');
    assert.ok(indexRaw, 'invoice_index should be stored');
    const index: string[] = JSON.parse(indexRaw);
    assert.ok(index.includes('inv-002'), 'index should contain inv-002');
  });

  it('does not duplicate IDs in the index', async () => {
    // Pre-populate the index with the same ID
    const { mock, store } = createStorageMock({
      invoice_index: JSON.stringify(['inv-003']),
    });
    restoreFn = installFetchMock(mock);

    await createInvoice(
      TEST_AGENT,
      {
        id: 'inv-003',
        issuer: TEST_AGENT,
        payer: '0xPayer1234567890abcdef1234567890abcdef1234',
        service: 'duplicate-test',
        amount: TEST_AMOUNT,
      },
      TEST_API_KEY,
    );

    const indexRaw = store.get('invoice_index');
    assert.ok(indexRaw);
    const index: string[] = JSON.parse(indexRaw);
    // Should still have only one entry, not duplicated
    const count = index.filter((id) => id === 'inv-003').length;
    assert.equal(count, 1, 'index should not have duplicated inv-003');
  });
});

// ---------------------------------------------------------------------------
// SDK-PAY09: getInvoice
// ---------------------------------------------------------------------------

describe('getInvoice — SDK-PAY09', () => {
  it('retrieves an invoice from storage by ID', async () => {
    const storedInvoice = {
      id: 'inv-100',
      issuer: TEST_AGENT,
      payer: '0xPayerABCD1234567890abcdef1234567890abcdef',
      service: 'content-gen',
      amount: TEST_AMOUNT,
      status: 'pending',
      createdAt: '2026-03-05T10:00:00.000Z',
      updatedAt: '2026-03-05T10:00:00.000Z',
    };

    const { mock } = createStorageMock({
      invoice_inv_100: JSON.stringify(storedInvoice),
      // Note: the key function is `invoice_${id}` so key is `invoice_inv-100`
    });
    // Actually, we need the right key. The invoiceKey function returns `invoice_${id}`.
    // For id='inv-100', the key is 'invoice_inv-100'.
    // Let's rebuild with the correct key.
    const { mock: correctMock } = createStorageMock({
      'invoice_inv-100': JSON.stringify(storedInvoice),
    });
    restoreFn = installFetchMock(correctMock);

    const result = await getInvoice(TEST_AGENT, 'inv-100', TEST_API_KEY);

    assert.ok(result, 'should return an invoice');
    assert.equal(result!.id, 'inv-100');
    assert.equal(result!.status, 'pending');
    assert.equal(result!.service, 'content-gen');
    assert.equal(result!.amount.amount, '10');
  });

  it('returns null for a non-existent invoice', async () => {
    const { mock } = createStorageMock();
    restoreFn = installFetchMock(mock);

    const result = await getInvoice(TEST_AGENT, 'inv-nonexistent', TEST_API_KEY);
    assert.equal(result, null);
  });

  it('returns null for malformed stored data', async () => {
    const { mock } = createStorageMock({
      'invoice_inv-bad': 'not valid json {{{',
    });
    restoreFn = installFetchMock(mock);

    const result = await getInvoice(TEST_AGENT, 'inv-bad', TEST_API_KEY);
    assert.equal(result, null);
  });
});

// ---------------------------------------------------------------------------
// SDK-PAY10: listInvoices
// ---------------------------------------------------------------------------

describe('listInvoices — SDK-PAY10', () => {
  const invoicePending = {
    id: 'inv-a',
    issuer: TEST_AGENT,
    payer: '0x1111111111111111111111111111111111111111',
    service: 'alpha',
    amount: TEST_AMOUNT,
    status: 'pending',
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
  };

  const invoicePaid = {
    id: 'inv-b',
    issuer: TEST_AGENT,
    payer: '0x2222222222222222222222222222222222222222',
    service: 'beta',
    amount: TEST_AMOUNT,
    status: 'paid',
    createdAt: '2026-03-02T00:00:00.000Z',
    updatedAt: '2026-03-02T12:00:00.000Z',
    txHash: '0xabc123',
  };

  const invoiceExpired = {
    id: 'inv-c',
    issuer: TEST_AGENT,
    payer: '0x3333333333333333333333333333333333333333',
    service: 'gamma',
    amount: TEST_AMOUNT,
    status: 'expired',
    createdAt: '2026-03-03T00:00:00.000Z',
    updatedAt: '2026-03-03T00:00:00.000Z',
  };

  it('returns all invoices when no status filter is given', async () => {
    const { mock } = createStorageMock({
      invoice_index: JSON.stringify(['inv-a', 'inv-b', 'inv-c']),
      'invoice_inv-a': JSON.stringify(invoicePending),
      'invoice_inv-b': JSON.stringify(invoicePaid),
      'invoice_inv-c': JSON.stringify(invoiceExpired),
    });
    restoreFn = installFetchMock(mock);

    const result = await listInvoices(TEST_AGENT, undefined, TEST_API_KEY);

    assert.equal(result.length, 3);
    const ids = result.map((inv) => inv.id);
    assert.ok(ids.includes('inv-a'));
    assert.ok(ids.includes('inv-b'));
    assert.ok(ids.includes('inv-c'));
  });

  it('filters by status when status is given', async () => {
    const { mock } = createStorageMock({
      invoice_index: JSON.stringify(['inv-a', 'inv-b', 'inv-c']),
      'invoice_inv-a': JSON.stringify(invoicePending),
      'invoice_inv-b': JSON.stringify(invoicePaid),
      'invoice_inv-c': JSON.stringify(invoiceExpired),
    });
    restoreFn = installFetchMock(mock);

    const pending = await listInvoices(TEST_AGENT, 'pending', TEST_API_KEY);
    assert.equal(pending.length, 1);
    assert.equal(pending[0].id, 'inv-a');

    // Need a fresh mock since fetch may have been called
    const { mock: mock2 } = createStorageMock({
      invoice_index: JSON.stringify(['inv-a', 'inv-b', 'inv-c']),
      'invoice_inv-a': JSON.stringify(invoicePending),
      'invoice_inv-b': JSON.stringify(invoicePaid),
      'invoice_inv-c': JSON.stringify(invoiceExpired),
    });
    restoreFn();
    restoreFn = installFetchMock(mock2);

    const paid = await listInvoices(TEST_AGENT, 'paid', TEST_API_KEY);
    assert.equal(paid.length, 1);
    assert.equal(paid[0].id, 'inv-b');
  });

  it('returns empty array when no invoice index exists', async () => {
    const { mock } = createStorageMock();
    restoreFn = installFetchMock(mock);

    const result = await listInvoices(TEST_AGENT, undefined, TEST_API_KEY);
    assert.deepEqual(result, []);
  });

  it('skips invoices that no longer exist in storage', async () => {
    // Index references inv-a and inv-b, but only inv-a exists in storage
    const { mock } = createStorageMock({
      invoice_index: JSON.stringify(['inv-a', 'inv-b']),
      'invoice_inv-a': JSON.stringify(invoicePending),
      // inv-b not in storage
    });
    restoreFn = installFetchMock(mock);

    const result = await listInvoices(TEST_AGENT, undefined, TEST_API_KEY);
    assert.equal(result.length, 1);
    assert.equal(result[0].id, 'inv-a');
  });
});

// ---------------------------------------------------------------------------
// SDK-PAY11: updateInvoiceStatus
// ---------------------------------------------------------------------------

describe('updateInvoiceStatus — SDK-PAY11', () => {
  const existingInvoice = {
    id: 'inv-upd',
    issuer: TEST_AGENT,
    payer: '0x4444444444444444444444444444444444444444',
    service: 'update-test',
    amount: TEST_AMOUNT,
    status: 'pending',
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
  };

  it('updates the status field in storage', async () => {
    const { mock, store } = createStorageMock({
      'invoice_inv-upd': JSON.stringify(existingInvoice),
    });
    restoreFn = installFetchMock(mock);

    const result = await updateInvoiceStatus(
      TEST_AGENT,
      'inv-upd',
      'paid',
      '0xtxhash123',
      TEST_API_KEY,
    );

    assert.ok(result, 'should return updated invoice');
    assert.equal(result!.status, 'paid');
    assert.equal(result!.txHash, '0xtxhash123');
    // updatedAt should be changed
    assert.notEqual(result!.updatedAt, existingInvoice.updatedAt);

    // Verify it was persisted to the store
    const storedRaw = store.get('invoice_inv-upd');
    assert.ok(storedRaw);
    const stored = JSON.parse(storedRaw);
    assert.equal(stored.status, 'paid');
    assert.equal(stored.txHash, '0xtxhash123');
  });

  it('updates status without txHash when not provided', async () => {
    const { mock } = createStorageMock({
      'invoice_inv-upd': JSON.stringify(existingInvoice),
    });
    restoreFn = installFetchMock(mock);

    const result = await updateInvoiceStatus(
      TEST_AGENT,
      'inv-upd',
      'expired',
      undefined,
      TEST_API_KEY,
    );

    assert.ok(result);
    assert.equal(result!.status, 'expired');
    assert.equal(result!.txHash, undefined);
  });

  it('returns null for a non-existent invoice', async () => {
    const { mock } = createStorageMock();
    restoreFn = installFetchMock(mock);

    const result = await updateInvoiceStatus(
      TEST_AGENT,
      'inv-missing',
      'paid',
      undefined,
      TEST_API_KEY,
    );

    assert.equal(result, null);
  });
});
