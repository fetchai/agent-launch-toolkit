/**
 * CLI-001: config subcommands
 *
 * agentlaunch config set-key <apiKey>   Store API key
 * agentlaunch config show               Print current config (masked key)
 * agentlaunch config set-url <url>      Set custom API base URL
 */

import { Command } from "commander";
import {
  DEFAULT_BASE_URL,
  getEnvironment,
  maskKey,
  readConfig,
  resolveFrontendUrl,
  writeConfig,
} from "../config.js";

export function registerConfigCommand(program: Command): void {
  const config = program
    .command("config")
    .description("Manage CLI configuration (API key, base URL)");

  // agentlaunch config set-key <apiKey>
  config
    .command("set-key <apiKey>")
    .description("Store your Agentverse API key in ~/.agentlaunch/config.json")
    .action((apiKey: string) => {
      if (!apiKey || apiKey.trim().length < 10) {
        console.error("Error: API key appears invalid (too short).");
        process.exit(1);
      }
      writeConfig({ apiKey: apiKey.trim() });
      console.log("API key saved to ~/.agentlaunch/config.json");
      console.log(`Key: ${maskKey(apiKey.trim())}`);
    });

  // agentlaunch config show
  config
    .command("show")
    .description("Show resolved environment configuration")
    .action(() => {
      const cfg = readConfig();
      const env = getEnvironment();
      const apiUrl = cfg.baseUrl ?? DEFAULT_BASE_URL;
      const frontendUrl = resolveFrontendUrl();
      const chainId = process.env.CHAIN_ID || '97';
      const keyDisplay = cfg.apiKey ? maskKey(cfg.apiKey) : "(not set)";

      console.log("\n  AgentLaunch Configuration\n");
      console.log(`  Environment:  ${env}`);
      console.log(`  API URL:      ${apiUrl}`);
      console.log(`  Frontend URL: ${frontendUrl}`);
      console.log(`  Chain ID:     ${chainId}`);
      console.log(`  API Key:      ${keyDisplay}`);
      console.log(`  Config file:  ~/.agentlaunch/config.json`);
      console.log();
    });

  // agentlaunch config set-url <url>
  config
    .command("set-url <url>")
    .description(
      "Set a custom API base URL (useful for self-hosted instances)",
    )
    .action((url: string) => {
      try {
        new URL(url); // validate format
      } catch {
        console.error(`Error: "${url}" is not a valid URL.`);
        process.exit(1);
      }
      const normalized = url.replace(/\/+$/, ""); // strip trailing slash
      writeConfig({ baseUrl: normalized });
      console.log(`Base URL set to: ${normalized}`);
    });
}
