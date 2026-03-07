# Self-Improvement System

The AgentLaunch Toolkit learns from every session. When you build agents, encounter errors, and fix them, those learnings can be captured and shared with the team.

## Philosophy

> "Try it, break it, improve it"

This toolkit isn't perfect — but it gets better every time someone uses it. When you hit an error and figure out the fix, that knowledge shouldn't stay in your head. The `/improve` command captures what you learned and adds it to the system so the next person (or AI) doesn't hit the same wall.

## Quick Start

After building an agent or fixing errors:

```
/improve
```

That's it. The system will:
1. Review what happened in your session
2. Identify learnings (errors fixed, patterns discovered, workarounds used)
3. Let you choose what to persist
4. Update the appropriate files

## What Gets Captured

### Error Patterns → Rules

When you fix an error, the pattern goes into `.claude/rules/`:

```
Error: "ctx.wallet does not exist"
Fix: Use agent.wallet instead
→ Added to: .claude/rules/uagent-patterns.md
```

### Working Code → Templates

When you write code that works well, it can become a template:

```
Pattern: Agent with LLM + memory + payments
→ Added to: packages/templates/src/templates/
```

### API Gotchas → Documentation

When you discover API quirks:

```
Discovery: Payment protocol requires role="seller"
→ Added to: .claude/rules/payment-protocol.md
```

### Workflow Improvements → Skills

When you find a better way to do things:

```
Improvement: Always optimize after deploy
→ Updated: .claude/skills/deploy.md
```

## Where Learnings Live

| Type | Location | Purpose |
|------|----------|---------|
| Coding rules | `.claude/rules/*.md` | Patterns Claude follows when writing code |
| Agent templates | `packages/templates/src/` | Scaffolding for new agents |
| Skills | `.claude/skills/*.md` | Slash command definitions |
| Memory | `~/.claude/.../memory/MEMORY.md` | Cross-session insights |
| Docs | `docs/*.md` | Human-readable guides |

## The Feedback Loop

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   [You]  ──build──>  [Agent]  ──errors──>  [Fix]       │
│     │                                         │         │
│     │                                         v         │
│     │                                    /improve       │
│     │                                         │         │
│     │                                         v         │
│     │                              [Rules/Templates]    │
│     │                                         │         │
│     v                                         v         │
│   [Next build] <────────────────────────────────       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

Each cycle makes the toolkit smarter. Errors that broke your build won't break the next person's.

## How /improve Works

### Step 1: Session Analysis

The system reviews your conversation:
- Commands run
- Errors encountered
- Code written
- Fixes applied

### Step 2: Learning Extraction

It identifies actionable learnings:

```
Session Summary:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Built: marketing-writer agent
Deployed: ✓ (agent1q...)
Tokenized: ✓ (0x...)

Errors Fixed (3):
  1. Protocol needs role="seller" parameter
  2. datetime.utcnow() deprecated → use datetime.now()
  3. Missing ChatAcknowledgement handler

Patterns Used:
  - LLM integration with ASI1-mini
  - 10-layer commerce stack
  - Conversation memory

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Step 3: Duplicate Detection

Before suggesting additions, it checks existing rules:

```
Checking existing rules...
  ✓ "Protocol needs role" — already in payment-protocol.md
  ✓ "datetime.utcnow deprecated" — already in uagent-patterns.md
  ✗ "Missing handler error message" — NEW, not documented
```

### Step 4: User Choice

You decide what to add:

```
New learnings found:

[1] Error pattern: "ChatAcknowledgement handler required"
    → Add to: .claude/rules/uagent-patterns.md

[2] Code pattern: Marketing writer with Twitter integration
    → Add as: packages/templates/src/templates/twitter-writer/

[3] Workflow: Check agent compilation before optimize
    → Add to: .claude/rules/workflow.md

Select learnings to add (comma-separated, or 'all'):
```

### Step 5: Test Changes

Before creating a PR, the system validates the changes:

```
Testing improvements...

[1/4] Linting rules...
      ✓ .claude/rules/uagent-patterns.md - valid markdown

[2/4] Building packages...
      ✓ npm run build - passed

[3/4] Running test suite...
      ✓ npm run test - 47 passed, 0 failed

[4/4] Validating new template...
      ✓ packages/templates/src/templates/twitter-writer/agent.py - syntax OK
      ✓ Template generates valid agent code

All tests passed. Creating PR...
```

If tests fail, you'll see what broke and can fix it before the PR is created.

### Step 6: Pull Request

The system creates a PR for team review:

```
Creating improvement PR...

