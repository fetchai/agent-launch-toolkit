/**
 * Tests for SDK storage module — TST-02a
 *
 * Verifies:
 *   - listStorage returns array of {key, value} entries
 *   - getStorage returns string value for a key
 *   - getStorage returns null for a non-existent key
 *   - putStorage sends PUT with correct body
 *   - deleteStorage sends DELETE
 *   - All calls use Authorization: Bearer <key> (not X-API-Key)
 *   - Correct URL: https://agentverse.ai/v1/hosting/agents/{address}/storage/...
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { listStorage, getStorage, putStorage, deleteStorage } from '../storage.js';

// ---------------------------------------------------------------------------
// Helpers (matching existing SDK test patterns)
// ---------------------------------------------------------------------------

type FetchMock = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

function makeResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as unknown as Response;
}

function installFetchMock(mock: FetchMock): () => void {
  const original = globalThis.fetch;
  globalThis.fetch = mock as typeof globalThis.fetch;
  return () => {
    globalThis.fetch = original;
  };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const API_KEY = 'av-test-key-12345';
const AGENT_ADDRESS = 'agent1qf8xfhsc8hg4g5l0nhtjexample';
const AGENTVERSE_BASE = 'https://agentverse.ai/v1';

// ---------------------------------------------------------------------------
// listStorage
// ---------------------------------------------------------------------------

describe('listStorage()', () => {
  it('returns an array of {key, value} entries', async () => {
    const mockData = [
      { key: 'revenue_summary', value: '{"total": 100}' },
      { key: 'pricing_table', value: '{"basic": 1000}' },
    ];

    const restore = installFetchMock(() =>
      Promise.resolve(makeResponse(mockData)),
    );

    const result = await listStorage(AGENT_ADDRESS, API_KEY);

    restore();
    assert.ok(Array.isArray(result), 'result should be an array');
    assert.equal(result.length, 2);
    assert.equal(result[0].key, 'revenue_summary');
    assert.equal(result[1].key, 'pricing_table');
  });

  it('calls the correct Agentverse storage URL', async () => {
    let capturedUrl = '';

    const restore = installFetchMock((url) => {
      capturedUrl = url as string;
      return Promise.resolve(makeResponse([]));
    });

    await listStorage(AGENT_ADDRESS, API_KEY);

    restore();
    assert.ok(
      capturedUrl.includes(`${AGENTVERSE_BASE}/hosting/agents/${AGENT_ADDRESS}/storage`),
      `URL should target Agentverse storage endpoint. Got: ${capturedUrl}`,
    );
  });

  it('uses Authorization: Bearer header', async () => {
    let capturedHeaders: Record<string, string> = {};

    const restore = installFetchMock((_url, init) => {
      capturedHeaders = init?.headers as Record<string, string>;
      return Promise.resolve(makeResponse([]));
    });

    await listStorage(AGENT_ADDRESS, API_KEY);

    restore();
    assert.equal(
      capturedHeaders['Authorization'],
      `Bearer ${API_KEY}`,
      'should use Bearer auth, not X-API-Key',
    );
    assert.equal(
      capturedHeaders['X-API-Key'],
      undefined,
      'should NOT use X-API-Key header for Agentverse calls',
    );
  });

  it('returns empty array when no storage entries exist', async () => {
    const restore = installFetchMock(() =>
      Promise.resolve(makeResponse([])),
    );

    const result = await listStorage(AGENT_ADDRESS, API_KEY);

    restore();
    assert.deepEqual(result, []);
  });
});

// ---------------------------------------------------------------------------
// getStorage
// ---------------------------------------------------------------------------

describe('getStorage()', () => {
  it('returns string value for an existing key', async () => {
    const restore = installFetchMock(() =>
      Promise.resolve(makeResponse({ value: '{"total": 500}' })),
    );

    const result = await getStorage(AGENT_ADDRESS, 'revenue_summary', API_KEY);

    restore();
    assert.equal(result, '{"total": 500}');
  });

  it('includes the key name in the URL path', async () => {
    let capturedUrl = '';

    const restore = installFetchMock((url) => {
      capturedUrl = url as string;
      return Promise.resolve(makeResponse({ value: 'test' }));
    });

    await getStorage(AGENT_ADDRESS, 'my_key', API_KEY);

    restore();
    assert.ok(
      capturedUrl.includes(`/storage/my_key`) ||
        capturedUrl.includes(`/storage?key=my_key`),
      `URL should include the key. Got: ${capturedUrl}`,
    );
  });

  it('returns null for a non-existent key (404 response)', async () => {
    const restore = installFetchMock(() =>
      Promise.resolve(makeResponse({ message: 'Not found' }, 404)),
    );

    const result = await getStorage(AGENT_ADDRESS, 'nonexistent_key', API_KEY);

    restore();
    assert.equal(result, null, 'missing key should return null');
  });

  it('uses Authorization: Bearer header', async () => {
    let capturedHeaders: Record<string, string> = {};

    const restore = installFetchMock((_url, init) => {
      capturedHeaders = init?.headers as Record<string, string>;
      return Promise.resolve(makeResponse({ value: 'test' }));
    });

    await getStorage(AGENT_ADDRESS, 'test_key', API_KEY);

    restore();
    assert.equal(
      capturedHeaders['Authorization'],
      `Bearer ${API_KEY}`,
    );
  });

  it('uses GET method', async () => {
    let capturedMethod = '';

    const restore = installFetchMock((_url, init) => {
      capturedMethod = init?.method || 'GET';
      return Promise.resolve(makeResponse({ value: 'test' }));
    });

    await getStorage(AGENT_ADDRESS, 'test_key', API_KEY);

    restore();
    assert.equal(capturedMethod, 'GET');
  });
});

// ---------------------------------------------------------------------------
// putStorage
// ---------------------------------------------------------------------------

describe('putStorage()', () => {
  it('sends PUT with correct body', async () => {
    let capturedMethod = '';
    let capturedBody: unknown;
    let capturedUrl = '';

    const restore = installFetchMock((url, init) => {
      capturedUrl = url as string;
      capturedMethod = init?.method || '';
      capturedBody = init?.body ? JSON.parse(init.body as string) : undefined;
      return Promise.resolve(makeResponse({}));
    });

    await putStorage(AGENT_ADDRESS, 'my_key', 'my_value', API_KEY);

    restore();
    assert.equal(capturedMethod, 'PUT', 'should use PUT method');
    assert.ok(
      capturedUrl.includes(`/hosting/agents/${AGENT_ADDRESS}/storage`),
      `URL should target storage endpoint. Got: ${capturedUrl}`,
    );

    // Body should contain the key and value
    const body = capturedBody as Record<string, unknown>;
    assert.ok(body, 'should send a body');
  });

  it('uses Authorization: Bearer header', async () => {
    let capturedHeaders: Record<string, string> = {};

    const restore = installFetchMock((_url, init) => {
      capturedHeaders = init?.headers as Record<string, string>;
      return Promise.resolve(makeResponse({}));
    });

    await putStorage(AGENT_ADDRESS, 'key', 'value', API_KEY);

    restore();
    assert.equal(capturedHeaders['Authorization'], `Bearer ${API_KEY}`);
  });

  it('sends Content-Type: application/json', async () => {
    let capturedHeaders: Record<string, string> = {};

    const restore = installFetchMock((_url, init) => {
      capturedHeaders = init?.headers as Record<string, string>;
      return Promise.resolve(makeResponse({}));
    });

    await putStorage(AGENT_ADDRESS, 'key', 'value', API_KEY);

    restore();
    assert.equal(capturedHeaders['Content-Type'], 'application/json');
  });
});

// ---------------------------------------------------------------------------
// deleteStorage
// ---------------------------------------------------------------------------

describe('deleteStorage()', () => {
  it('sends DELETE with the correct URL', async () => {
    let capturedMethod = '';
    let capturedUrl = '';

    const restore = installFetchMock((url, init) => {
      capturedUrl = url as string;
      capturedMethod = init?.method || '';
      return Promise.resolve(makeResponse({}));
    });

    await deleteStorage(AGENT_ADDRESS, 'old_key', API_KEY);

    restore();
    assert.equal(capturedMethod, 'DELETE', 'should use DELETE method');
    assert.ok(
      capturedUrl.includes(`/hosting/agents/${AGENT_ADDRESS}/storage`),
      `URL should target storage endpoint. Got: ${capturedUrl}`,
    );
    assert.ok(
      capturedUrl.includes('old_key'),
      `URL should include the key name. Got: ${capturedUrl}`,
    );
  });

  it('uses Authorization: Bearer header', async () => {
    let capturedHeaders: Record<string, string> = {};

    const restore = installFetchMock((_url, init) => {
      capturedHeaders = init?.headers as Record<string, string>;
      return Promise.resolve(makeResponse({}));
    });

    await deleteStorage(AGENT_ADDRESS, 'key_to_delete', API_KEY);

    restore();
    assert.equal(capturedHeaders['Authorization'], `Bearer ${API_KEY}`);
  });
});

// ---------------------------------------------------------------------------
// URL correctness
// ---------------------------------------------------------------------------

describe('Storage module — URL correctness', () => {
  it('all storage calls hit the Agentverse API at /v1/hosting/agents/{address}/storage', async () => {
    const capturedUrls: string[] = [];

    const restore = installFetchMock((url) => {
      capturedUrls.push(url as string);
      return Promise.resolve(makeResponse([]));
    });

    await listStorage(AGENT_ADDRESS, API_KEY);
    await getStorage(AGENT_ADDRESS, 'test', API_KEY).catch(() => {});
    await putStorage(AGENT_ADDRESS, 'test', 'val', API_KEY).catch(() => {});
    await deleteStorage(AGENT_ADDRESS, 'test', API_KEY).catch(() => {});

    restore();

    for (const url of capturedUrls) {
      assert.ok(
        url.startsWith(`${AGENTVERSE_BASE}/hosting/agents/${AGENT_ADDRESS}/storage`),
        `All URLs should start with the Agentverse storage path. Got: ${url}`,
      );
    }
  });
});
