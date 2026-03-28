/**
 * connect command
 *
 * agentlaunch connect --name "My Connect Agent" --endpoint https://api.example.com
 *                   [--description "..."] [--auth-header X-Api-Key]
 *                   [--auth-secret <secret>] [--timeout 30] [--retries 3]
 *                   [--json]
 *
 * Deploys an Agentverse connect agent that forwards messages to an external
 * HTTPS endpoint. Useful for wrapping existing APIs as uAgents without
 * writing Python code.
 *
 * Flow:
 *   1. Validate --endpoint is a valid HTTPS URL
 *   2. Validate option ranges (timeout, retries)
 *   3. Call sdk.connect.deploy() to create and start the connect agent
 *   4. Print agent address and Agentverse link
 *
 * Reads the API key from ~/.agentlaunch/config.json (set with `config set-key`).
 */

import { Command } from "commander";
import { connectAgent, type ConnectResult } from "agentlaunch-sdk";
import { requireApiKey } from "../config.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ConnectOptions {
  name: string;
  endpoint: string;
  description?: string;
  authHeader?: string;
  authSecret?: string;
  timeout: string;
  retries: string;
  json?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns true if the given string is a valid HTTPS URL.
 * Rejects http:// URLs and non-URL strings.
 */
function isValidHttpsUrl(raw: string): boolean {
  try {
    const parsed = new URL(raw);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Command registration
// ---------------------------------------------------------------------------

export function registerConnectCommand(program: Command): void {
  program
    .command("connect")
    .description(
      "Deploy an Agentverse connect agent that forwards messages to an external HTTPS endpoint",
    )
    .requiredOption(
      "--name <name>",
      "Display name for the connect agent on Agentverse (max 64 chars)",
    )
    .requiredOption(
      "--endpoint <url>",
      "Target HTTPS endpoint the connect agent will forward requests to",
    )
    .option(
      "--description <desc>",
      "Short description of what this connect agent does (max 200 chars)",
    )
    .option(
      "--auth-header <header>",
      "HTTP header name to use for authenticating with the endpoint (e.g. X-Api-Key)",
    )
    .option(
      "--auth-secret <secret>",
      "Secret value sent in the auth header — stored as an Agentverse secret, never logged",
    )
    .option(
      "--timeout <seconds>",
      "Request timeout in seconds when calling the endpoint (1-300)",
      "30",
    )
    .option(
      "--retries <count>",
      "Number of retry attempts on endpoint failure (0-10)",
      "3",
    )
    .option("--json", "Output only JSON (machine-readable)")
    .action(async (options: ConnectOptions) => {
      const isJson = options.json === true;

      // ------------------------------------------------------------------
      // Resolve API key
      // ------------------------------------------------------------------
      const apiKey = (() => {
        try {
          return requireApiKey();
        } catch (err) {
          if (isJson) {
            console.log(JSON.stringify({ error: (err as Error).message }));
          } else {
            console.error((err as Error).message);
          }
          process.exit(1);
        }
      })();

      // ------------------------------------------------------------------
      // Validate --name
      // ------------------------------------------------------------------
      const agentName = options.name.trim();
      if (agentName.length === 0 || agentName.length > 64) {
        const msg = "--name must be between 1 and 64 characters";
        if (isJson) {
          console.log(JSON.stringify({ error: msg }));
        } else {
          console.error(`Error: ${msg}`);
        }
        process.exit(1);
      }

      // ------------------------------------------------------------------
      // Validate --endpoint (must be HTTPS)
      // ------------------------------------------------------------------
      if (!isValidHttpsUrl(options.endpoint)) {
        const msg =
          "--endpoint must be a valid HTTPS URL (e.g. https://api.example.com/webhook)";
        if (isJson) {
          console.log(JSON.stringify({ error: msg }));
        } else {
          console.error(`Error: ${msg}`);
        }
        process.exit(1);
      }

      // ------------------------------------------------------------------
      // Validate --timeout
      // ------------------------------------------------------------------
      const timeout = parseInt(options.timeout, 10);
      if (isNaN(timeout) || timeout < 1 || timeout > 300) {
        const msg = "--timeout must be an integer between 1 and 300 seconds";
        if (isJson) {
          console.log(JSON.stringify({ error: msg }));
        } else {
          console.error(`Error: ${msg}`);
        }
        process.exit(1);
      }

      // ------------------------------------------------------------------
      // Validate --retries
      // ------------------------------------------------------------------
      const retries = parseInt(options.retries, 10);
      if (isNaN(retries) || retries < 0 || retries > 10) {
        const msg = "--retries must be an integer between 0 and 10";
        if (isJson) {
          console.log(JSON.stringify({ error: msg }));
        } else {
          console.error(`Error: ${msg}`);
        }
        process.exit(1);
      }

      // ------------------------------------------------------------------
      // Validate --auth-header / --auth-secret pairing
      // Providing a secret without a header name (or vice-versa) is a
      // likely configuration mistake — warn the user.
      // ------------------------------------------------------------------
      if (options.authSecret && !options.authHeader) {
        const msg =
          "--auth-secret provided but --auth-header is missing; both must be set together";
        if (isJson) {
          console.log(JSON.stringify({ error: msg }));
        } else {
          console.error(`Error: ${msg}`);
        }
        process.exit(1);
      }
      if (options.authHeader && !options.authSecret) {
        const msg =
          "--auth-header provided but --auth-secret is missing; both must be set together";
        if (isJson) {
          console.log(JSON.stringify({ error: msg }));
        } else {
          console.error(`Error: ${msg}`);
        }
        process.exit(1);
      }

      // ------------------------------------------------------------------
      // Progress output (human mode)
      // ------------------------------------------------------------------
      if (!isJson) {
        console.log(`Deploying connect agent: ${agentName}`);
        console.log(`  Endpoint:    ${options.endpoint}`);
        if (options.description) {
          console.log(`  Description: ${options.description}`);
        }
        if (options.authHeader) {
          console.log(`  Auth header: ${options.authHeader}`);
          console.log(`  Auth secret: ${"*".repeat(8)} (stored as Agentverse secret)`);
        }
        console.log(`  Timeout:     ${timeout}s`);
        console.log(`  Retries:     ${retries}`);
        console.log("\n[1/4] Creating connect agent on Agentverse...");
        console.log("[2/4] Uploading generated connect code...");
        console.log("[3/4] Setting endpoint secrets...");
        console.log("[4/4] Starting agent...");
      }

      // ------------------------------------------------------------------
      // SDK call — deploy connect agent
      // ------------------------------------------------------------------
      let result: ConnectResult;
      try {
        result = await connectAgent(
          {
            name: agentName,
            endpoint: options.endpoint,
            description: options.description,
            auth: options.authHeader
              ? { header: options.authHeader, secret: options.authSecret! }
              : undefined,
            // CLI accepts seconds; SDK expects milliseconds
            timeout: timeout * 1000,
            retries,
          },
          apiKey,
        );
      } catch (err) {
        if (isJson) {
          console.log(JSON.stringify({ error: (err as Error).message }));
        } else {
          console.error(`\nError: ${(err as Error).message}`);
        }
        process.exit(1);
      }

      // ------------------------------------------------------------------
      // Success output
      // ------------------------------------------------------------------
      const agentverseUrl = `https://agentverse.ai/agents/${result.address}`;
      if (isJson) {
        console.log(
          JSON.stringify({
            address: result.address,
            name: result.name,
            endpoint: options.endpoint,
            agentverseUrl,
          }),
        );
      } else {
        console.log("\n" + "=".repeat(50));
        console.log("CONNECT AGENT DEPLOYED");
        console.log("=".repeat(50));
        console.log(`Agent Address: ${result.address}`);
        console.log(`Name:          ${result.name}`);
        console.log(`Endpoint:      ${options.endpoint}`);
        console.log(`\nView on Agentverse: ${agentverseUrl}`);
        console.log(
          `\nNext — tokenize your connect agent:\n  agentlaunch tokenize --agent ${result.address} --name "${result.name}" --symbol CONN`,
        );
        console.log("\n  MCP: deploy_connect | SDK: sdk.connect.deploy()");
      }
    });
}
