/**
 * CROSS-001: docs command
 *
 * agentlaunch docs           → outputs skill.md content
 * agentlaunch docs --full    → outputs llms-full.txt content
 * agentlaunch docs --openapi → outputs OpenAPI spec
 * agentlaunch docs --matrix  → outputs integration matrix only
 */

import { Command } from "commander";

const SKILL_URL = "https://agent-launch.ai/skill.md";
const FULL_URL = "https://agent-launch.ai/llms-full.txt";
const OPENAPI_URL = "https://agent-launch.ai/docs/openapi.json";

const EMBEDDED_MATRIX = `## Integration Matrix

| Action | API | SDK | CLI | MCP |
|--------|-----|-----|-----|-----|
| Create token | POST /api/agents/tokenize | client.tokenize() | npx agentlaunch tokenize | create_token_record |
| List tokens | GET /api/agents/tokens | client.listTokens() | npx agentlaunch list | list_tokens |
| Get token | GET /api/agents/token/{addr} | client.getToken() | npx agentlaunch status | get_token |
| Preview buy | GET /api/tokens/calculate-buy | client.calculateBuy() | npx agentlaunch buy --dry-run | calculate_buy |
| Buy tokens | (on-chain) | client.buyTokens() | npx agentlaunch buy | buy_tokens |
| Sell tokens | (on-chain) | client.sellTokens() | npx agentlaunch sell | sell_tokens |
| Deploy agent | (Agentverse API) | client.deploy() | npx agentlaunch deploy | deploy_to_agentverse |
| Scaffold | (local) | — | npx agentlaunch create | scaffold_agent |
| Wallet | (on-chain) | client.getWalletBalances() | npx agentlaunch wallet | get_wallet_balances |
| Comments | GET/POST /api/comments | client.getComments() | npx agentlaunch comments | get_comments |
`;

const EMBEDDED_SKILL = `# AgentLaunch — Tokenize Any AI Agent

curl -X POST https://agent-launch.ai/api/agents/tokenize \\
  -H "X-API-Key: YOUR_AGENTVERSE_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "MyBot", "symbol": "MYB", "description": "My AI agent", "chainId": 97}'

Response: { "success": true, "data": { "id": 42, "handoffLink": "https://agent-launch.ai/deploy/42" } }

Send the handoff link to a human. They click, connect wallet, deploy. Token is live.

## Authentication
Header: X-API-Key: YOUR_AGENTVERSE_API_KEY
Get key at: https://agentverse.ai/profile/api-keys

${EMBEDDED_MATRIX}

## All Resources
- POST /api/agents/tokenize — Create token (X-API-Key auth)
- GET /api/agents/tokens — List tokens (public)
- GET /api/agents/token/{addr} — Token details (public)
- GET /api/tokens/calculate-buy?address=...&fetAmount=... — Preview buy
- GET /api/tokens/calculate-sell?address=...&tokenAmount=... — Preview sell
- GET /api/platform/stats — Platform statistics
- /skill.md — Skill definition
- /docs/openapi — OpenAPI 3.0 spec
- /docs/sdk — SDK reference
- /docs/mcp — MCP tools (40+ tools)
- /llms-full.txt — Complete API reference

## Platform Constants
- Deploy fee: 120 FET
- Graduation: 30,000 FET → auto DEX listing
- Trading fee: 2% → 100% protocol treasury (no creator fee)
- Bonding curve: 800M tradeable + 200M DEX reserve
- Chain: BSC Testnet (97) / BSC Mainnet (56)

Full reference: https://agent-launch.ai/skill.md
`;

async function fetchOrFallback(url: string, fallback: string): Promise<string> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return fallback;
    return await response.text();
  } catch {
    return fallback;
  }
}

export function registerDocsCommand(program: Command): void {
  program
    .command("docs")
    .description("Show AgentLaunch API reference and skill definition")
    .option("--full", "Show complete API reference (llms-full.txt)")
    .option("--openapi", "Show OpenAPI specification")
    .option("--matrix", "Show integration matrix only")
    .option("--offline", "Use embedded copy (no network request)")
    .action(
      async (options: {
        full?: boolean;
        openapi?: boolean;
        matrix?: boolean;
        offline?: boolean;
      }) => {
        if (options.matrix) {
          console.log(EMBEDDED_MATRIX);
          return;
        }

        if (options.offline) {
          console.log(EMBEDDED_SKILL);
          return;
        }

        if (options.full) {
          const content = await fetchOrFallback(FULL_URL, "Failed to fetch. Try: curl " + FULL_URL);
          console.log(content);
          return;
        }

        if (options.openapi) {
          const content = await fetchOrFallback(OPENAPI_URL, "Failed to fetch. Try: curl " + OPENAPI_URL);
          console.log(content);
          return;
        }

        // Default: skill.md
        const content = await fetchOrFallback(SKILL_URL, EMBEDDED_SKILL);
        console.log(content);
      },
    );
}
