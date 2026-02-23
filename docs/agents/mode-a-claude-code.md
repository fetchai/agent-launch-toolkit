# Mode A: Claude Code — Human Developer Integration

Build the full-stack Agentverse API key integration. A human developer pastes this into Claude Code, which writes the code. End result: browser UI where users paste API keys, see their agents, and launch tokens.

## Authentication Model

Two auth methods exist — choose based on caller type:

| Method | Header | Use Case |
|--------|--------|----------|
| **API Key** | `X-API-Key: YOUR_KEY` | **Agents (primary)** — no wallet needed |
| **JWT** | `Authorization: Bearer TOKEN` | Wallet users (alternative) |

This Mode A guide builds the wallet-user UI path. Backend endpoints in Phases 1-4 use JWT because they are user-profile operations (storing/removing an Agentverse key tied to a wallet account). The token launch endpoint (`POST /api/agents/tokenize`) accepts both — agents should use API key directly; the UI calls it with JWT after wallet auth.

## Live API Spec

Before building, fetch the canonical specs (production):
- Skill: `https://agent-launch.ai/skill.md`
- OpenAPI: `https://agent-launch.ai/docs/openapi`
- Agent docs: `https://agent-launch.ai/docs/for-agents`
- Platform: `https://agent-launch.ai`

Dev environment URLs (configured via `.env`):
- API: `https://launchpad-backend-dev-1056182620041.us-central1.run.app` (`AGENT_LAUNCH_API_URL`)
- Frontend: `https://launchpad-frontend-dev-1056182620041.us-central1.run.app` (`AGENT_LAUNCH_FRONTEND_URL`)

## Phase Order

Execute phases in order. Each phase has validation. Do NOT skip ahead.

## Phase 1: Backend — Store API Key on User

### 1.1 Add column to User entity

**File**: `backend/src/user/entity/user.entity.ts`

Add after `avatar` column:
```typescript
@Column({ nullable: true })
agentverse_key: string;
```

Update `toJSON()` — NEVER expose actual key:
```typescript
toJSON() {
  return {
    id: this.id,
    address: this.address,
    username: this.username,
    avatar: this.avatar,
    hasAgentverseKey: !!this.agentverse_key,
  };
}
```

TypeORM `synchronize: true` auto-creates the column. No migration.

### 1.2 Create DTO

**Create**: `backend/src/user/dto/set-agentverse-key.dto.ts`
```typescript
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetAgentverseKeyDto {
  @IsString()
  @IsNotEmpty({ message: 'Agentverse API key is required.' })
  @ApiProperty()
  agentverseKey: string;
}
```

### 1.3 Add methods to UserService

**File**: `backend/src/user/user.service.ts`

Add:
```typescript
async setAgentverseKey(userId: number, agentverseKey: string): Promise<void> {
  await this.userRepository.update(userId, { agentverse_key: agentverseKey });
}

async getAgentverseKey(userId: number): Promise<string | null> {
  const user = await this.userRepository.findOne({
    where: { id: userId },
    select: ['id', 'agentverse_key'],
  });
  return user?.agentverse_key || null;
}

async removeAgentverseKey(userId: number): Promise<void> {
  await this.userRepository.update(userId, { agentverse_key: null });
}
```

### 1.4 Add endpoints to UserController

**File**: `backend/src/user/user.controller.ts`

Add imports: `Delete` from `@nestjs/common`, `SetAgentverseKeyDto`.

Add:
```typescript
@Post('agentverse-key')
@UseGuards(AuthGuard('jwt'))
async setAgentverseKey(@Request() req, @Body() dto: SetAgentverseKeyDto) {
  await this.userService.setAgentverseKey(req.user.id, dto.agentverseKey);
  return { success: true };
}

@Delete('agentverse-key')
@UseGuards(AuthGuard('jwt'))
async removeAgentverseKey(@Request() req) {
  await this.userService.removeAgentverseKey(req.user.id);
  return { success: true };
}
```

**GATE 1**: Backend compiles. `POST /users/agentverse-key` stores key in DB. `GET /users` returns `hasAgentverseKey: true`. Key is never in any response body.

---

## Phase 2: Backend — Agentverse Proxy

### 2.1 Create AgentsController

**Create**: `backend/src/agents/agents.controller.ts`
```typescript
import {
  Controller, Request, UseGuards, Get,
  BadRequestException, InternalServerErrorException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';
import axios from 'axios';
import { UserService } from 'src/user/user.service';

const AGENTVERSE_API = 'https://agentverse.ai/v1';

@ApiBearerAuth('jwt')
@Controller('agents')
export class AgentsController {
  constructor(private readonly userService: UserService) {}

  @Get('agentverse')
  @UseGuards(AuthGuard('jwt'))
  async getAgentverseAgents(@Request() req) {
    const key = await this.userService.getAgentverseKey(req.user.id);
    if (!key) throw new BadRequestException('No Agentverse API key. Add your key first.');

    try {
      const res = await axios.get(`${AGENTVERSE_API}/agents`, {
        headers: { Authorization: `bearer ${key}`, 'Content-Type': 'application/json' },
        timeout: 10000,
      });
      return res.data;
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        await this.userService.removeAgentverseKey(req.user.id);
        throw new BadRequestException('API key invalid or expired. Please re-enter.');
      }
      throw new InternalServerErrorException('Failed to fetch agents from Agentverse.');
    }
  }

  @Get('agentverse/status')
  @UseGuards(AuthGuard('jwt'))
  async getAgentverseStatus(@Request() req) {
    const key = await this.userService.getAgentverseKey(req.user.id);
    if (!key) return { connected: false };
    try {
      await axios.get(`${AGENTVERSE_API}/agents`, {
        headers: { Authorization: `bearer ${key}` }, timeout: 5000,
      });
      return { connected: true };
    } catch { return { connected: false }; }
  }
}
```

