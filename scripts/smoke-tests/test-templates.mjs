/**
 * Smoke test: agentlaunch-templates
 *
 * Verifies template listing, generation, and presets work correctly.
 */

import {
  listTemplates,
  getTemplate,
  generateFromTemplate,
  getPreset,
  listPresets,
  RULES,
  SKILLS,
} from 'agentlaunch-templates';

const errors = [];

// ── List templates ──────────────────────────────────────────────────
const templates = listTemplates();
if (!Array.isArray(templates) || templates.length === 0) {
  errors.push(`listTemplates() returned empty or non-array: ${JSON.stringify(templates)}`);
}

// Verify expected templates exist
const expectedTemplates = ['chat-memory', 'custom', 'swarm-starter'];
for (const name of expectedTemplates) {
  const found = templates.some(t => t.name === name);
  if (!found) {
    errors.push(`Template "${name}" missing from listTemplates()`);
  }
}

// Verify swarm-starter alias resolves via getTemplate
const swarmStarter = getTemplate('swarm-starter');
if (!swarmStarter) {
  errors.push('getTemplate("swarm-starter") alias did not resolve');
}

// ── Get individual template ─────────────────────────────────────────
const chatMemory = getTemplate('chat-memory');
if (!chatMemory) {
  errors.push('getTemplate("chat-memory") returned null/undefined');
} else {
  if (!chatMemory.name || !chatMemory.description) {
    errors.push('chat-memory template missing name or description');
  }
}

// ── Generate from template ──────────────────────────────────────────
const result = generateFromTemplate('chat-memory', { agent_name: 'SmokeTestBot' });
if (!result || typeof result !== 'object') {
  errors.push(`generateFromTemplate returned invalid: ${typeof result}`);
} else {
  if (!result.code || typeof result.code !== 'string' || result.code.length < 50) {
    errors.push('Generated code is empty or too short');
  }
  if (!result.readme || typeof result.readme !== 'string') {
    errors.push('Generated readme is missing');
  }
  // Verify the agent name appears in output
  if (!result.code.includes('SmokeTestBot') && !result.readme.includes('SmokeTestBot')) {
    errors.push('Agent name "SmokeTestBot" not found in generated output');
  }
}

// ── Presets ──────────────────────────────────────────────────────────
const presets = listPresets();
if (!Array.isArray(presets) || presets.length === 0) {
  errors.push('listPresets() returned empty');
}

const writer = getPreset('writer');
if (!writer) {
  errors.push('getPreset("writer") returned null/undefined');
} else {
  if (!writer.variables || typeof writer.variables !== 'object') {
    errors.push('Writer preset missing variables');
  }
}

// ── Claude context exports ──────────────────────────────────────────
if (!RULES || typeof RULES !== 'object') {
  errors.push('RULES export missing or invalid');
}
if (!SKILLS || typeof SKILLS !== 'object') {
  errors.push('SKILLS export missing or invalid');
}

if (errors.length > 0) {
  console.error('Templates failures:');
  errors.forEach(e => console.error(`  - ${e}`));
  process.exit(1);
}

console.log(`Templates: ${templates.length} templates, ${presets.length} presets verified`);
