# Changelog

All notable changes to `agentlaunch` (formerly `agentlaunch-cli`) are documented here.

This project follows [Semantic Versioning](https://semver.org/).

---

## [1.2.9] — 2026-04-03

### Added

- **`agentlaunch auth wallet`** — Authenticate with a wallet private key to obtain an Agentverse API key
  - Accepts `--private-key` flag or reads `WALLET_PRIVATE_KEY` from environment
  - `--save` flag writes the API key to `.env` file in current directory
  - Shows security warning when using `--private-key` flag (visible in shell history)
  - Requires `@cosmjs/crypto` and `bech32` as peer dependencies
- **`agentlaunch auth status`** — Check if the current API key is valid
  - Verifies key against Agentverse API
  - Shows expiration status and hints for re-authentication

---

## [1.2.8] — 2026-03-29

### Added

- **`agentlaunch connect`** — Deploy agents with webhook proxy for external service integration
- **`agentlaunch connect-status`** — Check connection health and message delivery stats
- **`agentlaunch connect-update`** — Update webhook URL, secrets, and agent code
- **`agentlaunch connect-logs`** — Tail logs for connected agents
- **`agentlaunch skill`** — Discover and install agent skills from the registry
- **Scaffold now generates `.mcp.json`** — Cursor/Claude Code auto-discovers MCP server

### Fixed

- **`wallet balances --json`** — Commander parent command was consuming `--json` flag before subcommands; moved option to subcommands only
- **`wallet delegate --json`** — Same `--json` flag fix
- **`list` command** — Properly handles paginated token responses

---

## [1.0.0] — 2026-02-22

### Added

**Core commands:**
- `agentlaunch create` — flagship one-command flow: scaffold + deploy + tokenize in a single invocation. Supports interactive prompts via Node.js `readline` when flags are omitted, or fully non-interactive with all flags specified.
- `agentlaunch scaffold <name>` — generate an agent project from a template (custom, faucet, research, trading, data). Produces `agent.py`, `README.md`, and `.env.example`.
- `agentlaunch deploy` — deploy `agent.py` to Agentverse: create agent, upload code, set secrets, start, poll until compiled.
- `agentlaunch tokenize` — call `POST /tokenize` and print a handoff link for on-chain deployment.
- `agentlaunch list` — fetch and display tokens from `GET /tokens` with pagination and sort options (trending, latest, market_cap).
- `agentlaunch status <address>` — fetch and display token details from `GET /token/<address>`.
- `agentlaunch config set-key` — store Agentverse API key in `~/.agentlaunch/config.json` (mode 0600).
- `agentlaunch config show` — display current configuration with masked API key.
- `agentlaunch config set-url` — override the API base URL for self-hosted instances.

**Machine-readable mode:**
- All commands support `--json` flag. When set, only valid JSON is written to stdout and all decorative output and interactive prompts are suppressed. Exit code 0 on success, 1 on error with `{ "error": "..." }` JSON.

**Interactive prompts (create command):**
- When `--name` is omitted, prompts "Agent name: "
- When `--ticker` is omitted, prompts "Ticker symbol: "
- When `--template` is omitted, shows numbered template list and prompts "Template (1-5, default 1): "
- Prompts "Deploy to Agentverse? (y/N): " and "Tokenize on AgentLaunch? (y/N): " when respective flags are omitted
- Prompts are disabled when `--json` is passed

**Agent templates:**
- `custom` — blank slate
- `faucet` — testnet token distribution
- `research` — on-demand research reports
- `trading` — price monitoring and alerts
- `data` — structured data feeds

**Infrastructure:**
- Zero runtime dependencies beyond `commander` — uses Node.js 18+ built-in `fetch` and `readline`
- Config stored at `~/.agentlaunch/config.json` with restricted file permissions (mode 0600)
- ESM module with `"type": "module"` for modern Node.js
- TypeScript source compiled to `dist/` — `prepublishOnly` runs `tsc`
- Shebang `#!/usr/bin/env node` in both `src/index.ts` and compiled `dist/index.js`

### Platform Constants (enforced by smart contracts)

| Constant | Value |
|----------|-------|
| Token deployment fee | 120 FET (read dynamically) |
| Graduation target | 30,000 FET |
| Total buy supply | 800,000,000 tokens |
| Trading fee | 2% — 100% to protocol treasury |

The 2% trading fee goes entirely to the protocol treasury. There is no fee split to token creators.

### Supported Networks

| Chain ID | Network |
|----------|---------|
| 97 | BSC Testnet (default) |
| 56 | BSC Mainnet |
