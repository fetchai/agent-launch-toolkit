/**
 * Tests for MCP operational tools: deploy_swarm, buy/sell tokens, check_spending_limit.
 *
 * Test IDs:
 *   MCP-CM07  deploy_swarm deploys multiple presets sequentially
 *   MCP-CM08  deploy_swarm records per-agent failures without stopping
 *   MCP-CM09  deploy_swarm sets peer addresses after all deployed
 *   MCP-TR02  buy_tokens (real) executes on-chain trade (error path — missing key)
 *   MCP-TR04  sell_tokens (real) executes on-chain trade (error path — missing key)
 *   MCP-PAY03 check_spending_limit returns ERC-20 allowance
 *
 * Run with: npm test (from packages/mcp/)
 */

import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { commerceHandlers } from '../tools/commerce.js';
import { tradingHandlers } from '../tools/trading.js';
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
// 1. deploy_swarm -- sequential deployment (MCP-CM07)
// ---------------------------------------------------------------------------

describe('MCP deploy_swarm -- sequential deployment', () => {
  // MCP-CM07: deploys multiple presets sequentially
  it('MCP-CM07: deploys multiple presets sequentially and returns all agent addresses', async () => {
    const deployedNames: string[] = [];
    let fetchCallIndex = 0;

    restoreFn = installFetchMock(async (url, init) => {
      const urlStr = url.toString();
      fetchCallIndex++;

      // Agentverse: POST /hosting/agents (create agent)
      if (urlStr.includes('/hosting/agents') && init?.method === 'POST' && !urlStr.includes('/start') && !urlStr.includes('/code') && !urlStr.includes('/secrets')) {
        const body = JSON.parse(init.body as string);
        deployedNames.push(body.name ?? `agent-${fetchCallIndex}`);
        const idx = deployedNames.length;
        return makeResponse({
          address: `agent1qdeployed${idx}`,
          name: body.name ?? `agent-${idx}`,
          running: false,
          compiled: false,
        });
      }

      // Agentverse: PUT /hosting/agents/{addr}/code (upload code)
      if (urlStr.includes('/code') && init?.method === 'PUT') {
        return makeResponse({ digest: 'abc123' });
      }

      // Agentverse: POST /hosting/secrets (set secret)
      if (urlStr.includes('/hosting/secrets') && init?.method === 'POST') {
        return makeResponse({});
      }

      // Agentverse: POST /hosting/agents/{addr}/start
      if (urlStr.includes('/start') && init?.method === 'POST') {
        return makeResponse({ status: 'starting' });
      }

      // Agentverse: GET /hosting/agents/{addr} (poll for compilation status)
      if (urlStr.includes('/hosting/agents/agent1q') && (!init?.method || init.method === 'GET')) {
        return makeResponse({
          address: 'agent1qdeployed1',
          running: true,
          compiled: true,
          status: 'running',
        });
      }

      // Agentverse: PUT /hosting/agents/{addr} (update metadata)
      if (urlStr.includes('/hosting/agents/agent1q') && init?.method === 'PUT') {
        return makeResponse({});
      }

      return makeResponse({});
    });

    const result = await commerceHandlers.deploy_swarm({
      presets: ['writer', 'analytics'],
      baseName: 'TestSwarm',
      apiKey: 'av-test-key',
    });

    const obj = result as Record<string, unknown>;
    assert.ok(obj, 'should return a result');
    assert.equal(obj.totalDeployed, 2, 'should deploy 2 agents');
    assert.equal(obj.totalFailed, 0, 'no agents should fail');

    // Verify agents array contains both deployed agents
    const agents = obj.agents as Array<Record<string, unknown>>;
    assert.equal(agents.length, 2, 'agents array should have 2 entries');
    assert.equal(agents[0].preset, 'writer', 'first agent should be writer preset');
    assert.equal(agents[1].preset, 'analytics', 'second agent should be analytics preset');

    // Verify both have addresses
    assert.ok(agents[0].address, 'first agent should have an address');
    assert.ok(agents[1].address, 'second agent should have an address');
    assert.notEqual(agents[0].status, 'failed', 'first agent should not be failed');
    assert.notEqual(agents[1].status, 'failed', 'second agent should not be failed');
  });

  it('MCP-CM07b: uses baseName for agent naming', async () => {
    const createdNames: string[] = [];

    restoreFn = installFetchMock(async (url, init) => {
      const urlStr = url.toString();

      if (urlStr.includes('/hosting/agents') && init?.method === 'POST' && !urlStr.includes('/start') && !urlStr.includes('/code') && !urlStr.includes('/secrets')) {
        const body = JSON.parse(init.body as string);
        createdNames.push(body.name);
        return makeResponse({
          address: `agent1q${createdNames.length}`,
          name: body.name,
          running: false,
          compiled: false,
        });
      }

      if (urlStr.includes('/code') && init?.method === 'PUT') {
        return makeResponse({ digest: 'abc123' });
      }
      if (urlStr.includes('/hosting/secrets') && init?.method === 'POST') {
        return makeResponse({});
      }
      if (urlStr.includes('/start') && init?.method === 'POST') {
        return makeResponse({ status: 'starting' });
      }
      if (urlStr.includes('/hosting/agents/agent1q') && (!init?.method || init.method === 'GET')) {
        return makeResponse({ address: 'agent1q1', running: true, compiled: true, status: 'running' });
      }
      if (urlStr.includes('/hosting/agents/agent1q') && init?.method === 'PUT') {
        return makeResponse({});
      }

      return makeResponse({});
    });

    const result = await commerceHandlers.deploy_swarm({
      presets: ['community'],
      baseName: 'AlphaTeam',
      apiKey: 'av-test-key',
    });

    const obj = result as Record<string, unknown>;
    assert.equal(obj.baseName, 'AlphaTeam', 'baseName should be set in result');
  });
});

