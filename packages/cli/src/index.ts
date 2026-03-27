#!/usr/bin/env node
/**
 * agentlaunch
 *
 * The simplest way to build AI agents on Fetch.ai.
 *
 * Usage:
 *   npx agentlaunch                    Interactive: name, description, deploy
 *   npx agentlaunch my-agent           Create agent with name "my-agent"
 *   npx agentlaunch my-agent --local   Scaffold only, don't deploy
 *
 * Other commands:
 *   agentlaunch deploy                 Deploy agent.py to Agentverse
 *   agentlaunch tokenize               Create token + handoff link
 *   agentlaunch status <address>       Check agent/token status
 *   agentlaunch config set-key <key>   Store API key
 */

import fs from "node:fs";
import path from "node:path";
import { Command } from "commander";

// Load .env file from cwd
try {
  const envPath = path.resolve(process.cwd(), ".env");
  const envContent = fs.readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
} catch {
  // No .env file — that's fine
}

import { registerCommentsCommand } from "./commands/comments.js";
import { registerConfigCommand } from "./commands/config.js";
import { runCreate, registerCreateCommand } from "./commands/create.js";
import { registerDeployCommand } from "./commands/deploy.js";
import { registerHoldersCommand } from "./commands/holders.js";
import { registerListCommand } from "./commands/list.js";
import { registerStatusCommand } from "./commands/status.js";
import { registerInit } from "./commands/init.js";
import { registerTokenizeCommand } from "./commands/tokenize.js";
import { registerOptimizeCommand } from "./commands/optimize.js";
import { registerBuyCommand } from "./commands/buy.js";
import { registerSellCommand } from "./commands/sell.js";
import { registerClaimCommand } from "./commands/claim.js";
import { registerScaffoldCommand } from "./commands/scaffold.js";
import { registerWalletCommand } from "./commands/wallet.js";
import { registerPayCommand } from "./commands/pay.js";
import { registerOrgTemplateCommand } from "./commands/org-template.js";
import { registerSwarmFromOrgCommand } from "./commands/swarm-from-org.js";
import { registerMarketingCommand } from "./commands/marketing.js";
import { registerAllianceCommand } from "./commands/alliance.js";
import { registerDocsCommand } from "./commands/docs.js";
import { registerSkillCommand } from "./commands/skill.js";

const program = new Command();

program
  .name("agentlaunch")
  .description("Build AI agents on Fetch.ai in seconds")
  .version("1.6.0")
  .argument("[name]", "Agent name (prompted if omitted)")
  .option("--local", "Scaffold only, don't deploy to Agentverse")
  .option("--description <desc>", "What your agent does")
  .option("--no-editor", "Skip launching an editor after scaffolding")
  .option("--json", "Output JSON (for scripts)")
  .action(async (name?: string, options?: { local?: boolean; description?: string; editor?: boolean; json?: boolean }) => {
    await runCreate({
      name,
      skipDeploy: options?.local,
      description: options?.description,
      noEditor: options?.editor === false,
      json: options?.json,
    });
  });

// Register subcommands for power users
registerCreateCommand(program);
registerConfigCommand(program);
registerDeployCommand(program);
registerTokenizeCommand(program);
registerListCommand(program);
registerStatusCommand(program);
registerCommentsCommand(program);
registerHoldersCommand(program);
registerOptimizeCommand(program);
registerBuyCommand(program);
registerSellCommand(program);
registerClaimCommand(program);
registerInit(program);
registerScaffoldCommand(program);
registerWalletCommand(program);
registerPayCommand(program);
registerOrgTemplateCommand(program);
registerSwarmFromOrgCommand(program);
registerMarketingCommand(program);
registerAllianceCommand(program);
registerDocsCommand(program);
registerSkillCommand(program);

program.parseAsync(process.argv).catch((err: unknown) => {
  console.error((err as Error).message ?? String(err));
  process.exit(1);
});
