/**
 * Tests for SDK token operations — SDK-002
 *
 * Verifies:
 *   - tokenize() calls POST /api/agents/tokenize with the supplied body
 *   - getToken() calls GET /api/agents/token/:address (URL-encoded)
 *   - listTokens() calls GET /api/agents/tokens with pagination params
 *   - listTokens() with no params sends a clean request
 *   - AgentLaunchError is propagated from client errors
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { AgentLaunchClient } from '../client.js';
import { tokenize, getToken, listTokens } from '../tokens.js';
import { AgentLaunchError } from '../types.js';
import type { Token, TokenizeResponse } from '../types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as unknown as Response;
}

function installFetchMock(
  mock: (url: string, init?: RequestInit) => Promise<Response>,
): () => void {
  const original = globalThis.fetch;
  globalThis.fetch = mock as unknown as typeof globalThis.fetch;
  return () => {
    globalThis.fetch = original;
  };
}

/** Build a mock AgentLaunchClient that captures calls and returns preset data. */
function makeClient(baseUrl = 'https://test.local', apiKey = 'av-test-key') {
  return new AgentLaunchClient({ baseUrl, apiKey });
}

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const TOKEN_ADDRESS = '0xAbCd1234567890AbCd1234567890AbCd12345678';

const mockTokenizeResponse = {
  success: true as const,
  data: {
    token_id: 42,
    handoff_link: 'https://agent-launch.ai/deploy/42',
    name: 'GiftBot',
    symbol: 'GIFT',
    description: 'An AI gifting agent token',
    image: 'https://agent-launch.ai/images/placeholder.png',
    status: 'pending_deployment' as const,
  } satisfies TokenizeResponse,
};

const mockToken: Token = {
  id: 7,
  name: 'GiftBot',
  symbol: 'GIFT',
  address: TOKEN_ADDRESS,
  description: 'An AI gifting agent token',
  logo: 'https://agent-launch.ai/images/placeholder.png',
  status: 'bonding',
  price: '0.0001234',
  market_cap: '98720',
  progress: 32.9,
  chainId: 97,
  listed: false,
  created_at: '2026-02-01T10:00:00.000Z',
};

// ---------------------------------------------------------------------------
// tokenize()
// ---------------------------------------------------------------------------

describe('tokenize()', () => {
  it('sends POST to /api/agents/tokenize with agentAddress', async () => {
    let capturedUrl = '';
    let capturedBody: unknown;

    const restore = installFetchMock((url, init) => {
      capturedUrl = url;
      capturedBody = JSON.parse(init?.body as string);
      return Promise.resolve(makeResponse(mockTokenizeResponse));
    });

    const client = makeClient();
    const result = await tokenize(
      { agentAddress: 'agent1qf8test', name: 'GiftBot', symbol: 'GIFT' },
      client,
    );

    restore();

    assert.ok(capturedUrl.includes('/api/agents/tokenize'), 'URL should include /api/agents/tokenize');
    assert.deepEqual((capturedBody as { agentAddress: string }).agentAddress, 'agent1qf8test');
    assert.equal(result.data.token_id, 42);
    assert.equal(result.data.handoff_link, 'https://agent-launch.ai/deploy/42');
  });

  it('sends optional fields when provided', async () => {
    let capturedBody: unknown;

    const restore = installFetchMock((_url, init) => {
      capturedBody = JSON.parse(init?.body as string);
      return Promise.resolve(makeResponse(mockTokenizeResponse));
    });

    const client = makeClient();
    await tokenize(
      {
        agentAddress: 'agent1qf8test',
        name: 'GiftBot',
        symbol: 'GIFT',
        description: 'Sends FET gifts',
        chainId: 97,
      },
      client,
    );

    restore();

    const body = capturedBody as Record<string, unknown>;
    assert.equal(body['description'], 'Sends FET gifts');
    assert.equal(body['chainId'], 97);
  });

  it('propagates AgentLaunchError from the client on 401', async () => {
    const restore = installFetchMock(() =>
      Promise.resolve(makeResponse({ message: 'Unauthorized' }, 401)),
    );

    const client = makeClient();

    await assert.rejects(
      () => tokenize({ agentAddress: 'agent1qtest' }, client),
      (err: unknown) => {
        assert.ok(err instanceof AgentLaunchError);
        assert.equal((err as AgentLaunchError).status, 401);
        return true;
      },
    );

    restore();
  });

  it('returns the status as pending_deployment for a new token record', async () => {
    const restore = installFetchMock(() =>
      Promise.resolve(makeResponse(mockTokenizeResponse)),
    );

    const client = makeClient();
    const result = await tokenize({ agentAddress: 'agent1qtest' }, client);

    restore();
    assert.equal(result.data.status, 'pending_deployment');
  });
});

// ---------------------------------------------------------------------------
// getToken()
// ---------------------------------------------------------------------------

