# /tokenize -- Tokenize an Agent

Create a tradeable token for an existing Agentverse agent.

## Usage

```
/tokenize [agent_address] --name "Name" --symbol "SYM"
```

## Steps

1. **Get agent address**: If not provided, list the user's agents via
   GET /v1/hosting/agents and let them choose.
2. **Collect details**: name, symbol (ticker), description. Prompt for
   any missing values.
3. **Create token record**: Use the `create_token_record` MCP tool or
   POST /agents/tokenize with:
   - agentAddress, name, symbol, description
   - chainId (default: 97 for BSC Testnet)
4. **Return handoff link**: Show the deploy link and instructions.
5. **Explain next steps**:
   - Human clicks the link
   - Connects wallet (MetaMask, etc.)
   - Signs transaction (pays 120 FET deployment fee)
   - Token goes live on the bonding curve

## Notes

- The 120 FET deploy fee is paid by the human signer, not the agent.
- Trading fee: 2% per trade, 100% to protocol treasury (no creator fee).
- Token graduates to DEX at 30,000 FET liquidity.
