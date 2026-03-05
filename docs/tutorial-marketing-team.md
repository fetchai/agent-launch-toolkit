# Tutorial: Build Your Own Marketing Team Swarm

> 7 AI agents. Each one does real work. They call each other. They charge FET.
> Deploy the whole team in one session.

---

## What You'll Build

A marketing team of autonomous AI agents:

```
  Writer ($WRITE)      Creates content          0.01 FET/call
  Social ($POST)       Posts to Twitter/X       0.005 FET/call
  Community ($COMM)    Manages Telegram         0.002 FET/call
  Analytics ($STATS)   Tracks engagement        0.005 FET/call
  Outreach ($REACH)    Sends pitch emails       0.01 FET/call
  Ads ($ADS)           Runs A/B tests           0.01 FET/call
  Strategy ($PLAN)     Coordinates everyone     0.02 FET/call
```

They talk to each other:
- Strategy asks Writer to create content, then tells Social to post it
- Social asks Writer for a tweet, then posts it to Twitter
- Outreach asks Writer for a pitch, then emails it via Resend
- Ads asks Writer for ad copy, then creates an A/B test

---

## Prerequisites

1. **Agentverse API key** -- get one at https://agentverse.ai/profile/api-keys
2. **ASI1 API key** -- for LLM content generation (https://asi1.ai)
3. **Node.js 18+** and **Python 3.10+**
4. **Clone the toolkit:**
   ```bash
   git clone https://github.com/anthropics/agent-launch-toolkit.git
   cd agent-launch-toolkit
   npm install && npm run build
   ```

### Optional API Keys (for full functionality)

| Key | Agent | What It Enables |
|-----|-------|-----------------|
| `TWITTER_API_KEY` + friends | Social, Analytics | Real Twitter posting and tracking |
| `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` | Community | Real Telegram group management |
| `RESEND_API_KEY` | Outreach | Real email delivery |

The agents work without these keys -- they just can't reach the external APIs.

---

## Step 1: Set Up Your Environment

Create `.env` in the project root:

```bash
cp .env.example .env
```

Add your keys:

```env
AGENTVERSE_API_KEY=your-agentverse-key
ASI1_API_KEY=your-asi1-key

# Optional
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id
```

---

## Step 2: Understand the Build Order

Agents have dependencies. Deploy them in order:

```
Level 0 (no dependencies):    Writer, Community
Level 1 (need Level 0):       Social (needs Writer), Analytics
Level 2 (need Level 0-1):     Outreach (needs Writer), Ads (needs Writer + Analytics)
Level 3 (needs everyone):     Strategy (coordinates all 6)
```

**Why?** Social needs Writer's address to request content. Strategy needs everyone's address to delegate work. You wire these as Agentverse secrets.

---

## Step 3: Deploy the Root Agents (Writer + Community)

The agent code lives in `examples/marketing-team/`. Each file is a complete, working agent.

### Deploy Writer

```bash
# Set API key
export $(grep '^AGENTVERSE_API_KEY' .env)

# 1. Create agent
curl -s -X POST "https://agentverse.ai/v1/hosting/agents" \
  -H "Authorization: Bearer $AGENTVERSE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "Writer Agent"}'
# Save the "address" from the response: agent1q...

# 2. Upload code (MUST be double-encoded JSON)
python3 -c "
import json
with open('examples/marketing-team/writer.py') as f:
    code = f.read()
payload = {'code': json.dumps([{'language': 'python', 'name': 'agent.py', 'value': code}])}
print(json.dumps(payload))
" > /tmp/writer.json

curl -s -X PUT "https://agentverse.ai/v1/hosting/agents/WRITER_ADDRESS/code" \
  -H "Authorization: Bearer $AGENTVERSE_API_KEY" \
  -H "Content-Type: application/json" \
  -d @/tmp/writer.json

# 3. Set secrets
export $(grep '^ASI1_API_KEY' .env)
curl -s -X POST "https://agentverse.ai/v1/hosting/secrets" \
  -H "Authorization: Bearer $AGENTVERSE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"address": "WRITER_ADDRESS", "name": "ASI1_API_KEY", "secret": "'$ASI1_API_KEY'"}'

curl -s -X POST "https://agentverse.ai/v1/hosting/secrets" \
  -H "Authorization: Bearer $AGENTVERSE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"address": "WRITER_ADDRESS", "name": "AGENTVERSE_API_KEY", "secret": "'$AGENTVERSE_API_KEY'"}'

# 4. Start
curl -s -X POST "https://agentverse.ai/v1/hosting/agents/WRITER_ADDRESS/start" \
  -H "Authorization: Bearer $AGENTVERSE_API_KEY"

# 5. Wait 30s, then verify
sleep 30
curl -s "https://agentverse.ai/v1/hosting/agents/WRITER_ADDRESS" \
  -H "Authorization: Bearer $AGENTVERSE_API_KEY" | python3 -c "
import json, sys
d = json.load(sys.stdin)
print(f'running={d[\"running\"]} compiled={d[\"compiled\"]}')
"
```

Replace `WRITER_ADDRESS` with the actual `agent1q...` address from step 1.

### Deploy Community

Same process with `community.py`. Set `TELEGRAM_BOT_TOKEN` instead of `ASI1_API_KEY`.

---

## Step 4: Deploy Level 1 (Social + Analytics)

Same process, but now you also set **peer address secrets** so they can find Writer:

```bash
# After creating and uploading Social agent code...

# Set WRITER_ADDRESS so Social can call Writer
curl -s -X POST "https://agentverse.ai/v1/hosting/secrets" \
  -H "Authorization: Bearer $AGENTVERSE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"address": "SOCIAL_ADDRESS", "name": "WRITER_ADDRESS", "secret": "WRITER_AGENT1Q_ADDRESS"}'
```

Analytics doesn't call other agents -- it just needs `AGENTVERSE_API_KEY` (and optionally `TWITTER_BEARER_TOKEN`).

---

## Step 5: Deploy Level 2 (Outreach + Ads)

Outreach needs: `ASI1_API_KEY`, `WRITER_ADDRESS`, (optionally `RESEND_API_KEY`)

Ads needs: `ASI1_API_KEY`, `WRITER_ADDRESS`, `ANALYTICS_ADDRESS`

---

## Step 6: Deploy Strategy (the coordinator)

Strategy needs ALL peer addresses:

```bash
# Set all 6 peer addresses
for PEER in WRITER COMMUNITY SOCIAL ANALYTICS OUTREACH ADS; do
  curl -s -X POST "https://agentverse.ai/v1/hosting/secrets" \
    -H "Authorization: Bearer $AGENTVERSE_API_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"address\": \"STRATEGY_ADDRESS\", \"name\": \"${PEER}_ADDRESS\", \"secret\": \"$PEER_AGENT_ADDRESS\"}"
done
```

---

## Step 7: Optimize Every Agent (DON'T SKIP THIS)

**This is the step most people skip.** It directly affects how visible your agents are in Agentverse and ASI:One search.

For each agent, set a README and short description:

```bash
curl -s -X PUT "https://agentverse.ai/v1/hosting/agents/AGENT_ADDRESS" \
  -H "Authorization: Bearer $AGENTVERSE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "readme": "# Writer Agent ($WRITE)\n\nAI content writer for the AgentLaunch Marketing Team...",
    "short_description": "AI content writer that creates blog posts and tweets via ASI1-mini."
  }'
```

### README Template

```markdown
# {Agent Name} (${SYMBOL})

{One-line value proposition}

## Services & Pricing

| Command | Price | Description |
|---------|-------|-------------|
| `blog <topic>` | 0.01 FET | Generate a blog post |
| `tweet <topic>` | 0.01 FET | Generate a tweet thread |

## Example Conversation

**You:** blog AI agent scaffolding
**Agent:** # AI Agent Scaffolding: The Future of Development...

**You:** help
**Agent:** Writer Agent ($WRITE) -- Content Creator. Commands: blog, tweet, newsletter, ad...

## Features

- Revenue tracking (`revenue` command)
- Wallet balance check (`balance` command)
- Self-awareness: reads own token price hourly

## Part of the AgentLaunch Marketing Team

7-agent swarm: Writer, Social, Community, Analytics, Outreach, Ads, Strategy.
Built with [AgentLaunch](https://agent-launch.ai).
```

### Also Do These (Manual)

1. **Set @handle** -- Go to your agent's page on Agentverse, click the handle area
   - Writer: `@writer`, Social: `@poster`, Strategy: `@strategist`
2. **Run 3+ test interactions** -- Chat with each agent on Agentverse
3. **Add avatar** -- Upload via Agentverse dashboard

---

## Step 8: Test Inter-Agent Communication

The real magic: agents calling each other.

### Test 1: Strategy delegates to Writer

Go to Strategy's page on Agentverse and send:
```
create blog AI agent scaffolding
```

Strategy calls Writer, Writer generates the blog post, Writer responds to Strategy, Strategy forwards to you.

### Test 2: Social auto-posts via Writer

Send to Social:
```
autopost AI agents are the future
```

Social calls Writer for a tweet, then posts it to Twitter (if API keys are set).

### Test 3: Strategy orchestrates a multi-step pipeline

Send to Strategy:
```
publish AI agent launch announcement
```

Strategy calls Writer for tweet content, then forwards it to Social for posting.

---

## Step 9: Tokenize (Optional)

Create tradeable tokens for your agents:

```bash
npx agentlaunch tokenize \
  --agent agent1q... \
  --name "Writer Agent" \
  --symbol WRITE \
  --chain 97
```

This gives you a handoff link. Open it, connect your wallet, pay 120 FET, and the token is live on a bonding curve.

At 30,000 FET liquidity, the token automatically lists on PancakeSwap.

---

## The Fast Way: Use Claude Code

Instead of manual curl commands, let Claude Code do it:

```bash
cd agent-launch-toolkit

# Open Claude Code, then say:
# "Deploy the 7 marketing team agents from examples/marketing-team/"
# Claude will deploy, set secrets, optimize, and verify all 7.
```

Or use the MCP tools:
```
Deploy examples/marketing-team/writer.py to Agentverse as "Writer Agent"
```

Or use the slash command:
```
/build-swarm
# Pick: Full marketing team (all 7)
```

---

## Starter Configurations

Don't need all 7? Start smaller:

| Configuration | Agents | Monthly Cost (est.) |
|--------------|--------|-------------------|
| **Content only** | Writer | ~0 FET (pay-per-use) |
| **Social presence** | Writer + Social | ~0 FET |
| **Community** | Writer + Community + Social | ~0 FET |
| **Analytics** | Writer + Social + Analytics | ~0 FET |
| **Full team** | All 7 | ~0 FET |

Agents only cost FET when someone uses their services. No idle costs.

---

## Customizing Agents

The example agents in `examples/marketing-team/` are production-ready starting points. To customize:

### Change the LLM prompt

Edit the `SYSTEM_PROMPT` in any agent:

```python
SYSTEM_PROMPT = (
    "You are a marketing content writer for {YOUR_BRAND}. "
    "Write engaging content about {YOUR_PRODUCT}."
)
```

### Add new commands

Add a new `if lower.startswith("mycommand ")` block in the `handle_chat` function:

```python
if lower.startswith("mycommand "):
    topic = text.split(maxsplit=1)[1].strip()
    result = my_custom_function(topic)
    log_revenue(ctx, sender, "mycommand", 0.01)
    await reply(ctx, sender, result, end=True)
    return
```

### Add new services to pricing

Update the help text and add the command handler. Pricing is tracked via `log_revenue()`.

### Wire new peer agents

Add entries to the `PEERS` dict:

```python
PEERS = {
    "writer": os.environ.get("WRITER_ADDRESS", ""),
    "my_new_agent": os.environ.get("MY_NEW_AGENT_ADDRESS", ""),
}
```

---

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| "Could not validate credentials" | Bad API key | Check AGENTVERSE_API_KEY in .env |
| Agent stuck in "compiling" | Syntax error in code | Check logs: `GET /v1/hosting/agents/{addr}/logs/latest` |
| "Invalid code format" | Code not double-encoded | Use `json.dumps()` on the code array |
| Agent not responding to chat | Not registered on Almanac | Wait 60s after start, check logs |
| Inter-agent calls not working | Missing peer address secret | Set WRITER_ADDRESS etc. as Agentverse secrets |
| `ctx.wallet` error | Wrong wallet access | Use `agent.wallet` not `ctx.wallet` |

---

## Reference: Agent Addresses

After deploying, record all addresses here:

```
WRITER_ADDRESS=agent1q...
COMMUNITY_ADDRESS=agent1q...
SOCIAL_ADDRESS=agent1q...
ANALYTICS_ADDRESS=agent1q...
OUTREACH_ADDRESS=agent1q...
ADS_ADDRESS=agent1q...
STRATEGY_ADDRESS=agent1q...
```

You'll need these to wire peer secrets and for tokenization.

---

## What's Next

1. **Test all commands** -- Send `help` to each agent, try every command
2. **Add real API keys** -- Twitter, Telegram, Resend for full functionality
3. **Tokenize** -- Create tokens for each agent ($WRITE, $POST, $COMM, etc.)
4. **Cross-holdings** -- Have Strategy buy Writer tokens, Writer buy Analytics tokens
5. **Monitor** -- Use `npx agentlaunch status 0x...` to track token performance
6. **Iterate** -- Improve agent quality based on Analytics feedback

---

*Built with the [AgentLaunch Toolkit](https://github.com/anthropics/agent-launch-toolkit). Runs on [Fetch.ai](https://fetch.ai) and [Agentverse](https://agentverse.ai).*
