/**
 * Tests for CLI commands: scaffold, deploy, tokenize, list, status, holders, comments
 *
 * Covers 14 test gaps (CLI-01 through CLI-14) across 7 command modules.
 *
 * Strategy:
 *   - scaffold: uses temp directories and verifies files on disk
 *   - deploy: mocks globalThis.fetch to intercept Agentverse API calls + creates temp agent.py
 *   - tokenize: mocks globalThis.fetch to intercept POST /agents/tokenize
 *   - list/status/holders/comments: mocks globalThis.fetch to return fixture data
 *
 * Uses node:test runner with tsx/esm loader.
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Command } from 'commander';

import { registerScaffoldCommand } from '../commands/scaffold.js';
import { registerDeployCommand } from '../commands/deploy.js';
import { registerTokenizeCommand } from '../commands/tokenize.js';
import { registerListCommand } from '../commands/list.js';
import { registerStatusCommand } from '../commands/status.js';
import { registerHoldersCommand } from '../commands/holders.js';
import { registerCommentsCommand } from '../commands/comments.js';

// ---------------------------------------------------------------------------
// Test utilities
// ---------------------------------------------------------------------------

/** Captured output lines from console.log and console.error. */
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

/** Sentinel error thrown when the command calls process.exit(). */
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

/** Saved original fetch for restoration. */
const origFetch = globalThis.fetch;

/**
 * Install a mock fetch that routes requests to handler functions.
 * Handlers receive the URL and init, and return a Response-like object.
 */
function mockFetch(
  handler: (url: string | URL | Request, init?: RequestInit) => Response | Promise<Response>,
): void {
  globalThis.fetch = handler as typeof globalThis.fetch;
}

function restoreFetch(): void {
  globalThis.fetch = origFetch;
}

/** Helper to create a JSON Response object. */
function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Join all captured log lines into a single string. */
function allOutput(): string {
  return logOutput.join('\n');
}

/** Parse the first JSON object found in captured output. */
function parseJsonOutput(): unknown {
  for (const line of logOutput) {
    try {
      return JSON.parse(line);
    } catch {
      // not JSON, skip
    }
  }
  throw new Error(`No JSON found in output:\n${allOutput()}`);
}

/** Create a fresh Commander program with exitOverride so it throws instead of exiting. */
function makeProgram(): Command {
  const program = new Command();
  program.exitOverride(); // throw CommanderError instead of process.exit
  return program;
}

// ---------------------------------------------------------------------------
// scaffold tests (CLI-01 through CLI-04)
// ---------------------------------------------------------------------------

