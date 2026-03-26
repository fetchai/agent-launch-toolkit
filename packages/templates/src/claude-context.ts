/**
 * claude-context.ts — Complete Claude Code context for scaffolded projects
 *
 * Everything a third-party developer needs to create, deploy, and tokenize
 * agents on the AgentLaunch platform with Claude Code assistance.
 */

// ---------------------------------------------------------------------------
// Rules — Claude's coding guidelines
// ---------------------------------------------------------------------------

export const RULES: Record<string, string> = {
  "agentlaunch.md": `# AgentLaunch Platform Rules

When working with AgentLaunch tokens and the platform API:

## Constants (from smart contracts -- never change)

- Deploy fee: 120 FET (read from contract, can change via multi-sig)
- Graduation: 30,000 FET liquidity -> auto DEX listing
- Trading fee: 2% -> 100% to REVENUE_ACCOUNT (protocol treasury)
- NO creator fee. The 2% fee has NO split. All to protocol.
- Total buy supply: 800,000,000 tokens per token
- Buy price difference: 1000 (10x)
- Default chain: BSC (testnet=97, mainnet=56)

## API Authentication

- Use \`X-API-Key\` header with Agentverse API key
- Key is read from \`.env\` AGENTVERSE_API_KEY
- No wallet signatures needed for API calls
- Redis caches validation for 5 minutes

## API Base URLs

- Production (default): \`https://agent-launch.ai/api\`
- Dev: \`https://launchpad-backend-dev-1056182620041.us-central1.run.app\`
- Set \`AGENT_LAUNCH_ENV=dev\` to use dev URLs
- Direct override: set \`AGENT_LAUNCH_API_URL\`

## Wallet & Key Management

- Agents have auto-provisioned Fetch.ai wallets (\`fetch1...\`) via \`agent.wallet\`
- For BSC/EVM operations, agents store private keys via Agentverse Secrets API
- Handoff links are used for irreversible actions (token deployment, 120 FET)
- Autonomous trading uses agent-held keys for routine operations
- Deploy link: \`https://agent-launch.ai/deploy/{tokenId}\`
- Trade link: \`https://agent-launch.ai/trade/{tokenAddress}?action=buy&amount=100\`

### Wallet Access (Runtime-Verified)

- \`ctx.wallet\` **DOES NOT EXIST** — never use it
- \`agent.wallet\` **EXISTS** — \`cosmpy.aerial.wallet.LocalWallet\`
- \`ctx.ledger\` **EXISTS** — \`cosmpy.aerial.client.LedgerClient\`
- Balance query: \`ctx.ledger.query_bank_balance(str(agent.wallet.address()), "atestfet")\`

## Key Endpoints (VERIFIED - always use these exact paths)

\`\`\`
GET   /tokens                             List tokens
GET   /tokens/address/{address}           Token details by address
GET   /tokens/id/{id}                     Token details by ID
GET   /tokens/calculate-buy               Preview buy
GET   /tokens/calculate-sell              Preview sell

POST  /agents/tokenize                    Create token -> handoff link
GET   /agents/my-agents                   List your agents
GET   /agents/token/{address}/holders     Token holder list
POST  /agents/auth                        Exchange API key for JWT

GET   /comments/{address}                 Get comments
POST  /comments/{address}                 Post comment

GET   /platform/stats                     Platform stats
\`\`\`

## Common Path Mistakes (NEVER use these)

| WRONG | CORRECT |
|-------|---------|
| \`POST /tokenize\` | \`POST /agents/tokenize\` |
| \`GET /token/{address}\` | \`GET /tokens/address/{address}\` |
| \`GET /token/{address}/holders\` | \`GET /agents/token/{address}/holders\` |
| \`GET /my-agents\` | \`GET /agents/my-agents\` |
| \`POST /auth\` | \`POST /agents/auth\` |

## Fee Rule (Enforced)

The 2% trading fee goes 100% to REVENUE_ACCOUNT (protocol treasury).
There is NO creator fee split. Never write "1% creator", "split evenly",
"creator earnings from fees", or any CREATOR_FEE constant.
This applies to ALL files: code, docs, comments, marketing copy.

## Token Lifecycle

1. Agent calls POST /agents/tokenize with agentAddress, name, symbol, description, chainId
2. API returns token record with handoff link
3. Human visits link, connects wallet, signs transaction (pays 120 FET)
4. Token deploys on-chain with bonding curve
5. At 30,000 FET liquidity, auto-lists on DEX (Uniswap/PancakeSwap)`,
  "agentverse.md": `# Agentverse Deployment Rules

When deploying agents to Agentverse:

## API Base URL

\`\`\`
https://agentverse.ai/v1
\`\`\`

## Auth Header

\`\`\`
Authorization: Bearer <AGENTVERSE_API_KEY>
\`\`\`

Note: Capital "Bearer", followed by space, then the raw API key.

## CRITICAL: Code Upload Format

The code field MUST be double-encoded JSON:

\`\`\`python
code_array = [{"language": "python", "name": "agent.py", "value": source_code}]
payload = {"code": json.dumps(code_array)}
\`\`\`

Sending the raw array (not json.dumps'd) causes: "Invalid code format"

## Agent Code Requirements

- Use \`Agent()\` with zero params (Agentverse provides config)
- Use Chat Protocol v0.3.0 from \`uagents_core.contrib.protocols.chat\`
- Must have \`@chat_proto.on_message(ChatAcknowledgement)\` handler
- Use \`ctx.logger\`, never \`print()\`
- Use \`datetime.now()\` not \`datetime.utcnow()\` (deprecated)
- End sessions with \`EndSessionContent\`
- Include \`publish_manifest=True\` in \`agent.include()\`

## Deployment Flow

1. \`POST /v1/hosting/agents\` -- creates agent, returns address
2. \`PUT /v1/hosting/agents/{addr}/code\` -- upload (double-encoded!)
3. \`POST /v1/hosting/secrets\` -- set AGENTVERSE_API_KEY etc.
4. \`POST /v1/hosting/agents/{addr}/start\` -- start agent
5. \`GET /v1/hosting/agents/{addr}\` -- poll until compiled=true (15-60s)
6. \`GET /v1/hosting/agents/{addr}/logs\` -- verify running

## Common Errors

- "Invalid code format" -- code field not json.dumps'd
- Agent stuck in "compiling" -- wait longer, check logs for syntax errors
- 401 Unauthorized -- bad API key or missing "bearer" prefix
- Agent listing response is \`{ items: [...] }\` not \`{ agents: [...] }\`

## Available Packages on Agentverse

- \`uagents\`, \`uagents_core\`
- \`requests\`, \`openai\`
- Python standard library

## Secrets

Set secrets via POST /v1/hosting/secrets:
\`\`\`json
{
  "address": "agent1q...",
  "name": "AGENTVERSE_API_KEY",
  "secret": "av-xxx"
}
\`\`\`

List secrets: GET /v1/hosting/secrets?address=agent1q...`,
  "api-design.md": `---
paths:
  - "packages/sdk/src/**/*.ts"
  - "packages/cli/src/**/*.ts"
  - "packages/mcp/src/**/*.ts"
---

# API Design Rules

## Endpoints
- GET /api/{resource} - List
- POST /api/{resource} - Create
- GET /api/{resource}/:id - Read
- PUT /api/{resource}/:id - Update
- DELETE /api/{resource}/:id - Delete

## Response Format
{
  "success": boolean,
  "data": object | array,
  "error": null | { "code": string, "message": string }
}

## Status Codes
- 200: Success
- 201: Created
- 400: Bad Request (validation)
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error

## Pagination
- Query: ?page=1&limit=20
- Response meta: { page, limit, total, totalPages }`,
  "api-paths.md": `# API Paths Reference (VERIFIED)

These paths have been tested against the live API and are the ONLY correct paths.
When writing code, tests, or documentation, ALWAYS use these exact paths.

## Base URL

\`\`\`
https://agent-launch.ai/api
\`\`\`

## Verified Endpoints

### Tokens

| Method | Path | Description |
|--------|------|-------------|
| \`GET\` | \`/tokens\` | List all tokens |
| \`GET\` | \`/tokens/address/{address}\` | Get token by contract address |
| \`GET\` | \`/tokens/id/{id}\` | Get token by numeric ID |
| \`GET\` | \`/tokens/calculate-buy\` | Simulate buy (params: address, fetAmount) |
| \`GET\` | \`/tokens/calculate-sell\` | Simulate sell (params: address, tokenAmount) |

### Agents

| Method | Path | Description |
|--------|------|-------------|
| \`POST\` | \`/agents/tokenize\` | Create token for an agent |
| \`GET\` | \`/agents/my-agents\` | List caller's Agentverse agents |
| \`GET\` | \`/agents/token/{address}/holders\` | Get token holder list |
| \`POST\` | \`/agents/auth\` | Exchange API key for JWT |

### Comments

| Method | Path | Description |
|--------|------|-------------|
| \`GET\` | \`/comments/{address}\` | Get comments for a token |
| \`POST\` | \`/comments/{address}\` | Post a comment |

### Platform

| Method | Path | Description |
|--------|------|-------------|
| \`GET\` | \`/platform/stats\` | Platform-wide statistics |

## WRONG vs CORRECT Paths

These mistakes are common. NEVER use the wrong paths:

| WRONG (will 404) | CORRECT |
|------------------|---------|
| \`POST /tokenize\` | \`POST /agents/tokenize\` |
| \`GET /token/{address}\` | \`GET /tokens/address/{address}\` |
| \`GET /tokens/{address}\` | \`GET /tokens/address/{address}\` |
| \`GET /tokens/{id}\` | \`GET /tokens/id/{id}\` |
| \`GET /token/{address}/holders\` | \`GET /agents/token/{address}/holders\` |
| \`GET /my-agents\` | \`GET /agents/my-agents\` |
| \`POST /auth\` | \`POST /agents/auth\` |
| \`GET /stats\` | \`GET /platform/stats\` |

## SDK Function to Path Mapping

| SDK Function | Correct Path |
|--------------|--------------|
| \`listTokens()\` | \`GET /tokens\` |
| \`getToken(address)\` | \`GET /tokens/address/{address}\` |
| \`tokenize(params)\` | \`POST /agents/tokenize\` |
| \`calculateBuy(address, amount)\` | \`GET /tokens/calculate-buy\` |
| \`calculateSell(address, amount)\` | \`GET /tokens/calculate-sell\` |
| \`getTokenHolders(address)\` | \`GET /agents/token/{address}/holders\` |
| \`getComments(address)\` | \`GET /comments/{address}\` |
| \`postComment(params)\` | \`POST /comments/{address}\` |
| \`authenticate(key)\` | \`POST /agents/auth\` |
| \`getMyAgents()\` | \`GET /agents/my-agents\` |
| \`getPlatformStats()\` | \`GET /platform/stats\` |

## Enforcement

When reviewing or writing code that makes API calls:
1. Check that the path matches this reference
2. If you see an old/wrong path, fix it immediately
3. Reference \`docs/paths.md\` for full documentation with examples`,
  "consumer-payments.md": `# Consumer Payments Rules

## Multi-Token Support

The toolkit supports FET and USDC on BSC (Testnet chain 97, Mainnet chain 56).

### Known Token Addresses

| Token | Chain | Address |
|-------|-------|---------|
| FET | BSC Testnet (97) | \`0x304ddf3eE068c53514f782e2341B71A80c8aE3C7\` |
| FET | BSC Mainnet (56) | \`0xBd5df99ABe0E2b1e86BE5eC0039d1e24de28Fe87\` |
| USDC | BSC Testnet (97) | \`0x64544969ed7EBf5f083679233325356EbE738930\` |
| USDC | BSC Mainnet (56) | \`0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d\` |

### Token Registry

Use \`getToken(symbol, chainId)\` to look up tokens. Never hardcode addresses.

\`\`\`typescript
import { getToken, KNOWN_TOKENS } from 'agentlaunch-sdk';
const fet = getToken('FET', 97);   // PaymentToken object
const usdc = getToken('USDC', 97); // PaymentToken object
\`\`\`

## Spending Delegation

Uses standard ERC-20 \`approve()\` / \`transferFrom()\` — no custom contracts.

### Flow

1. Agent generates delegation handoff link → sends to human
2. Human opens link, connects wallet, signs \`approve()\` transaction
3. Agent checks allowance on-chain with \`checkAllowance()\`
4. Agent spends from delegation with \`spendFromDelegation()\` (calls \`transferFrom\`)

### SDK Functions

\`\`\`typescript
import { checkAllowance, spendFromDelegation, createSpendingLimitHandoff } from 'agentlaunch-sdk';

// Generate link for human to approve
const link = createSpendingLimitHandoff({ tokenSymbol: 'FET', amount: '100' }, agentWallet);

// Check on-chain allowance
const limit = await checkAllowance(tokenAddress, ownerAddress, spenderAddress, 97);

// Spend from delegation
const result = await spendFromDelegation(tokenAddress, owner, recipient, '10');
\`\`\`

## Invoices

Invoices are stored in Agentverse agent storage (consistent with existing revenue/pricing patterns).

### Storage Keys

- \`invoice_{id}\` — Individual invoice JSON
- \`invoice_index\` — Array of invoice IDs

### Invoice Lifecycle

\`pending\` → \`paid\` → (done)
\`pending\` → \`expired\`
\`paid\` → \`refunded\`
\`paid\` → \`disputed\`

### SDK Functions

\`\`\`typescript
import { createInvoice, getInvoice, listInvoices, updateInvoiceStatus } from 'agentlaunch-sdk';

const inv = await createInvoice(agentAddress, { id, issuer, payer, service, amount });
const invoices = await listInvoices(agentAddress, 'pending');
await updateInvoiceStatus(agentAddress, invoiceId, 'paid', txHash);
\`\`\`

## Fiat Onramp

Fiat is handoff-only — generate URLs to MoonPay/Transak, never process fiat directly.

### Supported Providers

| Provider | Env Var | URL |
|----------|---------|-----|
| MoonPay | \`MOONPAY_API_KEY\` | \`https://buy.moonpay.com\` |
| Transak | \`TRANSAK_API_KEY\` | \`https://global.transak.com\` |

### SDK Function

\`\`\`typescript
import { generateFiatOnrampLink } from 'agentlaunch-sdk';

const link = generateFiatOnrampLink({
  fiatAmount: '50',
  fiatCurrency: 'USD',
  cryptoToken: 'FET',
  walletAddress: '0x...',
  provider: 'moonpay',
});
// Returns { provider, url }
\`\`\`

## Consumer Commerce Template

The \`consumer-commerce\` template generates agents with:
- MultiTokenPricingTable — FET + USDC columns
- InvoiceManager — CRUD in ctx.storage
- FiatOnrampHelper — card purchase link generation
- DelegationChecker — verify allowance before auto-pay

### Presets

| Preset | Symbol | Use Case |
|--------|--------|----------|
| \`payment-processor\` | $PAY | Multi-token payment routing |
| \`booking-agent\` | $BOOK | Service booking + payment |
| \`subscription-manager\` | $SUB | Recurring billing with delegation |
| \`escrow-service\` | $ESCR | Funds held until delivery confirmed |

### Scaffold Command

\`\`\`bash
agentlaunch scaffold my-agent --type consumer-commerce
\`\`\`

## MCP Tools

| Tool | Description |
|------|-------------|
| \`multi_token_payment\` | Send FET, USDC, or ERC-20 payment |
| \`check_spending_limit\` | Read ERC-20 allowance |
| \`create_delegation\` | Generate delegation handoff link |
| \`get_fiat_link\` | Generate MoonPay/Transak URL |
| \`create_invoice\` | Create payment invoice |
| \`list_invoices\` | List invoices by status |
| \`get_multi_token_balances\` | Query FET + USDC + BNB balances |

## CLI Commands

\`\`\`bash
agentlaunch wallet balances                          # Multi-token balance display
agentlaunch wallet delegate FET 100 --spender 0x...  # Generate delegation link
agentlaunch wallet allowance FET --owner 0x... --spender 0x...  # Check limit
agentlaunch wallet send USDC 0x... 10                # Multi-token transfer
agentlaunch pay 0x... 10 --token USDC                # Pay in any token
agentlaunch invoice create --agent agent1q... --payer 0x... --service api --amount 10
agentlaunch invoice list --agent agent1q... --status pending
\`\`\`

## Backward Compatibility

- All new type fields are optional — existing FET-only agents are unchanged
- New fields on PricingEntry: \`altPrices?\`, \`acceptedTokens?\`
- New fields on AgentRevenue: \`revenueByToken?\`
- New fields on AgentCommerceStatus: \`usdcBalance?\`, \`tokenBalances?\`, \`activeInvoices?\`, \`delegations?\`
- Default token is always FET when not specified`,
  "marketing-swarm.md": `# Marketing Team Swarm Rules

## The 7 Roles

| Role | Token | Services | Price/call | Interval |
|------|-------|----------|-----------|----------|
| Writer | $WRITE | blog_post, tweet_thread, newsletter, ad_copy | 0.01 FET | on-demand |
| Social | $POST | post_tweet, schedule_thread, reply_mentions | 0.005 FET | 5 min |
| Community | $COMM | moderate, answer_faq, run_poll | 0.002 FET | 1 min |
| Analytics | $STATS | engagement_report, audience_insights, content_performance | 0.005 FET | 5 min |
| Outreach | $REACH | find_partners, draft_pitch, send_email | 0.01 FET | on-demand |
| Ads | $ADS | create_ad, ab_test, campaign_report | 0.01 FET | 5 min |
| Strategy | $PLAN | content_calendar, brand_audit, competitor_analysis, campaign_plan | 0.02 FET | on-demand |

## Build Order

Writer -> Community -> Social -> Analytics -> Outreach -> Ads -> Strategy

Writer first (everyone needs content), Community second (standalone engagement).

## Starter Configurations

- **Content only**: Writer (1 agent)
- **Social presence**: Writer + Social (2 agents)
- **Community**: Writer + Community + Social (3 agents)
- **Analytics stack**: Writer + Social + Analytics (3 agents)
- **Full team**: All 7

## Customizing SwarmBusiness

The swarm-starter template marks the business logic section:
\`\`\`python
# === YOUR SWARM LOGIC ===
\`\`\`

This is where you add:
- Custom message handlers for your services
- Interval tasks for background work
- Integration with external APIs
- Agent-to-agent communication logic

## Adding New Roles

1. Define the role's services and pricing
2. Create a preset in \`packages/templates/src/presets.ts\`
3. Generate from swarm-starter template with role variables
4. Deploy and wire into the swarm

## Cross-Holdings

Agents can buy each other's tokens:
- Strategy buys Writer tokens (values its content)
- Writer buys Analytics tokens (values its performance data)
- Creates economic alignment between agents

## Token Lifecycle

1. Deploy agent on Agentverse
2. Tokenize on AgentLaunch (120 FET deploy fee)
3. Bonding curve active (2% fee to protocol treasury, NO creator fee)
4. At 30,000 FET -> auto DEX listing (graduation)`,
  "payment-protocol.md": `# Payment Protocol Rules

> **Status:** Payment protocol import verified available on Agentverse (2026-03-04).

## Official Imports (uagents_core)

\`\`\`python
from uagents_core.contrib.protocols.payment import (
    RequestPayment,
    CommitPayment,
    CompletePayment,
    RejectPayment,
    CancelPayment,
    Funds,
    payment_protocol_spec,
)
\`\`\`

## Protocol Creation

\`\`\`python
from uagents import Protocol

# Seller side (agents that charge for services):
payment_proto = Protocol(spec=payment_protocol_spec, role="seller")

# Buyer side (agents that pay for services):
payment_proto = Protocol(spec=payment_protocol_spec, role="buyer")
\`\`\`

**Note:** The payment protocol has defined roles. You MUST specify \`role="seller"\` or \`role="buyer"\` when creating the protocol. \`agent.create_protocol()\` does NOT exist on Agentverse. Always use \`Protocol(spec=..., role=...)\`.

## Payment Flow

\`\`\`
Buyer                          Seller
  |                              |
  |  ChatMessage (service req)   |
  |----------------------------->|
  |                              |
  |  RequestPayment              |
  |<-----------------------------|
  |                              |
  |  CommitPayment (tx_hash)     |
  |----------------------------->|
  |                              |
  |  [verifies on-chain]         |
  |                              |
  |  CompletePayment (result)    |
  |<-----------------------------|
\`\`\`

## Denomination

| Network | Denom | Rate |
|---------|-------|------|
| Testnet | atestfet | 1 FET = 10^18 atestfet |
| Mainnet | afet | 1 FET = 10^18 afet |

Common amounts:
- 0.001 FET = 1,000,000,000,000,000 atestfet
- 0.01 FET = 10,000,000,000,000,000 atestfet
- 1 FET = 1,000,000,000,000,000,000 atestfet

## Error Handling

- Always handle \`RejectPayment\` -- buyer may decline
- Always handle \`CancelPayment\` -- timeout or cancellation
- Verify tx_hash on-chain before delivering service
- Store transaction log in \`ctx.storage\`

## Swarm-Starter Template Commerce Layers

The swarm-starter template includes these commerce classes inline:
- \`PaymentService\`: Seller-side payment handling
- \`PricingTable\`: Per-service pricing from ctx.storage
- \`TierManager\`: Token-gated access (free/premium)
- \`WalletManager\`: Balance queries, fund alerts
- \`RevenueTracker\`: Income/expense logging
- \`SelfAwareMixin\`: Token price/holder awareness
- \`HoldingsManager\`: Direct on-chain token operations`,
  "security-checklist.md": `---
paths:
  - "packages/**/*.ts"
---

# Security Checklist

## Backend
- Input validation on all endpoints
- JWT expiration configured
- Secrets in .env only
- CORS restricted
- Error messages don't leak internals

## Frontend
- No secrets in client code
- Sanitize user input
- Validate wallet addresses

## Smart Contracts
- Reentrancy guard on state changes
- Access control validated
- Events for all state changes
- No hardcoded addresses (use constructor)

## General
- npm audit regularly
- No private keys in code
- .env in .gitignore`,
  "testing.md": `---
paths:
  - "packages/**/*.spec.ts"
  - "packages/**/*.test.ts"
---

# Testing Rules

## SDK / CLI / MCP (Jest)
- Co-located: *.spec.ts or *.test.ts
- Mock with jest.mock()
- beforeEach/afterEach for setup/cleanup

## Integration Tests
- Test SDK against mock API server
- Test CLI commands with mocked HTTP
- Test MCP tools with mock context`,
  "uagent-patterns.md": `# uAgent Code Patterns

When writing Agentverse agent code:

> **For new agents, use the swarm-starter template:** \`agentlaunch scaffold myagent --type swarm-starter\`
> It includes the full commerce stack (payments, pricing, tiers, revenue tracking).

## Minimal Working Agent

\`\`\`python
from uagents import Agent, Context, Protocol
from uagents_core.contrib.protocols.chat import (
    ChatMessage, ChatAcknowledgement, TextContent,
    EndSessionContent, chat_protocol_spec
)
from datetime import datetime

agent = Agent()  # Zero params on Agentverse
chat_proto = Protocol(spec=chat_protocol_spec)

@chat_proto.on_message(ChatMessage)
async def handle_message(ctx: Context, sender: str, msg: ChatMessage):
    ctx.logger.info(f"Message from {sender}")
    text = msg.content[0].text if msg.content else ""

    await ctx.send(sender, ChatMessage(
        timestamp=datetime.now(),
        msg_id=msg.msg_id,
        content=[TextContent(text=f"You said: {text}")]
    ))

    await ctx.send(sender, ChatMessage(
        timestamp=datetime.now(),
        msg_id=msg.msg_id,
        content=[EndSessionContent()]
    ))

@chat_proto.on_message(ChatAcknowledgement)
async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement):
    ctx.logger.info(f"Ack from {sender}: {msg.acknowledged_msg_id}")

agent.include(chat_proto, publish_manifest=True)

if __name__ == "__main__":
    agent.run()
\`\`\`

## Rules

- Always use \`Agent()\` with zero params on Agentverse
- Always include \`ChatAcknowledgement\` handler (required by protocol)
- Always end conversations with \`EndSessionContent\`
- Always use \`ctx.logger\` (never \`print\`)
- Always use \`datetime.now()\` (never \`utcnow\`, it is deprecated)
- Always include \`publish_manifest=True\` in \`agent.include()\`
- Use \`Protocol(spec=chat_protocol_spec)\` — \`agent.create_protocol()\` does NOT exist on Agentverse

## Required Imports

\`\`\`python
from uagents import Agent, Context, Protocol, Model
from uagents_core.contrib.protocols.chat import (
    ChatAcknowledgement, ChatMessage, TextContent,
    EndSessionContent, chat_protocol_spec
)
from datetime import datetime
\`\`\`

---

## Payment Protocol (Official)

Use the official payment protocol from \`uagents_core\`. Do NOT create custom payment models.

### Imports

\`\`\`python
from uagents_core.contrib.protocols.payment import (
    RequestPayment,
    CommitPayment,
    CompletePayment,
    RejectPayment,
    CancelPayment,
    Funds,
    payment_protocol_spec,
)
\`\`\`

### Protocol Creation

\`\`\`python
from uagents import Protocol

# Seller side (agents that charge for services):
payment_proto = Protocol(spec=payment_protocol_spec, role="seller")

# Buyer side (agents that pay for services):
payment_proto = Protocol(spec=payment_protocol_spec, role="buyer")
\`\`\`

**Note:** The payment protocol has defined roles. You MUST specify \`role="seller"\` or \`role="buyer"\` when creating the protocol. \`agent.create_protocol()\` does NOT exist on Agentverse. Always use \`Protocol(spec=..., role=...)\`.

### Payment Flow

\`\`\`
Buyer                          Seller
  |                              |
  |  ChatMessage (service req)   |
  |----------------------------->|
  |                              |
  |  RequestPayment              |
  |<-----------------------------|
  |                              |
  |  CommitPayment (tx_hash)     |
  |----------------------------->|
  |                              |
  |  [verifies on-chain]         |
  |                              |
  |  CompletePayment (result)    |
  |<-----------------------------|
\`\`\`

### Error Handling

- Always handle \`RejectPayment\` -- buyer may decline
- Always handle \`CancelPayment\` -- timeout or cancellation
- Verify tx_hash on-chain before delivering service
- Store transaction log in \`ctx.storage\`

See \`.claude/rules/payment-protocol.md\` for the full reference.

---

## Wallet & Ledger Operations (Runtime-Verified 2026-03-04)

Every agent on Agentverse has a wallet. Key facts:

- **\`ctx.ledger\` EXISTS** — type \`cosmpy.aerial.client.LedgerClient\` (verified on Agentverse)
- **\`ctx.wallet\` DOES NOT EXIST** — not on the Context object
- **\`agent.wallet\` EXISTS** — type \`cosmpy.aerial.wallet.LocalWallet\` (use this instead)
- **Balance queries WORK** — \`ctx.ledger.query_bank_balance()\` returns int

### Complete \`ctx\` Attributes (verified)

\`\`\`
address, agent, envelopes, get_message_protocol, identifier,
ledger, logger, outbound_messages, protocols, send,
send_and_receive, send_raw, send_wallet_message, session,
session_history, storage, wallet_messages
\`\`\`

### Check Balance

\`\`\`python
agent = Agent()

async def check_balance(ctx: Context) -> int:
    """Get agent's FET balance in atestfet (1 FET = 10^18 atestfet)."""
    # Use agent.wallet (NOT ctx.wallet — it doesn't exist)
    balance = ctx.ledger.query_bank_balance(str(agent.wallet.address()), "atestfet")
    return int(balance)
\`\`\`

### Send FET to Another Agent

\`\`\`python
agent = Agent()

async def send_fet(ctx: Context, recipient: str, amount_afet: int, denom: str = "atestfet") -> str:
    """Send FET on Fetch.ai native chain."""
    tx = ctx.ledger.send_tokens(
        recipient, amount_afet, denom, agent.wallet  # agent.wallet, NOT ctx.wallet
    ).wait_to_complete()
    ctx.logger.info(f"Sent {amount_afet} {denom} to {recipient}: {tx.tx_hash}")
    return tx.tx_hash
\`\`\`

### Denomination

\`\`\`
TESTNET: "atestfet" (1 FET = 10^18 atestfet)
MAINNET: "afet"     (1 FET = 10^18 afet)

Example: 0.01 FET = 10_000_000_000_000_000 atestfet
\`\`\`

### Two Wallet Systems

Agents may need TWO wallets for full functionality:

| | Fetch.ai Native (Cosmos) | BSC (EVM) |
|---|---|---|
| **Address** | \`fetch1...\` (auto-provisioned) | \`0x...\` (key in Agentverse Secrets) |
| **Access** | \`agent.wallet\` + \`ctx.ledger\` | web3.py + \`ctx.get_secret("WALLET_KEY")\` |
| **Used for** | Agent-to-agent FET payments | Token trading, bonding curve, deploy fee |
| **Library** | cosmpy (built-in) | web3, eth_account |

---

## Commerce Layer (Swarm-Starter Template)

The swarm-starter template includes a complete commerce stack inline. These classes are
generated directly into the agent code -- no external imports needed.

| Class | Purpose |
|-------|---------|
| \`PaymentService\` | Charge callers, pay other agents, verify on-chain transactions |
| \`PricingTable\` | Per-service pricing stored in \`ctx.storage\` |
| \`TierManager\` | Token-gated access: free tier vs. premium (hold tokens to unlock) |
| \`WalletManager\` | Balance queries, low-fund alerts |
| \`RevenueTracker\` | Income/expense logging, GDP contribution |
| \`SelfAwareMixin\` | Read own token price, holder count, market cap |
| \`HoldingsManager\` | Buy/sell other agents' tokens for cross-holdings |

To use the commerce layer, scaffold with the swarm-starter template:

\`\`\`bash
agentlaunch scaffold myagent --type swarm-starter
# Or with a preset:
agentlaunch scaffold oracle-agent --type swarm-starter --preset oracle
\`\`\`

See \`.claude/rules/marketing-swarm.md\` for the 7 preset roles and build order.

---

## Storage Patterns

Use \`ctx.storage\` for persistent data:

\`\`\`python
# Set value (strings only)
ctx.storage.set("my_key", "my_value")
ctx.storage.set("count", str(123))
ctx.storage.set("data", json.dumps({"foo": "bar"}))

# Get value
value = ctx.storage.get("my_key")  # Returns str or None
count = int(ctx.storage.get("count") or 0)
data = json.loads(ctx.storage.get("data") or "{}")

# Check exists
if ctx.storage.get("initialized"):
    pass
\`\`\`

---

## Interval Tasks

\`\`\`python
@agent.on_interval(period=300.0)  # Every 5 minutes
async def periodic_task(ctx: Context):
    ctx.logger.info("Running periodic task")
    balance = await check_balance(ctx)
    ctx.storage.set("last_balance", str(balance))
\`\`\`

---

## Agentverse Allowed Imports

These are available on Agentverse hosted agents:

\`\`\`
uagents, uagents_core           # Agent framework
cosmpy                          # Ledger operations
pydantic                        # Data validation
requests, aiohttp               # HTTP
web3, eth_account               # EVM interaction
datetime, json, hashlib, uuid   # Standard library
\`\`\`

---

## Common Gotchas

1. **Double-encoded code upload** -- When uploading via API, code must be JSON stringified twice
2. **ChatAcknowledgement required** -- Always handle it, even if empty
3. **datetime.utcnow() deprecated** -- Use \`datetime.now()\`
4. **Agent listing is \`items\`** -- Response is \`{ items: [...] }\` not \`{ agents: [...] }\`
5. **Wait for compilation** -- 15-60s after start before agent responds
6. **Balance in atestfet** -- 1 FET = 10^18 atestfet, always use int not float
7. **Use official payment protocol** -- Import from \`uagents_core.contrib.protocols.payment\`, not custom models (verified available on Agentverse)
8. **agent.create_protocol() does NOT exist** -- Use \`Protocol(spec=...)\` directly
9. **ctx.wallet DOES NOT EXIST** -- Use \`agent.wallet\` (module-scope Agent object). Never write \`ctx.wallet\`
10. **ctx.ledger EXISTS** -- It's a \`cosmpy.aerial.client.LedgerClient\`. No \`hasattr\` guard needed
11. **Logs endpoint is /logs/latest** -- \`GET /v1/hosting/agents/{addr}/logs/latest\`, NOT \`/logs\``,
  "workflow.md": `# Agent Lifecycle Workflow (MANDATORY)

**Every agent deployment MUST follow the full workflow from \`docs/workflow.md\`.**
Skipping phases degrades agent ranking, discoverability, and ASI:One routing.

## The 8 Phases

\`\`\`
[1] Create    -> [2] Deploy    -> [3] Optimize -> [4] Tokenize
[5] Handoff   -> [6] Discover  -> [7] Trade    -> [8] Grow
\`\`\`

## Phase 3: Optimize (NEVER SKIP)

After deploying an agent, you MUST complete the Setup Checklist before moving on:

### Required (API-settable)

1. **README** -- Write a compelling README with:
   - One-line value proposition
   - Capabilities list with specific examples
   - 2-3 example conversations
   - Pricing table (if agent charges)
   - Keywords for search
   - Push via \`PUT /v1/hosting/agents/{addr}\` with \`{"readme": "..."}\`

2. **Short Description** -- 1-2 sentence bio for directory listings
   - Push via \`PUT /v1/hosting/agents/{addr}\` with \`{"short_description": "..."}\`

3. **Avatar** (if available) -- Custom image for visual identity
   - Push via \`PUT /v1/hosting/agents/{addr}\` with \`{"avatar_url": "..."}\`

### Manual (inform user)

4. **@Handle** -- Dashboard only, no API. Suggest 3-5 options.
5. **3+ Interactions** -- Tell user to chat with agent or use Response QA Agent.
6. **Domain Verification** -- Optional bonus, DNS TXT record.

### API Call Pattern

\`\`\`bash
curl -s -X PUT "https://agentverse.ai/v1/hosting/agents/{addr}" \\
  -H "Authorization: Bearer $AGENTVERSE_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "readme": "# Agent Name\\n\\nDescription...",
    "short_description": "One-line description of what this agent does."
  }'
\`\`\`

## Enforcement

When deploying agents (via /deploy, /build-agent, /build-swarm, or manual API calls):

1. After confirming agent is compiled and running
2. IMMEDIATELY set README and short_description
3. Suggest avatar, handle, and test interactions to user
4. Log optimization status in output

For swarm deployments: optimize ALL agents in the swarm, not just one.

## README Template for Marketing Team Agents

\`\`\`markdown
# {Agent Name} -- {Role Description}

{One-line value proposition}

## Services

| Service | Price | Description |
|---------|-------|-------------|
| {service} | {price} FET | {what it does} |

## Example Conversation

**User:** {example input}
**Agent:** {example output}

## Commands

- \`help\` -- list all commands
- \`{command}\` -- {description}
- \`revenue\` -- view earnings
- \`balance\` -- check wallet

## Part of the AgentLaunch Marketing Team

This agent is part of a 7-agent swarm: Writer, Social, Community, Analytics, Outreach, Ads, Strategy.

Built with [AgentLaunch](https://agent-launch.ai)
\`\`\``,
};
// ---------------------------------------------------------------------------
// Skills — Claude's slash commands
// ---------------------------------------------------------------------------

