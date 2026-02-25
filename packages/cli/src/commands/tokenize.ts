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

import { Command } from "commander";
import { getFrontendUrl } from "agentlaunch-sdk";
import { getClient } from "../http.js";

interface TokenizeBody {
  agentAddress: string;
  name?: string;
  symbol?: string;
  description?: string;
  image?: string;
  chainId?: number;
  maxWalletAmount?: number;
  initialBuyAmount?: number;
  category?: { id: number };
}

interface TokenizeResponse {
  token_id?: number;
  tokenId?: number;
  token_address?: string;
  name?: string;
  symbol?: string;
  status?: string;
  handoff_link?: string;
  maxWalletAmount?: number;
  initialBuyAmount?: number;
  category?: { id: number };
  data?: {
    token_id?: number;
    handoff_link?: string;
  };
  message?: string;
}

export function registerTokenizeCommand(program: Command): void {
  program
    .command("tokenize")
    .description(
      "Create a token record for your agent and receive a handoff link for on-chain deployment",
    )
    .requiredOption("--agent <address>", "Agentverse agent address (agent1q...)")
    .requiredOption("--name <name>", "Token name (max 32 chars)")
    .requiredOption(
      "--symbol <symbol>",
      "Token ticker symbol (2-11 chars, e.g. GIFT)",
    )
    .option("--description <desc>", "Token description (max 500 chars)")
    .option("--image <url>", "URL of the token logo image")
    .option(
      "--chain <chainId>",
      "Chain ID: 97 (BSC testnet) or 56 (BSC mainnet)",
      "97",
    )
    .option(
      "--max-wallet <value>",
      "Max wallet limit: 0=unlimited, 1=0.5%, 2=1%",
      "0",
    )
    .option("--initial-buy <amount>", "FET to buy immediately after deploy (0-1000)")
    .option("--category <id>", "Category ID (default: 1)", "1")
    .option("--json", "Output only JSON (machine-readable)")
    .action(
      async (options: {
        agent: string;
        name: string;
        symbol: string;
        description?: string;
        image?: string;
        chain: string;
        maxWallet: string;
        initialBuy?: string;
        category: string;
        json?: boolean;
      }) => {
        const isJson = options.json === true;

        // Basic validation
        if (!options.agent.startsWith("agent1q")) {
          if (isJson) {
            console.log(
              JSON.stringify({
                error:
                  "--agent must be a valid Agentverse address starting with 'agent1q'",
              }),
            );
          } else {
            console.error(
              "Error: --agent must be a valid Agentverse address starting with 'agent1q'",
            );
          }
          process.exit(1);
        }

        if (options.name.length > 32) {
          if (isJson) {
            console.log(
              JSON.stringify({ error: "--name must be 32 characters or fewer" }),
            );
          } else {
            console.error("Error: --name must be 32 characters or fewer");
          }
          process.exit(1);
        }

        const symbol = options.symbol.toUpperCase();
        if (symbol.length < 2 || symbol.length > 11) {
          if (isJson) {
            console.log(
              JSON.stringify({ error: "--symbol must be 2-11 characters" }),
            );
          } else {
            console.error("Error: --symbol must be 2-11 characters");
          }
          process.exit(1);
        }

        const chainId = parseInt(options.chain, 10);
        if (![56, 97].includes(chainId)) {
          if (isJson) {
            console.log(
              JSON.stringify({
                error: "--chain must be 97 (BSC testnet) or 56 (BSC mainnet)",
              }),
            );
          } else {
            console.error(
              "Error: --chain must be 97 (BSC testnet) or 56 (BSC mainnet)",
            );
          }
          process.exit(1);
        }

        const maxWallet = parseInt(options.maxWallet, 10);
        if (![0, 1, 2].includes(maxWallet)) {
          if (isJson) {
            console.log(
              JSON.stringify({
                error:
                  "--max-wallet must be 0 (unlimited), 1 (0.5%), or 2 (1%)",
              }),
            );
          } else {
            console.error(
              "Error: --max-wallet must be 0 (unlimited), 1 (0.5%), or 2 (1%)",
            );
          }
          process.exit(1);
        }

        let initialBuyAmount: number | undefined;
        if (options.initialBuy !== undefined) {
          initialBuyAmount = parseFloat(options.initialBuy);
          if (
            isNaN(initialBuyAmount) ||
            initialBuyAmount < 0 ||
            initialBuyAmount > 1000
          ) {
            if (isJson) {
              console.log(
                JSON.stringify({
                  error:
                    "--initial-buy must be a number between 0 and 1000",
                }),
              );
            } else {
              console.error(
                "Error: --initial-buy must be a number between 0 and 1000",
              );
            }
            process.exit(1);
          }
        }

        const categoryId = parseInt(options.category, 10);
        if (isNaN(categoryId) || categoryId < 1) {
          if (isJson) {
            console.log(
              JSON.stringify({
                error: "--category must be a valid positive integer",
              }),
            );
          } else {
            console.error(
              "Error: --category must be a valid positive integer",
            );
          }
          process.exit(1);
        }

        const body: TokenizeBody = {
          agentAddress: options.agent,
          name: options.name,
          symbol,
          chainId,
          maxWalletAmount: maxWallet,
          category: { id: categoryId },
        };
        if (options.description) body.description = options.description;
        if (options.image) body.image = options.image;
        if (initialBuyAmount !== undefined)
          body.initialBuyAmount = initialBuyAmount;

        const maxWalletLabel =
          maxWallet === 0
            ? "Unlimited"
            : maxWallet === 1
              ? "0.5% (5M tokens)"
              : "1% (10M tokens)";

        if (!isJson) {
          console.log(`Tokenizing agent: ${options.agent}`);
          console.log(`  Name:       ${options.name}`);
          console.log(`  Symbol:     ${symbol}`);
          console.log(
            `  Chain:      ${chainId === 56 ? "BSC mainnet" : "BSC testnet"} (${chainId})`,
          );
          console.log(`  Max Wallet: ${maxWalletLabel}`);
          if (initialBuyAmount !== undefined && initialBuyAmount > 0) {
            console.log(`  Initial buy: ${initialBuyAmount} FET`);
          }
          console.log(`  Category:   ${categoryId}`);
        }

        let result: TokenizeResponse;
        try {
          const client = getClient();
          result = await client.post<TokenizeResponse>(
            "/tokenize",
            body,
          );
        } catch (err) {
          if (isJson) {
            console.log(JSON.stringify({ error: (err as Error).message }));
          } else {
            console.error(`\nError: ${(err as Error).message}`);
          }
          process.exit(1);
        }

        // Extract token_id from various response shapes
        const tokenId =
          result.token_id ?? result.tokenId ?? result.data?.token_id;

        const frontendUrl = getFrontendUrl();
        const handoffLink =
          result.handoff_link ??
          result.data?.handoff_link ??
          (tokenId !== undefined
            ? `${frontendUrl}/deploy/${tokenId}`
            : undefined);

        if (isJson) {
          console.log(
            JSON.stringify({
              tokenId,
              tokenAddress: result.token_address,
              status: result.status,
              handoffLink,
              maxWalletAmount: maxWallet,
              initialBuyAmount: initialBuyAmount ?? 0,
              category: { id: categoryId },
              deployFee: "120 FET (read from contract at deploy time)",
              tradingFee: "2% -> 100% to protocol treasury",
            }),
          );
          return;
        }

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
        console.log(`Max Wallet: ${maxWalletLabel}`);
        if (initialBuyAmount !== undefined && initialBuyAmount > 0) {
          console.log(`Initial Buy: ${initialBuyAmount} FET`);
        }
        console.log(`Category:   ${categoryId}`);

        if (handoffLink) {
          console.log(
            `\nHandoff link (share with a human to deploy on-chain):`,
          );
          console.log(`  ${handoffLink}`);
        }

        console.log(
          `\nPlatform fee to deploy: 120 FET (read from contract at deploy time)`,
        );
        console.log(`Trading fee: 2% -> 100% to protocol treasury`);
      },
    );
}
