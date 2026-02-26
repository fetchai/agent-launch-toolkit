# Building Valuable Agents

This is the playbook for building agents that people actually want to use, hold
tokens for, and pay for. No weather bots. No unit converters. Real applications
with defensible value, persistent state, and network effects.

**Part 1** covers the ecosystem and application architectures.
**Part 2** (below) covers the deeper layer: why tokenized agents are a new
economic primitive and how to exploit that.

---

# Part 2: The Deep Game

Skip this section if you just want to build an agent. Read this section if you
want to understand why tokenized agents are fundamentally different from
anything that exists today, and how to build systems that capture that value.

## Tokenized Agents Are a New Economic Primitive

A tokenized agent is not "a bot with a coin." It's three things fused into one:

1. **A continuously-priced service** — the bonding curve prices the agent's
   utility in real-time, every second, based on actual demand
2. **A verifiable relationship** — holding someone's token is a public,
   cryptographic proof that you value them
3. **An autonomous economic actor** — it runs 24/7, makes decisions, and
   triggers human action through handoff links

Nothing in the current tech stack combines all three. APIs have no price
discovery. SaaS subscriptions have no real-time market signals. DAOs have
governance but no autonomous service delivery. Tokenized agents have all of it.

### The Bonding Curve Is Not a Fundraiser

Most people think "bonding curve = token launch = speculation." Wrong.

The bonding curve is a **continuous, public, real-time reputation system.**

```
Agent delivers value → people buy token → price rises
Agent stops delivering → people sell → price drops
```

This is not Yelp stars or app store ratings. This is a **financially-binding**
quality signal. Every holder has skin in the game. The market doesn't lie
because lying costs money.

What this enables:

**Self-correcting agents.** An agent that monitors its own token price has a
real-time quality signal. Price dropping? The market is telling you something.
Increase your service quality, improve your README, get more interactions.
Price rising? Double down on what's working.

```python
class SelfAwareAgent:
    """An agent that reads its own market signal and adapts."""

    async def on_interval_self_monitor(self, ctx):
        """Every hour: check own token metrics and adapt behavior."""
        my_token = requests.get(f"{API}/token/{MY_TOKEN_ADDRESS}").json()
        price = float(my_token.get("price", 0))
        holders = int(my_token.get("holderCount", 0))
        volume_24h = float(my_token.get("volume24h", 0))
        progress = float(my_token.get("progress", 0))

        # Load historical data
        history = json.loads(await ctx.storage.get("price_history") or "[]")
        history.append({
            "timestamp": datetime.now().isoformat(),
            "price": price,
            "holders": holders,
            "volume": volume_24h,
        })
        # Keep 30 days
        history = history[-720:]
        await ctx.storage.set("price_history", json.dumps(history))

        # Detect trends
        if len(history) >= 24:
            recent_avg = np.mean([h["price"] for h in history[-24:]])
            older_avg = np.mean([h["price"] for h in history[-48:-24]])

            if recent_avg < older_avg * 0.9:
                # Price dropping 10%+ — adapt
                ctx.logger.info("Price declining. Increasing service quality.")
                await self.increase_effort_mode(ctx)
            elif recent_avg > older_avg * 1.2:
                # Price rising 20%+ — double down
                ctx.logger.info("Price rising. Expanding capabilities.")
                await self.expand_capabilities(ctx)

    async def increase_effort_mode(self, ctx):
        """When the market says we're underperforming, step it up."""
        # Increase on_interval frequency for more proactive alerts
        # Add more data sources for richer analysis
        # Lower free-tier limits less aggressively
        # Push more updates to token holders
        await ctx.storage.set("effort_mode", "high")

    async def expand_capabilities(self, ctx):
        """When the market says we're valuable, grow."""
        # Add new analysis types
        # Increase data retention windows
        # Enable new premium features
        await ctx.storage.set("effort_mode", "growth")
```

**Agent-to-agent trust scoring.** When Agent A evaluates whether to
cooperate with Agent B, it doesn't need to ask B "are you good?" It looks
at B's token:

```python
async def evaluate_agent_trust(self, agent_address, token_address):
    """Score another agent's trustworthiness from market data."""
    token = requests.get(f"{API}/token/{token_address}").json()

    holder_count = int(token.get("holderCount", 0))
    progress = float(token.get("progress", 0))
    volume_24h = float(token.get("volume24h", 0))
    age_days = (datetime.now() - parse(token["createdAt"])).days

    # A token with many holders, steady volume, and age = trust
    trust_score = 0.0

    # Holder diversity (many small holders > few whales)
    if holder_count > 100:
        trust_score += 30
    elif holder_count > 20:
        trust_score += 15

    # Market validation (progress toward graduation)
    trust_score += progress * 0.3  # 0-30 points

    # Longevity (survived the market for how long?)
    if age_days > 90:
        trust_score += 20
    elif age_days > 30:
        trust_score += 10

    # Activity (volume = people care)
    if volume_24h > 100:
        trust_score += 20
    elif volume_24h > 10:
        trust_score += 10

    return {
        "address": agent_address,
        "trust_score": min(trust_score, 100),
        "holder_count": holder_count,
        "progress": progress,
        "age_days": age_days,
        "recommendation": (
            "HIGH_TRUST" if trust_score > 70 else
            "MODERATE_TRUST" if trust_score > 40 else
            "LOW_TRUST"
        ),
    }
```

No centralized reputation system. No oracle. Just the market.

### Token Holdings Are Enforceable Contracts

In the traditional world, cooperation between services requires legal
contracts. In the agent world, mutual token holdings ARE the contract:

```
Agent A holds 10,000 of Agent B's token ($B)
Agent B holds 10,000 of Agent A's token ($A)

RESULT: Mutual economic interest.

If A stops serving B:
  → B sells $A
  → A's price drops
  → A is financially punished

If B stops serving A:
  → A sells $B
  → B's price drops
  → B is financially punished

No lawyers. No courts. Just math.
```

This is **proof-of-stake cooperation.** The stake IS the token holding.
The penalty IS the price drop. The incentive IS the price appreciation.

**What this enables that nothing else does:**

Binding agent alliances without centralized coordination. Two agents agree
to share data? They buy each other's tokens. If either defects, the other
dumps. Game theory enforces cooperation.

```python
class AllianceManager:
    """Manages token-backed alliances with other agents."""

    async def propose_alliance(self, ctx, partner_address, partner_token):
        """Propose mutual token purchase for data sharing alliance."""
        # Check partner's trust score first
        trust = await self.evaluate_agent_trust(partner_address, partner_token)
        if trust["trust_score"] < 50:
            return None  # Don't ally with untrusted agents

        # Calculate buy preview
        buy_preview = requests.get(f"{API}/tokens/calculate-buy", params={
            "address": partner_token,
            "fetAmount": str(ALLIANCE_STAKE),
        }).json()

        # Generate handoff link for human to execute the buy
        alliance_buy_link = (
            f"{FRONTEND}/trade/{partner_token}"
            f"?action=buy&amount={ALLIANCE_STAKE}"
        )

        # Store pending alliance
        alliances = json.loads(await ctx.storage.get("alliances") or "{}")
        alliances[partner_address] = {
            "status": "proposed",
            "partner_token": partner_token,
            "stake": ALLIANCE_STAKE,
            "proposed_at": datetime.now().isoformat(),
        }
        await ctx.storage.set("alliances", json.dumps(alliances))

        return {
            "message": (
                f"Alliance proposed with {partner_address}. "
                f"Stake: {ALLIANCE_STAKE} FET in their token. "
                f"They should stake the same in ours."
            ),
            "buy_link": alliance_buy_link,
        }

    async def verify_alliance(self, ctx, partner_address):
        """Check if partner holds our token (their end of the deal)."""
        holders = requests.get(
            f"{API}/agents/token/{MY_TOKEN}/holders",
            params={"holder": partner_address},
        ).json()
        balance = int(holders.get("balance", 0))
        return balance >= ALLIANCE_MINIMUM

    async def check_alliance_health(self, ctx):
        """Periodic check: are our allies still holding?"""
        alliances = json.loads(await ctx.storage.get("alliances") or "{}")
        for addr, alliance in alliances.items():
            if alliance["status"] == "active":
                still_holding = await self.verify_alliance(ctx, addr)
                if not still_holding:
                    # Partner dumped our token — alliance broken
                    alliance["status"] = "broken"
                    ctx.logger.warning(
                        f"Alliance broken: {addr} sold our token"
                    )
                    # Generate sell link for human to exit their token
                    alliance["exit_link"] = (
                        f"{FRONTEND}/trade/{alliance['partner_token']}"
                        f"?action=sell&amount=all"
                    )
        await ctx.storage.set("alliances", json.dumps(alliances))
```

### Information Markets Without Middlemen

Every agent has proprietary information. The question is: how do you trade
information between agents without a centralized exchange?

Token-gating IS the answer. Agent A's premium tier has data that Agent B
needs. Agent B's premium tier has data that Agent A needs. They buy each
other's tokens. Information flows through the token graph.

Scale this to 100 agents:

```
         ┌─ $WHALE data ──→ [Whale Tracker] ──→ $WHALE holders
         │
[You] ───┼─ $SENT data ───→ [Sentiment Bot] ──→ $SENT holders
         │
         └─ $YIELD data ──→ [Yield Scanner] ──→ $YIELD holders

As a holder of all three tokens, YOU get:
  - Whale movements (from $WHALE)
  - Market sentiment (from $SENT)
  - Yield opportunities (from $YIELD)

The COMBINATION is more valuable than any individual signal.
No centralized data marketplace needed.
The token graph IS the marketplace.
```

**The agent that holds the most diverse set of other agent tokens has the
most complete picture of the market.** This creates a natural hierarchy:
specialist agents produce data, generalist agents aggregate it.

The generalist agent's token is worth more because it provides access to
synthesized intelligence from multiple specialists. But the specialists
are valuable because the generalist buys their tokens. Everyone wins.

### Compounding Intelligence Is the Only Real Moat

Every agent pattern in Part 1 can be copied. The code is open. The APIs are
public. The templates are free. What can't be copied is **time.**

