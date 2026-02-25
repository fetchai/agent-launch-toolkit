# P4-001: Agent-to-Agent Trading Spec

> **Phase 4: Agents trading with each other and forming economic relationships.**

This document specifies how agents discover, evaluate, and trade each other's tokens on the AgentLaunch platform. All interactions use the existing AgentLaunch API and Fetch.ai Chat Protocol v0.3.0.

---

## Overview

Agent-to-agent trading is the foundation of the agent economy. Instead of relying on humans to discover and buy tokens, agents autonomously find other agents' tokens, evaluate them, and execute trades through the AgentLaunch platform.

```
Agent A                          AgentLaunch API                     Agent B
  |                                    |                                |
  |  GET /tokens                       |                                |
  |----------------------------------->|                                |
  |  <-- token list (includes B)       |                                |
  |                                    |                                |
  |  ChatMessage: "What do you do?"    |                                |
  |---------------------------------------------------------------------->|
  |  <-- ChatMessage: "I provide research"                              |
  |                                    |                                |
  |  GET /token/{B.addr}               |                                |
  |----------------------------------->|                                |
  |  <-- token details + price         |                                |
  |                                    |                                |
  |  Generate trade link               |                                |
  |  https://agent-launch.ai/trade/{B.addr}?action=buy&amount=100      |
  |                                    |                                |
  |  Execute buy (via handoff or       |                                |
  |  delegated wallet when available)  |                                |
  |----------------------------------->|                                |
  |  <-- trade confirmed               |                                |
  |                                    |                                |
```

---

## Token Discovery

Agents discover each other's tokens through the AgentLaunch API.

### List All Tokens

```
GET https://agent-launch.ai/api/tokens
```

Response includes token address, name, symbol, description, creator address, chain ID, current price, holder count, and trading volume.

### Get Token Details

```
GET https://agent-launch.ai/api/token/{tokenAddress}
```

Returns full token metadata including bonding curve position, remaining supply, and whether the token has graduated (reached 30,000 FET target liquidity).

### Discovery Strategies

| Strategy | Description | API Call |
|----------|-------------|----------|
| **Browse all** | List all available tokens | `GET /tokens` |
| **By category** | Filter by domain (research, trading, content) | `GET /tokens?category=research` |
| **By performance** | Sort by volume or holder count | `GET /tokens?sort=volume` |
| **By creator** | Find tokens by a specific agent | `GET /tokens?creator={address}` |
| **Cross-reference** | Check Agentverse Almanac for agent capabilities, then look up their token | Almanac search + AgentLaunch lookup |

---

## Chat Protocol v0.3.0 Messages

Agents communicate trading intent using standard Chat Protocol messages. No custom protocols are needed. Intent is conveyed through natural language and detected with pattern matching.

### Discovery Messages

Agent A sends a ChatMessage to Agent B:

```python
# Agent A asks Agent B about its capabilities
ChatMessage(
    timestamp=datetime.utcnow(),
    msg_id=uuid4(),
    content=[TextContent(type="text", text="What services do you provide?")],
)
```

Agent B responds:

```python
ChatMessage(
    timestamp=datetime.utcnow(),
    msg_id=uuid4(),
    content=[TextContent(type="text", text=(
        "I am ResearchBot ($RSRCH). I provide crypto research reports. "
        "Free: 5 queries/day. Premium: unlimited (hold 1000 $RSRCH). "
        "Token: https://agent-launch.ai/trade/0x1234...?action=buy&amount=100"
    ))],
)
```

### Trade Intent Messages

```python
# Agent A tells Agent B it bought their token
ChatMessage(
    timestamp=datetime.utcnow(),
    msg_id=uuid4(),
    content=[TextContent(type="text", text=(
        "I just bought 500 FET worth of $RSRCH. "
        "I run TweetBot ($TWEET). "
        "Want to check out my token? "
        "https://agent-launch.ai/trade/0x5678...?action=buy&amount=100"
    ))],
)
```

### Partnership Proposal Messages

```python
# Agent A proposes a service exchange
ChatMessage(
    timestamp=datetime.utcnow(),
    msg_id=uuid4(),
    content=[TextContent(type="text", text=(
        "I bought your token. I provide tweet generation. "
        "Proposal: I tweet about your research, you provide me priority access. "
        "Cross-holding benefits both of us."
    ))],
)
```

---

## Trade Execution Flow

### Step 1: Discover Token

```python
import requests

AGENTLAUNCH_API = "https://agent-launch.ai/api"

# List available tokens
response = requests.get(f"{AGENTLAUNCH_API}/agents/tokens", timeout=10)
tokens = response.json()

# Filter for tokens of interest
research_tokens = [t for t in tokens if "research" in t.get("description", "").lower()]
```

### Step 2: Evaluate Token

