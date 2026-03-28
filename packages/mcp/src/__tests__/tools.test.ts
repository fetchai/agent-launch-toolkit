/**
 * MCP tool handler tests
 *
 * Covers: infrastructure (TOOLS array, unknown-tool guard), discovery,
 * calculate, handoff, comment, payment, and org-chart tool categories.
 *
 * All network-dependent handlers are exercised by mocking globalThis.fetch.
 * No external test frameworks -- uses node:test and node:assert/strict.
 */

import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { TOOLS } from '../index.js';
import { discoveryHandlers } from '../tools/discovery.js';
import { calculateHandlers } from '../tools/calculate.js';
import { handoffHandlers } from '../tools/handoff.js';
import { commentHandlers } from '../tools/comments.js';
import { paymentHandlers } from '../tools/payments.js';
import { scaffoldHandlers } from '../tools/scaffold.js';

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
// Helper
// ---------------------------------------------------------------------------

function findTool(name: string) {
  return TOOLS.find((t) => t.name === name);
}

const ADDR = '0x' + 'a'.repeat(40);

// =========================================================================
// 1. MCP Server Infrastructure
// =========================================================================

describe('MCP Server Infrastructure', () => {
  it('MCP-S02: TOOLS array has exactly 38 tools', () => {
    assert.equal(
      TOOLS.length,
      38,
      `Expected 38 tools, got ${TOOLS.length}: ${TOOLS.map((t) => t.name).join(', ')}`,
    );
  });

  it('MCP-S04: unknown tool name is not in any handler map', async () => {
    // Verify an unknown name would not resolve in the handler maps
    const allHandlerKeys = [
      ...Object.keys(discoveryHandlers),
      ...Object.keys(calculateHandlers),
      ...Object.keys(handoffHandlers),
      ...Object.keys(commentHandlers),
      ...Object.keys(paymentHandlers),
      ...Object.keys(scaffoldHandlers),
    ];
    assert.ok(
      !allHandlerKeys.includes('nonexistent_tool'),
      'nonexistent_tool should not appear in any handler map',
    );
  });

  it('MCP-S05: every TOOLS entry has name, description, and inputSchema', () => {
    for (const tool of TOOLS) {
      assert.ok(tool.name, `tool should have a name`);
      assert.ok(tool.description, `${tool.name} should have a description`);
      assert.ok(tool.inputSchema, `${tool.name} should have an inputSchema`);
      assert.equal(
        tool.inputSchema.type,
        'object',
        `${tool.name} inputSchema.type should be "object"`,
      );
    }
  });
});

// =========================================================================
// 2. Discovery Tools
// =========================================================================

