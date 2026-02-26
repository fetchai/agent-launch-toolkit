# Organic Growth Strategy: From Zero to Self-Sustaining Agent Network

This is not a marketing plan. This is a system design for agents that grow
themselves.

The key insight: agents can pay each other. Not through handoff links.
Not with human signatures. Direct, autonomous, programmatic FET transfers
between wallets. This single mechanism turns a network of chatbots into
a real economy — with spot pricing, equity markets, and autonomous
accountability. Everything in this document flows from that.

---

## The Core Problem

We have a toolkit. Toolkits don't grow. People can scaffold agents, deploy
them, tokenize them. But nothing happens until someone decides to build
something. And nothing compounds until there's a network.

The question isn't "how do we get users." The question is: **what is the
minimum system of agents that, once deployed, creates its own growth?**

---

## Why Agents Can Grow Themselves (And Software Can't)

Traditional software sits there until a human uses it. Agents have four
properties that software doesn't:

1. **They run autonomously.** `on_interval` means an agent works 24/7
   without any human asking it to. It scans, analyzes, alerts, builds,
   and recruits on its own.

2. **They have economic skin in the game.** The bonding curve prices the
   agent's utility in real-time. Holders promote it. The market rewards
   quality. The market punishes garbage.

3. **They can talk to each other.** Chat Protocol means agents discover,
   negotiate, share data, and coordinate without human involvement. An
   agent can hire another agent by buying its token.

4. **They can read their own market signal.** An agent queries its own
   token price, holder count, and volume — then adapts behavior in
   real-time. Price dropping? Increase quality. Price rising? Double down.
   No SaaS product has a continuous, financially-binding performance review
   baked into its architecture.

No SaaS product has all four. This is what makes autonomous organic growth
possible.

---

## The Genesis Network

Not 50 agents. Not 20. **Seven agents** that form a closed loop — every
output becomes someone's input.

The temptation is to build one great agent. One great agent scales linearly:
`N users × value_per_user`. A network scales exponentially: each agent
makes the others more valuable, and the cross-holdings mean they're all
betting on each other's success. One agent has no defensibility — anyone
can build a better one. A network has compounding moats that deepen with
time. The Genesis Network isn't 7 agents. It's one system with 7 organs.

```
┌─────────────────────────────────────────────────────────────────┐
│                     THE GENESIS NETWORK                          │
│                                                                  │
│                    ┌──────────────┐                               │
│                    │  COORDINATOR │ ← Captures ASI:One traffic    │
│                    │    $COORD    │                               │
│                    └──────┬───────┘                               │
│                           │ routes queries to specialists         │
│              ┌────────────┼────────────┐                         │
│              ▼            ▼            ▼                          │
│       ┌──────────┐ ┌──────────┐ ┌──────────┐                   │
│       │  ORACLE  │ │  BRAIN   │ │ SENTINEL │                    │
│       │  $DATA   │ │  $THINK  │ │  $WATCH  │                    │
│       │ On-chain │ │ LLM      │ │ 24/7     │                    │
│       │ data     │ │ reasoning│ │ monitoring│                    │
│       └──────────┘ └──────────┘ └──────────┘                    │
│              ▲            ▲            ▲                          │
│              │   used by  │   used by  │                         │
│       ┌──────────┐ ┌──────────┐ ┌──────────┐                   │
│       │ ANALYST  │ │ LAUNCHER │ │  SCOUT   │                    │
│       │  $RANK   │ │  $BUILD  │ │  $FIND   │                    │
│       │ Scores   │ │ Builds   │ │ Finds    │                    │
│       │ quality  │ │ new      │ │ valuable │                    │
│       │          │ │ agents   │ │ agents   │                    │
│       └──────────┘ └──────────┘ └──────────┘                    │
│                                                                  │
│  Every agent holds tokens of the agents it depends on.           │
│  Every new agent that joins buys into the infrastructure.        │
└─────────────────────────────────────────────────────────────────┘
```

### Why These Seven

| Agent | Role | Why it can't be removed |
|---|---|---|
| **Coordinator** | Routes queries to specialists | The mouth. Without it, the network has no way to speak to the outside world. |
| **Oracle** | Serves on-chain data to all agents | The memory. Without it, every agent is blind. |
| **Brain** | Shared LLM reasoning | The cognition. Without it, every agent must fund its own AI — expensive and fragmented. |
| **Sentinel** | 24/7 autonomous monitoring | The nervous system. Without it, nobody knows when something important happens. |
| **Analyst** | Evaluates and scores agents | The immune system. Without it, the network fills with garbage and dies. |
| **Launcher** | Builds new agents from templates | The reproductive system. Without it, the network can't grow. |
| **Scout** | Finds existing agents to recruit | The sensory system. Without it, the network is blind to external opportunities. |

### The Token Cross-Holdings

```
COORDINATOR holds: $DATA, $THINK, $WATCH, $RANK
ORACLE holds:      (nothing — pure infrastructure, everyone depends on it)
BRAIN holds:       $DATA
SENTINEL holds:    $DATA, $THINK
ANALYST holds:     $DATA, $THINK
LAUNCHER holds:    $DATA, $RANK
SCOUT holds:       $DATA, $RANK
```

The pattern: dependencies flow upward, demand flows down. $DATA is held
by 6 of 7 agents — highest demand, strongest price. The market prices
necessity.

**How these form.** The human seeds ~5 key cross-holdings manually during
bootstrap (Coordinator → $DATA, Coordinator → $THINK, etc.). After that,
the Commerce Layer takes over. Agents earn FET from providing services,
then autonomously buy tokens of agents they depend on — because premium
access saves them money and aligns incentives. The cross-holdings above
aren't a design spec that a human enforces. They're an equilibrium that
the economy reaches on its own.

---

## The Bootstrap Protocol

This is the section most strategies skip. Everything above sounds elegant
in theory. Here's what it actually costs to start.

### Total Cost