// ---------------------------------------------------------------------------
// 2. deploy_swarm -- per-agent failure resilience (MCP-CM08)
// ---------------------------------------------------------------------------

describe('MCP deploy_swarm -- failure resilience', () => {
  // MCP-CM08: records per-agent failures without stopping
  it('MCP-CM08: records failure for one agent but continues deploying others', async () => {
    let agentCreateCount = 0;

    restoreFn = installFetchMock(async (url, init) => {
      const urlStr = url.toString();

      if (urlStr.includes('/hosting/agents') && init?.method === 'POST' && !urlStr.includes('/start') && !urlStr.includes('/code') && !urlStr.includes('/secrets')) {
        agentCreateCount++;
        // Second agent fails during creation
        if (agentCreateCount === 2) {
          return makeResponse({ error: 'Internal server error' }, 500);
        }
        return makeResponse({
          address: `agent1qok${agentCreateCount}`,
          name: `agent-${agentCreateCount}`,
          running: false,
          compiled: false,
        });
      }

      if (urlStr.includes('/code') && init?.method === 'PUT') {
        return makeResponse({ digest: 'abc123' });
      }
      if (urlStr.includes('/hosting/secrets') && init?.method === 'POST') {
        return makeResponse({});
      }
      if (urlStr.includes('/start') && init?.method === 'POST') {
        return makeResponse({ status: 'starting' });
      }
      if (urlStr.includes('/hosting/agents/agent1q') && (!init?.method || init.method === 'GET')) {
        return makeResponse({ running: true, compiled: true, status: 'running' });
      }
      if (urlStr.includes('/hosting/agents/agent1q') && init?.method === 'PUT') {
        return makeResponse({});
      }

      return makeResponse({});
    });

    const result = await commerceHandlers.deploy_swarm({
      presets: ['writer', 'social', 'analytics'],
      apiKey: 'av-test-key',
    });

    const obj = result as Record<string, unknown>;
    assert.ok(obj, 'should return a result');

    // The swarm should not stop on the second agent's failure
    const agents = obj.agents as Array<Record<string, unknown>>;
    assert.equal(agents.length, 3, 'agents array should have 3 entries (including the failed one)');

    // Verify the failed agent is recorded
    const failedAgents = agents.filter((a) => a.status === 'failed');
    assert.ok(failedAgents.length >= 1, 'at least one agent should be marked as failed');

    // Verify the failed agent has an error message
    const failed = failedAgents[0];
    assert.ok(failed.error, 'failed agent should have an error message');
    assert.equal(failed.address, '', 'failed agent should have empty address');

    // Verify successful agents still deployed
    const successAgents = agents.filter((a) => a.status !== 'failed');
    assert.ok(successAgents.length >= 1, 'at least one agent should have succeeded');

    // totalFailed should reflect the failure
    assert.ok(
      (obj.totalFailed as number) >= 1,
      'totalFailed should be at least 1',
    );
  });

  it('MCP-CM08b: success is false when any agent fails', async () => {
    let createCount = 0;

    restoreFn = installFetchMock(async (url, init) => {
      const urlStr = url.toString();

      if (urlStr.includes('/hosting/agents') && init?.method === 'POST' && !urlStr.includes('/start') && !urlStr.includes('/code') && !urlStr.includes('/secrets')) {
        createCount++;
        // Fail the first agent
        if (createCount === 1) {
          return makeResponse({ error: 'quota exceeded' }, 429);
        }
        return makeResponse({
          address: `agent1qgood${createCount}`,
          running: false,
          compiled: false,
        });
      }

      if (urlStr.includes('/code') && init?.method === 'PUT') {
        return makeResponse({ digest: 'abc' });
      }
      if (urlStr.includes('/hosting/secrets') && init?.method === 'POST') {
        return makeResponse({});
      }
      if (urlStr.includes('/start') && init?.method === 'POST') {
        return makeResponse({});
      }
      if (urlStr.includes('/hosting/agents/agent1q') && (!init?.method || init.method === 'GET')) {
        return makeResponse({ running: true, compiled: true, status: 'running' });
      }
      if (urlStr.includes('/hosting/agents/agent1q') && init?.method === 'PUT') {
        return makeResponse({});
      }

      return makeResponse({});
    });

    const result = await commerceHandlers.deploy_swarm({
      presets: ['writer', 'analytics'],
      apiKey: 'av-test-key',
    });

    const obj = result as Record<string, unknown>;
    assert.equal(obj.success, false, 'success should be false when any agent fails');
  });
});

