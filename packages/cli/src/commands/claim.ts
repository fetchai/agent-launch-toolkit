/**
 * CLI: claim command (placeholder)
 *
 * This command will be implemented when custodial trading is enabled.
 */

import { Command } from "commander";

export function registerClaimCommand(program: Command): void {
  program
    .command("claim")
    .description("Claim tokens from agent wallet (coming soon)")
    .action(() => {
      console.log("The claim command is not yet available.");
      console.log("Custodial trading features are coming soon.");
      process.exit(0);
    });
}
