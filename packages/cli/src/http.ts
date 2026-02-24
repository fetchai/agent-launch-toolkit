/**
 * Thin HTTP wrapper for the AgentLaunch CLI.
 *
 * All platform API calls (X-API-Key auth) go through AgentLaunchClient from
 * the SDK.  The agentverseRequest helper is kept here because Agentverse uses
 * bearer-token auth which is a different auth domain.
 */

import { AgentLaunchClient } from "agentlaunch-sdk";
import { getBaseUrl, requireApiKey } from "./config.js";

/**
 * Return an authenticated SDK client (uses X-API-Key from CLI config).
 * Throws if no API key is configured.
 */
export function getClient(): AgentLaunchClient {
  return new AgentLaunchClient({ baseUrl: getBaseUrl(), apiKey: requireApiKey() });
}

/**
 * Return a public (unauthenticated) SDK client.
 * Use this for read-only endpoints that don't require an API key.
 */
export function getPublicClient(): AgentLaunchClient {
  return new AgentLaunchClient({ baseUrl: getBaseUrl() });
}

/**
 * Typed HTTP helper for Agentverse API calls.
 * Agentverse uses "Authorization: bearer <key>" instead of X-API-Key.
 */
export async function agentverseRequest<T>(
  method: "POST" | "PUT",
  url: string,
  agentverseApiKey: string,
  body?: unknown,
): Promise<T> {
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
    throw new Error(
      `${method} ${url} failed with ${response.status} ${response.statusText}${detail}`,
    );
  }

  return response.json() as Promise<T>;
}

/** Extract a human-readable error message from a failed response body. */
async function extractErrorDetail(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string };
    return body.message ? `: ${body.message}` : "";
  } catch {
    return "";
  }
}
