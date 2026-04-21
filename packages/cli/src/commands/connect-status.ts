/**
 * CLI: connect-status command
 *
 * agentlaunch connect-status <agentAddress> [--json]
 *
 * Shows the connect registration status for an agent address:
 * address, name, endpoint, status, lastActivity, and compilationStatus.
 */

import { Command } from "commander";
import { connectionStatus } from '@fetchai/agent-launch-sdk';
import type { ConnectionStatus } from '@fetchai/agent-launch-sdk';
import { requireApiKey } from "../config.js";

// ---------------------------------------------------------------------------
// Minimal ANSI color helpers — no external deps, guarded by TTY
// ---------------------------------------------------------------------------
const isTty = process.stdout.isTTY === true;

const c = {
  bold: (s: string) => (isTty ? `\x1b[1m${s}\x1b[0m` : s),
  dim: (s: string) => (isTty ? `\x1b[2m${s}\x1b[0m` : s),
  green: (s: string) => (isTty ? `\x1b[32m${s}\x1b[0m` : s),
  yellow: (s: string) => (isTty ? `\x1b[33m${s}\x1b[0m` : s),
  red: (s: string) => (isTty ? `\x1b[31m${s}\x1b[0m` : s),
  cyan: (s: string) => (isTty ? `\x1b[36m${s}\x1b[0m` : s),
};

// ---------------------------------------------------------------------------
// Command registration
// ---------------------------------------------------------------------------
export function registerConnectStatusCommand(program: Command): void {
  program
    .command("connect-status <agentAddress>")
    .description(
      "Show connect registration status for an agent (address, name, endpoint, status, lastActivity)",
    )
    .option("--json", "Output raw JSON (machine-readable)")
    .action(async (agentAddress: string, options: { json?: boolean }) => {
      // --- input validation ---
      const addr = agentAddress.trim();
      if (!addr || addr.length < 10) {
        if (options.json) {
          console.log(JSON.stringify({ error: "Invalid agent address" }));
        } else {
          console.error("Error: Please provide a valid agent address (agent1q...).");
        }
        process.exit(1);
      }

      let proxy: ConnectionStatus;

      try {
        const apiKey = requireApiKey();
        proxy = await connectionStatus(addr, apiKey);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (options.json) {
          console.log(JSON.stringify({ error: msg }));
        } else {
          console.error(`Error: ${msg}`);
        }
        process.exit(1);
      }

      // --- JSON output ---
      if (options.json) {
        console.log(JSON.stringify(proxy));
        return;
      }

      // --- pretty-print ---
      const statusLabel = formatStatus(proxy.status);
      const lastActivity = proxy.lastActivity
        ? new Date(proxy.lastActivity).toUTCString()
        : c.dim("never");
      const endpointDisplay =
        proxy.endpoint && proxy.endpoint.length > 0
          ? proxy.endpoint
          : c.dim("-");
      const compilationDisplay = proxy.compilationStatus
        ? proxy.compilationStatus
        : c.dim("-");

      const SEP = "=".repeat(50);
      console.log(`\n${c.bold(SEP)}`);
      console.log(c.bold("CONNECT STATUS"));
      console.log(c.bold(SEP));
      console.log(`Address:       ${c.cyan(proxy.address)}`);
      console.log(`Name:          ${proxy.name || c.dim("-")}`);
      console.log(`Endpoint:      ${endpointDisplay}`);
      console.log(`Status:        ${statusLabel}`);
      console.log(`Compilation:   ${compilationDisplay}`);
      console.log(`Last Activity: ${lastActivity}`);
      console.log(c.bold(SEP));
      console.log(
        c.dim("\n  MCP: get_connect_status | SDK: statusProxy()") + "\n",
      );
    });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Colour-code the status string for terminal output.
 * Falls back to the raw value for any unrecognised state.
 */
function formatStatus(raw: string): string {
  switch (raw?.toLowerCase()) {
    case "running":
      return c.green(raw);
    case "stopped":
      return c.dim(raw);
    case "error":
      return c.red(raw);
    default:
      return raw ?? c.dim("unknown");
  }
}
