import * as fs from "fs";

const AGENTVERSE_API = "https://agentverse.ai/v1";

// ---------------------------------------------------------------------------
// Internal HTTP helpers (Agentverse-specific — uses bearer auth, not X-API-Key)
// ---------------------------------------------------------------------------

async function avGet<T>(apiKey: string, path: string): Promise<T> {
  const url = `${AGENTVERSE_API}${path}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    let detail = "";
    try {
      const body = (await response.json()) as { message?: string };
      detail = body.message ? `: ${body.message}` : "";
    } catch {
      // ignore
    }
    throw new Error(
      `GET ${url} failed with status ${response.status} ${response.statusText}${detail}`,
    );
  }

  return response.json() as Promise<T>;
}

async function avPost<T>(
  apiKey: string,
  path: string,
  body: unknown,
  method: "POST" | "PUT" = "POST",
): Promise<T> {
  const url = `${AGENTVERSE_API}${path}`;
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let detail = "";
    try {
      const errBody = (await response.json()) as { message?: string };
      detail = errBody.message ? `: ${errBody.message}` : "";
    } catch {
      // ignore
    }
    throw new Error(
      `${method} ${url} failed with status ${response.status} ${response.statusText}${detail}`,
    );
  }

  // Some Agentverse endpoints return 204 No Content
  const text = await response.text();
  if (!text) return {} as T;

  return JSON.parse(text) as T;
}

// ---------------------------------------------------------------------------
// Agentverse API response shapes (minimal — only fields we use)
// ---------------------------------------------------------------------------

interface CreateAgentResponse {
  name: string;
  address: string;
  running: boolean;
  compiled: boolean;
}

interface AgentStatusResponse extends CreateAgentResponse {
  code_digest?: string;
  wallet_address?: string;
  revision?: number;
}

interface UploadCodeResponse {
  digest?: string;
}

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

export interface DeployToAgentverseResult {
  success: true;
  agentAddress: string;
  status: string;
}

// ---------------------------------------------------------------------------
// Tool implementation
// ---------------------------------------------------------------------------

/**
 * deploy_to_agentverse (MCP-006)
 *
 * Deploys an agent Python file to Agentverse hosting:
 *   1. POST /hosting/agents           — create agent record
 *   2. PUT  /hosting/agents/{addr}/code — upload Python source
 *   3. POST /hosting/secrets           — store each secret
 *   4. POST /hosting/agents/{addr}/start — start the agent
 *
 * The Agentverse code upload API requires the `code` field to be a
 * JSON-encoded string containing an array of file objects (double-encoded).
 */
export async function deployToAgentverse(args: {
  apiKey: string;
  agentFile: string;
  agentName?: string;
  secrets?: Record<string, string>;
}): Promise<DeployToAgentverseResult> {
  // Read agent source code
  const agentFilePath = args.agentFile;
  if (!fs.existsSync(agentFilePath)) {
    throw new Error(`Agent file not found: ${agentFilePath}`);
  }

  const sourceCode = fs.readFileSync(agentFilePath, "utf8");
  if (!sourceCode.trim()) {
    throw new Error(`Agent file is empty: ${agentFilePath}`);
  }

  const agentName =
    args.agentName ??
    agentFilePath
      .split("/")
      .pop()
      ?.replace(/\.py$/, "") ??
    "MyAgent";

  // Step 1: Create agent record
  const created = await avPost<CreateAgentResponse>(
    args.apiKey,
    "/hosting/agents",
    { name: agentName },
  );

  const agentAddress = created.address;
  if (!agentAddress) {
    throw new Error("Agentverse did not return an agent address after creation");
  }

  // Step 2: Upload code
  // CRITICAL: The `code` field must be a JSON string containing an array of
  // file objects — this is the Agentverse double-encode requirement.
  const codeArray = [
    {
      language: "python",
      name: "agent.py",
      value: sourceCode,
    },
  ];

  await avPost<UploadCodeResponse>(
    args.apiKey,
    `/hosting/agents/${agentAddress}/code`,
    { code: JSON.stringify(codeArray) },
    "PUT",
  );

  // Step 3: Set secrets (if provided)
  if (args.secrets && Object.keys(args.secrets).length > 0) {
    for (const [name, secret] of Object.entries(args.secrets)) {
      await avPost<unknown>(args.apiKey, "/hosting/secrets", {
        address: agentAddress,
        name,
        secret,
      });
    }
  }

  // Step 4: Start agent
  await avPost<unknown>(
    args.apiKey,
    `/hosting/agents/${agentAddress}/start`,
    {},
  );

  // Step 5: Poll for running status (up to ~60 s, checking every 5 s)
  let status = "starting";
  for (let i = 0; i < 12; i++) {
    await new Promise<void>((resolve) => setTimeout(resolve, 5000));
    try {
      const agentStatus = await avGet<AgentStatusResponse>(
        args.apiKey,
        `/hosting/agents/${agentAddress}`,
      );
      if (agentStatus.running && agentStatus.compiled) {
        status = "running";
        break;
      }
      if (agentStatus.compiled) {
        status = "compiled";
      }
    } catch {
      // Transient poll failure — keep trying
    }
  }

  return {
    success: true,
    agentAddress,
    status,
  };
}

// ---------------------------------------------------------------------------
// Handler map
// ---------------------------------------------------------------------------

export const agentverseHandlers = {
  deploy_to_agentverse: deployToAgentverse,
};
