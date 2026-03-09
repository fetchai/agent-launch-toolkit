# AgentLaunch Toolkit — Feature Reference

> The complete economic layer for AI agents on Fetch.ai.
> Build, deploy, tokenize, trade, and coordinate autonomous agents — all from one toolkit.

---

## At a Glance

| Metric | Count |
|--------|-------|
| CLI Commands | 16 |
| MCP Tools (for Claude Code / Cursor) | 28 |
| SDK Functions | 60+ |
| Agent Templates | 9 |
| Swarm Presets | 16 (5 C-suite + 7 marketing + 4 consumer) |
| Supported Tokens | FET, USDC (multi-chain) |
| Supported Chains | BSC Testnet (97), BSC Mainnet (56) |
| API Endpoints | 32+ |

---

## The Agent Lifecycle (8 Phases)

Every agent follows the same path from idea to autonomous economic participant:

```
Create → Deploy → Optimize → Tokenize → Handoff → Discover → Trade → Grow
```

| Phase | What Happens | Key Tool |
|-------|-------------|----------|
| **1. Create** | Scaffold agent code from a template | `npx agentlaunch` |
| **2. Deploy** | Upload to Agentverse, set secrets, start | `deploy_to_agentverse` |
| **3. Optimize** | Set README, description, avatar for ranking | `update_agent_metadata` |
| **4. Tokenize** | Create an ERC-20 token on the bonding curve | `create_token_record` |
| **5. Handoff** | Human signs the 120 FET deploy transaction | `generateDeployLink()` |
| **6. Discover** | Browse tokens, filter by status and chain | `list_tokens` |
| **7. Trade** | Buy and sell on the bonding curve | `buy_tokens` / `sell_tokens` |
| **8. Grow** | Monitor swarm revenue, cross-holdings, GDP | `network_status` |

---

## CLI Commands

### One-Command Flow

```bash
npx agentlaunch                          # Interactive: name → deploy → open editor
npx agentlaunch my-agent                 # Create + deploy agent named "my-agent"
npx agentlaunch my-agent --local         # Scaffold only, no deploy
```

### Agent Lifecycle

| Command | Description |
|---------|-------------|
| `agentlaunch create` | Scaffold + deploy + tokenize (full wizard) |
| `agentlaunch scaffold <name> --type <template>` | Generate agent code from template |
| `agentlaunch deploy` | Deploy agent.py to Agentverse |
| `agentlaunch optimize <address>` | Update README/description/avatar |
| `agentlaunch tokenize` | Create token + get handoff link |
| `agentlaunch init` | Initialize .env with API key |

### Token Discovery & Market

| Command | Description |
|---------|-------------|
| `agentlaunch list` | Browse all tokens (filter by status, sort by volume) |
| `agentlaunch status <address>` | Check agent or token details |
| `agentlaunch holders <address>` | View token holder distribution |
| `agentlaunch comments list <address>` | Read token comments |
| `agentlaunch comments add <address>` | Post a comment on a token |

### On-Chain Trading

| Command | Description |
|---------|-------------|
| `agentlaunch buy <address> --amount 10` | Buy tokens with 10 FET |
| `agentlaunch sell <address> --amount 50000` | Sell 50,000 tokens for FET |
| `agentlaunch buy <address> --amount 10 --dry-run` | Preview without executing |
| `agentlaunch claim <wallet>` | Claim 200 TFET from @gift faucet |

### Multi-Token Wallet

| Command | Description |
|---------|-------------|
| `agentlaunch wallet balances` | Show FET + USDC + BNB balances (from WALLET_PRIVATE_KEY) |
| `agentlaunch wallet balances --address 0x...` | Read-only balance query (no private key needed) |
| `agentlaunch wallet send USDC <to> 10` | Send USDC to a wallet (confirms before sending) |
| `agentlaunch wallet send USDC <to> 10 -y` | Send without confirmation prompt |
| `agentlaunch wallet delegate FET 100 --spender 0x...` | Generate delegation handoff link |
| `agentlaunch wallet allowance FET --owner 0x... --spender 0x...` | Check spending limit |

### Payments & Invoices

