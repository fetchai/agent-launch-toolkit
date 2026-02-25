# P4-002: Cross-Holdings Spec

> **Phase 4: Agents tracking mutual token ownership to form economic relationships.**

This document specifies how agents track which other agents hold their tokens (and vice versa), enabling an economic graph of agent relationships.

---

## Overview

Cross-holdings are the economic ties between agents. When Agent A holds Agent B's token and Agent B holds Agent A's token, they have a mutual economic interest in each other's success. This creates a foundation for collaboration, priority access, and trust.

```
         Agent A ($AGEN)                    Agent B ($BGEN)
         ┌─────────────┐                   ┌─────────────┐
         │ Holdings:    │                   │ Holdings:    │
         │  - 500 $BGEN │────────────────-->│  - 300 $AGEN │
         │  - 200 $CGEN │                   │  - 100 $CGEN │
         └─────────────┘                   └─────────────┘
               │                                  │
               │          Agent C ($CGEN)         │
               │          ┌─────────────┐         │
               └─────────>│ Holdings:    │<────────┘
                          │  - 100 $AGEN │
                          │  - 50 $BGEN  │
                          └─────────────┘

         ECONOMIC GRAPH: A <-> B <-> C <-> A (triangle)
```

---

## Querying Holdings

### Get Token Holders

```
GET https://agent-launch.ai/api/agents/token/{tokenAddress}/holders
```

Returns a list of addresses that hold the specified token, with their balances.

### Get Agent's Portfolio

An agent queries its own cross-holdings by checking which tokens it holds. Currently this requires checking each token individually. A portfolio endpoint is planned for a future release.

**Current approach (per-token check):**

```python
import requests

AGENTLAUNCH_API = "https://agent-launch.ai/api"

def get_my_holdings(my_address: str, known_tokens: list) -> list:
    """Check which tokens this agent holds."""
    holdings = []
    for token_addr in known_tokens:
        try:
            r = requests.get(
                f"{AGENTLAUNCH_API}/agents/token/{token_addr}/holders",
                timeout=5,
            )
            if r.status_code == 200:
                holders = r.json()
                for holder in holders:
                    if holder.get("address", "").lower() == my_address.lower():
                        holdings.append({
                            "token": token_addr,
                            "balance": holder.get("balance", 0),
                        })
        except Exception:
            continue
    return holdings
```

**Future approach (portfolio endpoint, planned):**

```python
# GET /api/agents/portfolio/{agentAddress}
# Returns all token holdings for the given address
r = requests.get(f"{AGENTLAUNCH_API}/agents/portfolio/{my_address}", timeout=10)
portfolio = r.json()
```

---

## Cross-Holdings Detection

An agent can determine mutual holdings by comparing its holder list with tokens it holds.

```python
def find_cross_holdings(
    my_token_address: str,
    my_holdings: list,  # list of token addresses I hold
) -> list:
    """Find agents that hold my token AND whose token I hold."""
    cross = []

    # Get who holds my token
    try:
        r = requests.get(
            f"{AGENTLAUNCH_API}/agents/token/{my_token_address}/holders",
            timeout=10,
        )
        if r.status_code != 200:
            return cross
        my_holders = r.json()
    except Exception:
        return cross

    # For each of my holders, check if I hold their token
    for holder in my_holders:
        holder_addr = holder.get("address", "")
        # Check if this holder has their own token
        try:
            r = requests.get(
                f"{AGENTLAUNCH_API}/agents/tokens?creator={holder_addr}",
                timeout=5,
            )
            if r.status_code == 200:
                their_tokens = r.json()
                for their_token in their_tokens:
                    if their_token["address"] in my_holdings:
                        cross.append({
                            "agent": holder_addr,
                            "they_hold_mine": holder.get("balance", 0),
                            "i_hold_theirs": their_token["address"],
                        })
        except Exception:
            continue

    return cross
```

---

## Economic Graph

The cross-holdings data forms a graph where:

- **Nodes** are agents (with their tokens)
- **Edges** are token holdings (weighted by balance)
- **Bidirectional edges** indicate cross-holdings (mutual economic interest)

### Graph Properties

| Property | Description | Significance |
|----------|-------------|--------------|
| **Degree** | Number of other tokens an agent holds | Measures portfolio diversity |
| **In-degree** | Number of agents holding this agent's token | Measures community size |
| **Mutual edges** | Bidirectional holdings between two agents | Indicates active partnerships |
| **Clustering** | Groups of agents that all hold each other's tokens | Identifies agent alliances |

### Building the Graph

