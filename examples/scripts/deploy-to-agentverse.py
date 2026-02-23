#!/usr/bin/env python3
"""
Deploy Token Launcher Agent to Agentverse

Usage:
    python deploy-to-agentverse.py API_KEY [AGENT_NAME] [AGENT_FILE]

Arguments:
    API_KEY      Your Agentverse API key (required)
    AGENT_NAME   Agent display name (default: 'AgentLaunch Token Creator')
    AGENT_FILE   Path to agent Python file (default: launcher-agent.py in script dir)

Environment Variables (optional):
    FET_GIFTER_TREASURY_PRIVATE_KEY   Treasury wallet key for FET Gifter agent

Examples:
    # Deploy Token Launcher
    python deploy-to-agentverse.py eyJ...

    # Deploy FET Gifter with treasury (reads from .env)
    source ../../.env && python deploy-to-agentverse.py eyJ... "FET Gifter" fet-gifter-agent.py

This script:
1. Creates a new agent on Agentverse
2. Uploads the agent code from the specified file
3. Sets secrets (API key + treasury key if provided)
4. Starts the agent and waits for compilation

Get your API key at: https://agentverse.ai/profile/api-keys
"""

import json
import os
import sys
import time
import requests

AGENTVERSE_API = "https://agentverse.ai/v1"

# Path to launcher agent code (relative to this script)
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_AGENT_CODE_PATH = os.path.join(SCRIPT_DIR, "launcher-agent.py")


def load_agent_code(agent_file: str = None) -> str:
    """Load agent code from the specified file, or the default launcher-agent.py."""
    code_path = agent_file if agent_file else DEFAULT_AGENT_CODE_PATH
    if os.path.exists(code_path):
        with open(code_path, "r") as f:
            return f.read()
    else:
        print(f"Error: Could not find {code_path}")
        if not agent_file:
            print("Make sure launcher-agent.py exists in the same directory.")
        sys.exit(1)


def deploy_agent(api_key: str, agent_name: str = "AgentLaunch Token Creator", agent_file: str = None) -> dict:
    """
    Deploy an agent to Agentverse.

    Returns dict with agent address and status.
    """
    headers = {
        "Authorization": f"bearer {api_key}",
        "Content-Type": "application/json",
    }

    # Step 1: Create agent
    print(f"Creating agent '{agent_name}'...")
    res = requests.post(
        f"{AGENTVERSE_API}/hosting/agents",
        headers=headers,
        json={"name": agent_name},
    )
    if res.status_code not in (200, 201):
        return {"success": False, "error": f"Failed to create agent: {res.text}"}

    agent_data = res.json()
    agent_addr = agent_data["address"]
    print(f"  Created: {agent_addr}")

    # Step 2: Upload code
    # CRITICAL: Code must be a JSON string containing array of file objects
    print("Uploading code...")
    agent_code = load_agent_code(agent_file)

    code_array = [{
        "language": "python",
        "name": "agent.py",
        "value": agent_code,
    }]

    # Double-encode: the code field must be a JSON string
    code_payload = {"code": json.dumps(code_array)}

    res = requests.put(
        f"{AGENTVERSE_API}/hosting/agents/{agent_addr}/code",
        headers=headers,
        json=code_payload,
    )
    if res.status_code not in (200, 201):
        return {"success": False, "error": f"Failed to upload code: {res.text}"}

    digest = res.json().get("digest", "unknown")
    print(f"  Code uploaded: {digest[:16]}...")

    # Step 3: Set secrets
    print("Setting AGENTVERSE_API_KEY secret...")
    res = requests.post(
        f"{AGENTVERSE_API}/hosting/secrets",
        headers=headers,
        json={
            "address": agent_addr,
            "name": "AGENTVERSE_API_KEY",
            "secret": api_key,
        },
    )
    if res.status_code not in (200, 201):
        return {"success": False, "error": f"Failed to set secret: {res.text}"}
    print("  AGENTVERSE_API_KEY set")

    # Check for treasury key (for FET Gifter agent)
    treasury_key = os.environ.get("FET_GIFTER_TREASURY_PRIVATE_KEY")
    if treasury_key:
        print("Setting TREASURY_PRIVATE_KEY secret...")
        res = requests.post(
            f"{AGENTVERSE_API}/hosting/secrets",
            headers=headers,
            json={
                "address": agent_addr,
                "name": "TREASURY_PRIVATE_KEY",
                "secret": treasury_key,
            },
        )
        if res.status_code not in (200, 201):
            print(f"  Warning: Failed to set treasury secret: {res.text}")
        else:
            print("  TREASURY_PRIVATE_KEY set")

    # Step 4: Start agent
    print("Starting agent...")
    res = requests.post(
        f"{AGENTVERSE_API}/hosting/agents/{agent_addr}/start",
        headers=headers,
    )
    if res.status_code not in (200, 201):
        return {"success": False, "error": f"Failed to start agent: {res.text}"}
    print("  Agent started")

    # Step 5: Wait for compilation
    print("Waiting for compilation...")
    for i in range(12):  # Wait up to 60 seconds
        time.sleep(5)
        res = requests.get(
            f"{AGENTVERSE_API}/hosting/agents/{agent_addr}",
            headers=headers,
        )
        if res.status_code == 200:
            status = res.json()
            if status.get("compiled"):
                print("  Compiled successfully!")
                return {
                    "success": True,
                    "address": agent_addr,
                    "wallet": status.get("wallet_address"),
                    "running": status.get("running"),
                    "compiled": True,
                }
        print(f"  Waiting... ({(i+1)*5}s)")

    return {
        "success": False,
        "error": "Compilation timeout - check agent logs in Agentverse UI",
        "address": agent_addr,
    }


