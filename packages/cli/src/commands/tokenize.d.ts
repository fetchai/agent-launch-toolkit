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
export declare function registerTokenizeCommand(program: Command): void;
//# sourceMappingURL=tokenize.d.ts.map