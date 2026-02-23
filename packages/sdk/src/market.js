/**
 * @agent-launch/sdk — Market operations
 *
 * SDK-003: Price queries, holder data, and trade-link generation.
 *
 * Platform constants (immutable, set by deployed smart contracts):
 *   - TARGET_LIQUIDITY = 30,000 FET  → auto DEX listing
 *   - TOTAL_BUY_TOKENS = 800,000,000
 *   - FEE_PERCENTAGE   = 2%          → 100% to protocol treasury (REVENUE_ACCOUNT)
 *                                       No creator fee.
 */
import { AgentLaunchClient } from './client.js';
import { getToken } from './tokens.js';
// ---------------------------------------------------------------------------
// Module-level default client (lazy, env-based)
// ---------------------------------------------------------------------------
function defaultClient() {
    return new AgentLaunchClient({
        apiKey: process.env['AGENTVERSE_API_KEY'] ?? process.env['AGENT_LAUNCH_API_KEY'],
        baseUrl: process.env['AGENT_LAUNCH_BASE_URL'],
    });
}
// ---------------------------------------------------------------------------
// getTokenPrice
// ---------------------------------------------------------------------------
/**
 * Get the current bonding-curve price of a token in FET.
 *
 * Fetches the full token details and returns the `price` field.  For bulk
 * price fetching use `listTokens()` which returns prices for all tokens
 * in a single request.
 *
 * No authentication required.
 *
 * @returns Current price as a string (preserves decimal precision)
 *
 * @example
 * ```ts
 * const price = await getTokenPrice('0xAbCd...');
 * console.log(`Current price: ${price} FET`);
 * ```
 */
export async function getTokenPrice(address, client) {
    const token = await getToken(address, client);
    return token.price;
}
// ---------------------------------------------------------------------------
// getTokenHolders
// ---------------------------------------------------------------------------
/**
 * Get the list of token holders for a deployed token.
 *
 * Useful for implementing token-gated access: check whether a given wallet
 * holds any of a particular agent's token.
 *
 * Pass `holderAddress` to look up a specific wallet instead of the full list.
 *
 * No authentication required.
 *
 * @example
 * ```ts
 * // Full holder list
 * const { holders, total } = await getTokenHolders('0xAbCd...');
 *
 * // Single holder lookup (returns null if not a holder)
 * const holder = await getTokenHolders('0xAbCd...', '0xUser...');
 * ```
 */
export async function getTokenHolders(address, holderAddress, client) {
    const c = client ?? defaultClient();
    const params = {};
    if (holderAddress) {
        params['holder'] = holderAddress;
    }
    if (holderAddress) {
        const envelope = await c.get(`/api/agents/token/${encodeURIComponent(address)}/holders`, params);
        return envelope.data;
    }
    const envelope = await c.get(`/api/agents/token/${encodeURIComponent(address)}/holders`, params);
    return envelope.data;
}
// ---------------------------------------------------------------------------
// generateTradeLink
// ---------------------------------------------------------------------------
/**
 * Generate a pre-filled trade URL for a human to open.
 *
 * The returned URL opens the trade page with the action and amount
 * pre-filled so the user only needs to connect their wallet and confirm.
 *
 * Agents should share this link rather than attempting to sign transactions
 * on behalf of users.
 *
 * @param address Token contract address
 * @param action  'buy' or 'sell'
 * @param amount  Optional pre-fill amount (FET for buys, token units for sells)
 *
 * @example
 * ```ts
 * const link = generateTradeLink('0xAbCd...', 'buy', 100);
 * // https://agent-launch.ai/trade/0xAbCd...?action=buy&amount=100
 * ```
 */
export function generateTradeLink(address, action, amount, client) {
    const baseUrl = client?.baseUrl
        ?? process.env['AGENT_LAUNCH_BASE_URL']?.replace(/\/$/, '')
        ?? 'https://agent-launch.ai';
    const params = new URLSearchParams({ action });
    if (amount !== undefined && amount !== null) {
        params.set('amount', String(amount));
    }
    return `${baseUrl}/trade/${address}?${params.toString()}`;
}
/**
 * Overload that accepts a TradeLinkOptions object instead of positional args.
 *
 * @example
 * ```ts
 * const link = generateTradeLinkFromOptions('0xAbCd...', { action: 'sell', amount: 500 });
 * ```
 */
export function generateTradeLinkFromOptions(address, options = {}, client) {
    return generateTradeLink(address, options.action ?? 'buy', options.amount, client);
}
//# sourceMappingURL=market.js.map