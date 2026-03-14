/**
 * Tests for Agentverse deployment client — SDK-AV01–AV10
 *
 * Verifies:
 *   - createAgent() → POST /v1/hosting/agents with Bearer auth
 *   - uploadCode() → PUT with double-encoded JSON body
 *   - setSecret() → POST /v1/hosting/secrets with address + name + secret
 *   - startAgent() → POST /v1/hosting/agents/{addr}/start
 *   - getAgentStatus() → GET /v1/hosting/agents/{addr}
 *   - deployAgent() → full pipeline chains calls correctly
 *   - deployAgent() → polls until compiled=true or hits max
 *   - updateAgent() → PUT with metadata fields
 *   - buildOptimizationChecklist() → returns 7-item array
 *   - Double-encoding: uploadCode body has { code: JSON.stringify([...]) }
 */

import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  createAgent,
  uploadCode,
  setSecret,
  startAgent,
  getAgentStatus,
  deployAgent,
  updateAgent,
  buildOptimizationChecklist,
} from '../agentverse.js';

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

// Ensure fetch is restored after each test even on failure
let restoreFn: (() => void) | undefined;
afterEach(() => {
  if (restoreFn) {
    restoreFn();
    restoreFn = undefined;
  }
});

// ---------------------------------------------------------------------------
// createAgent
// ---------------------------------------------------------------------------

describe('createAgent — SDK-AV01', () => {
  it('sends POST to /v1/hosting/agents with Bearer auth', async () => {
    let capturedUrl = '';
    let capturedHeaders: Record<string, string> = {};
    let capturedBody: unknown;

    restoreFn = installFetchMock(async (_url, init) => {
      capturedUrl = _url as string;
      capturedHeaders = Object.fromEntries(
        Object.entries(init?.headers as Record<string, string>),
      );
      capturedBody = JSON.parse(init?.body as string);
      return makeResponse({ address: 'agent1qtest', name: 'test-agent' });
    });

    const result = await createAgent('av-key-123', 'test-agent');

    assert.ok(capturedUrl.endsWith('/hosting/agents'), `URL should end with /hosting/agents, got: ${capturedUrl}`);
    assert.equal(capturedHeaders['Authorization'], 'Bearer av-key-123');
    assert.equal((capturedBody as Record<string, unknown>).name, 'test-agent');
    assert.equal(result.address, 'agent1qtest');
  });

  it('slices name to 64 characters', async () => {
    let capturedBody: unknown;

    restoreFn = installFetchMock(async (_url, init) => {
      capturedBody = JSON.parse(init?.body as string);
      return makeResponse({ address: 'agent1qtest' });
    });

    const longName = 'a'.repeat(100);
    await createAgent('av-key-123', longName);

    assert.equal(
      ((capturedBody as Record<string, unknown>).name as string).length,
      64,
    );
  });

  it('includes metadata when provided', async () => {
    let capturedBody: Record<string, unknown> = {};

    restoreFn = installFetchMock(async (_url, init) => {
      capturedBody = JSON.parse(init?.body as string);
      return makeResponse({ address: 'agent1qtest' });
    });

    await createAgent('av-key-123', 'my-agent', {
      readme: '# Hello',
      short_description: 'A test agent',
      avatar_url: 'https://example.com/avatar.png',
    });

    assert.equal(capturedBody.readme, '# Hello');
    assert.equal(capturedBody.short_description, 'A test agent');
    assert.equal(capturedBody.avatar_url, 'https://example.com/avatar.png');
  });
});

// ---------------------------------------------------------------------------
// uploadCode — double encoding
// ---------------------------------------------------------------------------

