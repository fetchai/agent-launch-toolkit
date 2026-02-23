const DEV_API_URL = 'https://launchpad-backend-dev-1056182620041.us-central1.run.app';
const PROD_API_URL = 'https://agent-launch.ai/api';

function resolveApiUrl(): string {
  if (process.env.AGENT_LAUNCH_API_URL) return process.env.AGENT_LAUNCH_API_URL.replace(/\/$/, '');
  if (process.env.AGENT_LAUNCH_BASE_URL) return process.env.AGENT_LAUNCH_BASE_URL.replace(/\/$/, '');
  return process.env.AGENT_LAUNCH_ENV === 'production' ? PROD_API_URL : DEV_API_URL;
}

const BASE_URL = resolveApiUrl();
const API_KEY = process.env.AGENT_LAUNCH_API_KEY;

/**
 * Typed GET request — no authentication required.
 * Throws a descriptive error on non-2xx HTTP status.
 */
export async function apiGet<T>(path: string): Promise<T> {
  const url = `${BASE_URL}${path}`;

  const response = await fetch(url);

  if (!response.ok) {
    let detail = "";
    try {
      const body = (await response.json()) as { message?: string };
      detail = body.message ? `: ${body.message}` : "";
    } catch {
      // ignore — body may not be JSON
    }
    throw new Error(
      `GET ${url} failed with status ${response.status} ${response.statusText}${detail}`,
    );
  }

  return response.json() as Promise<T>;
}

/**
 * Typed POST request — requires AGENT_LAUNCH_API_KEY environment variable.
 * Throws if the API key is absent or if the server returns a non-2xx status.
 */
export async function apiPost<T>(path: string, body: unknown): Promise<T> {
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
      const errBody = (await response.json()) as { message?: string };
      detail = errBody.message ? `: ${errBody.message}` : "";
    } catch {
      // ignore — body may not be JSON
    }
    throw new Error(
      `POST ${url} failed with status ${response.status} ${response.statusText}${detail}`,
    );
  }

  return response.json() as Promise<T>;
}
