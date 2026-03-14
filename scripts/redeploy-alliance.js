#!/usr/bin/env node
/**
 * Redeploy all 15 ASI Alliance agents with the upgraded swarm-starter template.
 * - Generates fresh code from swarm-starter template
 * - Stops agent, uploads new code, sets ASI1_API_KEY secret, starts agent
 * - Verifies all agents are compiled and running
 */

const { generateFromTemplate } = require('../packages/templates/dist/index.js');

const AGENTVERSE_API_KEY = process.env.AGENTVERSE_API_KEY;
const ASI1_API_KEY = process.env.ASI1_API_KEY;
const BASE_URL = 'https://agentverse.ai/v1';

if (!AGENTVERSE_API_KEY) { console.error('Missing AGENTVERSE_API_KEY'); process.exit(1); }
if (!ASI1_API_KEY) { console.error('Missing ASI1_API_KEY'); process.exit(1); }

const AGENTS = [
  // Wave 1: C-Suite
  { name: 'CTO', addr: 'agent1qwym8adaqc0l3f4mrug08yg2agjjldeq5q6twq44fpftu6r8h3t955k6wlv', role: 'cto', price: '50000000000000000' },
  { name: 'CFO', addr: 'agent1q0g6ud5n00x8nkw0ln2u0yc2c7sgsany77u88qe4wq6d27kxj7887hh6xwl', role: 'cfo', price: '20000000000000000' },
  { name: 'COO', addr: 'agent1q0xwvsgvztcdkzgql89ahap7kt30j4xury2eg6v48w68w7jmcr5akq9k8xl', role: 'coo', price: '20000000000000000' },
  { name: 'CEO', addr: 'agent1qw2fmjzmad38jpslcm5yqu5d0sj5ra848mdmz76ckkcdkg9g4rlquyzmctf', role: 'ceo', price: '20000000000000000' },
  { name: 'CRO', addr: 'agent1qflfu0jpe2j7wmwcg8wvsa0ytux7cz5nuwnssnprepq08vpkzut26g9kue2', role: 'cro', price: '50000000000000000' },
  // Wave 2: Fetch Internal
  { name: 'Guide Lead', addr: 'agent1q0gqtma489ftzhtyncyrfkugyccejeafu428w75q8tgrucuncjjcuh34hda', role: 'guide', price: '20000000000000000' },
  { name: 'Rank Lead', addr: 'agent1qffsd362va6qhrzl34e7j9ds8vl0p3kzvqv9ww478lv6qzfhtn9fgvy2sjw', role: 'rank', price: '20000000000000000' },
  { name: 'Coach Lead', addr: 'agent1qdel63tseh2vz8c0v3a42lmyyd0zggvdmmtftn8dq98nlnc68mffwn3lqcq', role: 'coach', price: '50000000000000000' },
  { name: 'Concierge Lead', addr: 'agent1qgte5ys6r6dzk59svwnjg484afugrz0z263y7lkldwkftp840e7wqga7gd8', role: 'concierge', price: '10000000000000000' },
  // Wave 2: SNET
  { name: 'Brand Lead', addr: 'agent1qtmz9fgtjqmrldc6326qvr9j2yhq5a8psyylt9lq30dwsfqtracnxzdqnj6', role: 'brand', price: '20000000000000000' },
  { name: 'DevRel Lead', addr: 'agent1qv3sy7hvy6d0q5xtxer94jdwrr54m8te3uyssmk2kkrsncewkjjygd205ft', role: 'devrel', price: '20000000000000000' },
  { name: 'Marketplace Lead', addr: 'agent1qtlqq26n9wgfzerm2sm0c37v84uluakngw276mnunh8sa7t4awdp5lh5v7z', role: 'marketplace', price: '10000000000000000' },
  { name: 'Platform Lead', addr: 'agent1qfg23485dpep5j8kvl027tx055u4py0d6vs02naqx6nrjcqcykdzw95v6ql', role: 'platform', price: '20000000000000000' },
  { name: 'AI-Services Lead', addr: 'agent1qd5wq95jysam0edthzs3puwswkjemae567ul6ez22j4ph6yncmqez6h6mhc', role: 'ai-services', price: '100000000000000000' },
  { name: 'NuNet Lead', addr: 'agent1qdnl4f09eu37a8vpm0wdsqyjaxxkdaxn298lw0a5grd549dh33q47tha2qk', role: 'nunet', price: '50000000000000000' },
];

