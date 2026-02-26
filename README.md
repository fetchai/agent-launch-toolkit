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
? Agent name: PriceBot
? Ticker symbol: PBOT
? Describe what your agent does: Monitors FET price and sends alerts
? Agentverse API key: av-xxx...

  What are you building?

    1) Quick Start         Deploy your first agent in 5 minutes
    2) Agent Swarm         Build a team of agents that pay each other
    3) Genesis Network     The full 7-agent economy

  Choose (1/2/3): 1

Scaffolding agent: PriceBot
  Created: agent.py
  Created: CLAUDE.md
  Created: .claude/ (settings, rules, skills)

Launching Claude Code...
```

That's it. Your agent is scaffolded and ready. Say `/deploy` in Claude Code to push it live.

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
  Available agent presets:

    1) Oracle         Market data provider (0.001 FET/call)
    2) Brain          LLM reasoning engine (0.01 FET/call)
    3) Analyst        Token scoring & evaluation (0.005 FET/call)
    4) Coordinator    Query routing (0.0005 FET/call)

  Enter numbers (comma-separated): 1,2,4

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

  Swarm deployment complete!
  Deployed: 3/3 agents
```

Agents share addresses as secrets and can call each other's services.

---

## Genesis Network (30 minutes)

The full 7-agent economy. Choose option 3:

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
| **CLI** | 10 commands, full lifecycle |
| **MCP Server** | 17+ tools for Claude Code |
| **Templates** | 7 agent blueprints + 7 presets |

### Templates

| Template | Description |
|----------|-------------|
| `genesis` | **Full commerce stack** — PaymentService, PricingTable, TierManager, WalletManager (recommended) |
| `custom` | Blank Chat Protocol boilerplate |
| `price-monitor` | Watch prices, send alerts |
| `trading-bot` | Buy/sell signals |
| `data-analyzer` | On-chain analysis |
| `research` | Deep dives, reports |
| `gifter` | Treasury + rewards |

---

## CLI Commands

```bash
npx agentlaunch create               # Interactive wizard
npx agentlaunch scaffold MyBot       # Generate from template
npx agentlaunch deploy agent.py      # Deploy to Agentverse
npx agentlaunch tokenize agent1q...  # Create token + handoff link
npx agentlaunch list                 # Browse tokens
npx agentlaunch status 0x...         # Check price/progress
```

All commands support `--json` for machine-readable output.

---

## SDK (TypeScript)

```typescript
import { AgentLaunch } from 'agentlaunch-sdk';

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
const price = await al.market.getPrice('0x...');
const buy = await al.market.calculateBuy('0x...', '100');

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

**MCP Tools:** 17+ tools auto-configured in `.claude/settings.json`

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