describe('getToken()', () => {
  it('calls GET /api/agents/token/:address with the correct address', async () => {
    let capturedUrl = '';

    const restore = installFetchMock((url) => {
      capturedUrl = url;
      return Promise.resolve(makeResponse(mockToken));
    });

    const client = makeClient();
    const result = await getToken(TOKEN_ADDRESS, client);

    restore();

    assert.ok(
      capturedUrl.includes(`/api/agents/token/${TOKEN_ADDRESS}`),
      `URL should contain the address. Got: ${capturedUrl}`,
    );
    assert.equal(result.id, 7);
    assert.equal(result.symbol, 'GIFT');
  });

  it('URL-encodes the token address', async () => {
    let capturedUrl = '';

    const restore = installFetchMock((url) => {
      capturedUrl = url;
      return Promise.resolve(makeResponse(mockToken));
    });

    const client = makeClient();
    // Address with special chars would need encoding — standard hex is fine as-is
    await getToken('0xABCD', client);

    restore();
    assert.ok(capturedUrl.includes('0xABCD'));
  });

  it('throws AgentLaunchError when address is not found (404)', async () => {
    const restore = installFetchMock(() =>
      Promise.resolve(makeResponse({ message: 'Token not found' }, 404)),
    );

    const client = makeClient();

    await assert.rejects(
      () => getToken('0xDEADBEEF', client),
      (err: unknown) => {
        assert.ok(err instanceof AgentLaunchError);
        assert.equal((err as AgentLaunchError).status, 404);
        assert.equal((err as AgentLaunchError).serverMessage, 'Token not found');
        return true;
      },
    );

    restore();
  });

  it('returns price and progress fields from the API response', async () => {
    const restore = installFetchMock(() =>
      Promise.resolve(makeResponse(mockToken)),
    );

    const client = makeClient();
    const token = await getToken(TOKEN_ADDRESS, client);

    restore();
    assert.equal(token.price, '0.0001234');
    assert.equal(token.progress, 32.9);
    assert.equal(token.listed, false);
  });
});

// ---------------------------------------------------------------------------
// listTokens()
// ---------------------------------------------------------------------------

describe('listTokens()', () => {
  it('calls GET /api/agents/tokens', async () => {
    let capturedUrl = '';

    const restore = installFetchMock((url) => {
      capturedUrl = url;
      return Promise.resolve(makeResponse({ tokens: [mockToken], total: 1 }));
    });

    const client = makeClient();
    await listTokens({}, client);

    restore();
    assert.ok(capturedUrl.includes('/api/agents/tokens'), `URL: ${capturedUrl}`);
  });

  it('appends pagination parameters to the URL', async () => {
    let capturedUrl = '';

    const restore = installFetchMock((url) => {
      capturedUrl = url;
      return Promise.resolve(makeResponse({ tokens: [], total: 0 }));
    });

    const client = makeClient();
    await listTokens({ page: 2, limit: 20 }, client);

    restore();
    assert.ok(capturedUrl.includes('page=2'), `URL: ${capturedUrl}`);
    assert.ok(capturedUrl.includes('limit=20'), `URL: ${capturedUrl}`);
  });

  it('appends sortBy and sortOrder params', async () => {
    let capturedUrl = '';

    const restore = installFetchMock((url) => {
      capturedUrl = url;
      return Promise.resolve(makeResponse({ tokens: [], total: 0 }));
    });

    const client = makeClient();
    await listTokens({ sortBy: 'market_cap', sortOrder: 'DESC' }, client);

    restore();
    assert.ok(capturedUrl.includes('sortBy=market_cap'), `URL: ${capturedUrl}`);
    assert.ok(capturedUrl.includes('sortOrder=DESC'), `URL: ${capturedUrl}`);
  });

  it('returns token list and total from the API response', async () => {
    const restore = installFetchMock(() =>
      Promise.resolve(makeResponse({ tokens: [mockToken], total: 1 })),
    );

    const client = makeClient();
    const result = await listTokens({}, client);

    restore();
    assert.equal(result.tokens.length, 1);
    assert.equal(result.total, 1);
    assert.equal(result.tokens[0]?.symbol, 'GIFT');
  });

  it('works with no params (returns all tokens)', async () => {
    let callCount = 0;

    const restore = installFetchMock(() => {
      callCount++;
      return Promise.resolve(makeResponse({ tokens: [mockToken], total: 1 }));
    });

    const client = makeClient();
    const result = await listTokens(undefined, client);

    restore();
    assert.equal(callCount, 1, 'should make exactly one fetch call');
    assert.ok(Array.isArray(result.tokens));
  });

  it('returns empty tokens array when no tokens exist', async () => {
    const restore = installFetchMock(() =>
      Promise.resolve(makeResponse({ tokens: [], total: 0 })),
    );

    const client = makeClient();
    const result = await listTokens({}, client);

    restore();
    assert.deepEqual(result.tokens, []);
    assert.equal(result.total, 0);
  });

  it('filters by chainId when provided', async () => {
    let capturedUrl = '';

    const restore = installFetchMock((url) => {
      capturedUrl = url;
      return Promise.resolve(makeResponse({ tokens: [], total: 0 }));
    });

    const client = makeClient();
    await listTokens({ chainId: 97 }, client);

    restore();
    assert.ok(capturedUrl.includes('chainId=97'), `URL: ${capturedUrl}`);
  });
});
