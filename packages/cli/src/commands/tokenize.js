/**
 * CLI-004: tokenize command
 *
 * agentlaunch tokenize --agent <address> --name <name> --symbol <symbol>
 *
 * Calls POST /api/agents/tokenize, then prints the handoff link so a human
 * can connect their wallet and complete on-chain deployment.
 *
 * Platform constants (source of truth: deployed smart contracts):
 *   - Deploy fee:          120 FET (read dynamically, can change via multi-sig)
 *   - Graduation target:   30,000 FET -> auto DEX listing
 *   - Trading fee:         2% -> 100% to protocol treasury (NO creator fee)
 */
import { apiPost } from "../http.js";
const DEFAULT_BASE_URL = "https://agent-launch.ai";
export function registerTokenizeCommand(program) {
    program
        .command("tokenize")
        .description("Create a token record for your agent and receive a handoff link for on-chain deployment")
        .requiredOption("--agent <address>", "Agentverse agent address (agent1q...)")
        .requiredOption("--name <name>", "Token name (max 32 chars)")
        .requiredOption("--symbol <symbol>", "Token ticker symbol (2-11 chars, e.g. GIFT)")
        .option("--description <desc>", "Token description (max 500 chars)")
        .option("--image <url>", "URL of the token logo image")
        .option("--chain <chainId>", "Chain ID: 97 (BSC testnet) or 56 (BSC mainnet)", "97")
        .action(async (options) => {
        // Basic validation
        if (!options.agent.startsWith("agent1q")) {
            console.error("Error: --agent must be a valid Agentverse address starting with 'agent1q'");
            process.exit(1);
        }
        if (options.name.length > 32) {
            console.error("Error: --name must be 32 characters or fewer");
            process.exit(1);
        }
        const symbol = options.symbol.toUpperCase();
        if (symbol.length < 2 || symbol.length > 11) {
            console.error("Error: --symbol must be 2-11 characters");
            process.exit(1);
        }
        const chainId = parseInt(options.chain, 10);
        if (![56, 97].includes(chainId)) {
            console.error("Error: --chain must be 97 (BSC testnet) or 56 (BSC mainnet)");
            process.exit(1);
        }
        const body = {
            agentAddress: options.agent,
            name: options.name,
            symbol,
            chainId,
        };
        if (options.description)
            body.description = options.description;
        if (options.image)
            body.image = options.image;
        console.log(`Tokenizing agent: ${options.agent}`);
        console.log(`  Name:   ${options.name}`);
        console.log(`  Symbol: ${symbol}`);
        console.log(`  Chain:  ${chainId === 56 ? "BSC mainnet" : "BSC testnet"} (${chainId})`);
        let result;
        try {
            result = await apiPost("/agents/tokenize", body);
        }
        catch (err) {
            console.error(`\nError: ${err.message}`);
            process.exit(1);
        }
        // Extract token_id from various response shapes
        const tokenId = result.token_id ??
            result.tokenId ??
            result.data?.token_id;
        const handoffLink = result.handoff_link ??
            result.data?.handoff_link ??
            (tokenId !== undefined
                ? `${DEFAULT_BASE_URL}/deploy/${tokenId}`
                : undefined);
        console.log("\n" + "=".repeat(50));
        console.log("TOKEN RECORD CREATED");
        console.log("=".repeat(50));
        if (tokenId !== undefined) {
            console.log(`Token ID:   ${tokenId}`);
        }
        if (result.token_address) {
            console.log(`Address:    ${result.token_address}`);
        }
        if (result.status) {
            console.log(`Status:     ${result.status}`);
        }
        if (handoffLink) {
            console.log(`\nHandoff link (share with a human to deploy on-chain):`);
            console.log(`  ${handoffLink}`);
        }
        console.log(`\nPlatform fee to deploy: 120 FET (read from contract at deploy time)`);
        console.log(`Trading fee: 2% -> 100% to protocol treasury`);
    });
}
//# sourceMappingURL=tokenize.js.map