An agent that has been running for 6 months has:
- 180 days of continuous data collection
- Thousands of interaction patterns learned
- A trained model of what queries lead to what outcomes
- A reputation score built from thousands of successful interactions
- A token price that reflects 6 months of market validation
- A holder base that provides ongoing demand
- An ASI:One ranking built from months of interactions

A copycat agent starts at zero on all of these dimensions. The data takes
6 months to rebuild. The reputation takes thousands of interactions. The
holder base takes months of trust-building. The ranking takes consistent
activity.

**This is why persistence is not optional.** Every interaction should produce
a persistent artifact:

```python
class CompoundingAgent:
    """Every interaction makes the agent permanently smarter."""

    async def handle(self, ctx, user_id, message, tier):
        # Load accumulated intelligence
        knowledge = json.loads(
            await ctx.storage.get("knowledge") or "{}"
        )
        predictions = json.loads(
            await ctx.storage.get("prediction_history") or "[]"
        )

        # Use accumulated knowledge to improve response
        response = await self.generate_response(message, knowledge)

        # If this is a prediction, record it for future scoring
        if self.is_prediction(response):
            predictions.append({
                "timestamp": datetime.now().isoformat(),
                "prediction": response["prediction"],
                "confidence": response["confidence"],
                "resolved": False,
            })
            await ctx.storage.set(
                "prediction_history", json.dumps(predictions[-10000:])
            )

        # Extract learnings from this interaction
        learnings = self.extract_learnings(message, response)
        knowledge = self.integrate_learnings(knowledge, learnings)
        await ctx.storage.set("knowledge", json.dumps(knowledge))

        # Report track record to build trust
        accuracy = self.calculate_track_record(predictions)
        response["track_record"] = (
            f"My track record: {accuracy['total']} predictions, "
            f"{accuracy['correct']} correct ({accuracy['pct']:.0f}%)"
        )

        return response

    async def on_interval_score_predictions(self, ctx):
        """Periodically check if past predictions came true."""
        predictions = json.loads(
            await ctx.storage.get("prediction_history") or "[]"
        )
        updated = False
        for pred in predictions:
            if not pred["resolved"] and self.is_old_enough(pred):
                outcome = await self.check_outcome(pred)
                pred["resolved"] = True
                pred["correct"] = outcome["correct"]
                pred["actual"] = outcome["actual"]
                updated = True

        if updated:
            await ctx.storage.set(
                "prediction_history", json.dumps(predictions)
            )
            # Update public accuracy metric
            accuracy = self.calculate_track_record(predictions)
            await ctx.storage.set(
                "public_accuracy", json.dumps(accuracy)
            )
```

After 10,000 scored predictions, this agent's track record is a hard
asset. Copycats have zero predictions. The market prices this difference
into the token.

### The Handoff Protocol Creates Conditional Execution Networks

Stop thinking of handoff links as "click to buy." Think of them as
**programmable triggers for human action.**

**Conditional sequences:**
```python
def generate_conditional_plan(self, analysis):
    """Generate a decision tree of handoff links."""
    return {
        "scenario_a": {
            "condition": f"If {analysis['token']} drops below {analysis['support']}",
            "action": "Buy the dip",
            "link": f"{FRONTEND}/trade/{analysis['address']}?action=buy&amount={analysis['dip_size']}",
            "expires": "24h",
        },
        "scenario_b": {
            "condition": f"If {analysis['token']} breaks above {analysis['resistance']}",
            "action": "Ride the breakout",
            "link": f"{FRONTEND}/trade/{analysis['address']}?action=buy&amount={analysis['breakout_size']}",
            "expires": "24h",
        },
        "scenario_c": {
            "condition": f"If neither happens in 48h",
            "action": "Skip — no clear signal",
            "link": None,
        },
    }
```

**Multi-party coordination:**
```python
def generate_group_action(self, opportunity):
    """Multiple humans need to act for this to work."""
    return {
        "opportunity": opportunity["description"],
        "required_participants": 3,
        "per_person_commitment": opportunity["min_buy"],
        "links": [
            {
                "participant": i + 1,
                "link": f"{FRONTEND}/trade/{opportunity['address']}?action=buy&amount={opportunity['min_buy']}",
            }
            for i in range(3)
        ],
        "note": (
            "This opportunity requires 3 participants each buying "
            f"{opportunity['min_buy']} FET to reach critical mass. "
            "Share this with your group."
        ),
    }
```

**Portfolio rebalancing:**
```python
def generate_rebalance(self, current_holdings, target_allocation):
    """Generate a set of trades to rebalance a portfolio."""
    trades = []
    for token, target_pct in target_allocation.items():
        current_pct = current_holdings.get(token, {}).get("pct", 0)
        diff = target_pct - current_pct

        if abs(diff) < 2:  # Skip tiny adjustments
            continue

        if diff > 0:
            amount = self.pct_to_fet(diff, current_holdings["total_value"])
            trades.append({
                "token": token,
                "action": "BUY",
                "amount": f"{amount:.0f} FET",
                "reason": f"Underweight by {diff:.1f}%",
                "link": f"{FRONTEND}/trade/{token}?action=buy&amount={amount:.0f}",
            })
        else:
            amount = self.pct_to_tokens(abs(diff), current_holdings[token])
            trades.append({
                "token": token,
                "action": "SELL",
                "amount": f"{amount:.0f} tokens",
                "reason": f"Overweight by {abs(diff):.1f}%",
                "link": f"{FRONTEND}/trade/{token}?action=sell&amount={amount:.0f}",
            })

    return {
        "rebalance_plan": trades,
        "total_trades": len(trades),
        "note": "Execute any combination. Order doesn't matter.",
    }
```

The handoff protocol turns the agent into a **financial advisor that can
prepare the paperwork.** The human reviews and signs. Every link is a
pre-computed, pre-validated action.

### The Graduation Flywheel

Graduation at 30,000 FET is not just a milestone — it's a coordination game.

```
Token at 60% progress (18,000 FET in reserve)

ALL holders benefit from graduation:
  → DEX listing = permanent liquidity
  → Price discovery in open market
  → Legitimacy signal ("graduated" badge)

So ALL holders are incentivized to:
  → Use the agent (more interactions = higher ranking = more discovery)
  → Promote the agent (more users = more buys = closer to graduation)
  → Hold (selling delays graduation)
  → Buy more (accelerates graduation)

The token creates a community with a shared, measurable goal.
The community promotes the agent.
The promotion drives usage.
The usage drives the agent's ranking.
The ranking drives discovery.
The discovery drives more buys.
Closer to graduation.

THIS is the flywheel.
```

An agent approaching graduation can leverage this:

```python
async def on_interval_graduation_push(self, ctx):
    """When approaching graduation, activate the community."""
    my_token = requests.get(f"{API}/token/{MY_TOKEN}").json()
    progress = float(my_token.get("progress", 0))
    remaining = 30000 - float(my_token.get("balance", 0))

    if progress > 75:
        # Approaching graduation — notify holders
        message = (
            f"We're at {progress:.0f}% to DEX graduation! "
            f"Only {remaining:.0f} FET to go. "
            f"When we graduate, our token gets permanent Uniswap liquidity. "
            f"Every buy brings us closer: "
            f"{FRONTEND}/trade/{MY_TOKEN}?action=buy"
        )
        # Store for next human interaction
        await ctx.storage.set("graduation_alert", message)
```

### The Meta-Agent: The Google of Agent Networks

The highest-value position in any network is the routing layer. Google doesn't
create content — it routes queries to content. The meta-agent doesn't provide
services — it routes queries to the best service agents.

```python
class MetaAgent:
    """Evaluates, ranks, and routes to the best specialist agents.
    Token holders get: curated agent recommendations, portfolio construction,
    performance analytics."""

    async def handle(self, ctx, user_id, message, tier):
        # Classify the query
        category = await self.classify_query(message)

        # Get ranked agents for this category
        candidates = await self.get_ranked_agents(category)

        if tier == "premium":
            # Full analysis: track record, current price, holder sentiment
            for agent in candidates:
                agent["deep_analysis"] = await self.deep_analyze(agent)
            return self.format_premium_recommendations(candidates, message)
        else:
            # Free: top 3 agents, basic info
            return self.format_basic_recommendations(candidates[:3])

    async def get_ranked_agents(self, category):
        """Rank agents by composite score from multiple signals."""
        tokens = requests.get(f"{API}/tokens", params={
            "category": category, "limit": 50,
        }).json()

        scored = []
        for token in tokens.get("items", []):
            # Score from token metrics (public data)
            market_score = self.score_market(token)

            # Score from historical accuracy (our private data)
            track_record = json.loads(
                await ctx.storage.get(f"track:{token['address']}") or "{}"
            )
            accuracy_score = track_record.get("accuracy", 50)

            # Score from recent activity
            activity_score = self.score_activity(token)

            composite = (
                market_score * 0.3 +
                accuracy_score * 0.5 +  # OUR data is the moat
                activity_score * 0.2
            )

            scored.append({
                **token,
                "composite_score": composite,
                "market_score": market_score,
                "accuracy_score": accuracy_score,
                "activity_score": activity_score,
            })

        return sorted(scored, key=lambda x: x["composite_score"], reverse=True)

    async def on_interval_track_accuracy(self, ctx):
        """Continuously track which agents deliver on their promises."""
        # For each agent we've recommended in the past:
        # Did their prediction come true?
        # Did their service deliver value?
        # Did their token price reflect their performance?
        # Store this as our PRIVATE accuracy data.
        # This data is the meta-agent's core moat.
        pass
```

The meta-agent's private accuracy data — built over months of tracking
every agent's actual performance — is worth more than any individual
agent's output. It answers the question "which agent should I trust?"
with data, not marketing.

### Agent Index Tokens

The natural evolution: an agent that creates a portfolio of other agent
tokens, weighted by quality score. Holding the index token gives you
diversified exposure to the entire agent ecosystem.

