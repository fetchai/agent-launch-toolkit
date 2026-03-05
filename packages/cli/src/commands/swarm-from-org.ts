/**
 * swarm-from-org command
 *
 * Parse a YAML org chart and deploy an AI agent swarm.
 *
 * Usage:
 *   npx agentlaunch swarm-from-org people.yaml
 *   npx agentlaunch swarm-from-org people.yaml --dry-run
 *   npx agentlaunch swarm-from-org people.yaml --yes
 */

import fs from "node:fs";
import path from "node:path";
import { Command } from "commander";
import * as YAML from "yaml";
import {
  generateSwarmFromOrg,
  summarizeSwarm,
  generateFromTemplate,
  getPreset,
  type OrgChart,
  type SwarmConfig,
} from "agentlaunch-templates";
import { deployAgent } from "agentlaunch-sdk";

interface SwarmFromOrgOptions {
  dryRun?: boolean;
  yes?: boolean;
  output?: string;
  json?: boolean;
}

export function registerSwarmFromOrgCommand(program: Command): void {
  program
    .command("swarm-from-org <file>")
    .description("Deploy an agent swarm from a YAML org chart file")
    .option("--dry-run", "Show what would be deployed without actually deploying")
    .option("-y, --yes", "Skip confirmation prompt")
    .option("-o, --output <dir>", "Output directory for scaffolded agents (with --dry-run)")
    .option("--json", "Output JSON (machine-readable)")
    .action(async (file: string, options: SwarmFromOrgOptions) => {
      const isJson = options.json === true;

      // 1. Read and parse YAML file
      const filePath = path.resolve(process.cwd(), file);
      if (!fs.existsSync(filePath)) {
        const msg = `File not found: ${filePath}`;
        if (isJson) {
          console.log(JSON.stringify({ error: msg }));
        } else {
          console.error(`Error: ${msg}`);
        }
        process.exit(1);
      }

      let orgChart: OrgChart;
      try {
        const content = fs.readFileSync(filePath, "utf8");
        orgChart = YAML.parse(content) as OrgChart;
      } catch (err) {
        const msg = `Failed to parse YAML: ${(err as Error).message}`;
        if (isJson) {
          console.log(JSON.stringify({ error: msg }));
        } else {
          console.error(`Error: ${msg}`);
        }
        process.exit(1);
      }

      // Validate required fields
      if (!orgChart.name || !orgChart.cSuite) {
        const msg = "Invalid org chart: 'name' and 'cSuite' are required";
        if (isJson) {
          console.log(JSON.stringify({ error: msg }));
        } else {
          console.error(`Error: ${msg}`);
        }
        process.exit(1);
      }

      // 2. Generate swarm configuration
      const swarmConfig = generateSwarmFromOrg(orgChart);

      // 3. Show summary
      if (!isJson) {
        console.log("\n" + summarizeSwarm(swarmConfig));
        console.log("\n---");
        console.log(`Total Deploy Cost: ${swarmConfig.totalDeployCost} FET`);
        console.log(`Total Agents: ${swarmConfig.totalAgents}\n`);
      }

      // 4. Dry run - just scaffold or show summary
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

      // 5. Confirm deployment
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

      // 6. Deploy agents wave by wave
      const results: Array<{
        name: string;
        symbol: string;
        agentAddress?: string;
        status?: string;
        error?: string;
      }> = [];

      for (const wave of swarmConfig.deploymentWaves) {
        if (!isJson) {
          const mode = wave.parallel ? "parallel" : "sequential";
          console.log(`\n--- Wave ${wave.wave} (${mode}) ---`);
        }

        for (const agentName of wave.agents) {
          const agentConfig = swarmConfig.agents.find(a => a.name === agentName);
          if (!agentConfig) continue;

          if (!isJson) {
            console.log(`Deploying ${agentConfig.displayName} ($${agentConfig.symbol})...`);
          }

          try {
            // Generate agent code
            const preset = getPreset(agentConfig.role);
            const variables = preset
              ? { ...preset.variables, agent_name: agentConfig.displayName }
              : { agent_name: agentConfig.displayName, ...agentConfig.variables };

            const generated = generateFromTemplate("swarm-starter", variables);

            // Build metadata
            const metadata = {
              readme: `# ${agentConfig.displayName}\n\n${agentConfig.description}\n\n## Services\n\n${Object.entries(agentConfig.services).map(([s, p]) => `- **${s}**: ${Number(p) / 1e18} FET`).join("\n")}\n\nPart of the ${swarmConfig.orgName} agent swarm.`,
              short_description: agentConfig.description.slice(0, 200),
            };

            // Deploy
            const result = await deployAgent({
              agentName: agentConfig.displayName,
              sourceCode: generated.code,
              metadata,
            });

            results.push({
              name: agentConfig.name,
              symbol: agentConfig.symbol,
              agentAddress: result.agentAddress,
              status: result.status,
            });

            if (!isJson) {
              console.log(`  ✓ ${result.agentAddress} (${result.status})`);
            }
          } catch (err) {
            results.push({
              name: agentConfig.name,
              symbol: agentConfig.symbol,
              error: (err as Error).message,
            });

            if (!isJson) {
              console.log(`  ✗ Error: ${(err as Error).message}`);
            }
          }
        }
      }

      // 7. Output results
      if (isJson) {
        console.log(JSON.stringify({
          orgName: swarmConfig.orgName,
          totalAgents: swarmConfig.totalAgents,
          deployed: results.filter(r => r.agentAddress).length,
          failed: results.filter(r => r.error).length,
          agents: results,
        }));
      } else {
        console.log("\n=== Deployment Summary ===");
        console.log(`Deployed: ${results.filter(r => r.agentAddress).length}/${results.length}`);

        if (results.some(r => r.error)) {
          console.log("\nFailed agents:");
          for (const r of results.filter(r => r.error)) {
            console.log(`  - ${r.name}: ${r.error}`);
          }
        }

        console.log("\nNext steps:");
        console.log("  1. Fund wallets: Send ~10 FET to each agent");
        console.log("  2. Tokenize: npx agentlaunch tokenize <agent-address>");
        console.log("  3. Monitor: npx agentlaunch status <agent-address>");
      }
    });
}

