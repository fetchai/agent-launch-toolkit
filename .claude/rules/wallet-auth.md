# Wallet Authentication Rules

## Zero-to-Hero Flow

For users starting from scratch (no API key, no wallet):

```bash
npx agentlaunch auth wallet --generate
```

This creates a new wallet AND authenticates in one step. Saves both `WALLET_PRIVATE_KEY` and `AGENTVERSE_API_KEY` to `.env`.

## Authentication Options

| Scenario | Command |
|----------|---------|
| No keys at all | `npx agentlaunch auth wallet --generate` |
| Have wallet key in .env | `npx agentlaunch auth wallet` |
| Have wallet key, want to pass it | `npx agentlaunch auth wallet --private-key 0x...` |
| Check if current API key works | `npx agentlaunch auth status` |

## SDK Functions

```typescript
import { 
  authenticateWithWallet, 
  deriveCosmosAddress,
  generateWalletAndAuthenticate 
} from 'agentlaunch-sdk';

// Generate new wallet + authenticate (zero-to-hero)
const result = await generateWalletAndAuthenticate();
// result.privateKey, result.evmAddress, result.cosmosAddress, result.apiKey

// Authenticate with existing wallet
const auth = await authenticateWithWallet(process.env.WALLET_PRIVATE_KEY);
// auth.apiKey, auth.cosmosAddress, auth.expiresAt

// Just derive address (no network calls)
const address = await deriveCosmosAddress(privateKey);
// "fetch1..."
```

## MCP Tools

| Tool | Purpose |
|------|---------|
| `wallet_auth` | Get API key from existing wallet private key |
| `check_auth` | Verify current API key is valid |
| `generate_wallet` | Create new wallet + authenticate (zero-to-hero) |

## When to Use

1. **New user onboarding**: Always offer `--generate` flag for zero-to-hero flow
2. **Lost API key**: Can regenerate from wallet key anytime
3. **CI/CD**: Authenticate programmatically in pipelines
4. **Agent bootstrap**: Agents can create their own API keys

## Technical Details

- Uses ADR-036 (Cosmos arbitrary signature) format
- Signs challenge from `accounts.fetch.ai`, not nonce
- 64-byte R||S signature (no recovery byte)
- Requires `@cosmjs/crypto` and `bech32` packages
- API keys default to 30-day expiry (configurable)

## Security

- Never log private keys
- Warn about shell history exposure with `--private-key` flag
- Prefer reading from `.env` over CLI arguments
- API keys can be revoked at agentverse.ai/profile/api-keys

## Address Derivation

```
Private Key (32 bytes hex)
    |
    v
secp256k1 public key (65 bytes uncompressed)
    |
    v
Compressed public key (33 bytes)
    |
    v
SHA256 -> RIPEMD160 (20 bytes)
    |
    v
bech32 encode with "fetch" prefix
    |
    v
"fetch1..." Cosmos address
```