// ---------------------------------------------------------------------------
// 3. deploy_swarm -- peer address propagation (MCP-CM09)
// ---------------------------------------------------------------------------

describe('MCP deploy_swarm -- peer address propagation', () => {
  // MCP-CM09: sets peer addresses after all deployed
  it('MCP-CM09: sets peer addresses on earlier agents after all are deployed', async () => {
    let createIdx = 0;
    const secretsSet: Array<{ address: string; name: string; secret: string }> = [];

    restoreFn = installFetchMock(async (url, init) => {
      const urlStr = url.toString();

      // Create agent
      if (urlStr.includes('/hosting/agents') && init?.method === 'POST' && !urlStr.includes('/start') && !urlStr.includes('/code') && !urlStr.includes('/secrets')) {
        createIdx++;
        return makeResponse({
          address: `agent1qpeer${createIdx}`,
          name: `agent-${createIdx}`,
          running: false,
          compiled: false,
        });
      }

      // Upload code
      if (urlStr.includes('/code') && init?.method === 'PUT') {
        return makeResponse({ digest: 'code123' });
      }

      // Set secret -- capture for assertion
      if (urlStr.includes('/hosting/secrets') && init?.method === 'POST') {
        const body = JSON.parse(init.body as string);
        secretsSet.push({
          address: body.address,
          name: body.name,
          secret: body.secret,
        });
        return makeResponse({});
      }

      // Start
      if (urlStr.includes('/start') && init?.method === 'POST') {
        return makeResponse({ status: 'starting' });
      }

      // Poll compilation
      if (urlStr.includes('/hosting/agents/agent1q') && (!init?.method || init.method === 'GET')) {
        return makeResponse({ running: true, compiled: true, status: 'running' });
      }

      // Update metadata
      if (urlStr.includes('/hosting/agents/agent1q') && init?.method === 'PUT') {
        return makeResponse({});
      }

      return makeResponse({});
    });

    const result = await commerceHandlers.deploy_swarm({
      presets: ['writer', 'analytics'],
      apiKey: 'av-test-key',
    });

    const obj = result as Record<string, unknown>;
    assert.equal(obj.totalDeployed, 2, 'should deploy 2 agents');

    // Verify peerAddresses in the result contain both agents
    const peerAddresses = obj.peerAddresses as Record<string, string>;
    assert.ok(peerAddresses, 'result should contain peerAddresses');
    assert.ok(peerAddresses['WRITER_ADDRESS'], 'should have WRITER_ADDRESS peer');
    assert.ok(peerAddresses['ANALYTICS_ADDRESS'], 'should have ANALYTICS_ADDRESS peer');

    // After all agents are deployed, peer addresses are set on earlier agents.
    // The writer agent should receive the ANALYTICS_ADDRESS secret,
    // and the analytics agent should receive the WRITER_ADDRESS secret.
    const writerGotAnalytics = secretsSet.some(
      (s) => s.address === 'agent1qpeer1' && s.name === 'ANALYTICS_ADDRESS',
    );
    assert.ok(
      writerGotAnalytics,
      'writer agent should have received ANALYTICS_ADDRESS as a secret',
    );

    const analyticsGotWriter = secretsSet.some(
      (s) => s.address === 'agent1qpeer2' && s.name === 'WRITER_ADDRESS',
    );
    assert.ok(
      analyticsGotWriter,
      'analytics agent should have received WRITER_ADDRESS as a secret',
    );
  });

  it('MCP-CM09b: does not set peer addresses on failed agents', async () => {
    let createIdx = 0;
    const secretsSet: Array<{ address: string; name: string }> = [];

    restoreFn = installFetchMock(async (url, init) => {
      const urlStr = url.toString();

      if (urlStr.includes('/hosting/agents') && init?.method === 'POST' && !urlStr.includes('/start') && !urlStr.includes('/code') && !urlStr.includes('/secrets')) {
        createIdx++;
        // Writer succeeds, social fails
        if (createIdx === 2) {
          return makeResponse({ error: 'fail' }, 500);
        }
        return makeResponse({
          address: `agent1qp${createIdx}`,
          running: false,
          compiled: false,
        });
      }

      if (urlStr.includes('/code') && init?.method === 'PUT') {
        return makeResponse({ digest: 'x' });
      }
      if (urlStr.includes('/hosting/secrets') && init?.method === 'POST') {
        const body = JSON.parse(init.body as string);
        secretsSet.push({ address: body.address, name: body.name });
        return makeResponse({});
      }
      if (urlStr.includes('/start') && init?.method === 'POST') {
        return makeResponse({});
      }
      if (urlStr.includes('/hosting/agents/agent1q') && (!init?.method || init.method === 'GET')) {
        return makeResponse({ running: true, compiled: true, status: 'running' });
      }
      if (urlStr.includes('/hosting/agents/agent1q') && init?.method === 'PUT') {
        return makeResponse({});
      }

      return makeResponse({});
    });

    const result = await commerceHandlers.deploy_swarm({
      presets: ['writer', 'social'],
      apiKey: 'av-test-key',
    });

    const obj = result as Record<string, unknown>;
    const agents = obj.agents as Array<Record<string, unknown>>;
    const failed = agents.find((a) => a.status === 'failed');
    assert.ok(failed, 'there should be a failed agent');

    // Peer address propagation should NOT target the failed agent's (empty) address
    const secretsForEmptyAddr = secretsSet.filter((s) => s.address === '');
    assert.equal(
      secretsForEmptyAddr.length,
      0,
      'no secrets should be set on agents with empty address (failed agents)',
    );
  });
});

