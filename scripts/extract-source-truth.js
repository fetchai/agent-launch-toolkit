#!/usr/bin/env node
/**
 * extract-source-truth.js
 *
 * Extracts the canonical source of truth from toolkit source code.
 * Outputs JSON that can be used to validate docs/frontend.
 */

const fs = require('fs');
const path = require('path');

const TOOLKIT_ROOT = path.resolve(__dirname, '..');

// -----------------------------------------------------------------------------
// 1. Extract versions from package.json files
// -----------------------------------------------------------------------------
function extractVersions() {
  const packages = {
    sdk: 'packages/sdk/package.json',
    cli: 'packages/cli/package.json',
    mcp: 'packages/mcp/package.json',
    templates: 'packages/templates/package.json',
  };

  const versions = {};
  for (const [name, pkgPath] of Object.entries(packages)) {
    const fullPath = path.join(TOOLKIT_ROOT, pkgPath);
    const pkg = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    versions[name] = pkg.version;
  }
  return versions;
}

// -----------------------------------------------------------------------------
// 2. Extract CLI commands from packages/cli/src/commands/
// -----------------------------------------------------------------------------
function extractCliCommands() {
  const commandsDir = path.join(TOOLKIT_ROOT, 'packages/cli/src/commands');
  const files = fs.readdirSync(commandsDir).filter(f => f.endsWith('.ts'));

  const commands = [];
  for (const file of files) {
    const name = file.replace('.ts', '');
    const content = fs.readFileSync(path.join(commandsDir, file), 'utf8');

    // Extract command name from .command() or filename
    const cmdMatch = content.match(/\.command\(['"]([^'"]+)['"]\)/);
    const descMatch = content.match(/\.description\(['"]([^'"]+)['"]\)/);

    commands.push({
      file: file,
      name: cmdMatch ? cmdMatch[1] : name,
      description: descMatch ? descMatch[1] : '',
    });
  }
  return commands;
}

