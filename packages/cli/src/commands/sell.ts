/**
 * CLI: sell command
 *
 * agentlaunch sell <address> --amount <tokens> [--chain 97] [--dry-run] [--json]
 *
 * Executes a sell on a bonding curve token contract, or previews the trade with --dry-run.
 */

import { Command } from "commander";
import { calculateSell, sellTokens } from "agentlaunch-sdk";
import { getPublicClient } from "../http.js";

export function registerSellCommand(program: Command): void {
  program
    .command("sell <address>")
    .description("Sell tokens on a bonding curve (on-chain or dry-run preview)")
    .requiredOption("--amount <tokens>", "Amount of tokens to sell")
    .option("--chain <chainId>", "Chain ID (97=BSC Testnet, 56=BSC Mainnet)", "97")
    .option("--dry-run", "Preview the trade without executing (no wallet needed)")
    .option("--json", "Output raw JSON (machine-readable)")
    .action(async (address: string, options: {
      amount: string;
      chain: string;
      dryRun?: boolean;
      json?: boolean;
    }) => {
      // Validate address
      if (!address.startsWith("0x") || address.length < 10) {
        if (options.json) {
          console.log(JSON.stringify({ error: "Invalid token address. Must start with 0x." }));
        } else {
          console.error("Error: Invalid token address. Must start with 0x.");
        }
        process.exit(1);
      }

      // Validate amount
      const amount = parseFloat(options.amount);
      if (isNaN(amount) || amount <= 0) {
        if (options.json) {
          console.log(JSON.stringify({ error: "Amount must be a positive number." }));
        } else {
          console.error("Error: Amount must be a positive number.");
        }
        process.exit(1);
      }

      // Validate chain
      const chainId = parseInt(options.chain, 10);
      if (![97, 56].includes(chainId)) {
        if (options.json) {
          console.log(JSON.stringify({ error: "Supported chains: 97 (BSC Testnet), 56 (BSC Mainnet)" }));
        } else {
          console.error("Error: Supported chains: 97 (BSC Testnet), 56 (BSC Mainnet)");
        }
        process.exit(1);
      }

      try {
        if (options.dryRun) {
          // Dry run: just calculate
          const client = getPublicClient();
          const result = await calculateSell(address, options.amount, client);

          if (options.json) {
            console.log(JSON.stringify({ dryRun: true, ...result }));
            return;
          }

          const chainName = chainId === 56 ? "BSC Mainnet" : "BSC Testnet";
          console.log(`\n${"=".repeat(50)}`);
          console.log("SELL PREVIEW (dry run)");
          console.log(`${"=".repeat(50)}`);
          console.log(`Token:          ${address}`);
          console.log(`Chain:          ${chainName}`);
          console.log(`Tokens to sell: ${options.amount}`);
          console.log(`FET to receive: ${result.fetReceived} FET`);
          console.log(`Price per token: ${result.pricePerToken} FET`);
          console.log(`Price impact:   ${result.priceImpact}%`);
          console.log(`Protocol fee:   ${result.fee} FET (2% to treasury)`);
          console.log(`Net FET received: ${result.netFetReceived} FET`);
          console.log(`${"=".repeat(50)}`);
          console.log("\nRe-run without --dry-run to execute the trade.\n");
          return;
        }

        // Real execution
        const result = await sellTokens(address, options.amount, {
          chainId,
        });

        if (options.json) {
          console.log(JSON.stringify(result));
          return;
        }

        const chainName = chainId === 56 ? "BSC Mainnet" : "BSC Testnet";
        console.log(`\n${"=".repeat(50)}`);
        console.log("SELL EXECUTED");
        console.log(`${"=".repeat(50)}`);
        console.log(`Token:          ${address}`);
        console.log(`Chain:          ${chainName}`);
        console.log(`Tx Hash:        ${result.txHash}`);
        console.log(`Block:          ${result.blockNumber}`);
        console.log(`Tokens sold:    ${result.tokensSold}`);
        console.log(`FET received:   ${result.fetReceived} FET`);
        console.log(`Protocol fee:   ${result.fee} FET (2% to treasury)`);
        console.log(`Price impact:   ${result.priceImpact}%`);
        console.log(`${"=".repeat(50)}\n`);
      } catch (err) {
        if (options.json) {
          console.log(JSON.stringify({ error: (err as Error).message }));
        } else {
          console.error(`Error: ${(err as Error).message}`);
        }
        process.exit(1);
      }
    });
}
