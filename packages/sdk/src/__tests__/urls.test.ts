/**
 * Tests for URL resolution — SDK-U01–U05
 *
 * Verifies:
 *   - getApiUrl() → default returns production URL
 *   - getApiUrl() → AGENT_LAUNCH_ENV=dev returns dev URL
 *   - getApiUrl() → AGENT_LAUNCH_API_URL override takes priority
 *   - getFrontendUrl() → default returns production URL
 *   - resolveApiKey() → priority chain: explicit > AGENTLAUNCH_API_KEY > AGENT_LAUNCH_API_KEY > AGENTVERSE_API_KEY
 *   - Trailing slash stripping
 */

import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  getApiUrl,
  getFrontendUrl,
  getEnvironment,
  resolveApiKey,
  resolveBaseUrl,
  DEV_API_URL,
  PROD_API_URL,
  DEV_FRONTEND_URL,
  PROD_FRONTEND_URL,
} from '../urls.js';

// ---------------------------------------------------------------------------
// Env helpers — save and restore env vars between tests
// ---------------------------------------------------------------------------

const ENV_KEYS = [
  'AGENT_LAUNCH_API_URL',
  'AGENT_LAUNCH_FRONTEND_URL',
  'AGENT_LAUNCH_ENV',
  'AGENTLAUNCH_API_KEY',
  'AGENT_LAUNCH_API_KEY',
  'AGENTVERSE_API_KEY',
  'AGENTLAUNCH_BASE_URL',
  'AGENT_LAUNCH_BASE_URL',
] as const;

type EnvSnapshot = Record<string, string | undefined>;

function saveEnv(): EnvSnapshot {
  const snap: EnvSnapshot = {};
  for (const key of ENV_KEYS) {
    snap[key] = process.env[key];
  }
  return snap;
}

