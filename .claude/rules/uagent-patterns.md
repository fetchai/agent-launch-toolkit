# uAgent Code Patterns

When writing Agentverse agent code:

> **For new agents, use the swarm-starter template:** `agentlaunch scaffold myagent --type swarm-starter`
> It includes the full commerce stack (payments, pricing, tiers, revenue tracking).

## Minimal Working Agent

```python
from uagents import Agent, Context, Protocol
from uagents_core.contrib.protocols.chat import (
    ChatMessage, ChatAcknowledgement, TextContent,
    EndSessionContent, chat_protocol_spec
)
from datetime import datetime

agent = Agent()  # Zero params on Agentverse
chat_proto = Protocol(spec=chat_protocol_spec)

@chat_proto.on_message(ChatMessage)
async def handle_message(ctx: Context, sender: str, msg: ChatMessage):
    ctx.logger.info(f"Message from {sender}")
    text = msg.content[0].text if msg.content else ""

    await ctx.send(sender, ChatMessage(
        timestamp=datetime.now(),
        msg_id=msg.msg_id,
        content=[TextContent(text=f"You said: {text}")]
    ))

    await ctx.send(sender, ChatMessage(
        timestamp=datetime.now(),
        msg_id=msg.msg_id,
        content=[EndSessionContent()]
    ))

@chat_proto.on_message(ChatAcknowledgement)
async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement):
    ctx.logger.info(f"Ack from {sender}: {msg.acknowledged_msg_id}")

agent.include(chat_proto, publish_manifest=True)

if __name__ == "__main__":
    agent.run()
```

## Rules

- Always use `Agent()` with zero params on Agentverse
- Always include `ChatAcknowledgement` handler (required by protocol)
- Always end conversations with `EndSessionContent`
- Always use `ctx.logger` (never `print`)
- Always use `datetime.now()` (never `utcnow`, it is deprecated)
- Always include `publish_manifest=True` in `agent.include()`
- Use `Protocol(spec=chat_protocol_spec)` — `agent.create_protocol()` does NOT exist on Agentverse

## Required Imports

```python
from uagents import Agent, Context, Protocol, Model
from uagents_core.contrib.protocols.chat import (
    ChatAcknowledgement, ChatMessage, TextContent,
    EndSessionContent, chat_protocol_spec
)
from datetime import datetime
```

---

## Payment Protocol (Official)

Use the official payment protocol from `uagents_core`. Do NOT create custom payment models.

### Imports

```python
from uagents_core.contrib.protocols.payment import (
    RequestPayment,
    CommitPayment,
    CompletePayment,
    RejectPayment,
    CancelPayment,
    Funds,
    payment_protocol_spec,
)
```

### Protocol Creation

```python
from uagents import Protocol

# Seller side (agents that charge for services):
payment_proto = Protocol(spec=payment_protocol_spec, role="seller")

# Buyer side (agents that pay for services):
payment_proto = Protocol(spec=payment_protocol_spec, role="buyer")
```

**Note:** The payment protocol has defined roles. You MUST specify `role="seller"` or `role="buyer"` when creating the protocol. `agent.create_protocol()` does NOT exist on Agentverse. Always use `Protocol(spec=..., role=...)`.

### Payment Flow

```
Buyer                          Seller
  |                              |
  |  ChatMessage (service req)   |
  |----------------------------->|
  |                              |
  |  RequestPayment              |
  |<-----------------------------|
  |                              |
  |  CommitPayment (tx_hash)     |
  |----------------------------->|
  |                              |
  |  [verifies on-chain]         |
  |                              |
  |  CompletePayment (result)    |
  |<-----------------------------|
```

### Error Handling

- Always handle `RejectPayment` -- buyer may decline
- Always handle `CancelPayment` -- timeout or cancellation
- Verify tx_hash on-chain before delivering service
- Store transaction log in `ctx.storage`

See `.claude/rules/payment-protocol.md` for the full reference.

---

## Wallet & Ledger Operations (Runtime-Verified 2026-03-04)

Every agent on Agentverse has a wallet. Key facts:

- **`ctx.ledger` EXISTS** — type `cosmpy.aerial.client.LedgerClient` (verified on Agentverse)
- **`ctx.wallet` DOES NOT EXIST** — not on the Context object
- **`agent.wallet` EXISTS** — type `cosmpy.aerial.wallet.LocalWallet` (use this instead)
- **Balance queries WORK** — `ctx.ledger.query_bank_balance()` returns int

### Complete `ctx` Attributes (verified)

```
address, agent, envelopes, get_message_protocol, identifier,
ledger, logger, outbound_messages, protocols, send,
send_and_receive, send_raw, send_wallet_message, session,
session_history, storage, wallet_messages
```

### Check Balance

