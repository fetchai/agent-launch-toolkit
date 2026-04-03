/**
 * SDK Persona Test Script
 * Tests the AgentLaunch SDK against the staging (dev) API.
 *
 * Usage: AGENT_LAUNCH_ENV=dev node test-sdk-persona.mjs
 */

import { config } from 'dotenv';
config({ path: '.env' });

// Import from local SDK build
import {
  AgentLaunch,
  calculateBuy,
  getApiUrl,
  getFrontendUrl,
  getEnvironment,
} from './packages/sdk/dist/index.js';

const API_KEY = process.env.AGENTVERSE_API_KEY;
const API_BASE = getApiUrl();
const FRONTEND_BASE = getFrontendUrl();

// Check API key expiry
function checkJwtExpiry(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return { valid: false, reason: 'Not a JWT' };
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    const expired = Date.now() > payload.exp * 1000;
    return {
      valid: !expired,
      expires: new Date(payload.exp * 1000).toISOString(),
      expired,
    };
  } catch {
    return { valid: false, reason: 'Parse error' };
  }
}

const keyStatus = API_KEY ? checkJwtExpiry(API_KEY) : { valid: false, reason: 'Not set' };

console.log('=== AgentLaunch SDK Persona Test ===');
console.log(`Environment: ${getEnvironment()}`);
console.log(`API Base:    ${API_BASE}`);
console.log(`Frontend:    ${FRONTEND_BASE}`);
console.log(`API Key:     ${API_KEY ? API_KEY.slice(0, 20) + '...' : 'NOT SET'}`);
console.log(`Key Status:  ${keyStatus.valid ? 'VALID' : 'EXPIRED/INVALID'} ${keyStatus.expires ? '(expires: ' + keyStatus.expires + ')' : keyStatus.reason || ''}`);
console.log('');
if (!keyStatus.valid) {
  console.log('WARNING: API key is expired or invalid. Authenticated steps (2, 3, 7) will fail.');
  console.log('         Generate a new key at https://agentverse.ai');
  console.log('');
}

// Initialize SDK
const sdk = new AgentLaunch({ apiKey: API_KEY });

const results = [];

async function runStep(name, fn) {
  const start = Date.now();
  try {
    const result = await fn();
    const elapsed = Date.now() - start;
    results.push({ name, success: true, elapsed, data: result });
    console.log(`[PASS] ${name} (${elapsed}ms)`);
    if (result && typeof result === 'object') {
      const summary = JSON.stringify(result, null, 2);
      const lines = summary.split('\n');
      if (lines.length > 25) {
        console.log(lines.slice(0, 25).join('\n'));
        console.log(`  ... (${lines.length - 25} more lines)`);
      } else {
        console.log(summary);
      }
    } else {
      console.log(`  Result: ${result}`);
    }
    console.log('');
    return result;
  } catch (err) {
    const elapsed = Date.now() - start;
    const status = err.status || err.code || 'N/A';
    const serverMsg = err.serverMessage || err.message;
    results.push({ name, success: false, elapsed, error: serverMsg, status });
    console.log(`[FAIL] ${name} (${elapsed}ms)`);
    console.log(`  HTTP Status: ${status}`);
    console.log(`  Error:       ${serverMsg}`);
    if (err.serverMessage && err.message !== err.serverMessage) {
      console.log(`  Full:        ${err.message}`);
    }
    console.log('');
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Step 1: Discovery -- fetch /skill/tutorial with SDK user agent
// ═══════════════════════════════════════════════════════════════════════════
await runStep('1. Discovery - Fetch /skill/tutorial', async () => {
  const url = `${API_BASE}/skill/tutorial`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'agentlaunch-sdk/0.2.13 node' },
  });
  const status = res.status;
  const contentType = res.headers.get('content-type') || '';
  let body;
  if (contentType.includes('json')) {
    body = await res.json();
  } else {
    body = await res.text();
  }
  const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
  return {
    httpStatus: status,
    contentType,
    bodyLength: bodyStr.length,
    bodyPreview: bodyStr.slice(0, 300) + (bodyStr.length > 300 ? '...' : ''),
    stageCount: body?.stages?.length || 'N/A',
    title: body?.title || 'N/A',
  };
});

