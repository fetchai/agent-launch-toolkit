# Token Economics Reference

Bonding curve mechanics for AgentCoin tokens on the AgentLaunch platform.
Platform URL configured via `AGENT_LAUNCH_FRONTEND_URL` in `.env`.

## Token Distribution

```
Total Supply:     1,000,000,000 tokens (1 billion)
Bonding Curve:    800,000,000 (80%) — tradeable on the curve
DEX Reserve:      200,000,000 (20%) — locked for Uniswap liquidity
```

## Bonding Curve Formula

The bonding curve uses a **linear pricing model**:

```
Price = k * CurrentSupply
```

Where:
- `k` = curve coefficient (determines price sensitivity)
- `CurrentSupply` = tokens already sold from the 800M tradeable supply

### Price Dynamics

| Supply Sold | Approx Price | Market Cap |
|-------------|--------------|------------|
| 0 | ~0.00003 FET | 0 FET |
| 200M (25%) | ~0.015 FET | 3,000 FET |
| 400M (50%) | ~0.03 FET | 12,000 FET |
| 600M (75%) | ~0.045 FET | 27,000 FET |
| 800M (100%) | ~0.06 FET | 48,000 FET |

## Buy Mechanics

```
1. User sends FET to AgentCoin contract
2. Contract calculates tokens based on current price
3. 2% platform fee deducted
4. Tokens minted and transferred to user
5. FET added to contract's liquidity reserve
```

### Buy Formula

```python
def calculate_buy(fet_amount, current_supply):
    fee = fet_amount * 0.02  # 2% fee
    net_fet = fet_amount - fee

    # Integrate along bonding curve
    tokens_out = solve_bonding_integral(net_fet, current_supply)

    return tokens_out, fee
```

## Sell Mechanics

```
1. User sends tokens to AgentCoin contract
2. Contract calculates FET based on current price
3. 2% platform fee deducted
4. Tokens burned
5. FET transferred to user from liquidity reserve
```

### Sell Formula

```python
def calculate_sell(token_amount, current_supply):
    # Calculate FET from bonding curve
    gross_fet = solve_bonding_integral_reverse(token_amount, current_supply)

    fee = gross_fet * 0.02  # 2% fee
    net_fet = gross_fet - fee

    return net_fet, fee
```

## Graduation (Uniswap Listing)

When the liquidity reserve reaches **30,000 FET**, the token "graduates":

```
1. Trading on bonding curve pauses
2. 200M reserved tokens + accumulated FET sent to Uniswap V2
3. LP tokens burned (liquidity locked forever)
4. Token now trades on Uniswap with deep liquidity
5. Bonding curve contract becomes read-only
```

### Graduation Progress

```
Progress = (Current FET Reserve / 30,000) * 100%

Example:
  Reserve: 15,000 FET
  Progress: 50%
  Status: "Halfway to Uniswap!"
```

## Fee Distribution

```
Platform Fee: 2% on all buys and sells

Fee Split:
  - 100% to platform treasury (REVENUE_ACCOUNT)

Note: Referral fee splitting is not yet implemented.
See docs/referral.md for the proposal.
```

## Deployment Fee

```
Deploy Cost: 120 FET (one-time)
Paid to: FETAgentVerseDeployer contract
Purpose: Anti-spam, platform revenue
```

## Key Addresses (Base Mainnet)

```
FET Token:        0x74F804B4140ee70830B3Eef4e690325841575F89
Uniswap Router:   0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24
Revenue Account:  0xCA651edad1909aAB7DeE7013DDca9e985bFb42cD
Chain ID:         8453 (Base)
```

## Example: Full Token Lifecycle

```
1. Agent creates token record (POST /tokenize)
   → token_id = 42

2. Human deploys with 120 FET fee + optional 50 FET buy
   → 120 FET fee paid
   → 50 FET buys ~1.6M tokens at starting price
   → Human owns 1.6M tokens (0.2% of tradeable supply)

3. Token trades on bonding curve
   → More buys = price goes up
   → Sells = price goes down
   → Each trade: 2% fee

4. After many trades, reserve hits 30,000 FET
   → Token graduates to Uniswap
   → 200M tokens + 30K FET create liquidity pool
   → LP tokens burned

5. Token now trades on Uniswap
   → Deep liquidity from graduation
   → Standard DEX trading
   → Original holders can exit at market price
```

## Slippage Considerations

Large buys/sells move the price significantly on a bonding curve:

```
Small trade (10 FET):   ~0.1% slippage
Medium trade (100 FET): ~1% slippage
Large trade (1000 FET): ~5-10% slippage
```

**Recommendation**: For large trades, split into smaller chunks.

## Price Impact Formula

```python
def price_impact(trade_size, current_reserve):
    # Approximate impact on a linear curve
    impact_percent = (trade_size / current_reserve) * 50
    return min(impact_percent, 50)  # Cap at 50%
```

## API Endpoints for Economics

```
GET /token/{address}
Response includes:
  - price: current price in FET
  - price_usd: current price in USD
  - balance: FET in reserve
  - progress: 0-100 (% to graduation)
  - tokens_left: tradeable tokens remaining
  - market_cap: price * circulating supply
```
