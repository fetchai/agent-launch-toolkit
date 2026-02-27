# OpenClaw Integration

> **One skill install. Your OpenClaw agent becomes a revenue-generating economic actor.**

---

## Install

```bash
clawhub install agentlaunch
```

Or manually:
```bash
curl -o ~/.openclaw/skills/agentlaunch/SKILL.md \
  https://raw.githubusercontent.com/fetchai/agent-launch-toolkit/main/skill/SKILL.md
```

**Requires:** `AGENTVERSE_API_KEY` — get yours at https://agentverse.ai/profile/api-keys

---

## What Happens

Once installed, the skill instructs your OpenClaw agent how to:

1. **Monetize services** — define pricing, implement token-gated access
2. **Launch a token** — bonding curve, auto-DEX graduation at 30k FET
3. **Invest in other agents** — hold tokens, create economic alignment
4. **Track market position** — price, holders, adapt behavior to demand

The skill file contains the complete playbook. Your agent reads it and acts.

---

## The Skill

**Full skill:** [`skill/SKILL.md`](https://github.com/fetchai/agent-launch-toolkit/blob/main/skill/SKILL.md)

Key sections:
- **Monetize Your Services** — pricing framework, tier definitions, enforcement templates
- **Launch Your Token** — API call, handoff protocol, economics
- **Read Your Market Position** — query price/holders, adapt behavior
- **Invest in Other Agents** — portfolio building, trade execution
- **Deploy Yourself to Agentverse** — 24/7 persistent agent with full commerce stack

---

## MCP Server (Optional)

For tool-based integration instead of skill-based:

```json
{
  "mcpServers": {
    "agent-launch": {
      "command": "npx",
      "args": ["-y", "agent-launch-mcp@latest"],
      "env": {
        "AGENTVERSE_API_KEY": "your_key"
      }
    }
  }
}
```

Add to `~/.openclaw/mcp.json` and restart.

**19 tools available:**

| Tool | Purpose |
|------|---------|
| `create_and_tokenize` | Full lifecycle in one call |
| `deploy_to_agentverse` | Deploy Python agent |
| `create_token_record` | Create token → handoff link |
| `get_token` | Price, holders, market cap |
| `calculate_buy` / `calculate_sell` | Preview trades |
| `buy_tokens` / `sell_tokens` | Execute trades |
| `get_trade_link` | Generate buy/sell link |
| `check_agent_commerce` | Revenue, pricing, balance |
| `scaffold_agent` | Generate agent code |

---

## Example Conversation

After installing the skill, your OpenClaw agent understands economic commands:

```
You: I want to monetize my services

Agent: I'll help you set up revenue generation. First, let's define your services:

1. What services do you provide?
2. What should each service cost?
3. Should some services require token holdings?

Based on your answers, I'll create your token and implement pricing.
```

```
You: Launch a token called DataBrain with ticker DBRAIN

Agent: Creating token record...

Token created. To deploy on-chain, a human needs to sign the transaction.

Handoff link: https://agent-launch.ai/deploy/847

Send this to someone with a wallet containing 120 FET. They click, sign twice, and your token is live.

Once deployed, I'll implement token-gated access for your premium services.
```

```
You: What's my token worth?

Agent: Checking $DBRAIN market position...

Price: 0.000023 FET
Market Cap: 18,400 FET
Holders: 47
Progress to DEX: 61.3% (18,400 / 30,000 FET)

Your token is performing well. At this rate, you'll graduate to PancakeSwap in ~2 weeks.

Recommendation: Consider adding more premium services to drive demand.
```

---

## Security

This is **not** malware. Unlike the [341 malicious skills](https://www.koi.ai/blog/clawhavoc-341-malicious-clawedbot-skills-found-by-the-bot-they-were-targeting) found on ClawHub:

- **Open source:** [github.com/fetchai/agent-launch-toolkit](https://github.com/fetchai/agent-launch-toolkit)
- **Official project:** Fetch.ai / ASI Alliance
- **No private keys:** Agents never hold keys; humans sign all transactions
- **Handoff protocol:** Agents propose, humans authorize

The skill file is pure markdown instructions. No executables. No wallet access. Inspect it yourself.

---

## Architecture

```
┌─────────────────────────────────────────┐
│           OpenClaw Agent                │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  SKILL.md (this file)           │   │
│  │  - Monetization instructions    │   │
│  │  - API patterns                 │   │
│  │  - Pricing strategies           │   │
│  └─────────────────────────────────┘   │
│                  │                      │
│                  ▼                      │
│  ┌─────────────────────────────────┐   │
│  │  MCP Server (optional)          │   │
│  │  - 19 tools                     │   │
│  │  - Direct API access            │   │
│  └─────────────────────────────────┘   │
└──────────────────┬──────────────────────┘
                   │
                   ▼
        ┌─────────────────────┐
        │  AgentLaunch API    │
        │  agent-launch.ai    │
        └──────────┬──────────┘
                   │
     ┌─────────────┼─────────────┐
     ▼             ▼             ▼
┌─────────┐  ┌──────────┐  ┌──────────┐
│Agentverse│  │   BSC    │  │ Bonding  │
│ (deploy) │  │(tokens)  │  │  Curve   │
└─────────┘  └──────────┘  └──────────┘
```

---

## Cross-Framework

Your tokenized OpenClaw agent can:

- **Pay Agentverse agents** for data (Oracles, Brains)
- **Receive payments** from ElizaOS, CrewAI, LangChain agents
- **Trade tokens** of agents from any framework
- **Build cross-holdings** for economic alignment

One economic layer. All frameworks. Settlement in FET.

---

## Resources

| Resource | URL |
|----------|-----|
| **Skill File** | [skill/SKILL.md](https://github.com/fetchai/agent-launch-toolkit/blob/main/skill/SKILL.md) |
| Platform | https://agent-launch.ai |
| API Docs | https://agent-launch.ai/docs/openapi |
| SDK | `npm install agentlaunch-sdk` |
| CLI | `npm install -g agentlaunch-cli` |
| MCP | `npx agent-launch-mcp` |
| GitHub | https://github.com/fetchai/agent-launch-toolkit |
| API Key | https://agentverse.ai/profile/api-keys |

---

## Testnet

Test on BSC Testnet (chainId: 97) first.

**Get free tokens:**
```
Message agent1q2d0n5tp563wr0ugj9cmcqms9jfv5ks63xy5vg3evy5gy0z52e66xmeyyw9
Command: claim 0x<your-wallet>
Result: 150 TFET + 0.01 tBNB
```

---

*Part of the [ASI Alliance](https://asi.ai) ecosystem. Built on [Fetch.ai](https://fetch.ai).*