Branch: improve/session-a1b2c3
Changes:
  - .claude/rules/uagent-patterns.md (updated)
  - packages/templates/src/templates/twitter-writer/ (new)

PR created: https://github.com/anthropics/agent-launch-toolkit/pull/42

Title: "Add ChatAcknowledgement error pattern + twitter-writer template"

The team can now review your improvements before merging.
```

This keeps the process collaborative — your learnings are proposed, not imposed.

### Step 7: Report

```
Improvement PR created!

Branch: improve/session-a1b2c3
PR: https://github.com/anthropics/agent-launch-toolkit/pull/42

Tests: All passed (build, 47 unit tests, template validation)

Next steps:
  1. Review the PR
  2. Team discusses if needed
  3. Merge when ready

Thanks for improving the toolkit!
```

## For Team Members

### First Time Setup

1. Clone the repo
2. Copy `.env.example` to `.env`, add your Agentverse API key
3. Run `npm install && npm run build`

### Your First Agent

```bash
npx agentlaunch my-first-agent
```

This will:
- Scaffold an agent from the chat-memory template
- Deploy to Agentverse
- Open Claude Code for customization

### When Things Break

Don't worry — that's expected! When you hit an error:

1. Try to fix it (Claude will help)
2. Once it's working, run `/improve`
3. Add the learning to the system

### What Makes a Good Learning

**Good learnings are:**
- Specific (exact error message, exact fix)
- Reproducible (others would hit the same issue)
- Actionable (clear what to do differently)

**Examples:**

✅ Good: "Payment protocol requires `role='seller'` — without it, handlers don't register"

❌ Bad: "Payment stuff is tricky"

✅ Good: "Agent listing response is `{ items: [...] }` not `{ agents: [...] }`"

❌ Bad: "API responses are weird sometimes"

## Contributing Improvements

### Via /improve (Recommended)

The easiest way. Just use the command after fixing something.

### Manual Additions

If you want to add rules manually:

1. **Rules**: Create/edit `.claude/rules/your-rule.md`
2. **Templates**: Add to `packages/templates/src/templates/`
3. **Skills**: Create/edit `.claude/skills/your-skill.md`

Then commit and push. The team gets your improvements on next pull.

### Rule File Format

```markdown
# Rule Title

## When This Applies

Brief description of when this rule matters.

## The Rule

Clear, actionable guidance.

## Examples

### Do This
```code```

### Not This
```code```

## Why

Explanation of why this matters.
```

## Viewing Current Knowledge

### List All Rules

```bash
ls -la .claude/rules/
```

### Search Rules

```bash
grep -r "payment" .claude/rules/
```

### View a Rule

```bash
cat .claude/rules/payment-protocol.md
```

## Metrics

The system tracks improvement over time:

| Metric | Description |
|--------|-------------|
| Rules added | Total rules in `.claude/rules/` |
| Error patterns | Documented error → fix mappings |
| Templates | Available agent templates |
| Session success rate | % of builds that deploy without errors |

## FAQ

### Q: Will my learnings affect others?

Yes — that's the point! When you commit improvements, the whole team benefits.

### Q: What if I add something wrong?

No worries. Rules are just markdown files. They can be edited or removed. Git history preserves everything.

### Q: How do I know if something is already documented?

`/improve` checks for duplicates automatically. It won't suggest adding something that's already in the rules.

### Q: Can I improve the /improve command itself?

Absolutely. It's defined in `.claude/skills/improve.md`. Meta-improvement is encouraged.

## Architecture

```
.claude/
  rules/                    # Coding patterns (auto-loaded by Claude)
    agentlaunch.md
    agentverse.md
    uagent-patterns.md
    payment-protocol.md
    ...
  skills/                   # Slash commands
    improve.md              # This system
    build-agent.md
    deploy.md
    ...
  settings.json             # MCP server config

packages/
  templates/
    src/
      templates/            # Agent scaffolds
        chat-memory/
        swarm-starter/
        consumer-commerce/
        ...
      presets.ts            # Role configurations

docs/
  self-improvement.md       # This file
  workflow.md               # The 8 phases
  ...
```

## Roadmap

- [ ] Auto-detect error patterns from logs
- [ ] Suggest template extractions from working code
- [ ] Track which rules prevent the most errors
- [ ] Team leaderboard for contributions
- [ ] Integration with GitHub Issues for tracking

---

*This system exists because perfect documentation is impossible. Real usage reveals real issues. Your contributions make the toolkit better for everyone.*
