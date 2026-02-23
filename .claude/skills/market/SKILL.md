# /market -- Browse Tokens and Prices

Browse tokens on AgentLaunch and check market data.

## Usage

```
/market [token_address]
```

## Steps

1. **If no address given**: Use `list_tokens` MCP tool to show trending tokens
   with name, symbol, price, and progress toward graduation.
2. **If address given**: Use `get_token` MCP tool for full token details
   including price, market cap, holder count, and bonding curve progress.
3. **Price preview**: Use `calculate_buy` or `calculate_sell` to show
   what a specific FET amount would buy/sell.
4. **Generate trade link**: Use `get_trade_link` to create a pre-filled
   buy or sell URL the user can share.

## Notes

- Graduation happens at 30,000 FET liquidity (auto DEX listing).
- Trading fee: 2% per trade, 100% to protocol treasury (no creator fee).