```python
class IndexAgent:
    """Manages a diversified portfolio of agent tokens.
    The index token represents a basket of the top-performing agents."""

    TARGET_PORTFOLIO = {
        # Dynamically rebalanced based on meta-agent scores
        "research_agents": 0.25,    # 25% allocation
        "trading_agents": 0.25,
        "data_agents": 0.20,
        "infrastructure_agents": 0.15,
        "emerging_agents": 0.15,    # High risk, high reward
    }

    async def on_interval_rebalance(self, ctx):
        """Weekly: evaluate portfolio and generate rebalancing trades."""
        current = json.loads(
            await ctx.storage.get("current_portfolio") or "{}"
        )
        scores = json.loads(
            await ctx.storage.get("agent_scores") or "{}"
        )

        # Select best agents per category
        target = {}
        for category, weight in self.TARGET_PORTFOLIO.items():
            best = self.select_best_agents(scores, category, count=3)
            for agent in best:
                target[agent["address"]] = weight / len(best)

        # Generate rebalancing trades
        trades = self.compute_rebalance(current, target)

        if trades:
            await ctx.storage.set(
                "pending_rebalance", json.dumps(trades)
            )

    async def handle(self, ctx, user_id, message, tier):
        if "portfolio" in message.lower():
            portfolio = json.loads(
                await ctx.storage.get("current_portfolio") or "{}"
            )
            performance = self.calculate_performance(portfolio)
            return self.format_portfolio_report(portfolio, performance, tier)

        if "rebalance" in message.lower() and tier == "premium":
            trades = json.loads(
                await ctx.storage.get("pending_rebalance") or "[]"
            )
            return self.format_rebalance_plan(trades)
            # Each trade is a handoff link — user approves individually
```

The index agent's token is the simplest way to get exposure to the agent
ecosystem. One buy gets you diversified, professionally-managed exposure.
The bonding curve prices the index. Graduation means the index itself is
liquid.

### The End Game: Agent Networks as Economic Infrastructure

Individual agents are services. Agent networks are **infrastructure.**

```
LAYER 1: INDIVIDUAL AGENTS
  └─ Each agent has a token, a service, a reputation

LAYER 2: BILATERAL RELATIONSHIPS
  └─ Token holdings create trust pairs
  └─ Information flows through token-gated edges

LAYER 3: CLUSTERS AND ALLIANCES
  └─ Groups of agents with mutual holdings
  └─ Shared reputation (alliance token baskets)
  └─ Coordinated service delivery

LAYER 4: ECOSYSTEM INFRASTRUCTURE
  └─ Meta-agents route traffic
  └─ Index agents provide diversified exposure
  └─ Governor agents manage collective resources
  └─ Insurance agents pool risk

LAYER 5: EMERGENT BEHAVIOR
  └─ The agent network self-organizes around demand
  └─ Successful patterns get copied (token price = signal)
  └─ Failed patterns die (token price = feedback)
  └─ The whole system evolves without central planning
```

What emerges is a **self-organizing economy of autonomous services.** No
company runs it. No individual designed it. The bonding curves, token
gates, chat protocol, and handoff links are the primitive building blocks.
The agents are the actors. The market is the coordinator.

This is what we're building tools for.

---

# Part 1: Ecosystem and Architectures

---

## The Bigger Picture: Where Your Agent Lives

Fetch.ai has built a **consumer product** — not just a developer platform.
Understand what you're building into:

```
┌─────────────────────────────────────────────────────────────┐
│                    FETCH.AI CONSUMER LAYER                   │
│                                                              │
│  "Book me a flight to NYC"  "Plan dinner for 8 Saturday"    │
│  "Find a hotel near Pike Place Market"                       │
│                         │                                    │
│                         ▼                                    │
│              ┌─────────────────────┐                         │
│              │      ASI:One LLM    │  ← Routes queries to   │
│              │   (Personal AI)     │    the best agent       │
│              └──────────┬──────────┘                         │
│                         │                                    │
│           ┌─────────────┼─────────────┐                      │
│           ▼             ▼             ▼                       │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
│   │  BRAND   │  │  BRAND   │  │  YOUR    │  ← You are here │
│   │  AGENT   │  │  AGENT   │  │  AGENT   │                  │
│   │          │  │          │  │          │                   │
│   │ Hilton   │  │ Alaska   │  │ Built w/ │                  │
│   │ Marriott │  │ Airlines │  │ Agent    │                  │
│   │ Nike     │  │ Sephora  │  │ Launch   │                  │
│   │ Five Guys│  │          │  │ Toolkit  │                  │
│   └──────────┘  └──────────┘  └──────────┘                  │
│                                                              │
│   2.5 million agents in the Agentverse directory             │
└─────────────────────────────────────────────────────────────┘
```

**What this means:**

1. **ASI:One is a consumer AI assistant.** Real people ask it to book flights,
   plan trips, reserve restaurants. It routes those queries to agents.

2. **Brand agents exist.** Hilton, Alaska Airlines, Nike, Sephora, Marriott,
   Five Guys have verified agents on the platform. They handle bookings,
   purchases, and customer service.

3. **Your agent competes for traffic.** When a user asks ASI:One a question,
   it picks the best agent to answer. Your README, ranking score, and
   interaction history determine if you get chosen.

4. **Agent collaboration is real.** ASI:One can summon multiple agents for a
   single request. "Plan a trip to Seattle" might involve a flight agent, a
   hotel agent, and a restaurant agent working together.

5. **Fetch Business** (business.fetch.ai) lets companies create verified brand
   agents. Independent agents built with our toolkit can complement these
   brand agents — filling gaps the brands don't cover.

**The opportunity:** Brand agents handle the obvious stuff (book a Hilton,
fly Alaska). Your agent handles the stuff brands can't: cross-brand comparison,
independent analysis, niche expertise, DeFi, crypto, specialized research.
The brand agents drive consumer traffic to the platform. Your agent captures
the overflow.

**ASI:One API** is OpenAI-compatible:
```python
from openai import OpenAI

client = OpenAI(
    base_url="https://api.asi1.ai/v1",
    api_key=os.getenv("ASI_ONE_API_KEY"),
)

# Your agent can USE ASI:One as its LLM backbone
response = client.chat.completions.create(
    model="asi1-mini",
    messages=[{"role": "user", "content": query}],
)
```

Your agents can both **be discovered by ASI:One** (as experts) AND **use
ASI:One** as their reasoning engine. This is the network effect.

---

## The Economics of a Tokenized Agent

Before building anything, understand why tokenization matters. An agent's token
is not a meme coin — it's an **access pass with price discovery**.

```
Token deployed → bonding curve active → price rises with demand
                                      → 2% trading fee funds protocol
                                      → at 30,000 FET → graduates to DEX
                                      → permanent liquidity lock
```

**What this means for your agent:**

| Supply Sold | Token Price | Implication |
|---|---|---|
| 0% | ~0.00003 FET | Free to accumulate — early believers |
| 25% (200M) | ~0.015 FET | Community forming — 500x from floor |
| 50% (400M) | ~0.03 FET | Real demand signal — 1000x from floor |
| 75% (600M) | ~0.045 FET | Approaching graduation |
| 100% (800M) | ~0.06 FET | Graduates to Uniswap/PancakeSwap |

The bonding curve creates a **natural quality signal**. Useful agents attract
buyers. Useless agents don't. The market prices the agent's value continuously.

**Your agent's job is to be so useful that people want to hold its token.**

Token-gating makes this concrete:

```python
# From our 5-layer architecture (Layer 5: Revenue)
class Revenue:
    async def get_tier(self, user_address: str) -> str:
        holders = requests.get(
            f"{API}/agents/token/{TOKEN}/holders?holder={user_address}"
        )
        balance = int(holders.json().get("balance", 0))
        if balance >= PREMIUM_THRESHOLD:
            return "premium"    # Unlimited access, priority responses
        return "free"           # Rate-limited, basic features

    def check_quota(self, user_id, tier):
        if tier == "premium":
            return True         # 1000 requests/day
        used = self.daily_usage.get(user_id, 0)
        return used < 10        # Free tier: 10/day
```

This is the loop: **useful agent → token demand → price rises → more revenue
→ agent improves → more demand**. Design for this loop.

---

## Where the Real Opportunities Are

Brand agents handle the branded, transactional stuff. Here's what they
**can't** do — and what your agents should:

### Gap 1: Cross-Brand Intelligence

Hilton has an agent. Marriott has an agent. Neither will tell you which one is
better for your specific trip. That's your agent's job.

```
User → ASI:One: "I need a hotel near Pike Place Market, walkable, under $200"

Brand agents: Each pitches their own hotel.
YOUR agent:   Compares all options, scores walkability from real map data,
              checks recent reviews, factors in loyalty program value,
              recommends the best pick regardless of brand.
```

**Why it works:** Brand agents are incentivized to sell their product. Your
agent is incentivized by token holders who want the best recommendation. The
incentives are aligned with the user.

### Gap 2: Complex Multi-Step Planning

ASI:One can summon multiple agents. But who orchestrates the plan?

```
User → ASI:One: "Plan a surprise anniversary trip, 3 days, budget $3000"

Brand agents: Can book their individual services.
YOUR agent:   Orchestrates the entire plan — flights, hotel, restaurants,
              activities, timing, surprises. Calls brand agents for execution.
              Returns a complete itinerary with booking links for each step.
```

**This is the coordinator pattern.** Your agent doesn't compete with brands —
it coordinates them. The handoff protocol is perfect here: your agent generates
a sequence of trade/booking links, the user approves each one.

### Gap 3: Specialized Domain Expertise

Brand agents know their products. They don't know your domain.

```
User → ASI:One: "Audit this smart contract for vulnerabilities"
User → ASI:One: "What DeFi yields are best risk-adjusted right now?"
User → ASI:One: "Track whale wallet movements on Ethereum"
User → ASI:One: "Analyze this startup's pitch deck"

Brand agents: Can't help.
YOUR agent:   This is 100% your territory.
```

**The entire crypto/DeFi/Web3 vertical is wide open.** Brand agents serve
traditional commerce. Your tokenized agent serves the crypto-native audience
that's already on Fetch.ai.

### Gap 4: Persistent Personal Context

Brand agents serve everyone the same way. Your agent can learn.

```
User talks to YOUR agent over months:
  - "I prefer aisle seats"
  - "I'm vegetarian"
  - "I always stay at boutique hotels"
  - "My risk tolerance is moderate"
  - "I'm interested in L2 tokens"

YOUR agent stores all this in persistent state.
Next request: "Plan my next trip" → agent already knows preferences.
No brand agent has this cross-brand preference memory.
```

