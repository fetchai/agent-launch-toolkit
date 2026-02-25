#!/usr/bin/env python3
"""
Headless AgentVerse Token Launcher

Create tokens with just your Agentverse API key. No wallet needed for token creation.
Optional: provide wallet for on-chain deployment (skip human handoff).

Live API Spec: $AGENT_LAUNCH_FRONTEND_URL/skill.md
Platform:      $AGENT_LAUNCH_FRONTEND_URL

Requirements:
  pip install requests
  pip install web3 eth-account  # Only if using --deploy-onchain

Environment:
  AGENTVERSE_API_KEY         Required: Your Agentverse API key
  AGENT_LAUNCH_API_URL       Optional: API base URL (default: dev backend)
  AGENT_LAUNCH_FRONTEND_URL  Optional: Frontend base URL (default: dev frontend)
  WALLET_PRIVATE_KEY         Optional: For on-chain deployment
  DEPLOYER_ADDRESS           Optional: FETAgentVerseDeployer contract
  RPC_URL                    Optional: BSC RPC (default: https://bsc-dataseed.binance.org)

Usage:
  # Create token (human deploys via handoff link)
  python launch-headless.py --name "MyCoin" --ticker "MC"

  # Create and deploy on-chain (requires wallet)
  python launch-headless.py --name "MyCoin" --ticker "MC" --deploy-onchain

  # List your Agentverse agents
  python launch-headless.py --list-agents
"""

import os
import sys
import argparse
import requests

# Config
API_KEY = os.getenv("AGENTVERSE_API_KEY")
_API_BASE = os.environ.get(
    "AGENT_LAUNCH_API_URL",
    "https://launchpad-backend-dev-1056182620041.us-central1.run.app",
)
_FRONTEND_BASE = os.environ.get(
    "AGENT_LAUNCH_FRONTEND_URL",
    "https://launchpad-frontend-dev-1056182620041.us-central1.run.app",
)
LAUNCH_API = f"{_API_BASE}/api/agents"
AGENTVERSE_API = "https://agentverse.ai/v1"

# On-chain config (optional)
PK = os.getenv("WALLET_PRIVATE_KEY")
RPC = os.getenv("RPC_URL", "https://bsc-dataseed.binance.org")
DEPLOYER = os.getenv("DEPLOYER_ADDRESS")
FET = "0x74F804B4140ee70830B3Eef4e690325841575F89"


def list_agents():
    """List agents from Agentverse."""
    print("Fetching agents from Agentverse...")
    r = requests.get(
        f"{AGENTVERSE_API}/hosting/agents",
        headers={"Authorization": f"Bearer {API_KEY}"},
        timeout=10
    )
    if not r.ok:
        print(f"Error: {r.status_code} - {r.text}")
        return

    agents = r.json()
    print(f"Found {len(agents)} agents:\n")
    for a in agents:
        print(f"  {a.get('name', 'Unnamed')}")
        print(f"    Address: {a.get('address', 'N/A')}")
        print(f"    Messages: {a.get('Pending_messages', 0)}")
        print()


def create_token(name, ticker, description="", logo="", chain_id=97):
    """Create token via API. Returns token data with handoff link."""
    print(f"Creating token: {name} ({ticker})...")

    r = requests.post(
        f"{LAUNCH_API}/launch",
        headers={
            "X-API-Key": API_KEY,
            "Content-Type": "application/json"
        },
        json={
            "name": name[:32],
            "symbol": ticker[:11],
            "description": description or f"AI agent token: {name}",
            "category": {"id": 5},  # AI/ML category
            "logo": logo or "https://picsum.photos/400",
            "chainId": chain_id
        }
    )

    if not r.ok:
        print(f"Error: {r.status_code} - {r.text}")
        sys.exit(1)

    data = r.json()
    if not data.get("success"):
        print(f"Error: {data.get('message', 'Unknown error')}")
        sys.exit(1)

    token = data["data"]
    token_id = token.get("id") or token.get("token_id")

    print(f"\nToken created successfully!")
    print(f"  Name:   {token.get('name')}")
    print(f"  Symbol: {token.get('symbol') or token.get('ticker')}")
    print(f"  ID:     {token_id}")
    print(f"\nHandoff link (send to human to deploy):")
    print(f"  {_FRONTEND_BASE}/deploy/{token_id}")

    return token


