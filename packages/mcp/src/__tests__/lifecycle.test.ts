/**
 * MCP lifecycle tests
 *
 * Covers 8 gaps:
 *   MCP-S01   Server startup -- TOOLS array contains 33 tools
 *   MCP-HO01  create_token_record returns handoff link
 *   MCP-AV01  deploy_to_agentverse validates file exists and non-empty
 *   MCP-AV02  deploy_to_agentverse returns agentAddress + optimization checklist
 *   MCP-AV03  update_agent_metadata updates README/description/avatar
 *   MCP-TK01  create_and_tokenize full lifecycle: scaffold -> deploy -> tokenize
 *   MCP-TK02  create_and_tokenize returns handoff link
 *   MCP-TK03  create_and_tokenize continues if deploy fails (non-fatal)
 *
 * Uses node:test + node:assert/strict. All network calls mocked via globalThis.fetch.
 */

import { describe, it, afterEach, before, after } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

import { TOOLS } from '../index.js';
import { handoffHandlers } from '../tools/handoff.js';
import { agentverseHandlers } from '../tools/agentverse.js';

// ---------------------------------------------------------------------------
// Fetch mock helpers
// ---------------------------------------------------------------------------

const originalFetch = globalThis.fetch;
let restoreFn: (() => void) | undefined;