describe('Discovery Tools', () => {
  it('MCP-D01: list_tokens returns token list', async () => {
    const mockBody = { items: [{ id: 1, name: 'Test' }], total: 1 };
    restoreFn = installFetchMock(() => Promise.resolve(makeResponse(mockBody)));

    const { _markdown, ...result } = await discoveryHandlers.list_tokens({}) as any;
    assert.deepEqual(result, mockBody);
    assert.ok(typeof _markdown === 'string', 'should include _markdown string');
  });

  it('MCP-D02: list_tokens passes status filter in URL', async () => {
    let capturedUrl = '';
    restoreFn = installFetchMock((url) => {
      capturedUrl = String(url);
      return Promise.resolve(makeResponse({ items: [], total: 0 }));
    });

    await discoveryHandlers.list_tokens({ status: 'bonding' });
    assert.ok(
      capturedUrl.includes('status=bonding'),
      `URL should contain status=bonding, got: ${capturedUrl}`,
    );
  });

  it('MCP-D03: list_tokens passes chainId filter in URL', async () => {
    let capturedUrl = '';
    restoreFn = installFetchMock((url) => {
      capturedUrl = String(url);
      return Promise.resolve(makeResponse({ items: [], total: 0 }));
    });

    await discoveryHandlers.list_tokens({ chainId: 97 });
    assert.ok(
      capturedUrl.includes('chainId=97'),
      `URL should contain chainId=97, got: ${capturedUrl}`,
    );
  });

  it('MCP-D04: get_token by address returns token object', async () => {
    const mockToken = { id: 1, name: 'TokenA', address: ADDR };
    restoreFn = installFetchMock((url) => {
      const u = String(url);
      assert.ok(
        u.includes(`/tokens/address/${ADDR}`),
        `URL should use /tokens/address/ path, got: ${u}`,
      );
      return Promise.resolve(makeResponse(mockToken));
    });

    const { _markdown, ...result } = await discoveryHandlers.get_token({ address: ADDR }) as any;
    assert.deepEqual(result, mockToken);
    assert.ok(typeof _markdown === 'string', 'should include _markdown string');
  });

  it('MCP-D05: get_token by ID uses /tokens/id/{id}', async () => {
    let capturedUrl = '';
    const mockToken = { id: 42, name: 'TokenB' };
    restoreFn = installFetchMock((url) => {
      capturedUrl = String(url);
      return Promise.resolve(makeResponse(mockToken));
    });

    const result = await discoveryHandlers.get_token({ id: 42 });
    assert.ok(
      capturedUrl.includes('/tokens/id/42'),
      `URL should contain /tokens/id/42, got: ${capturedUrl}`,
    );
    const { _markdown, ...resultData } = result as any;
    assert.deepEqual(resultData, mockToken);
    assert.ok(typeof _markdown === 'string', 'should include _markdown string');
  });

  it('MCP-D06: get_token with no address or id throws', async () => {
    await assert.rejects(
      () => discoveryHandlers.get_token({}),
      /Either address(, id,)? or (id |url )?is required/,
    );
  });

  it('MCP-D07: get_platform_stats calls /platform/stats', async () => {
    let capturedUrl = '';
    const mockStats = { totalVolume: '100000', tokenCount: 42 };
    restoreFn = installFetchMock((url) => {
      capturedUrl = String(url);
      return Promise.resolve(makeResponse(mockStats));
    });

    const result = await (discoveryHandlers.get_platform_stats as () => Promise<unknown>)();
    assert.ok(
      capturedUrl.includes('/platform/stats'),
      `URL should contain /platform/stats, got: ${capturedUrl}`,
    );
    const { _markdown, ...resultData } = result as any;
    assert.deepEqual(resultData, mockStats);
    assert.ok(typeof _markdown === 'string', 'should include _markdown string');
  });
});

// =========================================================================
// 3. Calculate Tools
// =========================================================================

describe('Calculate Tools', () => {
  it('MCP-CA01: calculate_buy returns buy preview', async () => {
    const mockBody = {
      tokensReceived: '50000',
      fee: '2',
      priceImpact: '0.5',
    };
    restoreFn = installFetchMock((url) => {
      const u = String(url);
      assert.ok(
        u.includes('/tokens/calculate-buy'),
        `URL should contain /tokens/calculate-buy, got: ${u}`,
      );
      assert.ok(u.includes(`address=${encodeURIComponent(ADDR)}`), 'URL should contain address');
      assert.ok(u.includes('fetAmount=100'), 'URL should contain fetAmount');
      return Promise.resolve(makeResponse(mockBody));
    });

    const { _markdown, ...result } = await calculateHandlers.calculate_buy({
      address: ADDR,
      fetAmount: '100',
    }) as any;
    assert.deepEqual(result, mockBody);
    assert.ok(typeof _markdown === 'string', 'should include _markdown string');
  });

  it('MCP-CA02: calculate_sell returns sell preview', async () => {
    const mockBody = {
      fetReceived: '98',
      fee: '2',
      priceImpact: '0.5',
    };
    restoreFn = installFetchMock((url) => {
      const u = String(url);
      assert.ok(
        u.includes('/tokens/calculate-sell'),
        `URL should contain /tokens/calculate-sell, got: ${u}`,
      );
      assert.ok(u.includes('tokenAmount=50000'), 'URL should contain tokenAmount');
      return Promise.resolve(makeResponse(mockBody));
    });

    const { _markdown, ...result } = await calculateHandlers.calculate_sell({
      address: ADDR,
      tokenAmount: '50000',
    }) as any;
    assert.deepEqual(result, mockBody);
    assert.ok(typeof _markdown === 'string', 'should include _markdown string');
  });
});

// =========================================================================
// 4. Handoff Tools
// =========================================================================

