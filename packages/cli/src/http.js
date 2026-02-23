/**
 * Minimal fetch-based HTTP client shared by all commands.
 * No external dependency — uses Node 18+ built-in fetch.
 */
import { getBaseUrl, requireApiKey } from "./config.js";
/**
 * Typed GET request. No authentication required.
 * Throws a descriptive Error on non-2xx HTTP status.
 */
export async function apiGet(path) {
    const url = `${getBaseUrl()}${path}`;
    const response = await fetch(url);
    if (!response.ok) {
        const detail = await extractErrorDetail(response);
        throw new Error(`GET ${url} failed with ${response.status} ${response.statusText}${detail}`);
    }
    return response.json();
}
/**
 * Typed POST request. Reads the API key from config.
 * Throws if the key is missing or the server returns a non-2xx status.
 */
export async function apiPost(path, body) {
    const apiKey = requireApiKey();
    const url = `${getBaseUrl()}${path}`;
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-API-Key": apiKey,
        },
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        const detail = await extractErrorDetail(response);
        throw new Error(`POST ${url} failed with ${response.status} ${response.statusText}${detail}`);
    }
    return response.json();
}
/**
 * Typed PUT request. Requires Agentverse API key passed explicitly
 * (used by the deploy command — different auth domain).
 */
export async function agentverseRequest(method, url, agentverseApiKey, body) {
    const response = await fetch(url, {
        method,
        headers: {
            "Content-Type": "application/json",
            Authorization: `bearer ${agentverseApiKey}`,
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
        const detail = await extractErrorDetail(response);
        throw new Error(`${method} ${url} failed with ${response.status} ${response.statusText}${detail}`);
    }
    return response.json();
}
/** Extract a human-readable error message from a failed response body. */
async function extractErrorDetail(response) {
    try {
        const body = (await response.json());
        return body.message ? `: ${body.message}` : "";
    }
    catch {
        return "";
    }
}
//# sourceMappingURL=http.js.map