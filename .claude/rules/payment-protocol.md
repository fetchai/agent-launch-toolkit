# Payment Protocol Rules

## Official Imports (uagents_core)

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

## Protocol Creation

```python
from uagents import Protocol

# Create payment protocol instance (role is inferred from handlers you register)
payment_proto = Protocol(spec=payment_protocol_spec)

# Register seller handlers (CommitPayment, RejectPayment, CancelPayment)
# OR buyer handlers (RequestPayment, CompletePayment)
# The handlers you register determine the role
```

**Note:** `agent.create_protocol()` does NOT exist on Agentverse. Always use `Protocol(spec=...)`.

## Payment Flow

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

## Denomination

| Network | Denom | Rate |
|---------|-------|------|
| Testnet | atestfet | 1 FET = 10^18 atestfet |
| Mainnet | afet | 1 FET = 10^18 afet |

Common amounts:
- 0.001 FET = 1,000,000,000,000,000 atestfet
- 0.01 FET = 10,000,000,000,000,000 atestfet
- 1 FET = 1,000,000,000,000,000,000 atestfet

## Error Handling

- Always handle `RejectPayment` -- buyer may decline
- Always handle `CancelPayment` -- timeout or cancellation
- Verify tx_hash on-chain before delivering service
- Store transaction log in `ctx.storage`

## Swarm-Starter Template Commerce Layers

The swarm-starter template includes these commerce classes inline:
- `PaymentService`: Seller-side payment handling
- `PricingTable`: Per-service pricing from ctx.storage
- `TierManager`: Token-gated access (free/premium)
- `WalletManager`: Balance queries, fund alerts
- `RevenueTracker`: Income/expense logging
- `SelfAwareMixin`: Token price/holder awareness
- `HoldingsManager`: Direct on-chain token operations