describe('uploadCode — SDK-AV02 (double encoding)', () => {
  it('sends PUT with double-encoded JSON code body', async () => {
    let capturedUrl = '';
    let capturedMethod = '';
    let capturedBody: Record<string, unknown> = {};

    restoreFn = installFetchMock(async (_url, init) => {
      capturedUrl = _url as string;
      capturedMethod = init?.method ?? '';
      capturedBody = JSON.parse(init?.body as string);
      return makeResponse({ digest: 'abc123' });
    });

    await uploadCode('av-key', 'agent1qtest', 'print("hello")', 'agent.py');

    assert.equal(capturedMethod, 'PUT');
    assert.ok(capturedUrl.includes('/hosting/agents/agent1qtest/code'));

    // The critical check: code field is a JSON string, not an array
    assert.equal(typeof capturedBody.code, 'string', 'code field must be a string (double-encoded)');

    // Parse the inner JSON to verify structure
    const inner = JSON.parse(capturedBody.code as string);
    assert.ok(Array.isArray(inner), 'inner value should be an array');
    assert.equal(inner.length, 1);
    assert.equal(inner[0].language, 'python');
    assert.equal(inner[0].name, 'agent.py');
    assert.equal(inner[0].value, 'print("hello")');
  });

  it('code field is NOT a raw array (would cause "Invalid code format")', async () => {
    let capturedBody: Record<string, unknown> = {};

    restoreFn = installFetchMock(async (_url, init) => {
      capturedBody = JSON.parse(init?.body as string);
      return makeResponse({});
    });

    await uploadCode('av-key', 'agent1qx', 'pass');

    // If someone accidentally sends the array directly, typeof would be 'object'
    assert.notEqual(
      typeof capturedBody.code,
      'object',
      'code must NOT be a raw array/object — must be a JSON string',
    );
  });

  it('uses default filename agent.py when not specified', async () => {
    let capturedBody: Record<string, unknown> = {};

    restoreFn = installFetchMock(async (_url, init) => {
      capturedBody = JSON.parse(init?.body as string);
      return makeResponse({});
    });

    await uploadCode('av-key', 'agent1qx', 'pass');

    const inner = JSON.parse(capturedBody.code as string);
    assert.equal(inner[0].name, 'agent.py');
  });
});

// ---------------------------------------------------------------------------
// setSecret
// ---------------------------------------------------------------------------

describe('setSecret — SDK-AV03', () => {
  it('sends POST to /v1/hosting/secrets with correct payload', async () => {
    let capturedUrl = '';
    let capturedBody: Record<string, unknown> = {};

    restoreFn = installFetchMock(async (_url, init) => {
      capturedUrl = _url as string;
      capturedBody = JSON.parse(init?.body as string);
      return makeResponse({});
    });

    await setSecret('av-key', 'agent1qtest', 'MY_SECRET', 'secret-value');

    assert.ok(capturedUrl.endsWith('/hosting/secrets'));
    assert.equal(capturedBody.address, 'agent1qtest');
    assert.equal(capturedBody.name, 'MY_SECRET');
    assert.equal(capturedBody.secret, 'secret-value');
  });
});

// ---------------------------------------------------------------------------
// startAgent
// ---------------------------------------------------------------------------

describe('startAgent — SDK-AV04', () => {
  it('sends POST to /v1/hosting/agents/{addr}/start', async () => {
    let capturedUrl = '';
    let capturedMethod = '';

    restoreFn = installFetchMock(async (_url, init) => {
      capturedUrl = _url as string;
      capturedMethod = init?.method ?? '';
      return makeResponse({});
    });

    await startAgent('av-key', 'agent1qtest');

    assert.equal(capturedMethod, 'POST');
    assert.ok(capturedUrl.includes('/hosting/agents/agent1qtest/start'));
  });
});

// ---------------------------------------------------------------------------
// getAgentStatus
// ---------------------------------------------------------------------------

describe('getAgentStatus — SDK-AV05', () => {
  it('sends GET to /v1/hosting/agents/{addr} and returns status', async () => {
    let capturedUrl = '';
    let capturedMethod = '';

    const statusResponse = {
      address: 'agent1qtest',
      running: true,
      compiled: true,
      wallet_address: 'fetch1abc',
    };

    restoreFn = installFetchMock(async (_url, init) => {
      capturedUrl = _url as string;
      capturedMethod = init?.method ?? '';
      return makeResponse(statusResponse);
    });

    const result = await getAgentStatus('av-key', 'agent1qtest');

    assert.equal(capturedMethod, 'GET');
    assert.ok(capturedUrl.includes('/hosting/agents/agent1qtest'));
    assert.ok(!capturedUrl.includes('/start'), 'should not include /start in path');
    assert.equal(result.running, true);
    assert.equal(result.compiled, true);
    assert.equal(result.wallet_address, 'fetch1abc');
  });
});

// ---------------------------------------------------------------------------
// deployAgent — full pipeline
// ---------------------------------------------------------------------------

