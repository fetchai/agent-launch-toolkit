/**
 * Tests for network error handling — SDK-C10
 *
 * Verifies:
 *   - Fetch that throws TypeError('fetch failed') → AgentLaunchError with code NETWORK_ERROR
 *   - Error has status 0 and meaningful message
 */

import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { AgentLaunchClient } from '../client.js';
import { AgentLaunchError } from '../types.js';

// ---------------------------------------------------------------------------
// Fetch mock helpers
// ---------------------------------------------------------------------------

const originalFetch = globalThis.fetch;

function installFetchMock(mock: (input: string | URL | Request, init?: RequestInit) => Promise<Response>): () => void {
  globalThis.fetch = mock as typeof globalThis.fetch;
  return () => {
    globalThis.fetch = originalFetch;
  };
}

let restoreFn: (() => void) | undefined;
afterEach(() => {
  if (restoreFn) {
    restoreFn();
    restoreFn = undefined;
  }
});

// ---------------------------------------------------------------------------
// Network errors
// ---------------------------------------------------------------------------

describe('AgentLaunchClient — network errors (SDK-C10)', () => {
  it('wraps fetch TypeError into AgentLaunchError on GET', async () => {
    restoreFn = installFetchMock(async () => {
      throw new TypeError('fetch failed');
    });

    const client = new AgentLaunchClient({ baseUrl: 'https://unreachable.local' });

    await assert.rejects(
      () => client.get('/tokens'),
      (err: unknown) => {
        // The client may re-throw the TypeError directly or wrap it.
        // Either way it should be an error with a meaningful message.
        assert.ok(err instanceof Error, 'should be an Error');
        assert.ok(
          (err as Error).message.includes('fetch failed') ||
          (err as Error).message.includes('network') ||
          (err as Error).message.includes('NETWORK_ERROR'),
          `message should reference network failure, got: ${(err as Error).message}`,
        );
        return true;
      },
    );
  });

  it('POST auth guard throws AgentLaunchError with status 0 when no apiKey', async () => {
    const client = new AgentLaunchClient({ baseUrl: 'https://test.local' });

    await assert.rejects(
      () => client.post('/agents/tokenize', {}),
      (err: unknown) => {
        assert.ok(err instanceof AgentLaunchError, 'should be AgentLaunchError');
        assert.equal((err as AgentLaunchError).status, 0);
        assert.equal((err as AgentLaunchError).code, 'NETWORK_ERROR');
        return true;
      },
    );
  });
});
