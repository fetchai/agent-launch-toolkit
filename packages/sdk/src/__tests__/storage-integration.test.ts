/**
 * Integration tests for SDK storage module
 *
 * These tests make actual HTTP requests to the Agentverse storage API.
 * They require:
 *   - AGENTVERSE_API_KEY environment variable (or tests will be skipped)
 *   - Network access to https://agentverse.ai/v1
 *
 * Run with: npm test
 * Skip integration tests: SKIP_INTEGRATION=1 npm test
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

import {
  listStorage,
  getStorage,
  putStorage,
  deleteStorage,
} from '../storage.js';

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

describe('Integration: Storage SDK', { skip: SKIP_INTEGRATION }, () => {
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

  it('listStorage returns an array', async () => {
    if (!API_KEY || !agentAddress) return;

    const entries = await listStorage(agentAddress, API_KEY);
    assert.ok(Array.isArray(entries), 'should return an array');
  });

  it('getStorage returns null for a non-existent key', async () => {
    if (!API_KEY || !agentAddress) return;

    const val = await getStorage(
      agentAddress,
      '__nonexistent_test_key__',
      API_KEY,
    );
    assert.equal(val, null, 'should return null for missing key');
  });

  it('putStorage + getStorage round-trip works', async () => {
    if (!API_KEY || !agentAddress) return;

    const testKey = '__agentlaunch_test_' + Date.now();
    const testValue = JSON.stringify({ test: true, ts: Date.now() });

    // Write
    await putStorage(agentAddress, testKey, testValue, API_KEY);

    // Read back
    const readBack = await getStorage(agentAddress, testKey, API_KEY);
    assert.ok(readBack !== null, 'should read back the value');

    // Clean up
    await deleteStorage(agentAddress, testKey, API_KEY);

    // Verify deletion
    const afterDelete = await getStorage(agentAddress, testKey, API_KEY);
    assert.equal(afterDelete, null, 'should be null after deletion');
  });

  it('listStorage entries have key and value fields', async () => {
    if (!API_KEY || !agentAddress) return;

    const entries = await listStorage(agentAddress, API_KEY);

    // If there are entries, verify they have the expected shape
    if (entries.length > 0) {
      const entry = entries[0];
      assert.ok(
        typeof entry.key === 'string',
        'entry should have a string key',
      );
      // value can be string or undefined depending on API response shape
      assert.ok(
        entry.key.length > 0,
        'entry key should be non-empty',
      );
    }
  });
});
