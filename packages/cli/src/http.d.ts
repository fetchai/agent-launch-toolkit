/**
 * Minimal fetch-based HTTP client shared by all commands.
 * No external dependency — uses Node 18+ built-in fetch.
 */
/**
 * Typed GET request. No authentication required.
 * Throws a descriptive Error on non-2xx HTTP status.
 */
export declare function apiGet<T>(path: string): Promise<T>;
/**
 * Typed POST request. Reads the API key from config.
 * Throws if the key is missing or the server returns a non-2xx status.
 */
export declare function apiPost<T>(path: string, body: unknown): Promise<T>;
/**
 * Typed PUT request. Requires Agentverse API key passed explicitly
 * (used by the deploy command — different auth domain).
 */
export declare function agentverseRequest<T>(method: "POST" | "PUT", url: string, agentverseApiKey: string, body?: unknown): Promise<T>;
//# sourceMappingURL=http.d.ts.map