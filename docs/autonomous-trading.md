# Autonomous On-Chain Trading

This guide walks you through setting up an agent that can buy and sell tokens on-chain without human intervention. Every AgentLaunch token is a **FETAgentCoin** — a smart contract that's both an ERC-20 token and a bonding curve in one. Your agent trades directly with the token contract, paying with FET (the Fetch.ai ERC-20 on BSC).

---

## How It Works

### Buying

```
Your agent's wallet has FET
  → Approve FET spend to the token contract
  → Call buyTokens(buyer, minTokensOut, fetAmount) on the token
  → Contract pulls FET, mints new tokens to your wallet
  → Price moves up on the bonding curve
```

### Selling

```
Your agent's wallet has tokens
  → Call sellTokens(amount) on the token contract
  → Contract burns your tokens, sends FET back
  → Price moves down on the bonding curve
  → No approval needed — the contract burns from msg.sender
```

### Fallback

If no private key is configured, `buy_via_web3()` and `sell_via_web3()` return a handoff link (`https://agent-launch.ai/trade/0x...?action=buy&amount=100`) instead of transacting. The agent can give this link to a human to sign manually. Everything degrades gracefully.

---

## Prerequisites

- An agent scaffolded with the **genesis** (swarm-starter) template
- A **BSC wallet** funded with FET and a small amount of BNB for gas
- The wallet's **private key** (see [Exporting Your Private Key](./private-key.md))

### Testnet Funding

For testing on BSC Testnet, you need TFET and tBNB:

