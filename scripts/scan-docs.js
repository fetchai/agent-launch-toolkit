#!/usr/bin/env node
/**
 * scan-docs.js
 *
 * Scans fetchlaunchpad docs and frontend for version numbers, counts, etc.
 * Compares against source-truth.json and outputs a diff report.
 */

const fs = require('fs');
const path = require('path');

const TOOLKIT_ROOT = path.resolve(__dirname, '..');
const WEBSITE_ROOT = path.resolve(TOOLKIT_ROOT, '../fetchlaunchpad');

// More precise patterns to avoid false positives
const PATTERNS = {
  // Version patterns - must be near package names
  sdkVersion: /(?:SDK|agentlaunch-sdk)[^v\d]*v?(0\.\d+\.\d+)/gi,
  cliVersion: /(?:CLI|agentlaunch)[^\d]*v?(1\.\d+\.\d+)/gi,
  mcpVersion: /(?:MCP|agent-launch-mcp)[^\d]*v?(2\.\d+\.\d+)/gi,

  // Count patterns - must have "tools" or "templates" near the number
  mcpToolCount: /(\d+)\+?\s*(?:MCP\s*)?tools/gi,
  templateCount: /(\d+)\s*templates/gi,

  // @gift amounts - specific patterns (avoid matching parts of larger numbers)
  giftTfet: /(?<![,\d])(\d+)\s*TFET/gi,
  giftTbnb: /(0\.0{1,2}1)\s*tBNB/gi,

  // Presets - detect Genesis vs Marketing
  genesisPresets: /\b(oracle|brain|analyst|coordinator|sentinel|launcher|scout)\b/gi,
  marketingPresets: /\b(writer|social|community|analytics|outreach|ads|strategy)\b/gi,
};

// Priority files - these are the user-facing docs we care most about
const PRIORITY_FILES = [
  'CLAUDE.md',
  'README.md',
  'docs/agent-launch-toolkit.md',
  'docs/mcp.md',
  'docs/toolkit/cli-reference.md',
  'docs/toolkit/mcp-tools.md',
  'docs/toolkit/sdk-reference.md',
  'docs/toolkit/getting-started.md',
  'frontend/src/data/audienceFaqData.ts',
  'frontend/public/llms.txt',
  'frontend/public/ai.txt',
  'frontend/public/.well-known/ai-plugin.json',
  'frontend/public/learn-about-tokens.md',
  'frontend/src/components/home/OneApiCall.tsx',
  'frontend/src/components/home/CreateYourAgent.tsx',
  'frontend/src/app/docs/DocsHubClient.tsx',
  'frontend/src/app/docs/cli/page.tsx',
  'frontend/src/app/docs/mcp/page.tsx',
  'frontend/src/app/docs/sdk/page.tsx',
  'frontend/src/app/docs/for-agents/page.tsx',
  'frontend/src/app/docs/templates/page.tsx',
  'frontend/src/app/docs/trading/page.tsx',
  'frontend/src/app/docs/quickstart/page.tsx',
  'frontend/src/app/skill.md/route.ts',
];

// -----------------------------------------------------------------------------
// File scanner
// -----------------------------------------------------------------------------
function scanFile(filePath, patterns) {
  const content = fs.readFileSync(filePath, 'utf8');
  const findings = {};

  for (const [name, pattern] of Object.entries(patterns)) {
    // Reset regex lastIndex
    pattern.lastIndex = 0;
    const matches = [...content.matchAll(pattern)];
    if (matches.length > 0) {
      findings[name] = matches.map(m => ({
        match: m[0],
        value: m[1],
        index: m.index,
        line: content.substring(0, m.index).split('\n').length,
      }));
    }
  }

  return findings;
}

// -----------------------------------------------------------------------------
// Load source truth
// -----------------------------------------------------------------------------
function loadSourceTruth() {
  const truthPath = path.join(TOOLKIT_ROOT, 'docs/source-truth.json');
  if (!fs.existsSync(truthPath)) {
    console.error('ERROR: source-truth.json not found. Run extract-source-truth.js first.');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(truthPath, 'utf8'));
}

