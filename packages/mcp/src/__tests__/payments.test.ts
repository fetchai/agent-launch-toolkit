/**
 * Tests for MCP payment, invoice, and balance tools.
 *
 * Verifies:
 *   - multi_token_payment: unknown token, missing wallet key, spending limit
 *   - check_spending_limit: handler exists, unknown token rejected
 *   - create_delegation: handler is a function
 *   - get_fiat_link: handler is a function
 *   - create_invoice: creates invoice via storage mock, returns pending status
 *   - list_invoices: lists invoices via storage mock, returns count
 *   - get_multi_token_balances: handler exists, invalid address rejected
 */

import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { paymentHandlers } from '../tools/payments.js';

// ---------------------------------------------------------------------------
// Fetch mock helpers
// ---------------------------------------------------------------------------

const originalFetch = globalThis.fetch;
let restoreFn: (() => void) | undefined;

function installFetchMock(
  mock: (url: string | URL | Request, init?: RequestInit) => Promise<Response>,
): () => void {
  globalThis.fetch = mock as typeof globalThis.fetch;
  return () => {
    globalThis.fetch = originalFetch;
  };
}

function makeResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)),
    headers: new Headers(),
  } as unknown as Response;
}

afterEach(() => {
  if (restoreFn) {
    restoreFn();
    restoreFn = undefined;
  }
});

// ---------------------------------------------------------------------------
// Env helpers -- save and restore env vars around tests
// ---------------------------------------------------------------------------

function withEnv(
  vars: Record<string, string | undefined>,
  fn: () => Promise<void>,
): () => Promise<void> {
  return async () => {
    const saved: Record<string, string | undefined> = {};
    for (const [k, v] of Object.entries(vars)) {
      saved[k] = process.env[k];
      if (v === undefined) {
        delete process.env[k];
      } else {
        process.env[k] = v;
      }
    }
    try {
      await fn();
    } finally {
      for (const [k, v] of Object.entries(saved)) {
        if (v === undefined) {
          delete process.env[k];
        } else {
          process.env[k] = v;
        }
      }
    }
  };
}

// ---------------------------------------------------------------------------
// 1. multi_token_payment
// ---------------------------------------------------------------------------

describe('MCP payment tools -- multi_token_payment', () => {
  const validTo = '0x' + 'a'.repeat(40);

  it(
    'MCP-PAY02: rejects unknown token symbol',
    withEnv(
      { WALLET_PRIVATE_KEY: '0x' + 'f'.repeat(64) },
      async () => {
        await assert.rejects(
          () =>
            paymentHandlers.multi_token_payment({
              tokenSymbol: 'INVALID_TOKEN',
              to: validTo,
              amount: '10',
            }),
          /unknown token/i,
        );
      },
    ),
  );

  it(
    'MCP-PAY01b: rejects when WALLET_PRIVATE_KEY is missing',
    withEnv(
      { WALLET_PRIVATE_KEY: undefined },
      async () => {
        await assert.rejects(
          () =>
            paymentHandlers.multi_token_payment({
              tokenSymbol: 'FET',
              to: validTo,
              amount: '10',
            }),
          /WALLET_PRIVATE_KEY/i,
        );
      },
    ),
  );

  it(
    'MCP-PAY01c: rejects amount exceeding MCP_PAYMENT_LIMIT',
    withEnv(
      { WALLET_PRIVATE_KEY: '0x' + 'f'.repeat(64) },
      async () => {
        await assert.rejects(
          () =>
            paymentHandlers.multi_token_payment({
              tokenSymbol: 'FET',
              to: validTo,
              amount: '999',
            }),
          /spending limit/i,
        );
      },
    ),
  );
});

// ---------------------------------------------------------------------------
// 2. check_spending_limit
// ---------------------------------------------------------------------------

describe('MCP payment tools -- check_spending_limit', () => {
  it('MCP-PAY03a: handler is a function', () => {
    assert.equal(typeof paymentHandlers.check_spending_limit, 'function');
  });

  it('MCP-PAY03b: rejects unknown token symbol', async () => {
    await assert.rejects(
      () =>
        paymentHandlers.check_spending_limit({
          tokenSymbol: 'UNKNOWN',
          owner: '0x' + 'a'.repeat(40),
          spender: '0x' + 'b'.repeat(40),
        }),
      /unknown token/i,
    );
  });
});

