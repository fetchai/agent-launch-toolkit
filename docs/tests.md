# Testing Strategy

> Test once at the lowest layer, verify wiring at higher layers.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        TEST LAYERS                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────┐    ┌─────────┐    ┌─────────┐                │
│   │   CLI   │    │   MCP   │    │ Examples│   INTEGRATION  │
│   │  tests  │    │  tests  │    │  tests  │   (wiring)     │
│   └────┬────┘    └────┬────┘    └────┬────┘                │
│        │              │              │                      │
│        └──────────────┴──────────────┘                      │
│                       │                                     │
│               ┌───────▼───────┐                             │
│               │   SDK tests   │            UNIT             │
│               │  (all logic)  │            (comprehensive)  │
│               └───────┬───────┘                             │
│                       │                                     │
│               ┌───────▼───────┐                             │
│               │  Mock Server  │            SHARED           │
│               │   (1 file)    │            (reusable)       │
│               └───────────────┘                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Core Principle: Test Pyramid

```
         ╱╲
        ╱  ╲         E2E (optional, manual)
       ╱────╲        - Real API calls
      ╱      ╲       - Human verification
     ╱────────╲
    ╱          ╲     INTEGRATION (light)
   ╱────────────╲    - CLI argument parsing
  ╱              ╲   - MCP tool dispatch
 ╱────────────────╲  - Wiring correctness
╱                  ╲
╱────────────────────╲  UNIT (comprehensive)
                        - SDK client
                        - All API endpoints
                        - Error handling
                        - Retries
```

## Shared Mock Server

One mock server, used by all packages:

```typescript
// packages/test-utils/src/mock-server.ts

export const MOCK_RESPONSES = {
  // Tokens
  'GET /tokens': {
    tokens: [
      { id: 1, name: 'TestToken', symbol: 'TEST', address: '0x123...' }
    ],
    total: 1
  },
  'GET /tokens/address/0x123': {
    id: 1, name: 'TestToken', symbol: 'TEST', price: '0.001', balance: '1000'
  },
  'GET /tokens/id/1': {
    id: 1, name: 'TestToken', symbol: 'TEST', price: '0.001', balance: '1000'
  },
  'POST /agents/tokenize': {
    success: true,
    data: { token_id: 42, handoff_link: 'https://agent-launch.ai/deploy/42' }
  },

  // Market
  'GET /tokens/calculate-buy': {
    tokensReceived: '1000000', fee: '2', priceImpact: '0.5'
  },
  'GET /tokens/calculate-sell': {
    fetReceived: '100', fee: '2', priceImpact: '0.5'
  },

  // Holders
  'GET /agents/token/0x123/holders': {
    success: true,
    data: { holders: [{ address: '0xabc...', balance: '1000', token_percentage: '10' }], total: 1 }
  },

  // Comments
  'GET /comments/0x123': [
    { id: 1, message: 'Great token!', author: '0xabc...' }
  ],
  'POST /comments/0x123': { success: true },

  // Auth
  'POST /agents/auth': { token: 'jwt-token', expires_in: 3600 },
  'GET /agents/my-agents': { agents: [{ address: 'agent1q...', name: 'MyAgent' }] },

  // Platform
  'GET /platform/stats': { totalTokens: 10, totalVolume: '30000', activeUsers: 5 },
};

export function createMockFetch() {
  return async (url: string, options?: RequestInit) => {
    const method = options?.method ?? 'GET';
    const path = new URL(url).pathname.replace('/api', '');
    const key = `${method} ${path}`;

    const response = MOCK_RESPONSES[key];
    if (!response) {
      return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  };
}
```

## SDK Tests (Comprehensive)

Test every endpoint once, thoroughly:

```typescript
// packages/sdk/src/__tests__/endpoints.test.ts

import { createMockFetch, MOCK_RESPONSES } from 'test-utils';

const endpoints = [
  // [function, args, expectedPath, expectedMethod]
  // IMPORTANT: These paths must match the verified API paths in docs/paths.md
  ['listTokens', [{}], '/tokens', 'GET'],
  ['getToken', ['0x123'], '/tokens/address/0x123', 'GET'],
  ['tokenize', [{ agentAddress: 'agent1q...', name: 'Test', symbol: 'TST' }], '/agents/tokenize', 'POST'],
  ['calculateBuy', ['0x123', '100'], '/tokens/calculate-buy', 'GET'],
  ['calculateSell', ['0x123', '1000'], '/tokens/calculate-sell', 'GET'],
  ['getTokenHolders', ['0x123'], '/agents/token/0x123/holders', 'GET'],
  ['getComments', ['0x123'], '/comments/0x123', 'GET'],
  ['postComment', [{ tokenAddress: '0x123', message: 'Hello' }], '/comments/0x123', 'POST'],
  ['authenticate', ['av-key'], '/agents/auth', 'POST'],
  ['getMyAgents', [], '/agents/my-agents', 'GET'],
  ['getPlatformStats', [], '/platform/stats', 'GET'],
] as const;

describe('SDK Endpoints', () => {
  for (const [fn, args, path, method] of endpoints) {
    it(`${fn} calls ${method} ${path}`, async () => {
      let capturedUrl: string;
      global.fetch = async (url) => {
        capturedUrl = url as string;
        return createMockFetch()(url as string);
      };

      const sdk = await import('../index.js');
      await sdk[fn](...args);

      expect(capturedUrl).toContain(path);
    });
  }
});
```