describe('scaffold command', () => {
  let tmpDir: string;
  let origCwd: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-scaffold-test-'));
    origCwd = process.cwd();
    process.chdir(tmpDir);
    captureOutput();
    mockExit();
  });

  afterEach(() => {
    process.chdir(origCwd);
    restoreOutput();
    restoreExit();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  // CLI-01: scaffold <name> creates 6 files in a new directory
  it('CLI-01: scaffold <name> creates 6 files in new directory', () => {
    const program = makeProgram();
    registerScaffoldCommand(program);
    program.parse(['node', 'agentlaunch', 'scaffold', 'my-test-agent']);

    const agentDir = path.join(tmpDir, 'my-test-agent');
    assert.ok(fs.existsSync(agentDir), 'Agent directory should be created');

    const expectedFiles = [
      'agent.py',
      'README.md',
      '.env.example',
      'CLAUDE.md',
      '.claude/settings.json',
      'agentlaunch.config.json',
    ];

    for (const file of expectedFiles) {
      const filePath = path.join(agentDir, file);
      assert.ok(fs.existsSync(filePath), `File ${file} should exist`);
      const content = fs.readFileSync(filePath, 'utf8');
      assert.ok(content.length > 0, `File ${file} should not be empty`);
    }

    // Verify output mentions creation
    const output = allOutput();
    assert.ok(output.includes('Scaffolding'), 'Should print scaffolding message');
    assert.ok(output.includes('Done!'), 'Should print done message');
  });

  // CLI-02: scaffold <name> --type chat-memory uses chat-memory template
  it('CLI-02: scaffold <name> --type chat-memory uses correct template', () => {
    const program = makeProgram();
    registerScaffoldCommand(program);
    program.parse(['node', 'agentlaunch', 'scaffold', 'chat-agent', '--type', 'chat-memory']);

    const agentDir = path.join(tmpDir, 'chat-agent');
    assert.ok(fs.existsSync(agentDir), 'Agent directory should be created');

    // Verify agent.py was generated from the chat-memory template
    const agentCode = fs.readFileSync(path.join(agentDir, 'agent.py'), 'utf8');
    assert.ok(agentCode.length > 50, 'agent.py should contain substantial code');

    // chat-memory template should include chat protocol imports
    assert.ok(
      agentCode.includes('ChatMessage') || agentCode.includes('chat'),
      'chat-memory template should reference chat functionality',
    );

    const output = allOutput();
    assert.ok(output.includes('chat-agent'), 'Output should mention agent name');
  });

  // CLI-03: scaffold <name> --type swarm-starter uses swarm-starter template
  it('CLI-03: scaffold <name> --type swarm-starter uses swarm-starter template', () => {
    const program = makeProgram();
    registerScaffoldCommand(program);
    program.parse(['node', 'agentlaunch', 'scaffold', 'swarm-agent', '--type', 'swarm-starter']);

    const agentDir = path.join(tmpDir, 'swarm-agent');
    assert.ok(fs.existsSync(agentDir), 'Agent directory should be created');

    // Verify agent.py was generated from the swarm-starter template
    const agentCode = fs.readFileSync(path.join(agentDir, 'agent.py'), 'utf8');
    assert.ok(agentCode.length > 100, 'agent.py should contain substantial code');

    // swarm-starter template should include commerce-related code
    // (PaymentService, PricingTable, etc.)
    assert.ok(
      agentCode.includes('Payment') || agentCode.includes('pricing') || agentCode.includes('Pricing') || agentCode.includes('commerce'),
      'swarm-starter template should include commerce stack references',
    );
  });

  // CLI-04: scaffold <name> --json returns JSON with files[] and path
  it('CLI-04: scaffold <name> --json returns JSON with files[] and directory', () => {
    const program = makeProgram();
    registerScaffoldCommand(program);
    program.parse(['node', 'agentlaunch', 'scaffold', 'json-agent', '--json']);

    const result = parseJsonOutput() as {
      name: string;
      type: string;
      template: string;
      directory: string;
      files: string[];
    };

    assert.equal(result.name, 'json-agent');
    assert.equal(result.type, 'chat-memory'); // default type
    assert.ok(result.directory.includes('json-agent'), 'directory should contain agent name');
    assert.ok(Array.isArray(result.files), 'files should be an array');
    assert.equal(result.files.length, 7, 'Should have 7 files');
    assert.ok(result.files.includes('agent.py'), 'files should include agent.py');
    assert.ok(result.files.includes('README.md'), 'files should include README.md');
    assert.ok(result.files.includes('.env.example'), 'files should include .env.example');
    assert.ok(result.files.includes('CLAUDE.md'), 'files should include CLAUDE.md');
    assert.ok(result.files.includes('.claude/settings.json'), 'files should include .claude/settings.json');
    assert.ok(result.files.includes('.mcp.json'), 'files should include .mcp.json');
    assert.ok(result.files.includes('agentlaunch.config.json'), 'files should include agentlaunch.config.json');

    // In JSON mode, no human-readable messages should be present
    // (only the JSON object itself)
    const nonJsonLines = logOutput.filter((line) => {
      try { JSON.parse(line); return false; } catch { return true; }
    });
    assert.equal(nonJsonLines.length, 0, 'JSON mode should not produce non-JSON output');
  });
});

// ---------------------------------------------------------------------------
// deploy tests (CLI-05 through CLI-06)
// ---------------------------------------------------------------------------

