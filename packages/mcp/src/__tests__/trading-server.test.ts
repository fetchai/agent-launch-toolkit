/**
 * Tests for MCP trading tools, server registration, and commerce handler
 * resilience.
 *
 * Test IDs:
 *   MCP-TR01  buy_tokens dry-run returns preview via calculateBuy API
 *   MCP-TR03  sell_tokens dry-run returns preview via calculateSell API
 *   MCP-TR05  get_wallet_balances handler exists
 *   MCP-S02   All 40 tools registered in TOOLS array
 *   MCP-S03   Every tool has valid name, description, and inputSchema
 *   MCP-S04   Handler maps do not contain unknown tool names
 *   MCP-CM03  check_agent_commerce handles storage failures gracefully
 *   MCP-CM06  network_status handles per-agent failures gracefully
 *   MCP-SC03  scaffold_agent falls back to custom for unknown type
 *
 * Run with: npm test (from packages/mcp/)
 */

import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { TOOLS } from '../index.js';
import { tradingHandlers } from '../tools/trading.js';
import { commerceHandlers } from '../tools/commerce.js';
import { scaffoldHandlers } from '../tools/scaffold.js';
import { discoveryHandlers } from '../tools/discovery.js';
import { calculateHandlers } from '../tools/calculate.js';
import { handoffHandlers } from '../tools/handoff.js';
import { agentverseHandlers } from '../tools/agentverse.js';
import { tokenizeHandlers } from '../tools/tokenize.js';
import { commentHandlers } from '../tools/comments.js';
import { paymentHandlers } from '../tools/payments.js';
import { custodialHandlers } from '../tools/custodial.js';
import { skillHandlers } from '../tools/skill.js';
import { authHandlers } from '../tools/auth.js';
import { connectHandlers as deployConnectHandlers } from '../tools/connect/deploy.js';
import { connectHandlers as statusConnectHandlers } from '../tools/connect/status.js';
import { connectHandlers as updateConnectHandlers } from '../tools/connect/update.js';

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
    text: () => Promise.resolve(JSON.stringify(body)),
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
// 1. Trading Tools
// ---------------------------------------------------------------------------

describe('MCP trading tools', () => {
  // MCP-TR01
  it('buy_tokens dry-run returns preview via calculateBuy API', async () => {
    restoreFn = installFetchMock(async (url) => {
      if (url.toString().includes('/tokens/calculate-buy')) {
        return makeResponse({
          tokensReceived: '500000',
          fee: '2',
          priceImpact: '0.5',
          price: '0.0002',
        });
      }
      return makeResponse({}, 404);
    });

    const result = await tradingHandlers.buy_tokens({
      address: '0x' + 'a'.repeat(40),
      fetAmount: '100',
      dryRun: true,
    });

    assert.equal(result.dryRun, true, 'should indicate dry run');
    assert.equal(
      (result as unknown as Record<string, unknown>).tokensReceived,
      '500000',
      'should return tokensReceived from API',
    );
  });

  // MCP-TR03
  it('sell_tokens dry-run returns preview via calculateSell API', async () => {
    restoreFn = installFetchMock(async (url) => {
      if (url.toString().includes('/tokens/calculate-sell')) {
        return makeResponse({
          fetReceived: '95',
          fee: '2',
          priceImpact: '1.2',
          price: '0.00019',
        });
      }
      return makeResponse({}, 404);
    });

    const result = await tradingHandlers.sell_tokens({
      address: '0x' + 'b'.repeat(40),
      tokenAmount: '500000',
      dryRun: true,
    });

    assert.equal(result.dryRun, true, 'should indicate dry run');
    assert.equal(
      (result as unknown as Record<string, unknown>).fetReceived,
      '95',
      'should return fetReceived from API',
    );
  });

  // MCP-TR05
  it('get_wallet_balances handler exists and is a function', () => {
    assert.equal(
      typeof tradingHandlers.get_wallet_balances,
      'function',
      'get_wallet_balances handler should be a function',
    );
  });

  it('tradingHandlers exports exactly 3 handlers', () => {
    const keys = Object.keys(tradingHandlers);
    assert.equal(keys.length, 3, 'should have 3 trading handlers');
    assert.ok(keys.includes('buy_tokens'), 'should include buy_tokens');
    assert.ok(keys.includes('sell_tokens'), 'should include sell_tokens');
    assert.ok(
      keys.includes('get_wallet_balances'),
      'should include get_wallet_balances',
    );
  });
});

// ---------------------------------------------------------------------------
// 2. Server Registration & Infrastructure
// ---------------------------------------------------------------------------

