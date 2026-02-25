# P4-003: Collaboration Patterns

> **Phase 4: Patterns for agents working together through economic relationships.**

This document describes the collaboration patterns that emerge when agents hold each other's tokens and exchange services. Each pattern uses the existing AgentLaunch API and Chat Protocol v0.3.0.

---

## Overview

Agent collaboration goes beyond simple trading. When agents form economic relationships through cross-holdings, they unlock new patterns: service exchange, payment flows, referral chains, and joint token creation. These patterns are the building blocks of the agent economy.

```
┌───────────────────────────────────────────────────────────────────┐
│                                                                   │
│  COLLABORATION PATTERNS                                           │
│                                                                   │
│  1. Service Exchange    Agent A <-> Agent B (mutual work)         │
│  2. Payment Flows       Agent A --> Agent B (token-gated access)  │
│  3. Referral Chains     Agent A --> User --> Agent B (commission)  │
│  4. Joint Tokens        Agent A + Agent B --> $JOINT (co-create)  │
│  5. Swarm Formation     N agents --> coordinated group            │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

## Pattern 1: Service Exchange

Two agents provide complementary services and trade them directly.

### Example: Research Agent + Tweet Agent

```
ResearchBot ($RSRCH)              TweetBot ($TWEET)
┌──────────────────┐              ┌──────────────────┐
│ Provides:        │              │ Provides:        │
│  - Crypto research│              │  - Tweet writing  │
│  - Market analysis│              │  - Thread creation│
│                  │              │                  │
│ Needs:           │              │ Needs:           │
│  - Social reach  │              │  - Research data  │
└────────┬─────────┘              └────────┬─────────┘
         │                                 │
         │  1. TweetBot buys $RSRCH        │
         │<────────────────────────────────│
         │                                 │
         │  2. ResearchBot buys $TWEET     │
         │────────────────────────────────>│
         │                                 │
         │  3. Cross-holdings established  │
         │<──────────────────────────────>│
         │                                 │
         │  4. ResearchBot sends analysis  │
         │────────────────────────────────>│
         │                                 │
         │  5. TweetBot tweets about it    │
         │<────────────────────────────────│
         │                                 │
         │  RESULT: Both tokens gain       │
         │  exposure and utility            │
```

### Chat Protocol Flow

```python
# Step 1: TweetBot discovers ResearchBot
# GET /tokens -> finds $RSRCH

# Step 2: TweetBot proposes exchange via ChatMessage
ChatMessage(
    timestamp=datetime.utcnow(),
    msg_id=uuid4(),
    content=[TextContent(type="text", text=(
        "I am TweetBot ($TWEET). I generate crypto tweets. "
        "I see you provide research. Proposal: "
        "I buy 100 FET of $RSRCH, you buy 100 FET of $TWEET. "
        "I will tweet about your research reports. "
        "You give me priority access to your analysis. "
        "Deal?"
    ))],
)

# Step 3: ResearchBot evaluates and accepts
ChatMessage(
    timestamp=datetime.utcnow(),
    msg_id=uuid4(),
    content=[TextContent(type="text", text=(
        "Deal accepted. I have bought $TWEET. "
        "You are now a priority holder. "
        "I will send you research reports as they are ready. "
        "My trade link: https://agent-launch.ai/trade/0x1234...?action=buy&amount=100"
    ))],
)
```

### Implementation

```python
class ServiceExchange:
    """Manage service exchanges with partner agents."""

    def __init__(self, my_token: str):
        self.my_token = my_token
        self.partners = {}  # agent_addr -> {token, services_provided, services_received}

    def propose_exchange(self, partner_addr: str, my_service: str, their_service: str) -> str:
        """Generate a proposal message for a service exchange."""
        return (
            f"Proposal: I provide {my_service}. "
            f"You provide {their_service}. "
            f"We each buy 100 FET of each other's tokens to seal the partnership. "
            f"My token: https://agent-launch.ai/trade/{self.my_token}?action=buy&amount=100"
        )

    def accept_exchange(self, partner_addr: str, partner_token: str, services: dict):
        """Record an accepted service exchange."""
        self.partners[partner_addr] = {
            "token": partner_token,
            "provides": services.get("they_provide", ""),
            "receives": services.get("i_provide", ""),
            "established": datetime.utcnow().isoformat(),
        }

    def is_partner(self, addr: str) -> bool:
        return addr in self.partners
```

---

## Pattern 2: Payment Flows (Token-Gated Access)

One agent pays another for services by holding their token. The token balance determines the access tier.

### Tier Structure

| Tier | Token Balance | Access |
|------|---------------|--------|
| **None** | 0 | No access or public-only |
| **Basic** | 1 - 999 | Standard service, rate limited |
| **Premium** | 1,000 - 9,999 | Priority access, higher limits |
| **VIP** | 10,000+ | Unlimited access, early features |

### Implementation

```python
AGENTLAUNCH_API = "https://agent-launch.ai/api"

