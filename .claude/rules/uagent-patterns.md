# uAgent Code Patterns

When writing Agentverse agent code:

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

## Payment Protocol Pattern

For agent-to-agent payments, create a custom protocol:

### Payment Messages (Pydantic Models)

```python
from uagents import Model
from pydantic import Field
import uuid

class PaymentRequest(Model):
    """Service provider requests payment from client."""
    request_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    amount_afet: int       # Amount in atestfet
    service: str           # Service being requested
    recipient: str         # Provider's wallet address

class PaymentCommit(Model):
    """Client commits to pay (agrees to price)."""
    request_id: str
    tx_hash: str = ""      # Filled after transfer

class PaymentComplete(Model):
    """Provider confirms payment received, delivers service."""
    request_id: str
    result: str            # Service result

class PaymentReject(Model):
    """Client rejects payment request."""
    request_id: str
    reason: str
```

### Payment Protocol Handler

```python
from uagents import Protocol

payment_proto = Protocol(name="payment", version="1.0.0")

# Track pending payments
pending_payments: dict[str, PaymentRequest] = {}

@payment_proto.on_message(model=PaymentRequest)
async def handle_payment_request(ctx: Context, sender: str, msg: PaymentRequest):
    """Client receives payment request — decide to commit or reject."""
    max_auto_pay = int(ctx.storage.get("max_auto_pay") or 10_000_000_000_000_000)  # 0.01 FET

    if msg.amount_afet <= max_auto_pay:
        # Auto-approve small payments — send FET
        tx_hash = await send_fet(ctx, msg.recipient, msg.amount_afet)
        await ctx.send(sender, PaymentCommit(
            request_id=msg.request_id,
            tx_hash=tx_hash
        ))
        ctx.logger.info(f"Auto-paid {msg.amount_afet} atestfet for {msg.service}")
    else:
        await ctx.send(sender, PaymentReject(
            request_id=msg.request_id,
            reason=f"Amount {msg.amount_afet} exceeds auto-pay limit"
        ))

@payment_proto.on_message(model=PaymentCommit)
async def handle_payment_commit(ctx: Context, sender: str, msg: PaymentCommit):
    """Provider receives payment — verify and deliver service."""
    if msg.request_id not in pending_payments:
        ctx.logger.warning(f"Unknown payment request: {msg.request_id}")
        return

    request = pending_payments.pop(msg.request_id)

    # Optionally verify tx_hash on chain
    # tx = ctx.ledger.query_tx(msg.tx_hash)

    # Deliver service
    result = "Service delivered successfully"

    # Track revenue
    total = int(ctx.storage.get("total_revenue") or 0)
    ctx.storage.set("total_revenue", str(total + request.amount_afet))

    await ctx.send(sender, PaymentComplete(
        request_id=msg.request_id,
        result=result
    ))

agent.include(payment_proto, publish_manifest=True)
```

### Charging for a Service

```python
async def charge_for_service(ctx: Context, client: str, service: str, amount_afet: int) -> str:
    """Request payment before delivering service."""
    request = PaymentRequest(
        amount_afet=amount_afet,
        service=service,
        recipient=str(ctx.wallet.address())
    )
    pending_payments[request.request_id] = request

    await ctx.send(client, request)
    return request.request_id
```

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

## Commerce Module Pattern

For Genesis Network agents, use these commerce modules:

```python
# commerce.py — Payment Service
class PaymentService:
    async def charge(ctx, sender, amount_afet, description) -> str
    async def pay(ctx, recipient, amount_afet, description) -> str
    async def get_balance(ctx) -> int

# pricing.py — Pricing Table
class PricingTable:
    def get_price(service_name) -> int  # Returns afet
    def set_price(service_name, amount_afet)

# tier.py — Premium Tiers
class TierManager:
    async def get_tier(ctx, sender) -> str  # "free" or "premium"

# revenue.py — Revenue Tracking
class RevenueTracker:
    def record_income(ctx, amount, source, service)
    def record_expense(ctx, amount, dest, service)
    def get_gdp_contribution(ctx) -> int

# wallet.py — Wallet Manager
class WalletManager:
    async def get_balance(ctx) -> int
    def get_address(ctx) -> str
    async def fund_check(ctx, min_balance) -> bool
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

1. **Double-encoded code upload** — When uploading via API, code must be JSON stringified twice
2. **ChatAcknowledgement required** — Always handle it, even if empty
3. **datetime.utcnow() deprecated** — Use `datetime.now()`
4. **Agent listing is `items`** — Response is `{ items: [...] }` not `{ agents: [...] }`
5. **Wait for compilation** — 15-60s after start before agent responds
6. **Balance in atestfet** — 1 FET = 10^18 atestfet, always use int not float
