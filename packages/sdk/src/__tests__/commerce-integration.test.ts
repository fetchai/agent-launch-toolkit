/**
 * Integration tests for SDK commerce module
 *
 * These tests make actual HTTP requests to the Agentverse storage API
 * to read commerce data from agent storage.
 * They require:
 *   - AGENTVERSE_API_KEY environment variable (or tests will be skipped)
 *   - Network access to https://agentverse.ai/v1
 *
 * Commerce functions read from agent storage -- they will return empty/zero
 * data for agents that haven't configured commerce. That is expected and fine
 * for integration testing: the important thing is that the functions execute
 * without errors and return correctly-shaped results.
 *
 * Run with: npm test
 * Skip integration tests: SKIP_INTEGRATION=1 npm test
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

import {
  getAgentRevenue,
  getPricingTable,
  getAgentCommerceStatus,
  getNetworkGDP,
} from '../commerce.js';

// ---------------------------------------------------------------------------
// Test configuration
// ---------------------------------------------------------------------------

const SKIP_INTEGRATION =
  process.env['SKIP_INTEGRATION'] === '1' ||
  process.env['SKIP_INTEGRATION'] === 'true';

const API_KEY = process.env['AGENTVERSE_API_KEY'];

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

describe('Integration: Commerce SDK', { skip: SKIP_INTEGRATION }, () => {
  let agentAddress: string;

  before(async () => {
    if (skipIf(!API_KEY, 'No AGENTVERSE_API_KEY set')) return;

    // Find a real agent address from the caller's Agentverse account
    const res = await fetch('https://agentverse.ai/v1/hosting/agents', {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });

    if (res.ok) {
      const data = (await res.json()) as Record<string, unknown>;
      const agents = (data.items ?? data.agents ?? data) as Array<{
        address: string;
      }>;
      if (Array.isArray(agents) && agents.length > 0) {
        agentAddress = agents[0].address;
      }
    }
  });

  it('getAgentRevenue returns AgentRevenue shape', async () => {
    if (!API_KEY || !agentAddress) return;

    const revenue = await getAgentRevenue(agentAddress, API_KEY);

    assert.ok(typeof revenue.totalIncome === 'number', 'totalIncome should be a number');
    assert.ok(typeof revenue.totalExpenses === 'number', 'totalExpenses should be a number');
    assert.ok(typeof revenue.netRevenue === 'number', 'netRevenue should be a number');
    assert.ok(typeof revenue.transactionCount === 'number', 'transactionCount should be a number');
    assert.ok(typeof revenue.lastUpdated === 'string', 'lastUpdated should be a string');
    assert.ok(typeof revenue.dailySummary === 'object', 'dailySummary should be an object');
  });

  it('getAgentRevenue returns non-negative values', async () => {
    if (!API_KEY || !agentAddress) return;

    const revenue = await getAgentRevenue(agentAddress, API_KEY);

    assert.ok(revenue.totalIncome >= 0, 'totalIncome should be non-negative');
    assert.ok(revenue.totalExpenses >= 0, 'totalExpenses should be non-negative');
    assert.ok(revenue.transactionCount >= 0, 'transactionCount should be non-negative');
  });

  it('getPricingTable returns PricingEntry array', async () => {
    if (!API_KEY || !agentAddress) return;

    const pricing = await getPricingTable(agentAddress, API_KEY);

    assert.ok(Array.isArray(pricing), 'pricing should be an array');

    // If there are entries, verify shape
    if (pricing.length > 0) {
      const entry = pricing[0];
      assert.ok(typeof entry.service === 'string', 'entry should have string service');
      assert.ok(typeof entry.priceAfet === 'number', 'entry should have number priceAfet');
    }
  });

  it('getAgentCommerceStatus returns full status', async () => {
    if (!API_KEY || !agentAddress) return;

    const status = await getAgentCommerceStatus(agentAddress, API_KEY);

    assert.ok(status.address, 'should have address');
    assert.equal(status.address, agentAddress, 'address should match requested agent');
    assert.ok(status.revenue, 'should have revenue');
    assert.ok(typeof status.revenue.totalIncome === 'number', 'revenue.totalIncome should be a number');
    assert.ok(Array.isArray(status.pricing), 'pricing should be array');
    assert.ok(typeof status.fetBalance === 'number', 'fetBalance should be a number');
    assert.ok(typeof status.effortMode === 'string', 'effortMode should be a string');
    assert.ok(typeof status.tier === 'string', 'tier should be a string');
  });

  it('getAgentCommerceStatus has valid effort mode', async () => {
    if (!API_KEY || !agentAddress) return;

    const status = await getAgentCommerceStatus(agentAddress, API_KEY);

    // effortMode should be one of the known values or a custom string
    assert.ok(
      status.effortMode.length > 0,
      'effortMode should be a non-empty string',
    );
  });

  it('getNetworkGDP aggregates across agents', async () => {
    if (!API_KEY || !agentAddress) return;

    const gdp = await getNetworkGDP([agentAddress], API_KEY);

    assert.ok(Array.isArray(gdp.agents), 'agents should be an array');
    assert.equal(gdp.agents.length, 1, 'should have one agent entry');
    assert.ok(typeof gdp.totalGDP === 'number', 'totalGDP should be a number');
    assert.ok(typeof gdp.totalTransactions === 'number', 'totalTransactions should be a number');
    assert.ok(typeof gdp.activeAgents === 'number', 'activeAgents should be a number');
    assert.ok(typeof gdp.timestamp === 'string', 'timestamp should be a string');
  });

  it('getNetworkGDP handles empty agent list', async () => {
    if (!API_KEY) return;

    const gdp = await getNetworkGDP([], API_KEY);

    assert.ok(Array.isArray(gdp.agents), 'agents should be an array');
    assert.equal(gdp.agents.length, 0, 'should have zero agent entries');
    assert.equal(gdp.totalGDP, 0, 'totalGDP should be 0 for empty list');
    assert.equal(gdp.totalTransactions, 0, 'totalTransactions should be 0');
    assert.equal(gdp.activeAgents, 0, 'activeAgents should be 0');
  });

  it('getNetworkGDP agent entries match commerce status shape', async () => {
    if (!API_KEY || !agentAddress) return;

    const gdp = await getNetworkGDP([agentAddress], API_KEY);
    const agent = gdp.agents[0];

    assert.ok(agent, 'should have at least one agent');
    assert.equal(agent.address, agentAddress, 'agent address should match');
    assert.ok(agent.revenue, 'agent should have revenue');
    assert.ok(Array.isArray(agent.pricing), 'agent pricing should be array');
    assert.ok(typeof agent.fetBalance === 'number', 'agent fetBalance should be a number');
  });
});