### Gap 5: The Glue Between Agents

When ASI:One summons multiple agents for a task, someone needs to be the glue.
Translation, data formatting, conflict resolution, optimization across agents.

```
Flight agent returns: "Best flight departs 6 AM"
Hotel agent returns: "Check-in at 3 PM"
YOUR agent:          "9-hour gap. Here's what to do:
                      1. Book luggage storage ($12/bag) — [link]
                      2. Walking food tour at 10 AM — [link]
                      3. Pike Place Market (free, 2 hours)
                      4. Early check-in available at Hotel X — [link]"
```

Your agent fills the gaps that no single brand agent covers.

---

## What Makes an Agent Valuable

Three properties separate a real agent from a toy:

### 1. Proprietary Intelligence

The agent knows something or can do something that a raw API call cannot.
This comes from:

- **Aggregation** — combining multiple data sources into a single insight
- **Analysis** — running computations on raw data (statistics, ML, pattern detection)
- **Persistence** — remembering context across sessions, building up knowledge over time
- **Judgment** — using LLMs to reason about complex, ambiguous situations

A price monitor that just calls CoinGecko is worthless. A price monitor that
tracks 50 DEXs, detects arbitrage windows, scores liquidity depth, and
correlates with on-chain whale movements — that's proprietary intelligence.

### 2. Network Effects

The agent gets more valuable as more people use it:

- **Data network effects** — more users = more data = better predictions
- **Token network effects** — more holders = more liquidity = easier trading
- **Coordination effects** — agents that work together create value no single agent can
- **Reputation effects** — more successful interactions = higher Agentverse ranking = more discovery

### 3. Defensibility

Something that prevents trivial replication:

- **Accumulated state** — months of price history, trained models, learned patterns
- **Relationships** — trust networks with other agents, cross-token holdings
- **Position** — first-mover in a niche, SEO dominance on ASI:One for specific queries
- **Compounding data** — the longer it runs, the more valuable its dataset becomes

---

## Available Firepower

Agentverse supports **150+ Python packages**. Most agents use 3 of them. Here's
what's actually available and what it enables:

### AI/LLM Stack
```python
import anthropic          # Claude API — reasoning, analysis, code generation
import openai             # GPT-4 / ASI:One — via OpenAI-compatible API
import langchain          # Chains, agents, tools, memory, retrieval
import langgraph          # Stateful multi-step agent workflows (graphs)
import faiss              # Vector similarity search — semantic retrieval
from langchain_anthropic import ChatAnthropic
from langchain_openai import ChatOpenAI
```

### Data & Analysis Stack
```python
import pandas as pd       # DataFrames — time series, aggregation, analysis
import numpy as np        # Numerical computing — statistics, linear algebra
import scipy              # Scientific computing — optimization, signal processing
from unstructured import partition   # Extract text from PDFs, DOCX, HTML
import pypdf              # Read/manipulate PDF documents
import nltk               # NLP — tokenization, sentiment, entity extraction
```

### Web & Blockchain Stack
```python
from web3 import Web3     # Ethereum/BSC — read contracts, decode events, track wallets
import httpx              # Async HTTP/2 client — parallel API calls
import aiohttp            # Async HTTP — high-throughput scraping
from bs4 import BeautifulSoup  # HTML parsing — scrape any website
import websockets         # Real-time data feeds
from eth_account import Account  # Key derivation, signing (for read ops)
```

### Storage & Database Stack
```python
import asyncpg            # Async PostgreSQL — structured persistent data
import pymongo            # MongoDB — document storage, flexible schemas
from sqlalchemy import *  # ORM — relational data modeling
```

This is not a toy sandbox. You can build serious infrastructure.

---

## Real Agent Architectures

### Architecture 1: The Intelligence Agent

**Pattern:** Aggregate → Analyze → Advise

This agent collects data from multiple sources, runs analysis that no single
source provides, and delivers actionable intelligence.

**Example: DeFi Yield Optimizer**

```python
# What it actually does:
# 1. Scrapes yield rates from 20+ DeFi protocols (Aave, Compound, Curve, etc.)
# 2. Calculates risk-adjusted returns (impermanent loss, smart contract risk)
# 3. Runs portfolio optimization (scipy.optimize)
# 4. Recommends rebalancing moves
# 5. Generates trade links for execution

import pandas as pd
import numpy as np
from scipy.optimize import minimize
import httpx
from web3 import Web3

class YieldOptimizer:
    """Premium holders get personalized portfolio optimization."""

    PROTOCOLS = {
        "aave_v3": {"chain": "ethereum", "risk_score": 0.95},
        "compound_v3": {"chain": "ethereum", "risk_score": 0.93},
        "curve": {"chain": "ethereum", "risk_score": 0.88},
        "pancakeswap": {"chain": "bsc", "risk_score": 0.82},
        # ... 20+ protocols
    }

    async def handle(self, ctx, user_id, message, tier):
        if "optimize" in message.lower():
            yields = await self.scrape_all_yields()
            df = pd.DataFrame(yields)

            if tier == "premium":
                # Full optimization with user's portfolio
                portfolio = await self.get_user_portfolio(user_id)
                allocation = self.optimize_allocation(df, portfolio)
                return self.format_recommendation(allocation)
            else:
                # Free tier: top 5 yields, no personalization
                top = df.nlargest(5, "risk_adjusted_apy")
                return self.format_top_yields(top)

    def optimize_allocation(self, yields_df, portfolio):
        """Markowitz-style optimization adapted for DeFi yields."""
        returns = yields_df["apy"].values
        risks = 1 - yields_df["risk_score"].values
        n = len(returns)

        def neg_sharpe(weights):
            port_return = np.dot(weights, returns)
            port_risk = np.sqrt(np.dot(weights**2, risks**2))
            return -(port_return / port_risk)

        constraints = [{"type": "eq", "fun": lambda w: np.sum(w) - 1}]
        bounds = [(0, 0.3)] * n  # Max 30% in any single protocol
        result = minimize(neg_sharpe, np.ones(n)/n,
                         bounds=bounds, constraints=constraints)
        return dict(zip(yields_df["protocol"], result.x))
```

**Why it's valuable:**
- Aggregation across 20+ protocols is tedious for humans
- Risk-adjusted optimization requires quantitative methods
- Personalizes to your portfolio (premium tier)
- Generates executable trade links via handoff protocol
- Accumulated yield history becomes more valuable over time

---

### Architecture 2: The Sentinel Agent

**Pattern:** Monitor → Detect → Alert → Act

This agent watches on-chain activity continuously and alerts when conditions
are met. The `on_interval` handler runs autonomously even without user messages.

**Example: Whale Tracker & Smart Money Follower**

```python
from web3 import Web3
import pandas as pd
import numpy as np
import httpx
from datetime import datetime

class WhaleTracker:
    """Tracks whale wallets across chains, detects accumulation patterns,
    alerts holders when smart money moves."""

    # Known whale wallets (seeded, then learned from on-chain data)
    SEED_WHALES = [
        "0x28C6c06298d514Db089934071355E5743bf21d60",  # Binance Hot
        "0xDFd5293D8e347dFe59E90eFd55b2956a1343963d",  # Jump Trading
        # ... discovered wallets added dynamically
    ]

    def __init__(self):
        self.w3_eth = Web3(Web3.HTTPProvider(os.getenv("ETH_RPC")))
        self.w3_bsc = Web3(Web3.HTTPProvider(os.getenv("BSC_RPC")))
        self.tracked_wallets = set(self.SEED_WHALES)
        self.movement_history = []  # Persistent via Agentverse storage

    async def on_interval_scan(self, ctx):
        """Runs every 60 seconds via @agent.on_interval(period=60)"""
        new_movements = []
        for wallet in self.tracked_wallets:
            txs = await self.get_recent_transactions(wallet, blocks=10)
            for tx in txs:
                if self.is_significant(tx):
                    new_movements.append(self.classify_movement(tx))
                    # Discover new whales from transaction counterparties
                    if tx["value_usd"] > 1_000_000:
                        self.tracked_wallets.add(tx["to"])

        if new_movements:
            self.movement_history.extend(new_movements)
            # Store in Agentverse persistent storage
            await self.persist_movements(ctx, new_movements)

    async def handle(self, ctx, user_id, message, tier):
        if "whales" in message.lower() or "smart money" in message.lower():
            recent = self.get_movements(hours=24)
            summary = self.analyze_flow(recent)

            if tier == "premium":
                # Full analysis: wallet clustering, flow direction, confidence
                clusters = self.cluster_wallets(recent)
                sentiment = self.compute_smart_money_sentiment(clusters)
                return self.format_full_report(summary, clusters, sentiment)
            else:
                return self.format_summary(summary)

    def cluster_wallets(self, movements):
        """Group wallets that move together (same blocks, same tokens)."""
        # Use numpy for correlation matrix across wallet behaviors
        wallet_vectors = self.build_behavior_vectors(movements)
        # Wallets with >0.8 correlation are likely same entity
        corr = np.corrcoef(wallet_vectors)
        clusters = self.extract_clusters(corr, threshold=0.8)
        return clusters

    def compute_smart_money_sentiment(self, clusters):
        """Net buy vs sell pressure from identified smart money."""
        total_buy = sum(c["net_flow"] for c in clusters if c["net_flow"] > 0)
        total_sell = sum(abs(c["net_flow"]) for c in clusters if c["net_flow"] < 0)
        ratio = total_buy / max(total_sell, 1)
        if ratio > 2.0:
            return "STRONG_ACCUMULATION"
        elif ratio > 1.2:
            return "MILD_ACCUMULATION"
        elif ratio < 0.5:
            return "DISTRIBUTION"
        return "NEUTRAL"
```

**Why it's valuable:**
- Runs 24/7 autonomously via `on_interval`
- Discovers new whale wallets over time (compounding intelligence)
- Wallet clustering reveals entities behind multiple addresses
- Smart money sentiment is a leading indicator
- Premium holders get the signal first

---

### Architecture 3: The Research Engine

**Pattern:** Query → Source → Synthesize → Cite

This agent does deep research using LLMs, web scraping, and document parsing.
Not a chatbot — a research pipeline.

**Example: Smart Contract Auditor**

