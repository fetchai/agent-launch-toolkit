/**
 * Typed GET request — no authentication required.
 * Throws a descriptive error on non-2xx HTTP status.
 */
export declare function apiGet<T>(path: string): Promise<T>;
/**
 * Typed POST request — requires AGENT_LAUNCH_API_KEY environment variable.
 * Throws if the API key is absent or if the server returns a non-2xx status.
 */
export declare function apiPost<T>(path: string, body: unknown): Promise<T>;
//# sourceMappingURL=client.d.ts.map