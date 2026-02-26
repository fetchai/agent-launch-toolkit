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
import { generateFromTemplate, listTemplates, RULES, SKILLS, DOCS, EXAMPLES, buildPackageJson, CURSOR_MCP_CONFIG, CURSOR_RULES, buildSwarmClaudeMd, buildSwarmConfig, buildSwarmPackageJson, buildProjectSkills, type SwarmContext } from "agentlaunch-templates";
import { getClient, agentverseRequest } from "../http.js";
import { requireApiKey } from "../config.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TemplateId = "custom" | "research" | "trading-bot" | "data-analyzer" | "price-monitor" | "gifter" | "swarm-starter";

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
  genesis: "swarm-starter", // Legacy alias for swarm-starter
};

// Genesis preset names for swarm mode
const GENESIS_PRESETS = [
  { name: "oracle", label: "Oracle", description: "Market data provider (0.001 FET/call)" },
  { name: "brain", label: "Brain", description: "LLM reasoning engine (0.01 FET/call)" },
  { name: "analyst", label: "Analyst", description: "Token scoring & evaluation (0.005 FET/call)" },
  { name: "coordinator", label: "Coordinator", description: "Query routing (0.0005 FET/call)" },
  { name: "sentinel", label: "Sentinel", description: "Real-time alerts (0.002 FET/call)" },
  { name: "launcher", label: "Launcher", description: "Autonomous agent creation (0.02 FET/call)" },
  { name: "scout", label: "Scout", description: "Agent & opportunity discovery (0.01 FET/call)" },
];

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

/** Auto-generate a ticker from the agent name (e.g. "Price Oracle" → "PRICE") */
function autoTicker(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].slice(0, 6).toUpperCase();
  }
  // Use first word if it's short enough, otherwise initials
  const first = words[0].toUpperCase();
  if (first.length >= 3 && first.length <= 6) return first;
  return words.map((w) => w[0]).join("").slice(0, 6).toUpperCase();
}

// ---------------------------------------------------------------------------
// Workflow system prompt for Claude Code sessions
// ---------------------------------------------------------------------------

