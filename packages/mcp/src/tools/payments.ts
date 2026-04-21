/**
 * MCP tool handlers for multi-token payment operations.
 *
 * Tools: multi_token_payment, check_spending_limit, create_delegation,
 *        get_fiat_link, create_invoice, list_invoices, get_multi_token_balances
 */

import {
  getPaymentToken,
  getMultiTokenBalances,
  transferToken,
  createInvoice,
  listInvoices,
  checkAllowance,
  createSpendingLimitHandoff,
  generateFiatOnrampLink,
} from '@fetchai/agent-launch-sdk';
import type {
  PaymentToken,
  Invoice,
  InvoiceStatus,
  SpendingLimit,
  FiatOnrampLink,
  TokenAmount,
} from '@fetchai/agent-launch-sdk';

// ---------------------------------------------------------------------------
// Spending safety
// ---------------------------------------------------------------------------

/**
 * Maximum amount (in token units) that a single MCP tool call can transfer.
 * Override with MCP_PAYMENT_LIMIT env var. Default: 100.
 */
const MCP_PAYMENT_LIMIT = parseFloat(process.env['MCP_PAYMENT_LIMIT'] ?? '100');

// ---------------------------------------------------------------------------
// multi_token_payment
// ---------------------------------------------------------------------------

/** Send an ERC-20 payment (FET, USDC, or any ERC-20). */
export async function multiTokenPaymentTool(args: {
  tokenSymbol: string;
  to: string;
  amount: string;
  chainId?: number;
}): Promise<{ txHash: string; blockNumber: number; token: string; amount: string; to: string; _markdown: string }> {
  const chainId = args.chainId ?? 56;
  const token = getPaymentToken(args.tokenSymbol, chainId);
  if (!token) {
    throw new Error(`Unknown token: ${args.tokenSymbol} on chain ${chainId}. Known: FET, USDC.`);
  }

  // Spending cap — reject amounts above MCP_PAYMENT_LIMIT
  const numericAmount = parseFloat(args.amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    throw new Error(`Invalid amount: ${args.amount}. Must be a positive number.`);
  }
  if (numericAmount > MCP_PAYMENT_LIMIT) {
    throw new Error(
      `Amount ${args.amount} ${args.tokenSymbol} exceeds MCP per-call spending limit of ${MCP_PAYMENT_LIMIT}. ` +
      `Set MCP_PAYMENT_LIMIT env var to increase, or use the CLI for large transfers.`,
    );
  }

  const privateKey = process.env['WALLET_PRIVATE_KEY'];
  if (!privateKey) {
    throw new Error('WALLET_PRIVATE_KEY env var required for token transfers.');
  }

  const result = await transferToken(
    token.contractAddress,
    args.to,
    args.amount,
    privateKey,
    chainId,
  );

  const bscscanBase = chainId === 97 ? 'https://testnet.bscscan.com/tx' : 'https://bscscan.com/tx';
  const explorerLink = `${bscscanBase}/${result.txHash}`;

  const _markdown = `# Payment Sent

| Field | Value |
|-------|-------|
| Token | ${args.tokenSymbol.toUpperCase()} |
| Amount | ${args.amount} |
| To | \`${args.to}\` |
| Tx Hash | \`${result.txHash}\` |
| Block | ${result.blockNumber} |

[View on BscScan](${explorerLink})

## Next Steps
- Verify balances: \`get_multi_token_balances({ walletAddress: "${args.to}" })\`
- Create invoice: \`create_invoice\``;

  return {
    ...result,
    token: args.tokenSymbol.toUpperCase(),
    amount: args.amount,
    to: args.to,
    _markdown,
  } as { txHash: string; blockNumber: number; token: string; amount: string; to: string; _markdown: string };
}

// ---------------------------------------------------------------------------
// check_spending_limit
// ---------------------------------------------------------------------------

