/**
 * Tests for AgentLaunchClient — SDK-001
 *
 * Verifies:
 *   - Default baseUrl resolves to https://agent-launch.ai
 *   - Custom baseUrl is accepted (trailing slash stripped)
 *   - X-API-Key header is injected when apiKey is present
 *   - Authenticated POST throws AgentLaunchError when apiKey is absent
 *   - Non-2xx responses throw AgentLaunchError with correct status
 *   - Server JSON error message is included in thrown error
 *   - Query parameters are appended to GET requests
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AgentLaunchClient } from '../client.js';
import { AgentLaunchError } from '../types.js';
/** Replace globalThis.fetch with a mock and return a restore function. */
function installFetchMock(mock) {
    const original = globalThis.fetch;
    globalThis.fetch = mock;
    return () => {
        globalThis.fetch = original;
    };
}
/** Build a minimal Response-like object that the SDK's fetch wrapper accepts. */
function makeResponse(body, status = 200, statusText = 'OK') {
    const jsonStr = JSON.stringify(body);
    return {
        ok: status >= 200 && status < 300,
        status,
        statusText,
        json: () => Promise.resolve(body),
        text: () => Promise.resolve(jsonStr),
    };
}
// ---------------------------------------------------------------------------
// describe: AgentLaunchClient construction
// ---------------------------------------------------------------------------
describe('AgentLaunchClient — construction', () => {
    it('uses https://agent-launch.ai as the default baseUrl', () => {
        const client = new AgentLaunchClient();
        assert.equal(client.baseUrl, 'https://agent-launch.ai');
    });
    it('accepts a custom baseUrl', () => {
        const client = new AgentLaunchClient({ baseUrl: 'https://my.server.com' });
        assert.equal(client.baseUrl, 'https://my.server.com');
    });
    it('strips a trailing slash from baseUrl', () => {
        const client = new AgentLaunchClient({ baseUrl: 'https://my.server.com/' });
        assert.equal(client.baseUrl, 'https://my.server.com');
    });
    it('constructs without throwing when no config is supplied', () => {
        assert.doesNotThrow(() => new AgentLaunchClient());
    });
});
// ---------------------------------------------------------------------------
// describe: GET — header injection
// ---------------------------------------------------------------------------
describe('AgentLaunchClient.get — header injection', () => {
    it('includes Content-Type: application/json on every GET request', async () => {
        let capturedHeaders = {};
        const restore = installFetchMock((_url, init) => {
            capturedHeaders = init?.headers;
            return Promise.resolve(makeResponse({ ok: true }));
        });
        const client = new AgentLaunchClient({ baseUrl: 'https://test.local' });
        await client.get('/api/agents/tokens');
        restore();
        assert.equal(capturedHeaders['Content-Type'], 'application/json');
    });
    it('attaches X-API-Key when an apiKey is configured', async () => {
        let capturedHeaders = {};
        const restore = installFetchMock((_url, init) => {
            capturedHeaders = init?.headers;
            return Promise.resolve(makeResponse({ tokens: [] }));
        });
        const client = new AgentLaunchClient({
            baseUrl: 'https://test.local',
            apiKey: 'av-test-key-123',
        });
        await client.get('/api/agents/tokens');
        restore();
        assert.equal(capturedHeaders['X-API-Key'], 'av-test-key-123');
    });
    it('omits X-API-Key when no apiKey is configured', async () => {
        let capturedHeaders = {};
        const restore = installFetchMock((_url, init) => {
            capturedHeaders = init?.headers;
            return Promise.resolve(makeResponse({ tokens: [] }));
        });
        const client = new AgentLaunchClient({ baseUrl: 'https://test.local' });
        await client.get('/api/agents/tokens');
        restore();
        assert.equal(capturedHeaders['X-API-Key'], undefined);
    });
});
// ---------------------------------------------------------------------------
// describe: GET — query string building
// ---------------------------------------------------------------------------
describe('AgentLaunchClient.get — query string', () => {
    it('appends query params to the URL', async () => {
        let capturedUrl = '';
        const restore = installFetchMock((url) => {
            capturedUrl = url;
            return Promise.resolve(makeResponse({ tokens: [] }));
        });
        const client = new AgentLaunchClient({ baseUrl: 'https://test.local' });
        await client.get('/api/agents/tokens', { page: 2, limit: 10 });
        restore();
        assert.ok(capturedUrl.includes('page=2'), 'should include page param');
        assert.ok(capturedUrl.includes('limit=10'), 'should include limit param');
    });
    it('omits undefined query param values', async () => {
        let capturedUrl = '';
        const restore = installFetchMock((url) => {
            capturedUrl = url;
            return Promise.resolve(makeResponse({ tokens: [] }));
        });
        const client = new AgentLaunchClient({ baseUrl: 'https://test.local' });
        await client.get('/api/agents/tokens', {
            page: 1,
            search: undefined,
        });
        restore();
        assert.ok(!capturedUrl.includes('search'), 'undefined param should be omitted');
    });
    it('makes a clean GET with no query string when params object is empty', async () => {
        let capturedUrl = '';
        const restore = installFetchMock((url) => {
            capturedUrl = url;
            return Promise.resolve(makeResponse({ tokens: [] }));
        });
        const client = new AgentLaunchClient({ baseUrl: 'https://test.local' });
        await client.get('/api/agents/tokens', {});
        restore();
        assert.ok(!capturedUrl.includes('?'), 'URL should not contain a query string');
    });
});
// ---------------------------------------------------------------------------
// describe: GET — error handling
// ---------------------------------------------------------------------------
describe('AgentLaunchClient.get — error handling', () => {
    it('throws AgentLaunchError when the response status is 404', async () => {
        const restore = installFetchMock(() => Promise.resolve(makeResponse({ message: 'Not found' }, 404, 'Not Found')));
        const client = new AgentLaunchClient({ baseUrl: 'https://test.local' });
        await assert.rejects(() => client.get('/api/agents/token/0xbad'), (err) => {
            assert.ok(err instanceof AgentLaunchError, 'should be AgentLaunchError');
            assert.equal(err.status, 404);
            return true;
        });
        restore();
    });
    it('includes the server error message in the thrown error', async () => {
        const restore = installFetchMock(() => Promise.resolve(makeResponse({ message: 'Token not found' }, 404, 'Not Found')));
        const client = new AgentLaunchClient({ baseUrl: 'https://test.local' });
        let caughtError;
        try {
            await client.get('/api/agents/token/0xbad');
        }
        catch (err) {
            caughtError = err;
        }
        restore();
        assert.ok(caughtError, 'should have thrown');
        assert.equal(caughtError.serverMessage, 'Token not found');
        assert.ok(caughtError.message.includes('Token not found'), 'message should embed serverMessage');
    });
    it('throws AgentLaunchError on 500 Internal Server Error', async () => {
        const restore = installFetchMock(() => Promise.resolve(makeResponse({ error: 'Internal error' }, 500, 'Internal Server Error')));
        const client = new AgentLaunchClient({ baseUrl: 'https://test.local' });
        await assert.rejects(() => client.get('/api/agents/tokens'), (err) => {
            assert.ok(err instanceof AgentLaunchError);
            assert.equal(err.status, 500);
            return true;
        });
        restore();
    });
});
// ---------------------------------------------------------------------------
// describe: POST — authentication guard
// ---------------------------------------------------------------------------
describe('AgentLaunchClient.post — authentication', () => {
    it('throws AgentLaunchError with status 0 when apiKey is absent on POST', async () => {
        const client = new AgentLaunchClient({ baseUrl: 'https://test.local' });
        await assert.rejects(() => client.post('/api/agents/tokenize', { agentAddress: 'agent1q...' }), (err) => {
            assert.ok(err instanceof AgentLaunchError, 'should be AgentLaunchError');
            assert.equal(err.status, 0);
            assert.ok(err.message.includes('API key'), 'message should mention API key');
            return true;
        });
    });
    it('attaches X-API-Key header on authenticated POST', async () => {
        let capturedHeaders = {};
        const restore = installFetchMock((_url, init) => {
            capturedHeaders = init?.headers;
            return Promise.resolve(makeResponse({ success: true, data: { token_id: 1, handoff_link: 'https://agent-launch.ai/deploy/1', name: 'TestToken', symbol: 'TEST', description: 'test', image: '', status: 'pending_deployment' } }));
        });
        const client = new AgentLaunchClient({
            baseUrl: 'https://test.local',
            apiKey: 'av-secret-key',
        });
        await client.post('/api/agents/tokenize', {
            agentAddress: 'agent1qtest',
        });
        restore();
        assert.equal(capturedHeaders['X-API-Key'], 'av-secret-key');
    });
    it('throws AgentLaunchError on non-2xx POST response', async () => {
        const restore = installFetchMock(() => Promise.resolve(makeResponse({ message: 'Unauthorized' }, 401, 'Unauthorized')));
        const client = new AgentLaunchClient({
            baseUrl: 'https://test.local',
            apiKey: 'av-bad-key',
        });
        await assert.rejects(() => client.post('/api/agents/tokenize', {}), (err) => {
            assert.ok(err instanceof AgentLaunchError);
            assert.equal(err.status, 401);
            return true;
        });
        restore();
    });
});
//# sourceMappingURL=client.test.js.map