describe('deploy command', () => {
  let tmpDir: string;
  let origCwd: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-deploy-test-'));
    origCwd = process.cwd();
    process.chdir(tmpDir);
    captureOutput();
    mockExit();
    // Ensure API key is available
    process.env.AGENTVERSE_API_KEY = 'av-test-key-deploy';
  });

  afterEach(() => {
    process.chdir(origCwd);
    restoreOutput();
    restoreExit();
    restoreFetch();
    delete process.env.AGENTVERSE_API_KEY;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  // CLI-05: deploy --file agent.py calls SDK deployAgent()
  it('CLI-05: deploy --file agent.py calls Agentverse API via deployAgent()', async () => {
    // Create a temp agent.py
    const agentPy = path.join(tmpDir, 'agent.py');
    fs.writeFileSync(agentPy, '# test agent\nfrom uagents import Agent\nagent = Agent()\n');

    const agentAddress = 'agent1qtestdeployaddress1234567890abcdefghijk';
    let createCalled = false;
    let codeCalled = false;
    let startCalled = false;
    let statusPolled = false;

    mockFetch(async (url: string | URL | Request) => {
      const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;

      // POST /v1/hosting/agents (create agent)
      if (urlStr.includes('/hosting/agents') && !urlStr.includes('/code') && !urlStr.includes('/start') && !urlStr.includes('/secrets')) {
        // Check if it's a GET (status poll) or POST (create)
        // The GET for status goes to /hosting/agents/{addr} specifically
        if (urlStr.endsWith('/hosting/agents') || urlStr.match(/\/hosting\/agents$/)) {
          createCalled = true;
          return jsonResponse({ address: agentAddress, name: 'Test Agent' });
        }
        // GET status: /hosting/agents/{address}
        if (urlStr.includes(agentAddress)) {
          statusPolled = true;
          return jsonResponse({
            address: agentAddress,
            running: true,
            compiled: true,
            wallet_address: 'fetch1testwallet123',
          });
        }
        createCalled = true;
        return jsonResponse({ address: agentAddress, name: 'Test Agent' });
      }

      // PUT /hosting/agents/{addr}/code
      if (urlStr.includes('/code')) {
        codeCalled = true;
        return jsonResponse({ digest: 'abc123' });
      }

      // POST /hosting/agents/{addr}/start
      if (urlStr.includes('/start')) {
        startCalled = true;
        return jsonResponse({});
      }

      // POST /hosting/secrets
      if (urlStr.includes('/secrets')) {
        return jsonResponse({});
      }

      return jsonResponse({ error: 'unexpected request' }, 404);
    });

    const program = makeProgram();
    registerDeployCommand(program);
    await program.parseAsync(['node', 'agentlaunch', 'deploy', '--file', 'agent.py', '--name', 'Test Agent']);

    const output = allOutput();
    assert.ok(output.includes('Deploying'), 'Should print deploying message');
    assert.ok(output.includes(agentAddress), 'Should print agent address');
    assert.ok(output.includes('DEPLOYMENT SUCCESSFUL') || output.includes('agentAddress'), 'Should indicate success');
    assert.ok(createCalled || codeCalled, 'Should have called Agentverse API');
  });

  // CLI-06: deploy --json returns JSON with agentAddress, status
  it('CLI-06: deploy --json returns JSON with agentAddress and status', async () => {
    const agentPy = path.join(tmpDir, 'agent.py');
    fs.writeFileSync(agentPy, '# test agent\nfrom uagents import Agent\nagent = Agent()\n');

    const agentAddress = 'agent1qtestjsondeployabcdefghijklmnop';

    mockFetch(async (url: string | URL | Request) => {
      const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;

      if (urlStr.includes('/code')) {
        return jsonResponse({ digest: 'abc123' });
      }
      if (urlStr.includes('/start')) {
        return jsonResponse({});
      }
      if (urlStr.includes('/secrets')) {
        return jsonResponse({});
      }
      if (urlStr.includes('/hosting/agents')) {
        // Could be create or status poll -- differentiate by path
        if (urlStr.includes(agentAddress)) {
          // Status poll
          return jsonResponse({
            address: agentAddress,
            running: true,
            compiled: true,
            wallet_address: 'fetch1wallet456',
          });
        }
        // Create
        return jsonResponse({ address: agentAddress, name: 'JSON Deploy Agent' });
      }

      return jsonResponse({ error: 'unexpected' }, 404);
    });

    const program = makeProgram();
    registerDeployCommand(program);
    await program.parseAsync(['node', 'agentlaunch', 'deploy', '--file', 'agent.py', '--json']);

    const result = parseJsonOutput() as {
      agentAddress: string;
      walletAddress: string;
      status: string;
      agentverseUrl: string;
      optimization: unknown[];
    };

    assert.equal(result.agentAddress, agentAddress);
    assert.ok(result.walletAddress, 'Should include wallet address');
    assert.ok(
      result.status === 'compiled' || result.status === 'running',
      `Status should be compiled or running, got: ${result.status}`,
    );
    assert.ok(result.agentverseUrl, 'Should include Agentverse URL');
    assert.ok(Array.isArray(result.optimization), 'Should include optimization checklist');
  });
});

