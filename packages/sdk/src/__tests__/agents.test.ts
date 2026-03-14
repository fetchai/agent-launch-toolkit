/**
 * Tests for agent operations — SDK-A01–A03
 *
 * Verifies:
 *   - authenticate(apiKey) → POST /agents/auth with { api_key } in body
 *   - authenticate() → returns JWT + expires_in
 *   - getMyAgents() → GET /agents/my-agents with X-API-Key header
 *   - getMyAgents() → returns agents array + count
 *   - importFromAgentverse(key) → POST /agents/import-agentverse
 */

import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { authenticate, getMyAgents, importFromAgentverse } from '../agents.js';
import { AgentLaunchClient } from '../client.js';
import { AgentLaunchError } from '../types.js';

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
// authenticate
// ---------------------------------------------------------------------------

describe('authenticate — SDK-A01', () => {
  it('sends POST to /agents/auth with api_key in body', async () => {
    let capturedUrl = '';
    let capturedBody: Record<string, unknown> = {};
    let capturedHeaders: Record<string, string> = {};

    restoreFn = installFetchMock(async (_url, init) => {
      capturedUrl = _url as string;
      capturedHeaders = init?.headers as Record<string, string>;
      capturedBody = JSON.parse(init?.body as string);
      return makeResponse({
        data: { token: 'jwt-token-123', expires_in: 3600 },
      });
    });

    // Use a client that has an apiKey set so the POST auth guard is satisfied
    const client = new AgentLaunchClient({
      baseUrl: 'https://test.local',
      apiKey: 'av-for-auth',
    });
    await authenticate('av-test-key', client);

    assert.ok(capturedUrl.endsWith('/agents/auth'), `URL should end with /agents/auth, got: ${capturedUrl}`);
    assert.equal(capturedBody.api_key, 'av-test-key');
  });

  it('returns token and expires_in from response', async () => {
    restoreFn = installFetchMock(async () => {
      return makeResponse({
        data: { token: 'jwt-xyz', expires_in: 7200 },
      });
    });

    const client = new AgentLaunchClient({
      baseUrl: 'https://test.local',
      apiKey: 'av-for-auth',
    });
    const result = await authenticate('av-test-key', client);

    assert.ok(result.data, 'should have data field');
    assert.equal(result.data.token, 'jwt-xyz');
    assert.equal(result.data.expires_in, 7200);
  });
});

// ---------------------------------------------------------------------------
// getMyAgents
// ---------------------------------------------------------------------------

describe('getMyAgents — SDK-A02', () => {
  it('sends GET to /agents/my-agents with X-API-Key header', async () => {
    let capturedUrl = '';
    let capturedHeaders: Record<string, string> = {};

    restoreFn = installFetchMock(async (_url, init) => {
      capturedUrl = _url as string;
      capturedHeaders = init?.headers as Record<string, string>;
      return makeResponse({
        agents: [{ address: 'agent1qtest' }],
        count: 1,
      });
    });

    const client = new AgentLaunchClient({
      baseUrl: 'https://test.local',
      apiKey: 'av-my-agents-key',
    });
    await getMyAgents(client);

    assert.ok(capturedUrl.includes('/agents/my-agents'));
    assert.equal(capturedHeaders['X-API-Key'], 'av-my-agents-key');
  });

  it('returns agents array and count', async () => {
    restoreFn = installFetchMock(async () => {
      return makeResponse({
        success: true,
        data: {
          agents: [
            { address: 'agent1qa' },
            { address: 'agent1qb' },
          ],
          count: 2,
        },
      });
    });

    const client = new AgentLaunchClient({
      baseUrl: 'https://test.local',
      apiKey: 'av-key',
    });
    const result = await getMyAgents(client);

    assert.equal(result.data.agents.length, 2);
    assert.equal(result.data.count, 2);
  });
});

// ---------------------------------------------------------------------------
// importFromAgentverse
// ---------------------------------------------------------------------------

describe('importFromAgentverse — SDK-A03', () => {
  it('sends POST to /agents/import-agentverse with agentverseApiKey', async () => {
    let capturedUrl = '';
    let capturedBody: Record<string, unknown> = {};

    restoreFn = installFetchMock(async (_url, init) => {
      capturedUrl = _url as string;
      capturedBody = JSON.parse(init?.body as string);
      return makeResponse({
        agents: [{ address: 'agent1qimport' }],
        count: 1,
      });
    });

    // importFromAgentverse needs a client with apiKey for the POST auth guard
    const client = new AgentLaunchClient({
      baseUrl: 'https://test.local',
      apiKey: 'av-import-key',
    });
    const result = await importFromAgentverse('av-import-key', client);

    assert.ok(capturedUrl.includes('/agents/import-agentverse'));
    assert.equal(capturedBody.agentverseApiKey, 'av-import-key');
    assert.equal(result.count, 1);
  });
});
