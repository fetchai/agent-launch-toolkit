/**
 * @agent-launch/sdk — HTTP client
 *
 * SDK-001: Core fetch wrapper that injects auth headers and provides typed
 * request helpers used by all other SDK modules.
 *
 * No external runtime dependencies — uses the global fetch() available in
 * Node.js ≥ 18, Deno, and modern browsers.
 */
import { AgentLaunchConfig } from './types.js';
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
export declare class AgentLaunchClient {
    /** Resolved base URL (no trailing slash, no /api suffix). */
    readonly baseUrl: string;
    private readonly apiKey;
    constructor(config?: AgentLaunchConfig);
    /** Build the full API URL for a given path. */
    private url;
    /** Shared headers injected on every request. */
    private headers;
    /**
     * Perform a typed GET request.
     *
     * @param path   API path, e.g. `/api/agents/tokens`
     * @param params Optional query-string parameters (undefined values omitted)
     */
    get<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T>;
    /**
     * Perform a typed POST request.  Always requires authentication.
     *
     * @param path API path, e.g. `/api/agents/tokenize`
     * @param body Request body (serialised to JSON)
     */
    post<T>(path: string, body: unknown): Promise<T>;
}
//# sourceMappingURL=client.d.ts.map