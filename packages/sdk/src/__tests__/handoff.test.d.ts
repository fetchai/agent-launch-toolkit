/**
 * Tests for SDK handoff link generation — SDK-004
 *
 * Verifies:
 *   - generateDeployLink produces the correct URL for a given token ID
 *   - generateDeployLink accepts a custom baseUrl override
 *   - generateDeployLink throws on invalid token IDs (0, negative, non-integer)
 *   - generateTradeLink produces the correct URL with no options
 *   - generateTradeLink appends action and amount query params
 *   - generateBuyLink / generateSellLink convenience wrappers
 *   - resolveBaseUrl falls back to https://agent-launch.ai
 */
export {};
//# sourceMappingURL=handoff.test.d.ts.map