type AgentType = "faucet" | "research" | "trading" | "data";
export interface ScaffoldAgentResult {
    success: true;
    files: string[];
    path: string;
}
/**
 * scaffold_agent (MCP-005)
 *
 * Generates an agent project directory from the agent-business-template
 * pattern. Creates agent.py, README.md, and .env.example tailored to the
 * requested agent type.
 */
export declare function scaffoldAgent(args: {
    name: string;
    type?: AgentType;
    outputDir?: string;
}): Promise<ScaffoldAgentResult>;
export declare const scaffoldHandlers: {
    scaffold_agent: typeof scaffoldAgent;
};
export {};
//# sourceMappingURL=scaffold.d.ts.map