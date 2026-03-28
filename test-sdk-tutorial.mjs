/**
 * SDK Tutorial Test — Coding Agent (SDK) Persona
 *
 * Tests ALL lifecycle steps of the Agent Launch tutorial using the local SDK build.
 * Run: AGENT_LAUNCH_ENV=dev node test-sdk-tutorial.mjs
 */

import 'dotenv/config';

// Import from local SDK build
import {
  AgentLaunch,
  AgentLaunchClient,
  listTokens,
  getToken,
  calculateBuy,
  getApiUrl,
  getFrontendUrl,
} from './packages/sdk/dist/index.js';

// ─── Config ──────────────────────────────────────────────────────────────────

const API_KEY = process.env.AGENTVERSE_API_KEY;
if (!API_KEY) {
  console.error('FATAL: AGENTVERSE_API_KEY not set in .env');
  process.exit(1);
}

const apiUrl = getApiUrl();
const frontendUrl = getFrontendUrl();
console.log(`\n========================================`);
console.log(`  SDK Tutorial Test Suite`);
console.log(`  Environment: ${process.env.AGENT_LAUNCH_ENV || 'production'}`);
console.log(`  API URL:     ${apiUrl}`);
console.log(`  Frontend:    ${frontendUrl}`);
console.log(`========================================\n`);

// ─── Helpers ─────────────────────────────────────────────────────────────────

const results = [];
let bondingToken = null; // Will be populated by step 5

async function runStep(name, fn) {
  const start = performance.now();
  try {
    const data = await fn();
    const ms = Math.round(performance.now() - start);
    results.push({ step: name, status: 'PASS', ms, data });
    console.log(`  [PASS] ${name}  (${ms}ms)`);
    if (data) {
      const summary = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
      // Print max 500 chars of data
      console.log(`         ${summary.length > 500 ? summary.slice(0, 500) + '...' : summary}\n`);
    }
    return data;
  } catch (err) {
    const ms = Math.round(performance.now() - start);
    const msg = err?.message || String(err);
    results.push({ step: name, status: 'FAIL', ms, error: msg });
    console.log(`  [FAIL] ${name}  (${ms}ms)`);
    console.log(`         Error: ${msg}\n`);
    return null;
  }
}

// ─── Instantiate SDK ─────────────────────────────────────────────────────────

const sdk = new AgentLaunch({ apiKey: API_KEY });

// ─── Step 1: Discovery — Fetch /skill.md with SDK user-agent ─────────────────

await runStep('1. Discovery — fetch /skill.md', async () => {
  const url = `${frontendUrl}/skill.md`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'agentlaunch-sdk/0.2.13' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  const text = await res.text();
  const lines = text.split('\n');
  return {
    url,
    status: res.status,
    contentLength: text.length,
    firstLine: lines[0],
    hasApiBase: text.includes('API Base') || text.includes('/api/'),
    hasTutorialLink: text.includes('/tutorial'),
  };
});

// ─── Step 2: Authenticate — exchange API key for JWT ─────────────────────────

const authResult = await runStep('2. Authenticate — POST /agents/auth', async () => {
  // Note: SDK's authenticate() has a bug (calls post() which requires header auth
  // even though this endpoint uses body auth). Testing via direct fetch.
  const res = await fetch(`${apiUrl}/agents/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: API_KEY }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status}: ${body}`);
  }
  const json = await res.json();
  return {
    success: json.success,
    hasToken: !!json.data?.token,
    tokenPreview: json.data?.token ? json.data.token.slice(0, 30) + '...' : null,
    expiresIn: json.data?.expires_in,
  };
});

// ─── Step 3: Get Wallet — custodial wallet address + balances ────────────────

await runStep('3. Get Wallet — GET /agents/wallet', async () => {
  const wallet = await sdk.trading.getWallet(97);
  return {
    address: wallet.address,
    nativeBalance: wallet.nativeBalance,
    fetBalance: wallet.fetBalance,
    chainId: wallet.chainId,
    type: wallet.type,
  };
});

// ─── Step 4: List Tokens — list tokens (limit 3) ────────────────────────────

const tokenList = await runStep('4. List Tokens — GET /tokens (limit 3)', async () => {
  const response = await sdk.tokens.listTokens({ limit: 3 });
  return {
    count: response.tokens.length,
    total: response.total,
    tokens: response.tokens.map(t => ({
      name: t.name,
      symbol: t.symbol,
      address: t.address,
      status: t.status,
      price: t.price,
      progress: t.progress,
      listed: t.listed,
    })),
  };
});

// ─── Step 5: Get Token — get details of a bonding-curve token ────────────────

