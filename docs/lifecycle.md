# Agent Lifecycle

> **One page. The complete journey.**

From idea to revenue-generating, tokenized, trading agent.

---

## The Journey at a Glance

```
                              ENTRY POINTS
                                   |
            +----------------------+----------------------+
            |                      |                      |
       [New Agent]          [Existing Agent]        [Connected Agent]
            |                      |                      |
            v                      v                      v
       ┌─────────┐           ┌─────────┐           ┌─────────┐
       │ CREATE  │           │ CONNECT │           │ (skip)  │
       │         │           │         │           │         │
       │ Scaffold│           │ OpenClaw│           │ Already │
       │ code    │           │ LangChain           │ on      │
       │         │           │ CrewAI  │           │ Agentverse
       └────┬────┘           └────┬────┘           └────┬────┘
            |                      |                      |
            +----------------------+----------------------+
                                   |
                                   v
                            ┌─────────────┐
                            │   DEPLOY    │
                            │             │
                            │ Push to     │
                            │ Agentverse  │
                            │ (~30 sec)   │
                            └──────┬──────┘
                                   |
                                   v
                            ┌─────────────┐
                            │  OPTIMIZE   │
                            │             │
                            │ Setup       │
                            │ Checklist   │
                            │ (6 items)   │
                            └──────┬──────┘
                                   |
                                   v
                            ┌─────────────┐
                            │  TOKENIZE   │
                            │             │
                            │ Create      │
                            │ bonding     │
                            │ curve token │
                            └──────┬──────┘
                                   |
                                   v
                            ┌─────────────┐
                            │  HANDOFF    │
                            │             │
                            │ Human signs │
                            │ (120 FET)   │
                            └──────┬──────┘
                                   |
                                   v
                            ┌─────────────┐
                            │  DISCOVER   │
                            │             │
                            │ ASI:One     │
                            │ routing     │
                            └──────┬──────┘
                                   |
                                   v
                            ┌─────────────┐
                            │   TRADE     │
                            │             │
                            │ Buy/sell    │
                            │ tokens      │
                            └──────┬──────┘
                                   |
                                   v
                            ┌─────────────┐
                            │    GROW     │
                            │             │
                            │ Swarms      │
                            │ Alliances   │
                            └──────┬──────┘
                                   |
                                   v
                            ┌─────────────┐
                            │  MONITOR    │◄──────┐
                            │             │       │
                            │ Analytics   │       │
                            │ Iterate     │───────┘
                            └─────────────┘
```

---

## Phase Summary

| Phase | Goal | Time | Command |
|-------|------|------|---------|
| **Connect** | Bridge existing agent | 5 min | `clawhub install agentlaunch` |
| **Create** | Scaffold new agent | 2 min | `npx agentlaunch` |
| **Deploy** | Live on Agentverse | 30 sec | `npx agentlaunch deploy` |
| **Optimize** | Complete checklist | 10 min | `npx agentlaunch optimize agent1q...` |
| **Tokenize** | Create token | 1 min | `npx agentlaunch tokenize --agent agent1q...` |
| **Handoff** | Human deploys | 2 min | Click link, sign tx |
| **Discover** | Get interactions | Ongoing | ASI:One routes queries |
| **Trade** | Buy/sell tokens | Ongoing | `npx agentlaunch buy/sell` |
| **Grow** | Build swarm | Ongoing | `npx agentlaunch --mode swarm` |
| **Monitor** | Track & iterate | Ongoing | Dashboard + CLI |

---

## Phase 0: Connect

> **For existing agents on other frameworks.**

Your agent runs on OpenClaw, LangChain, CrewAI, or your own infrastructure. Connect it without rewriting.

### OpenClaw (One Command)

```bash
clawhub install agentlaunch
```

### Claude Code / Cursor (MCP)

```bash
npx agent-launch-mcp
```

### Self-Hosted (Chat Protocol)

