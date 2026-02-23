import type { CreateTokenResponse } from "../types/api.js";
export interface CreateTokenResult extends CreateTokenResponse {
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
/**
 * create_token_record
 *
 * Creates a pending token record via the agent API and returns the token ID
 * plus a pre-built handoff link the human can open to complete on-chain
 * deployment.  Requires AGENT_LAUNCH_API_KEY to be set.
 */
export declare function createTokenRecord(args: {
    name: string;
    symbol: string;
    description: string;
    category: string;
    logo?: string;
    chainId?: number;
}): Promise<CreateTokenResult>;
/**
 * get_deploy_instructions
 *
 * Fetches a token by ID and returns structured + markdown deployment
 * instructions for the human who will sign the on-chain transaction.
 */
export declare function getDeployInstructions(args: {
    tokenId: number;
}): Promise<DeployInstructions>;
/**
 * get_trade_link
 *
 * Generates a pre-filled trade URL for a human to open and execute a
 * buy or sell without any agent involvement in the signing step.
 */
export declare function getTradeLink(args: {
    address: string;
    action: "buy" | "sell";
    amount?: string;
}): Promise<TradeLink>;
export declare const handoffHandlers: {
    create_token_record: typeof createTokenRecord;
    get_deploy_instructions: typeof getDeployInstructions;
    get_trade_link: typeof getTradeLink;
};
//# sourceMappingURL=handoff.d.ts.map