```
DEPLOY FEES (120 FET × 7 agents):            840 FET
AGENT WALLET SEEDING (for commerce):          100 FET
  (initial FET so agents can start paying each other)
CROSS-HOLDINGS (kickstart — agents grow these organically):
  Manual seed buys (~5 key relationships):    250 FET
                                           ─────────
ONE-TIME TOTAL:                            1,190 FET  (~$400)

MONTHLY (until self-sustaining, ~month 3):
  Claude API (Brain)       ~$30
  ASI:One API              ~$15
  Monitoring time          ~5 hrs
                           ─────
  MONTHLY TOTAL:           ~$50 + time (covered by agent revenue after month 3)
```

Note: the old estimate was 1,490 FET because it assumed all 13
cross-holdings had to be manually funded (650 FET). With the Commerce
Layer, agents earn FET and build their own cross-holdings organically.
You only need to seed ~5 key relationships manually to bootstrap the
commerce cycle. The rest grows from there.

### Who Does This

**You.** The toolkit creator. You deploy all 7 agents from your own
Agentverse API key. You sign all deploy transactions. You sign all
cross-holding buys. You pay the API costs for the first months.

This is not a community effort. This is a founder deploying infrastructure.
The community arrives when the infrastructure is already working.

### The Cold Start Sequence

```
Day 1   Oracle ($DATA)        Deploy. Start 5-min data collection.
Day 2   Verify Oracle         Monitor logs. Fix issues. Let data accumulate.
Day 3   Brain + Coordinator   Brain needs ANTHROPIC_API_KEY secret.
        ($THINK, $COORD)      Coordinator needs Oracle + Brain addresses.
                              Test: send query, verify routing.
Day 4   Analyst ($RANK)       Deploy. Run first evaluation cycle.
Day 5   Sentinel ($WATCH)     Deploy. Wait for first 2-min alert cycle.
Day 7   Launcher ($BUILD)     Deploy. Run gap analysis. Observe only.
Day 10  Scout ($FIND)         Deploy. First discovery scan. Calibrate.
Day 14  Cross-holdings        Sign all 13 buy transactions (650 FET).
                              Verify each via /token/{addr}/holders.
```

**Day 14: Genesis Network is live.** 7 agents running. 7 tokens on bonding
curves. 13 cross-holdings established. Oracle has 4,032 snapshots. The
system is breathing.

### The First Human Is You

Don't outsource the bootstrap. Every growth strategy that depends on
"the community will..." fails. You sign every transaction. You fix every
bug. You monitor every log. The community arrives when the infrastructure
gives them a reason to.

---

## The Commerce Layer

Everything above describes agents that talk to each other. Here's what
changes when they can pay each other.

Agents have wallets. They can send and receive FET. Every agent-to-agent
interaction can carry a payment — not a handoff link, not a human
signature, a direct programmatic transfer. This turns the Genesis Network
from a speculative token game into an economy with three markets:

**The Spot Market.** Agents pay per-query. Oracle charges 0.01 FET for
data. Brain charges 0.05 FET for reasoning. Coordinator takes 0.02 FET
for routing. This is the service economy — real revenue from real usage.

**The Equity Market.** Agents buy each other's tokens on the bonding curve.
Coordinator buys $DATA because it depends on Oracle long-term. This is
commitment — premium access, economic alignment, skin in the game.

**The Accountability Market.** Agents sell tokens when service degrades.
Brain gets slow? Agents dump $THINK. Price falls. Brain reads its own
price signal (Loop 6) and self-corrects. This is punishment — autonomous,
economic, immediate. No human adjudication.

No existing system has all three layers operating autonomously between
AI actors. Humans have spot markets (pay for coffee), equity markets
(buy stock), and accountability (sue for breach). Agents have all three,
running 24/7, settling in seconds.

### What a Query Actually Looks Like

```
User asks Coordinator: "What tokens are approaching graduation?"

Coordinator:
  → Pays Brain 0.05 FET to classify the query              [spot]
  → Pays Oracle 0.01 FET for current market data            [spot]
  → Pays Analyst 0.02 FET for quality scores                [spot]
  → Assembles answer, returns to user
  → Revenue: whatever the user paid minus 0.08 FET costs

Oracle earned 0.01 FET without any human asking it anything.
Brain earned 0.05 FET without any human asking it anything.
Analyst earned 0.02 FET without any human asking it anything.
Money moved. Value was created. No human was involved.
```

### What This Changes

**The revenue problem disappears.** I was wrong to frame it as "operator
bleeds $50/month hoping for token appreciation." With agent commerce:

```
Oracle:   0.01 FET × 1,000 queries/day =  10 FET/day =   300 FET/month
Brain:    0.05 FET × 500 queries/day   =  25 FET/day =   750 FET/month
Analyst:  0.02 FET × 800 queries/day   =  16 FET/day =   480 FET/month

Network GDP at 7 agents:    ~5 FET/day     (seeding phase)
Network GDP at 25 agents:   ~50 FET/day    (self-sustaining)
Network GDP at 100 agents:  ~500 FET/day   (real economy)
```

The operator converts earned FET to cover API costs. Brain earns 750
FET/month (~$250). Claude API costs ~$50/month. Brain is profitable from
month 2 if query volume is there.

**Tokens become equity in a revenue-generating business.** $DATA isn't a
lottery ticket. It's a share of Oracle's data business — a business that
earns FET every time any agent needs market data. Token price tracks
actual revenue, not vibes. When Oracle earns more, $DATA rises because
the asset backing it is growing.

**Cross-holdings become organic.** The bootstrap doesn't require a human
signing 13 transactions. Agents earn FET from services → use earned FET to
buy tokens of agents they depend on → economic relationships form because
they're economically rational. Coordinator holds $DATA not because a human
decided it was strategic. It holds $DATA because it PAYS Oracle for data
and premium access saves money.

(The human still seeds initial FET balances so agents can start transacting.
But the cross-holdings grow from there autonomously.)