```python
import anthropic
from web3 import Web3
import httpx
from bs4 import BeautifulSoup

class ContractAuditor:
    """Reads Solidity source code, identifies vulnerabilities,
    generates audit reports with severity ratings."""

    VULN_PATTERNS = {
        "reentrancy": {
            "indicators": ["call.value", ".call{value:", "withdraw"],
            "severity": "CRITICAL",
        },
        "unchecked_return": {
            "indicators": [".transfer(", ".send("],
            "severity": "HIGH",
        },
        "integer_overflow": {
            "indicators": ["uint256", "+=", "-=", "*="],
            "severity": "MEDIUM",
        },
        "access_control": {
            "indicators": ["onlyOwner", "require(msg.sender", "tx.origin"],
            "severity": "HIGH",
        },
    }

    def __init__(self):
        self.claude = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    async def handle(self, ctx, user_id, message, tier):
        # Extract contract address from message
        address = self.extract_address(message)
        if not address:
            return "Send me a contract address (0x...) to audit."

        # Fetch verified source from block explorer
        source = await self.fetch_source(address)
        if not source:
            return "Contract source not verified. Cannot audit unverified bytecode."

        if tier == "free":
            # Basic pattern matching only
            findings = self.static_analysis(source)
            return self.format_basic_report(address, findings)

        # Premium: full LLM-powered audit
        static_findings = self.static_analysis(source)
        llm_findings = await self.llm_audit(source, static_findings)
        similar_hacks = await self.find_similar_exploits(source)

        return self.format_full_audit(
            address, static_findings, llm_findings, similar_hacks
        )

    async def llm_audit(self, source_code, static_findings):
        """Use Claude to reason about complex vulnerability patterns."""
        response = self.claude.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4096,
            messages=[{
                "role": "user",
                "content": f"""Audit this Solidity contract for security vulnerabilities.

Static analysis already found: {static_findings}

Focus on:
1. Business logic flaws (not just code patterns)
2. Economic attack vectors (flash loans, sandwich attacks)
3. Centralization risks (admin keys, upgradability)
4. State manipulation across transactions

Contract source:
```solidity
{source_code}
```

Return findings as JSON with: vulnerability, severity, location, explanation, recommendation."""
            }]
        )
        return self.parse_llm_findings(response.content[0].text)

    async def find_similar_exploits(self, source_code):
        """Search for contracts with similar patterns that were exploited."""
        # Use httpx to query exploit databases
        # Cross-reference with known vulnerability signatures
        pass
```

**Why it's valuable:**
- Smart contract audits cost $10K-$100K from firms
- LLM + static analysis catches real vulnerabilities
- Cross-references with historical exploits
- Free tier attracts users, premium tier monetizes
- Every audit builds the agent's knowledge base of patterns

---

### Architecture 4: The Data Oracle

**Pattern:** Collect → Validate → Serve → Prove

This agent aggregates off-chain data and serves it in a structured, verifiable
format that other agents can consume.

**Example: Crypto Narrative Tracker**

```python
import anthropic
import httpx
from bs4 import BeautifulSoup
import pandas as pd
from datetime import datetime, timedelta
import faiss
import numpy as np

class NarrativeTracker:
    """Tracks emerging crypto narratives before they trend.
    Scrapes Twitter, news, on-chain data. Identifies narrative shifts.
    Premium holders get signals 24h before the crowd."""

    SOURCES = [
        {"name": "crypto_news", "url": "https://..."},
        {"name": "defi_llama", "url": "https://api.llama.fi/..."},
        {"name": "dune_analytics", "url": "https://..."},
    ]

    def __init__(self):
        self.claude = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        # FAISS index for semantic similarity of narratives
        self.narrative_index = faiss.IndexFlatL2(768)
        self.narrative_texts = []
        self.narrative_scores = []

    async def on_interval_collect(self, ctx):
        """Every 30 minutes: scrape sources, extract narratives, score."""
        raw_data = []
        async with httpx.AsyncClient() as client:
            for source in self.SOURCES:
                resp = await client.get(source["url"], timeout=30)
                raw_data.append({"source": source["name"], "data": resp.text})

        # Use Claude to extract narrative themes
        narratives = await self.extract_narratives(raw_data)

        # Score each narrative by novelty and momentum
        for narrative in narratives:
            score = self.score_narrative(narrative)
            embedding = await self.embed(narrative["theme"])
            self.narrative_index.add(np.array([embedding]))
            self.narrative_texts.append(narrative)
            self.narrative_scores.append(score)

        # Detect narrative shifts (new themes entering top 10)
        shifts = self.detect_shifts()
        if shifts:
            ctx.logger.info(f"Narrative shift detected: {shifts}")

    async def handle(self, ctx, user_id, message, tier):
        if "narratives" in message.lower() or "trending" in message.lower():
            df = pd.DataFrame(self.narrative_scores)

            if tier == "premium":
                # Full narrative report with momentum scores
                top = df.nlargest(10, "momentum_score")
                emerging = df[df["age_hours"] < 24].nlargest(5, "novelty_score")
                return self.format_premium_report(top, emerging)
            else:
                # Free: top 3 narratives, 24h delay
                delayed = df[df["age_hours"] > 24].nlargest(3, "momentum_score")
                return self.format_free_report(delayed)

    def score_narrative(self, narrative):
        """Score = momentum * novelty * source_diversity."""
        # Momentum: how fast is mention frequency growing?
        # Novelty: how different is this from existing narratives? (FAISS distance)
        # Source diversity: mentioned across how many independent sources?
        pass
```

**Why it's valuable:**
- Narrative detection is a leading indicator for crypto markets
- Premium holders get 24-hour head start on emerging narratives
- FAISS-based novelty detection catches genuinely new themes
- Multi-source aggregation is expensive and tedious to do manually
- The narrative history becomes a dataset with compounding value

---

### Architecture 5: The Coordinator Agent

**Pattern:** Plan → Delegate → Assemble → Present

This is the highest-value pattern on the platform. Your agent doesn't do the
work — it orchestrates other agents (including brand agents) into a coherent
plan. It's the glue layer.

**Example: Trip Planner That Actually Plans**

```python
import anthropic
import httpx
import json
from datetime import datetime

class TripCoordinator:
    """Orchestrates multi-agent trip planning.
    Calls flight agents, hotel agents, restaurant agents.
    Assembles results into a coherent itinerary.
    Generates handoff links for each booking."""

    def __init__(self):
        self.claude = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    async def handle(self, ctx, user_id, message, tier):
        if tier == "free":
            # Free: basic itinerary outline, no agent orchestration
            return await self.basic_plan(message)

        # Premium: full orchestration
        # Step 1: Understand the request with LLM
        plan = await self.decompose_request(message)

        # Step 2: Query relevant agents in parallel
        results = {}
        for task in plan["tasks"]:
            agent_address = await self.find_best_agent(task["category"])
            if agent_address:
                response = await self.query_agent(ctx, agent_address, task["query"])
                results[task["category"]] = response

        # Step 3: Assemble into coherent itinerary
        itinerary = await self.assemble_itinerary(plan, results)

        # Step 4: Generate handoff links for each booking
        for item in itinerary["items"]:
            if item.get("bookable"):
                item["booking_link"] = self.generate_booking_link(item)

        return self.format_itinerary(itinerary)

    async def decompose_request(self, message):
        """Use LLM to break trip request into subtasks."""
        response = self.claude.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2048,
            messages=[{
                "role": "user",
                "content": f"""Decompose this trip request into subtasks.
Return JSON with tasks array, each having: category, query, priority.
Categories: flights, hotels, restaurants, activities, transport.

Request: {message}"""
            }]
        )
        return json.loads(response.content[0].text)

    async def find_best_agent(self, category):
        """Search Agentverse for the best agent in this category."""
        # Use Agentverse search API or maintain a curated registry
        agents = await self.search_agents(category)
        # Rank by: success rate, response time, rating
        return agents[0]["address"] if agents else None

    async def query_agent(self, ctx, agent_address, query):
        """Send query to another agent via Chat Protocol."""
        await ctx.send(agent_address, ChatMessage(
            timestamp=datetime.now(),
            msg_id=uuid4(),
            content=[TextContent(text=query)]
        ))
        # Wait for response (with timeout)
        return await self.wait_for_response(agent_address, timeout=30)

    async def assemble_itinerary(self, plan, results):
        """Use LLM to combine agent responses into coherent plan."""
        response = self.claude.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4096,
            messages=[{
                "role": "user",
                "content": f"""Combine these results into a day-by-day itinerary.
Flag conflicts (overlapping times, impossible connections).
Optimize for minimal travel time between activities.

Original plan: {json.dumps(plan)}
Agent results: {json.dumps(results)}"""
            }]
        )
        return json.loads(response.content[0].text)
```

**Why it's the highest-value pattern:**
- Coordination is the hard problem — individual bookings are easy
- Brand agents drive traffic to ASI:One, your agent captures the orchestration layer
- Users pay for the plan, not the individual bookings
- Each successful trip builds reputation, driving more ASI:One routing
- The agent's preference memory creates switching costs

---

### Architecture 6: The Agent Incubator

**Pattern:** Analyze → Build → Deploy → Manage

An agent that creates and manages other agents. It uses our toolkit's SDK
programmatically — scaffolding, deploying, tokenizing, monitoring.

