#!/usr/bin/env node

// MUST be first import — loads .env before any SDK clients are instantiated
import "./env.js";

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
import { tradingHandlers } from "./tools/trading.js";
import { paymentHandlers } from "./tools/payments.js";

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

// ---------------------------------------------------------------------------
// Tool risk levels
//
// READ-ONLY (safe):  list_tokens, get_token, get_platform_stats, calculate_buy,
//   calculate_sell, get_deploy_instructions, check_spending_limit,
//   check_agent_commerce, network_status, get_wallet_balances, get_comments,
//   list_invoices, get_multi_token_balances, generate_org_template
//
// WRITE (moderate):  create_token_record, scaffold_agent, deploy_to_agentverse,
//   update_agent_metadata, create_and_tokenize, post_comment, scaffold_swarm,
//   deploy_swarm, create_delegation, get_fiat_link, create_invoice,
//   scaffold_org_swarm, get_trade_link
//
// DESTRUCTIVE (high risk — transfers value):  buy_tokens, sell_tokens,
//   multi_token_payment
//
// Tools in the DESTRUCTIVE category transfer real tokens on-chain.
// MCP clients should gate these behind user confirmation or spending limits.
// The multi_token_payment tool enforces MCP_PAYMENT_LIMIT (default: 100).
// ---------------------------------------------------------------------------

