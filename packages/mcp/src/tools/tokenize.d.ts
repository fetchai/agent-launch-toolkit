export interface CreateAndTokenizeResult {
    success: true;
    tokenId: number;
    handoffLink: string;
    tradeLink: string;
}
/**
 * create_and_tokenize (MCP-007)
 *
 * End-to-end combo tool: creates a token record tied to a live Agentverse
 * agent address by calling POST /api/agents/tokenize.
 *
 * Returns the token ID, a deploy handoff link for the human to sign the
 * on-chain transaction, and a pre-filled trade link.
 *
 * Auth: X-API-Key header (Agentverse API key).
 * Fee note: 2% trading fee goes 100% to protocol treasury — no creator fee.
 */
export declare function createAndTokenize(args: {
    apiKey: string;
    agentAddress: string;
    name?: string;
    symbol?: string;
    description?: string;
    image?: string;
    chainId?: number;
}): Promise<CreateAndTokenizeResult>;
export declare const tokenizeHandlers: {
    create_and_tokenize: typeof createAndTokenize;
};
//# sourceMappingURL=tokenize.d.ts.map