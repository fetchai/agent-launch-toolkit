/**
 * Integration tests for MCP tools
 *
 * Tests that exercise the MCP tool handlers end-to-end:
 *   - scaffold_genesis: local-only generation (no API key needed)
 *   - check_agent_commerce: reads from real Agentverse storage (needs API key)
 *   - network_status: aggregates across real agents (needs API key)
 *
 * Run with: npm test
 * Skip integration tests: SKIP_INTEGRATION=1 npm test
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';

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
// scaffold_genesis — local generation, no API key needed
// ---------------------------------------------------------------------------

describe('Integration: MCP scaffold_genesis tool', () => {
  it('generates a genesis agent project', async () => {
    const { scaffoldHandlers } = await import('../tools/scaffold.js');
    const tmpDir = '/tmp/agentlaunch-test-' + Date.now();

    try {
      const result = await scaffoldHandlers.scaffold_genesis({
        name: 'IntegrationTestAgent',
        preset: 'oracle',
        outputDir: tmpDir,
      });

      assert.ok(result, 'should return result');
      assert.equal(result.success, true, 'should report success');
      assert.ok(result.name, 'should include agent name');
      assert.ok(result.preset, 'should include preset name');
      assert.ok(result.directory, 'should include output directory');
      assert.ok(Array.isArray(result.files), 'should include files array');
      assert.ok(result.files.length > 0, 'should have created files');

      // Verify agent.py was created
      const agentPyPath = result.files.find((f: string) => f.endsWith('agent.py'));
      assert.ok(agentPyPath, 'should have created agent.py');

      // Read and verify the generated code
      const code = fs.readFileSync(agentPyPath!, 'utf8');
      assert.ok(code.length > 100, 'agent.py should have substantial content');
      assert.ok(
        code.includes('from uagents import'),
        'agent.py should contain uagents import',
      );
      assert.ok(
        code.includes('IntegrationTestAgent'),
        'agent.py should contain the agent name',
      );
    } finally {
      // Clean up
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('generates with custom preset', async () => {
    const { scaffoldHandlers } = await import('../tools/scaffold.js');
    const tmpDir = '/tmp/agentlaunch-test-brain-' + Date.now();

    try {
      const result = await scaffoldHandlers.scaffold_genesis({
        name: 'BrainTestAgent',
        preset: 'brain',
        outputDir: tmpDir,
      });

      assert.ok(result, 'should return result');
      assert.equal(result.success, true, 'should report success');
      assert.equal(result.preset, 'brain', 'should use brain preset');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('generates expected file set', async () => {
    const { scaffoldHandlers } = await import('../tools/scaffold.js');
    const tmpDir = '/tmp/agentlaunch-test-files-' + Date.now();

    try {
      const result = await scaffoldHandlers.scaffold_genesis({
        name: 'FileSetTest',
        preset: 'analyst',
        outputDir: tmpDir,
      });

      // Verify all expected files were created
      const fileNames = result.files.map((f: string) => {
        const parts = f.split('/');
        return parts[parts.length - 1];
      });

      assert.ok(
        fileNames.includes('agent.py'),
        'should create agent.py',
      );
      assert.ok(
        fileNames.includes('README.md'),
        'should create README.md',
      );
      assert.ok(
        fileNames.includes('.env.example'),
        'should create .env.example',
      );
      assert.ok(
        fileNames.includes('CLAUDE.md'),
        'should create CLAUDE.md',
      );
      assert.ok(
        fileNames.includes('settings.json'),
        'should create .claude/settings.json',
      );
      assert.ok(
        fileNames.includes('agentlaunch.config.json'),
        'should create agentlaunch.config.json',
      );
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

// ---------------------------------------------------------------------------
// scaffold_agent — legacy scaffold, no API key needed
// ---------------------------------------------------------------------------

describe('Integration: MCP scaffold_agent tool', () => {
  it('scaffolds a research agent project', async () => {
    const { scaffoldHandlers } = await import('../tools/scaffold.js');
    const tmpDir = '/tmp/agentlaunch-test-scaffold-' + Date.now();

    try {
      const result = await scaffoldHandlers.scaffold_agent({
        name: 'ResearchTestAgent',
        type: 'research',
        outputDir: tmpDir,
      });

      assert.ok(result, 'should return result');
      assert.equal(result.success, true, 'should report success');
      assert.ok(Array.isArray(result.files), 'should include files array');
      assert.ok(result.files.length > 0, 'should have created files');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

// ---------------------------------------------------------------------------
// check_agent_commerce — needs API key for real Agentverse storage access
// ---------------------------------------------------------------------------

describe('Integration: MCP commerce tools', { skip: SKIP_INTEGRATION }, () => {
  let agentAddress: string;

  before(async () => {
    if (skipIf(!API_KEY, 'No AGENTVERSE_API_KEY set')) return;

    // Find a real agent address
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

  it('check_agent_commerce returns data shape', async () => {
    if (!API_KEY || !agentAddress) return;

    const { commerceHandlers } = await import('../tools/commerce.js');
    const result = await commerceHandlers.check_agent_commerce({
      address: agentAddress,
    });

    assert.ok(result, 'should return result');
    assert.ok(typeof result === 'object', 'result should be an object');

    // Should have at least address in the result
    const obj = result as Record<string, unknown>;
    assert.ok(
      obj.address || obj.revenue !== undefined,
      'result should have address or revenue field',
    );
  });

  it('check_agent_commerce rejects empty address', async () => {
    if (!API_KEY) return;

    const { commerceHandlers } = await import('../tools/commerce.js');

    await assert.rejects(
      () => commerceHandlers.check_agent_commerce({ address: '' }),
      /address.*required/i,
      'should reject empty address',
    );
  });

  it('network_status returns aggregated data', async () => {
    if (!API_KEY || !agentAddress) return;

    const { commerceHandlers } = await import('../tools/commerce.js');
    const result = await commerceHandlers.network_status({
      addresses: [agentAddress],
    });

    assert.ok(result, 'should return result');
    assert.ok(typeof result === 'object', 'result should be an object');

    const obj = result as Record<string, unknown>;

    // Should have aggregation fields
    assert.ok(
      obj.agentCount !== undefined || obj.agents !== undefined,
      'result should have agentCount or agents field',
    );
  });

  it('network_status rejects empty addresses array', async () => {
    if (!API_KEY) return;

    const { commerceHandlers } = await import('../tools/commerce.js');

    await assert.rejects(
      () => commerceHandlers.network_status({ addresses: [] }),
      /addresses.*required/i,
      'should reject empty addresses array',
    );
  });

  it('network_status handles multiple agents', async () => {
    if (!API_KEY || !agentAddress) return;

    // Fetch multiple agents
    const res = await fetch('https://agentverse.ai/v1/hosting/agents', {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    if (!res.ok) return;

    const data = (await res.json()) as Record<string, unknown>;
    const agents = (data.items ?? []) as Array<{ address: string }>;
    if (agents.length < 2) return;

    const addresses = agents.slice(0, 3).map((a) => a.address);

    const { commerceHandlers } = await import('../tools/commerce.js');
    const result = await commerceHandlers.network_status({ addresses });

    assert.ok(result, 'should return result');
    const obj = result as Record<string, unknown>;

    // If the result has agentCount, verify it matches
    if (typeof obj.agentCount === 'number') {
      assert.equal(
        obj.agentCount,
        addresses.length,
        'agentCount should match input addresses length',
      );
    }
  });
});
