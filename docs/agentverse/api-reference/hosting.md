# Agentverse Hosting API Reference

> Source: https://docs.agentverse.ai/v-1/api-reference/hosting/

Base URL: `https://agentverse.ai/v1`

Auth: `Authorization: Bearer <AGENTVERSE_API_KEY>`

## Create New User Agent

**POST** `/v1/hosting/agents`

### Request Body (NewAgent)
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Name of the new agent |
| readme | string | No | Readme content for the agent |
| avatar_url | string | No | URL of the agent's avatar |
| short_description | string | No | Brief description |
| network | enum | No | "mainnet" or "testnet" |

### Response (Agent)
| Field | Type | Description |
|-------|------|-------------|
| name | string | Name of the agent |
| address | string | Bech32 address of the agent |
| domain | string | Domain name associated |
| prefix | enum | "agent" or "test-agent" |
| running | boolean | Whether currently running |
| compiled | boolean | Whether code has been compiled |
| code_digest | string | Digest of the agent's code |
| wallet_address | string | Wallet address |
| revision | integer | Revision number |
| readme | string | README description |
| short_description | string | Short description |

```python
import requests

url = "https://agentverse.ai/v1/hosting/agents"
payload = {"name": "my-agent"}
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer <API_KEY>"
}
response = requests.post(url, json=payload, headers=headers)
print(response.json())
```

---

## Update User Agent Code

**PUT** `/v1/hosting/agents/{address}/code`

### Path Parameters
| Parameter | Type | Required |
|-----------|------|----------|
| address | string | Yes |

### Request Body (UpdateAgentCode)
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| code | string | Yes | **JSON-stringified** array of files |

**CRITICAL: The code field must be double-encoded JSON:**
```python
import json

code_array = [{"language": "python", "name": "agent.py", "value": source_code}]
payload = {"code": json.dumps(code_array)}  # json.dumps is required!
```

### Response (AgentCodeDigest)
| Field | Type | Description |
|-------|------|-------------|
| digest | string | SHA256 digest of the updated code |

```python
import json, requests

source_code = '''from uagents import Agent, Context
agent = Agent()
# ... agent code ...
'''

code_array = [{"language": "python", "name": "agent.py", "value": source_code}]
payload = {"code": json.dumps(code_array)}

url = f"https://agentverse.ai/v1/hosting/agents/{address}/code"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer <API_KEY>"
}
response = requests.put(url, json=payload, headers=headers)
print(response.json())
```

---

## Start Specific User Agent

**POST** `/v1/hosting/agents/{address}/start`

### Path Parameters
| Parameter | Type | Required |
|-----------|------|----------|
| address | string | Yes |

### Response
Returns the Agent object with updated `running` status.

```python
url = f"https://agentverse.ai/v1/hosting/agents/{address}/start"
response = requests.post(url, headers={"Authorization": "Bearer <API_KEY>"})
print(response.json())
```

---

## Stop Specific User Agent

**POST** `/v1/hosting/agents/{address}/stop`

### Path Parameters
| Parameter | Type | Required |
|-----------|------|----------|
| address | string | Yes |

### Response
Returns the Agent object with updated `running` status.

```python
url = f"https://agentverse.ai/v1/hosting/agents/{address}/stop"
response = requests.post(url, headers={"Authorization": "Bearer <API_KEY>"})
print(response.json())
```

---

## Get Specific User Agent

**GET** `/v1/hosting/agents/{address}`

### Path Parameters
| Parameter | Type | Required |
|-----------|------|----------|
| address | string | Yes |

### Response
Returns the full Agent object.

```python
url = f"https://agentverse.ai/v1/hosting/agents/{address}"
response = requests.get(url, headers={"Authorization": "Bearer <API_KEY>"})
print(response.json())
```

---

## Get Latest Logs For User Agent

**GET** `/v1/hosting/agents/{address}/logs/latest`

### Path Parameters
| Parameter | Type | Required |
|-----------|------|----------|
| address | string | Yes |

### Response (Array of AgentLog)
| Field | Type | Description |
|-------|------|-------------|
| log_timestamp | datetime | When the log was recorded |
| log_entry | string | The log message |
| log_type | enum | "execution" or "system" |
| log_level | enum | "trce", "debg", "info", "erro" |

```python
url = f"https://agentverse.ai/v1/hosting/agents/{address}/logs/latest"
response = requests.get(url, headers={"Authorization": "Bearer <API_KEY>"})
for log in response.json():
    print(f"[{log['log_level']}] {log['log_entry']}")
```

---

## Create User Secret

**POST** `/v1/hosting/secrets`

### Request Body (SecretCreate)
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| address | string | Yes | Agent address |
| name | string | Yes | Secret name (valid Python identifier) |
| secret | string | Yes | The secret value |

### Response (Secret)
| Field | Type | Description |
|-------|------|-------------|
| name | string | Name of the secret |
| secret | string | Masked secret value |
| timestamp | datetime | Creation timestamp |

```python
url = "https://agentverse.ai/v1/hosting/secrets"
payload = {
    "address": "agent1q...",
    "name": "AGENTVERSE_API_KEY",
    "secret": "av-xxx"
}
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer <API_KEY>"
}
response = requests.post(url, json=payload, headers=headers)
print(response.json())
```

---

## Other Hosting Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/hosting/agents` | List user agents |
| DELETE | `/v1/hosting/agents/{address}` | Delete user agent |
| PUT | `/v1/hosting/agents/{address}` | Update agent details |
| GET | `/v1/hosting/agents/{address}/code` | Get agent code |
| POST | `/v1/hosting/agents/{address}/duplicate` | Duplicate agent |
| GET | `/v1/hosting/agents/{address}/storage` | Get agent storage |
| GET | `/v1/hosting/agents/{address}/storage/{key}` | Get storage by key |
| PUT | `/v1/hosting/agents/{address}/storage` | Update storage |
| DELETE | `/v1/hosting/agents/{address}/storage` | Delete storage |
| DELETE | `/v1/hosting/agents/{address}/logs` | Delete logs |
| GET | `/v1/hosting/secrets` | List user secrets |
| DELETE | `/v1/hosting/secrets/{name}` | Delete a secret |

See full API reference: https://docs.agentverse.ai/v-1/api-reference/hosting/list-user-agents
