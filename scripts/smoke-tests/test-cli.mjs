/**
 * Smoke test: agentlaunch CLI
 *
 * Verifies that the CLI binary runs and shows expected commands.
 */

import { execSync } from 'node:child_process';

const errors = [];

// ── Test --help ─────────────────────────────────────────────────────
let helpOutput;
try {
  helpOutput = execSync('npx agentlaunch --help', {
    encoding: 'utf-8',
    timeout: 15000,
    env: { ...process.env, NODE_NO_WARNINGS: '1' },
  });
} catch (err) {
  // commander exits 0 on --help but some versions throw
  helpOutput = err.stdout || err.stderr || '';
}

if (!helpOutput || helpOutput.length < 50) {
  errors.push(`CLI --help output too short or empty (${helpOutput?.length || 0} chars)`);
} else {
  // Verify expected subcommands appear
  const expectedCommands = ['list', 'status', 'deploy', 'tokenize', 'config', 'buy', 'sell'];
  for (const cmd of expectedCommands) {
    if (!helpOutput.includes(cmd)) {
      errors.push(`CLI --help missing command: "${cmd}"`);
    }
  }
}

// ── Test --version ──────────────────────────────────────────────────
let versionOutput;
try {
  versionOutput = execSync('npx agentlaunch --version', {
    encoding: 'utf-8',
    timeout: 10000,
    env: { ...process.env, NODE_NO_WARNINGS: '1' },
  });
} catch (err) {
  versionOutput = err.stdout || err.stderr || '';
}

if (!versionOutput || !versionOutput.trim().match(/^\d+\.\d+\.\d+/)) {
  errors.push(`CLI --version unexpected output: "${versionOutput?.trim()}"`);
}

if (errors.length > 0) {
  console.error('CLI failures:');
  errors.forEach(e => console.error(`  - ${e}`));
  process.exit(1);
}

console.log(`CLI: binary runs, help shows ${helpOutput.split('\n').length} lines, version ${versionOutput.trim()}`);