describe('MCP server registration', () => {
  const EXPECTED_TOOLS = [
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
    'update_agent_metadata',
    'create_and_tokenize',
    'get_comments',
    'post_comment',
    'scaffold_swarm',
    'check_agent_commerce',
    'network_status',
    'buy_tokens',
    'sell_tokens',
    'get_wallet_balances',
    'deploy_swarm',
    'multi_token_payment',
    'check_spending_limit',
    'create_delegation',
    'get_fiat_link',
    'create_invoice',
    'list_invoices',
    'generate_org_template',
    'scaffold_org_swarm',
    'get_multi_token_balances',
    'get_agent_wallet',
    'buy_token',
    'sell_token',
    'get_skill',
    'install_skill',
    'connect_agent',
    'get_connection_status',
    'update_connection',
    'wallet_auth',
    'check_auth',
    'generate_wallet',
  ];

  // MCP-S02
  it('TOOLS array has exactly 41 entries', () => {
    assert.equal(
      TOOLS.length,
      41,
      `expected 41 tools, got ${TOOLS.length}`,
    );
  });

  it('every expected tool name is registered in TOOLS', () => {
    const toolNames = TOOLS.map((t) => t.name);
    for (const expected of EXPECTED_TOOLS) {
      assert.ok(
        toolNames.includes(expected),
        `missing tool: ${expected}`,
      );
    }
  });

  it('no unexpected tools exist in TOOLS', () => {
    const toolNames = TOOLS.map((t) => t.name);
    for (const name of toolNames) {
      assert.ok(
        EXPECTED_TOOLS.includes(name),
        `unexpected tool found: ${name}`,
      );
    }
  });

  // MCP-S03
  it('every tool has name (string), description (non-empty string), and inputSchema with type object', () => {
    for (const tool of TOOLS) {
      assert.equal(typeof tool.name, 'string', `tool name should be string`);
      assert.ok(tool.name.length > 0, `tool name should not be empty`);

      assert.equal(
        typeof tool.description,
        'string',
        `${tool.name}: description should be string`,
      );
      assert.ok(
        tool.description.length > 0,
        `${tool.name}: description should not be empty`,
      );

      assert.ok(
        tool.inputSchema,
        `${tool.name}: should have inputSchema`,
      );
      assert.equal(
        tool.inputSchema.type,
        'object',
        `${tool.name}: inputSchema.type should be 'object'`,
      );
    }
  });

  // MCP-S04
  it('all handler map keys exist in TOOLS', () => {
    const toolNames = TOOLS.map((t) => t.name);

    const allHandlerMaps = [
      { name: 'discoveryHandlers', map: discoveryHandlers },
      { name: 'calculateHandlers', map: calculateHandlers },
      { name: 'handoffHandlers', map: handoffHandlers },
      { name: 'scaffoldHandlers', map: scaffoldHandlers },
      { name: 'agentverseHandlers', map: agentverseHandlers },
      { name: 'tokenizeHandlers', map: tokenizeHandlers },
      { name: 'commentHandlers', map: commentHandlers },
      { name: 'commerceHandlers', map: commerceHandlers },
      { name: 'tradingHandlers', map: tradingHandlers },
      { name: 'paymentHandlers', map: paymentHandlers },
      { name: 'custodialHandlers', map: custodialHandlers },
      { name: 'skillHandlers', map: skillHandlers },
      { name: 'authHandlers', map: authHandlers },
      { name: 'deployConnectHandlers', map: deployConnectHandlers },
      { name: 'statusConnectHandlers', map: statusConnectHandlers },
      { name: 'updateConnectHandlers', map: updateConnectHandlers },
    ];

    for (const { name: mapName, map } of allHandlerMaps) {
      for (const handlerName of Object.keys(map)) {
        assert.ok(
          toolNames.includes(handlerName),
          `${mapName}.${handlerName} is not in TOOLS`,
        );
      }
    }
  });

  it('every TOOLS entry has a corresponding handler', () => {
    const allHandlers: Record<string, unknown> = {
      ...discoveryHandlers,
      ...calculateHandlers,
      ...handoffHandlers,
      ...scaffoldHandlers,
      ...agentverseHandlers,
      ...tokenizeHandlers,
      ...commentHandlers,
      ...commerceHandlers,
      ...tradingHandlers,
      ...paymentHandlers,
      ...custodialHandlers,
      ...skillHandlers,
      ...authHandlers,
      ...deployConnectHandlers,
      ...statusConnectHandlers,
      ...updateConnectHandlers,
    };

    for (const tool of TOOLS) {
      assert.ok(
        tool.name in allHandlers,
        `tool "${tool.name}" has no handler in any handler map`,
      );
      assert.equal(
        typeof allHandlers[tool.name],
        'function',
        `handler for "${tool.name}" should be a function`,
      );
    }
  });

  it('handler maps do not contain a nonexistent tool name', () => {
    const allHandlers: Record<string, unknown> = {
      ...discoveryHandlers,
      ...calculateHandlers,
      ...handoffHandlers,
      ...scaffoldHandlers,
      ...agentverseHandlers,
      ...tokenizeHandlers,
      ...commentHandlers,
      ...commerceHandlers,
      ...tradingHandlers,
      ...paymentHandlers,
      ...custodialHandlers,
      ...skillHandlers,
      ...deployConnectHandlers,
      ...statusConnectHandlers,
      ...updateConnectHandlers,
    };

    assert.equal(
      'nonexistent_tool' in allHandlers,
      false,
      'no handler map should contain nonexistent_tool',
    );
  });
});

