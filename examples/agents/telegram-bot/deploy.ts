import "dotenv/config";
import { deployAgent } from "agentlaunch-sdk";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  const agentCode = readFileSync(join(__dirname, "agent.py"), "utf-8");

  console.log("Deploying Telegram Bot Agent to Agentverse...\n");

  const deployment = await deployAgent({
    agentName: "Telegram Bot",
    sourceCode: agentCode,
  });

  console.log("Deployed to Agentverse!");
  console.log(`  Address: ${deployment.agentAddress}`);
  console.log(`  Status: ${deployment.status}\n`);

  console.log("NEXT STEPS:");
  console.log("1. Go to https://agentverse.ai and find your agent");
  console.log("2. Add secret: TELEGRAM_BOT_TOKEN = <your bot token from @BotFather>");
  console.log("3. Restart the agent");
  console.log("4. Message your bot on Telegram!\n");
  console.log("To get a bot token: talk to @BotFather on Telegram and use /newbot");
}

main().catch(console.error);