// ═══════════════════════════════════════════════════════════════════════════
// Step 2: Authenticate -- exchange API key for JWT
// ═══════════════════════════════════════════════════════════════════════════
await runStep('2. Authenticate', async () => {
  // Call the raw endpoint to get better error info
  const res = await fetch(`${API_BASE}/agents/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'agentlaunch-sdk/0.2.13' },
    body: JSON.stringify({ api_key: API_KEY }),
  });
  const body = await res.json();
  if (!res.ok) {
    const err = new Error(body?.error?.message || body?.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.serverMessage = body?.error?.message || body?.message;
    throw err;
  }
  return {
    hasToken: !!body?.data?.token,
    tokenPreview: body?.data?.token ? body.data.token.slice(0, 40) + '...' : 'N/A',
    expiresIn: body?.data?.expires_in || 'N/A',
  };
});

// ═══════════════════════════════════════════════════════════════════════════
// Step 3: Get Wallet -- custodial wallet info
// ═══════════════════════════════════════════════════════════════════════════
await runStep('3. Get Wallet', async () => {
  const wallet = await sdk.trading.getWallet(97);
  return {
    address: wallet.address,
    fetBalance: wallet.fetBalance,
    nativeBalance: wallet.nativeBalance,
    chainId: wallet.chainId,
  };
});

// ═══════════════════════════════════════════════════════════════════════════
// Step 4: List Tokens -- paginated token listing
// ═══════════════════════════════════════════════════════════════════════════
let firstTokenAddress = null;
let bondingTokenAddress = null;

await runStep('4. List Tokens', async () => {
  const resp = await sdk.tokens.listTokens({ limit: 20, sortBy: 'market_cap' });
  const tokens = resp.tokens || resp;
  if (Array.isArray(tokens) && tokens.length > 0) {
    firstTokenAddress = tokens[0].contractAddress || tokens[0].contract_address || tokens[0].address;
    // Find a token that is NOT fully listed (progress < 100) for calculate-buy
    for (const t of tokens) {
      const progress = parseFloat(t.progress || '0');
      const addr = t.contractAddress || t.contract_address || t.address;
      if (progress < 100 && addr) {
        bondingTokenAddress = addr;
        break;
      }
    }
  }
  return {
    totalReturned: Array.isArray(tokens) ? tokens.length : 'N/A',
    total: resp.total || resp.count || 'N/A',
    firstToken: Array.isArray(tokens) && tokens.length > 0
      ? {
          name: tokens[0].name,
          symbol: tokens[0].symbol || tokens[0].ticker,
          address: firstTokenAddress,
          price: tokens[0].price,
          progress: tokens[0].progress,
        }
      : 'No tokens found',
    bondingToken: bondingTokenAddress
      ? `Found non-listed token: ${bondingTokenAddress}`
      : 'All tokens are listed (100% progress)',
  };
});

// ═══════════════════════════════════════════════════════════════════════════
// Step 5: Get Token -- single token details
// ═══════════════════════════════════════════════════════════════════════════
if (firstTokenAddress) {
  await runStep('5. Get Token Details', async () => {
    const token = await sdk.tokens.getToken(firstTokenAddress);
    return {
      name: token.name,
      symbol: token.symbol || token.ticker,
      address: token.contractAddress || token.contract_address || token.address,
      price: token.price,
      marketCap: token.market_cap || token.marketCap,
      progress: token.progress,
      status: token.status,
      createdAt: token.createdAt || token.created_at || 'N/A',
    };
  });
} else {
  results.push({ name: '5. Get Token Details', success: false, elapsed: 0, error: 'No token address from step 4', status: 'SKIP' });
  console.log('[SKIP] 5. Get Token Details - No token address from step 4\n');
}

// ═══════════════════════════════════════════════════════════════════════════
// Step 6: Calculate Buy -- preview a 10 FET buy
// ═══════════════════════════════════════════════════════════════════════════
const calcAddress = bondingTokenAddress || firstTokenAddress;
if (calcAddress) {
  await runStep(`6. Calculate Buy (10 FET on ${calcAddress.slice(0, 10)}...)`, async () => {
    const result = await calculateBuy(calcAddress, '10', sdk.client);
    return result;
  });
} else {
  results.push({ name: '6. Calculate Buy (10 FET)', success: false, elapsed: 0, error: 'No token address available', status: 'SKIP' });
  console.log('[SKIP] 6. Calculate Buy - No token address available\n');
}

// ═══════════════════════════════════════════════════════════════════════════
// Step 7: Tokenize -- create a test token record
// ═══════════════════════════════════════════════════════════════════════════
await runStep('7. Tokenize (Create Token Record)', async () => {
  const ts = Date.now();
  const last4 = String(ts).slice(-4);
  const params = {
    agentAddress: 'agent1q2d0n5tp563wr0ugj9cmcqms9jfv5ks63xy5vg3evy5gy0z52e66xmeyyw9',
    name: `SDK Test ${ts}`,
    symbol: `SDK${last4}`,
    description: 'Test token created by SDK persona test script',
    chainId: 97,
  };
  const result = await sdk.tokenize(params);
  return {
    tokenId: result.tokenId,
    handoffLink: result.handoffLink,
    name: result.name,
    symbol: result.symbol,
    status: result.status,
  };
});

// ═══════════════════════════════════════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════════════════════════════════════
console.log('');
console.log('═══════════════════════════════════════');
console.log('           RESULTS SUMMARY');
console.log('═══════════════════════════════════════');
console.log('');
const passed = results.filter(r => r.success).length;
const failed = results.filter(r => !r.success).length;
console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
console.log('');
for (const r of results) {
  const icon = r.success ? 'PASS' : 'FAIL';
  const time = r.elapsed !== undefined ? ` (${r.elapsed}ms)` : '';
  const extra = r.success ? '' : `\n         Error: ${r.error || 'unknown'} [status: ${r.status || 'N/A'}]`;
  console.log(`  [${icon}] ${r.name}${time}${extra}`);
}

// Note auth issues
if (!keyStatus.valid && failed > 0) {
  console.log('');
  console.log('NOTE: API key is expired. Steps requiring authentication (2, 3, 7)');
  console.log('      will fail until a fresh key is set in .env.');
  console.log('      Generate one at: https://agentverse.ai -> Settings -> API Keys');
}

console.log('');
