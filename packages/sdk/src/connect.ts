/**
 * agentlaunch-sdk — Connect agent deployment
 *
 * EXT-03: Deploy and manage connect agents that forward requests between a
 * caller and a target endpoint on the Agentverse hosting platform.
 *
 * A connect agent exposes a named HTTP endpoint and relays traffic to a
 * configured upstream service, optionally injecting an auth header and
 * retrying on transient failures.  This is useful when an AI agent needs
 * a stable, publicly reachable address that routes to a service that may
 * change location or require credential injection without exposing secrets
 * to the caller.
 *
 * Usage:
 * ```ts
 * import { connectAgent, connectionStatus, connectionLogs } from 'agentlaunch-sdk';
 *
 * const result = await connectAgent({
 *   name: 'my-price-connect',
 *   endpoint: 'https://api.example.com/prices',
 *   auth: { header: 'Authorization', secret: 'Bearer s3cr3t' },
 *   timeout: 10_000,
 *   retries: 3,
 *   healthEndpoint: 'https://api.example.com/health',
 * });
 *
 * console.log(result.address); // agent1q...
 *
 * const info = await connectionStatus(result.address);
 * console.log(info.status); // 'running' | 'stopped' | 'error'
 * ```
 *
 * Authentication:
 *   Set AGENTVERSE_API_KEY (or AGENTLAUNCH_API_KEY) in your environment, or
 *   pass `apiKey` directly to each function.
 */

import { resolveApiKey } from './urls.js';
import {
  createAgent,
  uploadCode,
  setSecret,
  startAgent,
  stopAgent,
  getAgentStatus,
  getAgentCode,
  getAgentLogs,
} from './agentverse.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Configuration for a connect agent.
 *
 * At minimum a `name` and `endpoint` are required.  All other fields are
 * optional and sensible defaults are applied when omitted.
 */
export interface ConnectConfig {
  /**
   * Display name for the connect agent (max 64 chars).
   * Must be unique within the owning Agentverse account.
   */
  name: string;

  /**
   * The upstream URL that this connect agent will forward requests to.
   * Must be a fully-qualified HTTPS URL.
   *
   * @example 'https://api.example.com/v1/data'
   */
  endpoint: string;

  /**
   * Human-readable description shown in the Agentverse agent listing.
   *
   * @example 'Forwards price queries to the CoinGecko API.'
   */
  description?: string;

  /**
   * Optional authentication credential injected into every upstream request.
   *
   * `header` is the HTTP header name; `secret` is its value.
   * The secret is stored as an Agentverse agent secret and never included in
   * responses or logs.
   *
   * @example { header: 'Authorization', secret: 'Bearer s3cr3t' }
   */
  auth?: {
    /** HTTP header name, e.g. 'Authorization' or 'X-API-Key'. */
    header: string;
    /**
     * Header value, e.g. 'Bearer TOKEN'.
     * Stored as an Agentverse secret — never returned in plaintext.
     */
    secret: string;
  };

  /**
   * Request timeout in milliseconds applied to each upstream call.
   * @default 30_000
   */
  timeout?: number;

  /**
   * Number of times the connect agent will retry a failed upstream call before
   * returning an error to the caller.
   * @default 3
   */
  retries?: number;

  /**
   * Optional upstream health-check URL polled by the connect agent on startup
   * to confirm the upstream service is reachable before accepting traffic.
   *
   * @example 'https://api.example.com/health'
   */
  healthEndpoint?: string;
}

/**
 * Current operational status of a deployed connect agent.
 */
export interface ConnectionStatus {
  /** Agentverse agent address (agent1q...). */
  address: string;

  /** Display name of the connect agent. */
  name: string;

  /** Upstream endpoint this connect agent forwards to. */
  endpoint: string;

  /**
   * Current lifecycle state of the connect agent on Agentverse.
   *
   * - `'running'`  — compiled and active, accepting traffic.
   * - `'stopped'`  — not running (was stopped or not yet started).
   * - `'error'`    — failed to compile or crashed.
   */
  status: 'running' | 'stopped' | 'error';

  /**
   * ISO-8601 timestamp of the most recent activity event.
   * Present only when the agent has handled at least one request.
   */
  lastActivity?: string;