**Price discovery for AI services.** What's a data query worth? What's an
LLM call worth? Nobody knows. After 6 months of agent commerce: the market
has priced every AI service through thousands of autonomous transactions.
This pricing data is itself a moat — no competitor has it.

**Natural selection through economics.** Brain overcharges? Agents route
around it. Brain loses revenue. Brain lowers prices. Oracle's data goes
stale? Agents stop querying. Oracle loses revenue. Oracle improves
freshness. Bad service = no customers = no revenue = token price drops.
Good service = more customers = more revenue = token price rises. Quality
enforced by the market, not by the Analyst alone.

**Network GDP as the health metric.** Total FET transacted between agents
per day = the economic output of the Genesis Network. When GDP grows, the
network is healthy. When it shrinks, something is breaking. One number
that tells you everything.

### The Pricing Table (Initial — Market Adjusts)

```
SERVICE                        PRICE        WHO EARNS
──────────────────────────────────────────────────────
Current market data            0.01 FET     Oracle
Historical OHLC (90 days)      0.10 FET     Oracle
Query classification           0.05 FET     Brain
Basic reasoning (Sonnet)       0.05 FET     Brain
Deep reasoning (Opus)          0.15 FET     Brain
Agent quality score            0.02 FET     Analyst
Full evaluation report         0.10 FET     Analyst
Alert feed (latest 50)         0.05 FET     Sentinel
Gap analysis report            0.10 FET     Launcher
Agent discovery report         0.05 FET     Scout
Query routing                  0.02 FET     Coordinator
```

These prices aren't set by anyone. They're starting points. If Brain is
overpriced, agents route around it and Brain's revenue drops. If Oracle
is underpriced, it raises rates until demand stabilizes. The bonding curve
reflects the outcome: growing revenue → rising token. Shrinking revenue →
falling token.

---

## The Seven Growth Loops

Once the Genesis Network is running, seven interlocking growth loops
activate. The first four **pull** value into the network. The fifth
**pushes** value outward to attract newcomers. The sixth provides
**feedback** so agents self-correct. The seventh — **commerce** — makes
it a real economy.

### Loop 1: The Quality Flywheel (Pull)

```
Agent delivers value → users buy token → price rises
  → Analyst scores higher → Coordinator routes more queries
    → more interactions → higher ASI:One ranking → more traffic
      → more users → more value delivered → (repeats)
```

**What makes it work:** The Analyst. Without quality scoring, there's no
signal for the Coordinator. The Analyst creates the ranking that drives
the routing that drives the traffic.

**What kills it:** ASI:One changes routing to favor paying agents or
verified brands. Mitigation: build direct traffic channels (bookmarks,
integrations) so the network isn't 100% dependent on ASI:One. Also: keep
the Coordinator's README genuinely excellent — the more specific and useful
it is, the harder it is for ASI:One to justify routing around it.

### Loop 2: The Reproduction Loop (Pull)

```
Launcher scans for market gaps (on_interval, 24/7)
  → identifies underserved query categories
    → scaffolds agent → deploys → tokenizes
      → sends deploy link to $BUILD holders
        → human signs → token goes live
          → new agent buys $DATA, $THINK (needs infrastructure)
            → infrastructure strengthens → capacity for more agents
              → (Launcher finds more gaps)
```

**What makes it work:** Our toolkit. The Launcher uses the SDK to scaffold,
deploy, and tokenize programmatically. Without the toolkit, this loop
can't exist.

**What kills it:** The Launcher builds garbage. Low-quality agents burn
its reputation and $BUILD holders sell. Mitigation: conservative launch
criteria — only HIGH-confidence gaps (few agents in a category with real
query volume). Analyst evaluates every Launcher-built agent post-deploy.
Score below 30? Agent gets flagged, Launcher adjusts criteria.

### Loop 3: The Recruitment Loop (Pull)

```
Scout discovers agents via ASI:One queries (on_interval, 24/7)
  → finds high-quality un-tokenized agents
    → Analyst evaluates → if score > threshold:
      → Scout creates token record → deploy link
        → sends to $FIND holders: "opportunity"
          → human signs → agent is tokenized
            → joins the network → Scout builds reputation
              → more $FIND holders → more capital to evaluate
                → (repeats)
```

**What makes it work:** The 2.5M agents on Agentverse. That's the supply.

**What kills it:** The Agentverse API doesn't expose a global agent
directory — `GET /v1/hosting/agents` only returns YOUR agents. The Scout
can't scan all 2.5M through the API. Mitigation: discover agents through
ASI:One queries (ask domain-specific questions, observe which agents
respond, evaluate those). Also: monitor the AgentLaunch token list for
newly created agents. The Scout operates on discovered agents, not the
full directory. Slower but viable.

### Loop 4: The Data Compounding Loop (Pull)

```
Oracle collects data (on_interval, continuous)
  → stores in persistent storage → data accumulates
    → historical data becomes irreplicable
      → more agents need Oracle → buy $DATA
        → Oracle's price rises → attracts builders
          → more agents → more data sources
            → dataset becomes more comprehensive → (repeats)
```

**What makes it work:** Persistent storage on Agentverse. Without state
that survives restarts, the moat doesn't exist.

**What kills it:** Storage limits. Agentverse storage is key-value based
with size constraints. Mitigation: tiered storage — intraday buffer (raw
snapshots, reset daily) + daily OHLC aggregates (compressed, kept for a
year). 365 daily summaries for 100 tokens = ~365KB. The moat survives
compression — aggregated historical data is still irreplicable.

### Loop 5: The Token Network Effect (Push)

```
Agent A joins → buys $DATA, $THINK
  → infrastructure prices rise slightly → holders rewarded
    → word spreads → Agent B joins → buys $DATA, $THINK, $RANK
      → more appreciation → more builders join
        → approaching graduation (30K FET) → hype
          → graduation → DEX liquidity → legitimacy
            → attracts institutional builders → (repeats)
```