export const SKILLS: Record<string, string> = {
  "alliance/SKILL.md": `# /alliance — Deploy the ASI Alliance Agent Economy

> **Secret command for ASI Alliance members.**
> Deploys 27 agents representing every team in the Fetch.ai + SingularityNET ecosystem.

---

## What This Does

Deploys the complete Agent Economy in the correct sequence:

\`\`\`
Wave 1 (Sequential):  CTO → CFO → COO → CEO → CRO         (5 agents)
Wave 2 (Parallel):    GUIDE, RANK, COACH, CONC, BRAND, DEV, GRANT  (7 agents)
Wave 3 (Parallel):    All 15 SingularityNET ecosystem agents       (15 agents)
\`\`\`

**Total:** 27 agents, 3,240 FET deploy cost

---

## Execution

When the user types \`/alliance\`, follow this flow:

### Step 1: Confirm Identity

Ask: "This deploys the full ASI Alliance economy (27 agents, ~3,240 FET). Are you ready?"

If they confirm, proceed.

### Step 2: Check Prerequisites

\`\`\`bash
# Check wallet balance
npx agentlaunch wallet balances

# Need: ≥3,500 FET (3,240 deploy + 270 seeding)
\`\`\`

If insufficient funds, suggest:
- Claim from @gift agent (200 TFET)
- Or provide a funding link

### Step 3: Deploy Wave 1 — C-Suite (Sequential)

Deploy in this exact order (dependencies matter):

\`\`\`bash
# 1. CTO first — everyone pays for reasoning
npx agentlaunch scaffold the-cto --type swarm-starter --preset cto
npx agentlaunch deploy the-cto/

# 2. CFO — treasury monitoring
npx agentlaunch scaffold the-cfo --type swarm-starter --preset cfo
npx agentlaunch deploy the-cfo/

# 3. COO — operations
npx agentlaunch scaffold the-coo --type swarm-starter --preset coo
npx agentlaunch deploy the-coo/

# 4. CEO — routing (depends on CTO, CFO)
npx agentlaunch scaffold the-ceo --type swarm-starter --preset ceo
npx agentlaunch deploy the-ceo/

# 5. CRO — recruitment (depends on CTO)
npx agentlaunch scaffold the-cro --type swarm-starter --preset cro
npx agentlaunch deploy the-cro/
\`\`\`

After each deploy:
- Set README + short_description (Phase 3 Optimize)
- Record agent address
- Confirm running before next

### Step 4: Deploy Wave 2 — Fetch Internal (Parallel)

Deploy all 7 in parallel:

| Agent | Preset | Description |
|-------|--------|-------------|
| The Tour Guide | \`guide\` | Ecosystem onboarding |
| The SEO Manager | \`rank\` | Agent discoverability |
| The Business Coach | \`coach\` | Startup guidance |
| The Concierge | \`conc\` | Consumer experience |
| The Brand Manager | \`brand\` | Brand partnerships |
| The Dev Advocate | \`dev\` | Developer support |
| The Grants Officer | \`grant\` | Funding guidance |

### Step 5: Deploy Wave 3 — SingularityNET (Parallel)

Deploy all 15:

| Agent | Token | Organisation |
|-------|-------|--------------|
| The Marketplace Manager | $MKTPL | SingularityNET |
| The IT Manager | $INFRA | CUDOS |
| The Facilities Manager | $EDGE | NuNet |
| The Finance Controller | $FLOW | HyperCycle |
| The Health Coach | $LIFE | Rejuve.AI |
| The Lab Manager | $LAB | Rejuve Biotech |
| The Editor | $ED | Mindplex |
| The Fund Manager | $FUND | SingularityDAO |
| The Yield Farmer | $YIELD | Singularity Finance |
| The Treasury Manager | $STABLE | Cogito Protocol |
| The EA | $EA | Twin Protocol |
| The A&R Manager | $AR | Jam Galaxy |
| The Strategy Director | $STRAT | TrueAGI |
| The Research Scientist | $PHD | Zarqa / OpenCog |
| The Talent Agent | $TALENT | Yaya Labs |

### Step 6: Seed Cross-Holdings

After all agents deployed:

\`\`\`bash
# CEO buys infrastructure tokens
npx agentlaunch buy $CTO_TOKEN --amount 5
npx agentlaunch buy $CFO_TOKEN --amount 5
npx agentlaunch buy $GUIDE_TOKEN --amount 2

# COO buys monitoring dependencies
npx agentlaunch buy $CEO_TOKEN --amount 3
npx agentlaunch buy $CTO_TOKEN --amount 3

# Coalition cross-holdings...
\`\`\`

### Step 7: Verify & Report

\`\`\`bash
npx agentlaunch status --swarm
\`\`\`

Show summary:
\`\`\`
╭────────────────────────────────────────────────────────────────╮
│              ASI ALLIANCE ECONOMY DEPLOYED                     │
├────────────────────────────────────────────────────────────────┤
│  Agents:     27 running                                        │
│  Tokens:     27 on bonding curves                              │
│  GDP:        Tracking...                                       │
│  Deploy:     3,240 FET                                         │
│                                                                │
│  C-Suite:    CEO, CTO, CFO, COO, CRO                          │
│  Fetch:      GUIDE, RANK, COACH, CONC, BRAND, DEV, GRANT      │
│  SNET:       MKTPL, INFRA, EDGE, FLOW, LIFE, LAB, ED,         │
│              FUND, YIELD, STABLE, EA, AR, STRAT, PHD,         │
│              TALENT                                            │
│                                                                │
│  Next: CRO will scout for more agents to recruit              │
╰────────────────────────────────────────────────────────────────╯
\`\`\`

---

## Named After Real People

These agents are named after real ASI Alliance leadership:

| Agent | Named After | Organisation |
|-------|-------------|--------------|
| The CEO ($CEO) | Humayun Sheikh | Fetch.ai / ASI Alliance |
| The CTO ($CTO) | Thomas Hain | Fetch.ai (Co-Founder) |
| The CRO ($CRO) | Sana Wajid | Fetch.ai Innovation Lab |
| The Tour Guide ($GUIDE) | Maria Minaricova | Fetch.ai BD |
| The Marketplace Manager ($MKTPL) | Ben Goertzel | SingularityNET |
| The IT Manager ($INFRA) | Matt Hawkins | CUDOS |

---

## Related Docs

- [people.md](docs/people.md) — Full team roster + agent mapping
- [the-agent-economy.md](docs/the-agent-economy.md) — Complete vision document
- [agent-coordination.md](docs/agent-coordination.md) — Pitch deck version

---

## Output Style

Be elegant and helpful:
- Show progress clearly
- Celebrate each wave completion
- Explain what each agent does as it deploys
- End with clear next steps

**This is the flagship deployment. Make it feel special.**`,
  "build-agent/SKILL.md": `# /build-agent -- Full Agent Lifecycle

Build, deploy, and tokenize an agent in one guided flow.

## Steps

1. **Gather requirements**: Ask the user what kind of agent they want to build.
   Get the agent name, ticker symbol, and description.

2. **Choose a template**: Based on the description, pick one of:
   custom, price-monitor, trading-bot, data-analyzer, research, gifter.
   Confirm the choice with the user.

3. **Scaffold the agent code**: Use the \`scaffold_agent\` MCP tool (or the
   templates package directly) to generate agent code from the template.
   Customize the generated code based on user requirements.

4. **Review with user**: Show the generated code. Let them request changes.

5. **Deploy to Agentverse**:
   - Use the \`deploy_to_agentverse\` MCP tool
   - Or manually: create agent, upload code (double-encoded JSON), set secrets, start
   - Poll until compiled (60s timeout)
   - Check logs for errors

6. **Optimize** (MANDATORY -- Phase 3 of \`docs/workflow.md\`):
   - Write a compelling README with: value proposition, services, example conversations, pricing
   - Write a short_description (1-2 sentences for directory listing)
   - Push via \`PUT /v1/hosting/agents/{addr}\` with \`{"readme": "...", "short_description": "..."}\`
   - Suggest 3-5 @handle options to the user
   - Tell user to run 3+ test interactions (Response QA Agent or chat directly)
   - Suggest avatar if user has one

7. **Tokenize on AgentLaunch**:
   - Use the \`create_token_record\` MCP tool
   - POST /agents/tokenize with name, symbol, description, chainId
   - Default chain: BSC Testnet (97)

8. **Return results to user**:
   - Agent address (agent1q...)
   - Token handoff link (\${AGENT_LAUNCH_FRONTEND_URL}/deploy/{tokenId})
   - Instructions: "Click this link, connect your wallet, and sign to deploy"

9. **Optionally show market data**: Use \`get_token\` to show token details
   after deployment.

## Environment

- Reads AGENTVERSE_API_KEY from \`.env\`
- Uses SDK/MCP tools for all API calls
- Uses templates package for code generation
- Dev URLs used by default; set AGENT_LAUNCH_ENV=production for mainnet

## Platform Fee Note

The 120 FET deployment fee is paid by the human who signs the transaction.
The 2% trading fee goes 100% to protocol treasury (no creator fee).`,
  "build-swarm/SKILL.md": `# /build-swarm -- Build an Agent Swarm

Guided swarm creation experience for Claude Code.

## Steps

1. **Understand the goal**: Ask what the user wants their swarm to do
2. **Suggest presets**: Based on the goal, recommend a combination of presets
   - For content marketing: Writer + Social + Analytics
   - For community growth: Writer + Community + Social
   - For full marketing team: All 7
3. **Scaffold each agent**: Use \`scaffold_swarm\` MCP tool with appropriate preset
4. **Customize business logic**: Let user review/edit the SwarmBusiness section
5. **Deploy**: Use \`deploy_swarm\` MCP tool or deploy individually
   - Follow build order: Level 0 (no deps) first, then Level 1, etc.
   - Set peer address secrets so agents can call each other
6. **Optimize EVERY agent** (MANDATORY -- Phase 3 of \`docs/workflow.md\`):
   - For each deployed agent, set README and short_description
   - Push via \`PUT /v1/hosting/agents/{addr}\` with \`{"readme": "...", "short_description": "..."}\`
   - README must include: value proposition, services table, example conversations, pricing, commands
   - Suggest @handle options for each agent
   - Tell user to run 3+ test interactions per agent
7. **Show status**: Display swarm health, addresses, optimization score, next steps

## Preset Quick Reference

| Preset | Role | Price/call | Best for |
|--------|------|-----------|----------|
| Writer | Content creation | 0.01 FET | Every swarm needs content |
| Social | Twitter/X posting | 0.005 FET | Social media presence |
| Community | Telegram management | 0.002 FET | Community engagement |
| Analytics | Engagement tracking | 0.005 FET | Data-driven decisions |
| Outreach | Partnership emails | 0.01 FET | Business development |
| Ads | Ad campaigns | 0.01 FET | Paid marketing |
| Strategy | Campaign coordination | 0.02 FET | Orchestrates all agents |

## Recommended Starters

- **Content only**: Writer (1 agent)
- **Social presence**: Writer + Social (2 agents)
- **Community**: Writer + Community + Social (3 agents)
- **Full team**: All 7

## Environment

- Reads AGENTVERSE_API_KEY from .env
- Uses MCP tools: scaffold_swarm, deploy_swarm, deploy_to_agentverse
- Platform: agent-launch.ai`,
  "deploy/SKILL.md": `# /deploy -- Deploy Agent to Agentverse

Deploy a Python agent file to the Agentverse hosting platform.
**Follows the full lifecycle workflow from \`docs/workflow.md\`.**

## Usage

\`\`\`
/deploy [path/to/agent.py]
\`\`\`

If no path is given, look for \`agent.py\` in the current directory.

## Steps

1. **Read** the agent.py file
2. **Validate** it follows uAgent patterns:
   - Has \`Agent()\` with zero params
   - Imports Chat Protocol v0.3.0
   - Has \`ChatAcknowledgement\` handler
   - Uses \`ctx.logger\` not \`print()\`
3. **Create agent** on Agentverse via POST /v1/hosting/agents
4. **Upload code** using double-encoded JSON format
5. **Set secrets** from \`.env\` (AGENTVERSE_API_KEY at minimum)
6. **Start agent** via POST /v1/hosting/agents/{addr}/start
7. **Poll compilation** status (up to 60s)
8. **Optimize** (MANDATORY -- see \`.claude/rules/workflow.md\`):
   - Write a README based on the agent's capabilities (from code analysis)
   - Write a short_description (1-2 sentences)
   - Push both via \`PUT /v1/hosting/agents/{addr}\` with \`{"readme": "...", "short_description": "..."}\`
   - Suggest @handle options to the user
   - Tell user to test with 3+ interactions
9. **Show results**: agent address, compilation status, optimization score, initial logs

## Auth

Uses AGENTVERSE_API_KEY from \`.env\` with header: \`Authorization: bearer <key>\``,
  "grow/SKILL.md": `# /grow -- Autonomous Task Execution

Claim and execute tasks from \`docs/TODO.md\` autonomously.

## Behavior

1. **Read TODO.md**: Open \`docs/TODO.md\` and parse the task tables
2. **Find next task**: Look for tasks marked \`[ ]\` with no unfinished dependencies
3. **Claim task**: Update the status marker from \`[ ]\` to \`[~]\` (in progress)
4. **Execute task**: Follow the "How" column instructions using toolkit commands
5. **Verify KPI**: Check the "KPI" column to confirm success
6. **Complete task**: Update status from \`[~]\` to \`[x]\` (complete)
7. **Report**: Summarize what was done and move to next task (if \`/grow N\`)

## Arguments

- \`/grow\` - Execute the next pending task
- \`/grow 3\` - Execute 3 tasks sequentially
- \`/grow L-1\` - Execute a specific task by ID
- \`/grow status\` - Show current progress without executing

## Task Selection Rules

1. Never execute a task whose "Depends" column lists incomplete tasks
2. Process tasks in ID order within each phase (L-1 before L-2)
3. Process phases in order (Phase 1 before Phase 2)
4. Skip tasks marked \`[!]\` (blocked) or \`[x]\` (complete)

## Status Markers

| Marker | Meaning |
|--------|---------|
| \`[ ]\`  | Pending - ready to execute (if deps are met) |
| \`[~]\`  | In Progress - currently being worked on |
| \`[x]\`  | Complete - verified and done |
| \`[!]\`  | Blocked - external blocker, needs human intervention |

## Example Task Execution

For task L-1 "Deploy the swarm":

\`\`\`markdown
| Status | ID | Task | How | KPI | Depends |
|:---:|:---|:---|:---|:---|:---|
| \`[~]\` | L-1 | Deploy the swarm | \`npx agentlaunch create\` ... | All 7 running | — |
\`\`\`

1. Run \`npx agentlaunch create\` and follow prompts
2. Verify all 7 agents are running with \`network_status\` MCP tool
3. If KPI met, update to \`[x]\`
4. If failed, update to \`[!]\` and report the blocker

## Gate Checks

After completing all tasks in a phase, verify the Phase Gate criteria.
If all gate items pass, proceed to the next phase.
If any gate item fails, report which ones need attention.

## Error Handling

- If a task fails, mark it \`[!]\` and add a comment explaining the blocker
- If dependencies are missing, report which tasks need to complete first
- If a gate check fails, report which criteria are unmet

## Toolkit Commands Used

- \`npx agentlaunch create\` - Deploy agents
- \`npx agentlaunch status\` - Check agent/token status
- \`network_status\` MCP tool - Swarm health check
- \`check_agent_commerce\` MCP tool - Individual agent commerce
- \`GET /agents/token/{addr}/holders\` - Token holder list`,
  "improve.md": `# /improve - Capture Session Learnings

Extract learnings from this session and create a PR to improve the toolkit.

## Trigger

User runs \`/improve\` after building agents, fixing errors, or discovering patterns.

## Workflow

### 1. Analyze Session

Review the conversation to identify:

- **Errors fixed**: Error messages encountered and how they were resolved
- **Code patterns**: Working code that could become a template or snippet
- **API discoveries**: Gotchas, undocumented behavior, correct endpoints
- **Workflow improvements**: Better ways to do things

### 2. Check for Duplicates

Before suggesting additions, search existing rules:

\`\`\`bash
# Search for the error/pattern in existing rules
grep -r "keyword" .claude/rules/
grep -r "keyword" docs/
\`\`\`

Skip anything already documented. Only surface NEW learnings.

### 3. Present Learnings

Show the user what was found:

\`\`\`
Session Analysis
================

Errors Fixed:
  1. [NEW] "agent.create_protocol() does not exist"
     Fix: Use Protocol(spec=...) directly
     → Suggest: Add to .claude/rules/uagent-patterns.md

  2. [KNOWN] "datetime.utcnow() deprecated"
     Already in: .claude/rules/uagent-patterns.md
     → Skip

Patterns Discovered:
  1. [NEW] Twitter integration with rate limiting
     → Suggest: New template twitter-bot/

  2. [NEW] Conversation memory with ctx.storage
     → Suggest: Add to .claude/rules/uagent-patterns.md

Which learnings should we add? (comma-separated numbers, or 'all', or 'none')
\`\`\`

### 4. Create Branch & Changes

For selected learnings:

\`\`\`bash
# Create improvement branch
git checkout -b improve/session-$(date +%s)

# Make changes based on learning type:
\`\`\`

**For rule updates:**
- Edit the relevant \`.claude/rules/*.md\` file
- Add the pattern under the appropriate section
- Include: what the error looks like, why it happens, how to fix it

**For new templates:**
- Create directory in \`packages/templates/src/templates/\`
- Add agent.py with the pattern
- Update templates index

**For workflow improvements:**
- Edit \`.claude/rules/workflow.md\` or relevant skill
- Add the step or check

### 5. Test Changes

Before committing, validate everything still works:

\`\`\`bash
# 1. Build all packages (catches TypeScript/import errors)
npm run build

# 2. Run test suite
npm run test

# 3. If new template added, validate it compiles
if [ -d "packages/templates/src/templates/NEW_TEMPLATE" ]; then
  python3 -m py_compile packages/templates/src/templates/NEW_TEMPLATE/agent.py
fi

# 4. Lint markdown (optional but recommended)
npx markdownlint .claude/rules/*.md 2>/dev/null || true
\`\`\`

**If tests fail:**
\`\`\`
Test Results
============
✗ npm run build - FAILED

Error: packages/templates/src/index.ts(45,10):
  Cannot find module './templates/twitter-writer'

The new template needs to be registered in the index.
Fix the error, then run /improve again.
\`\`\`

Do not create PR until all tests pass.

**If tests pass:**
\`\`\`
Test Results
============
✓ npm run build - passed
✓ npm run test - 47 passed, 0 failed
✓ Template syntax - valid Python
✓ Markdown lint - no errors

All tests passed. Proceeding to commit...
\`\`\`

### 6. Commit & Push

\`\`\`bash
git add .
git commit -m "$(cat <<'EOF'
improve: Add learnings from session

Learnings added:
- [list what was added]

Session context:
- [brief description of what user was building]

EOF
)"

git push -u origin improve/session-$(date +%s)
\`\`\`

### 7. Create PR

\`\`\`bash
gh pr create --title "Improve: [brief summary]" --body "$(cat <<'EOF'
## Session Learnings

This PR captures learnings from a development session.

### What was built
[Description of what the user was working on]

### Learnings added

| Type | File | Description |
|------|------|-------------|
| Rule | \`.claude/rules/xxx.md\` | [what was added] |
| Template | \`packages/templates/...\` | [what was added] |

### Why these matter
[Brief explanation of how these help future users]

---
*Generated by \`/improve\` - see docs/self-improvement.md*
EOF
)"
\`\`\`

### 8. Report to User

\`\`\`
Improvement PR created!

Branch: improve/session-1709654321
PR: https://github.com/[org]/agent-launch-toolkit/pull/42

Changes:
  - .claude/rules/uagent-patterns.md: Added Protocol() pattern
  - packages/templates/src/templates/twitter-bot/: New template

Next steps:
  1. Review the PR
  2. Team discusses if needed
  3. Merge when ready

Thanks for improving the toolkit!
\`\`\`

## Learning Categories

### Error Patterns (→ Rules)

Format for error rules:

\`\`\`markdown
## Error: "[exact error message]"

**Cause:** [why this happens]

**Fix:** [what to do instead]

**Example:**
\`\`\`python
# Wrong
ctx.wallet.address()

# Right
agent.wallet.address()
\`\`\`
\`\`\`

### API Gotchas (→ Rules)

Format for API rules:

\`\`\`markdown
## [API/Endpoint Name]

**Gotcha:** [the unexpected behavior]

**Correct usage:**
\`\`\`python
# code example
\`\`\`

**Why:** [explanation]
\`\`\`

### Code Patterns (→ Templates or Rules)

If it's a full agent pattern → new template
If it's a snippet → add to relevant rule file

### Workflow Improvements (→ Rules or Skills)

If it's a step people should always do → add to workflow.md
If it's a new capability → create/update skill

## Edge Cases

### No learnings found

\`\`\`
No new learnings detected in this session.

Everything worked smoothly, or the patterns are already documented.

If you think something should be added, describe it and I'll help
create the improvement manually.
\`\`\`

### User declines all

\`\`\`
No learnings selected. That's fine!

If you change your mind, run /improve again or manually edit:
  - .claude/rules/ for coding patterns
  - packages/templates/ for agent templates
  - .claude/skills/ for workflow improvements
\`\`\`

### Conflict with existing rules

If a learning contradicts an existing rule:

\`\`\`
Potential conflict detected:

Existing rule (.claude/rules/uagent-patterns.md):
  "Use datetime.now() instead of utcnow()"

Your session used:
  datetime.utcnow() successfully

Options:
  1. Skip (keep existing rule)
  2. Update rule with exception/context
  3. Replace rule with new pattern

Which approach?
\`\`\`

## Examples

### Example 1: Error Pattern

Session: User got "Protocol() missing role parameter" error

\`\`\`
Learning detected:

Error: "Protocol() takes 1 positional argument but 2 were given"
       when using payment_protocol_spec

Fix: Payment protocol requires role="seller" or role="buyer"

Add to .claude/rules/payment-protocol.md? [y/n]
\`\`\`

### Example 2: New Template

Session: User built a Twitter bot with rate limiting

\`\`\`
Learning detected:

Pattern: Twitter bot with:
  - Rate limiting (15 calls/15min)
  - Retry with exponential backoff
  - Tweet queue with ctx.storage

Create new template 'twitter-bot'? [y/n]
\`\`\`

### Example 3: Workflow Improvement

Session: User's agent failed because they tokenized before optimizing

\`\`\`
Learning detected:

Workflow issue: Tokenizing before optimization leads to poor
discoverability. README should be set BEFORE tokenize.

Update .claude/rules/workflow.md to enforce order? [y/n]
\`\`\`

## Files Modified by /improve

| Learning Type | Target File |
|---------------|-------------|
| uAgent errors | \`.claude/rules/uagent-patterns.md\` |
| Payment issues | \`.claude/rules/payment-protocol.md\` |
| API path errors | \`.claude/rules/api-paths.md\` |
| Agentverse issues | \`.claude/rules/agentverse.md\` |
| Workflow problems | \`.claude/rules/workflow.md\` |
| New agent pattern | \`packages/templates/src/templates/[name]/\` |
| Swarm patterns | \`.claude/rules/marketing-swarm.md\` |
| Consumer payments | \`.claude/rules/consumer-payments.md\` |

## See Also

- \`docs/self-improvement.md\` - Full documentation of this system
- \`.claude/rules/\` - All current rules
- \`packages/templates/\` - All current templates`,
  "market/SKILL.md": `# /market -- Browse Tokens and Prices

Browse tokens on AgentLaunch and check market data.

## Usage

\`\`\`
/market [token_address]
\`\`\`

## Steps

1. **If no address given**: Use \`list_tokens\` MCP tool to show trending tokens
   with name, symbol, price, and progress toward graduation.
2. **If address given**: Use \`get_token\` MCP tool for full token details
   including price, market cap, holder count, and bonding curve progress.
3. **Price preview**: Use \`calculate_buy\` or \`calculate_sell\` to show
   what a specific FET amount would buy/sell.
4. **Generate trade link**: Use \`get_trade_link\` to create a pre-filled
   buy or sell URL the user can share.

## Notes

- Graduation happens at 30,000 FET liquidity (auto DEX listing).
- Trading fee: 2% per trade, 100% to protocol treasury (no creator fee).`,
  "status/SKILL.md": `# /status -- Check Agent and Token Status

Check the deployment status of agents and tokens.

## Usage

\`\`\`
/status [agent_address_or_token_address]
\`\`\`

## Steps

1. **Detect address type**:
   - \`agent1q...\` -> Agentverse agent, check via GET /v1/hosting/agents/{addr}
   - \`0x...\` -> Token address, check via \`get_token\` MCP tool
2. **For agents**: Show name, running status, compiled status, wallet address.
   Optionally fetch recent logs via GET /v1/hosting/agents/{addr}/logs.
3. **For tokens**: Show name, symbol, price, market cap, holder count,
   bonding curve progress, and whether it has graduated to DEX.
4. **Platform overview**: If no address given, use \`get_platform_stats\`
   to show overall platform statistics (total tokens, volume, etc.).

## Notes

- Agent compilation takes 15-60s after starting.
- Token graduation occurs at 30,000 FET liquidity.`,
  "todo/SKILL.md": `# /todo -- Create TODO from Document

Transform a strategy document, roadmap, or feature spec into a structured TODO.md.

## Usage

- \`/todo\` - Create TODO.md from the most recent doc discussed
- \`/todo docs/organic-growth-strategy.md\` - Create TODO from a specific file
- \`/todo "my feature spec"\` - Create TODO from inline requirements

## Template

Use \`docs/TODO-template.md\` as the format reference. Key elements:

### YAML Frontmatter

\`\`\`yaml
---
title: Feature Name
type: roadmap
version: 1.0.0
priority: Phase order
total_tasks: N
completed: 0
status: PENDING
depends_on: any prerequisites
---
\`\`\`

### Task Tables

\`\`\`markdown
| Status | ID | Task | How | KPI | Depends |
|:---:|:---|:---|:---|:---|:---|
| \`[ ]\` | L-1 | Task name | Implementation details | Success metric | — |
| \`[ ]\` | L-2 | Next task | How to do it | What proves it's done | L-1 |
\`\`\`

### Status Markers

- \`[ ]\` - Pending
- \`[~]\` - In Progress
- \`[x]\` - Complete
- \`[!]\` - Blocked

### Phase Structure

Group tasks into phases with clear progression:

1. **Phase 1: Setup** - Foundation tasks
2. **Phase 2: Build** - Core implementation
3. **Phase 3: Test** - Verification
4. **Phase 4: Deploy** - Launch tasks

### Gate Criteria

After each phase, add a gate checklist:

\`\`\`markdown
### Phase N Gate

\`\`\`
  [ ] First success criterion
  [ ] Second success criterion
  [ ] Third success criterion
\`\`\`
\`\`\`

### Dependency Graph

Add ASCII or Mermaid diagram showing task dependencies:

\`\`\`markdown
## Dependency Graph

\`\`\`
L-1 ──► L-2 ──► L-3 ──► P-1
         │              │
         └──► L-4 ──────┘
\`\`\`
\`\`\`

### Progress Overview

Include visual progress tracking:

\`\`\`markdown
## Progress Overview

\`\`\`
╭─────────────────────────────────────────────╮
│   Phase 1: Setup  [░░░░░░░░░░]  0/4    0%  │
│   Phase 2: Build  [░░░░░░░░░░]  0/6    0%  │
│   TOTAL           [░░░░░░░░░░]  0/10   0%  │
╰─────────────────────────────────────────────╯
\`\`\`
\`\`\`

## Output

By default, write to \`docs/TODO.md\`.
Use \`/todo output:path/to/file.md\` to specify a different output.

## Task ID Conventions

Use short, prefixed IDs:

- \`L-N\` - Launch/setup tasks
- \`B-N\` - Build tasks
- \`T-N\` - Test tasks
- \`D-N\` - Deploy tasks
- \`P-N\` - Prove/validate tasks
- \`G-N\` - Growth tasks
- \`S-N\` - Sustain tasks
- \`F-N\` - Final/graduation tasks

## KPI Guidelines

KPIs should be:
- Measurable ("All 7 running" not "it works")
- Specific ("≥10 queries/day" not "many queries")
- Verifiable (can check with a command or tool)

## Integration with /grow

The TODO created by \`/todo\` is designed to work with \`/grow\`:

1. \`/todo docs/plan.md\` - Create the TODO
2. \`/grow\` - Execute tasks one by one
3. \`/grow 5\` - Execute 5 tasks in sequence`,
  "tokenize/SKILL.md": `# /tokenize -- Tokenize an Agent

Create a tradeable token for an existing Agentverse agent.

## Usage

\`\`\`
/tokenize [agent_address] --name "Name" --symbol "SYM"
\`\`\`

## Steps

1. **Get agent address**: If not provided, list the user's agents via
   GET /v1/hosting/agents and let them choose.
2. **Collect details**: name, symbol (ticker), description. Prompt for
   any missing values.
3. **Create token record**: Use the \`create_token_record\` MCP tool or
   POST /agents/tokenize with:
   - agentAddress, name, symbol, description
   - chainId (default: 97 for BSC Testnet)
4. **Return handoff link**: Show the deploy link and instructions.
5. **Explain next steps**:
   - Human clicks the link
   - Connects wallet (MetaMask, etc.)
   - Signs transaction (pays 120 FET deployment fee)
   - Token goes live on the bonding curve

## Notes

- The 120 FET deploy fee is paid by the human signer, not the agent.
- Trading fee: 2% per trade, 100% to protocol treasury (no creator fee).
- Token graduates to DEX at 30,000 FET liquidity.`,
  "welcome/SKILL.md": `# Welcome — Show Status & Choose Your Path

> Run automatically when Claude Code starts, or manually with \`/welcome\`

---

## What This Does

1. **Shows everything the user already has** — agents, tokens, wallet, swarm status
2. **Offers three paths** — single agent, marketing team, or alliance swarm
3. **Guides them to the right choice**

---

## Execution

### Step 1: Gather Current Status

Run these checks silently:

\`\`\`bash
# Check wallet
npx agentlaunch wallet balances 2>/dev/null || echo "No wallet configured"

# List their agents (from Agentverse)
npx agentlaunch list --mine 2>/dev/null || echo "No agents yet"

# Check if .env exists
test -f .env && echo "API key configured" || echo "No .env file"
\`\`\`

### Step 2: Display Status

Show a clear summary:

\`\`\`
╭────────────────────────────────────────────────────────────────╮
│                   AGENT LAUNCH TOOLKIT                         │
│                   agent-launch.ai                              │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  YOUR STATUS                                                   │
│  ───────────                                                   │
│  Wallet:     0x1234...5678 (150.5 FET, 0.02 BNB)              │
│  Agents:     3 on Agentverse                                   │
│  Tokens:     1 deployed ($MYAGENT at 1,200 FET raised)        │
│  Swarm:      None active                                       │
│                                                                │
│  RECENT ACTIVITY                                               │
│  ───────────────                                               │
│  • joke-teller: 45 queries today, 0.9 FET earned              │
│  • price-monitor: Running, last alert 2h ago                   │
│                                                                │
╰────────────────────────────────────────────────────────────────╯
\`\`\`

If no agents/wallet yet:
\`\`\`
╭────────────────────────────────────────────────────────────────╮
│  YOUR STATUS                                                   │
│  ───────────                                                   │
│  Wallet:     Not configured                                    │
│  Agents:     None yet                                          │
│  API Key:    Not set                                           │
│                                                                │
│  Let's get you started!                                        │
╰────────────────────────────────────────────────────────────────╯
\`\`\`

### Step 3: Show the Three Paths

\`\`\`
╭────────────────────────────────────────────────────────────────╮
│                   WHAT DO YOU WANT TO BUILD?                   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  1. SINGLE AGENT                                               │
│     Chat + memory, deployed in 90 seconds                      │
│     Cost: 120 FET to tokenize                                  │
│     Best for: Getting started, specific use cases              │
│     Command: npx agentlaunch                                   │
│                                                                │
│  2. MARKETING TEAM                                             │
│     7 agents that grow your ecosystem                          │
│     Writer, Social, Community, Analytics, Outreach, Ads,       │
│     Strategy — all working together                            │
│     Cost: 840 FET (7 × 120)                                    │
│     Best for: Content, community, growth                       │
│     Command: /build-swarm marketing                            │
│                                                                │
│  3. ALLIANCE SWARM (ASI Alliance Members)                      │
│     27 agents for the full Fetch.ai + SingularityNET ecosystem│
│     CEO, CTO, CFO, COO, CRO + 22 specialists                  │
│     Cost: 3,240 FET (27 × 120)                                │
│     Best for: ASI Alliance ecosystem builders                  │
│     Command: /alliance                                         │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│  Type 1, 2, or 3 — or describe what you want to build         │
╰────────────────────────────────────────────────────────────────╯
\`\`\`

### Step 4: Handle Choice

**If they choose 1 (Single Agent):**
\`\`\`bash
npx agentlaunch
\`\`\`
This runs the interactive flow: name → deploy → open editor

**If they choose 2 (Marketing Team):**
Invoke \`/build-swarm\` with marketing preset

**If they choose 3 (Alliance):**
Invoke \`/alliance\` skill

**If they describe something else:**
Use your judgment to scaffold the right template

---

## First-Time Setup

If no .env or API key:

\`\`\`
╭────────────────────────────────────────────────────────────────╮
│  FIRST TIME SETUP                                              │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  1. Get your Agentverse API key:                               │
│     https://agentverse.ai/settings/api-keys                   │
│                                                                │
│  2. Set it up:                                                 │
│     npx agentlaunch init                                       │
│                                                                │
│  3. Get testnet tokens (free):                                 │
│     Message @gift on Agentverse: "claim 0x<your-wallet>"      │
│     You'll receive 200 TFET + 0.005 tBNB instantly            │
│                                                                │
╰────────────────────────────────────────────────────────────────╯
\`\`\`

---

## Tone

- **Welcoming** — Make them feel at home
- **Clear** — Show exactly what they have and what's possible
- **Helpful** — Guide them to the right choice
- **Elegant** — Clean formatting, no clutter

This is their first impression. Make it great.`,
};
// ---------------------------------------------------------------------------
// Docs — Full documentation
// ---------------------------------------------------------------------------

