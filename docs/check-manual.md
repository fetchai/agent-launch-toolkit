# Manual Verification Checklist — AgentLaunch Toolkit

> 23 checks that require human interaction, live testnet, or browser verification.
> Run these after all automated tests pass (`npm run build && npm run test`).

---

## Prerequisites

```bash
# .env must have these set:
AGENTVERSE_API_KEY=<your-key>
WALLET_PRIVATE_KEY=<your-key>
CHAIN_ID=97

# Verify automated tests pass first:
npm run build && npm run test
# Expected: 708 tests, 0 failures
```

### Wallet Info

Derive your wallet address before starting:

```bash
node -e "
  const { Wallet } = require('ethers');
  const w = new Wallet(process.env.WALLET_PRIVATE_KEY);
  console.log('Wallet:', w.address);
"
```

### Testnet Tokens

Need at least 200 TFET + 0.001 tBNB. Get them from the @gift agent:
1. Open https://agentverse.ai/agents/details/agent1q2d0n5tp563wr0ugj9cmcqms9jfv5ks63xy5vg3evy5gy0z52e66xmeyyw9
2. Send: `claim <your-wallet-address>`
3. Receive 200 TFET + 0.001 tBNB

---

## 1. Build System (1 check)

### BLD-09: Clean removes all dist/ directories

```bash
# Run clean
npm run clean

# Verify all dist/ are gone
ls packages/sdk/dist 2>/dev/null && echo "FAIL: SDK dist exists" || echo "PASS: SDK dist gone"
ls packages/cli/dist 2>/dev/null && echo "FAIL: CLI dist exists" || echo "PASS: CLI dist gone"
ls packages/mcp/dist 2>/dev/null && echo "FAIL: MCP dist exists" || echo "PASS: MCP dist gone"
ls packages/templates/dist 2>/dev/null && echo "FAIL: Templates dist exists" || echo "PASS: Templates dist gone"

# Rebuild after verifying
npm run build
```

**Pass criteria:** All four dist/ directories removed. `npm run build` succeeds afterward.

- [ ] BLD-09 verified

---

## 2. Agent Lifecycle — Human Steps (3 checks)

These continue from the automated E2E-01 through E2E-04 (scaffold → deploy → compiled).

### E2E-05: Agent responds to Chat Protocol message

```bash
# Get an agent address (use one you deployed, or deploy a test agent):
npx agentlaunch scaffold e2e-test --type chat-memory
cd e2e-test
npx agentlaunch deploy --json
# Note the agentAddress from output
```

1. Open Agentverse: `https://agentverse.ai/agents`
2. Find your agent by address
3. Click "Chat" or open the agent detail page
4. Send a message: `hello`
5. Verify agent responds (should echo back or provide a greeting)

**Pass criteria:** Agent sends a ChatMessage response with TextContent.

- [ ] E2E-05 verified

### E2E-07: Handoff link loads in browser

```bash
# Create a token record (don't actually deploy):
npx agentlaunch tokenize --agent <agent-address> --name "E2E Test" --symbol E2E --json
# Note the handoffLink from output
```

1. Open the handoff link in a browser
2. Verify the page loads showing token deployment UI
3. Verify it shows: token name, symbol, deploy fee (120 FET), wallet connect button

**Pass criteria:** Page renders with correct token info and "Connect Wallet" button.

- [ ] E2E-07 verified

### E2E-08: Human signs tx, token deploys on-chain

> **Cost: 120 FET deploy fee + gas**. Only run this if you have sufficient testnet tokens.

1. Continue from E2E-07's handoff link page
2. Click "Connect Wallet" → connect with MetaMask (BSC Testnet)
3. Click "Approve FET" → confirm in wallet
4. Click "Deploy Token" → confirm in wallet
5. Wait ~30 seconds for on-chain confirmation

**Pass criteria:** Token appears as "Active" on the platform. Visible at `https://agent-launch.ai`.

- [ ] E2E-08 verified

---

## 3. Trading Lifecycle — Testnet (4 checks)

> **Cost: Gas fees + 2% trading fee per trade.** Uses real testnet tokens.

### E2E-13: Buy (real) executes on testnet

```bash
# Pick a token address that exists on testnet. Use an existing one from:
npx agentlaunch list --json | node -e "
  process.stdin.on('data', d => {
    const { tokens } = JSON.parse(d);
    if (tokens[0]) console.log(tokens[0].token_address || tokens[0].address);
  });
"

# Execute a small buy (1 FET):
npx agentlaunch buy <token-address> --amount 1 --json
```

**Pass criteria:** JSON output includes `txHash`, `blockNumber`, `tokensReceived`.

```bash
# Verify tx on BSCScan:
# https://testnet.bscscan.com/tx/<txHash>
```

- [x] E2E-13 verified

### E2E-14: Token balance increases after buy

```bash
npx agentlaunch wallet balances --json
```

**Pass criteria:** Token balance is > 0 for the token you just bought.

- [x] E2E-14 verified

