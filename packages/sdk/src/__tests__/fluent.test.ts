/**
 * Tests for the AgentLaunch fluent wrapper — SDK-F02 through SDK-F07
 *
 * Verifies that the namespaced API on the AgentLaunch class correctly
 * delegates to the underlying SDK functions.
 *
 *   - SDK-F02: .tokens.tokenize() delegates to POST /agents/tokenize
 *   - SDK-F03: .market.getTokenPrice() returns price from token data
 *   - SDK-F04: .onchain.buy exists and is a function
 *   - SDK-F05: .payments.getToken() returns a PaymentToken for 'FET'
 *   - SDK-F06: .payments.delegationLink() returns a string containing /delegate
 *   - SDK-F07: .payments.fiatLink() returns object with url and provider fields
 */

import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { AgentLaunch } from '../agentlaunch.js';

// ---------------------------------------------------------------------------
// Fetch mock helpers
// ---------------------------------------------------------------------------

type FetchMock = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

const originalFetch = globalThis.fetch;

function installFetchMock(mock: FetchMock): () => void {
  globalThis.fetch = mock as typeof globalThis.fetch;
  return () => {
    globalThis.fetch = originalFetch;
  };
}

function makeResponse(body: unknown, status = 200, statusText = 'OK'): Response {
  const jsonStr = JSON.stringify(body);
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(jsonStr),
    headers: new Headers(),
  } as unknown as Response;
}

let restoreFn: (() => void) | undefined;
afterEach(() => {
  if (restoreFn) {
    restoreFn();
    restoreFn = undefined;
  }
});

// ---------------------------------------------------------------------------
// SDK-F02: .tokens.tokenize()
// ---------------------------------------------------------------------------

describe('.tokens.tokenize() — SDK-F02', () => {
  it('calls POST /agents/tokenize via fetch', async () => {
    let capturedUrl = '';
    let capturedMethod = '';
    let capturedBody: Record<string, unknown> = {};

    restoreFn = installFetchMock(async (_url, init) => {
      capturedUrl = _url as string;
      capturedMethod = init?.method ?? '';
      capturedBody = JSON.parse(init?.body as string);
      return makeResponse({
        success: true,
        data: {
          token_id: 42,
          handoff_link: 'https://agent-launch.ai/deploy/42',
          name: 'T',
          symbol: 'T',
          description: 'D',
          image: '',
          status: 'pending_deployment',
        },
      });
    });

    const al = new AgentLaunch({
      baseUrl: 'https://test.local',
      apiKey: 'av-fluent-key',
    });

    const result = await al.tokens.tokenize({
      agentAddress: 'agent1qtest',
      name: 'T',
      symbol: 'T',
      description: 'D',
      chainId: 97,
    });

    assert.equal(capturedMethod, 'POST');
    assert.ok(
      capturedUrl.endsWith('/agents/tokenize'),
      `URL should end with /agents/tokenize, got: ${capturedUrl}`,
    );
    assert.equal(capturedBody.agentAddress, 'agent1qtest');
    assert.equal(result.data.token_id, 42);
  });
});

// ---------------------------------------------------------------------------
// SDK-F08: Top-level .tokenize() convenience method
// ---------------------------------------------------------------------------