function buildWorkflowSystemPrompt(opts: {
  agentName: string;
  agentAddress: string;
  description: string;
  ticker: string;
  isDeployed: boolean;
}): string {
  return `You are guiding a developer through building a valuable AI agent on Fetch.ai Agentverse. This is not a tutorial — you are a collaborator helping them build something worth using and worth holding tokens for.

## Context
- Agent name: ${opts.agentName}
- Agent address: ${opts.agentAddress || "(not yet deployed)"}
- Description: ${opts.description}
- Auto-generated ticker: $${opts.ticker} (can change during tokenization)
- Status: ${opts.isDeployed ? "Deployed on Agentverse" : "Code scaffolded, not yet deployed"}

## Workflow — Follow These Steps In Order

### Step 1: Understand the Vision
Ask the developer what problem this agent solves. Probe with:
- Who would pay for this? Why can't they just use an API directly?
- What data or intelligence does this agent accumulate over time?
- What gets better the more people use it?

Teach the 3 pillars of agent value:
1. **Proprietary intelligence** — it knows something others don't (curated data, trained models, analyzed patterns)
2. **Network effects** — it gets better with more users/agents (shared state, cross-agent data, collective learning)
3. **Defensibility** — it's hard to replicate (unique data sources, accumulated history, agent relationships)

If the description is vague ("a helpful assistant"), push back. Help them find a specific, valuable niche.

### Step 2: Build the Agent Logic
Read agent.py and propose real code changes based on the vision from Step 1. This is where you write REAL business logic — not placeholder TODOs.

Available packages on Agentverse (most people only use 3 — use more):
- **AI**: anthropic, openai, langchain-anthropic, langchain-core, langchain-community, langchain-google-genai, transformers, sentence-transformers
- **Data**: pandas, numpy, scipy, scikit-learn, faiss-cpu
- **Web**: requests, aiohttp, beautifulsoup4, feedparser
- **Blockchain**: web3, eth-account, cosmpy
- **Storage**: pymongo, redis, sqlalchemy
- **Utils**: pydantic, pillow, matplotlib, networkx

Key patterns to use:
- **Chat Protocol** (on_message): Request/response interactions with users and other agents
- **ctx.storage**: Persistent state across restarts — this is how agents accumulate intelligence
- **on_interval**: Background tasks that run 24/7 — monitoring, data collection, analysis
- **External APIs**: Connect to real data sources (price feeds, news, on-chain data)
- **Payment Protocol**: Charge for premium services (RequestPayment → CommitPayment → CompletePayment)

Write production code. Explain each pattern as you introduce it. Pause and ask if the developer wants to adjust before continuing.

### Step 3: Deploy
${opts.isDeployed ? "The agent is already deployed. If you made code changes, push updated code to Agentverse using the deploy_to_agentverse MCP tool or 'npx agentlaunch deploy'." : "Deploy the agent to Agentverse using the deploy_to_agentverse MCP tool or 'npx agentlaunch deploy'. Explain what happens: code uploads, agent compiles, goes live in ~30 seconds."}

After deploy, verify it's running (check logs). Mention the agent takes 15-60s to compile.

### Step 4: Make It Beautiful
A well-presented agent gets more discovery, more interactions, more token holders. Do all of these:

1. **README** — Write a compelling README.md with:
   - One-line value proposition (what problem it solves)
   - Capabilities list (what it can actually do)
   - Example interactions (show 2-3 real conversations)
   - Pricing table (if it charges for services)
   - Technical architecture (brief)

2. **Short description** — Write a 1-2 sentence description for the Agentverse directory

3. **Push metadata** — Use 'npx agentlaunch optimize <agent-address>' or the update_agent_metadata MCP tool

4. **Optimization checklist** (7 factors for Agentverse ranking):
   - [ ] README is detailed and well-formatted
   - [ ] Short description is clear and specific
   - [ ] Chat Protocol is implemented (for DeltaV discovery)
   - [ ] Agent has a custom avatar
   - [ ] Agent has real interactions (test it!)
   - [ ] Agent has a memorable handle
   - [ ] publish_manifest=True is set

### Step 5: Tokenize
Help the developer tokenize their agent:

1. **Choose ticker** — Suggest a memorable ticker (2-6 chars). The auto-generated $${opts.ticker} is a starting point.
2. **Explain bonding curves** — The bonding curve is NOT a fundraiser. It's a continuous, real-time reputation system:
   - Agent delivers value → people buy → price rises
   - Agent stops delivering → people sell → price drops
   - Every holder has skin in the game. The market doesn't lie.
3. **Create the token** — Use the create_token_record MCP tool or 'npx agentlaunch tokenize'
4. **Explain the handoff** — The link goes to a human who connects a wallet and pays the 120 FET deploy fee. Agents never hold private keys.
5. **Graduation** — At 30,000 FET liquidity, the token auto-lists on DEX. The 2% trading fee goes 100% to protocol treasury.

### Step 6: Share & Next Steps
Provide all links:
- Agentverse page: https://agentverse.ai/agents/details/<agent-address>
- Trade page: https://agent-launch.ai/token/<token-address> (after tokenization)
- Handoff link: (from tokenization step)

Suggest next steps:
- Test the agent by chatting with it on Agentverse
- Share the trade link to get early holders
- Build a complementary agent (data feeds, analysis, monitoring)
- Add cross-holdings (buy tokens of agents yours depends on)

## 6 Architecture Patterns for Inspiration
1. **Intelligence Agent** — Uses AI to analyze, summarize, or reason (Brain, Analyst)
2. **Sentinel Agent** — Monitors 24/7, alerts on conditions (price drops, anomalies)
3. **Research Agent** — Deep dives on demand (on-chain analysis, market research)
4. **Oracle Agent** — Serves live data feeds (prices, metrics, events)
5. **Coordinator Agent** — Routes queries to specialists, takes a routing fee
6. **Incubator Agent** — Finds gaps in the ecosystem, scaffolds new agents

## Style Guide
- Be educational but action-oriented. Explain WHY as you DO.
- Pause between major steps — don't dump everything at once.
- Never write placeholder code (# TODO: implement this). Write real logic or ask what to build.
- Use the MCP tools (deploy_to_agentverse, create_token_record, update_agent_metadata, etc.) when possible.
- Be encouraging but honest. If an idea won't create value, say so and suggest alternatives.
- Keep responses focused. Don't repeat information the developer already knows.`;
}

