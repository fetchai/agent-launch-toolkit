/**
 * connect-logs command
 *
 * agentlaunch connect-logs <agentAddress> [--limit <n>] [--json]
 *
 * Fetches recent log lines for a connect-hosted agent via the SDK.
 *
 * SDK: logsProxy(address, { limit }, apiKey) → string[]
 * Upstream: GET https://agentverse.ai/v1/hosting/agents/<address>/logs/latest
 */

import { Command } from "commander";
import { connectionLogs } from '@fetchai/agent-launch-sdk';
import { requireApiKey } from "../config.js";

const DEFAULT_LIMIT = 50;

export function registerConnectLogsCommand(program: Command): void {
  program
    .command("connect-logs <agentAddress>")
    .description("Show recent log lines for a connect-hosted agent")
    .option(
      "--limit <n>",
      `Number of log lines to fetch (default: ${DEFAULT_LIMIT})`,
      String(DEFAULT_LIMIT),
    )
    .option("--json", "Output raw JSON (machine-readable)")
    .action(
      async (
        agentAddress: string,
        options: { limit: string; json?: boolean },
      ) => {
        const isJson = options.json === true;

        // Validate agent address
        if (!agentAddress || agentAddress.trim().length < 10) {
          if (isJson) {
            console.log(JSON.stringify({ error: "Invalid agent address" }));
          } else {
            console.error(
              "Error: Please provide a valid agent address (agent1q...).",
            );
          }
          process.exit(1);
        }

        const addr = agentAddress.trim();

        // Parse and validate --limit
        const limitRaw = parseInt(options.limit, 10);
        if (isNaN(limitRaw) || limitRaw < 1) {
          if (isJson) {
            console.log(
              JSON.stringify({ error: "--limit must be a positive integer" }),
            );
          } else {
            console.error("Error: --limit must be a positive integer.");
          }
          process.exit(1);
        }
        const limit = limitRaw;

        let lines: string[];
        try {
          const apiKey = requireApiKey();
          lines = await connectionLogs(addr, { limit }, apiKey);
        } catch (err) {
          if (isJson) {
            console.log(
              JSON.stringify({ error: (err as Error).message }),
            );
          } else {
            console.error(`Error: ${(err as Error).message}`);
          }
          process.exit(1);
        }

        if (isJson) {
          console.log(JSON.stringify({ agentAddress: addr, limit, lines }));
          return;
        }

        if (lines.length === 0) {
          console.log(`No log lines found for ${addr}`);
          return;
        }

        // Pretty-print log lines
        console.log(`\nConnect Logs: ${addr}  (last ${lines.length})\n`);
        console.log("─".repeat(72));

        for (const line of lines) {
          console.log(line);
        }

        console.log("─".repeat(72));
        console.log(`\n${lines.length} line(s) shown.`);
      },
    );
}