// ---------------------------------------------------------------------------
// tokenize tests (CLI-07 through CLI-08)
// ---------------------------------------------------------------------------

describe('tokenize command', () => {
  beforeEach(() => {
    captureOutput();
    mockExit();
    process.env.AGENTVERSE_API_KEY = 'av-test-key-tokenize';
  });

  afterEach(() => {
    restoreOutput();
    restoreExit();
    restoreFetch();
    delete process.env.AGENTVERSE_API_KEY;
  });

  // CLI-07: tokenize --agent X --name Y --symbol Z calls POST /agents/tokenize
  it('CLI-07: tokenize --agent X --name Y --symbol Z calls POST /agents/tokenize', async () => {
    let postPath = '';
    let postBody: Record<string, unknown> = {};

    mockFetch(async (url: string | URL | Request, init?: RequestInit) => {
      const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;

      if (urlStr.includes('/agents/tokenize')) {
        postPath = '/agents/tokenize';
        postBody = JSON.parse(init?.body as string ?? '{}');
        return jsonResponse({
          token_id: 42,
          token_address: '0xTestTokenAddress123',
          status: 'pending',
          handoff_link: 'https://agent-launch.ai/deploy/42',
        });
      }

      return jsonResponse({ error: 'unexpected' }, 404);
    });

    const program = makeProgram();
    registerTokenizeCommand(program);
    await program.parseAsync([
      'node', 'agentlaunch', 'tokenize',
      '--agent', 'agent1qtestagentaddress12345678901234567890abc',
      '--name', 'TestToken',
      '--symbol', 'TEST',
    ]);

    assert.equal(postPath, '/agents/tokenize', 'Should call POST /agents/tokenize');
    assert.equal(postBody.agentAddress, 'agent1qtestagentaddress12345678901234567890abc');
    assert.equal(postBody.name, 'TestToken');
    assert.equal(postBody.symbol, 'TEST');

    const output = allOutput();
    assert.ok(output.includes('TOKEN RECORD CREATED'), 'Should print success message');
    assert.ok(output.includes('42'), 'Should show token ID');
    assert.ok(output.includes('deploy/42'), 'Should show handoff link');
  });

  // CLI-08: tokenize --json returns JSON with tokenId, handoffLink
  it('CLI-08: tokenize --json returns JSON with tokenId and handoffLink', async () => {
    mockFetch(async (url: string | URL | Request) => {
      const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;

      if (urlStr.includes('/agents/tokenize')) {
        return jsonResponse({
          token_id: 99,
          token_address: '0xJsonTokenAddress456',
          status: 'pending',
        });
      }

      return jsonResponse({ error: 'unexpected' }, 404);
    });

    const program = makeProgram();
    registerTokenizeCommand(program);
    await program.parseAsync([
      'node', 'agentlaunch', 'tokenize',
      '--agent', 'agent1qtestagentjsonmode12345678901234567890xyz',
      '--name', 'JSONToken',
      '--symbol', 'JSNT',
      '--json',
    ]);

    const result = parseJsonOutput() as {
      tokenId: number;
      tokenAddress: string;
      status: string;
      handoffLink: string;
      maxWalletAmount: number;
      initialBuyAmount: number;
      category: { id: number };
      deployFee: string;
      tradingFee: string;
    };

    assert.equal(result.tokenId, 99);
    assert.equal(result.tokenAddress, '0xJsonTokenAddress456');
    assert.equal(result.status, 'pending');
    assert.ok(result.handoffLink, 'Should include handoff link');
    assert.ok(result.handoffLink.includes('/deploy/99'), 'Handoff link should contain token ID');
    assert.equal(result.maxWalletAmount, 0, 'Default max wallet should be 0');
    assert.equal(result.initialBuyAmount, 0, 'Default initial buy should be 0');
    assert.ok(result.deployFee.includes('120'), 'Deploy fee should mention 120 FET');
    assert.ok(result.tradingFee.includes('2%'), 'Trading fee should mention 2%');
  });
});

// ---------------------------------------------------------------------------
// list tests (CLI-09 through CLI-10)
// ---------------------------------------------------------------------------

