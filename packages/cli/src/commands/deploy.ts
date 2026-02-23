/**
 * CLI-003: deploy command
 *
 * agentlaunch deploy [--file agent.py] [--name "My Agent"]
 *
 * Deploys an agent.py file to Agentverse:
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
import { agentverseRequest } from "../http.js";
import { requireApiKey } from "../config.js";

const AGENTVERSE_API = "https://agentverse.ai/v1";
const POLL_INTERVAL_MS = 5_000;
const MAX_POLLS = 12; // 60 seconds total

interface AgentCreatedResponse {
  address: string;
  wallet_address?: string;
}

interface AgentStatusResponse {
  compiled?: boolean;
  running?: boolean;
  wallet_address?: string;
}

interface CodeUploadResponse {
  digest?: string;
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

      if (!isJson) {
        console.log(`Deploying: ${filePath}`);
        console.log(`Agent name: ${agentName}`);
      }

      let agentAddress: string;

      // Step 1: Create agent
      if (!isJson) console.log("\n[1/5] Creating agent on Agentverse...");
      try {
        const created = await agentverseRequest<AgentCreatedResponse>(
          "POST",
          `${AGENTVERSE_API}/hosting/agents`,
          apiKey,
          { name: agentName },
        );
        agentAddress = created.address;
        if (!isJson) console.log(`      Address: ${agentAddress}`);
      } catch (err) {
        if (isJson) {
          console.log(JSON.stringify({ error: (err as Error).message }));
        } else {
          console.error(`Error: ${(err as Error).message}`);
        }
        process.exit(1);
      }

      // Step 2: Upload code
      // Agentverse expects code as a JSON string containing an array of file objects
      if (!isJson) console.log("[2/5] Uploading code...");
      try {
        const codeArray = [
          { language: "python", name: "agent.py", value: agentCode },
        ];
        const uploaded = await agentverseRequest<CodeUploadResponse>(
          "PUT",
          `${AGENTVERSE_API}/hosting/agents/${agentAddress}/code`,
          apiKey,
          { code: JSON.stringify(codeArray) },
        );
        if (!isJson) {
          const digest = uploaded.digest ?? "unknown";
          console.log(`      Digest: ${digest.slice(0, 16)}...`);
        }
      } catch (err) {
        if (isJson) {
          console.log(JSON.stringify({ error: `Upload failed: ${(err as Error).message}` }));
        } else {
          console.error(`Error uploading code: ${(err as Error).message}`);
        }
        process.exit(1);
      }

      // Step 3: Set secrets
      if (!isJson) console.log("[3/5] Setting secrets...");
      const secrets: Array<{ name: string; secret: string }> = [
        { name: "AGENTVERSE_API_KEY", secret: apiKey },
        { name: "AGENTLAUNCH_API_KEY", secret: apiKey },
      ];

      for (const s of secrets) {
        try {
          await agentverseRequest(
            "POST",
            `${AGENTVERSE_API}/hosting/secrets`,
            apiKey,
            { address: agentAddress, name: s.name, secret: s.secret },
          );
          if (!isJson) console.log(`      Set: ${s.name}`);
        } catch (err) {
          if (!isJson) {
            console.error(
              `      Warning: Could not set ${s.name}: ${(err as Error).message}`,
            );
          }
          // Non-fatal — continue
        }
      }

      // Step 4: Start agent
      if (!isJson) console.log("[4/5] Starting agent...");
      try {
        await agentverseRequest(
          "POST",
          `${AGENTVERSE_API}/hosting/agents/${agentAddress}/start`,
          apiKey,
        );
        if (!isJson) console.log("      Started.");
      } catch (err) {
        if (isJson) {
          console.log(JSON.stringify({ error: `Start failed: ${(err as Error).message}` }));
        } else {
          console.error(`Error starting agent: ${(err as Error).message}`);
        }
        process.exit(1);
      }

      // Step 5: Poll for compilation
      if (!isJson) console.log("[5/5] Waiting for compilation...");
      let compiled = false;
      let walletAddress: string | undefined;

      for (let i = 0; i < MAX_POLLS; i++) {
        await sleep(POLL_INTERVAL_MS);

        try {
          const response = await fetch(
            `${AGENTVERSE_API}/hosting/agents/${agentAddress}`,
            {
              headers: { Authorization: `bearer ${apiKey}` },
            },
          );

          if (response.ok) {
            const status =
              (await response.json()) as AgentStatusResponse;
            if (status.compiled) {
              compiled = true;
              walletAddress = status.wallet_address;
              if (!isJson) console.log("      Compiled.");
              break;
            }
          }
        } catch {
          // Transient network error — keep polling
        }

        if (!isJson) {
          const elapsed = ((i + 1) * POLL_INTERVAL_MS) / 1000;
          console.log(`      Waiting... (${elapsed}s)`);
        }
      }

      if (compiled) {
        if (isJson) {
          console.log(
            JSON.stringify({
              agentAddress,
              walletAddress,
              status: "compiled",
              agentverseUrl: `https://agentverse.ai/agents`,
            }),
          );
        } else {
          console.log("\n" + "=".repeat(50));
          console.log("DEPLOYMENT SUCCESSFUL");
          console.log("=".repeat(50));
          console.log(`Agent Address: ${agentAddress}`);
          if (walletAddress) {
            console.log(`Wallet:        ${walletAddress}`);
          }
          console.log(`Status:        Running & Compiled`);
          console.log(`\nView at: https://agentverse.ai/agents`);
          console.log(`\nNext — tokenize your agent:`);
          console.log(
            `  agentlaunch tokenize --agent ${agentAddress} --name "${agentName}" --symbol ABCD`,
          );
        }
      } else {
        if (isJson) {
          console.log(
            JSON.stringify({
              error: "Compilation timeout — agent created but did not compile within 60 seconds.",
              agentAddress,
              agentverseUrl: "https://agentverse.ai/agents",
            }),
          );
        } else {
          console.error("\n" + "=".repeat(50));
          console.error("COMPILATION TIMEOUT");
          console.error("=".repeat(50));
          console.error("Agent was created but did not compile within 60 seconds.");
          console.error(`Agent address: ${agentAddress}`);
          console.error("Check logs at: https://agentverse.ai/agents");
        }
        process.exit(1);
      }
    });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
