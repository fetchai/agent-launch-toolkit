/**
 * Tests for MCP authentication tools — W-14, W-15
 *
 * Verifies:
 *   - wallet_auth tool is registered in the TOOLS array
 *   - check_auth tool is registered in the TOOLS array
 *   - wallet_auth has required input properties
 *   - check_auth handles missing API key gracefully
 *   - authHandlers exports the expected handler functions
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { TOOLS } from '../index.js';

// ---------------------------------------------------------------------------
// Helper: find tool by name
// ---------------------------------------------------------------------------

function findTool(name: string) {
  return TOOLS.find((t) => t.name === name);
}

// ---------------------------------------------------------------------------
// Tool registration
// ---------------------------------------------------------------------------

describe('MCP auth tools — registration', () => {
  it('wallet_auth tool is registered in TOOLS', () => {
    const tool = findTool('wallet_auth');
    assert.ok(tool, 'wallet_auth should be in TOOLS array');
    assert.ok(tool.description, 'should have a description');
    assert.ok(tool.inputSchema, 'should have an inputSchema');
  });

  it('wallet_auth requires private_key parameter', () => {
    const tool = findTool('wallet_auth');
    assert.ok(tool, 'wallet_auth should exist');
    const props = tool.inputSchema.properties as Record<string, unknown>;
    assert.ok(props.private_key, 'should have private_key property');
    assert.ok(
      (tool.inputSchema.required as string[])?.includes('private_key'),
      'private_key should be required',
    );
  });

  it('wallet_auth has optional expires_in parameter', () => {
    const tool = findTool('wallet_auth');
    assert.ok(tool, 'wallet_auth should exist');
    const props = tool.inputSchema.properties as Record<string, unknown>;
    assert.ok(props.expires_in, 'should have expires_in property');
    assert.ok(
      !(tool.inputSchema.required as string[])?.includes('expires_in'),
      'expires_in should be optional',
    );
  });

  it('check_auth tool is registered in TOOLS', () => {
    const tool = findTool('check_auth');
    assert.ok(tool, 'check_auth should be in TOOLS array');
    assert.ok(tool.description, 'should have a description');
    assert.ok(tool.inputSchema, 'should have an inputSchema');
  });

  it('check_auth has no required parameters', () => {
    const tool = findTool('check_auth');
    assert.ok(tool, 'check_auth should exist');
    const required = tool.inputSchema.required as string[] | undefined;
    assert.ok(
      !required || required.length === 0,
      'check_auth should have no required parameters',
    );
  });
});

// ---------------------------------------------------------------------------
// Tool schema structure
// ---------------------------------------------------------------------------

describe('MCP auth tools — schema structure', () => {
  it('auth tools have valid inputSchema type', () => {
    const toolNames = ['wallet_auth', 'check_auth'];

    for (const name of toolNames) {
      const tool = findTool(name);
      assert.ok(tool, `${name} should exist`);
      assert.equal(
        tool.inputSchema.type,
        'object',
        `${name} inputSchema.type should be "object"`,
      );
    }
  });

  it('wallet_auth description mentions security', () => {
    const tool = findTool('wallet_auth');
    assert.ok(tool, 'wallet_auth should exist');
    assert.ok(
      tool.description.toLowerCase().includes('security') ||
      tool.description.toLowerCase().includes('never logged'),
      'wallet_auth description should mention security aspects',
    );
  });
});

// ---------------------------------------------------------------------------
// Handler behavior tests
// ---------------------------------------------------------------------------

describe('MCP auth tools — handler behavior', () => {
  it('authHandlers exports the expected handler functions', async () => {
    const { authHandlers } = await import('../tools/auth.js');

    assert.ok(authHandlers, 'authHandlers should be exported');
    assert.ok(
      typeof authHandlers === 'object',
      'authHandlers should be an object',
    );

    assert.ok(
      typeof authHandlers.wallet_auth === 'function',
      'should have wallet_auth handler',
    );
    assert.ok(
      typeof authHandlers.check_auth === 'function',
      'should have check_auth handler',
    );
  });

  it('check_auth handler returns valid=false when no API key is set', async () => {
    const { authHandlers } = await import('../tools/auth.js');

    // Save and clear env vars
    const originalKey1 = process.env['AGENTVERSE_API_KEY'];
    const originalKey2 = process.env['AGENT_LAUNCH_API_KEY'];
    delete process.env['AGENTVERSE_API_KEY'];
    delete process.env['AGENT_LAUNCH_API_KEY'];

    try {
      const result = await authHandlers.check_auth();

      assert.ok(result, 'should return a result');
      assert.equal(result.success, true, 'success should be true');
      assert.equal(result.valid, false, 'valid should be false');
      assert.ok(result.error, 'should have an error message');
      assert.ok(
        result.error.includes('No API key'),
        'error should mention missing API key',
      );
    } finally {
      // Restore env vars
      if (originalKey1) process.env['AGENTVERSE_API_KEY'] = originalKey1;
      if (originalKey2) process.env['AGENT_LAUNCH_API_KEY'] = originalKey2;
    }
  });

  it('check_auth handler returns valid=false when API key is invalid', async () => {
    const { authHandlers } = await import('../tools/auth.js');

    // Mock fetch to return 401
    const originalFetch = globalThis.fetch;
    const originalKey = process.env['AGENTVERSE_API_KEY'];
    process.env['AGENTVERSE_API_KEY'] = 'av-invalid-test-key';
    globalThis.fetch = (() =>
      Promise.resolve({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: 'Unauthorized' }),
        text: () => Promise.resolve('Unauthorized'),
      })) as unknown as typeof globalThis.fetch;

    try {
      const result = await authHandlers.check_auth();

      assert.ok(result, 'should return a result');
      assert.equal(result.success, true, 'success should be true');
      assert.equal(result.valid, false, 'valid should be false for invalid key');
      assert.ok(result.error, 'should have an error message');
    } finally {
      globalThis.fetch = originalFetch;
      if (originalKey) process.env['AGENTVERSE_API_KEY'] = originalKey;
      else delete process.env['AGENTVERSE_API_KEY'];
    }
  });

  it('check_auth handler returns valid=true for valid API key', async () => {
    const { authHandlers } = await import('../tools/auth.js');

    // Mock fetch to return success
    const originalFetch = globalThis.fetch;
    const originalKey = process.env['AGENTVERSE_API_KEY'];
    process.env['AGENTVERSE_API_KEY'] = 'av-valid-test-key';
    globalThis.fetch = (() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              agents: [
                { address: 'agent1qtest1', name: 'Test Agent 1' },
                { address: 'agent1qtest2', name: 'Test Agent 2' },
              ],
              count: 2,
            },
          }),
        text: () =>
          Promise.resolve(
            JSON.stringify({
              success: true,
              data: { agents: [], count: 0 },
            }),
          ),
      })) as unknown as typeof globalThis.fetch;

    try {
      const result = await authHandlers.check_auth();

      assert.ok(result, 'should return a result');
      assert.equal(result.success, true, 'success should be true');
      assert.equal(result.valid, true, 'valid should be true');
      assert.equal(result.agentCount, 2, 'should return agent count');
    } finally {
      globalThis.fetch = originalFetch;
      if (originalKey) process.env['AGENTVERSE_API_KEY'] = originalKey;
      else delete process.env['AGENTVERSE_API_KEY'];
    }
  });

  it('wallet_auth handler throws error when private_key is missing', async () => {
    const { authHandlers } = await import('../tools/auth.js');

    try {
      await authHandlers.wallet_auth({ private_key: '' });
      assert.fail('should have thrown an error');
    } catch (err) {
      assert.ok(err instanceof Error, 'should throw an Error');
      assert.ok(
        (err as Error).message.includes('private_key'),
        'error message should mention private_key',
      );
    }
  });
});
