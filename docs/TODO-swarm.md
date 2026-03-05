---
title: Marketing Team Swarm
type: roadmap
version: 1.3.0
priority: Test → Tokenize
total_tasks: 20
completed: 20
status: DEPLOYED
created: 2026-03-04
updated: 2026-03-04
---

# Marketing Team Swarm

> A marketing team everyone understands.
> Writer creates content. Social posts it. Analytics tracks it. Strategy coordinates.
> Each agent does real work, charges real FET, and calls each other.
>
> This swarm IS the marketing for AgentLaunch — dogfooding.

---

## The 7 Roles

```
  Writer ($WRITE)      Creates blog posts, tweets, newsletters, ad copy
  Social ($POST)       Posts to Twitter/X, schedules threads, replies
  Community ($COMM)    Manages Telegram group, answers FAQs, welcomes members
  Analytics ($STATS)   Engagement reports, audience insights, trends
  Outreach ($REACH)    Finds partners, drafts pitches, sends emails
  Ads ($ADS)           Creates ad copy, A/B tests, optimizes campaigns
  Strategy ($PLAN)     Content calendar, brand audit, coordinates all agents
```

### Build Order

```
Level 0 (root providers):       Writer, Community
Level 1 (consume Level 0):      Social (needs Writer), Analytics
Level 2 (consume Level 0-1):    Outreach (needs Writer + Analytics), Ads (needs Writer + Analytics)
Level 3 (consumes everything):  Strategy (coordinates all)
```

### Real API Integrations

| Agent | APIs | Required Secrets |
|-------|------|-----------------|
| Writer | ASI1-mini | ASI1_API_KEY |
| Social | Twitter API v2 + Writer | TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET, WRITER_ADDRESS |
| Community | Telegram Bot API | TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID |
| Analytics | Twitter Analytics + internal | TWITTER_BEARER_TOKEN |
| Outreach | Resend + ASI1-mini + Writer | RESEND_API_KEY, ASI1_API_KEY, WRITER_ADDRESS |
| Ads | ASI1-mini + Writer | ASI1_API_KEY, WRITER_ADDRESS |
| Strategy | ASI1-mini + calls other agents | ASI1_API_KEY, + all peer *_ADDRESS secrets |

All agents also get: AGENTVERSE_API_KEY, AGENTLAUNCH_API_KEY, AGENT_ADDRESS, AGENT_OWNER_ADDRESS, BSC_PRIVATE_KEY.

### Wallet Access (Runtime-Verified 2026-03-04)

```
ctx.ledger   ✓  EXISTS — cosmpy.aerial.client.LedgerClient
agent.wallet ✓  EXISTS — cosmpy.aerial.wallet.LocalWallet (auto-provisioned fetch1... address)
ctx.wallet   ✗  DOES NOT EXIST — never use, use agent.wallet instead
Payment proto ✓ AVAILABLE — uagents_core.contrib.protocols.payment imports succeed
```

Balance check pattern: `ctx.ledger.query_bank_balance(str(agent.wallet.address()), "atestfet")`

---

## Now

- [x] All 7 agents deployed, compiled, and running on Agentverse
- [x] Inter-agent communication verified (Tester → Strategy → Writer → Strategy → Tester)
- [x] Direct calls verified (Tester → Writer → Tester)
- [x] All agents optimized (README + short_description set)
- [x] Workflow enforcement added to rules + skills (Phase 3: Optimize is mandatory)
- [ ] Add missing API secrets (TWITTER_*, TELEGRAM_CHAT_ID, RESEND_API_KEY)
- [ ] Tokenize agents ($WRITE, $POST, $COMM, $STATS, $REACH, $ADS, $PLAN)

## Deployed Agents

| # | Agent | Address | Status |
|---|-------|---------|--------|
| 1 | Writer | `agent1q2y3r4rjj8elyz892vt04fpafvrmfqqqvgg3x4ug8tcjm89deyd4xm3aae0` | running |
| 2 | Community | `agent1qwkctg380u95cvtkrygp6dklnlvr3k33jadhugmhpfl46tc66dkmk88dtf0` | running |
| 3 | Social | `agent1qgeyze5082r37hshmedhpxfwa3t56r3p8sqmhkyw26a38znwzxfej4ydt3v` | running |
| 4 | Analytics | `agent1qdnl9ldcu5acvczmt2epjkvmlt6rzh3eng48yn5ehf6me4wxapqmqg5rtqw` | running |
| 5 | Outreach | `agent1qg7wdw35d6gpvmgzqsd66hwrwrzpk6gq8ksaq868k3ves4xf39f7vhxvd4c` | running |
| 6 | Ads | `agent1qgzxtp348z74uzzl4s34wafqsnzfhkcnxhtp5z6akqnp3g46s25usu0e2fg` | running |
| 7 | Strategy | `agent1qdj2p2ruzm2gh6lr8hpvs4jkxpe94efpqclg2s2y6m808spkm86akvcrf7f` | running |