describe('deployAgent — SDK-AV06–AV07', () => {
  it('chains create → upload → secrets → start → poll correctly', async () => {
    const callLog: string[] = [];

    // Save/restore env to provide API key
    const origEnv = process.env['AGENTVERSE_API_KEY'];
    process.env['AGENTVERSE_API_KEY'] = 'av-deploy-test';

    restoreFn = installFetchMock(async (_url, init) => {
      const url = _url as string;
      const method = init?.method ?? 'GET';

      if (method === 'POST' && url.includes('/hosting/agents') && !url.includes('/start') && !url.includes('/secrets')) {
        callLog.push('create');
        return makeResponse({ address: 'agent1qnew', name: 'test' });
      }
      if (method === 'PUT' && url.includes('/code')) {
        callLog.push('upload');
        return makeResponse({ digest: 'abc' });
      }
      if (method === 'POST' && url.includes('/secrets')) {
        callLog.push('secret');
        return makeResponse({});
      }
      if (method === 'POST' && url.includes('/start')) {
        callLog.push('start');
        return makeResponse({});
      }
      if (method === 'GET' && url.includes('/hosting/agents/agent1qnew')) {
        callLog.push('poll');
        return makeResponse({ running: true, compiled: true, wallet_address: 'fetch1x' });
      }
      return makeResponse({});
    });

    const result = await deployAgent({
      apiKey: 'av-deploy-test',
      agentName: 'test-agent',
      sourceCode: 'print("hello")',
      maxPolls: 1,
    });

    process.env['AGENTVERSE_API_KEY'] = origEnv;

    assert.equal(result.agentAddress, 'agent1qnew');
    assert.equal(result.status, 'running');
    assert.equal(result.walletAddress, 'fetch1x');

    // Verify order: create before upload before start
    assert.ok(callLog.indexOf('create') < callLog.indexOf('upload'));
    assert.ok(callLog.indexOf('upload') < callLog.indexOf('start'));
    assert.ok(callLog.indexOf('start') < callLog.indexOf('poll'));
  });

  it('throws when no API key is available', async () => {
    const origKeys = {
      AGENTVERSE_API_KEY: process.env['AGENTVERSE_API_KEY'],
      AGENTLAUNCH_API_KEY: process.env['AGENTLAUNCH_API_KEY'],
      AGENT_LAUNCH_API_KEY: process.env['AGENT_LAUNCH_API_KEY'],
    };
    delete process.env['AGENTVERSE_API_KEY'];
    delete process.env['AGENTLAUNCH_API_KEY'];
    delete process.env['AGENT_LAUNCH_API_KEY'];

    await assert.rejects(
      () => deployAgent({ agentName: 'test', sourceCode: 'pass' }),
      (err: unknown) => {
        assert.ok((err as Error).message.includes('API key'));
        return true;
      },
    );

    // Restore env
    for (const [k, v] of Object.entries(origKeys)) {
      if (v !== undefined) process.env[k] = v;
    }
  });

  it('returns starting status when agent never compiles', async () => {
    restoreFn = installFetchMock(async (_url, init) => {
      const url = _url as string;
      const method = init?.method ?? 'GET';

      if (method === 'POST' && url.includes('/hosting/agents') && !url.includes('/start') && !url.includes('/secrets')) {
        return makeResponse({ address: 'agent1qslow' });
      }
      if (method === 'PUT' && url.includes('/code')) {
        return makeResponse({});
      }
      if (method === 'POST' && url.includes('/secrets')) {
        return makeResponse({});
      }
      if (method === 'POST' && url.includes('/start')) {
        return makeResponse({});
      }
      if (method === 'GET') {
        // Never becomes compiled
        return makeResponse({ running: false, compiled: false });
      }
      return makeResponse({});
    });

    const result = await deployAgent({
      apiKey: 'av-key',
      agentName: 'slow-agent',
      sourceCode: 'pass',
      maxPolls: 1,
    });

    assert.equal(result.status, 'starting');
  });

  it('includes optimization checklist in result', async () => {
    restoreFn = installFetchMock(async (_url, init) => {
      const url = _url as string;
      const method = init?.method ?? 'GET';

      if (method === 'POST' && url.includes('/hosting/agents') && !url.includes('/start') && !url.includes('/secrets')) {
        return makeResponse({ address: 'agent1qopt' });
      }
      if (method === 'GET') {
        return makeResponse({ running: true, compiled: true, wallet_address: 'fetch1' });
      }
      return makeResponse({});
    });

    const result = await deployAgent({
      apiKey: 'av-key',
      agentName: 'opt-agent',
      sourceCode: 'pass',
      maxPolls: 1,
      metadata: { readme: '# Test' },
    });

    assert.ok(Array.isArray(result.optimization));
    assert.equal(result.optimization.length, 7);
  });
});

