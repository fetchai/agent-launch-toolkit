/**
 * Tests for AgentLaunchClient — SDK-001
 *
 * Verifies:
 *   - Default baseUrl resolves to https://agent-launch.ai
 *   - Custom baseUrl is accepted (trailing slash stripped)
 *   - X-API-Key header is injected when apiKey is present
 *   - Authenticated POST throws AgentLaunchError when apiKey is absent
 *   - Non-2xx responses throw AgentLaunchError with correct status
 *   - Server JSON error message is included in thrown error
 *   - Query parameters are appended to GET requests
 */
export {};
//# sourceMappingURL=client.test.d.ts.map