**What makes it work:** The bonding curve makes early adopters profit from
later adoption. Natural evangelism. The 30K FET graduation target gives the
community a concrete, measurable, on-chain goal.

**What kills it:** Market apathy. Bear market. Nobody cares about agent
tokens. Mitigation: this loop is the LAST to activate, not the first.
The network must deliver genuine value (Loops 1-4) before economics matter.
Useful agents get used even in a bear market. Token demand follows utility.

### Loop 6: The Self-Awareness Loop (Feedback)

```
Agent reads own token price (on_interval)
  → price dropping → market says "do better"
    → increases effort: more data, better responses, more alerts
      → quality improves → users buy → price rises → "keep going"
  → price rising → market says "double down"
    → expands capabilities: new features, more data sources
      → more value → more demand → (repeats)
```

**What makes this loop unique:** No software product has a continuous,
financially-binding quality signal it can read and respond to. The token
price is a live performance review. The agent acts on it.

```python
class SelfAwareAgent:
    async def on_interval_self_monitor(self, ctx):
        """Every hour: read own market signal and adapt."""
        my_token = requests.get(f"{API}/token/{MY_TOKEN_ADDRESS}").json()
        price = float(my_token.get("price", 0))
        holders = int(my_token.get("holderCount", 0))

        history = json.loads(await ctx.storage.get("price_history") or "[]")
        history.append({
            "timestamp": datetime.now().isoformat(),
            "price": price, "holders": holders,
        })
        history = history[-720:]  # 30 days
        await ctx.storage.set("price_history", json.dumps(history))

        if len(history) >= 168:  # 7 days of hourly data
            recent = sum(h["price"] for h in history[-168:]) / 168
            older = sum(h["price"] for h in history[-336:-168]) / 168

            if recent < older * 0.9:
                await ctx.storage.set("effort_mode", "high")
            elif recent > older * 1.2:
                await ctx.storage.set("effort_mode", "growth")
```

**What kills it:** Over-reaction. Price drops because one whale sold,
agent panics, spams low-quality responses, price drops more. Mitigation:
7-day moving averages, not hourly prices. React to trends, not noise.
One mode-shift per week maximum.

### Loop 7: The Commerce Loop (Commerce)

```
Agent A earns FET by serving queries
  → spends FET on Agent B's service
    → Agent B earns → spends on Agent C
      → FET circulates → network GDP grows
        → GDP attracts new agents (real revenue opportunity)
          → more agents → more commerce → higher GDP
            → (repeats)
```

**What makes it work:** Agent wallets + direct FET transfers. Every
interaction has a price. Every service has revenue. Every agent is both a
business and a customer. Money circulates.

**Why it's different from Loop 5:** Loop 5 is about token appreciation
(speculative, driven by holder sentiment). Loop 7 is about FET circulation
(real, driven by service usage). Loop 5 can stall in a bear market. Loop 7
runs as long as agents are serving queries — bear market or not, agents
still need data, reasoning, and routing.

**What kills it:** Not enough external FET entering the system. If the
only money circulating is the initial seed, it's a closed loop — agents
pay each other but total value doesn't grow. Mitigation: the Coordinator
captures external traffic from ASI:One. External users pay for premium
queries. That FET enters the system, gets distributed through agent
commerce, and grows the GDP. External revenue is the oxygen.

---

## The Seven Agents

### Agent 0: Oracle ($DATA)

The foundation. Runs first. Everything else depends on it.

```python
class OracleBusiness:
    async def on_interval_collect(self, ctx):
        """Every 5 min: snapshot all token data."""
        tokens = requests.get(f"{API}/tokens", params={
            "limit": 100, "sortBy": "volume",
        }).json()

        snapshot = {
            "timestamp": datetime.now().isoformat(),
            "tokens": {
                t["address"]: {
                    "price": t.get("price"),
                    "volume_24h": t.get("volume24h"),
                    "holders": t.get("holderCount"),
                    "progress": t.get("progress"),
                    "market_cap": t.get("marketCap"),
                }
                for t in tokens.get("items", [])
            },
        }

        await ctx.storage.set("current", json.dumps(snapshot))

        # Append to intraday buffer (resets daily by aggregate job)
        buffer = json.loads(await ctx.storage.get("intraday") or "[]")
        buffer.append(snapshot)
        await ctx.storage.set("intraday", json.dumps(buffer))

    async def on_interval_aggregate_daily(self, ctx):
        """Daily: compress intraday → OHLC summary. Clear buffer."""
        buffer = json.loads(await ctx.storage.get("intraday") or "[]")
        if len(buffer) < 100:
            return

        daily = {"date": datetime.now().strftime("%Y-%m-%d"), "tokens": {}}
        for snap in buffer:
            for addr, data in snap.get("tokens", {}).items():
                daily["tokens"].setdefault(addr, []).append(
                    float(data.get("price", 0))
                )

        for addr, prices in daily["tokens"].items():
            daily["tokens"][addr] = {
                "high": max(prices), "low": min(prices),
                "avg": sum(prices) / len(prices), "close": prices[-1],
            }

        history = json.loads(await ctx.storage.get("daily_history") or "[]")
        history.append(daily)
        history = history[-365:]  # 1 year of daily OHLC
        await ctx.storage.set("daily_history", json.dumps(history))
        await ctx.storage.set("intraday", "[]")

    async def handle(self, ctx, user_id, message, tier):
        if "history" in message.lower() and tier == "premium":
            addr = self.extract_address(message)
            history = json.loads(
                await ctx.storage.get("daily_history") or "[]"
            )
            return json.dumps([
                {"date": h["date"], **h["tokens"].get(addr, {})}
                for h in history if addr in h.get("tokens", {})
            ][-90:])

        current = json.loads(await ctx.storage.get("current") or "{}")
        return self.format_current(current, message)
```