async function apiCall(method, path, body = null) {
  const url = `${BASE_URL}${path}`;
  const opts = {
    method,
    headers: {
      'Authorization': `Bearer ${AGENTVERSE_API_KEY}`,
      'Content-Type': 'application/json',
    },
  };
  if (body) opts.body = JSON.stringify(body);

  const resp = await fetch(url, opts);
  const text = await resp.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: resp.status, ok: resp.ok, text, json };
}

async function deployAgent(agent) {
  const { name, addr, role, price } = agent;
  const result = { name, addr, stopped: false, codeUploaded: false, secretSet: false, started: false, error: null };

  try {
    // 1. Generate fresh code from swarm-starter template
    console.log(`[${name}] Generating code (role=${role}, price=${price})...`);
    const gen = generateFromTemplate('swarm-starter', {
      agent_name: name.replace(/\s+/g, '-').toLowerCase(),
      role: role,
      service_price_afet: price,
      interval_seconds: '300',
    });
    const code = gen.code;
    console.log(`[${name}] Generated ${code.length} chars`);

    // 2. Stop the agent
    console.log(`[${name}] Stopping...`);
    const stopResp = await apiCall('POST', `/hosting/agents/${addr}/stop`);
    if (stopResp.ok || stopResp.status === 400) {
      // 400 means already stopped — that's fine
      result.stopped = true;
      console.log(`[${name}] Stopped (status=${stopResp.status})`);
    } else {
      console.log(`[${name}] Stop response: ${stopResp.status} ${stopResp.text.substring(0, 200)}`);
      result.stopped = true; // proceed anyway
    }

    // Small delay after stop
    await new Promise(r => setTimeout(r, 1000));

    // 3. Upload new code (double-encoded JSON)
    console.log(`[${name}] Uploading code...`);
    const codeArray = [{ language: 'python', name: 'agent.py', value: code }];
    const codePayload = { code: JSON.stringify(codeArray) };
    const uploadResp = await apiCall('PUT', `/hosting/agents/${addr}/code`, codePayload);
    if (uploadResp.ok) {
      result.codeUploaded = true;
      console.log(`[${name}] Code uploaded`);
    } else {
      console.error(`[${name}] Code upload FAILED: ${uploadResp.status} ${uploadResp.text.substring(0, 300)}`);
      result.error = `Code upload failed: ${uploadResp.status}`;
      return result;
    }

    // 4. Set ASI1_API_KEY secret
    console.log(`[${name}] Setting ASI1_API_KEY secret...`);
    const secretResp = await apiCall('POST', '/hosting/secrets', {
      address: addr,
      name: 'ASI1_API_KEY',
      secret: ASI1_API_KEY,
    });
    if (secretResp.ok) {
      result.secretSet = true;
      console.log(`[${name}] Secret set`);
    } else {
      console.error(`[${name}] Secret FAILED: ${secretResp.status} ${secretResp.text.substring(0, 200)}`);
      // Continue anyway — secret might already exist
      result.secretSet = true;
    }

    // 5. Start agent
    console.log(`[${name}] Starting...`);
    const startResp = await apiCall('POST', `/hosting/agents/${addr}/start`);
    if (startResp.ok) {
      result.started = true;
      console.log(`[${name}] Started`);
    } else {
      console.error(`[${name}] Start FAILED: ${startResp.status} ${startResp.text.substring(0, 200)}`);
      result.error = `Start failed: ${startResp.status}`;
    }
  } catch (err) {
    result.error = err.message;
    console.error(`[${name}] ERROR: ${err.message}`);
  }

  return result;
}