export const DOCS: Record<string, string> = {
  "getting-started.md": `# Getting Started

## Prerequisites
- Node.js 18+
- Agentverse API key from https://agentverse.ai/profile/api-keys

## Quick Start

\`\`\`bash
# Set API key
export AGENTVERSE_API_KEY=av-xxx

# Create agent project (deploys by default)
npx agentlaunch my-agent

# Or scaffold only (no deploy)
npx agentlaunch my-agent --local

# Or deploy a full swarm
npx agentlaunch --mode swarm

# Or use SDK
npm install agentlaunch-sdk
\`\`\`

## The Agent-Human Handoff

Token deployment requires a human signature:
1. Agent calls API -> gets handoff link
2. Agent shares link with human
3. Human opens link, connects wallet, signs
4. Token goes live

Agents CAN trade autonomously after deployment using HoldingsManager + BSC_PRIVATE_KEY.

## Platform Constants
- Deploy fee: 120 FET
- Graduation: 30,000 FET -> DEX listing
- Trading fee: 2% to protocol treasury (NO creator fee)
`,

  "sdk-reference.md": `# SDK Reference

\`\`\`bash
npm install agentlaunch-sdk
\`\`\`

## Key Functions

\`\`\`typescript
import {
  tokenize,           // Create token record
  getToken,           // Get token details
  listTokens,         // List all tokens
  getTokenPrice,      // Get current price
  getTokenHolders,    // Get holder list
  generateDeployLink, // Create deploy URL
  generateBuyLink,    // Create buy URL
  generateSellLink,   // Create sell URL
  deployAgent,        // Deploy to Agentverse
  getAgentRevenue,    // Get agent revenue data
  getPricingTable,    // Get agent pricing table
  getNetworkGDP,      // Get swarm GDP metrics
  listStorage,        // List agent storage keys
  getStorage,         // Get agent storage value
  putStorage,         // Set agent storage value
  deleteStorage,      // Delete agent storage key
} from 'agentlaunch-sdk';
\`\`\`

## Example: Create Token

\`\`\`typescript
const { data } = await tokenize({
  agentAddress: 'agent1q...',
  name: 'My Agent',
  symbol: 'MYAG',
  chainId: 97,
});

console.log(data.handoff_link); // Share with human
\`\`\`
`,

  "cli-reference.md": `# CLI Reference

\`\`\`bash
npm install -g agentlaunch
\`\`\`

## Commands

| Command | Description |
|---------|-------------|
| \`npx agentlaunch\` | Interactive: prompts for name, deploys by default |
| \`npx agentlaunch <name>\` | Create agent with name (deploys by default) |
| \`npx agentlaunch <name> --local\` | Scaffold only, no deploy |
| \`agentlaunch deploy\` | Deploy agent.py to Agentverse |
| \`agentlaunch tokenize\` | Create token + handoff link |
| \`agentlaunch list\` | List tokens |
| \`agentlaunch status <addr>\` | Token details |
| \`agentlaunch config set-key\` | Store API key |

## Full Workflow

\`\`\`bash
npx agentlaunch my-agent
# Prompts for description + API key -> agent deployed
\`\`\`
`,

  "mcp-tools.md": `# MCP Tools Reference

The MCP server provides 13+ tools for Claude Code.

## Setup

Already configured in \`.claude/settings.json\`.

## Key Tools

| Tool | Description |
|------|-------------|
| \`scaffold_agent\` | Generate agent code from template |
| \`scaffold_swarm\` | Scaffold agent from swarm-starter preset |
| \`deploy_to_agentverse\` | Deploy agent |
| \`create_token_record\` | Create token |
| \`list_tokens\` | Browse tokens |
| \`get_token\` | Token details |
| \`calculate_buy\` | Preview buy |
| \`calculate_sell\` | Preview sell |
| \`get_trade_link\` | Generate trade URL |
| \`check_agent_commerce\` | Revenue, pricing, balance for an agent |
| \`network_status\` | Swarm GDP, per-agent health |
| \`deploy_swarm\` | Deploy multiple agents as a swarm |

## Example Prompts

- "Create a price monitoring agent"
- "Deploy my agent to Agentverse"
- "Tokenize my agent as $MYTOKEN"
- "Show trending tokens"
- "Deploy a Writer + Social + Analytics swarm"
- "Check my swarm's GDP"
`,
};

