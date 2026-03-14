/**
 * Tests for CLI commands batch 2 — CLI-15 through CLI-26
 *
 * Covers:
 *   CLI-15: comments <address>               List comments (GET)
 *   CLI-16: comments <address> --post "msg"   Post comment (POST, needs API key)
 *   CLI-17: buy <address> --amount 10 --dry-run   calculateBuy preview
 *   CLI-18: sell <address> --amount 1000 --dry-run calculateSell preview
 *   CLI-19: optimize agent1q... --description "D"  updateAgent via SDK
 *   CLI-20: config set-key av-xxx              Store key in ~/.agentlaunch/config.json
 *   CLI-21: config show                        Print env, URL, key (masked)
 *   CLI-22: init                               Installs embedded files
 *   CLI-23: init --dry-run                     Lists files without writing
 *   CLI-24: claim 0xWALLET                     POST /faucet/claim
 *   CLI-25: create --json --name X --ticker T  Full lifecycle: scaffold -> deploy -> tokenize
 *   CLI-26: create --json --name X --ticker T  Returns JSON output
 *
 * Pattern: Commander.js parseAsync with mocked globalThis.fetch and console capture.
 * Tests run via: node --test --import tsx/esm
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { Command } from 'commander';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// ─── Console capture ────────────────────────────────────────────────────────

let logOutput: string[] = [];
const origLog = console.log;
const origError = console.error;

function captureOutput() {
  logOutput = [];
  console.log = (...args: unknown[]) => logOutput.push(args.map(String).join(' '));
  console.error = (...args: unknown[]) => logOutput.push(args.map(String).join(' '));
}

function restoreOutput() {
  console.log = origLog;
  console.error = origError;
}

// ─── Process.exit mock ──────────────────────────────────────────────────────

class ExitError extends Error {
  code: number;
  constructor(c: number) {
    super(`exit(${c})`);
    this.code = c;
  }
}

const origExit = process.exit;

function mockExit() {
  process.exit = ((c?: number) => { throw new ExitError(c ?? 0); }) as never;
}

function restoreExit() {
  process.exit = origExit;
}

// ─── Fetch mock ─────────────────────────────────────────────────────────────

const originalFetch = globalThis.fetch;

function installFetchMock(
  mock: (input: string | URL | Request, init?: RequestInit) => Promise<Response>,
): () => void {
  globalThis.fetch = mock as typeof globalThis.fetch;
  return () => { globalThis.fetch = originalFetch; };
}

function makeResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
    headers: new Headers(),
  } as unknown as Response;
}

// ─── Saved env/state ────────────────────────────────────────────────────────

let savedApiKey: string | undefined;
let cleanupFetch: (() => void) | undefined;

// ─── Config backup/restore for config tests ─────────────────────────────────

const configDir = path.join(os.homedir(), '.agentlaunch');
const configFile = path.join(configDir, 'config.json');

function backupConfig(): string | null {
  if (fs.existsSync(configFile)) {
    return fs.readFileSync(configFile, 'utf8');
  }
  return null;
}

function restoreConfig(backup: string | null) {
  if (backup !== null) {
    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(configFile, backup, { mode: 0o600 });
  } else if (fs.existsSync(configFile)) {
    fs.unlinkSync(configFile);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CLI-15/16: comments command
// ═══════════════════════════════════════════════════════════════════════════

describe('comments command', () => {
  beforeEach(() => {
    captureOutput();
    mockExit();
    savedApiKey = process.env.AGENTVERSE_API_KEY;
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

  it('CLI-15: lists comments for a token via GET /comments/{address}', async () => {
    const commentsData = {
      comments: [
        { id: 1, message: 'hello world', user: { username: 'alice' }, created_at: '2026-03-01T00:00:00Z' },
        { id: 2, message: 'great agent', user: { username: 'bob' }, created_at: '2026-03-02T00:00:00Z' },
      ],
    };

    let requestedUrl = '';
    cleanupFetch = installFetchMock(async (input) => {
      requestedUrl = String(input);
      return makeResponse(commentsData);
    });

    const { registerCommentsCommand } = await import('../commands/comments.js');
    const program = new Command();
    program.exitOverride();
    registerCommentsCommand(program);

    await program.parseAsync(['node', 'test', 'comments', '0xABCDEF1234567890ABCDEF1234567890ABCDEF12', '--json']);

    assert.ok(requestedUrl.includes('/comments/0xABCDEF1234567890ABCDEF1234567890ABCDEF12'), `URL should contain /comments/ path, got: ${requestedUrl}`);

    const output = logOutput.join('\n');
    const parsed = JSON.parse(output);
    assert.equal(parsed.total, 2, 'should return 2 comments');
    assert.ok(Array.isArray(parsed.comments), 'should have comments array');
  });

  it('CLI-16: posts a comment via POST /comments/{address}', async () => {
    const postResult = { id: 3, message: 'my comment' };

    let requestedMethod = '';
    let requestedUrl = '';
    let requestedBody: unknown = null;

    process.env.AGENTVERSE_API_KEY = 'av-test-key-1234567890';

    cleanupFetch = installFetchMock(async (input, init) => {
      requestedUrl = String(input);
      requestedMethod = init?.method ?? 'GET';
      if (init?.body) {
        requestedBody = JSON.parse(String(init.body));
      }
      return makeResponse(postResult);
    });

    const { registerCommentsCommand } = await import('../commands/comments.js');
    const program = new Command();
    program.exitOverride();
    registerCommentsCommand(program);

    await program.parseAsync([
      'node', 'test', 'comments',
      '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
      '--post', 'my comment',
      '--json',
    ]);

    assert.equal(requestedMethod, 'POST', 'should use POST method');
    assert.ok(requestedUrl.includes('/comments/0xABCDEF1234567890ABCDEF1234567890ABCDEF12'), `URL should contain /comments/ path`);
    assert.deepEqual(requestedBody, { message: 'my comment' }, 'should send message in body');

    const output = logOutput.join('\n');
    const parsed = JSON.parse(output);
    assert.equal(parsed.success, true);
    assert.equal(parsed.comment.id, 3);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CLI-17: buy --dry-run
// ═══════════════════════════════════════════════════════════════════════════

describe('buy command', () => {
  beforeEach(() => {
    captureOutput();
    mockExit();
    savedApiKey = process.env.AGENTVERSE_API_KEY;
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

  it('CLI-17: buy --dry-run calls calculateBuy and outputs preview', async () => {
    const calcResult = {
      tokensReceived: '50000',
      pricePerToken: '0.0002',
      priceImpact: 0.5,
      fee: '0.2',
      netFetSpent: '9.8',
    };

    let requestedUrl = '';
    cleanupFetch = installFetchMock(async (input) => {
      requestedUrl = String(input);
      return makeResponse(calcResult);
    });

    const { registerBuyCommand } = await import('../commands/buy.js');
    const program = new Command();
    program.exitOverride();
    registerBuyCommand(program);

    await program.parseAsync([
      'node', 'test', 'buy',
      '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
      '--amount', '10',
      '--dry-run',
      '--json',
    ]);

    assert.ok(requestedUrl.includes('/tokens/calculate-buy'), `URL should call calculate-buy, got: ${requestedUrl}`);
    assert.ok(requestedUrl.includes('fetAmount=10'), `URL should contain fetAmount param, got: ${requestedUrl}`);

    const output = logOutput.join('\n');
    const parsed = JSON.parse(output);
    assert.equal(parsed.dryRun, true, 'should indicate dry run');
    assert.equal(parsed.tokensReceived, '50000');
    assert.equal(parsed.fee, '0.2');
    assert.equal(parsed.netFetSpent, '9.8');
  });

  it('CLI-17b: buy --dry-run outputs human-readable preview without --json', async () => {
    const calcResult = {
      tokensReceived: '50000',
      pricePerToken: '0.0002',
      priceImpact: 0.5,
      fee: '0.2',
      netFetSpent: '9.8',
    };

    cleanupFetch = installFetchMock(async () => makeResponse(calcResult));

    const { registerBuyCommand } = await import('../commands/buy.js');
    const program = new Command();
    program.exitOverride();
    registerBuyCommand(program);

    await program.parseAsync([
      'node', 'test', 'buy',
      '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
      '--amount', '10',
      '--dry-run',
    ]);

    const output = logOutput.join('\n');
    assert.ok(output.includes('BUY PREVIEW'), 'should show BUY PREVIEW header');
    assert.ok(output.includes('50000'), 'should show tokens received');
    assert.ok(output.includes('dry run'), 'should mention dry run');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CLI-18: sell --dry-run
// ═══════════════════════════════════════════════════════════════════════════

describe('sell command', () => {
  beforeEach(() => {
    captureOutput();
    mockExit();
    savedApiKey = process.env.AGENTVERSE_API_KEY;
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

  it('CLI-18: sell --dry-run calls calculateSell and outputs preview', async () => {
    const calcResult = {
      fetReceived: '5.0',
      pricePerToken: '0.00005',
      priceImpact: 1.2,
      fee: '0.1',
      netFetReceived: '4.9',
    };

    let requestedUrl = '';
    cleanupFetch = installFetchMock(async (input) => {
      requestedUrl = String(input);
      return makeResponse(calcResult);
    });

    const { registerSellCommand } = await import('../commands/sell.js');
    const program = new Command();
    program.exitOverride();
    registerSellCommand(program);

    await program.parseAsync([
      'node', 'test', 'sell',
      '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
      '--amount', '100000',
      '--dry-run',
      '--json',
    ]);

    assert.ok(requestedUrl.includes('/tokens/calculate-sell'), `URL should call calculate-sell, got: ${requestedUrl}`);
    assert.ok(requestedUrl.includes('tokenAmount=100000'), `URL should contain tokenAmount param, got: ${requestedUrl}`);

    const output = logOutput.join('\n');
    const parsed = JSON.parse(output);
    assert.equal(parsed.dryRun, true, 'should indicate dry run');
    assert.equal(parsed.fetReceived, '5.0');
    assert.equal(parsed.fee, '0.1');
    assert.equal(parsed.netFetReceived, '4.9');
  });

  it('CLI-18b: sell --dry-run outputs human-readable preview without --json', async () => {
    const calcResult = {
      fetReceived: '5.0',
      pricePerToken: '0.00005',
      priceImpact: 1.2,
      fee: '0.1',
      netFetReceived: '4.9',
    };

    cleanupFetch = installFetchMock(async () => makeResponse(calcResult));

    const { registerSellCommand } = await import('../commands/sell.js');
    const program = new Command();
    program.exitOverride();
    registerSellCommand(program);

    await program.parseAsync([
      'node', 'test', 'sell',
      '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
      '--amount', '100000',
      '--dry-run',
    ]);

    const output = logOutput.join('\n');
    assert.ok(output.includes('SELL PREVIEW'), 'should show SELL PREVIEW header');
    assert.ok(output.includes('5.0'), 'should show FET received');
    assert.ok(output.includes('dry run'), 'should mention dry run');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CLI-19: optimize command
// ═══════════════════════════════════════════════════════════════════════════

describe('optimize command', () => {
  beforeEach(() => {
    captureOutput();
    mockExit();
    savedApiKey = process.env.AGENTVERSE_API_KEY;
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

  it('CLI-19: optimize calls updateAgent with description and outputs JSON', async () => {
    process.env.AGENTVERSE_API_KEY = 'av-test-key-1234567890';

    // The optimize command calls updateAgent which calls fetch to Agentverse API
    let requestedUrl = '';
    let requestedMethod = '';
    let requestedBody: unknown = null;

    cleanupFetch = installFetchMock(async (input, init) => {
      requestedUrl = String(input);
      requestedMethod = init?.method ?? 'GET';
      if (init?.body) {
        requestedBody = JSON.parse(String(init.body));
      }
      // updateAgent makes a PUT to agentverse.ai
      return makeResponse({ success: true });
    });

    const { registerOptimizeCommand } = await import('../commands/optimize.js');
    const program = new Command();
    program.exitOverride();
    registerOptimizeCommand(program);

    await program.parseAsync([
      'node', 'test', 'optimize',
      'agent1q0test1234567890abcdef',
      '--description', 'A test agent that does useful things',
      '--json',
    ]);

    // updateAgent calls PUT to agentverse.ai/v1/hosting/agents/{addr}
    assert.equal(requestedMethod, 'PUT', 'should use PUT method');
    assert.ok(requestedUrl.includes('agentverse.ai'), `URL should call Agentverse API, got: ${requestedUrl}`);
    assert.ok(requestedUrl.includes('agent1q0test1234567890abcdef'), 'URL should contain agent address');
    assert.ok(
      (requestedBody as Record<string, unknown>).short_description === 'A test agent that does useful things',
      'should include short_description in body',
    );

    const output = logOutput.join('\n');
    const parsed = JSON.parse(output);
    assert.equal(parsed.success, true);
    assert.ok(parsed.updatedFields.includes('short_description'));
    assert.ok(Array.isArray(parsed.optimization), 'should include optimization checklist');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CLI-20/21: config command
// ═══════════════════════════════════════════════════════════════════════════

describe('config command', () => {
  let configBackup: string | null = null;

  beforeEach(() => {
    captureOutput();
    mockExit();
    configBackup = backupConfig();
  });

  afterEach(() => {
    restoreOutput();
    restoreExit();
    restoreConfig(configBackup);
  });

  it('CLI-20: config set-key stores key in config file', async () => {
    // Clear existing config
    if (fs.existsSync(configFile)) fs.unlinkSync(configFile);

    const { registerConfigCommand } = await import('../commands/config.js');
    const program = new Command();
    program.exitOverride();
    registerConfigCommand(program);

    await program.parseAsync(['node', 'test', 'config', 'set-key', 'av-testkey-abcdef1234567890']);

    const output = logOutput.join('\n');
    assert.ok(output.includes('API key saved'), 'should confirm save');
    assert.ok(output.includes('av-testk'), 'should show first 8 chars of masked key');

    // Verify the file was actually written
    const { readConfig } = await import('../config.js');
    const cfg = readConfig();
    assert.equal(cfg.apiKey, 'av-testkey-abcdef1234567890');
  });

  it('CLI-21: config show prints environment configuration', async () => {
    // Write a config with a known key
    if (fs.existsSync(configFile)) fs.unlinkSync(configFile);
    const { writeConfig } = await import('../config.js');
    writeConfig({ apiKey: 'av-showtest-abcdef1234567890' });

    const { registerConfigCommand } = await import('../commands/config.js');
    const program = new Command();
    program.exitOverride();
    registerConfigCommand(program);

    await program.parseAsync(['node', 'test', 'config', 'show']);

    const output = logOutput.join('\n');
    assert.ok(output.includes('Environment'), 'should show environment label');
    assert.ok(output.includes('API URL'), 'should show API URL label');
    assert.ok(output.includes('Frontend URL'), 'should show Frontend URL label');
    assert.ok(output.includes('API Key'), 'should show API Key label');
    assert.ok(output.includes('av-showt'), 'should show masked key prefix');
    assert.ok(!output.includes('av-showtest-abcdef1234567890'), 'should NOT show full key');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CLI-22/23: init command
// ═══════════════════════════════════════════════════════════════════════════

describe('init command', () => {
  let tmpDir: string;
  let origCwd: string;

  beforeEach(() => {
    captureOutput();
    mockExit();
    origCwd = process.cwd();
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agentlaunch-init-test-'));
    process.chdir(tmpDir);
  });

  afterEach(() => {
    restoreOutput();
    restoreExit();
    process.chdir(origCwd);
    // Clean up temp directory
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  });

  it('CLI-22: init installs embedded files', async () => {
    const { registerInit } = await import('../commands/init.js');
    const program = new Command();
    program.exitOverride();
    registerInit(program);

    await program.parseAsync(['node', 'test', 'init']);

    const output = logOutput.join('\n');
    assert.ok(output.includes('Created') || output.includes('Merged'), 'should report created or merged files');
    assert.ok(output.includes('Files created:'), 'should show files created count');

    // Verify some key files were created
    assert.ok(fs.existsSync(path.join(tmpDir, '.env.example')), '.env.example should exist');
    assert.ok(fs.existsSync(path.join(tmpDir, '.claude', 'settings.json')), '.claude/settings.json should exist');
    assert.ok(fs.existsSync(path.join(tmpDir, '.claude', 'rules', 'agentlaunch.md')), 'agentlaunch rule should exist');
    assert.ok(fs.existsSync(path.join(tmpDir, '.claude', 'rules', 'agentverse.md')), 'agentverse rule should exist');
  });

  it('CLI-23: init --dry-run lists files without writing', async () => {
    const { registerInit } = await import('../commands/init.js');
    const program = new Command();
    program.exitOverride();
    registerInit(program);

    await program.parseAsync(['node', 'test', 'init', '--dry-run']);

    const output = logOutput.join('\n');
    // dry-run should show CREATE/MERGE/SKIP labels
    assert.ok(output.includes('CREATE'), 'should show CREATE label for files to create');

    // Verify NO files were created
    assert.ok(!fs.existsSync(path.join(tmpDir, '.env.example')), '.env.example should NOT exist in dry-run');
    assert.ok(!fs.existsSync(path.join(tmpDir, '.claude')), '.claude/ should NOT exist in dry-run');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CLI-24: claim command
// ═══════════════════════════════════════════════════════════════════════════

describe('claim command', () => {
  beforeEach(() => {
    captureOutput();
    mockExit();
    savedApiKey = process.env.AGENTVERSE_API_KEY;
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

  it('CLI-24: claim calls POST /faucet/claim with wallet address', async () => {
    process.env.AGENTVERSE_API_KEY = 'av-test-key-1234567890';

    const claimResult = {
      success: true,
      wallet: '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
      fetAmount: 200,
      bnbAmount: 0.001,
      fetTxHash: '0xtxhash_fet_123',
      bnbTxHash: '0xtxhash_bnb_456',
    };

    let requestedUrl = '';
    let requestedMethod = '';
    let requestedBody: unknown = null;

    cleanupFetch = installFetchMock(async (input, init) => {
      requestedUrl = String(input);
      requestedMethod = init?.method ?? 'GET';
      if (init?.body) {
        requestedBody = JSON.parse(String(init.body));
      }
      return makeResponse(claimResult);
    });

    const { registerClaimCommand } = await import('../commands/claim.js');
    const program = new Command();
    program.exitOverride();
    registerClaimCommand(program);

    await program.parseAsync([
      'node', 'test', 'claim',
      '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
      '--json',
    ]);

    assert.equal(requestedMethod, 'POST', 'should use POST method');
    assert.ok(requestedUrl.includes('/faucet/claim'), `URL should contain /faucet/claim, got: ${requestedUrl}`);
    assert.equal(
      (requestedBody as Record<string, string>).wallet,
      '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
      'should send wallet address in body',
    );

    const output = logOutput.join('\n');
    const parsed = JSON.parse(output);
    assert.equal(parsed.success, true);
    assert.equal(parsed.fetAmount, 200);
    assert.equal(parsed.bnbAmount, 0.001);
  });

  it('CLI-24b: claim rejects invalid wallet address', async () => {
    process.env.AGENTVERSE_API_KEY = 'av-test-key-1234567890';

    cleanupFetch = installFetchMock(async () => makeResponse({}));

    const { registerClaimCommand } = await import('../commands/claim.js');
    const program = new Command();
    program.exitOverride();
    registerClaimCommand(program);

    await assert.rejects(
      () => program.parseAsync(['node', 'test', 'claim', 'invalid-wallet', '--json']),
      (err: unknown) => {
        assert.ok(err instanceof ExitError);
        assert.equal((err as ExitError).code, 1);
        return true;
      },
    );

    const output = logOutput.join('\n');
    const parsed = JSON.parse(output);
    assert.ok(parsed.success === false || parsed.error, 'should report error for invalid wallet');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CLI-25/26: create command (--json mode)
// ═══════════════════════════════════════════════════════════════════════════

describe('create command', () => {
  let tmpDir: string;
  let origCwd: string;

  beforeEach(() => {
    captureOutput();
    mockExit();
    savedApiKey = process.env.AGENTVERSE_API_KEY;
    origCwd = process.cwd();
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agentlaunch-create-test-'));
    process.chdir(tmpDir);
  });

  afterEach(() => {
    restoreOutput();
    restoreExit();
    process.chdir(origCwd);
    if (cleanupFetch) { cleanupFetch(); cleanupFetch = undefined; }
    if (savedApiKey !== undefined) {
      process.env.AGENTVERSE_API_KEY = savedApiKey;
    } else {
      delete process.env.AGENTVERSE_API_KEY;
    }
    // Clean up temp directory
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  });

  it('CLI-25: create --json scaffolds an agent project without deploy', async () => {
    // No API key = scaffold only, no deploy
    delete process.env.AGENTVERSE_API_KEY;

    // Ensure no config key either
    const backup = backupConfig();
    if (fs.existsSync(configFile)) fs.unlinkSync(configFile);

    try {
      const { registerCreateCommand } = await import('../commands/create.js');
      const program = new Command();
      program.exitOverride();
      registerCreateCommand(program);

      await program.parseAsync([
        'node', 'test', 'create',
        '--name', 'TestAgent',
        '--ticker', 'TEST',
        '--json',
        '--no-editor',
      ]);

      const output = logOutput.join('\n');
      // The create --json command outputs JSON result
      const parsed = JSON.parse(output);
      assert.equal(parsed.name, 'TestAgent', 'should use provided name');
      assert.equal(parsed.ticker, 'TEST', 'should use provided ticker');

      // Verify the scaffolded directory was created
      const scaffoldDir = path.join(tmpDir, 'testagent');
      assert.ok(fs.existsSync(scaffoldDir), `scaffold directory should exist at ${scaffoldDir}`);
      assert.ok(fs.existsSync(path.join(scaffoldDir, 'agent.py')), 'agent.py should exist');
      assert.ok(fs.existsSync(path.join(scaffoldDir, 'CLAUDE.md')), 'CLAUDE.md should exist');
    } finally {
      restoreConfig(backup);
    }
  });

  it('CLI-26: create --json returns valid JSON output', async () => {
    delete process.env.AGENTVERSE_API_KEY;

    const backup = backupConfig();
    if (fs.existsSync(configFile)) fs.unlinkSync(configFile);

    try {
      const { registerCreateCommand } = await import('../commands/create.js');
      const program = new Command();
      program.exitOverride();
      registerCreateCommand(program);

      await program.parseAsync([
        'node', 'test', 'create',
        '--name', 'JsonAgent',
        '--ticker', 'JSON',
        '--description', 'An agent for JSON testing',
        '--json',
        '--no-editor',
      ]);

      const output = logOutput.join('\n');
      // Should be valid JSON
      let parsed: Record<string, unknown>;
      assert.doesNotThrow(() => {
        parsed = JSON.parse(output);
      }, 'output should be valid JSON');
      parsed = JSON.parse(output);

      // Verify expected fields in JSON output
      assert.equal(parsed.name, 'JsonAgent');
      assert.equal(parsed.ticker, 'JSON');
      assert.ok(parsed.scaffoldDir, 'should include scaffoldDir in output');
      assert.equal(parsed.template, 'chat-memory', 'should default to chat-memory template');
    } finally {
      restoreConfig(backup);
    }
  });

  it('CLI-25b: create --json fails with descriptive error when name missing', async () => {
    delete process.env.AGENTVERSE_API_KEY;

    const backup = backupConfig();
    if (fs.existsSync(configFile)) fs.unlinkSync(configFile);

    try {
      const { registerCreateCommand } = await import('../commands/create.js');
      const program = new Command();
      program.exitOverride();
      registerCreateCommand(program);

      await assert.rejects(
        () => program.parseAsync([
          'node', 'test', 'create',
          '--ticker', 'FAIL',
          '--json',
        ]),
        (err: unknown) => {
          assert.ok(err instanceof ExitError);
          assert.equal((err as ExitError).code, 1);
          return true;
        },
      );

      const output = logOutput.join('\n');
      const parsed = JSON.parse(output);
      assert.ok(parsed.error, 'should return error field');
      assert.ok(parsed.error.includes('--name'), 'error should mention --name is required');
    } finally {
      restoreConfig(backup);
    }
  });
});
