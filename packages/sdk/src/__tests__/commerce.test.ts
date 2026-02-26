/**
 * Tests for SDK commerce module — TST-02b
 *
 * Verifies:
 *   - getAgentRevenue parses revenue_summary from agent storage
 *   - getPricingTable parses pricing_table from agent storage
 *   - getAgentCommerceStatus combines all commerce data correctly
 *   - getNetworkGDP aggregates revenue across multiple agents
 *   - Empty/missing storage returns zero values gracefully
 *   - Malformed JSON in storage is handled without crashing
 *   - Fluent API integration via AgentLaunch class
 */

import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  getAgentRevenue,
  getPricingTable,
  getAgentCommerceStatus,
  getNetworkGDP,
} from '../commerce.js';

// ---------------------------------------------------------------------------
// Helpers (matching existing SDK test patterns)
// ---------------------------------------------------------------------------

type FetchMock = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

function makeResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as unknown as Response;
}

function installFetchMock(mock: FetchMock): () => void {
  const original = globalThis.fetch;
  globalThis.fetch = mock as typeof globalThis.fetch;
  return () => {
    globalThis.fetch = original;
  };
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const API_KEY = 'av-test-key-12345';
const AGENT_ADDRESS = 'agent1qf8xfhsc8hg4g5l0nhtjexample';
const AGENT_ADDRESS_2 = 'agent1qg9yihsd9ihasecondexample';

const MOCK_REVENUE_SUMMARY = JSON.stringify({
  totalIncome: 50000000000000000,
  totalExpenses: 10000000000000000,
  netRevenue: 40000000000000000,
  transactionCount: 25,
  lastUpdated: '2026-02-26T00:00:00.000Z',
  dailySummary: {},
});

const MOCK_PRICING_TABLE = JSON.stringify([
  { service: 'analysis', priceAfet: 10000000000000000, description: 'Data analysis' },
  { service: 'monitoring', priceAfet: 5000000000000000, description: 'Price monitoring' },
  { service: 'premium_report', priceAfet: 25000000000000000, description: 'Detailed report' },
]);

const MOCK_TIER_DATA = JSON.stringify({
  free: { daily_limit: 10, services: ['analysis'] },
  premium: { daily_limit: 1000, services: ['analysis', 'monitoring', 'premium_report'] },
});

/**
 * Creates a fetch mock that returns specific storage values based on the
 * key in the URL. Simulates the Agentverse storage GET API.
 */
function createStorageFetchMock(
  storageMap: Record<string, string>,
): FetchMock {
  return (url: string | URL | Request) => {
    const urlStr = typeof url === 'string' ? url : url.toString();

    // Check which storage key is being requested
    for (const [key, value] of Object.entries(storageMap)) {
      if (urlStr.includes(key)) {
        return Promise.resolve(makeResponse({ value }));
      }
    }

    // Key not found
    return Promise.resolve(makeResponse({ message: 'Not found' }, 404));
  };
}

// ---------------------------------------------------------------------------
// getAgentRevenue
// ---------------------------------------------------------------------------

describe('getAgentRevenue()', () => {
  it('parses revenue_summary from agent storage', async () => {
    const restore = installFetchMock(
      createStorageFetchMock({
        revenue_summary: MOCK_REVENUE_SUMMARY,
      }),
    );

    const revenue = await getAgentRevenue(AGENT_ADDRESS, API_KEY);

    restore();
    assert.ok(revenue, 'should return revenue data');
    assert.equal(revenue.totalIncome, 50000000000000000);
    assert.equal(revenue.totalExpenses, 10000000000000000);
    assert.equal(revenue.netRevenue, 40000000000000000);
    assert.equal(revenue.transactionCount, 25);
  });

  it('returns zero values when storage is empty (no revenue_summary)', async () => {
    const restore = installFetchMock(() =>
      Promise.resolve(makeResponse({ message: 'Not found' }, 404)),
    );

    const revenue = await getAgentRevenue(AGENT_ADDRESS, API_KEY);

    restore();
    assert.ok(revenue, 'should return a revenue object even when empty');
    assert.equal(revenue.totalIncome, 0, 'totalIncome should be 0');
    assert.equal(revenue.totalExpenses, 0, 'totalExpenses should be 0');
    assert.equal(revenue.netRevenue, 0, 'netRevenue should be 0');
    assert.equal(revenue.transactionCount, 0, 'transactionCount should be 0');
  });

  it('handles malformed JSON without crashing', async () => {
    const restore = installFetchMock(
      createStorageFetchMock({
        revenue_summary: 'this is not valid json {{{',
      }),
    );

    // Should not throw
    const revenue = await getAgentRevenue(AGENT_ADDRESS, API_KEY);

    restore();
    assert.ok(revenue, 'should return a revenue object');
    assert.equal(revenue.totalIncome, 0, 'should default to 0 on parse error');
  });
});

// ---------------------------------------------------------------------------
// getPricingTable
// ---------------------------------------------------------------------------

describe('getPricingTable()', () => {
  it('parses pricing_table from agent storage', async () => {
    const restore = installFetchMock(
      createStorageFetchMock({
        pricing_table: MOCK_PRICING_TABLE,
      }),
    );

    const pricing = await getPricingTable(AGENT_ADDRESS, API_KEY);

    restore();
    assert.ok(pricing, 'should return pricing data');
    assert.ok(Array.isArray(pricing), 'should be an array');
    assert.ok(pricing.length > 0, 'should have pricing entries');
  });

  it('returns empty object when no pricing_table exists', async () => {
    const restore = installFetchMock(() =>
      Promise.resolve(makeResponse({ message: 'Not found' }, 404)),
    );

    const pricing = await getPricingTable(AGENT_ADDRESS, API_KEY);

    restore();
    assert.ok(pricing, 'should return a pricing array');
    assert.equal(
      pricing.length,
      0,
      'should be empty when no data exists',
    );
  });

  it('handles malformed JSON gracefully', async () => {
    const restore = installFetchMock(
      createStorageFetchMock({
        pricing_table: '!@#$%^&*(',
      }),
    );

    const pricing = await getPricingTable(AGENT_ADDRESS, API_KEY);

    restore();
    assert.ok(pricing, 'should return a pricing array');
    assert.equal(
      pricing.length,
      0,
      'should be empty on parse error',
    );
  });
});

// ---------------------------------------------------------------------------
// getAgentCommerceStatus
// ---------------------------------------------------------------------------

describe('getAgentCommerceStatus()', () => {
  it('combines revenue, pricing, and tier data correctly', async () => {
    const restore = installFetchMock(
      createStorageFetchMock({
        revenue_summary: MOCK_REVENUE_SUMMARY,
        pricing_table: MOCK_PRICING_TABLE,
        tier_config: MOCK_TIER_DATA,
      }),
    );

    const status = await getAgentCommerceStatus(AGENT_ADDRESS, API_KEY);

    restore();
    assert.ok(status, 'should return a commerce status object');
    assert.ok(status.revenue, 'should include revenue data');
    assert.ok(status.pricing, 'should include pricing data');
    assert.equal(status.revenue.totalIncome, 50000000000000000);
    assert.ok(status.pricing.length > 0, 'pricing should have entries');
  });

  it('returns default values when all storage entries are empty', async () => {
    const restore = installFetchMock(() =>
      Promise.resolve(makeResponse({ message: 'Not found' }, 404)),
    );

    const status = await getAgentCommerceStatus(AGENT_ADDRESS, API_KEY);

    restore();
    assert.ok(status, 'should return a commerce status object');
    assert.ok(status.revenue, 'should include revenue even when empty');
    assert.equal(status.revenue.totalIncome, 0);
    assert.equal(status.revenue.netRevenue, 0);
  });

  it('includes the agent address in the response', async () => {
    const restore = installFetchMock(() =>
      Promise.resolve(makeResponse({ message: 'Not found' }, 404)),
    );

    const status = await getAgentCommerceStatus(AGENT_ADDRESS, API_KEY);

    restore();
    assert.equal(
      status.address,
      AGENT_ADDRESS,
      'should include the agent address in the status',
    );
  });
});

// ---------------------------------------------------------------------------
// getNetworkGDP
// ---------------------------------------------------------------------------

describe('getNetworkGDP()', () => {
  it('aggregates revenue across multiple agents', async () => {
    let callCount = 0;

    const restore = installFetchMock((url) => {
      callCount++;
      const urlStr = typeof url === 'string' ? url : url.toString();

      if (urlStr.includes('revenue_summary')) {
        // Return different revenue for each agent
        if (urlStr.includes(AGENT_ADDRESS)) {
          return Promise.resolve(
            makeResponse({
              value: JSON.stringify({
                totalIncome: 50000000000000000,
                totalExpenses: 10000000000000000,
                netRevenue: 40000000000000000,
                transactionCount: 25,
              }),
            }),
          );
        }
        if (urlStr.includes(AGENT_ADDRESS_2)) {
          return Promise.resolve(
            makeResponse({
              value: JSON.stringify({
                totalIncome: 30000000000000000,
                totalExpenses: 5000000000000000,
                netRevenue: 25000000000000000,
                transactionCount: 10,
              }),
            }),
          );
        }
      }

      return Promise.resolve(makeResponse({ message: 'Not found' }, 404));
    });

    const gdp = await getNetworkGDP([AGENT_ADDRESS, AGENT_ADDRESS_2], API_KEY);

    restore();
    assert.ok(gdp, 'should return GDP data');
    assert.ok(gdp.totalGDP > 0, 'totalGDP should be positive');
    assert.ok(gdp.totalTransactions > 0, 'totalTransactions should be positive');
    assert.ok(gdp.activeAgents >= 2, 'should count both agents');
  });

  it('handles empty agent list gracefully', async () => {
    const restore = installFetchMock(() =>
      Promise.resolve(makeResponse([])),
    );

    const gdp = await getNetworkGDP([], API_KEY);

    restore();
    assert.ok(gdp, 'should return GDP data');
    assert.equal(gdp.totalGDP, 0, 'totalGDP should be 0');
    assert.equal(gdp.activeAgents, 0, 'activeAgents should be 0');
  });

  it('handles agents with missing revenue data', async () => {
    const restore = installFetchMock(() =>
      Promise.resolve(makeResponse({ message: 'Not found' }, 404)),
    );

    // Should not throw even when all agents have empty storage
    const gdp = await getNetworkGDP([AGENT_ADDRESS, AGENT_ADDRESS_2], API_KEY);

    restore();
    assert.ok(gdp, 'should return GDP data');
    assert.equal(gdp.totalGDP, 0, 'totalGDP should be 0 when all empty');
  });
});

// ---------------------------------------------------------------------------
// Fluent API integration
// ---------------------------------------------------------------------------

describe('AgentLaunch fluent API — storage and commerce', () => {
  it('AgentLaunch class can be instantiated', async () => {
    // Dynamic import to avoid breaking if the class isn't updated yet
    const { AgentLaunch } = await import('../agentlaunch.js');
    const al = new AgentLaunch({ apiKey: 'test-key' });

    assert.ok(al, 'AgentLaunch should instantiate');
    assert.ok(al.client, 'should have a client');
  });

  it('storage namespace is accessible', async () => {
    const { AgentLaunch } = await import('../agentlaunch.js');
    const al = new AgentLaunch({ apiKey: 'test-key' });

    // Use dynamic property access to avoid TS errors before the module is added
    const alAny = al as unknown as Record<string, unknown>;
    assert.ok(
      alAny['storage'] || typeof alAny['storage'] === 'object',
      'should have a storage namespace (or property)',
    );
  });

  it('commerce namespace is accessible', async () => {
    const { AgentLaunch } = await import('../agentlaunch.js');
    const al = new AgentLaunch({ apiKey: 'test-key' });

    // Use dynamic property access to avoid TS errors before the module is added
    const alAny = al as unknown as Record<string, unknown>;
    assert.ok(
      alAny['commerce'] || typeof alAny['commerce'] === 'object',
      'should have a commerce namespace (or property)',
    );
  });
});