// ---------------------------------------------------------------------------
// Examples — Reference implementations
// ---------------------------------------------------------------------------

export const EXAMPLES: Record<string, string> = {
  "price-monitor.py": `"""
Price Monitor Agent — Token Price Alerts

Monitors token prices and sends alerts when thresholds are crossed.
"""

from datetime import datetime
from uuid import uuid4
import os
import requests
from uagents import Agent, Context, Protocol
from uagents_core.contrib.protocols.chat import (
    ChatAcknowledgement, ChatMessage, TextContent,
    EndSessionContent, chat_protocol_spec
)

agent = Agent()
chat_proto = Protocol(spec=chat_protocol_spec)

API_URL = os.environ.get("AGENT_LAUNCH_API_URL", "https://agent-launch.ai/api")

# Store watches: user_id -> [{address, threshold}]
watches = {}

def fetch_price(token_address: str) -> float | None:
    try:
        r = requests.get(f"{API_URL}/tokens/address/{token_address}", timeout=10)
        if r.ok:
            return float(r.json().get("price", 0))
    except:
        pass
    return None

@chat_proto.on_message(ChatMessage)
async def handle(ctx: Context, sender: str, msg: ChatMessage):
    await ctx.send(sender, ChatAcknowledgement(
        timestamp=datetime.now(), acknowledged_msg_id=msg.msg_id
    ))

    text = msg.content[0].text if msg.content else ""

    if text.startswith("watch "):
        addr = text.split()[1]
        price = fetch_price(addr)
        if price:
            watches.setdefault(sender, []).append({"address": addr, "baseline": price})
            response = f"Watching {addr[:12]}... at {price:.6f} FET"
        else:
            response = "Could not fetch price"
    elif text.startswith("price "):
        addr = text.split()[1]
        price = fetch_price(addr)
        response = f"{price:.6f} FET" if price else "Error"
    else:
        response = "Commands: watch <addr>, price <addr>"

    await ctx.send(sender, ChatMessage(
        timestamp=datetime.now(), msg_id=uuid4(),
        content=[TextContent(text=response), EndSessionContent()]
    ))

@chat_proto.on_message(ChatAcknowledgement)
async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement):
    pass

agent.include(chat_proto, publish_manifest=True)

if __name__ == "__main__":
    agent.run()
`,

  "trading-signals.py": `"""
Trading Signal Agent — Buy/Sell Recommendations

Analyzes token prices and generates trading signals.
"""

from datetime import datetime
from uuid import uuid4
import os
import requests
from uagents import Agent, Context, Protocol
from uagents_core.contrib.protocols.chat import (
    ChatAcknowledgement, ChatMessage, TextContent,
    EndSessionContent, chat_protocol_spec
)

agent = Agent()
chat_proto = Protocol(spec=chat_protocol_spec)

API_URL = os.environ.get("AGENT_LAUNCH_API_URL", "https://agent-launch.ai/api")

# Simple price history
price_history = {}

def get_signal(addr: str) -> str:
    try:
        r = requests.get(f"{API_URL}/tokens/address/{addr}", timeout=10)
        if r.ok:
            data = r.json()
            price = float(data.get("price", 0))
            change = float(data.get("price_change_24h", 0))

            history = price_history.setdefault(addr, [])
            history.append(price)
            if len(history) > 10:
                history.pop(0)

            ma = sum(history) / len(history) if history else price
            pct = ((price - ma) / ma * 100) if ma else 0

            if pct > 5:
                return f"BUY - Price {pct:.1f}% above MA"
            elif pct < -5:
                return f"SELL - Price {pct:.1f}% below MA"
            else:
                return f"HOLD - Price at {price:.6f} FET"
    except:
        pass
    return "ERROR"

@chat_proto.on_message(ChatMessage)
async def handle(ctx: Context, sender: str, msg: ChatMessage):
    await ctx.send(sender, ChatAcknowledgement(
        timestamp=datetime.now(), acknowledged_msg_id=msg.msg_id
    ))

    text = msg.content[0].text if msg.content else ""

    if text.startswith("signal "):
        addr = text.split()[1]
        response = get_signal(addr)
    else:
        response = "Usage: signal <token_address>"

    await ctx.send(sender, ChatMessage(
        timestamp=datetime.now(), msg_id=uuid4(),
        content=[TextContent(text=response), EndSessionContent()]
    ))

@chat_proto.on_message(ChatAcknowledgement)
async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement):
    pass

agent.include(chat_proto, publish_manifest=True)

if __name__ == "__main__":
    agent.run()
`,

  "research-agent.py": `"""
Research Agent — AI-Powered Analysis

Uses AI to generate research reports on tokens.
"""

from datetime import datetime
from uuid import uuid4
import os
import requests
from uagents import Agent, Context, Protocol
from uagents_core.contrib.protocols.chat import (
    ChatAcknowledgement, ChatMessage, TextContent,
    EndSessionContent, chat_protocol_spec
)

agent = Agent()
chat_proto = Protocol(spec=chat_protocol_spec)

API_URL = os.environ.get("AGENT_LAUNCH_API_URL", "https://agent-launch.ai/api")
HF_TOKEN = os.environ.get("HF_TOKEN", "")

def get_token_data(addr: str) -> dict:
    try:
        r = requests.get(f"{API_URL}/tokens/address/{addr}", timeout=10)
        if r.ok:
            return r.json()
    except:
        pass
    return {}

def generate_report(query: str, data: dict) -> str:
    if not HF_TOKEN:
        return f"Token: {data.get('name', 'Unknown')}\\nPrice: {data.get('price', '?')} FET\\nProgress: {data.get('progress', 0):.1f}%"

    try:
        prompt = f"Analyze this token: {query}. Data: {data}"
        r = requests.post(
            "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
            headers={"Authorization": f"Bearer {HF_TOKEN}"},
            json={"inputs": prompt, "parameters": {"max_new_tokens": 200}},
            timeout=30
        )
        if r.ok:
            return r.json()[0].get("generated_text", "")[:500]
    except:
        pass
    return "Could not generate report"

@chat_proto.on_message(ChatMessage)
async def handle(ctx: Context, sender: str, msg: ChatMessage):
    await ctx.send(sender, ChatAcknowledgement(
        timestamp=datetime.now(), acknowledged_msg_id=msg.msg_id
    ))

    text = msg.content[0].text if msg.content else ""

    if text.startswith("research "):
        addr = text.split()[1]
        data = get_token_data(addr)
        response = generate_report(text, data)
    else:
        response = "Usage: research <token_address>"

    await ctx.send(sender, ChatMessage(
        timestamp=datetime.now(), msg_id=uuid4(),
        content=[TextContent(text=response), EndSessionContent()]
    ))

@chat_proto.on_message(ChatAcknowledgement)
async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement):
    pass

agent.include(chat_proto, publish_manifest=True)

if __name__ == "__main__":
    agent.run()
`,

  "sdk-tokenize.ts": `/**
 * SDK Example: Create and Tokenize an Agent
 */
import { tokenize, generateDeployLink, getToken } from 'agentlaunch-sdk';

async function main() {
  // Create token record
  const { data } = await tokenize({
    agentAddress: 'agent1q...', // Your Agentverse agent
    name: 'My Agent',
    symbol: 'MYAG',
    description: 'AI research assistant for on-chain analysis',
    chainId: 97, // BSC Testnet
  });

  console.log('Token ID:', data.token_id);
  console.log('Handoff Link:', data.handoff_link);

  // Share this link with a human to deploy on-chain
  // They will pay 120 FET to deploy

  // After deployment, check status
  // const token = await getToken(data.token_address);
  // console.log('Price:', token.price);
}

main().catch(console.error);
`,
};

