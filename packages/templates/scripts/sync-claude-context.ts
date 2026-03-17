#!/usr/bin/env npx tsx
/**
 * Syncs .claude/rules/ and .claude/skills/ from the repo root
 * into packages/templates/src/claude-context.ts so that scaffolded
 * projects get the same files as the repo.
 *
 * Usage: npx tsx packages/templates/scripts/sync-claude-context.ts
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "../../..");
const RULES_DIR = path.join(ROOT, ".claude/rules");
const SKILLS_DIR = path.join(ROOT, ".claude/skills");
const TARGET = path.join(ROOT, "packages/templates/src/claude-context.ts");

function escapeTemplate(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
}

// ---- Read rules ----
const ruleFiles = fs.readdirSync(RULES_DIR).filter(f => f.endsWith(".md")).sort();
const rules: Record<string, string> = {};
for (const f of ruleFiles) {
  rules[f] = fs.readFileSync(path.join(RULES_DIR, f), "utf8").trimEnd();
}

// ---- Read skills ----
const skills: Record<string, string> = {};
const skillEntries = fs.readdirSync(SKILLS_DIR).sort();
for (const entry of skillEntries) {
  const fullPath = path.join(SKILLS_DIR, entry);
  const stat = fs.statSync(fullPath);
  if (stat.isDirectory()) {
    // Look for SKILL.md inside directory
    const skillFile = path.join(fullPath, "SKILL.md");
    if (fs.existsSync(skillFile)) {
      skills[`${entry}/SKILL.md`] = fs.readFileSync(skillFile, "utf8").trimEnd();
    }
  } else if (entry.endsWith(".md")) {
    // Top-level skill file (e.g., improve.md)
    skills[entry] = fs.readFileSync(fullPath, "utf8").trimEnd();
  }
}

// ---- Read existing file to preserve non-RULES/SKILLS content ----
const existing = fs.readFileSync(TARGET, "utf8");

// Find the RULES block
const rulesStart = existing.indexOf("export const RULES: Record<string, string> = {");
const rulesEnd = existing.indexOf("\n};\n", rulesStart) + 4;

// Find the SKILLS block
const skillsStart = existing.indexOf("export const SKILLS: Record<string, string> = {");
const skillsEnd = existing.indexOf("\n};\n", skillsStart) + 4;

// Build new RULES
let rulesBlock = "export const RULES: Record<string, string> = {\n";
for (const [filename, content] of Object.entries(rules)) {
  rulesBlock += `  "${filename}": \`${escapeTemplate(content)}\`,\n`;
}
rulesBlock += "};";

// Build new SKILLS
let skillsBlock = "export const SKILLS: Record<string, string> = {\n";
for (const [filepath, content] of Object.entries(skills)) {
  skillsBlock += `  "${filepath}": \`${escapeTemplate(content)}\`,\n`;
}
skillsBlock += "};";

// Replace in file
let output = existing.slice(0, rulesStart) + rulesBlock + existing.slice(rulesEnd);
// Recalculate skills position after rules replacement
const newSkillsStart = output.indexOf("export const SKILLS: Record<string, string> = {");
const newSkillsEnd = output.indexOf("\n};\n", newSkillsStart) + 4;
output = output.slice(0, newSkillsStart) + skillsBlock + output.slice(newSkillsEnd);

fs.writeFileSync(TARGET, output, "utf8");

console.log(`Synced ${ruleFiles.length} rules and ${Object.keys(skills).length} skills to claude-context.ts`);
console.log(`  Rules: ${ruleFiles.join(", ")}`);
console.log(`  Skills: ${Object.keys(skills).join(", ")}`);
