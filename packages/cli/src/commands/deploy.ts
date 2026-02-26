/**
 * CLI-003: deploy command
 *
 * agentlaunch deploy [--file agent.py] [--name "My Agent"] [--json]
 *
 * Deploys an agent.py file to Agentverse using the SDK deployAgent helper:
 *   1. Creates agent record
 *   2. Uploads code (double-encoded as Agentverse expects)
 *   3. Sets AGENTVERSE_API_KEY and AGENTLAUNCH_API_KEY secrets
 *   4. Starts the agent
 *   5. Polls until compiled (up to 60 s)
 *
 * Reads the API key from ~/.agentlaunch/config.json (set with `config set-key`).
 * The same key is used for both the Agentverse auth header and the two secrets.
 */

import fs from "node:fs";
import path from "node:path";
import { Command } from "commander";
import { deployAgent, type OptimizationCheckItem } from "agentlaunch-sdk";
import { requireApiKey } from "../config.js";

function printOptimizationChecklist(items: OptimizationCheckItem[]): void {
  console.log("\n" + "-".repeat(50));
  console.log("AGENT OPTIMIZATION CHECKLIST");
  console.log("-".repeat(50));
  let doneCount = 0;
  for (const item of items) {
    const mark = item.done ? "x" : " ";
    if (item.done) doneCount++;
    let line = `  [${mark}] ${item.factor}`;
    if (!item.done && item.hint) {
      line += ` — ${item.hint}`;
    }
    console.log(line);
  }
  console.log(`\n  Score: ${doneCount}/${items.length} ranking factors addressed`);
}

export function registerDeployCommand(program: Command): void {
  program
    .command("deploy")
    .description("Deploy agent.py to Agentverse")
    .option(
      "--file <path>",
      "Path to the agent Python file (default: ./agent.py)",
      "agent.py",
    )
    .option(
      "--name <name>",
      "Display name for the agent on Agentverse",
      "AgentLaunch Agent",
    )
    .option("--json", "Output only JSON (machine-readable)")
    .action(async (options: { file: string; name: string; json?: boolean }) => {
      const isJson = options.json === true;
      const apiKey = (() => {
        try {
          return requireApiKey();
        } catch (err) {
          if (isJson) {
            console.log(JSON.stringify({ error: (err as Error).message }));
          } else {
            console.error((err as Error).message);
          }
          process.exit(1);
        }
      })();

      const filePath = path.resolve(process.cwd(), options.file);
      if (!fs.existsSync(filePath)) {
        if (isJson) {
          console.log(
            JSON.stringify({
              error: `Agent file not found: ${filePath}. Run agentlaunch scaffold <name> first.`,
            }),
          );
        } else {
          console.error(`Error: Agent file not found: ${filePath}`);
          console.error(
            "Run 'agentlaunch scaffold <name>' first to generate an agent.",
          );
        }
        process.exit(1);
      }

      const agentName = options.name.slice(0, 64).trim();
      const agentCode = fs.readFileSync(filePath, "utf8");

      // Auto-detect README.md and agentlaunch.config.json next to agent file
      const agentDir = path.dirname(filePath);
      const readmePath = path.join(agentDir, "README.md");
      const configPath = path.join(agentDir, "agentlaunch.config.json");

      const metadata: { readme?: string; short_description?: string } = {};
      if (fs.existsSync(readmePath)) {
        metadata.readme = fs.readFileSync(readmePath, "utf8");
      }
      if (fs.existsSync(configPath)) {
        try {
          const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
          if (config.description) {
            metadata.short_description = String(config.description).slice(0, 200);
          }
        } catch {
          // ignore malformed config
        }
      }

      if (!isJson) {
        console.log(`Deploying: ${filePath}`);
        console.log(`Agent name: ${agentName}`);
        if (metadata.readme) console.log(`README:     auto-detected`);
        if (metadata.short_description) console.log(`Description: auto-detected`);
        console.log("\n[1/5] Creating agent on Agentverse...");
        console.log("[2/5] Uploading code...");
        console.log("[3/5] Setting secrets...");
        console.log("[4/5] Starting agent...");
        console.log("[5/5] Waiting for compilation...");
      }

      let deployed: Awaited<ReturnType<typeof deployAgent>>;
      try {
        deployed = await deployAgent({
          apiKey,
          agentName,
          sourceCode: agentCode,
          metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
        });
      } catch (err) {
        if (isJson) {
          console.log(JSON.stringify({ error: (err as Error).message }));
        } else {
          console.error(`Error: ${(err as Error).message}`);
        }
        process.exit(1);
      }

      if (!isJson && deployed.secretErrors?.length) {
        for (const se of deployed.secretErrors) {
          console.error(`      Warning: ${se}`);
        }
      }

      const compiled =
        deployed.status === "compiled" || deployed.status === "running";

      if (compiled) {
        if (isJson) {
          console.log(
            JSON.stringify({
              agentAddress: deployed.agentAddress,
              walletAddress: deployed.walletAddress,
              status: deployed.status,
              agentverseUrl: `https://agentverse.ai/agents`,
              optimization: deployed.optimization,
            }),
          );
        } else {
          console.log("\n" + "=".repeat(50));
          console.log("DEPLOYMENT SUCCESSFUL");
          console.log("=".repeat(50));
          console.log(`Agent Address: ${deployed.agentAddress}`);
          if (deployed.walletAddress) {
            console.log(`Wallet:        ${deployed.walletAddress}`);
          }
          console.log(`Status:        Running & Compiled`);

          // Print optimization checklist
          if (deployed.optimization) {
            printOptimizationChecklist(deployed.optimization);
          }

          console.log(`\nNext — tokenize your agent:`);
          console.log(
            `  agentlaunch tokenize --agent ${deployed.agentAddress} --name "${agentName}" --symbol ABCD`,
          );
        }
      } else {
        if (isJson) {
          console.log(
            JSON.stringify({
              error:
                "Compilation timeout — agent created but did not compile within 60 seconds.",
              agentAddress: deployed.agentAddress,
              agentverseUrl: "https://agentverse.ai/agents",
            }),
          );
        } else {
          console.error("\n" + "=".repeat(50));
          console.error("COMPILATION TIMEOUT");
          console.error("=".repeat(50));
          console.error(
            "Agent was created but did not compile within 60 seconds.",
          );
          console.error(`Agent address: ${deployed.agentAddress}`);
          console.error("Check logs at: https://agentverse.ai/agents");
        }
        process.exit(1);
      }
    });
}