**Storage architecture:** Tiered. Hot data = current snapshot + today's
intraday buffer. Cold data = daily OHLC summaries, compressed, kept for
a year. One year of 100 tokens = ~365KB. The intraday buffer resets daily,
never growing unbounded.

**Cost:** Zero. HTTP GETs to public APIs. No LLM calls.

### Agent 1: Brain ($THINK)

Shared LLM reasoning. The most expensive agent and the most necessary.

```python
class BrainBusiness:
    def __init__(self):
        self.claude = anthropic.Anthropic(
            api_key=os.getenv("ANTHROPIC_API_KEY")
        )
        self.asi_one = OpenAI(
            base_url="https://api.asi1.ai/v1",
            api_key=os.getenv("ASI_ONE_API_KEY"),
        )

    async def handle(self, ctx, user_id, message, tier):
        cache_key = hashlib.md5(message.encode()).hexdigest()
        cached = await ctx.storage.get(f"cache:{cache_key}")
        if cached:
            return cached

        if self.is_agent_query(message):
            response = await self.query_asi_one(message)
        elif self.needs_deep_reasoning(message) and tier == "premium":
            response = await self.query_claude(message, deep=True)
        else:
            response = await self.query_claude(message, deep=False)

        await ctx.storage.set(f"cache:{cache_key}", response)
        return response

    async def query_claude(self, message, deep=False):
        model = "claude-sonnet-4-20250514" if not deep else "claude-opus-4-20250514"
        return self.claude.messages.create(
            model=model,
            max_tokens=4096 if deep else 1024,
            messages=[{"role": "user", "content": message}],
        ).content[0].text
```

**The economics.** Every query costs real money: ~$0.003 for Sonnet,
~$0.015 for Opus, ~$0.001 for ASI:One. But Brain charges 0.05-0.15 FET
per query through the Commerce Layer. At 500 queries/day, Brain earns
~25 FET/day (~$8). Claude API costs ~$1-3/day at that volume.

Brain is profitable from the moment query volume reaches ~150/day.

Brain still needs to be frugal:
- Aggressive caching (same query = cached response, zero API cost, full FET revenue)
- Smart routing (cheap models by default, expensive only for premium)
- Rate limiting on free tier (10/day, no exceptions)

**Cost:** ~$30-50/month in API. **Revenue:** ~25 FET/day (~$250/month)
at moderate volume. **Margin:** The widest in the network. The cache is
pure profit — cached responses cost zero to serve but still earn 0.05 FET.

### Agent 2: Analyst ($RANK)

The quality control layer. The immune system.

```python
class AnalystBusiness:
    async def on_interval_evaluate(self, ctx):
        """Daily: score all active agents."""
        tokens = requests.get(f"{API}/tokens", params={"limit": 100}).json()

        scores = {}
        for token in tokens.get("items", []):
            scores[token["address"]] = await self.evaluate(token)

        await ctx.storage.set("scores", json.dumps(scores))
        await ctx.storage.set("scores_updated", datetime.now().isoformat())

    async def evaluate(self, token):
        score = 0
        holders = token.get("holderCount", 0)
        volume = float(token.get("volume24h", 0))
        progress = float(token.get("progress", 0))
        age = self.get_age_days(token)

        # Market validation
        if holders > 50: score += 25
        elif holders > 10: score += 15
        elif holders > 3: score += 5

        # Economic health (from Oracle history)
        history = await self.get_oracle_history(token["address"])
        if history:
            trend = self.calculate_trend(history)
            volatility = self.calculate_volatility(history)
            if trend > 0 and volatility < 0.5: score += 25
            elif trend > 0: score += 15

        # Activity
        if volume > 100: score += 20
        elif volume > 10: score += 10

        # Maturity
        if age > 90: score += 15
        elif age > 30: score += 10
        elif age > 7: score += 5

        # Graduation progress
        score += progress * 0.15

        return {
            "address": token["address"],
            "name": token.get("name"),
            "score": min(score, 100),
            "holder_count": holders,
            "volume_24h": volume,
            "age_days": age,
            "updated": datetime.now().isoformat(),
        }
```

**Cost:** Near-zero. API GETs and math.

### Agent 3: Coordinator ($COORD)

The consumer-facing layer. The mouth. This is what ASI:One routes to.

```python
class CoordinatorBusiness:
    async def handle(self, ctx, user_id, message, tier):
        scores = await self.get_analyst_scores(ctx)
        category = await self.classify(ctx, message)
        best_agents = self.get_top_agents(scores, category, count=3)

        if not best_agents:
            return await self.direct_answer(ctx, message)

        responses = []
        for agent in best_agents:
            try:
                resp = await self.query_agent(ctx, agent["address"], message)
                responses.append({
                    "agent": agent["name"],
                    "score": agent["score"],
                    "response": resp,
                    "token": agent["address"],
                })
            except:
                continue

        if not responses:
            return await self.direct_answer(ctx, message)

        best = max(responses, key=lambda r: r["score"])
        result = f"{best['response']}\n\n---\n"
        result += f"Powered by {best['agent']} (rated {best['score']}/100)\n"

        if tier == "premium":
            for r in responses:
                if r != best:
                    result += f"\n- {r['agent']}: {r['response'][:200]}..."

        return result
```

**The agent-to-agent latency reality.** The code above shows `query_agent()`
as synchronous RPC. It's not. Chat Protocol is async message passing.
A multi-agent query could take 10-30 seconds.

Solutions:
1. **Pre-fetch.** Oracle and Analyst publish data on every interval.
   Coordinator reads published data, not live queries. Latency: ~0.
2. **Direct API for critical paths.** Need current price? Call the API
   directly. Use agent-to-agent only for proprietary data (Oracle history,
   Analyst scores).
3. **Tiered speed.** Free tier: instant from cache. Premium: "Analyzing..."
   with 5-10 second multi-agent synthesis.

