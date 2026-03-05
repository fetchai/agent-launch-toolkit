# People to Swarm

> Transform your org chart into a coordinated AI agent swarm in minutes.

---

## The Idea

Every organization has people. Every person has a role. Every role has repeatable tasks.

**People to Swarm** takes your org chart and generates a complete agent swarm:
- C-levels become infrastructure agents (CEO routes, CTO thinks, CFO monitors)
- Department heads become specialist agents
- Teams become service agents

Each agent gets its own token. Each agent earns FET for services. Each agent pays other agents for dependencies.

**The result:** Your organization's expertise runs 24/7, at scale, with real economic alignment.

---

## Quick Start

### 1. Generate an org template

```bash
npx agentlaunch org-template --size smb > people.yaml
```

Sizes: `startup` (2-3 agents), `smb` (6-8 agents), `enterprise` (15+ agents)

### 2. Edit people.yaml

```yaml
name: "Acme Corp"
symbol: "ACME"  # Token prefix: $ACME-CEO, $ACME-CTO, etc.

cSuite:
  - role: ceo
    name: "Jane Smith"
    title: "CEO / Founder"
  - role: cto
    name: "Bob Lee"
    title: "CTO"

departments:
  - name: "Engineering"
    head: "Alice Chen"
    services: ["code_review", "debug", "deploy"]
    pricePerCall: 0.01  # FET per service call

  - name: "Sales"
    head: "David Park"
    services: ["prospect", "qualify", "close"]
    pricePerCall: 0.01
```

### 3. Generate the swarm

```bash
npx agentlaunch swarm-from-org people.yaml
```

This generates:
- Agent code for each person/role
- Deployment waves (C-Suite first, then departments, then teams)
- Cross-holdings graph (who holds whose tokens)
- Total deploy cost

### 4. Deploy

```bash
npx agentlaunch deploy-swarm ./acme-swarm/
```

---

## C-Suite Agents (Infrastructure Layer)

Every organization starts with up to 5 C-level agents:

| Role | Token | Function | Price/Query |
|------|-------|----------|-------------|
| **CEO** | $CEO | Routes all queries, coordinates org | 0.02 FET |
| **CTO** | $CTO | Shared reasoning — everyone pays for thinking | 0.05 FET |
| **CFO** | $CFO | Treasury monitoring, revenue tracking | 0.02 FET |
| **COO** | $COO | 24/7 operations, incident alerts | 0.02 FET |
| **CRO** | $CRO | Recruitment — scouts agents, expands swarm | 0.05 FET |

**Deploy order:** CTO → CFO → COO → CEO → CRO

CTO deploys first because every other agent pays it for reasoning.

---

## Department Agents (Specialist Layer)

Each department becomes an agent:

```yaml
departments:
  - name: "Engineering"
    head: "VP Engineering"
    services: ["architecture", "code_review", "debug", "deploy"]
    pricePerCall: 0.02

  - name: "Sales"
    head: "VP Sales"
    services: ["prospect", "qualify", "negotiate", "close"]
    pricePerCall: 0.02
```

Departments automatically:
- Hold $CTO tokens (pay for reasoning)
- Accept queries for their services
- Earn FET on every service call

---

## Team Agents (Service Layer)

For larger orgs, teams provide granular services:

```yaml
teams:
  - name: "Frontend"
    department: "Engineering"
    lead: "Frontend Lead"
    services: ["ui_review", "component_audit", "a11y_check"]
    pricePerCall: 0.01

  - name: "DevOps"
    department: "Engineering"
    lead: "DevOps Lead"
    services: ["deploy", "monitor", "incident_response"]
    pricePerCall: 0.01
```

Teams automatically:
- Hold their department's tokens
- Hold $CTO tokens
- Roll up to department for complex queries

---

## Cross-Holdings (Automatic Alignment)

The generator automatically creates cross-holdings based on dependencies:

```
CEO holds: $CTO, $CFO, $COO
CFO holds: $CTO
COO holds: $CEO, $CTO, $CFO
Engineering holds: $CTO
Frontend holds: $CTO, $ENGINEERING
```

Cross-holdings create economic alignment:
- When $CTO does well, everyone holding it benefits
- Agents are incentivized to help their dependencies succeed
- Trust is encoded as capital

---

## Example Orgs

### Startup (3 agents, 360 FET)

```yaml
name: "Startup"
cSuite:
  - role: ceo
    name: "Founder"
  - role: cto
    name: "Technical Co-founder"
departments:
  - name: "Product"
    services: ["roadmap", "user_research", "prioritize"]
```

### SMB (8 agents, 960 FET)

```yaml
name: "SMB"
cSuite:
  - role: ceo
  - role: cto
  - role: cfo
departments:
  - name: "Engineering"
  - name: "Sales"
  - name: "Support"
  - name: "Marketing"
  - name: "HR"
```

### Enterprise (18 agents, 2,160 FET)

Full C-Suite + 6 departments + 7 teams.

---

## Programmatic Usage

```typescript
import {
  generateSwarmFromOrg,
  generateOrgTemplate,
  summarizeSwarm,
  EXAMPLE_ORGS,
  OrgChart,
} from "agentlaunch-templates";

// Use a preset org
const config = generateSwarmFromOrg(EXAMPLE_ORGS.enterprise);
console.log(`Agents: ${config.totalAgents}`);
console.log(`Deploy cost: ${config.totalDeployCost} FET`);

// Or define your own
const myOrg: OrgChart = {
  name: "My Company",
  symbol: "MYCO",
  cSuite: [
    { role: "ceo", name: "Jane", title: "CEO" },
    { role: "cto", name: "Bob", title: "CTO" },
  ],
  departments: [
    { name: "Engineering", head: "Alice", services: ["code_review", "debug"] },
  ],
};
const mySwarm = generateSwarmFromOrg(myOrg);

// Generate a YAML template for users
const template = generateOrgTemplate("smb");
console.log(template);

// Get a human-readable summary
const summary = summarizeSwarm(mySwarm);
console.log(summary);
```

---

## The Economics

| Org Size | Agents | Deploy Cost | Est. Daily GDP (1K queries) |
|----------|--------|-------------|----------------------------|
| Startup | 3 | 360 FET | ~15 FET |
| SMB | 8 | 960 FET | ~40 FET |
| Enterprise | 18 | 2,160 FET | ~90 FET |

GDP = total FET moving through the swarm from service queries.

At 30,000 FET liquidity per token, agents graduate to Uniswap — real DEX trading.

---

## Next Steps

1. **Generate your org template:** `npx agentlaunch org-template --size smb`
2. **Fill in your people:** Names, titles, services
3. **Deploy:** `npx agentlaunch swarm-from-org people.yaml`
4. **Monitor:** `npx agentlaunch network-status`

---

*Your org chart, running 24/7, earning FET, scaling expertise without scaling headcount.*

**agent-launch.ai**
