/**
 * Tests for SDK market operations — SDK-003
 *
 * Verifies:
 *   - generateTradeLink (positional API in market.ts) produces correct URLs
 *   - generateTradeLinkFromOptions delegates correctly
 *   - getTokenPrice extracts price from getToken response
 *
 * Platform note: 2% trading fee → 100% to protocol treasury (REVENUE_ACCOUNT).
 * There is NO creator fee split. This is enforced by the deployed smart contract.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { AgentLaunchClient } from '../client.js';
import {
  generateTradeLink,
  generateTradeLinkFromOptions,
  getTokenPrice,
} from '../market.js';
import type { Token } from '../types.js';
import { DEV_FRONTEND_URL } from '../urls.js';

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

const TOKEN_ADDRESS = '0xAbCd1234567890AbCd1234567890AbCd12345678';
const DEFAULT_BASE = DEV_FRONTEND_URL;

const mockToken: Token = {
  id: 1,
  name: 'GiftBot',
  symbol: 'GIFT',
  address: TOKEN_ADDRESS,
  description: 'An AI gifting agent',
  logo: 'https://agent-launch.ai/images/placeholder.png',
  status: 'bonding',
  price: '0.00042',
  market_cap: '336000',
  progress: 11.2,
  chainId: 97,
  listed: false,
  created_at: '2026-02-01T10:00:00.000Z',
};

// ---------------------------------------------------------------------------
// generateTradeLink (market.ts positional API)
// ---------------------------------------------------------------------------

describe('market.generateTradeLink() — positional API', () => {
  it('generates a buy link with action and amount', () => {
    const client = new AgentLaunchClient({ baseUrl: DEFAULT_BASE });
    const link = generateTradeLink(TOKEN_ADDRESS, 'buy', 100, client);
    assert.equal(link, `${DEFAULT_BASE}/trade/${TOKEN_ADDRESS}?action=buy&amount=100`);
  });

  it('generates a sell link with action and amount', () => {
    const client = new AgentLaunchClient({ baseUrl: DEFAULT_BASE });
    const link = generateTradeLink(TOKEN_ADDRESS, 'sell', 500, client);
    assert.equal(link, `${DEFAULT_BASE}/trade/${TOKEN_ADDRESS}?action=sell&amount=500`);
  });

  it('generates a link with no amount when amount is omitted', () => {
    const client = new AgentLaunchClient({ baseUrl: DEFAULT_BASE });
    const link = generateTradeLink(TOKEN_ADDRESS, 'buy', undefined, client);
    assert.equal(link, `${DEFAULT_BASE}/trade/${TOKEN_ADDRESS}?action=buy`);
  });

  it('uses the default base URL when no client is passed', () => {
    // Unset AGENT_LAUNCH_BASE_URL to ensure the fallback kicks in
    const saved = process.env['AGENT_LAUNCH_BASE_URL'];
    delete process.env['AGENT_LAUNCH_BASE_URL'];

    const link = generateTradeLink(TOKEN_ADDRESS, 'buy', 10);
    assert.ok(link.startsWith(DEFAULT_BASE), `Link: ${link}`);

    if (saved !== undefined) process.env['AGENT_LAUNCH_BASE_URL'] = saved;
  });

  it('accepts a string amount', () => {
    const client = new AgentLaunchClient({ baseUrl: DEFAULT_BASE });
    const link = generateTradeLink(TOKEN_ADDRESS, 'buy', '12.5', client);
    assert.ok(link.includes('amount=12.5'), `Link: ${link}`);
  });

  it('uses AGENT_LAUNCH_BASE_URL env var when no client is provided', () => {
    const saved = process.env['AGENT_LAUNCH_BASE_URL'];
    process.env['AGENT_LAUNCH_BASE_URL'] = 'https://my-custom-env.com';

    const link = generateTradeLink(TOKEN_ADDRESS, 'buy', 1);
    assert.ok(
      link.startsWith('https://my-custom-env.com'),
      `Expected env var base URL. Got: ${link}`,
    );

    if (saved !== undefined) {
      process.env['AGENT_LAUNCH_BASE_URL'] = saved;
    } else {
      delete process.env['AGENT_LAUNCH_BASE_URL'];
    }
  });
});

// ---------------------------------------------------------------------------
// generateTradeLinkFromOptions (market.ts options API)
// ---------------------------------------------------------------------------

describe('market.generateTradeLinkFromOptions()', () => {
  it('defaults to action=buy when action is not specified', () => {
    const client = new AgentLaunchClient({ baseUrl: DEFAULT_BASE });
    const link = generateTradeLinkFromOptions(TOKEN_ADDRESS, {}, client);
    assert.equal(link, `${DEFAULT_BASE}/trade/${TOKEN_ADDRESS}?action=buy`);
  });

  it('passes action=sell when specified in options', () => {
    const client = new AgentLaunchClient({ baseUrl: DEFAULT_BASE });
    const link = generateTradeLinkFromOptions(
      TOKEN_ADDRESS,
      { action: 'sell', amount: 200 },
      client,
    );
    assert.equal(link, `${DEFAULT_BASE}/trade/${TOKEN_ADDRESS}?action=sell&amount=200`);
  });

  it('works with an empty options object', () => {
    const client = new AgentLaunchClient({ baseUrl: DEFAULT_BASE });
    const link = generateTradeLinkFromOptions(TOKEN_ADDRESS, {}, client);
    // Should contain action=buy (default)
    assert.ok(link.includes('action=buy'), `Link: ${link}`);
  });

  it('works with no options argument', () => {
    const saved = process.env['AGENT_LAUNCH_BASE_URL'];
    delete process.env['AGENT_LAUNCH_BASE_URL'];

    const client = new AgentLaunchClient({ baseUrl: DEFAULT_BASE });
    const link = generateTradeLinkFromOptions(TOKEN_ADDRESS, undefined, client);
    assert.ok(link.includes('/trade/'), `Link: ${link}`);

    if (saved !== undefined) process.env['AGENT_LAUNCH_BASE_URL'] = saved;
  });
});

// ---------------------------------------------------------------------------
// getTokenPrice
// ---------------------------------------------------------------------------

describe('getTokenPrice()', () => {
  it('returns the price string from the token record', async () => {
    const restore = installFetchMock(() =>
      Promise.resolve(makeResponse(mockToken)),
    );

    const client = new AgentLaunchClient({
      baseUrl: 'https://test.local',
      apiKey: 'av-test',
    });
    const price = await getTokenPrice(TOKEN_ADDRESS, client);

    restore();
    assert.equal(price, '0.00042');
  });

  it('propagates fetch errors as AgentLaunchError', async () => {
    const restore = installFetchMock(() =>
      Promise.resolve(makeResponse({ message: 'Not found' }, 404)),
    );

    const client = new AgentLaunchClient({
      baseUrl: 'https://test.local',
    });

    const { AgentLaunchError } = await import('../types.js');

    await assert.rejects(
      () => getTokenPrice('0xBAD', client),
      (err: unknown) => {
        assert.ok(err instanceof AgentLaunchError);
        assert.equal((err as InstanceType<typeof AgentLaunchError>).status, 404);
        return true;
      },
    );

    restore();
  });
});