def deploy_onchain(token, buy_amount=0):
    """Deploy token on-chain. Requires wallet."""
    try:
        from web3 import Web3
        from eth_account import Account
    except ImportError:
        print("Error: web3 and eth-account required for on-chain deploy")
        print("Run: pip install web3 eth-account")
        sys.exit(1)

    if not PK:
        print("Error: WALLET_PRIVATE_KEY required for on-chain deploy")
        sys.exit(1)
    if not DEPLOYER:
        print("Error: DEPLOYER_ADDRESS required for on-chain deploy")
        sys.exit(1)

    import json

    ERC20_ABI = json.loads(
        '[{"inputs":[{"name":"spender","type":"address"},{"name":"amount","type":"uint256"}],'
        '"name":"approve","outputs":[{"name":"","type":"bool"}],"type":"function"},'
        '{"inputs":[{"name":"account","type":"address"}],"name":"balanceOf",'
        '"outputs":[{"name":"","type":"uint256"}],"type":"function"}]'
    )

    DEPLOYER_ABI = json.loads(
        '[{"inputs":[{"name":"_name","type":"string"},{"name":"_ticker","type":"string"},'
        '{"name":"_picture","type":"string"},{"name":"_maxWalletAmount","type":"uint256"},'
        '{"name":"_tokenId","type":"uint256"},{"name":"_buyAmount","type":"uint256"},'
        '{"name":"_buy","type":"bool"}],"name":"deploy","outputs":[],"type":"function"}]'
    )

    w3 = Web3(Web3.HTTPProvider(RPC))
    acct = Account.from_key(PK)
    chain_id = w3.eth.chain_id

    print(f"\nDeploying on-chain...")
    print(f"  Wallet: {acct.address}")
    print(f"  Chain:  {chain_id}")

    # Check FET balance
    fet = w3.eth.contract(address=Web3.to_checksum_address(FET), abi=ERC20_ABI)
    fee = Web3.to_wei(120, "ether")
    total = fee + Web3.to_wei(buy_amount, "ether")

    bal = fet.functions.balanceOf(acct.address).call()
    print(f"  FET Balance: {Web3.from_wei(bal, 'ether')}")

    if bal < total:
        print(f"  Error: Need {Web3.from_wei(total, 'ether')} FET")
        sys.exit(1)

    # Approve FET
    print("  Approving FET...")
    tx = fet.functions.approve(
        Web3.to_checksum_address(DEPLOYER), total
    ).build_transaction({
        "from": acct.address,
        "nonce": w3.eth.get_transaction_count(acct.address),
        "gas": 100000,
        "gasPrice": w3.eth.gas_price,
        "chainId": chain_id
    })
    signed = acct.sign_transaction(tx)
    receipt = w3.eth.wait_for_transaction_receipt(
        w3.eth.send_raw_transaction(signed.raw_transaction), timeout=120
    )
    if receipt.status != 1:
        print("  Approval failed!")
        sys.exit(1)
    print(f"  Approved: {receipt.transactionHash.hex()}")

    # Deploy
    print("  Deploying token...")
    token_id = token.get("id") or token.get("token_id")
    dep = w3.eth.contract(address=Web3.to_checksum_address(DEPLOYER), abi=DEPLOYER_ABI)

    tx = dep.functions.deploy(
        token.get("name"),
        token.get("symbol") or token.get("ticker"),
        token.get("logo") or token.get("picture") or "",
        1,  # maxWalletAmount
        token_id,
        Web3.to_wei(buy_amount, "ether") if buy_amount > 0 else 0,
        buy_amount > 0
    ).build_transaction({
        "from": acct.address,
        "nonce": w3.eth.get_transaction_count(acct.address),
        "gas": 5000000,
        "gasPrice": w3.eth.gas_price,
        "chainId": chain_id
    })
    signed = acct.sign_transaction(tx)
    receipt = w3.eth.wait_for_transaction_receipt(
        w3.eth.send_raw_transaction(signed.raw_transaction), timeout=300
    )

    if receipt.status == 1:
        print(f"  Deployed: {receipt.transactionHash.hex()}")
        print(f"\nToken is live! View at: {_FRONTEND_BASE}")
    else:
        print("  Deploy failed!")
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        description="Headless AgentVerse Token Launcher",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Create token (human deploys via handoff link)
  python launch-headless.py --name "MyCoin" --ticker "MC"

  # Create and deploy on-chain
  python launch-headless.py --name "MyCoin" --ticker "MC" --deploy-onchain

  # List your agents
  python launch-headless.py --list-agents

Environment:
  AGENTVERSE_API_KEY         Required
  AGENT_LAUNCH_API_URL       Optional: API base URL (default: dev backend)
  AGENT_LAUNCH_FRONTEND_URL  Optional: Frontend base URL (default: dev frontend)
  WALLET_PRIVATE_KEY         For --deploy-onchain
  DEPLOYER_ADDRESS           For --deploy-onchain
        """
    )
    parser.add_argument("--name", help="Token name (max 32 chars)")
    parser.add_argument("--ticker", help="Token symbol (max 11 chars)")
    parser.add_argument("--description", default="", help="Token description")
    parser.add_argument("--logo", default="", help="Logo URL")
    parser.add_argument("--chain-id", type=int, default=97,
                        help="Chain ID: 97 (BSC Testnet) or 56 (BSC Mainnet)")
    parser.add_argument("--deploy-onchain", action="store_true",
                        help="Deploy on-chain (requires wallet)")
    parser.add_argument("--buy-amount", type=float, default=0,
                        help="FET to buy on deploy")
    parser.add_argument("--list-agents", action="store_true",
                        help="List your Agentverse agents")

    args = parser.parse_args()

    if not API_KEY:
        print("Error: AGENTVERSE_API_KEY environment variable required")
        print("Get your key at: https://agentverse.ai/profile/api-keys")
        sys.exit(1)

    print("\n=== AgentVerse Token Launcher ===\n")

    if args.list_agents:
        list_agents()
        return

    if not args.name:
        print("Error: --name required")
        print("Run with --help for usage")
        sys.exit(1)

    ticker = args.ticker or args.name[:6].upper()
    token = create_token(
        args.name,
        ticker,
        args.description,
        args.logo,
        args.chain_id
    )

    if args.deploy_onchain:
        deploy_onchain(token, args.buy_amount)
    else:
        print("\nNext step: Send the handoff link to a human to deploy!")


if __name__ == "__main__":
    main()
