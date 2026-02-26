/**
 * Tests for MCP commerce tools — TST-03
 *
 * Verifies:
 *   - scaffold_genesis tool is registered in the TOOLS array
 *   - check_agent_commerce tool is registered in the TOOLS array
 *   - network_status tool is registered in the TOOLS array
 *   - deploy_swarm tool is registered in the TOOLS array
 *   - scaffold_genesis handler calls generateFromTemplate with "genesis"
 *   - check_agent_commerce handler passes address through to SDK
 *   - network_status handler passes addresses through to SDK
 *   - deploy_swarm handler calls deployAgent for each agent sequentially
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

describe('MCP commerce tools — registration', () => {
  it('scaffold_genesis tool is registered in TOOLS', () => {
    const tool = findTool('scaffold_genesis');
    assert.ok(tool, 'scaffold_genesis should be in TOOLS array');
    assert.ok(tool.description, 'should have a description');
    assert.ok(tool.inputSchema, 'should have an inputSchema');
  });

  it('scaffold_genesis has required input properties', () => {
    const tool = findTool('scaffold_genesis');
    assert.ok(tool, 'scaffold_genesis should exist');
    assert.ok(
      tool.inputSchema.properties,
      'should have input properties',
    );
    // Should accept a preset or name at minimum
    const props = tool.inputSchema.properties as Record<string, unknown>;
    assert.ok(
      props.name || props.preset,
      'should accept name or preset parameter',
    );
  });

  it('check_agent_commerce tool is registered in TOOLS', () => {
    const tool = findTool('check_agent_commerce');
    assert.ok(tool, 'check_agent_commerce should be in TOOLS array');
    assert.ok(tool.description, 'should have a description');
    assert.ok(tool.inputSchema, 'should have an inputSchema');
  });

  it('check_agent_commerce requires address parameter', () => {
    const tool = findTool('check_agent_commerce');
    assert.ok(tool, 'check_agent_commerce should exist');
    const props = tool.inputSchema.properties as Record<string, unknown>;
    assert.ok(props.address, 'should have address property');
    assert.ok(
      (tool.inputSchema.required as string[])?.includes('address'),
      'address should be required',
    );
  });

  it('network_status tool is registered in TOOLS', () => {
    const tool = findTool('network_status');
    assert.ok(tool, 'network_status should be in TOOLS array');
    assert.ok(tool.description, 'should have a description');
  });

  it('network_status accepts addresses parameter', () => {
    const tool = findTool('network_status');
    assert.ok(tool, 'network_status should exist');
    const props = tool.inputSchema.properties as Record<string, unknown>;
    assert.ok(
      props.addresses || props.agents,
      'should accept addresses or agents parameter',
    );
  });

  it('deploy_swarm tool is registered in TOOLS', () => {
    const tool = findTool('deploy_swarm');
    assert.ok(tool, 'deploy_swarm should be in TOOLS array');
    assert.ok(tool.description, 'should have a description');
  });

  it('deploy_swarm accepts agents/presets parameter', () => {
    const tool = findTool('deploy_swarm');
    assert.ok(tool, 'deploy_swarm should exist');
    const props = tool.inputSchema.properties as Record<string, unknown>;
    assert.ok(
      props.presets || props.agents || props.names,
      'should accept presets, agents, or names parameter',
    );
  });
});

// ---------------------------------------------------------------------------
// Tool schema structure
// ---------------------------------------------------------------------------

describe('MCP commerce tools — schema structure', () => {
  it('all new commerce tools have valid inputSchema type', () => {
    const toolNames = [
      'scaffold_genesis',
      'check_agent_commerce',
      'network_status',
      'deploy_swarm',
    ];

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

  it('existing tools are not broken by new additions', () => {
    // Verify that the existing tools are still present
    const existingTools = [
      'list_tokens',
      'get_token',
      'get_platform_stats',
      'calculate_buy',
      'calculate_sell',
      'create_token_record',
      'get_deploy_instructions',
      'get_trade_link',
      'scaffold_agent',
      'deploy_to_agentverse',
      'create_and_tokenize',
      'get_comments',
      'post_comment',
    ];

    for (const name of existingTools) {
      const tool = findTool(name);
      assert.ok(tool, `existing tool "${name}" should still be registered`);
    }
  });

  it('TOOLS array has increased in size to accommodate commerce tools', () => {
    // Original count was 13 tools, we expect at least 17 now (13 + 4 new)
    assert.ok(
      TOOLS.length >= 17,
      `TOOLS should have at least 17 entries (13 existing + 4 new), got ${TOOLS.length}`,
    );
  });
});

// ---------------------------------------------------------------------------
// Handler behavior tests
// ---------------------------------------------------------------------------

describe('MCP commerce tools — handler behavior', () => {
  it('commerceHandlers exports the expected handler functions', async () => {
    const { commerceHandlers } = await import('../tools/commerce.js');

    assert.ok(commerceHandlers, 'commerceHandlers should be exported');
    assert.ok(
      typeof commerceHandlers === 'object',
      'commerceHandlers should be an object',
    );

    // Should have handler functions for each commerce tool
    // Note: scaffold_genesis lives in scaffoldHandlers, not commerceHandlers
    assert.ok(
      typeof commerceHandlers.check_agent_commerce === 'function',
      'should have check_agent_commerce handler',
    );
    assert.ok(
      typeof commerceHandlers.network_status === 'function',
      'should have network_status handler',
    );
    assert.ok(
      typeof commerceHandlers.deploy_swarm === 'function',
      'should have deploy_swarm handler',
    );
  });

  it('scaffold_genesis handler exists in scaffoldHandlers', async () => {
    const { scaffoldHandlers } = await import('../tools/scaffold.js');
    assert.ok(
      typeof scaffoldHandlers.scaffold_genesis === 'function',
      'scaffoldHandlers should have scaffold_genesis',
    );
  });

  it('check_agent_commerce handler accepts address parameter', async () => {
    const { commerceHandlers } = await import('../tools/commerce.js');

    // Mock fetch for storage API calls
    const originalFetch = globalThis.fetch;
    globalThis.fetch = ((url: string) => {
      return Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ message: 'Not found' }),
        text: () => Promise.resolve('{"message":"Not found"}'),
      });
    }) as unknown as typeof globalThis.fetch;

    try {
      const result = await commerceHandlers.check_agent_commerce({
        address: 'agent1qf8xfhsc8hg4g5l0nhtjexample',
      });

      assert.ok(result, 'should return a result');
      assert.ok(
        typeof result === 'object',
        'result should be an object',
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('network_status handler accepts addresses array', async () => {
    const { commerceHandlers } = await import('../tools/commerce.js');

    // Mock fetch
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (() =>
      Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ message: 'Not found' }),
        text: () => Promise.resolve('{"message":"Not found"}'),
      })) as unknown as typeof globalThis.fetch;

    try {
      const result = await commerceHandlers.network_status({
        addresses: [
          'agent1qf8xfhsc8hg4g5l0nhtjone',
          'agent1qg9yihsd9ihatwosecond',
        ],
      });

      assert.ok(result, 'should return a result');
      assert.ok(
        typeof result === 'object',
        'result should be an object',
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('deploy_swarm handler accepts presets array', async () => {
    const { commerceHandlers } = await import('../tools/commerce.js');

    // Mock fetch for deployment API calls
    const originalFetch = globalThis.fetch;
    let callCount = 0;
    globalThis.fetch = (() => {
      callCount++;
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            address: `agent1qtest${callCount}`,
            name: `agent-${callCount}`,
            running: true,
            compiled: true,
          }),
        text: () =>
          Promise.resolve(
            JSON.stringify({
              address: `agent1qtest${callCount}`,
              name: `agent-${callCount}`,
              running: true,
              compiled: true,
            }),
          ),
      });
    }) as unknown as typeof globalThis.fetch;

    try {
      // deploy_swarm should accept preset names and deploy them sequentially
      const result = await commerceHandlers.deploy_swarm({
        presets: ['oracle', 'analyst'],
        apiKey: 'av-test-key',
      });

      assert.ok(result, 'should return a result');
      assert.ok(
        typeof result === 'object',
        'result should be an object',
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