// ---------------------------------------------------------------------------
// 3. create_delegation
// ---------------------------------------------------------------------------

describe('MCP payment tools -- create_delegation', () => {
  it('MCP-PAY04: handler is a function', () => {
    assert.equal(typeof paymentHandlers.create_delegation, 'function');
  });
});

// ---------------------------------------------------------------------------
// 4. get_fiat_link
// ---------------------------------------------------------------------------

describe('MCP payment tools -- get_fiat_link', () => {
  it('MCP-PAY05: handler is a function', () => {
    assert.equal(typeof paymentHandlers.get_fiat_link, 'function');
  });
});

// ---------------------------------------------------------------------------
// 5. create_invoice
// ---------------------------------------------------------------------------

describe('MCP payment tools -- create_invoice', () => {
  const agentAddr = 'agent1qtest';
  const payerAddr = '0x' + 'a'.repeat(40);

  it(
    'MCP-INV01: creates an invoice with status pending',
    withEnv(
      { AGENTVERSE_API_KEY: 'test-mock-key' },
      async () => {
        const store: Record<string, string> = {};

        restoreFn = installFetchMock(async (url, init) => {
          const urlStr = url.toString();

          if (urlStr.includes('/storage/')) {
            const key = decodeURIComponent(urlStr.split('/storage/')[1]);

            if (init?.method === 'PUT') {
              const body = JSON.parse(init.body as string);
              store[key] = body.value ?? JSON.stringify(body);
              return makeResponse('', 204);
            }

            // GET
            if (key in store) {
              // Return stored value wrapped in a JSON envelope
              return makeResponse({ value: store[key] });
            }
            return makeResponse({ message: 'Not found' }, 404);
          }

          return makeResponse({});
        });

        const invoice = await paymentHandlers.create_invoice({
          agentAddress: agentAddr,
          invoiceId: 'inv-001',
          payer: payerAddr,
          service: 'api-call',
          amount: '10',
        });

        assert.equal(invoice.status, 'pending', 'invoice status should be pending');
        assert.ok(invoice.createdAt, 'invoice should have a createdAt timestamp');
        assert.ok(invoice.updatedAt, 'invoice should have an updatedAt timestamp');
        assert.equal(invoice.payer, payerAddr, 'payer should match');
        assert.equal(invoice.service, 'api-call', 'service should match');
      },
    ),
  );

  it(
    'MCP-INV02: returned invoice id matches provided invoiceId',
    withEnv(
      { AGENTVERSE_API_KEY: 'test-mock-key' },
      async () => {
        const store: Record<string, string> = {};

        restoreFn = installFetchMock(async (url, init) => {
          const urlStr = url.toString();

          if (urlStr.includes('/storage/')) {
            const key = decodeURIComponent(urlStr.split('/storage/')[1]);

            if (init?.method === 'PUT') {
              const body = JSON.parse(init.body as string);
              store[key] = body.value ?? JSON.stringify(body);
              return makeResponse('', 204);
            }

            if (key in store) {
              return makeResponse({ value: store[key] });
            }
            return makeResponse({ message: 'Not found' }, 404);
          }

          return makeResponse({});
        });

        const invoice = await paymentHandlers.create_invoice({
          agentAddress: agentAddr,
          invoiceId: 'inv-002',
          payer: payerAddr,
          service: 'premium-lookup',
          amount: '5',
        });

        assert.equal(invoice.id, 'inv-002', 'invoice id should match invoiceId argument');
      },
    ),
  );
});

// ---------------------------------------------------------------------------
// 6. list_invoices
// ---------------------------------------------------------------------------

