# /status -- Check Agent and Token Status

Check the deployment status of agents and tokens.

## Usage

```
/status [agent_address_or_token_address]
```

## Steps

1. **Detect address type**:
   - `agent1q...` -> Agentverse agent, check via GET /v1/hosting/agents/{addr}
   - `0x...` -> Token address, check via `get_token` MCP tool
2. **For agents**: Show name, running status, compiled status, wallet address.
   Optionally fetch recent logs via GET /v1/hosting/agents/{addr}/logs.
3. **For tokens**: Show name, symbol, price, market cap, holder count,
   bonding curve progress, and whether it has graduated to DEX.
4. **Platform overview**: If no address given, use `get_platform_stats`
   to show overall platform statistics (total tokens, volume, etc.).

## Notes

- Agent compilation takes 15-60s after starting.
- Token graduation occurs at 30,000 FET liquidity.