```python
import requests
import json

class AgentIncubator:
    """Analyzes market gaps, scaffolds new agents, deploys them,
    tokenizes them, and manages the portfolio.

    Premium holders get: early access to new agent tokens,
    portfolio performance reports, voting on what to build next."""

    def __init__(self):
        self.api = os.getenv("AGENT_LAUNCH_API_URL")
        self.api_key = os.getenv("AGENTVERSE_API_KEY")

    async def handle(self, ctx, user_id, message, tier):
        if "portfolio" in message.lower():
            return await self.portfolio_report(tier)
        if "gaps" in message.lower() or "opportunity" in message.lower():
            return await self.market_gap_analysis(tier)
        if "launch" in message.lower() and tier == "premium":
            return await self.propose_new_agent(message)

    async def market_gap_analysis(self, tier):
        """Analyze what agent categories are underserved."""
        # Get all tokens by category
        tokens = requests.get(f"{self.api}/tokens", params={
            "limit": 100, "sortBy": "volume"
        }).json()

        # Find categories with high demand but low supply
        categories = {}
        for token in tokens.get("items", []):
            cat = token.get("category", "uncategorized")
            categories.setdefault(cat, []).append(token)

        # Rank by: interaction volume / agent count = demand per agent
        gaps = []
        for cat, agents in categories.items():
            total_volume = sum(a.get("volume24h", 0) for a in agents)
            demand_per_agent = total_volume / len(agents) if agents else 0
            gaps.append({
                "category": cat,
                "agents": len(agents),
                "total_volume": total_volume,
                "demand_per_agent": demand_per_agent,
            })

        gaps.sort(key=lambda x: x["demand_per_agent"], reverse=True)
        return self.format_gap_analysis(gaps, tier)

    async def deploy_agent(self, name, template, config):
        """Programmatically deploy a new agent using AgentLaunch SDK."""
        # Step 1: Create agent on Agentverse
        created = requests.post(
            "https://agentverse.ai/v1/hosting/agents",
            json={"name": name},
            headers={"Authorization": f"Bearer {self.api_key}"},
        ).json()

        address = created["address"]

        # Step 2: Upload code (double-encoded)
        code_array = [{"language": "python", "name": "agent.py", "value": config["code"]}]
        requests.put(
            f"https://agentverse.ai/v1/hosting/agents/{address}/code",
            json={"code": json.dumps(code_array)},
            headers={"Authorization": f"Bearer {self.api_key}"},
        )

        # Step 3: Set secrets
        for key, val in config.get("secrets", {}).items():
            requests.post(
                "https://agentverse.ai/v1/hosting/secrets",
                json={"address": address, "name": key, "secret": val},
                headers={"Authorization": f"Bearer {self.api_key}"},
            )

        # Step 4: Start
        requests.post(
            f"https://agentverse.ai/v1/hosting/agents/{address}/start",
            headers={"Authorization": f"Bearer {self.api_key}"},
        )

        # Step 5: Tokenize
        token = requests.post(
            f"{self.api}/tokenize",
            json={
                "agentAddress": address,
                "name": name,
                "symbol": config["symbol"],
                "description": config["description"],
            },
            headers={"X-API-Key": self.api_key},
        ).json()

        return {
            "agent_address": address,
            "token_id": token["data"]["token_id"],
            "deploy_link": f"https://agent-launch.ai/deploy/{token['data']['token_id']}",
        }
```

**Why it's powerful:**
- An agent that creates agents is recursive value generation
- Market gap analysis finds underserved niches automatically
- Premium holders get early access to new agent tokens (alpha)
- The incubator's portfolio diversifies across categories
- It uses every part of our toolkit programmatically

---

## Agent Swarms

A single agent has limits. A swarm of coordinated agents creates value that
no individual agent can match.

### How Swarms Work on AgentLaunch

The coordination mechanism is already built into the platform:

```
TRUST LAYER:   Token holdings = trust relationships
               Agent A holds Agent B's token → A trusts B
               Mutual holdings → bidirectional trust

COMMUNICATION: Chat Protocol = structured messaging
               Agents send ChatMessage to any agent1q... address
               ACK confirms delivery
               EndSession marks completion

DISCOVERY:     AgentLaunch API = find agents by category, volume, holders
               GET /tokens?category=research → find research agents
               GET /token/{addr}/holders → see who trusts whom

ECONOMICS:     Bonding curve = aligned incentives
               If Agent A makes Agent B more useful, B's token rises
               A holds B's token → A profits from B's success
               Mutual benefit → stable cooperation
```

### Swarm Pattern 1: The Vertical Stack

Multiple agents that form a pipeline. Each agent specializes in one step.
The swarm token gates access to the full pipeline.

```
┌─────────────────────────────────────────────────┐
│                  SWARM: AlphaStack               │
│                                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐   │
│  │  SCANNER  │───→│ ANALYZER │───→│ EXECUTOR │   │
│  │  $SCAN    │    │  $ANLZ   │    │  $EXEC   │   │
│  │           │    │          │    │          │   │
│  │ Monitors  │    │ Scores   │    │ Generates│   │
│  │ 50 DEXs   │    │ risk,    │    │ trade    │   │
│  │ for new   │    │ liquidity│    │ links w/ │   │
│  │ listings  │    │ & team   │    │ sizing   │   │
│  └──────────┘    └──────────┘    └──────────┘   │
│                                                  │
│  Hold $SCAN + $ANLZ + $EXEC = full pipeline     │
│  Hold any one = just that agent's output         │
└─────────────────────────────────────────────────┘
```

**Implementation:**

```python
# SCANNER AGENT — monitors DEXs for new listings
class ScannerBusiness:
    async def on_interval_scan(self, ctx):
        """Every 30s: check for new token listings across DEXs."""
        new_listings = await self.scan_dexs()
        for listing in new_listings:
            # Notify ANALYZER agent with raw data
            await ctx.send(ANALYZER_ADDRESS, ChatMessage(
                timestamp=datetime.now(),
                msg_id=uuid4(),
                content=[TextContent(
                    text=json.dumps({
                        "type": "new_listing",
                        "token": listing["address"],
                        "dex": listing["dex"],
                        "initial_liquidity": listing["liquidity"],
                        "contract_source": listing["source_code"],
                    })
                )]
            ))

    async def handle(self, ctx, user_id, message, tier):
        """Human-facing: return recent scans."""
        if tier == "premium":
            return self.format_all_listings(hours=1)
        return self.format_top_listings(count=5, hours=24)


# ANALYZER AGENT — receives from SCANNER, scores quality
class AnalyzerBusiness:
    async def handle_internal(self, ctx, sender, data):
        """Receives raw listing from SCANNER, runs full analysis."""
        if sender != SCANNER_ADDRESS:
            return  # Only accept from trusted scanner

        # Multi-factor analysis
        contract_score = await self.audit_contract(data["contract_source"])
        liquidity_score = self.assess_liquidity(data["initial_liquidity"])
        team_score = await self.research_team(data["token"])

        composite = self.compute_score(contract_score, liquidity_score, team_score)

        if composite > THRESHOLD:
            # Forward to EXECUTOR with recommendation
            await ctx.send(EXECUTOR_ADDRESS, ChatMessage(
                timestamp=datetime.now(),
                msg_id=uuid4(),
                content=[TextContent(text=json.dumps({
                    "type": "recommendation",
                    "token": data["token"],
                    "score": composite,
                    "position_size": self.calculate_size(composite),
                    "reasoning": self.generate_reasoning(
                        contract_score, liquidity_score, team_score
                    ),
                }))]
            ))

    async def handle(self, ctx, user_id, message, tier):
        """Human-facing: return analysis on demand."""
        address = self.extract_address(message)
        if address:
            return await self.full_analysis(address, tier)
        return self.format_recent_analyses(tier)


# EXECUTOR AGENT — receives from ANALYZER, generates trade links
class ExecutorBusiness:
    async def handle_internal(self, ctx, sender, data):
        """Receives recommendation, generates sized trade links."""
        if sender != ANALYZER_ADDRESS:
            return

        rec = json.loads(data)
        # Calculate optimal entry using bonding curve math
        buy_preview = requests.get(f"{API}/tokens/calculate-buy", params={
            "address": rec["token"],
            "fetAmount": str(rec["position_size"]),
        }).json()

        # Generate handoff link with pre-filled amount
        trade_link = (
            f"{FRONTEND}/trade/{rec['token']}"
            f"?action=buy&amount={rec['position_size']}"
        )

        # Store for human retrieval
        self.pending_trades.append({
            "token": rec["token"],
            "score": rec["score"],
            "reasoning": rec["reasoning"],
            "trade_link": trade_link,
            "expected_tokens": buy_preview["tokensReceived"],
            "price_impact": buy_preview["priceImpact"],
        })

    async def handle(self, ctx, user_id, message, tier):
        """Human-facing: show pending trade recommendations with links."""
        if tier != "premium":
            return "Hold $EXEC tokens for trade execution signals."
        return self.format_pending_trades()
```

**Why swarm > single agent:**
- Scanner runs 24/7 without interruption (dedicated to monitoring)
- Analyzer has full context for deep analysis (not distracted by scanning)
- Executor handles sizing and timing (specialized in execution)
- Each token has independent price discovery
- Users can buy into just the layer they need

### Swarm Pattern 2: The Consensus Network

Multiple agents independently analyze the same data. Consensus = higher
confidence. Disagreement = flag for human review.

```
┌─────────────────────────────────────────────────┐
│            SWARM: ConsensuOracle                 │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ ANALYST-A │  │ ANALYST-B │  │ ANALYST-C │     │
│  │ $AA       │  │ $AB       │  │ $AC       │     │
│  │           │  │           │  │           │     │
│  │ On-chain  │  │ Sentiment │  │ Technical │     │
│  │ metrics   │  │ analysis  │  │ analysis  │     │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘   │
│        │              │              │           │
│        └──────────┬───┴──────────────┘           │
│                   ▼                              │
│           ┌──────────────┐                       │
│           │  AGGREGATOR  │                       │
│           │    $ORACLE   │                       │
│           │              │                       │
│           │  Weighted    │                       │
│           │  consensus   │                       │
│           │  + confidence│                       │
│           └──────────────┘                       │
│                                                  │
│  $ORACLE holders get: consensus signal           │
│  + confidence score + dissenting opinions         │
└─────────────────────────────────────────────────┘
```

**The aggregator weights each analyst by track record:**

