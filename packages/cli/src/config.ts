/**
 * CLI-001: Config management
 *
 * Stores user config in ~/.agentlaunch/config.json
 * Fields: apiKey, baseUrl
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export interface CliConfig {
  apiKey?: string;
  baseUrl?: string;
}

const CONFIG_DIR = path.join(os.homedir(), ".agentlaunch");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

const DEV_API_URL = 'https://launchpad-backend-dev-1056182620041.us-central1.run.app';
const DEV_FRONTEND_URL = 'https://launchpad-frontend-dev-1056182620041.us-central1.run.app';
const PROD_API_URL = 'https://agent-launch.ai/api';
const PROD_FRONTEND_URL = 'https://agent-launch.ai';

function resolveDefaultUrl(): string {
  if (process.env.AGENT_LAUNCH_API_URL) return process.env.AGENT_LAUNCH_API_URL.replace(/\/$/, '');
  return process.env.AGENT_LAUNCH_ENV === 'dev' ? DEV_API_URL : PROD_API_URL;
}

/** Resolve the frontend URL from env or defaults. */
export function resolveFrontendUrl(): string {
  if (process.env.AGENT_LAUNCH_FRONTEND_URL) return process.env.AGENT_LAUNCH_FRONTEND_URL.replace(/\/$/, '');
  return process.env.AGENT_LAUNCH_ENV === 'dev' ? DEV_FRONTEND_URL : PROD_FRONTEND_URL;
}

/** Get the current environment name. */
export function getEnvironment(): string {
  return process.env.AGENT_LAUNCH_ENV === 'dev' ? 'dev' : 'production';
}

/** Default API base URL. Override with `agentlaunch config set-url`. */
export const DEFAULT_BASE_URL = resolveDefaultUrl();

/**
 * Read the config file. Returns an empty object if the file does not exist
 * or cannot be parsed.
 */
export function readConfig(): CliConfig {
  try {
    const raw = fs.readFileSync(CONFIG_FILE, "utf8");
    return JSON.parse(raw) as CliConfig;
  } catch {
    return {};
  }
}

/**
 * Write a partial config update. Merges with existing values.
 */
export function writeConfig(partial: Partial<CliConfig>): void {
  const existing = readConfig();
  const updated = { ...existing, ...partial };

  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
  }

  fs.writeFileSync(CONFIG_FILE, JSON.stringify(updated, null, 2) + "\n", {
    mode: 0o600, // owner read/write only — contains API key
  });
}

/**
 * Return the active base URL (config override or default).
 */
export function getBaseUrl(): string {
  const cfg = readConfig();
  return cfg.baseUrl ?? DEFAULT_BASE_URL;
}

/**
 * Load .env file from current directory if it exists.
 * This is a simple loader that doesn't require dotenv package.
 */
function loadEnvFile(): void {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;

  try {
    const content = fs.readFileSync(envPath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      let value = trimmed.slice(eqIndex + 1).trim();
      // Remove surrounding quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      // Only set if not already in env (don't override explicit env vars)
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // Ignore errors reading .env
  }
}

/**
 * Return the active API key. Checks in order:
 * 1. ~/.agentlaunch/config.json (set via `agentlaunch config set-key`)
 * 2. AGENTVERSE_API_KEY environment variable
 * 3. .env file in current directory
 *
 * Throws a descriptive error if not found in any location.
 */
export function requireApiKey(): string {
  // First check config file
  const cfg = readConfig();
  if (cfg.apiKey) {
    return cfg.apiKey;
  }

  // Load .env file if present (populates process.env)
  loadEnvFile();

  // Check environment variable
  const envKey = process.env.AGENTVERSE_API_KEY;
  if (envKey) {
    return envKey;
  }

  throw new Error(
    "API key not configured.\n" +
      "Options:\n" +
      "  1. Run: agentlaunch config set-key <apiKey>\n" +
      "  2. Set AGENTVERSE_API_KEY in your environment\n" +
      "  3. Add AGENTVERSE_API_KEY=... to .env in current directory\n" +
      "Get a key at: https://agentverse.ai/profile/api-keys",
  );
}

/**
 * Mask an API key for display: show first 8 chars, then asterisks.
 * Example: "eyJhbGci..." -> "eyJhbGci..."[masked]
 */
export function maskKey(key: string): string {
  if (key.length <= 8) return "****";
  return `${key.slice(0, 8)}...${" (masked)"}`;
}