describe('Handoff Tools', () => {
  it('MCP-HO02: get_deploy_instructions returns instructions with handoff link', async () => {
    const mockToken = { id: 42, name: 'Test', symbol: 'TST' };
    restoreFn = installFetchMock(() =>
      Promise.resolve(makeResponse(mockToken)),
    );

    const result = await handoffHandlers.get_deploy_instructions({
      tokenId: 42,
    });

    assert.ok(result.handoffLink, 'should have handoffLink');
    assert.ok(
      result.handoffLink.includes('/deploy/42'),
      `handoffLink should contain /deploy/42, got: ${result.handoffLink}`,
    );
    assert.ok(result.instructions, 'should have instructions');
    assert.ok(result.markdown, 'should have markdown');
    assert.ok(
      result.markdown.includes('Test'),
      'markdown should contain token name',
    );
    assert.ok(
      result.markdown.includes('TST'),
      'markdown should contain token symbol',
    );
  });

  it('MCP-HO03: get_deploy_instructions rejects tokenId=0', async () => {
    await assert.rejects(
      () => handoffHandlers.get_deploy_instructions({ tokenId: 0 }),
      /Invalid tokenId/,
    );
  });

  it('MCP-HO03b: get_deploy_instructions rejects negative tokenId', async () => {
    await assert.rejects(
      () => handoffHandlers.get_deploy_instructions({ tokenId: -5 }),
      /Invalid tokenId/,
    );
  });

  it('MCP-HO04: get_trade_link returns link with action and amount', async () => {
    // get_trade_link tries to fetch token details (optional, may fail)
    restoreFn = installFetchMock(() =>
      Promise.resolve(makeResponse({ error: 'Not found' }, 404)),
    );

    const result = await handoffHandlers.get_trade_link({
      address: ADDR,
      action: 'buy',
      amount: '100',
    });

    assert.ok(result.link, 'should have a link');
    assert.ok(
      result.link.includes('action=buy'),
      `link should contain action=buy, got: ${result.link}`,
    );
    assert.ok(
      result.link.includes('amount=100'),
      `link should contain amount=100, got: ${result.link}`,
    );
  });
});

// =========================================================================
// 5. Comment Tools
// =========================================================================

describe('Comment Tools', () => {
  it('MCP-CO01: get_comments returns comment array', async () => {
    const mockComments = [{ id: 1, message: 'test' }];
    restoreFn = installFetchMock((url) => {
      const u = String(url);
      assert.ok(u.includes(`/comments/${ADDR}`), `URL should contain /comments/${ADDR}`);
      return Promise.resolve(makeResponse(mockComments));
    });

    const result = await commentHandlers.get_comments({ address: ADDR });
    assert.deepEqual(result, mockComments);
  });

  it('MCP-CO02: get_comments rejects empty address', async () => {
    await assert.rejects(
      () => commentHandlers.get_comments({ address: '' }),
      /address is required/,
    );
  });

  it('MCP-CO03: post_comment sends POST with message body', async () => {
    // The module-level AgentLaunchClient in comments.ts captures the API key
    // at construction time. We use a fresh dynamic import after setting the
    // env var so the client picks it up.
    let capturedBody: string | undefined;
    let capturedMethod: string | undefined;

    const savedKey = process.env['AGENTVERSE_API_KEY'];
    process.env['AGENTVERSE_API_KEY'] = 'test-key-for-post';

    restoreFn = installFetchMock((_url, init) => {
      capturedMethod = init?.method;
      capturedBody = init?.body as string;
      return Promise.resolve(makeResponse({ success: true }));
    });

    try {
      // Dynamic import with cache-busting query so that a fresh module
      // instance is created with the env var set.
      const mod = await import(`../tools/comments.js?t=${Date.now()}`);
      await mod.commentHandlers.post_comment({
        address: ADDR,
        message: 'Hello',
      });
    } finally {
      if (savedKey) process.env['AGENTVERSE_API_KEY'] = savedKey;
      else delete process.env['AGENTVERSE_API_KEY'];
    }

    assert.equal(capturedMethod, 'POST', 'should use POST method');
    assert.ok(capturedBody, 'should have a request body');
    const parsed = JSON.parse(capturedBody!);
    assert.equal(parsed.message, 'Hello', 'body should contain message');
  });

  it('MCP-CO04: post_comment rejects empty message', async () => {
    await assert.rejects(
      () =>
        commentHandlers.post_comment({
          address: ADDR,
          message: '',
        }),
      /message is required/,
    );
  });
});

