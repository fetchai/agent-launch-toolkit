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
const PROD_API_URL = 'https://agent-launch.ai/api';

function resolveDefaultUrl(): string {
  if (process.env.AGENT_LAUNCH_API_URL) return process.env.AGENT_LAUNCH_API_URL.replace(/\/$/, '');
  return process.env.AGENT_LAUNCH_ENV === 'production' ? PROD_API_URL : DEV_API_URL;
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
 * Return the active API key. Throws a descriptive error if not set.
 */
export function requireApiKey(): string {
  const cfg = readConfig();
  if (!cfg.apiKey) {
    throw new Error(
      "API key not configured.\n" +
        "Run: agentlaunch config set-key <apiKey>\n" +
        "Get a key at: https://agentverse.ai/profile/api-keys",
    );
  }
  return cfg.apiKey;
}

/**
 * Mask an API key for display: show first 8 chars, then asterisks.
 * Example: "eyJhbGci..." -> "eyJhbGci..."[masked]
 */
export function maskKey(key: string): string {
  if (key.length <= 8) return "****";
  return `${key.slice(0, 8)}...${" (masked)"}`;
}
