#!/usr/bin/env node
/**
 * @agent-launch/cli
 *
 * CLI for the AgentLaunch platform — scaffold, deploy, and tokenize AI agents.
 *
 * Commands:
 *   agentlaunch config set-key <apiKey>     Store API key
 *   agentlaunch config show                 Show current config
 *   agentlaunch config set-url <url>        Set custom base URL
 *   agentlaunch scaffold <name>             Generate agent project from template
 *   agentlaunch deploy                      Deploy agent.py to Agentverse
 *   agentlaunch tokenize                    Create token record + handoff link
 */
import { Command } from "commander";
import { registerConfigCommand } from "./commands/config.js";
import { registerDeployCommand } from "./commands/deploy.js";
import { registerScaffoldCommand } from "./commands/scaffold.js";
import { registerTokenizeCommand } from "./commands/tokenize.js";
const program = new Command();
program
    .name("agentlaunch")
    .description("AgentLaunch CLI — scaffold, deploy, and tokenize AI agents on agent-launch.ai")
    .version("1.0.0");
// Register all subcommands
registerConfigCommand(program);
registerScaffoldCommand(program);
registerDeployCommand(program);
registerTokenizeCommand(program);
// Show help if no command is given
if (process.argv.length <= 2) {
    program.help();
}
program.parseAsync(process.argv).catch((err) => {
    console.error(err.message ?? String(err));
    process.exit(1);
});
//# sourceMappingURL=index.js.map