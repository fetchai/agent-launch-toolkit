import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const DEV_API_URL = 'https://launchpad-backend-dev-1056182620041.us-central1.run.app';
const DEV_FRONTEND_URL = 'https://launchpad-frontend-dev-1056182620041.us-central1.run.app';
const PROD_API_URL = 'https://agent-launch.ai/api';
const PROD_FRONTEND_URL = 'https://agent-launch.ai';

function isProd(): boolean { return process.env.AGENT_LAUNCH_ENV === 'production'; }

const AGENTLAUNCH_API_BASE = (
  process.env.AGENT_LAUNCH_API_URL ?? process.env.AGENT_LAUNCH_BASE_URL ?? (isProd() ? PROD_API_URL : DEV_API_URL)
).replace(/\/$/, '');

const FRONTEND_BASE_URL = (
  process.env.AGENT_LAUNCH_FRONTEND_URL ?? (isProd() ? PROD_FRONTEND_URL : DEV_FRONTEND_URL)
).replace(/\/$/, '');

// API key from environment (set in MCP config env block)
const ENV_API_KEY = process.env.AGENT_LAUNCH_API_KEY;

const AGENTVERSE_API = "https://agentverse.ai/v1";

// ---------------------------------------------------------------------------
// Agentverse API response shapes
// ---------------------------------------------------------------------------

interface AgentverseCreateResponse {
  address: string;
  name: string;
}

// ---------------------------------------------------------------------------
// Tokenize API response shapes
// ---------------------------------------------------------------------------

interface TokenizeApiResponse {
  tokenId?: number;
  token_id?: number;
  id?: number;
  handoffLink?: string;
  handoff_link?: string;
  address?: string;
  data?: {
    tokenId?: number;
    token_id?: number;
    handoffLink?: string;
    handoff_link?: string;
    address?: string;
  };
}

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

export interface CreateAndTokenizeResult {
  success: true;
  agentCode: string;
  agentAddress: string | null;
  tokenId: number;
  handoffLink: string;
  deployLink: string;
  maxWalletAmount?: number;
  initialBuyAmount?: string;
  category?: number;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Derive a ticker from the agent name — uppercase, letters only, max 8 chars. */
function deriveTicker(name: string): string {
  return name
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase()
    .slice(0, 8) || "TOKEN";
}

/** Generate minimal agent scaffold code without writing files to disk. */
function scaffoldCode(name: string, template: string, description: string): string {
  const safeName = name.replace(/[^a-zA-Z0-9_]/g, "_");
  return `"""
${name} — Agentverse Agent
Type: ${template}
Description: ${description}

Platform constants (source of truth: deployed smart contracts):
  - Deploy fee: 120 FET (read dynamically, can change via multi-sig)
  - Graduation target: 30,000 FET -> auto DEX listing
  - Trading fee: 2% -> 100% to protocol treasury (NO creator fee)
"""

from uagents import Agent, Context, Protocol
from uagents_core.contrib.protocols.chat import (
    ChatAcknowledgement,
    ChatMessage,
    TextContent,
    chat_protocol_spec,
)
from datetime import datetime, timezone
from uuid import uuid4
import os

AGENTLAUNCH_API = os.environ.get("AGENTLAUNCH_API", "${AGENTLAUNCH_API_BASE}")

agent = Agent()
chat_proto = Protocol(spec=chat_protocol_spec)


@chat_proto.on_message(ChatMessage)
async def handle_chat(ctx: Context, sender: str, msg: ChatMessage) -> None:
    await ctx.send(
        sender,
        ChatAcknowledgement(
            timestamp=datetime.now(tz=timezone.utc),
            acknowledged_msg_id=msg.msg_id,
        ),
    )
    text = " ".join(
        item.text for item in msg.content if isinstance(item, TextContent)
    ).strip()

    # TODO: implement ${safeName} business logic here
    response = f"Hello from ${name}! You said: {text}"

    await ctx.send(
        sender,
        ChatMessage(
            timestamp=datetime.now(tz=timezone.utc),
            msg_id=uuid4(),
            content=[TextContent(type="text", text=response)],
        ),
    )


@chat_proto.on_message(ChatAcknowledgement)
async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement) -> None:
    ctx.logger.debug(f"Ack from {sender[:20]}")


agent.include(chat_proto, publish_manifest=True)

if __name__ == "__main__":
    agent.run()
`;
}

/** Deploy scaffolded code to Agentverse and return the agent address. */
async function deployToAgentverse(
  apiKey: string,
  agentName: string,
  code: string,
): Promise<string> {
  // Create agent record
  const createRes = await fetch(`${AGENTVERSE_API}/hosting/agents`, {
    method: "POST",
    headers: {
      Authorization: `bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: agentName }),
  });

  if (!createRes.ok) {
    throw new Error(
      `Agentverse create agent failed: ${createRes.status} ${createRes.statusText}`,
    );
  }

  const created = (await createRes.json()) as AgentverseCreateResponse;
  const agentAddress = created.address;

  if (!agentAddress) {
    throw new Error("Agentverse did not return an agent address");
  }

  // Upload code (double-encoded as per Agentverse API requirement)
  const codeArray = [{ language: "python", name: "agent.py", value: code }];
  const uploadRes = await fetch(
    `${AGENTVERSE_API}/hosting/agents/${agentAddress}/code`,
    {
      method: "PUT",
      headers: {
        Authorization: `bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code: JSON.stringify(codeArray) }),
    },
  );

