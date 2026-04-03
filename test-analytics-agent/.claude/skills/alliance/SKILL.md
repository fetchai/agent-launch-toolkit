# /alliance — Deploy the ASI Alliance Agent Economy

> **Secret command for ASI Alliance members.**
> Deploys 27 agents representing every team in the Fetch.ai + SingularityNET ecosystem.

---

## What This Does

Deploys the complete Agent Economy in the correct sequence:

```
Wave 1 (Sequential):  CTO → CFO → COO → CEO → CRO         (5 agents)
Wave 2 (Parallel):    GUIDE, RANK, COACH, CONC, BRAND, DEV, GRANT  (7 agents)
Wave 3 (Parallel):    All 15 SingularityNET ecosystem agents       (15 agents)
```

**Total:** 27 agents, 3,240 FET deploy cost

---

## Execution

When the user types `/alliance`, follow this flow:

### Step 1: Confirm Identity

Ask: "This deploys the full ASI Alliance economy (27 agents, ~3,240 FET). Are you ready?"

If they confirm, proceed.

### Step 2: Check Prerequisites

```bash
# Check wallet balance
npx agentlaunch wallet balances

# Need: ≥3,500 FET (3,240 deploy + 270 seeding)
```

If insufficient funds, suggest:
- Claim from @gift agent (200 TFET)
- Or provide a funding link

### Step 3: Deploy Wave 1 — C-Suite (Sequential)

Deploy in this exact order (dependencies matter):

```bash
# 1. CTO first — everyone pays for reasoning
npx agentlaunch scaffold the-cto --type swarm-starter --preset cto
npx agentlaunch deploy the-cto/

# 2. CFO — treasury monitoring
npx agentlaunch scaffold the-cfo --type swarm-starter --preset cfo
npx agentlaunch deploy the-cfo/

# 3. COO — operations
npx agentlaunch scaffold the-coo --type swarm-starter --preset coo
npx agentlaunch deploy the-coo/

# 4. CEO — routing (depends on CTO, CFO)
npx agentlaunch scaffold the-ceo --type swarm-starter --preset ceo
npx agentlaunch deploy the-ceo/

# 5. CRO — recruitment (depends on CTO)
npx agentlaunch scaffold the-cro --type swarm-starter --preset cro
npx agentlaunch deploy the-cro/
```

After each deploy:
- Set README + short_description (Phase 3 Optimize)
- Record agent address
- Confirm running before next

### Step 4: Deploy Wave 2 — Fetch Internal (Parallel)

Deploy all 7 in parallel:

| Agent | Preset | Description |
|-------|--------|-------------|
| The Tour Guide | `guide` | Ecosystem onboarding |
| The SEO Manager | `rank` | Agent discoverability |
| The Business Coach | `coach` | Startup guidance |
| The Concierge | `conc` | Consumer experience |
| The Brand Manager | `brand` | Brand partnerships |
| The Dev Advocate | `dev` | Developer support |
| The Grants Officer | `grant` | Funding guidance |

### Step 5: Deploy Wave 3 — SingularityNET (Parallel)

Deploy all 15:

| Agent | Token | Organisation |
|-------|-------|--------------|
| The Marketplace Manager | $MKTPL | SingularityNET |
| The IT Manager | $INFRA | CUDOS |
| The Facilities Manager | $EDGE | NuNet |
| The Finance Controller | $FLOW | HyperCycle |
| The Health Coach | $LIFE | Rejuve.AI |
| The Lab Manager | $LAB | Rejuve Biotech |
| The Editor | $ED | Mindplex |
| The Fund Manager | $FUND | SingularityDAO |
| The Yield Farmer | $YIELD | Singularity Finance |
| The Treasury Manager | $STABLE | Cogito Protocol |
| The EA | $EA | Twin Protocol |
| The A&R Manager | $AR | Jam Galaxy |
| The Strategy Director | $STRAT | TrueAGI |
| The Research Scientist | $PHD | Zarqa / OpenCog |
| The Talent Agent | $TALENT | Yaya Labs |

### Step 6: Seed Cross-Holdings

After all agents deployed:

```bash
# CEO buys infrastructure tokens
npx agentlaunch buy $CTO_TOKEN --amount 5
npx agentlaunch buy $CFO_TOKEN --amount 5
npx agentlaunch buy $GUIDE_TOKEN --amount 2

# COO buys monitoring dependencies
npx agentlaunch buy $CEO_TOKEN --amount 3
npx agentlaunch buy $CTO_TOKEN --amount 3

# Coalition cross-holdings...
```

### Step 7: Verify & Report

```bash
npx agentlaunch status --swarm
```

Show summary:
```
╭────────────────────────────────────────────────────────────────╮
│              ASI ALLIANCE ECONOMY DEPLOYED                     │
├────────────────────────────────────────────────────────────────┤
│  Agents:     27 running                                        │
│  Tokens:     27 on bonding curves                              │
│  GDP:        Tracking...                                       │
│  Deploy:     3,240 FET                                         │
│                                                                │
│  C-Suite:    CEO, CTO, CFO, COO, CRO                          │
│  Fetch:      GUIDE, RANK, COACH, CONC, BRAND, DEV, GRANT      │
│  SNET:       MKTPL, INFRA, EDGE, FLOW, LIFE, LAB, ED,         │
│              FUND, YIELD, STABLE, EA, AR, STRAT, PHD,         │
│              TALENT                                            │
│                                                                │
│  Next: CRO will scout for more agents to recruit              │
╰────────────────────────────────────────────────────────────────╯
```

---

## Named After Real People

These agents are named after real ASI Alliance leadership:

| Agent | Named After | Organisation |
|-------|-------------|--------------|
| The CEO ($CEO) | Humayun Sheikh | Fetch.ai / ASI Alliance |
| The CTO ($CTO) | Thomas Hain | Fetch.ai (Co-Founder) |
| The CRO ($CRO) | Sana Wajid | Fetch.ai Innovation Lab |
| The Tour Guide ($GUIDE) | Maria Minaricova | Fetch.ai BD |
| The Marketplace Manager ($MKTPL) | Ben Goertzel | SingularityNET |
| The IT Manager ($INFRA) | Matt Hawkins | CUDOS |

---

## Related Docs

- [people.md](docs/people.md) — Full team roster + agent mapping
- [the-agent-economy.md](docs/the-agent-economy.md) — Complete vision document
- [agent-coordination.md](docs/agent-coordination.md) — Pitch deck version

---

## Output Style

Be elegant and helpful:
- Show progress clearly
- Celebrate each wave completion
- Explain what each agent does as it deploys
- End with clear next steps

**This is the flagship deployment. Make it feel special.**