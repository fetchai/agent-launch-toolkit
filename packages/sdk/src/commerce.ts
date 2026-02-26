/**
 * agentlaunch-sdk — Commerce data operations
 *
 * EXT-02: Read commerce data (revenue, pricing, GDP) from agent storage.
 *
 * These methods read structured commerce data that Genesis Network agents
 * store via the Agentverse storage API.  They parse well-known storage keys
 * (`revenue_summary`, `revenue_log`, `pricing_table`, `effort_mode`, etc.)
 * into typed TypeScript objects.
 *
 * All reads go through the EXT-01 storage module — no direct HTTP calls here.
 */

import { getStorage, listStorage } from './storage.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Aggregated revenue data for a single agent. */
export interface AgentRevenue {
  /** Total income received, in atestfet. */
  totalIncome: number;
  /** Total expenses paid, in atestfet. */
  totalExpenses: number;
  /** Net revenue (income - expenses), in atestfet. */
  netRevenue: number;
  /** Number of recorded transactions. */
  transactionCount: number;
  /** ISO datetime of the last revenue update. */
  lastUpdated: string;
  /** Daily breakdown: date string -> income/expenses for that day. */
  dailySummary: Record<string, { income: number; expenses: number }>;
}

/** A single pricing table entry for an agent's services. */
export interface PricingEntry {
  /** Name of the service. */
  service: string;
  /** Price in atestfet. */
  priceAfet: number;
  /** Optional human-readable description. */
  description?: string;
}

/** Combined commerce status for a single agent. */
export interface AgentCommerceStatus {
  /** Agent's Agentverse address (agent1q...). */
  address: string;
  /** Revenue data. */
  revenue: AgentRevenue;
  /** Pricing table entries. */
  pricing: PricingEntry[];
  /** Wallet balance in atestfet. */
  fetBalance: number;
  /** Effort mode: "normal", "boost", or "conserve". */
  effortMode: string;
  /** Service tier: "free" or "premium". */
  tier: string;
  /** Token contract address, if the agent has been tokenized. */
  tokenAddress?: string;
  /** Current token price (string to preserve precision). */
  tokenPrice?: string;
  /** Number of token holders. */
  holderCount?: number;
}