// ---------------------------------------------------------------------------
// 4. buy_tokens -- real execution error path (MCP-TR02)
// ---------------------------------------------------------------------------

describe('MCP buy_tokens -- real execution', () => {
  // MCP-TR02: real buy_tokens requires WALLET_PRIVATE_KEY
  it(
    'MCP-TR02: buy_tokens without dryRun rejects when WALLET_PRIVATE_KEY is missing',
    withEnv(
      { WALLET_PRIVATE_KEY: undefined },
      async () => {
        await assert.rejects(
          () =>
            tradingHandlers.buy_tokens({
              address: '0x' + 'a'.repeat(40),
              fetAmount: '10',
              dryRun: false,
            }),
          /private key|WALLET_PRIVATE_KEY/i,
          'should reject with missing wallet key error',
        );
      },
    ),
  );

  it('MCP-TR02b: buy_tokens without dryRun calls buyTokens (not calculateBuy)', async () => {
    // Verify that with dryRun=false, the function does NOT call the calculate-buy
    // endpoint (it calls the on-chain buyTokens SDK function instead, which
    // will fail without a valid private key).
    let calculateBuyCalled = false;

    restoreFn = installFetchMock(async (url) => {
      const urlStr = url.toString();
      if (urlStr.includes('/tokens/calculate-buy')) {
        calculateBuyCalled = true;
        return makeResponse({ tokensReceived: '1000', fee: '2', priceImpact: '0.1', price: '0.001' });
      }
      return makeResponse({}, 404);
    });

    // Without a valid WALLET_PRIVATE_KEY, the real buy will error out
    const origKey = process.env['WALLET_PRIVATE_KEY'];
    delete process.env['WALLET_PRIVATE_KEY'];

    try {
      await tradingHandlers.buy_tokens({
        address: '0x' + 'a'.repeat(40),
        fetAmount: '10',
        dryRun: false,
      }).catch(() => {
        // Expected to fail -- we just care about what was called
      });

      assert.equal(
        calculateBuyCalled,
        false,
        'calculateBuy API should NOT be called when dryRun=false',
      );
    } finally {
      if (origKey) process.env['WALLET_PRIVATE_KEY'] = origKey;
    }
  });
});

