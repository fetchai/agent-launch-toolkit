# Contributing to AgentLaunch Toolkit

Thank you for your interest in contributing.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/agent-launch-toolkit.git` (forked from [fetchai/agent-launch-toolkit](https://github.com/fetchai/agent-launch-toolkit))`
3. Install dependencies: `npm install`
4. Build all packages: `npm run build`
5. Run tests: `npm run test`

## Development Workflow

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes in the relevant package under `packages/`
3. Add tests for new functionality
4. Run `npm run build && npm run test` to verify everything passes
5. Commit with a clear message describing your change
6. Push and open a pull request against `main`

## Package Structure

- `packages/sdk/` -- TypeScript HTTP client (foundation for CLI and MCP)
- `packages/cli/` -- Command-line interface (wraps SDK)
- `packages/mcp/` -- MCP server for Claude Code (wraps SDK)
- `packages/templates/` -- Agent code templates (standalone)

## Rules

- Keep the SDK zero-dependency where possible
- All token fee references must state: 2% trading fee, 100% to protocol treasury, no creator fee
- Never hardcode API keys or secrets
- Use `datetime.now()` in Python agent code, never `datetime.utcnow()`
- Agent code must use `Agent()` with zero params for Agentverse compatibility
- Code upload to Agentverse requires double-encoded JSON

## Reporting Issues

Open an issue with:
- What you expected to happen
- What actually happened
- Steps to reproduce
- Environment details (Node version, OS)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