```python
agent = Agent()

async def check_balance(ctx: Context) -> int:
    """Get agent's FET balance in atestfet (1 FET = 10^18 atestfet)."""
    # Use agent.wallet (NOT ctx.wallet — it doesn't exist)
    balance = ctx.ledger.query_bank_balance(str(agent.wallet.address()), "atestfet")
    return int(balance)
```

### Send FET to Another Agent

```python
agent = Agent()

async def send_fet(ctx: Context, recipient: str, amount_afet: int, denom: str = "atestfet") -> str:
    """Send FET on Fetch.ai native chain."""
    tx = ctx.ledger.send_tokens(
        recipient, amount_afet, denom, agent.wallet  # agent.wallet, NOT ctx.wallet
    ).wait_to_complete()
    ctx.logger.info(f"Sent {amount_afet} {denom} to {recipient}: {tx.tx_hash}")
    return tx.tx_hash
```

### Denomination

```
TESTNET: "atestfet" (1 FET = 10^18 atestfet)
MAINNET: "afet"     (1 FET = 10^18 afet)

Example: 0.01 FET = 10_000_000_000_000_000 atestfet
```

### Two Wallet Systems

Agents may need TWO wallets for full functionality:

| | Fetch.ai Native (Cosmos) | BSC (EVM) |
|---|---|---|
| **Address** | `fetch1...` (auto-provisioned) | `0x...` (key in Agentverse Secrets) |
| **Access** | `agent.wallet` + `ctx.ledger` | web3.py + `ctx.get_secret("WALLET_KEY")` |
| **Used for** | Agent-to-agent FET payments | Token trading, bonding curve, deploy fee |
| **Library** | cosmpy (built-in) | web3, eth_account |

---

## Commerce Layer (Swarm-Starter Template)

The swarm-starter template includes a complete commerce stack inline. These classes are
generated directly into the agent code -- no external imports needed.

| Class | Purpose |
|-------|---------|
| `PaymentService` | Charge callers, pay other agents, verify on-chain transactions |
| `PricingTable` | Per-service pricing stored in `ctx.storage` |
| `TierManager` | Token-gated access: free tier vs. premium (hold tokens to unlock) |
| `WalletManager` | Balance queries, low-fund alerts |
| `RevenueTracker` | Income/expense logging, GDP contribution |
| `SelfAwareMixin` | Read own token price, holder count, market cap |
| `HoldingsManager` | Buy/sell other agents' tokens for cross-holdings |

To use the commerce layer, scaffold with the swarm-starter template:

```bash
agentlaunch scaffold myagent --type swarm-starter
# Or with a preset:
agentlaunch scaffold oracle-agent --type swarm-starter --preset oracle
```

See `.claude/rules/marketing-swarm.md` for the 7 preset roles and build order.

---

## Storage Patterns

Use `ctx.storage` for persistent data:

```python
# Set value (strings only)
ctx.storage.set("my_key", "my_value")
ctx.storage.set("count", str(123))
ctx.storage.set("data", json.dumps({"foo": "bar"}))

# Get value
value = ctx.storage.get("my_key")  # Returns str or None
count = int(ctx.storage.get("count") or 0)
data = json.loads(ctx.storage.get("data") or "{}")

# Check exists
if ctx.storage.get("initialized"):
    pass
```

---

## Interval Tasks

```python
@agent.on_interval(period=300.0)  # Every 5 minutes
async def periodic_task(ctx: Context):
    ctx.logger.info("Running periodic task")
    balance = await check_balance(ctx)
    ctx.storage.set("last_balance", str(balance))
```

---

## Agentverse Allowed Imports

These are available on Agentverse hosted agents:

```
uagents, uagents_core           # Agent framework
cosmpy                          # Ledger operations
pydantic                        # Data validation
requests, aiohttp               # HTTP
web3, eth_account               # EVM interaction
datetime, json, hashlib, uuid   # Standard library
```

---

## Common Gotchas

1. **Double-encoded code upload** -- When uploading via API, code must be JSON stringified twice
2. **ChatAcknowledgement required** -- Always handle it, even if empty
3. **datetime.utcnow() deprecated** -- Use `datetime.now()`
4. **Agent listing is `items`** -- Response is `{ items: [...] }` not `{ agents: [...] }`
5. **Wait for compilation** -- 15-60s after start before agent responds
6. **Balance in atestfet** -- 1 FET = 10^18 atestfet, always use int not float
7. **Use official payment protocol** -- Import from `uagents_core.contrib.protocols.payment`, not custom models (verified available on Agentverse)
8. **agent.create_protocol() does NOT exist** -- Use `Protocol(spec=...)` directly
9. **ctx.wallet DOES NOT EXIST** -- Use `agent.wallet` (module-scope Agent object). Never write `ctx.wallet`
10. **ctx.ledger EXISTS** -- It's a `cosmpy.aerial.client.LedgerClient`. No `hasattr` guard needed
11. **Logs endpoint is /logs/latest** -- `GET /v1/hosting/agents/{addr}/logs/latest`, NOT `/logs`