/** Check ERC-20 allowance (delegation check). */
export async function checkSpendingLimitTool(args: {
  tokenSymbol: string;
  owner: string;
  spender: string;
  chainId?: number;
}): Promise<SpendingLimit & { _markdown: string }> {
  const chainId = args.chainId ?? 56;
  const token = getPaymentToken(args.tokenSymbol, chainId);
  if (!token) {
    throw new Error(`Unknown token: ${args.tokenSymbol} on chain ${chainId}`);
  }

  const result = await checkAllowance(token.contractAddress, args.owner, args.spender, chainId);

  const _markdown = `# Spending Limit: ${args.tokenSymbol.toUpperCase()}

| Field | Value |
|-------|-------|
| Owner | \`${result.owner}\` |
| Spender | \`${result.spender}\` |
| Max Amount | ${result.maxAmount} |
| Spent | ${result.spent} |
| Remaining | ${result.remaining} |
| Token | ${result.token.symbol} |
| Chain | ${chainId} |

## Next Steps
- Allowance insufficient? Create delegation: \`create_delegation\`
- Send payment: \`multi_token_payment\``;

  return { ...result, _markdown } as SpendingLimit & { _markdown: string };
}

// ---------------------------------------------------------------------------
// create_delegation
// ---------------------------------------------------------------------------

/** Generate a delegation handoff link for human approval. */
export async function createDelegationTool(args: {
  tokenSymbol: string;
  amount: string;
  agentAddress: string;
  chainId?: number;
}): Promise<{ link: string; token: string; amount: string; spender: string; _markdown: string }> {
  const link = createSpendingLimitHandoff(
    {
      tokenSymbol: args.tokenSymbol,
      amount: args.amount,
      chainId: args.chainId,
    },
    args.agentAddress,
  );

  const _markdown = `# Delegation Link Created

**Share this link with the token holder to approve the spending limit:**

> **${link}**

| Field | Value |
|-------|-------|
| Token | ${args.tokenSymbol.toUpperCase()} |
| Amount | ${args.amount} |
| Agent (Spender) | \`${args.agentAddress}\` |

## Next Steps
1. Share the link — user clicks and approves in their wallet
2. Verify approval: \`check_spending_limit({ tokenSymbol: "${args.tokenSymbol}", owner: "USER_ADDR", spender: "${args.agentAddress}" })\`
3. Send payment: \`multi_token_payment\``;

  return {
    link,
    token: args.tokenSymbol.toUpperCase(),
    amount: args.amount,
    spender: args.agentAddress,
    _markdown,
  };
}

// ---------------------------------------------------------------------------
// get_fiat_link
// ---------------------------------------------------------------------------

/** Generate a fiat onramp link (MoonPay/Transak). */
export async function getFiatLinkTool(args: {
  fiatAmount: string;
  fiatCurrency?: string;
  cryptoToken?: string;
  walletAddress: string;
  provider?: 'moonpay' | 'transak';
}): Promise<FiatOnrampLink & { _markdown: string }> {
  const result = await generateFiatOnrampLink({
    fiatAmount: args.fiatAmount,
    fiatCurrency: args.fiatCurrency ?? 'USD',
    cryptoToken: args.cryptoToken ?? 'FET',
    walletAddress: args.walletAddress,
    provider: args.provider,
  });

  const url = result.url;
  const provider = result.provider;

  const _markdown = `# Buy Crypto

**Share this onramp link with the user:**

> **${url}**

| Field | Value |
|-------|-------|
| Fiat Amount | ${args.fiatAmount} ${args.fiatCurrency ?? 'USD'} |
| Crypto | ${args.cryptoToken ?? 'FET'} |
| Wallet | \`${args.walletAddress}\` |
| Provider | ${provider} |

The user completes the purchase in their browser — no wallet signature needed from you.`;

  return { ...result, _markdown } as FiatOnrampLink & { _markdown: string };
}

// ---------------------------------------------------------------------------
// create_invoice
// ---------------------------------------------------------------------------

/**
 * Create a payment invoice.
 *
 * NOTE: Agentverse storage is read-only from external APIs.
 * Invoices must be created by the agent itself using ctx.storage.
 * This tool returns a template for the agent to use.
 */
