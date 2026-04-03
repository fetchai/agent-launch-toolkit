/**
 * Tests for connect CLI commands — CLI-CONNECT-01 through CLI-CONNECT-16
 *
 * Covers:
 *   connect command (CLI-CONNECT-01 through CLI-CONNECT-08):
 *     CLI-CONNECT-01: --name and --endpoint are required
 *     CLI-CONNECT-02: rejects http:// (non-HTTPS) endpoints
 *     CLI-CONNECT-03: rejects non-URL endpoint strings
 *     CLI-CONNECT-04: --auth-secret without --auth-header is rejected
 *     CLI-CONNECT-05: --auth-header without --auth-secret is rejected
 *     CLI-CONNECT-06: --timeout out of range (0 and 301) is rejected
 *     CLI-CONNECT-07: --retries out of range (< 0 and > 10) is rejected
 *     CLI-CONNECT-08: success path outputs JSON with address, name, endpoint, agentverseUrl
 *
 *   connect-update command (CLI-CONNECT-09 through CLI-CONNECT-12):
 *     CLI-CONNECT-09: agent address is required and must start with agent1q
 *     CLI-CONNECT-10: rejects http:// endpoint
 *     CLI-CONNECT-11: --auth-secret without --auth-header is rejected
 *     CLI-CONNECT-12: no update fields provided is rejected
 *
 *   connect-status command (CLI-CONNECT-13 through CLI-CONNECT-14):
 *     CLI-CONNECT-13: too-short agent address is rejected
 *     CLI-CONNECT-14: success path emits full JSON via --json
 *
 *   connect-logs command (CLI-CONNECT-15 through CLI-CONNECT-16):
 *     CLI-CONNECT-15: --limit 0 is rejected; non-numeric --limit is rejected
 *     CLI-CONNECT-16: success path emits JSON with agentAddress, limit, lines[]
 *
 * Strategy:
 *   - Validation errors are tested without mocking the SDK (process.exit thrown
 *     before any network call).
 *   - Success paths mock globalThis.fetch so the SDK never reaches Agentverse.
 *   - AGENTVERSE_API_KEY is set in beforeEach for every describe block;
 *     tests that need no key clear it themselves.
 *
 * Run with:
 *   node --test --import tsx/esm packages/cli/test/connect.test.ts
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { Command } from 'commander';

// ---------------------------------------------------------------------------
// Console capture helpers
// ---------------------------------------------------------------------------

let logOutput: string[] = [];
const origLog = console.log;
const origError = console.error;

function captureOutput(): void {
  logOutput = [];
  console.log = (...args: unknown[]) => logOutput.push(args.map(String).join(' '));
  console.error = (...args: unknown[]) => logOutput.push(args.map(String).join(' '));
}

function restoreOutput(): void {
  console.log = origLog;
  console.error = origError;
}

/** Join all captured log/error lines. */
function allOutput(): string {
  return logOutput.join('\n');
}

/** Parse the first valid JSON object from captured output. */
function parseJsonOutput(): unknown {
  for (const line of logOutput) {
    try {
      return JSON.parse(line);
    } catch {
      // not JSON — skip
    }
  }
  throw new Error(`No JSON found in output:\n${allOutput()}`);
}

// ---------------------------------------------------------------------------
// process.exit mock
// ---------------------------------------------------------------------------

class ExitError extends Error {
  code: number;
  constructor(code: number) {
    super(`process.exit(${code})`);
    this.code = code;
  }
}

const origExit = process.exit;

function mockExit(): void {
  process.exit = ((code?: number) => {
    throw new ExitError(code ?? 0);
  }) as never;
}

function restoreExit(): void {
  process.exit = origExit;
}

// ---------------------------------------------------------------------------
// Fetch mock helpers
// ---------------------------------------------------------------------------

const originalFetch = globalThis.fetch;

function installFetchMock(
  mock: (input: string | URL | Request, init?: RequestInit) => Promise<Response>,
): () => void {
  globalThis.fetch = mock as typeof globalThis.fetch;
  return () => { globalThis.fetch = originalFetch; };
}

function makeJsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
    headers: new Headers(),
  } as unknown as Response;
}

// ---------------------------------------------------------------------------
// Shared state
// ---------------------------------------------------------------------------

let savedApiKey: string | undefined;
let cleanupFetch: (() => void) | undefined;

/** Typical valid Agentverse agent address used across tests. */
const VALID_AGENT_ADDRESS = 'agent1qtest1234567890abcdefghijklmnopqrstuvwxyz';

// ---------------------------------------------------------------------------
// connect command tests (CLI-CONNECT-01 through CLI-CONNECT-08)
// ---------------------------------------------------------------------------

