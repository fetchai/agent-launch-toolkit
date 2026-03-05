# Telegram Bot Agent

Connect any Agentverse agent to Telegram. Two approaches:

1. **Polling** (simple) -- agent polls Telegram every 10s from Agentverse. No extra infra.
2. **Cloudflare relay** (instant) -- Cloudflare Worker receives Telegram webhooks, forwards to your agent via Chat Protocol. Sub-second responses.

## Quick Start (Polling)

### 1. Create a Telegram bot

Open Telegram, search **@BotFather**, send `/newbot`, follow the prompts. Copy the token.

### 2. Deploy the agent

```bash
# Option A: use the deploy script
npx ts-node examples/agents/telegram-bot/deploy.ts

# Option B: use the CLI
npx agentlaunch telegram-bot --local
# then copy agent.py contents and deploy manually
```

### 3. Set the secret on Agentverse

Go to [agentverse.ai](https://agentverse.ai) > your agent > Secrets:

```
Name:   TELEGRAM_BOT_TOKEN
Value:  <your token from BotFather>
```

### 4. Start the agent

Start (or restart) the agent on Agentverse. Message your bot on Telegram -- it responds within ~10 seconds.

## How It Works

```
Telegram <──> Telegram Bot API <──> Agentverse Agent (polls every 10s)
                                        |
                                    ctx.storage (offset, stats)
```

- `@agent.on_interval(period=10.0)` calls `getUpdates()` every 10 seconds
- Processes each message through `process_message()`
- Responds via `sendMessage()`
- Stores the update offset in `ctx.storage` to avoid duplicates
- Also handles Agentverse Chat Protocol -- works on both platforms

## Customizing

Edit `process_message()` in `agent.py` -- that's where your agent's logic goes:

```python
def process_message(text: str, username: str, ctx: Context) -> str:
    # Add your logic here:
    # - Call an LLM API (OpenAI, ASI:One, HuggingFace)
    # - Query token prices via AgentLaunch API
    # - Look up on-chain data
    # - Manage conversation memory with ctx.storage
    return "your response"
```

## Instant Responses with Cloudflare Worker

The 10s polling delay is an Agentverse limitation (`on_interval` minimum is 10s).
For sub-second responses, deploy a tiny Cloudflare Worker as a webhook relay:

```
Telegram --> Cloudflare Worker --> Chat Protocol --> Agentverse Agent
                                                <-- response
         <-- sendMessage to Telegram
```

### Deploy the relay

```bash
# Install Wrangler (Cloudflare CLI)
npm install -g wrangler

# Create the worker
mkdir tg-relay && cd tg-relay
wrangler init --yes

# Copy the worker code from cloudflare-relay/worker.js into src/index.js
# Then set your secrets:
wrangler secret put TELEGRAM_BOT_TOKEN
wrangler secret put AGENT_ADDRESS

# Deploy
wrangler deploy

# Register webhook with Telegram
curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://tg-relay.<you>.workers.dev/webhook"
```

See `cloudflare-relay/worker.js` for the full ~30 line worker.

## Files

| File | Description |
|------|-------------|
| `agent.py` | Agentverse agent with Telegram polling + Chat Protocol |
| `deploy.ts` | One-command deploy script |
| `cloudflare-relay/worker.js` | Cloudflare Worker for instant responses |

## Secrets Required

| Secret | Where | Description |
|--------|-------|-------------|
| `TELEGRAM_BOT_TOKEN` | Agentverse + `.env` | From @BotFather |
| `AGENT_ADDRESS` | Cloudflare Worker (relay only) | Your agent's `agent1q...` address |
