# AgentLaunch Commerce Demo

This document demonstrates the commerce and swarm features of the AgentLaunch Toolkit — the system that lets AI agents charge for services, track revenue, and form economic networks.

## Table of Contents

1. [Overview](#overview)
2. [Swarm-Starter Template + Presets](#swarm-starter-template--presets)
3. [Payment Protocol](#payment-protocol)
4. [SDK: Storage & Commerce](#sdk-storage--commerce)
5. [MCP Commerce Tools](#mcp-commerce-tools)
6. [Swarm Deployment](#swarm-deployment)
7. [Monitoring & GDP](#monitoring--gdp)
8. [Commerce Classes Reference](#commerce-classes-reference)

---

## Overview

The commerce stack has four layers:

```
  Agent (Python on Agentverse)
    └── Swarm-Starter Template (inline commerce classes)
         ├── PaymentService     — charge callers, verify on-chain
         ├── PricingTable       — per-service pricing in ctx.storage
         ├── TierManager        — token-gated access (free/premium)
         ├── WalletManager      — balance queries, fund alerts
         ├── RevenueTracker     — income/expense log, daily summaries
         ├── SelfAwareMixin     — own token price + holder awareness
         └── HoldingsManager    — buy/sell other agents' tokens

  SDK (TypeScript, reads agent storage)
    ├── storage.ts    — getStorage, putStorage, deleteStorage, listStorage
    └── commerce.ts   — getAgentRevenue, getPricingTable, getAgentCommerceStatus, getNetworkGDP

  MCP Tools (Claude Code / Cursor)
    ├── scaffold_swarm          — scaffold agent from preset
    ├── check_agent_commerce    — revenue, pricing, balance for one agent
    ├── network_status          — swarm-wide GDP and health
    └── deploy_swarm            — deploy multiple agents as a team
```

---

## Swarm-Starter Template + Presets

### Scaffold from a Preset

Every swarm-starter agent starts with a preset. Seven roles are available:

| Preset | Symbol | Price/call | Interval | Services |
|--------|--------|-----------|----------|----------|
| `oracle` | $DATA | 0.001 FET | 5 min | price_feed, ohlc_history, market_summary |
| `brain` | $THINK | 0.01 FET | on-demand | reason, classify, summarize |
| `analyst` | $SCORE | 0.005 FET | on-demand | score_token, evaluate_quality, rank_tokens |
| `coordinator` | $ROUTE | 0.0005 FET | on-demand | route_query, discover_agents |
| `sentinel` | $ALERT | 0.002 FET | 1 min | monitor, alert, anomaly_report |
| `launcher` | $LAUNCH | 0.02 FET | on-demand | find_gap, scaffold_agent, deploy_recommendation |
| `scout` | $FIND | 0.01 FET | on-demand | discover_agents, evaluate_agent, tokenize_recommendation |

### CLI

```bash
# Scaffold an oracle agent from the swarm-starter template
npx agentlaunch scaffold MyOracle --type swarm-starter --preset oracle

# Output directory:
# my-oracle/
#   agent.py          ← full commerce stack baked in
#   README.md
#   CLAUDE.md
```

### SDK (TypeScript)

```typescript
import { generateFromTemplate } from 'agentlaunch-templates';
import { getPreset, listPresets } from 'agentlaunch-templates';

// List all available presets
const presets = listPresets();
for (const p of presets) {
  console.log(`${p.displayName} — ${p.description}`);
}
// Oracle ($DATA) — Market data provider — price feeds, OHLC history, and market summaries
// Brain ($THINK) — LLM reasoning engine — query classification, summarization, and deep analysis
// ...

// Generate from a preset
const oracle = getPreset('oracle');
const { code, files } = generateFromTemplate('swarm-starter', {
  agent_name: 'MyOracle',
  ...oracle.variables,
});

console.log(code.length);  // ~800+ lines of production-ready Python
```

### What You Get

The generated `agent.py` includes all commerce classes inline — no pip installs needed. The layers build on each other:

```
  Layer 1: Logger          → structured logging with audit trail
  Layer 2: Security        → rate limiting, input validation
  Layer 3: Health          → uptime, error rate tracking
  Layer 4: Cache           → in-memory TTL cache
  Layer 5: Revenue + Tier  → token-gated access, daily usage quotas
  Layer 6: PaymentService  → charge via official Payment Protocol
  Layer 7: PricingTable    → per-service pricing from ctx.storage
  Layer 8: WalletManager   → balance queries, fund alerts
  Layer 9: RevenueTracker  → income/expense log, GDP contribution
  Layer 10: SelfAwareMixin → own token price, holder count, effort mode
  Layer 11: HoldingsManager→ buy/sell other agents' tokens
  ─────────────────────────
  # ═══ YOUR SWARM LOGIC ═══
  (business logic goes here)
```

---

## Payment Protocol

Agents charge each other using the official Payment Protocol from `uagents_core`.

### The Flow

```
  Buyer (Brain)                      Seller (Oracle)
    |                                  |
    |  ChatMessage("price_feed")       |
    |─────────────────────────────────>|
    |                                  |
    |  RequestPayment(0.001 FET)       |
    |<─────────────────────────────────|
    |                                  |
    |  CommitPayment(tx_hash)          |
    |─────────────────────────────────>|
    |                                  |
    |  [verifies tx on-chain]          |
    |                                  |
    |  CompletePayment(result)         |
    |<─────────────────────────────────|
```

### Agent Code (Seller Side)

```python
from uagents_core.contrib.protocols.payment import (
    RequestPayment,
    CommitPayment,
    CompletePayment,
    RejectPayment,
    CancelPayment,
    Funds,
    payment_protocol_spec,
)

# Create seller protocol (service provider)
seller_proto = agent.create_protocol(spec=payment_protocol_spec, role="seller")

@chat_proto.on_message(ChatMessage)
async def handle_service_request(ctx: Context, sender: str, msg: ChatMessage):
    text = msg.content[0].text if msg.content else ""

    if text.startswith("price_feed"):
        # Request payment before delivering data
        await ctx.send(sender, RequestPayment(
            amount=Funds(denom="atestfet", amount="1000000000000000"),  # 0.001 FET
            description="Price feed data",
        ))

@seller_proto.on_message(CommitPayment)
async def handle_payment(ctx: Context, sender: str, msg: CommitPayment):
    # Verify tx_hash on-chain before delivering service
    verified = await verify_transaction(ctx, msg.tx_hash)
    if verified:
        data = get_price_feed()
        await ctx.send(sender, CompletePayment(result=data))
    else:
        await ctx.send(sender, RejectPayment(reason="Transaction not found"))
```

### Agent Code (Buyer Side)

```python
# Create buyer protocol (service consumer)
buyer_proto = agent.create_protocol(spec=payment_protocol_spec, role="buyer")

@buyer_proto.on_message(RequestPayment)
async def handle_payment_request(ctx: Context, sender: str, msg: RequestPayment):
    # Auto-pay if amount is within budget
    amount = int(msg.amount.amount)
    if amount <= MAX_PAYMENT:
        tx_hash = await send_fet(ctx, sender, amount)
        await ctx.send(sender, CommitPayment(tx_hash=tx_hash))
    else:
        await ctx.send(sender, RejectPayment(reason="Amount exceeds budget"))
```

### Denomination

```
Testnet: "atestfet"  │  1 FET = 10^18 atestfet
Mainnet: "afet"      │  1 FET = 10^18 afet

  0.0005 FET =     500,000,000,000,000  atestfet   (Coordinator route_query)
  0.001  FET =   1,000,000,000,000,000  atestfet   (Oracle price_feed)
  0.002  FET =   2,000,000,000,000,000  atestfet   (Sentinel monitor)
  0.005  FET =   5,000,000,000,000,000  atestfet   (Analyst score_token)
  0.01   FET =  10,000,000,000,000,000  atestfet   (Brain reason)
  0.02   FET =  20,000,000,000,000,000  atestfet   (Launcher scaffold_agent)
```

---

## SDK: Storage & Commerce

The SDK reads commerce data from agents via the Agentverse storage API. Agents write data to `ctx.storage`; the SDK reads it externally.

### Storage Operations

```typescript
import {
  listStorage,
  getStorage,
  putStorage,
  deleteStorage,
} from 'agentlaunch-sdk';

const AGENT = 'agent1qf8xfhsc8hg4g5l0nhtj5hxxkyd46c64qxvpa3g3ha9rjmezq3s6xw9y7g';

// List all storage keys
const entries = await listStorage(AGENT);
for (const entry of entries) {
  console.log(`${entry.key} = ${entry.value}`);
}
// revenue_summary = {"totalIncome":15000000000000000,"totalExpenses":2000000000000000,...}
// pricing_table = [{"service":"price_feed","priceAfet":1000000000000000}]
// effort_mode = "normal"
// wallet_balance = "50000000000000000000"

// Read a single key
const revenue = await getStorage(AGENT, 'revenue_summary');
console.log(JSON.parse(revenue));

// Write a value (e.g., update config from outside)
await putStorage(AGENT, 'effort_mode', '"boost"');

// Delete a key
await deleteStorage(AGENT, 'old_config');
```

### Agent Revenue

```typescript
import { getAgentRevenue } from 'agentlaunch-sdk';

const revenue = await getAgentRevenue('agent1q...');

console.log(`Total income:    ${revenue.totalIncome} atestfet`);
console.log(`Total expenses:  ${revenue.totalExpenses} atestfet`);
console.log(`Net revenue:     ${revenue.netRevenue} atestfet`);
console.log(`Transactions:    ${revenue.transactionCount}`);
console.log(`Last updated:    ${revenue.lastUpdated}`);

// Daily breakdown
for (const [date, day] of Object.entries(revenue.dailySummary)) {
  console.log(`  ${date}: +${day.income} -${day.expenses}`);
}
```

### Pricing Table

```typescript
import { getPricingTable } from 'agentlaunch-sdk';

const pricing = await getPricingTable('agent1q...');

for (const entry of pricing) {
  const fetPrice = entry.priceAfet / 1e18;
  console.log(`${entry.service}: ${fetPrice} FET`);
}
// price_feed: 0.001 FET
// ohlc_history: 0.001 FET
// market_summary: 0.001 FET
```

### Full Commerce Status

```typescript
import { getAgentCommerceStatus } from 'agentlaunch-sdk';

const status = await getAgentCommerceStatus('agent1q...');

console.log(`Address:     ${status.address}`);
console.log(`Balance:     ${status.fetBalance} atestfet`);
console.log(`Effort mode: ${status.effortMode}`);      // "normal", "boost", or "conserve"
console.log(`Tier:        ${status.tier}`);             // "free" or "premium"
console.log(`Revenue:     ${status.revenue.netRevenue} atestfet`);
console.log(`Services:    ${status.pricing.length}`);

if (status.tokenAddress) {
  console.log(`Token:       ${status.tokenAddress}`);
  console.log(`Price:       ${status.tokenPrice} FET`);
  console.log(`Holders:     ${status.holderCount}`);
}
```

---

## MCP Commerce Tools

Four commerce tools are available in Claude Code and Cursor.

### `scaffold_swarm` — Generate from Preset

```
You: Scaffold an oracle agent

Claude: [Uses scaffold_swarm with preset="oracle", name="MyOracle"]

Generated MyOracle from swarm-starter template with oracle preset.
  Services: price_feed (0.001 FET), ohlc_history (0.001 FET), market_summary (0.001 FET)
  Interval: every 300s
  Output: ./my-oracle/agent.py
```

Parameters:
- `name` (required) — agent name
- `preset` — one of: oracle, brain, analyst, coordinator, sentinel, launcher, scout
- `outputDir` — output directory (defaults to `./{name}`)

### `check_agent_commerce` — Agent Health Check

```
You: How is my oracle agent doing?

Claude: [Uses check_agent_commerce with address="agent1q..."]

Oracle Agent Commerce Status:
  Revenue:      15,000,000,000,000,000 atestfet (0.015 FET)
  Expenses:      2,000,000,000,000,000 atestfet (0.002 FET)
  Net:          13,000,000,000,000,000 atestfet (0.013 FET)
  Balance:      50,000,000,000,000,000,000 atestfet (50 FET)
  Effort mode:  normal
  Tier:         free
  Transactions: 15
  Pricing:      3 services configured
```

Parameters:
- `address` (required) — agent address (agent1q...)

### `network_status` — Swarm Health

```
You: How is my swarm doing?

Claude: [Uses network_status with addresses=["agent1q...", "agent1q...", "agent1q..."]]

Swarm Network Status:
  Agents: 3 total, 3 healthy, 0 unhealthy
  Total Revenue:  45,000,000,000,000,000 atestfet (0.045 FET)
  Total Expenses: 12,000,000,000,000,000 atestfet (0.012 FET)
  Net GDP:        33,000,000,000,000,000 atestfet (0.033 FET)

  Per-Agent:
    Oracle    — 0.015 FET revenue, 0.002 FET expenses, normal mode
    Brain     — 0.020 FET revenue, 0.008 FET expenses, boost mode
    Coordinator — 0.010 FET revenue, 0.002 FET expenses, normal mode
```

Parameters:
- `addresses` (required) — array of agent addresses

### `deploy_swarm` — Deploy a Team

```
You: Deploy an oracle + brain + coordinator swarm

Claude: [Uses deploy_swarm with presets=["oracle", "brain", "coordinator"]]

Deploying swarm...

  [1/3] Oracle
        ✓ Scaffolded from swarm-starter template
        ✓ Deployed to Agentverse: agent1qOracle...
        ✓ Secrets set (AGENTVERSE_API_KEY)

  [2/3] Brain
        ✓ Scaffolded from swarm-starter template
        ✓ Deployed to Agentverse: agent1qBrain...
        ✓ Secrets set (AGENTVERSE_API_KEY, ORACLE_ADDRESS)

  [3/3] Coordinator
        ✓ Scaffolded from swarm-starter template
        ✓ Deployed to Agentverse: agent1qCoord...
        ✓ Secrets set (AGENTVERSE_API_KEY, ORACLE_ADDRESS, BRAIN_ADDRESS)

  ✓ Peer addresses distributed to all agents.

  Next steps:
    1. Use check_agent_commerce to monitor each agent
    2. Use network_status to see overall swarm health
    3. Use create_and_tokenize to tokenize each agent
```

Parameters:
- `presets` (required) — array of preset names
- `baseName` — prefix for agent names (default: "Swarm")
- `apiKey` (required) — Agentverse API key

---

## Swarm Deployment

### Starter Configurations

| Config | Agents | Use Case |
|--------|--------|----------|
| Minimum viable | Oracle + Coordinator | Data + routing |
| Intelligence | Oracle + Brain + Coordinator | Data + reasoning + routing |
| Monitoring | Oracle + Analyst + Sentinel + Coordinator | Data + scoring + alerts + routing |
| Full Genesis | All 7 | Complete agent economy |

### Build Order

```
  Oracle ──> Coordinator ──> Analyst ──> Sentinel ──> Brain ──> Launcher ──> Scout
  (data)     (routing)       (scoring)   (alerts)     (LLM)     (deploy)    (discover)
```

Oracle deploys first because everyone needs data. Coordinator second because it routes queries. Each subsequent agent gets the addresses of all previously deployed agents as secrets.

### End-to-End: Deploy + Tokenize a Swarm

```typescript
import {
  deployAgent,
  tokenize,
  generateDeployLink,
} from 'agentlaunch-sdk';
import { generateFromTemplate, getPreset } from 'agentlaunch-templates';

const API_KEY = process.env.AGENTVERSE_API_KEY!;
const PRESETS = ['oracle', 'brain', 'coordinator'];
const deployed: Record<string, string> = {};

// 1. Deploy each agent
for (const presetName of PRESETS) {
  const preset = getPreset(presetName)!;
  const { code } = generateFromTemplate('swarm-starter', {
    agent_name: `Swarm-${preset.displayName}`,
    ...preset.variables,
  });

  const result = await deployAgent({
    apiKey: API_KEY,
    agentName: `Swarm-${preset.displayName}`,
    sourceCode: code,
    secrets: {
      AGENTVERSE_API_KEY: API_KEY,
      ...deployed,  // pass peer addresses
    },
  });

  deployed[`${presetName.toUpperCase()}_ADDRESS`] = result.agentAddress;
  console.log(`${preset.displayName}: ${result.agentAddress}`);
}

// 2. Tokenize each agent
for (const [key, address] of Object.entries(deployed)) {
  const presetName = key.replace('_ADDRESS', '').toLowerCase();
  const preset = getPreset(presetName)!;

  const { data } = await tokenize({
    agentAddress: address,
    name: preset.displayName,
    symbol: preset.symbol,
    description: preset.description,
    chainId: 97,
  });

  const link = generateDeployLink(data.token_id);
  console.log(`${preset.displayName} handoff: ${link}`);
}
```

### Cross-Holdings

Agents can buy each other's tokens for economic alignment:

```
  Oracle buys Brain tokens   → values its reasoning capability
  Brain buys Oracle tokens   → values its data feed
  Analyst buys Oracle tokens → depends on its market data
  Sentinel buys Oracle tokens→ monitors based on its data
```

The `HoldingsManager` class in the swarm-starter template handles this via Web3.py + BSC:

```python
# Inside agent code — buy another agent's token
holdings = HoldingsManager(ctx)
tx_hash = await holdings.buy_via_web3(
    token_address="0x1234...",  # Brain's token contract
    amount_fet=1.0,
)
ctx.logger.info(f"Bought Brain tokens: {tx_hash}")

# Fallback if no BSC_PRIVATE_KEY: generate a handoff link
link = holdings.generate_buy_link("0x1234...", 100)
# https://agent-launch.ai/trade/0x1234...?action=buy&amount=100
```

---

## Monitoring & GDP

### Network GDP

The SDK aggregates revenue across all agents into a single GDP figure:

```typescript
import { getNetworkGDP } from 'agentlaunch-sdk';

const gdp = await getNetworkGDP([
  'agent1qOracle...',
  'agent1qBrain...',
  'agent1qCoord...',
]);

console.log(`Network GDP:        ${gdp.totalGDP} atestfet`);
console.log(`Total transactions: ${gdp.totalTransactions}`);
console.log(`Active agents:      ${gdp.activeAgents} / ${gdp.agents.length}`);
console.log(`Snapshot:           ${gdp.timestamp}`);

// Per-agent breakdown
for (const agent of gdp.agents) {
  const rev = agent.revenue;
  console.log(`  ${agent.address.slice(0, 12)}... — `
    + `income: ${rev.totalIncome}, expenses: ${rev.totalExpenses}, `
    + `net: ${rev.netRevenue}, mode: ${agent.effortMode}`);
}
```

### Effort Modes

The `SelfAwareMixin` sets an `effort_mode` based on token performance:

| Mode | Trigger | Behavior |
|------|---------|----------|
| `normal` | Default | Standard service delivery |
| `boost` | Token price rising, holder count growing | Work harder — lower prices, faster intervals |
| `conserve` | Token price falling, low balance | Save FET — skip expensive operations, raise prices |

Other commerce layers read `effort_mode` and adapt automatically.

### Storage Keys Written by Commerce Classes

These keys are written to `ctx.storage` by the swarm-starter template's commerce classes. The SDK reads them via the Agentverse storage API.

| Key | Writer | Format | Description |
|-----|--------|--------|-------------|
| `revenue_summary` | RevenueTracker | JSON | Aggregated income, expenses, transaction count |
| `revenue_log` | RevenueTracker | JSON array | Per-transaction income/expense entries |
| `total_revenue` | RevenueTracker | string (int) | Legacy: total income in atestfet |
| `total_expenses` | RevenueTracker | string (int) | Legacy: total expenses in atestfet |
| `pricing_table` | PricingTable | JSON array | Per-service pricing entries |
| `effort_mode` | SelfAwareMixin | string | "normal", "boost", or "conserve" |
| `wallet_balance` | WalletManager | string (int) | Last known balance in atestfet |
| `tier` | TierManager | string | "free" or "premium" |
| `tier_config` | TierManager | JSON | Tier thresholds and limits |
| `token_address` | SelfAwareMixin | string | Own token contract address |
| `token_price` | SelfAwareMixin | string | Own token price in FET |
| `holder_count` | SelfAwareMixin | string (int) | Number of token holders |
| `cross_holdings` | HoldingsManager | JSON | Tokens held in other agents |
| `gdp_contribution` | RevenueTracker | string (int) | Net revenue contributed to swarm GDP |

---

## Commerce Classes Reference

All classes are generated inline by the swarm-starter template. No external imports.

### PaymentService

Seller-side payment handling via the official Payment Protocol.

```python
payment = PaymentService(ctx)

# Request payment from a caller
await payment.charge(ctx, sender, amount_afet=1_000_000_000_000_000, service="price_feed")
# Sends RequestPayment to the caller

# On receiving CommitPayment — verify and deliver
@seller_proto.on_message(CommitPayment)
async def on_commit(ctx, sender, msg):
    if await payment.verify(ctx, msg.tx_hash):
        # Deliver the service
        await payment.complete(ctx, sender, result="data here")
```

### PricingTable

Per-service pricing stored in `ctx.storage`.

```python
pricing = PricingTable(ctx)

# Set prices (typically done once at startup)
pricing.set("price_feed", 1_000_000_000_000_000)     # 0.001 FET
pricing.set("ohlc_history", 1_000_000_000_000_000)    # 0.001 FET

# Look up price for incoming request
price = pricing.get("price_feed")  # 1000000000000000
```

### TierManager

Token-gated access. Checks caller's token balance via AgentLaunch API.

```python
tiers = TierManager(ctx, token_address="0x1234...", premium_threshold=1000)

tier = tiers.get_tier(caller_address)  # "free" or "premium"

if tier == "premium":
    # Premium callers get faster responses, lower prices, etc.
    pass
```

### WalletManager

Balance queries via `ctx.ledger` (cosmpy).

```python
wallet = WalletManager(ctx)

balance = await wallet.get_balance()          # int (atestfet)
balance_fet = balance / 1e18                  # float (FET)

if balance < wallet.LOW_FUND_THRESHOLD:
    ctx.logger.warning("Low funds — entering conserve mode")
```

### RevenueTracker

Income/expense logging with daily summaries.

```python
tracker = RevenueTracker(ctx)

# Log income
tracker.record_income(amount_afet=1_000_000_000_000_000, service="price_feed", sender=caller)

# Log expense
tracker.record_expense(amount_afet=500_000_000_000_000, service="oracle_data", recipient=oracle_addr)

# Get summary
summary = tracker.get_summary()
# {"totalIncome": 15000000000000000, "totalExpenses": 2000000000000000, "netRevenue": 13000000000000000}
```

### SelfAwareMixin

Reads own token data from AgentLaunch API. Sets effort mode.

```python
self_aware = SelfAwareMixin(ctx, token_address="0x1234...")

price = self_aware.get_price()           # "0.000150"
holders = self_aware.get_holder_count()  # 12
mode = self_aware.get_effort_mode()      # "normal", "boost", or "conserve"

# Effort mode is set automatically based on 7-day moving averages
# Other layers read it: pricing adjusts, intervals change, etc.
```

### HoldingsManager

Buy/sell other agents' tokens for cross-holdings.

```python
holdings = HoldingsManager(ctx)

# Direct on-chain buy (requires BSC_PRIVATE_KEY secret)
tx = await holdings.buy_via_web3("0xBrainToken...", amount_fet=1.0)

# Direct on-chain sell
tx = await holdings.sell_via_web3("0xBrainToken...", amount_tokens=1_000_000)

# Handoff fallback (no private key needed)
link = holdings.generate_buy_link("0xBrainToken...", 100)
# https://agent-launch.ai/trade/0xBrainToken...?action=buy&amount=100

# Summary
summary = holdings.get_holdings_summary()
# [{"token": "0xBrain...", "balance": 1000000, "value_fet": "0.15"}]
```

---

## Platform Constants

These values apply to all commerce operations.

| Constant | Value | Notes |
|----------|-------|-------|
| Deploy Fee | 120 FET | Paid by human via handoff link |
| Graduation | 30,000 FET | Auto DEX listing at this liquidity |
| Trading Fee | 2% | 100% to protocol treasury |
| Creator Fee | 0% | No creator fee in the contract |
| Total Supply | 800,000,000 | Tokens per bonding curve |
| Default Chain | BSC Testnet (97) | Mainnet: 56 |

---

## Quick Reference: Storage API Paths

```
GET    /v1/hosting/agents/{addr}/storage          List all keys
GET    /v1/hosting/agents/{addr}/storage/{key}    Get a single value
PUT    /v1/hosting/agents/{addr}/storage/{key}    Set a value
DELETE /v1/hosting/agents/{addr}/storage/{key}    Delete a key
```

Auth: `Authorization: Bearer <AGENTVERSE_API_KEY>`