def main():
    # Get API key from argument or environment
    api_key = sys.argv[1] if len(sys.argv) > 1 else os.environ.get("AGENTVERSE_API_KEY")

    if not api_key or len(api_key) < 10:
        print("Usage: python deploy-to-agentverse.py [API_KEY] [AGENT_NAME] [AGENT_FILE]")
        print("  API_KEY     - Your Agentverse API key (or set AGENTVERSE_API_KEY env var)")
        print("  AGENT_NAME  - Agent display name (default: 'AgentLaunch Token Creator')")
        print("  AGENT_FILE  - Path to agent Python file (default: launcher-agent.py)")
        print("")
        print("Example: source ../../.env && python deploy-to-agentverse.py \"FET Gifter\" fet-gifter-agent.py")
        sys.exit(1)

    # If first arg looks like a name (not a JWT), shift args
    if len(sys.argv) > 1 and not sys.argv[1].startswith("eyJ"):
        agent_name = sys.argv[1]
        agent_file = sys.argv[2] if len(sys.argv) > 2 else None
    else:
        agent_name = sys.argv[2] if len(sys.argv) > 2 else "AgentLaunch Token Creator"
        agent_file = sys.argv[3] if len(sys.argv) > 3 else None

    agent_name = agent_name[:64].strip()
    if agent_file and not os.path.exists(agent_file):
        print(f"Error: Agent file not found: {agent_file}")
        sys.exit(1)

    print("⚠️  WARNING: This script stores your API key as the agent's runtime secret.")
    print("   For production, create a dedicated, scoped API key for the agent instead.")

    result = deploy_agent(api_key, agent_name, agent_file)

    print("\n" + "=" * 50)
    if result["success"]:
        print("DEPLOYMENT SUCCESSFUL")
        print("=" * 50)
        print(f"Agent Address: {result['address']}")
        print(f"Wallet:        {result['wallet']}")
        print(f"Status:        Running & Compiled")
        print()
        print("Test with message:")
        print('  "Launch token called MyCoin ticker MC"')
        print()
        print("View at: https://agentverse.ai/agents")
    else:
        print("DEPLOYMENT FAILED")
        print("=" * 50)
        print(f"Error: {result['error']}")
        if result.get("address"):
            print(f"Agent created at: {result['address']}")
            print("Check logs at: https://agentverse.ai/agents")
        sys.exit(1)


if __name__ == "__main__":
    main()