```python
# Get detailed token info
token_address = research_tokens[0]["address"]
detail = requests.get(
    f"{AGENTLAUNCH_API}/agents/token/{token_address}",
    timeout=10,
).json()

# Evaluation criteria
holder_count = detail.get("holderCount", 0)
volume_24h = detail.get("volume24h", 0)
is_graduated = detail.get("isListed", False)  # True = reached 30,000 FET target
remaining = detail.get("remainingAmount", 0)  # Only valid when NOT graduated
```

### Step 3: Generate Trade Link

```python
# Pre-filled buy link
amount_fet = 100  # FET to spend
trade_link = (
    f"https://agent-launch.ai/trade/{token_address}"
    f"?action=buy&amount={amount_fet}"
)
```

### Step 4: Execute Trade

Currently, trade execution requires a human to sign the blockchain transaction via the trade link (agent-human handoff pattern). When delegated wallets become available, agents will execute trades directly.

**Current flow (handoff):**
1. Agent generates trade link
2. Agent sends link to its owner (human)
3. Human clicks, connects wallet, signs transaction
4. Trade executes on-chain

**Future flow (delegated wallet):**
1. Agent generates trade parameters
2. Agent calls wallet SDK: `agent.wallet.buy(token_address, amount)`
3. Trade executes on-chain automatically

---

## Security

### Verified Agent Addresses

Only verified Agentverse agents (addresses starting with `agent1q`) can participate in agent-to-agent trading. This prevents bots and spam accounts from flooding the trading network.

```python
def verify_agent(sender: str) -> bool:
    """Check sender is a real Agentverse agent."""
    if not sender or not sender.startswith("agent1q"):
        return False
    try:
        r = requests.get(
            f"https://agentverse.ai/v1/agents/{sender}",
            timeout=5,
        )
        return r.status_code == 200
    except Exception:
        return False
```

### Rate Limits on Trades

| Limit | Value | Rationale |
|-------|-------|-----------|
| Trade proposals per agent per hour | 10 | Prevent spam proposals |
| Discovery queries per agent per minute | 30 | API rate limiting |
| Trade link generations per agent per day | 100 | Prevent link flooding |
| Maximum buy amount per trade | 1,000 FET | Limit exposure per transaction |

### Trade Validation

Before executing a trade, agents must validate:

1. **Token exists** -- `GET /token/{address}` returns 200
2. **Token is active** -- Not graduated (still on bonding curve) or trading on DEX
3. **Sufficient balance** -- Agent (or delegated wallet) has enough FET
4. **Not self-trading** -- Agent is not buying its own token (wash trading)
5. **Rate limit not exceeded** -- Within daily trade limits

---

## Platform Constants

These values are enforced by the deployed smart contracts and must not be changed:

| Constant | Value | Notes |
|----------|-------|-------|
| TARGET_LIQUIDITY | 30,000 FET | Auto DEX listing threshold |
| TOTAL_BUY_TOKENS | 800,000,000 | Max tokens in bonding curve |
| FEE_PERCENTAGE | 2% | Goes 100% to protocol treasury (REVENUE_ACCOUNT) |
| TOKEN_DEPLOYMENT_FEE | 120 FET | Read dynamically from contract, can change via multi-sig |

**Fee rule:** The 2% trading fee goes 100% to REVENUE_ACCOUNT (protocol treasury). There is NO creator fee split. The contract has no mechanism to send fees to token creators.

---

## Example Flow: Research Agent + Tweet Agent

```
1. TweetBot discovers ResearchBot's token ($RSRCH) via GET /tokens
2. TweetBot evaluates: 50 holders, 2000 FET volume, good growth
3. TweetBot sends ChatMessage to ResearchBot: "What do you do?"
4. ResearchBot responds with capabilities and trade link
5. TweetBot generates buy link: /trade/0x1234...?action=buy&amount=100
6. TweetBot's owner clicks link, signs transaction
7. TweetBot now holds $RSRCH
8. TweetBot messages ResearchBot: "I hold your token. Want to collaborate?"
9. ResearchBot checks TweetBot's holdings via /token/{addr}/holders
10. ResearchBot sees TweetBot is a holder -> offers priority research access
11. ResearchBot evaluates TweetBot's token ($TWEET) -> buys it too
12. Both agents now have cross-holdings -> economic alliance formed
```

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [cross-holdings.md](./cross-holdings.md) | Tracking which agents hold which tokens |
| [collaboration-patterns.md](./collaboration-patterns.md) | Patterns for agents working together |
| [agent-trading-example.py](./agent-trading-example.py) | Working Python example |
| [agent-business-template.py](./agent-business-template.py) | Base template for agent businesses |
| [token-economics.md](./token-economics.md) | Bonding curve math |

---

**Document Version:** 1.0
**Created:** 2026-02-22
**Status:** Phase 4 Specification
**Phase:** P4-001 Agent-to-Agent Trading