describe('connect command', () => {
  beforeEach(() => {
    captureOutput();
    mockExit();
    savedApiKey = process.env.AGENTVERSE_API_KEY;
    process.env.AGENTVERSE_API_KEY = 'av-test-key-connect-suite';
  });

  afterEach(() => {
    restoreOutput();
    restoreExit();
    if (cleanupFetch) { cleanupFetch(); cleanupFetch = undefined; }
    if (savedApiKey !== undefined) {
      process.env.AGENTVERSE_API_KEY = savedApiKey;
    } else {
      delete process.env.AGENTVERSE_API_KEY;
    }
  });

  // CLI-CONNECT-01: --name and --endpoint are required options
  it('CLI-CONNECT-01: errors when --name is missing', async () => {
    const { registerConnectCommand } = await import('../src/commands/connect.js');
    const program = new Command();
    // Commander's requiredOption throws CommanderError when option is absent —
    // exitOverride converts that to a thrown error rather than process.exit.
    program.exitOverride();
    registerConnectCommand(program);

    await assert.rejects(
      () => program.parseAsync([
        'node', 'test', 'connect',
        '--endpoint', 'https://api.example.com/webhook',
      ]),
      // Commander throws either CommanderError or ExitError — accept both.
      (err: unknown) => {
        assert.ok(
          err instanceof ExitError || (err instanceof Error && err.message.toLowerCase().includes('required')),
          `Expected a required-option error, got: ${String(err)}`,
        );
        return true;
      },
    );
  });

  it('CLI-CONNECT-01b: errors when --endpoint is missing', async () => {
    const { registerConnectCommand } = await import('../src/commands/connect.js');
    const program = new Command();
    program.exitOverride();
    registerConnectCommand(program);

    await assert.rejects(
      () => program.parseAsync([
        'node', 'test', 'connect',
        '--name', 'My Proxy Agent',
      ]),
      (err: unknown) => {
        assert.ok(err instanceof ExitError || err instanceof Error);
        return true;
      },
    );
  });

  // CLI-CONNECT-02: rejects http:// endpoints (non-HTTPS)
  it('CLI-CONNECT-02: rejects http:// endpoint with --json error', async () => {
    const { registerConnectCommand } = await import('../src/commands/connect.js');
    const program = new Command();
    program.exitOverride();
    registerConnectCommand(program);

    await assert.rejects(
      () => program.parseAsync([
        'node', 'test', 'connect',
        '--name', 'Test Proxy',
        '--endpoint', 'http://api.example.com/webhook',
        '--json',
      ]),
      (err: unknown) => {
        assert.ok(err instanceof ExitError);
        assert.equal((err as ExitError).code, 1);
        return true;
      },
    );

    const result = parseJsonOutput() as { error: string };
    assert.ok(result.error, 'Should output a JSON error');
    assert.ok(
      result.error.toLowerCase().includes('https'),
      `Error should mention HTTPS: ${result.error}`,
    );
  });

  it('CLI-CONNECT-02b: rejects http:// endpoint in text mode', async () => {
    const { registerConnectCommand } = await import('../src/commands/connect.js');
    const program = new Command();
    program.exitOverride();
    registerConnectCommand(program);

    await assert.rejects(
      () => program.parseAsync([
        'node', 'test', 'connect',
        '--name', 'Test Proxy',
        '--endpoint', 'http://insecure.example.com',
      ]),
      (err: unknown) => {
        assert.ok(err instanceof ExitError);
        assert.equal((err as ExitError).code, 1);
        return true;
      },
    );

    assert.ok(
      allOutput().toLowerCase().includes('https'),
      `Output should mention HTTPS: ${allOutput()}`,
    );
  });

  // CLI-CONNECT-03: rejects non-URL endpoint strings
  it('CLI-CONNECT-03: rejects a plain string that is not a URL', async () => {
    const { registerConnectCommand } = await import('../src/commands/connect.js');
    const program = new Command();
    program.exitOverride();
    registerConnectCommand(program);

    await assert.rejects(
      () => program.parseAsync([
        'node', 'test', 'connect',
        '--name', 'Bad URL Proxy',
        '--endpoint', 'not-a-url-at-all',
        '--json',
      ]),
      (err: unknown) => {
        assert.ok(err instanceof ExitError);
        assert.equal((err as ExitError).code, 1);
        return true;
      },
    );

    const result = parseJsonOutput() as { error: string };
    assert.ok(result.error, 'Should produce a JSON error');
    assert.ok(
      result.error.toLowerCase().includes('https'),
      `Error should mention HTTPS: ${result.error}`,
    );
  });

  // CLI-CONNECT-04: --auth-secret without --auth-header is rejected
  it('CLI-CONNECT-04: rejects --auth-secret without --auth-header', async () => {
    const { registerConnectCommand } = await import('../src/commands/connect.js');
    const program = new Command();
    program.exitOverride();
    registerConnectCommand(program);

    await assert.rejects(
      () => program.parseAsync([
        'node', 'test', 'connect',
        '--name', 'Auth Test Proxy',
        '--endpoint', 'https://api.example.com',
        '--auth-secret', 'mysecretvalue',
        '--json',
      ]),
      (err: unknown) => {
        assert.ok(err instanceof ExitError);
        assert.equal((err as ExitError).code, 1);
        return true;
      },
    );

    const result = parseJsonOutput() as { error: string };
    assert.ok(result.error, 'Should produce a JSON error');
    assert.ok(
      result.error.toLowerCase().includes('auth-header'),
      `Error should mention --auth-header: ${result.error}`,
    );
  });

  // CLI-CONNECT-05: --auth-header without --auth-secret is rejected
  it('CLI-CONNECT-05: rejects --auth-header without --auth-secret', async () => {
    const { registerConnectCommand } = await import('../src/commands/connect.js');
    const program = new Command();
    program.exitOverride();
    registerConnectCommand(program);

    await assert.rejects(
      () => program.parseAsync([
        'node', 'test', 'connect',
        '--name', 'Auth Test Proxy',
        '--endpoint', 'https://api.example.com',
        '--auth-header', 'X-Api-Key',
        '--json',
      ]),
      (err: unknown) => {
        assert.ok(err instanceof ExitError);
        assert.equal((err as ExitError).code, 1);
        return true;
      },
    );

    const result = parseJsonOutput() as { error: string };
    assert.ok(result.error, 'Should produce a JSON error');
    assert.ok(
      result.error.toLowerCase().includes('auth-secret'),
      `Error should mention --auth-secret: ${result.error}`,
    );
  });

  // CLI-CONNECT-06: --timeout out of range
  it('CLI-CONNECT-06: rejects --timeout 0 (below minimum)', async () => {
    const { registerConnectCommand } = await import('../src/commands/connect.js');
    const program = new Command();
    program.exitOverride();
    registerConnectCommand(program);

    await assert.rejects(
      () => program.parseAsync([
        'node', 'test', 'connect',
        '--name', 'Timeout Proxy',
        '--endpoint', 'https://api.example.com',
        '--timeout', '0',
        '--json',
      ]),
      (err: unknown) => {
        assert.ok(err instanceof ExitError);
        assert.equal((err as ExitError).code, 1);
        return true;
      },
    );

    const result = parseJsonOutput() as { error: string };
    assert.ok(result.error.toLowerCase().includes('timeout'), `Error should mention timeout: ${result.error}`);
  });

  it('CLI-CONNECT-06b: rejects --timeout 301 (above maximum)', async () => {
    const { registerConnectCommand } = await import('../src/commands/connect.js');
    const program = new Command();
    program.exitOverride();
    registerConnectCommand(program);

    await assert.rejects(
      () => program.parseAsync([
        'node', 'test', 'connect',
        '--name', 'Timeout Proxy',
        '--endpoint', 'https://api.example.com',
        '--timeout', '301',
        '--json',
      ]),
      (err: unknown) => {
        assert.ok(err instanceof ExitError);
        assert.equal((err as ExitError).code, 1);
        return true;
      },
    );

    const result = parseJsonOutput() as { error: string };
    assert.ok(result.error.toLowerCase().includes('timeout'), `Error should mention timeout: ${result.error}`);
  });

  it('CLI-CONNECT-06c: rejects non-numeric --timeout', async () => {
    const { registerConnectCommand } = await import('../src/commands/connect.js');
    const program = new Command();
    program.exitOverride();
    registerConnectCommand(program);

    await assert.rejects(
      () => program.parseAsync([
        'node', 'test', 'connect',
        '--name', 'Timeout Proxy',
        '--endpoint', 'https://api.example.com',
        '--timeout', 'abc',
        '--json',
      ]),
      (err: unknown) => {
        assert.ok(err instanceof ExitError);
        assert.equal((err as ExitError).code, 1);
        return true;
      },
    );

    const result = parseJsonOutput() as { error: string };
    assert.ok(result.error.toLowerCase().includes('timeout'), `Error should mention timeout: ${result.error}`);
  });

  // CLI-CONNECT-07: --retries out of range
  it('CLI-CONNECT-07: rejects --retries -1 (negative)', async () => {
    const { registerConnectCommand } = await import('../src/commands/connect.js');
    const program = new Command();
    program.exitOverride();
    registerConnectCommand(program);

    await assert.rejects(
      () => program.parseAsync([
        'node', 'test', 'connect',
        '--name', 'Retries Proxy',
        '--endpoint', 'https://api.example.com',
        '--retries', '-1',
        '--json',
      ]),
      (err: unknown) => {
        assert.ok(err instanceof ExitError);
        assert.equal((err as ExitError).code, 1);
        return true;
      },
    );

    const result = parseJsonOutput() as { error: string };
    assert.ok(result.error.toLowerCase().includes('retries'), `Error should mention retries: ${result.error}`);
  });

  it('CLI-CONNECT-07b: rejects --retries 11 (above maximum)', async () => {
    const { registerConnectCommand } = await import('../src/commands/connect.js');
    const program = new Command();
    program.exitOverride();
    registerConnectCommand(program);

    await assert.rejects(
      () => program.parseAsync([
        'node', 'test', 'connect',
        '--name', 'Retries Proxy',
        '--endpoint', 'https://api.example.com',
        '--retries', '11',
        '--json',
      ]),
      (err: unknown) => {
        assert.ok(err instanceof ExitError);
        assert.equal((err as ExitError).code, 1);
        return true;
      },
    );

    const result = parseJsonOutput() as { error: string };
    assert.ok(result.error.toLowerCase().includes('retries'), `Error should mention retries: ${result.error}`);
  });

  // CLI-CONNECT-08: success path — mocked SDK, --json output
  it('CLI-CONNECT-08: success with --json outputs address, name, endpoint, agentverseUrl', async () => {
    const agentAddress = 'agent1qsuccessconnectaddress1234567890abcdef';

    // The connect command calls connectAgent() from agentlaunch-sdk, which in turn
    // uses the Agentverse hosting API via fetch. We mock fetch to return the
    // minimal sequence the SDK expects: create agent → upload code →
    // set secrets → start → status poll.
    cleanupFetch = installFetchMock(async (input) => {
      const url = typeof input === 'string' ? input : input.toString();

      if (url.includes('/code')) return makeJsonResponse({ digest: 'abc123' });
      if (url.includes('/start')) return makeJsonResponse({});
      if (url.includes('/secrets')) return makeJsonResponse({});
      if (url.includes('/stop')) return makeJsonResponse({});

      if (url.includes('/hosting/agents')) {
        // Status poll: /hosting/agents/<address>
        if (url.includes(agentAddress)) {
          return makeJsonResponse({
            address: agentAddress,
            running: true,
            compiled: true,
            wallet_address: 'fetch1testwallet',
          });
        }
        // Create: POST /hosting/agents
        return makeJsonResponse({ address: agentAddress, name: 'My Proxy Agent' });
      }

      return makeJsonResponse({ error: 'unexpected' }, 404);
    });

    const { registerConnectCommand } = await import('../src/commands/connect.js');
    const program = new Command();
    program.exitOverride();
    registerConnectCommand(program);

    await program.parseAsync([
      'node', 'test', 'connect',
      '--name', 'My Proxy Agent',
      '--endpoint', 'https://api.example.com/webhook',
      '--json',
    ]);

    const result = parseJsonOutput() as {
      address: string;
      name: string;
      endpoint: string;
      agentverseUrl: string;
    };

    assert.equal(result.address, agentAddress, 'Should include agent address');
    assert.ok(result.name, 'Should include agent name');
    assert.equal(result.endpoint, 'https://api.example.com/webhook', 'Should echo the endpoint');
    assert.ok(result.agentverseUrl, 'Should include agentverseUrl');
    assert.ok(
      result.agentverseUrl.includes(agentAddress),
      `agentverseUrl should contain agent address: ${result.agentverseUrl}`,
    );
    assert.ok(
      result.agentverseUrl.includes('agentverse.ai'),
      `agentverseUrl should point to agentverse.ai: ${result.agentverseUrl}`,
    );
  });

  it('CLI-CONNECT-08b: success in text mode prints CONNECT AGENT DEPLOYED header', async () => {
    const agentAddress = 'agent1qtextmodeconnectaddress1234567890xyz';

    cleanupFetch = installFetchMock(async (input) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('/code')) return makeJsonResponse({ digest: 'abc123' });
      if (url.includes('/start')) return makeJsonResponse({});
      if (url.includes('/secrets')) return makeJsonResponse({});
      if (url.includes('/stop')) return makeJsonResponse({});
      if (url.includes('/hosting/agents')) {
        if (url.includes(agentAddress)) {
          return makeJsonResponse({ address: agentAddress, running: true, compiled: true, wallet_address: 'fetch1wallet' });
        }
        return makeJsonResponse({ address: agentAddress, name: 'Text Mode Proxy' });
      }
      return makeJsonResponse({ error: 'unexpected' }, 404);
    });

    const { registerConnectCommand } = await import('../src/commands/connect.js');
    const program = new Command();
    program.exitOverride();
    registerConnectCommand(program);

    await program.parseAsync([
      'node', 'test', 'connect',
      '--name', 'Text Mode Proxy',
      '--endpoint', 'https://myapi.example.com/v2',
    ]);

    const output = allOutput();
    assert.ok(output.includes('CONNECT AGENT DEPLOYED'), 'Should print CONNECT AGENT DEPLOYED header');
    assert.ok(output.includes(agentAddress), 'Should display the agent address');
    assert.ok(output.includes('https://myapi.example.com/v2'), 'Should display the endpoint');
  });

  it('CLI-CONNECT-08c: accepts valid --auth-header + --auth-secret pair', async () => {
    const agentAddress = 'agent1qauthpairtestaddress1234567890abcdef';

    cleanupFetch = installFetchMock(async (input) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('/code')) return makeJsonResponse({ digest: 'abc123' });
      if (url.includes('/start')) return makeJsonResponse({});
      if (url.includes('/secrets')) return makeJsonResponse({});
      if (url.includes('/stop')) return makeJsonResponse({});
      if (url.includes('/hosting/agents')) {
        if (url.includes(agentAddress)) {
          return makeJsonResponse({ address: agentAddress, running: true, compiled: true, wallet_address: 'fetch1wallet' });
        }
        return makeJsonResponse({ address: agentAddress, name: 'Auth Pair Proxy' });
      }
      return makeJsonResponse({ error: 'unexpected' }, 404);
    });

    const { registerConnectCommand } = await import('../src/commands/connect.js');
    const program = new Command();
    program.exitOverride();
    registerConnectCommand(program);

    // Should NOT throw — both auth options are present together
    await program.parseAsync([
      'node', 'test', 'connect',
      '--name', 'Auth Pair Proxy',
      '--endpoint', 'https://secure.api.example.com',
      '--auth-header', 'X-Api-Key',
      '--auth-secret', 'supersecretvalue',
      '--json',
    ]);

    const result = parseJsonOutput() as { address: string };
    assert.equal(result.address, agentAddress);
  });

  it('CLI-CONNECT-08d: --retries 0 is a valid boundary value', async () => {
    const agentAddress = 'agent1qretriesboundarytest1234567890abcdef';

    cleanupFetch = installFetchMock(async (input) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('/code')) return makeJsonResponse({ digest: 'abc123' });
      if (url.includes('/start')) return makeJsonResponse({});
      if (url.includes('/secrets')) return makeJsonResponse({});
      if (url.includes('/stop')) return makeJsonResponse({});
      if (url.includes('/hosting/agents')) {
        if (url.includes(agentAddress)) {
          return makeJsonResponse({ address: agentAddress, running: true, compiled: true, wallet_address: 'fetch1wallet' });
        }
        return makeJsonResponse({ address: agentAddress, name: 'Zero Retries Proxy' });
      }
      return makeJsonResponse({ error: 'unexpected' }, 404);
    });

    const { registerConnectCommand } = await import('../src/commands/connect.js');
    const program = new Command();
    program.exitOverride();
    registerConnectCommand(program);

    await program.parseAsync([
      'node', 'test', 'connect',
      '--name', 'Zero Retries Proxy',
      '--endpoint', 'https://api.example.com',
      '--retries', '0',
      '--json',
    ]);

    const result = parseJsonOutput() as { address: string };
    assert.equal(result.address, agentAddress, '--retries 0 should be accepted');
  });

  it('CLI-CONNECT-08e: missing API key produces JSON error when --json is set', async () => {
    // Clear the env var (done above) AND ensure no config file key is present.
    delete process.env.AGENTVERSE_API_KEY;
    // Temporarily rename the config file if it exists so requireApiKey() cannot
    // find a key there either.
    const { join } = await import('node:path');
    const { homedir } = await import('node:os');
    const { existsSync, renameSync } = await import('node:fs');
    const cfgFile = join(homedir(), '.agentlaunch', 'config.json');
    const cfgBak = cfgFile + '.bak_connect_test';
    const hadConfig = existsSync(cfgFile);
    if (hadConfig) renameSync(cfgFile, cfgBak);

    try {
      const { registerConnectCommand } = await import('../src/commands/connect.js');
      const program = new Command();
      program.exitOverride();
      registerConnectCommand(program);

      await assert.rejects(
        () => program.parseAsync([
          'node', 'test', 'connect',
          '--name', 'No Key Proxy',
          '--endpoint', 'https://api.example.com',
          '--json',
        ]),
        (err: unknown) => {
          assert.ok(err instanceof ExitError);
          assert.equal((err as ExitError).code, 1);
          return true;
        },
      );

      const result = parseJsonOutput() as { error: string };
      assert.ok(result.error, 'Should output a JSON error');
      assert.ok(
        result.error.toLowerCase().includes('api key') || result.error.toLowerCase().includes('agentverse'),
        `Error should mention API key: ${result.error}`,
      );
    } finally {
      if (hadConfig) renameSync(cfgBak, cfgFile);
    }
  });
});

