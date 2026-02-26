#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { discoveryHandlers } from "./tools/discovery.js";
import { calculateHandlers } from "./tools/calculate.js";
import { handoffHandlers } from "./tools/handoff.js";
import { scaffoldHandlers } from "./tools/scaffold.js";
import { agentverseHandlers } from "./tools/agentverse.js";
import { tokenizeHandlers } from "./tools/tokenize.js";
import { commentHandlers } from "./tools/comments.js";
import { commerceHandlers } from "./tools/commerce.js";

// Create the server
const server = new Server(
  {
    name: "agent-launch",
    version: "2.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define all tools — exported so individual tool files can reference definitions
export const TOOLS = [
  {
    name: "list_tokens",
    description:
      "List all tokens on the Agent-Launch platform with filtering and pagination",
    inputSchema: {
      type: "object" as const,
      properties: {
        status: {
          type: "string",
          enum: ["bonding", "listed", "all"],
          description: "Filter by token status",
        },
        category: {
          type: "string",
          description: "Filter by category name",
        },
        chainId: {
          type: "number",
          description:
            "Filter by chain (97=BSC testnet, 56=BSC mainnet)",
        },
        sort: {
          type: "string",
          enum: ["newest", "trending", "volume"],
          description: "Sort order",
        },
        limit: {
          type: "number",
          description: "Number of results (max 100)",
        },
        offset: {
          type: "number",
          description: "Pagination offset",
        },
      },
    },
  },
  {
    name: "get_token",
    description: "Get full details for a single token by address or ID",
    inputSchema: {
      type: "object" as const,
      properties: {
        address: {
          type: "string",
          description: "Token contract address",
        },
        id: {
          type: "number",
          description: "Token ID",
        },
      },
    },
  },
  {
    name: "get_platform_stats",
    description:
      "Get platform-wide statistics including volume, token counts, and trending tokens",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "calculate_buy",
    description:
      "Calculate how many tokens you'd receive for a FET amount",
    inputSchema: {
      type: "object" as const,
      properties: {
        address: {
          type: "string",
          description: "Token contract address",
        },
        fetAmount: {
          type: "string",
          description: "Amount of FET to spend",
        },
      },
      required: ["address", "fetAmount"],
    },
  },
  {
    name: "calculate_sell",
    description: "Calculate how much FET you'd receive for selling tokens",
    inputSchema: {
      type: "object" as const,
      properties: {
        address: {
          type: "string",
          description: "Token contract address",
        },
        tokenAmount: {
          type: "string",
          description: "Number of tokens to sell",
        },
      },
      required: ["address", "tokenAmount"],
    },
  },
  {
    name: "create_token_record",
    description:
      "Create a token record for deployment (requires API key). Returns a handoff link for the human to complete deployment.",
    inputSchema: {
      type: "object" as const,
      properties: {
        name: {
          type: "string",
          description: "Token name (max 32 chars)",
        },
        symbol: {
          type: "string",
          description: "Token symbol (2-11 chars, uppercase)",
        },
        description: {
          type: "string",
          description: "Token description (max 500 chars)",
        },
        category: {
          type: "string",
          description: "Category name",
        },
        logo: {
          type: "string",
          description: "URL to logo image (optional)",
        },
        chainId: {
          type: "number",
          description: "Chain ID (default: 97)",
        },
      },
      required: ["name", "symbol", "description", "category"],
    },
  },
  {
    name: "get_deploy_instructions",
    description:
      "Get human-readable deployment instructions for a token",
    inputSchema: {
      type: "object" as const,
      properties: {
        tokenId: {
          type: "number",
          description: "Token ID from create_token_record",
        },
      },
      required: ["tokenId"],
    },
  },
  {
    name: "get_trade_link",
    description: "Generate a pre-filled trade link for human execution",
    inputSchema: {
      type: "object" as const,
      properties: {
        address: {
          type: "string",
          description: "Token contract address",
        },
        action: {
          type: "string",
          enum: ["buy", "sell"],
          description: "Trade action",
        },
        amount: {
          type: "string",
          description: "Amount (FET for buy, tokens for sell)",
        },
      },
      required: ["address", "action"],
    },
  },
  // MCP-005 ----------------------------------------------------------------
  {
    name: "scaffold_agent",
    description:
      "Generate a ready-to-run Agentverse agent project from a template. Creates agent.py, README.md, and .env.example in a new directory.",
    inputSchema: {
      type: "object" as const,
      properties: {
        name: {
          type: "string",
          description: "Agent/project name (e.g. 'AlphaBot')",
        },
        type: {
          type: "string",
          enum: ["swarm-starter", "faucet", "research", "trading", "data", "genesis"],
          description:
            "Agent type — controls default domain, rate limits, and business logic scaffold. 'swarm-starter' (recommended) includes full commerce stack. Defaults to 'research'.",
        },
        outputDir: {
          type: "string",
          description:
            "Absolute or relative path to create the project directory. Defaults to ./{name} in the current working directory.",
        },
      },
      required: ["name"],
    },
  },
  // MCP-006 ----------------------------------------------------------------
  {
    name: "deploy_to_agentverse",
    description:
      "Deploy a Python agent file to Agentverse hosted agents. Creates the agent, uploads the code, stores secrets, and starts it. Polls until compiled (up to 60 s).",
    inputSchema: {
      type: "object" as const,
      properties: {
        apiKey: {
          type: "string",
          description: "Agentverse API key (from agentverse.ai/profile/api-keys)",
        },
        agentFile: {
          type: "string",
          description: "Absolute or relative path to the Python agent file to deploy",
        },
        agentName: {
          type: "string",
          description:
            "Display name for the agent on Agentverse. Defaults to the filename without extension.",
        },
        secrets: {
          type: "object",
          description:
            "Key/value pairs to store as Agentverse secrets (e.g. { AGENTLAUNCH_API_KEY: '...' })",
          additionalProperties: { type: "string" },
        },
      },
      required: ["apiKey", "agentFile"],
    },
  },
  // MCP-004 ----------------------------------------------------------------
  {
    name: "create_and_tokenize",
    description:
      "Full end-to-end combo tool. Steps: (1) scaffold Agentverse agent code from template, (2) optionally deploy the agent to Agentverse if AGENT_LAUNCH_API_KEY is present, (3) call POST /agents/tokenize to create the token record, (4) return agentCode, tokenId, handoffLink, and deployLink. The human still needs to click the handoffLink to sign the on-chain deployment transaction — the agent never touches private keys.",
    inputSchema: {
      type: "object" as const,
      properties: {
        name: {
          type: "string",
          description: "Agent and token name (max 32 chars), e.g. 'AlphaBot'",
        },
        description: {
          type: "string",
          description: "Token description (max 500 chars)",
        },
        template: {
          type: "string",
          enum: ["swarm-starter", "faucet", "research", "trading", "data", "genesis"],
          description:
            "Agent template type — controls the scaffolded business logic. 'swarm-starter' (recommended) includes full commerce stack. Defaults to 'research'.",
        },
        ticker: {
          type: "string",
          description:
            "Token ticker symbol (2-11 chars, uppercase). Derived from name if omitted.",
        },
        chainId: {
          type: "number",
          description:
            "Chain ID (default: 97 = BSC testnet, 56 = BSC mainnet).",
        },
        maxWalletAmount: {
          type: "number",
          enum: [0, 1, 2],
          description:
            "Max wallet limit: 0=unlimited (default), 1=0.5% (5M tokens), 2=1% (10M tokens)",
        },
        initialBuyAmount: {
          type: "string",
          description:
            "FET amount to buy immediately after deploy (0-1000). Human will need this much extra FET.",
        },
        category: {
          type: "number",
          description:
            "Category ID (default: 1). Categories: 1=AI, 2=DeFi, 3=Gaming, 4=Social, 5=Meme, 6=Utility",
        },
      },
      required: ["name", "description"],
    },
  },
  // CF-055 ----------------------------------------------------------------
  {
    name: "get_comments",
    description: "Get comments for a token by contract address",
    inputSchema: {
      type: "object" as const,
      properties: {
        address: {
          type: "string",
          description: "Token contract address",
        },
      },
      required: ["address"],
    },
  },
  {
    name: "post_comment",
    description: "Post a comment on a token (requires API key)",
    inputSchema: {
      type: "object" as const,
      properties: {
        address: {
          type: "string",
          description: "Token contract address",
        },
        message: {
          type: "string",
          description: "Comment message (max 500 chars)",
        },
      },
      required: ["address", "message"],
    },
  },
  // EXT-03 ----------------------------------------------------------------
  {
    name: "scaffold_swarm",
    description:
      "Scaffold a swarm-starter agent from a preset. Creates a complete agent project with commerce stack, ready to deploy.",
    inputSchema: {
      type: "object" as const,
      properties: {
        name: {
          type: "string",
          description: "Agent name",
        },
        preset: {
          type: "string",
          enum: [
            "oracle",
            "brain",
            "analyst",
            "coordinator",
            "sentinel",
            "launcher",
            "scout",
            "custom",
          ],
          description:
            "Swarm preset (determines role, pricing, services)",
        },
        outputDir: {
          type: "string",
          description: "Output directory path",
        },
      },
      required: ["name"],
    },
  },
  // EXT-04 ----------------------------------------------------------------
  {
    name: "check_agent_commerce",
    description:
      "Check an agent's commerce status: revenue, pricing, balance, effort mode, holdings",
    inputSchema: {
      type: "object" as const,
      properties: {
        address: {
          type: "string",
          description: "Agent address (agent1q...)",
        },
      },
      required: ["address"],
    },
  },
  // EXT-05 ----------------------------------------------------------------
  {
    name: "network_status",
    description:
      "Check the status of an agent swarm: per-agent revenue, total GDP, health, cross-holdings",
    inputSchema: {
      type: "object" as const,
      properties: {
        addresses: {
          type: "array",
          items: { type: "string" },
          description: "List of agent addresses in the swarm",
        },
      },
      required: ["addresses"],
    },
  },
  // EXT-06 ----------------------------------------------------------------
  {
    name: "deploy_swarm",
    description:
      "Deploy a complete agent swarm. Deploys each agent in sequence, sets secrets, starts them, returns addresses and status.",
    inputSchema: {
      type: "object" as const,
      properties: {
        presets: {
          type: "array",
          items: {
            type: "string",
            enum: [
              "oracle",
              "brain",
              "analyst",
              "coordinator",
              "sentinel",
              "launcher",
              "scout",
            ],
          },
          description: "List of preset names to deploy",
        },
        baseName: {
          type: "string",
          description: "Base name for agents (e.g. 'MySwarm')",
        },
        apiKey: {
          type: "string",
          description: "Agentverse API key",
        },
      },
      required: ["presets", "apiKey"],
    },
  },
];

// Handle list_tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// Handle call_tool request
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    // Route to the appropriate handler map
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type AnyHandler = (a: any) => Promise<unknown>;

    const allHandlers: Record<string, AnyHandler> = {
      ...(discoveryHandlers as Record<string, AnyHandler>),
      ...(calculateHandlers as Record<string, AnyHandler>),
      ...(handoffHandlers as Record<string, AnyHandler>),
      ...(scaffoldHandlers as Record<string, AnyHandler>),
      ...(agentverseHandlers as Record<string, AnyHandler>),
      ...(tokenizeHandlers as Record<string, AnyHandler>),
      ...(commentHandlers as Record<string, AnyHandler>),
      ...(commerceHandlers as Record<string, AnyHandler>),
    };

    if (name in allHandlers) {
      const result = await allHandlers[name](args ?? {});
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: `Unknown tool: ${name}`,
        },
      ],
      isError: true,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      content: [
        {
          type: "text",
          text: `Error executing tool "${name}": ${message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Use stderr — stdout is reserved for the MCP protocol wire format
  console.error("Agent-Launch MCP server running on stdio");
}

main().catch(console.error);