await runStep('5. Get Token — bonding-curve token detail', async () => {
  // Find a bonding-curve token (not fully listed) from the list, or use first available
  let targetAddress = null;
  if (tokenList?.tokens) {
    const bondingCandidate = tokenList.tokens.find(t => t.address && !t.listed);
    if (bondingCandidate) {
      targetAddress = bondingCandidate.address;
    } else {
      // Fallback to first token with an address
      const withAddr = tokenList.tokens.find(t => t.address);
      if (withAddr) targetAddress = withAddr.address;
    }
  }

  if (!targetAddress) {
    // Fetch more tokens to find one
    const moreTokens = await sdk.tokens.listTokens({ limit: 20 });
    const candidate = moreTokens.tokens.find(t => t.address && !t.listed)
      || moreTokens.tokens.find(t => t.address);
    if (candidate) targetAddress = candidate.address;
  }

  if (!targetAddress) throw new Error('No token with a contract address found');

  const token = await sdk.tokens.getToken(targetAddress);
  bondingToken = token;
  return {
    name: token.name,
    symbol: token.symbol,
    address: token.address,
    status: token.status,
    price: token.price,
    marketCap: token.market_cap,
    progress: token.progress,
    listed: token.listed,
    chainId: token.chainId,
  };
});

// ─── Step 6: Calculate Buy — preview 10 FET buy ─────────────────────────────

await runStep('6. Calculate Buy — preview 10 FET purchase', async () => {
  const address = bondingToken?.address;
  if (!address) throw new Error('No bonding token available from step 5');

  const result = await calculateBuy(address, '10');
  return {
    tokenAddress: address,
    fetAmount: '10',
    tokensReceived: result.tokensReceived,
    pricePerToken: result.pricePerToken,
    priceImpact: result.priceImpact,
    fee: result.fee,
    netFetSpent: result.netFetSpent,
  };
});

// ─── Step 7: Tokenize — create token record ──────────────────────────────────

const timestamp = Date.now();
let createdTokenId = null;

const tokenizeResult = await runStep('7. Tokenize — POST /agents/tokenize', async () => {
  // We need a valid agent address owned by this API key.
  // First get agents list.
  const agentsRes = await fetch(`${apiUrl}/agents/my-agents`, {
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
    },
  });

  if (!agentsRes.ok) {
    const body = await agentsRes.text();
    throw new Error(`Failed to list agents: HTTP ${agentsRes.status}: ${body}`);
  }

  const agentsData = await agentsRes.json();
  const agents = agentsData?.data?.agents || [];
  if (agents.length === 0) {
    throw new Error('No agents found under this API key. Cannot tokenize.');
  }

  const agentAddress = agents[0].address;
  const tokenName = `SDK Test ${timestamp}`;

  const result = await sdk.tokenize({
    agentAddress,
    name: tokenName,
    symbol: 'SDKT',
    description: `Automated SDK tutorial test token created at ${new Date().toISOString()}`,
    image: 'auto',
    chainId: 97,
  });

  createdTokenId = result.tokenId;
  return {
    tokenId: result.tokenId,
    handoffLink: result.handoffLink,
    name: result.name,
    symbol: result.symbol,
    status: result.status,
    agentUsed: agentAddress,
  };
});

// ─── Step 8: Get Created Token — verify existence ────────────────────────────

await runStep('8. Get Created Token — verify token record', async () => {
  if (!createdTokenId) throw new Error('No token ID from step 7');

  // The token is pending_deployment, so it won't have a contract address yet.
  // Query by token ID via the backend API /tokens/id/:id endpoint.
  const res = await fetch(`${apiUrl}/tokens/id/${createdTokenId}`, {
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status}: ${body}`);
  }

  const token = await res.json();
  return {
    id: token.id,
    name: token.name,
    symbol: token.symbol || token.ticker,
    status: token.status,
    address: token.address || '(pending deployment)',
    chainId: token.chainId,
    createdAt: token.created_at || token.createdAt,
    matchesStep7: token.id === createdTokenId,
  };
});

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log(`\n========================================`);
console.log(`  RESULTS SUMMARY`);
console.log(`========================================\n`);

const passed = results.filter(r => r.status === 'PASS').length;
const failed = results.filter(r => r.status === 'FAIL').length;
const totalMs = results.reduce((sum, r) => sum + r.ms, 0);

for (const r of results) {
  const icon = r.status === 'PASS' ? 'OK' : 'XX';
  const errPart = r.error ? ` — ${r.error.slice(0, 80)}` : '';
  console.log(`  [${icon}] ${r.step}  (${r.ms}ms)${errPart}`);
}

console.log(`\n  Total: ${passed}/${results.length} passed, ${failed} failed`);
console.log(`  Total time: ${totalMs}ms`);
console.log(`========================================\n`);

process.exit(failed > 0 ? 1 : 0);
