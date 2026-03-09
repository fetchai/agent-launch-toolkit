/**
 * Shared swarm deployment utilities.
 *
 * Used by both `marketing` and `alliance` commands.
 */

import fs from "node:fs";
import path from "node:path";
import {
  generateSwarmFromOrg,
  generateFromTemplate,
  getPreset,
} from "agentlaunch-templates";
import { deployAgent } from "agentlaunch-sdk";

type SwarmConfig = ReturnType<typeof generateSwarmFromOrg>;

export interface DeployResult {
  name: string;
  symbol: string;
  agentAddress?: string;
  status?: string;
  error?: string;
}

/**
 * Deploy a single agent from a swarm config.
 */
async function deploySingleAgent(
  agentConfig: SwarmConfig["agents"][number],
  orgName: string,
  isJson: boolean,
): Promise<DeployResult> {
  try {
    const preset = getPreset(agentConfig.role);
    const variables = preset
      ? { ...preset.variables, agent_name: agentConfig.displayName }
      : { agent_name: agentConfig.displayName, ...agentConfig.variables };

    const generated = generateFromTemplate("swarm-starter", variables);

    const metadata = {
      readme: `# ${agentConfig.displayName}\n\n${agentConfig.description}\n\n## Services\n\n${Object.entries(agentConfig.services).map(([s, p]) => `- **${s}**: ${Number(p) / 1e18} FET`).join("\n")}\n\nPart of the ${orgName} agent swarm.`,
      short_description: agentConfig.description.slice(0, 200),
    };

    const result = await deployAgent({
      agentName: agentConfig.displayName,
      sourceCode: generated.code,
      metadata,
    });

    if (!isJson) {
      console.log(`  ✓ ${result.agentAddress} (${result.status})`);
    }

    return {
      name: agentConfig.name,
      symbol: agentConfig.symbol,
      agentAddress: result.agentAddress,
      status: result.status,
    };
  } catch (err) {
    if (!isJson) {
      console.log(`  ✗ Error: ${(err as Error).message}`);
    }

    return {
      name: agentConfig.name,
      symbol: agentConfig.symbol,
      error: (err as Error).message,
    };
  }
}

/**
 * Deploy all agents in a swarm config, respecting wave ordering
 * and using Promise.all() for parallel waves.
 */
export async function deploySwarmAgents(
  swarmConfig: SwarmConfig,
  isJson: boolean,
): Promise<DeployResult[]> {
  const results: DeployResult[] = [];

  for (const wave of swarmConfig.deploymentWaves) {
    if (!isJson) {
      const mode = wave.parallel ? "parallel" : "sequential";
      console.log(`\n--- Wave ${wave.wave} (${mode}) ---`);
    }

    const agentConfigs = wave.agents
      .map((agentName) => swarmConfig.agents.find((a) => a.name === agentName))
      .filter((a): a is SwarmConfig["agents"][number] => a !== undefined);

    if (wave.parallel) {
      // Actually run in parallel
      if (!isJson) {
        for (const ac of agentConfigs) {
          console.log(`Deploying ${ac.displayName} ($${ac.symbol})...`);
        }
      }

      const waveResults = await Promise.all(
        agentConfigs.map((ac) =>
          deploySingleAgent(ac, swarmConfig.orgName, isJson),
        ),
      );
      results.push(...waveResults);
    } else {
      // Sequential
      for (const ac of agentConfigs) {
        if (!isJson) {
          console.log(`Deploying ${ac.displayName} ($${ac.symbol})...`);
        }
        const result = await deploySingleAgent(ac, swarmConfig.orgName, isJson);
        results.push(result);
      }
    }
  }

  return results;
}

/**
 * Scaffold swarm agent files to a directory without deploying.
 */
export async function scaffoldSwarm(
  config: SwarmConfig,
  outputDir: string,
  isJson: boolean,
): Promise<void> {
  const targetDir = path.resolve(process.cwd(), outputDir);
  fs.mkdirSync(targetDir, { recursive: true });

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
      fs.writeFileSync(path.join(agentDir, filename), content, "utf8");
    }

    if (!isJson) {
      console.log(`Scaffolded: ${agent.name}/`);
    }
  }

  if (isJson) {
    console.log(JSON.stringify({
      scaffolded: true,
      directory: targetDir,
      agents: config.agents.map((a) => a.name),
    }));
  } else {
    console.log(`\nScaffolded ${config.agents.length} agents to ${targetDir}`);
  }
}
