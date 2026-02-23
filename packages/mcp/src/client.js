const BASE_URL = process.env.AGENT_LAUNCH_BASE_URL || "https://agent-launch.ai/api";
const API_KEY = process.env.AGENT_LAUNCH_API_KEY;
/**
 * Typed GET request — no authentication required.
 * Throws a descriptive error on non-2xx HTTP status.
 */
export async function apiGet(path) {
    const url = `${BASE_URL}${path}`;
    const response = await fetch(url);
    if (!response.ok) {
        let detail = "";
        try {
            const body = (await response.json());
            detail = body.message ? `: ${body.message}` : "";
        }
        catch {
            // ignore — body may not be JSON
        }
        throw new Error(`GET ${url} failed with status ${response.status} ${response.statusText}${detail}`);
    }
    return response.json();
}
/**
 * Typed POST request — requires AGENT_LAUNCH_API_KEY environment variable.
 * Throws if the API key is absent or if the server returns a non-2xx status.
 */
export async function apiPost(path, body) {
    if (!API_KEY) {
        throw new Error("AGENT_LAUNCH_API_KEY required for write operations");
    }
    const url = `${BASE_URL}${path}`;
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-API-Key": API_KEY,
        },
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        let detail = "";
        try {
            const errBody = (await response.json());
            detail = errBody.message ? `: ${errBody.message}` : "";
        }
        catch {
            // ignore — body may not be JSON
        }
        throw new Error(`POST ${url} failed with status ${response.status} ${response.statusText}${detail}`);
    }
    return response.json();
}
//# sourceMappingURL=client.js.map