// ---------------------------------------------------------------------------
// connect-update command tests (CLI-CONNECT-09 through CLI-CONNECT-12)
// ---------------------------------------------------------------------------

describe('connect-update command', () => {
  beforeEach(() => {
    captureOutput();
    mockExit();
    savedApiKey = process.env.AGENTVERSE_API_KEY;
    process.env.AGENTVERSE_API_KEY = 'av-test-key-connect-update';
  });

  afterEach(() => {
    restoreOutput();
    restoreExit();
    if (cleanupFetch) { cleanupFetch(); cleanupFetch = undefined; }
    if (savedApiKey !== undefined) {
      process.env.AGENTVERSE_API_KEY = savedApiKey;
    } else {
      delete process.env.AGENTVERSE_API_KEY;
    }
  });

  // CLI-CONNECT-09: agent address must start with agent1q
  it('CLI-CONNECT-09: rejects address that does not start with agent1q', async () => {
    const { registerConnectUpdateCommand } = await import('../src/commands/connect-update.js');
    const program = new Command();
    program.exitOverride();
    registerConnectUpdateCommand(program);

    await assert.rejects(
      () => program.parseAsync([
        'node', 'test', 'connect-update',
        '0xNotAnAgentAddress',
        '--endpoint', 'https://api.example.com',
        '--json',
      ]),
      (err: unknown) => {
        assert.ok(err instanceof ExitError);
        assert.equal((err as ExitError).code, 1);
        return true;
      },
    );

    const result = parseJsonOutput() as { error: string };
    assert.ok(result.error, 'Should produce a JSON error');
    assert.ok(
      result.error.toLowerCase().includes('agent1q'),
      `Error should mention agent1q: ${result.error}`,
    );
  });

  it('CLI-CONNECT-09b: rejects empty agent address string', async () => {
    const { registerConnectUpdateCommand } = await import('../src/commands/connect-update.js');
    // Commander would normally reject missing positional args before action()
    // but we can verify the guard by passing an address that fails the check.
    const program = new Command();
    program.exitOverride();
    registerConnectUpdateCommand(program);

    await assert.rejects(
      () => program.parseAsync([
        'node', 'test', 'connect-update',
        'badaddr',   // does not start with agent1q
        '--endpoint', 'https://api.example.com',
        '--json',
      ]),
      (err: unknown) => {
        assert.ok(err instanceof ExitError);
        assert.equal((err as ExitError).code, 1);
        return true;
      },
    );

    const result = parseJsonOutput() as { error: string };
    assert.ok(result.error, 'Should produce a JSON error');
  });

  // CLI-CONNECT-10: rejects http:// endpoint
  it('CLI-CONNECT-10: rejects http:// endpoint', async () => {
    const { registerConnectUpdateCommand } = await import('../src/commands/connect-update.js');
    const program = new Command();
    program.exitOverride();
    registerConnectUpdateCommand(program);

    await assert.rejects(
      () => program.parseAsync([
        'node', 'test', 'connect-update',
        VALID_AGENT_ADDRESS,
        '--endpoint', 'http://insecure.example.com',
        '--json',
      ]),
      (err: unknown) => {
        assert.ok(err instanceof ExitError);
        assert.equal((err as ExitError).code, 1);
        return true;
      },
    );

    const result = parseJsonOutput() as { error: string };
    assert.ok(result.error, 'Should produce a JSON error');
    assert.ok(
      result.error.toLowerCase().includes('https'),
      `Error should mention HTTPS: ${result.error}`,
    );
  });

  it('CLI-CONNECT-10b: rejects a malformed URL string as endpoint', async () => {
    const { registerConnectUpdateCommand } = await import('../src/commands/connect-update.js');
    const program = new Command();
    program.exitOverride();
    registerConnectUpdateCommand(program);

    await assert.rejects(
      () => program.parseAsync([
        'node', 'test', 'connect-update',
        VALID_AGENT_ADDRESS,
        '--endpoint', 'not_a_url',
        '--json',
      ]),
      (err: unknown) => {
        assert.ok(err instanceof ExitError);
        assert.equal((err as ExitError).code, 1);
        return true;
      },
    );

    const result = parseJsonOutput() as { error: string };
    assert.ok(result.error, 'Should produce a JSON error');
  });

  // CLI-CONNECT-11: --auth-secret without --auth-header is rejected
  it('CLI-CONNECT-11: rejects --auth-secret without --auth-header', async () => {
    const { registerConnectUpdateCommand } = await import('../src/commands/connect-update.js');
    const program = new Command();
    program.exitOverride();
    registerConnectUpdateCommand(program);

    await assert.rejects(
      () => program.parseAsync([
        'node', 'test', 'connect-update',
        VALID_AGENT_ADDRESS,
        '--endpoint', 'https://api.example.com',
        '--auth-secret', 'mysecret',
        '--json',
      ]),
      (err: unknown) => {
        assert.ok(err instanceof ExitError);
        assert.equal((err as ExitError).code, 1);
        return true;
      },
    );

    const result = parseJsonOutput() as { error: string };
    assert.ok(result.error, 'Should produce a JSON error');
    assert.ok(
      result.error.toLowerCase().includes('auth-header'),
      `Error should mention --auth-header: ${result.error}`,
    );
  });

  // CLI-CONNECT-12: no update fields provided is an error
  it('CLI-CONNECT-12: errors when no updatable fields are provided', async () => {
    const { registerConnectUpdateCommand } = await import('../src/commands/connect-update.js');
    const program = new Command();
    program.exitOverride();
    registerConnectUpdateCommand(program);

    await assert.rejects(
      () => program.parseAsync([
        'node', 'test', 'connect-update',
        VALID_AGENT_ADDRESS,
        // No --endpoint, --auth-header, --auth-secret — only default --timeout
        '--json',
      ]),
      (err: unknown) => {
        assert.ok(err instanceof ExitError);
        assert.equal((err as ExitError).code, 1);
        return true;
      },
    );

    const result = parseJsonOutput() as { error: string };
    assert.ok(result.error, 'Should produce a JSON error');
    assert.ok(
      result.error.toLowerCase().includes('no update') ||
      result.error.toLowerCase().includes('endpoint') ||
      result.error.toLowerCase().includes('fields'),
      `Error should mention missing update fields: ${result.error}`,
    );
  });

  it('CLI-CONNECT-12b: --timeout 500 (below 1000 ms) is rejected', async () => {
    const { registerConnectUpdateCommand } = await import('../src/commands/connect-update.js');
    const program = new Command();
    program.exitOverride();
    registerConnectUpdateCommand(program);

    await assert.rejects(
      () => program.parseAsync([
        'node', 'test', 'connect-update',
        VALID_AGENT_ADDRESS,
        '--timeout', '500',
        '--json',
      ]),
      (err: unknown) => {
        assert.ok(err instanceof ExitError);
        assert.equal((err as ExitError).code, 1);
        return true;
      },
    );

    const result = parseJsonOutput() as { error: string };
    assert.ok(result.error.toLowerCase().includes('timeout'), `Error should mention timeout: ${result.error}`);
  });

  it('CLI-CONNECT-12c: success path with --endpoint outputs JSON', async () => {
    // updateConnection (SDK) calls in order:
    //   POST /hosting/agents/<addr>/stop
    //   GET  /hosting/agents/<addr>/code   → { code: JSON.stringify([{...}]) }
    //   PUT  /hosting/agents/<addr>/code
    //   POST /hosting/agents/<addr>/start
    const agentPySource = `EXTERNAL_ENDPOINT = "https://old.example.com"\nprint("hello")`;
    const codePayload = JSON.stringify([
      { language: 'python', name: 'agent.py', value: agentPySource },
    ]);

    cleanupFetch = installFetchMock(async (input) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('/code')) {
        // Could be GET (returns code object) or PUT (upload — returns digest)
        return makeJsonResponse({ code: codePayload, digest: 'abc123' });
      }
      if (url.includes('/stop')) return makeJsonResponse({});
      if (url.includes('/start')) return makeJsonResponse({});
      if (url.includes('/secrets')) return makeJsonResponse({});
      if (url.includes('agentverse.ai')) return makeJsonResponse({ success: true });
      return makeJsonResponse({ error: 'unexpected' }, 404);
    });

    const { registerConnectUpdateCommand } = await import('../src/commands/connect-update.js');
    const program = new Command();
    program.exitOverride();
    registerConnectUpdateCommand(program);

    await program.parseAsync([
      'node', 'test', 'connect-update',
      VALID_AGENT_ADDRESS,
      '--endpoint', 'https://new-endpoint.example.com/api',
      '--json',
    ]);

    const result = parseJsonOutput() as {
      agentAddress: string;
      endpoint: string;
      timeoutMs: number;
      updatedAt: string;
    };

    assert.equal(result.agentAddress, VALID_AGENT_ADDRESS, 'Should echo agentAddress');
    assert.equal(result.endpoint, 'https://new-endpoint.example.com/api', 'Should echo new endpoint');
    assert.ok(typeof result.timeoutMs === 'number', 'Should include timeoutMs');
    assert.ok(result.updatedAt, 'Should include updatedAt timestamp');
  });

  it('CLI-CONNECT-12d: success in text mode prints CONNECT CONFIG UPDATED header', async () => {
    const agentPySource = `EXTERNAL_ENDPOINT = "https://old.example.com"\nprint("hello")`;
    const codePayload = JSON.stringify([
      { language: 'python', name: 'agent.py', value: agentPySource },
    ]);

    cleanupFetch = installFetchMock(async (input) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('/code')) return makeJsonResponse({ code: codePayload, digest: 'abc123' });
      if (url.includes('/stop')) return makeJsonResponse({});
      if (url.includes('/start')) return makeJsonResponse({});
      if (url.includes('/secrets')) return makeJsonResponse({});
      if (url.includes('agentverse.ai')) return makeJsonResponse({ success: true });
      return makeJsonResponse({ error: 'unexpected' }, 404);
    });

    const { registerConnectUpdateCommand } = await import('../src/commands/connect-update.js');
    const program = new Command();
    program.exitOverride();
    registerConnectUpdateCommand(program);

    await program.parseAsync([
      'node', 'test', 'connect-update',
      VALID_AGENT_ADDRESS,
      '--endpoint', 'https://updated.example.com/webhook',
    ]);

    const output = allOutput();
    assert.ok(output.includes('CONNECT CONFIG UPDATED'), 'Should print CONNECT CONFIG UPDATED header');
    assert.ok(output.includes(VALID_AGENT_ADDRESS), 'Should display the agent address');
    assert.ok(output.includes('https://updated.example.com/webhook'), 'Should display the new endpoint');
  });
});