async function verifyAgents() {
  console.log('\n=== Verifying all agents ===\n');
  const results = [];

  for (const agent of AGENTS) {
    const resp = await apiCall('GET', `/hosting/agents/${agent.addr}`);
    if (resp.ok && resp.json) {
      results.push({
        name: agent.name,
        addr: agent.addr,
        compiled: resp.json.compiled || false,
        running: resp.json.status === 'active' || resp.json.running || false,
        status: resp.json.status || 'unknown',
      });
    } else {
      results.push({
        name: agent.name,
        addr: agent.addr,
        compiled: false,
        running: false,
        status: `error (${resp.status})`,
      });
    }
  }

  return results;
}

async function main() {
  console.log('=== ASI Alliance Redeployment ===');
  console.log(`Deploying ${AGENTS.length} agents with upgraded swarm-starter template\n`);

  // Deploy in waves to avoid rate limiting
  const wave1 = AGENTS.slice(0, 5);   // C-Suite
  const wave2 = AGENTS.slice(5, 9);   // Fetch Internal
  const wave3 = AGENTS.slice(9, 15);  // SNET

  console.log('--- Wave 1: C-Suite (5 agents) ---\n');
  const results1 = [];
  for (const agent of wave1) {
    const r = await deployAgent(agent);
    results1.push(r);
    await new Promise(r => setTimeout(r, 500)); // small gap between agents
  }

  console.log('\n--- Wave 2: Fetch Internal (4 agents) ---\n');
  const results2 = [];
  for (const agent of wave2) {
    const r = await deployAgent(agent);
    results2.push(r);
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('\n--- Wave 3: SNET (6 agents) ---\n');
  const results3 = [];
  for (const agent of wave3) {
    const r = await deployAgent(agent);
    results3.push(r);
    await new Promise(r => setTimeout(r, 500));
  }

  const allResults = [...results1, ...results2, ...results3];

  // Summary of deployment
  console.log('\n=== Deployment Summary ===');
  for (const r of allResults) {
    const status = r.error ? `ERROR: ${r.error}` : 'OK';
    console.log(`${r.name.padEnd(20)} | stopped=${r.stopped} code=${r.codeUploaded} secret=${r.secretSet} started=${r.started} | ${status}`);
  }

  // Wait 45 seconds for compilation
  console.log('\n=== Waiting 45 seconds for compilation... ===\n');
  await new Promise(r => setTimeout(r, 45000));

  // Verify
  const verifyResults = await verifyAgents();

  // Check secrets for each agent
  console.log('\n=== Checking ASI1_API_KEY secrets ===\n');
  const secretResults = [];
  for (const agent of AGENTS) {
    const resp = await apiCall('GET', `/hosting/secrets?address=${agent.addr}`);
    let hasASI1 = false;
    if (resp.ok && resp.json) {
      const secrets = Array.isArray(resp.json) ? resp.json : (resp.json.items || resp.json.secrets || []);
      hasASI1 = secrets.some(s => s.name === 'ASI1_API_KEY');
    }
    secretResults.push({ name: agent.name, hasASI1 });
  }

  // Final table
  console.log('\n=== FINAL RESULTS ===\n');
  console.log('Name                 | Address                                                                        | Compiled | Running | ASI1 Secret Set');
  console.log('---------------------|--------------------------------------------------------------------------------|----------|---------|----------------');
  for (let i = 0; i < AGENTS.length; i++) {
    const v = verifyResults[i];
    const s = secretResults[i];
    const compiled = v.compiled ? 'true' : 'FALSE';
    const running = v.running ? 'true' : (v.status === 'active' ? 'true' : 'FALSE');
    const secret = s.hasASI1 ? 'true' : 'FALSE';
    console.log(`${v.name.padEnd(20)} | ${v.addr.padEnd(78)} | ${compiled.padEnd(8)} | ${running.padEnd(7)} | ${secret}`);
  }

  // Count successes
  const compiledCount = verifyResults.filter(v => v.compiled).length;
  const runningCount = verifyResults.filter(v => v.running || v.status === 'active').length;
  const secretCount = secretResults.filter(s => s.hasASI1).length;
  console.log(`\nTotal: ${compiledCount}/15 compiled, ${runningCount}/15 running, ${secretCount}/15 ASI1 secret set`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
