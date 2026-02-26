# /todo -- Create TODO from Document

Transform a strategy document, roadmap, or feature spec into a structured TODO.md.

## Usage

- `/todo` - Create TODO.md from the most recent doc discussed
- `/todo docs/organic-growth-strategy.md` - Create TODO from a specific file
- `/todo "my feature spec"` - Create TODO from inline requirements

## Template

Use `docs/TODO-template.md` as the format reference. Key elements:

### YAML Frontmatter

```yaml
---
title: Feature Name
type: roadmap
version: 1.0.0
priority: Phase order
total_tasks: N
completed: 0
status: PENDING
depends_on: any prerequisites
---
```

### Task Tables

```markdown
| Status | ID | Task | How | KPI | Depends |
|:---:|:---|:---|:---|:---|:---|
| `[ ]` | L-1 | Task name | Implementation details | Success metric | — |
| `[ ]` | L-2 | Next task | How to do it | What proves it's done | L-1 |
```

### Status Markers

- `[ ]` - Pending
- `[~]` - In Progress
- `[x]` - Complete
- `[!]` - Blocked

### Phase Structure

Group tasks into phases with clear progression:

1. **Phase 1: Setup** - Foundation tasks
2. **Phase 2: Build** - Core implementation
3. **Phase 3: Test** - Verification
4. **Phase 4: Deploy** - Launch tasks

### Gate Criteria

After each phase, add a gate checklist:

```markdown
### Phase N Gate

```
  [ ] First success criterion
  [ ] Second success criterion
  [ ] Third success criterion
```
```

### Dependency Graph

Add ASCII or Mermaid diagram showing task dependencies:

```markdown
## Dependency Graph

```
L-1 ──► L-2 ──► L-3 ──► P-1
         │              │
         └──► L-4 ──────┘
```
```

### Progress Overview

Include visual progress tracking:

```markdown
## Progress Overview

```
╭─────────────────────────────────────────────╮
│   Phase 1: Setup  [░░░░░░░░░░]  0/4    0%  │
│   Phase 2: Build  [░░░░░░░░░░]  0/6    0%  │
│   TOTAL           [░░░░░░░░░░]  0/10   0%  │
╰─────────────────────────────────────────────╯
```
```

## Output

By default, write to `docs/TODO.md`.
Use `/todo output:path/to/file.md` to specify a different output.

## Task ID Conventions

Use short, prefixed IDs:

- `L-N` - Launch/setup tasks
- `B-N` - Build tasks
- `T-N` - Test tasks
- `D-N` - Deploy tasks
- `P-N` - Prove/validate tasks
- `G-N` - Growth tasks
- `S-N` - Sustain tasks
- `F-N` - Final/graduation tasks

## KPI Guidelines

KPIs should be:
- Measurable ("All 7 running" not "it works")
- Specific ("≥10 queries/day" not "many queries")
- Verifiable (can check with a command or tool)

## Integration with /grow

The TODO created by `/todo` is designed to work with `/grow`:

1. `/todo docs/plan.md` - Create the TODO
2. `/grow` - Execute tasks one by one
3. `/grow 5` - Execute 5 tasks in sequence