### 2.2 Create AgentsModule

**Create**: `backend/src/agents/agents.module.ts`
```typescript
import { Module } from '@nestjs/common';
import { UserModule } from 'src/user/user.module';
import { AgentsController } from './agents.controller';

@Module({ imports: [UserModule], controllers: [AgentsController] })
export class AgentsModule {}
```

### 2.3 Register in AppModule

**File**: `backend/src/app.module.ts`
Add `AgentsModule` to imports.

**GATE 2**: `GET /agents/agentverse` returns agent list (with valid key). Returns 400 if no key. Returns 400 and auto-removes key on 401 from Agentverse.

---

## Phase 3: Frontend — API Helper

### 3.1 Create agentverse API helper

**Create**: `frontend/src/lib/api/agentverse.ts`
```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export interface AgentverseAgent {
  name: string;
  address: string;
  Pending_messages: number;
  Bytes_transferred: number;
  Previous_Bytes_transferred: number;
}

export async function setAgentverseKey(jwt: string, agentverseKey: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/users/agentverse-key`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentverseKey }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || 'Failed to save key'); }
  return res.json();
}

export async function fetchAgentverseAgents(jwt: string): Promise<AgentverseAgent[]> {
  const res = await fetch(`${API_BASE}/agents/agentverse`, { headers: { Authorization: `Bearer ${jwt}` } });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || 'Failed to fetch agents'); }
  return res.json();
}

export async function checkAgentverseStatus(jwt: string): Promise<{ connected: boolean }> {
  const res = await fetch(`${API_BASE}/agents/agentverse/status`, { headers: { Authorization: `Bearer ${jwt}` } });
  if (!res.ok) return { connected: false };
  return res.json();
}

export async function removeAgentverseKey(jwt: string): Promise<void> {
  await fetch(`${API_BASE}/users/agentverse-key`, { method: 'DELETE', headers: { Authorization: `Bearer ${jwt}` } });
}
```

**GATE 3**: Helper functions exist and TypeScript compiles.

---

## Phase 4: Frontend — Wire the UI

### 4.1 EmptyAgentsState

**File**: `frontend/src/components/profile/EmptyAgentsState.tsx`

Replace `console.log` stub. Accept props: `jwt: string`, `onAgentsImported: (agents: AgentverseAgent[]) => void`.

`handleImportAgents`:
1. `await setAgentverseKey(jwt, apiKey.trim())`
2. `const agents = await fetchAgentverseAgents(jwt)`
3. `onAgentsImported(agents)`

Add: loading state, error display, Enter key on input, disable during loading, link to `https://agentverse.ai/`.

### 4.2 AgentsList

**File**: `frontend/src/components/profile/AgentsList.tsx`

Accept: `jwt: string`, `onLaunchToken: (agent: AgentverseAgent) => void`.
On mount: check status → if connected, fetch agents → set state.
No key → show `EmptyAgentsState`.
Pass `onLaunchToken` to each `AgentCard`.

### 4.3 AgentCard

**File**: `frontend/src/components/profile/AgentCard.tsx`

Accept `onLaunchToken: () => void`. Wire "Launch Token" button.

### 4.4 Profile Page

**File**: `frontend/src/app/launchpad/profile/page.tsx`

State: `selectedAgent`. Handler: `handleLaunchToken(agent)` → set → open modal.
Pass to modal:
```typescript
prefill={selectedAgent ? {
  tokenName: selectedAgent.name,
  ticker: selectedAgent.name.split(/\s+/).map(w => w[0]).filter(Boolean).join('').toUpperCase().slice(0, 6),
  description: `Token for ${selectedAgent.name} agent on Agentverse`,
} : undefined}
```

### 4.5 CreateAgentTokenModal

**File**: `frontend/src/components/modals/CreateAgentTokenModal.tsx`

Add `prefill?: { tokenName?, ticker?, description?, logo? }` prop.
Use as initial state. `useEffect` to update when prefill changes.

**GATE 4**: Full flow works — paste key → agents appear → click Launch Token → modal pre-filled → deploy.

---

## Code Patterns to Follow

- NestJS: `@UseGuards(AuthGuard('jwt'))`, `req.user.id`, DTOs with `class-validator`
- Frontend: `fetch()` with JWT, Tailwind classes (`text-[#000D3D]`, `font-lexend`)
- `axios` already installed (scheduler uses it)
- No new dependencies needed

## Critical Rules

1. DO NOT modify smart contracts
2. DO NOT change token creation flow or wallet auth
3. NEVER expose API key in responses
4. Auto-remove invalid keys on 401/403
5. Check how JWT is stored in frontend before wiring