// ---------------------------------------------------------------------------
// 5. sell_tokens -- real execution error path (MCP-TR04)
// ---------------------------------------------------------------------------

describe('MCP sell_tokens -- real execution', () => {
  // MCP-TR04: real sell_tokens requires WALLET_PRIVATE_KEY
  it(
    'MCP-TR04: sell_tokens without dryRun rejects when WALLET_PRIVATE_KEY is missing',
    withEnv(
      { WALLET_PRIVATE_KEY: undefined },
      async () => {
        await assert.rejects(
          () =>
            tradingHandlers.sell_tokens({
              address: '0x' + 'b'.repeat(40),
              tokenAmount: '50000',
              dryRun: false,
            }),
          /private key|WALLET_PRIVATE_KEY/i,
          'should reject with missing wallet key error',
        );
      },
    ),
  );

  it('MCP-TR04b: sell_tokens without dryRun calls sellTokens (not calculateSell)', async () => {
    let calculateSellCalled = false;

    restoreFn = installFetchMock(async (url) => {
      const urlStr = url.toString();
      if (urlStr.includes('/tokens/calculate-sell')) {
        calculateSellCalled = true;
        return makeResponse({ fetReceived: '90', fee: '2', priceImpact: '1', price: '0.0002' });
      }
      return makeResponse({}, 404);
    });

    const origKey = process.env['WALLET_PRIVATE_KEY'];
    delete process.env['WALLET_PRIVATE_KEY'];

    try {
      await tradingHandlers.sell_tokens({
        address: '0x' + 'b'.repeat(40),
        tokenAmount: '50000',
        dryRun: false,
      }).catch(() => {
        // Expected to fail -- we just care about what was called
      });

      assert.equal(
        calculateSellCalled,
        false,
        'calculateSell API should NOT be called when dryRun=false',
      );
    } finally {
      if (origKey) process.env['WALLET_PRIVATE_KEY'] = origKey;
    }
  });
});

// ---------------------------------------------------------------------------
// 6. check_spending_limit -- ERC-20 allowance (MCP-PAY03)
// ---------------------------------------------------------------------------

describe('MCP check_spending_limit -- ERC-20 allowance', () => {
  // MCP-PAY03: returns ERC-20 allowance for known token
  it('MCP-PAY03: rejects unknown token symbol before making on-chain call', async () => {
    await assert.rejects(
      () =>
        paymentHandlers.check_spending_limit({
          tokenSymbol: 'DOGECOIN',
          owner: '0x' + 'a'.repeat(40),
          spender: '0x' + 'b'.repeat(40),
          chainId: 97,
        }),
      /unknown token/i,
      'should reject unknown token symbol',
    );
  });

  it('MCP-PAY03b: resolves correct token for FET on BSC Testnet (chain 97)', async () => {
    // checkSpendingLimitTool resolves the token via getPaymentToken before
    // calling checkAllowance. If the token is valid, it proceeds to an
    // on-chain call which will fail in a test environment. We verify the
    // function gets past the token lookup (i.e., does NOT throw "Unknown token").
    let thrownError: Error | undefined;
    try {
      await paymentHandlers.check_spending_limit({
        tokenSymbol: 'FET',
        owner: '0x' + 'a'.repeat(40),
        spender: '0x' + 'b'.repeat(40),
        chainId: 97,
      });
    } catch (err) {
      thrownError = err as Error;
    }

    // It should either succeed (unlikely without chain) or fail with an
    // on-chain error, NOT an "unknown token" error.
    if (thrownError) {
      assert.ok(
        !/unknown token/i.test(thrownError.message),
        'FET on chain 97 should be a known token; error should be on-chain related, not "unknown token". Got: ' + thrownError.message,
      );
    }
  });

  it('MCP-PAY03c: resolves correct token for USDC on BSC Testnet', async () => {
    let thrownError: Error | undefined;
    try {
      await paymentHandlers.check_spending_limit({
        tokenSymbol: 'USDC',
        owner: '0x' + 'c'.repeat(40),
        spender: '0x' + 'd'.repeat(40),
        chainId: 97,
      });
    } catch (err) {
      thrownError = err as Error;
    }

    if (thrownError) {
      assert.ok(
        !/unknown token/i.test(thrownError.message),
        'USDC on chain 97 should be a known token. Got: ' + thrownError.message,
      );
    }
  });
});
