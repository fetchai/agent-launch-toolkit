/**
 * create-and-tokenize example
 *
 * Demonstrates the full agent-human handoff flow using agentlaunch-sdk:
 *   1. Authenticate with Agentverse API key
 *   2. List the caller's Agentverse agents
 *   3. Create a token record for the first agent
 *   4. Print the deploy handoff link
 *
 * Platform constants (source of truth: deployed smart contracts):
 *   - Deploy fee:        120 FET (read dynamically — can change via multi-sig)
 *   - Graduation target: 30,000 FET → auto DEX listing
 *   - Trading fee:       2% → 100% to protocol treasury (REVENUE_ACCOUNT)
 *                        There is NO creator fee.
 *
 * Usage:
 *   AGENTVERSE_API_KEY=av-xxx node --loader ts-node/esm index.ts
 *
 * Or with a pre-compiled build:
 *   npm run build && node dist/index.js
 */

import {
  AgentLaunchClient,
  AgentLaunchError,
  authenticate,
  getMyAgents,
  tokenize,
  generateDeployLink,
  generateBuyLink,
} from 'agentlaunch-sdk';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const API_KEY = process.env['AGENTVERSE_API_KEY'] ?? process.env['AGENT_LAUNCH_API_KEY'];

if (!API_KEY) {
  console.error(
    'Error: AGENTVERSE_API_KEY environment variable is not set.\n' +
    'Get your key at: https://agentverse.ai/profile/api-keys\n' +
    'Then run: AGENTVERSE_API_KEY=av-xxx node --loader ts-node/esm index.ts',
  );
  process.exit(1);
}

// Chain to deploy on:
//   97  = BSC Testnet  (recommended for testing)
//   56  = BSC Mainnet
//   11155111 = Ethereum Sepolia
//   1   = Ethereum Mainnet
const CHAIN_ID = Number(process.env['CHAIN_ID'] ?? '97');

// ---------------------------------------------------------------------------
// Helper: print a section header
// ---------------------------------------------------------------------------

function section(title: string): void {
  const bar = '─'.repeat(50);
  console.log(`\n${bar}`);
  console.log(title);
  console.log(bar);
}

