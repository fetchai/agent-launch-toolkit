/**
 * CLI-002 + CLI-006: create command
 *
 * agentlaunch create [--name "My Agent"] [--ticker MYAG] [--template custom]
 *                    [--description "..."] [--chain 97] [--deploy] [--tokenize] [--json]
 *
 * Flagship one-command flow:
 *   1. Scaffold agent project (always) — via agentlaunch-templates
 *   2. Deploy to Agentverse (if --deploy) — via agentlaunch-sdk deployAgent
 *   3. Tokenize on AgentLaunch (if --tokenize) — via agentlaunch-sdk client
 *   4. Print handoff link
 *
 * When name/ticker are omitted, uses readline for interactive prompts.
 *
 * Platform constants (source of truth: deployed smart contracts):
 *   - Deploy fee:          120 FET (read dynamically, can change via multi-sig)
 *   - Graduation target:   30,000 FET -> auto DEX listing
 *   - Trading fee:         2% -> 100% to protocol treasury (NO creator fee)
 */

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { spawn } from "node:child_process";
import { Command } from "commander";
import { deployAgent, getFrontendUrl } from "agentlaunch-sdk";
import { execSync } from "node:child_process";
import { generateFromTemplate, listTemplates, RULES, SKILLS, buildPackageJson, CURSOR_MCP_CONFIG, CURSOR_RULES } from "agentlaunch-templates";
import { getClient, agentverseRequest } from "../http.js";
import { requireApiKey } from "../config.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TemplateId = "custom" | "research" | "trading-bot" | "data-analyzer" | "price-monitor" | "gifter";

const TEMPLATES: Record<string, { label: string; description: string }> = {};

// Populate from templates package at module load time
for (const t of listTemplates()) {
  TEMPLATES[t.name] = { label: t.name, description: t.description };
}

// Legacy CLI type aliases -> template names
const LEGACY_ALIAS: Record<string, string> = {
  faucet: "custom",
  research: "research",
  trading: "trading-bot",
  data: "data-analyzer",
};

const TEMPLATE_LIST = listTemplates().map((t) => ({
  id: t.name as TemplateId,
  label: t.name,
  description: t.description,
}));

interface TokenizeResponse {
  token_id?: number;
  tokenId?: number;
  token_address?: string;
  handoff_link?: string;
  data?: { token_id?: number; handoff_link?: string };
  message?: string;
}

