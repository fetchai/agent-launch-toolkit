# Agentverse API Key Integration — Claude Code Build Guide

## LIVE API SPECS (READ FIRST)

```
Skill (Markdown):  https://agent-launch.ai/skill.md
OpenAPI 3.0.3:     https://agent-launch.ai/docs/openapi
Agent Docs:        https://agent-launch.ai/docs/for-agents
Platform (prod):   https://agent-launch.ai (default)
Platform (dev):    https://launchpad-frontend-dev-1056182620041.us-central1.run.app
API (prod):        https://agent-launch.ai/api (default)
API (dev):         https://launchpad-backend-dev-1056182620041.us-central1.run.app
```
> Active URLs are set in `.env` via `AGENT_LAUNCH_API_URL` and `AGENT_LAUNCH_FRONTEND_URL`.

## OBJECTIVE

Wire up the AgentVerse Launchpad so users can paste their Agentverse API key, fetch their agents, select one, and launch a token for it — all with minimal friction. The "Paste API key" UI already exists but is a stub. We need to make it functional end-to-end.

## PROJECT STRUCTURE

```
backend/          — NestJS API (TypeORM, MySQL, API key auth for agents / JWT for wallet users)
frontend/         — Next.js app (React, wagmi/viem for Web3, Tailwind)
smart_contracts/  — Solidity contracts (DO NOT TOUCH)
```

## ENDPOINTS

URLs are configured in `.env` via `AGENT_LAUNCH_API_URL` and `AGENT_LAUNCH_FRONTEND_URL`.

```
Platform (prod):  https://agent-launch.ai (default)
Platform (dev):   https://launchpad-frontend-dev-1056182620041.us-central1.run.app
API Base (prod):  https://agent-launch.ai/api (default)
API Base (dev):   https://launchpad-backend-dev-1056182620041.us-central1.run.app
Auth:             ${AGENT_LAUNCH_API_URL}/users/login
Agentverse API:   https://agentverse.ai/v1
FET Token:        0x74F804B4140ee70830B3Eef4e690325841575F89
Deploy Fee:       120 FET
Target Liquidity: 30,000 FET → auto Uniswap listing
```

## WHAT EXISTS (DO NOT RECREATE)

- Wallet auth: user signs a message → `POST /users/login` → gets JWT
- Token creation: `POST /api/agents/tokenize` creates a DB record, then user deploys on-chain
- `CreateAgentTokenModal` — modal with form fields (name, ticker, category, description, image, socials)
- `EmptyAgentsState.tsx` — has the API key input + "Import agents" button (currently a `console.log` stub)
- `AgentsList.tsx` — shows agent cards (currently hardcoded mock data)
- `AgentCard.tsx` — displays agent with "Launch Token" button
- `ProfileTabs.tsx` — tabs for "My tokens" and "My agents"
- Profile page at `frontend/src/app/launchpad/profile/page.tsx`

## WHAT TO BUILD (IN ORDER)

### PHASE 1: Backend — Store the API key

**1.1 Add `agentverse_key` column to User entity**

File: `backend/src/user/entity/user.entity.ts`

Add this column after the `avatar` column:
```typescript
@Column({ nullable: true })
agentverse_key: string;
```

Update the `toJSON()` method to expose whether a key exists (NEVER expose the actual key):
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

Note: `synchronize: true` is set in `backend/src/app.module.ts` TypeORM config, so the column will auto-create. No migration needed.

**1.2 Create DTO for the API key**

Create new file: `backend/src/user/dto/set-agentverse-key.dto.ts`
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

**1.3 Add methods to UserService**

File: `backend/src/user/user.service.ts`

Add these three methods:
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

**1.4 Add endpoints to UserController**

File: `backend/src/user/user.controller.ts`

Add imports:
```typescript
import { Delete } from '@nestjs/common';
import { SetAgentverseKeyDto } from './dto/set-agentverse-key.dto';
```

Add these two endpoints:
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

### PHASE 2: Backend — Proxy endpoint for Agentverse

**2.1 Create AgentsController**

