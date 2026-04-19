/**
 * CLI: wallet command group
 *
 * agentlaunch wallet balances [--token USDC] [--chain 56] [--json]
 * agentlaunch wallet delegate <token> <amount> --spender <address> [--chain 56] [--json]
 * agentlaunch wallet allowance <token> --owner <address> --spender <address> [--chain 56] [--json]
 * agentlaunch wallet send <token> <to> <amount> [--chain 56] [--json]
 */

import { Command } from "commander";
import {
  getMultiTokenBalances,
  getPaymentToken,
  transferToken,
  checkAllowance,
  createSpendingLimitHandoff,
  getWallet,
} from "agentlaunch-sdk";

async function runBalances(options: { address?: string; token?: string; chain: string; json?: boolean }): Promise<void> {
  const chainId = parseInt(options.chain, 10);

  let walletAddr: string;

  if (options.address) {
    // Read-only mode — no private key needed
    walletAddr = options.address;
  } else {
    const privateKey = process.env["WALLET_PRIVATE_KEY"];
    if (!privateKey) {
      const msg = "Provide --address for read-only queries, or set WALLET_PRIVATE_KEY in .env.";
      if (options.json) {
        console.log(JSON.stringify({ error: msg }));
      } else {
        console.error(`Error: ${msg}`);
      }
      process.exit(1);
    }

    // Derive wallet address from private key
    const ethers = await import("ethers");
    walletAddr = new ethers.Wallet(
      privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`,
    ).address;
  }

  const tokenSymbols = options.token?.split(",").map((s) => s.trim().toUpperCase());

  try {
    const balances = await getMultiTokenBalances(walletAddr, tokenSymbols, chainId);

    if (options.json) {
      console.log(JSON.stringify({ wallet: walletAddr, chainId, balances }));
    } else {
      console.log(`\n  Wallet: ${walletAddr}`);
      console.log(`  Chain:  ${chainId === 56 ? "BSC Mainnet" : chainId === 97 ? "BSC Testnet" : `Chain ${chainId}`}\n`);
      for (const [symbol, balance] of Object.entries(balances)) {
        const bal = parseFloat(balance);
        console.log(`  ${symbol.padEnd(8)} ${bal.toFixed(4)}`);
      }
      console.log();
      console.log("\n  MCP: get_wallet_balances | SDK: client.getWalletBalances()");
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (options.json) {
      console.log(JSON.stringify({ error: msg }));
    } else {
      console.error(`Error: ${msg}`);
    }
    process.exit(1);
  }
}

export function registerWalletCommand(program: Command): void {
  const wallet = program
    .command("wallet")
    .description("Multi-token wallet operations: balances, delegation, transfers")
    .option("--address <address>", "Wallet address to query (read-only, no private key needed)")
    .option("--token <symbols>", "Comma-separated token symbols (default: all known)")
    .option("--chain <chainId>", "Chain ID (56=BSC Mainnet, 97=BSC Testnet)", "56")
    .action(async (options: { address?: string; token?: string; chain: string; json?: boolean }) => {
      // Default: run balances when no subcommand is given
      await runBalances(options);
    });

  // --- wallet balances ---
  wallet
    .command("balances")
    .description("Show wallet balances for BNB, FET, USDC, and custom tokens")
    .option("--address <address>", "Wallet address to query (read-only, no private key needed)")
    .option("--token <symbols>", "Comma-separated token symbols (default: all known)")
    .option("--chain <chainId>", "Chain ID (56=BSC Mainnet, 97=BSC Testnet)", "56")
    .option("--json", "Output raw JSON")
    .action(async (options: { address?: string; token?: string; chain: string; json?: boolean }) => {
      await runBalances(options);
    });

  // --- wallet delegate ---
  wallet
    .command("delegate <token> <amount>")
    .description("Generate a delegation handoff link for ERC-20 spending approval")
    .requiredOption("--spender <address>", "Agent wallet address to authorize (0x...)")
    .option("--chain <chainId>", "Chain ID", "56")
    .option("--json", "Output raw JSON")
    .action(async (token: string, amount: string, options: { spender: string; chain: string; json?: boolean }) => {
      const chainId = parseInt(options.chain, 10);

      try {
        const link = createSpendingLimitHandoff(
          { tokenSymbol: token.toUpperCase(), amount, chainId },
          options.spender,
        );

        if (options.json) {
          console.log(JSON.stringify({ link, token: token.toUpperCase(), amount, spender: options.spender }));
        } else {
          console.log(`\n  Delegation Link`);
          console.log(`  Token:   ${token.toUpperCase()}`);
          console.log(`  Amount:  ${amount}`);
          console.log(`  Spender: ${options.spender}`);
          console.log(`\n  Link: ${link}`);
          console.log(`\n  Share this link with the token owner to approve the spending limit.\n`);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (options.json) {
          console.log(JSON.stringify({ error: msg }));
        } else {
          console.error(`Error: ${msg}`);
        }
        process.exit(1);
      }
    });

  // --- wallet allowance ---
  wallet
    .command("allowance <token>")
    .description("Check ERC-20 spending limit (allowance)")
    .requiredOption("--owner <address>", "Token owner address (0x...)")
    .requiredOption("--spender <address>", "Approved spender address (0x...)")
    .option("--chain <chainId>", "Chain ID", "56")
    .option("--json", "Output raw JSON")
    .action(async (token: string, options: { owner: string; spender: string; chain: string; json?: boolean }) => {
      const chainId = parseInt(options.chain, 10);
      const tokenInfo = getPaymentToken(token.toUpperCase(), chainId);
      if (!tokenInfo) {
        const msg = `Unknown token: ${token} on chain ${chainId}`;
        if (options.json) {
          console.log(JSON.stringify({ error: msg }));
        } else {
          console.error(`Error: ${msg}`);
        }
        process.exit(1);
      }

      try {
        const limit = await checkAllowance(
          tokenInfo.contractAddress,
          options.owner,
          options.spender,
          chainId,
        );

        if (options.json) {
          console.log(JSON.stringify(limit));
        } else {
          console.log(`\n  Spending Limit`);
          console.log(`  Token:     ${token.toUpperCase()}`);
          console.log(`  Owner:     ${options.owner}`);
          console.log(`  Spender:   ${options.spender}`);
          console.log(`  Remaining: ${limit.remaining} ${token.toUpperCase()}\n`);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (options.json) {
          console.log(JSON.stringify({ error: msg }));
        } else {
          console.error(`Error: ${msg}`);
        }
        process.exit(1);
      }
    });

  // --- wallet send ---
  wallet
    .command("send <token> <to> <amount>")
    .description("Send ERC-20 tokens to a recipient")
    .option("--chain <chainId>", "Chain ID", "56")
    .option("-y, --yes", "Skip confirmation prompt")
    .option("--json", "Output raw JSON")
    .action(async (token: string, to: string, amount: string, options: { chain: string; yes?: boolean; json?: boolean }) => {
      const chainId = parseInt(options.chain, 10);
      const tokenInfo = getPaymentToken(token.toUpperCase(), chainId);
      if (!tokenInfo) {
        const msg = `Unknown token: ${token} on chain ${chainId}`;
        if (options.json) {
          console.log(JSON.stringify({ error: msg }));
        } else {
          console.error(`Error: ${msg}`);
        }
        process.exit(1);
      }

      const privateKey = process.env["WALLET_PRIVATE_KEY"];
      if (!privateKey) {
        const msg = "WALLET_PRIVATE_KEY env var required.";
        if (options.json) {
          console.log(JSON.stringify({ error: msg }));
        } else {
          console.error(`Error: ${msg}`);
        }
        process.exit(1);
      }

      // Confirm before sending
      if (!options.yes && !options.json) {
        const readline = await import("node:readline");
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        const answer = await new Promise<string>((resolve) => {
          rl.question(`Send ${amount} ${token.toUpperCase()} to ${to}? [y/N] `, resolve);
        });
        rl.close();
        if (answer.toLowerCase() !== "y") {
          console.log("Aborted.");
          return;
        }
      }

      if (!options.json) {
        console.log(`\n  Sending ${amount} ${token.toUpperCase()} to ${to}...`);
      }

      try {
        const result = await transferToken(
          tokenInfo.contractAddress,
          to,
          amount,
          privateKey,
          chainId,
        );

        if (options.json) {
          console.log(JSON.stringify({ ...result, token: token.toUpperCase(), to, amount }));
        } else {
          console.log(`  Tx Hash: ${result.txHash}`);
          console.log(`  Block:   ${result.blockNumber}`);
          console.log(`  Sent ${amount} ${token.toUpperCase()} to ${to}\n`);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (options.json) {
          console.log(JSON.stringify({ error: msg }));
        } else {
          console.error(`Error: ${msg}`);
        }
        process.exit(1);
      }
    });

  // --- wallet custodial ---
  wallet
    .command("custodial")
    .description("Show server-managed custodial wallet (user wallet by default, or a specific agent's wallet)")
    .option("--chain <chainId>", "Chain ID (56=BSC Mainnet, 97=BSC Testnet)", "56")
    .option("--agent <address>", "Agent address (agent1q...) to get that agent's wallet instead of your user wallet")
    .option("--json", "Output raw JSON")
    .action(async (options: { chain: string; agent?: string; json?: boolean }) => {
      const chainId = parseInt(options.chain, 10);

      try {
        const info = await getWallet(chainId, options.agent);

        if (options.json) {
          console.log(JSON.stringify(info));
        } else {
          const chainLabel = chainId === 56 ? "BSC Mainnet" : chainId === 97 ? "BSC Testnet" : `Chain ${chainId}`;
          const gasSymbol = chainId === 1 || chainId === 11155111 ? "ETH" : "BNB";
          const explorerBase = chainId === 56 ? "https://bscscan.com" : "https://testnet.bscscan.com";
          const walletType = options.agent ? "AGENT WALLET" : "USER WALLET";

          console.log(`\n${"=".repeat(50)}`);
          console.log(walletType);
          console.log(`${"=".repeat(50)}`);
          console.log(`Address:     ${info.address}`);
          if (options.agent) {
            console.log(`Agent:       ${options.agent}`);
          } else {
            console.log(`Type:        Personal (stable across all agents)`);
          }
          console.log(`Network:     ${chainLabel}`);
          console.log(`FET Balance: ${info.fetBalance} FET`);
          console.log(`Gas Balance: ${info.nativeBalance} ${gasSymbol}`);
          console.log(`${"=".repeat(50)}`);
          console.log(`\nExplorer: ${explorerBase}/address/${info.address}`);
          console.log("\nWallet types:");
          console.log("  agentlaunch wallet custodial              # Your user wallet (default)");
          console.log("  agentlaunch wallet custodial --agent agent1q...  # Agent's wallet");
          console.log("\nTo trade with this wallet:");
          console.log("  agentlaunch buy <token> --amount 100 --custodial");
          console.log("  agentlaunch sell <token> --amount 500000 --custodial\n");
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (options.json) {
          console.log(JSON.stringify({ error: msg }));
        } else {
          console.error(`Error: ${msg}`);
        }
        process.exit(1);
      }
    });
}