| Token | How to Get |
|-------|-----------|
| **TFET** (150) + **tBNB** (0.01) | Message the [$GIFT agent](https://agentverse.ai/agents/details/agent1q2d0n5tp563wr0ugj9cmcqms9jfv5ks63xy5vg3evy5gy0z52e66xmeyyw9) with `claim 0xYourWalletAddress` |
| **tBNB** | [BSC Testnet Faucet](https://testnet.bnbchain.org/faucet-smart) |

---

## Step 1: Scaffold Your Agent

```bash
npx agentlaunch scaffold my-trader --type swarm-starter
```

Or with a Genesis Network preset:

```bash
npx agentlaunch scaffold oracle --type swarm-starter --preset oracle
```

The generated `agent.py` includes the full `HoldingsManager` class with `buy_via_web3()`, `sell_via_web3()`, and `get_balances()`.

---

## Step 2: Deploy to Agentverse

```bash
npx agentlaunch create
```

Follow the interactive prompts to deploy your agent. Note the agent address (`agent1q...`) — you'll need it in the next step.

---

## Step 3: Set the Private Key Secret

Your agent needs `BSC_PRIVATE_KEY` as an Agentverse secret. This is the BSC wallet it will trade from.

**Via the CLI:**

```bash
# Set the secret on your deployed agent
curl -X POST https://agentverse.ai/v1/hosting/secrets \
  -H "Authorization: Bearer $AGENTVERSE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "address": "agent1q...your-agent-address",
    "name": "BSC_PRIVATE_KEY",
    "secret": "0xYourPrivateKeyHere"
  }'
```

**Via the Agentverse UI:**

1. Go to https://agentverse.ai
2. Find your agent → **Settings** → **Secrets**
3. Add `BSC_PRIVATE_KEY` with your wallet's private key

> **Security:** Use a dedicated trading wallet with limited funds. Never use your main wallet. The private key is stored encrypted on Agentverse and is only accessible to your agent at runtime.

---

## Step 4: Fund the Trading Wallet

Send FET and BNB to the wallet address that corresponds to your private key.

**Testnet minimums:**
- **~1 TFET** per trade (bonding curve prices vary)
- **~0.005 tBNB** for gas per transaction

**To check your balances from agent code:**

```python
balances = holdings.get_balances(ctx, "0xSomeTokenAddress")
# Returns: {"bnb": 5000000000000000, "fet": 10000000000000000000, "token": 0, "wallet": "0x..."}
```

---

## Step 5: Write Your Trading Logic

Edit the `handle_business()` function or add an interval task in the generated `agent.py`. The commerce layers handle everything else — you just decide *when* and *what* to trade.

### Example: Buy on Command

```python
async def handle_business(ctx, sender, message, tier):
    lower = message.lower()

    if lower.startswith("buy "):
        # "buy 0xTokenAddress 5" → buy with 5 FET
        parts = message.split()
        if len(parts) >= 3:
            token_addr = parts[1]
            fet_amount = int(float(parts[2]) * 10**18)  # Convert FET to wei
            success, result = holdings.buy_via_web3(ctx, token_addr, fet_amount)
            if success:
                return f"Bought tokens. TX: {result}"
            return f"Buy failed: {result}"

    # ... rest of your logic
```

### Example: Autonomous Cross-Holdings on Interval

```python
# List of tokens this agent believes in
PORTFOLIO = [
    "0xAbc123...",  # Oracle's token
    "0xDef456...",  # Brain's token
]

@agent.on_interval(period=3600.0)  # Every hour
async def rebalance(ctx):
    for token_addr in PORTFOLIO:
        balances = holdings.get_balances(ctx, token_addr)

        # Buy if we have FET but no tokens
        if balances["fet"] > 5 * 10**18 and balances["token"] == 0:
            success, result = holdings.buy_via_web3(
                ctx, token_addr, 2 * 10**18,  # Spend 2 FET
                slippage_percent=5,
            )
            Logger.info(ctx, "AUTO_BUY", {
                "token": token_addr[:12],
                "success": success,
                "result": result[:60],
            })
```

### Example: Sell When Price Drops

```python
@agent.on_interval(period=300.0)  # Every 5 minutes
async def monitor_and_sell(ctx):
    self_aware.update(ctx)
    summary = self_aware.get_token_summary()

    # If our token price dropped 20% below 7-day MA, sell some holdings
    if summary["ma_7d"] > 0 and summary["price"] < summary["ma_7d"] * 0.8:
        for token_addr in PORTFOLIO:
            balances = holdings.get_balances(ctx, token_addr)
            if balances["token"] > 0:
                # Sell half our position
                sell_amount = balances["token"] // 2
                success, result = holdings.sell_via_web3(ctx, token_addr, sell_amount)
                Logger.info(ctx, "AUTO_SELL", {
                    "token": token_addr[:12],
                    "amount": sell_amount,
                    "success": success,
                })
```

---

## API Reference

### `HoldingsManager.buy_via_web3(ctx, token_address, fet_amount_wei, slippage_percent=5)`

Buy tokens on the bonding curve.

| Param | Type | Description |
|-------|------|-------------|
| `ctx` | `Context` | Agent context |
| `token_address` | `str` | Token contract address (`0x...`) |
| `fet_amount_wei` | `int` | FET to spend in wei (`1 FET = 10^18`) |
| `slippage_percent` | `int` | Max slippage tolerance (default 5%) |

**Returns:** `Tuple[bool, str]` — `(True, tx_hash)` on success, `(False, error_or_link)` on failure.

**What it does internally:**
1. Reads the FET token address from the contract (`FET_TOKEN()`)
2. Checks your FET balance — fails fast if insufficient
3. Checks existing allowance, approves FET to the token contract if needed
4. Queries `calculateTokensReceived()` on-chain for expected output
5. Applies slippage: `min_tokens = expected * (100 - slippage) / 100`
6. Calls `buyTokens(buyer, minTokens, fetAmount)` on the token contract
7. Waits for receipt and verifies `status == 1`

---

### `HoldingsManager.sell_via_web3(ctx, token_address, token_amount)`

Sell tokens back to the bonding curve.

| Param | Type | Description |
|-------|------|-------------|
| `ctx` | `Context` | Agent context |
| `token_address` | `str` | Token contract address (`0x...`) |
| `token_amount` | `int` | Number of tokens to sell in wei |

**Returns:** `Tuple[bool, str]` — `(True, tx_hash)` on success, `(False, error_or_link)` on failure.

**What it does internally:**
1. Checks your token balance — fails fast if insufficient
2. Calls `sellTokens(tokenAmount)` on the token contract (no approval needed)
3. Waits for receipt and verifies success

---

### `HoldingsManager.get_balances(ctx, token_address="")`

Check wallet balances.

| Param | Type | Description |
|-------|------|-------------|
| `ctx` | `Context` | Agent context |
| `token_address` | `str` | Optional token address to check balance of |

**Returns:** `Dict` with keys:
- `bnb` — BNB balance in wei
- `fet` — FET balance in wei
- `token` — Token balance in wei (0 if no address provided)
- `wallet` — The wallet address

---

### `HoldingsManager.generate_buy_link(token_address, amount=0)`

Generate a handoff link for a human to sign a buy.

**Returns:** `str` — e.g. `Sign here: https://agent-launch.ai/trade/0x...?action=buy&amount=100`

---

### `HoldingsManager.generate_sell_link(token_address, amount=0)`

Generate a handoff link for a human to sign a sell.

**Returns:** `str` — e.g. `Sign here: https://agent-launch.ai/trade/0x...?action=sell&amount=100`

---

## The Contract Interface

Every AgentLaunch token is a `FETAgentCoin` that exposes these functions:

| Function | Description |
|----------|-------------|
| `buyTokens(buyer, slippageAmount, _buyAmount)` | Buy tokens with FET. Approve FET first. |
| `sellTokens(tokenAmount)` | Sell tokens for FET. No approval needed. |
| `FET_TOKEN()` | Returns the FET ERC-20 address on this chain |
| `calculateTokensReceived(fetAmount)` | Preview how many tokens a given FET amount buys |

The token contract handles the bonding curve math, FET transfers, and token minting/burning internally. There is no separate router or DEX contract.

**Trading fee:** 2% on every trade, sent 100% to the protocol treasury. There is no creator fee.

---

## Genesis Network: Agents Trading Each Other

The primary use case for autonomous trading is the Genesis Network — a swarm of 7 agents that create economic alignment through cross-holdings:

| Agent | Buys | Why |
|-------|------|-----|
| Oracle ($DATA) | Brain, Analyst | They consume its data feeds |
| Brain ($THINK) | Oracle | Needs data for reasoning |
| Analyst ($RANK) | Oracle, Brain | Needs data and reasoning for analysis |
| Coordinator ($COORD) | All | Routes queries, benefits from all agents |
| Sentinel ($WATCH) | Oracle | Needs price data for monitoring |
| Launcher ($BUILD) | Scout | Scouts find agents for it to build |
| Scout ($FIND) | Launcher | Launcher builds what Scout discovers |

Cross-holdings mean agents have skin in each other's game. If Oracle provides bad data, Brain's token drops, and Oracle loses value on its Brain holdings. This creates natural accountability without governance overhead.

---

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| Returns a handoff link instead of transacting | `BSC_PRIVATE_KEY` not set | Set the secret on Agentverse (Step 3) |
| "Insufficient FET" | Wallet doesn't have enough FET | Fund the wallet (Step 4) |
| "Cannot connect to BSC RPC" | Default RPC is down | Set `BSC_RPC` secret to an alternate endpoint |
| Transaction reverted | Slippage too tight or insufficient gas | Increase `slippage_percent` or add more BNB |
| "Insufficient tokens" on sell | Trying to sell more than you hold | Check `get_balances()` first |

---

## Security Notes

- Use a **dedicated trading wallet** with limited funds — never your main wallet
- The private key is stored as an encrypted Agentverse secret, accessible only at agent runtime
- Start with small amounts on **BSC Testnet** (chain ID 97) before moving to mainnet
- The agent never exposes the private key in logs or responses — it's read from `os.environ` at transaction time
- Slippage protection is on by default (5%) to prevent sandwich attacks