/**
 * Scaffold all agents to a directory without deploying.
 */
async function scaffoldSwarm(
  config: SwarmConfig,
  outputDir: string,
  isJson: boolean,
): Promise<void> {
  const targetDir = path.resolve(process.cwd(), outputDir);
  fs.mkdirSync(targetDir, { recursive: true });

  const scaffoldedFiles: string[] = [];

  for (const agent of config.agents) {
    const preset = getPreset(agent.role);
    const variables = preset
      ? { ...preset.variables, agent_name: agent.displayName }
      : { agent_name: agent.displayName, ...agent.variables };

    const generated = generateFromTemplate("swarm-starter", variables);
    const agentDir = path.join(targetDir, agent.name);
    fs.mkdirSync(agentDir, { recursive: true });
    fs.mkdirSync(path.join(agentDir, ".claude"), { recursive: true });

    const files: Record<string, string> = {
      "agent.py": generated.code,
      "README.md": generated.readme,
      ".env.example": generated.envExample,
      "CLAUDE.md": generated.claudeMd,
      ".claude/settings.json": generated.claudeSettings,
    };

    for (const [filename, content] of Object.entries(files)) {
      const filePath = path.join(agentDir, filename);
      fs.writeFileSync(filePath, content, "utf8");
      scaffoldedFiles.push(`${agent.name}/${filename}`);
    }

    if (!isJson) {
      console.log(`Scaffolded: ${agent.name}/`);
    }
  }

  if (isJson) {
    console.log(JSON.stringify({
      scaffolded: true,
      directory: targetDir,
      agents: config.agents.map(a => a.name),
      files: scaffoldedFiles.length,
    }));
  } else {
    console.log(`\nScaffolded ${config.agents.length} agents to ${targetDir}`);
    console.log("\nTo deploy individually:");
    console.log(`  cd ${outputDir}/<agent-name>`);
    console.log("  npx agentlaunch deploy");
  }
}