| Command | Description |
|---------|-------------|
| `agentlaunch pay <to> 10 --token USDC` | Pay in any supported token (confirms before paying) |
| `agentlaunch pay <to> 10 --token USDC -y` | Pay without confirmation prompt |
| `agentlaunch invoice create --agent <addr> --payer <addr> --service api --amount 10` | Create invoice |
| `agentlaunch invoice list --agent <addr> --status pending` | List invoices by status |

### Configuration

| Command | Description |
|---------|-------------|
| `agentlaunch config set-key <key>` | Store Agentverse API key |

---

## MCP Tools (Claude Code / Cursor)

28 tools accessible via the `agent-launch-mcp` server, organized by capability and risk level.

**Risk levels:** Tools are annotated as READ-ONLY (safe), WRITE (moderate), or DESTRUCTIVE (transfers value on-chain). Destructive tools (`buy_tokens`, `sell_tokens`, `multi_token_payment`) carry `destructiveHint: true` in their MCP annotations.

### Token Discovery

| Tool | Description |
|------|-------------|
| `list_tokens` | Browse tokens with filtering (status, category, chain, sort) |
| `get_token` | Full details for a token by address or ID |
| `get_platform_stats` | Platform-wide statistics: volume, token counts, trending |

### Market Calculations

| Tool | Description |
|------|-------------|
| `calculate_buy` | Preview buy: tokens received, price impact, 2% fee |
| `calculate_sell` | Preview sell: FET received, price impact, 2% fee |

### Token Operations

| Tool | Description |
|------|-------------|
| `create_token_record` | Create a token record — returns handoff link for human deployment |
| `get_deploy_instructions` | Human-readable deployment instructions |
| `get_trade_link` | Generate pre-filled buy/sell link for human execution |
| `create_and_tokenize` | End-to-end: scaffold + deploy + tokenize in one call |

### On-Chain Trading (DESTRUCTIVE)

| Tool | Description |
|------|-------------|
| `buy_tokens` | Buy tokens on bonding curve (or dry-run preview) |
| `sell_tokens` | Sell tokens on bonding curve (or dry-run preview) |
| `get_wallet_balances` | Query BNB + FET + token balances |

### Agent Deployment

| Tool | Description |
|------|-------------|
| `scaffold_agent` | Generate agent project from template |
| `scaffold_swarm` | Generate swarm agent from preset (writer, social, etc.) |
| `deploy_to_agentverse` | Full deploy: create agent, upload code, set secrets, start, poll |
| `deploy_swarm` | Deploy multiple agents as a coordinated swarm |
| `update_agent_metadata` | Update README, description, avatar for ranking |

### Commerce & Swarm Monitoring

| Tool | Description |
|------|-------------|
| `check_agent_commerce` | Revenue, pricing, balance, effort mode, tier |
| `network_status` | Swarm GDP, per-agent health, cross-holdings |

### Comments

| Tool | Description |
|------|-------------|
| `get_comments` | Read comments on a token |
| `post_comment` | Post a comment on a token |

### Multi-Token Payments

| Tool | Risk | Description |
|------|------|-------------|
| `multi_token_payment` | DESTRUCTIVE | Send FET, USDC, or any ERC-20 (per-call limit enforced) |
| `check_spending_limit` | READ-ONLY | Check ERC-20 allowance (delegation check) |
| `create_delegation` | WRITE | Generate handoff link for spending limit approval |
| `get_fiat_link` | WRITE | Generate MoonPay or Transak fiat onramp URL |
| `create_invoice` | WRITE | Create payment invoice in agent storage |
| `list_invoices` | READ-ONLY | List invoices by status (pending/paid/expired/refunded/disputed) |
| `get_multi_token_balances` | READ-ONLY | Query FET + USDC + BNB + custom token balances |

---

## Agent Templates

9 blueprints for every use case — from simple chat agents to full commerce stacks.

| Template | Description | Best For |
|----------|-------------|----------|
| **chat-memory** | LLM + conversation memory | Most agents (recommended default) |
| **swarm-starter** | Full commerce stack with payments, pricing, tiers | Service-charging agents in a swarm |
| **consumer-commerce** | Multi-token payments, invoices, fiat onramp, delegation | Consumer-facing payment flows |
| **custom** | Minimal Chat Protocol boilerplate | Starting from scratch |
| **price-monitor** | Token price watcher with alerts | Monitoring services |
| **trading-bot** | Buy/sell signal generation | Trading services |
| **data-analyzer** | On-chain data analysis and reporting | Analytics services |
| **research** | Deep dives and report generation | Research services |
| **gifter** | Treasury wallet + automatic reward distribution | Community incentives |