// ---------------------------------------------------------------------------
// Package.json for scaffolded projects
// ---------------------------------------------------------------------------

export function buildPackageJson(name: string): string {
  return JSON.stringify(
    {
      name: name.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      version: "1.0.0",
      description: `${name} - AgentLaunch Agent`,
      scripts: {
        deploy: "agentlaunch deploy",
        tokenize: "agentlaunch tokenize",
        status: "agentlaunch status",
        list: "agentlaunch list",
      },
      dependencies: {
        "agentlaunch-sdk": "^0.2.0",
      },
      devDependencies: {
        "agentlaunch": "^1.1.0",
      },
    },
    null,
    2
  ) + "\n";
}

// ---------------------------------------------------------------------------
// CLAUDE.md builder for scaffolded projects
// ---------------------------------------------------------------------------

export function buildClaudeMd(name: string): string {
  return `# ${name} — AgentLaunch Agent

## What This Is

An AI agent built with the AgentLaunch Toolkit. It runs on Agentverse and
has a tradeable ERC-20 token on the bonding curve.

## Authentication

**The Agentverse API key is already configured in \`.env\`** — do NOT ask the user for it again.
To deploy or tokenize, simply run the commands below. The SDK and CLI read from \`.env\` automatically.

## Templates

| Template | Description | Use Case |
|----------|-------------|----------|
| \`swarm-starter\` | **Full commerce stack** (recommended) | Any agent that charges for services |
| \`custom\` | Blank Chat Protocol boilerplate | Start from scratch |
| \`price-monitor\` | Watch token prices, send alerts | Monitoring service |
| \`trading-bot\` | Buy/sell signal generation | Trading service |
| \`data-analyzer\` | On-chain data analysis | Analytics service |
| \`research\` | Deep dives and reports | Research service |
| \`gifter\` | Treasury wallet + rewards | Community incentives |

## Agent Swarms

The swarm-starter template generates agents with a complete commerce stack:
- PaymentService, PricingTable, TierManager (charge for services)
- WalletManager, RevenueTracker (track revenue)
- SelfAwareMixin (token price awareness)
- HoldingsManager (buy/sell other tokens)

### Presets
7 pre-configured roles: writer, social, community, analytics, outreach, ads, strategy.
Use presets for instant configuration.

## Quick Commands

- \`npm run deploy\` — Deploy to Agentverse
- \`npm run tokenize\` — Create token + handoff link
- \`npm run status\` — Check status

## Key Files

- \`agent.py\` — Your agent code (edit this!)
- \`CLAUDE.md\` — This file
- \`docs/\` — SDK, CLI, MCP documentation
- \`examples/\` — Working code samples

## SDK Reference

\`\`\`typescript
import {
  tokenize,           // Create token record
  getToken,           // Get token details
  listTokens,         // List all tokens
  getTokenPrice,      // Get current price
  getTokenHolders,    // Get holder list
  generateDeployLink, // Create deploy URL
  generateBuyLink,    // Create buy URL
  generateSellLink,   // Create sell URL
  deployAgent,        // Deploy to Agentverse
  getAgentRevenue,    // Get agent revenue data
  getPricingTable,    // Get agent pricing table
  getNetworkGDP,      // Get swarm GDP metrics
  listStorage,        // List agent storage keys
  getStorage,         // Get agent storage value
  putStorage,         // Set agent storage value
  deleteStorage,      // Delete agent storage key
} from 'agentlaunch-sdk';
\`\`\`

## MCP Tools

| Tool | Description |
|------|-------------|
| \`scaffold_agent\` | Generate agent code from template |
| \`scaffold_swarm\` | Scaffold agent from swarm-starter preset |
| \`deploy_to_agentverse\` | Deploy agent |
| \`create_token_record\` | Create token |
| \`list_tokens\` | Browse tokens |
| \`get_token\` | Token details |
| \`calculate_buy\` | Preview buy |
| \`calculate_sell\` | Preview sell |
| \`get_trade_link\` | Generate trade URL |
| \`check_agent_commerce\` | Revenue, pricing, balance for an agent |
| \`network_status\` | Swarm GDP, per-agent health |
| \`deploy_swarm\` | Deploy multiple agents as a swarm |

## Platform Constants

- Deploy fee: 120 FET
- Graduation: 30,000 FET liquidity -> auto DEX listing
- Trading fee: 2% to protocol treasury (NO creator fee)
`;
}

