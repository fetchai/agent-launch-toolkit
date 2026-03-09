/**
 * marketing command
 *
 * Deploy the 7-agent Marketing Team swarm with a single command.
 *
 * Usage:
 *   npx agentlaunch marketing
 *   npx agentlaunch marketing --dry-run
 *   npx agentlaunch marketing --output ./my-team
 */

import { Command } from "commander";
import {
  generateSwarmFromOrg,
  summarizeSwarm,
  EXAMPLE_ORGS,
} from "agentlaunch-templates";
import { scaffoldSwarm, deploySwarmAgents } from "../lib/deploy-swarm.js";

interface MarketingOptions {
  dryRun?: boolean;
  yes?: boolean;
  output?: string;
  json?: boolean;
}

export function registerMarketingCommand(program: Command): void {
  program
    .command("marketing")
    .description("Deploy the 7-agent Marketing Team swarm")
    .option("--dry-run", "Show what would be deployed without deploying")
    .option("-y, --yes", "Skip confirmation prompt")
    .option("-o, --output <dir>", "Scaffold agents to directory (no deploy)")
    .option("--json", "Output JSON (machine-readable)")
    .action(async (options: MarketingOptions) => {
      const isJson = options.json === true;

      // Use the built-in marketing org chart
      const swarmConfig = generateSwarmFromOrg(EXAMPLE_ORGS.marketing);

      // Show summary
      if (!isJson) {
        console.log("\n" + summarizeSwarm(swarmConfig));
        console.log("\n---");
        console.log(`Total Deploy Cost: ${swarmConfig.totalDeployCost} FET`);
        console.log(`Total Agents: ${swarmConfig.totalAgents}\n`);
      }

      // Dry run - just scaffold or show summary
      if (options.dryRun) {
        if (options.output) {
          await scaffoldSwarm(swarmConfig, options.output, isJson);
        } else if (isJson) {
          console.log(JSON.stringify({
            dryRun: true,
            orgName: swarmConfig.orgName,
            totalAgents: swarmConfig.totalAgents,
            totalDeployCost: swarmConfig.totalDeployCost,
            agents: swarmConfig.agents.map(a => ({
              name: a.name,
              symbol: a.symbol,
              role: a.role,
              tier: a.tier,
            })),
          }));
        } else {
          console.log("Dry run complete. Use --output <dir> to scaffold agent files.");
        }
        return;
      }

      // Output-only mode
      if (options.output) {
        await scaffoldSwarm(swarmConfig, options.output, isJson);
        return;
      }

      // Confirm deployment
      if (!options.yes && !isJson) {
        const readline = await import("node:readline");
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });

        const answer = await new Promise<string>((resolve) => {
          rl.question(`Deploy ${swarmConfig.totalAgents} agents for ${swarmConfig.totalDeployCost} FET? [y/N] `, resolve);
        });
        rl.close();

        if (answer.toLowerCase() !== "y") {
          console.log("Aborted.");
          return;
        }
      }

      // Deploy agents (parallel waves use Promise.all)
      const results = await deploySwarmAgents(swarmConfig, isJson);

      // Output results
      if (isJson) {
        console.log(JSON.stringify({
          orgName: swarmConfig.orgName,
          totalAgents: swarmConfig.totalAgents,
          deployed: results.filter(r => r.agentAddress).length,
          failed: results.filter(r => r.error).length,
          agents: results,
        }));
      } else {
        console.log("\n=== Marketing Team Deployed ===");
        console.log(`Deployed: ${results.filter(r => r.agentAddress).length}/${results.length}`);
      }
    });
}
