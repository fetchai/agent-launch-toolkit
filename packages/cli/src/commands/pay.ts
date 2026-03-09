/**
 * CLI: pay and invoice commands
 *
 * agentlaunch pay <agent> <amount> --token USDC [--chain 97] [--json]
 * agentlaunch invoice create --agent <addr> --payer <addr> --service <svc> --amount <n> [--token FET] [--json]
 * agentlaunch invoice list --agent <addr> [--status pending] [--json]
 */

import { Command } from "commander";
import {
  getPaymentToken,
  transferToken,
  createInvoice,
  listInvoices,
} from "agentlaunch-sdk";
import type { InvoiceStatus, TokenAmount } from "agentlaunch-sdk";

export function registerPayCommand(program: Command): void {
  // --- pay ---
  program
    .command("pay <to> <amount>")
    .description("Pay an agent or wallet in any supported token")
    .option("--token <symbol>", "Token symbol (default: FET)", "FET")
    .option("--chain <chainId>", "Chain ID", "97")
    .option("-y, --yes", "Skip confirmation prompt")
    .option("--json", "Output raw JSON")
    .action(async (to: string, amount: string, options: { token: string; chain: string; yes?: boolean; json?: boolean }) => {
      const chainId = parseInt(options.chain, 10);
      const tokenSymbol = options.token.toUpperCase();
      const tokenInfo = getPaymentToken(tokenSymbol, chainId);

      if (!tokenInfo) {
        const msg = `Unknown token: ${tokenSymbol} on chain ${chainId}. Supported: FET, USDC.`;
        if (options.json) {
          console.log(JSON.stringify({ error: msg }));
        } else {
          console.error(`Error: ${msg}`);
        }
        process.exit(1);
      }

      const privateKey = process.env["WALLET_PRIVATE_KEY"];
      if (!privateKey) {
        const msg = "WALLET_PRIVATE_KEY env var required for payments.";
        if (options.json) {
          console.log(JSON.stringify({ error: msg }));
        } else {
          console.error(`Error: ${msg}`);
        }
        process.exit(1);
      }

      // Confirm before paying
      if (!options.yes && !options.json) {
        const readline = await import("node:readline");
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        const answer = await new Promise<string>((resolve) => {
          rl.question(`Pay ${amount} ${tokenSymbol} to ${to}? [y/N] `, resolve);
        });
        rl.close();
        if (answer.toLowerCase() !== "y") {
          console.log("Aborted.");
          return;
        }
      }

      if (!options.json) {
        console.log(`\n  Paying ${amount} ${tokenSymbol} to ${to}...`);
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
          console.log(JSON.stringify({ ...result, token: tokenSymbol, to, amount }));
        } else {
          console.log(`  Tx Hash: ${result.txHash}`);
          console.log(`  Block:   ${result.blockNumber}`);
          console.log(`  Paid ${amount} ${tokenSymbol} to ${to}\n`);
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

  // --- invoice ---
  const invoice = program
    .command("invoice")
    .description("Invoice management: create, list");

  // --- invoice create ---
  invoice
    .command("create")
    .description("Create a payment invoice in agent storage")
    .requiredOption("--agent <address>", "Agent address (agent1q...)")
    .requiredOption("--payer <address>", "Payer wallet or agent address")
    .requiredOption("--service <name>", "Service being invoiced")
    .requiredOption("--amount <amount>", "Invoice amount (decimal string)")
    .option("--token <symbol>", "Token symbol (default: FET)", "FET")
    .option("--chain <chainId>", "Chain ID", "97")
    .option("--json", "Output raw JSON")
    .action(async (options: {
      agent: string;
      payer: string;
      service: string;
      amount: string;
      token: string;
      chain: string;
      json?: boolean;
    }) => {
      const chainId = parseInt(options.chain, 10);
      const tokenSymbol = options.token.toUpperCase();
      const tokenInfo = getPaymentToken(tokenSymbol, chainId);

      if (!tokenInfo) {
        const msg = `Unknown token: ${tokenSymbol} on chain ${chainId}`;
        if (options.json) {
          console.log(JSON.stringify({ error: msg }));
        } else {
          console.error(`Error: ${msg}`);
        }
        process.exit(1);
      }

      const invoiceId = `inv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      const amount: TokenAmount = {
        amount: options.amount,
        token: tokenInfo,
      };

      try {
        const inv = await createInvoice(options.agent, {
          id: invoiceId,
          issuer: options.agent,
          payer: options.payer,
          service: options.service,
          amount,
        });

        if (options.json) {
          console.log(JSON.stringify(inv));
        } else {
          console.log(`\n  Invoice Created`);
          console.log(`  ID:      ${inv.id}`);
          console.log(`  Service: ${inv.service}`);
          console.log(`  Amount:  ${inv.amount.amount} ${inv.amount.token.symbol}`);
          console.log(`  Payer:   ${inv.payer}`);
          console.log(`  Status:  ${inv.status}\n`);
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

  // --- invoice list ---
  invoice
    .command("list")
    .description("List invoices for an agent")
    .requiredOption("--agent <address>", "Agent address (agent1q...)")
    .option("--status <status>", "Filter by status (pending, paid, expired, refunded, disputed)")
    .option("--json", "Output raw JSON")
    .action(async (options: { agent: string; status?: string; json?: boolean }) => {
      const status = options.status as InvoiceStatus | undefined;

      try {
        const invoices = await listInvoices(options.agent, status);

        if (options.json) {
          console.log(JSON.stringify({ invoices, count: invoices.length }));
        } else {
          if (invoices.length === 0) {
            console.log("\n  No invoices found.\n");
          } else {
            console.log(`\n  Invoices (${invoices.length}):\n`);
            for (const inv of invoices) {
              console.log(`  ${inv.id}  ${inv.service.padEnd(20)} ${inv.amount.amount} ${inv.amount.token.symbol}  [${inv.status}]`);
            }
            console.log();
          }
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