describe('.tokenize() top-level convenience — SDK-F08', () => {
  it('returns flattened camelCase response with handoffLink', async () => {
    let capturedUrl = '';
    let capturedMethod = '';

    restoreFn = installFetchMock(async (_url, init) => {
      capturedUrl = _url as string;
      capturedMethod = init?.method ?? '';
      return makeResponse({
        success: true,
        data: {
          token_id: 99,
          handoff_link: 'https://agent-launch.ai/deploy/99',
          name: 'MyBot',
          symbol: 'MYB',
          description: 'My AI agent token',
          image: '',
          status: 'pending_deployment',
        },
      });
    });

    const client = new AgentLaunch({
      baseUrl: 'https://test.local',
      apiKey: 'av-test-key',
    });

    const result = await client.tokenize({
      agentAddress: 'agent1qtest',
      name: 'MyBot',
      symbol: 'MYB',
      description: 'My AI agent token',
    });

    assert.equal(capturedMethod, 'POST');
    assert.ok(capturedUrl.endsWith('/agents/tokenize'));
    assert.equal(result.tokenId, 99);
    assert.equal(result.handoffLink, 'https://agent-launch.ai/deploy/99');
    assert.equal(result.name, 'MyBot');
    assert.equal(result.symbol, 'MYB');
    assert.equal(result.status, 'pending_deployment');
  });

  it('throws a clear error when agentAddress is missing', async () => {
    const client = new AgentLaunch({
      baseUrl: 'https://test.local',
      apiKey: 'av-test-key',
    });

    await assert.rejects(
      () => client.tokenize({ name: 'MyBot', symbol: 'MYB' } as any),
      (err: Error) => {
        assert.ok(err.message.includes('agentAddress is required'));
        return true;
      },
    );
  });

  it('provides helpful error when agent is not found (mailbox agent)', async () => {
    restoreFn = installFetchMock(async () => {
      return makeResponse(
        { message: 'Agent agent1qwgx was not found under the provided API key.' },
        422,
        'Unprocessable Entity',
      );
    });

    const client = new AgentLaunch({
      baseUrl: 'https://test.local',
      apiKey: 'av-test-key',
    });

    await assert.rejects(
      () => client.tokenize({ agentAddress: 'agent1qwgx' }),
      (err: Error) => {
        assert.ok(err.message.includes('connected via mailbox'), `Should mention mailbox, got: ${err.message}`);
        assert.ok(err.message.includes('hosted agent'), `Should suggest hosted agent`);
        return true;
      },
    );
  });

  it('delegates to .tokens.tokenize() internally', async () => {
    restoreFn = installFetchMock(async () => {
      return makeResponse({
        success: true,
        data: {
          token_id: 1,
          handoff_link: 'https://agent-launch.ai/deploy/1',
          name: 'T',
          symbol: 'T',
          description: 'D',
          image: '',
          status: 'pending_deployment',
        },
      });
    });

    const client = new AgentLaunch({
      baseUrl: 'https://test.local',
      apiKey: 'av-key',
    });

    // Both paths should work
    const convenience = await client.tokenize({ agentAddress: 'agent1qtest' });
    const namespaced = await client.tokens.tokenize({ agentAddress: 'agent1qtest' });

    assert.equal(convenience.tokenId, namespaced.data.token_id);
    assert.equal(convenience.handoffLink, namespaced.data.handoff_link);
  });
});

// ---------------------------------------------------------------------------
// SDK-F09: Top-level .listTokens() convenience method
// ---------------------------------------------------------------------------

describe('.listTokens() top-level convenience — SDK-F09', () => {
  it('proxies to .tokens.listTokens()', async () => {
    restoreFn = installFetchMock(async () => {
      return makeResponse({
        tokens: [{ id: 1, name: 'T', symbol: 'T', address: '0x123', price: '0.01' }],
        total: 1,
      });
    });

    const client = new AgentLaunch({
      baseUrl: 'https://test.local',
      apiKey: 'av-key',
    });

    const result = await client.listTokens({ limit: 10 });
    assert.ok(Array.isArray(result.tokens));
    assert.equal(result.tokens.length, 1);
  });
});

// ---------------------------------------------------------------------------
// SDK-F10: Top-level .getToken() convenience method
// ---------------------------------------------------------------------------

