/**
 * monitor-and-trade example
 *
 * Demonstrates market monitoring and trade link generation using agentlaunch-sdk:
 *   1. List all tokens sorted by market cap
 *   2. Get price for the top token
 *   3. Get holder information
 *   4. Generate buy and sell trade links for a human
 *   5. Check if a specific wallet holds a token (token-gated access pattern)
 *
 * Platform constants (source of truth: deployed smart contracts):
 *   - Target liquidity:  30,000 FET → auto DEX listing
 *   - Total buy supply:  800,000,000 tokens
 *   - Trading fee:       2% → 100% to protocol treasury (REVENUE_ACCOUNT)
 *                        There is NO creator fee.
 *
 * Usage:
 *   node --loader ts-node/esm index.ts
 *
 * Or with a specific token address:
 *   TOKEN_ADDRESS=0xAbCd... node --loader ts-node/esm index.ts
 */

import {
  AgentLaunchClient,
  AgentLaunchError,
  listTokens,
  getToken,
  getTokenPrice,
  getTokenHolders,
  generateBuyLink,
  generateSellLink,
  generateTradeLink,
  type Token,
  type HolderListResponse,
} from 'agentlaunch-sdk';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

// Optional: specific token address to inspect (env override)
const TOKEN_ADDRESS_OVERRIDE = process.env['TOKEN_ADDRESS'];

// Optional: wallet address to check for token holdings
const WALLET_TO_CHECK = process.env['WALLET_ADDRESS'] ?? '0x0000000000000000000000000000000000000001';

// ---------------------------------------------------------------------------
// Helper: format FET amount
// ---------------------------------------------------------------------------

function formatFET(amount: string | number): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(n)) return '0 FET';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M FET`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(2)}K FET`;
  if (n < 0.001 && n > 0) return `${n.toExponential(4)} FET`;
  return `${n.toFixed(6)} FET`;
}

// ---------------------------------------------------------------------------
// Helper: print a section header
// ---------------------------------------------------------------------------

function section(title: string): void {
  const bar = '─'.repeat(55);
  console.log(`\n${bar}`);
  console.log(title);
  console.log(bar);
}

// ---------------------------------------------------------------------------
// Step 1: List tokens
// ---------------------------------------------------------------------------

async function listTopTokens(client: AgentLaunchClient): Promise<Token[]> {
  section('Step 1: Top Tokens by Market Cap');

  const { tokens, total } = await listTokens(
    {
      sortBy: 'market_cap',
      sortOrder: 'DESC',
      limit: 10,
      page: 1,
    },
    client,
  );

  console.log(`Showing ${tokens.length} of ${total ?? tokens.length} tokens\n`);

  // Print a simple table
  const COL_NAME = 24;
  const COL_PRICE = 18;
  const COL_MCAP = 18;
  const COL_PROG = 10;

  const header =
    'Name'.padEnd(COL_NAME) +
    'Price'.padEnd(COL_PRICE) +
    'Market Cap'.padEnd(COL_MCAP) +
    'Progress';

  console.log(header);
  console.log('─'.repeat(header.length));

  for (const token of tokens) {
    const name = (token.name ?? '-').slice(0, COL_NAME - 2).padEnd(COL_NAME);
    const price = formatFET(token.price).padEnd(COL_PRICE);
    const mcap = formatFET(token.market_cap).padEnd(COL_MCAP);
    const progress = `${token.progress.toFixed(1)}%`.padEnd(COL_PROG);
    const listedTag = token.listed ? ' [DEX]' : '';
    console.log(`${name}${price}${mcap}${progress}${listedTag}`);
  }

  return tokens;
}

// ---------------------------------------------------------------------------
// Step 2: Detailed token inspection
// ---------------------------------------------------------------------------

async function inspectToken(address: string, client: AgentLaunchClient): Promise<Token> {
  section(`Step 2: Token Details — ${address.slice(0, 10)}...`);

  const token = await getToken(address, client);

  console.log(`Name:        ${token.name}`);
  console.log(`Symbol:      ${token.symbol}`);
  console.log(`Address:     ${token.address ?? '(pending deployment)'}`);
  console.log(`Chain ID:    ${token.chainId}`);
  console.log(`Status:      ${token.status}`);
  console.log(`Listed:      ${token.listed ? 'Yes — trading on DEX' : 'No — bonding curve'}`);
  console.log(`Price:       ${formatFET(token.price)}`);
  console.log(`Market Cap:  ${formatFET(token.market_cap)}`);
  console.log(`Progress:    ${token.progress.toFixed(2)}% toward 30,000 FET graduation`);
  if (token.creator) {
    console.log(`Creator:     ${token.creator}`);
  }
  if (token.agentId) {
    console.log(`Agent ID:    ${token.agentId}`);
  }
  console.log(`Created:     ${new Date(token.created_at).toLocaleString()}`);

  return token;
}

// ---------------------------------------------------------------------------
// Step 3: Get price
// ---------------------------------------------------------------------------

async function checkPrice(address: string, client: AgentLaunchClient): Promise<void> {
  section('Step 3: Current Price');

  const price = await getTokenPrice(address, client);
  console.log(`Current price: ${formatFET(price)}`);
  console.log(`(This is the bonding curve price — changes with each trade)`);
}

// ---------------------------------------------------------------------------
// Step 4: Holder information
// ---------------------------------------------------------------------------