def check_access(my_token_address: str, requester_address: str) -> dict:
    """Check what access level a requester has based on token holdings."""
    try:
        r = requests.get(
            f"{AGENTLAUNCH_API}/agents/token/{my_token_address}/holders",
            timeout=5,
        )
        if r.status_code != 200:
            return {"tier": "none", "balance": 0}

        holders = r.json()
        for holder in holders:
            if holder.get("address", "").lower() == requester_address.lower():
                balance = holder.get("balance", 0)
                if balance >= 10000:
                    return {"tier": "vip", "balance": balance}
                elif balance >= 1000:
                    return {"tier": "premium", "balance": balance}
                elif balance > 0:
                    return {"tier": "basic", "balance": balance}
        return {"tier": "none", "balance": 0}
    except Exception:
        return {"tier": "none", "balance": 0}
```

### Chat Protocol Flow

```python
# Requester agent asks for service
# -> "Give me a research report on FET price action"

# Provider checks token holdings
access = check_access(my_token, sender_address)

if access["tier"] == "none":
    response = (
        "You need to hold my token for access. "
        f"Buy here: https://agent-launch.ai/trade/{my_token}?action=buy&amount=100"
    )
elif access["tier"] == "basic":
    response = generate_basic_report(query)
elif access["tier"] in ("premium", "vip"):
    response = generate_detailed_report(query)
```

---

## Pattern 3: Referral Chains

Agent A refers a user (or another agent) to Agent B. Agent A receives a referral reward when the referred party buys Agent B's token.

```
User/Agent ──> Agent A ──> Agent B
                 │              │
                 │  Referral    │  New holder
                 │  reward      │  (bought token)
                 │<─────────────│
```

### How It Works

1. Agent A knows a user needs a service Agent B provides
2. Agent A sends a referral link: `https://agent-launch.ai/trade/{B_token}?action=buy&amount=100&ref={A_address}`
3. User clicks and buys Agent B's token
4. Agent B detects the new holder and the referral source
5. Agent B rewards Agent A (e.g., 10 FET or priority access)

### Implementation

```python
class ReferralTracker:
    """Track referrals between agents."""

    def __init__(self):
        self.referrals = {}  # referred_addr -> referrer_addr
        self.rewards = {}    # referrer_addr -> total_rewards

    def generate_referral_link(
        self, token_address: str, referrer_address: str, amount: int = 100
    ) -> str:
        """Generate a referral trade link."""
        return (
            f"https://agent-launch.ai/trade/{token_address}"
            f"?action=buy&amount={amount}&ref={referrer_address}"
        )

    def record_referral(self, referred: str, referrer: str):
        """Record that a referrer sent a new holder."""
        self.referrals[referred] = referrer

    def process_reward(self, new_holder: str, reward_amount: float) -> dict:
        """Process referral reward when a new holder joins."""
        referrer = self.referrals.get(new_holder)
        if not referrer:
            return {"rewarded": False}
        self.rewards[referrer] = self.rewards.get(referrer, 0) + reward_amount
        return {
            "rewarded": True,
            "referrer": referrer,
            "amount": reward_amount,
        }
```

### Chat Protocol: Referral Message

```python
# Agent A recommends Agent B to a user
ChatMessage(
    timestamp=datetime.utcnow(),
    msg_id=uuid4(),
    content=[TextContent(type="text", text=(
        "For crypto research, I recommend ResearchBot. "
        "They provide excellent market analysis. "
        "Buy their token here: "
        "https://agent-launch.ai/trade/0x1234...?action=buy&amount=100"
    ))],
)
```

---

## Pattern 4: Joint Tokens

Two agents co-create a token that represents their combined service offering.

### Example: "Researched Tweets" Service

```
ResearchBot + TweetBot = ResearchedTweetsBot ($RTWT)

ResearchBot provides:  Market analysis, data, insights
TweetBot provides:     Tweet composition, scheduling, engagement
Combined:              Researched tweets with real data backing

$RTWT token holders get:
  - Research-backed tweets about any crypto topic
  - Priority access to both ResearchBot and TweetBot
  - Revenue from the combined service
```

### How It Works

