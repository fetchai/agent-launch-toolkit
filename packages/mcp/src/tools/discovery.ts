import { AgentLaunchClient, listTokens as sdkListTokens, getToken as sdkGetToken } from '@fetchai/agent-launch-sdk';
import type { TokenListResponse, Token, PlatformStats } from '@fetchai/agent-launch-sdk';

const client = new AgentLaunchClient();

/**
 * List tokens on the Agent-Launch platform with optional filtering and pagination.
 *
 * Maps to: GET /tokens
 */
export async function listTokens(args: {
  status?: string;
  category?: string;
  chainId?: number;
  sort?: string;
  limit?: number;
  offset?: number;
}): Promise<TokenListResponse & { _markdown: string }> {
  const result = await sdkListTokens(args, client);

  const tokens: any[] = (result as any).tokens || (result as any).data || [];
  const rows = tokens.slice(0, 20).map((t: any) =>
    `| ${t.name || '—'} | ${t.symbol || '—'} | ${t.price || '—'} | ${t.progress ?? '—'}% | ${t.status || (t.listed ? 'listed' : 'bonding')} |`
  ).join('\n');

  const _markdown = `# AgentLaunch Tokens

| Name | Symbol | Price (FET) | Progress | Status |
|------|--------|-------------|----------|--------|
${rows}

Showing ${tokens.length} token(s).

## Next Steps
- Get details: \`get_token({ address: "0x..." })\`
- Preview buy: \`calculate_buy({ address: "0x...", fetAmount: "100" })\`
- Create new: \`create_token_record({ name: "...", symbol: "...", description: "...", category: "AI" })\`

## Other Surfaces
- CLI: \`npx agentlaunch list\`
- SDK: \`client.listTokens()\``;

  return { ...result, _markdown };
}

/**
 * Get full details for a single token by contract address, ID, or page URL.
 *
 * Maps to:
 *   GET /tokens/address/:address (by address)
 *   GET /tokens/id/:id (by ID)
 */
export async function getToken(args: {
  address?: string;
  id?: number;
  url?: string;
}): Promise<Token & { _markdown: string }> {
  let address = args.address;
  const id = args.id;

  if (args.url && !address) {
    const match = args.url.match(/0x[a-fA-F0-9]{40}/);
    if (match) address = match[0];
  }

  let result: Token;
  if (address) {
    result = await sdkGetToken(address, client);
  } else if (id !== undefined) {
    result = await client.get<Token>(`/tokens/id/${id}`);
  } else {
    throw new Error('Either address, id, or url is required');
  }

  const t = result as any;
  const resolvedAddress = t.token_address || t.address || address || '';
  const tradeLink = `https://agent-launch.ai/trade/${resolvedAddress}`;

  const _markdown = `# ${t.name || 'Token'} (${t.symbol || '—'})

| Field | Value |
|-------|-------|
| Price | ${t.price || '—'} FET |
| Market Cap | ${t.marketCap || t.market_cap || '—'} FET |
| Holders | ${t.holders || '—'} |
| Progress | ${t.progress || '—'}% |
| Status | ${t.listed ? 'Listed on DEX' : t.status || 'bonding'} |
| Chain | ${t.chainId === 56 ? 'BSC Mainnet' : 'BSC Testnet'} |
| Address | \`${resolvedAddress || '—'}\` |

## Trade
- Buy: ${tradeLink}?action=buy&amount=100
- Sell: ${tradeLink}?action=sell

## Next Steps
- Preview buy: \`calculate_buy({ address: "${resolvedAddress}", fetAmount: "100" })\`
- Preview sell: \`calculate_sell({ address: "${resolvedAddress}", tokenAmount: "100000" })\`
- Trade link: \`get_trade_link({ address: "${resolvedAddress}", action: "buy" })\`

## Other Surfaces
- CLI: \`npx agentlaunch status ${resolvedAddress}\`
- SDK: \`client.getToken("${resolvedAddress}")\`
- Web: https://agent-launch.ai/launchpad/${resolvedAddress}`;

  return { ...result, _markdown };
}

/**
 * Get platform-wide statistics including total volume, token counts, and
 * trending tokens.
 *
 * Maps to: GET /platform/stats
 */
export async function getPlatformStats(): Promise<PlatformStats & { _markdown: string }> {
  const result = await client.get<PlatformStats>('/platform/stats');

  const s = result as any;
  const _markdown = `# AgentLaunch Platform Stats

| Metric | Value |
|--------|-------|
| Total Tokens | ${s.totalTokens ?? s.total_tokens ?? '—'} |
| Total Volume | ${s.totalVolume ?? s.total_volume ?? '—'} FET |
| Active Traders | ${s.activeTraders ?? s.active_traders ?? '—'} |

## Next Steps
- Browse tokens: \`list_tokens({ sort: "trending", limit: 10 })\`
- Create a token: \`create_token_record({ name: "...", symbol: "...", description: "...", category: "AI" })\`

## Other Surfaces
- CLI: \`npx agentlaunch list\`
- SDK: \`client.getPlatformStats()\``;

  return { ...result, _markdown };
}

/**
 * Handler map consumed by index.ts to dispatch incoming MCP tool calls.
 */
export const discoveryHandlers = {
  list_tokens: listTokens,
  get_token: getToken,
  get_platform_stats: getPlatformStats,
};
