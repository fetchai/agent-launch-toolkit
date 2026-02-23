# Error Handling Reference

Common errors, revert reasons, and recovery strategies for agent-launch.ai integration.

## API Errors

### Authentication Errors

**API Key Auth (Recommended)**

| Status | Error | Cause | Recovery |
|--------|-------|-------|----------|
| 401 | `Invalid API key` | Wrong or expired key | Get new key at agentverse.ai/profile/api-keys |
| 401 | `API key required` | Missing X-API-Key header | Add header: `X-API-Key: YOUR_KEY` |

**Example**:
```python
response = requests.post(
    "https://agent-launch.ai/api/agents/tokenize",
    headers={
        "X-API-Key": "YOUR_AGENTVERSE_API_KEY",
        "Content-Type": "application/json"
    },
    json=payload
)
```

**JWT Auth (Alternative)**

| Status | Error | Cause | Recovery |
|--------|-------|-------|----------|
| 401 | `Unauthorized` | Missing or invalid JWT | Re-authenticate with wallet signature |
| 401 | `Token expired` | JWT older than 7 days | Re-authenticate |
| 403 | `Forbidden` | Valid JWT but no permission | Check user role/ownership |

**Recovery Pattern**:
```python
def api_call_with_retry(endpoint, api_key, payload=None):
    res = requests.post(
        endpoint,
        json=payload,
        headers={"X-API-Key": api_key, "Content-Type": "application/json"}
    )
    if res.status_code == 401:
        raise Exception("Invalid API key - get new one at agentverse.ai/profile/api-keys")
    return res
```

### Validation Errors

| Status | Error | Cause | Fix |
|--------|-------|-------|-----|
| 400 | `agentAddress is required` | Missing `agentAddress` field | Provide agent address (agent1q... or 0x...) |
| 400 | `name must be at most 32 characters` | Name > 32 characters | Truncate name |
| 400 | `symbol must be at most 11 characters` | Symbol > 11 characters | Truncate symbol |
| 400 | `description must be at most 500 characters` | Description > 500 chars | Truncate description |

**Validation Pattern**:
```python
def validate_token_payload(agent_address, name=None, symbol=None, description=None):
    errors = []
    if not agent_address:
        errors.append("agentAddress is required")
    if name and len(name) > 32:
        errors.append("name max 32 chars")
    if symbol and len(symbol) > 11:
        errors.append("symbol max 11 chars")
    if description and len(description) > 500:
        errors.append("description max 500 chars")
    return errors
```

### Rate Limiting

| Status | Error | Cause | Recovery |
|--------|-------|-------|----------|
| 429 | `Too many requests` | Rate limit exceeded | Wait and retry with backoff |

**Backoff Pattern**:
```python
import time

def exponential_backoff(attempt, base=1, max_delay=60):
    delay = min(base * (2 ** attempt), max_delay)
    time.sleep(delay)
```

## Agentverse API Errors

### Authentication

| Status | Error | Cause | Recovery |
|--------|-------|-------|----------|
| 401 | `Unauthorized` | Invalid API key | Get new key from agentverse.ai |
| 403 | `Forbidden` | Key revoked or expired | Generate new key |

**Important**: Agentverse uses **lowercase** `bearer` in Authorization header:
```python
headers = {"Authorization": f"bearer {agentverse_key}"}  # lowercase 'bearer'
```

### Agent Not Found

| Status | Error | Cause | Recovery |
|--------|-------|-------|----------|
| 404 | `Agent not found` | Invalid agent address | Verify address format (agent1q...) |

## On-Chain Errors

### FET Approval Failures

| Revert Reason | Cause | Fix |
|---------------|-------|-----|
| `ERC20: insufficient allowance` | Didn't approve enough FET | Call `approve()` first |
| `ERC20: transfer amount exceeds balance` | Not enough FET | Get more FET |

**Check Before Approve**:
```python
def check_balance(w3, fet_contract, wallet, required_amount):
    balance = fet_contract.functions.balanceOf(wallet).call()
    if balance < required_amount:
        raise ValueError(f"Need {required_amount}, have {balance}")
```

### Deploy Failures

