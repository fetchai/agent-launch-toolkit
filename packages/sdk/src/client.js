/**
 * @agent-launch/sdk — HTTP client
 *
 * SDK-001: Core fetch wrapper that injects auth headers and provides typed
 * request helpers used by all other SDK modules.
 *
 * No external runtime dependencies — uses the global fetch() available in
 * Node.js ≥ 18, Deno, and modern browsers.
 */
import { AgentLaunchError } from './types.js';
const DEFAULT_BASE_URL = 'https://agent-launch.ai';
/**
 * Parses the response body and extracts a human-readable error message
 * from the server's JSON error payload (if present).
 */
async function extractErrorMessage(response) {
    try {
        const body = (await response.json());
        return body.message ?? body.error ?? undefined;
    }
    catch {
        // Body is not JSON — ignore
        return undefined;
    }
}
/**
 * AgentLaunchClient
 *
 * The central HTTP client for the AgentLaunch SDK.  Instantiate once and
 * pass to the token, market, handoff, and agent helpers — or use the
 * named module functions which create a default client from environment
 * variables automatically.
 *
 * @example
 * ```ts
 * import { AgentLaunchClient } from '@agent-launch/sdk';
 *
 * const client = new AgentLaunchClient({
 *   apiKey: process.env.AGENTVERSE_API_KEY,
 * });
 * ```
 */
export class AgentLaunchClient {
    constructor(config = {}) {
        this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, '');
        this.apiKey = config.apiKey;
    }
    // -------------------------------------------------------------------------
    // Internal helpers
    // -------------------------------------------------------------------------
    /** Build the full API URL for a given path. */
    url(path) {
        // Paths passed internally are already prefixed with /api/...
        return `${this.baseUrl}${path}`;
    }
    /** Shared headers injected on every request. */
    headers(requireAuth) {
        const h = {
            'Content-Type': 'application/json',
        };
        if (requireAuth) {
            if (!this.apiKey) {
                throw new AgentLaunchError('An API key is required for this operation. ' +
                    'Pass apiKey to AgentLaunchClient or set AGENTVERSE_API_KEY in your environment.', 0);
            }
            h['X-API-Key'] = this.apiKey;
        }
        else if (this.apiKey) {
            // Attach the key on public endpoints too when present — harmless and
            // enables higher rate limits on some endpoints.
            h['X-API-Key'] = this.apiKey;
        }
        return h;
    }
    // -------------------------------------------------------------------------
    // Public request methods
    // -------------------------------------------------------------------------
    /**
     * Perform a typed GET request.
     *
     * @param path   API path, e.g. `/api/agents/tokens`
     * @param params Optional query-string parameters (undefined values omitted)
     */
    async get(path, params) {
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
        const response = await fetch(this.url(fullPath), {
            method: 'GET',
            headers: this.headers(false),
        });
        if (!response.ok) {
            const serverMessage = await extractErrorMessage(response);
            throw new AgentLaunchError(`GET ${fullPath} failed: ${response.status} ${response.statusText}` +
                (serverMessage ? ` — ${serverMessage}` : ''), response.status, serverMessage);
        }
        return response.json();
    }
    /**
     * Perform a typed POST request.  Always requires authentication.
     *
     * @param path API path, e.g. `/api/agents/tokenize`
     * @param body Request body (serialised to JSON)
     */
    async post(path, body) {
        const response = await fetch(this.url(path), {
            method: 'POST',
            headers: this.headers(true),
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            const serverMessage = await extractErrorMessage(response);
            throw new AgentLaunchError(`POST ${path} failed: ${response.status} ${response.statusText}` +
                (serverMessage ? ` — ${serverMessage}` : ''), response.status, serverMessage);
        }
        return response.json();
    }
}
//# sourceMappingURL=client.js.map