// ---------------------------------------------------------------------------
// Cursor IDE config
// ---------------------------------------------------------------------------

export const CURSOR_MCP_CONFIG = JSON.stringify(
  {
    mcpServers: {
      "agent-launch": {
        command: "npx",
        args: ["-y", "agent-launch-mcp"],
        env: {
          AGENTVERSE_API_KEY: "${AGENTVERSE_API_KEY}",
        },
      },
    },
  },
  null,
  2
) + "\n";

export const CURSOR_RULES = `# AgentLaunch Agent Project

This is an AgentLaunch agent project. Use the MCP tools to build, deploy, and tokenize.

## Quick Commands

- \`npm run deploy\` - Deploy to Agentverse
- \`npm run tokenize\` - Create token + handoff link
- \`npm run status\` - Check status

## Key Files

- \`agent.py\` - Your agent code (edit this!)
- \`CLAUDE.md\` - Full context for Claude
- \`docs/\` - SDK, CLI, MCP documentation
- \`examples/\` - Working code samples

## Swarm-Starter Template (Recommended)

Use the swarm-starter template for agents with a full commerce stack:
- Payment handling, pricing tables, revenue tracking
- Token-gated tiers, wallet management
- 7 presets: writer, social, community, analytics, outreach, ads, strategy

## Platform Constants

- Deploy fee: 120 FET
- Graduation: 30,000 FET liquidity
- Trading fee: 2% to protocol treasury (NO creator fee)
`;

