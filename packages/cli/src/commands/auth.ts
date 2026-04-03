/**
 * CLI: auth command group
 *
 * agentlaunch auth wallet [--private-key <key>] [--save] [--json]
 * agentlaunch auth status [--json]
 *
 * Authenticate with a wallet private key to obtain an Agentverse API key,
 * or check the status of the current API key.
 *
 * Security notes:
 *   - Prefer WALLET_PRIVATE_KEY env var over --private-key flag
 *   - Using --private-key exposes the key in shell history
 *   - Private keys are never logged or displayed
 */

import fs from "node:fs";
import path from "node:path";
import { Command } from "commander";
import {
  authenticateWithWallet,
  deriveCosmosAddress,
  type WalletAuthResult,
} from "agentlaunch-sdk";
import { writeConfig, maskKey, tryGetApiKey } from "../config.js";

/**
 * Write or update environment variables in a .env file.
 * Creates the file if it doesn't exist.
 * Updates existing keys if present, appends if not.
 */
function writeKeysToEnv(keys: Record<string, string>): void {
  const envPath = path.join(process.cwd(), ".env");
  let content = "";

  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, "utf8");
  }

  const lines = content.split("\n");
  const keysToAdd = { ...keys };

  // Update existing keys
  const updatedLines = lines.map((line) => {
    const trimmed = line.trim();
    for (const [key, value] of Object.entries(keysToAdd)) {
      if (trimmed.startsWith(`${key}=`) || trimmed.startsWith(`${key} =`)) {
        delete keysToAdd[key]; // Mark as found
        return `${key}=${value}`;
      }
    }
    return line;
  });

  // Add any keys that weren't found
  for (const [key, value] of Object.entries(keysToAdd)) {
    if (updatedLines.length > 0 && updatedLines[updatedLines.length - 1] !== "") {
      updatedLines.push("");
    }
    updatedLines.push(`${key}=${value}`);
  }

  // Ensure file ends with newline
  if (updatedLines[updatedLines.length - 1] !== "") {
    updatedLines.push("");
  }

  fs.writeFileSync(envPath, updatedLines.join("\n"), { mode: 0o600 });
}

/**
 * Write or update the API key in a .env file.
 * Creates the file if it doesn't exist.
 */
function writeApiKeyToEnv(apiKey: string): void {
  writeKeysToEnv({ AGENTVERSE_API_KEY: apiKey });
}

/**
 * Verify the current API key is valid by making a test request.
 * Returns the wallet address associated with the key, or throws.
 */