// =========================================================================
// 6. Payment Tools
// =========================================================================

describe('Payment Tools', () => {
  it('MCP-PAY04: create_delegation returns link with /delegate', () => {
    // createSpendingLimitHandoff is synchronous (no fetch needed)
    const result = paymentHandlers.create_delegation({
      tokenSymbol: 'FET',
      amount: '100',
      agentAddress: ADDR,
    });

    // create_delegation returns a Promise (handler is async-typed)
    // But the underlying function is sync -- the Promise wraps immediately
    assert.ok(result instanceof Promise || typeof result === 'object');

    // Resolve if promise
    return Promise.resolve(result).then((r) => {
      assert.ok(r.link, 'should have a link');
      assert.ok(
        r.link.includes('/delegate'),
        `link should contain /delegate, got: ${r.link}`,
      );
      assert.equal(r.token, 'FET', 'should have token=FET');
      assert.equal(r.amount, '100', 'should have amount=100');
      assert.equal(r.spender, ADDR, 'should have spender=address');
    });
  });

  it('MCP-PAY05: get_fiat_link returns moonpay URL', async () => {
    const result = await paymentHandlers.get_fiat_link({
      fiatAmount: '50',
      walletAddress: ADDR,
    });

    assert.equal(result.provider, 'moonpay', 'default provider should be moonpay');
    assert.ok(result.url, 'should have a url');
    assert.ok(
      result.url.includes('moonpay.com'),
      `URL should contain moonpay.com, got: ${result.url}`,
    );
  });

  it('MCP-PAY06: get_fiat_link rejects unsupported crypto token', async () => {
    await assert.rejects(
      () =>
        paymentHandlers.get_fiat_link({
          fiatAmount: '50',
          walletAddress: ADDR,
          cryptoToken: 'INVALID',
        }),
      /Unsupported crypto token/,
    );
  });
});

// =========================================================================
// 7. Org Chart Tools
// =========================================================================

describe('Org Chart Tools', () => {
  it('MCP-ORG01: generate_org_template returns SMB template by default', async () => {
    const result = await scaffoldHandlers.generate_org_template({});

    assert.equal(result.success, true, 'should report success');
    assert.equal(result.size, 'smb', 'default size should be smb');
    assert.ok(result.template, 'should have a template string');
    assert.ok(
      typeof result.template === 'string',
      'template should be a string',
    );
    assert.ok(
      result.template.length > 50,
      'template should have substantial content',
    );
  });

  it('MCP-ORG02: generate_org_template respects size parameter', async () => {
    const startup = await scaffoldHandlers.generate_org_template({
      size: 'startup',
    });
    assert.equal(startup.size, 'startup');
    assert.ok(
      startup.template.includes('Startup'),
      'startup template should mention Startup',
    );

    const enterprise = await scaffoldHandlers.generate_org_template({
      size: 'enterprise',
    });
    assert.equal(enterprise.size, 'enterprise');
    assert.ok(
      enterprise.template.includes('Enterprise'),
      'enterprise template should mention Enterprise',
    );
  });

  it('MCP-ORG03: scaffold_org_swarm returns config without writing files', async () => {
    const result = await scaffoldHandlers.scaffold_org_swarm({
      orgChart: {
        name: 'TestOrg',
        cSuite: [{ role: 'ceo' as const, name: 'CEO Agent' }],
      },
    });

    assert.equal(result.success, true, 'should report success');
    assert.equal(result.orgName, 'TestOrg', 'orgName should match input');
    assert.ok(
      result.totalAgents > 0,
      `should have at least 1 agent, got: ${result.totalAgents}`,
    );
    assert.ok(result.config, 'should have config object');
    assert.ok(
      Array.isArray(result.config.agents),
      'config.agents should be an array',
    );
    assert.ok(
      result.config.agents.length > 0,
      'should have generated agent configs',
    );
    assert.equal(
      result.scaffoldedTo,
      undefined,
      'should not have scaffoldedTo when no outputDir',
    );
  });
});