describe('.getToken() top-level convenience — SDK-F10', () => {
  it('proxies to .tokens.getToken()', async () => {
    restoreFn = installFetchMock(async () => {
      return makeResponse({
        id: 1,
        name: 'Test',
        symbol: 'TST',
        address: '0xAbCd1234567890AbCd1234567890AbCd12345678',
        price: '0.001',
      });
    });

    const client = new AgentLaunch({
      baseUrl: 'https://test.local',
      apiKey: 'av-key',
    });

    const token = await client.getToken('0xAbCd1234567890AbCd1234567890AbCd12345678');
    assert.equal(token.symbol, 'TST');
  });
});

// ---------------------------------------------------------------------------
// SDK-F03: .market.getTokenPrice()
// ---------------------------------------------------------------------------

describe('.market.getTokenPrice() — SDK-F03', () => {
  it('returns price from token data', async () => {
    restoreFn = installFetchMock(async () => {
      return makeResponse({
        id: 1,
        name: 'Test Token',
        symbol: 'TEST',
        address: '0xAbCd1234567890AbCd1234567890AbCd12345678',
        description: 'A test token',
        logo: '',
        status: 'bonding',
        price: '0.001',
        market_cap: '1000',
        progress: 5,
        chainId: 97,
        listed: false,
        created_at: '2026-01-01T00:00:00Z',
      });
    });

    const al = new AgentLaunch({
      baseUrl: 'https://test.local',
      apiKey: 'av-key',
    });

    const price = await al.market.getTokenPrice('0xAbCd1234567890AbCd1234567890AbCd12345678');
    assert.equal(price, '0.001');
  });
});

// ---------------------------------------------------------------------------
// SDK-F04: .onchain.buy exists and is a function
// ---------------------------------------------------------------------------

describe('.onchain.buy — SDK-F04', () => {
  it('exists and is a function', () => {
    const al = new AgentLaunch({
      baseUrl: 'https://test.local',
      apiKey: 'av-key',
    });

    assert.equal(typeof al.onchain.buy, 'function');
  });

  it('.onchain.sell also exists as a function', () => {
    const al = new AgentLaunch({
      baseUrl: 'https://test.local',
      apiKey: 'av-key',
    });

    assert.equal(typeof al.onchain.sell, 'function');
  });

  it('.onchain.getBalances also exists as a function', () => {
    const al = new AgentLaunch({
      baseUrl: 'https://test.local',
      apiKey: 'av-key',
    });

    assert.equal(typeof al.onchain.getBalances, 'function');
  });
});

// ---------------------------------------------------------------------------
// SDK-F05: .payments.getToken() returns PaymentToken for 'FET'
// ---------------------------------------------------------------------------

describe('.payments.getToken() — SDK-F05', () => {
  it('returns a PaymentToken for FET on BSC Testnet (97)', () => {
    const al = new AgentLaunch({
      baseUrl: 'https://test.local',
      apiKey: 'av-key',
    });

    const token = al.payments.getToken('FET', 97);

    assert.ok(token, 'should return a token, not undefined');
    assert.equal(token!.symbol, 'FET');
    assert.equal(token!.chainId, 97);
    assert.equal(token!.decimals, 18);
    assert.equal(typeof token!.contractAddress, 'string');
    assert.ok(token!.contractAddress.startsWith('0x'), 'contract address should start with 0x');
  });

  it('returns a PaymentToken for USDC on BSC Testnet (97)', () => {
    const al = new AgentLaunch({
      baseUrl: 'https://test.local',
    });

    const token = al.payments.getToken('USDC', 97);

    assert.ok(token, 'should return a token for USDC');
    assert.equal(token!.symbol, 'USDC');
    assert.equal(token!.isStablecoin, true);
  });

  it('returns undefined for unknown token', () => {
    const al = new AgentLaunch({
      baseUrl: 'https://test.local',
    });

    const token = al.payments.getToken('DOGE', 97);
    assert.equal(token, undefined);
  });

  it('defaults to chainId 97 when not specified', () => {
    const al = new AgentLaunch({
      baseUrl: 'https://test.local',
    });

    const token = al.payments.getToken('FET');

    assert.ok(token, 'should return a token without explicit chainId');
    assert.equal(token!.chainId, 97);
  });
});