  if (!uploadRes.ok) {
    throw new Error(
      `Agentverse code upload failed: ${uploadRes.status} ${uploadRes.statusText}`,
    );
  }

  // Start the agent
  const startRes = await fetch(
    `${AGENTVERSE_API}/hosting/agents/${agentAddress}/start`,
    {
      method: "POST",
      headers: {
        Authorization: `bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    },
  );

  if (!startRes.ok) {
    throw new Error(
      `Agentverse start agent failed: ${startRes.status} ${startRes.statusText}`,
    );
  }

  return agentAddress;
}

// ---------------------------------------------------------------------------
// Tool implementation
// ---------------------------------------------------------------------------

/**
 * create_and_tokenize (MCP-004)
 *
 * Full end-to-end combo tool:
 *   1. Scaffold Agentverse agent code from template
 *   2. If AGENT_LAUNCH_API_KEY is present, deploy agent to Agentverse
 *   3. Call POST /api/agents/tokenize to create the token record
 *   4. Return agentCode, agentAddress, tokenId, handoffLink, deployLink
 *
 * The human still needs to click the handoffLink to sign the on-chain
 * deployment transaction — this tool never touches private keys.
 *
 * Fee note: 2% trading fee goes 100% to protocol treasury — no creator fee.
 */
export async function createAndTokenize(args: {
  name: string;
  description: string;
  template?: string;
  ticker?: string;
  chainId?: number;
  maxWalletAmount?: number;
  initialBuyAmount?: string;
  category?: number;
}): Promise<CreateAndTokenizeResult> {
  if (!args.name || !args.name.trim()) {
    throw new Error("name is required");
  }
  if (!args.description || !args.description.trim()) {
    throw new Error("description is required");
  }

  const template = args.template ?? "research";
  const ticker = args.ticker ?? deriveTicker(args.name);
  const chainId = args.chainId ?? 97;

  // Step 1: Scaffold agent code
  const agentCode = scaffoldCode(args.name, template, args.description);

  // Step 2: Optionally deploy to Agentverse if API key is available
  let agentAddress: string | null = null;

  if (ENV_API_KEY) {
    try {
      agentAddress = await deployToAgentverse(ENV_API_KEY, args.name, agentCode);
    } catch (err) {
      // Deployment failure is non-fatal — we proceed without an agent address
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[create_and_tokenize] Agentverse deploy skipped: ${msg}`);
    }
  }

  // Step 3: Call POST /api/agents/tokenize
  const payload: Record<string, unknown> = {
    name: args.name,
    symbol: ticker,
    description: args.description,
    chainId,
  };

  if (agentAddress) {
    payload.agentAddress = agentAddress;
  }

  if (args.maxWalletAmount !== undefined) {
    payload.maxWalletAmount = args.maxWalletAmount;
  }

  if (args.initialBuyAmount !== undefined) {
    payload.initialBuyAmount = args.initialBuyAmount;
  }

  if (args.category !== undefined) {
    payload.category = { id: args.category };
  }

  const apiKey = ENV_API_KEY;
  if (!apiKey) {
    throw new Error(
      "AGENT_LAUNCH_API_KEY environment variable is required for create_and_tokenize. " +
        "Add it to the MCP server env config.",
    );
  }

  const tokenizeUrl = `${AGENTLAUNCH_API_BASE}/agents/tokenize`;
  const response = await fetch(tokenizeUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
    },
    body: JSON.stringify(payload),
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
      `POST ${tokenizeUrl} failed with status ${response.status} ${response.statusText}${detail}`,
    );
  }

  const raw = (await response.json()) as TokenizeApiResponse;
  const nested = raw.data ?? raw;

  const tokenId =
    nested.tokenId ??
    nested.token_id ??
    raw.tokenId ??
    raw.token_id;

  if (tokenId === undefined || tokenId === null) {
    throw new Error(
      `Unexpected response from /api/agents/tokenize — no tokenId found: ${JSON.stringify(raw)}`,
    );
  }

  const handoffLink =
    nested.handoffLink ??
    nested.handoff_link ??
    `${FRONTEND_BASE_URL}/deploy/${tokenId}`;

  const tokenAddress = nested.address;
  const tradeTarget = tokenAddress ?? String(tokenId);
  const deployLink = `${FRONTEND_BASE_URL}/trade/${tradeTarget}?action=buy&amount=100`;

  return {
    success: true,
    agentCode,
    agentAddress,
    tokenId,
    handoffLink,
    deployLink,
    ...(args.maxWalletAmount !== undefined && { maxWalletAmount: args.maxWalletAmount }),
    ...(args.initialBuyAmount !== undefined && { initialBuyAmount: args.initialBuyAmount }),
    ...(args.category !== undefined && { category: args.category }),
  };
}

// ---------------------------------------------------------------------------
// Handler map — consumed by index.ts dispatch
// ---------------------------------------------------------------------------

export const tokenizeHandlers = {
  create_and_tokenize: createAndTokenize,
};
