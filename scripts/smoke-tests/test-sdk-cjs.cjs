/**
 * Smoke test: agentlaunch-sdk CJS require
 *
 * Verifies that the SDK works via CommonJS require().
 * This catches dual-export (ESM/CJS) issues.
 */

const sdk = require('agentlaunch-sdk');

const errors = [];

// Check key exports exist
const expected = [
  'AgentLaunch',
  'AgentLaunchClient',
  'AgentLaunchError',
  'tokenize',
  'getToken',
  'listTokens',
  'generateDeployLink',
  'generateTradeLink',
  'generateBuyLink',
  'generateSellLink',
  'getApiUrl',
  'getFrontendUrl',
];

for (const name of expected) {
  if (!(name in sdk)) {
    errors.push(`Missing CJS export: ${name}`);
  }
}

// Verify constructors work
try {
  const client = new sdk.AgentLaunchClient({ apiKey: 'test-key' });
  if (typeof client.get !== 'function' || typeof client.post !== 'function') {
    errors.push('CJS AgentLaunchClient missing get/post methods');
  }
} catch (e) {
  errors.push(`CJS AgentLaunchClient constructor failed: ${e.message}`);
}

// Verify pure functions work
try {
  const link = sdk.generateDeployLink(99);
  if (!link.includes('99')) {
    errors.push(`CJS generateDeployLink(99) unexpected: ${link}`);
  }
} catch (e) {
  errors.push(`CJS generateDeployLink failed: ${e.message}`);
}

if (errors.length > 0) {
  console.error('SDK CJS failures:');
  errors.forEach(e => console.error(`  - ${e}`));
  process.exit(1);
}

console.log(`SDK CJS: ${expected.length} exports verified`);
