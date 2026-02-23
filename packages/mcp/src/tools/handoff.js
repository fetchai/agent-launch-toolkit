import { apiGet, apiPost } from "../client.js";
/**
 * Frontend base URL for generating handoff and trade links.
 * Distinct from the API base URL used by client.ts (which appends /api).
 */
const FRONTEND_BASE_URL = process.env.AGENT_LAUNCH_FRONTEND_URL ||
    (process.env.AGENT_LAUNCH_BASE_URL
        ? process.env.AGENT_LAUNCH_BASE_URL.replace(/\/api$/, "")
        : "https://agent-launch.ai");
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
export async function createTokenRecord(args) {
    const response = await apiPost("/agents/launch", {
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
            step1: "Click the handoff link above",
            step2: "Connect your wallet",
            step3: "Approve 120 FET spending",
            step4: "Click Deploy",
            step5: "Done! Your token will be live in ~30 seconds",
        },
    };
}
/**
 * get_deploy_instructions
 *
 * Fetches a token by ID and returns structured + markdown deployment
 * instructions for the human who will sign the on-chain transaction.
 */
export async function getDeployInstructions(args) {
    if (args.tokenId <= 0 || !Number.isInteger(args.tokenId)) {
        throw new Error(`Invalid tokenId: ${args.tokenId}. Must be a positive integer.`);
    }
    const token = await apiGet(`/tokens/${args.tokenId}`);
    const handoffLink = `${FRONTEND_BASE_URL}/deploy/${args.tokenId}`;
    const instructions = {
        title: "Deploy Your Token",
        requirements: [
            "Wallet with 120+ FET",
            "Small amount of BNB for gas (~0.002 BNB)",
        ],
        steps: [
            {
                number: 1,
                action: "Click the link below",
                note: "Opens in your browser",
            },
            {
                number: 2,
                action: "Connect your wallet",
                note: "MetaMask, Rainbow, or WalletConnect",
            },
            {
                number: 3,
                action: "Click 'Approve FET'",
                note: "This allows the contract to use your FET",
            },
            {
                number: 4,
                action: "Click 'Deploy Token'",
                note: "Confirm the transaction in your wallet",
            },
            {
                number: 5,
                action: "Wait ~30 seconds",
                note: "Your token will appear on the platform",
            },
        ],
        costs: {
            deploymentFee: "120 FET",
            gasEstimate: "~0.002 BNB (~$1.20)",
            total: "~120 FET + gas",
        },
        whatHappensNext: [
            "Token goes live on bonding curve",
            "Anyone can buy/sell immediately",
            "At 30,000 FET raised → auto-lists on DEX",
            "Liquidity locked forever (no rug pull possible)",
        ],
    };
    const markdown = `## Deploy Your Token: ${token.name} (${token.symbol})

**Link:** [Click here to deploy](${handoffLink})

### Requirements
${instructions.requirements.map((r) => `- ${r}`).join("\n")}

### Steps
${instructions.steps
        .map((s) => `${s.number}. **${s.action}**${s.note ? ` - ${s.note}` : ""}`)
        .join("\n")}

### Cost
- Deployment fee: ${instructions.costs.deploymentFee}
- Gas: ${instructions.costs.gasEstimate}
- **Total: ${instructions.costs.total}**

### What Happens Next
${instructions.whatHappensNext.map((w) => `- ${w}`).join("\n")}
`;
    return { handoffLink, instructions, markdown };
}
/**
 * get_trade_link
 *
 * Generates a pre-filled trade URL for a human to open and execute a
 * buy or sell without any agent involvement in the signing step.
 */
export async function getTradeLink(args) {
    const params = new URLSearchParams();
    params.set("action", args.action);
    if (args.amount) {
        params.set("amount", args.amount);
    }
    const link = `${FRONTEND_BASE_URL}/trade/${args.address}?${params.toString()}`;
    const amountSuffix = args.amount
        ? ` (${args.amount} ${args.action === "buy" ? "FET" : "tokens"})`
        : "";
    const steps = args.action === "buy"
        ? [
            "Click the link",
            "Connect wallet if not connected",
            `Confirm the amount${amountSuffix}`,
            "Click Buy",
            "Approve transaction in wallet",
        ]
        : [
            "Click the link",
            "Connect wallet if not connected",
            `Confirm the amount${amountSuffix}`,
            "Click Sell",
            "Approve transaction in wallet",
        ];
    return {
        link,
        instructions: {
            action: args.action === "buy" ? "Buy tokens" : "Sell tokens",
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
//# sourceMappingURL=handoff.js.map