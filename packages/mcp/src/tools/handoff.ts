import { AgentLaunchClient, getFrontendUrl } from 'agentlaunch-sdk';
import type { Token } from 'agentlaunch-sdk';

const client = new AgentLaunchClient();
const FRONTEND_BASE_URL = getFrontendUrl();

// ---------------------------------------------------------------------------
// Return types
// ---------------------------------------------------------------------------

export interface CreateTokenResult {
  tokenId?: number;
  token_id?: number;
  handoffLink?: string;
  handoff_link?: string;
  instructions: {
    step1: string;
    step2: string;
    step3: string;
    step4: string;
    step5: string;
  };
}

export interface DeployInstructions {
  handoffLink: string;
  instructions: {
    title: string;
    requirements: string[];
    steps: Array<{
      number: number;
      action: string;
      note?: string;
    }>;
    costs: {
      deploymentFee: string;
      gasEstimate: string;
      total: string;
    };
    whatHappensNext: string[];
  };
  markdown: string;
}

export interface TradeLink {
  link: string;
  instructions: {
    action: string;
    steps: string[];
  };
}

// ---------------------------------------------------------------------------
// Tool implementations
// ---------------------------------------------------------------------------

/**
 * create_token_record
 *
 * Creates a pending token record via the agent API and returns the token ID
 * plus a pre-built handoff link the human can open to complete on-chain
 * deployment.  Requires AGENT_LAUNCH_API_KEY to be set.
 */
export async function createTokenRecord(args: {
  name: string;
  symbol: string;
  description: string;
  category: string;
  logo?: string;
  chainId?: number;
}): Promise<CreateTokenResult> {
  const response = await client.post<CreateTokenResult>('/api/agents/tokenize', {
    name: args.name,
    symbol: args.symbol,
    description: args.description,
    category: args.category,
    logo: args.logo,
    chainId: args.chainId ?? 97,
  });

  return {
    ...response,
    instructions: {
      step1: 'Click the handoff link above',
      step2: 'Connect your wallet',
      step3: 'Approve FET spending (TOKEN_DEPLOYMENT_FEE, read from contract)',
      step4: 'Click Deploy',
      step5: 'Done! Your token will be live in ~30 seconds',
    },
  };
}

/**
 * get_deploy_instructions
 *
 * Fetches a token by ID and returns structured + markdown deployment
 * instructions for the human who will sign the on-chain transaction.
 */
export async function getDeployInstructions(args: {
  tokenId: number;
}): Promise<DeployInstructions> {
  if (args.tokenId <= 0 || !Number.isInteger(args.tokenId)) {
    throw new Error(`Invalid tokenId: ${args.tokenId}. Must be a positive integer.`);
  }

  const token = await client.get<Token>(`/api/tokens/${args.tokenId}`);

  const handoffLink = `${FRONTEND_BASE_URL}/deploy/${args.tokenId}`;

  const instructions: DeployInstructions['instructions'] = {
    title: 'Deploy Your Token',
    requirements: [
      'Wallet with enough FET to cover TOKEN_DEPLOYMENT_FEE (currently 120 FET, read from contract at deploy time)',
      'Small amount of network token for gas (gas fees vary by network)',
    ],
    steps: [
      {
        number: 1,
        action: 'Click the link below',
        note: 'Opens in your browser',
      },
      {
        number: 2,
        action: 'Connect your wallet',
        note: 'MetaMask, Rainbow, or WalletConnect',
      },
      {
        number: 3,
        action: "Click 'Approve FET'",
        note: 'This allows the contract to use your FET',
      },
      {
        number: 4,
        action: "Click 'Deploy Token'",
        note: 'Confirm the transaction in your wallet',
      },
      {
        number: 5,
        action: 'Wait ~30 seconds',
        note: 'Your token will appear on the platform',
      },
    ],
    costs: {
      deploymentFee:
        'TOKEN_DEPLOYMENT_FEE (currently 120 FET, read from contract at deploy time — may change via multi-sig governance)',
      gasEstimate: 'Gas fees vary by network',
      total: 'TOKEN_DEPLOYMENT_FEE + gas',
    },
    whatHappensNext: [
      'Token goes live on bonding curve',
      'Anyone can buy/sell immediately',
      'At 30,000 FET raised → auto-lists on DEX',
      'Liquidity locked forever (no rug pull possible)',
    ],
  };

  const markdown = `## Deploy Your Token: ${token.name} (${token.symbol})

**Link:** [Click here to deploy](${handoffLink})

### Requirements
${instructions.requirements.map((r) => `- ${r}`).join('\n')}

### Steps
${instructions.steps
  .map(
    (s) =>
      `${s.number}. **${s.action}**${s.note ? ` - ${s.note}` : ''}`,
  )
  .join('\n')}

### Cost
- Deployment fee: ${instructions.costs.deploymentFee}
- Gas: ${instructions.costs.gasEstimate}
- **Total: ${instructions.costs.total}**

### What Happens Next
${instructions.whatHappensNext.map((w) => `- ${w}`).join('\n')}
`;

  return { handoffLink, instructions, markdown };
}

/**
 * get_trade_link
 *
 * Generates a pre-filled trade URL for a human to open and execute a
 * buy or sell without any agent involvement in the signing step.
 */
export async function getTradeLink(args: {
  address: string;
  action: 'buy' | 'sell';
  amount?: string;
}): Promise<TradeLink> {
  const params = new URLSearchParams();
  params.set('action', args.action);
  if (args.amount) {
    params.set('amount', args.amount);
  }

  const link = `${FRONTEND_BASE_URL}/trade/${args.address}?${params.toString()}`;

  const amountSuffix =
    args.amount
      ? ` (${args.amount} ${args.action === 'buy' ? 'FET' : 'tokens'})`
      : '';

  const steps: string[] =
    args.action === 'buy'
      ? [
          'Click the link',
          'Connect wallet if not connected',
          `Confirm the amount${amountSuffix}`,
          'Click Buy',
          'Approve transaction in wallet',
        ]
      : [
          'Click the link',
          'Connect wallet if not connected',
          `Confirm the amount${amountSuffix}`,
          'Click Sell',
          'Approve transaction in wallet',
        ];

  return {
    link,
    instructions: {
      action: args.action === 'buy' ? 'Buy tokens' : 'Sell tokens',
      steps,
    },
  };
}

// ---------------------------------------------------------------------------
// Handler map — consumed by index.ts dispatch
// ---------------------------------------------------------------------------

export const handoffHandlers = {
  create_token_record: createTokenRecord,
  get_deploy_instructions: getDeployInstructions,
  get_trade_link: getTradeLink,
};
