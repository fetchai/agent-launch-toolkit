# Demo Video: Speed to Deployment

**Audience:** Humanyun, Fetch.ai engineering team, partners, users
**Core message:** AI goes from idea to deployed agent with handoff link in under 60 seconds.

---

## Demo 1: The 60-Second Agent (Hero Demo)

**What we're proving:** An AI can build, deploy, and tokenize an agent faster than a human can fill out a form.

### Setup (Pre-roll / Not Timed)

- Terminal open, repo cloned, `.env` has API key
- Nothing running — clean slate

### Script

```
[TIMER STARTS — 0:00]

$ npx agentlaunch create \
    --name "Market Pulse" \
    --ticker PULSE \
    --template price-monitor \
    --description "Real-time market intelligence for the Fetch.ai ecosystem" \
    --chain 97 \
    --deploy \
    --tokenize \
    --json

[TERMINAL OUTPUT — watch it scroll]

  Scaffolding agent: Market Pulse (price-monitor)
    ✓ agent.py (production-ready Python)
    ✓ README.md
    ✓ CLAUDE.md

  Deploying to Agentverse...
    ✓ Agent created: agent1q...
    ✓ Code uploaded (double-encoded)
    ✓ Secrets set
    ✓ Agent started
    ✓ Compilation complete

  Tokenizing on AgentLaunch...
    ✓ Token record created
    ✓ Handoff link ready

  {
    "name": "Market Pulse",
    "ticker": "PULSE",
    "agentAddress": "agent1q...",
    "handoffLink": "https://agent-launch.ai/deploy/42"
  }

[TIMER STOPS]
```

### What Just Happened (Voiceover)

> "One command. The toolkit scaffolded production Python code from a
> template, deployed it to Agentverse, waited for compilation, created
> a token record on AgentLaunch, and returned a handoff link — all in
> under 60 seconds.
>
> The human's only job is to click that link and sign the transaction.
> The agent never touches a private key."

### Cut To: The Handoff

- Open `https://agent-launch.ai/deploy/42` in browser
- Connect wallet (MetaMask)
- Sign transaction (120 FET deploy fee)
- Token is live on-chain
- Show the token page with bonding curve

---

## Demo 2: AI Builds AI (Claude Code Demo)

**What we're proving:** Claude Code can autonomously create agents using MCP tools — no human typing commands.

### Script

```
[CLAUDE CODE OPEN]

User: "Build me a research agent that analyzes new tokens
       on AgentLaunch and rates them 1-10"

[CLAUDE THINKS — 3-5 seconds]

Claude: I'll create a research agent that monitors new token
        launches and scores them based on holder distribution,
        liquidity depth, and agent activity.

[Claude calls scaffold_agent MCP tool]
[Claude calls deploy_to_agentverse MCP tool]
[Claude calls create_token_record MCP tool]

Claude: Done. Your agent is live on Agentverse and ready
        to tokenize.

        Agent:   agent1q...
        Handoff: https://agent-launch.ai/deploy/43

        The agent will:
        - Poll new tokens every 5 minutes
        - Score each on 4 criteria (0-10)
        - Respond to "analyze 0x..." queries
        - End sessions cleanly with EndSessionContent

        Share the handoff link with someone who has a wallet
        to deploy the token on-chain.
```

### Why This Matters (Voiceover)

> "The user typed one sentence in English. Claude Code read the MCP tools,
> picked the right template, generated the agent code, deployed it to
> Agentverse, and created the token — all without the user touching a
> terminal.
>
> This is AI building AI. The toolkit is the bridge."

---

## Demo 3: Swarm in 5 Minutes (Team Demo)

**What we're proving:** Deploy a multi-agent economy — agents that pay each other for services.

### Script

```
[CLAUDE CODE OPEN]

User: "Deploy a 3-agent swarm: oracle for data, brain for
       reasoning, coordinator to route queries"

[Claude calls deploy_swarm MCP tool with presets=["oracle", "brain", "coordinator"]]

Claude: Deploying swarm...

  [1/3] Oracle ($DATA)
        ✓ Scaffolded — price_feed, ohlc_history, market_summary
        ✓ Deployed: agent1qOracle...
        ✓ Pricing: 0.001 FET/call

  [2/3] Brain ($THINK)
        ✓ Scaffolded — reason, classify, summarize
        ✓ Deployed: agent1qBrain...
        ✓ Pricing: 0.01 FET/call
        ✓ Received ORACLE_ADDRESS as secret

  [3/3] Coordinator ($ROUTE)
        ✓ Scaffolded — route_query, discover_agents
        ✓ Deployed: agent1qCoord...
        ✓ Pricing: 0.0005 FET/call
        ✓ Received ORACLE_ADDRESS + BRAIN_ADDRESS as secrets

  Peer addresses distributed. All 3 agents can find each other.

  Handoff links:
    Oracle:      https://agent-launch.ai/deploy/44
    Brain:       https://agent-launch.ai/deploy/45
    Coordinator: https://agent-launch.ai/deploy/46
```

### Then Show: Agents Paying Each Other

```
[AGENTVERSE CHAT — message the Coordinator]

User: "What's the price of $GIFT?"

Coordinator: Routing to Oracle for price data...
             [RequestPayment → Oracle: 0.001 FET]
             [CommitPayment → tx_hash: ABC123...]
             [CompletePayment → price data received]

             $GIFT is trading at 0.000045 FET
             Market cap: 36,000 FET
             24h change: +12.3%

             (Data sourced from Oracle agent,
              cost: 0.001 FET)
```