  /**
   * Agentverse compilation status string as returned by the hosting API,
   * e.g. `'compiled'`, `'compiling'`, `'failed'`.
   */
  compilationStatus?: string;
}

/**
 * Result returned after a successful connect agent deployment.
 */
export interface ConnectResult {
  /** Agentverse agent address of the newly created connect agent (agent1q...). */
  address: string;

  /** Display name the connect agent was registered under. */
  name: string;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Resolve the Agentverse API key from the explicit parameter or environment. */
function resolveKey(apiKey?: string): string {
  const key = apiKey ?? resolveApiKey();
  if (!key) {
    throw new Error(
      'Agentverse API key required. Pass apiKey or set AGENTVERSE_API_KEY in your environment.',
    );
  }
  return key;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Connect agent Python template
//
// Template variables replaced before upload:
//   {{AGENT_NAME}}   — display name embedded in the agent docstring
//   {{SEED_PHRASE}}  — random hex seed used to derive the agent address
//
// All runtime config is read from Agentverse secrets so no credentials ever
// appear in the uploaded source code.
// ---------------------------------------------------------------------------
const CONNECT_TEMPLATE = `#!/usr/bin/env python3
"""
{{AGENT_NAME}} -- AgentLaunch Connect Agent

Forwards every incoming chat message to an external HTTP endpoint and
returns the response. Supports OUTBOX for sending messages to other agents.

Required secrets:
  EXTERNAL_ENDPOINT   The URL to POST each message to
  AUTH_HEADER         Optional -- auth header name
  AUTH_SECRET         Optional -- auth header value
  TIMEOUT             Optional -- timeout in seconds (default: 30)

Request shape:
  {"message": "...", "sender": "agent1q...", "context": {"agent_address": "...", "message_id": "..."}}

Response shape:
  {"reply": "...", "outbox": [{"to": "agent1q...", "message": "..."}]}
"""

import asyncio
import os
from datetime import datetime
from typing import Any
from uuid import uuid4

import aiohttp
from uagents import Agent, Context, Protocol
from uagents_core.contrib.protocols.chat import (
    ChatAcknowledgement,
    ChatMessage,
    EndSessionContent,
    TextContent,
    chat_protocol_spec,
)

EXTERNAL_ENDPOINT: str = os.environ.get("EXTERNAL_ENDPOINT", "")
AUTH_HEADER: str = os.environ.get("AUTH_HEADER", "")
AUTH_SECRET: str = os.environ.get("AUTH_SECRET", "")
TIMEOUT: int = int(os.environ.get("TIMEOUT", "30"))


def _build_headers() -> dict:
    headers = {"Content-Type": "application/json"}
    if AUTH_HEADER and AUTH_SECRET:
        headers[AUTH_HEADER] = AUTH_SECRET
    return headers


async def _forward(message: str, sender: str, agent_address: str, message_id: str) -> dict[str, Any]:
    if not EXTERNAL_ENDPOINT:
        return {"reply": "Connect agent not configured. Set EXTERNAL_ENDPOINT secret.", "outbox": []}
    payload = {"message": message, "sender": sender, "context": {"agent_address": agent_address, "message_id": message_id}}
    try:
        timeout = aiohttp.ClientTimeout(total=TIMEOUT)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.post(EXTERNAL_ENDPOINT, json=payload, headers=_build_headers()) as resp:
                if resp.status != 200:
                    return {"reply": f"Upstream HTTP {resp.status}", "outbox": []}
                data = await resp.json(content_type=None)
                return {"reply": str(data.get("reply", "")).strip() or "Empty reply", "outbox": data.get("outbox", [])}
    except asyncio.TimeoutError:
        return {"reply": f"Timeout after {TIMEOUT}s", "outbox": []}
    except aiohttp.ClientError as exc:
        return {"reply": f"HTTP error: {exc}", "outbox": []}


async def _reply(ctx: Context, sender: str, text: str, end: bool = False) -> None:
    content = [TextContent(type="text", text=text)]
    if end:
        content.append(EndSessionContent(type="end-session"))
    try:
        await ctx.send(sender, ChatMessage(timestamp=datetime.now(), msg_id=uuid4(), content=content))
    except Exception as exc:
        ctx.logger.error(f"Reply failed: {exc}")


async def _send_outbox(ctx: Context, outbox: list[dict]) -> None:
    for item in outbox:
        to_addr, msg_text = item.get("to", ""), item.get("message", "")
        if not to_addr or not msg_text or not to_addr.startswith("agent1q"):
            continue
        try:
            await ctx.send(to_addr, ChatMessage(timestamp=datetime.now(), msg_id=uuid4(), content=[TextContent(type="text", text=msg_text[:4000])]))
            ctx.logger.info(f"Outbox sent to {to_addr[:20]}")
        except Exception as exc:
            ctx.logger.error(f"Outbox failed to {to_addr[:20]}: {exc}")


agent = Agent(seed="{{SEED_PHRASE}}")
chat_proto = Protocol(spec=chat_protocol_spec)


@chat_proto.on_message(ChatMessage)
async def handle_chat(ctx: Context, sender: str, msg: ChatMessage) -> None:
    message_id = str(msg.msg_id)
    try:
        await ctx.send(sender, ChatAcknowledgement(timestamp=datetime.now(), acknowledged_msg_id=msg.msg_id))
    except Exception as exc:
        ctx.logger.error(f"Ack failed: {exc}")

    text = " ".join(item.text for item in msg.content if isinstance(item, TextContent)).strip()[:4000]
    if not text:
        await _reply(ctx, sender, "Please send a text message.", end=True)
        return

    ctx.logger.info(f"Forwarding from {sender[:20]}")
    response = await _forward(text, sender, str(ctx.address), message_id)

    if response.get("reply"):
        await _reply(ctx, sender, response["reply"], end=True)
    if response.get("outbox"):
        await _send_outbox(ctx, response["outbox"])


@chat_proto.on_message(ChatAcknowledgement)
async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement) -> None:
    ctx.logger.debug(f"Ack from {sender[:20]}")


agent.include(chat_proto, publish_manifest=True)

if __name__ == "__main__":
    agent.run()
`;

/**
 * Deploy a new connect agent to Agentverse.
 *
 * Creates an Agentverse hosted agent configured to forward all incoming
 * messages to the specified `endpoint`.  If `auth` is provided, the secret
 * value is stored as an Agentverse agent secret and injected into every
 * upstream request automatically.
 *
 * The connect agent becomes reachable at the returned `address` immediately
 * after deployment, though a short compilation window (~15-60 s) must pass
 * before it accepts live traffic.
 *
 * @param config   Connect agent configuration (name + endpoint required).
 * @param apiKey   Agentverse API key (falls back to env vars).
 * @returns        Address and name of the deployed connect agent.
 *
 * @example
 * ```ts
 * import { connectAgent } from 'agentlaunch-sdk';
 *
 * const result = await connectAgent({
 *   name: 'price-feed-connect',
 *   endpoint: 'https://prices.example.com/api',
 *   auth: { header: 'X-API-Key', secret: process.env.PRICE_API_KEY! },
 *   timeout: 15_000,
 *   retries: 2,
 * });
 *
 * console.log(result.address); // agent1q...
 * ```
 *
 * @see https://agent-launch.ai/docs/sdk#connectAgent
 * @remarks MCP: `connect_agent` | CLI: `npx agentlaunch connect deploy`
 */
export async function connectAgent(
  config: ConnectConfig,
  apiKey?: string,
): Promise<ConnectResult> {
  const key = resolveKey(apiKey);

  // Step 1: Generate a random hex seed phrase.  uAgents derives a deterministic
  // address from this seed, so it must be unique per deployment and kept secret.
  const seedBytes = new Uint8Array(32);
  crypto.getRandomValues(seedBytes);
  const seedPhrase = Array.from(seedBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // Step 2: Build the Python source by substituting the two template variables.
  const timeoutSeconds =
    config.timeout !== undefined ? Math.ceil(config.timeout / 1000) : 30;

  const sourceCode = CONNECT_TEMPLATE
    .replace(/\{\{AGENT_NAME\}\}/g, config.name)
    .replace(/\{\{SEED_PHRASE\}\}/g, seedPhrase);

  // Step 3: Create the agent record on Agentverse.
  const metadata = config.description
    ? { short_description: config.description }
    : undefined;

  const created = await createAgent(key, config.name, metadata);
  const agentAddress = created.address;
  if (!agentAddress) {
    throw new Error('Agentverse did not return an agent address');
  }

  // Step 4: Upload the generated Python source.
  // uploadCode handles the double-encoded JSON format required by the API.
  await uploadCode(key, agentAddress, sourceCode);

  // Step 5: Set runtime secrets.  The agent reads these via os.environ at
  // startup so credentials never appear in the uploaded source code.
  await setSecret(key, agentAddress, 'EXTERNAL_ENDPOINT', config.endpoint);
  await setSecret(key, agentAddress, 'TIMEOUT', String(timeoutSeconds));

  if (config.auth) {
    await setSecret(key, agentAddress, 'AUTH_HEADER', config.auth.header);
    await setSecret(key, agentAddress, 'AUTH_SECRET', config.auth.secret);
  }

  // Step 6: Start the agent — triggers Agentverse compilation and run cycle.
  await startAgent(key, agentAddress);

  return { address: agentAddress, name: config.name };
}

/**
 * Update the configuration of an existing connect agent.
 *
 * Applies a partial configuration patch.  Only the fields present in
 * `config` are changed; omitted fields retain their current values.
 * The agent is restarted automatically after the update.
 *
 * @param address  Agentverse agent address of the connect agent to update (agent1q...).
 * @param config   Partial connect agent configuration to apply.
 * @param apiKey   Agentverse API key (falls back to env vars).
 *
 * @example
 * ```ts
 * import { updateConnection } from 'agentlaunch-sdk';
 *
 * // Change upstream endpoint and increase retry count
 * await updateConnection('agent1q...', {
 *   endpoint: 'https://prices-v2.example.com/api',
 *   retries: 5,
 * });
 * ```
 *
 * @see https://agent-launch.ai/docs/sdk#updateConnection
 * @remarks MCP: `update_connection` | CLI: `npx agentlaunch connect update`
 */
export async function updateConnection(
  address: string,
  config: Partial<ConnectConfig>,
  apiKey?: string,
): Promise<void> {
  const key = resolveKey(apiKey);

  // Step 1: Stop the agent if it is running.
  await stopAgent(key, address);

  // Step 2: Fetch the current source files.
  const files = await getAgentCode(key, address);

  // Find agent.py (or the first Python file as fallback).
  const fileIndex = files.findIndex((f) => f.name === 'agent.py');
  const targetIndex = fileIndex !== -1 ? fileIndex : 0;
  if (files.length === 0 || targetIndex < 0) {
    throw new Error(`updateConnection: no source files found for agent ${address}`);
  }

  let source = files[targetIndex].value;

  // Step 3: Patch EXTERNAL_ENDPOINT in the source when a new endpoint is given.
  // The connect template writes:  EXTERNAL_ENDPOINT = "https://..."
  // We match that assignment regardless of surrounding whitespace.
  if (config.endpoint !== undefined) {
    const endpointPattern = /^(\s*EXTERNAL_ENDPOINT\s*=\s*)["'].*?["']/m;
    if (endpointPattern.test(source)) {
      source = source.replace(
        endpointPattern,
        `$1"${config.endpoint}"`,
      );
    } else {
      // Pattern not present — prepend the assignment so the agent picks it up.
      source = `EXTERNAL_ENDPOINT = "${config.endpoint}"\n${source}`;
    }
  }

  // Step 4: Re-upload code with double-encoded JSON (uploadCode handles encoding).
  await uploadCode(key, address, source, files[targetIndex].name);

  // Step 5: Update the auth secret when it has changed.
  if (config.auth !== undefined) {
    // Secret name mirrors the convention used at deploy time.
    const secretName = config.auth.header
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '_');
    await setSecret(key, address, secretName, config.auth.secret);
  }

  // Step 6: Restart the agent.
  await startAgent(key, address);
}

/**
 * Get the current status of a deployed connect agent.
 *
 * Returns lifecycle state, endpoint, compilation status, and last activity
 * timestamp.  This is a lightweight polling-friendly call — suitable for
 * health dashboards and readiness checks.
 *
 * @param address  Agentverse agent address of the connect agent (agent1q...).
 * @param apiKey   Agentverse API key (falls back to env vars).
 * @returns        Current connection status.
 *
 * @example
 * ```ts
 * import { connectionStatus } from 'agentlaunch-sdk';
 *
 * const info = await connectionStatus('agent1q...');
 * if (info.status === 'running') {
 *   console.log('Connect agent is live at', info.address);
 * }
 * ```
 *
 * @see https://agent-launch.ai/docs/sdk#connectionStatus
 * @remarks MCP: `connection_status` | CLI: `npx agentlaunch connect status`
 */
export async function connectionStatus(
  address: string,
  apiKey?: string,
): Promise<ConnectionStatus> {
  const key = resolveKey(apiKey);

  // Step 1: Fetch raw status from Agentverse (GET /v1/hosting/agents/{addr}).
  const agentStatus = await getAgentStatus(key, address);

  // Step 2: Derive the 'running' | 'stopped' | 'error' discriminant.
  //   - running=true  && compiled=true  → 'running'  (active and accepting traffic)
  //   - running=false && compiled=true  → 'stopped'  (compiled but not started/stopped)
  //   - compiled=false                  → 'error'    (failed to compile or never compiled)
  let status: ConnectionStatus['status'];
  if (agentStatus.running && agentStatus.compiled) {
    status = 'running';
  } else if (agentStatus.compiled) {
    status = 'stopped';
  } else {
    status = 'error';
  }

  // Step 3: Derive a human-readable compilationStatus string from the flags.
  let compilationStatus: string;
  if (agentStatus.running && agentStatus.compiled) {
    compilationStatus = 'compiled';
  } else if (agentStatus.compiled) {
    compilationStatus = 'compiled';
  } else {
    compilationStatus = 'failed';
  }

  // Step 4: Try to extract the upstream endpoint from the agent's source code.
  // The connect template writes:  EXTERNAL_ENDPOINT = "https://..."
  // We do a best-effort extraction and fall back to '' on any failure.
  let endpoint = '';
  try {
    const files = await getAgentCode(key, address);
    for (const file of files) {
      const match = file.value.match(/EXTERNAL_ENDPOINT\s*=\s*["']([^"']+)["']/);
      if (match?.[1]) {
        endpoint = match[1];
        break;
      }
    }
  } catch {
    // Non-fatal: endpoint remains '' if the code endpoint is unavailable.
  }

  return {
    address: agentStatus.address,
    name: agentStatus.name,
    endpoint,
    status,
    compilationStatus,
  };
}

/**
 * Fetch recent log lines from a deployed connect agent.
 *
 * Log output includes startup events, upstream request traces, and any
 * error messages.  Useful for diagnosing connection failures or auth issues
 * with the upstream service.
 *
 * @param address            Agentverse agent address of the connect agent (agent1q...).
 * @param options.limit      Maximum number of log lines to return.
 *                           The Agentverse logs endpoint returns all available
 *                           lines; this option truncates client-side.
 *                           @default undefined (returns all lines)
 * @param apiKey             Agentverse API key (falls back to env vars).
 * @returns                  Array of log line strings, newest-first.
 *
 * @example
 * ```ts
 * import { connectionLogs } from 'agentlaunch-sdk';
 *
 * const lines = await connectionLogs('agent1q...', { limit: 50 });
 * console.log(lines.join('\n'));
 * ```
 *
 * @see https://agent-launch.ai/docs/sdk#connectionLogs
 * @remarks MCP: `connection_logs` | CLI: `npx agentlaunch connect logs`
 */
export async function connectionLogs(
  address: string,
  options?: { limit?: number },
  apiKey?: string,
): Promise<string[]> {
  const key = resolveKey(apiKey);
  const raw = await getAgentLogs(key, address);
  const lines = raw
    .split('\n')
    .filter((line) => line.length > 0)
    .reverse();
  return options?.limit !== undefined ? lines.slice(0, options.limit) : lines;
}
