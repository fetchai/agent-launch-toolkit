/**
 * CLI-002: scaffold command
 *
 * agentlaunch scaffold <name> [--type faucet|research|trading|data|custom]
 *                             [--template <name>]
 *
 * Generates an agent project directory with six files:
 *   agent.py              - Agent code from agentlaunch-templates
 *   README.md             - Quickstart instructions
 *   .env.example          - Required environment variables
 *   CLAUDE.md             - AI coding assistant context
 *   .claude/settings.json - MCP server configuration
 *   agentlaunch.config.json - CLI auto-detection config
 *
 * Template mapping (old CLI types -> templates package names):
 *   faucet   -> custom
 *   research -> research
 *   trading  -> trading-bot
 *   data     -> data-analyzer
 * New template names (custom, price-monitor, trading-bot, data-analyzer,
 * research, gifter) are accepted directly.
 */

import fs from "node:fs";
import path from "node:path";
import { Command } from "commander";
import { generateFromTemplate, listTemplates, getTemplate, getCanonicalName } from "agentlaunch-templates";

/** Map legacy --type values to current template names. */
const LEGACY_TYPE_MAP: Record<string, string> = {
  faucet: "custom",
  research: "research",
  trading: "trading-bot",
  data: "data-analyzer",
  genesis: "swarm-starter", // Legacy alias for swarm-starter
};

/** All valid --type / --template values accepted by the scaffold command. */
const VALID_TYPES = [
  "swarm-starter", // Primary name (recommended)
  "faucet",
  "research",
  "trading",
  "data",
  "genesis", // Legacy alias
  ...listTemplates().map((t) => getCanonicalName(t.name)),
];

export function registerScaffoldCommand(program: Command): void {
  program
    .command("scaffold <name>")
    .description(
      "Generate an agent project from template in a new directory <name>",
    )
    .option(
      "--type <type>",
      "Agent type: swarm-starter (recommended), custom, price-monitor, trading-bot, data-analyzer, research, gifter (default: research)",
      "research",
    )
    .option("--json", "Output only JSON (machine-readable)")
    .action((name: string, options: { type: string; json?: boolean }) => {
      const isJson = options.json === true;
      const rawType = options.type;

      // Resolve the template name: legacy map first, then direct name
      const templateName = LEGACY_TYPE_MAP[rawType] ?? rawType;

      // Validate by checking the templates registry (getTemplate handles aliases)
      const templateMeta = getTemplate(templateName);

      if (!templateMeta) {
        const validList = VALID_TYPES.filter(
          (v, i, arr) => arr.indexOf(v) === i,
        ).join(", ");
        if (isJson) {
          console.log(
            JSON.stringify({ error: `--type must be one of: ${validList}` }),
          );
        } else {
          console.error(`Error: --type must be one of: ${validList}`);
        }
        process.exit(1);
      }

      // Sanitize directory name
      const dirName = name.replace(/[^a-zA-Z0-9_-]/g, "-").toLowerCase();
      const targetDir = path.resolve(process.cwd(), dirName);

      if (fs.existsSync(targetDir)) {
        if (isJson) {
          console.log(
            JSON.stringify({ error: `Directory "${dirName}" already exists.` }),
          );
        } else {
          console.error(`Error: Directory "${dirName}" already exists.`);
        }
        process.exit(1);
      }

      if (!isJson) {
        console.log(
          `Scaffolding ${templateMeta.description} agent: ${name}`,
        );
        console.log(`Directory: ${targetDir}`);
      }

      // Generate all files from the templates package
      const generated = generateFromTemplate(templateName, {
        agent_name: name,
      });

      // Create directory structure
      fs.mkdirSync(targetDir, { recursive: true });
      fs.mkdirSync(path.join(targetDir, ".claude"), { recursive: true });

      const files: Record<string, string> = {
        "agent.py": generated.code,
        "README.md": generated.readme,
        ".env.example": generated.envExample,
        "CLAUDE.md": generated.claudeMd,
        ".claude/settings.json": generated.claudeSettings,
        "agentlaunch.config.json": generated.agentlaunchConfig,
      };

      for (const [filename, content] of Object.entries(files)) {
        const filePath = path.join(targetDir, filename);
        fs.writeFileSync(filePath, content, "utf8");
        if (!isJson) console.log(`  Created: ${filename}`);
      }

      if (isJson) {
        console.log(
          JSON.stringify({
            name,
            type: rawType,
            template: templateName,
            directory: targetDir,
            files: Object.keys(files),
          }),
        );
      } else {
        console.log(`\nDone! Next steps:\n`);
        console.log(`  cd ${dirName}`);
        console.log(`  cp .env.example .env`);
        console.log(`  # Edit .env and agent.py`);
        console.log(`  agentlaunch deploy`);
      }
    });
}
