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
import { deployAgent } from "agentlaunch-sdk";
import { requireApiKey } from "../config.js";

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

      if (!isJson) {
        console.log(`Deploying: ${filePath}`);
        console.log(`Agent name: ${agentName}`);
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
          console.log(`\nView at: https://agentverse.ai/agents`);
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
