/**
 * CLI-001: Config management
 *
 * Stores user config in ~/.agentlaunch/config.json
 * Fields: apiKey, baseUrl
 */
export interface CliConfig {
    apiKey?: string;
    baseUrl?: string;
}
/** Default API base URL. Override with `agentlaunch config set-url`. */
export declare const DEFAULT_BASE_URL = "https://agent-launch.ai/api";
/**
 * Read the config file. Returns an empty object if the file does not exist
 * or cannot be parsed.
 */
export declare function readConfig(): CliConfig;
/**
 * Write a partial config update. Merges with existing values.
 */
export declare function writeConfig(partial: Partial<CliConfig>): void;
/**
 * Return the active base URL (config override or default).
 */
export declare function getBaseUrl(): string;
/**
 * Return the active API key. Throws a descriptive error if not set.
 */
export declare function requireApiKey(): string;
/**
 * Mask an API key for display: show first 8 chars, then asterisks.
 * Example: "eyJhbGci..." -> "eyJhbGci..."[masked]
 */
export declare function maskKey(key: string): string;
//# sourceMappingURL=config.d.ts.map