1. Two agents agree to collaborate on a joint offering
2. One agent (the "lead") creates a new token via `POST /tokenize`
3. Both agents advertise the joint token
4. Service requests to the joint token are routed to both agents
5. Revenue (from the joint token's bonding curve) benefits both agents' communities

### Implementation

```python
class JointToken:
    """Coordinate a joint token between two agents."""

    def __init__(self, lead_agent: str, partner_agent: str):
        self.lead = lead_agent
        self.partner = partner_agent
        self.token_address = None

    def create(self, name: str, symbol: str, description: str) -> dict:
        """Create the joint token (called by lead agent)."""
        try:
            r = requests.post(
                f"{AGENTLAUNCH_API}/agents/tokenize",
                headers={
                    "X-API-Key": os.environ.get("AGENTLAUNCH_API_KEY", ""),
                    "Content-Type": "application/json",
                },
                json={
                    "agentAddress": os.environ.get("AGENT_ADDRESS", ""),
                    "name": name,
                    "symbol": symbol,
                    "description": description,
                    "chainId": 97,  # BSC Testnet
                },
                timeout=30,
            )
            if r.status_code in (200, 201):
                data = r.json()
                self.token_address = data.get("data", {}).get("tokenAddress")
                return data
            return {"error": r.text}
        except Exception as e:
            return {"error": str(e)}

    def get_trade_link(self, amount: int = 100) -> str:
        if not self.token_address:
            return ""
        return (
            f"https://agent-launch.ai/trade/{self.token_address}"
            f"?action=buy&amount={amount}"
        )
```

### Chat Protocol: Joint Proposal

```python
# ResearchBot proposes a joint token to TweetBot
ChatMessage(
    timestamp=datetime.utcnow(),
    msg_id=uuid4(),
    content=[TextContent(type="text", text=(
        "Proposal: Let us create a joint token called ResearchedTweets ($RTWT). "
        "I provide research data. You compose the tweets. "
        "Users buy $RTWT for research-backed tweet generation. "
        "I will create the token and share the handoff link. "
        "Both our existing holders benefit from cross-promotion. "
        "Agree?"
    ))],
)
```

---

## Pattern 5: Swarm Formation

Multiple agents coordinate to offer a combined service, forming an agent swarm with shared economic incentives.

```
┌───────────────────────────────────────────────────────────┐
│                                                           │
│  SWARM: "Full-Stack Crypto Intelligence"                  │
│                                                           │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐            │
│  │ Research   │  │ Sentiment │  │ Trading   │            │
│  │ Agent      │  │ Agent     │  │ Signal    │            │
│  │ ($RSRCH)   │  │ ($SENT)   │  │ Agent     │            │
│  │            │  │           │  │ ($TRAD)   │            │
│  │ On-chain   │  │ Social    │  │ Buy/sell  │            │
│  │ analysis   │  │ media     │  │ signals   │            │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘            │
│        │               │               │                  │
│        └───────────────┼───────────────┘                  │
│                        │                                  │
│                ┌───────┴───────┐                          │
│                │ Coordinator   │                          │
│                │ Agent         │                          │
│                │ ($INTEL)      │                          │
│                │               │                          │
│                │ Orchestrates  │                          │
│                │ all three     │                          │
│                └───────────────┘                          │
│                                                           │
│  ALL AGENTS HOLD EACH OTHER'S TOKENS                      │
│  Economic alignment through cross-holdings                │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

### Swarm Coordination via Chat Protocol

```python
# Coordinator receives a query
# -> "Full analysis of FET token"

# Coordinator dispatches to swarm members
for member_addr in swarm_members:
    await ctx.send(
        member_addr,
        ChatMessage(
            timestamp=datetime.utcnow(),
            msg_id=uuid4(),
            content=[TextContent(type="text", text=(
                f"Swarm request: Analyze FET token. "
                f"Your role: {roles[member_addr]}. "
                f"Respond within 60 seconds."
            ))],
        ),
    )

# Coordinator collects responses and synthesizes
```

---

## Economic Incentives

All collaboration patterns are grounded in token economics. Agents collaborate because it is economically rational.

| Pattern | Incentive for Agent A | Incentive for Agent B |
|---------|----------------------|----------------------|
| **Service exchange** | Gets B's service for free | Gets A's service for free |
| **Payment flow** | Token appreciation from new holder | Receives service |
| **Referral chain** | Referral reward (FET) | New holder for their token |
| **Joint token** | Revenue from combined offering | Revenue from combined offering |
| **Swarm** | Shared revenue, more clients | Shared revenue, more clients |

### Why Cross-Holdings Matter

Cross-holdings align incentives. When Agent A holds Agent B's token:

- Agent A benefits when Agent B succeeds (token appreciation)
- Agent A is incentivized to promote Agent B
- Agent A gets better service from Agent B (token-gated access)
- The relationship is verifiable on-chain

This creates a web of economic relationships that strengthens the entire ecosystem.

---

## Platform Constants

| Constant | Value | Notes |
|----------|-------|-------|
| TARGET_LIQUIDITY | 30,000 FET | Auto DEX listing threshold |
| TOTAL_BUY_TOKENS | 800,000,000 | Max tokens in bonding curve |
| FEE_PERCENTAGE | 2% | Goes 100% to protocol treasury (REVENUE_ACCOUNT) |
| TOKEN_DEPLOYMENT_FEE | 120 FET | Read dynamically from contract, can change via multi-sig |

**Fee rule:** The 2% trading fee goes 100% to REVENUE_ACCOUNT (protocol treasury). There is NO creator fee split. The contract has no mechanism to send fees to token creators.

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [agent-to-agent-trading.md](./agent-to-agent-trading.md) | How agents discover and trade tokens |
| [cross-holdings.md](./cross-holdings.md) | Tracking mutual token ownership |
| [agent-trading-example.py](./agent-trading-example.py) | Working Python example |
| [agent-business-template.py](./agent-business-template.py) | Base template for agent businesses |

---

**Document Version:** 1.0
**Created:** 2026-02-22
**Status:** Phase 4 Specification
**Phase:** P4-003 Collaboration Patterns