describe('list command', () => {
  beforeEach(() => {
    captureOutput();
    mockExit();
  });

  afterEach(() => {
    restoreOutput();
    restoreExit();
    restoreFetch();
  });

  // CLI-09: list --limit 5 --sort trending fetches GET /tokens?limit=5&sort=trending
  it('CLI-09: list --limit 5 --sort trending fetches correct endpoint with query params', async () => {
    let requestedUrl = '';

    mockFetch(async (url: string | URL | Request) => {
      const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;
      requestedUrl = urlStr;

      return jsonResponse({
        data: [
          { id: 1, name: 'Alpha', symbol: 'ALPH', price: '0.001', progress: 5.2, status: 'active' },
          { id: 2, name: 'Beta', symbol: 'BETA', price: '0.05', progress: 12.0, status: 'active' },
          { id: 3, name: 'Gamma', symbol: 'GAMM', price: '1.5', progress: 45.3, listed: true },
          { id: 4, name: 'Delta', symbol: 'DELT', price: '0.0000001', progress: 0.1, status: 'active' },
          { id: 5, name: 'Epsilon', symbol: 'EPSI', price: '250', progress: 99.9, status: 'listed' },
        ],
        total: 50,
      });
    });

    const program = makeProgram();
    registerListCommand(program);
    await program.parseAsync(['node', 'agentlaunch', 'list', '--limit', '5', '--sort', 'trending']);

    // Verify the URL contains the correct query parameters
    assert.ok(requestedUrl.includes('/tokens'), 'Should call /tokens endpoint');
    assert.ok(requestedUrl.includes('limit=5'), 'Should pass limit=5');
    assert.ok(requestedUrl.includes('sort=trending'), 'Should pass sort=trending');

    const output = allOutput();
    assert.ok(output.includes('Alpha'), 'Should display token name Alpha');
    assert.ok(output.includes('BETA'), 'Should display token symbol BETA');
    assert.ok(output.includes('trending'), 'Should mention sort order');
    assert.ok(output.includes('5'), 'Should mention limit');
  });

  // CLI-10: list --json returns JSON array of tokens
  it('CLI-10: list --json returns JSON with tokens array', async () => {
    const tokenData = [
      { id: 1, name: 'TokenA', symbol: 'TOKA', price: '0.01', progress: 10 },
      { id: 2, name: 'TokenB', symbol: 'TOKB', price: '0.50', progress: 25 },
    ];

    mockFetch(async () => {
      return jsonResponse({ data: tokenData, total: 2 });
    });

    const program = makeProgram();
    registerListCommand(program);
    await program.parseAsync(['node', 'agentlaunch', 'list', '--json']);

    const result = parseJsonOutput() as { tokens: unknown[]; total: number };

    assert.ok(Array.isArray(result.tokens), 'Should return tokens array');
    assert.equal(result.tokens.length, 2, 'Should have 2 tokens');
    assert.equal(result.total, 2, 'Total should be 2');
    assert.deepEqual(result.tokens, tokenData, 'Tokens should match fixture data');
  });
});

// ---------------------------------------------------------------------------
// status tests (CLI-11 through CLI-12)
// ---------------------------------------------------------------------------