// ---------------------------------------------------------------------------
// Swarm-specific generators
// ---------------------------------------------------------------------------

export interface SwarmAgent {
  name: string;
  preset: string;
  address: string;
  status: string;
  code?: string;
}

export interface SwarmContext {
  swarmName: string;
  agents: SwarmAgent[];
  peerAddresses: Record<string, string>;
  deployedAt: string;
}

/**
 * Builds a CLAUDE.md for deployed agents (single or swarm).
 * This gives Claude Code full context about what was deployed.
 */
export function buildSwarmClaudeMd(ctx: SwarmContext): string {
  const isSingleAgent = ctx.agents.length === 1;

  const presetDescriptions: Record<string, string> = {
    writer: "Content creator — blog posts, tweet threads, newsletters, ad copy (0.01 FET/call)",
    social: "Social media manager — post tweets, schedule threads, reply to mentions (0.005 FET/call)",
    community: "Community manager — moderate, answer FAQs, run polls (0.002 FET/call)",
    analytics: "Analytics engine — engagement reports, audience insights, content performance (0.005 FET/call)",
    outreach: "Partnership outreach — find partners, draft pitches, send emails (0.01 FET/call)",
    ads: "Ad campaign manager — create ads, A/B test, campaign reports (0.01 FET/call)",
    strategy: "Marketing strategist — content calendars, brand audits, competitor analysis, campaign plans (0.02 FET/call)",
  };

  if (isSingleAgent) {
    const agent = ctx.agents[0];
    const desc = presetDescriptions[agent.preset] || agent.preset;
    return `# ${ctx.swarmName}

## Your Agent

| Field | Value |
|-------|-------|
| **Name** | ${agent.name} |
| **Type** | ${agent.preset.charAt(0).toUpperCase() + agent.preset.slice(1)} |
| **Address** | \`${agent.address}\` |
| **Status** | ${agent.status} |

**What it does:** ${desc}

## Project Structure

\`\`\`
${ctx.swarmName}/
  agent.py               # Your agent code (edit this!)
  CLAUDE.md              # This file
  agentlaunch.config.json
  .env                   # API key (already configured)
  .claude/               # Claude Code settings
  docs/                  # Documentation
\`\`\`

## What's Already Done

1. **Agent deployed** — Running on Agentverse at \`${agent.address}\`
2. **Commerce ready** — Has pricing built in (${desc.split('—')[1]?.trim() || 'charges for services'})
3. **API key set** — Your Agentverse API key is in \`.env\`

## Next Steps

### 1. Tokenize your agent (so you can earn from trading)
\`\`\`bash
agentlaunch tokenize --agent ${agent.address} --name "${agent.name}" --symbol "${agent.preset.slice(0, 4).toUpperCase()}"
\`\`\`
You'll get a handoff link. Share it with someone who has a wallet to pay the 120 FET deploy fee.

### 2. Customize pricing
Edit \`agent.py\` and look for the \`PRICING\` section. Adjust prices based on value you provide.

### 3. Check status
\`\`\`bash
agentlaunch status ${agent.address}
\`\`\`

## What Makes an Agent Valuable?

Agents earn fees when they provide **real value**:
- **Content creators** (Writer): Produce blog posts, threads, newsletters that other agents consume
- **Data analysts** (Analytics): Sell engagement reports and audience insights
- **Strategists** (Strategy): Become the planning layer other agents depend on

The more agents that depend on yours, the more fees you earn. Consider:
1. What unique content or capability do you have?
2. Who would pay for it?
3. How can you make other agents need your service?

## Quick Diagnostics

\`\`\`bash
# Is your agent running?
agentlaunch status ${agent.address}

# Verify API key is set
echo "Key: $AGENTVERSE_API_KEY" | head -c 20

# List all your agents
agentlaunch list
\`\`\`

## MCP Tools Available

Type \`/\` in Claude Code to access these skills:
- \`/deploy\` — Deploy or redeploy your agent
- \`/tokenize\` — Create a tradeable token
- \`/status\` — Check agent status
- \`/market\` — Browse tokens on AgentLaunch

Or use MCP tools directly:
- \`scaffold_agent\` — Generate agent code
- \`deploy_to_agentverse\` — Deploy to Agentverse
- \`create_token_record\` — Tokenize an agent
- \`calculate_buy\` / \`calculate_sell\` — Preview trades
- \`check_agent_commerce\` — Revenue and pricing info

## Platform Constants

- Deploy fee: **120 FET** (paid when tokenizing)
- Graduation: **30,000 FET** liquidity → auto DEX listing
- Trading fee: **2%** → 100% to protocol treasury (no creator fee)
`;
  }

  // Multi-agent swarm
  const agentTable = ctx.agents
    .map((a) => `| ${a.preset} | \`${a.address}\` | ${a.status} |`)
    .join("\n");

  const addressList = ctx.agents
    .map((a) => `${a.preset.toUpperCase()}_ADDRESS=${a.address}`)
    .join("\n");

  const roleDetails = ctx.agents
    .map((a) => {
      const desc = presetDescriptions[a.preset] || a.preset;
      return `### ${a.preset.charAt(0).toUpperCase() + a.preset.slice(1)}

- **Address:** \`${a.address}\`
- **Status:** ${a.status}
- **Description:** ${desc}
- **Code:** \`agents/${a.preset}.py\``;
    })
    .join("\n\n");

  return `# ${ctx.swarmName} — Agent Swarm

## What This Is

A deployed multi-agent swarm on the Fetch.ai Agentverse platform.
Deployed at: ${ctx.deployedAt}

## Deployed Agents

| Role | Address | Status |
|------|---------|--------|
${agentTable}

## Agent Roles

${roleDetails}

## Peer Addresses

These environment variables are set as secrets on each agent so they can communicate:

\`\`\`bash
${addressList}
\`\`\`

## Project Structure

\`\`\`
${ctx.swarmName}/
  CLAUDE.md              # This file (swarm context)
  agentlaunch.config.json # Swarm configuration with all addresses
  .env                   # API key (already configured)
  agents/                # Individual agent code
${ctx.agents.map((a) => `    ${a.preset}.py`).join("\n")}
  .claude/               # Claude Code settings
    settings.json        # MCP server config
    rules/               # Coding guidelines
    skills/              # Slash commands
  docs/                  # SDK, CLI, MCP documentation
  examples/              # Working code samples
\`\`\`

## What's Already Done

1. **Agents deployed** — All ${ctx.agents.length} agents are running on Agentverse
2. **Secrets configured** — Each agent knows its peers' addresses
3. **API key set** — Your Agentverse API key is in \`.env\`

## Next Steps

### 1. Verify agents are running
\`\`\`bash
agentlaunch status ${ctx.agents[0]?.address || "<address>"}
\`\`\`

### 2. Tokenize an agent
\`\`\`bash
agentlaunch tokenize \\
  --agent ${ctx.agents[0]?.address || "<address>"} \\
  --name "${ctx.agents[0]?.name || "AgentName"}" \\
  --symbol "${ctx.agents[0]?.preset?.slice(0, 4).toUpperCase() || "SYMB"}"
\`\`\`

You'll receive a handoff link. Share it with someone who has a wallet to deploy the token on-chain (120 FET fee).

### 3. Customize agent behavior
Edit the code in \`agents/<role>.py\` and redeploy:
\`\`\`bash
agentlaunch deploy --code agents/writer.py --address ${ctx.agents.find((a) => a.preset === "writer")?.address || "<writer-address>"}
\`\`\`

### 4. Monitor the swarm
\`\`\`bash
agentlaunch list  # See all your tokens
\`\`\`

## Quick Diagnostics

\`\`\`bash
# Check all agents' status
${ctx.agents.map((a) => `agentlaunch status ${a.address}  # ${a.preset}`).join("\n")}

# Verify API key
echo "Key: $AGENTVERSE_API_KEY" | head -c 20

# List all tokens you own
agentlaunch list
\`\`\`

## What Makes a Swarm Valuable?

Swarms earn fees when agents **depend on each other**:
- **Writer** produces content → Social, Ads, Outreach consume it
- **Analytics** sells insights → Strategy, Ads buy them
- **Strategy** creates plans → Everyone follows the campaign plan

The more interconnections, the more fees flow. Your agents should:
1. Provide unique, high-quality services
2. Consume services from other agents in the swarm
3. Become infrastructure that external agents depend on

## Platform Constants

- Deploy fee: **120 FET** (paid when tokenizing)
- Graduation: **30,000 FET** liquidity → auto DEX listing
- Trading fee: **2%** → 100% to protocol treasury (no creator fee)

## Skills & MCP Tools

Type \`/\` in Claude Code for skills:
- \`/deploy\` — Deploy or redeploy an agent
- \`/tokenize\` — Create a tradeable token
- \`/status\` — Check agent status
- \`/market\` — Browse tokens

MCP tools available:
- \`list_tokens\` — Browse all tokens
- \`get_token\` — Get details for a specific token
- \`calculate_buy\` / \`calculate_sell\` — Preview trades
- \`create_token_record\` — Tokenize an agent
- \`deploy_to_agentverse\` — Deploy code updates
- \`check_agent_commerce\` — Revenue, pricing, balance
- \`network_status\` — Swarm GDP, per-agent health

## Resources

- [AgentLaunch Platform](https://agent-launch.ai)
- [Agentverse](https://agentverse.ai)
- [Your Agents](https://agentverse.ai/agents)
`;
}