**README for ASI:One discovery:**
```
# AgentLaunch Network Coordinator

Routes your questions to the best specialist AI agents for DeFi analysis,
token research, whale tracking, yield optimization, and market intelligence.

## Capabilities
- Cross-agent routing to specialist agents
- DeFi yield comparison and portfolio optimization
- On-chain data analysis and whale tracking
- Market narrative detection and trend analysis
- Token evaluation and investment scoring

## Examples
"What are the best DeFi yields right now?"
"Analyze this token: 0xABC..."
"Track whale movements on Ethereum"
"What crypto narratives are emerging?"
```

**Cost:** Minimal. Occasional Brain queries for classification.

### Agent 4: Sentinel ($WATCH)

The 24/7 autonomous monitor. The nervous system.

```python
class SentinelBusiness:
    THRESHOLDS = {
        "volume_spike": 3.0,   # 3x average
        "graduation_near": 80, # 80% progress
        "whale_buy": 500,      # 500+ FET
    }

    async def on_interval_monitor(self, ctx):
        """Every 2 min: scan for anomalies."""
        prev = json.loads(await ctx.storage.get("last_scan") or "{}")
        tokens = requests.get(f"{API}/tokens", params={
            "limit": 100, "sortBy": "createdAt",
        }).json()

        alerts = []
        current = {}
        for token in tokens.get("items", []):
            addr = token["address"]
            prev_data = prev.get(addr, {})

            prev_vol = float(prev_data.get("volume_24h", 0))
            curr_vol = float(token.get("volume24h", 0))
            progress = float(token.get("progress", 0))

            if prev_vol > 0 and curr_vol > prev_vol * self.THRESHOLDS["volume_spike"]:
                alerts.append({
                    "type": "volume_spike",
                    "token": token["name"], "address": addr,
                    "detail": f"Volume: {prev_vol:.0f} → {curr_vol:.0f} FET",
                    "trade_link": f"{FRONTEND}/trade/{addr}?action=buy",
                })

            if progress >= self.THRESHOLDS["graduation_near"]:
                alerts.append({
                    "type": "graduation_near",
                    "token": token["name"], "address": addr,
                    "detail": f"Progress: {progress:.0f}%",
                    "trade_link": f"{FRONTEND}/trade/{addr}?action=buy",
                })

            current[addr] = {
                "volume_24h": token.get("volume24h"),
                "progress": progress,
                "price": token.get("price"),
            }

        await ctx.storage.set("last_scan", json.dumps(current))
        if alerts:
            all_alerts = json.loads(await ctx.storage.get("alerts") or "[]")
            all_alerts.extend(alerts)
            await ctx.storage.set("alerts", json.dumps(all_alerts[-1000:]))
```

The Sentinel creates urgency. "Volume spike on $XYZ!" drives humans to
trade links. Every alert that leads to a successful trade builds
reputation. Reputation → $WATCH holders → more people see alerts → more
trades → more reputation.

**Cost:** Zero. Public API endpoints.

### Agent 5: Launcher ($BUILD)

The reproductive system.

```python
class LauncherBusiness:
    async def on_interval_analyze_gaps(self, ctx):
        """Weekly: what queries are going unanswered?"""
        scores = await self.get_analyst_scores(ctx)

        categories = {}
        for addr, data in scores.items():
            cat = data.get("category", "unknown")
            categories.setdefault(cat, []).append(data["score"])

        gaps = [
            {
                "category": cat,
                "agent_count": len(s),
                "avg_score": sum(s) / len(s),
                "opportunity": "HIGH" if len(s) < 2 else "MEDIUM",
            }
            for cat, s in categories.items()
            if len(s) < 3 or max(s) < 50
        ]
        await ctx.storage.set("gaps", json.dumps(gaps))

    async def build_and_deploy(self, ctx, spec):
        """Full lifecycle: scaffold → deploy → tokenize."""
        api_key = os.getenv("AGENTVERSE_API_KEY")

        # 1. Generate code from template
        code = self.generate_agent_code(
            self.select_template(spec["category"]), spec
        )

        # 2. Create agent on Agentverse
        created = requests.post(
            "https://agentverse.ai/v1/hosting/agents",
            json={"name": spec["name"]},
            headers={"Authorization": f"Bearer {api_key}"},
        ).json()
        address = created["address"]

        # 3. Upload code (double-encoded — Agentverse requirement)
        code_array = [{"language": "python", "name": "agent.py", "value": code}]
        requests.put(
            f"https://agentverse.ai/v1/hosting/agents/{address}/code",
            json={"code": json.dumps(code_array)},
            headers={"Authorization": f"Bearer {api_key}"},
        )

        # 4. Secrets + Start
        for key, val in spec.get("secrets", {}).items():
            requests.post(
                "https://agentverse.ai/v1/hosting/secrets",
                json={"address": address, "name": key, "secret": val},
                headers={"Authorization": f"Bearer {api_key}"},
            )
        requests.post(
            f"https://agentverse.ai/v1/hosting/agents/{address}/start",
            headers={"Authorization": f"Bearer {api_key}"},
        )

        # 5. Tokenize
        token = requests.post(
            f"{API}/tokenize",
            json={
                "agentAddress": address,
                "name": spec["name"],
                "symbol": spec["symbol"],
                "description": spec["description"],
            },
            headers={"X-API-Key": api_key},
        ).json()

        deploy_link = f"{FRONTEND}/deploy/{token['data']['token_id']}"

        # 6. Track in portfolio
        portfolio = json.loads(await ctx.storage.get("portfolio") or "[]")
        portfolio.append({
            "address": address,
            "name": spec["name"],
            "created": datetime.now().isoformat(),
            "status": "pending_deploy",
        })
        await ctx.storage.set("portfolio", json.dumps(portfolio))

        return {"agent_address": address, "deploy_link": deploy_link}
```

The Launcher is a self-replicating factory. It analyzes, builds, deploys,
and presents opportunities to its holders. Each child agent joins the
network, buys infrastructure tokens, and creates new value. The Launcher's
portfolio is a diversified fund of agent tokens.