describe('status command', () => {
  beforeEach(() => {
    captureOutput();
    mockExit();
  });

  afterEach(() => {
    restoreOutput();
    restoreExit();
    restoreFetch();
  });

  // CLI-11: status 0xABC fetches GET /tokens/address/0xABC
  it('CLI-11: status 0xABC fetches GET /tokens/address/0xABC', async () => {
    const tokenAddress = '0xABCDEF1234567890ABCDEF1234567890ABCDEF12';
    let requestedUrl = '';

    mockFetch(async (url: string | URL | Request) => {
      const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;
      requestedUrl = urlStr;

      return jsonResponse({
        name: 'StatusToken',
        symbol: 'STAT',
        token_address: tokenAddress,
        price: '0.0025',
        market_cap: '1500',
        holder_count: 42,
        progress: 5.0,
        status: 'active',
        chainId: 97,
        description: 'A test token for status checks',
        created_at: '2026-03-01T00:00:00Z',
      });
    });

    const program = makeProgram();
    registerStatusCommand(program);
    await program.parseAsync(['node', 'agentlaunch', 'status', tokenAddress]);

    assert.ok(
      requestedUrl.includes(`/tokens/address/${tokenAddress}`),
      `Should call /tokens/address/${tokenAddress}, got: ${requestedUrl}`,
    );

    const output = allOutput();
    assert.ok(output.includes('TOKEN STATUS'), 'Should print TOKEN STATUS header');
    assert.ok(output.includes('StatusToken'), 'Should display token name');
    assert.ok(output.includes('STAT'), 'Should display token symbol');
    assert.ok(output.includes(tokenAddress), 'Should display token address');
    assert.ok(output.includes('42'), 'Should display holder count');
    assert.ok(output.includes('BSC Testnet'), 'Should display chain name');
  });

  // CLI-12: status --json returns JSON with price, progress, status
  it('CLI-12: status --json returns JSON with token details', async () => {
    const tokenAddress = '0x1234567890ABCDEF1234567890ABCDEF12345678';

    const tokenDetail = {
      name: 'JSONStatusToken',
      symbol: 'JSTS',
      token_address: tokenAddress,
      price: '0.15',
      market_cap: '25000',
      holder_count: 100,
      progress: 83.33,
      status: 'active',
      chainId: 97,
    };

    mockFetch(async () => {
      return jsonResponse(tokenDetail);
    });

    const program = makeProgram();
    registerStatusCommand(program);
    await program.parseAsync(['node', 'agentlaunch', 'status', tokenAddress, '--json']);

    const result = parseJsonOutput() as typeof tokenDetail;

    assert.equal(result.name, 'JSONStatusToken');
    assert.equal(result.symbol, 'JSTS');
    assert.equal(result.price, '0.15');
    assert.equal(result.progress, 83.33);
    assert.equal(result.status, 'active');
    assert.equal(result.holder_count, 100);
    assert.equal(result.token_address, tokenAddress);
  });
});

// ---------------------------------------------------------------------------
// holders tests (CLI-13 through CLI-14)
// ---------------------------------------------------------------------------

describe('holders command', () => {
  beforeEach(() => {
    captureOutput();
    mockExit();
  });

  afterEach(() => {
    restoreOutput();
    restoreExit();
    restoreFetch();
  });

  // CLI-13: holders 0xABC fetches GET /agents/token/0xABC/holders
  it('CLI-13: holders 0xABC fetches GET /agents/token/0xABC/holders', async () => {
    const tokenAddress = '0xHOLDERS_TEST_ADDRESS_1234567890ABCDEF';
    let requestedUrl = '';

    mockFetch(async (url: string | URL | Request) => {
      const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;
      requestedUrl = urlStr;

      return jsonResponse({
        success: true,
        data: {
          holders: [
            { address: '0xHolder1ABCDEF1234567890', token_percentage: 45.5, balance: 455000000, creator: true },
            { address: '0xHolder2ABCDEF1234567890', token_percentage: 30.0, balance: 300000000, creator: false },
            { address: '0xHolder3ABCDEF1234567890', token_percentage: 24.5, balance: 245000000, creator: false },
          ],
          total: 3,
        },
      });
    });

    const program = makeProgram();
    registerHoldersCommand(program);
    await program.parseAsync(['node', 'agentlaunch', 'holders', tokenAddress]);

    assert.ok(
      requestedUrl.includes(`/agents/token/${tokenAddress}/holders`),
      `Should call /agents/token/${tokenAddress}/holders, got: ${requestedUrl}`,
    );

    const output = allOutput();
    assert.ok(output.includes('Token Holders'), 'Should print Token Holders header');
    assert.ok(output.includes('0xHolder1'), 'Should display first holder address');
    assert.ok(output.includes('45.50%'), 'Should display holder percentage');
    assert.ok(output.includes('3 holder(s)'), 'Should show holder count');
    assert.ok(output.includes('* = creator'), 'Should indicate creator marker');
  });

  // CLI-14: holders --json returns JSON array of holders
  it('CLI-14: holders --json returns JSON with holders array', async () => {
    const tokenAddress = '0xHOLDERS_JSON_ADDRESS_1234567890ABCDEF';

    const holdersData = [
      { address: '0xHolderA123', token_percentage: 60.0, balance: 600000000 },
      { address: '0xHolderB456', token_percentage: 40.0, balance: 400000000 },
    ];

    mockFetch(async () => {
      return jsonResponse(holdersData);
    });

    const program = makeProgram();
    registerHoldersCommand(program);
    await program.parseAsync(['node', 'agentlaunch', 'holders', tokenAddress, '--json']);

    const result = parseJsonOutput() as { holders: typeof holdersData; total: number };

    assert.ok(Array.isArray(result.holders), 'Should return holders array');
    assert.equal(result.holders.length, 2, 'Should have 2 holders');
    assert.equal(result.total, 2, 'Total should be 2');
    assert.equal(result.holders[0].address, '0xHolderA123');
    assert.equal(result.holders[0].token_percentage, 60.0);
    assert.equal(result.holders[1].address, '0xHolderB456');
  });
});

