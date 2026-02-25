/**
 * agentlaunch-sdk — Agentverse deployment client
 *
 * Consolidates Agentverse API calls from CLI deploy.ts and MCP agentverse.ts
 * into a single, reusable module.
 *
 * CRITICAL: The Agentverse code upload API requires the `code` field to be a
 * JSON-encoded string containing an array of file objects (double-encoded).
 */

import { resolveApiKey } from './urls.js';
import type {
  AgentverseDeployOptions,
  AgentverseDeployResult,
  AgentverseCreateResponse,
  AgentverseStatusResponse,
} from './types.js';

const AGENTVERSE_API = 'https://agentverse.ai/v1';
const POLL_INTERVAL_MS = 5_000;
const DEFAULT_MAX_POLLS = 12; // 60 seconds total

// ---------------------------------------------------------------------------
// Internal HTTP helpers (Agentverse uses bearer auth, not X-API-Key)
// ---------------------------------------------------------------------------

async function avFetch<T>(
  apiKey: string,
  method: 'GET' | 'POST' | 'PUT',
  path: string,
  body?: unknown,
): Promise<T> {
  const url = `${AGENTVERSE_API}${path}`;
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let detail = '';
    try {
      const errBody = (await response.json()) as { message?: string };
      detail = errBody.message ? `: ${errBody.message}` : '';
    } catch {
      // ignore — body may not be JSON
    }
    throw new Error(
      `${method} ${url} failed with ${response.status} ${response.statusText}${detail}`,
    );
  }

  // Some Agentverse endpoints return 204 No Content
  const text = await response.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Individual operations
// ---------------------------------------------------------------------------

/**
 * Create a new agent record on Agentverse.
 */
export async function createAgent(
  apiKey: string,
  name: string,
): Promise<AgentverseCreateResponse> {
  return avFetch<AgentverseCreateResponse>(apiKey, 'POST', '/hosting/agents', {
    name: name.slice(0, 64),
  });
}

/**
 * Upload Python source code to an Agentverse agent.
 *
 * CRITICAL: Uses double-encoded JSON — the `code` field must be a JSON string
 * containing an array of file objects.
 */
export async function uploadCode(
  apiKey: string,
  agentAddress: string,
  sourceCode: string,
  filename = 'agent.py',
): Promise<{ digest?: string }> {
  const codeArray = [{ language: 'python', name: filename, value: sourceCode }];
  return avFetch<{ digest?: string }>(
    apiKey,
    'PUT',
    `/hosting/agents/${agentAddress}/code`,
    { code: JSON.stringify(codeArray) },
  );
}

/**
 * Set a secret (environment variable) on an Agentverse agent.
 */
export async function setSecret(
  apiKey: string,
  agentAddress: string,
  name: string,
  secret: string,
): Promise<void> {
  await avFetch<unknown>(apiKey, 'POST', '/hosting/secrets', {
    address: agentAddress,
    name,
    secret,
  });
}

/**
 * Start an Agentverse agent.
 */
export async function startAgent(
  apiKey: string,
  agentAddress: string,
): Promise<void> {
  await avFetch<unknown>(
    apiKey,
    'POST',
    `/hosting/agents/${agentAddress}/start`,
    {},
  );
}

/**
 * Get the current status of an Agentverse agent.
 */
export async function getAgentStatus(
  apiKey: string,
  agentAddress: string,
): Promise<AgentverseStatusResponse> {
  return avFetch<AgentverseStatusResponse>(
    apiKey,
    'GET',
    `/hosting/agents/${agentAddress}`,
  );
}

// ---------------------------------------------------------------------------
// Full deploy flow
// ---------------------------------------------------------------------------

/**
 * Deploy an agent to Agentverse in a single call.
 *
 * Steps:
 *   1. Create agent record
 *   2. Upload code (double-encoded JSON)
 *   3. Set secrets (AGENTVERSE_API_KEY + AGENTLAUNCH_API_KEY by default)
 *   4. Start agent
 *   5. Poll for compilation (up to 60s)
 *
 * @param options  Deploy configuration
 * @returns        Agent address, wallet address, and status
 */
export async function deployAgent(
  options: AgentverseDeployOptions,
): Promise<AgentverseDeployResult> {
  const apiKey = options.apiKey ?? resolveApiKey();
  if (!apiKey) {
    throw new Error(
      'Agentverse API key required. Pass apiKey option or set AGENTLAUNCH_API_KEY / AGENTVERSE_API_KEY.',
    );
  }

  const maxPolls = options.maxPolls ?? DEFAULT_MAX_POLLS;

  // Step 1: Create agent
  const created = await createAgent(apiKey, options.agentName);
  const agentAddress = created.address;
  if (!agentAddress) {
    throw new Error('Agentverse did not return an agent address');
  }

  // Step 2: Upload code
  const uploaded = await uploadCode(apiKey, agentAddress, options.sourceCode);

  // Step 3: Set secrets
  const secrets: Record<string, string> = {
    AGENTVERSE_API_KEY: apiKey,
    AGENTLAUNCH_API_KEY: apiKey,
    ...options.secrets,
  };

  const secretErrors: string[] = [];
  for (const [name, secret] of Object.entries(secrets)) {
    try {
      await setSecret(apiKey, agentAddress, name, secret);
    } catch (err) {
      secretErrors.push(`${name}: ${(err as Error).message}`);
    }
  }

  // Step 4: Start agent
  await startAgent(apiKey, agentAddress);

  // Step 5: Poll for compilation
  let status: 'starting' | 'compiled' | 'running' = 'starting';
  let walletAddress: string | undefined;

  for (let i = 0; i < maxPolls; i++) {
    await sleep(POLL_INTERVAL_MS);
    try {
      const agentStatus = await getAgentStatus(apiKey, agentAddress);
      if (agentStatus.running && agentStatus.compiled) {
        status = 'running';
        walletAddress = agentStatus.wallet_address;
        break;
      }
      if (agentStatus.compiled) {
        status = 'compiled';
        walletAddress = agentStatus.wallet_address;
      }
    } catch {
      // Transient poll failure — keep trying
    }
  }

  return {
    agentAddress,
    walletAddress,
    status,
    digest: uploaded.digest,
    secretErrors: secretErrors.length > 0 ? secretErrors : undefined,
  };
}