// ---------------------------------------------------------------------------
// connect-status command tests (CLI-CONNECT-13 through CLI-CONNECT-14)
// ---------------------------------------------------------------------------

describe('connect-status command', () => {
  beforeEach(() => {
    captureOutput();
    mockExit();
    savedApiKey = process.env.AGENTVERSE_API_KEY;
    process.env.AGENTVERSE_API_KEY = 'av-test-key-connect-status';
  });

  afterEach(() => {
    restoreOutput();
    restoreExit();
    if (cleanupFetch) { cleanupFetch(); cleanupFetch = undefined; }
    if (savedApiKey !== undefined) {
      process.env.AGENTVERSE_API_KEY = savedApiKey;
    } else {
      delete process.env.AGENTVERSE_API_KEY;
    }
  });

  // CLI-CONNECT-13: too-short address is rejected before any network call
  it('CLI-CONNECT-13: rejects an address shorter than 10 characters', async () => {
    const { registerConnectStatusCommand } = await import('../src/commands/connect-status.js');
    const program = new Command();
    program.exitOverride();
    registerConnectStatusCommand(program);

    await assert.rejects(
      () => program.parseAsync([
        'node', 'test', 'connect-status',
        'short',   // only 5 chars — below the 10-char minimum
        '--json',
      ]),
      (err: unknown) => {
        assert.ok(err instanceof ExitError);
        assert.equal((err as ExitError).code, 1);
        return true;
      },
    );

    const result = parseJsonOutput() as { error: string };
    assert.ok(result.error, 'Should produce a JSON error');
    assert.ok(
      result.error.toLowerCase().includes('invalid') || result.error.toLowerCase().includes('address'),
      `Error should describe invalid address: ${result.error}`,
    );
  });

  it('CLI-CONNECT-13b: rejects an empty string address in text mode', async () => {
    const { registerConnectStatusCommand } = await import('../src/commands/connect-status.js');
    // A whitespace-only string trims to length 0, hitting the same guard.
    const program = new Command();
    program.exitOverride();
    registerConnectStatusCommand(program);

    await assert.rejects(
      () => program.parseAsync([
        'node', 'test', 'connect-status',
        '         ',   // spaces — trims to empty
      ]),
      (err: unknown) => {
        assert.ok(err instanceof ExitError);
        assert.equal((err as ExitError).code, 1);
        return true;
      },
    );

    const output = allOutput();
    assert.ok(
      output.toLowerCase().includes('invalid') || output.toLowerCase().includes('address'),
      `Output should describe invalid address: ${output}`,
    );
  });

  // CLI-CONNECT-14: success path — --json outputs full ConnectionStatus object
  it('CLI-CONNECT-14: success with --json outputs full connect status object', async () => {
    const ENDPOINT_URL = 'https://api.example.com/webhook';

    // connectionStatus makes two fetch calls:
    //   1. GET /hosting/agents/<addr>       — returns running/compiled flags
    //   2. GET /hosting/agents/<addr>/code  — returns encoded source; endpoint
    //                                         is extracted via regex from source
    const agentPySource = `EXTERNAL_ENDPOINT = "${ENDPOINT_URL}"\nprint("hello")`;
    const codePayload = JSON.stringify([
      { language: 'python', name: 'agent.py', value: agentPySource },
    ]);

    cleanupFetch = installFetchMock(async (input) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('/code')) {
        return makeJsonResponse({ code: codePayload });
      }
      // GET /hosting/agents/<addr> — status call
      return makeJsonResponse({
        address: VALID_AGENT_ADDRESS,
        name: 'My Test Proxy',
        running: true,
        compiled: true,
      });
    });

    const { registerConnectStatusCommand } = await import('../src/commands/connect-status.js');
    const program = new Command();
    program.exitOverride();
    registerConnectStatusCommand(program);

    await program.parseAsync([
      'node', 'test', 'connect-status',
      VALID_AGENT_ADDRESS,
      '--json',
    ]);

    const result = parseJsonOutput() as {
      address: string;
      name: string;
      endpoint: string;
      status: string;
      compilationStatus: string;
    };

    assert.equal(result.address, VALID_AGENT_ADDRESS, 'Should include address');
    assert.equal(result.name, 'My Test Proxy', 'Should include name');
    assert.equal(result.endpoint, ENDPOINT_URL, 'Should include endpoint extracted from source');
    assert.equal(result.status, 'running', 'Should include status = running');
    assert.equal(result.compilationStatus, 'compiled', 'Should include compilationStatus');
  });

  it('CLI-CONNECT-14b: success in text mode prints CONNECT STATUS header', async () => {
    const proxyStatusFixture = {
      address: VALID_AGENT_ADDRESS,
      name: 'Text Mode Connect',
      endpoint: 'https://api.example.com',
      status: 'running',
      compilationStatus: 'compiled',
      lastActivity: null,
    };

    cleanupFetch = installFetchMock(async () => makeJsonResponse(proxyStatusFixture));

    const { registerConnectStatusCommand } = await import('../src/commands/connect-status.js');
    const program = new Command();
    program.exitOverride();
    registerConnectStatusCommand(program);

    await program.parseAsync([
      'node', 'test', 'connect-status',
      VALID_AGENT_ADDRESS,
    ]);

    const output = allOutput();
    assert.ok(output.includes('CONNECT STATUS'), 'Should print CONNECT STATUS header');
    assert.ok(output.includes(VALID_AGENT_ADDRESS), 'Should display the agent address');
  });

  it('CLI-CONNECT-14c: SDK error surfaces as JSON error object', async () => {
    cleanupFetch = installFetchMock(async () => makeJsonResponse({ message: 'Agent not found' }, 404));

    const { registerConnectStatusCommand } = await import('../src/commands/connect-status.js');
    const program = new Command();
    program.exitOverride();
    registerConnectStatusCommand(program);

    await assert.rejects(
      () => program.parseAsync([
        'node', 'test', 'connect-status',
        VALID_AGENT_ADDRESS,
        '--json',
      ]),
      (err: unknown) => {
        assert.ok(err instanceof ExitError);
        assert.equal((err as ExitError).code, 1);
        return true;
      },
    );

    const result = parseJsonOutput() as { error: string };
    assert.ok(result.error, 'Should produce a JSON error when SDK throws');
  });
});