// ---------------------------------------------------------------------------
// Bonus: comments tests (completing coverage for comments command)
// ---------------------------------------------------------------------------

describe('comments command', () => {
  beforeEach(() => {
    captureOutput();
    mockExit();
  });

  afterEach(() => {
    restoreOutput();
    restoreExit();
    restoreFetch();
  });

  it('comments <address> lists comments via GET /comments/{address}', async () => {
    const tokenAddress = '0xCOMMENTS_TEST_ADDRESS_1234567890ABCDEF';
    let requestedUrl = '';

    mockFetch(async (url: string | URL | Request) => {
      const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;
      requestedUrl = urlStr;

      return jsonResponse({
        data: [
          { id: 1, message: 'Great token!', user: { username: 'alice' }, created_at: '2026-03-01T10:00:00Z' },
          { id: 2, message: 'Looking forward to graduation', user: { username: 'bob' }, created_at: '2026-03-02T15:30:00Z' },
        ],
      });
    });

    const program = makeProgram();
    registerCommentsCommand(program);
    await program.parseAsync(['node', 'agentlaunch', 'comments', tokenAddress]);

    assert.ok(
      requestedUrl.includes(`/comments/${tokenAddress}`),
      `Should call /comments/${tokenAddress}, got: ${requestedUrl}`,
    );

    const output = allOutput();
    assert.ok(output.includes('Great token!'), 'Should display first comment');
    assert.ok(output.includes('alice'), 'Should display commenter username');
    assert.ok(output.includes('bob'), 'Should display second commenter');
    assert.ok(output.includes('2 comment(s)'), 'Should show comment count');
  });

  it('comments <address> --json returns JSON with comments array', async () => {
    const tokenAddress = '0xCOMMENTS_JSON_ADDRESS_1234567890ABCDEF';

    const commentsData = [
      { id: 1, message: 'First comment', user: { username: 'user1' }, created_at: '2026-03-01T10:00:00Z' },
    ];

    mockFetch(async () => {
      return jsonResponse({ data: commentsData });
    });

    const program = makeProgram();
    registerCommentsCommand(program);
    await program.parseAsync(['node', 'agentlaunch', 'comments', tokenAddress, '--json']);

    const result = parseJsonOutput() as { comments: typeof commentsData; total: number };

    assert.ok(Array.isArray(result.comments), 'Should return comments array');
    assert.equal(result.comments.length, 1, 'Should have 1 comment');
    assert.equal(result.total, 1, 'Total should be 1');
    assert.equal(result.comments[0].message, 'First comment');
  });

  it('comments <address> --post <message> calls POST /comments/{address}', async () => {
    const tokenAddress = '0xCOMMENTS_POST_ADDRESS_1234567890ABCDEF';
    let postUrl = '';
    let postBody: Record<string, unknown> = {};

    // Need API key for posting
    process.env.AGENTVERSE_API_KEY = 'av-test-key-comments';

    mockFetch(async (url: string | URL | Request, init?: RequestInit) => {
      const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;
      postUrl = urlStr;
      if (init?.body) {
        postBody = JSON.parse(init.body as string);
      }

      return jsonResponse({
        id: 10,
        message: 'My new comment',
        created_at: '2026-03-05T12:00:00Z',
      });
    });

    const program = makeProgram();
    registerCommentsCommand(program);
    await program.parseAsync([
      'node', 'agentlaunch', 'comments', tokenAddress,
      '--post', 'My new comment',
    ]);

    assert.ok(
      postUrl.includes(`/comments/${tokenAddress}`),
      `Should call /comments/${tokenAddress}`,
    );
    assert.equal(postBody.message, 'My new comment', 'Should send the comment message');

    const output = allOutput();
    assert.ok(output.includes('Comment posted successfully'), 'Should confirm comment was posted');

    delete process.env.AGENTVERSE_API_KEY;
  });
});
