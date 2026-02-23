/**
 * Tests for CLI config module — CLI-001
 *
 * Verifies:
 *   - readConfig() returns empty object when config file does not exist
 *   - readConfig() returns empty object when config file contains invalid JSON
 *   - writeConfig() merges partial updates with existing config
 *   - writeConfig() creates the directory when it does not exist
 *   - getBaseUrl() returns DEFAULT_BASE_URL when no baseUrl is in config
 *   - getBaseUrl() returns the stored baseUrl when one is configured
 *   - maskKey() masks keys longer than 8 chars
 *   - maskKey() returns '****' for short keys
 *   - requireApiKey() throws a descriptive error when no apiKey is set
 *
 * Uses real filesystem operations against a temporary directory to avoid
 * patching the module internals.  The config path is redirected by overriding
 * the HOME environment variable before the module is loaded.
 */
export {};
//# sourceMappingURL=config.test.d.ts.map