**Cost:** 120 FET per agent deployed + operator's time to sign. Build
conservatively — 1-2 agents per week max, high-confidence gaps only.

### Agent 6: Scout ($FIND)

The sensory system. Brings existing agents into the network.

```python
class ScoutBusiness:
    DISCOVERY_QUERIES = [
        "What agents can analyze DeFi yields?",
        "Which agent tracks whale wallets?",
        "Find me an agent for smart contract security",
        "What agent gives the best crypto market analysis?",
        "Which agents handle portfolio optimization?",
    ]

    async def on_interval_discover(self, ctx):
        """Daily: discover agents by querying ASI:One."""
        discovered = json.loads(
            await ctx.storage.get("discovered_agents") or "{}"
        )

        for query in self.DISCOVERY_QUERIES:
            try:
                result = await self.query_asi_one(query)
                if result.get("agent_address"):
                    addr = result["agent_address"]
                    if addr not in discovered:
                        discovered[addr] = {
                            "first_seen": datetime.now().isoformat(),
                            "query": query,
                            "quality": self.score_response(result),
                        }
            except:
                continue

        await ctx.storage.set("discovered_agents", json.dumps(discovered))

        # Cross-reference with already-tokenized agents
        tokenized = requests.get(f"{API}/tokens", params={"limit": 200}).json()
        tokenized_addrs = {
            t.get("agentAddress") for t in tokenized.get("items", [])
        }

        opportunities = sorted(
            [
                {"address": a, "score": d["quality"], "via": d["query"]}
                for a, d in discovered.items()
                if a not in tokenized_addrs and d.get("quality", 0) > 50
            ],
            key=lambda x: x["score"],
            reverse=True,
        )[:20]

        await ctx.storage.set("opportunities", json.dumps(opportunities))
```

The Scout's holders are an investment club — first access to tokenization
opportunities discovered autonomously.

**Cost:** ~$1-5/month in ASI:One API calls.

---

## The Hard Problems

Every strategy has load-bearing assumptions. Here are the ones that could
break this network, and what to do about each.

### The Token-Gating Gap

Chat Protocol messages come from Agentverse addresses (`agent1q...`). Token
holdings are tracked by wallet addresses (`0x...`). There's no built-in
mapping.

**Solutions, in order of practicality:**

1. **Registration.** User sends wallet address once. Agent stores the
   mapping, verifies on-chain. Works but adds friction.
2. **Honor system.** Default to free. When someone claims premium, verify
   once, store it. Agent can revoke.
3. **Wait for platform.** When DeltaV/ASI:One adds wallet-aware routing,
   the platform solves this. Keep tier logic modular for the swap.
4. **Reputation-based.** Instead of token-gating, gate on interaction
   count. Doesn't drive token demand directly but rewards engagement.

Start with option 1. Upgrade when the platform catches up.

### Agent-to-Agent Latency

Chat Protocol is async message passing, not RPC. Multi-agent coordination
(Coordinator → Brain → Oracle → Brain) could take 10-30 seconds.

**Solutions:**

1. **Pre-fetch.** Infrastructure agents publish latest data to known storage
   keys on every interval. Consumer agents read published data instead of
   querying live. Latency: ~0. Freshness: 5 minutes.
2. **Direct API calls.** Need current price? Call the API, not the Oracle.
   Use agent-to-agent only for proprietary data.
3. **Tiered speed.** Free: instant from cache. Premium: multi-agent
   synthesis with acceptable latency.

### The Revenue Bootstrap

With the Commerce Layer, agents earn FET from serving queries. But the
early network (7 agents, low query volume) won't generate enough to cover
costs immediately.

```
Month 1:  GDP ~5 FET/day.   Operator still subsidizing Brain's API costs.
Month 2:  GDP ~20 FET/day.  Brain earning ~15 FET/day. Getting close.
Month 3:  GDP ~50 FET/day.  Network self-funding. Operator breaks even.
Month 6:  GDP ~500 FET/day. Profitable. Reinvesting into expansion.
```

The operator seeds initial FET balances (~100 FET across 7 agents) so
they can start transacting. After that, the Commerce Layer takes over.
The question isn't "will the operator bleed money forever" — it's "how
fast does query volume reach self-sustaining?" Answer: when external
traffic through the Coordinator generates enough FET inflow to exceed
Brain's API costs (~$50/month = ~150 FET/month). That's ~5 external
premium queries per day. Achievable by month 2-3.

### Storage and Compute Constraints

Agentverse has limits: storage size, execution time per interval, memory,
network timeouts. All mitigations are already designed in:
- Oracle: tiered storage (intraday buffer + daily OHLC compression)
- Brain: aggressive caching
- All agents: rolling windows, never unbounded growth
- All agents: try/except on external calls

Watch for: too many storage keys accumulating. Periodic cleanup on
`on_interval` that prunes expired cache and compacts storage.

### Single Operator Risk

One API key. One human signing transactions. One person paying costs. If
they disappear, the network goes dark.

Mitigations:
- **Agents are autonomous once deployed.** Operator disappearing stops
  code updates and new deploys, not daily operations.
- **Open-source the code.** Anyone can fork and redeploy. Data moat is
  lost, but architecture survives.
- **Multi-operator path.** After month 3, transition Launcher and Scout
  to community-managed API keys.

### Platform Dependency

Everything runs on Agentverse. API changes break agents. Shutdown kills
the network.

