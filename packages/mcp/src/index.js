#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { handoffHandlers } from "./tools/handoff.js";
import { scaffoldHandlers } from "./tools/scaffold.js";
import { agentverseHandlers } from "./tools/agentverse.js";
import { tokenizeHandlers } from "./tools/tokenize.js";
// Create the server
const server = new Server({
    name: "agent-launch",
    version: "1.1.0",
}, {
    capabilities: {
        tools: {},
    },
});
// Define all tools — exported so individual tool files can reference definitions
export const TOOLS = [
    {
        name: "list_tokens",
        description: "List all tokens on the Agent-Launch platform with filtering and pagination",
        inputSchema: {
            type: "object",
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
                    description: "Filter by chain (97=BSC testnet, 56=BSC mainnet)",
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
            type: "object",
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
        description: "Get platform-wide statistics including volume, token counts, and trending tokens",
        inputSchema: {
            type: "object",
            properties: {},
        },
    },
    {
        name: "calculate_buy",
        description: "Calculate how many tokens you'd receive for a FET amount",
        inputSchema: {
            type: "object",
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
            type: "object",
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
        description: "Create a token record for deployment (requires API key). Returns a handoff link for the human to complete deployment.",
        inputSchema: {
            type: "object",
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
        description: "Get human-readable deployment instructions for a token",
        inputSchema: {
            type: "object",
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
            type: "object",
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
        description: "Generate a ready-to-run Agentverse agent project from the agent-business-template pattern. Creates agent.py, README.md, and .env.example in a new directory.",
        inputSchema: {
            type: "object",
            properties: {
                name: {
                    type: "string",
                    description: "Agent/project name (e.g. 'AlphaBot')",
                },
                type: {
                    type: "string",
                    enum: ["faucet", "research", "trading", "data"],
                    description: "Agent type — controls default domain, rate limits, and business logic scaffold. Defaults to 'research'.",
                },
                outputDir: {
                    type: "string",
                    description: "Absolute or relative path to create the project directory. Defaults to ./{name} in the current working directory.",
                },
            },
            required: ["name"],
        },
    },
    // MCP-006 ----------------------------------------------------------------
    {
        name: "deploy_to_agentverse",
        description: "Deploy a Python agent file to Agentverse hosted agents. Creates the agent, uploads the code, stores secrets, and starts it. Polls until compiled (up to 60 s).",
        inputSchema: {
            type: "object",
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
                    description: "Display name for the agent on Agentverse. Defaults to the filename without extension.",
                },
                secrets: {
                    type: "object",
                    description: "Key/value pairs to store as Agentverse secrets (e.g. { AGENTLAUNCH_API_KEY: '...' })",
                    additionalProperties: { type: "string" },
                },
            },
            required: ["apiKey", "agentFile"],
        },
    },
    // MCP-007 ----------------------------------------------------------------
    {
        name: "create_and_tokenize",
        description: "End-to-end: create a token record on Agent-Launch tied to a live Agentverse agent address. Calls POST /api/agents/tokenize and returns the token ID, a deploy handoff link for the human to sign, and a pre-filled trade link.",
        inputSchema: {
            type: "object",
            properties: {
                apiKey: {
                    type: "string",
                    description: "Agentverse API key sent as X-API-Key header",
                },
                agentAddress: {
                    type: "string",
                    description: "Agentverse agent address (agent1q...)",
                },
                name: {
                    type: "string",
                    description: "Token name (max 32 chars)",
                },
                symbol: {
                    type: "string",
                    description: "Token ticker symbol (2-11 chars, uppercase)",
                },
                description: {
                    type: "string",
                    description: "Token description (max 500 chars)",
                },
                image: {
                    type: "string",
                    description: "URL to a token logo image (optional)",
                },
                chainId: {
                    type: "number",
                    description: "Chain ID (default: 97 = BSC testnet, 56 = BSC mainnet)",
                },
            },
            required: ["apiKey", "agentAddress"],
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
        const allHandlers = {
            ...handoffHandlers,
            ...scaffoldHandlers,
            ...agentverseHandlers,
            ...tokenizeHandlers,
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
    }
    catch (err) {
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
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    // Use stderr — stdout is reserved for the MCP protocol wire format
    console.error("Agent-Launch MCP server running on stdio");
}
main().catch(console.error);
//# sourceMappingURL=index.js.map