function restoreEnv(snap: EnvSnapshot): void {
  for (const [key, value] of Object.entries(snap)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

function clearEnv(): void {
  for (const key of ENV_KEYS) {
    delete process.env[key];
  }
}

let envSnap: EnvSnapshot;

afterEach(() => {
  if (envSnap) restoreEnv(envSnap);
});

// ---------------------------------------------------------------------------
// getApiUrl
// ---------------------------------------------------------------------------

describe('getApiUrl — SDK-U01', () => {
  it('returns production URL by default', () => {
    envSnap = saveEnv();
    clearEnv();
    assert.equal(getApiUrl(), PROD_API_URL);
  });

  it('returns dev URL when AGENT_LAUNCH_ENV=dev', () => {
    envSnap = saveEnv();
    clearEnv();
    process.env['AGENT_LAUNCH_ENV'] = 'dev';
    assert.equal(getApiUrl(), DEV_API_URL);
  });

  it('AGENT_LAUNCH_API_URL override takes priority over env', () => {
    envSnap = saveEnv();
    clearEnv();
    process.env['AGENT_LAUNCH_ENV'] = 'dev';
    process.env['AGENT_LAUNCH_API_URL'] = 'https://custom.api.com';
    assert.equal(getApiUrl(), 'https://custom.api.com');
  });

  it('strips trailing slash from override URL', () => {
    envSnap = saveEnv();
    clearEnv();
    process.env['AGENT_LAUNCH_API_URL'] = 'https://custom.api.com/';
    assert.equal(getApiUrl(), 'https://custom.api.com');
  });
});

// ---------------------------------------------------------------------------
// getFrontendUrl
// ---------------------------------------------------------------------------

describe('getFrontendUrl — SDK-U02', () => {
  it('returns production frontend URL by default', () => {
    envSnap = saveEnv();
    clearEnv();
    assert.equal(getFrontendUrl(), PROD_FRONTEND_URL);
  });

  it('returns dev frontend URL when AGENT_LAUNCH_ENV=dev', () => {
    envSnap = saveEnv();
    clearEnv();
    process.env['AGENT_LAUNCH_ENV'] = 'dev';
    assert.equal(getFrontendUrl(), DEV_FRONTEND_URL);
  });

  it('AGENT_LAUNCH_FRONTEND_URL override takes priority', () => {
    envSnap = saveEnv();
    clearEnv();
    process.env['AGENT_LAUNCH_FRONTEND_URL'] = 'https://my-frontend.com';
    assert.equal(getFrontendUrl(), 'https://my-frontend.com');
  });

  it('strips trailing slash from frontend URL', () => {
    envSnap = saveEnv();
    clearEnv();
    process.env['AGENT_LAUNCH_FRONTEND_URL'] = 'https://my-frontend.com/';
    assert.equal(getFrontendUrl(), 'https://my-frontend.com');
  });
});

// ---------------------------------------------------------------------------
// getEnvironment
// ---------------------------------------------------------------------------

describe('getEnvironment — SDK-U03', () => {
  it('returns "production" by default', () => {
    envSnap = saveEnv();
    clearEnv();
    assert.equal(getEnvironment(), 'production');
  });

  it('returns "dev" when AGENT_LAUNCH_ENV=dev', () => {
    envSnap = saveEnv();
    clearEnv();
    process.env['AGENT_LAUNCH_ENV'] = 'dev';
    assert.equal(getEnvironment(), 'dev');
  });
});

// ---------------------------------------------------------------------------
// resolveApiKey
// ---------------------------------------------------------------------------

describe('resolveApiKey — SDK-U04', () => {
  it('returns explicit configKey when provided', () => {
    envSnap = saveEnv();
    clearEnv();
    process.env['AGENTVERSE_API_KEY'] = 'env-key';
    assert.equal(resolveApiKey('explicit-key'), 'explicit-key');
  });

  it('falls back to AGENTLAUNCH_API_KEY first', () => {
    envSnap = saveEnv();
    clearEnv();
    process.env['AGENTLAUNCH_API_KEY'] = 'agentlaunch-key';
    process.env['AGENT_LAUNCH_API_KEY'] = 'agent-launch-key';
    process.env['AGENTVERSE_API_KEY'] = 'agentverse-key';
    assert.equal(resolveApiKey(), 'agentlaunch-key');
  });

  it('falls back to AGENT_LAUNCH_API_KEY second', () => {
    envSnap = saveEnv();
    clearEnv();
    process.env['AGENT_LAUNCH_API_KEY'] = 'agent-launch-key';
    process.env['AGENTVERSE_API_KEY'] = 'agentverse-key';
    assert.equal(resolveApiKey(), 'agent-launch-key');
  });

  it('falls back to AGENTVERSE_API_KEY last', () => {
    envSnap = saveEnv();
    clearEnv();
    process.env['AGENTVERSE_API_KEY'] = 'agentverse-key';
    assert.equal(resolveApiKey(), 'agentverse-key');
  });

  it('returns undefined when no key is available', () => {
    envSnap = saveEnv();
    clearEnv();
    assert.equal(resolveApiKey(), undefined);
  });
});

// ---------------------------------------------------------------------------
// resolveBaseUrl
// ---------------------------------------------------------------------------

describe('resolveBaseUrl — SDK-U05', () => {
  it('returns configUrl when provided', () => {
    assert.equal(resolveBaseUrl('https://custom.com'), 'https://custom.com');
  });

  it('strips trailing slash from configUrl', () => {
    assert.equal(resolveBaseUrl('https://custom.com/'), 'https://custom.com');
  });

  it('falls back to getApiUrl() when no config', () => {
    envSnap = saveEnv();
    clearEnv();
    assert.equal(resolveBaseUrl(), PROD_API_URL);
  });
});

// ---------------------------------------------------------------------------
// Constants are correct values
// ---------------------------------------------------------------------------

describe('URL constants — correctness', () => {
  it('production API URL is https://agent-launch.ai/api', () => {
    assert.equal(PROD_API_URL, 'https://agent-launch.ai/api');
  });

  it('production frontend URL is https://agent-launch.ai', () => {
    assert.equal(PROD_FRONTEND_URL, 'https://agent-launch.ai');
  });

  it('dev API URL contains launchpad-backend-dev', () => {
    assert.ok(DEV_API_URL.includes('launchpad-backend-dev'));
  });

  it('dev frontend URL contains launchpad-frontend-dev', () => {
    assert.ok(DEV_FRONTEND_URL.includes('launchpad-frontend-dev'));
  });
});