// -----------------------------------------------------------------------------
// Compare findings to truth
// -----------------------------------------------------------------------------
function compareFindings(scanResults, truth) {
  const issues = [];

  for (const result of scanResults) {
    const fileIssues = [];

    // Check SDK version
    if (result.findings.sdkVersion) {
      for (const match of result.findings.sdkVersion) {
        if (match.value !== truth.versions.sdk) {
          fileIssues.push({
            type: 'version',
            field: 'SDK',
            found: match.value,
            expected: truth.versions.sdk,
            line: match.line,
            match: match.match,
          });
        }
      }
    }

    // Check CLI version
    if (result.findings.cliVersion) {
      for (const match of result.findings.cliVersion) {
        if (match.value !== truth.versions.cli) {
          fileIssues.push({
            type: 'version',
            field: 'CLI',
            found: match.value,
            expected: truth.versions.cli,
            line: match.line,
            match: match.match,
          });
        }
      }
    }

    // Check MCP version
    if (result.findings.mcpVersion) {
      for (const match of result.findings.mcpVersion) {
        if (match.value !== truth.versions.mcp) {
          fileIssues.push({
            type: 'version',
            field: 'MCP',
            found: match.value,
            expected: truth.versions.mcp,
            line: match.line,
            match: match.match,
          });
        }
      }
    }

    // Check MCP tool count
    if (result.findings.mcpToolCount) {
      for (const match of result.findings.mcpToolCount) {
        const found = parseInt(match.value);
        if (found < truth.counts.mcpTools) {
          fileIssues.push({
            type: 'count',
            field: 'MCP Tools',
            found: match.value,
            expected: truth.counts.mcpTools.toString(),
            line: match.line,
            match: match.match,
          });
        }
      }
    }

    // Check template count
    if (result.findings.templateCount) {
      for (const match of result.findings.templateCount) {
        const found = parseInt(match.value);
        if (found < truth.counts.templates) {
          fileIssues.push({
            type: 'count',
            field: 'Templates',
            found: match.value,
            expected: truth.counts.templates.toString(),
            line: match.line,
            match: match.match,
          });
        }
      }
    }

    // Check for Genesis presets (should be Marketing)
    if (result.findings.genesisPresets) {
      const hasMarketing = result.findings.marketingPresets && result.findings.marketingPresets.length > 0;

      // Only flag in template/preset related files
      const isPresetFile = result.file.includes('template') ||
                           result.file.includes('preset') ||
                           result.file.includes('scaffold') ||
                           result.file.includes('swarm');

      if (!hasMarketing && isPresetFile) {
        fileIssues.push({
          type: 'preset',
          field: 'Presets',
          found: 'Genesis (oracle, brain, etc.)',
          expected: 'Marketing (writer, social, etc.)',
          line: result.findings.genesisPresets[0].line,
          match: result.findings.genesisPresets.map(m => m.value).join(', '),
        });
      }
    }

    // Check @gift TFET (exclude known valid amounts)
    const VALID_TFET_AMOUNTS = ['0', '10', '20', '30', '80', '120']; // zero-balance, referral, builder, old-leftover, new-leftover, deploy-fee
    if (result.findings.giftTfet) {
      for (const match of result.findings.giftTfet) {
        if (match.value !== truth.constants.giftTfet && !VALID_TFET_AMOUNTS.includes(match.value)) {
          fileIssues.push({
            type: 'constant',
            field: '@gift TFET',
            found: match.value,
            expected: truth.constants.giftTfet,
            line: match.line,
            match: match.match,
          });
        }
      }
    }

    // Check @gift tBNB (exclude gas fees like 0.0001)
    const VALID_TBNB_AMOUNTS = ['0.0001']; // gas fees
    if (result.findings.giftTbnb) {
      for (const match of result.findings.giftTbnb) {
        if (match.value !== truth.constants.giftTbnb && !VALID_TBNB_AMOUNTS.includes(match.value)) {
          fileIssues.push({
            type: 'constant',
            field: '@gift tBNB',
            found: match.value,
            expected: truth.constants.giftTbnb,
            line: match.line,
            match: match.match,
          });
        }
      }
    }

    if (fileIssues.length > 0) {
      issues.push({
        file: result.file,
        isPriority: PRIORITY_FILES.includes(result.file),
        issues: fileIssues,
      });
    }
  }

  // Sort: priority files first
  issues.sort((a, b) => (b.isPriority ? 1 : 0) - (a.isPriority ? 1 : 0));

  return issues;
}

