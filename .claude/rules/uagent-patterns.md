# uAgent Code Patterns

When writing Agentverse agent code:

> **For new agents, use the genesis template:** `agentlaunch scaffold myagent --type genesis`
> It includes the full commerce stack (payments, pricing, tiers, revenue tracking).

## Minimal Working Agent

```python
from uagents import Agent, Context
from uagents_core.contrib.protocols.chat import (
    ChatMessage, ChatAcknowledgement, TextContent,
    EndSessionContent, chat_protocol_spec
)
from datetime import datetime

agent = Agent()  # Zero params on Agentverse
chat_proto = agent.create_protocol(spec=chat_protocol_spec)

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
- Use `Protocol(spec=chat_protocol_spec)` or `agent.create_protocol(spec=chat_protocol_spec)`

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

### Role-Based Protocol Creation

```python
# Seller (service provider) -- receives payments
seller_proto = agent.create_protocol(spec=payment_protocol_spec, role="seller")

# Buyer (service consumer) -- sends payments
buyer_proto = agent.create_protocol(spec=payment_protocol_spec, role="buyer")
```

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

## Wallet & Ledger Operations (cosmpy)

Every agent on Agentverse has a wallet. Access it via `ctx.ledger` (LedgerClient from cosmpy).

### Check Balance

```python
from cosmpy.aerial.client import LedgerClient, NetworkConfig

def get_ledger_client(testnet: bool = True) -> LedgerClient:
    """Get configured LedgerClient."""
    if testnet:
        return LedgerClient(NetworkConfig.fetchai_stable_testnet())
    return LedgerClient(NetworkConfig.fetchai_mainnet())

async def check_balance(ctx: Context) -> int:
    """Get agent's FET balance in atestfet (1 FET = 10^18 atestfet)."""
    # ctx.ledger is the LedgerClient
    balance = ctx.ledger.query_bank_balance(str(ctx.wallet.address()), "atestfet")
    return int(balance)
```

### Send FET to Another Agent

```python
from cosmpy.aerial.tx import Transaction
from cosmpy.aerial.tx_helpers import SubmittedTx

async def send_fet(ctx: Context, recipient: str, amount_afet: int) -> str:
    """
    Send FET to another address.

    Args:
        ctx: Agent context
        recipient: Fetch address (fetch1...) or agent address (agent1q...)
        amount_afet: Amount in atestfet (1 FET = 10^18)

    Returns:
        Transaction hash
    """
    tx = Transaction()
    tx.add_message(
        type_url="/cosmos.bank.v1beta1.MsgSend",
        from_address=str(ctx.wallet.address()),
        to_address=recipient,
        amount=[{"denom": "atestfet", "amount": str(amount_afet)}]
    )

    # Sign and broadcast
    tx.seal(
        signing_cfgs=[ctx.wallet.signer()],
        fee="50000atestfet",
        gas_limit=100000
    )
    tx.complete()

    submitted: SubmittedTx = ctx.ledger.broadcast_tx(tx)
    ctx.logger.info(f"Sent {amount_afet} atestfet to {recipient}: {submitted.tx_hash}")
    return submitted.tx_hash
```

### Denomination

```
TESTNET: "atestfet" (1 FET = 10^18 atestfet)
MAINNET: "afet"     (1 FET = 10^18 afet)

Example: 0.01 FET = 10_000_000_000_000_000 atestfet
```

---

## Commerce Layer (Genesis Template)

The genesis template includes a complete commerce stack inline. These classes are
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

To use the commerce layer, scaffold with the genesis template:

```bash
agentlaunch scaffold myagent --type genesis
# Or with a preset:
agentlaunch scaffold oracle-agent --type genesis --preset oracle
```

See `.claude/rules/genesis-network.md` for the 7 preset roles and build order.

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
7. **Use official payment protocol** -- Import from `uagents_core.contrib.protocols.payment`, not custom models