// Define all tools — exported so individual tool files can reference definitions
export const TOOLS = [
  {
    name: "list_tokens",
    description:
      "List all tokens on the Agent-Launch platform with filtering and pagination.\n\nUSE THIS TOOL WHEN:\n- User asks about available tokens or wants to browse the market\n- You need to discover token addresses for other operations\n\nExamples: list_tokens({ sort: \"trending\", limit: 10 })\n\nNext: `get_token` for details, `calculate_buy` to preview a trade.",
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
    description:
      "Get full details for a single token by address, ID, or agent-launch.ai URL.\n\nUSE THIS TOOL WHEN:\n- User asks about a specific token's price, status, or details\n- User pastes an agent-launch.ai URL\n\nExamples: get_token({ address: \"0x...\" }), get_token({ id: 42 })\n\nNext: `calculate_buy`/`calculate_sell` for trade preview, `buy_tokens` to purchase.",
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
        url: {
          type: "string",
          description: "Full agent-launch.ai URL (auto-extracts address/ID)",
        },
      },
    },
  },
  {
    name: "get_platform_stats",
    description:
      "Get platform-wide statistics including volume, token counts, and trending tokens.\n\nUSE THIS TOOL WHEN: User asks about platform health or overall market.\n\nNext: `list_tokens` to explore specific tokens.",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "calculate_buy",
    description:
      "Calculate how many tokens you'd receive for a FET amount. Read-only preview.\n\nUSE THIS TOOL WHEN: User wants to preview a purchase. Always call before `buy_tokens`.\n\nExamples: calculate_buy({ address: \"0x...\", fetAmount: \"10\" })\n\nNext: `buy_tokens` to execute, `get_trade_link` for human handoff.",
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
    description:
      "Calculate how much FET you'd receive for selling tokens. Read-only preview.\n\nUSE THIS TOOL WHEN: User wants to preview a sell. Always call before `sell_tokens`.\n\nNext: `sell_tokens` to execute, `get_trade_link` for human handoff.",
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
      "Create a token record for deployment (requires API key and deployed agent). Returns a handoff link.\n\nUSE THIS TOOL WHEN: User has a deployed agent and wants to tokenize it.\n\nExamples: create_token_record({ agentAddress: \"agent1q...\", name: \"AlphaBot\", symbol: \"ALPHA\", description: \"...\", category: \"AI\" })\n\nPREREQUISITE: Deploy agent first with `deploy_to_agentverse`. For all-in-one, use `create_and_tokenize`.",
    inputSchema: {
      type: "object" as const,
      properties: {
        agentAddress: {
          type: "string",
          description: "Agent address from Agentverse (agent1q...)",
        },
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
      required: ["agentAddress", "name", "symbol", "description", "category"],
    },
  },
  {
    name: "get_deploy_instructions",
    description:
      "Get deployment instructions and handoff link for a token.\n\nUSE THIS TOOL WHEN: User has a tokenId and needs next steps.\n\nNext: share the handoff link with the user.",
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
    description:
      "Generate a pre-filled trade link for human execution.\n\nUSE THIS TOOL WHEN: No WALLET_PRIVATE_KEY available, or you want the human to sign.\n\nNext: share the URL with the user.",
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
      "Generate a ready-to-run Agentverse agent project from a template. Creates agent.py, README.md, and .env.example in a new directory.\n\nUSE THIS TOOL WHEN: User wants to create a new agent from scratch.\n\nExamples: scaffold_agent({ name: \"AlphaBot\", type: \"chat-memory\" })\n\nNext: `deploy_to_agentverse`, then `create_token_record`.",
    inputSchema: {
      type: "object" as const,
      properties: {
        name: {
          type: "string",
          description: "Agent/project name (e.g. 'AlphaBot')",
        },
        type: {
          type: "string",
          enum: ["chat-memory", "swarm-starter", "faucet", "research", "trading", "data"],
          description:
            "Agent template type — controls business logic scaffold. 'chat-memory' (default) includes LLM + conversation memory. 'swarm-starter' includes full commerce stack. Defaults to 'chat-memory'.",
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
      "Deploy a Python agent file to Agentverse hosted agents. Creates the agent, uploads the code, stores secrets, and starts it. Polls until compiled (up to 60 s).\n\nUSE THIS TOOL WHEN: User has agent code ready to deploy.\n\nNext: `create_token_record` to tokenize, or `create_and_tokenize` for all-in-one.",
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
        readme: {
          type: "string",
          description:
            "Markdown README content to set on the agent profile. Improves Agentverse ranking.",
        },
        shortDescription: {
          type: "string",
          description:
            "Short description for the Agentverse directory (max 200 chars). Improves ranking.",
        },
      },
      required: ["apiKey", "agentFile"],
    },
  },
  // Agent optimization -------------------------------------------------------
  {
    name: "update_agent_metadata",
    description:
      "Update an existing Agentverse agent's metadata (README, description, avatar URL) to improve its ranking. Returns an optimization checklist showing which of the 7 ranking factors are addressed.\n\nUSE THIS TOOL WHEN: User wants to improve agent visibility after deployment.",
    inputSchema: {
      type: "object" as const,
      properties: {
        apiKey: {
          type: "string",
          description: "Agentverse API key",
        },
        agentAddress: {
          type: "string",
          description: "Agent address (agent1q...)",
        },
        readme: {
          type: "string",
          description: "Markdown README content for the agent profile",
        },
        shortDescription: {
          type: "string",
          description: "Short description for Agentverse directory (max 200 chars)",
        },
        avatarUrl: {
          type: "string",
          description: "Public URL for the agent avatar image",
        },
      },
      required: ["apiKey", "agentAddress"],
    },
  },
  // MCP-004 ----------------------------------------------------------------
  {
    name: "create_and_tokenize",
    description:
      "Full end-to-end: scaffold agent, deploy to Agentverse, create token, return handoff link. Steps: (1) scaffold Agentverse agent code from template, (2) optionally deploy the agent to Agentverse if AGENT_LAUNCH_API_KEY is present, (3) call POST /agents/tokenize to create the token record, (4) return agentCode, tokenId, handoffLink, and deployLink. The human still needs to click the handoffLink to sign the on-chain deployment transaction — the agent never touches private keys.\n\nUSE THIS TOOL WHEN: User wants zero-to-launched in one step.\n\nExamples: create_and_tokenize({ name: \"AlphaBot\", description: \"Trading assistant\" })\n\nAlways share the returned handoffLink with the user.",
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
          enum: ["chat-memory", "swarm-starter", "faucet", "research", "trading", "data"],
          description:
            "Agent template type — controls the scaffolded business logic. 'chat-memory' (default) includes LLM + conversation memory. 'swarm-starter' includes full commerce stack. Defaults to 'chat-memory'.",
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
    description:
      "Get comments for a token by contract address.\n\nUSE THIS TOOL WHEN: User wants to read community discussion or sentiment about a token.",
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
    description:
      "Post a comment on a token (requires API key).\n\nUSE THIS TOOL WHEN: User wants to leave a message or announcement on a token's page.",
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
      "Scaffold a swarm-starter agent from a preset. Creates a complete agent project with commerce stack, ready to deploy.\n\nUSE THIS TOOL WHEN: User wants to create a specialized swarm agent (writer, analytics, etc.) rather than a generic agent.",
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
            "writer",
            "social",
            "community",
            "analytics",
            "outreach",
            "ads",
            "strategy",
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
      "Check an agent's commerce status: revenue, pricing, balance, effort mode, holdings.\n\nUSE THIS TOOL WHEN: User wants to see how a deployed agent is performing commercially, or before adjusting pricing.",
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
      "Check the status of an agent swarm: per-agent revenue, total GDP, health, cross-holdings.\n\nUSE THIS TOOL WHEN: User wants a dashboard view of an entire swarm's health and earnings.",
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
  // On-chain trading --------------------------------------------------------
  {
    name: "buy_tokens",
    annotations: { destructiveHint: true, readOnlyHint: false },
    description:
      "Buy tokens on a bonding curve. Transfers real value on-chain. Use dryRun=true for safe preview. Requires WALLET_PRIVATE_KEY env var (unless dryRun=true). Approves FET, calls buyTokens on-chain, returns tx hash and tokens received.\n\nUSE THIS TOOL WHEN: User explicitly wants to purchase. Use `calculate_buy` first.\n\nAlternative: `get_trade_link` for human-signed trades.",
    inputSchema: {
      type: "object" as const,
      properties: {
        address: {
          type: "string",
          description: "Token contract address (0x...)",
        },
        fetAmount: {
          type: "string",
          description: "Amount of FET to spend (e.g. '10')",
        },
        chainId: {
          type: "number",
          description:
            "Chain ID (97=BSC Testnet, 56=BSC Mainnet). Default: 97",
        },
        slippagePercent: {
          type: "number",
          description: "Slippage tolerance percentage (0-100). Default: 5",
        },
        dryRun: {
          type: "boolean",
          description:
            "If true, only preview the trade via API (no wallet needed). Default: false",
        },
      },
      required: ["address", "fetAmount"],
    },
  },
  {
    name: "sell_tokens",
    annotations: { destructiveHint: true, readOnlyHint: false },
    description:
      "Sell tokens on a bonding curve. Transfers real value on-chain. Use dryRun=true for safe preview. Requires WALLET_PRIVATE_KEY env var (unless dryRun=true). Calls sell() on-chain, returns tx hash and FET received.\n\nUSE THIS TOOL WHEN: User explicitly wants to sell. Use `calculate_sell` first.\n\nAlternative: `get_trade_link` for human-signed trades.",
    inputSchema: {
      type: "object" as const,
      properties: {
        address: {
          type: "string",
          description: "Token contract address (0x...)",
        },
        tokenAmount: {
          type: "string",
          description: "Amount of tokens to sell (e.g. '100000')",
        },
        chainId: {
          type: "number",
          description:
            "Chain ID (97=BSC Testnet, 56=BSC Mainnet). Default: 97",
        },
        dryRun: {
          type: "boolean",
          description:
            "If true, only preview the trade via API (no wallet needed). Default: false",
        },
      },
      required: ["address", "tokenAmount"],
    },
  },
  {
    name: "get_wallet_balances",
    description:
      "Get wallet balances for BNB (gas), FET, and a specific token. Requires WALLET_PRIVATE_KEY env var.\n\nUSE THIS TOOL WHEN: User wants to check wallet before trading.\n\nNext: `buy_tokens` or `sell_tokens` once balances confirmed.",
    inputSchema: {
      type: "object" as const,
      properties: {
        address: {
          type: "string",
          description: "Token contract address to check balance of (0x...)",
        },
        chainId: {
          type: "number",
          description:
            "Chain ID (97=BSC Testnet, 56=BSC Mainnet). Default: 97",
        },
      },
      required: ["address"],
    },
  },
  // EXT-06 ----------------------------------------------------------------
  {
    name: "deploy_swarm",
    description:
      "Deploy a complete agent swarm. Deploys each agent in sequence, sets secrets, starts them, returns addresses and status.\n\nUSE THIS TOOL WHEN: User wants to deploy multiple swarm agents to Agentverse at once.",
    inputSchema: {
      type: "object" as const,
      properties: {
        presets: {
          type: "array",
          items: {
            type: "string",
            enum: [
              "writer",
              "social",
              "community",
              "analytics",
              "outreach",
              "ads",
              "strategy",
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
  // Multi-token payments -------------------------------------------------------
  {
    name: "multi_token_payment",
    annotations: { destructiveHint: true, readOnlyHint: false },
    description:
      "Send a payment in FET, USDC, or any ERC-20 token. Requires WALLET_PRIVATE_KEY env var. Enforces per-call spending limit (MCP_PAYMENT_LIMIT, default: 100).\n\nUSE THIS TOOL WHEN: User wants to transfer tokens to another address. Use `check_spending_limit` first if delegating.",
    inputSchema: {
      type: "object" as const,
      properties: {
        tokenSymbol: {
          type: "string",
          description: "Token symbol to send (e.g. 'FET', 'USDC')",
        },
        to: {
          type: "string",
          description: "Recipient wallet address (0x...)",
        },
        amount: {
          type: "string",
          description: "Amount to send (decimal string, e.g. '10.5')",
        },
        chainId: {
          type: "number",
          description: "Chain ID (97=BSC Testnet, 56=BSC Mainnet). Default: 97",
        },
      },
      required: ["tokenSymbol", "to", "amount"],
    },
  },
  {
    name: "check_spending_limit",
    description:
      "Check the ERC-20 allowance (spending limit) that an owner has granted to a spender. No wallet needed — read-only.\n\nUSE THIS TOOL WHEN: Before calling `multi_token_payment` on behalf of a user, or to verify a delegation is active.",
    inputSchema: {
      type: "object" as const,
      properties: {
        tokenSymbol: {
          type: "string",
          description: "Token symbol (e.g. 'FET', 'USDC')",
        },
        owner: {
          type: "string",
          description: "Address of the token owner who granted the allowance",
        },
        spender: {
          type: "string",
          description: "Address of the approved spender (agent wallet)",
        },
        chainId: {
          type: "number",
          description: "Chain ID. Default: 97",
        },
      },
      required: ["tokenSymbol", "owner", "spender"],
    },
  },
  {
    name: "create_delegation",
    description:
      "Generate a handoff link for a human to approve an ERC-20 spending limit (delegation). The human opens the link, connects wallet, and signs an approve() transaction.\n\nUSE THIS TOOL WHEN: Agent needs permission to spend a user's tokens — share the link for the human to sign.",
    inputSchema: {
      type: "object" as const,
      properties: {
        tokenSymbol: {
          type: "string",
          description: "Token symbol to delegate (e.g. 'FET', 'USDC')",
        },
        amount: {
          type: "string",
          description: "Maximum amount to approve (decimal string)",
        },
        agentAddress: {
          type: "string",
          description: "Agent wallet address that will be authorized to spend (0x...)",
        },
        chainId: {
          type: "number",
          description: "Chain ID. Default: 97",
        },
      },
      required: ["tokenSymbol", "amount", "agentAddress"],
    },
  },
  {
    name: "get_fiat_link",
    description:
      "Generate a MoonPay or Transak URL for purchasing crypto with fiat (credit card). Handoff-only — never processes fiat directly.\n\nUSE THIS TOOL WHEN: User has no crypto and needs to buy FET or USDC with a credit card.",
    inputSchema: {
      type: "object" as const,
      properties: {
        fiatAmount: {
          type: "string",
          description: "Fiat amount to convert (e.g. '50')",
        },
        walletAddress: {
          type: "string",
          description: "Wallet address to receive the purchased crypto (0x...)",
        },
        fiatCurrency: {
          type: "string",
          description: "Fiat currency code (e.g. 'USD', 'EUR'). Default: 'USD'",
        },
        cryptoToken: {
          type: "string",
          description: "Crypto token to purchase (e.g. 'FET', 'USDC'). Default: 'FET'",
        },
        provider: {
          type: "string",
          enum: ["moonpay", "transak"],
          description: "Onramp provider. Default: 'moonpay'",
        },
      },
      required: ["fiatAmount", "walletAddress"],
    },
  },
  {
    name: "create_invoice",
    description:
      "Generate an invoice template for an agent. Note: Agentverse storage is read-only externally, so this returns a JSON template the agent must store using ctx.storage.set().\n\nUSE THIS TOOL WHEN: You need to create an invoice structure for an agent to store.",
    inputSchema: {
      type: "object" as const,
      properties: {
        agentAddress: {
          type: "string",
          description: "Agent address that issues the invoice (agent1q...)",
        },
        invoiceId: {
          type: "string",
          description: "Unique invoice ID",
        },
        payer: {
          type: "string",
          description: "Wallet or agent address of the payer",
        },
        service: {
          type: "string",
          description: "Service being invoiced",
        },
        amount: {
          type: "string",
          description: "Amount to invoice (decimal string)",
        },
        tokenSymbol: {
          type: "string",
          description: "Token symbol for the invoice (default: 'FET')",
        },
        chainId: {
          type: "number",
          description: "Chain ID. Default: 97",
        },
      },
      required: ["agentAddress", "invoiceId", "payer", "service", "amount"],
    },
  },
  {
    name: "list_invoices",
    description:
      "List invoices for an agent, optionally filtered by status (pending, paid, expired, refunded, disputed).\n\nUSE THIS TOOL WHEN: User wants to review outstanding or historical invoices for an agent.",
    inputSchema: {
      type: "object" as const,
      properties: {
        agentAddress: {
          type: "string",
          description: "Agent address (agent1q...)",
        },
        status: {
          type: "string",
          enum: ["pending", "paid", "expired", "refunded", "disputed"],
          description: "Filter by invoice status",
        },
      },
      required: ["agentAddress"],
    },
  },
  // Org chart to swarm tools -------------------------------------------------
  {
    name: "generate_org_template",
    description:
      "Generate a YAML org chart template for users to fill in. Returns a ready-to-edit template with C-Suite, departments, and teams for the chosen organization size.\n\nUSE THIS TOOL WHEN: User wants to plan an agent organization but doesn't know the structure — call this first, then `scaffold_org_swarm`.",
    inputSchema: {
      type: "object" as const,
      properties: {
        size: {
          type: "string",
          enum: ["startup", "smb", "enterprise"],
          description:
            "Organization size: startup (2 C-levels + 1 dept), smb (3 C-levels + 3 depts), enterprise (5 C-levels + 6 depts + 3 teams). Default: smb",
        },
      },
    },
  },
  {
    name: "scaffold_org_swarm",
    description:
      "Generate a complete agent swarm configuration from an org chart. Takes a JSON org chart (with name, cSuite, departments, teams) and returns deployment waves, agent configs, pricing, cross-holdings, and total cost. Optionally scaffolds agent files to disk.\n\nUSE THIS TOOL WHEN: User has a filled-in org chart and wants to generate all agent configs and deploy a full organization.",
    inputSchema: {
      type: "object" as const,
      properties: {
        orgChart: {
          type: "object",
          description:
            "Org chart definition with name (string), symbol (optional string), cSuite (array of {role, name, title}), departments (optional array of {name, head, services, pricePerCall}), teams (optional array of {name, department, lead, services, pricePerCall})",
          properties: {
            name: { type: "string", description: "Organization name" },
            symbol: {
              type: "string",
              description: "Token prefix (e.g. 'ACME' → $ACME-CEO)",
            },
            cSuite: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  role: {
                    type: "string",
                    enum: ["ceo", "cto", "cfo", "coo", "cro"],
                  },
                  name: { type: "string" },
                  title: { type: "string" },
                },
                required: ["role", "name"],
              },
              description: "C-Suite executives",
            },
            departments: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  head: { type: "string" },
                  services: {
                    type: "array",
                    items: { type: "string" },
                  },
                  pricePerCall: { type: "number" },
                },
                required: ["name", "services"],
              },
              description: "Department definitions",
            },
            teams: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  department: { type: "string" },
                  lead: { type: "string" },
                  services: {
                    type: "array",
                    items: { type: "string" },
                  },
                  pricePerCall: { type: "number" },
                },
                required: ["name", "department", "services"],
              },
              description: "Team definitions within departments",
            },
          },
          required: ["name", "cSuite"],
        },
        outputDir: {
          type: "string",
          description:
            "Optional directory to scaffold agent files. If omitted, only returns the config (dry-run).",
        },
      },
      required: ["orgChart"],
    },
  },
  {
    name: "get_multi_token_balances",
    description:
      "Query wallet balances for BNB + FET + USDC + custom tokens. No wallet key needed — read-only.\n\nUSE THIS TOOL WHEN: User provides a wallet address and wants to see all their token balances, or before authorizing a payment.",
    inputSchema: {
      type: "object" as const,
      properties: {
        walletAddress: {
          type: "string",
          description: "Wallet address to query (0x...)",
        },
        tokenSymbols: {
          type: "array",
          items: { type: "string" },
          description: "Token symbols to check (default: all known tokens for the chain)",
        },
        chainId: {
          type: "number",
          description: "Chain ID (97=BSC Testnet, 56=BSC Mainnet). Default: 97",
        },
      },
      required: ["walletAddress"],
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
      ...(tradingHandlers as Record<string, AnyHandler>),
      ...(paymentHandlers as Record<string, AnyHandler>),
    };

    if (name in allHandlers) {
      const result = await allHandlers[name](args ?? {});
      const text =
        typeof result === "object" &&
        result !== null &&
        "_markdown" in result
          ? (result as { _markdown: string })._markdown
          : JSON.stringify(result, null, 2);
      return {
        content: [
          {
            type: "text",
            text,
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

// Only start server when run directly (not when imported for testing)
// In ESM, we check if this file is the entry point by comparing import.meta.url
// to the resolved path of the first CLI argument
import { fileURLToPath } from "url";
import { resolve } from "path";

const currentFile = fileURLToPath(import.meta.url);
const entryPoint = process.argv[1] ? resolve(process.argv[1]) : "";

if (currentFile === entryPoint || entryPoint.endsWith("agent-launch-mcp")) {
  main().catch(console.error);
}