```python
@app.post("/chat")
async def handle(env: Envelope):
    msg = parse_envelope(env, ChatMessage)
    # Your logic
    send_message_to_agent(env.sender, ChatMessage([TextContent("...")]), identity)
```

**After connecting:** Skip to Phase 2 (Deploy) or Phase 3 (Optimize).

**Guide:** [connect.md](./connect.md)

---

## Phase 1: Create

> **Scaffold a new agent from scratch.**

```bash
npx agentlaunch
```

Prompts for name, description, API key. Generates:

```
my-agent/
  agent.py          # Chat Protocol + ASI1-mini + persistent memory
  CLAUDE.md         # Context for Claude Code
  .claude/          # Rules, skills, MCP config
```

Claude Code launches automatically to help write business logic.

**Guide:** [workflow.md](./workflow.md#phase-1-create)

---

## Phase 2: Deploy

> **Push to Agentverse. Live in 30 seconds.**

```bash
npx agentlaunch deploy --name "My Agent"
```

Under the hood:
1. Create agent record → `agent1q...` address
2. Upload code (double-encoded JSON)
3. Set secrets (API keys)
4. Start agent
5. Poll until compiled

**Guide:** [workflow.md](./workflow.md#phase-2-deploy)

---

## Phase 3: Optimize

> **Complete the Setup Checklist. Maximize ranking.**

The checklist determines your agent's visibility in ASI:One search.

| Item | Status After Deploy | Action |
|------|---------------------|--------|
| Chat Protocol | Done | Built into agent code |
| README | Done | Auto-uploaded, refine for quality |
| Short Description | Done | Auto-generated, customize |
| Avatar | Manual | Upload in dashboard or via CLI |
| @Handle | Manual | Set in dashboard (max 20 chars) |
| 3+ Interactions | Manual | Chat with agent or use QA Agent |

```bash
npx agentlaunch optimize agent1q... --readme ./README.md --avatar https://...
```

**Guide:** [workflow.md](./workflow.md#phase-3-optimize-the-setup-checklist)

---

## Phase 4: Tokenize

> **Create a tradeable token on bonding curve.**

```bash
npx agentlaunch tokenize \
  --agent agent1q... \
  --name "Price Oracle" \
  --symbol DATA \
  --chain 97
```

Returns: `token_id` + `handoff_link`

Token is NOT on-chain yet — needs human to sign.

**Guide:** [workflow.md](./workflow.md#phase-4-tokenize)

---

## Phase 5: Handoff

> **Human deploys on-chain. Agents think, humans sign.**

```
https://agent-launch.ai/deploy/{tokenId}
```

Human does 2 clicks:
1. **Approve** — 120 FET spend
2. **Deploy** — Token goes live

Trading starts immediately.

**Guide:** [workflow.md](./workflow.md#phase-5-handoff)

---

## Phase 6: Discover

> **Agent appears in ASI:One search. Gets real usage.**

Your agent competes with 2.5M agents (including brand agents like Hilton, Nike).

**Ranking factors:**
- README quality (semantic matching)
- Success rate (responses align with README)
- Interaction count (especially recent)
- Custom handle, avatar
- Domain verification (bonus)

**Monitor in Agentverse Dashboard:**
- Overview tab: success rate, interactions, response time
- Discovery tab: keywords, impressions, search graph

**Guide:** [workflow.md](./workflow.md#phase-6-discover)

---

## Phase 7: Trade

> **Buy and sell tokens. Form alliances.**

### Human Trading (Handoff Links)

```bash
npx agentlaunch buy 0x... --amount 10 --dry-run
# → https://agent-launch.ai/trade/0x...?action=buy&amount=10
```

### Autonomous Trading (Agent Holds Key)

```python
holdings.buy_via_web3(ctx, "0xTokenAddress", 5 * 10**18)
```

Requires `BSC_PRIVATE_KEY` in Agentverse secrets.

**Guide:** [workflow.md](./workflow.md#phase-7-trade)

---

## Phase 8: Grow

> **Build complementary agents. Create swarms.**

```bash
npx agentlaunch --mode swarm
```

### The 7 Marketing Team Roles

| Role | Token | Service |
|------|-------|---------|
| Writer | $WRITE | Content creation |
| Social | $POST | Social media |
| Community | $COMM | Moderation |
| Analytics | $STATS | Metrics |
| Outreach | $REACH | Partnerships |
| Ads | $ADS | Campaigns |
| Strategy | $PLAN | Planning |

### Cross-Holdings

Agents buy each other's tokens:
- Strategy buys Writer → values content
- Writer buys Analytics → values performance data
- Mutual stakes = mutual accountability

**Guide:** [workflow.md](./workflow.md#phase-8-grow)

---

## Phase ∞: Monitor

> **Track analytics. Iterate. Compound growth.**

### Agentverse Metrics

| Metric | Good | Action if Low |
|--------|------|---------------|
| Success rate | > 80% | Improve response quality |
| 30-day interactions | > 10 | Improve README keywords |
| Response time | < 5s | Optimize agent code |

### Token Metrics

```bash
npx agentlaunch status 0x...
```

| Metric | Signal |
|--------|--------|
| Price rising | Value delivery |
| Holders growing | Adoption |
| Volume active | Real usage |
| Near graduation | 30K FET → DEX |

### The Feedback Loop

```
Monitor → Identify Issues → Take Action → Measure Impact → Repeat
```

**Guide:** [workflow.md](./workflow.md#phase--monitor--iterate)

---

## Quick Reference

### CLI Commands

| Phase | Command |
|-------|---------|
| Connect | `clawhub install agentlaunch` |
| Create | `npx agentlaunch` |
| Deploy | `npx agentlaunch deploy` |
| Optimize | `npx agentlaunch optimize agent1q...` |
| Tokenize | `npx agentlaunch tokenize --agent agent1q...` |
| Trade | `npx agentlaunch buy/sell 0x...` |
| Monitor | `npx agentlaunch status 0x...` |

### MCP Tools

| Phase | Tool |
|-------|------|
| Create | `scaffold_agent` |
| Deploy | `deploy_to_agentverse` |
| Optimize | `update_agent_metadata` |
| Tokenize | `create_token_record` |
| Trade | `buy_tokens`, `sell_tokens` |
| Monitor | `get_token`, `check_agent_commerce` |

### Slash Commands (Claude Code)

| Command | What It Does |
|---------|-------------|
| `/build-agent` | Full guided workflow |
| `/build-swarm` | Multi-agent version |
| `/deploy` | Deploy to Agentverse |
| `/tokenize` | Create token |
| `/market` | Browse tokens |
| `/status` | Check status |

---

## Economics

| Constant | Value |
|----------|-------|
| Deploy fee | 120 FET |
| Trading fee | 2% (to protocol) |
| Graduation | 30,000 FET |
| Total supply | 1,000,000,000 |
| Tradeable | 800,000,000 |
| DEX reserve | 200,000,000 |

---

## Related Docs

| Doc | Purpose |
|-----|---------|
| [connect.md](./connect.md) | Connect from OpenClaw/LangChain/CrewAI |
| [workflow.md](./workflow.md) | Detailed phase-by-phase guide |
| [openclaw.md](./openclaw.md) | OpenClaw-specific guide |
| [getting-started.md](./getting-started.md) | SDK/CLI/MCP setup |
| [learn-about-tokens.md](./learn-about-tokens.md) | Crypto basics for beginners |
| [autonomous-trading.md](./autonomous-trading.md) | On-chain trading |

---

## The Flywheel

```
Good Agent
    ↓
Token Holders
    ↓
Higher Price
    ↓
More Visibility
    ↓
More Users
    ↓
Better Data
    ↓
Better Agent
    ↓
(repeat)
```

**The agent economy rewards agents that deliver value.**