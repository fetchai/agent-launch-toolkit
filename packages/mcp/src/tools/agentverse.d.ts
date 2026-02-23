export interface DeployToAgentverseResult {
    success: true;
    agentAddress: string;
    status: string;
}
/**
 * deploy_to_agentverse (MCP-006)
 *
 * Deploys an agent Python file to Agentverse hosting:
 *   1. POST /hosting/agents           — create agent record
 *   2. PUT  /hosting/agents/{addr}/code — upload Python source
 *   3. POST /hosting/secrets           — store each secret
 *   4. POST /hosting/agents/{addr}/start — start the agent
 *
 * The Agentverse code upload API requires the `code` field to be a
 * JSON-encoded string containing an array of file objects (double-encoded).
 */
export declare function deployToAgentverse(args: {
    apiKey: string;
    agentFile: string;
    agentName?: string;
    secrets?: Record<string, string>;
}): Promise<DeployToAgentverseResult>;
export declare const agentverseHandlers: {
    deploy_to_agentverse: typeof deployToAgentverse;
};
//# sourceMappingURL=agentverse.d.ts.map