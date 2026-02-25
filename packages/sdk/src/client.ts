/**
 * agentlaunch-sdk — HTTP client
 *
 * SDK-001: Core fetch wrapper that injects auth headers and provides typed
 * request helpers used by all other SDK modules.
 *
 * SDK-007: Exponential backoff retry on HTTP 429 (rate limit) responses.
 * Retries up to `maxRetries` times (default: 3) with delays of 1s, 2s, 4s, …
 *
 * No external runtime dependencies — uses the global fetch() available in
 * Node.js ≥ 18, Deno, and modern browsers.
 */

import { AgentLaunchConfig, AgentLaunchError } from './types.js';
import { getApiUrl } from './urls.js';

const DEFAULT_MAX_RETRIES = 3;

/**
 * Resolve base URL from environment variables or config.
 * Checks: AGENTLAUNCH_BASE_URL, AGENT_LAUNCH_BASE_URL (legacy)
 */
function resolveBaseUrl(configUrl?: string): string {
  if (configUrl) return configUrl;
  if (typeof process !== 'undefined') {
    if (process.env?.AGENTLAUNCH_BASE_URL) return process.env.AGENTLAUNCH_BASE_URL;
    if (process.env?.AGENT_LAUNCH_BASE_URL) return process.env.AGENT_LAUNCH_BASE_URL;
  }
  return getApiUrl();
}

/**
 * Resolve API key from environment variables or config.
 * Priority: config > AGENTLAUNCH_API_KEY > AGENT_LAUNCH_API_KEY > AGENTVERSE_API_KEY
 */
function resolveApiKey(configKey?: string): string | undefined {
  if (configKey) return configKey;
  if (typeof process !== 'undefined') {
    if (process.env?.AGENTLAUNCH_API_KEY) return process.env.AGENTLAUNCH_API_KEY;
    if (process.env?.AGENT_LAUNCH_API_KEY) return process.env.AGENT_LAUNCH_API_KEY;
    if (process.env?.AGENTVERSE_API_KEY) return process.env.AGENTVERSE_API_KEY;
  }
  return undefined;
}

/**
 * Parses the response body and extracts a human-readable error message
 * from the server's JSON error payload (if present).
 */
async function extractErrorMessage(response: Response): Promise<string | undefined> {
  try {
    const body = (await response.json()) as { message?: string; error?: string };
    return body.message ?? body.error ?? undefined;
  } catch {
    // Body is not JSON — ignore
    return undefined;
  }
}

/**
 * Sleep for `ms` milliseconds. Used between retry attempts.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * AgentLaunchClient
 *
 * The central HTTP client for the AgentLaunch SDK.  Instantiate once and
 * pass to the token, market, handoff, and agent helpers — or use the
 * named module functions which create a default client from environment
 * variables automatically.
 *
 * Automatically retries requests that receive HTTP 429 (Too Many Requests)
 * using exponential backoff: 1s → 2s → 4s → … up to `maxRetries` attempts.
 *
 * @example
 * ```ts
 * import { AgentLaunchClient } from 'agentlaunch-sdk';
 *
 * const client = new AgentLaunchClient({
 *   apiKey: process.env.AGENTVERSE_API_KEY,
 *   maxRetries: 3, // default
 * });
 * ```
 */
export class AgentLaunchClient {
  /** Resolved base URL (no trailing slash, no /api suffix). */
  readonly baseUrl: string;
  private readonly apiKey: string | undefined;
  private readonly maxRetries: number;

  constructor(config: AgentLaunchConfig = {}) {
    this.baseUrl = resolveBaseUrl(config.baseUrl).replace(/\/$/, '');
    this.apiKey = resolveApiKey(config.apiKey);
    this.maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;
  }

  // -------------------------------------------------------------------------
  // Internal helpers
  // -------------------------------------------------------------------------

  /** Build the full API URL for a given path. */
  private url(path: string): string {
    // Paths passed internally are already prefixed with /api/...
    return `${this.baseUrl}${path}`;
  }

  /** Shared headers injected on every request. */
  private headers(requireAuth: boolean): Record<string, string> {
    const h: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (requireAuth) {
      if (!this.apiKey) {
        throw new AgentLaunchError(
          'An API key is required for this operation. ' +
          'Pass apiKey to AgentLaunchClient or set AGENTVERSE_API_KEY in your environment.',
          0,
        );
      }
      h['X-API-Key'] = this.apiKey;
    } else if (this.apiKey) {
      // Attach the key on public endpoints too when present — harmless and
      // enables higher rate limits on some endpoints.
      h['X-API-Key'] = this.apiKey;
    }

    return h;
  }

  /**
   * Execute a fetch call with exponential backoff retry on HTTP 429.
   *
   * @param fetchFn  Factory that returns a Promise<Response> for each attempt
   * @param label    Human-readable label for error messages (e.g. "GET /api/...")
   */
  private async fetchWithRetry(
    fetchFn: () => Promise<Response>,
    label: string,
  ): Promise<Response> {
    let attempt = 0;

    while (true) {
      const response = await fetchFn();

      if (response.status !== 429 || attempt >= this.maxRetries) {
        return response;
      }

      // Exponential backoff: 1000ms, 2000ms, 4000ms, …
      const delayMs = 1000 * Math.pow(2, attempt);
      attempt++;

      // Respect Retry-After header if the server sends one
      const retryAfter = response.headers.get('Retry-After');
      const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : delayMs;

      await sleep(waitMs);

      // The 429 response body must be consumed to avoid memory leaks in some
      // runtimes; do so after the sleep so we don't block unnecessarily.
      try { await response.text(); } catch { /* ignore */ }
    }
  }

  // -------------------------------------------------------------------------
  // Public request methods
  // -------------------------------------------------------------------------

  /**
   * Perform a typed GET request.
   *
   * @param path   API path, e.g. `/tokens`
   * @param params Optional query-string parameters (undefined values omitted)
   */
  async get<T>(
    path: string,
    params?: Record<string, string | number | boolean | undefined>,
  ): Promise<T> {
    let fullPath = path;

    if (params) {
      const qs = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          qs.set(key, String(value));
        }
      }
      const queryString = qs.toString();
      if (queryString) {
        fullPath = `${path}?${queryString}`;
      }
    }

    const response = await this.fetchWithRetry(
      () => fetch(this.url(fullPath), {
        method: 'GET',
        headers: this.headers(false),
      }),
      `GET ${fullPath}`,
    );

    if (!response.ok) {
      const serverMessage = await extractErrorMessage(response);
      throw new AgentLaunchError(
        `GET ${fullPath} failed: ${response.status} ${response.statusText}` +
        (serverMessage ? ` — ${serverMessage}` : ''),
        response.status,
        serverMessage,
      );
    }

    return response.json() as Promise<T>;
  }

  /**
   * Perform a typed POST request.  Always requires authentication.
   *
   * @param path API path, e.g. `/tokenize`
   * @param body Request body (serialised to JSON)
   */
  async post<T>(path: string, body: unknown): Promise<T> {
    // Build headers first — throws synchronously if apiKey is missing
    const headers = this.headers(true);

    const response = await this.fetchWithRetry(
      () => fetch(this.url(path), {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      }),
      `POST ${path}`,
    );

    if (!response.ok) {
      const serverMessage = await extractErrorMessage(response);
      throw new AgentLaunchError(
        `POST ${path} failed: ${response.status} ${response.statusText}` +
        (serverMessage ? ` — ${serverMessage}` : ''),
        response.status,
        serverMessage,
      );
    }

    return response.json() as Promise<T>;
  }
}