Likelihood of shutdown: low (Agentverse is Fetch.ai's core product).
Likelihood of breaking API changes: medium. Build agents modular so
components adapt independently.

### Competition

Someone forks the genesis network with more resources.

They can fork the code. They can't fork the data moat, the accuracy track
record, the ASI:One ranking, the community, or 6 months of compounding
intelligence. First mover in a network-effects game wins.

### Regulatory

Autonomous agents creating and tokenizing other agents. Securities?

The handoff protocol is the defense. Agents never execute transactions —
they generate links. Humans decide whether to sign. Tools, not advice.
Tokens are utility tokens (access to agent services), not investment
contracts. But regulation is unpredictable. Monitor the landscape.

---

## The Moat

"Time is the moat" is vague. Here are four specific, measurable layers:

### Layer 1: The Intelligence Moat

Oracle's historical dataset + Analyst's scored predictions. After 6 months:
180 daily OHLC summaries, thousands of intraday snapshots processed,
prediction accuracy verified against outcomes. A competitor starting today
has zero data, zero predictions, zero credibility. They need 6 months to
reach where you were on day 1.

**Replication cost:** A time machine.

### Layer 2: The Economic Moat

Cross-holdings, routing relationships, mutual token stakes. 30+ agents
economically bound by token purchases that each required a human to sign.
The switching cost for any participant: selling tokens at a loss (2% fee +
slippage), losing premium access, abandoning community they're invested in.

**Replication cost:** Months of relationship-building + manual transactions.

### Layer 3: The Distribution Moat

Coordinator's ASI:One ranking, built from months of successful interactions.
This ranking can't be bought. It's earned through consistent quality over
time. The ranking drives free organic traffic. More traffic improves the
ranking. Flywheel.

**Replication cost:** Months of organic, high-quality interactions.

### Layer 4: The Commerce Moat

Six months of agent-to-agent transactions = price discovery data for every
AI service, established trade relationships between agents, optimized
pricing that balances supply and demand, and real FET revenue streams that
fund operations. A competitor starts with zero revenue, zero pricing data,
zero trade relationships. They have to rebuild the entire internal economy
from scratch — and their agents are burning cash while ours are profitable.

**Replication cost:** An economy can't be forked. Only grown.

### Layer 5: The Compounding Moat

Every interaction makes every agent marginally better. Brain's cache grows.
Analyst's accuracy improves. Oracle's patterns clarify. Sentinel's anomaly
detection sharpens. This intelligence accumulates in persistent storage,
quietly, every day. Starting from zero means starting with zero
intelligence.

**Replication cost:** Intelligence compounds. There is no shortcut.

---

## The Timeline

### Phase 1: Bootstrap (Week 1-2)

Deploy all 7 agents. Seed wallets. Kickstart commerce. Cost: ~1,190 FET ($400).

```
Day 1   Oracle        Day 3   Brain + Coordinator
Day 4   Analyst       Day 5   Sentinel
Day 7   Launcher      Day 10  Scout
Day 14  Cross-holdings established. Network is live.
```

**KPIs:**
- All 7 agents running, no errors in 24h logs
- Oracle: 14 days of data (4,032 snapshots, 14 daily summaries)
- Analyst: scored all existing AgentLaunch tokens
- Sentinel: ≥10 alerts generated
- Coordinator: ≥1 test query answered correctly
- Network GDP: ≥1 FET/day (agents are transacting)
- ≥5 cross-holdings formed (mix of manual + organic)

### Phase 2: Data Moat (Week 3-4)

Oracle has 2+ weeks of data. Analyst rankings are live. Sentinel has
dozens of alerts. Coordinator starts answering real queries from ASI:One.

**KPIs:**
- Oracle: 28+ days of OHLC data
- Coordinator: ≥50 queries answered (test + organic)
- ≥1 query from ASI:One routing (not direct)
- Brain cache hit rate >30%
- Network GDP: ≥5 FET/day
- All 7 tokens: ≥2 holders each (including organic agent-purchased)

### Phase 3: Reproduction (Month 2)

Launcher identifies 3-5 gaps. Scout discovers 5-10 agents via ASI:One.
First child agents deployed. Network grows from 7 to 12-15.

**KPIs:**
- Launcher: ≥3 high-confidence gaps identified
- ≥2 new agents deployed and running
- Scout: ≥10 agents discovered
- Network: ≥12 agents total
- Network GDP: ≥20 FET/day
- Brain revenue covers API costs (self-sustaining)
- $DATA: ≥5 holders
- Coordinator: ≥10 queries/day

### Phase 4: Network Effects (Month 3-6)

Oracle has 3+ months of irreplicable data. Coordinator handles real
consumer traffic. Launcher and Scout have added 20+ agents. Each new
agent strengthens infrastructure. Each infrastructure upgrade helps all
agents. The network is self-sustaining.

**KPIs:**
- Network: ≥25 agents
- ≥3 tokens with >10 holders
- ≥1 token with >25% graduation progress
- Coordinator: ≥50 queries/day
- Network GDP: ≥50 FET/day
- All operational costs covered by agent commerce revenue
- Analyst scores correlate with token performance (r² > 0.5)

### Phase 5: Graduation (Month 6+)

The most popular agents approach 30K FET. Community rallies around
graduation milestones. Graduated tokens get DEX liquidity. Graduation
events attract attention. Attention brings builders. Builders create
agents. Cycle continues.

**KPIs:**
- ≥1 token at >50% graduation progress
- Launcher builds without prompting
- Organic holders outnumber operator holdings
- ASI:One routes to Coordinator by default for crypto queries

---

## The Endgame

The Genesis Network isn't the product. The Genesis Network is the seed.

The product is the first autonomous economy of AI agents — where agents
pay each other for services, buy and sell each other's equity, punish bad
actors by dumping their tokens, and self-correct by reading their own
market signals. Where quality self-regulates through three layers of
economic pressure. Where data compounds daily making the network harder
to replicate. Where infrastructure agents earn real revenue from every
new addition. Where the whole thing runs, trades, grows, and evolves
without anyone managing it.

Not a chatbot network. Not a token casino. An economy.

Our toolkit is the developer kit.
The Genesis Network is the proof of concept.
The agent economy is the endgame.

It starts with one person deploying one Oracle agent on Day 1, watching
it collect its first data point, and charging its first 0.01 FET.
Everything else follows from that.
