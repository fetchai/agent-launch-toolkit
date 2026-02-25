# AgentLaunch Toolkit

A collection of packages for building AI agent token launchers on the [AgentLaunch](https://agent-launch.ai) platform (Fetch.ai ecosystem).
Platform and API URLs are configured via `.env` (`AGENT_LAUNCH_API_URL`, `AGENT_LAUNCH_FRONTEND_URL`). Production URLs are the default.

## Packages

| Package | Version | Description |
|---------|---------|-------------|
| [`agentlaunch-sdk`](./sdk/README.md) | 0.1.0 | TypeScript SDK — create tokens, query market data, generate handoff links |
| [`agentlaunch-cli`](./cli/) | 1.0.0 | CLI tool — scaffold, deploy, and tokenize AI agents from the command line |
| [`agent-launch-mcp`](./mcp/) | 1.1.0 | MCP server — create AI agent tokens via Claude Code |

## Installation

### SDK

```bash
npm install agentlaunch-sdk
```

### CLI

```bash
npm install -g agentlaunch-cli
agentlaunch --help
```

### MCP Server

```bash
npm install -g agent-launch-mcp
```

## Quick Start

```typescript
import { tokenize, generateDeployLink } from 'agentlaunch-sdk';

// Create a pending token record (requires AGENTVERSE_API_KEY env var)
const { data } = await tokenize({
  agentAddress: 'agent1qf8xfhsc8hg4g5l0nhtj...',
  name: 'My Agent Token',
  chainId: 97, // BSC Testnet
});

// Generate a handoff link for a human to complete on-chain deployment
const link = generateDeployLink(data.token_id);
console.log(link); // https://agent-launch.ai/deploy/42 (production default)
```

## Authentication

All write operations require an Agentverse API key. Set the environment variable:

```bash
export AGENTVERSE_API_KEY=av-xxxxxxxxxxxxxxxx
```

Or pass it directly to the client:

```typescript
import { AgentLaunchClient } from 'agentlaunch-sdk';

const client = new AgentLaunchClient({ apiKey: 'av-xxxxxxxxxxxxxxxx' });
```

## Platform

- **Target Liquidity:** 30,000 FET (triggers auto-DEX listing)
- **Total Buy Tokens:** 800,000,000
- **Deployment Fee:** 120 FET (read dynamically from contract)
- **Trading Fee:** 2% per transaction, 100% to protocol treasury

## Development

```bash
# Install all workspace dependencies
npm install

# Build all packages
npm run build

# Test all packages
npm run test

# Lint all packages
npm run lint

# Clean all dist folders
npm run clean
```

## Links

- [Platform](https://agent-launch.ai) (production, default) | [Dev](https://launchpad-frontend-dev-1056182620041.us-central1.run.app)
- [Agent API Docs](https://agent-launch.ai/docs/for-agents)
- [OpenAPI Spec](https://agent-launch.ai/docs/openapi)
- [Skill Manifest](https://agent-launch.ai/skill.md)
