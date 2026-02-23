/**
 * @agent-launch/sdk — TypeScript types
 *
 * SDK-006: Canonical types for all AgentLaunch API operations.
 */
// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------
/** Typed error thrown by every SDK method on a non-2xx response. */
export class AgentLaunchError extends Error {
    constructor(message, status, serverMessage) {
        super(message);
        this.name = 'AgentLaunchError';
        this.status = status;
        this.serverMessage = serverMessage;
        // Restore prototype chain when targeting older runtimes
        Object.setPrototypeOf(this, AgentLaunchError.prototype);
    }
}
//# sourceMappingURL=types.js.map