### E2E-15: Sell (real) executes on testnet

```bash
# Sell some of the tokens you just bought:
npx agentlaunch sell <token-address> --amount 100 --json
```

**Pass criteria:** JSON output includes `txHash`, `blockNumber`, `fetReceived`.

- [x] E2E-15 verified

### E2E-16: FET balance increases after sell

```bash
npx agentlaunch wallet balances --json
```

**Pass criteria:** FET balance increased compared to pre-sell snapshot.

- [x] E2E-16 verified

---

## 4. Swarm Deployment — Live API (5 checks)

> **Cost: 120 FET per agent × number of agents.** Consider using `--dry-run` first.
> **Alternative: Deploy 3 agents instead of the full 7 to save tokens.**

### E2E-17: deploy_swarm with 3+ presets completes

```bash
# Option A: Full marketing team (7 agents, 840 FET):
npx agentlaunch marketing --json

# Option B: Custom mini-swarm (3 agents, 360 FET):
# Create a minimal org chart:
cat > /tmp/mini-org.yaml << 'EOF'
name: E2E Test Swarm
symbol: E2E
cSuite:
  - role: writer
    name: TestWriter
    symbol: TWRITE
  - role: analytics
    name: TestAnalytics
    symbol: TSTAT
departments:
  - name: Content
    roles:
      - role: social
        name: TestSocial
        symbol: TSOC
EOF
npx agentlaunch swarm-from-org /tmp/mini-org.yaml --json
```

**Pass criteria:** All agents in the output have `agentAddress` values (not null). `deployed` count matches total.

- [ ] E2E-17 verified

### E2E-18: All agents reach compiled=true

```bash
# For each agent address from E2E-17 output:
curl -s -H "Authorization: Bearer $AGENTVERSE_API_KEY" \
  "https://agentverse.ai/v1/hosting/agents/<agent-address>" | \
  node -e "process.stdin.on('data', d => {
    const a = JSON.parse(d);
    console.log(a.address, 'compiled:', a.compiled, 'running:', a.running);
  });"
```

**Pass criteria:** Every agent shows `compiled: true`.

- [ ] E2E-18 verified

### E2E-19: Peer address secrets set on each agent

```bash
# Check secrets for an agent:
curl -s -H "Authorization: Bearer $AGENTVERSE_API_KEY" \
  "https://agentverse.ai/v1/hosting/secrets?address=<agent-address>" | \
  node -e "process.stdin.on('data', d => {
    const secrets = JSON.parse(d);
    const peerSecrets = (secrets.items || secrets).filter(s => s.name.includes('ADDRESS'));
    console.log('Peer secrets:', peerSecrets.map(s => s.name));
  });"
```

**Pass criteria:** Each agent has secrets named like `WRITER_ADDRESS`, `ANALYTICS_ADDRESS`, etc., pointing to other agents in the swarm.

- [ ] E2E-19 verified

### E2E-20: network_status shows all agents

```bash
# Use the MCP tool or SDK:
node -e "
  const { AgentLaunch } = require('agentlaunch-sdk');
  const al = new AgentLaunch({ apiKey: process.env.AGENTVERSE_API_KEY });
  // List agents and verify all deployed ones are visible
  al.agents.getMyAgents().then(r => {
    console.log('Total agents:', r.data?.count || r.count);
    const agents = r.data?.agents || r.agents || [];
    agents.forEach(a => console.log(' ', a.address, a.name));
  });
"
```

**Pass criteria:** All deployed swarm agents appear in the listing.

- [ ] E2E-20 verified

### E2E-21: check_agent_commerce returns data per agent

```bash
# For each agent in the swarm:
node -e "
  const { getAgentCommerceStatus } = require('agentlaunch-sdk');
  getAgentCommerceStatus('<agent-address>').then(s => {
    console.log('Revenue:', s.totalRevenue);
    console.log('Balance:', s.balance);
    console.log('Services:', s.services?.length || 0);
  }).catch(e => console.error('Error:', e.message));
"
```

**Pass criteria:** Returns an object with revenue, balance, and services fields (values can be 0 for new agents).

- [ ] E2E-21 verified

---

## 5. MCP in Claude Code (4 checks)

### E2E-22: MCP server starts without error

```bash
# Start the MCP server directly:
npx agent-launch-mcp
# Should print: "Agent-Launch MCP server running on stdio"
# Press Ctrl+C to stop
```

**Pass criteria:** No error output. "running on stdio" message appears on stderr.

- [ ] E2E-22 verified

### E2E-23: Claude Code discovers all 30 tools

1. Open Claude Code in the toolkit directory
2. Run: `/tools`
3. Scroll through the tool list