// ---------------------------------------------------------------------------
// SDK-F06: .payments.delegationLink() returns string containing /delegate
// ---------------------------------------------------------------------------

describe('.payments.delegationLink() — SDK-F06', () => {
  it('returns a string containing /delegate', () => {
    const al = new AgentLaunch({
      baseUrl: 'https://test.local',
    });

    const TOKEN_ADDR = '0x' + 'a'.repeat(40);
    const SPENDER_ADDR = '0x' + 'b'.repeat(40);

    const link = al.payments.delegationLink(TOKEN_ADDR, SPENDER_ADDR, '100');

    assert.equal(typeof link, 'string');
    assert.ok(
      link.includes('/delegate'),
      `Link should contain /delegate, got: ${link}`,
    );
  });

  it('includes token, spender, and amount in the link', () => {
    const al = new AgentLaunch({
      baseUrl: 'https://test.local',
    });

    const TOKEN_ADDR = '0x' + 'a'.repeat(40);
    const SPENDER_ADDR = '0x' + 'b'.repeat(40);

    const link = al.payments.delegationLink(TOKEN_ADDR, SPENDER_ADDR, '250');

    assert.ok(link.includes(`token=${TOKEN_ADDR}`), `should contain token param`);
    assert.ok(link.includes(`spender=${SPENDER_ADDR}`), `should contain spender param`);
    assert.ok(link.includes('amount=250'), `should contain amount=250`);
  });
});

// ---------------------------------------------------------------------------
// SDK-F07: .payments.fiatLink() returns object with url and provider
// ---------------------------------------------------------------------------

describe('.payments.fiatLink() — SDK-F07', () => {
  it('returns object with url and provider fields', () => {
    const al = new AgentLaunch({
      baseUrl: 'https://test.local',
    });

    const result = al.payments.fiatLink({
      fiatAmount: '50',
      fiatCurrency: 'USD',
      cryptoToken: 'FET',
      walletAddress: '0x' + 'c'.repeat(40),
      provider: 'moonpay',
    });

    assert.ok('url' in result, 'result should have url field');
    assert.ok('provider' in result, 'result should have provider field');
    assert.equal(typeof result.url, 'string');
    assert.equal(result.provider, 'moonpay');
  });

  it('generates moonpay URL for FET', () => {
    const al = new AgentLaunch({
      baseUrl: 'https://test.local',
    });

    const result = al.payments.fiatLink({
      fiatAmount: '100',
      fiatCurrency: 'USD',
      cryptoToken: 'FET',
      walletAddress: '0x' + 'c'.repeat(40),
      provider: 'moonpay',
    });

    assert.ok(
      result.url.includes('buy.moonpay.com'),
      `URL should contain buy.moonpay.com, got: ${result.url}`,
    );
  });

  it('generates transak URL for USDC', () => {
    const al = new AgentLaunch({
      baseUrl: 'https://test.local',
    });

    const result = al.payments.fiatLink({
      fiatAmount: '75',
      fiatCurrency: 'EUR',
      cryptoToken: 'USDC',
      walletAddress: '0x' + 'c'.repeat(40),
      provider: 'transak',
    });

    assert.equal(result.provider, 'transak');
    assert.ok(
      result.url.includes('global.transak.com'),
      `URL should contain global.transak.com, got: ${result.url}`,
    );
  });

  it('throws on unsupported crypto token', () => {
    const al = new AgentLaunch({
      baseUrl: 'https://test.local',
    });

    assert.throws(
      () =>
        al.payments.fiatLink({
          fiatAmount: '50',
          fiatCurrency: 'USD',
          cryptoToken: 'SHIB',
          walletAddress: '0x' + 'c'.repeat(40),
          provider: 'moonpay',
        }),
      /Unsupported crypto token/,
    );
  });
});
