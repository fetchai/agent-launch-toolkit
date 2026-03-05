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
} from 'agentlaunch-sdk';
import type {
  PaymentToken,
  Invoice,
  InvoiceStatus,
  SpendingLimit,
  FiatOnrampLink,
  TokenAmount,
} from 'agentlaunch-sdk';

// ---------------------------------------------------------------------------
// multi_token_payment
// ---------------------------------------------------------------------------

/** Send an ERC-20 payment (FET, USDC, or any ERC-20). */
export async function multiTokenPaymentTool(args: {
  tokenSymbol: string;
  to: string;
  amount: string;
  chainId?: number;
}): Promise<{ txHash: string; blockNumber: number; token: string; amount: string; to: string }> {
  const chainId = args.chainId ?? 97;
  const token = getPaymentToken(args.tokenSymbol, chainId);
  if (!token) {
    throw new Error(`Unknown token: ${args.tokenSymbol} on chain ${chainId}. Known: FET, USDC.`);
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

  return {
    ...result,
    token: args.tokenSymbol.toUpperCase(),
    amount: args.amount,
    to: args.to,
  };
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
}): Promise<SpendingLimit> {
  const chainId = args.chainId ?? 97;
  const token = getPaymentToken(args.tokenSymbol, chainId);
  if (!token) {
    throw new Error(`Unknown token: ${args.tokenSymbol} on chain ${chainId}`);
  }

  return checkAllowance(token.contractAddress, args.owner, args.spender, chainId);
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
}): Promise<{ link: string; token: string; amount: string; spender: string }> {
  const link = createSpendingLimitHandoff(
    {
      tokenSymbol: args.tokenSymbol,
      amount: args.amount,
      chainId: args.chainId,
    },
    args.agentAddress,
  );

  return {
    link,
    token: args.tokenSymbol.toUpperCase(),
    amount: args.amount,
    spender: args.agentAddress,
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
}): Promise<FiatOnrampLink> {
  return generateFiatOnrampLink({
    fiatAmount: args.fiatAmount,
    fiatCurrency: args.fiatCurrency ?? 'USD',
    cryptoToken: args.cryptoToken ?? 'FET',
    walletAddress: args.walletAddress,
    provider: args.provider,
  });
}

// ---------------------------------------------------------------------------
// create_invoice
// ---------------------------------------------------------------------------

/** Create a payment invoice in agent storage. */
export async function createInvoiceTool(args: {
  agentAddress: string;
  invoiceId: string;
  payer: string;
  service: string;
  amount: string;
  tokenSymbol?: string;
  chainId?: number;
}): Promise<Invoice> {
  const chainId = args.chainId ?? 97;
  const tokenSymbol = args.tokenSymbol ?? 'FET';
  const token = getPaymentToken(tokenSymbol, chainId);
  if (!token) {
    throw new Error(`Unknown token: ${tokenSymbol} on chain ${chainId}`);
  }

  const amount: TokenAmount = {
    amount: args.amount,
    token,
  };

  return createInvoice(args.agentAddress, {
    id: args.invoiceId,
    issuer: args.agentAddress,
    payer: args.payer,
    service: args.service,
    amount,
  });
}

// ---------------------------------------------------------------------------
// list_invoices
// ---------------------------------------------------------------------------

/** List invoices for an agent, optionally filtered by status. */
export async function listInvoicesTool(args: {
  agentAddress: string;
  status?: InvoiceStatus;
}): Promise<{ invoices: Invoice[]; count: number }> {
  const invoices = await listInvoices(args.agentAddress, args.status);
  return { invoices, count: invoices.length };
}

// ---------------------------------------------------------------------------
// get_multi_token_balances
// ---------------------------------------------------------------------------

/** Query FET + USDC + BNB + custom token balances. */
export async function getMultiTokenBalancesTool(args: {
  walletAddress: string;
  tokenSymbols?: string[];
  chainId?: number;
}): Promise<Record<string, string>> {
  return getMultiTokenBalances(
    args.walletAddress,
    args.tokenSymbols,
    args.chainId,
  );
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
