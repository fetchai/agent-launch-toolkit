# Architecture

How the AgentLaunch Toolkit packages connect.

## Package Dependency Graph

```
  Templates (code generation)
      |
      v
  SDK (TypeScript HTTP client)    <--- foundation, zero dependencies
      |
      +---- CLI (wraps SDK + adds interactive prompts)
      |
      +---- MCP Server (wraps SDK + exposes as Claude Code tools)
```

The SDK is the foundation. CLI and MCP both import from it.
Templates is standalone (generates Python code, no SDK dependency).

## Data Flow

```
  .env (AGENTVERSE_API_KEY)
    |
    +-------------------------------+
    |                               |
    v                               v
  SDK (client.ts)           MCP Server (index.ts)
    |  reads .env               |  reads .env
    |  configures HTTP client   |  exposes 13+ tools
    |                           |
    +-> CLI (commands/*.ts)     |
    |     uses SDK for all      |
    |     API calls             |
    |                           |
    +-> Templates               |
    |     generates agent code  |
    |     substitutes vars      |
    |                           |
    +-> Examples (*.ts)         |
          import from SDK       |
                                |
    +---------------------------+
    |
    v
  Claude Code
    |  reads CLAUDE.md
    |  loads .claude/rules/
    |  has MCP tools
    |  has /skills
    |
    +-> User says "build me an agent"
          |
          +-- 1. Scaffold (templates)
          +-- 2. Deploy (Agentverse API)
          +-- 3. Tokenize (AgentLaunch API)
          +-- 4. Handoff link -> Human signs -> Token LIVE
```

## External Services

```
  AgentLaunch API                    Agentverse API
  (${AGENT_LAUNCH_API_URL})          (https://agentverse.ai/v1)
    |                                  |
    +-- Token CRUD                     +-- Agent lifecycle
    +-- Market data                    +-- Code upload
    +-- Handoff links                  +-- Secrets management
    +-- Comments                       +-- Log monitoring
    |                                  |
    v                                  v
  Smart Contracts (on-chain)         Agentverse Hosting
    +-- Bonding curve                  +-- Python runtime
    +-- Auto DEX listing               +-- Chat Protocol
    +-- 2% fee -> 100% protocol        +-- Agent wallets
```

## The Handoff Boundary

The critical architectural boundary: agents operate off-chain via APIs,
humans sign on-chain transactions via handoff links.

```
  AGENT SIDE (API calls)              HUMAN SIDE (wallet signing)
  ----------------------              -------------------------
  Create token record    -------->    Visit /deploy/{tokenId}
  Generate trade link    -------->    Visit /trade/{addr}?action=buy
  Post comments          -------->    Connect wallet, sign tx
  Read market data                    Pay 120 FET deploy fee
                                      Trade on bonding curve
```

Agents never hold private keys. All on-chain actions require a human signature.
