/**
 * Smoke test: agent-launch-mcp
 *
 * Verifies that the MCP server binary exists and is executable.
 * We can't fully start it (it expects stdio MCP protocol), but we
 * verify the binary is installed and importable.
 */

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';

const errors = [];

// ── Check binary exists ─────────────────────────────────────────────
const binPath = resolve('node_modules/.bin/agent-launch-mcp');
if (!existsSync(binPath)) {
  errors.push(`MCP binary not installed at ${binPath}`);
}

// ── Check the entry point is valid JS ───────────────────────────────
// We use node --check to syntax-check without running (avoids stdio hang)
try {
  const entryPoint = resolve('node_modules/agent-launch-mcp/dist/index.js');
  if (existsSync(entryPoint)) {
    execSync(`node --check "${entryPoint}"`, {
      encoding: 'utf-8',
      timeout: 10000,
    });
  } else {
    errors.push(`MCP entry point not found: ${entryPoint}`);
  }
} catch (err) {
  errors.push(`MCP entry point syntax check failed: ${err.message}`);
}

// ── Verify package.json bin field resolved ───────────────────────────
try {
  const pkgPath = resolve('node_modules/agent-launch-mcp/package.json');
  if (existsSync(pkgPath)) {
    const { readFileSync } = await import('node:fs');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    if (!pkg.bin || !pkg.bin['agent-launch-mcp']) {
      errors.push('MCP package.json missing bin field for agent-launch-mcp');
    }
  }
} catch (err) {
  errors.push(`MCP package.json check failed: ${err.message}`);
}

if (errors.length > 0) {
  console.error('MCP failures:');
  errors.forEach(e => console.error(`  - ${e}`));
  process.exit(1);
}

console.log('MCP: binary installed, entry point valid');
