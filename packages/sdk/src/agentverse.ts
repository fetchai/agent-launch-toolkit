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
  AgentMetadata,
  AgentverseDeployOptions,
  AgentverseDeployResult,
  AgentverseCreateResponse,
  AgentverseStatusResponse,
  AgentverseUpdateOptions,
  AgentverseUpdateResult,
  OptimizationCheckItem,
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
 * Optionally sets readme, short_description, and avatar_url at creation time.
 */
export async function createAgent(
  apiKey: string,
  name: string,
  metadata?: AgentMetadata,
): Promise<AgentverseCreateResponse> {
  const body: Record<string, unknown> = { name: name.slice(0, 64) };
  if (metadata?.readme) body.readme = metadata.readme;
  if (metadata?.short_description) body.short_description = metadata.short_description.slice(0, 200);
  if (metadata?.avatar_url) body.avatar_url = metadata.avatar_url;
  return avFetch<AgentverseCreateResponse>(apiKey, 'POST', '/hosting/agents', body);
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
// Update metadata on an existing agent
// ---------------------------------------------------------------------------

/**
 * Update metadata (README, short_description, avatar_url) on an existing Agentverse agent.
 */
export async function updateAgent(
  options: AgentverseUpdateOptions,
): Promise<AgentverseUpdateResult> {
  const apiKey = options.apiKey ?? resolveApiKey();
  if (!apiKey) {
    throw new Error(
      'Agentverse API key required. Pass apiKey option or set AGENTLAUNCH_API_KEY / AGENTVERSE_API_KEY.',
    );
  }

  const body: Record<string, unknown> = {};
  const updatedFields: string[] = [];

  if (options.metadata.readme) {
    body.readme = options.metadata.readme;
    updatedFields.push('readme');
  }
  if (options.metadata.short_description) {
    body.short_description = options.metadata.short_description.slice(0, 200);
    updatedFields.push('short_description');
  }
  if (options.metadata.avatar_url) {
    body.avatar_url = options.metadata.avatar_url;
    updatedFields.push('avatar_url');
  }

  if (updatedFields.length > 0) {
    await avFetch<unknown>(
      apiKey,
      'PUT',
      `/hosting/agents/${options.agentAddress}`,
      body,
    );
  }

  const checklist = buildOptimizationChecklist({
    agentAddress: options.agentAddress,
    hasReadme: !!options.metadata.readme,
    hasDescription: !!options.metadata.short_description,
    hasAvatar: !!options.metadata.avatar_url,
    isRunning: true, // assume running since it's already deployed
  });

  return { success: true, updatedFields, optimization: checklist };
}

// ---------------------------------------------------------------------------
// Optimization checklist builder
// ---------------------------------------------------------------------------

/**
 * Build a 7-item optimization checklist for an agent's Agentverse ranking factors.
 */
export function buildOptimizationChecklist(opts: {
  agentAddress: string;
  hasReadme?: boolean;
  hasDescription?: boolean;
  hasAvatar?: boolean;
  isRunning?: boolean;
}): OptimizationCheckItem[] {
  const detailUrl = `https://agentverse.ai/agents/details/${opts.agentAddress}`;
  return [
    {
      factor: 'Chat Protocol',
      done: true, // all our templates include chat protocol
    },
    {
      factor: 'README',
      done: !!opts.hasReadme,
      hint: opts.hasReadme ? undefined : `Set via: agentlaunch optimize ${opts.agentAddress} --readme README.md`,
    },
    {
      factor: 'Short Description',
      done: !!opts.hasDescription,
      hint: opts.hasDescription ? undefined : `Set via: agentlaunch optimize ${opts.agentAddress} --description "..."`,
    },
    {
      factor: 'Avatar',
      done: !!opts.hasAvatar,
      manual_required: !opts.hasAvatar,
      hint: opts.hasAvatar ? undefined : `Upload in Agentverse dashboard:\n        ${detailUrl}`,
    },
    {
      factor: 'Active Status',
      done: !!opts.isRunning,
    },
    {
      factor: 'Handle',
      done: false,
      manual_required: true,
      hint: `Set a custom @handle (max 20 chars):\n        ${detailUrl}`,
    },
    {
      factor: '3+ Interactions',
      done: false,
      manual_required: true,
      hint: `Run the Response QA Agent 3+ times:\n        ${detailUrl}`,
    },
  ];
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

  // Step 1: Create agent (with metadata if provided)
  const created = await createAgent(apiKey, options.agentName, options.metadata);
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

  // Build optimization checklist
  const optimization = buildOptimizationChecklist({
    agentAddress,
    hasReadme: !!options.metadata?.readme,
    hasDescription: !!options.metadata?.short_description,
    hasAvatar: !!options.metadata?.avatar_url,
    isRunning: status === 'running',
  });

  return {
    agentAddress,
    walletAddress,
    status,
    digest: uploaded.digest,
    secretErrors: secretErrors.length > 0 ? secretErrors : undefined,
    optimization,
  };
}