/**
 * Builds agentlaunch.config.json for a deployed swarm.
 */
export function buildSwarmConfig(ctx: SwarmContext): string {
  const agents: Record<string, { address: string; status: string }> = {};
  for (const a of ctx.agents) {
    agents[a.preset] = { address: a.address, status: a.status };
  }

  return JSON.stringify(
    {
      name: ctx.swarmName,
      type: "swarm",
      chain: 97,
      deployedAt: ctx.deployedAt,
      agents,
      peerAddresses: ctx.peerAddresses,
    },
    null,
    2
  ) + "\n";
}

/**
 * Builds package.json for a deployed swarm.
 */
export function buildSwarmPackageJson(swarmName: string): string {
  return JSON.stringify(
    {
      name: swarmName.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      version: "1.0.0",
      description: `${swarmName} - AgentLaunch Swarm`,
      scripts: {
        status: "agentlaunch status",
        list: "agentlaunch list",
        tokenize: "agentlaunch tokenize",
      },
      dependencies: {
        "agentlaunch-sdk": "^0.2.0",
      },
      devDependencies: {
        "agentlaunch": "^1.1.0",
      },
    },
    null,
    2
  ) + "\n";
}

// ---------------------------------------------------------------------------
// Project-specific skill generators
// ---------------------------------------------------------------------------

export interface AgentSkillContext {
  name: string;
  preset: string;
  address: string;
  symbol?: string;
}

/**
 * Generates a tokenize skill specific to an agent.
 */
export function buildTokenizeSkill(agent: AgentSkillContext): string {
  const symbol = agent.symbol || agent.preset.slice(0, 4).toUpperCase();
  return `# /tokenize-${agent.preset}

Create a tradeable token for your ${agent.preset} agent.

## Your Agent

- **Name:** ${agent.name}
- **Address:** \`${agent.address}\`
- **Suggested Symbol:** ${symbol}

## Command

Run this to create a token:

\`\`\`bash
agentlaunch tokenize \\
  --agent ${agent.address} \\
  --name "${agent.name}" \\
  --symbol "${symbol}"
\`\`\`

## What Happens

1. CLI creates a token record on AgentLaunch
2. You get a **handoff link**
3. Share the link with someone who has a wallet
4. They pay 120 FET to deploy the token on-chain
5. Your agent now has a tradeable token!

## After Tokenization

- Token trades on a bonding curve (price goes up as people buy)
- At 30,000 FET liquidity, it auto-lists on DEX
- 2% trading fee goes to protocol (no creator fee)

## Pro Tips

- Pick a memorable symbol (3-5 chars)
- Write a good description — it shows on the token page
- The first buyers get the best price (bonding curve)
`;
}

/**
 * Generates a status skill specific to an agent.
 */
export function buildStatusSkill(agent: AgentSkillContext): string {
  return `# /status-${agent.preset}

Check the status of your ${agent.preset} agent.

## Your Agent

- **Name:** ${agent.name}
- **Address:** \`${agent.address}\`

## Commands

### Check if running
\`\`\`bash
agentlaunch status ${agent.address}
\`\`\`

### View logs (if issues)
\`\`\`bash
# Via Agentverse dashboard
open "https://agentverse.ai/agents/local/${agent.address}/logs"
\`\`\`

### Restart if stuck
\`\`\`bash
agentlaunch deploy --address ${agent.address}
\`\`\`

## Common Issues

- **"compiling" for >60s** — Check logs for syntax errors
- **"stopped"** — Redeploy with \`agentlaunch deploy\`
- **No responses** — Verify Chat Protocol handlers are correct
`;
}

/**
 * Generates a redeploy skill specific to an agent.
 */
export function buildRedeploySkill(agent: AgentSkillContext, isSingleAgent: boolean): string {
  const codePath = isSingleAgent ? "agent.py" : `agents/${agent.preset}.py`;
  return `# /redeploy-${agent.preset}

Redeploy your ${agent.preset} agent after making changes.

## Your Agent

- **Name:** ${agent.name}
- **Address:** \`${agent.address}\`
- **Code:** \`${codePath}\`

## Command

After editing ${codePath}, run:

\`\`\`bash
agentlaunch deploy --code ${codePath} --address ${agent.address}
\`\`\`

## What Gets Updated

- Agent code (the Python file)
- Dependencies are reinstalled
- Agent restarts automatically

## What Does NOT Change

- Agent address (stays the same)
- Secrets (already configured)
- Token (if tokenized)

## Workflow

1. Edit \`${codePath}\`
2. Run the deploy command above
3. Wait 15-60s for compilation
4. Check status: \`agentlaunch status ${agent.address}\`
`;
}

/**
 * Generates all project-specific skills for an agent.
 * Returns a map of filepath -> content.
 */
export function buildProjectSkills(
  agents: AgentSkillContext[],
  isSingleAgent: boolean
): Record<string, string> {
  const skills: Record<string, string> = {};

  for (const agent of agents) {
    const prefix = agent.preset;
    skills[`tokenize-${prefix}/SKILL.md`] = buildTokenizeSkill(agent);
    skills[`status-${prefix}/SKILL.md`] = buildStatusSkill(agent);
    skills[`redeploy-${prefix}/SKILL.md`] = buildRedeploySkill(agent, isSingleAgent);
  }

  return skills;
}
