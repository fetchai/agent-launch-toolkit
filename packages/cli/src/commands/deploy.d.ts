/**
 * CLI-003: deploy command
 *
 * agentlaunch deploy [--file agent.py] [--name "My Agent"]
 *
 * Deploys an agent.py file to Agentverse:
 *   1. Creates agent record
 *   2. Uploads code (double-encoded as Agentverse expects)
 *   3. Sets AGENTVERSE_API_KEY and AGENTLAUNCH_API_KEY secrets
 *   4. Starts the agent
 *   5. Polls until compiled (up to 60 s)
 *
 * Reads the API key from ~/.agentlaunch/config.json (set with `config set-key`).
 * The same key is used for both the Agentverse auth header and the two secrets.
 */
import { Command } from "commander";
export declare function registerDeployCommand(program: Command): void;
//# sourceMappingURL=deploy.d.ts.map