## CLI Tests (Wiring Only)

Test that CLI parses args and calls SDK correctly:

```typescript
// packages/cli/src/__tests__/commands.test.ts

const commands = [
  // [command, args, expectedSdkCall]
  ['list', ['--limit', '10'], 'listTokens'],
  ['status', ['0x123'], 'getToken'],
  ['tokenize', ['--agent', 'agent1q...', '--name', 'Test'], 'tokenize'],
];

describe('CLI Commands', () => {
  for (const [cmd, args, sdkFn] of commands) {
    it(`${cmd} calls sdk.${sdkFn}`, async () => {
      const spy = jest.spyOn(sdk, sdkFn);
      await runCli([cmd, ...args]);
      expect(spy).toHaveBeenCalled();
    });
  }
});
```

## MCP Tests (Tool Dispatch Only)

Test that MCP tools call SDK correctly:

```typescript
// packages/mcp/src/__tests__/tools.test.ts

const tools = [
  // [toolName, args, expectedSdkCall]
  ['list_tokens', { limit: 10 }, 'listTokens'],
  ['get_token', { address: '0x123' }, 'getToken'],
  ['calculate_buy', { address: '0x123', fetAmount: '100' }, 'calculateBuy'],
  ['create_token_record', { name: 'Test', symbol: 'TST' }, 'tokenize'],
];

describe('MCP Tools', () => {
  for (const [tool, args, sdkFn] of tools) {
    it(`${tool} calls sdk.${sdkFn}`, async () => {
      const spy = jest.spyOn(sdk, sdkFn);
      await handleTool(tool, args);
      expect(spy).toHaveBeenCalled();
    });
  }
});
```

## Test Matrix

| Layer | What to Test | What NOT to Test |
|-------|-------------|------------------|
| **SDK** | HTTP calls, params, headers, errors, retries | - |
| **CLI** | Arg parsing, output formatting | API logic (tested in SDK) |
| **MCP** | Tool dispatch, schema validation | API logic (tested in SDK) |

## File Structure

```
packages/
├── test-utils/                    # Shared test utilities
│   ├── package.json
│   └── src/
│       ├── mock-server.ts         # Mock fetch + responses
│       ├── fixtures.ts            # Shared test data
│       └── index.ts
│
├── sdk/
│   └── src/__tests__/
│       ├── client.test.ts         # HTTP client (existing)
│       ├── endpoints.test.ts      # All endpoints (table-driven)
│       └── errors.test.ts         # Error handling
│
├── cli/
│   └── src/__tests__/
│       └── commands.test.ts       # Command wiring (table-driven)
│
└── mcp/
    └── src/__tests__/
        └── tools.test.ts          # Tool dispatch (table-driven)
```

## Running Tests

```bash
# All tests
npm test

# SDK only (most comprehensive)
npm test -w packages/sdk

# CLI only (wiring)
npm test -w packages/cli

# MCP only (wiring)
npm test -w packages/mcp

# With coverage
npm test -- --coverage
```

## Test Count Estimate

| Package | Tests | Lines of Test Code |
|---------|-------|-------------------|
| test-utils | 0 | ~50 (shared code) |
| SDK | ~25 | ~150 |
| CLI | ~10 | ~50 |
| MCP | ~15 | ~75 |
| **Total** | **~50** | **~325** |

## Key Design Decisions

### 1. Table-Driven Tests
Instead of writing 25 separate test functions, use arrays of test cases:

```typescript
// Bad: 25 functions, 500 lines
it('listTokens works', () => { ... });
it('getToken works', () => { ... });
// ... 23 more

// Good: 1 loop, 50 lines
for (const [fn, args, path] of endpoints) {
  it(`${fn} calls ${path}`, () => { ... });
}
```

### 2. Mock at Fetch Level
Don't mock individual SDK functions in CLI/MCP tests. Mock `fetch` once:

```typescript
// Bad: Mocking each function
jest.mock('../sdk', () => ({
  listTokens: jest.fn(),
  getToken: jest.fn(),
  // ... 20 more
}));

// Good: Mock fetch once
global.fetch = createMockFetch();
```

### 3. Shared Fixtures
Define test data once, use everywhere:

```typescript
// packages/test-utils/src/fixtures.ts
export const TEST_TOKEN = {
  id: 1,
  name: 'TestToken',
  symbol: 'TEST',
  address: '0x1234567890abcdef1234567890abcdef12345678',
  price: '0.001',
  balance: '1000',
};

export const TEST_AGENT = {
  address: 'agent1qtest...',
  name: 'TestAgent',
};
```

### 4. No E2E in CI
E2E tests against real APIs are flaky and slow. Keep them manual:

```bash
# Manual E2E (not in CI)
AGENT_LAUNCH_API_URL=https://agent-launch.ai/api npm run test:e2e
```

## Implementation Order

1. **Create `packages/test-utils/`** - Mock server + fixtures (~30 min)
2. **SDK endpoints.test.ts** - Table-driven endpoint tests (~1 hr)
3. **CLI commands.test.ts** - Command wiring tests (~30 min)
4. **MCP tools.test.ts** - Tool dispatch tests (~30 min)

Total estimated time: **~2.5 hours**

## Success Criteria

- [ ] All SDK endpoints have at least one test
- [ ] All CLI commands have at least one test
- [ ] All MCP tools have at least one test
- [ ] Tests run in < 5 seconds
- [ ] No real API calls in tests
- [ ] Coverage > 80% for SDK