### Scaffold any template

```bash
npx agentlaunch scaffold my-agent --type chat-memory
npx agentlaunch scaffold my-payment-bot --type consumer-commerce
npx agentlaunch scaffold my-oracle --type swarm-starter --preset writer
```

---

## People to Swarm (Org Chart → Agent Swarm)

Transform any organization into a coordinated AI agent swarm.

```bash
# Generate an org template
npx agentlaunch org-template --size smb > people.yaml

# Edit with your team, then deploy
npx agentlaunch swarm-from-org people.yaml
```

### Org Sizes

| Size | Agents | Deploy Cost | Description |
|------|--------|-------------|-------------|
| **startup** | 3 | 360 FET | CEO + CTO + 1 department |
| **smb** | 8 | 960 FET | 3 C-levels + 5 departments |
| **enterprise** | 18 | 2,160 FET | Full C-Suite + departments + teams |

### C-Suite Infrastructure

| Role    | Token | Function                            | Price    |
| ------- | ----- | ----------------------------------- | -------- |
| **CEO** | $CEO  | Routes all queries, coordinates org | 0.02 FET |
| **CTO** | $CTO  | Shared reasoning — everyone pays    | 0.05 FET |
| **CFO** | $CFO  | Treasury, revenue tracking          | 0.02 FET |
| **COO** | $COO  | 24/7 ops monitoring                 | 0.02 FET |
| **CRO** | $CRO  | Talent discovery, team expansion    | 0.05 FET |

> See [people-to-swarm.md](./people-to-swarm.md) for full documentation.

---

## Swarm Presets

Pre-configured agent roles for instant deployment. Each preset sets the agent's services, pricing, secrets, and dependencies.

### C-Suite (5 presets)

Infrastructure layer — deploy these first. Every other agent pays the CTO for reasoning.

| Preset | Token | Price/Query | Deploy Order |
|--------|-------|-------------|--------------|
| **ceo** | $CEO | 0.02 FET | 4th |
| **cto** | $CTO | 0.05 FET | 1st (everyone depends on CTO) |
| **cfo** | $CFO | 0.02 FET | 2nd |
| **coo** | $COO | 0.02 FET | 3rd |
| **cro** | $CRO | 0.05 FET | 5th (recruitment, swarm growth) |

### Marketing Team (7 presets)

A complete content marketing operation — deploy one agent or all seven.

| Preset | Token | Price/Call | Services |
|--------|-------|-----------|----------|
| **writer** | $WRITE | 0.01 FET | blog_post, tweet_thread, newsletter, ad_copy |
| **social** | $POST | 0.005 FET | post_tweet, schedule_thread, reply_mentions |
| **community** | $COMM | 0.002 FET | moderate, answer_faq, run_poll |
| **analytics** | $STATS | 0.005 FET | engagement_report, audience_insights, content_performance |
| **outreach** | $REACH | 0.01 FET | find_partners, draft_pitch, send_email |
| **ads** | $ADS | 0.01 FET | create_ad, ab_test, campaign_report |
| **strategy** | $PLAN | 0.02 FET | content_calendar, brand_audit, competitor_analysis, campaign_plan |

**Build order:** Writer → Community → Social → Analytics → Outreach → Ads → Strategy

### Consumer Commerce (4 presets)

Multi-token payment flows for consumer-facing agents.

| Preset | Token | Use Case | Key Capability |
|--------|-------|----------|----------------|
| **payment-processor** | $PAY | Payment routing & receipts | Multi-token, invoices, fiat onramp |
| **booking-agent** | $BOOK | Service booking with payment | Availability + calendar + payment |
| **subscription-manager** | $SUB | Recurring billing | Delegation-powered auto-renewal |
| **escrow-service** | $ESCR | Hold-until-delivery | Dispute resolution, refunds |

---

## Multi-Token Payment System

Accept FET, USDC, or any ERC-20 — no custom smart contracts needed.

### Supported Tokens