function installFetchMock(
  mock: (url: string | URL | Request, init?: RequestInit) => Promise<Response>,
): () => void {
  globalThis.fetch = mock as typeof globalThis.fetch;
  return () => {
    globalThis.fetch = originalFetch;
  };
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

afterEach(() => {
  if (restoreFn) {
    restoreFn();
    restoreFn = undefined;
  }
});

// ---------------------------------------------------------------------------
// Shared constants
// ---------------------------------------------------------------------------

const ADDR = '0x' + 'a'.repeat(40);
const AGENT_ADDR = 'agent1q' + 'b'.repeat(56);

// =========================================================================
// 1. MCP-S01: Server startup -- TOOLS array
// =========================================================================

describe('MCP-S01: Server startup', () => {
  it('TOOLS array can be imported from index module', () => {
    assert.ok(Array.isArray(TOOLS), 'TOOLS should be an array');
  });

  it('TOOLS array has exactly 41 tools', () => {
    assert.equal(
      TOOLS.length,
      41,
      `Expected 41 tools, got ${TOOLS.length}: ${TOOLS.map((t) => t.name).join(', ')}`,
    );
  });

  it('TOOLS array includes all lifecycle tools', () => {
    const names = TOOLS.map((t) => t.name);
    const required = [
      'create_token_record',
      'deploy_to_agentverse',
      'update_agent_metadata',
      'create_and_tokenize',
    ];
    for (const name of required) {
      assert.ok(names.includes(name), `TOOLS should include ${name}`);
    }
  });
});

// =========================================================================
// 2. MCP-HO01: create_token_record
// =========================================================================

describe('MCP-HO01: create_token_record', () => {
  let savedKey: string | undefined;
  before(() => {
    savedKey = process.env.AGENTVERSE_API_KEY;
    process.env.AGENTVERSE_API_KEY = 'av-test-lifecycle-key';
  });
  after(() => {
    if (savedKey !== undefined) process.env.AGENTVERSE_API_KEY = savedKey;
    else delete process.env.AGENTVERSE_API_KEY;
  });

  it('creates token and returns handoff link + instructions', async () => {
    const apiResponse = {
      tokenId: 42,
      handoffLink: 'https://agent-launch.ai/deploy/42',
    };

    restoreFn = installFetchMock((_url, init) => {
      // Verify it sends a POST request
      assert.equal(init?.method, 'POST', 'should POST to /agents/tokenize');
      const body = JSON.parse(init?.body as string);
      assert.equal(body.name, 'TestToken');
      assert.equal(body.symbol, 'TST');
      assert.equal(body.chainId, 97);
      return Promise.resolve(makeResponse(apiResponse));
    });

    // Re-import to pick up the env var (module-level client caches API key)
    const { handoffHandlers: freshHandlers } = await import(`../tools/handoff.js?t=${Date.now()}`);
    const result = await freshHandlers.create_token_record({
      name: 'TestToken',
      symbol: 'TST',
      description: 'A test token for lifecycle testing',
      category: 'AI',
      agentAddress: AGENT_ADDR,
    });

    assert.equal(result.tokenId, 42, 'should return tokenId from API response');
    assert.equal(
      result.handoffLink,
      'https://agent-launch.ai/deploy/42',
      'should return handoffLink from API response',
    );
    assert.ok(result.instructions, 'should include deployment instructions');
    assert.ok(result.instructions.step1, 'instructions should have step1');
    assert.ok(result.instructions.step5, 'instructions should have step5');
  });
});

// =========================================================================
// 3. MCP-AV01: deploy_to_agentverse validates file
// =========================================================================

describe('MCP-AV01: deploy_to_agentverse file validation', () => {
  let tmpDir: string;
  let savedCwd: string;

  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-lifecycle-test-'));
    savedCwd = process.cwd();
    process.chdir(tmpDir);
  });

  after(() => {
    process.chdir(savedCwd);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('rejects when agent file does not exist', async () => {
    // Use relative path so both CWD and file resolve through same symlink chain
    await assert.rejects(
      () =>
        agentverseHandlers.deploy_to_agentverse({
          apiKey: 'av-test-key',
          agentFile: 'nonexistent.py',
        }),
      /Agent file not found/,
      'should throw "Agent file not found" error',
    );
  });

  it('rejects when agent file is empty', async () => {
    // Write the empty file in CWD (which is tmpDir)
    fs.writeFileSync(path.join(process.cwd(), 'empty.py'), '');

    await assert.rejects(
      () =>
        agentverseHandlers.deploy_to_agentverse({
          apiKey: 'av-test-key',
          agentFile: 'empty.py',
        }),
      /Agent file is empty/,
      'should throw "Agent file is empty" error',
    );
  });
});

// =========================================================================
// 4. MCP-AV02: deploy_to_agentverse returns agentAddress + checklist
// =========================================================================

describe('MCP-AV02: deploy_to_agentverse returns result', () => {
  let tmpDir: string;
  let savedCwd: string;
  let agentFile: string;

  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-av02-test-'));
    savedCwd = process.cwd();
    process.chdir(tmpDir);
    // Use relative path to avoid macOS /tmp -> /private/tmp symlink mismatch
    agentFile = 'agent.py';
    fs.writeFileSync(path.join(process.cwd(), agentFile), 'from uagents import Agent\nagent = Agent()\n');
  });

  after(() => {
    process.chdir(savedCwd);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns agentAddress and status after successful deploy', async () => {
    let callCount = 0;

    restoreFn = installFetchMock((url, init) => {
      const u = String(url);
      callCount++;

      // Step 1: POST /hosting/agents -> create agent
      if (u.includes('/hosting/agents') && init?.method === 'POST' && !u.includes('/start') && !u.includes('/secrets')) {
        return Promise.resolve(
          makeResponse({
            address: AGENT_ADDR,
            name: 'agent',
          }),
        );
      }

      // Step 2: PUT .../code -> upload code
      if (u.includes('/code') && init?.method === 'PUT') {
        return Promise.resolve(makeResponse({ digest: 'abc123' }));
      }

      // Step 3: POST /hosting/secrets -> set secrets
      if (u.includes('/secrets') && init?.method === 'POST') {
        return Promise.resolve(makeResponse({}));
      }

      // Step 4: POST .../start -> start agent
      if (u.includes('/start') && init?.method === 'POST') {
        return Promise.resolve(makeResponse({}));
      }

      // Step 5: GET .../agents/{addr} -> poll status
      if (u.includes(`/hosting/agents/${AGENT_ADDR}`) && (!init?.method || init?.method === 'GET')) {
        return Promise.resolve(
          makeResponse({
            address: AGENT_ADDR,
            running: true,
            compiled: true,
            wallet_address: 'fetch1abc123',
          }),
        );
      }

      return Promise.resolve(makeResponse({ error: 'unexpected' }, 500));
    });

    const result = await agentverseHandlers.deploy_to_agentverse({
      apiKey: 'av-test-key',
      agentFile: agentFile,
      agentName: 'TestAgent',
      readme: '# Test Agent\nA test.',
      shortDescription: 'A test agent',
    });

    assert.equal(result.success, true, 'should report success');
    assert.equal(result.agentAddress, AGENT_ADDR, 'should return the agent address');
    assert.ok(
      result.status === 'running' || result.status === 'compiled',
      `status should be running or compiled, got: ${result.status}`,
    );
  });
});

// =========================================================================
// 5. MCP-AV03: update_agent_metadata
// =========================================================================

