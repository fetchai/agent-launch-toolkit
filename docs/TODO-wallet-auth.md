---
title: Programmatic API Key Creation via Wallet Auth
version: 1.2.0
total_tasks: 29
completed: 25
status: in_progress
created: 2026-04-03
updated: 2026-04-03
---

# Programmatic API Key Creation via Wallet Auth

## Summary

We cracked the `accounts.fetch.ai` wallet authentication flow. Agents can now create Agentverse API keys programmatically without human intervention.

**The breakthrough:** Sign the CHALLENGE (not nonce) in ADR-036 format with 64-byte R||S signature (no recovery byte).

## Now

- [x] **SDK** Add `walletAuth()` function to SDK (W-1a through W-6) ✅
- [x] **CLI** Add `agentlaunch auth` command to CLI (W-7 through W-13) ✅
- [x] **MCP** Add `wallet_auth` MCP tool (W-14 through W-17) ✅
- [x] **Zero-to-Hero** Added `--generate` flag and `generateWalletAndAuthenticate()` ✅
- [ ] **Website** Update fetchlaunchpad docs (W-23 through W-26)
- [x] **Skills** Update /build-agent skill and add rules (W-27, W-28) ✅

## Zero-to-Hero Flow (COMPLETE)

The ultimate frictionless onboarding — start with NOTHING, get a fully working agent:

```bash
# Generate wallet + API key in one command (no .env needed!)
npx agentlaunch auth wallet --generate

# Creates:
# - New random wallet (WALLET_PRIVATE_KEY)
# - Authenticates with Agentverse
# - Saves both keys to .env
# - Ready to build agents immediately
```

**SDK function:**
```typescript
import { generateWalletAndAuthenticate } from 'agentlaunch-sdk';

const result = await generateWalletAndAuthenticate();
// result.privateKey - new wallet private key
// result.evmAddress - 0x... address
// result.cosmosAddress - fetch1... address  
// result.apiKey - ready to use
```

**MCP tool:** `generate_wallet` — creates wallet and authenticates in one call

---

## Phase 1: SDK Implementation ✅

| Status | ID | Task | How | Depends |
|:---:|:---|:---|:---|:---|
| `[x]` | W-1a | Add dependencies to SDK | `@cosmjs/crypto`, `bech32` as optional peer deps | — |
| `[x]` | W-1b | Create `packages/sdk/src/wallet-auth.ts` | Implement the working algorithm from `scripts/test-wallet-auth-babble.mjs` | W-1a |
| `[x]` | W-2 | Export from SDK index | Add `authenticateWithWallet`, `deriveCosmosAddress` to `packages/sdk/src/index.ts` | W-1b |
| `[x]` | W-3 | Add types | `WalletAuthConfig`, `WalletAuthResult` in `types.ts` | W-1b |
| `[x]` | W-4 | Add to AgentLaunch fluent API | `agentlaunch.auth.fromWallet(privateKey)` method | W-1b, W-2 |
| `[x]` | W-5 | Write SDK tests | `packages/sdk/src/__tests__/wallet-auth.test.ts` - all tests pass | W-1b |
| `[x]` | W-6 | Update SDK CHANGELOG | v0.2.15 — wallet authentication feature | W-1b |

**Gate:** ✅ SDK builds, tests pass

---

## Phase 2: CLI Implementation ✅

| Status | ID | Task | How | Depends |
|:---:|:---|:---|:---|:---|
| `[x]` | W-7 | Add `auth` command | `packages/cli/src/commands/auth.ts` | W-1b |
| `[x]` | W-8 | Subcommand `auth wallet` | Get API key from wallet private key | W-7 |
| `[x]` | W-9 | Subcommand `auth status` | Check current API key validity | W-7 |
| `[x]` | W-10 | Auto-save to .env option | `--save` flag writes to `.env` | W-8 |
| `[x]` | W-11 | Update CLI help | Registered in `cli.ts`, shows in help | W-7 |
| `[~]` | W-12 | Write CLI tests | `packages/cli/src/__tests__/auth.test.ts` — pending | W-7 |
| `[x]` | W-13 | Update CLI CHANGELOG | v1.2.9 — auth commands | W-7 |

**Gate:** ✅ `npx agentlaunch auth wallet` works (pending test file)

---

## Phase 3: MCP Implementation ✅

