/**
 * Build artifact verification — BLD-04–BLD-07
 *
 * Verifies that compiled dist/ directories contain the expected files.
 * These tests catch broken builds that would ship broken packages.
 *
 * Checks:
 *   - SDK dist/ has index.js, index.cjs, index.d.ts
 *   - CLI dist/ has index.js starting with #!/usr/bin/env node
 *   - MCP dist/ has index.js starting with #!/usr/bin/env node
 *   - Templates dist/ has index.js, index.d.ts
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

// Resolve the monorepo root from the SDK's __tests__ directory
// At runtime this is dist/__tests__/build-artifacts.js
// → dist/__tests__ → dist → sdk → packages → root
const SDK_ROOT = resolve(import.meta.dirname, '..', '..');
const PACKAGES_ROOT = resolve(SDK_ROOT, '..');
const MONOREPO_ROOT = resolve(PACKAGES_ROOT, '..');

// ---------------------------------------------------------------------------
// SDK dist/
// ---------------------------------------------------------------------------

describe('SDK build artifacts — BLD-04', () => {
  const sdkDist = join(SDK_ROOT, 'dist');

  it('dist/ directory exists', () => {
    assert.ok(existsSync(sdkDist), `SDK dist/ should exist at ${sdkDist}`);
  });

  it('has index.js (ESM entry)', () => {
    assert.ok(existsSync(join(sdkDist, 'index.js')), 'should have index.js');
  });

  it('has index.cjs (CommonJS entry)', () => {
    assert.ok(existsSync(join(sdkDist, 'index.cjs')), 'should have index.cjs');
  });

  it('has index.d.ts (type declarations)', () => {
    assert.ok(existsSync(join(sdkDist, 'index.d.ts')), 'should have index.d.ts');
  });
});

// ---------------------------------------------------------------------------
// CLI dist/
// ---------------------------------------------------------------------------

describe('CLI build artifacts — BLD-05', () => {
  const cliDist = join(PACKAGES_ROOT, 'cli', 'dist');

  it('dist/ directory exists', () => {
    assert.ok(existsSync(cliDist), `CLI dist/ should exist at ${cliDist}`);
  });

  it('has index.js', () => {
    assert.ok(existsSync(join(cliDist, 'index.js')), 'should have index.js');
  });

  it('index.js starts with shebang #!/usr/bin/env node', () => {
    const content = readFileSync(join(cliDist, 'index.js'), 'utf-8');
    assert.ok(
      content.startsWith('#!/usr/bin/env node'),
      'CLI index.js must start with shebang for npx execution',
    );
  });
});

// ---------------------------------------------------------------------------
// MCP dist/
// ---------------------------------------------------------------------------

describe('MCP build artifacts — BLD-06', () => {
  const mcpDist = join(PACKAGES_ROOT, 'mcp', 'dist');

  it('dist/ directory exists', () => {
    assert.ok(existsSync(mcpDist), `MCP dist/ should exist at ${mcpDist}`);
  });

  it('has index.js', () => {
    assert.ok(existsSync(join(mcpDist, 'index.js')), 'should have index.js');
  });

  it('index.js starts with shebang #!/usr/bin/env node', () => {
    const content = readFileSync(join(mcpDist, 'index.js'), 'utf-8');
    assert.ok(
      content.startsWith('#!/usr/bin/env node'),
      'MCP index.js must start with shebang for npx execution',
    );
  });
});

// ---------------------------------------------------------------------------
// Templates dist/
// ---------------------------------------------------------------------------

describe('Templates build artifacts — BLD-07', () => {
  const tplDist = join(PACKAGES_ROOT, 'templates', 'dist');

  it('dist/ directory exists', () => {
    assert.ok(existsSync(tplDist), `Templates dist/ should exist at ${tplDist}`);
  });

  it('has index.js (ESM entry)', () => {
    assert.ok(existsSync(join(tplDist, 'index.js')), 'should have index.js');
  });

  it('has index.d.ts (type declarations)', () => {
    assert.ok(existsSync(join(tplDist, 'index.d.ts')), 'should have index.d.ts');
  });
});
