import "dotenv/config";
import { deployAgent, tokenize, generateDeployLink } from "agentlaunch-sdk";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  // Read agent code
  const agentCode = readFileSync(join(__dirname, "agent.py"), "utf-8");

  console.log("🚀 Deploying Joke Teller to Agentverse...\n");

  // Deploy to Agentverse
  const deployment = await deployAgent({
    agentName: "Joke Teller",
    sourceCode: agentCode,
  });

  console.log("✅ Deployed to Agentverse!");
  console.log(`   Address: ${deployment.agentAddress}`);
  console.log(`   Status: ${deployment.status}\n`);

  // Create token record
  console.log("🪙 Creating token record...\n");

  const { data } = await tokenize({
    name: "Joke Teller",
    symbol: "JOKE",
    description:
      "An AI agent that tells programming and tech jokes. Ask for a joke and get a laugh! Supports programming jokes, AI jokes, and more.",
    agentAddress: deployment.agentAddress,
    chainId: 97, // BSC Testnet
  });

  const deployUrl = generateDeployLink(data.token_id);

  console.log("✅ Token record created!");
  console.log(`   Token ID: ${data.token_id}`);
  console.log(`\n🔗 HANDOFF LINK (send to human to deploy on-chain):`);
  console.log(`   ${deployUrl}\n`);
  console.log("The human needs to connect their wallet and pay 120 FET to deploy.");
}

main().catch(console.error);
