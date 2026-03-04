import { Command } from 'commander';
import { getBaseUrl, requireApiKey } from '../config.js';

interface ClaimResult {
  success: boolean;
  wallet: string;
  fetAmount?: number;
  bnbAmount?: number;
  fetTxHash?: string;
  bnbTxHash?: string;
  error?: string;
  alreadyClaimed?: boolean;
}

export function registerClaimCommand(program: Command): void {
  program
    .command('claim <wallet>')
    .description('Claim testnet tokens (200 TFET + 0.001 tBNB) for a wallet')
    .option('--agent <address>', 'Your agent address (agent1q...) for tracking')
    .option('--json', 'Output JSON only')
    .action(async (wallet: string, options: { agent?: string; json?: boolean }) => {
      const apiUrl = getBaseUrl();
      const apiKey = requireApiKey();

      // Validate wallet format
      if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
        if (options.json) {
          console.log(JSON.stringify({ success: false, error: 'Invalid wallet address' }));
        } else {
          console.error('Error: Invalid wallet address. Must be 0x followed by 40 hex characters.');
        }
        process.exit(1);
      }

      if (!options.json) {
        console.log(`Claiming tokens for ${wallet}...`);
      }

      try {
        const response = await fetch(`${apiUrl}/faucet/claim`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': apiKey,
          },
          body: JSON.stringify({
            wallet,
            agentAddress: options.agent,
          }),
        });

        const result: ClaimResult = await response.json();

        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
        } else if (result.success) {
          console.log('\n✅ Tokens claimed successfully!\n');
          console.log(`Wallet: ${result.wallet}`);
          console.log(`TFET:   ${result.fetAmount} FET`);
          console.log(`tBNB:   ${result.bnbAmount} BNB\n`);
          console.log('Transactions:');
          console.log(`  TFET: https://testnet.bscscan.com/tx/${result.fetTxHash}`);
          console.log(`  tBNB: https://testnet.bscscan.com/tx/${result.bnbTxHash}`);
        } else if (result.alreadyClaimed) {
          console.log('\n⚠️  This wallet has used all its claims.');
          console.log('Each wallet can claim up to 3 times.');
        } else {
          console.error(`\n❌ Claim failed: ${result.error}`);
          process.exit(1);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (options.json) {
          console.log(JSON.stringify({ success: false, error: message }));
        } else {
          console.error(`\n❌ Error: ${message}`);
        }
        process.exit(1);
      }
    });
}