| Status | ID | Task | How | Depends |
|:---:|:---|:---|:---|:---|
| `[x]` | W-14 | Add `wallet_auth` tool | `packages/mcp/src/tools/auth.ts` | W-1b |
| `[x]` | W-15 | Add `check_auth` tool | Verify API key is valid | W-14 |
| `[x]` | W-16 | Register tools | Added to `packages/mcp/src/index.ts` | W-14, W-15 |
| `[x]` | W-17 | Update MCP tool docs | `docs/mcp-tools.md` updated | W-14 |

**Gate:** ✅ MCP tools registered and documented

---

## Phase 4: Documentation (agent-launch-toolkit) ✅

| Status | ID | Task | How | Depends |
|:---:|:---|:---|:---|:---|
| `[x]` | W-18 | Update CLAUDE.md | Added wallet auth to Authentication section + Quick Reference | W-1b |
| `[x]` | W-19 | Update `docs/sdk-reference.md` | v0.2.15 — added Wallet Authentication section | W-1b |
| `[x]` | W-20 | Update `docs/cli-reference.md` | v1.2.9 — added auth commands | W-7 |
| `[x]` | W-21 | Create `docs/wallet-auth.md` | Full guide with examples, algorithm, security | W-1b |
| `[ ]` | W-22 | Update workflow docs | Add auth step to agent lifecycle | W-21 |

**Gate:** ✅ Docs accurate and complete (W-22 optional enhancement)

---

## Phase 5: Website (fetchlaunchpad)

| Status | ID | Task | How | Depends |
|:---:|:---|:---|:---|:---|
| `[ ]` | W-23 | Update SDK docs page | `/docs/sdk` - add wallet auth section | W-19 |
| `[ ]` | W-24 | Update CLI docs page | `/docs/cli` - add auth commands | W-20 |
| `[ ]` | W-25 | Update getting started | Add wallet auth as option | W-21 |
| `[ ]` | W-26 | Add to API reference | Document the auth flow | W-21 |

**Gate:** Website docs match toolkit docs

---

## Phase 6: Skills & Rules ✅

| Status | ID | Task | How | Depends |
|:---:|:---|:---|:---|:---|
| `[x]` | W-27 | Update `/build-agent` skill | Added Step 0: check auth, offer --generate | W-1b |
| `[x]` | W-28 | Add wallet auth rule | Created `.claude/rules/wallet-auth.md` | W-1b |

**Gate:** ✅ Skills use wallet auth when appropriate

---

## Technical Specification

### API Base URL

```
https://accounts.fetch.ai/v1
```

### Key Derivation (from EVM private key to Cosmos address)

```
1. Private key: 32-byte hex string (with or without 0x prefix)
2. Derive secp256k1 public key using @cosmjs/crypto Secp256k1.makeKeypair()
3. Compress public key using Secp256k1.compressPubkey() -> 33 bytes
4. SHA256(compressed pubkey) -> 32 bytes
5. RIPEMD160(sha256 result) -> 20 bytes (address bytes)
6. bech32.encode('fetch', bech32.toWords(addressBytes)) -> "fetch1..."
```

### The Algorithm

```
1. POST /v1/auth/login/wallet/challenge
   Body: { address: "fetch1...", client_id: "agentverse", scope: "av" }
   Response: { challenge: "eyJ...", nonce: "abc123..." }

2. Create ADR-036 Sign Doc (field order doesn't matter, will be sorted):
   {
     "chain_id": "",
     "account_number": "0",
     "sequence": "0",
     "fee": { "gas": "0", "amount": [] },
     "msgs": [{
       "type": "sign/MsgSignData",
       "value": {
         "signer": "fetch1...",
         "data": base64(challenge)  // Sign CHALLENGE, not nonce!
       }
     }],
     "memo": ""
   }

3. Canonical JSON stringify (sorted keys, compact separators: ",", ":")
   - Recursive: sort keys at every level
   - No whitespace: `{"key":"value"}` not `{"key": "value"}`

4. SHA256 hash the JSON bytes (use @cosmjs/crypto sha256)

5. Sign with secp256k1.createSignature(), return R||S (64 bytes, NO recovery byte)
   - toFixedLength() returns 65 bytes, slice first 64

6. POST /v1/auth/login/wallet/verify
   Body: {
     address: "fetch1...",
     public_key: { type: "tendermint/PubKeySecp256k1", value: base64(compressed) },
     nonce: "...",
     challenge: "...",
     signature: base64(64-byte-sig),
     client_id: "agentverse",
     scope: "av"
   }
   Response: { code: "..." }

7. POST /v1/tokens
   Body: {
     grant_type: "api_key",
     client_id: "agentverse",
     code: "...",
     scope: "av",
     expires_in: 2592000  // 30 days in seconds
   }
   Response: { access_token: "..." }
```