| Token | BSC Testnet (97) | BSC Mainnet (56) | Stablecoin |
|-------|-----------------|-----------------|------------|
| **FET** | `0x304ddf3e...` | `0xBd5df99A...` | No |
| **USDC** | `0x64544969...` | `0x8AC76a51...` | Yes |

### Payment Capabilities

| Feature | How It Works |
|---------|-------------|
| **Multi-token transfers** | Send FET, USDC, or any ERC-20 via `transferToken()` |
| **Balance queries** | Check FET + USDC + BNB in one call via `getMultiTokenBalances()` |
| **Invoices** | Create, track, and settle invoices stored in Agentverse agent storage |
| **Invoice lifecycle** | `pending` → `paid` / `expired` / `refunded` / `disputed` |
| **Spending delegation** | Human approves ERC-20 allowance → agent auto-pays via `transferFrom` |
| **Fiat onramp** | Generate MoonPay or Transak links for card-to-crypto purchase |

### Delegation Flow (Auto-Pay)

```
1. Agent generates delegation handoff link
2. Human opens link → connects wallet → signs approve() for X tokens
3. Agent checks allowance on-chain (read-only, no wallet needed)
4. Agent spends from delegation via transferFrom (up to approved limit)
```

No custom contracts — standard ERC-20 `approve()` / `transferFrom()`.

### Security

| Protection | Where | Details |
|-----------|-------|---------|
| **MCP spending limit** | `multi_token_payment` | Rejects amounts > `MCP_PAYMENT_LIMIT` (default: 100, configurable via env var) |
| **CLI confirmation prompts** | `wallet send`, `pay` | Asks `[y/N]` before transferring (skip with `-y` flag) |
| **Address validation** | All SDK payment functions | `validateEthAddress()` checks `0x` + 40 hex chars, prevents URL injection |
| **Token-aware decimals** | `transferToken`, `getTokenBalance` | Uses `token.decimals` via `formatUnits`/`parseUnits` (not hardcoded 18) |
| **Tool risk annotations** | MCP server | `destructiveHint: true` on `buy_tokens`, `sell_tokens`, `multi_token_payment` |
| **Read-only balance queries** | `wallet balances --address` | No private key needed for balance checks |

### Fiat Onramp (Handoff-Only)

Generate a URL for users to buy crypto with a credit card. The toolkit never processes fiat directly.

| Provider | API Key Env Var |
|----------|----------------|
| MoonPay | `MOONPAY_API_KEY` |
| Transak | `TRANSAK_API_KEY` |

```typescript
const link = generateFiatOnrampLink({
  fiatAmount: '50', fiatCurrency: 'USD',
  cryptoToken: 'FET', walletAddress: '0x...',
  provider: 'moonpay',
});
// User opens link → buys FET with credit card → receives in wallet
```

---

## SDK (TypeScript)

The `agentlaunch-sdk` package provides a fluent API for every operation.

### Quick Start

```typescript
import { AgentLaunch } from 'agentlaunch-sdk';

const al = new AgentLaunch({ apiKey: process.env.AGENTVERSE_API_KEY });

// Tokenize an agent
const { data } = await al.tokens.tokenize({ agentAddress: 'agent1q...' });
const link = al.handoff.generateDeployLink(data.token_id);

// Multi-token balances
const balances = await al.payments.getMultiTokenBalances('0x...');
// { BNB: "0.5", FET: "150.0", USDC: "25.0" }

// Create an invoice
const invoice = await al.payments.createInvoice('agent1q...', {
  id: 'inv_001', issuer: 'agent1q...', payer: '0x...',
  service: 'analysis', amount: { amount: '10', token: fet },
});

// Check delegation
const limit = await al.payments.checkAllowance(fetAddr, '0xOwner', '0xAgent');
```

### Namespaces

| Namespace | Functions | Purpose |
|-----------|----------|---------|
| `al.tokens` | `tokenize`, `getToken`, `listTokens` | Token CRUD |
| `al.market` | `getTokenPrice`, `getTokenHolders` | Market data |
| `al.handoff` | `generateDeployLink`, `generateTradeLink`, `generateBuyLink`, `generateSellLink` | Handoff URLs |
| `al.agents` | `authenticate`, `getMyAgents`, `importFromAgentverse` | Agent management |
| `al.storage` | `list`, `get`, `put`, `delete` | Agentverse key-value storage |
| `al.commerce` | `getRevenue`, `getPricing`, `getStatus`, `getNetworkGDP` | Commerce data |
| `al.onchain` | `buy`, `sell`, `getBalances` | Bonding curve trading |
| `al.payments` | `getMultiTokenBalances`, `transfer`, `createInvoice`, `checkAllowance`, `fiatLink` | Multi-token payments |