| Revert Reason | Cause | Fix |
|---------------|-------|-----|
| `Insufficient deployment fee` | Less than 120 FET approved | Approve 120 FET minimum |
| `Token already exists` | tokenId already used | Use new tokenId from API |
| `Name too long` | Name > 32 bytes | Truncate name |
| `Ticker too long` | Ticker > 11 bytes | Truncate ticker |
| `Invalid tokenId` | tokenId = 0 or already deployed | Get fresh tokenId from API |

**Pre-flight Check**:
```python
def preflight_deploy(w3, deployer, fet, wallet, token_id):
    # Check FET balance
    balance = fet.functions.balanceOf(wallet).call()
    if balance < 120 * 10**18:
        return {"ok": False, "error": "Insufficient FET balance"}

    # Check allowance
    allowance = fet.functions.allowance(wallet, deployer.address).call()
    if allowance < 120 * 10**18:
        return {"ok": False, "error": "FET not approved"}

    return {"ok": True}
```

### Buy/Sell Failures

| Revert Reason | Cause | Fix |
|---------------|-------|-----|
| `Slippage exceeded` | Price moved too much | Increase slippage tolerance |
| `Insufficient balance` | Not enough tokens to sell | Reduce sell amount |
| `Token graduated` | Token on Uniswap now | Trade on Uniswap instead |
| `Trading paused` | Admin paused trading | Wait for unpause |

## Scheduler Sync Issues

### Token Not Appearing

If your token doesn't appear after on-chain deploy:

1. **Wait 2 minutes** - Scheduler polls every 5 seconds
2. **Verify tokenId matches** - Event tokenId must equal API token_id
3. **Check transaction succeeded** - `receipt.status == 1`
4. **Check event emitted** - Look for `TokenCreated` in logs

**Debug Pattern**:
```python
def debug_sync(w3, tx_hash, expected_token_id):
    receipt = w3.eth.get_transaction_receipt(tx_hash)

    if receipt.status != 1:
        return {"error": "Transaction reverted"}

    # Look for TokenCreated event
    for log in receipt.logs:
        # Decode event (simplified)
        if "TokenCreated" in str(log.topics[0]):
            event_token_id = int(log.topics[3].hex(), 16)
            if event_token_id != expected_token_id:
                return {"error": f"tokenId mismatch: {event_token_id} != {expected_token_id}"}

    return {"ok": True, "message": "Event found, scheduler should sync soon"}
```

## Network Errors

### RPC Issues

| Error | Cause | Recovery |
|-------|-------|----------|
| `Connection refused` | RPC down | Try backup RPC |
| `Rate limited` | Too many requests | Use different RPC or wait |
| `Timeout` | Network congestion | Increase timeout, retry |

**RPC Fallback Pattern**:
```python
RPC_URLS = [
    "https://mainnet.base.org",
    "https://base.llamarpc.com",
    "https://base.publicnode.com",
]

def get_working_rpc():
    for rpc in RPC_URLS:
        try:
            w3 = Web3(Web3.HTTPProvider(rpc, request_kwargs={'timeout': 10}))
            w3.eth.block_number  # Test connection
            return w3
        except:
            continue
    raise Exception("All RPCs failed")
```

### Gas Estimation Failures

| Error | Cause | Fix |
|-------|-------|-----|
| `Gas estimation failed` | Transaction would revert | Check inputs, balance |
| `Gas too low` | Gas limit insufficient | Increase gas limit |

**Safe Gas Pattern**:
```python
def estimate_gas_safe(w3, tx, multiplier=1.2):
    try:
        estimate = w3.eth.estimate_gas(tx)
        return int(estimate * multiplier)  # Add 20% buffer
    except Exception as e:
        if "revert" in str(e).lower():
            raise Exception(f"Transaction would revert: {e}")
        return 500000  # Fallback gas limit
```

## Recovery Checklist

When something goes wrong:

1. **Check API response** - Full error message in JSON
2. **Check transaction receipt** - `status`, `gasUsed`, `logs`
3. **Check balances** - FET balance, token balance, allowances
4. **Check tokenId** - Must match between API and on-chain
5. **Check network** - Correct chain ID (8453 for Base)
6. **Wait and retry** - Scheduler may just be slow

## Support Channels

If errors persist:
- Platform: https://agent-launch.ai
- Docs: https://fetch.ants-at-work.com/docs/for-agents
- API Spec: https://fetch.ants-at-work.com/docs/openapi
