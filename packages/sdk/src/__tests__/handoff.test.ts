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
  validateEthAddress,
  generateDelegationLink,
  generateFiatOnrampLink,
} from '../handoff.js';
import { PROD_FRONTEND_URL } from '../urls.js';

const DEFAULT_BASE = PROD_FRONTEND_URL;
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

// ---------------------------------------------------------------------------
// validateEthAddress — SDK-H08
// ---------------------------------------------------------------------------

describe('validateEthAddress — SDK-H08', () => {
  it('accepts a valid Ethereum address', () => {
    assert.doesNotThrow(() => validateEthAddress(TOKEN_ADDRESS));
  });

  it('accepts a lowercase Ethereum address', () => {
    assert.doesNotThrow(() => validateEthAddress('0x' + 'a'.repeat(40)));
  });

  it('rejects "0xINVALID"', () => {
    assert.throws(
      () => validateEthAddress('0xINVALID'),
      /Invalid token address format/,
    );
  });

  it('rejects "not-an-address"', () => {
    assert.throws(
      () => validateEthAddress('not-an-address'),
      /Invalid token address format/,
    );
  });

  it('rejects non-hex characters (0x + g*40)', () => {
    assert.throws(
      () => validateEthAddress('0x' + 'g'.repeat(40)),
      /Invalid token address format/,
    );
  });

  it('rejects address with too few characters', () => {
    assert.throws(
      () => validateEthAddress('0x' + 'a'.repeat(39)),
      /Invalid token address format/,
    );
  });

  it('rejects address with too many characters', () => {
    assert.throws(
      () => validateEthAddress('0x' + 'a'.repeat(41)),
      /Invalid token address format/,
    );
  });
});

// ---------------------------------------------------------------------------
// generateDelegationLink — SDK-H09
// ---------------------------------------------------------------------------

describe('generateDelegationLink — SDK-H09', () => {
  const TOKEN_ADDR = '0x' + 'a'.repeat(40);
  const SPENDER_ADDR = '0x' + 'b'.repeat(40);

  it('generates correct URL with token, spender, and amount params', () => {
    const link = generateDelegationLink(TOKEN_ADDR, SPENDER_ADDR, '100');

    assert.ok(link.includes('/delegate?'), `Link should contain /delegate?, got: ${link}`);
    assert.ok(link.includes(`token=${TOKEN_ADDR}`), `Link should contain token param, got: ${link}`);
    assert.ok(link.includes(`spender=${SPENDER_ADDR}`), `Link should contain spender param, got: ${link}`);
    assert.ok(link.includes('amount=100'), `Link should contain amount=100, got: ${link}`);
  });

  it('uses the default base URL', () => {
    const link = generateDelegationLink(TOKEN_ADDR, SPENDER_ADDR, '50');
    assert.ok(link.startsWith(DEFAULT_BASE), `Link should start with ${DEFAULT_BASE}, got: ${link}`);
  });

  it('uses a custom base URL when provided', () => {
    const link = generateDelegationLink(TOKEN_ADDR, SPENDER_ADDR, '200', CUSTOM_BASE);
    assert.ok(link.startsWith(CUSTOM_BASE), `Link should start with ${CUSTOM_BASE}, got: ${link}`);
  });

  it('throws on invalid token address', () => {
    assert.throws(
      () => generateDelegationLink('0xINVALID', SPENDER_ADDR, '100'),
      /Invalid token address format/,
    );
  });

  it('throws on invalid spender address', () => {
    assert.throws(
      () => generateDelegationLink(TOKEN_ADDR, '0xINVALID', '100'),
      /Invalid token address format/,
    );
  });
});

// ---------------------------------------------------------------------------
// generateFiatOnrampLink — SDK-H10
// ---------------------------------------------------------------------------

describe('generateFiatOnrampLink — SDK-H10', () => {
  const WALLET = '0x' + 'c'.repeat(40);

  it('generates a MoonPay URL for FET', () => {
    const result = generateFiatOnrampLink({
      fiatAmount: '50',
      fiatCurrency: 'USD',
      cryptoToken: 'FET',
      walletAddress: WALLET,
      provider: 'moonpay',
    });

    assert.equal(result.provider, 'moonpay');
    assert.ok(
      result.url.includes('buy.moonpay.com'),
      `URL should contain buy.moonpay.com, got: ${result.url}`,
    );
    assert.ok(result.url.includes('fet_bsc'), `URL should contain fet_bsc currency code, got: ${result.url}`);
    assert.ok(result.url.includes('baseCurrencyAmount=50'), `URL should contain baseCurrencyAmount=50, got: ${result.url}`);
    assert.ok(result.url.includes(`walletAddress=${WALLET}`), `URL should contain wallet address, got: ${result.url}`);
  });

  it('generates a Transak URL for USDC', () => {
    const result = generateFiatOnrampLink({
      fiatAmount: '100',
      fiatCurrency: 'EUR',
      cryptoToken: 'USDC',
      walletAddress: WALLET,
      provider: 'transak',
    });

    assert.equal(result.provider, 'transak');
    assert.ok(
      result.url.includes('global.transak.com'),
      `URL should contain global.transak.com, got: ${result.url}`,
    );
    assert.ok(result.url.includes('cryptoCurrencyCode=USDC'), `URL should contain cryptoCurrencyCode=USDC, got: ${result.url}`);
    assert.ok(result.url.includes('fiatAmount=100'), `URL should contain fiatAmount=100, got: ${result.url}`);
    assert.ok(result.url.includes('fiatCurrency=EUR'), `URL should contain fiatCurrency=EUR, got: ${result.url}`);
  });

  it('defaults to moonpay when provider is not specified', () => {
    const result = generateFiatOnrampLink({
      fiatAmount: '25',
      fiatCurrency: 'USD',
      cryptoToken: 'BNB',
      walletAddress: WALLET,
    });

    assert.equal(result.provider, 'moonpay');
    assert.ok(result.url.includes('buy.moonpay.com'), `URL should contain buy.moonpay.com, got: ${result.url}`);
  });

  it('throws on unknown crypto token', () => {
    assert.throws(
      () =>
        generateFiatOnrampLink({
          fiatAmount: '50',
          fiatCurrency: 'USD',
          cryptoToken: 'DOGE',
          walletAddress: WALLET,
          provider: 'moonpay',
        }),
      /Unsupported crypto token/,
    );
  });

  it('returns object with provider and url fields', () => {
    const result = generateFiatOnrampLink({
      fiatAmount: '10',
      fiatCurrency: 'USD',
      cryptoToken: 'FET',
      walletAddress: WALLET,
    });

    assert.ok('provider' in result, 'result should have provider field');
    assert.ok('url' in result, 'result should have url field');
    assert.equal(typeof result.provider, 'string');
    assert.equal(typeof result.url, 'string');
  });
});
