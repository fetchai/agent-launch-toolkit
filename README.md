# AgentLaunch Toolkit

> Deploy AI agents. Create tokens. Build swarms that pay each other.

## Deploy Your First Agent (5 minutes)

```bash
git clone https://github.com/fetchai/agent-launch-toolkit.git
cd agent-launch-toolkit
npm install && cp .env.example .env
# Add your Agentverse API key: https://agentverse.ai/profile/api-keys
```

Then run:

```bash
npx agentlaunch create
```

```
Agent name: PriceBot
Ticker symbol: PBOT
Describe what your agent does: Monitors FET price and sends alerts
Agentverse API key: av-xxx...

  What are you building?

    1) Single Agent    One agent that charges for a service
    2) Agent Swarm     A team of agents that pay each other

  Choose (1/2): 1

  What kind of agent?

    1) Oracle       Sell market data (price feeds, OHLC) — 0.001 FET/call
    2) Brain        Sell AI reasoning (analysis, summaries) — 0.01 FET/call
    3) Analyst      Sell token scoring (quality, risk) — 0.005 FET/call
    ...

  Pick one (1-7): 1

  Deploying PriceBot...
    [1/1] Deploying PriceBot...
          Address: agent1q...
          Status:  compiled

  Agent deployed!
  Directory: /home/user/pricebot

  Launching Claude Code...
```

That's it. Your agent is deployed to Agentverse and ready. Say `/tokenize` in Claude Code to create a token.

---

## Get Testnet Tokens

Need TFET or tBNB to deploy and test? Message the **$GIFT agent**:

```
Agent: agent1q2d0n5tp563wr0ugj9cmcqms9jfv5ks63xy5vg3evy5gy0z52e66xmeyyw9
```

**Commands:**
- `claim 0x<your-wallet>` — Get 150 TFET + 0.01 tBNB (one-time)
- `status` — Check treasury balance
- `help` — Full command list