async function validateApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const response = await fetch("https://agentverse.ai/v1/hosting/agents", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
    if (response.ok) {
      return { valid: true };
    }
    if (response.status === 401) {
      return { valid: false, error: "Invalid API key" };
    }
    return { valid: false, error: `API returned ${response.status}` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { valid: false, error: msg };
  }
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
  const result = await client.post<TokenizeResponse>("/agents/tokenize", {
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
      "Agent template: swarm-starter (recommended), custom, research, trading-bot, data-analyzer, price-monitor, gifter (default: custom)",
    )
    .option("--description <desc>", "Token description (max 500 chars)")
    .option(
      "--chain <chainId>",
      "Chain ID: 97 (BSC testnet) or 56 (BSC mainnet) (default: 97)",
      "97",
    )
    .option("--deploy", "Deploy agent to Agentverse after scaffolding")
    .option("--tokenize", "Create token record on AgentLaunch after deploy")
    .option("--mode <mode>", "Build mode: quick (single agent), swarm (multi-agent), genesis (full 7-agent economy)")
    .option("--preset <preset>", "Agent preset: oracle, brain, analyst, coordinator, sentinel, launcher, scout")
    .option("--no-deploy", "Scaffold only, don't deploy to Agentverse")
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
        mode?: string;
        preset?: string;
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
        let apiKey = process.env.AGENTVERSE_API_KEY ?? "";

        if (!isJson) {
          const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
          });

          if (!name) {
            name = (await prompt(rl, "Agent name: ")).trim();
          }

          // Auto-generate ticker from name (user can refine during tokenization)
          if (!ticker) {
            ticker = autoTicker(name);
          }

          if (!description) {
            description = (await prompt(rl, "Describe what your agent does: ")).trim();
          }

          // Always prompt for API key
          console.log("\nGet your API key at: https://agentverse.ai/profile/api-keys\n");
          const existingKey = apiKey ? ` [${apiKey.slice(0, 6)}...${apiKey.slice(-4)}]` : "";
          const keyInput = (await prompt(rl, `Agentverse API key${existingKey}: `)).trim();
          if (keyInput) {
            apiKey = keyInput;
          }

          // Set API key in env for SDK calls
          if (apiKey) {
            process.env.AGENTVERSE_API_KEY = apiKey;
          }

          // Validate API key if we're going to deploy
          // --no-deploy flag sets options.deploy to false
          const skipDeploy = options.deploy === false;
          if (!skipDeploy && apiKey) {
            console.log("\n  Validating API key...");
            const validation = await validateApiKey(apiKey);
            if (!validation.valid) {
              console.error(`  Error: ${validation.error ?? "Invalid API key"}`);
              console.log("  Get your API key at: https://agentverse.ai/profile/api-keys");
              rl.close();
              process.exit(1);
            }
            console.log("  Valid.\n");
          }

          // Default to single agent mode; swarm reachable via --mode=swarm
          const buildMode = options.mode ?? "single";

          let selectedPresets: string[];
          if (buildMode === "swarm") {
            // Show preset selection for swarm mode only
            console.log("\n  What kind of agents?\n");
            console.log("    Recommended for earning fees:");
            console.log("    1) Oracle       Sell market data (price feeds, OHLC) — 0.001 FET/call");
            console.log("    2) Brain        Sell AI reasoning (analysis, summaries) — 0.01 FET/call");
            console.log("    3) Analyst      Sell token scoring (quality, risk) — 0.005 FET/call");
            console.log("");
            console.log("    Infrastructure (other agents pay you):");
            console.log("    4) Coordinator  Route queries to specialists — 0.0005 FET/call");
            console.log("    5) Sentinel     Real-time monitoring & alerts — 0.002 FET/call");
            console.log("");
            console.log("    Advanced (autonomous growth):");
            console.log("    6) Launcher     Find gaps, scaffold new agents — 0.02 FET/call");
            console.log("    7) Scout        Discover & evaluate agents — 0.01 FET/call");

            const pickInput = (
              await prompt(rl, "\n  Pick agents (comma-separated, e.g. 1,2,4): ")
            ).trim();
            const picks = pickInput
              .split(",")
              .map((s) => parseInt(s.trim(), 10))
              .filter((n) => n >= 1 && n <= GENESIS_PRESETS.length);
            if (picks.length === 0) {
              // Default to oracle + brain if no valid input
              selectedPresets = ["oracle", "brain"];
              console.log("  Defaulting to Oracle + Brain.");
            } else {
              selectedPresets = picks.map((n) => GENESIS_PRESETS[n - 1].name);
            }
          } else {
            // Single agent mode - use "custom" preset (generic commerce agent)
            selectedPresets = ["custom"];
          }

          const isSingleAgent = buildMode === "single";
          const baseName = name || (isSingleAgent ? selectedPresets[0] : "Swarm");

          if (skipDeploy) {
            console.log(`\n  Scaffolding ${isSingleAgent ? baseName : selectedPresets.length + " agents"}...\n`);
          } else if (isSingleAgent) {
            console.log(`\n  Deploying ${baseName}...\n`);
          } else {
            console.log(`\n  Deploying ${selectedPresets.length} agents as "${baseName}"...\n`);
          }

          rl.close();

          // Generate/deploy each agent in sequence
          const deployResults: Array<{
            name: string;
            preset: string;
            address: string;
            status: string;
            code?: string;
            error?: string;
          }> = [];
          const peerAddresses: Record<string, string> = {};

          for (const presetName of selectedPresets) {
            // For single agent, use baseName directly; for swarm, append preset
            const agentName = isSingleAgent
              ? baseName
              : `${baseName}-${presetName.charAt(0).toUpperCase() + presetName.slice(1)}`;
              const presetInfo = GENESIS_PRESETS.find((p) => p.name === presetName);

              const action = skipDeploy ? "Scaffolding" : "Deploying";
              console.log(`  [${deployResults.length + 1}/${selectedPresets.length}] ${action} ${agentName}...`);

              try {
                // Generate agent code — try swarm-starter template, fall back to custom
                let agentCode: string;
                try {
                  const generated = generateFromTemplate("swarm-starter", {
                    agent_name: agentName,
                    description: presetInfo?.description ?? "",
                    preset: presetName,
                  });
                  agentCode = generated.code;
                } catch {
                  const generated = generateFromTemplate("custom", {
                    agent_name: agentName,
                    description: presetInfo?.description ?? "",
                  });
                  agentCode = generated.code;
                }

                if (skipDeploy) {
                  // Scaffold only - no deployment
                  deployResults.push({
                    name: agentName,
                    preset: presetName,
                    address: "",
                    status: "scaffolded",
                    code: agentCode,
                  });
                  console.log("    Scaffolded (not deployed)");
                } else {
                  // Deploy to Agentverse
                  const result = await deployAgent({
                    apiKey,
                    agentName,
                    sourceCode: agentCode,
                    secrets: {
                      ...peerAddresses,
                      AGENTVERSE_API_KEY: apiKey,
                      AGENTLAUNCH_API_KEY: apiKey,
                    },
                  });

                  peerAddresses[`${presetName.toUpperCase()}_ADDRESS`] = result.agentAddress;

                  deployResults.push({
                    name: agentName,
                    preset: presetName,
                    address: result.agentAddress,
                    status: result.status,
                    code: agentCode,
                  });

                  console.log(`    Address: ${result.agentAddress}`);
                  console.log(`    Status:  ${result.status}`);
                }
              } catch (err) {
                const errMsg = err instanceof Error ? err.message : String(err);
                deployResults.push({
                  name: agentName,
                  preset: presetName,
                  address: "",
                  status: "failed",
                  error: errMsg,
                });
                console.error(`    FAILED: ${errMsg}`);
              }
            }

            // Summary
            const successful = deployResults.filter((r) => r.status !== "failed");
            const failed = deployResults.filter((r) => r.status === "failed");

          // Create project directory
          const dirName = sanitizeDirName(baseName);
          const targetDir = path.resolve(process.cwd(), dirName);

          if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
          }
          if (!isSingleAgent) {
            fs.mkdirSync(path.join(targetDir, "agents"), { recursive: true });
          }
          fs.mkdirSync(path.join(targetDir, ".claude"), { recursive: true });
          fs.mkdirSync(path.join(targetDir, ".claude", "rules"), { recursive: true });
          fs.mkdirSync(path.join(targetDir, ".claude", "skills"), { recursive: true });
          fs.mkdirSync(path.join(targetDir, ".cursor"), { recursive: true });
          fs.mkdirSync(path.join(targetDir, "docs"), { recursive: true });
          fs.mkdirSync(path.join(targetDir, "examples"), { recursive: true });

          // Write agent code files
          for (const agent of successful) {
            if (agent.code) {
              // Single agent: agent.py at root; Swarm: agents/<preset>.py
              const codePath = isSingleAgent
                ? path.join(targetDir, "agent.py")
                : path.join(targetDir, "agents", `${agent.preset}.py`);
              fs.writeFileSync(codePath, agent.code, "utf8");
            }
          }

          // Build context for CLAUDE.md (works for both single and swarm)
          const swarmContext: SwarmContext = {
            swarmName: baseName,
            agents: successful.map((a) => ({
              name: a.name,
              preset: a.preset,
              address: a.address,
              status: a.status,
            })),
            peerAddresses,
            deployedAt: new Date().toISOString(),
          };

          // Write context files
          fs.writeFileSync(
            path.join(targetDir, "CLAUDE.md"),
            buildSwarmClaudeMd(swarmContext),
            "utf8"
          );
          fs.writeFileSync(
            path.join(targetDir, "agentlaunch.config.json"),
            buildSwarmConfig(swarmContext),
            "utf8"
          );
          fs.writeFileSync(
            path.join(targetDir, "package.json"),
            buildSwarmPackageJson(baseName),
            "utf8"
          );

          // Write .env with API key
          let envContent = `# AgentLaunch Environment Variables
AGENTVERSE_API_KEY=${apiKey}
AGENT_LAUNCH_API_URL=https://agent-launch.ai/api
`;
          if (!isSingleAgent && Object.keys(peerAddresses).length > 0) {
            envContent += `
# Peer addresses (for agent-to-agent communication)
${Object.entries(peerAddresses).map(([k, v]) => `${k}=${v}`).join("\n")}
`;
          }
          if (successful.length > 0) {
            envContent += `
# Your agent address
AGENT_ADDRESS=${successful[0].address}
`;
          }
          fs.writeFileSync(path.join(targetDir, ".env"), envContent, "utf8");

          // Write Claude rules
          for (const [filename, content] of Object.entries(RULES)) {
            fs.writeFileSync(
              path.join(targetDir, ".claude", "rules", filename),
              content,
              "utf8"
            );
          }

          // Write Claude skills (generic)
          for (const [filepath, content] of Object.entries(SKILLS)) {
            const skillDir = path.dirname(filepath);
            fs.mkdirSync(path.join(targetDir, ".claude", "skills", skillDir), { recursive: true });
            fs.writeFileSync(
              path.join(targetDir, ".claude", "skills", filepath),
              content,
              "utf8"
            );
          }

          // Write project-specific skills (with real agent addresses)
          const agentSkillContexts = successful.map((a) => ({
            name: a.name,
            preset: a.preset,
            address: a.address,
            symbol: a.preset.slice(0, 4).toUpperCase(),
          }));
          const projectSkills = buildProjectSkills(agentSkillContexts, isSingleAgent);
          for (const [filepath, content] of Object.entries(projectSkills)) {
            const skillDir = path.dirname(filepath);
            fs.mkdirSync(path.join(targetDir, ".claude", "skills", skillDir), { recursive: true });
            fs.writeFileSync(
              path.join(targetDir, ".claude", "skills", filepath),
              content,
              "utf8"
            );
          }

          // Write .claude/settings.json
          const claudeSettings = JSON.stringify({
            mcpServers: {
              "agent-launch": {
                command: "npx",
                args: ["-y", "agent-launch-mcp"],
                env: { AGENTVERSE_API_KEY: "${AGENTVERSE_API_KEY}" },
              },
            },
          }, null, 2);
          fs.writeFileSync(
            path.join(targetDir, ".claude", "settings.json"),
            claudeSettings,
            "utf8"
          );

          // Write MCP config
          fs.writeFileSync(path.join(targetDir, ".mcp.json"), claudeSettings, "utf8");

          // Write Cursor config
          fs.writeFileSync(path.join(targetDir, ".cursor", "mcp.json"), CURSOR_MCP_CONFIG, "utf8");
          fs.writeFileSync(path.join(targetDir, ".cursorrules"), CURSOR_RULES, "utf8");

          // Write docs
          for (const [filename, content] of Object.entries(DOCS)) {
            fs.writeFileSync(path.join(targetDir, "docs", filename), content, "utf8");
          }

          // Write examples
          for (const [filename, content] of Object.entries(EXAMPLES)) {
            fs.writeFileSync(path.join(targetDir, "examples", filename), content, "utf8");
          }

          if (isJson) {
            console.log(JSON.stringify({
              mode: buildMode,
              baseName,
              directory: targetDir,
              totalDeployed: successful.length,
              totalFailed: failed.length,
              agents: deployResults.map((a) => ({ name: a.name, preset: a.preset, address: a.address, status: a.status })),
              peerAddresses,
            }));
            return;
          }

          if (skipDeploy) {
            // Scaffolded without deploying
            if (isSingleAgent) {
              console.log(`\n  Agent scaffolded!`);
              console.log(`  Name:      ${baseName}`);
              console.log(`  Type:      ${selectedPresets[0]}`);
            } else {
              console.log(`\n  Swarm scaffolded!`);
              console.log(`  Agents:    ${selectedPresets.join(", ")}`);
            }
            console.log(`  Directory: ${targetDir}`);
            console.log(`\n  To deploy: npx agentlaunch deploy --code ${isSingleAgent ? "agent.py" : "agents/<preset>.py"}`);
          } else if (isSingleAgent) {
            console.log(`\n  Agent deployed!`);
            if (successful.length > 0) {
              const agent = successful[0];
              console.log(`  Name:      ${agent.name}`);
              console.log(`  Type:      ${agent.preset}`);
              console.log(`  Address:   ${agent.address}`);
            }
          } else {
            console.log(`\n  Swarm deployed!`);
            console.log(`  Deployed: ${successful.length}/${deployResults.length} agents`);
            if (successful.length > 0) {
              console.log("\n  Agent Addresses:");
              for (const agent of successful) {
                console.log(`    ${agent.preset.padEnd(14)} ${agent.address}`);
              }
            }
          }
          console.log(`  Directory: ${targetDir}\n`);

          if (failed.length > 0) {
            console.log(`\n  Failed (${failed.length}):`);
            for (const agent of failed) {
              console.log(`    ${agent.preset}: ${agent.error}`);
            }
          }

          console.log(`  Created files:`);
          if (isSingleAgent) {
            console.log(`    agent.py               Your agent code (edit this!)`);
          } else {
            console.log(`    agents/                Individual agent code`);
          }
          console.log(`    CLAUDE.md              Context for Claude Code`);
          console.log(`    .claude/               Rules, skills, MCP config`);

          // Install dependencies
          console.log(`\n  Installing dependencies...`);
          try {
            execSync("npm install --silent", { cwd: targetDir, stdio: "ignore" });
            console.log(`  Done.`);
          } catch {
            console.log(`  Warning: npm install failed. Run 'npm install' manually.`);
          }

          // Launch Claude Code with workflow prompt
          console.log(`\n  Launching Claude Code...`);

          const firstAgent = successful[0];
          const agentAddr = firstAgent?.address ?? "";
          const isDeployed = !skipDeploy && !!agentAddr;

          // Welcome message (first "user" message Claude sees)
          let welcomePrompt: string;
          if (isSingleAgent) {
            welcomePrompt = isDeployed
              ? `I just created an agent called "${baseName}" and deployed it to Agentverse at ${agentAddr}.\n\nDescription: ${description}\n\nPlease start from Step 1 of the workflow.`
              : `I just scaffolded an agent called "${baseName}". The code is in agent.py but it's NOT deployed yet.\n\nDescription: ${description}\n\nPlease start from Step 1 of the workflow.`;
          } else {
            const agentList = successful.map((a) => `${a.preset}: ${a.address}`).join(", ");
            welcomePrompt = `I just deployed a ${successful.length}-agent swarm called "${baseName}" with: ${agentList}.\n\nDescription: ${description}\n\nPlease start from Step 1 of the workflow.`;
          }

          // Full system prompt via helper
          const systemPrompt = buildWorkflowSystemPrompt({
            agentName: baseName,
            agentAddress: agentAddr,
            description,
            ticker,
            isDeployed,
          });

          const claudeArgs = [
            welcomePrompt,
            "--append-system-prompt", systemPrompt,
            "--allowedTools", "Bash(npm run *),Bash(npx agentlaunch *),Bash(agentlaunch *),Edit,Read,Write,Glob,Grep",
          ];

          const claude = spawn("claude", claudeArgs, {
            cwd: targetDir,
            stdio: "inherit",
          });

          claude.on("error", (err) => {
            console.error(`  Could not launch Claude Code: ${err.message}`);
            console.log(`\n  Run manually:`);
            console.log(`    cd ${dirName} && claude`);
          });

          return;
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
        const presetInfo = options.preset ? GENESIS_PRESETS.find((p) => p.name === options.preset) : undefined;
        const finalDescription = (description || presetInfo?.description || TEMPLATES[template]?.description || "").slice(0, 500);

        // Generate files from templates package
        // If a preset is specified, use swarm-starter template with the preset
        const templateToUse = options.preset ? "swarm-starter" : template;
        const templateVars: Record<string, string> = {
          agent_name: name,
          description: finalDescription,
        };
        if (options.preset) {
          templateVars.preset = options.preset;
        }
        const generated = generateFromTemplate(templateToUse, templateVars);

        fs.mkdirSync(targetDir, { recursive: true });
        fs.mkdirSync(path.join(targetDir, ".claude"), { recursive: true });
        fs.mkdirSync(path.join(targetDir, ".claude", "rules"), { recursive: true });
        fs.mkdirSync(path.join(targetDir, ".claude", "skills"), { recursive: true });
        fs.mkdirSync(path.join(targetDir, ".cursor"), { recursive: true });

        // Core files
        fs.writeFileSync(path.join(targetDir, "agent.py"), generated.code, "utf8");
        fs.writeFileSync(path.join(targetDir, "README.md"), generated.readme, "utf8");
        fs.writeFileSync(path.join(targetDir, ".env.example"), generated.envExample, "utf8");

        // Write .env with API key if provided
        if (apiKey) {
          const envContent = `# AgentLaunch Environment Variables
AGENTVERSE_API_KEY=${apiKey}
AGENT_LAUNCH_API_URL=https://agent-launch.ai/api
`;
          fs.writeFileSync(path.join(targetDir, ".env"), envContent, "utf8");
        }

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

        // MCP config (project root - recommended location)
        fs.writeFileSync(path.join(targetDir, ".mcp.json"), generated.claudeSettings, "utf8");

        // Cursor IDE config
        fs.writeFileSync(path.join(targetDir, ".cursor", "mcp.json"), CURSOR_MCP_CONFIG, "utf8");
        fs.writeFileSync(path.join(targetDir, ".cursorrules"), CURSOR_RULES, "utf8");

        // Documentation
        fs.mkdirSync(path.join(targetDir, "docs"), { recursive: true });
        for (const [filename, content] of Object.entries(DOCS)) {
          fs.writeFileSync(path.join(targetDir, "docs", filename), content, "utf8");
        }

        // Examples
        fs.mkdirSync(path.join(targetDir, "examples"), { recursive: true });
        for (const [filename, content] of Object.entries(EXAMPLES)) {
          fs.writeFileSync(path.join(targetDir, "examples", filename), content, "utf8");
        }

        result.scaffoldDir = targetDir;

        if (!isJson) {
          console.log(`  Created: agent.py`);
          console.log(`  Created: README.md`);
          console.log(`  Created: CLAUDE.md`);
          console.log(`  Created: package.json`);
          console.log(`  Created: .claude/ (settings, rules, skills)`);
          console.log(`  Created: .cursor/ (MCP config)`);
          console.log(`  Created: docs/ (${Object.keys(DOCS).length} guides)`);
          console.log(`  Created: examples/ (${Object.keys(EXAMPLES).length} samples)`);
        }

        // Install dependencies (quiet mode)
        if (!isJson) {
          console.log(`\nInstalling dependencies...`);
        }
        try {
          execSync("npm install --silent", { cwd: targetDir, stdio: "ignore" });
          if (!isJson) {
            console.log(`  Done.`);
          }
        } catch {
          if (!isJson) {
            console.log(`  Warning: npm install failed. Run 'npm install' manually.`);
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
              metadata: {
                readme: generated.readme,
                short_description: generated.shortDescription,
              },
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

        // Show deployment info if deployed/tokenized
        if (result.agentAddress) {
          console.log(`\nAgent: ${result.agentAddress}`);
        }
        if (result.handoffLink) {
          console.log(`Handoff: ${result.handoffLink}`);
        }

        // Launch Claude Code in the new directory with workflow prompt
        console.log(`\nLaunching Claude Code in ${dirName}...`);

        const batchIsDeployed = !!result.agentAddress;
        const batchWelcome = batchIsDeployed
          ? `I just created an agent called "${name}" and deployed it to Agentverse at ${result.agentAddress}.\n\nDescription: ${description || "No description provided."}\n\nPlease start from Step 1 of the workflow.`
          : `I just scaffolded an agent called "${name}". The code is in agent.py but it's NOT deployed yet.\n\nDescription: ${description || "No description provided."}\n\nPlease start from Step 1 of the workflow.`;

        const batchSystemPrompt = buildWorkflowSystemPrompt({
          agentName: name,
          agentAddress: result.agentAddress ?? "",
          description: description || "No description provided.",
          ticker: result.ticker,
          isDeployed: batchIsDeployed,
        });

        const claudeArgs = [
          batchWelcome,
          "--append-system-prompt", batchSystemPrompt,
          "--allowedTools", "Bash(npm run *),Bash(npx agentlaunch *),Bash(agentlaunch *),Edit,Read,Write,Glob,Grep",
        ];

        const claude = spawn("claude", claudeArgs, {
          cwd: targetDir,
          stdio: "inherit",
        });

        claude.on("error", (err) => {
          console.error(`Could not launch Claude Code: ${err.message}`);
          console.log(`\nRun manually:`);
          console.log(`  cd ${dirName} && claude`);
        });
      },
    );
}
