/**
 * connect-update command
 *
 * agentlaunch connect-update <agentAddress> [options]
 *
 * Updates the HTTP connect configuration for a deployed Agentverse agent.
 * Agents registered as HTTP connect agents forward inbound messages to an external
 * endpoint, optionally authenticating with a custom header/secret pair.
 *
 * Options:
 *   --endpoint <url>        HTTPS URL the agent connects requests to
 *   --auth-header <name>    Name of the auth header sent to the endpoint
 *   --auth-secret <value>   Value of the auth header (treated as a secret)
 *   --timeout <ms>          Request timeout in milliseconds (default: 30000)
 *   --json                  Output only JSON (machine-readable)
 *
 * Example:
 *   agentlaunch connect-update agent1qxyz... \
 *     --endpoint https://my-service.example.com/webhook \
 *     --auth-header X-Webhook-Secret \
 *     --auth-secret mysecret123 \
 *     --timeout 15000
 *
 */

import { Command } from "commander";
import { updateConnection, type ConnectConfig } from "agentlaunch-sdk";
import { requireApiKey } from "../config.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ConnectUpdateOptions {
  endpoint?: string;
  authHeader?: string;
  authSecret?: string;
  timeout?: string;
  json?: boolean;
}

/**
 * Shape of the request body built from CLI options before calling the SDK.
 */
export interface ConnectUpdateInput {
  agentAddress: string;
  endpoint?: string;
  authHeader?: string;
  authSecret?: string;
  timeoutMs?: number;
}

/**
 * Shape of the data surfaced in the success output after the SDK call.
 */
export interface ConnectUpdateResult {
  agentAddress: string;
  endpoint?: string;
  authHeader?: string;
  timeoutMs?: number;
  updatedAt?: string;
}

// ---------------------------------------------------------------------------
// Command registration
// ---------------------------------------------------------------------------