export async function createInvoiceTool(args: {
  agentAddress: string;
  invoiceId: string;
  payer: string;
  service: string;
  amount: string;
  tokenSymbol?: string;
  chainId?: number;
}): Promise<{ template: string; _markdown: string }> {
  const chainId = args.chainId ?? 56;
  const tokenSymbol = args.tokenSymbol ?? 'FET';
  const token = getPaymentToken(tokenSymbol, chainId);
  if (!token) {
    throw new Error(`Unknown token: ${tokenSymbol} on chain ${chainId}`);
  }

  // Build invoice template for the agent to store
  const invoice = {
    id: args.invoiceId,
    issuer: args.agentAddress,
    payer: args.payer,
    service: args.service,
    amount: { amount: args.amount, token },
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  const template = JSON.stringify(invoice, null, 2);

  const _markdown = `# Invoice Template

**Note:** Agentverse storage is read-only from external APIs. The agent must store this invoice using \`ctx.storage.set()\`.

\`\`\`json
${template}
\`\`\`

## Agent Code to Store Invoice
\`\`\`python
import json
ctx.storage.set("invoice_${args.invoiceId}", json.dumps(${template.replace(/\n/g, '')}))
\`\`\`

## Next Steps
- Send this template to the agent via chat message
- Agent stores it with ctx.storage.set()
- Query later: \`list_invoices({ agentAddress: "${args.agentAddress}" })\``;

  return { template, _markdown };
}

// ---------------------------------------------------------------------------
// list_invoices
// ---------------------------------------------------------------------------

/** List invoices for an agent, optionally filtered by status. */
export async function listInvoicesTool(args: {
  agentAddress: string;
  status?: InvoiceStatus;
}): Promise<{ invoices: Invoice[]; count: number; _markdown: string }> {
  const invoices = await listInvoices(args.agentAddress, args.status);

  const invoiceRows = invoices.length > 0
    ? invoices
        .map((inv) => {
          const amt = inv.amount?.amount ?? '—';
          const tok = inv.amount?.token?.symbol ?? '—';
          return `| ${inv.id} | ${inv.service} | ${amt} ${tok} | ${inv.status} |`;
        })
        .join('\n')
    : '| — | No invoices found | — | — |';

  const statusFilter = args.status ? ` (status: ${args.status})` : '';

  const _markdown = `# Invoices${statusFilter}

**Agent:** \`${args.agentAddress}\` | **Count:** ${invoices.length}

| ID | Service | Amount | Status |
|----|---------|--------|--------|
${invoiceRows}

## Next Steps
- Collect payment: \`multi_token_payment\`
- Create new invoice: \`create_invoice\``;

  return { invoices, count: invoices.length, _markdown };
}

// ---------------------------------------------------------------------------
// get_multi_token_balances
// ---------------------------------------------------------------------------

/** Query FET + USDC + BNB + custom token balances. */
export async function getMultiTokenBalancesTool(args: {
  walletAddress: string;
  tokenSymbols?: string[];
  chainId?: number;
}): Promise<Record<string, string> & { _markdown: string }> {
  const balances = await getMultiTokenBalances(
    args.walletAddress,
    args.tokenSymbols,
    args.chainId,
  );

  const balanceRows = Object.entries(balances)
    .filter(([key]) => key !== '_markdown')
    .map(([token, amount]) => `| ${token} | ${amount} |`)
    .join('\n');

  const chainId = args.chainId ?? 56;

  const _markdown = `# Balances

**Wallet:** \`${args.walletAddress}\`
**Chain:** ${chainId}

| Token | Balance |
|-------|---------|
${balanceRows || '| — | No balances found |'}

## Next Steps
- Send payment: \`multi_token_payment\`
- Need more funds? \`get_fiat_link\`
- Check allowance: \`check_spending_limit\``;

  return { ...balances, _markdown };
}

// ---------------------------------------------------------------------------
// Handler map
// ---------------------------------------------------------------------------

/** Handler map consumed by the tool dispatcher in index.ts. */
export const paymentHandlers = {
  multi_token_payment: multiTokenPaymentTool,
  check_spending_limit: checkSpendingLimitTool,
  create_delegation: createDelegationTool,
  get_fiat_link: getFiatLinkTool,
  create_invoice: createInvoiceTool,
  list_invoices: listInvoicesTool,
  get_multi_token_balances: getMultiTokenBalancesTool,
};
