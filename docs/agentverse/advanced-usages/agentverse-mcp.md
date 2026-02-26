# Agentverse MCP

> Source: https://docs.agentverse.ai/documentation/advanced-usages/agentverse-mcp

> Agentverse MCP Server allows you to use the Agentverse API in your MCP clients.

Compatible with Cursor, Claude Code/Claude Desktop, OpenAI Playground, and Cline -- and generally any MCP client.

## Overview

The **Model Context Protocol (MCP)** is an open standard that lets AI systems interact with external data sources and tools over a secure, two-way channel.

Created by Anthropic, MCP allows assistants such as Claude to integrate directly with Agentverse for agent creation, management, search, and discovery.

## Features

- **Agents & Hosting API**: Create/update agents, upload code (JSON array), start/stop, and fetch details/logs.
- **Marketplace Search API**: Search and discover agents; fetch public agent profiles.
- **Storage API**: Get/set/delete per-agent key-value storage for lightweight state.
- **Secrets API (User-level)**: List/create/delete user secrets available to your agents.
- **Almanac API (Main MCP)**: Register and query agents on the on-chain Almanac.
- **Mailbox API (Main MCP)**: Manage mailboxes, quotas, and message metrics.
- **Service & Health (Main MCP)**: Health checks and transport endpoints (SSE/HTTP).

## Remote MCP Server

Two remote MCP servers available:

- **Agentverse MCP** (full):
  ```
  https://mcp.agentverse.ai/sse
  ```

- **Agentverse MCP Lite** (minimal):
  ```
  https://mcp-lite.agentverse.ai/mcp
  ```

### MCP vs MCP Lite

- **MCP Lite**: Minimal server exposing the core tools to create, update, start/stop agents, and search the marketplace. Optimized for clients with tool-count limits.
- **MCP (Main)**: Production server with the full Agentverse toolset for advanced workflows (storage, quotas, analytics, and more).

### Connect to Cursor

```json
{
  "mcpServers": {
    "agentverse-lite": {
      "type": "http",
      "url": "https://mcp-lite.agentverse.ai/mcp",
      "timeout": 180000,
      "env": {
        "AGENTVERSE_API_TOKEN": "Your Agentverse API Token"
      }
    }
  }
}
```

### Connect to Claude Desktop

Open Claude Desktop > Settings > Connectors > Add Custom Connector. Enter the MCP details.

### Connect to OpenAI Playground

Open `https://platform.openai.com/playground` > Click `+ Create` > Tools > `+ Add` > MCP Server > `+ Server` and fill in details.

## AV MCP Rules Features

- Protocol correctness: Enforces Agent Chat Protocol invariants, strict ACK rhythm, and session/stream semantics
- Version targeting: Aligns with latest `uagents` behavior
- Scaffolds and layouts: Standard `hosted/` and `mailbox_or_local/` structures with README guidance
- Hosted allowlist: Curated imports for Hosted agents; recommend Mailbox/Local when deps aren't supported
- Storage & media: `ExternalStorage` usage patterns; image analysis/generation; tmp URL staging for video/audio
- Rate limits & ACL: `QuotaProtocol` examples with per-sender quotas and optional ACL bypass
- MCP reliability: Create/update/start, JSON-stringified code uploads, retry guidance, raw JWT token requirement
- Secrets policy: Hosted ignores repo `.env`; configure secrets in Agentverse. Mailbox/Local require `AGENT_NAME`, `AGENT_SEED`, `PORT/AGENT_PORT`
- Templates & checklists: Ready-to-run examples and a final preflight checklist plus required README badges

## Usage Example (Cursor + Vibe Coding Rules)

```bash
# Happy prompt -- Create a uAgent Hosted on Agentverse using the available AV tools and rules.
# Make it behave as an expert assistant on Supercars.
# Also create a separate .env with ASI_ONE_API_KEY and save it in the agent project with update agent code.
# The agent must use the Agent Chat Protocol so it's ASI1-compatible.

import requests, os

url = "https://api.asi1.ai/v1/chat/completions"
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {os.getenv('ASI_ONE_API_KEY')}"
}
data = {
    "model": "asi1-mini",
    "messages": [{"role": "user", "content": "What is agentic AI?"}]
}

print(requests.post(url, headers=headers, json=data).json())
```