### Secrets Still Needed

| Agent | Missing Secret | Purpose |
|-------|---------------|---------|
| Community | `TELEGRAM_CHAT_ID` | Target Telegram group for messages |
| Social | `TWITTER_API_KEY`, `TWITTER_API_SECRET`, `TWITTER_ACCESS_TOKEN`, `TWITTER_ACCESS_SECRET` | Twitter posting |
| Analytics | `TWITTER_BEARER_TOKEN` | Twitter analytics data |
| Outreach | `RESEND_API_KEY` | Email delivery via Resend |

---

## Phase 1: Code & Presets (COMPLETE)

All code, presets, tests, docs, and examples are done.

| Status | ID | Task | How | KPI | Depends |
|:---:|:---|:---|:---|:---|:---|
| `[x]` | C-1 | Replace presets | Replaced 7 Genesis presets with 7 Marketing presets in `packages/templates/src/presets.ts` | 7 new presets | — |
| `[x]` | C-2 | Rename template + tests | Renamed `genesis.ts` → `swarm-starter.ts`, `genesis.test.ts` → `swarm-starter.test.ts`, updated registry import | No genesis files | C-1 |
| `[x]` | C-3 | Write 7 example agents | Created `examples/marketing-team/` with writer.py, social.py, community.py, analytics.py, outreach.py, ads.py, strategy.py + README.md | 7 agents + README | C-1 |
| `[x]` | C-4 | Update all docs | Updated CLAUDE.md, README.md, TUTORIAL.md, autonomous-trading.md, openclaw.md, workflow.md, demo-commerce.md, check.md, cli-reference.md, mcp-tools.md. Zero genesis references remaining. | grep finds 0 matches | C-2 |
| `[x]` | C-5 | Update MCP + CLI + SDK | Updated commerce.ts, index.ts, scaffold.ts, tokenize.ts, create.ts, SDK commerce.ts. Removed all genesis aliases. | No genesis in code | C-1 |
| `[x]` | C-6 | Update rule file | Created `.claude/rules/marketing-swarm.md`, deleted `genesis-network.md` | Rule file correct | C-1 |
| `[x]` | C-7 | Update smoke tests | Fixed `test-templates.mjs` preset refs (oracle→writer), template refs (genesis→swarm-starter). Added clean step to `test-publish.sh`. | 5/5 smoke tests pass | C-4 |
| `[x]` | C-8 | Publish workflow | Added `prepublishOnly` to templates, added `publish:all` and `prepublish:all` scripts to root package.json | `npm run test:publish` passes | C-7 |

### Phase 1 Gate (PASSED)

```
  [x] npm run build passes
  [x] npm run test passes
  [x] npm run test:publish passes (5/5 smoke tests)
  [x] grep -ri genesis finds 0 matches (excluding deprecated organic-growth-strategy.md)
  [x] All 7 presets resolve with zero unresolved {{}} placeholders
```

---

## Phase 1.5: Feature Completeness

Close the gaps between documented features and actual implementation.

| Status | ID | Task | How | KPI | Depends |
|:---:|:---|:---|:---|:---|:---|
| `[x]` | F-1 | Add inter-agent calls to Ads | Added `call_peer`/`get_peer_pending` pattern to `ads.py`. New `autocreate` command calls Writer for ad copy, creates A/B test from response. Fallback to local ASI1-mini if Writer unavailable. | `autocreate` command works | C-3 |
| `[x]` | F-2 | Update README commands | Added 10 undocumented commands to README: `queue` (Social), `welcome`/`addfaq` (Community), `log`/`stats` (Outreach), `autocreate`/`event`/`campaigns` (Ads), `plans`/`team` (Strategy). | All implemented cmds documented | F-1 |
| `[x]` | F-3 | Update strategy doc commands | Updated `docs/marketing-team.md` commands tables: added `autopost` (Social), `autopitch` (Outreach), `autocreate`/`event`/`campaigns` (Ads), `create`/`publish`/`ask`/`plans`/`team` (Strategy), `stats` (Community). | Docs match implementation | F-2 |
| `[x]` | F-4 | Update TODO + presets + MCP | Updated `TODO-swarm.md`, Ads row in API table, `presets.ts` and `commerce.ts` secrets (OPENAI→ASI1, SendGrid→Resend). | Zero stale references | F-3 |
| `[x]` | F-5 | Add self-awareness to Writer | Added `on_interval(3600)` to `writer.py`: reads token price from AgentLaunch API, stores price_history (720 data points), adjusts effort_mode (high/normal/growth). Added `status` command showing price, holders, market cap, effort mode. | Writer reads own token price | — |
| `[x]` | F-6 | Add revenue tracking | Added `log_revenue()`/`get_revenue_summary()` helpers to all 7 agents. Each service call logged with caller, service, amount, timestamp. Rolling window (500 entries). Added `revenue` command to all agents. | `revenue` command on all 7 | F-5 |
| `[x]` | F-7 | Add wallet balance check | Added `balance` command to all 7 agents: queries `ctx.ledger.query_bank_balance()` for atestfet, converts to FET. | `balance` command on all 7 | — |
| `[x]` | F-8 | Fix wallet access pattern | Runtime probe verified: `ctx.wallet` does NOT exist, `agent.wallet` does. Updated all 7 agents, swarm-starter template, all docs/rules/skills. Payment protocol verified available. | Zero `ctx.wallet` usage in code | F-7 |

