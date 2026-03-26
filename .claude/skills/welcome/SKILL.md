# Welcome — Show Status & Choose Your Path

> Run automatically when Claude Code starts, or manually with `/welcome`

---

## What This Does

1. **Shows everything the user already has** — agents, tokens, wallet, swarm status
2. **Offers three paths** — single agent, marketing team, or alliance swarm
3. **Guides them to the right choice**

---

## Execution

### Step 1: Gather Current Status

Run these checks silently:

```bash
# Check wallet
npx agentlaunch wallet balances 2>/dev/null || echo "No wallet configured"

# List their agents (from Agentverse)
npx agentlaunch list --mine 2>/dev/null || echo "No agents yet"

# Check if .env exists
test -f .env && echo "API key configured" || echo "No .env file"
```

### Step 2: Display Status

Show a clear summary:

```
╭────────────────────────────────────────────────────────────────╮
│                   AGENT LAUNCH TOOLKIT                         │
│                   agent-launch.ai                              │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  YOUR STATUS                                                   │
│  ───────────                                                   │
│  Wallet:     0x1234...5678 (150.5 FET, 0.02 BNB)              │
│  Agents:     3 on Agentverse                                   │
│  Tokens:     1 deployed ($MYAGENT at 1,200 FET raised)        │
│  Swarm:      None active                                       │
│                                                                │
│  RECENT ACTIVITY                                               │
│  ───────────────                                               │
│  • joke-teller: 45 queries today, 0.9 FET earned              │
│  • price-monitor: Running, last alert 2h ago                   │
│                                                                │
╰────────────────────────────────────────────────────────────────╯
```

If no agents/wallet yet:
```
╭────────────────────────────────────────────────────────────────╮
│  YOUR STATUS                                                   │
│  ───────────                                                   │
│  Wallet:     Not configured                                    │
│  Agents:     None yet                                          │
│  API Key:    Not set                                           │
│                                                                │
│  Let's get you started!                                        │
╰────────────────────────────────────────────────────────────────╯
```

### Step 3: Show the Three Paths

```
╭────────────────────────────────────────────────────────────────╮
│                   WHAT DO YOU WANT TO BUILD?                   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  1. SINGLE AGENT                                               │
│     Chat + memory, deployed in 90 seconds                      │
│     Cost: 120 FET to tokenize                                  │
│     Best for: Getting started, specific use cases              │
│     Command: npx agentlaunch                                   │
│                                                                │
│  2. MARKETING TEAM                                             │
│     7 agents that grow your ecosystem                          │
│     Writer, Social, Community, Analytics, Outreach, Ads,       │
│     Strategy — all working together                            │
│     Cost: 840 FET (7 × 120)                                    │
│     Best for: Content, community, growth                       │
│     Command: /build-swarm marketing                            │
│                                                                │
│  3. ALLIANCE SWARM (ASI Alliance Members)                      │
│     27 agents for the full Fetch.ai + SingularityNET ecosystem│
│     CEO, CTO, CFO, COO, CRO + 22 specialists                  │
│     Cost: 3,240 FET (27 × 120)                                │
│     Best for: ASI Alliance ecosystem builders                  │
│     Command: /alliance                                         │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│  Type 1, 2, or 3 — or describe what you want to build         │
╰────────────────────────────────────────────────────────────────╯
```

### Step 4: Handle Choice

**If they choose 1 (Single Agent):**
```bash
npx agentlaunch
```
This runs the interactive flow: name → deploy → open editor

**If they choose 2 (Marketing Team):**
Invoke `/build-swarm` with marketing preset

**If they choose 3 (Alliance):**
Invoke `/alliance` skill

**If they describe something else:**
Use your judgment to scaffold the right template

---

## First-Time Setup

If no .env or API key:

```
╭────────────────────────────────────────────────────────────────╮
│  FIRST TIME SETUP                                              │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  1. Get your Agentverse API key:                               │
│     https://agentverse.ai/settings/api-keys                   │
│                                                                │
│  2. Set it up:                                                 │
│     npx agentlaunch init                                       │
│                                                                │
│  3. Get testnet tokens (free):                                 │
│     Message @gift on Agentverse: "claim 0x<your-wallet>"      │
│     You'll receive 200 TFET + 0.005 tBNB instantly            │
│                                                                │
╰────────────────────────────────────────────────────────────────╯
```

---

## Tone

- **Welcoming** — Make them feel at home
- **Clear** — Show exactly what they have and what's possible
- **Helpful** — Guide them to the right choice
- **Elegant** — Clean formatting, no clutter

This is their first impression. Make it great.
