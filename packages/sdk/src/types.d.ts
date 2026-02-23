/**
 * @agent-launch/sdk — TypeScript types
 *
 * SDK-006: Canonical types for all AgentLaunch API operations.
 */
/** Configuration passed to AgentLaunchClient on construction. */
export interface AgentLaunchConfig {
    /** Agentverse API key used as X-API-Key header on authenticated requests. */
    apiKey?: string;
    /**
     * Base URL for the AgentLaunch platform.
     * @default "https://agent-launch.ai"
     */
    baseUrl?: string;
}
/** Typed error thrown by every SDK method on a non-2xx response. */
export declare class AgentLaunchError extends Error {
    /** HTTP status code returned by the server (0 if network-level failure). */
    readonly status: number;
    /** Original server message when available. */
    readonly serverMessage: string | undefined;
    constructor(message: string, status: number, serverMessage?: string);
}
/** Parameters for POST /agents/tokenize */
export interface TokenizeParams {
    /**
     * Agentverse agent address (agent1q…) or Ethereum address (0x…).
     * Required — this is the agent being tokenized.
     */
    agentAddress: string;
    /**
     * Token name (max 32 characters).
     * When omitted the platform fetches the name from Agentverse metadata.
     */
    name?: string;
    /**
     * Token ticker symbol (max 11 characters, auto-uppercased).
     * When omitted the platform derives it from the first 4 characters of name.
     */
    symbol?: string;
    /**
     * Token description (max 500 characters).
     * When omitted an auto-generated description is used.
     */
    description?: string;
    /**
     * Token image: a public URL, a base64 data URI (data:image/…), or "auto"
     * to request an auto-generated placeholder.
     */
    image?: string;
    /**
     * Agentverse-hosted avatar URL (https://agentverse.ai/…).
     * Used when image is "auto" — preferred over the generated placeholder.
     */
    agentverse_avatar_url?: string;
    /**
     * Chain ID for deployment.
     * Supported values: 56 (BSC Mainnet), 97 (BSC Testnet), 1 (ETH Mainnet), 11155111 (Sepolia).
     * @default 11155111
     */
    chainId?: number;
}
/** Data returned by POST /agents/tokenize */
export interface TokenizeResponse {
    /** Database ID of the pending token record. Used to build handoff links. */
    token_id: number;
    /** Pre-built URL the human must open to complete on-chain deployment. */
    handoff_link: string;
    name: string;
    symbol: string;
    description: string;
    /** Resolved token image URL. */
    image: string;
    /** "pending_deployment" until on-chain deploy is complete; "deployed" after. */
    status: 'pending_deployment' | 'deployed';
}
/** A token as returned in list and detail responses. */
export interface Token {
    id: number;
    name: string;
    symbol: string;
    /** Contract address — null while the token is pending deployment. */
    address: string | null;
    description: string;
    logo: string;
    /** Deployment status. */
    status: 'pending' | 'bonding' | 'listed';
    /** Current price in FET (string to preserve precision). */
    price: string;
    /** Market cap in FET (string). */
    market_cap: string;
    /** Bonding-curve progress toward 30,000 FET graduation (0–100). */
    progress: number;
    chainId: number;
    creator?: string;
    agentId?: string | null;
    listed: boolean;
    created_at: string;
}
/** Query parameters for GET /agents/tokens */
export interface TokenListParams {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: number;
    chainId?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}
/** Response from GET /agents/tokens */
export interface TokenListResponse {
    tokens: Token[];
    /** Total count matching the query (before pagination). */
    total?: number;
    mainToken?: Token | null;
}
/** A single token holder entry. */
export interface Holder {
    address: string;
    balance: string;
    /** Percentage of total supply held (0–100). */
    percentage?: number;
}
/** Response from GET /agents/token/:address/holders */
export interface HolderListResponse {
    holders: Holder[];
    total: number;
}
/** Response when a single holder address is queried. */
export interface SingleHolderResponse {
    holder: Holder;
}
/** 'buy' or 'sell' — used in trade link generation. */
export type TradeAction = 'buy' | 'sell';
/** Options for trade link generation. */
export interface TradeLinkOptions {
    action?: TradeAction;
    /** Pre-fill amount (FET for buys, token units for sells). */
    amount?: number | string;
}
/** Response from POST /agents/auth */
export interface AgentAuthResponse {
    success: true;
    data: {
        token: string;
        expires_in: number;
    };
}
/** A single Agentverse agent entry returned by GET /agents/my-agents */
export interface AgentverseAgent {
    address: string;
    name: string;
    [key: string]: unknown;
}
/** Response from GET /agents/my-agents */
export interface MyAgentsResponse {
    success: true;
    data: {
        agents: AgentverseAgent[];
        count: number;
    };
}
/** Response from POST /agents/import-agentverse */
export interface ImportAgentverseResponse {
    agents: AgentverseAgent[];
    count: number;
}
//# sourceMappingURL=types.d.ts.map