// ---------------------------------------------------------------------------
// Main flow
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const platformUrl = process.env['AGENT_LAUNCH_FRONTEND_URL'] ?? 'https://launchpad-frontend-dev-1056182620041.us-central1.run.app';
  console.log('AgentLaunch — Create and Tokenize Example');
  console.log(`Platform: ${platformUrl}`);

  // Create a client explicitly so we can pass it to every function
  // (avoids creating a new client instance per function call).
  // Set AGENT_LAUNCH_API_URL to override the default backend URL.
  const client = new AgentLaunchClient({
    apiKey: API_KEY,
    ...(process.env['AGENT_LAUNCH_API_URL'] ? { baseUrl: process.env['AGENT_LAUNCH_API_URL'] } : {}),
  });

  // Step 1: Exchange API key for a platform JWT (optional — demonstrates auth)
  section('Step 1: Authenticate');
  let jwtToken: string | undefined;
  try {
    const authResult = await authenticate(API_KEY);
    jwtToken = authResult.data.token;
    const expiresIn = authResult.data.expires_in;
    console.log(`JWT token obtained (expires in ${expiresIn}s)`);
    console.log(`Token prefix: ${jwtToken.slice(0, 20)}...`);
  } catch (err) {
    if (err instanceof AgentLaunchError) {
      // Authentication failed — we can still proceed with the API key directly
      console.warn(`Auth warning (non-fatal): ${err.message}`);
    } else {
      throw err;
    }
  }

  // Step 2: List Agentverse agents owned by this API key
  section('Step 2: List My Agentverse Agents');
  let agentAddress: string;
  let agentName: string;

  try {
    const { data } = await getMyAgents(client);
    console.log(`Found ${data.count} agent(s)`);

    if (data.count === 0 || data.agents.length === 0) {
      console.log(
        '\nNo Agentverse agents found for this API key.\n' +
        'To create one, visit: https://agentverse.ai\n' +
        'Or use: agentlaunch scaffold MyBot --type research\n' +
        '        agentlaunch deploy\n\n' +
        'Falling back to a demo agent address for this example...',
      );
      // Use a placeholder for demo purposes
      agentAddress = 'agent1qf8xfhsc8hg4g5l0nhtj5hxxkyd46c64qxvpa3g3ha9rjmezq3s6xw9y7g';
      agentName = 'Demo Research Agent';
    } else {
      const firstAgent = data.agents[0];
      agentAddress = firstAgent.address;
      agentName = firstAgent.name ?? 'My Agent';
      console.log(`Using agent: ${agentName}`);
      console.log(`Address:     ${agentAddress}`);

      if (data.count > 1) {
        console.log(`\nOther agents (not used in this example):`);
        data.agents.slice(1).forEach(a => {
          console.log(`  - ${a.name ?? 'Unnamed'} (${a.address})`);
        });
      }
    }
  } catch (err) {
    if (err instanceof AgentLaunchError) {
      console.error(`Failed to list agents: ${err.message}`);
      console.log('Falling back to demo agent address...');
      agentAddress = 'agent1qf8xfhsc8hg4g5l0nhtj5hxxkyd46c64qxvpa3g3ha9rjmezq3s6xw9y7g';
      agentName = 'Demo Research Agent';
    } else {
      throw err;
    }
  }

  // Step 3: Create a token record
  section('Step 3: Create Token Record');
  console.log(`Creating token for: ${agentName}`);
  console.log(`Agent address:      ${agentAddress}`);
  console.log(`Chain ID:           ${CHAIN_ID}`);

  let tokenId: number;
  let handoffLink: string;
  let symbol: string;

  try {
    const { data } = await tokenize(
      {
        agentAddress,
        name: agentName,
        // symbol derived automatically from name when omitted
        description: `AI agent token for ${agentName}. Created via agentlaunch-sdk example.`,
        image: 'auto',           // platform generates a placeholder image
        chainId: CHAIN_ID,
      },
      client,
    );

    tokenId = data.token_id;
    handoffLink = data.handoff_link;
    symbol = data.symbol;

    console.log(`\nToken record created successfully.`);
    console.log(`  Token ID:   ${tokenId}`);
    console.log(`  Name:       ${data.name}`);
    console.log(`  Symbol:     ${symbol}`);
    console.log(`  Status:     ${data.status}`);
    console.log(`  Image:      ${data.image}`);
  } catch (err) {
    if (err instanceof AgentLaunchError) {
      console.error(`\nFailed to create token record.`);
      console.error(`  Status:  ${err.status}`);
      console.error(`  Message: ${err.message}`);
      if (err.status === 401) {
        console.error('\nHint: Check that AGENTVERSE_API_KEY is valid.');
      } else if (err.status === 400) {
        console.error('\nHint: The agent address may be invalid or already tokenized.');
      }
      process.exit(1);
    }
    throw err;
  }

  // Step 4: Generate handoff links
  section('Step 4: Handoff Links');

  // Deploy link — send to the human who will sign the on-chain transaction
  const deployLink = generateDeployLink(tokenId);
  console.log('Deploy handoff link (send to a human with FET wallet):');
  console.log(`  ${deployLink}`);

  // The deploy link from the API is the same as the generated one
  if (handoffLink !== deployLink) {
    console.log(`\n(API also returned: ${handoffLink})`);
  }

  // Trade link — useful after the token is deployed
  const buyLink = generateBuyLink(
    `${tokenId}`, // use tokenId until the token has a contract address
    100,          // pre-fill 100 FET
  );
  console.log('\nTrade link (share after deployment):');
  console.log(`  ${buyLink}`);

  // Step 5: Summary
  section('Summary');
  console.log('The agent-human handoff is complete on the agent side.\n');
  console.log('Next steps for the HUMAN:');
  console.log('  1. Open the deploy link in a browser');
  console.log(`     ${deployLink}`);
  console.log('  2. Connect a wallet with 120+ FET and BNB for gas');
  console.log('  3. Click "Approve FET" (tx 1)');
  console.log('  4. Click "Deploy Token" (tx 2)');
  console.log('  5. Token is live on the bonding curve in ~30 seconds\n');
  console.log('Platform constants (from deployed contracts):');
  console.log('  - Deployment fee:    120 FET');
  console.log('  - Graduation target: 30,000 FET → auto DEX listing');
  console.log('  - Trading fee:       2% → 100% to protocol treasury');
  console.log('  - No creator fee\n');
  console.log(`View all tokens: ${platformUrl}`);

  // JWT output for reference (if obtained)
  if (jwtToken) {
    section('JWT Token (for reference)');
    console.log('This JWT can be used as a Bearer token on any authenticated endpoint:');
    console.log(`  Authorization: Bearer ${jwtToken.slice(0, 40)}...`);
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
