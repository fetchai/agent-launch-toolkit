#!/bin/bash
#
# Test analytics by simulating each persona's journey through the platform
#
# Personas:
#   1. Creator - scaffold -> deploy -> tokenize
#   2. Trader  - list -> status -> buy preview
#   3. Agent   - skill discovery -> list -> tokenize (API)
#
# Usage: ./scripts/test-analytics-personas.sh [dev|prod]
#

set -e

ENV="${1:-dev}"

if [ "$ENV" = "prod" ]; then
  API_URL="https://agent-launch.ai/api"
  FRONTEND_URL="https://agent-launch.ai"
else
  API_URL="https://launchpad-backend-dev-1056182620041.us-central1.run.app"
  FRONTEND_URL="https://launchpad-frontend-dev-1056182620041.us-central1.run.app"
fi

echo "========================================"
echo "  Analytics Persona Test"
echo "  Environment: $ENV"
echo "  API: $API_URL"
echo "========================================"
echo ""

# Load API key from .env
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

if [ -z "$AGENTVERSE_API_KEY" ]; then
  echo "ERROR: AGENTVERSE_API_KEY not set in .env"
  exit 1
fi

# Unique test ID for this run
TEST_ID=$(date +%s)

echo "Test ID: $TEST_ID"
echo ""

# ============================================================================
# PERSONA 1: CREATOR
# Journey: scaffold -> deploy -> tokenize
# ============================================================================
echo "========================================"
echo "  PERSONA 1: CREATOR"
echo "  Journey: scaffold -> deploy -> tokenize"
echo "========================================"
echo ""

AGENT_NAME="TestCreator${TEST_ID}"

echo "[1/3] Scaffolding agent: $AGENT_NAME (local only)..."
npx agentlaunch scaffold "$AGENT_NAME" --template chat-memory --no-editor 2>&1 | tail -5
echo ""

echo "[2/3] Deploying to Agentverse..."
cd "$AGENT_NAME" 2>/dev/null || true
if [ -f "agent.py" ]; then
  DEPLOY_OUTPUT=$(npx agentlaunch deploy --name "$AGENT_NAME" 2>&1)
  echo "$DEPLOY_OUTPUT" | tail -10
  # Extract agent address from output (looks for agent1q...)
  AGENT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -oE 'agent1q[a-z0-9]+' | head -1)
  echo "Extracted agent address: $AGENT_ADDRESS"
  cd ..
else
  echo "Skipping deploy (no agent.py found)"
  AGENT_ADDRESS=""
fi
echo ""

echo "[3/3] Tokenizing agent..."
if [ -n "$AGENT_ADDRESS" ]; then
  TOKEN_OUTPUT=$(npx agentlaunch tokenize \
    --agent "$AGENT_ADDRESS" \
    --name "Creator Test $TEST_ID" \
    --symbol "CT${TEST_ID: -4}" \
    --description "Test token for analytics persona testing" 2>&1)
  echo "$TOKEN_OUTPUT" | tail -10
  # Extract handoff link
  HANDOFF_LINK=$(echo "$TOKEN_OUTPUT" | grep -oE '/deploy/[0-9]+' | head -1)
  echo "Handoff link: $HANDOFF_LINK"
else
  echo "Skipping tokenize (no agent address)"
fi
echo ""

# Cleanup test directory
rm -rf "$AGENT_NAME" 2>/dev/null || true

# ============================================================================
# PERSONA 2: TRADER
# Journey: list -> status -> buy preview
# ============================================================================
echo "========================================"
echo "  PERSONA 2: TRADER"
echo "  Journey: list -> status -> buy preview"
echo "========================================"
echo ""

echo "[1/3] Listing tokens..."
LIST_OUTPUT=$(npx agentlaunch list --limit 3 2>&1)
echo "$LIST_OUTPUT" | tail -15
# Try to extract a token address (0x...)
FIRST_TOKEN=$(echo "$LIST_OUTPUT" | grep -oE '0x[a-fA-F0-9]{40}' | head -1)
echo "First token address: $FIRST_TOKEN"
echo ""

echo "[2/3] Getting token status..."
if [ -n "$FIRST_TOKEN" ]; then
  STATUS_OUTPUT=$(npx agentlaunch status "$FIRST_TOKEN" 2>&1)
  echo "$STATUS_OUTPUT" | tail -15
else
  echo "No token found to check status"
fi
echo ""

echo "[3/3] Preview buy (dry-run)..."
if [ -n "$FIRST_TOKEN" ]; then
  BUY_OUTPUT=$(npx agentlaunch buy "$FIRST_TOKEN" --amount 10 --dry-run 2>&1)
  echo "$BUY_OUTPUT" | tail -10
else
  echo "No token found for buy preview"
fi
echo ""

# ============================================================================
# PERSONA 3: AGENT (API-style)
# Journey: skill discovery -> list via API -> create token record via API
# ============================================================================
echo "========================================"
echo "  PERSONA 3: AGENT (API-style)"
echo "  Journey: skill discovery -> list -> tokenize"
echo "========================================"
echo ""

echo "[1/3] Fetching skill.md (discovery)..."
SKILL_RESULT=$(curl -s "$FRONTEND_URL/skill.md" | head -20)
echo "$SKILL_RESULT"
echo "..."
echo ""

echo "[2/3] Listing tokens via API..."
API_LIST=$(curl -s "$API_URL/agents/tokens?limit=3" \
  -H "X-API-Key: $AGENTVERSE_API_KEY" \
  -H "User-Agent: python-requests/2.31.0")
echo "$API_LIST" | jq '.tokens[:3] | .[] | {name, symbol, address}' 2>/dev/null || echo "$API_LIST"
echo ""

echo "[3/3] Creating token record via API (no deploy)..."
# This simulates what an agent would do - create a record for later human handoff
API_TOKENIZE=$(curl -s -X POST "$API_URL/agents/tokenize" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $AGENTVERSE_API_KEY" \
  -H "User-Agent: python-requests/2.31.0" \
  -d "{
    \"name\": \"Agent Test $TEST_ID\",
    \"symbol\": \"AT${TEST_ID: -4}\",
    \"description\": \"API-created test token for analytics\",
    \"chainId\": 97
  }")
echo "$API_TOKENIZE" | jq '.' 2>/dev/null || echo "$API_TOKENIZE"
echo ""

# ============================================================================
# SUMMARY
# ============================================================================
echo "========================================"
echo "  SUMMARY"
echo "========================================"
echo ""
echo "Test ID: $TEST_ID"
echo "Environment: $ENV"
echo ""
echo "Events generated:"
echo "  - journey.discovery (skill.md fetch)"
echo "  - journey.authenticated (API key validation)"
echo "  - journey.agent_created (deploy)"
echo "  - journey.tokenized (2x - CLI and API)"
echo ""
echo "Check analytics at:"
echo "  $FRONTEND_URL/admin/analytics"
echo ""
echo "Or query the API:"
echo "  curl '$API_URL/analytics/funnel?period=7d'"
echo ""
echo "Done!"
