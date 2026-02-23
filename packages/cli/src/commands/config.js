/**
 * CLI-001: config subcommands
 *
 * agentlaunch config set-key <apiKey>   Store API key
 * agentlaunch config show               Print current config (masked key)
 * agentlaunch config set-url <url>      Set custom API base URL
 */
import { DEFAULT_BASE_URL, maskKey, readConfig, writeConfig, } from "../config.js";
export function registerConfigCommand(program) {
    const config = program
        .command("config")
        .description("Manage CLI configuration (API key, base URL)");
    // agentlaunch config set-key <apiKey>
    config
        .command("set-key <apiKey>")
        .description("Store your Agentverse API key in ~/.agentlaunch/config.json")
        .action((apiKey) => {
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
        .description("Show current configuration")
        .action(() => {
        const cfg = readConfig();
        const keyDisplay = cfg.apiKey ? maskKey(cfg.apiKey) : "(not set)";
        const urlDisplay = cfg.baseUrl ?? `${DEFAULT_BASE_URL} (default)`;
        console.log("Current configuration:");
        console.log(`  API Key:  ${keyDisplay}`);
        console.log(`  Base URL: ${urlDisplay}`);
        console.log(`  Config:   ~/.agentlaunch/config.json`);
    });
    // agentlaunch config set-url <url>
    config
        .command("set-url <url>")
        .description("Set a custom API base URL (useful for self-hosted instances)")
        .action((url) => {
        try {
            new URL(url); // validate format
        }
        catch {
            console.error(`Error: "${url}" is not a valid URL.`);
            process.exit(1);
        }
        const normalized = url.replace(/\/+$/, ""); // strip trailing slash
        writeConfig({ baseUrl: normalized });
        console.log(`Base URL set to: ${normalized}`);
    });
}
//# sourceMappingURL=config.js.map