interface CreateResult {
  name: string;
  ticker: string;
  template: string;
  scaffoldDir?: string;
  agentAddress?: string;
  walletAddress?: string;
  tokenId?: number;
  tokenAddress?: string;
  handoffLink?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function prompt(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

function sanitizeDirName(s: string): string {
  return s.replace(/[^a-zA-Z0-9_-]/g, "-").toLowerCase();
}

// ---------------------------------------------------------------------------
// Tokenize
// ---------------------------------------------------------------------------

async function tokenizeAgent(
  agentAddress: string,
  name: string,
  ticker: string,
  description: string,
  chainId: number,
  json: boolean,
): Promise<{ tokenId?: number; tokenAddress?: string; handoffLink?: string }> {
  if (!json) console.log("\nTokenizing agent on AgentLaunch...");

  const client = getClient();
  const result = await client.post<TokenizeResponse>("/api/agents/tokenize", {
    agentAddress,
    name,
    symbol: ticker.toUpperCase(),
    description,
    chainId,
  });

  const tokenId =
    result.token_id ?? result.tokenId ?? result.data?.token_id;
  const tokenAddress = result.token_address;
  const frontendUrl = getFrontendUrl();
  const handoffLink =
    result.handoff_link ??
    result.data?.handoff_link ??
    (tokenId !== undefined ? `${frontendUrl}/deploy/${tokenId}` : undefined);

  return { tokenId, tokenAddress, handoffLink };
}

// ---------------------------------------------------------------------------
// Command registration
// ---------------------------------------------------------------------------

export function registerCreateCommand(program: Command): void {
  program
    .command("create")
    .description(
      "Flagship one-command flow: scaffold -> deploy -> tokenize an AI agent",
    )
    .option("--name <name>", "Agent name (prompted if omitted)")
    .option("--ticker <ticker>", "Token ticker symbol e.g. MYAG (prompted if omitted)")
    .option(
      "--template <template>",
      "Agent template: custom, research, trading-bot, data-analyzer, price-monitor, gifter (default: custom)",
    )
    .option("--description <desc>", "Token description (max 500 chars)")
    .option(
      "--chain <chainId>",
      "Chain ID: 97 (BSC testnet) or 56 (BSC mainnet) (default: 97)",
      "97",
    )
    .option("--deploy", "Deploy agent to Agentverse after scaffolding")
    .option("--tokenize", "Create token record on AgentLaunch after deploy")
    .option("--json", "Output only JSON (machine-readable, disables prompts)")
    .action(
      async (options: {
        name?: string;
        ticker?: string;
        template?: string;
        description?: string;
        chain: string;
        deploy?: boolean;
        tokenize?: boolean;
        json?: boolean;
      }) => {
        const isJson = options.json === true;

        // When --json is set we never prompt — fail fast with errors
        let name = options.name?.trim() ?? "";
        let ticker = options.ticker?.trim() ?? "";
        // Resolve legacy aliases and raw template names
        let templateRaw = options.template ?? "";
        let template = LEGACY_ALIAS[templateRaw] ?? templateRaw;
        let doDeploy = options.deploy === true;
        let doTokenize = options.tokenize === true;

        // Interactive prompts (only when not --json)
        let description = options.description?.trim() ?? "";

        if (!isJson) {
          const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
          });

          if (!name) {
            name = (await prompt(rl, "Agent name: ")).trim();
          }

          if (!ticker) {
            ticker = (await prompt(rl, "Ticker symbol: ")).trim();
          }

          if (!description) {
            description = (await prompt(rl, "Describe what your agent does: ")).trim();
          }

          // Always use custom template for interactive flow
          template = "custom";

          // Combined launch question (deploy + tokenize)
          if (!options.deploy && !options.tokenize) {
            const ans = (
              await prompt(rl, "Launch code? (y/N): ")
            )
              .trim()
              .toLowerCase();
            const launch = ans === "y" || ans === "yes";
            doDeploy = launch;
            doTokenize = launch;
          }

          rl.close();
        }

        // Validate inputs
        const errors: string[] = [];
        if (!name) errors.push("--name is required");
        else if (name.length > 32)
          errors.push("--name must be 32 characters or fewer");

        if (!ticker) errors.push("--ticker is required");
        else {
          const t = ticker.toUpperCase();
          if (t.length < 2 || t.length > 11) {
            errors.push("--ticker must be 2-11 characters");
          }
        }

        if (!template || !TEMPLATES[template]) {
          template = "custom";
        }

        const chainId = parseInt(options.chain, 10);
        if (![56, 97].includes(chainId)) {
          errors.push("--chain must be 97 (BSC testnet) or 56 (BSC mainnet)");
        }

        if (errors.length > 0) {
          if (isJson) {
            console.log(JSON.stringify({ error: errors.join("; ") }));
          } else {
            errors.forEach((e) => console.error(`Error: ${e}`));
          }
          process.exit(1);
        }

        const result: CreateResult = {
          name,
          ticker: ticker.toUpperCase(),
          template,
        };

        // Step 1: Scaffold
        const dirName = sanitizeDirName(name);
        const targetDir = path.resolve(process.cwd(), dirName);

        if (!isJson) {
          console.log(`\nScaffolding agent: ${name} (${TEMPLATES[template]?.label ?? template})`);
          console.log(`Directory: ${targetDir}`);
        }

        if (fs.existsSync(targetDir)) {
          const msg = `Directory "${dirName}" already exists.`;
          if (isJson) {
            console.log(JSON.stringify({ error: msg }));
          } else {
            console.error(`Error: ${msg}`);
          }
          process.exit(1);
        }

        // Truncate description if too long
        const finalDescription = (description || TEMPLATES[template]?.description || "").slice(0, 500);

        // Generate files from templates package
        const generated = generateFromTemplate(template, {
          agent_name: name,
          description: finalDescription,
        });

        fs.mkdirSync(targetDir, { recursive: true });
        fs.mkdirSync(path.join(targetDir, ".claude"), { recursive: true });
        fs.mkdirSync(path.join(targetDir, ".claude", "rules"), { recursive: true });
        fs.mkdirSync(path.join(targetDir, ".claude", "skills"), { recursive: true });
        fs.mkdirSync(path.join(targetDir, ".cursor"), { recursive: true });

        // Core files
        fs.writeFileSync(path.join(targetDir, "agent.py"), generated.code, "utf8");
        fs.writeFileSync(path.join(targetDir, "README.md"), generated.readme, "utf8");
        fs.writeFileSync(path.join(targetDir, ".env.example"), generated.envExample, "utf8");
        fs.writeFileSync(path.join(targetDir, "CLAUDE.md"), generated.claudeMd, "utf8");
        fs.writeFileSync(path.join(targetDir, "package.json"), buildPackageJson(name), "utf8");
        fs.writeFileSync(
          path.join(targetDir, ".claude", "settings.json"),
          generated.claudeSettings,
          "utf8",
        );
        fs.writeFileSync(
          path.join(targetDir, "agentlaunch.config.json"),
          generated.agentlaunchConfig,
          "utf8",
        );

        // Claude rules (for AI context)
        for (const [filename, content] of Object.entries(RULES)) {
          fs.writeFileSync(path.join(targetDir, ".claude", "rules", filename), content, "utf8");
        }

        // Claude skills (slash commands for AI)
        for (const [filepath, content] of Object.entries(SKILLS)) {
          const skillDir = path.dirname(filepath);
          fs.mkdirSync(path.join(targetDir, ".claude", "skills", skillDir), { recursive: true });
          fs.writeFileSync(path.join(targetDir, ".claude", "skills", filepath), content, "utf8");
        }

        // Cursor IDE config
        fs.writeFileSync(path.join(targetDir, ".cursor", "mcp.json"), CURSOR_MCP_CONFIG, "utf8");
        fs.writeFileSync(path.join(targetDir, ".cursorrules"), CURSOR_RULES, "utf8");

        result.scaffoldDir = targetDir;

        if (!isJson) {
          console.log(`  Created: agent.py`);
          console.log(`  Created: README.md`);
          console.log(`  Created: .env.example`);
          console.log(`  Created: CLAUDE.md`);
          console.log(`  Created: package.json`);
          console.log(`  Created: .claude/ (settings, rules, skills)`);
          console.log(`  Created: .cursor/ (MCP config)`);
          console.log(`  Created: .cursorrules`);
          console.log(`  Created: agentlaunch.config.json`);
        }

        // Install dependencies
        if (!isJson) {
          console.log(`\nInstalling dependencies...`);
        }
        try {
          execSync("npm install", { cwd: targetDir, stdio: isJson ? "ignore" : "inherit" });
        } catch {
          if (!isJson) {
            console.log(`  Warning: npm install failed. Run it manually.`);
          }
        }

        // Step 2: Deploy (optional)
        if (doDeploy) {
          let apiKey: string;
          try {
            apiKey = requireApiKey();
          } catch (err) {
            if (isJson) {
              console.log(JSON.stringify({ error: (err as Error).message }));
            } else {
              console.error((err as Error).message);
            }
            process.exit(1);
          }

          if (!isJson) console.log("\n[1/5] Creating agent on Agentverse...");
          if (!isJson) console.log("[2/5] Uploading code...");
          if (!isJson) console.log("[3/5] Setting secrets...");
          if (!isJson) console.log("[4/5] Starting agent...");
          if (!isJson) console.log("[5/5] Waiting for compilation...");

          try {
            const agentCode = fs.readFileSync(
              path.join(targetDir, "agent.py"),
              "utf8",
            );
            const deployed = await deployAgent({
              apiKey,
              agentName: name,
              sourceCode: agentCode,
            });

            result.agentAddress = deployed.agentAddress;
            result.walletAddress = deployed.walletAddress;

            if (!isJson) {
              console.log(`      Address: ${deployed.agentAddress}`);
              if (deployed.walletAddress) {
                console.log(`      Wallet:  ${deployed.walletAddress}`);
              }
              if (deployed.status === "compiled" || deployed.status === "running") {
                console.log("      Compiled.");
              }
              if (deployed.secretErrors?.length) {
                for (const se of deployed.secretErrors) {
                  console.log(`      Warning: ${se}`);
                }
              }
            }

            if (deployed.status === "starting") {
              const msg =
                "Compilation timeout — agent created but did not compile within 60 seconds.";
              if (isJson) {
                console.log(
                  JSON.stringify({
                    error: msg,
                    agentAddress: deployed.agentAddress,
                    partial: result,
                  }),
                );
              } else {
                console.error(`\nWarning: ${msg}`);
                console.error(`Agent address: ${deployed.agentAddress}`);
                console.error("Check at: https://agentverse.ai/agents");
              }
              process.exit(1);
            }
          } catch (err) {
            if (isJson) {
              console.log(
                JSON.stringify({
                  error: `Deploy failed: ${(err as Error).message}`,
                  partial: result,
                }),
              );
            } else {
              console.error(`\nDeploy failed: ${(err as Error).message}`);
            }
            process.exit(1);
          }
        }

        // Step 3: Tokenize (optional)
        if (doTokenize) {
          if (!result.agentAddress) {
            if (isJson) {
              console.log(
                JSON.stringify({
                  error:
                    "Cannot tokenize without deploying first. Add --deploy flag.",
                  partial: result,
                }),
              );
            } else {
              console.error(
                "\nError: Cannot tokenize without deploying first. Add --deploy flag.",
              );
            }
            process.exit(1);
          }

          try {
            const tokenized = await tokenizeAgent(
              result.agentAddress,
              name,
              result.ticker,
              finalDescription,
              chainId,
              isJson,
            );
            result.tokenId = tokenized.tokenId;
            result.tokenAddress = tokenized.tokenAddress;
            result.handoffLink = tokenized.handoffLink;
          } catch (err) {
            if (isJson) {
              console.log(
                JSON.stringify({
                  error: `Tokenize failed: ${(err as Error).message}`,
                  partial: result,
                }),
              );
            } else {
              console.error(`\nTokenize failed: ${(err as Error).message}`);
            }
            process.exit(1);
          }
        }

        // Output
        if (isJson) {
          console.log(JSON.stringify(result));
          return;
        }

        console.log(`\n${"=".repeat(50)}`);
        console.log("CREATE COMPLETE");
        console.log(`${"=".repeat(50)}`);
        console.log(`Name:      ${result.name}`);
        console.log(`Ticker:    ${result.ticker}`);
        console.log(`Template:  ${result.template}`);
        console.log(`Directory: ${result.scaffoldDir}`);

        if (result.agentAddress) {
          console.log(`\nAgent Address: ${result.agentAddress}`);
          if (result.walletAddress) {
            console.log(`Wallet:        ${result.walletAddress}`);
          }
        }

        if (result.tokenId !== undefined) {
          console.log(`\nToken ID:  ${result.tokenId}`);
        }
        if (result.tokenAddress) {
          console.log(`Token:     ${result.tokenAddress}`);
        }
        if (result.handoffLink) {
          console.log(
            `\nHandoff link (share with a human to deploy on-chain):`,
          );
          console.log(`  ${result.handoffLink}`);
        }

        // Launch Claude Code in the new directory
        console.log(`\nLaunching Claude Code...`);
        const claude = spawn("claude", [], {
          cwd: targetDir,
          stdio: "inherit",
          shell: true,
        });

        claude.on("error", (err) => {
          console.error(`\nCould not launch Claude Code: ${err.message}`);
          console.log(`\nNext steps:`);
          console.log(`  cd ${dirName}`);
          console.log(`  claude`);
        });
      },
    );
}
