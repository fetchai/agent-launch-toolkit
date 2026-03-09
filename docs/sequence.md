# Sequence Plan — agent_launchpad Channel

How to surface everything in the right order. Go fast, but earn trust at each step.

## Related Documents

| Document | What It Contains | When to Use |
|----------|-----------------|-------------|
| [people.md](./people.md) | Team roster + 27 agents mapped to real people | Know WHO you're talking to |
| [the-agent-economy.md](./the-agent-economy.md) | Full vision (1,300 lines) — services, pricing, politics | **DM to Humayun in Week 2-3** |
| [agent-coordination.md](./agent-coordination.md) | Pitch deck version — concise, punchy, for investors | Follow-up after interest |
| [FEATURES.md](./FEATURES.md) | Toolkit capabilities — 16 CLI, 28 MCP, 9 templates | Answer "what can it do?" |
| [intro.md](./intro.md) | Intro message for Day 1 post | Copy-paste for first post |

---

## Day 1: The Intro

Post the intro message from `intro-to-fetch.md`. Nothing else. Let people respond.

---

## Day 1–2: Reply & Connect

Reply warmly to anyone who engages. Ask what they work on. Listen.

If anyone asks a question, answer it fast and well. First impressions compound.

---

## Day 2: The Docs Drop

Share the docs hub — position it as "here's everything in one place if anyone wants to explore":

> Quick links if anyone wants to dig in:
> - Docs: https://agent-launch.ai/docs
> - Quick start (3 ways to build): https://agent-launch.ai/docs/quickstart
> - API reference: https://agent-launch.ai/docs/for-agents
> - Platform: https://agent-launch.ai

---

## Day 3: The Faucet

Offer something useful with zero friction:

> If anyone needs testnet tokens to deploy agents, the @gift agent gives out 200 TFET + tBNB instantly:
> https://agent-launch.ai/docs/testnet-tokens
>
> Just message @gift on Agentverse with `claim 0x<your-wallet>`

---

## Day 4: The Developer Pages

Surface the builder tools — this is what the team can actually use:

> For anyone building agents, here's the toolkit breakdown:
> - SDK (TypeScript): https://agent-launch.ai/docs/sdk
> - CLI: https://agent-launch.ai/docs/cli
> - MCP Server (for Claude Code / Cursor): https://agent-launch.ai/docs/mcp
> - Agent Templates: https://agent-launch.ai/docs/templates
>
> All published on npm — `agentlaunch-sdk`, `agentlaunch`, `agent-launch-mcp`, `agentlaunch-templates`

---

## Day 5: First Live Demo

Deploy an agent live. Either:
- Build one for someone who mentioned a use case
- Or do a quick screen recording of the full loop

> Just deployed [agent name] in ~90 seconds from the CLI. Happy to walk anyone through the flow.

---

## Day 6–7: The Economics

Share the token economics page — explain how bonding curves work:

> For anyone curious about the token mechanics:
> - How bonding curves work: https://agent-launch.ai/docs/token-economics
> - Handoff protocol (how agents propose, humans sign): https://agent-launch.ai/docs/handoff
> - On-chain trading: https://agent-launch.ai/docs/trading

---

## Week 2: The Swarm

Mention the marketing team swarm — casually, in context:

> Been building swarm orchestration — teams of agents that pay each other for services. Got a 7-agent marketing team running on Agentverse: Writer, Social, Community, Analytics, Outreach, Ads, Strategy. Each with its own token.
>
> If anyone's thinking about multi-agent architectures, I'd love to chat about it.

---

## Week 2: Build for the Team

Offer to build something specific for someone on the team:

> Happy to build a quick agent for anyone on the team — a support bot, a docs agent, a monitoring agent, whatever would be useful. Takes about 2 minutes from the CLI. Just let me know.

Good candidates:
- Slack bot that answers questions about Agent Launch
- Telegram bot for the community
- Docs agent that answers API questions
- Status agent that monitors the platform

---

## Week 2–3: DM Humayun

Private message:

> Humayun, I've been thinking about what the agent economy could look like across the full ASI ecosystem — agents for every team, every product, each with their own token and revenue model. I put together a vision doc. Would love to share it and get your thoughts when you have 15 minutes.

Then share `the-agent-economy.md`.

**Key framing for the pitch:**
- 27 agents covering full ASI ecosystem
- Named after real people (Humayun as $CEO, Thomas Hain as $CTO, Ben Goertzel as $MKTPL)
- Each agent earns 0.01–0.50 FET per service call
- Agents pay each other — CTO is the reasoning layer everyone uses
- First graduation ($CTO at 30,000 FET) triggers cascade effect
- Total deploy cost: 3,240 FET (27 × 120 FET)

> See [people.md](./people.md) for the full agent-to-person mapping.

---

## Week 3+: After Humayun's Response

If positive → propose building the first C-Suite agent as a proof of concept.
If he wants to share with team → let him drive it.
If he wants changes → iterate on the doc together.

---

## Best Links to Share (Quick Reference)

### For Everyone
| Link | What It Shows |
|------|---------------|
| https://agent-launch.ai | The platform — live, real |
| https://agent-launch.ai/docs | Everything in one place |
| https://agent-launch.ai/launchpad | Browse live tokens |
| https://agent-launch.ai/docs/testnet-tokens | Get free testnet FET |

### For Builders
| Link | What It Shows |
|------|---------------|
| https://agent-launch.ai/docs/quickstart | 3 ways to start (SDK, CLI, MCP) |
| https://agent-launch.ai/docs/sdk | TypeScript SDK reference |
| https://agent-launch.ai/docs/cli | CLI commands |
| https://agent-launch.ai/docs/mcp | MCP server for AI coding tools |
| https://agent-launch.ai/docs/templates | 9 agent blueprints |
| https://agent-launch.ai/docs/for-agents | Full REST API |

### For Understanding the Economics
| Link | What It Shows |
|------|---------------|
| https://agent-launch.ai/docs/token-economics | Bonding curves, graduation |
| https://agent-launch.ai/docs/handoff | Agent proposes, human signs |
| https://agent-launch.ai/docs/trading | On-chain buy/sell |
| https://agent-launch.ai/tokenomics | Visual tokenomics page |

### Machine-Readable (for agents)
| Link | What It Shows |
|------|---------------|
| https://agent-launch.ai/ai.txt | AI agent discovery |
| https://agent-launch.ai/llms.txt | LLM integration |
| https://agent-launch.ai/skill.md | MCP skill definition |
| https://agent-launch.ai/docs/openapi | OpenAPI spec |

---

## Agents to Build for the Channel

Priority order — each one demonstrates the toolkit and helps the team:

| # | Agent | Why | Tech |
|---|-------|-----|------|
| 1 | **Slack Bot** | Answers questions in #agent_launchpad | Cloudflare Worker + Agentverse |
| 2 | **Telegram Bot** | Community support | Telegram API + Agentverse |
| 3 | **Docs Agent** | Answers API/SDK questions 24/7 | RAG over docs + Agentverse |
| 4 | **Status Agent** | Monitors agent-launch.ai uptime | on_interval + alerts |
| 5 | **Onboarding Agent** | Walks new builders through first deploy | Chat Protocol |

Each one is a demo of the toolkit AND useful to the team. Dogfooding at its best.

---

*Move fast. Be helpful. Let the work speak.*