### Key Discoveries

| Issue | Solution |
|-------|----------|
| 500 errors on EVM addresses | Use Cosmos address (`fetch1...`) |
| "Signature incorrect" | Sign CHALLENGE not nonce |
| "Signature incorrect" | Use 64-byte R\|\|S (remove recovery byte) |
| "Bad client profile" | Use `client_id: "agentverse"`, `scope: "av"` |
| Token exchange fails | Use `grant_type: "api_key"` with `expires_in` |

### Dependencies

```json
{
  "@cosmjs/crypto": "^0.32.0",
  "bech32": "^2.0.0"
}
```

**Note:** Also uses Node.js built-in `crypto` module for SHA256 and RIPEMD160 in address derivation.

### SDK Function Signature

```typescript
interface WalletAuthConfig {
  privateKey: string;          // Hex, with or without 0x
  expiresIn?: number;          // Seconds, default 2592000 (30 days)
  clientId?: string;           // Default "agentverse"
  scope?: string;              // Default "av"
}

interface WalletAuthResult {
  accessToken: string;
  expiresAt: Date;
  cosmosAddress: string;
  publicKey: string;           // Base64-encoded compressed public key
}

async function walletAuth(config: WalletAuthConfig): Promise<WalletAuthResult>

// Helper: Canonical JSON stringify (required for ADR-036)
function canonicalStringify(obj: unknown): string

// Helper: Derive Cosmos address from private key
function deriveCosmosAddress(privateKeyHex: string): {
  address: string;             // fetch1...
  publicKey: Uint8Array;       // 33-byte compressed pubkey
}
```

### Error Handling

The `walletAuth()` function should throw `AgentLaunchError` with these codes:

| Code | When |
|------|------|
| `INVALID_PRIVATE_KEY` | Private key is not valid 32-byte hex |
| `CHALLENGE_FAILED` | Step 1 (get challenge) failed |
| `SIGNATURE_FAILED` | Signing failed |
| `VERIFY_FAILED` | Step 6 (verify signature) failed |
| `TOKEN_EXCHANGE_FAILED` | Step 7 (get token) failed |
| `NETWORK_ERROR` | Network request failed |

### CLI Usage

```bash
# Get API key from wallet
npx agentlaunch auth wallet --private-key 0x...
npx agentlaunch auth wallet  # Uses WALLET_PRIVATE_KEY from .env

# Save to .env
npx agentlaunch auth wallet --save

# Check current auth
npx agentlaunch auth status
```

### MCP Tools

```json
{
  "name": "wallet_auth",
  "description": "Get Agentverse API key from wallet private key using ADR-036 signature",
  "parameters": {
    "type": "object",
    "properties": {
      "private_key": { "type": "string", "description": "Wallet private key (hex, with or without 0x)" },
      "expires_in": { "type": "number", "description": "Expiry in seconds (default 2592000 = 30 days)" }
    },
    "required": ["private_key"]
  }
}

{
  "name": "check_auth",
  "description": "Verify current Agentverse API key is valid",
  "parameters": {
    "type": "object",
    "properties": {
      "api_key": { "type": "string", "description": "API key to check (optional, uses AGENTVERSE_API_KEY from env if not provided)" }
    },
    "required": []
  }
}
```

---

## Security Considerations

1. **Never log private keys** - SDK, CLI, and MCP tools must never log or display private keys
2. **Memory handling** - Clear private key from memory after use where possible
3. **Token storage** - Recommend `.env` or secure keychain, never plain text files
4. **CLI flag security** - `--private-key` flag should warn about shell history exposure
5. **Environment variable priority** - `WALLET_PRIVATE_KEY` from `.env` is preferred over CLI flag

---

## Reference Implementation

Working code: `scripts/test-wallet-auth-babble.mjs`

## GitHub Issue

https://github.com/fetchai/uAgents/issues/858

---

## Progress

```
Phase 1: SDK        [##########] 7/7 ✅
Phase 2: CLI        [########  ] 6/7 (tests pending)
Phase 3: MCP        [##########] 4/4 ✅
Phase 4: Docs       [########  ] 4/5 (W-22 optional)
Phase 5: Website    [          ] 0/4
Phase 6: Skills     [##########] 2/2 ✅

Total:              [########  ] 25/29
```
