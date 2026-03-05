# AgentLaunch Workflow Design

## Current Flow

```
User runs: npx agentlaunch

  ┌─────────────────────────────────────────────────────────────┐
  │  1. PROMPT: Agent name                                       │
  │  2. PROMPT: Description (what does it do?)                   │
  │  3. PROMPT: API key                                          │
  └─────────────────────────────────────────────────────────────┘
                              │
                              ▼
  ┌─────────────────────────────────────────────────────────────┐
  │  4. GENERATE: agent.py from chat-memory template             │
  │     - Default system prompt: "You are a helpful assistant"   │
  │     - Memory: 10 exchanges                                   │
  │     - LLM: ASI1-mini                                         │
  └─────────────────────────────────────────────────────────────┘
                              │
                              ▼
  ┌─────────────────────────────────────────────────────────────┐
  │  5. DEPLOY: To Agentverse                                    │
  │     - Upload code                                            │
  │     - Set secrets (API key, LLM key)                         │
  │     - Start agent                                            │
  └─────────────────────────────────────────────────────────────┘
                              │
                              ▼
  ┌─────────────────────────────────────────────────────────────┐
  │  6. LAUNCH: Claude Code / Cursor / Windsurf                  │
  │     - System prompt: workflow guide                          │
  │     - First message: "I just deployed [name]..."             │
  │     - MCP tools available                                    │
  └─────────────────────────────────────────────────────────────┘
```

## What We Can Generate From Description

The description is the **seed** for everything. Example:

```
Description: "Answers questions about TypeDB and graph databases"
```

### 1. Agent System Prompt (SYSTEM_PROMPT env var)

**Current:** Generic "You are a helpful AI assistant"

**Generated:**
```
You are an expert on TypeDB and graph databases. You help developers:
- Design graph schemas
- Write TypeQL queries
- Understand when to use graph vs relational databases
- Debug TypeDB issues

Be concise, provide code examples, and reference official TypeDB docs.
```

### 2. Agent README.md

**Current:** Generic template

**Generated:**
```markdown
# TypeDB Expert

AI agent specializing in TypeDB and graph databases.

## What I Can Help With
- Schema design for graph databases
- TypeQL query writing and optimization
- Graph vs relational database decisions
- TypeDB debugging and best practices

## Example Queries
- "How do I model a social network in TypeDB?"
- "Write a TypeQL query to find all friends of friends"
- "When should I use TypeDB vs Neo4j?"
```

### 3. Claude Code Context

**Current:** Generic workflow prompt

**Generated:**
```
I just deployed "TypeDB Expert", an agent that answers questions about
TypeDB and graph databases.

The agent is running at: agent1q...

Current capabilities:
- Conversation memory (10 exchanges)
- LLM: ASI1-mini
- System prompt: TypeDB expert

Let's enhance it by:
1. Adding TypeDB documentation to the knowledge base
2. Connecting to a live TypeDB instance for query testing
3. Adding code execution for TypeQL validation
```

### 4. Short Description (for Agentverse)

**Current:** Same as user input

**Generated:**
```
TypeDB and graph database expert. Get help with schema design,
TypeQL queries, and database architecture decisions.
```

## Generation Strategy

### Option A: Template Matching (Fast, No API)

Match keywords in description to pre-built prompt templates:

```typescript
const PROMPT_TEMPLATES = {
  // Knowledge domains
  "typescript|javascript|node": "You are an expert TypeScript/JavaScript developer...",
  "python|django|flask": "You are an expert Python developer...",
  "blockchain|web3|ethereum": "You are a blockchain and Web3 expert...",
  "database|sql|typedb": "You are a database expert...",

  // Agent types
  "monitor|alert|watch": "You are a monitoring agent that watches for...",
  "research|analyze|report": "You are a research agent that investigates...",
  "trade|price|market": "You are a market analysis agent...",
};

function generateSystemPrompt(description: string): string {
  for (const [pattern, prompt] of Object.entries(PROMPT_TEMPLATES)) {
    if (new RegExp(pattern, 'i').test(description)) {
      return prompt.replace('{{description}}', description);
    }
  }
  return `You are an AI assistant that ${description.toLowerCase()}. Be helpful and concise.`;
}
```

### Option B: LLM Generation (Better, Requires API)

Use ASI1-mini to generate a rich system prompt:

```typescript
async function generateSystemPrompt(description: string): Promise<string> {
  const response = await asi1.chat.completions.create({
    model: "asi1-mini",
    messages: [{
      role: "system",
      content: "Generate a system prompt for an AI agent. Be specific about capabilities and tone."
    }, {
      role: "user",
      content: `Agent description: ${description}\n\nGenerate a 3-5 sentence system prompt.`
    }],
    max_tokens: 200,
  });
  return response.choices[0].message.content;
}
```

### Option C: Hybrid (Recommended)

1. Use template matching for common patterns (instant)
2. Fall back to LLM generation for unique descriptions
3. Cache generated prompts for reuse

## Implementation Plan

### Phase 1: Smart Defaults (No API calls)

Update `chat-memory` template to accept `system_prompt` as a variable:

```typescript
// In CLI, generate from description
const systemPrompt = generateFromDescription(description);

// Pass to template
const generated = generateFromTemplate("chat-memory", {
  agent_name: name,
  description: description,
  system_prompt: systemPrompt,  // NEW
});
```

### Phase 2: Enhanced Claude Code Launch

Pre-fill Claude Code with agent-specific context:

```typescript
const welcomeMessage = `
I just deployed "${name}", an agent that ${description}.

**Status:** Running at ${agentAddress}
**Chat:** https://agentverse.ai/agents/details/${agentAddress}

The agent already has:
- Conversation memory (remembers last 10 exchanges)
- LLM integration (ASI1-mini)
- Chat Protocol (discoverable on Agentverse)

What would you like to add?
- [ ] Custom knowledge base
- [ ] External API integrations
- [ ] Background monitoring (on_interval)
- [ ] Payment for premium features
`;

const systemPrompt = buildAgentSpecificWorkflow({
  name,
  description,
  address: agentAddress,
  capabilities: ["memory", "llm", "chat-protocol"],
});
```

### Phase 3: Multi-Editor Support

Support different editors with appropriate context:

```typescript
interface EditorConfig {
  command: string;
  args: (context: AgentContext) => string[];
  contextFile?: string;  // Write context to file instead of args
}

const EDITORS: Record<string, EditorConfig> = {
  claude: {
    command: "claude",
    args: (ctx) => [
      ctx.welcomeMessage,
      "--append-system-prompt", ctx.systemPrompt,
      "--allowedTools", "Edit,Read,Write,Bash(npx agentlaunch *)",
    ],
  },
  cursor: {
    command: "cursor",
    args: (ctx) => [ctx.projectDir],
    contextFile: ".cursor/context.md",  // Write context here
  },
  windsurf: {
    command: "windsurf",
    args: (ctx) => [ctx.projectDir],
    contextFile: ".windsurf/context.md",
  },
};
```

## Data Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                         USER INPUT                                │
│  name: "TypeDB Expert"                                           │
│  description: "Answers questions about TypeDB and graph dbs"     │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                    GENERATION ENGINE                              │
│                                                                   │
│  generateSystemPrompt(description) → "You are a TypeDB expert..." │
│  generateReadme(name, description) → "# TypeDB Expert\n..."       │
│  generateShortDesc(description) → "TypeDB expert. Schema..."      │
│  generateWelcome(name, desc, addr) → "I deployed TypeDB Expert..."│
│  generateWorkflow(name, desc) → "## Building TypeDB Expert\n..."  │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                      DEPLOYED AGENT                               │
│                                                                   │
│  agent.py:                                                        │
│    SYSTEM_PROMPT = "You are a TypeDB expert..."                   │
│    CONFIG.description = "Answers questions about TypeDB..."       │
│                                                                   │
│  README.md: "# TypeDB Expert\n..."                                │
│  Agentverse short_description: "TypeDB expert. Schema..."         │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                      CODING SESSION                               │
│                                                                   │
│  Claude/Cursor/Windsurf opens with:                               │
│    - System prompt: "## Building TypeDB Expert\n..."              │
│    - First message: "I deployed TypeDB Expert, an agent..."       │
│    - MCP tools: deploy, tokenize, optimize, etc.                  │
│    - Project files: agent.py, README.md, .env                     │
└──────────────────────────────────────────────────────────────────┘
```

## Next Steps

1. **Implement `generateSystemPrompt()`** - Template matching + fallback
2. **Update `chat-memory` template** - Accept system_prompt variable
3. **Update CLI** - Generate and pass system prompt
4. **Test end-to-end** - Verify the full flow works
5. **Add editor selection** - Claude, Cursor, Windsurf support