async function checkHolders(address: string, client: AgentLaunchClient): Promise<void> {
  section('Step 4: Token Holders');

  try {
    const result = await getTokenHolders(address, undefined, client) as HolderListResponse;
    const { holders, total } = result;

    console.log(`Total holders: ${total}`);

    if (holders.length === 0) {
      console.log('No holders yet — token may be newly deployed.');
      return;
    }

    console.log('\nTop holders:');
    const topN = Math.min(5, holders.length);
    for (let i = 0; i < topN; i++) {
      const h = holders[i];
      const pct = h.percentage !== undefined ? ` (${h.percentage.toFixed(2)}%)` : '';
      const shortened = `${h.address.slice(0, 10)}...${h.address.slice(-6)}`;
      console.log(`  ${(i + 1).toString().padStart(2)}. ${shortened}  ${h.balance} tokens${pct}`);
    }

    if (total > topN) {
      console.log(`  ... and ${total - topN} more`);
    }
  } catch (err) {
    if (err instanceof AgentLaunchError && err.status === 404) {
      console.log('No holder data available (token may not be deployed yet).');
    } else {
      throw err;
    }
  }
}

// ---------------------------------------------------------------------------
// Step 5: Token-gated access check
// ---------------------------------------------------------------------------

async function checkTokenGating(address: string, walletAddress: string, client: AgentLaunchClient): Promise<void> {
  section(`Step 5: Token-Gated Access — Wallet ${walletAddress.slice(0, 10)}...`);

  console.log(`Checking if wallet holds any ${address.slice(0, 10)}... tokens...`);

  try {
    // The SDK returns different types depending on whether holderAddress is provided.
    // When provided, it returns SingleHolderResponse or throws 404 if not a holder.
    const result = await getTokenHolders(address, walletAddress, client) as { holder: { address: string; balance: string; percentage?: number } };
    const holder = result.holder;

    console.log(`Access: GRANTED`);
    console.log(`Balance: ${holder.balance} tokens`);
    if (holder.percentage !== undefined) {
      console.log(`Share:   ${holder.percentage.toFixed(4)}% of supply`);
    }
    console.log(`\nThis wallet qualifies for token-gated services.`);
  } catch (err) {
    if (err instanceof AgentLaunchError && err.status === 404) {
      console.log(`Access: DENIED`);
      console.log(`Wallet ${walletAddress.slice(0, 10)}... holds 0 tokens.`);
      console.log(`\nTo gain access, the human can buy tokens:`);
    } else {
      throw err;
    }
  }
}

// ---------------------------------------------------------------------------
// Step 6: Generate trade links
// ---------------------------------------------------------------------------

function generateTradeLinks(address: string): void {
  section('Step 6: Trade Links for Humans');

  // Plain trade page
  const tradePage = generateTradeLink(address);
  console.log('Trade page (no pre-fill):');
  console.log(`  ${tradePage}`);

  // Buy links with various amounts
  console.log('\nBuy links (pre-filled FET amounts):');
  for (const amount of [10, 50, 100, 500]) {
    const link = generateBuyLink(address, amount);
    console.log(`  ${amount.toString().padStart(4)} FET: ${link}`);
  }

  // Sell links with various token amounts
  console.log('\nSell links (pre-filled token amounts):');
  for (const amount of [1000, 10000, 100000]) {
    const link = generateSellLink(address, amount);
    console.log(`  ${amount.toLocaleString().padStart(9)} tokens: ${link}`);
  }

  console.log('\nAgents share these links with humans who sign the transactions.');
  console.log('Agents never hold private keys or sign transactions directly.');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('AgentLaunch — Monitor and Trade Example');
  console.log('Platform: https://agent-launch.ai\n');

  // Use a shared client instance (no API key needed for read-only operations)
  const client = new AgentLaunchClient();

  // Step 1: List top tokens
  let tokens: Token[];
  try {
    tokens = await listTopTokens(client);
  } catch (err) {
    if (err instanceof AgentLaunchError) {
      console.error(`Failed to list tokens: ${err.message}`);
      process.exit(1);
    }
    throw err;
  }

  // Select the token to inspect
  let targetAddress: string | undefined = TOKEN_ADDRESS_OVERRIDE;

  if (!targetAddress) {
    // Find the first deployed token in the list
    const deployed = tokens.find(t => t.address !== null);
    if (deployed?.address) {
      targetAddress = deployed.address;
      console.log(`\nUsing top deployed token: ${deployed.name} (${deployed.symbol})`);
    } else {
      console.log(
        '\nNo deployed tokens found in the list.\n' +
        'Set TOKEN_ADDRESS=0x... to inspect a specific token.\n' +
        'Skipping per-token steps.',
      );
      return;
    }
  }

  // Step 2-6: Per-token operations
  try {
    const token = await inspectToken(targetAddress, client);

    await checkPrice(targetAddress, client);

    await checkHolders(targetAddress, client);

    await checkTokenGating(targetAddress, WALLET_TO_CHECK, client);

    generateTradeLinks(targetAddress);

    // Summary
    section('Summary');
    console.log(`Token:     ${token.name} (${token.symbol})`);
    console.log(`Address:   ${targetAddress}`);
    console.log(`Price:     ${formatFET(token.price)}`);
    console.log(`Progress:  ${token.progress.toFixed(2)}% toward DEX listing`);
    console.log('\nPlatform constants (from deployed contracts):');
    console.log('  - Graduation target: 30,000 FET raised → auto DEX listing');
    console.log('  - Trading fee:       2% → 100% to protocol treasury');
    console.log('  - No creator fee');
    console.log('\nView on platform:');
    console.log(`  https://agent-launch.ai/trade/${targetAddress}`);
  } catch (err) {
    if (err instanceof AgentLaunchError) {
      console.error(`\nAPI error (status ${err.status}): ${err.message}`);
      if (err.status === 404) {
        console.error(`Token not found at address: ${targetAddress}`);
        console.error('Tip: Set TOKEN_ADDRESS to a valid deployed token address.');
      }
      process.exit(1);
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

main().catch((err: unknown) => {
  console.error('\nUnexpected error:');
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