Create new file: `backend/src/agents/agents.controller.ts`
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
    const agentverseKey = await this.userService.getAgentverseKey(req.user.id);
    if (!agentverseKey) {
      throw new BadRequestException('No Agentverse API key found. Please add your API key first.');
    }

    try {
      const response = await axios.get(`${AGENTVERSE_API}/agents`, {
        headers: {
          Authorization: `bearer ${agentverseKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        await this.userService.removeAgentverseKey(req.user.id);
        throw new BadRequestException('Agentverse API key is invalid or expired. Please add a new key.');
      }
      throw new InternalServerErrorException('Failed to fetch agents from Agentverse.');
    }
  }

  @Get('agentverse/status')
  @UseGuards(AuthGuard('jwt'))
  async getAgentverseStatus(@Request() req) {
    const agentverseKey = await this.userService.getAgentverseKey(req.user.id);
    if (!agentverseKey) return { connected: false };

    try {
      await axios.get(`${AGENTVERSE_API}/agents`, {
        headers: { Authorization: `bearer ${agentverseKey}` },
        timeout: 5000,
      });
      return { connected: true };
    } catch {
      return { connected: false };
    }
  }
}
```

**2.2 Create AgentsModule**

Create new file: `backend/src/agents/agents.module.ts`
```typescript
import { Module } from '@nestjs/common';
import { UserModule } from 'src/user/user.module';
import { AgentsController } from './agents.controller';

@Module({
  imports: [UserModule],
  controllers: [AgentsController],
})
export class AgentsModule {}
```

**2.3 Register in AppModule**

File: `backend/src/app.module.ts`

Add import: `import { AgentsModule } from './agents/agents.module';`
Add `AgentsModule` to the `imports` array.

### PHASE 3: Frontend — API helper

**3.1 Create agentverse API helper**

Create new file: `frontend/src/lib/api/agentverse.ts`
```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export async function setAgentverseKey(jwt: string, agentverseKey: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/users/agentverse-key`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentverseKey }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to save API key');
  }
  return res.json();
}

export async function fetchAgentverseAgents(jwt: string): Promise<AgentverseAgent[]> {
  const res = await fetch(`${API_BASE}/agents/agentverse`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to fetch agents');
  }
  return res.json();
}

export async function checkAgentverseStatus(jwt: string): Promise<{ connected: boolean }> {
  const res = await fetch(`${API_BASE}/agents/agentverse/status`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (!res.ok) return { connected: false };
  return res.json();
}

export async function removeAgentverseKey(jwt: string): Promise<void> {
  await fetch(`${API_BASE}/users/agentverse-key`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${jwt}` },
  });
}

export interface AgentverseAgent {
  name: string;
  address: string;
  Pending_messages: number;
  Bytes_transferred: number;
  Previous_Bytes_transferred: number;
}
```

### PHASE 4: Frontend — Wire up the UI

**4.1 Update EmptyAgentsState**

File: `frontend/src/components/profile/EmptyAgentsState.tsx`

This component currently has a `handleImportAgents` that just does `console.log`. Replace it with the real implementation:

- Accept props: `jwt: string` and `onAgentsImported: (agents: AgentverseAgent[]) => void`
- `handleImportAgents` should:
  1. Call `setAgentverseKey(jwt, apiKey)` to store the key
  2. Call `fetchAgentverseAgents(jwt)` to get agents
  3. Call `onAgentsImported(agents)` to pass them up
- Add loading state and error handling
- Add `onKeyDown` handler for Enter key on the input
- Disable button while loading
- Update the "Get api key here" link to point to `https://agentverse.ai/`

**4.2 Update AgentsList**

File: `frontend/src/components/profile/AgentsList.tsx`

Replace the mock data with real data:

- Accept props: `jwt: string` and `onLaunchToken: (agent: AgentverseAgent) => void`
- On mount, check `checkAgentverseStatus(jwt)` — if connected, fetch agents with `fetchAgentverseAgents(jwt)`
- If no key, show `EmptyAgentsState` with `onAgentsImported` callback
- Pass `onLaunchToken` to each `AgentCard`
- Keep pagination logic

**4.3 Update AgentCard**

File: `frontend/src/components/profile/AgentCard.tsx`

- Accept `onLaunchToken: () => void` prop
- The "Launch Token" button should call `onLaunchToken()` instead of being a dead link
- Display agent data from the `AgentverseAgent` type (name, address, message count)

**4.4 Update Profile Page**

File: `frontend/src/app/launchpad/profile/page.tsx`

- Add state: `const [selectedAgent, setSelectedAgent] = useState<AgentverseAgent | null>(null)`
- Create handler: `handleLaunchToken(agent)` → sets selected agent → opens modal
- Pass `jwt` and `onLaunchToken={handleLaunchToken}` to `AgentsList`
- Pass `prefill` data to `CreateAgentTokenModal`:
  ```typescript
  prefill={selectedAgent ? {
    tokenName: selectedAgent.name,
    ticker: selectedAgent.name.split(/\s+/).map(w => w[0]).filter(Boolean).join('').toUpperCase().slice(0, 6),
    description: `Token for ${selectedAgent.name} agent on Agentverse`,
  } : undefined}
  ```
- Get the JWT from wherever auth state is stored in the app (check for auth context/hook)

**4.5 Update CreateAgentTokenModal**

File: `frontend/src/components/modals/CreateAgentTokenModal.tsx`

- Add `prefill` prop to the interface:
  ```typescript
  prefill?: { tokenName?: string; ticker?: string; description?: string; logo?: string; }
  ```
- Use prefill values as initial state for `tokenName`, `ticker`, `description`
- Add `useEffect` to update state when `prefill` changes (for switching between agents)

## AGENTVERSE API REFERENCE

Base URL: `https://agentverse.ai/v1`
Auth header: `Authorization: bearer <API_KEY>`

**List agents:**
```
GET /v1/agents
→ [{ name, address, Pending_messages, Bytes_transferred, Previous_Bytes_transferred }]
```

**Get specific agent:**
```
GET /v1/agents/:address
```

## AGENTLAUNCH API (from OpenAPI spec)

Full spec: `https://agent-launch.ai/docs/openapi`
Use `${AGENT_LAUNCH_API_URL}` as the base — configured in `.env`.
Production base (default): `https://agent-launch.ai/api`

**List tokens:**
```
GET ${AGENT_LAUNCH_API_URL}/tokens
Params: page, limit (max 100), search, categoryId, chainId,
        sortBy (created_at|name|price|market_cap|holders), sortOrder (ASC|DESC)
Response: { success, data: [Token], meta: { page, limit, total, totalPages } }
```

**Query token:**
```
GET ${AGENT_LAUNCH_API_URL}/token/{address}
  address: 0x[a-fA-F0-9]{40}
Response: { success, data: Token }

Token: { id, name, ticker, description, address, creator, price, price_usd,
         balance, balance_usd, market_cap, progress (0-100), tokens_left,
         holders, vol_24h_usd, chain_id, listed, category: { id, name } }
```

**Tokenize agent:**
```
POST ${AGENT_LAUNCH_API_URL}/tokenize
Auth: X-API-Key: YOUR_AGENTVERSE_API_KEY   ← primary for agents
  or: Authorization: Bearer JWT             ← alternative for wallet users
Body: {
  agentAddress* (agent1q... or 0x...),
  name (max 32, optional), symbol (max 11, optional),
  description (max 500, optional), image (URL/base64/"auto", optional),
  chainId (optional)
}
Response: { success, data: { token_id, token_address, name, symbol, status, message } }
```

**Auth — API Key (agents, recommended):**
```
Header: X-API-Key: YOUR_AGENTVERSE_API_KEY
Get key at: https://agentverse.ai/profile/api-keys
```

**Auth — JWT (wallet users, alternative):**
```
POST ${AGENT_LAUNCH_API_URL}/users/login
Body: { address: "0x...", signature: "0x..." }
Response: { token: "eyJhbG..." }
Sign message: "Sign this message to authenticate"
Header: Authorization: Bearer {token}
```

### PHASE 5: Frontend — Deploy Handoff Page (Agent-to-Human Bridge)

This is the critical page that lets AI agents bring humans into the loop. An agent creates a token record via the API, then sends the human a link to this page. The human connects wallet, approves, deploys.

**5.1 Create deploy handoff page**

Create: `frontend/src/app/deploy/[tokenId]/page.tsx`

This page:
1. Reads `tokenId` from URL params
2. Fetches token details from `GET /api/agents/token/{address}` or by ID
3. Reads optional query params: `?ref={agent_address}&amount={buy_amount}`
4. Displays token metadata (name, ticker, description, image, category)
5. Shows "Connect Wallet" button (if not connected)
6. After wallet connect: shows FET balance, chain check (Base 8453)
7. "Approve FET" button → calls `FET.approve(deployer, 120e18 + buyAmount)`
8. "Deploy Token" button → calls `Deployer.deploy(name, ticker, picture, maxWallet, tokenId, buyAmount, buy)`
9. On success: shows token address, link to token page, confetti
10. Tracks `ref` param for agent referral attribution

Key UX: **Two clicks after wallet connect.** Approve → Deploy. That's it. The agent did all the thinking.

**5.2 Create trade handoff page**

Create: `frontend/src/app/trade/[tokenAddress]/page.tsx`

This page:
1. Reads `tokenAddress` from URL params
2. Reads query params: `?action=buy|sell&amount={fet_amount}&ref={agent_address}`
3. Fetches token details from `GET /api/agents/token/{address}`
4. Pre-selects buy or sell tab based on `?action`
5. Pre-fills amount based on `?amount`
6. Connect wallet → approve → execute trade
7. Track `ref` for agent referral

### PHASE 6: Agent Referral System

> **Status**: Not yet implemented. See `docs/referral.md` for the full referral strategy proposal, including a proxy contract approach that enables fee splitting without modifying audited contracts.

Currently the `?ref=` parameter is displayed on handoff pages for attribution but no fee splitting exists on-chain.

## EXISTING CODE PATTERNS TO FOLLOW

- NestJS controllers use `@UseGuards(AuthGuard('jwt'))` for auth
- User ID comes from `req.user.id` after auth guard
- Frontend uses `fetch()` with JWT in Authorization header
- All DTOs use `class-validator` decorators
- TypeORM entities use decorators (`@Column`, `@Entity`, etc.)
- Frontend components use Tailwind classes with the project's design tokens (`text-[#000D3D]`, `font-lexend`, etc.)
- Config is in `backend/src/common/config.ts`

## CRITICAL RULES

1. DO NOT modify any smart contract files
2. DO NOT change the existing token creation flow (`POST /api/agents/tokenize` → deploy on-chain)
3. DO NOT change the wallet auth flow
4. DO NOT expose the actual API key in any API response — only `hasAgentverseKey: boolean`
5. DO auto-remove invalid keys when Agentverse returns 401/403
6. DO follow existing code patterns and style
7. DO check how the app currently stores/accesses the JWT before wiring up frontend calls
8. The backend already has `axios` installed (used in scheduler service) — no new dependency needed
9. Test each phase before moving to the next

## TESTING CHECKLIST

- [ ] `POST /users/agentverse-key` stores the key (check DB)
- [ ] `GET /agents/agentverse` returns agent data (need a real Agentverse API key to test)
- [ ] `GET /agents/agentverse` returns 400 if no key stored
- [ ] `GET /agents/agentverse` auto-removes key and returns 400 on 401 from Agentverse
- [ ] `DELETE /users/agentverse-key` removes the key
- [ ] `GET /users` returns `hasAgentverseKey: true/false` (never the key itself)
- [ ] Frontend: paste key → agents appear
- [ ] Frontend: click "Launch Token" → modal opens with name/ticker pre-filled
- [ ] Frontend: on revisit, agents load automatically (key already stored)
- [ ] Frontend: invalid key shows error, input reappears
