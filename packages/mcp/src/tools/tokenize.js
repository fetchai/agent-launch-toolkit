const AGENTLAUNCH_API_BASE = process.env.AGENT_LAUNCH_BASE_URL || "https://agent-launch.ai/api";
const FRONTEND_BASE_URL = process.env.AGENT_LAUNCH_FRONTEND_URL ||
    (process.env.AGENT_LAUNCH_BASE_URL
        ? process.env.AGENT_LAUNCH_BASE_URL.replace(/\/api$/, "")
        : "https://agent-launch.ai");
// ---------------------------------------------------------------------------
// Tool implementation
// ---------------------------------------------------------------------------
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
export async function createAndTokenize(args) {
    if (!args.agentAddress || !args.agentAddress.trim()) {
        throw new Error("agentAddress is required");
    }
    const url = `${AGENTLAUNCH_API_BASE}/agents/tokenize`;
    const payload = {
        agentAddress: args.agentAddress,
    };
    if (args.name)
        payload.name = args.name;
    if (args.symbol)
        payload.symbol = args.symbol;
    if (args.description)
        payload.description = args.description;
    if (args.image)
        payload.image = args.image;
    if (args.chainId !== undefined)
        payload.chainId = args.chainId;
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-API-Key": args.apiKey,
        },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        let detail = "";
        try {
            const errBody = (await response.json());
            detail = errBody.message ? `: ${errBody.message}` : "";
        }
        catch {
            // ignore
        }
        throw new Error(`POST ${url} failed with status ${response.status} ${response.statusText}${detail}`);
    }
    const raw = (await response.json());
    // Normalise the response — the API may nest data under a `data` key
    const nested = raw.data ?? raw;
    const tokenId = nested.tokenId ??
        nested.token_id ??
        (raw.tokenId) ??
        (raw.token_id);
    if (tokenId === undefined || tokenId === null) {
        throw new Error(`Unexpected response from /api/agents/tokenize — no tokenId found: ${JSON.stringify(raw)}`);
    }
    const handoffLink = nested.handoffLink ??
        nested.handoff_link ??
        `${FRONTEND_BASE_URL}/deploy/${tokenId}`;
    // Build trade link — use token address if available, else use tokenId
    const tokenAddress = nested.address;
    const tradeTarget = tokenAddress ?? String(tokenId);
    const tradeLink = `${FRONTEND_BASE_URL}/trade/${tradeTarget}?action=buy&amount=100`;
    return {
        success: true,
        tokenId,
        handoffLink,
        tradeLink,
    };
}
// ---------------------------------------------------------------------------
// Handler map
// ---------------------------------------------------------------------------
export const tokenizeHandlers = {
    create_and_tokenize: createAndTokenize,
};
//# sourceMappingURL=tokenize.js.map