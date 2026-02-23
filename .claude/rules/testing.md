---
paths:
  - "packages/**/*.spec.ts"
  - "packages/**/*.test.ts"
---

# Testing Rules

## SDK / CLI / MCP (Jest)
- Co-located: *.spec.ts or *.test.ts
- Mock with jest.mock()
- beforeEach/afterEach for setup/cleanup

## Integration Tests
- Test SDK against mock API server
- Test CLI commands with mocked HTTP
- Test MCP tools with mock context
