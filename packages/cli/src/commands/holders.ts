/**
 * CF-051: holders command
 *
 * agentlaunch holders <address> [--json]
 *
 * Fetches the holder list for a token from the API and displays it
 * as a table with Address, Balance, and Percentage columns.
 *
 * Endpoint: GET /transactions/holders/{address}
 */

import { Command } from "commander";
import { getFrontendUrl } from "agentlaunch-sdk";
import { getPublicClient } from "../http.js";

interface Holder {
  address: string;
  token_percentage: number | string;
  balance?: number | string;
  creator?: boolean | number;
}

export function registerHoldersCommand(program: Command): void {
  program
    .command("holders <address>")
    .description("Show token holder list by contract address")
    .option("--json", "Output raw JSON (machine-readable)")
    .action(async (address: string, options: { json?: boolean }) => {
      const isJson = options.json === true;

      if (!address || address.trim().length < 10) {
        if (isJson) {
          console.log(JSON.stringify({ error: "Invalid token address" }));
        } else {
          console.error(
            "Error: Please provide a valid token contract address.",
          );
        }
        process.exit(1);
      }

      const addr = address.trim();

      let holders: Holder[];
      try {
        const client = getPublicClient();
        const response = await client.get<
          Holder[] | { data?: Holder[]; holders?: Holder[] } | { success: boolean; data: { holders: Holder[]; total: number } }
        >(`/agents/token/${addr}/holders`);
        if (Array.isArray(response)) {
          holders = response;
        } else if ('success' in response && response.data?.holders) {
          // Handle { success: true, data: { holders: [...], total: N } }
          holders = response.data.holders;
        } else {
          holders =
            (response as { data?: Holder[]; holders?: Holder[] }).data ??
            (response as { data?: Holder[]; holders?: Holder[] }).holders ??
            [];
        }
      } catch (err) {
        if (isJson) {
          console.log(JSON.stringify({ error: (err as Error).message }));
        } else {
          console.error(`Error: ${(err as Error).message}`);
        }
        process.exit(1);
      }

      if (isJson) {
        console.log(JSON.stringify({ holders, total: holders.length }));
        return;
      }

      if (holders.length === 0) {
        console.log(`No holders found for ${addr}`);
        return;
      }

      // Pretty-print table
      const colAddr = 44;
      const colBalance = 20;
      const colPct = 10;
      const hr = "─".repeat(colAddr + colBalance + colPct + 6);

      console.log(`\nToken Holders: ${addr}\n`);
      console.log(hr);
      console.log(
        pad("Address", colAddr) + pad("Balance", colBalance) + "Percentage",
      );
      console.log(hr);

      for (const h of holders) {
        const addrCol = h.address ?? "-";
        const balanceNum = typeof h.balance === 'string'
          ? parseFloat(h.balance)
          : (h.balance ?? 0);
        const balanceCol = h.balance !== undefined ? formatNumber(balanceNum) : "-";
        const pctRaw = typeof h.token_percentage === 'string'
          ? parseFloat(h.token_percentage)
          : (h.token_percentage ?? 0);
        const pctCol = `${pctRaw.toFixed(2)}%`;
        const isCreator = (h.creator === true || h.creator === 1);
        const creatorTag = isCreator ? " *" : "";

        // Truncate address to fit column, accounting for creator tag
        const maxAddrLen = colAddr - creatorTag.length - 2;
        const displayAddr = addrCol.length > maxAddrLen
          ? addrCol.slice(0, maxAddrLen - 3) + "..."
          : addrCol;
        console.log(
          pad(displayAddr + creatorTag, colAddr) +
            pad(balanceCol, colBalance) +
            pctCol,
        );
      }

      console.log(hr);
      const hasCreator = holders.some(h => h.creator === true || h.creator === 1);
      console.log(`\n${holders.length} holder(s) total.${hasCreator ? ' (* = creator)' : ''}\n`);
      console.log(`View on platform: ${getFrontendUrl()}/trade/${addr}`);
    });
}

// --- helpers ---

function pad(s: string, width: number): string {
  return s.length >= width
    ? s.slice(0, width)
    : s + " ".repeat(width - s.length);
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(2)}K`;
  return n.toFixed(2);
}