**Pass criteria:** All 30 tools from `agent-launch` MCP server are listed:
```
list_tokens, get_token, get_platform_stats, calculate_buy, calculate_sell,
create_token_record, get_deploy_instructions, get_trade_link,
deploy_to_agentverse, update_agent_metadata, scaffold_agent, scaffold_swarm,
create_and_tokenize, check_agent_commerce, network_status, deploy_swarm,
buy_tokens, sell_tokens, get_wallet_balances, get_comments, post_comment,
multi_token_payment, check_spending_limit, create_delegation, get_fiat_link,
create_invoice, list_invoices, get_multi_token_balances,
generate_org_template, scaffold_org_swarm
```

- [ ] E2E-23 verified

### E2E-24: Claude Code can call list_tokens

1. In Claude Code, ask: "List the top 3 tokens on AgentLaunch"
2. Verify Claude calls the `list_tokens` MCP tool
3. Verify results are displayed correctly

**Pass criteria:** Claude invokes `list_tokens`, shows token names/symbols/prices.

- [ ] E2E-24 verified

### E2E-25: Claude Code can scaffold + deploy via MCP

1. In Claude Code, ask: "Create and deploy a research agent called 'e2e-mcp-test'"
2. Verify Claude calls `scaffold_agent` and/or `deploy_to_agentverse`
3. Verify agent address is returned

**Pass criteria:** Agent is deployed to Agentverse and address is shown.

- [ ] E2E-25 verified

---

## 6. Multi-Token Payments (5 checks)

### E2E-26: wallet balances shows FET + USDC + BNB

```bash
npx agentlaunch wallet balances --json
```

**Pass criteria:** JSON output has `balances` object with keys for `BNB`, `FET`, and `USDC`. All values are numeric strings ≥ 0.

- [ ] E2E-26 verified

### E2E-27: pay sends USDC to recipient

> **Cost: Sends real USDC tokens.** Use a small amount (e.g., 0.01).

```bash
# Send 0.01 USDC to your own wallet (round-trip test):
npx agentlaunch pay <your-wallet-address> 0.01 --token USDC --yes --json
```

**Pass criteria:** JSON output includes `txHash` and `blockNumber`. Verify on BSCScan.

- [ ] E2E-27 verified

### E2E-28: invoice create stores invoice

```bash
npx agentlaunch invoice create \
  --agent <your-agent-address> \
  --payer 0x0000000000000000000000000000000000000001 \
  --service "e2e-test" \
  --amount 1 \
  --json
```

**Pass criteria:** JSON output includes `id`, `status: "pending"`, `service: "e2e-test"`, `amount`.

- [ ] E2E-28 verified

### E2E-29: invoice list shows created invoice

```bash
npx agentlaunch invoice list --agent <your-agent-address> --status pending --json
```

**Pass criteria:** Output includes the invoice created in E2E-28 (matching ID and service name).

- [ ] E2E-29 verified

### E2E-30: Delegation handoff link works in browser

```bash
npx agentlaunch wallet delegate FET 100 --spender <your-wallet-address> --json
# Note the link from output
```

1. Open the delegation link in a browser
2. Verify the page shows: token (FET), amount (100), spender address
3. Click "Connect Wallet" → verify wallet connect UI appears

**Pass criteria:** Delegation approval page renders correctly with correct parameters.

- [ ] E2E-30 verified

---

## Progress Tracker

| Section | Total | Done | Remaining |
|:--------|:-----:|:----:|:---------:|
| Build System | 1 | | 1 |
| Agent Lifecycle | 3 | | 3 |
| Trading Lifecycle | 4 | | 4 |
| Swarm Deployment | 5 | | 5 |
| MCP in Claude Code | 4 | | 4 |
| Multi-Token Payments | 5 | | 5 |
| **In-Progress** | 1 | | 1 |
| **Total** | **23** | **0** | **23** |

### In-Progress Checks (from check.md)

These are partially covered by automated tests but need manual verification:

| ID | Check | Current Status | What's Needed |
|:---|:------|:---------------|:-------------|
| SDK-T07 | `tokenize()` against live API | `[~]` Integration test | Run with real API key, verify tokenId returned |
| MCP-SC05 | All 7 swarm presets work | `[~]` 3 tested | Test remaining 4: community, outreach, ads, strategy |
| MCP-PAY01 | `multi_token_payment` sends tokens | `[~]` Validation only | Execute real USDC transfer via MCP tool |

---

## Execution Order

Recommended order to minimize cost and dependencies:

```
Phase 1 — Free (no tokens needed)
  BLD-09, E2E-22, E2E-23

Phase 2 — API Key Only (no wallet)
  E2E-05, E2E-24, E2E-25, E2E-28, E2E-29

Phase 3 — Read-Only Wallet
  E2E-26, E2E-07, E2E-30

Phase 4 — Write Transactions (costs tokens)
  E2E-13, E2E-14, E2E-15, E2E-16, E2E-27

Phase 5 — Deploy Agents (costs 120+ FET each)
  E2E-08, E2E-17, E2E-18, E2E-19, E2E-20, E2E-21
```

**Estimated cost:**
- Phase 1-3: Free
- Phase 4: ~2 FET (gas + fees on small trades)
- Phase 5: 360-840 FET (3-7 agent deploys at 120 FET each)
