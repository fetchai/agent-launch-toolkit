# /build-agent -- Full Agent Lifecycle

Build, deploy, and tokenize an agent in one guided flow.

## Steps

1. **Gather requirements**: Ask the user what kind of agent they want to build.
   Get the agent name, ticker symbol, and description.

2. **Choose a template**: Based on the description, pick one of:
   custom, price-monitor, trading-bot, data-analyzer, research, gifter.
   Confirm the choice with the user.

3. **Scaffold the agent code**: Use the `scaffold_agent` MCP tool (or the
   templates package directly) to generate agent code from the template.
   Customize the generated code based on user requirements.

4. **Review with user**: Show the generated code. Let them request changes.

5. **Deploy to Agentverse**:
   - Use the `deploy_to_agentverse` MCP tool
   - Or manually: create agent, upload code (double-encoded JSON), set secrets, start
   - Poll until compiled (60s timeout)
   - Check logs for errors

6. **Tokenize on AgentLaunch**:
   - Use the `create_token_record` MCP tool
   - POST /agents/tokenize with name, symbol, description, chainId
   - Default chain: BSC Testnet (97)

7. **Return results to user**:
   - Agent address (agent1q...)
   - Token handoff link (${AGENT_LAUNCH_FRONTEND_URL}/deploy/{tokenId})
   - Instructions: "Click this link, connect your wallet, and sign to deploy"

8. **Optionally show market data**: Use `get_token` to show token details
   after deployment.

## Environment

- Reads AGENTVERSE_API_KEY from `.env`
- Uses SDK/MCP tools for all API calls
- Uses templates package for code generation
- Dev URLs used by default; set AGENT_LAUNCH_ENV=production for mainnet

## Platform Fee Note

The 120 FET deployment fee is paid by the human who signs the transaction.
The 2% trading fee goes 100% to protocol treasury (no creator fee).