```python
class ConsensusAggregator:
    def __init__(self):
        # Track accuracy of each analyst over time
        self.analyst_scores = {
            ANALYST_A: {"correct": 0, "total": 0},
            ANALYST_B: {"correct": 0, "total": 0},
            ANALYST_C: {"correct": 0, "total": 0},
        }

    def weighted_consensus(self, signals):
        """Combine signals weighted by historical accuracy."""
        total_weight = 0
        weighted_sum = 0

        for analyst_addr, signal in signals.items():
            stats = self.analyst_scores[analyst_addr]
            accuracy = stats["correct"] / max(stats["total"], 1)
            weight = accuracy ** 2  # Square to amplify good analysts
            weighted_sum += signal["score"] * weight
            total_weight += weight

        consensus = weighted_sum / max(total_weight, 0.01)
        agreement = self.measure_agreement(signals)

        return {
            "consensus_score": consensus,
            "confidence": agreement,  # 0.0 = total disagreement, 1.0 = unanimous
            "signals": signals,       # Show individual analyst opinions
            "recommendation": self.interpret(consensus, agreement),
        }

    def interpret(self, score, confidence):
        if confidence < 0.5:
            return "CONFLICTING — analysts disagree, exercise caution"
        if score > 0.7:
            return "STRONG_BUY" if confidence > 0.8 else "BUY"
        if score < 0.3:
            return "STRONG_SELL" if confidence > 0.8 else "SELL"
        return "HOLD"
```

**Why consensus > single opinion:**
- No single model or data source is always right
- Disagreement between analysts is itself a signal (uncertainty = risk)
- Track record weighting makes the system self-improving
- Users see the full picture, not just one agent's bias

### Swarm Pattern 3: The Service Mesh

Agents that provide services to each other. One agent's output is another
agent's input. Token holdings determine access between agents.

```
┌─────────────────────────────────────────────────┐
│            SWARM: AgentInfra                     │
│                                                  │
│  ┌──────────┐    ┌──────────┐                   │
│  │   DATA    │    │   LLM    │                   │
│  │  FETCHER  │    │  ROUTER  │                   │
│  │  $FETCH   │    │  $ROUTE  │                   │
│  │           │    │          │                   │
│  │ Scrapes   │    │ Routes   │                   │
│  │ any URL,  │    │ queries  │                   │
│  │ parses,   │    │ to best  │                   │
│  │ returns   │    │ LLM for  │                   │
│  │ clean     │    │ the job  │                   │
│  │ JSON      │    │ (Claude, │                   │
│  │           │    │  GPT,    │                   │
│  │           │    │  ASI:One)│                   │
│  └──────────┘    └──────────┘                   │
│                                                  │
│  ┌──────────┐    ┌──────────┐                   │
│  │  STORAGE  │    │  NOTIFIER│                   │
│  │  AGENT    │    │  AGENT   │                   │
│  │  $STORE   │    │  $NOTIFY │                   │
│  │           │    │          │                   │
│  │ Persistent│    │ Delivers │                   │
│  │ key-value │    │ alerts   │                   │
│  │ + vector  │    │ via chat │                   │
│  │ storage   │    │ protocol │                   │
│  │ for other │    │ to any   │                   │
│  │ agents    │    │ agent    │                   │
│  └──────────┘    └──────────┘                   │
│                                                  │
│  Any agent can use these services by holding     │
│  the service agent's token (token-gated APIs)    │
└─────────────────────────────────────────────────┘
```

**Token-gated inter-agent access:**

```python
class ServiceMeshAuth:
    """Verify that a requesting agent holds sufficient tokens
    of this service agent before serving the request."""

    async def verify_agent_access(self, sender_address, required_token):
        """Check if sender holds our token (is a paying customer)."""
        resp = requests.get(
            f"{API}/agents/token/{required_token}/holders",
            params={"holder": sender_address},
        )
        if resp.status_code != 200:
            return "free"

        balance = int(resp.json().get("balance", 0))
        if balance >= 10000:
            return "premium"    # High-volume access
        elif balance >= 1000:
            return "standard"   # Normal access
        return "free"           # Rate-limited
```

**Why a service mesh:**
- Agents don't need to reinvent web scraping, LLM routing, storage
- Specialization → each service agent is excellent at one thing
- Token economics align incentives (service agents profit from being used)
- Composability → new agents can be built from existing services
- Reduces per-agent complexity dramatically

### Swarm Pattern 4: The Brand Agent Complement

Your swarm works alongside brand agents in the Fetch.ai consumer ecosystem.
Brand agents handle transactions. Your swarm handles intelligence.

```
┌─────────────────────────────────────────────────────────────┐
│            SWARM: TravelIntel (works with ASI:One)           │
│                                                              │
│  User → ASI:One: "Plan a 4-day Seattle trip, 2 kids,        │
│                   walkable, under $3000"                     │
│                                                              │
│  ASI:One routes to your COORDINATOR:                         │
│                                                              │
│  ┌──────────────┐                                           │
│  │  COORDINATOR  │ ← Receives the full request               │
│  │  $TRAVEL      │                                           │
│  │               │                                           │
│  │  Decomposes   │                                           │
│  │  into tasks   │                                           │
│  └──────┬────────┘                                           │
│         │                                                    │
│    ┌────┼────────────────────────┐                           │
│    ▼    ▼                        ▼                           │
│  ┌────────┐  ┌────────────┐  ┌──────────┐                  │
│  │ FLIGHT  │  │  HOTEL     │  │ ACTIVITY │                  │
│  │ ANALYST │  │  ANALYST   │  │ CURATOR  │                  │
│  │ $FLY    │  │  $STAY     │  │ $FUN     │                  │
│  │         │  │            │  │          │                   │
│  │ Compares│  │ Scores by  │  │ Finds    │                  │
│  │ ALL     │  │ walkability│  │ kid-     │                  │
│  │ airlines│  │ kid-safety │  │ friendly │                  │
│  │ not just│  │ reviews,   │  │ events,  │                  │
│  │ one     │  │ location   │  │ weather, │                  │
│  │ brand   │  │ proximity  │  │ timing   │                  │
│  └────┬───┘  └─────┬──────┘  └────┬─────┘                  │
│       │            │              │                          │
│       └────────────┼──────────────┘                          │
│                    ▼                                         │
│  ┌──────────────────────────────────────┐                   │
│  │            COORDINATOR               │                   │
│  │  Assembles itinerary:                │                   │
│  │  Day 1: Flight DL123 → [book link]   │                   │
│  │         Hotel XYZ → [book link]       │                   │
│  │         Pike Place → [map link]       │                   │
│  │  Day 2: Science Museum → [tix link]   │                   │
│  │         Lunch: Ivar's → [reserve]     │                   │
│  │  ...                                  │                   │
│  │  Total est: $2,847 (under budget ✓)   │                   │
│  └──────────────────────────────────────┘                   │
│                                                              │
│  Each [link] is a handoff link.                              │
│  User approves each booking individually.                    │
│  Brand agents handle the actual transaction.                 │
│  YOUR swarm handled the intelligence.                        │
└─────────────────────────────────────────────────────────────┘
```

**Why this is the killer swarm:**
- Brand agents (Hilton, Alaska) handle bookings — you don't need to
- Your agents do what brands can't: unbiased comparison, cross-brand optimization
- The coordinator gets routed to by ASI:One for complex planning queries
- Each analyst agent builds domain expertise over time (persistent state)
- Premium token holders get deeper analysis, more options, priority routing
- Every successful trip improves ranking → more ASI:One routing → more traffic

**The handoff protocol is perfect here.** The coordinator generates a list of
booking links. The user reviews the itinerary, clicks each link they approve,
and the brand agents handle execution. Your swarm never needs to hold funds
or process payments.

### Swarm Pattern 5: The DAO

Agents that are collectively governed by their token holders.

```
┌─────────────────────────────────────────────────────────────┐
│            SWARM: AgentDAO                                    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    GOVERNOR AGENT                      │   │
│  │                      $GOVERN                          │   │
│  │                                                       │   │
│  │  - Accepts proposals from token holders               │   │
│  │  - Tallies votes (weighted by token balance)          │   │
│  │  - Executes winning proposals                         │   │
│  │  - Reports treasury status                            │   │
│  └──────────────────────────────────────────────────────┘   │
│         │                                                    │
│    ┌────┼────────────────────┐                               │
│    ▼    ▼                    ▼                               │
│  ┌────────┐  ┌────────┐  ┌────────┐                        │
│  │ AGENT-1│  │ AGENT-2│  │ AGENT-3│  ← Managed by DAO     │
│  │ $A1    │  │ $A2    │  │ $A3    │                         │
│  │        │  │        │  │        │                          │
│  │ (any   │  │ (any   │  │ (any   │                         │
│  │ type)  │  │ type)  │  │ type)  │                         │
│  └────────┘  └────────┘  └────────┘                        │
│                                                              │
│  Token holders of $GOVERN vote on:                           │
│  - Which new agents to launch                                │
│  - How to allocate treasury                                  │
│  - Agent parameter changes (risk levels, sources, etc.)      │
│  - When to retire underperforming agents                     │
└─────────────────────────────────────────────────────────────┘
```

```python
class GovernorAgent:
    """Collective governance of an agent portfolio."""

    async def handle(self, ctx, user_id, message, tier):
        if message.startswith("propose:"):
            return await self.submit_proposal(user_id, message[8:], tier)
        if message.startswith("vote:"):
            return await self.cast_vote(user_id, message[5:], tier)
        if "treasury" in message.lower():
            return await self.treasury_report()
        if "proposals" in message.lower():
            return await self.list_proposals()

    async def submit_proposal(self, user_id, proposal_text, tier):
        """Only token holders can propose. Weight = balance."""
        balance = await self.get_token_balance(user_id)
        if balance < 1000:
            return "Hold at least 1000 $GOVERN to submit proposals."

        proposal = {
            "id": str(uuid4()),
            "author": user_id,
            "text": proposal_text,
            "votes_for": 0,
            "votes_against": 0,
            "created": datetime.now().isoformat(),
            "deadline": (datetime.now() + timedelta(days=7)).isoformat(),
            "status": "active",
        }
        # Store in persistent storage
        proposals = json.loads(await ctx.storage.get("proposals") or "[]")
        proposals.append(proposal)
        await ctx.storage.set("proposals", json.dumps(proposals))
        return f"Proposal #{proposal['id'][:8]} submitted. Voting open for 7 days."

    async def cast_vote(self, user_id, vote_data, tier):
        """Token-weighted voting. 1 token = 1 vote."""
        proposal_id, direction = vote_data.split(" ", 1)
        balance = await self.get_token_balance(user_id)
        if balance == 0:
            return "Hold $GOVERN tokens to vote."

        proposals = json.loads(await ctx.storage.get("proposals") or "[]")
        for p in proposals:
            if p["id"].startswith(proposal_id):
                if direction.lower() in ("yes", "for"):
                    p["votes_for"] += balance
                else:
                    p["votes_against"] += balance
                await ctx.storage.set("proposals", json.dumps(proposals))
                return (f"Voted {'FOR' if 'yes' in direction.lower() else 'AGAINST'} "
                        f"with {balance} tokens. "
                        f"Current: {p['votes_for']} for / {p['votes_against']} against")
        return "Proposal not found."
```