// -----------------------------------------------------------------------------
// Generate markdown report
// -----------------------------------------------------------------------------
function generateReport(issues, truth) {
  const priorityIssues = issues.filter(f => f.isPriority);
  const otherIssues = issues.filter(f => !f.isPriority);

  let report = `# Docs Sync Validation Report

Generated: ${new Date().toISOString()}

## Source of Truth

| Item | Value |
|------|-------|
| SDK Version | ${truth.versions.sdk} |
| CLI Version | ${truth.versions.cli} |
| MCP Version | ${truth.versions.mcp} |
| Templates Version | ${truth.versions.templates} |
| MCP Tools | ${truth.counts.mcpTools} |
| CLI Commands | ${truth.counts.cliCommands} |
| Templates | ${truth.counts.templates} |
| @gift TFET | ${truth.constants.giftTfet} |
| @gift tBNB | ${truth.constants.giftTbnb} |

## Summary

| Category | Issues |
|----------|--------|
| Priority files | ${priorityIssues.reduce((sum, f) => sum + f.issues.length, 0)} in ${priorityIssues.length} files |
| Other files | ${otherIssues.reduce((sum, f) => sum + f.issues.length, 0)} in ${otherIssues.length} files |
| **Total** | **${issues.reduce((sum, f) => sum + f.issues.length, 0)} issues in ${issues.length} files** |

---

## PRIORITY FILES (fix these first)

`;

  for (const file of priorityIssues) {
    report += `### ${file.file}\n\n`;
    report += `| Line | Type | Field | Found | Expected |\n`;
    report += `|------|------|-------|-------|----------|\n`;

    for (const issue of file.issues) {
      const foundEsc = issue.found.replace(/\|/g, '\\|');
      const expectedEsc = issue.expected.replace(/\|/g, '\\|');
      report += `| ${issue.line} | ${issue.type} | ${issue.field} | \`${foundEsc}\` | \`${expectedEsc}\` |\n`;
    }

    report += '\n';
  }

  report += `---

## OTHER FILES (lower priority)

`;

  for (const file of otherIssues.slice(0, 20)) { // limit output
    report += `### ${file.file}\n\n`;
    report += `| Line | Type | Field | Found | Expected |\n`;
    report += `|------|------|-------|-------|----------|\n`;

    for (const issue of file.issues) {
      const foundEsc = issue.found.replace(/\|/g, '\\|');
      const expectedEsc = issue.expected.replace(/\|/g, '\\|');
      report += `| ${issue.line} | ${issue.type} | ${issue.field} | \`${foundEsc}\` | \`${expectedEsc}\` |\n`;
    }

    report += '\n';
  }

  if (otherIssues.length > 20) {
    report += `\n... and ${otherIssues.length - 20} more files (see sync-issues.json for full list)\n`;
  }

  return report;
}

// -----------------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------------
function main() {
  console.log('Loading source truth...');
  const truth = loadSourceTruth();

  console.log('Scanning priority files...');
  const allResults = [];

  for (const relPath of PRIORITY_FILES) {
    const fullPath = path.join(WEBSITE_ROOT, relPath);
    if (fs.existsSync(fullPath)) {
      const findings = scanFile(fullPath, PATTERNS);
      if (Object.keys(findings).length > 0) {
        allResults.push({
          file: relPath,
          findings,
        });
      }
    } else {
      console.log(`  Warning: ${relPath} not found`);
    }
  }

  console.log(`Found ${allResults.length} priority files with findings`);

  console.log('Comparing against source truth...');
  const issues = compareFindings(allResults, truth);

  console.log(`Found ${issues.reduce((sum, f) => sum + f.issues.length, 0)} issues in ${issues.length} files`);

  // Generate reports
  const markdownReport = generateReport(issues, truth);
  const reportPath = path.join(TOOLKIT_ROOT, 'docs/sync-validation-report.md');
  fs.writeFileSync(reportPath, markdownReport);

  const jsonPath = path.join(TOOLKIT_ROOT, 'docs/sync-issues.json');
  fs.writeFileSync(jsonPath, JSON.stringify(issues, null, 2));

  console.log('');
  console.log('Reports generated:');
  console.log(`  ${reportPath}`);
  console.log(`  ${jsonPath}`);

  // Print summary table
  console.log('');
  console.log('Issues by type:');
  const byType = {};
  for (const file of issues) {
    for (const issue of file.issues) {
      byType[issue.type] = (byType[issue.type] || 0) + 1;
    }
  }
  for (const [type, count] of Object.entries(byType)) {
    console.log(`  ${type}: ${count}`);
  }

  // Print files
  console.log('');
  console.log('Files with issues:');
  for (const file of issues) {
    console.log(`  ${file.file}: ${file.issues.length} issues`);
  }

  return issues;
}

main();
