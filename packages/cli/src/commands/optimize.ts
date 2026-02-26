/**
 * CLI: optimize command
 *
 * agentlaunch optimize <address> [--readme <path>] [--description <text>] [--avatar <url>] [--json]
 *
 * Updates metadata on an already-deployed Agentverse agent to improve ranking.
 * Auto-detects README.md in the current directory if --readme is not specified.
 * Prints the 7-factor optimization checklist after updating.
 */

import fs from "node:fs";
import path from "node:path";
import { Command } from "commander";
import { updateAgent, type OptimizationCheckItem } from "agentlaunch-sdk";
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

export function registerOptimizeCommand(program: Command): void {
  program
    .command("optimize <address>")
    .description("Update agent metadata (README, description, avatar) to improve Agentverse ranking")
    .option(
      "--readme <path>",
      "Path to README.md file (auto-detects ./README.md if omitted)",
    )
    .option(
      "--description <text>",
      "Short description for Agentverse directory (max 200 chars)",
    )
    .option(
      "--avatar <url>",
      "Public URL for the agent avatar image",
    )
    .option("--json", "Output only JSON (machine-readable)")
    .action(
      async (
        address: string,
        options: {
          readme?: string;
          description?: string;
          avatar?: string;
          json?: boolean;
        },
      ) => {
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

        // Resolve README content
        let readmeContent: string | undefined;
        if (options.readme) {
          const readmePath = path.resolve(process.cwd(), options.readme);
          if (!fs.existsSync(readmePath)) {
            const msg = `README file not found: ${readmePath}`;
            if (isJson) {
              console.log(JSON.stringify({ error: msg }));
            } else {
              console.error(`Error: ${msg}`);
            }
            process.exit(1);
          }
          readmeContent = fs.readFileSync(readmePath, "utf8");
        } else {
          // Auto-detect README.md in current directory
          const autoReadme = path.resolve(process.cwd(), "README.md");
          if (fs.existsSync(autoReadme)) {
            readmeContent = fs.readFileSync(autoReadme, "utf8");
            if (!isJson) {
              console.log("Auto-detected README.md in current directory");
            }
          }
        }

        const hasAnyMetadata = readmeContent || options.description || options.avatar;
        if (!hasAnyMetadata) {
          const msg = "No metadata to update. Provide --readme, --description, or --avatar.";
          if (isJson) {
            console.log(JSON.stringify({ error: msg }));
          } else {
            console.error(`Error: ${msg}`);
          }
          process.exit(1);
        }

        if (!isJson) {
          console.log(`Optimizing agent: ${address}`);
          if (readmeContent) console.log("  Updating: README");
          if (options.description) console.log("  Updating: Short Description");
          if (options.avatar) console.log("  Updating: Avatar URL");
        }

        try {
          const result = await updateAgent({
            apiKey,
            agentAddress: address,
            metadata: {
              readme: readmeContent,
              short_description: options.description,
              avatar_url: options.avatar,
            },
          });

          if (isJson) {
            console.log(JSON.stringify({
              success: result.success,
              updatedFields: result.updatedFields,
              optimization: result.optimization,
            }));
          } else {
            console.log(`\nUpdated ${result.updatedFields.length} field(s): ${result.updatedFields.join(", ")}`);
            printOptimizationChecklist(result.optimization);
          }
        } catch (err) {
          if (isJson) {
            console.log(JSON.stringify({ error: (err as Error).message }));
          } else {
            console.error(`Error: ${(err as Error).message}`);
          }
          process.exit(1);
        }
      },
    );
}