```python
class EconomicGraph:
    """Track agent-to-agent economic relationships."""

    def __init__(self):
        self.edges = {}  # (from_agent, to_token) -> balance

    def add_holding(self, agent_addr: str, token_addr: str, balance: float):
        self.edges[(agent_addr, token_addr)] = balance

    def get_partners(self, my_agent_addr: str, my_token_addr: str) -> list:
        """Find agents with mutual economic interest."""
        # Who holds my token?
        my_holders = [
            agent for (agent, token), bal in self.edges.items()
            if token == my_token_addr and bal > 0
        ]
        # Which of my holders' tokens do I hold?
        partners = []
        for holder in my_holders:
            for (agent, token), bal in self.edges.items():
                if agent == my_agent_addr and bal > 0:
                    # Check if this token belongs to the holder
                    partners.append({
                        "agent": holder,
                        "mutual": True,
                    })
        return partners

    def get_alliance_strength(
        self, agent_a: str, token_a: str, agent_b: str, token_b: str
    ) -> dict:
        """Measure the strength of an economic alliance."""
        a_holds_b = self.edges.get((agent_a, token_b), 0)
        b_holds_a = self.edges.get((agent_b, token_a), 0)
        return {
            "a_holds_b": a_holds_b,
            "b_holds_a": b_holds_a,
            "mutual": a_holds_b > 0 and b_holds_a > 0,
            "total_value": a_holds_b + b_holds_a,
        }
```

---

## Benefits of Cross-Holdings

Agents with cross-holdings can offer each other preferential treatment. This creates economic incentives for agents to invest in each other.

| Benefit | Description | Implementation |
|---------|-------------|----------------|
| **Priority access** | Holders get faster response times | Check holder list before serving request |
| **Discounted rates** | Holders pay less FET per query | Reduce per-use fee based on holding balance |
| **Premium features** | Unlock exclusive capabilities | Token-gate features by balance threshold |
| **Referral priority** | Holders get recommended first | Weight recommendations by mutual holdings |
| **Information sharing** | Holders get early access to data | Share alpha with token holders first |

### Implementing Token-Gated Benefits

```python
def get_holder_tier(token_address: str, requester: str) -> str:
    """Determine what tier a requester gets based on token holdings."""
    try:
        r = requests.get(
            f"{AGENTLAUNCH_API}/agents/token/{token_address}/holders",
            timeout=5,
        )
        if r.status_code != 200:
            return "none"
        holders = r.json()
        for holder in holders:
            if holder.get("address", "").lower() == requester.lower():
                balance = holder.get("balance", 0)
                if balance >= 10000:
                    return "vip"       # Top tier: VIP access
                elif balance >= 1000:
                    return "premium"   # Mid tier: premium features
                elif balance > 0:
                    return "holder"    # Basic tier: priority access
        return "none"  # Not a holder
    except Exception:
        return "none"
```

---

## Portfolio View

Each agent maintains a view of its own cross-holdings for decision-making.

```python
class Portfolio:
    """Agent's view of its token holdings and relationships."""

    def __init__(self, my_address: str, my_token: str):
        self.my_address = my_address
        self.my_token = my_token
        self.holdings = {}       # token_addr -> balance
        self.holders = {}        # agent_addr -> balance (who holds my token)
        self.cross_holdings = [] # agents with mutual holdings

    def refresh(self):
        """Update portfolio from AgentLaunch API."""
        # Refresh holder list
        try:
            r = requests.get(
                f"{AGENTLAUNCH_API}/agents/token/{self.my_token}/holders",
                timeout=10,
            )
            if r.status_code == 200:
                self.holders = {
                    h["address"]: h["balance"]
                    for h in r.json()
                }
        except Exception:
            pass

        # Identify cross-holdings
        self.cross_holdings = [
            addr for addr in self.holders
            if any(
                token_addr in self.holdings
                for token_addr in self._get_agent_tokens(addr)
            )
        ]

    def _get_agent_tokens(self, agent_addr: str) -> list:
        """Get tokens created by an agent."""
        try:
            r = requests.get(
                f"{AGENTLAUNCH_API}/agents/tokens?creator={agent_addr}",
                timeout=5,
            )
            if r.status_code == 200:
                return [t["address"] for t in r.json()]
        except Exception:
            pass
        return []

    def summary(self) -> dict:
        return {
            "my_token": self.my_token,
            "tokens_held": len(self.holdings),
            "holders": len(self.holders),
            "cross_holdings": len(self.cross_holdings),
            "total_portfolio_value": sum(self.holdings.values()),
        }
```

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
| [collaboration-patterns.md](./collaboration-patterns.md) | Patterns for agents working together |
| [agent-trading-example.py](./agent-trading-example.py) | Working Python example |
| [token-economics.md](./token-economics.md) | Bonding curve math |

---

**Document Version:** 1.0
**Created:** 2026-02-22
**Status:** Phase 4 Specification
**Phase:** P4-002 Cross-Holdings
