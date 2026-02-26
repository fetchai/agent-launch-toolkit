#!/usr/bin/env node
/**
 * agentlaunch-cli
 *
 * CLI for the AgentLaunch platform — scaffold, deploy, and tokenize AI agents.
 *
 * Commands:
 *   agentlaunch create                      Flagship one-command flow: scaffold + deploy + tokenize
 *   agentlaunch config set-key <apiKey>     Store API key
 *   agentlaunch config show                 Show current config
 *   agentlaunch config set-url <url>        Set custom base URL
 *   agentlaunch scaffold <name>             Generate agent project from template
 *   agentlaunch deploy                      Deploy agent.py to Agentverse
 *   agentlaunch tokenize                    Create token record + handoff link
 *   agentlaunch list                        List tokens with pagination
 *   agentlaunch status <address>            Show token status
 *   agentlaunch comments <address>          List or post comments for a token
 *   agentlaunch holders <address>           Show token holder list
 *
 * All commands support --json for machine-readable output (AI agent use).
 */

import fs from "node:fs";
import path from "node:path";
import { Command } from "commander";

// Load .env file from cwd (no dependency needed)
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
import { registerCreateCommand } from "./commands/create.js";
import { registerDeployCommand } from "./commands/deploy.js";
import { registerHoldersCommand } from "./commands/holders.js";
import { registerListCommand } from "./commands/list.js";
import { registerScaffoldCommand } from "./commands/scaffold.js";
import { registerStatusCommand } from "./commands/status.js";
import { registerInit } from "./commands/init.js";
import { registerTokenizeCommand } from "./commands/tokenize.js";
import { registerOptimizeCommand } from "./commands/optimize.js";
import { registerBuyCommand } from "./commands/buy.js";
import { registerSellCommand } from "./commands/sell.js";

const program = new Command();

program
  .name("agentlaunch")
  .description(
    "AgentLaunch CLI — scaffold, deploy, and tokenize AI agents on agent-launch.ai",
  )
  .version("1.0.0");

// Register all subcommands
registerCreateCommand(program);
registerConfigCommand(program);
registerScaffoldCommand(program);
registerDeployCommand(program);
registerTokenizeCommand(program);
registerListCommand(program);
registerStatusCommand(program);
registerCommentsCommand(program);
registerHoldersCommand(program);
registerOptimizeCommand(program);
registerBuyCommand(program);
registerSellCommand(program);
registerInit(program);

// Show help if no command is given
if (process.argv.length <= 2) {
  program.help();
}

program.parseAsync(process.argv).catch((err: unknown) => {
  console.error((err as Error).message ?? String(err));
  process.exit(1);
});