export function registerConnectUpdateCommand(program: Command): void {
  program
    .command("connect-update <agentAddress>")
    .description("Update the HTTP connect configuration for an Agentverse agent")
    .option(
      "--endpoint <url>",
      "HTTPS URL the agent connects inbound messages to",
    )
    .option(
      "--auth-header <name>",
      "Name of the authentication header forwarded to the endpoint",
    )
    .option(
      "--auth-secret <value>",
      "Value of the authentication header (kept secret, never echoed)",
    )
    .option(
      "--timeout <ms>",
      "Connect request timeout in milliseconds (default: 30000)",
      "30000",
    )
    .option("--json", "Output only JSON (machine-readable)")
    .action(async (agentAddress: string, options: ConnectUpdateOptions) => {
      const isJson = options.json === true;

      // --- Retrieve API key early so we can surface a helpful error ---
      let apiKey: string;
      try {
        apiKey = requireApiKey();
      } catch (err) {
        if (isJson) {
          console.log(JSON.stringify({ error: (err as Error).message }));
        } else {
          console.error((err as Error).message);
        }
        process.exit(1);
      }

      // --- Validate agent address ---
      if (!agentAddress || !agentAddress.startsWith("agent1q")) {
        const msg =
          "Agent address must be a valid Agentverse address starting with 'agent1q'";
        if (isJson) {
          console.log(JSON.stringify({ error: msg }));
        } else {
          console.error(`Error: ${msg}`);
        }
        process.exit(1);
      }

      // --- Validate --endpoint if provided ---
      if (options.endpoint !== undefined) {
        try {
          const parsed = new URL(options.endpoint);
          if (parsed.protocol !== "https:") {
            const msg = "--endpoint URL must use HTTPS protocol";
            if (isJson) {
              console.log(JSON.stringify({ error: msg }));
            } else {
              console.error(`Error: ${msg}`);
            }
            process.exit(1);
          }
        } catch {
          const msg = "--endpoint must be a valid HTTPS URL";
          if (isJson) {
            console.log(JSON.stringify({ error: msg }));
          } else {
            console.error(`Error: ${msg}`);
          }
          process.exit(1);
        }
      }

      // --- Validate --timeout ---
      const timeoutMs = parseInt(options.timeout ?? "30000", 10);
      if (isNaN(timeoutMs) || timeoutMs < 1000 || timeoutMs > 300000) {
        const msg = "--timeout must be a number between 1000 and 300000 (ms)";
        if (isJson) {
          console.log(JSON.stringify({ error: msg }));
        } else {
          console.error(`Error: ${msg}`);
        }
        process.exit(1);
      }

      // --- Validate --auth-secret requires --auth-header ---
      if (options.authSecret && !options.authHeader) {
        const msg = "--auth-secret requires --auth-header to also be provided";
        if (isJson) {
          console.log(JSON.stringify({ error: msg }));
        } else {
          console.error(`Error: ${msg}`);
        }
        process.exit(1);
      }

      // --- Ensure at least one field is being updated ---
      if (
        options.endpoint === undefined &&
        options.authHeader === undefined &&
        options.authSecret === undefined &&
        options.timeout === "30000"
      ) {
        const msg =
          "No update fields provided. Use --endpoint, --auth-header, --auth-secret, or --timeout";
        if (isJson) {
          console.log(JSON.stringify({ error: msg }));
        } else {
          console.error(`Error: ${msg}`);
          console.error(
            "Run 'agentlaunch connect-update --help' to see all options.",
          );
        }
        process.exit(1);
      }

      // --- Build the update payload ---
      const input: ConnectUpdateInput = { agentAddress };
      if (options.endpoint !== undefined) input.endpoint = options.endpoint;
      if (options.authHeader !== undefined)
        input.authHeader = options.authHeader;
      if (options.authSecret !== undefined)
        input.authSecret = options.authSecret;
      input.timeoutMs = timeoutMs;

      if (!isJson) {
        console.log(`Updating connect config for: ${agentAddress}`);
        if (input.endpoint) console.log(`  Endpoint:    ${input.endpoint}`);
        if (input.authHeader)
          console.log(`  Auth header: ${input.authHeader}`);
        if (input.authSecret) console.log(`  Auth secret: [provided]`);
        console.log(`  Timeout:     ${timeoutMs} ms`);
        console.log("");
      }

      // --- Call the SDK ---
      let result: ConnectUpdateResult;
      try {
        // Build the Partial<ProxyConfig> patch from CLI input.
        const patch: Partial<ConnectConfig> = {};
        if (input.endpoint !== undefined) patch.endpoint = input.endpoint;
        if (input.authHeader !== undefined || input.authSecret !== undefined) {
          patch.auth = {
            header: input.authHeader ?? "",
            secret: input.authSecret ?? "",
          };
        }
        patch.timeout = input.timeoutMs;

        await updateConnection(agentAddress, patch, apiKey);

        result = {
          agentAddress,
          endpoint: input.endpoint,
          authHeader: input.authHeader,
          timeoutMs: input.timeoutMs,
          updatedAt: new Date().toISOString(),
        };
      } catch (err) {
        if (isJson) {
          console.log(JSON.stringify({ error: (err as Error).message }));
        } else {
          console.error(`Error: ${(err as Error).message}`);
        }
        process.exit(1);
      }

      // --- Output success ---
      if (isJson) {
        console.log(
          JSON.stringify({
            agentAddress: result.agentAddress,
            endpoint: result.endpoint,
            authHeader: result.authHeader,
            timeoutMs: result.timeoutMs,
            updatedAt: result.updatedAt,
          }),
        );
        return;
      }

      console.log("=".repeat(50));
      console.log("CONNECT CONFIG UPDATED");
      console.log("=".repeat(50));
      console.log(`Agent:    ${result.agentAddress}`);
      if (result.endpoint) console.log(`Endpoint: ${result.endpoint}`);
      if (result.authHeader)
        console.log(`Auth header: ${result.authHeader}`);
      if (result.timeoutMs !== undefined)
        console.log(`Timeout:  ${result.timeoutMs} ms`);
      if (result.updatedAt) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const updatedDate = new Date(result.updatedAt!);
        console.log(`Updated:  ${updatedDate.toUTCString()}`);
      }
      console.log("=".repeat(50));
      console.log(
        "\n  MCP: update_connect_config | SDK: client.connect.update()",
      );
    });
}
