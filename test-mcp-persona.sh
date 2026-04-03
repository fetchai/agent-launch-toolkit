#!/usr/bin/env bash
# MCP Server E2E Test - Persona 5 (MCP/Claude Code user)
# Tests MCP-equivalent API operations with proper User-Agent header
set -euo pipefail

API="https://launchpad-backend-dev-1056182620041.us-central1.run.app"
UA="agent-launch-mcp/2.3.5"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Load API key from .env
if [ -f "$SCRIPT_DIR/.env" ]; then
  KEY=$(grep AGENTVERSE_API_KEY "$SCRIPT_DIR/.env" | cut -d= -f2)
else
  echo "ERROR: .env not found at $SCRIPT_DIR/.env"
  exit 1
fi

PASS=0
FAIL=0

run_test() {
  local name="$1"
  local expected_code="$2"
  shift 2
  local status
  local body
  local tmpfile=$(mktemp)

  local start=$(python3 -c "import time; print(int(time.time()*1000))")
  status=$(curl -s -o "$tmpfile" -w "%{http_code}" "$@")
  local end=$(python3 -c "import time; print(int(time.time()*1000))")
  local elapsed=$(( end - start ))

  if [ "$status" = "$expected_code" ]; then
    echo "PASS  $name  HTTP $status  ${elapsed}ms"
    PASS=$((PASS + 1))
  else
    echo "FAIL  $name  HTTP $status (expected $expected_code)  ${elapsed}ms"
    head -c 200 "$tmpfile"
    echo ""
    FAIL=$((FAIL + 1))
  fi
  rm -f "$tmpfile"
}

echo "=== MCP Server E2E Tests (Persona 5) ==="
echo ""

# 1. list_tokens
run_test "list_tokens" "200" \
  -H "User-Agent: $UA" "$API/agents/tokens?limit=3"

# 2. get_token
run_test "get_token" "200" \
  -H "User-Agent: $UA" "$API/agents/token/0xD3297d49631d50b7442adBFB9D18ee35d0Fad90f"

# 3. get_platform_stats
run_test "get_platform_stats" "200" \
  -H "User-Agent: $UA" "$API/platform/stats"

# 4. calculate_buy
run_test "calculate_buy" "200" \
  -H "User-Agent: $UA" "$API/tokens/calculate-buy?address=0xD3297d49631d50b7442adBFB9D18ee35d0Fad90f&fetAmount=10"

# 5. create_token_record (tokenize)
TIMESTAMP=$(date +%s)
run_test "create_token_record" "201" \
  -X POST \
  -H "User-Agent: $UA" \
  -H "X-API-Key: $KEY" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"MCP Test $TIMESTAMP\",\"symbol\":\"MCPT\",\"description\":\"MCP persona test\",\"chainId\":97,\"agentAddress\":\"agent1qvuw82dku4tuts3wdnq9nnv5x6dflkq9wa0963rawqschg7z4du2cpmerhy\"}" \
  "$API/agents/tokenize"

# 6. MCP server tool count (JSON-RPC)
TOOL_COUNT=$(echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | \
  AGENT_LAUNCH_ENV=dev node "$SCRIPT_DIR/packages/mcp/dist/index.js" 2>/dev/null | \
  python3 -c "import sys,json; [print(len(json.loads(l).get('result',{}).get('tools',[]))) for l in sys.stdin if l.strip().startswith('{')]" 2>/dev/null | head -1)

if [ "${TOOL_COUNT:-0}" -gt 30 ]; then
  echo "PASS  mcp_tool_count  $TOOL_COUNT tools registered"
  PASS=$((PASS + 1))
else
  echo "FAIL  mcp_tool_count  only ${TOOL_COUNT:-0} tools (expected 30+)"
  FAIL=$((FAIL + 1))
fi

# 7. Analytics source check
MCP_COUNT=$(curl -s -H "User-Agent: $UA" "$API/analytics/sources" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print(next((s['count'] for s in d.get('data',[]) if s.get('source')=='mcp'), 0))" 2>/dev/null)
echo "INFO  analytics_mcp_source  count=$MCP_COUNT"

echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="
[ "$FAIL" -eq 0 ] && exit 0 || exit 1