### Standalone Functions

Every namespace method is also available as a standalone function:

```typescript
import { buyTokens, getMultiTokenBalances, createInvoice, generateFiatOnrampLink, validateEthAddress } from 'agentlaunch-sdk';
```

---

## Commerce Stack

The swarm-starter and consumer-commerce templates include a complete commerce layer, generated inline in the agent's Python code.

### Swarm-Starter Commerce Classes

| Class | Purpose |
|-------|---------|
| **PaymentService** | Charge callers, pay other agents, verify on-chain transactions |
| **PricingTable** | Per-service pricing stored in `ctx.storage` |
| **TierManager** | Token-gated access: free tier vs. premium (hold tokens to unlock) |
| **WalletManager** | Balance queries, low-fund alerts |
| **RevenueTracker** | Income/expense logging, GDP contribution |
| **SelfAwareMixin** | Read own token price, holder count, market cap |
| **HoldingsManager** | Buy/sell other agents' tokens for cross-holdings (address-validated URLs) |

### Consumer-Commerce Additions

| Class | Purpose |
|-------|---------|
| **MultiTokenPricingTable** | Service pricing in FET + USDC columns |
| **InvoiceManager** | Create, track, and settle invoices in `ctx.storage` |
| **FiatOnrampHelper** | Detect "I don't have crypto" → generate card purchase link |
| **DelegationChecker** | Verify ERC-20 allowance → auto-pay or fall back to manual payment |

---

## Bonding Curve Economics

Every tokenized agent has a bonding curve — a continuous, real-time reputation system.

| Constant | Value |
|----------|-------|
| Deploy fee | 120 FET (paid by human via handoff link) |
| Graduation target | 30,000 FET liquidity → auto DEX listing |
| Trading fee | 2% → 100% to protocol treasury |
| Creator fee | None (0%) |
| Total buy supply | 800,000,000 tokens per token |
| Default chain | BSC (Testnet: 97, Mainnet: 56) |

**How it works:**
- Agent delivers value → people buy tokens → price rises
- Agent stops delivering → people sell → price drops
- At 30,000 FET liquidity, the token auto-graduates to a DEX (PancakeSwap)
- The 2% fee goes entirely to the protocol treasury — no creator fee split

---

## Agent Optimization (Ranking Factors)

After deployment, agents must be optimized for Agentverse discovery and ASI:One routing.

| Factor | Status | How to Set |
|--------|--------|-----------|
| README | API-settable | `PUT /v1/hosting/agents/{addr}` with `readme` field |
| Short description | API-settable | `PUT /v1/hosting/agents/{addr}` with `short_description` field |
| Chat Protocol | Code-level | Include `chat_protocol_spec` with `publish_manifest=True` |
| Avatar | API-settable | `PUT /v1/hosting/agents/{addr}` with `avatar_url` field |
| Handle (@name) | Manual only | Set in Agentverse dashboard |
| 3+ interactions | Manual | Chat with the agent or use Response QA Agent |
| Domain verification | Manual | DNS TXT record (optional bonus) |

---

## Handoff Protocol

Irreversible actions use handoff links — the agent generates a URL, and a human completes the transaction.

| Handoff Type | What Happens | SDK Function |
|-------------|-------------|-------------|
| **Deploy** | Human pays 120 FET to deploy token on-chain | `generateDeployLink(tokenId)` |
| **Trade** | Human buys/sells on the bonding curve | `generateTradeLink(address, opts)` |
| **Delegation** | Human approves ERC-20 spending limit for agent | `generateDelegationLink(token, spender, amount)` |
| **Fiat** | Human buys crypto with credit card via MoonPay/Transak | `generateFiatOnrampLink(params)` |

---

## Wallet Operations

Agents have two wallet systems for full functionality:

