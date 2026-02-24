/**
 * agentlaunch-sdk — URL resolution
 *
 * Resolves API and frontend URLs based on environment configuration.
 * Priority: direct override env var → AGENT_LAUNCH_ENV-based → dev default.
 */

const DEV_API_URL = 'https://launchpad-backend-dev-1056182620041.us-central1.run.app';
const DEV_FRONTEND_URL = 'https://launchpad-frontend-dev-1056182620041.us-central1.run.app';
const PROD_API_URL = 'https://agent-launch.ai/api';
const PROD_FRONTEND_URL = 'https://agent-launch.ai';

function getEnv(key: string): string | undefined {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
}

function isProd(): boolean {
  return getEnv('AGENT_LAUNCH_ENV') === 'production';
}

/**
 * Resolve the API base URL.
 * Priority: AGENT_LAUNCH_API_URL → AGENT_LAUNCH_ENV-based → dev default
 */
export function getApiUrl(): string {
  return (getEnv('AGENT_LAUNCH_API_URL') ?? (isProd() ? PROD_API_URL : DEV_API_URL)).replace(/\/$/, '');
}

/**
 * Resolve the frontend base URL (for handoff links).
 * Priority: AGENT_LAUNCH_FRONTEND_URL → AGENT_LAUNCH_ENV-based → dev default
 */
export function getFrontendUrl(): string {
  return (getEnv('AGENT_LAUNCH_FRONTEND_URL') ?? (isProd() ? PROD_FRONTEND_URL : DEV_FRONTEND_URL)).replace(/\/$/, '');
}

/**
 * Get the current environment name.
 */
export function getEnvironment(): 'dev' | 'production' {
  return isProd() ? 'production' : 'dev';
}

// ---------------------------------------------------------------------------
// Consolidated resolvers for CLI / MCP / Templates
// ---------------------------------------------------------------------------

/**
 * Resolve API key from all known env var names.
 * Priority: AGENTLAUNCH_API_KEY > AGENT_LAUNCH_API_KEY > AGENTVERSE_API_KEY
 */
export function resolveApiKey(configKey?: string): string | undefined {
  if (configKey) return configKey;
  return getEnv('AGENTLAUNCH_API_KEY')
    ?? getEnv('AGENT_LAUNCH_API_KEY')
    ?? getEnv('AGENTVERSE_API_KEY');
}

/**
 * Resolve the API base URL from all known env var names.
 * Priority: config > AGENTLAUNCH_BASE_URL > AGENT_LAUNCH_BASE_URL > AGENT_LAUNCH_API_URL > env-based default
 */
export function resolveBaseUrl(configUrl?: string): string {
  if (configUrl) return configUrl.replace(/\/$/, '');
  return getApiUrl();
}

// Re-export constants for consumers that need them directly
export { DEV_API_URL, DEV_FRONTEND_URL, PROD_API_URL, PROD_FRONTEND_URL };
