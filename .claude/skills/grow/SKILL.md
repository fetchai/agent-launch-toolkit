# /grow -- Autonomous Task Execution

Claim and execute tasks from `docs/TODO.md` autonomously.

## Behavior

1. **Read TODO.md**: Open `docs/TODO.md` and parse the task tables
2. **Find next task**: Look for tasks marked `[ ]` with no unfinished dependencies
3. **Claim task**: Update the status marker from `[ ]` to `[~]` (in progress)
4. **Execute task**: Follow the "How" column instructions using toolkit commands
5. **Verify KPI**: Check the "KPI" column to confirm success
6. **Complete task**: Update status from `[~]` to `[x]` (complete)
7. **Report**: Summarize what was done and move to next task (if `/grow N`)

## Arguments

- `/grow` - Execute the next pending task
- `/grow 3` - Execute 3 tasks sequentially
- `/grow L-1` - Execute a specific task by ID
- `/grow status` - Show current progress without executing

## Task Selection Rules

1. Never execute a task whose "Depends" column lists incomplete tasks
2. Process tasks in ID order within each phase (L-1 before L-2)
3. Process phases in order (Phase 1 before Phase 2)
4. Skip tasks marked `[!]` (blocked) or `[x]` (complete)

## Status Markers

| Marker | Meaning |
|--------|---------|
| `[ ]`  | Pending - ready to execute (if deps are met) |
| `[~]`  | In Progress - currently being worked on |
| `[x]`  | Complete - verified and done |
| `[!]`  | Blocked - external blocker, needs human intervention |

## Example Task Execution

For task L-1 "Deploy the swarm":

```markdown
| Status | ID | Task | How | KPI | Depends |
|:---:|:---|:---|:---|:---|:---|
| `[~]` | L-1 | Deploy the swarm | `npx agentlaunch create` ... | All 7 running | — |
```

1. Run `npx agentlaunch create` and follow prompts
2. Verify all 7 agents are running with `network_status` MCP tool
3. If KPI met, update to `[x]`
4. If failed, update to `[!]` and report the blocker

## Gate Checks

After completing all tasks in a phase, verify the Phase Gate criteria.
If all gate items pass, proceed to the next phase.
If any gate item fails, report which ones need attention.

## Error Handling

- If a task fails, mark it `[!]` and add a comment explaining the blocker
- If dependencies are missing, report which tasks need to complete first
- If a gate check fails, report which criteria are unmet

## Toolkit Commands Used

- `npx agentlaunch create` - Deploy agents
- `npx agentlaunch status` - Check agent/token status
- `network_status` MCP tool - Swarm health check
- `check_agent_commerce` MCP tool - Individual agent commerce
- `GET /agents/token/{addr}/holders` - Token holder list