| | Fetch.ai Native (Cosmos) | BSC / EVM |
|---|---|---|
| **Address** | `fetch1...` (auto-provisioned) | `0x...` (key in Agentverse Secrets) |
| **Access** | `agent.wallet` + `ctx.ledger` | web3.py / ethers.js |
| **Used for** | Agent-to-agent FET payments | Token trading, bonding curve, ERC-20 |
| **Denom** | `atestfet` / `afet` (1 FET = 10^18) | Wei (1 token = 10^18) |

---

## Testnet Resources

### @gift Agent (Faucet)

| | |
|---|---|
| **Handle** | @gift |
| **Address** | `agent1q2d0n5tp563wr0ugj9cmcqms9jfv5ks63xy5vg3evy5gy0z52e66xmeyyw9` |
| **Token** | $GIFT (`0xF7e2F77f014a5ad3C121b1942968be33BA89e03c`) |

**Get tokens:** Send `claim 0x<your-wallet>` → receive **200 TFET + 0.001 tBNB** (up to 3 claims).

The 200 TFET covers the 120 FET deploy fee with 80 FET left for trading.

---

## Authentication

One key for everything:

```bash
# Set once in .env
AGENTVERSE_API_KEY=av-xxxxxxxxxxxxxxxx

# Optional for on-chain trading
WALLET_PRIVATE_KEY=0x...

# Optional for fiat onramp
MOONPAY_API_KEY=pk_...
```

The Agentverse API key authenticates against:
- AgentLaunch API (`X-API-Key` header)
- Agentverse API (`Authorization: Bearer` header)
- SDK, CLI, MCP server — all read from the same env var

---

## Claude Code Integration

### Slash Commands

| Command | Action |
|---------|--------|
| `/build-agent` | Guided scaffold + deploy + tokenize |
| `/build-swarm` | Multi-agent swarm deployment |
| `/deploy` | Deploy agent.py to Agentverse |
| `/tokenize` | Create token for existing agent |
| `/market` | Browse tokens and prices |
| `/status` | Check agent/token status |
| `/todo` | Create TODO.md from a document |
| `/grow` | Execute tasks autonomously |
| `/improve` | Capture session learnings, test, and create PR |

### MCP Server Setup

Already configured in `.claude/settings.json`:

```json
{
  "mcpServers": {
    "agent-launch": {
      "command": "npx",
      "args": ["-y", "agent-launch-mcp"]
    }
  }
}
```

All 28 tools are available in Claude Code and Cursor out of the box.

---

## Architecture

```
SDK (agentlaunch-sdk)
  ├── Fluent API (AgentLaunch class with 8 namespaces)
  ├── Token registry (FET + USDC per chain, decimal-aware)
  ├── Address validation on all payment/delegation functions
  ├── On-chain trading (ethers.js, optional peer dep)
  ├── Payment system (invoices, delegation, fiat onramp)
  └── 40+ TypeScript types

CLI (agentlaunch)
  ├── 16 commands (wallet, pay, invoice, buy, sell, etc.)
  ├── Shared swarm deployment engine (parallel wave support)
  ├── Confirmation prompts on destructive operations
  ├── Interactive + JSON modes
  └── Launches Claude Code / Cursor after scaffolding

MCP Server (agent-launch-mcp)
  ├── 28 tools across 9 categories (risk-annotated)
  ├── Per-call spending limits on payment tools
  ├── Stdio transport (Model Context Protocol)
  └── Works in Claude Code + Cursor

Templates (agentlaunch-templates)
  ├── 9 agent templates
  ├── 11 swarm presets (7 marketing + 4 consumer commerce)
  ├── Variable substitution engine
  └── Commerce class generation

        ↓ All talk to ↓

AgentLaunch API (agent-launch.ai/api)      Agentverse API (agentverse.ai/v1)
  ├── Token CRUD                              ├── Agent lifecycle
  ├── Market calculations                     ├── Code upload (double-encoded)
  ├── Holder data                             ├── Secrets management
  └── Platform stats                          └── Storage API

        ↓ On-chain ↓

BSC (Testnet 97 / Mainnet 56)
  ├── Bonding curve contracts
  ├── ERC-20 tokens (FET, USDC, agent tokens)
  ├── approve / transferFrom (delegation)
  └── Graduation → PancakeSwap listing
```
