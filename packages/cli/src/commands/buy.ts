/**
 * CLI: buy command
 *
 * agentlaunch buy <address> --amount <FET> [--slippage 5] [--chain 97] [--dry-run] [--json]
 *
 * Executes a buy on a bonding curve token contract, or previews the trade with --dry-run.
 */

import { Command } from "commander";
import { calculateBuy, buyTokens, executeBuy, DEFAULT_SLIPPAGE_PERCENT } from "agentlaunch-sdk";
import { getPublicClient } from "../http.js";

export function registerBuyCommand(program: Command): void {
  program
    .command("buy <address>")
    .description("Buy tokens on a bonding curve (on-chain or dry-run preview)")
    .requiredOption("--amount <fet>", "Amount of FET to spend")
    .option("--slippage <percent>", "Slippage tolerance percentage", String(DEFAULT_SLIPPAGE_PERCENT))
    .option("--chain <chainId>", "Chain ID (97=BSC Testnet, 56=BSC Mainnet)", "97")
    .option("--dry-run", "Preview the trade without executing (no wallet needed)")
    .option("--custodial", "Use server-side custodial wallet (requires AGENTVERSE_API_KEY)")
    .option("--agent <agentAddress>", "Agent address (agent1q...) to trade from agent's wallet (implies --custodial)")
    .option("--json", "Output raw JSON (machine-readable)")
    .action(async (address: string, options: {
      amount: string;
      slippage: string;
      chain: string;
      dryRun?: boolean;
      custodial?: boolean;
      agent?: string;
      json?: boolean;
    }) => {
      // --agent implies --custodial
      if (options.agent) options.custodial = true;
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

      // Validate slippage
      const slippage = parseFloat(options.slippage);
      if (isNaN(slippage) || slippage < 0 || slippage > 100) {
        if (options.json) {
          console.log(JSON.stringify({ error: "Slippage must be between 0 and 100." }));
        } else {
          console.error("Error: Slippage must be between 0 and 100.");
        }
        process.exit(1);
      }

      try {
        if (options.dryRun) {
          // Dry run: just calculate
          const client = getPublicClient();
          const result = await calculateBuy(address, options.amount, client);

          if (options.json) {
            console.log(JSON.stringify({ dryRun: true, ...result }));
            return;
          }

          const chainName = chainId === 56 ? "BSC Mainnet" : "BSC Testnet";
          console.log(`\n${"=".repeat(50)}`);
          console.log("BUY PREVIEW (dry run)");
          console.log(`${"=".repeat(50)}`);
          console.log(`Token:          ${address}`);
          console.log(`Chain:          ${chainName}`);
          console.log(`FET to spend:   ${options.amount} FET`);
          console.log(`Tokens to receive: ${result.tokensReceived}`);
          console.log(`Price per token: ${result.pricePerToken} FET`);
          console.log(`Price impact:   ${result.priceImpact}%`);
          console.log(`Protocol fee:   ${result.fee} FET (2% to treasury)`);
          console.log(`Net FET spent:  ${result.netFetSpent} FET`);
          console.log(`Slippage:       ${slippage}%`);
          console.log(`${"=".repeat(50)}`);
          console.log("\nRe-run without --dry-run to execute the trade.\n");
          return;
        }

        // Custodial execution (server-side wallet)
        if (options.custodial) {
          const custodialResult = await executeBuy({
            tokenAddress: address,
            fetAmount: options.amount,
            slippagePercent: slippage,
            agentAddress: options.agent,
          });

          if (options.json) {
            console.log(JSON.stringify({ custodial: true, ...custodialResult }));
            return;
          }

          const chainName = chainId === 56 ? "BSC Mainnet" : "BSC Testnet";
          console.log(`\n${"=".repeat(50)}`);
          console.log("CUSTODIAL BUY EXECUTED");
          console.log(`${"=".repeat(50)}`);
          console.log(`Token:          ${address}`);
          console.log(`Chain:          ${chainName}`);
          console.log(`Wallet:         ${custodialResult.walletAddress}`);
          console.log(`Tx Hash:        ${custodialResult.txHash}`);
          console.log(`Block:          ${custodialResult.blockNumber}`);
          console.log(`FET spent:      ${custodialResult.fetSpent} FET`);
          console.log(`Tokens (expected): ${custodialResult.expectedTokens}`);
          console.log(`Min tokens:     ${custodialResult.minTokens} (${slippage}% slippage)`);
          console.log(`Gas used:       ${custodialResult.gasUsed}`);
          if (custodialResult.approvalTxHash) {
            console.log(`Approval Tx:    ${custodialResult.approvalTxHash}`);
          }
          console.log(`${"=".repeat(50)}\n`);
          console.log("\n  MCP: buy_token | SDK: sdk.trading.buy()");
          return;
        }

        // On-chain execution (requires WALLET_PRIVATE_KEY)
        const result = await buyTokens(address, options.amount, {
          chainId,
          slippagePercent: slippage,
        });

        if (options.json) {
          console.log(JSON.stringify(result));
          return;
        }

        const chainName = chainId === 56 ? "BSC Mainnet" : "BSC Testnet";
        console.log(`\n${"=".repeat(50)}`);
        console.log("BUY EXECUTED");
        console.log(`${"=".repeat(50)}`);
        console.log(`Token:          ${address}`);
        console.log(`Chain:          ${chainName}`);
        console.log(`Tx Hash:        ${result.txHash}`);
        console.log(`Block:          ${result.blockNumber}`);
        console.log(`FET spent:      ${result.fetSpent} FET`);
        console.log(`Tokens received: ${result.tokensReceived}`);
        console.log(`Protocol fee:   ${result.fee} FET (2% to treasury)`);
        console.log(`Price impact:   ${result.priceImpact}%`);
        if (result.approvalTxHash) {
          console.log(`Approval Tx:    ${result.approvalTxHash}`);
        }
        console.log(`${"=".repeat(50)}\n`);
        console.log("\n  MCP: buy_tokens | SDK: client.buyTokens()");
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
