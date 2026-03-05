# Consumer Payments Rules

## Multi-Token Support

The toolkit supports FET and USDC on BSC (Testnet chain 97, Mainnet chain 56).

### Known Token Addresses

| Token | Chain | Address |
|-------|-------|---------|
| FET | BSC Testnet (97) | `0x304ddf3eE068c53514f782e2341B71A80c8aE3C7` |
| FET | BSC Mainnet (56) | `0xBd5df99ABe0E2b1e86BE5eC0039d1e24de28Fe87` |
| USDC | BSC Testnet (97) | `0x64544969ed7EBf5f083679233325356EbE738930` |
| USDC | BSC Mainnet (56) | `0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d` |

### Token Registry

Use `getToken(symbol, chainId)` to look up tokens. Never hardcode addresses.

```typescript
import { getToken, KNOWN_TOKENS } from 'agentlaunch-sdk';
const fet = getToken('FET', 97);   // PaymentToken object
const usdc = getToken('USDC', 97); // PaymentToken object
```

## Spending Delegation

Uses standard ERC-20 `approve()` / `transferFrom()` — no custom contracts.

### Flow

1. Agent generates delegation handoff link → sends to human
2. Human opens link, connects wallet, signs `approve()` transaction
3. Agent checks allowance on-chain with `checkAllowance()`
4. Agent spends from delegation with `spendFromDelegation()` (calls `transferFrom`)

### SDK Functions

```typescript
import { checkAllowance, spendFromDelegation, createSpendingLimitHandoff } from 'agentlaunch-sdk';

// Generate link for human to approve
const link = createSpendingLimitHandoff({ tokenSymbol: 'FET', amount: '100' }, agentWallet);

// Check on-chain allowance
const limit = await checkAllowance(tokenAddress, ownerAddress, spenderAddress, 97);

// Spend from delegation
const result = await spendFromDelegation(tokenAddress, owner, recipient, '10');
```

## Invoices

Invoices are stored in Agentverse agent storage (consistent with existing revenue/pricing patterns).

### Storage Keys

- `invoice_{id}` — Individual invoice JSON
- `invoice_index` — Array of invoice IDs

### Invoice Lifecycle

`pending` → `paid` → (done)
`pending` → `expired`
`paid` → `refunded`
`paid` → `disputed`

### SDK Functions

```typescript
import { createInvoice, getInvoice, listInvoices, updateInvoiceStatus } from 'agentlaunch-sdk';

const inv = await createInvoice(agentAddress, { id, issuer, payer, service, amount });
const invoices = await listInvoices(agentAddress, 'pending');
await updateInvoiceStatus(agentAddress, invoiceId, 'paid', txHash);
```

## Fiat Onramp

Fiat is handoff-only — generate URLs to MoonPay/Transak, never process fiat directly.

### Supported Providers

| Provider | Env Var | URL |
|----------|---------|-----|
| MoonPay | `MOONPAY_API_KEY` | `https://buy.moonpay.com` |
| Transak | `TRANSAK_API_KEY` | `https://global.transak.com` |

### SDK Function

```typescript
import { generateFiatOnrampLink } from 'agentlaunch-sdk';

const link = generateFiatOnrampLink({
  fiatAmount: '50',
  fiatCurrency: 'USD',
  cryptoToken: 'FET',
  walletAddress: '0x...',
  provider: 'moonpay',
});
// Returns { provider, url }
```

## Consumer Commerce Template

The `consumer-commerce` template generates agents with:
- MultiTokenPricingTable — FET + USDC columns
- InvoiceManager — CRUD in ctx.storage
- FiatOnrampHelper — card purchase link generation
- DelegationChecker — verify allowance before auto-pay

### Presets

| Preset | Symbol | Use Case |
|--------|--------|----------|
| `payment-processor` | $PAY | Multi-token payment routing |
| `booking-agent` | $BOOK | Service booking + payment |
| `subscription-manager` | $SUB | Recurring billing with delegation |
| `escrow-service` | $ESCR | Funds held until delivery confirmed |

### Scaffold Command

```bash
agentlaunch scaffold my-agent --type consumer-commerce
```

## MCP Tools

| Tool | Description |
|------|-------------|
| `multi_token_payment` | Send FET, USDC, or ERC-20 payment |
| `check_spending_limit` | Read ERC-20 allowance |
| `create_delegation` | Generate delegation handoff link |
| `get_fiat_link` | Generate MoonPay/Transak URL |
| `create_invoice` | Create payment invoice |
| `list_invoices` | List invoices by status |
| `get_multi_token_balances` | Query FET + USDC + BNB balances |

## CLI Commands

```bash
agentlaunch wallet balances                          # Multi-token balance display
agentlaunch wallet delegate FET 100 --spender 0x...  # Generate delegation link
agentlaunch wallet allowance FET --owner 0x... --spender 0x...  # Check limit
agentlaunch wallet send USDC 0x... 10                # Multi-token transfer
agentlaunch pay 0x... 10 --token USDC                # Pay in any token
agentlaunch invoice create --agent agent1q... --payer 0x... --service api --amount 10
agentlaunch invoice list --agent agent1q... --status pending
```

## Backward Compatibility

- All new type fields are optional — existing FET-only agents are unchanged
- New fields on PricingEntry: `altPrices?`, `acceptedTokens?`
- New fields on AgentRevenue: `revenueByToken?`
- New fields on AgentCommerceStatus: `usdcBalance?`, `tokenBalances?`, `activeInvoices?`, `delegations?`
- Default token is always FET when not specified
