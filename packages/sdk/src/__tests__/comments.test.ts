/**
 * Tests for SDK comment operations — SDK-CO01 through SDK-CO04
 *
 * Verifies:
 *   - SDK-CO01: getComments(address) sends GET to /comments/{address}
 *   - SDK-CO02: getComments() returns comment array from response
 *   - SDK-CO03: postComment(params) sends POST to /comments/{address} with {message} body and X-API-Key header
 *   - SDK-CO04: postComment() requires apiKey (client without apiKey should throw)
 */

import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { getComments, postComment } from '../comments.js';
import { AgentLaunchClient } from '../client.js';

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
// Test data
// ---------------------------------------------------------------------------

const TOKEN_ADDRESS = '0xAbCd1234567890AbCd1234567890AbCd12345678';

const SAMPLE_COMMENTS = [
  {
    id: 1,
    message: 'Great agent!',
    userId: 10,
    tokenId: 5,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    user: { id: 10, username: 'alice' },
  },
  {
    id: 2,
    message: 'Bullish!',
    userId: 20,
    tokenId: 5,
    created_at: '2026-01-02T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z',
    user: { id: 20, username: 'bob' },
  },
];

// ---------------------------------------------------------------------------
// getComments — SDK-CO01
// ---------------------------------------------------------------------------

describe('getComments — SDK-CO01', () => {
  it('sends GET to /comments/{address}', async () => {
    let capturedUrl = '';

    restoreFn = installFetchMock(async (_url) => {
      capturedUrl = _url as string;
      return makeResponse(SAMPLE_COMMENTS);
    });

    const client = new AgentLaunchClient({
      baseUrl: 'https://test.local',
      apiKey: 'av-test',
    });
    await getComments(TOKEN_ADDRESS, client);

    assert.ok(
      capturedUrl.includes(`/comments/${TOKEN_ADDRESS}`),
      `URL should contain /comments/${TOKEN_ADDRESS}, got: ${capturedUrl}`,
    );
  });
});

// ---------------------------------------------------------------------------
// getComments — SDK-CO02
// ---------------------------------------------------------------------------

describe('getComments — SDK-CO02', () => {
  it('returns comment array from response', async () => {
    restoreFn = installFetchMock(async () => {
      return makeResponse(SAMPLE_COMMENTS);
    });

    const client = new AgentLaunchClient({
      baseUrl: 'https://test.local',
      apiKey: 'av-test',
    });
    const comments = await getComments(TOKEN_ADDRESS, client);

    assert.equal(comments.length, 2);
    assert.equal(comments[0].id, 1);
    assert.equal(comments[0].message, 'Great agent!');
    assert.equal(comments[1].id, 2);
    assert.equal(comments[1].message, 'Bullish!');
    assert.equal(comments[0].user?.username, 'alice');
  });
});

// ---------------------------------------------------------------------------
// postComment — SDK-CO03
// ---------------------------------------------------------------------------

describe('postComment — SDK-CO03', () => {
  it('sends POST to /comments/{address} with {message} body and X-API-Key header', async () => {
    let capturedUrl = '';
    let capturedBody: Record<string, unknown> = {};
    let capturedHeaders: Record<string, string> = {};
    let capturedMethod = '';

    restoreFn = installFetchMock(async (_url, init) => {
      capturedUrl = _url as string;
      capturedMethod = init?.method ?? '';
      capturedHeaders = init?.headers as Record<string, string>;
      capturedBody = JSON.parse(init?.body as string);
      return makeResponse({
        id: 3,
        message: 'Nice work!',
        created_at: '2026-01-03T00:00:00Z',
      });
    });

    const client = new AgentLaunchClient({
      baseUrl: 'https://test.local',
      apiKey: 'av-comment-key',
    });
    await postComment(
      { tokenAddress: TOKEN_ADDRESS, message: 'Nice work!' },
      client,
    );

    assert.equal(capturedMethod, 'POST');
    assert.ok(
      capturedUrl.includes(`/comments/${TOKEN_ADDRESS}`),
      `URL should contain /comments/${TOKEN_ADDRESS}, got: ${capturedUrl}`,
    );
    assert.equal(capturedBody.message, 'Nice work!');
    assert.equal(capturedHeaders['X-API-Key'], 'av-comment-key');
  });

  it('returns PostCommentResponse with id and created_at', async () => {
    restoreFn = installFetchMock(async () => {
      return makeResponse({
        id: 42,
        message: 'Hello!',
        created_at: '2026-03-05T12:00:00Z',
      });
    });

    const client = new AgentLaunchClient({
      baseUrl: 'https://test.local',
      apiKey: 'av-test',
    });
    const result = await postComment(
      { tokenAddress: TOKEN_ADDRESS, message: 'Hello!' },
      client,
    );

    assert.equal(result.id, 42);
    assert.equal(result.message, 'Hello!');
    assert.equal(result.created_at, '2026-03-05T12:00:00Z');
  });
});

// ---------------------------------------------------------------------------
// postComment — SDK-CO04
// ---------------------------------------------------------------------------

describe('postComment — SDK-CO04', () => {
  it('requires apiKey — client without apiKey should throw', async () => {
    // installFetchMock so we don't hit real network, but it should never be called
    restoreFn = installFetchMock(async () => {
      return makeResponse({ id: 1, message: 'test', created_at: '' });
    });

    const client = new AgentLaunchClient({
      baseUrl: 'https://test.local',
      // No apiKey
    });

    await assert.rejects(
      () =>
        postComment(
          { tokenAddress: TOKEN_ADDRESS, message: 'Should fail' },
          client,
        ),
      (err: Error) => {
        assert.ok(
          err.message.includes('API key'),
          `Error should mention API key, got: ${err.message}`,
        );
        return true;
      },
    );
  });
});