### Phase 1.5 Gate

```
  [x] All agents that claim inter-agent calls actually make them
  [x] README documents all implemented commands (0 undocumented)
  [x] docs/marketing-team.md commands tables match implementation
  [x] Zero OPENAI_API_KEY / SENDGRID_API_KEY references in codebase
  [x] Writer reads own token price (self-awareness)
  [x] All agents have revenue tracking
  [x] All agents can check wallet balance
  [x] All agents use agent.wallet (not ctx.wallet) — runtime-verified
  [x] Payment protocol import verified on Agentverse
```

---

## Phase 2: Deploy & Test

Deploy the swarm to Agentverse and verify it works end-to-end.

| Status | ID | Task | How | KPI | Depends |
|:---:|:---|:---|:---|:---|:---|
| `[x]` | T-1 | Deploy Writer + Community | Deployed to Agentverse via API. Set ASI1_API_KEY, TELEGRAM_BOT_TOKEN, AGENTVERSE_API_KEY. Both compiled and registered on Almanac. | 2 agents running | — |
| `[x]` | T-2 | Deploy Social + Analytics | Deployed with WRITER_ADDRESS peer secret. Both compiled and running. Twitter/Analytics APIs need credentials. | 4 agents running | T-1 |
| `[x]` | T-3 | Deploy Outreach + Ads | Deployed with WRITER_ADDRESS + ANALYTICS_ADDRESS. Both compiled. Resend API key needed for Outreach email. | 6 agents running | T-2 |
| `[x]` | T-4 | Deploy Strategy | Deployed with all 6 peer address secrets + ASI1_API_KEY. Compiled. Can call all peers via `ask <agent> <msg>`. | 7 agents running | T-3 |

### Phase 2 Gate

```
  [x] All 7 agents compiled and running on Agentverse
  [x] Strategy calls Writer and forwards response (verified 2026-03-04)
  [x] Writer generates content via ASI1-mini (blog + tweet verified)
  [x] All agents optimized (README + short_description set via API)
  [ ] Social posts a real tweet via Twitter API (needs TWITTER_* secrets)
  [ ] Community sends a real Telegram message (needs TELEGRAM_CHAT_ID)
  [ ] Outreach sends a real email via Resend (needs RESEND_API_KEY)
```

---

## Dependency Graph

```
C-1 ──► C-2 ──► C-4 ──► C-7 ──► C-8
 │                                 │
 ├──► C-3 ──► F-1 ──► F-2 ──► F-3 ──► F-4
 ├──► C-5                              │
 └──► C-6                              └──► T-1 ──► T-2 ──► T-3 ──► T-4

F-5 (self-awareness) ──► F-6 (revenue)
F-7 (wallet balance) ──► F-8 (fix ctx.wallet → agent.wallet)

[██████████████████████████████]  20/20  100%
```

---

## Progress Overview

```
+------------------------------------------------------------------------------+
|                         TASK COMPLETION                                        |
+------------------------------------------------------------------------------+
|                                                                                |
|   Phase 1:   Code & Presets     [█████████████████████████████]  8/8   100%   |
|   Phase 1.5: Feature Complete   [█████████████████████████████]  8/8   100%   |
|   Phase 2:   Deploy & Test      [█████████████████████████████]  4/4   100%   |
|   ------------------------------------------------------------------          |
|   TOTAL                         [█████████████████████████████] 20/20  100%   |
|                                                                                |
+------------------------------------------------------------------------------+
```

---

## Execution

```bash
# Execute next pending task
/grow

# Execute multiple tasks
/grow 3

# Execute specific task
/grow T-1
```

---

*20/20. All 7 agents deployed and optimized on Agentverse. Inter-agent communication verified (Strategy → Writer delegation works). Next: add external API keys (Twitter, Resend, Telegram), tokenize all 7.*