describe('MCP-AV03: update_agent_metadata', () => {
  it('updates README, description, and avatar and returns optimization checklist', async () => {
    let capturedUrl = '';
    let capturedBody: Record<string, unknown> = {};

    restoreFn = installFetchMock((url, init) => {
      capturedUrl = String(url);
      if (init?.body) {
        capturedBody = JSON.parse(init.body as string);
      }
      return Promise.resolve(makeResponse({}));
    });

    const result = await agentverseHandlers.update_agent_metadata({
      apiKey: 'av-test-key',
      agentAddress: AGENT_ADDR,
      readme: '# Updated README\n\nNew content.',
      shortDescription: 'Updated short description',
      avatarUrl: 'https://example.com/avatar.png',
    });

    // Verify the PUT was sent to the correct URL
    assert.ok(
      capturedUrl.includes(`/hosting/agents/${AGENT_ADDR}`),
      `should PUT to /hosting/agents/{addr}, got: ${capturedUrl}`,
    );

    // Verify all three fields were sent
    assert.equal(capturedBody.readme, '# Updated README\n\nNew content.');
    assert.equal(capturedBody.short_description, 'Updated short description');
    assert.equal(capturedBody.avatar_url, 'https://example.com/avatar.png');

    // Verify result shape
    assert.equal(result.success, true, 'should report success');
    assert.ok(Array.isArray(result.updatedFields), 'updatedFields should be an array');
    assert.ok(result.updatedFields.includes('readme'), 'should include readme in updatedFields');
    assert.ok(
      result.updatedFields.includes('short_description'),
      'should include short_description in updatedFields',
    );
    assert.ok(
      result.updatedFields.includes('avatar_url'),
      'should include avatar_url in updatedFields',
    );
    assert.ok(Array.isArray(result.optimization), 'should include optimization checklist');
    assert.ok(result.optimization.length > 0, 'optimization checklist should have items');

    // Verify the checklist marks provided fields as done
    const readmeItem = result.optimization.find(
      (item: { factor: string }) => item.factor === 'README',
    );
    assert.ok(readmeItem, 'checklist should include README factor');
    assert.equal(readmeItem.done, true, 'README factor should be marked done');

    const descItem = result.optimization.find(
      (item: { factor: string }) => item.factor === 'Short Description',
    );
    assert.ok(descItem, 'checklist should include Short Description factor');
    assert.equal(descItem.done, true, 'Short Description factor should be marked done');
  });
});

// =========================================================================
// 6. MCP-TK01: create_and_tokenize full lifecycle
// =========================================================================

describe('MCP-TK01: create_and_tokenize full lifecycle', () => {
  let savedKey: string | undefined;

  before(() => {
    savedKey = process.env['AGENTVERSE_API_KEY'];
    process.env['AGENTVERSE_API_KEY'] = 'av-test-key';
  });

  after(() => {
    if (savedKey) process.env['AGENTVERSE_API_KEY'] = savedKey;
    else delete process.env['AGENTVERSE_API_KEY'];
  });

  it('scaffolds code, deploys, and tokenizes in one call', async () => {
    // Dynamic import so the module picks up the env var set above
    const mod = await import(`../tools/tokenize.js?t=tk01-${Date.now()}`);

    restoreFn = installFetchMock((url, init) => {
      const u = String(url);

      // Agentverse: create agent
      if (u.includes('agentverse.ai') && u.includes('/hosting/agents') && init?.method === 'POST' && !u.includes('/start') && !u.includes('/secrets')) {
        return Promise.resolve(
          makeResponse({ address: AGENT_ADDR, name: 'TestBot' }),
        );
      }

      // Agentverse: upload code
      if (u.includes('agentverse.ai') && u.includes('/code') && init?.method === 'PUT') {
        return Promise.resolve(makeResponse({ digest: 'digest123' }));
      }

      // Agentverse: set secrets
      if (u.includes('agentverse.ai') && u.includes('/secrets') && init?.method === 'POST') {
        return Promise.resolve(makeResponse({}));
      }

      // Agentverse: start agent
      if (u.includes('agentverse.ai') && u.includes('/start')) {
        return Promise.resolve(makeResponse({}));
      }

      // Agentverse: poll status
      if (u.includes('agentverse.ai') && u.includes(`/hosting/agents/${AGENT_ADDR}`) && (!init?.method || init?.method === 'GET')) {
        return Promise.resolve(
          makeResponse({
            address: AGENT_ADDR,
            running: true,
            compiled: true,
            wallet_address: 'fetch1xyz',
          }),
        );
      }

      // AgentLaunch: POST /agents/tokenize
      if (u.includes('/agents/tokenize') && init?.method === 'POST') {
        const body = JSON.parse(init?.body as string);
        assert.equal(body.name, 'TestBot', 'tokenize payload should have name');
        assert.ok(body.symbol, 'tokenize payload should have symbol');
        return Promise.resolve(
          makeResponse({
            tokenId: 99,
            handoffLink: 'https://agent-launch.ai/deploy/99',
            address: ADDR,
          }),
        );
      }

      return Promise.resolve(makeResponse({}, 200));
    });

    const result = await mod.tokenizeHandlers.create_and_tokenize({
      name: 'TestBot',
      description: 'A test bot for lifecycle testing',
    });

    assert.equal(result.success, true, 'should report success');
    assert.ok(result.agentCode, 'should include scaffolded agent code');
    assert.ok(result.agentCode.length > 50, 'agent code should be substantial');
    assert.equal(result.agentAddress, AGENT_ADDR, 'should return agent address from deploy');
    assert.equal(result.tokenId, 99, 'should return tokenId from tokenize API');
  });
});

