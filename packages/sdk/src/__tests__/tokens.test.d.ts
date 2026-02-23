/**
 * Tests for SDK token operations — SDK-002
 *
 * Verifies:
 *   - tokenize() calls POST /api/agents/tokenize with the supplied body
 *   - getToken() calls GET /api/agents/token/:address (URL-encoded)
 *   - listTokens() calls GET /api/agents/tokens with pagination params
 *   - listTokens() with no params sends a clean request
 *   - AgentLaunchError is propagated from client errors
 */
export {};
//# sourceMappingURL=tokens.test.d.ts.map