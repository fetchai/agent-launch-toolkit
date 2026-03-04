/**
 * Smoke test: agentlaunch-sdk ESM imports
 *
 * Verifies that all public exports are accessible via ESM import.
 */

import {
  // Fluent API
  AgentLaunch,
  // Core client
  AgentLaunchClient,
  // Error class
  AgentLaunchError,
  // Token operations
  tokenize, getToken, listTokens,
  // Market operations
  getTokenPrice, getTokenHolders, calculateBuy, calculateSell, getPlatformStats,
  // Handoff links
  generateDeployLink, generateTradeLink, generateBuyLink, generateSellLink,
  // Agent operations
  authenticate, getMyAgents,
  // Agentverse deployment
  createAgent, uploadCode, setSecret, startAgent, deployAgent,
  // Comments
  getComments, postComment,
  // URL resolution
  getApiUrl, getFrontendUrl,
} from 'agentlaunch-sdk';

const errors = [];

// Verify classes exist and are constructable
try {
  const sdk = new AgentLaunch({ apiKey: 'test-key' });
  if (!sdk.tokens || !sdk.market || !sdk.handoff || !sdk.agents) {
    errors.push('AgentLaunch missing namespaces (tokens, market, handoff, agents)');
  }
} catch (e) {
  errors.push(`AgentLaunch constructor failed: ${e.message}`);
}

try {
  const client = new AgentLaunchClient({ apiKey: 'test-key' });
  if (typeof client.get !== 'function' || typeof client.post !== 'function') {
    errors.push('AgentLaunchClient missing get/post methods');
  }
} catch (e) {
  errors.push(`AgentLaunchClient constructor failed: ${e.message}`);
}

// Verify standalone functions are functions
const fns = {
  tokenize, getToken, listTokens,
  getTokenPrice, getTokenHolders, calculateBuy, calculateSell, getPlatformStats,
  generateDeployLink, generateTradeLink, generateBuyLink, generateSellLink,
  authenticate, getMyAgents,
  createAgent, uploadCode, setSecret, startAgent, deployAgent,
  getComments, postComment,
  getApiUrl, getFrontendUrl,
};

for (const [name, fn] of Object.entries(fns)) {
  if (typeof fn !== 'function') {
    errors.push(`Expected ${name} to be a function, got ${typeof fn}`);
  }
}

// Verify error class
try {
  const err = new AgentLaunchError('test', 'TEST_ERROR');
  if (!(err instanceof Error)) {
    errors.push('AgentLaunchError is not an Error subclass');
  }
} catch (e) {
  errors.push(`AgentLaunchError failed: ${e.message}`);
}

// Verify handoff link generation (pure function, no network)
const deployLink = generateDeployLink(42);
if (!deployLink.includes('42')) {
  errors.push(`generateDeployLink(42) returned unexpected: ${deployLink}`);
}

const testAddr = '0x0000000000000000000000000000000000000001';
const buyLink = generateBuyLink(testAddr, '10');
if (!buyLink.includes(testAddr) || !buyLink.includes('buy')) {
  errors.push(`generateBuyLink returned unexpected: ${buyLink}`);
}

if (errors.length > 0) {
  console.error('SDK ESM failures:');
  errors.forEach(e => console.error(`  - ${e}`));
  process.exit(1);
}

console.log(`SDK ESM: ${Object.keys(fns).length + 3} exports verified`);