/** Network-wide GDP summary across multiple agents. */
export interface NetworkGDP {
  /** Commerce status for each queried agent. */
  agents: AgentCommerceStatus[];
  /** Sum of all net revenues across agents, in atestfet. */
  totalGDP: number;
  /** Total transaction count across all agents. */
  totalTransactions: number;
  /** Number of agents that have non-zero revenue. */
  activeAgents: number;
  /** ISO datetime when this snapshot was taken. */
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Safely parse a JSON string, returning a fallback on failure. */
function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Build a default (empty) AgentRevenue object. */
function emptyRevenue(): AgentRevenue {
  return {
    totalIncome: 0,
    totalExpenses: 0,
    netRevenue: 0,
    transactionCount: 0,
    lastUpdated: new Date().toISOString(),
    dailySummary: {},
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Read revenue data for an Agentverse agent.
 *
 * Reads `revenue_summary` and `revenue_log` keys from agent storage.
 * Returns a typed `AgentRevenue` object with totals and a daily breakdown.
 *
 * If the agent has no revenue data, returns zeroed defaults.
 *
 * @param agentAddress  Agent address (agent1q...)
 * @param apiKey        Agentverse API key (falls back to env vars)
 *
 * @example
 * ```ts
 * import { getAgentRevenue } from 'agentlaunch-sdk';
 *
 * const revenue = await getAgentRevenue('agent1q...');
 * console.log(`Net revenue: ${revenue.netRevenue} atestfet`);
 * console.log(`Transactions: ${revenue.transactionCount}`);
 * ```
 */
export async function getAgentRevenue(
  agentAddress: string,
  apiKey?: string,
): Promise<AgentRevenue> {
  // Try the summary key first — this is the primary source
  const summaryRaw = await getStorage(agentAddress, 'revenue_summary', apiKey);
  if (summaryRaw) {
    const summary = safeParse<Partial<AgentRevenue>>(summaryRaw, {});
    return {
      totalIncome: summary.totalIncome ?? 0,
      totalExpenses: summary.totalExpenses ?? 0,
      netRevenue: summary.netRevenue ?? (summary.totalIncome ?? 0) - (summary.totalExpenses ?? 0),
      transactionCount: summary.transactionCount ?? 0,
      lastUpdated: summary.lastUpdated ?? new Date().toISOString(),
      dailySummary: summary.dailySummary ?? {},
    };
  }

  // Fall back to revenue_log — agents may only store the log
  const logRaw = await getStorage(agentAddress, 'revenue_log', apiKey);
  if (logRaw) {
    const log = safeParse<Array<{
      type?: string;
      amount?: number;
      timestamp?: string;
    }>>(logRaw, []);

    let totalIncome = 0;
    let totalExpenses = 0;
    const dailySummary: Record<string, { income: number; expenses: number }> = {};
    let lastUpdated = '';

    for (const entry of log) {
      const amount = entry.amount ?? 0;
      const dateKey = entry.timestamp ? entry.timestamp.slice(0, 10) : 'unknown';

      if (!dailySummary[dateKey]) {
        dailySummary[dateKey] = { income: 0, expenses: 0 };
      }

      if (entry.type === 'expense') {
        totalExpenses += amount;
        dailySummary[dateKey].expenses += amount;
      } else {
        // Default to income for unknown types
        totalIncome += amount;
        dailySummary[dateKey].income += amount;
      }

      if (entry.timestamp && entry.timestamp > lastUpdated) {
        lastUpdated = entry.timestamp;
      }
    }

    return {
      totalIncome,
      totalExpenses,
      netRevenue: totalIncome - totalExpenses,
      transactionCount: log.length,
      lastUpdated: lastUpdated || new Date().toISOString(),
      dailySummary,
    };
  }

  // Also check the legacy `total_revenue` key used by simple agents
  const totalRevenueRaw = await getStorage(agentAddress, 'total_revenue', apiKey);
  if (totalRevenueRaw) {
    const total = parseInt(totalRevenueRaw, 10) || 0;
    return {
      ...emptyRevenue(),
      totalIncome: total,
      netRevenue: total,
      transactionCount: total > 0 ? 1 : 0,
    };
  }

  return emptyRevenue();
}

/**
 * Read the pricing table for an Agentverse agent.
 *
 * Reads the `pricing_table` key from agent storage and returns an array
 * of service names, prices (in atestfet), and optional descriptions.
 *
 * Returns an empty array if no pricing table is configured.
 *
 * @param agentAddress  Agent address (agent1q...)
 * @param apiKey        Agentverse API key (falls back to env vars)
 *
 * @example
 * ```ts
 * import { getPricingTable } from 'agentlaunch-sdk';
 *
 * const pricing = await getPricingTable('agent1q...');
 * for (const p of pricing) {
 *   console.log(`${p.service}: ${p.priceAfet} atestfet`);
 * }
 * ```
 */
export async function getPricingTable(
  agentAddress: string,
  apiKey?: string,
): Promise<PricingEntry[]> {
  const raw = await getStorage(agentAddress, 'pricing_table', apiKey);
  if (!raw) return [];

  const parsed = safeParse<
    Array<Partial<PricingEntry> & { price_afet?: number; price?: number }>
  >(raw, []);

  return parsed.map((entry) => ({
    service: entry.service ?? 'unknown',
    priceAfet: entry.priceAfet ?? entry.price_afet ?? entry.price ?? 0,
    ...(entry.description ? { description: entry.description } : {}),
  }));
}

/**
 * Read the full commerce status for an Agentverse agent.
 *
 * Combines revenue, pricing table, wallet balance, effort mode, tier, and
 * optional token data into a single object. Useful for dashboards and
 * agent-health monitors.
 *
 * @param agentAddress  Agent address (agent1q...)
 * @param apiKey        Agentverse API key (falls back to env vars)
 *
 * @example
 * ```ts
 * import { getAgentCommerceStatus } from 'agentlaunch-sdk';
 *
 * const status = await getAgentCommerceStatus('agent1q...');
 * console.log(`Revenue: ${status.revenue.netRevenue} atestfet`);
 * console.log(`Balance: ${status.fetBalance} atestfet`);
 * console.log(`Tier: ${status.tier}`);
 * ```
 */
export async function getAgentCommerceStatus(
  agentAddress: string,
  apiKey?: string,
): Promise<AgentCommerceStatus> {
  // Fetch all data in parallel for efficiency
  const [revenue, pricing, effortModeRaw, tierRaw, balanceRaw, tokenAddressRaw, tokenPriceRaw, holderCountRaw] =
    await Promise.all([
      getAgentRevenue(agentAddress, apiKey),
      getPricingTable(agentAddress, apiKey),
      getStorage(agentAddress, 'effort_mode', apiKey),
      getStorage(agentAddress, 'tier', apiKey),
      getStorage(agentAddress, 'wallet_balance', apiKey),
      getStorage(agentAddress, 'token_address', apiKey),
      getStorage(agentAddress, 'token_price', apiKey),
      getStorage(agentAddress, 'holder_count', apiKey),
    ]);

  return {
    address: agentAddress,
    revenue,
    pricing,
    fetBalance: parseInt(balanceRaw ?? '0', 10) || 0,
    effortMode: effortModeRaw ?? 'normal',
    tier: tierRaw ?? 'free',
    ...(tokenAddressRaw ? { tokenAddress: tokenAddressRaw } : {}),
    ...(tokenPriceRaw ? { tokenPrice: tokenPriceRaw } : {}),
    ...(holderCountRaw ? { holderCount: parseInt(holderCountRaw, 10) || 0 } : {}),
  };
}

/**
 * Compute network-wide GDP across a set of agents.
 *
 * Calls `getAgentCommerceStatus()` for each address in parallel and
 * aggregates the totals.
 *
 * @param agentAddresses  Array of agent addresses to aggregate
 * @param apiKey          Agentverse API key (falls back to env vars)
 *
 * @example
 * ```ts
 * import { getNetworkGDP } from 'agentlaunch-sdk';
 *
 * const gdp = await getNetworkGDP([
 *   'agent1qOracle...',
 *   'agent1qAnalyst...',
 *   'agent1qBrain...',
 * ]);
 * console.log(`Network GDP: ${gdp.totalGDP} atestfet`);
 * console.log(`Active agents: ${gdp.activeAgents}/${gdp.agents.length}`);
 * ```
 */
export async function getNetworkGDP(
  agentAddresses: string[],
  apiKey?: string,
): Promise<NetworkGDP> {
  // Fetch all agent statuses in parallel
  const agents = await Promise.all(
    agentAddresses.map((addr) => getAgentCommerceStatus(addr, apiKey)),
  );

  let totalGDP = 0;
  let totalTransactions = 0;
  let activeAgents = 0;

  for (const agent of agents) {
    totalGDP += agent.revenue.netRevenue;
    totalTransactions += agent.revenue.transactionCount;
    if (agent.revenue.netRevenue > 0 || agent.revenue.transactionCount > 0) {
      activeAgents++;
    }
  }

  return {
    agents,
    totalGDP,
    totalTransactions,
    activeAgents,
    timestamp: new Date().toISOString(),
  };
}