// ---------------------------------------------------------------------------
// updateAgent
// ---------------------------------------------------------------------------

describe('updateAgent — SDK-AV08', () => {
  it('sends PUT with metadata fields', async () => {
    let capturedUrl = '';
    let capturedBody: Record<string, unknown> = {};

    restoreFn = installFetchMock(async (_url, init) => {
      capturedUrl = _url as string;
      capturedBody = JSON.parse(init?.body as string);
      return makeResponse({});
    });

    const result = await updateAgent({
      apiKey: 'av-key',
      agentAddress: 'agent1qtest',
      metadata: {
        readme: '# Updated README',
        short_description: 'Updated description',
      },
    });

    assert.ok(capturedUrl.includes('/hosting/agents/agent1qtest'));
    assert.equal(capturedBody.readme, '# Updated README');
    assert.equal(capturedBody.short_description, 'Updated description');
    assert.equal(result.success, true);
    assert.ok(result.updatedFields.includes('readme'));
    assert.ok(result.updatedFields.includes('short_description'));
  });

  it('truncates short_description to 200 characters', async () => {
    let capturedBody: Record<string, unknown> = {};

    restoreFn = installFetchMock(async (_url, init) => {
      capturedBody = JSON.parse(init?.body as string);
      return makeResponse({});
    });

    await updateAgent({
      apiKey: 'av-key',
      agentAddress: 'agent1qtest',
      metadata: {
        short_description: 'x'.repeat(300),
      },
    });

    assert.equal((capturedBody.short_description as string).length, 200);
  });
});

// ---------------------------------------------------------------------------
// buildOptimizationChecklist
// ---------------------------------------------------------------------------

describe('buildOptimizationChecklist — SDK-AV09', () => {
  it('returns exactly 7 items', () => {
    const checklist = buildOptimizationChecklist({
      agentAddress: 'agent1qtest',
    });

    assert.equal(checklist.length, 7);
  });

  it('has correct factors in order', () => {
    const checklist = buildOptimizationChecklist({
      agentAddress: 'agent1qtest',
    });

    const factors = checklist.map((c) => c.factor);
    assert.deepEqual(factors, [
      'Chat Protocol',
      'README',
      'Short Description',
      'Avatar',
      'Active Status',
      'Handle',
      '3+ Interactions',
    ]);
  });

  it('marks Chat Protocol as always done', () => {
    const checklist = buildOptimizationChecklist({
      agentAddress: 'agent1qtest',
    });

    assert.equal(checklist[0].done, true);
  });

  it('marks README as done when hasReadme is true', () => {
    const checklist = buildOptimizationChecklist({
      agentAddress: 'agent1qtest',
      hasReadme: true,
    });

    assert.equal(checklist[1].done, true);
    assert.equal(checklist[1].hint, undefined);
  });

  it('marks README as not done with hint when hasReadme is false', () => {
    const checklist = buildOptimizationChecklist({
      agentAddress: 'agent1qtest',
      hasReadme: false,
    });

    assert.equal(checklist[1].done, false);
    assert.ok(checklist[1].hint);
  });

  it('marks Handle and 3+ Interactions as manual_required', () => {
    const checklist = buildOptimizationChecklist({
      agentAddress: 'agent1qtest',
    });

    assert.equal(checklist[5].manual_required, true); // Handle
    assert.equal(checklist[6].manual_required, true); // 3+ Interactions
  });
});

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

describe('Agentverse error handling — SDK-AV10', () => {
  it('throws Error with status details on non-2xx response', async () => {
    restoreFn = installFetchMock(async () => {
      return makeResponse(
        { detail: 'Agent not found' },
        404,
        'Not Found',
      );
    });

    await assert.rejects(
      () => getAgentStatus('av-key', 'agent1qbad'),
      (err: unknown) => {
        const e = err as Error;
        assert.ok(e.message.includes('404'));
        assert.ok(e.message.includes('Agent not found'));
        return true;
      },
    );
  });

  it('extracts detail field from Agentverse error response', async () => {
    restoreFn = installFetchMock(async () => {
      return makeResponse(
        { detail: 'Invalid code format' },
        400,
        'Bad Request',
      );
    });

    await assert.rejects(
      () => uploadCode('av-key', 'agent1q', 'bad code'),
      (err: unknown) => {
        assert.ok((err as Error).message.includes('Invalid code format'));
        return true;
      },
    );
  });
});