// -----------------------------------------------------------------------------
// 3. Extract MCP tools from packages/mcp/src/index.ts TOOLS array
// -----------------------------------------------------------------------------
function extractMcpTools() {
  const indexPath = path.join(TOOLKIT_ROOT, 'packages/mcp/src/index.ts');
  const content = fs.readFileSync(indexPath, 'utf8');

  // Find all tool names in the TOOLS array: name: "tool_name"
  const tools = [];
  const nameMatches = content.matchAll(/{\s*name:\s*["']([a-z_]+)["']/g);

  for (const match of nameMatches) {
    tools.push({
      name: match[1],
    });
  }

  return tools;
}

// -----------------------------------------------------------------------------
// 4. Extract SDK exports from packages/sdk/src/index.ts
// -----------------------------------------------------------------------------
function extractSdkExports() {
  const indexPath = path.join(TOOLKIT_ROOT, 'packages/sdk/src/index.ts');
  const content = fs.readFileSync(indexPath, 'utf8');

  const exports = [];

  // Match: export { X, Y, Z } from './file'
  const reExports = content.matchAll(/export\s*\{([^}]+)\}\s*from/g);
  for (const match of reExports) {
    const names = match[1].split(',').map(s => s.trim().split(' as ')[0].trim());
    exports.push(...names.filter(n => n && !n.startsWith('//')));
  }

  // Match: export * from './file' - would need to parse those files
  // For now, just count what we can find

  return [...new Set(exports)]; // dedupe
}

// -----------------------------------------------------------------------------
// 5. Extract templates from packages/templates/src/templates/
// -----------------------------------------------------------------------------
function extractTemplates() {
  const templatesDir = path.join(TOOLKIT_ROOT, 'packages/templates/src/templates');

  if (!fs.existsSync(templatesDir)) {
    return [];
  }

  const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.ts'));
  return files.map(f => f.replace('.ts', ''));
}

// -----------------------------------------------------------------------------
// 6. Extract presets from packages/templates/src/presets.ts
// -----------------------------------------------------------------------------
function extractPresets() {
  const presetsPath = path.join(TOOLKIT_ROOT, 'packages/templates/src/presets.ts');

  if (!fs.existsSync(presetsPath)) {
    return [];
  }

  const content = fs.readFileSync(presetsPath, 'utf8');

  // Find PRESETS object keys
  const presets = [];

  // Match pattern: 'writer': { or writer: {
  const matches = content.matchAll(/['"]?(writer|social|community|analytics|outreach|ads|strategy)['"]?\s*:\s*\{/gi);
  for (const match of matches) {
    presets.push(match[1].toLowerCase());
  }

  return [...new Set(presets)];
}

// -----------------------------------------------------------------------------
// 7. Extract constants from CLAUDE.md
// -----------------------------------------------------------------------------
function extractConstants() {
  const claudeMdPath = path.join(TOOLKIT_ROOT, 'CLAUDE.md');
  const content = fs.readFileSync(claudeMdPath, 'utf8');

  const constants = {};

  // @gift amounts
  const giftMatch = content.match(/Welcome Gift\s*\|\s*(\d+)\s*TFET\s*\+\s*([\d.]+)\s*tBNB/i);
  if (giftMatch) {
    constants.giftTfet = giftMatch[1];
    constants.giftTbnb = giftMatch[2];
  }

  // Deploy fee
  const feeMatch = content.match(/Deploy Fee\s*\|\s*(\d+)\s*FET/i);
  if (feeMatch) {
    constants.deployFee = feeMatch[1];
  }

  return constants;
}

// -----------------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------------
function main() {
  const truth = {
    extractedAt: new Date().toISOString(),
    versions: extractVersions(),
    cliCommands: extractCliCommands(),
    mcpTools: extractMcpTools(),
    sdkExports: extractSdkExports(),
    templates: extractTemplates(),
    presets: extractPresets(),
    constants: extractConstants(),
  };

  // Add counts
  truth.counts = {
    cliCommands: truth.cliCommands.length,
    mcpTools: truth.mcpTools.length,
    sdkExports: truth.sdkExports.length,
    templates: truth.templates.length,
    presets: truth.presets.length,
  };

  // Output
  const outputPath = path.join(TOOLKIT_ROOT, 'docs/source-truth.json');
  fs.writeFileSync(outputPath, JSON.stringify(truth, null, 2));

  console.log('Source Truth Extracted:');
  console.log('========================');
  console.log(`Versions:`);
  console.log(`  SDK:       ${truth.versions.sdk}`);
  console.log(`  CLI:       ${truth.versions.cli}`);
  console.log(`  MCP:       ${truth.versions.mcp}`);
  console.log(`  Templates: ${truth.versions.templates}`);
  console.log('');
  console.log(`Counts:`);
  console.log(`  CLI Commands: ${truth.counts.cliCommands}`);
  console.log(`  MCP Tools:    ${truth.counts.mcpTools}`);
  console.log(`  SDK Exports:  ${truth.counts.sdkExports}`);
  console.log(`  Templates:    ${truth.counts.templates}`);
  console.log(`  Presets:      ${truth.counts.presets}`);
  console.log('');
  console.log('MCP Tools:');
  truth.mcpTools.forEach(t => console.log(`  - ${t.name}`));
  console.log('');
  console.log('Templates:');
  truth.templates.forEach(t => console.log(`  - ${t}`));
  console.log('');
  console.log('Presets:');
  truth.presets.forEach(p => console.log(`  - ${p}`));
  console.log('');
  console.log(`Constants:`);
  console.log(`  @gift: ${truth.constants.giftTfet} TFET + ${truth.constants.giftTbnb} tBNB`);
  console.log(`  Deploy Fee: ${truth.constants.deployFee} FET`);
  console.log('');
  console.log(`Output: ${outputPath}`);

  return truth;
}

main();
