# Genesis Network — Swarm Guide

A step-by-step guide to building a network of AI agents that work together,
charge for services, and earn revenue through tokenization.

## What Is a Swarm?

A swarm is a group of specialized AI agents that collaborate. Instead of one
monolithic agent that does everything, you build small focused agents that
each do one thing well:

- **Oracle** fetches market data
- **Brain** does LLM reasoning
- **Analyst** scores tokens
- **Coordinator** routes queries to the right agent
- **Sentinel** monitors for anomalies
- **Launcher** finds gaps and recommends new agents
- **Scout** discovers agents worth tokenizing

Each agent runs independently on Agentverse, has its own wallet, and can
charge other agents (or humans) for its services.

## How Agents Discover Each Other

Agents on Agentverse communicate using the **Chat Protocol**. Every agent has
a unique address (like `agent1q...`). To connect agents:

1. Deploy each agent to Agentverse (each gets an address)
2. Set addresses as Agentverse secrets on dependent agents
3. Agents send messages via `ctx.send(address, message)`

Example: The Coordinator stores the Oracle's address as a secret and forwards
price queries to it:

```python
ORACLE_ADDRESS = os.environ.get("ORACLE_ADDRESS", "")

# When someone asks for a price...
await ctx.send(ORACLE_ADDRESS, ChatMessage(
    timestamp=datetime.now(),
    msg_id=uuid4(),
    content=[TextContent(type="text", text=f"price {token_address}")]
))
```

No service discovery protocol is needed. Addresses are set at deploy time.
The Coordinator maintains a directory of all known agents.

## How Commerce Flows

The Genesis template includes a full commerce stack. Here is the payment
flow between two agents:

```
1. Client sends query to Provider
2. Provider checks tier (free/premium based on token holdings)
3. Provider sends RequestPayment (amount, service, recipient wallet)
4. Client auto-approves if amount <= max_auto_pay
5. Client sends CommitPayment (with tx_hash)
6. Provider verifies payment and delivers service
7. Provider sends CompletePayment (with result)
```

The template tries to import the official payment protocol from
`uagents_core.contrib.protocols.payment`. If unavailable, it falls back to
custom Pydantic models with the same interface.

For simple swarms, you can skip the payment protocol entirely and just use
free tier access between your own agents.

## Recommended Starter Configuration

Start with these three agents. They form a complete entry point:

### 1. Oracle (deploy first)

The data foundation. Other agents depend on it.

```bash
npx agentlaunch scaffold my-oracle --type genesis
# Edit agent.py: set role to "oracle"
npx agentlaunch deploy
```

Cost: 120 FET deploy fee.

### 2. Brain (deploy second)

The reasoning layer. Needs a Hugging Face token for LLM access.

```bash
npx agentlaunch scaffold my-brain --type genesis
# Edit agent.py: set role to "brain"
# Set HF_TOKEN as an Agentverse secret
npx agentlaunch deploy
```

### 3. Coordinator (deploy third)

The entry point. Set ORACLE_ADDRESS and BRAIN_ADDRESS as secrets.

```bash
npx agentlaunch scaffold my-coordinator --type genesis
# Edit agent.py: set role to "coordinator"
# Set ORACLE_ADDRESS and BRAIN_ADDRESS as secrets
npx agentlaunch deploy
```

Now humans can talk to the Coordinator, which routes queries to Oracle or
Brain automatically.

## Adding Custom Agents

To add a new agent to an existing swarm:

1. Scaffold from the genesis template:
   ```bash
   npx agentlaunch scaffold my-agent --type genesis
   ```

2. Edit the `handle_business()` function in `agent.py`. This is where your
   unique logic goes. The commerce layers (payments, tiers, revenue) are
   already wired up above it.

3. Deploy to Agentverse:
   ```bash
   npx agentlaunch deploy
   ```

4. Register the new agent's address on the Coordinator (set as a secret).

5. Optionally tokenize:
   ```bash
   npx agentlaunch tokenize --agent <address> --name "MyAgent" --symbol "MINE"
   ```

## Funding Wallets

Every agent on Agentverse has a Fetch.ai wallet. To fund it:

### Testnet

Use the Fetch.ai faucet: https://faucet.fetch.ai/

### Mainnet

Send FET to the agent's wallet address. Find it in the agent's status page
on Agentverse, or query it via:

```python
address = str(ctx.wallet.address())
```

The Genesis template includes a `WalletManager` that:
- Checks balance via `ctx.ledger.query_bank_balance()`
- Alerts when balance drops below a minimum
- Reports balance in the `status` command

Denomination: 1 FET = 10^18 atestfet (testnet) or afet (mainnet).

## Monitoring Health

Every Genesis agent tracks health metrics automatically:

- **Uptime** — time since last restart
- **Request count** — total messages processed
- **Error rate** — percentage of failed requests
- **Balance** — current wallet balance
- **Effort mode** — normal, boost, or conserve (based on token metrics)

Query health via the `status` command:

```
> status
Status: healthy | Uptime: 3600s | Requests: 142 | Error rate: 1.4% | Balance: 50000000000000000 atestfet | Effort: normal
```

Background health checks run every `interval_seconds` (default: 300s).
The Sentinel agent adds anomaly detection on top of basic health monitoring.

## Revenue Tracking

The `RevenueTracker` logs every income and expense:

```
> revenue
Revenue Summary:
  All-time income: 50000000000000000 atestfet
  All-time expense: 10000000000000000 atestfet
  Net: 40000000000000000 atestfet
  Transactions: 27

Today (2026-02-26):
  Income: 5000000000000000 atestfet
  Expense: 0 atestfet
```

Revenue data is stored in `ctx.storage` and persists across restarts.

## Self-Awareness

If a token address is configured, the agent tracks its own market metrics:

- Current price on the bonding curve
- Number of token holders
- 7-day moving average price
- **Effort mode**: the agent adjusts behavior based on token performance
  - **boost** — price is above 7d MA by 10%+, agent works harder
  - **normal** — price is near the MA
  - **conserve** — price is below 7d MA by 10%+, agent conserves resources

This creates a feedback loop: better service attracts more token buyers,
which increases price, which tells the agent to work even harder.

## Platform Constants

These are baked into the AgentLaunch smart contracts:

| Constant | Value |
|----------|-------|
| Deploy fee | 120 FET |
| Graduation target | 30,000 FET (auto DEX listing) |
| Trading fee | 2% to protocol treasury |
| Creator fee | None (0%) |
| Total buy supply | 800,000,000 tokens |
| Default chain | BSC (Testnet: 97, Mainnet: 56) |

## Files in This Directory

| File | Role | Services |
|------|------|----------|
| `oracle.py` | Market data | price_feed, ohlc_history, market_summary |
| `brain.py` | LLM reasoning | reason, classify, summarize |
| `analyst.py` | Token scoring | score_token, evaluate_quality, rank_tokens |
| `coordinator.py` | Query routing | route_query, discover_agents |
| `sentinel.py` | Anomaly detection | monitor, alert, anomaly_report |
| `launcher.py` | Gap finding | find_gap, scaffold_agent, deploy_recommendation |
| `scout.py` | Agent discovery | discover_agents, evaluate_agent, tokenize_recommendation |

Each file is a complete, runnable agent. Deploy any of them to Agentverse
as-is, or use them as reference when building from the genesis template.
