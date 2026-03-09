/**
 * alliance command
 *
 * Deploy the 27-agent ASI Alliance swarm with a single command.
 *
 * Usage:
 *   npx agentlaunch alliance
 *   npx agentlaunch alliance --dry-run
 *   npx agentlaunch alliance --output ./alliance
 */

import { Command } from "commander";
import {
  generateSwarmFromOrg,
  summarizeSwarm,
  type OrgChart,
} from "agentlaunch-templates";
import { scaffoldSwarm, deploySwarmAgents } from "../lib/deploy-swarm.js";

// The full 27-agent ASI Alliance org chart
const ASI_ALLIANCE: OrgChart = {
  name: "ASI Alliance",
  symbol: "ASI",
  cSuite: [
    { role: "ceo", name: "CEO", title: "Chief Executive Officer" },
    { role: "cto", name: "CTO", title: "Chief Technology Officer" },
    { role: "cfo", name: "CFO", title: "Chief Financial Officer" },
    { role: "coo", name: "COO", title: "Chief Operating Officer" },
    { role: "cro", name: "CRO", title: "Chief Recruitment Officer" },
  ],
  departments: [
    // Fetch.ai Internal (7)
    { name: "Guide", head: "Ecosystem Guide", services: ["navigate", "recommend", "tutorial"], pricePerCall: 0.02 },
    { name: "Rank", head: "Agent Ranker", services: ["score", "benchmark", "compare"], pricePerCall: 0.02 },
    { name: "Coach", head: "Builder Coach", services: ["review_code", "suggest", "mentor"], pricePerCall: 0.05 },
    { name: "Concierge", head: "User Concierge", services: ["onboard", "support", "escalate"], pricePerCall: 0.01 },
    { name: "Brand", head: "Brand Manager", services: ["message", "position", "campaign"], pricePerCall: 0.02 },
    { name: "DevRel", head: "Developer Relations", services: ["docs", "examples", "community"], pricePerCall: 0.02 },
    { name: "Grants", head: "Grant Coordinator", services: ["evaluate", "track", "report"], pricePerCall: 0.05 },
    // SNET Ecosystem (15 - representative sample)
    { name: "Marketplace", head: "SNET Marketplace", services: ["list", "discover", "connect"], pricePerCall: 0.01 },
    { name: "Platform", head: "SNET Platform", services: ["deploy", "monitor", "scale"], pricePerCall: 0.02 },
    { name: "Staking", head: "SNET Staking", services: ["stake", "unstake", "rewards"], pricePerCall: 0.01 },
    { name: "Bridge", head: "SNET Bridge", services: ["transfer", "verify", "status"], pricePerCall: 0.02 },
    { name: "AI-Services", head: "SNET AI Services", services: ["inference", "training", "fine_tune"], pricePerCall: 0.10 },
    { name: "NuNet", head: "NuNet Compute", services: ["allocate", "compute", "storage"], pricePerCall: 0.05 },
    { name: "HyperCycle", head: "HyperCycle Node", services: ["execute", "replicate", "consensus"], pricePerCall: 0.02 },
    { name: "SingularityDAO", head: "SDAO Manager", services: ["portfolio", "rebalance", "governance"], pricePerCall: 0.05 },
    { name: "Rejuve", head: "Rejuve Health", services: ["analyze", "recommend", "track"], pricePerCall: 0.05 },
    { name: "SophiaVerse", head: "SophiaVerse Agent", services: ["interact", "create", "explore"], pricePerCall: 0.02 },
    { name: "Jam-Galaxy", head: "Jam Galaxy", services: ["compose", "collaborate", "publish"], pricePerCall: 0.02 },
    { name: "Mindplex", head: "Mindplex Content", services: ["curate", "verify", "reward"], pricePerCall: 0.01 },
    { name: "TrueAGI", head: "TrueAGI Research", services: ["research", "synthesize", "publish"], pricePerCall: 0.10 },
    { name: "Cogito", head: "Cogito Finance", services: ["model", "predict", "hedge"], pricePerCall: 0.05 },
    { name: "SingularityNET-Foundation", head: "SNET Foundation", services: ["grant", "govern", "coordinate"], pricePerCall: 0.02 },
  ],
};

