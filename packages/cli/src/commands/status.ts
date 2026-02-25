/**
 * CLI-004: status command
 *
 * agentlaunch status <address> [--json]
 *
 * Fetches a token from GET /api/agents/token/<address> and shows its details.
 */

import { Command } from "commander";
import { getFrontendUrl } from "agentlaunch-sdk";
import { getPublicClient } from "../http.js";

interface TokenDetail {
  id?: number;
  name?: string;
  symbol?: string;
  token_address?: string;
  address?: string;
  price?: string | number;
  marketCap?: string | number;
  market_cap?: string | number;
  holders?: number;
  holderCount?: number;
  holder_count?: number;
  progress?: string | number;
  listed?: boolean;
  status?: string;
  description?: string;
  chainId?: number;
  chain_id?: number;
  createdAt?: string;
  created_at?: string;
}

interface TokenDetailResponse {
  data?: TokenDetail;
  token?: TokenDetail;
}

export function registerStatusCommand(program: Command): void {
  program
    .command("status <address>")
    .description("Show detailed status of a token by its contract address")
    .option("--json", "Output raw JSON (machine-readable)")
    .action(async (address: string, options: { json?: boolean }) => {
      if (!address || address.trim().length < 10) {
        if (options.json) {
          console.log(JSON.stringify({ error: "Invalid token address" }));
        } else {
          console.error(
            "Error: Please provide a valid token contract address.",
          );
        }
        process.exit(1);
      }

      let response: TokenDetailResponse | TokenDetail;
      try {
        const client = getPublicClient();
        response = await client.get<TokenDetailResponse | TokenDetail>(
          `/token/${address.trim()}`,
        );
      } catch (err) {
        if (options.json) {
          console.log(JSON.stringify({ error: (err as Error).message }));
        } else {
          console.error(`Error: ${(err as Error).message}`);
        }
        process.exit(1);
      }

      // Normalize response shapes
      const token: TokenDetail =
        (response as TokenDetailResponse).data ??
        (response as TokenDetailResponse).token ??
        (response as TokenDetail);

      if (options.json) {
        console.log(JSON.stringify(token));
        return;
      }

      // Pretty-print
      const name = token.name ?? "-";
      const symbol = token.symbol ?? "-";
      const tokenAddress = token.token_address ?? token.address ?? address;
      const price = formatPrice(token.price);
      const marketCap = formatFet(token.marketCap ?? token.market_cap);
      const holders =
        token.holders ?? token.holderCount ?? token.holder_count ?? 0;
      const progress = formatProgress(token.progress);
      const chainId = token.chainId ?? token.chain_id ?? 97;
      const chainName =
        chainId === 56
          ? "BSC Mainnet"
          : chainId === 97
            ? "BSC Testnet"
            : `Chain ${chainId}`;
      const isListed = token.listed === true || token.status === "listed";
      const graduationStatus = isListed
        ? "Listed on DEX"
        : `Bonding curve (${progress} to 30,000 FET target)`;
      const createdAt = token.createdAt ?? token.created_at;

      console.log(`\n${"=".repeat(50)}`);
      console.log(`TOKEN STATUS`);
      console.log(`${"=".repeat(50)}`);
      console.log(`Name:         ${name}`);
      console.log(`Symbol:       ${symbol}`);
      console.log(`Address:      ${tokenAddress}`);
      console.log(`Chain:        ${chainName}`);
      console.log(`Price:        ${price}`);
      console.log(`Market Cap:   ${marketCap}`);
      console.log(`Holders:      ${holders}`);
      console.log(`Progress:     ${progress}`);
      console.log(`Status:       ${graduationStatus}`);
      if (token.description) {
        console.log(`Description:  ${token.description}`);
      }
      if (createdAt) {
        console.log(`Created:      ${new Date(createdAt).toUTCString()}`);
      }
      console.log(`${"=".repeat(50)}`);
      console.log(
        `\nView on platform: ${getFrontendUrl()}/trade/${tokenAddress}`,
      );
      console.log(`Trading fee: 2% -> 100% to protocol treasury\n`);
    });
}

// --- helpers ---

function formatPrice(raw?: string | number): string {
  if (raw === undefined || raw === null) return "-";
  const n = typeof raw === "string" ? parseFloat(raw) : raw;
  if (isNaN(n)) return "-";
  if (n === 0) return "0 FET";
  if (n < 0.000001) return `${n.toExponential(4)} FET`;
  if (n < 1) return `${n.toFixed(8)} FET`;
  return `${n.toFixed(4)} FET`;
}

function formatFet(raw?: string | number): string {
  if (raw === undefined || raw === null) return "-";
  const n = typeof raw === "string" ? parseFloat(raw) : raw;
  if (isNaN(n)) return "-";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M FET`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(2)}K FET`;
  return `${n.toFixed(2)} FET`;
}

function formatProgress(raw?: string | number): string {
  if (raw === undefined || raw === null) return "-";
  const n = typeof raw === "string" ? parseFloat(raw) : raw;
  if (isNaN(n)) return "-";
  return `${Math.min(100, Math.max(0, n)).toFixed(2)}%`;
}