// =========================================================================
// 7. MCP-TK02: create_and_tokenize returns handoff link
// =========================================================================

describe('MCP-TK02: create_and_tokenize returns handoff link', () => {
  let savedKey: string | undefined;

  before(() => {
    savedKey = process.env['AGENTVERSE_API_KEY'];
    process.env['AGENTVERSE_API_KEY'] = 'av-test-key';
  });

  after(() => {
    if (savedKey) process.env['AGENTVERSE_API_KEY'] = savedKey;
    else delete process.env['AGENTVERSE_API_KEY'];
  });

  it('result includes handoffLink and deployLink', async () => {
    const mod = await import(`../tools/tokenize.js?t=tk02-${Date.now()}`);

    restoreFn = installFetchMock((url, init) => {
      const u = String(url);

      // Agentverse calls -- all succeed with minimal responses
      if (u.includes('agentverse.ai')) {
        if (u.includes('/hosting/agents') && init?.method === 'POST' && !u.includes('/start') && !u.includes('/secrets')) {
          return Promise.resolve(makeResponse({ address: AGENT_ADDR }));
        }
        if (u.includes('/code')) return Promise.resolve(makeResponse({ digest: 'd' }));
        if (u.includes('/secrets')) return Promise.resolve(makeResponse({}));
        if (u.includes('/start')) return Promise.resolve(makeResponse({}));
        // poll status
        return Promise.resolve(
          makeResponse({ running: true, compiled: true, address: AGENT_ADDR }),
        );
      }

      // AgentLaunch: tokenize
      if (u.includes('/agents/tokenize')) {
        return Promise.resolve(
          makeResponse({
            tokenId: 77,
            handoffLink: 'https://agent-launch.ai/deploy/77',
            address: ADDR,
          }),
        );
      }

      return Promise.resolve(makeResponse({}));
    });

    const result = await mod.tokenizeHandlers.create_and_tokenize({
      name: 'LinkBot',
      description: 'Testing handoff link presence',
    });

    assert.ok(result.handoffLink, 'result should have handoffLink');
    assert.ok(
      result.handoffLink.includes('/deploy/'),
      `handoffLink should contain /deploy/, got: ${result.handoffLink}`,
    );
    assert.ok(result.deployLink, 'result should have deployLink');
    assert.ok(
      result.deployLink.includes('/trade/'),
      `deployLink should contain /trade/, got: ${result.deployLink}`,
    );
  });
});

// =========================================================================
// 8. MCP-TK03: create_and_tokenize continues if deploy fails
// =========================================================================

describe('MCP-TK03: create_and_tokenize non-fatal deploy failure', () => {
  let savedKey: string | undefined;

  before(() => {
    savedKey = process.env['AGENTVERSE_API_KEY'];
    process.env['AGENTVERSE_API_KEY'] = 'av-test-key';
  });

  after(() => {
    if (savedKey) process.env['AGENTVERSE_API_KEY'] = savedKey;
    else delete process.env['AGENTVERSE_API_KEY'];
  });

  it('proceeds to tokenize even when Agentverse deploy throws', async () => {
    const mod = await import(`../tools/tokenize.js?t=tk03-${Date.now()}`);

    restoreFn = installFetchMock((url, init) => {
      const u = String(url);

      // ALL Agentverse calls fail (simulates network error / bad key)
      if (u.includes('agentverse.ai')) {
        return Promise.resolve(
          makeResponse({ detail: 'Unauthorized' }, 401),
        );
      }

      // AgentLaunch: tokenize should still be called
      if (u.includes('/agents/tokenize') && init?.method === 'POST') {
        return Promise.resolve(
          makeResponse({
            tokenId: 55,
            handoffLink: 'https://agent-launch.ai/deploy/55',
          }),
        );
      }

      return Promise.resolve(makeResponse({}));
    });

    const result = await mod.tokenizeHandlers.create_and_tokenize({
      name: 'FailBot',
      description: 'Deploy should fail but tokenize should succeed',
    });

    assert.equal(result.success, true, 'overall result should still be success');
    assert.equal(result.agentAddress, null, 'agentAddress should be null when deploy fails');
    assert.equal(result.tokenId, 55, 'tokenId should come from tokenize API');
    assert.ok(result.handoffLink, 'handoffLink should still be present');
    assert.ok(result.agentCode, 'agent code should still be scaffolded');
  });
});
