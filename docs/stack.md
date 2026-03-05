# Technology Stack Reference

Tech stack for AgentLaunch and the Fetch.ai/ASI ecosystem.

## AgentLaunch Frontend (agent-launch.ai)

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| UI Library | **shadcn/ui** + Radix UI primitives |
| Styling | Tailwind CSS 4 |
| Deployment | Vercel |
| State | React Server Components + client hooks |

**Source:** `fetchai/launchpadDAO` (private repo)

### shadcn Components in Use

```
button, dialog, label, separator, sheet, tabs, tooltip
```

Standard shadcn structure: `frontend/src/components/ui/`

---

## ASI:One (asi1.ai)

| Layer | Technology |
|-------|------------|
| Framework | Next.js (App Router, RSC) |
| Deployment | Vercel |
| LLM | ASI-1 Mini (custom, OpenAI-compatible API) |
| Streaming | RSC progressive hydration |
| AI SDK | Unknown (likely Vercel AI SDK or custom) |

**Source:** Proprietary, no public repo. Confirmed via page source analysis.

---

## ASI-1 Docs (docs.asi1.ai)

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 |
| Docs Engine | Nextra 4 |
| Search | Algolia |
| Styling | Tailwind CSS 4 |

**Source:** `fetchai/asi-1-docs` (public)

---

## ASI Alliance Wallet

| Layer | Technology |
|-------|------------|
| Framework | Vite |
| Blockchain | CosmJS (Cosmos SDK) |
| Cross-chain | Axelar SDK |

**Source:** `fetchai/asi-alliance-wallet` (public)

---

## Agentverse (agentverse.ai)

| Layer | Technology |
|-------|------------|
| Framework | Unknown (likely Next.js) |
| UI | Custom design system |
| API | REST + WebSocket for logs |

**Source:** Proprietary, no public repo.

---

## AgentLaunch Toolkit (this repo)

| Package | Stack |
|---------|-------|
| SDK | TypeScript, fetch API |
| CLI | TypeScript, Commander.js |
| MCP Server | TypeScript, @modelcontextprotocol/sdk |
| Templates | TypeScript, Handlebars-style interpolation |

### Local Dev

```bash
npm run build    # Build all packages
npm run test     # Run all tests
npm run clean    # Remove dist/ dirs
```

---

## Common Patterns Across Fetch.ai

| Pattern | Usage |
|---------|-------|
| **Next.js App Router** | asi1.ai, agent-launch.ai, docs |
| **Tailwind CSS** | All frontends |
| **Vercel** | Primary deployment platform |
| **shadcn/ui** | agent-launch.ai (confirmed) |
| **TypeScript** | Universal |

---

## Recommended Stack for New AgentLaunch Features

When building new frontend features for AgentLaunch:

```
Next.js 15 + App Router
shadcn/ui + Radix primitives
Tailwind CSS 4
Vercel AI SDK (for chat/streaming)
TypeScript strict mode
```

For agent-facing APIs:
```
REST with X-API-Key auth
OpenAI-compatible format (for LLM endpoints)
WebSocket for real-time (logs, events)
```
