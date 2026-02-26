/**
 * agentlaunch-sdk — Agentverse Storage operations
 *
 * EXT-01: Read and write agent storage data via the Agentverse hosting API.
 *
 * These functions call the Agentverse API directly (not the AgentLaunch API),
 * using `Authorization: Bearer <key>` authentication.
 *
 * Storage API:
 *   GET    /v1/hosting/agents/{address}/storage          List all keys
 *   GET    /v1/hosting/agents/{address}/storage/{key}    Get a single value
 *   PUT    /v1/hosting/agents/{address}/storage/{key}    Set a value
 *   DELETE /v1/hosting/agents/{address}/storage/{key}    Delete a key
 */

import { resolveApiKey } from './urls.js';

const AGENTVERSE_API = 'https://agentverse.ai/v1';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single key-value pair stored in Agentverse agent storage. */
export interface StorageEntry {
  key: string;
  value: string;
}

/** Response envelope from the Agentverse storage list endpoint. */
export interface StorageListResponse {
  items: StorageEntry[];
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Resolve the Agentverse API key from the explicit parameter or environment.
 * Throws if no key is available.
 */
function resolveKey(apiKey?: string): string {
  const key = apiKey ?? resolveApiKey();
  if (!key) {
    throw new Error(
      'Agentverse API key required. Pass apiKey or set AGENTVERSE_API_KEY in your environment.',
    );
  }
  return key;
}

/** Build Authorization headers for Agentverse requests. */
function getAgentverseHeaders(apiKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Generic fetch wrapper for Agentverse storage endpoints.
 *
 * Handles error extraction and empty-body (204) responses.
 */
async function avStorageFetch<T>(
  apiKey: string,
  method: 'GET' | 'PUT' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<T> {
  const url = `${AGENTVERSE_API}${path}`;
  const response = await fetch(url, {
    method,
    headers: getAgentverseHeaders(apiKey),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let detail = '';
    try {
      const errBody = (await response.json()) as { message?: string };
      detail = errBody.message ? `: ${errBody.message}` : '';
    } catch {
      // Body may not be JSON — ignore
    }
    throw new Error(
      `${method} ${url} failed with ${response.status} ${response.statusText}${detail}`,
    );
  }

  // Some endpoints return 204 No Content
  const text = await response.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * List all storage keys for an Agentverse agent.
 *
 * @param agentAddress  Agent address (agent1q...)
 * @param apiKey        Agentverse API key (falls back to env vars)
 * @returns Array of key-value entries
 *
 * @example
 * ```ts
 * import { listStorage } from 'agentlaunch-sdk';
 *
 * const entries = await listStorage('agent1q...');
 * for (const entry of entries) {
 *   console.log(`${entry.key} = ${entry.value}`);
 * }
 * ```
 */
export async function listStorage(
  agentAddress: string,
  apiKey?: string,
): Promise<StorageEntry[]> {
  const key = resolveKey(apiKey);
  const response = await avStorageFetch<StorageListResponse | StorageEntry[]>(
    key,
    'GET',
    `/hosting/agents/${encodeURIComponent(agentAddress)}/storage`,
  );

  // Handle both envelope and raw array response shapes
  if (Array.isArray(response)) return response;
  return (response as StorageListResponse).items ?? [];
}

/**
 * Get a single storage value by key.
 *
 * Returns `null` if the key does not exist (404).
 *
 * @param agentAddress  Agent address (agent1q...)
 * @param key           Storage key name
 * @param apiKey        Agentverse API key (falls back to env vars)
 *
 * @example
 * ```ts
 * import { getStorage } from 'agentlaunch-sdk';
 *
 * const value = await getStorage('agent1q...', 'revenue_summary');
 * if (value) {
 *   console.log(JSON.parse(value));
 * }
 * ```
 */
export async function getStorage(
  agentAddress: string,
  key: string,
  apiKey?: string,
): Promise<string | null> {
  const resolvedKey = resolveKey(apiKey);
  const url = `${AGENTVERSE_API}/hosting/agents/${encodeURIComponent(agentAddress)}/storage/${encodeURIComponent(key)}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getAgentverseHeaders(resolvedKey),
  });

  // 404 means the key does not exist — return null
  if (response.status === 404) return null;

  if (!response.ok) {
    let detail = '';
    try {
      const errBody = (await response.json()) as { message?: string };
      detail = errBody.message ? `: ${errBody.message}` : '';
    } catch {
      // ignore
    }
    throw new Error(
      `GET ${url} failed with ${response.status} ${response.statusText}${detail}`,
    );
  }

  const text = await response.text();
  if (!text) return null;

  // The API may return the value wrapped in a JSON envelope or as raw text.
  try {
    const parsed = JSON.parse(text) as { value?: string } | string;
    if (typeof parsed === 'string') return parsed;
    if (typeof parsed === 'object' && parsed !== null && 'value' in parsed) {
      return (parsed as { value: string }).value;
    }
    // Return the raw text if parsing didn't yield a known shape
    return text;
  } catch {
    // Not JSON — return as-is
    return text;
  }
}

/**
 * Set a storage value by key.
 *
 * Creates the key if it does not exist, overwrites if it does.
 *
 * @param agentAddress  Agent address (agent1q...)
 * @param key           Storage key name
 * @param value         Value to store (string)
 * @param apiKey        Agentverse API key (falls back to env vars)
 *
 * @example
 * ```ts
 * import { putStorage } from 'agentlaunch-sdk';
 *
 * await putStorage('agent1q...', 'config', JSON.stringify({ mode: 'boost' }));
 * ```
 */
export async function putStorage(
  agentAddress: string,
  key: string,
  value: string,
  apiKey?: string,
): Promise<void> {
  const resolvedKey = resolveKey(apiKey);
  await avStorageFetch<unknown>(
    resolvedKey,
    'PUT',
    `/hosting/agents/${encodeURIComponent(agentAddress)}/storage/${encodeURIComponent(key)}`,
    { value },
  );
}

/**
 * Delete a storage key.
 *
 * No-op if the key does not exist.
 *
 * @param agentAddress  Agent address (agent1q...)
 * @param key           Storage key name to delete
 * @param apiKey        Agentverse API key (falls back to env vars)
 *
 * @example
 * ```ts
 * import { deleteStorage } from 'agentlaunch-sdk';
 *
 * await deleteStorage('agent1q...', 'old_config');
 * ```
 */
export async function deleteStorage(
  agentAddress: string,
  key: string,
  apiKey?: string,
): Promise<void> {
  const resolvedKey = resolveKey(apiKey);
  await avStorageFetch<unknown>(
    resolvedKey,
    'DELETE',
    `/hosting/agents/${encodeURIComponent(agentAddress)}/storage/${encodeURIComponent(key)}`,
  );
}