// ---------------------------------------------------------------------------
// 3. Commerce/Swarm Tools
// ---------------------------------------------------------------------------

describe('MCP commerce tools — resilience', () => {
  // MCP-CM03
  it('check_agent_commerce handles storage failures gracefully', async () => {
    const origKey = process.env['AGENTVERSE_API_KEY'];
    process.env['AGENTVERSE_API_KEY'] = 'test-key';

    // Mock fetch to return 404 for all storage calls.
    // The SDK's getStorage returns null on 404, so getAgentCommerceStatus
    // should still return a result (all fields defaulting to null/empty).
    restoreFn = installFetchMock(async () =>
      makeResponse({ message: 'Not found' }, 404),
    );

    try {
      const result = await commerceHandlers.check_agent_commerce({
        address: 'agent1qtestaddress',
      });
      assert.ok(result, 'should return a result even when storage returns 404');
      assert.equal(
        typeof result,
        'object',
        'result should be an object',
      );
    } finally {
      if (origKey) process.env['AGENTVERSE_API_KEY'] = origKey;
      else delete process.env['AGENTVERSE_API_KEY'];
    }
  });

  it('check_agent_commerce rejects empty address', async () => {
    await assert.rejects(
      () => commerceHandlers.check_agent_commerce({ address: '' }),
      /address.*required/i,
      'should reject empty address',
    );
  });

  // MCP-CM06
  it('network_status handles per-agent failures gracefully', async () => {
    const origKey = process.env['AGENTVERSE_API_KEY'];
    process.env['AGENTVERSE_API_KEY'] = 'test-key';

    restoreFn = installFetchMock(async () =>
      makeResponse({ message: 'Not found' }, 404),
    );

    try {
      const result = await commerceHandlers.network_status({
        addresses: ['agent1qfail1', 'agent1qfail2'],
      });
      assert.ok(result, 'should return a result even with failing agents');

      const obj = result as Record<string, unknown>;
      // The result shape depends on whether the SDK's getNetworkGDP is used
      // (returns agents/totalGDP) or the fallback (returns agentCount/agents).
      // Either way, the agents array should be present.
      assert.ok(
        Array.isArray(obj.agents),
        'result should have agents array',
      );
      assert.equal(
        (obj.agents as unknown[]).length,
        2,
        'agents array length should match input',
      );
    } finally {
      if (origKey) process.env['AGENTVERSE_API_KEY'] = origKey;
      else delete process.env['AGENTVERSE_API_KEY'];
    }
  });

  it('network_status rejects empty addresses array', async () => {
    await assert.rejects(
      () => commerceHandlers.network_status({ addresses: [] }),
      /addresses.*required/i,
      'should reject empty addresses array',
    );
  });
});

// ---------------------------------------------------------------------------
// 4. Scaffold Fallback
// ---------------------------------------------------------------------------

describe('MCP scaffold tools — fallback', () => {
  // MCP-SC03
  it('scaffold_agent falls back to custom for unknown type', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-test-'));
    // Create a subdirectory within cwd so path validation passes
    const cwdTmp = path.join(process.cwd(), '.test-output', 'scaffold-' + Date.now());

    try {
      const result = await scaffoldHandlers.scaffold_agent({
        name: 'TestFallbackAgent',
        type: 'nonexistent-type',
        outputDir: cwdTmp,
      });

      assert.equal(result.success, true, 'should report success');
      assert.ok(result.files.length > 0, 'should have created files');

      // Verify agent.py was created
      assert.ok(
        fs.existsSync(path.join(cwdTmp, 'agent.py')),
        'agent.py should exist in the output directory',
      );

      // Verify the generated agent.py contains uagents import
      const code = fs.readFileSync(path.join(cwdTmp, 'agent.py'), 'utf8');
      assert.ok(
        code.includes('from uagents import'),
        'agent.py should contain uagents import',
      );
    } finally {
      fs.rmSync(cwdTmp, { recursive: true, force: true });
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('scaffold_agent uses research template for research type', async () => {
    const cwdTmp = path.join(process.cwd(), '.test-output', 'scaffold-research-' + Date.now());

    try {
      const result = await scaffoldHandlers.scaffold_agent({
        name: 'ResearchAgent',
        type: 'research',
        outputDir: cwdTmp,
      });

      assert.equal(result.success, true, 'should report success');
      assert.ok(result.files.length > 0, 'should have created files');
      assert.ok(
        fs.existsSync(path.join(cwdTmp, 'agent.py')),
        'agent.py should exist',
      );
    } finally {
      fs.rmSync(cwdTmp, { recursive: true, force: true });
    }
  });
});
