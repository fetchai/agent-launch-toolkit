# Wallet Authentication

Obtain Agentverse API keys programmatically using your wallet private key.

## Overview

This feature enables fully autonomous agent lifecycle management. Instead of manually creating API keys through the Agentverse dashboard, agents can authenticate using their wallet to obtain keys programmatically.

## Zero-to-Hero Flow

**Start with absolutely nothing** — no wallet, no API key, no .env file:

```bash
npx agentlaunch auth wallet --generate
```

This single command:
1. Creates a new random wallet
2. Authenticates with Agentverse  
3. Saves both `WALLET_PRIVATE_KEY` and `AGENTVERSE_API_KEY` to `.env`
4. You're ready to build agents immediately!

## Quick Start

### CLI

```bash
# ZERO-TO-HERO: Generate wallet + API key (saves both to .env)
npx agentlaunch auth wallet --generate

# Get API key from existing wallet (uses WALLET_PRIVATE_KEY from .env)
npx agentlaunch auth wallet

# Explicit private key (caution: visible in shell history!)
npx agentlaunch auth wallet --private-key 0x...

# Save the API key to .env automatically
npx agentlaunch auth wallet --save

# Check if current API key is valid
npx agentlaunch auth status
```

### SDK

```typescript
import { 
  authenticateWithWallet, 
  deriveCosmosAddress,
  generateWalletAndAuthenticate 
} from 'agentlaunch-sdk';

// ZERO-TO-HERO: Generate wallet + authenticate in one call
const wallet = await generateWalletAndAuthenticate();
console.log('Private Key:', wallet.privateKey);  // Save this!
console.log('EVM Address:', wallet.evmAddress);
console.log('Cosmos Address:', wallet.cosmosAddress);
console.log('API Key:', wallet.apiKey);          // Ready to use!

// Simple usage with existing wallet
const result = await authenticateWithWallet(process.env.WALLET_PRIVATE_KEY);
console.log('API Key:', result.apiKey);
console.log('Expires:', new Date(result.expiresAt));
console.log('Address:', result.cosmosAddress);

// With options
const result = await authenticateWithWallet({
  privateKey: process.env.WALLET_PRIVATE_KEY,
  expiresIn: 86400, // 1 day (default: 30 days)
});

// Just derive address (no auth)
const address = await deriveCosmosAddress(process.env.WALLET_PRIVATE_KEY);
console.log('Wallet:', address); // fetch1...

// Fluent API
import { AgentLaunch } from 'agentlaunch-sdk';
const al = new AgentLaunch({});
const auth = await al.auth.fromWallet(process.env.WALLET_PRIVATE_KEY);
// Or zero-to-hero:
const wallet = await al.auth.generate();
```

### MCP Tools

```json
// generate_wallet - ZERO-TO-HERO: Create wallet + authenticate
{
  "expires_in": 2592000  // optional
}
// Returns: privateKey, evmAddress, cosmosAddress, apiKey

// wallet_auth - Get API key from existing wallet
{
  "private_key": "0x...",
  "expires_in": 2592000
}

// check_auth - Verify current API key
{}
```

## How It Works

The authentication flow uses Fetch.ai's `accounts.fetch.ai` service:

```
1. Derive Cosmos address from private key
   └─ ripemd160(sha256(compressed_pubkey)) → bech32("fetch", ...)

2. POST /v1/auth/login/wallet/challenge
   └─ Request: { address: "fetch1...", client_id: "agentverse", scope: "av" }
   └─ Response: { challenge: "eyJ...", nonce: "abc123..." }

3. Sign the CHALLENGE in ADR-036 format
   └─ Build sign doc with challenge as base64 data
   └─ Canonical JSON (sorted keys, compact separators)
   └─ SHA256 hash → secp256k1 sign → 64-byte R||S (no recovery byte)

4. POST /v1/auth/login/wallet/verify
   └─ Request: { address, public_key, nonce, challenge, signature, ... }
   └─ Response: { code: "..." }

5. POST /v1/tokens
   └─ Request: { grant_type: "api_key", code, expires_in: 2592000, ... }
   └─ Response: { access_token: "av-..." }
```

## ADR-036 Sign Document

The signing format follows [ADR-036](https://docs.cosmos.network/v0.47/architecture/adr-036-arbitrary-signature):

```json
{
  "account_number": "0",
  "chain_id": "",
  "fee": { "amount": [], "gas": "0" },
  "memo": "",
  "msgs": [{
    "type": "sign/MsgSignData",
    "value": {
      "data": "<base64(challenge)>",
      "signer": "fetch1..."
    }
  }],
  "sequence": "0"
}
```

Key points:
- Sign the **CHALLENGE** (not the nonce)
- Canonical JSON: sorted keys, compact separators (`,` `:`)
- 64-byte signature: R||S only (remove the recovery byte)
- Public key type: `tendermint/PubKeySecp256k1`

## Dependencies

**CLI and MCP:** All crypto dependencies are bundled automatically - no manual installation needed.

**SDK only:** If using the SDK directly in your project, install the optional peer dependencies:
```bash
npm install @cosmjs/crypto bech32 ethers
```

These are checked at runtime. If not installed, a helpful error message is shown.

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `privateKey` | string | required | Hex-encoded private key (with or without 0x) |
| `expiresIn` | number | 2592000 | Token expiration in seconds (30 days) |
| `clientId` | string | "agentverse" | OAuth client ID |
| `scope` | string | "av" | OAuth scope |
| `accountsApiUrl` | string | "https://accounts.fetch.ai/v1" | Auth API base URL |

## Return Value

```typescript
interface WalletAuthResult {
  apiKey: string;        // The Agentverse API key (av-...)
  expiresAt: number;     // Unix timestamp (ms) when key expires
  cosmosAddress: string; // Derived address (fetch1...)
}
```

## Security Considerations

1. **Never log private keys** — The SDK never logs the private key
2. **Prefer env vars** — Use `WALLET_PRIVATE_KEY` in `.env` instead of CLI flags
3. **Shell history** — Using `--private-key` flag leaves the key in shell history
4. **Memory handling** — Private key is only held in memory during authentication
5. **Token storage** — Store the resulting API key securely (e.g., in `.env`)

## Error Handling

```typescript
import { AgentLaunchError, authenticateWithWallet } from 'agentlaunch-sdk';

try {
  const result = await authenticateWithWallet(privateKey);
} catch (err) {
  if (err instanceof AgentLaunchError) {
    switch (err.code) {
      case 'VALIDATION_ERROR':
        console.error('Invalid private key format');
        break;
      case 'UNAUTHORIZED':
        console.error('Signature verification failed');
        break;
      case 'NETWORK_ERROR':
        console.error('Could not reach auth server');
        break;
      default:
        console.error('Auth failed:', err.message);
    }
  }
}
```

## Common Issues

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid private key format" | Wrong key format | Use 32-byte hex (64 chars), with or without `0x` prefix |
| "Signature verification failed" | Wrong signing method | Handled automatically — uses ADR-036 format |
| "Challenge failed: 500" | EVM address used | Handled automatically — derives Cosmos address |

**Note:** Dependency errors like "requires @cosmjs/crypto" or "requires bech32" only occur if using the SDK directly. The CLI and MCP bundle all dependencies automatically.

## Reference

- Working implementation: `scripts/test-wallet-auth-babble.mjs`
- GitHub issue: [fetchai/uAgents#858](https://github.com/fetchai/uAgents/issues/858)
- ADR-036 spec: [Cosmos SDK ADR-036](https://docs.cosmos.network/v0.47/architecture/adr-036-arbitrary-signature)
- Fetch.ai babble repo: Contains official signing implementation