async function verifyApiKey(apiKey: string): Promise<{ valid: boolean; walletAddress?: string }> {
  // Try to list agents — this requires a valid API key
  const baseUrl = process.env.AGENTVERSE_API_URL || "https://agentverse.ai/v1";
  const response = await fetch(`${baseUrl}/hosting/agents`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (response.ok) {
    return { valid: true };
  }

  if (response.status === 401 || response.status === 403) {
    return { valid: false };
  }

  // Other errors — assume key is valid but there's a different issue
  return { valid: true };
}

export function registerAuthCommand(program: Command): void {
  const auth = program
    .command("auth")
    .description("Wallet authentication: get API key from private key, check status");

  // --- auth wallet ---
  auth
    .command("wallet")
    .description("Authenticate with a wallet private key to get an Agentverse API key")
    .option("--private-key <key>", "Hex-encoded private key (prefer WALLET_PRIVATE_KEY env var)")
    .option("--generate", "Generate a new wallet (saves both WALLET_PRIVATE_KEY and API key)")
    .option("--save", "Save the API key to .env file in current directory")
    .option("--json", "Output raw JSON")
    .action(async (options: { privateKey?: string; generate?: boolean; save?: boolean; json?: boolean }) => {
      const isJson = options.json === true;
      let privateKey = options.privateKey || process.env.WALLET_PRIVATE_KEY;
      let generatedWallet = false;
      let evmAddress: string | undefined;

      // Generate a new wallet if --generate flag is used
      if (options.generate) {
        if (!isJson) {
          console.log("  Generating new wallet...");
        }
        const ethers = await import("ethers");
        const wallet = ethers.Wallet.createRandom();
        privateKey = wallet.privateKey;
        evmAddress = wallet.address;
        generatedWallet = true;

        if (!isJson) {
          console.log(`  EVM Address:  ${evmAddress}`);
        }
      }

      if (!privateKey) {
        const msg =
          "Private key required.\n" +
          "Options:\n" +
          "  1. Use --generate to create a new wallet automatically\n" +
          "  2. Set WALLET_PRIVATE_KEY in your environment or .env file\n" +
          "  3. Use --private-key flag (not recommended — visible in shell history)";

        if (isJson) {
          console.log(JSON.stringify({ error: msg }));
        } else {
          console.error(`Error: ${msg}`);
        }
        process.exit(1);
      }

      // Security warning for --private-key flag
      if (options.privateKey && !isJson) {
        console.log("\n  WARNING: Using --private-key flag exposes your key in shell history.");
        console.log("  Consider using WALLET_PRIVATE_KEY environment variable instead.\n");
      }

      if (!isJson) {
        console.log("  Authenticating with wallet...");
      }

      let result: WalletAuthResult;
      try {
        // First, show the address being used
        if (!isJson) {
          try {
            const cosmosAddress = await deriveCosmosAddress(privateKey);
            console.log(`  Cosmos Address: ${cosmosAddress}`);
          } catch {
            // If address derivation fails, the auth will fail too
          }
          console.log("  Requesting challenge...");
          console.log("  Signing challenge...");
          console.log("  Exchanging for API key...");
        }

        result = await authenticateWithWallet(privateKey);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);

        if (isJson) {
          console.log(JSON.stringify({ error: msg }));
        } else {
          console.error(`\nError: ${msg}`);

          // Provide helpful hints for common errors
          if (msg.includes("@cosmjs/crypto")) {
            console.error("\nTo use wallet authentication, install the required dependency:");
            console.error("  npm install @cosmjs/crypto");
          }
          if (msg.includes("bech32")) {
            console.error("\nTo use wallet authentication, install the required dependency:");
            console.error("  npm install bech32");
          }
        }
        process.exit(1);
      }

      // Save to config file (always, for CLI use)
      writeConfig({ apiKey: result.apiKey });

      // Save to .env: always if generated, optionally otherwise
      const shouldSaveToEnv = generatedWallet || options.save;
      if (shouldSaveToEnv) {
        try {
          const keysToSave: Record<string, string> = {
            AGENTVERSE_API_KEY: result.apiKey,
          };
          // Save wallet private key if we generated it
          if (generatedWallet && privateKey) {
            keysToSave.WALLET_PRIVATE_KEY = privateKey;
          }
          writeKeysToEnv(keysToSave);
          if (!isJson) {
            console.log(`  Saved to .env file`);
          }
        } catch (err) {
          if (!isJson) {
            console.error(`  Warning: Could not save to .env: ${(err as Error).message}`);
          }
        }
      }

      const expiresDate = new Date(result.expiresAt);
      const daysUntilExpiry = Math.floor((result.expiresAt - Date.now()) / (1000 * 60 * 60 * 24));

      if (isJson) {
        const jsonResult: Record<string, unknown> = {
          success: true,
          apiKey: result.apiKey,
          cosmosAddress: result.cosmosAddress,
          expiresAt: result.expiresAt,
          expiresAtIso: expiresDate.toISOString(),
          savedToConfig: true,
          savedToEnv: shouldSaveToEnv,
        };
        if (generatedWallet) {
          jsonResult.generated = true;
          jsonResult.evmAddress = evmAddress;
          jsonResult.walletPrivateKey = privateKey;
        }
        console.log(JSON.stringify(jsonResult));
      } else {
        console.log("\n" + "=".repeat(50));
        console.log(generatedWallet ? "WALLET CREATED & AUTHENTICATED" : "AUTHENTICATION SUCCESSFUL");
        console.log("=".repeat(50));
        if (generatedWallet && evmAddress) {
          console.log(`EVM Address:    ${evmAddress}`);
        }
        console.log(`Cosmos Address: ${result.cosmosAddress}`);
        console.log(`API Key:        ${maskKey(result.apiKey)}`);
        console.log(`Expires:        ${expiresDate.toLocaleDateString()} (${daysUntilExpiry} days)`);
        console.log(`Saved to:       ~/.agentlaunch/config.json`);
        if (shouldSaveToEnv) {
          console.log(`                .env (current directory)`);
        }
        console.log("=".repeat(50));
        if (generatedWallet) {
          console.log("\nYour wallet and API key are saved. You're ready to build!");
          console.log("\n" + "-".repeat(50));
          console.log("IMPORTANT - BACK UP YOUR .env FILE:");
          console.log("  - Your .env contains your wallet private key");
          console.log("  - This wallet can hold real funds (FET, tokens)");
          console.log("  - Back it up somewhere safe (password manager, secure drive)");
          console.log("  - Never commit .env to git (add to .gitignore)");
          console.log("  - Never share your .env file with anyone");
          console.log("-".repeat(50));
          console.log("\nNEXT: npx agentlaunch my-first-agent");
        } else {
          console.log("\nYou can now use all agentlaunch commands.");
          if (!options.save) {
            console.log("\nTip: Use --save to also write the key to your .env file.");
          }
        }
        console.log();
      }
    });

  // --- auth status ---
  auth
    .command("status")
    .description("Check if the current API key is valid")
    .option("--json", "Output raw JSON")
    .action(async (options: { json?: boolean }) => {
      const isJson = options.json === true;

      const apiKey = tryGetApiKey();

      if (!apiKey) {
        if (isJson) {
          console.log(
            JSON.stringify({
              configured: false,
              valid: false,
              error: "No API key configured",
            }),
          );
        } else {
          console.log("\n  API Key Status: NOT CONFIGURED");
          console.log("\n  To authenticate:");
          console.log("    agentlaunch auth wallet              # Uses WALLET_PRIVATE_KEY from env");
          console.log("    agentlaunch config set-key <key>     # Set key directly");
          console.log();
        }
        process.exit(1);
      }

      if (!isJson) {
        console.log("  Checking API key...");
      }

      try {
        const { valid } = await verifyApiKey(apiKey);

        if (isJson) {
          console.log(
            JSON.stringify({
              configured: true,
              valid,
              apiKey: maskKey(apiKey),
            }),
          );
        } else {
          console.log("\n" + "-".repeat(40));
          console.log("API KEY STATUS");
          console.log("-".repeat(40));
          console.log(`  Configured: Yes`);
          console.log(`  Valid:      ${valid ? "Yes" : "No (expired or invalid)"}`);
          console.log(`  Key:        ${maskKey(apiKey)}`);
          console.log("-".repeat(40));

          if (!valid) {
            console.log("\n  Your API key is expired or invalid.");
            console.log("  To re-authenticate:");
            console.log("    agentlaunch auth wallet --save");
          }
          console.log();
        }

        if (!valid) {
          process.exit(1);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);

        if (isJson) {
          console.log(
            JSON.stringify({
              configured: true,
              valid: false,
              error: `Could not verify: ${msg}`,
              apiKey: maskKey(apiKey),
            }),
          );
        } else {
          console.error(`\nError checking API key: ${msg}`);
          console.log(`  Key: ${maskKey(apiKey)}`);
        }
        process.exit(1);
      }
    });
}