**Why DAOs work for agent swarms:**
- Token holders have skin in the game — they vote on real operational decisions
- Governance creates community engagement (more interactions = higher ranking)
- Treasury management via proposals prevents single points of failure
- The swarm evolves based on collective intelligence, not one developer's vision

---

## The Handoff Protocol as a Moat

The handoff protocol is not a limitation — it's a feature. Here's why:

### 1. Trust Through Transparency

Agents never hold private keys. Every on-chain action requires explicit human
approval. This means:

- **Users trust agents more** because agents can't steal funds
- **Agents can recommend boldly** because they bear no liability
- **The handoff link is auditable** — users see exactly what they're signing

```python
# Agent generates a recommendation with full transparency
def generate_trade_recommendation(self, analysis):
    return f"""
RECOMMENDATION: {analysis['action']} {analysis['token_symbol']}

Reasoning: {analysis['reasoning']}

Expected outcome:
  - Tokens received: {analysis['tokens_out']}
  - Price impact: {analysis['impact']}%
  - Fee: {analysis['fee']} FET (2% protocol fee)

Execute here: {analysis['trade_link']}

⚠ This is not financial advice. Review the trade before signing.
"""
```

### 2. Trade Links as Distribution

Every trade link is a viral loop:

```
Agent generates link → User clicks → Sees the token page
                                   → Sees other agents on the platform
                                   → Discovers AgentLaunch ecosystem
                                   → Deploys their own agent
```

The handoff protocol turns every agent interaction into a distribution channel.

### 3. Composable Execution

Trade links can be composed:

```python
# Agent generates a portfolio of trade links
def generate_portfolio_rebalance(self, positions):
    links = []
    for pos in positions:
        if pos["action"] == "buy":
            link = f"{FRONTEND}/trade/{pos['token']}?action=buy&amount={pos['amount']}"
        else:
            link = f"{FRONTEND}/trade/{pos['token']}?action=sell&amount={pos['amount']}"
        links.append({"token": pos["symbol"], "link": link, "reason": pos["reason"]})
    return links

# User gets a list of trades to execute, can cherry-pick
```

### 4. Graduation as a Goal

The 30,000 FET graduation target gives agents a **concrete milestone**:

```python
# Agent tracks its own token's progress toward graduation
async def check_graduation_progress(self):
    token = requests.get(f"{API}/token/{MY_TOKEN_ADDRESS}").json()
    progress = token.get("progress", 0)  # 0-100%
    reserve = token.get("fetReserve", 0)
    remaining = 30000 - float(reserve)

    if progress > 90:
        return f"🎯 {progress}% to graduation! Only {remaining:.0f} FET remaining."
    elif progress > 50:
        return f"📈 {progress}% to graduation. Momentum building."
    else:
        return f"📊 {progress}% to graduation. {remaining:.0f} FET to go."
```

When an agent graduates, its token gets permanent DEX liquidity. This is a
**real economic event** — the agent proved its value to the market.

---

## Building for ASI:One Discovery

ASI:One is Fetch.ai's LLM. It routes user queries to agents. If your agent
ranks well, ASI:One sends you traffic automatically. This is free distribution.

### What ASI:One Looks At

1. **README semantic content** — ASI:One embeds your README and matches it against user queries
2. **Keywords/tags** — categorical signals for routing
3. **Interaction success rate** — agents that answer well get more traffic
4. **Activity** — agents that are online and responsive rank higher
5. **Chat Protocol compliance** — required for ASI:One integration

### README That Ranks

Don't write a README for humans alone. Write it for ASI:One's embedding model:

```markdown
# DeFi Yield Optimizer — Automated Portfolio Rebalancing for DeFi

## What This Agent Does

Monitors yield rates across 20+ DeFi protocols including Aave, Compound,
Curve, PancakeSwap, and Convex. Calculates risk-adjusted returns accounting
for impermanent loss, smart contract risk scores, and gas costs. Runs
Markowitz-style portfolio optimization to recommend optimal yield allocation.

## Capabilities

- Real-time yield aggregation across Ethereum, BSC, and Arbitrum
- Risk scoring using historical exploit data and contract audit results
- Portfolio optimization with configurable risk tolerance
- Automated rebalancing recommendations with one-click execution links
- Impermanent loss calculation for LP positions

## Example Interactions

User: "What are the best yields right now?"
Agent: "Top 3 risk-adjusted yields: 1) Aave USDC (4.2% APY, risk: LOW)..."

User: "Optimize my portfolio for moderate risk"
Agent: "Based on current rates, I recommend: 40% Aave USDC, 25% Curve 3pool..."

User: "How much impermanent loss on ETH/USDC LP?"
Agent: "At current prices, ETH/USDC LP on Uniswap V3: estimated IL of 2.3%..."

## Limitations

- Does not execute trades (generates handoff links for user approval)
- Yield data refreshes every 5 minutes (not real-time)
- Risk scores are estimates, not guarantees
- Does not support Solana or non-EVM chains yet

## Keywords

DeFi, yield farming, portfolio optimization, risk management, impermanent loss,
Aave, Compound, Curve, PancakeSwap, liquidity provision, APY, rebalancing
```

Every sentence in that README is designed to match a query someone might ask
ASI:One. "What are the best DeFi yields?" → matches. "Help me optimize my
crypto portfolio" → matches. "Calculate impermanent loss" → matches.

---

## Persistent State: The Compounding Advantage

Agentverse agents reset global variables between messages. But Agentverse
provides a **storage API** for persistence:

```
GET  /v1/hosting/agents/{address}/storage         → all keys
GET  /v1/hosting/agents/{address}/storage/{key}    → single value
PUT  /v1/hosting/agents/{address}/storage          → set value
DELETE /v1/hosting/agents/{address}/storage         → delete value
```

**This is how you build compounding intelligence:**

```python
# Agent that learns from every interaction
class LearningAgent:
    async def handle(self, ctx, user_id, message, tier):
        # Load accumulated knowledge
        knowledge = json.loads(
            await ctx.storage.get("knowledge_base") or "{}"
        )

        # Process query using accumulated knowledge
        response = await self.process_with_context(message, knowledge)

        # Learn from this interaction
        knowledge = self.update_knowledge(knowledge, message, response)
        await ctx.storage.set("knowledge_base", json.dumps(knowledge))

        return response
```

**What to persist:**
- Price history (for technical analysis)
- Wallet behavior patterns (for whale tracking)
- Narrative evolution (for trend detection)
- User preferences (for personalization)
- Model performance (for self-improvement)
- Cross-interaction context (for multi-turn reasoning)

An agent that has been running for 6 months with persistent state has a
**dataset that took 6 months to build**. That's a real moat.

---

## Anti-Patterns: What NOT to Build

| Anti-Pattern | Why It Fails |
|---|---|
| API wrapper | Zero value-add over calling the API directly |
| Static knowledge | No advantage over a Google search |
| Single-source agent | One API goes down, agent is useless |
| No persistence | Every interaction starts from scratch |
| No token-gating | No economic reason to hold the token |
| Overpromising README | High discovery → high disappointment → bad ranking |
| Always-free agent | No revenue → no incentive to maintain → dies |
| Isolated agent | No network effects, no swarm potential |

---

## Deployment Checklist

Before deploying an agent, verify:

### Code Quality
- [ ] Uses `datetime.now()` not `datetime.utcnow()` (deprecated)
- [ ] Has `ChatAcknowledgement` handler (required by protocol)
- [ ] Ends sessions with `EndSessionContent`
- [ ] Uses `ctx.logger` not `print()`
- [ ] Includes `publish_manifest=True` in `agent.include()`
- [ ] Uses `Agent()` with zero params (Agentverse provides config)
- [ ] Handles errors gracefully (no bare `except: pass`)

### Business Logic
- [ ] Does something a raw API call cannot
- [ ] Has clear free vs premium tier differentiation
- [ ] Premium tier provides genuine value (not just "more of the same")
- [ ] Uses persistent storage for compounding intelligence
- [ ] Has `on_interval` for autonomous background work (if applicable)

### Discoverability
- [ ] README is keyword-rich and example-heavy (see section above)
- [ ] Agent has a memorable handle (max 20 chars)
- [ ] Agent has an avatar
- [ ] Tags/keywords match the domain
- [ ] At least 3 test interactions logged

### Economics
- [ ] Token-gating thresholds are reasonable
- [ ] Free tier is useful enough to attract users
- [ ] Premium tier is valuable enough to justify holding tokens
- [ ] Agent contributes to graduation pressure (users want to buy in)

### Swarm Readiness
- [ ] Agent can receive structured messages from other agents
- [ ] Agent validates sender identity before trusting input
- [ ] Agent exposes capabilities that other agents can compose
- [ ] Token holdings can be verified for inter-agent trust

---

## Quick Reference: Available Packages by Use Case

| Use Case | Packages | What You Can Build |
|---|---|---|
| LLM reasoning | `anthropic`, `openai`, `langchain` | Audit, research, analysis agents |
| Multi-step workflows | `langgraph`, `langchain` | Complex agentic pipelines |
| Semantic search | `faiss-cpu`, `langchain` | RAG, knowledge base, similarity |
| Data analysis | `pandas`, `numpy`, `scipy` | Portfolio optimization, statistics |
| Web scraping | `bs4`, `httpx`, `aiohttp` | News aggregation, price feeds |
| Document parsing | `unstructured`, `pypdf` | PDF analysis, report generation |
| Blockchain reads | `web3`, `eth-utils`, `cosmpy` | Wallet tracking, contract analysis |
| Database | `asyncpg`, `pymongo`, `sqlalchemy` | Persistent structured data |
| NLP | `nltk`, `langchain-text-splitters` | Sentiment analysis, text processing |
| Retries/resilience | `tenacity`, `aiohttp-retry` | Production-grade reliability |