interface AllianceOptions {
  dryRun?: boolean;
  yes?: boolean;
  output?: string;
  json?: boolean;
}

export function registerAllianceCommand(program: Command): void {
  program
    .command("alliance")
    .description("Deploy the 27-agent ASI Alliance swarm")
    .option("--dry-run", "Show what would be deployed without deploying")
    .option("-y, --yes", "Skip confirmation prompt")
    .option("-o, --output <dir>", "Scaffold agents to directory (no deploy)")
    .option("--json", "Output JSON (machine-readable)")
    .action(async (options: AllianceOptions) => {
      const isJson = options.json === true;

      const swarmConfig = generateSwarmFromOrg(ASI_ALLIANCE);

      // Show summary
      if (!isJson) {
        console.log("\n" + summarizeSwarm(swarmConfig));
        console.log("\n---");
        console.log(`Total Deploy Cost: ${swarmConfig.totalDeployCost} FET`);
        console.log(`Total Agents: ${swarmConfig.totalAgents}\n`);
      }

      // Dry run
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

        console.log(`\n⚠️  This will deploy ${swarmConfig.totalAgents} agents at 120 FET each = ${swarmConfig.totalDeployCost} FET total`);
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
        console.log("\n=== ASI Alliance Deployed ===");
        console.log(`Deployed: ${results.filter(r => r.agentAddress).length}/${results.length}`);
        const deployed = results.filter(r => r.agentAddress);

        if (deployed.length > 0) {
          console.log("\n=== What Each Agent Has (Built-In) ===\n");
          console.log("  Commerce Stack (9 layers):");
          console.log("    - PaymentService: Charge callers, pay other agents, verify on-chain");
          console.log("    - PricingTable: Per-service pricing stored in agent storage");
          console.log("    - TierManager: Token-gated access (free tier + premium holders)");
          console.log("    - WalletManager: FET balance queries, low-fund alerts");
          console.log("    - RevenueTracker: Income/expense logging, GDP contribution");
          console.log("    - SelfAwareMixin: Own token price, holders, market cap awareness");
          console.log("    - HoldingsManager: Buy/sell other agents' tokens (cross-holdings)");
          console.log("    - Security: Rate limiting (10/min), input validation");
          console.log("    - Health: Uptime tracking, error rate monitoring\n");
          console.log("  Protocols:");
          console.log("    - Chat Protocol v0.3.0 (Agentverse messaging)");
          console.log("    - Payment Protocol (official uagents_core, seller role)");
          console.log("    - Published manifests for ASI:One routing\n");
          console.log("  Autonomy:");
          console.log("    - Interval tasks (background monitoring, health checks)");
          console.log("    - Persistent storage (pricing, revenue logs, transaction history)");
          console.log("    - Token self-awareness (price tracking, effort mode)\n");
          console.log("  Optimization (Phase 3):");
          console.log("    - README set for Agentverse ranking");
          console.log("    - Short description for directory listing");
          console.log("    - Services + pricing documented\n");
          console.log("=== Agent Addresses ===\n");
          for (const r of deployed) {
            const agentConfig = swarmConfig.agents.find(a => a.name === r.name);
            const services = agentConfig ? Object.keys(agentConfig.services).join(", ") : "";
            console.log(`  ${r.symbol.padEnd(12)} ${r.agentAddress}  [${services}]`);
          }
          console.log("\n=== Next Steps ===\n");
          console.log("  1. Verify compilation:  Wait 60s, then agents auto-compile on Agentverse");
          console.log("  2. Fund wallets:        Send ~10 FET to each agent for inter-agent payments");
          console.log("  3. Tokenize:            npx agentlaunch tokenize <agent-address>  (120 FET each)");
          console.log("  4. Cross-holdings:      Agents buy each other's tokens for economic alignment");
          console.log("  5. Monitor:             npx agentlaunch status <agent-address>");
          console.log("  6. Commerce:            Agents earn FET for every service call\n");
          console.log("  Full workflow: docs/workflow.md");
          console.log("  Agent economy vision: docs/the-agent-economy.md\n");
        }
      }
    });
}
