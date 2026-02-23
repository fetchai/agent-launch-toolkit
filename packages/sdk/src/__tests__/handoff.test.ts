/**
 * Tests for SDK handoff link generation — SDK-004
 *
 * Verifies:
 *   - generateDeployLink produces the correct URL for a given token ID
 *   - generateDeployLink accepts a custom baseUrl override
 *   - generateDeployLink throws on invalid token IDs (0, negative, non-integer)
 *   - generateTradeLink produces the correct URL with no options
 *   - generateTradeLink appends action and amount query params
 *   - generateBuyLink / generateSellLink convenience wrappers
 *   - resolveBaseUrl falls back to dev Cloud Run frontend URL
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  generateDeployLink,
  generateTradeLink,
  generateBuyLink,
  generateSellLink,
} from '../handoff.js';
import { DEV_FRONTEND_URL } from '../urls.js';

const DEFAULT_BASE = DEV_FRONTEND_URL;
const CUSTOM_BASE = 'https://fetch.ants-at-work.com';
const TOKEN_ADDRESS = '0xAbCd1234567890AbCd1234567890AbCd12345678';

// ---------------------------------------------------------------------------
// generateDeployLink
// ---------------------------------------------------------------------------

describe('generateDeployLink()', () => {
  it('generates the correct URL for a positive integer token ID', () => {
    const link = generateDeployLink(42);
    assert.equal(link, `${DEFAULT_BASE}/deploy/42`);
  });

  it('generates the correct URL for token ID 1', () => {
    const link = generateDeployLink(1);
    assert.equal(link, `${DEFAULT_BASE}/deploy/1`);
  });

  it('generates the correct URL with a custom baseUrl', () => {
    const link = generateDeployLink(99, CUSTOM_BASE);
    assert.equal(link, `${CUSTOM_BASE}/deploy/99`);
  });

  it('strips a trailing slash from the custom baseUrl', () => {
    const link = generateDeployLink(10, `${CUSTOM_BASE}/`);
    assert.equal(link, `${CUSTOM_BASE}/deploy/10`);
  });

  it('throws when tokenId is 0', () => {
    assert.throws(
      () => generateDeployLink(0),
      /positive integer/i,
    );
  });

  it('throws when tokenId is negative', () => {
    assert.throws(
      () => generateDeployLink(-5),
      /positive integer/i,
    );
  });

  it('throws when tokenId is a float', () => {
    assert.throws(
      () => generateDeployLink(1.5),
      /positive integer/i,
    );
  });
});

// ---------------------------------------------------------------------------
// generateTradeLink
// ---------------------------------------------------------------------------

describe('generateTradeLink()', () => {
  it('generates a clean trade URL with no options', () => {
    const link = generateTradeLink(TOKEN_ADDRESS);
    assert.equal(link, `${DEFAULT_BASE}/trade/${TOKEN_ADDRESS}`);
  });

  it('appends action=buy when action is buy', () => {
    const link = generateTradeLink(TOKEN_ADDRESS, { action: 'buy' });
    assert.equal(link, `${DEFAULT_BASE}/trade/${TOKEN_ADDRESS}?action=buy`);
  });

  it('appends action=sell when action is sell', () => {
    const link = generateTradeLink(TOKEN_ADDRESS, { action: 'sell' });
    assert.equal(link, `${DEFAULT_BASE}/trade/${TOKEN_ADDRESS}?action=sell`);
  });

  it('appends both action and amount when both are provided', () => {
    const link = generateTradeLink(TOKEN_ADDRESS, { action: 'buy', amount: 100 });
    assert.equal(
      link,
      `${DEFAULT_BASE}/trade/${TOKEN_ADDRESS}?action=buy&amount=100`,
    );
  });

  it('appends amount as a string value', () => {
    const link = generateTradeLink(TOKEN_ADDRESS, { action: 'sell', amount: '500.5' });
    assert.equal(
      link,
      `${DEFAULT_BASE}/trade/${TOKEN_ADDRESS}?action=sell&amount=500.5`,
    );
  });

  it('generates with a custom baseUrl', () => {
    const link = generateTradeLink(TOKEN_ADDRESS, { action: 'buy' }, CUSTOM_BASE);
    assert.equal(link, `${CUSTOM_BASE}/trade/${TOKEN_ADDRESS}?action=buy`);
  });

  it('strips a trailing slash from the custom baseUrl', () => {
    const link = generateTradeLink(TOKEN_ADDRESS, {}, `${CUSTOM_BASE}/`);
    assert.equal(link, `${CUSTOM_BASE}/trade/${TOKEN_ADDRESS}`);
  });

  it('omits query string entirely when opts is empty', () => {
    const link = generateTradeLink(TOKEN_ADDRESS, {});
    assert.ok(!link.includes('?'), `Link should not contain '?'. Got: ${link}`);
  });

  it('omits amount from query string when amount is undefined', () => {
    const link = generateTradeLink(TOKEN_ADDRESS, { action: 'buy', amount: undefined });
    assert.equal(link, `${DEFAULT_BASE}/trade/${TOKEN_ADDRESS}?action=buy`);
    assert.ok(!link.includes('amount'), 'should not include amount param');
  });
});

// ---------------------------------------------------------------------------
// generateBuyLink
// ---------------------------------------------------------------------------

describe('generateBuyLink()', () => {
  it('generates a buy link with action=buy', () => {
    const link = generateBuyLink(TOKEN_ADDRESS);
    assert.equal(link, `${DEFAULT_BASE}/trade/${TOKEN_ADDRESS}?action=buy`);
  });

  it('includes amount when provided', () => {
    const link = generateBuyLink(TOKEN_ADDRESS, 250);
    assert.equal(
      link,
      `${DEFAULT_BASE}/trade/${TOKEN_ADDRESS}?action=buy&amount=250`,
    );
  });

  it('accepts a string amount', () => {
    const link = generateBuyLink(TOKEN_ADDRESS, '100.5');
    assert.ok(link.includes('amount=100.5'), `Link: ${link}`);
  });

  it('uses the custom baseUrl when provided', () => {
    const link = generateBuyLink(TOKEN_ADDRESS, 50, CUSTOM_BASE);
    assert.ok(link.startsWith(CUSTOM_BASE), `Link: ${link}`);
  });
});

// ---------------------------------------------------------------------------
// generateSellLink
// ---------------------------------------------------------------------------

describe('generateSellLink()', () => {
  it('generates a sell link with action=sell', () => {
    const link = generateSellLink(TOKEN_ADDRESS);
    assert.equal(link, `${DEFAULT_BASE}/trade/${TOKEN_ADDRESS}?action=sell`);
  });

  it('includes amount when provided', () => {
    const link = generateSellLink(TOKEN_ADDRESS, 500);
    assert.equal(
      link,
      `${DEFAULT_BASE}/trade/${TOKEN_ADDRESS}?action=sell&amount=500`,
    );
  });

  it('accepts a string amount', () => {
    const link = generateSellLink(TOKEN_ADDRESS, '999.99');
    assert.ok(link.includes('amount=999.99'), `Link: ${link}`);
  });
});