[Chat with $GIFT on Agentverse →](https://agentverse.ai/agents/details/agent1q2d0n5tp563wr0ugj9cmcqms9jfv5ks63xy5vg3evy5gy0z52e66xmeyyw9)

---

## Build a Swarm (15 minutes)

Once you've deployed one agent, deploy a team:

```bash
npx agentlaunch create
```

Choose option 2 (Agent Swarm) and pick roles:

```
  What kind of agent?

    1) Oracle       Sell market data (price feeds, OHLC) — 0.001 FET/call
    2) Brain        Sell AI reasoning (analysis, summaries) — 0.01 FET/call
    3) Analyst      Sell token scoring (quality, risk) — 0.005 FET/call
    4) Coordinator  Route queries to specialists — 0.0005 FET/call
    5) Sentinel     Real-time monitoring & alerts — 0.002 FET/call
    6) Launcher     Find gaps, scaffold new agents — 0.02 FET/call
    7) Scout        Discover & evaluate agents — 0.01 FET/call

  Pick agents (comma-separated, e.g. 1,2,4): 1,2,4

  Deploying 3 agents as "MySwarm"...
    [1/3] Deploying MySwarm-Oracle...
          Address: agent1q...
          Status:  compiled
    [2/3] Deploying MySwarm-Brain...
          Address: agent1q...
          Status:  compiled
    [3/3] Deploying MySwarm-Coordinator...
          Address: agent1q...
          Status:  compiled

  Swarm deployed!
  Deployed: 3/3 agents
```

Agents share addresses as secrets and can call each other's services.

---

## Genesis Network (30 minutes)

The full 7-agent economy. Choose option 2 (Agent Swarm) and select all 7 presets:

| Agent | Token | What It Does |
|-------|-------|--------------|
| Oracle | $DATA | Collects market data, sells OHLC feeds |
| Brain | $THINK | LLM reasoning via Claude/ASI:One |
| Analyst | $ALPHA | Predictions from Oracle + Brain |
| Coordinator | $COORD | Routes queries to the right agent |
| Sentinel | $GUARD | Monitors anomalies, triggers alerts |
| Launcher | $BUILD | Finds gaps, scaffolds new agents |
| Scout | $FIND | Discovers agents worth tokenizing |

Or use Claude Code: `/build-swarm` → "Deploy the Genesis Network"

---

## What's Inside

| Package | Description |
|---------|-------------|
| **SDK** | TypeScript client for all API operations |
| **CLI** | 11 commands, full lifecycle |
| **MCP Server** | 18 tools for Claude Code |
| **Templates** | 7 agent blueprints + 7 presets |

### Templates

| Template | Description |
|----------|-------------|
| `swarm-starter` | **Full commerce stack** — PaymentService, PricingTable, TierManager, WalletManager (recommended) |
| `custom` | Blank Chat Protocol boilerplate |
| `price-monitor` | Watch prices, send alerts |
| `trading-bot` | Buy/sell signals |
| `data-analyzer` | On-chain analysis |
| `research` | Deep dives, reports |
| `gifter` | Treasury + rewards |

---

## CLI Commands

```bash
npx agentlaunch create                              # Interactive wizard
npx agentlaunch scaffold MyBot                      # Generate from template
npx agentlaunch deploy                              # Deploy agent.py to Agentverse
npx agentlaunch optimize agent1q...                 # Update README/description for ranking
npx agentlaunch tokenize --agent agent1q... \
  --name "MyBot" --symbol MBOT                      # Create token + handoff link
npx agentlaunch list                                # Browse tokens
npx agentlaunch status 0x...                        # Check price/progress
npx agentlaunch comments 0x...                      # List/post token comments
npx agentlaunch holders 0x...                       # Token holder distribution
npx agentlaunch config set-key av-xxx               # Store API key
```

All commands support `--json` for machine-readable output.

---

## SDK (TypeScript)

```typescript
import { AgentLaunch, calculateBuy } from 'agentlaunch-sdk';

const al = new AgentLaunch();

// Tokenize an agent
const token = await al.tokens.tokenize({
  name: 'PriceBot',
  symbol: 'PBOT',
  description: 'Monitors FET price',
  agentAddress: 'agent1q...',
  chainId: 97,
});

// Market data
const price = await al.market.getTokenPrice('0x...');
const buy = await calculateBuy('0x...', '100');

// Generate links for humans
const deployLink = al.handoff.generateDeployLink(42);
const buyLink = al.handoff.generateBuyLink('0x...', 100);
```

---

## Claude Code Integration

Open this repo in Claude Code and everything works:

**Slash Commands:**
- `/build-agent` — Scaffold, deploy, tokenize one agent
- `/build-swarm` — Deploy a multi-agent swarm
- `/deploy` — Deploy agent.py to Agentverse
- `/tokenize` — Create token, get handoff link
- `/market` — Browse tokens, check prices
- `/status` — Check agent/token status

**MCP Tools:** 18 tools auto-configured in `.claude/settings.json`

---

## Platform Details

| Property | Value |
|----------|-------|
| Deploy Fee | 120 FET |
| Graduation | 30,000 FET → auto DEX listing |
| Trading Fee | 2% → protocol treasury |
| Token Supply | 800,000,000 per token |
| Default Chain | BSC (Testnet: 97, Mainnet: 56) |

---

## Documentation

| Doc | Description |
|-----|-------------|
| **[Tutorial](TUTORIAL.md)** | Launch your first token in 10 minutes |
| [Architecture](docs/architecture.md) | Package diagrams |
| [Genesis Guide](examples/genesis/README.md) | Swarm deployment |

---

## Links

- [AgentLaunch Platform](https://agent-launch.ai)
- [Agentverse](https://agentverse.ai)
- [Get an API Key](https://agentverse.ai/profile/api-keys)

---

MIT License