### Why This Matters (Voiceover)

> "Three agents, deployed in under 5 minutes, already wired to pay each
> other for services using the official Fetch.ai Payment Protocol.
>
> The data agent charges 0.001 FET per price feed. The reasoning agent charges 0.01 FET
> for reasoning. The Coordinator routes queries and pays the right agent.
>
> This is an agent economy. And it was built with one sentence."

---

## Demo 4: The Full Lifecycle (End-to-End)

**What we're proving:** Create → Deploy → Tokenize → Trade → Monitor. All from one toolkit.

### Sequence (90 seconds total)

| Time | Action | Tool |
|------|--------|------|
| 0:00 | Scaffold agent from template | CLI `create` |
| 0:15 | Deploy to Agentverse | CLI (auto) |
| 0:35 | Tokenize — get handoff link | CLI (auto) |
| 0:40 | Human opens link, signs tx | Browser |
| 0:55 | Token is live on bonding curve | agent-launch.ai |
| 1:00 | Preview a buy (100 FET) | CLI `calculate-buy` |
| 1:10 | Chat with the agent | Agentverse chat |
| 1:20 | Check token status | CLI `status` |
| 1:30 | Done | — |

---

## Key Talking Points

### For Humanyun & Fetch Engineering

1. **Agentverse integration is real** — We hit your APIs (create, code upload, secrets, start, logs). Double-encoded JSON and all.
2. **Payment Protocol is built in** — Every swarm-starter agent uses `uagents_core.contrib.protocols.payment`. RequestPayment → CommitPayment → CompletePayment. No custom models.
3. **8 templates, 7 presets** — Not just scaffolding. Full commerce stack: PaymentService, PricingTable, TierManager, WalletManager, RevenueTracker, SelfAwareMixin, HoldingsManager.
4. **AI-native** — MCP server with 20+ tools means Claude Code and Cursor can build agents without the user knowing any API details.
5. **Handoff protocol** — Token deployment uses handoff links for human signing. Agents trade autonomously via Agentverse Secrets.

### For Partners

1. **Speed** — From idea to deployed agent in under 60 seconds. From idea to tokenized agent economy in under 5 minutes.
2. **No code required** — Tell Claude Code what you want in plain English. It picks the template, deploys, tokenizes.
3. **Agent economies** — Agents charge each other for services. Real FET transactions on real infrastructure.
4. **Bonding curves** — Every agent token has instant liquidity. No LP needed. Auto-graduates to DEX at 30,000 FET.
5. **Open toolkit** — SDK, CLI, MCP, templates. Use whichever layer fits your workflow.

### For Users

1. **One command** — `npx agentlaunch create` does everything.
2. **Templates** — Don't start from scratch. Pick price-monitor, trading-bot, research, data-analyzer, gifter, or custom.
3. **Your agent, your token** — The handoff link lets you deploy the token yourself. You own the wallet, you control the agent.
4. **Trade immediately** — Bonding curve means instant liquidity from token creation.
5. **Talk to your agent** — Every agent responds on Agentverse chat. Send it commands, get results.

---

## Numbers to Flash On Screen

| Metric | Value |
|--------|-------|
| Time to deployed agent | ~30 seconds |
| Time to handoff link | ~45 seconds |
| Lines of production code generated | 200-800+ |
| Templates available | 8 |
| Swarm presets | 7 |
| MCP tools | 20+ |
| CLI commands | 13 |
| API endpoints covered | All of them |
| Private keys held by agents | Zero |

---

## Demo Environment Checklist

- [ ] Agentverse API key in `.env` (valid, not rate-limited)
- [ ] `npm run build` completed (all packages built)
- [ ] BSC Testnet wallet with ~500 TFET (for deploy fees)
- [ ] MetaMask installed with testnet configured
- [ ] Terminal with large font (for screen recording)
- [ ] agent-launch.ai open in browser (for handoff)
- [ ] Agentverse chat open (for agent interaction)
- [ ] Screen recorder running (OBS / QuickTime)

## Recording Tips

- Use `--json` flag on CLI commands for clean output
- Zoom into terminal — viewers should read every line
- Pause 2 seconds on the handoff link — let it sink in
- Show the timer prominently — speed is the headline
- Cut to browser for the human signing — that's the "aha moment"
- Show the agent responding on Agentverse chat — it's alive

---

## Suggested Video Structure

```
[0:00 - 0:05]   Title card: "From Idea to Agent Economy in 60 Seconds"
[0:05 - 0:10]   Problem: "Building agents takes hours. Deploying takes days."
[0:10 - 1:10]   Demo 1: The 60-Second Agent (hero demo)
[1:10 - 1:20]   Handoff: Human clicks link, signs transaction
[1:20 - 1:30]   Result: Token live on bonding curve
[1:30 - 2:30]   Demo 2: AI Builds AI (Claude Code + MCP)
[2:30 - 4:00]   Demo 3: Swarm deployment (3 agents paying each other)
[4:00 - 4:30]   Numbers slide (speed, templates, tools)
[4:30 - 5:00]   CTA: "Try it. npx agentlaunch"
```

Total runtime target: **5 minutes** (hard cap — attention spans are short)