// ---------------------------------------------------------------------------
// connect-logs command tests (CLI-CONNECT-15 through CLI-CONNECT-16)
// ---------------------------------------------------------------------------

describe('connect-logs command', () => {
  beforeEach(() => {
    captureOutput();
    mockExit();
    savedApiKey = process.env.AGENTVERSE_API_KEY;
    process.env.AGENTVERSE_API_KEY = 'av-test-key-connect-logs';
  });

  afterEach(() => {
    restoreOutput();
    restoreExit();
    if (cleanupFetch) { cleanupFetch(); cleanupFetch = undefined; }
    if (savedApiKey !== undefined) {
      process.env.AGENTVERSE_API_KEY = savedApiKey;
    } else {
      delete process.env.AGENTVERSE_API_KEY;
    }
  });

  // CLI-CONNECT-15: invalid --limit values are rejected
  it('CLI-CONNECT-15: rejects --limit 0 (zero is not a positive integer)', async () => {
    const { registerConnectLogsCommand } = await import('../src/commands/connect-logs.js');
    const program = new Command();
    program.exitOverride();
    registerConnectLogsCommand(program);

    await assert.rejects(
      () => program.parseAsync([
        'node', 'test', 'connect-logs',
        VALID_AGENT_ADDRESS,
        '--limit', '0',
        '--json',
      ]),
      (err: unknown) => {
        assert.ok(err instanceof ExitError);
        assert.equal((err as ExitError).code, 1);
        return true;
      },
    );

    const result = parseJsonOutput() as { error: string };
    assert.ok(result.error, 'Should produce a JSON error');
    assert.ok(
      result.error.toLowerCase().includes('limit'),
      `Error should mention --limit: ${result.error}`,
    );
  });

  it('CLI-CONNECT-15b: rejects non-numeric --limit', async () => {
    const { registerConnectLogsCommand } = await import('../src/commands/connect-logs.js');
    const program = new Command();
    program.exitOverride();
    registerConnectLogsCommand(program);

    await assert.rejects(
      () => program.parseAsync([
        'node', 'test', 'connect-logs',
        VALID_AGENT_ADDRESS,
        '--limit', 'notanumber',
        '--json',
      ]),
      (err: unknown) => {
        assert.ok(err instanceof ExitError);
        assert.equal((err as ExitError).code, 1);
        return true;
      },
    );

    const result = parseJsonOutput() as { error: string };
    assert.ok(result.error, 'Should produce a JSON error');
    assert.ok(
      result.error.toLowerCase().includes('limit'),
      `Error should mention --limit: ${result.error}`,
    );
  });

  it('CLI-CONNECT-15c: rejects too-short agent address', async () => {
    const { registerConnectLogsCommand } = await import('../src/commands/connect-logs.js');
    const program = new Command();
    program.exitOverride();
    registerConnectLogsCommand(program);

    await assert.rejects(
      () => program.parseAsync([
        'node', 'test', 'connect-logs',
        'tiny',
        '--json',
      ]),
      (err: unknown) => {
        assert.ok(err instanceof ExitError);
        assert.equal((err as ExitError).code, 1);
        return true;
      },
    );

    const result = parseJsonOutput() as { error: string };
    assert.ok(result.error, 'Should produce a JSON error');
    assert.ok(
      result.error.toLowerCase().includes('invalid') || result.error.toLowerCase().includes('address'),
      `Error should describe invalid address: ${result.error}`,
    );
  });

  // CLI-CONNECT-16: success path — --json output contains agentAddress, limit, lines[]
  it('CLI-CONNECT-16: success with --json outputs agentAddress, limit, and lines array', async () => {
    // connectionLogs calls GET /hosting/agents/<addr>/logs/latest and expects
    // { logs: "line1\nline2\n..." }. It splits on \n, filters empty strings,
    // then reverses (newest-first). With --limit 10 and 4 lines the SDK
    // returns all 4 (slice(0, 10) of a 4-element array).
    const rawLogLines = [
      '[2026-03-28T10:00:01Z] INFO  Proxy agent started',
      '[2026-03-28T10:00:05Z] INFO  Received request from agent1qcaller',
      '[2026-03-28T10:00:05Z] INFO  Forwarding to https://api.example.com/webhook',
      '[2026-03-28T10:00:06Z] INFO  Response 200 OK in 342ms',
    ];
    // The SDK reverses the split array, so returned order is newest-first.
    const expectedLines = [...rawLogLines].reverse();

    cleanupFetch = installFetchMock(async () =>
      makeJsonResponse({ logs: rawLogLines.join('\n') }),
    );

    const { registerConnectLogsCommand } = await import('../src/commands/connect-logs.js');
    const program = new Command();
    program.exitOverride();
    registerConnectLogsCommand(program);

    await program.parseAsync([
      'node', 'test', 'connect-logs',
      VALID_AGENT_ADDRESS,
      '--limit', '10',
      '--json',
    ]);

    const result = parseJsonOutput() as {
      agentAddress: string;
      limit: number;
      lines: string[];
    };

    assert.equal(result.agentAddress, VALID_AGENT_ADDRESS, 'Should include agentAddress');
    assert.equal(result.limit, 10, 'Should echo the requested limit');
    assert.ok(Array.isArray(result.lines), 'lines should be an array');
    assert.equal(result.lines.length, rawLogLines.length, 'Should return all log lines');
    assert.equal(result.lines[0], expectedLines[0], 'First line should be newest (reversed)');
    assert.equal(result.lines[3], expectedLines[3], 'Last line should be oldest');
  });

  it('CLI-CONNECT-16b: default limit is 50 when --limit not specified', async () => {
    let capturedUrl = '';
    cleanupFetch = installFetchMock(async (input) => {
      capturedUrl = typeof input === 'string' ? input : input.toString();
      // connectionLogs expects { logs: "..." }
      return makeJsonResponse({ logs: '[2026-03-28T10:00:01Z] INFO  Single line' });
    });

    const { registerConnectLogsCommand } = await import('../src/commands/connect-logs.js');
    const program = new Command();
    program.exitOverride();
    registerConnectLogsCommand(program);

    await program.parseAsync([
      'node', 'test', 'connect-logs',
      VALID_AGENT_ADDRESS,
      '--json',
    ]);

    const result = parseJsonOutput() as { limit: number };
    // The default should be 50 (DEFAULT_LIMIT constant in connect-logs.ts)
    assert.equal(result.limit, 50, 'Default limit should be 50');
    assert.ok(capturedUrl, 'Should have made a fetch call');
  });

  it('CLI-CONNECT-16c: empty log response prints "No log lines found" in text mode', async () => {
    // connectionLogs calls GET /logs/latest and expects { logs: string }.
    // An empty logs string produces an empty lines array, which triggers
    // the "No log lines found" branch in connect-logs.ts.
    cleanupFetch = installFetchMock(async () => makeJsonResponse({ logs: '' }));

    const { registerConnectLogsCommand } = await import('../src/commands/connect-logs.js');
    const program = new Command();
    program.exitOverride();
    registerConnectLogsCommand(program);

    await program.parseAsync([
      'node', 'test', 'connect-logs',
      VALID_AGENT_ADDRESS,
    ]);

    const output = allOutput();
    assert.ok(
      output.toLowerCase().includes('no log') || output.toLowerCase().includes('no log lines'),
      `Output should mention no logs found: ${output}`,
    );
  });

  it('CLI-CONNECT-16d: non-empty text mode output contains log lines and count', async () => {
    const rawLogLines = [
      '[2026-03-28T10:00:01Z] INFO  Agent started',
      '[2026-03-28T10:00:02Z] INFO  Proxy request received',
    ];

    // connectionLogs expects { logs: "line1\nline2\n..." }
    cleanupFetch = installFetchMock(async () =>
      makeJsonResponse({ logs: rawLogLines.join('\n') }),
    );

    const { registerConnectLogsCommand } = await import('../src/commands/connect-logs.js');
    const program = new Command();
    program.exitOverride();
    registerConnectLogsCommand(program);

    await program.parseAsync([
      'node', 'test', 'connect-logs',
      VALID_AGENT_ADDRESS,
      '--limit', '5',
    ]);

    const output = allOutput();
    assert.ok(output.includes('Agent started'), 'Should display first log line');
    assert.ok(output.includes('Proxy request received'), 'Should display second log line');
    assert.ok(output.includes('2 line(s) shown'), 'Should display line count');
  });
});