describe('MCP payment tools -- list_invoices', () => {
  const agentAddr = 'agent1qtest';
  const payerAddr = '0x' + 'a'.repeat(40);

  it(
    'MCP-INV03: lists invoices from storage and returns count',
    withEnv(
      { AGENTVERSE_API_KEY: 'test-mock-key' },
      async () => {
        // Pre-populate an in-memory store with an invoice index and two invoices.
        const inv1 = {
          id: 'inv-100',
          issuer: agentAddr,
          payer: payerAddr,
          service: 'svc-a',
          amount: { amount: '5', token: { symbol: 'FET', contractAddress: '0x304ddf3eE068c53514f782e2341B71A80c8aE3C7', decimals: 18, chainId: 97, isStablecoin: false } },
          status: 'pending',
          createdAt: '2026-03-01T00:00:00.000Z',
          updatedAt: '2026-03-01T00:00:00.000Z',
        };
        const inv2 = {
          id: 'inv-101',
          issuer: agentAddr,
          payer: payerAddr,
          service: 'svc-b',
          amount: { amount: '10', token: { symbol: 'FET', contractAddress: '0x304ddf3eE068c53514f782e2341B71A80c8aE3C7', decimals: 18, chainId: 97, isStablecoin: false } },
          status: 'paid',
          createdAt: '2026-03-02T00:00:00.000Z',
          updatedAt: '2026-03-02T00:00:00.000Z',
        };

        const store: Record<string, string> = {
          invoice_index: JSON.stringify(['inv-100', 'inv-101']),
          invoice_inv_100: JSON.stringify(inv1),
          // Use a hyphen-joined key to match invoiceKey('inv-101')
          'invoice_inv-100': JSON.stringify(inv1),
          'invoice_inv-101': JSON.stringify(inv2),
        };

        restoreFn = installFetchMock(async (url, init) => {
          const urlStr = url.toString();

          if (urlStr.includes('/storage/')) {
            const key = decodeURIComponent(urlStr.split('/storage/')[1]);

            if (init?.method === 'PUT') {
              const body = JSON.parse(init.body as string);
              store[key] = body.value ?? JSON.stringify(body);
              return makeResponse('', 204);
            }

            if (key in store) {
              return makeResponse({ value: store[key] });
            }
            return makeResponse({ message: 'Not found' }, 404);
          }

          return makeResponse({});
        });

        const result = await paymentHandlers.list_invoices({
          agentAddress: agentAddr,
        });

        assert.ok(result, 'should return a result');
        assert.ok(Array.isArray(result.invoices), 'invoices should be an array');
        assert.equal(result.count, 2, 'count should match the number of invoices');
        assert.equal(result.invoices.length, 2, 'invoices array length should be 2');
      },
    ),
  );

  it(
    'MCP-INV04: returns empty list for agent with no invoices',
    withEnv(
      { AGENTVERSE_API_KEY: 'test-mock-key' },
      async () => {
        restoreFn = installFetchMock(async (url, init) => {
          const urlStr = url.toString();

          if (urlStr.includes('/storage/')) {
            // No invoice_index stored -- return 404 for everything
            if (!init?.method || init.method === 'GET') {
              return makeResponse({ message: 'Not found' }, 404);
            }
            return makeResponse('', 204);
          }

          return makeResponse({});
        });

        const result = await paymentHandlers.list_invoices({
          agentAddress: 'agent1qempty',
        });

        assert.ok(result, 'should return a result');
        assert.ok(Array.isArray(result.invoices), 'invoices should be an array');
        assert.equal(result.count, 0, 'count should be 0');
        assert.equal(result.invoices.length, 0, 'invoices array should be empty');
      },
    ),
  );
});

// ---------------------------------------------------------------------------
// 7. get_multi_token_balances
// ---------------------------------------------------------------------------

describe('MCP payment tools -- get_multi_token_balances', () => {
  it('MCP-MB01: handler is a function', () => {
    assert.equal(typeof paymentHandlers.get_multi_token_balances, 'function');
  });

  it('MCP-MB02: rejects invalid wallet address', async () => {
    await assert.rejects(
      () =>
        paymentHandlers.get_multi_token_balances({
          walletAddress: 'invalid-address',
        }),
      /invalid.*address/i,
    );
  });
});

// ---------------------------------------------------------------------------
// Handler map completeness
// ---------------------------------------------------------------------------

describe('MCP payment tools -- handler map', () => {
  const expectedHandlers = [
    'multi_token_payment',
    'check_spending_limit',
    'create_delegation',
    'get_fiat_link',
    'create_invoice',
    'list_invoices',
    'get_multi_token_balances',
  ] as const;

  for (const name of expectedHandlers) {
    it(`paymentHandlers includes "${name}" as a function`, () => {
      assert.equal(
        typeof paymentHandlers[name],
        'function',
        `paymentHandlers.${name} should be a function`,
      );
    });
  }
});
