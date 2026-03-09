#!/usr/bin/env bash
#
# test-publish.sh — Test all packages as if installed from npm.
#
# Builds, packs tarballs, installs them in an isolated temp directory,
# and runs smoke tests to verify exports, binaries, and interop.
#
# Usage:
#   npm run test:publish        # from repo root
#   bash scripts/test-publish.sh
#

set -euo pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

TEMP_DIR=""
cleanup() {
  if [ -n "$TEMP_DIR" ] && [ -d "$TEMP_DIR" ]; then
    rm -rf "$TEMP_DIR"
  fi
}
trap cleanup EXIT

log()  { echo -e "${GREEN}[test-publish]${NC} $*"; }
warn() { echo -e "${YELLOW}[test-publish]${NC} $*"; }
fail() { echo -e "${RED}[test-publish]${NC} $*"; exit 1; }
step() { echo -e "\n${BOLD}── $* ──${NC}"; }

# ── Step 1: Clean + Build ──────────────────────────────────────────────
step "Cleaning and building all packages"
cd "$ROOT_DIR"
npm run clean 2>/dev/null || true
npm run build

# ── Step 2: Pack ───────────────────────────────────────────────────────
step "Packing tarballs"
TEMP_DIR=$(mktemp -d)
PACK_DIR="$TEMP_DIR/packs"
mkdir -p "$PACK_DIR"

# npm pack outputs the filename to stdout
SDK_TGZ=$(cd "$ROOT_DIR/packages/sdk" && npm pack --pack-destination "$PACK_DIR" 2>/dev/null)
TEMPLATES_TGZ=$(cd "$ROOT_DIR/packages/templates" && npm pack --pack-destination "$PACK_DIR" 2>/dev/null)
CLI_TGZ=$(cd "$ROOT_DIR/packages/cli" && npm pack --pack-destination "$PACK_DIR" 2>/dev/null)
MCP_TGZ=$(cd "$ROOT_DIR/packages/mcp" && npm pack --pack-destination "$PACK_DIR" 2>/dev/null)

log "SDK:       $SDK_TGZ"
log "Templates: $TEMPLATES_TGZ"
log "CLI:       $CLI_TGZ"
log "MCP:       $MCP_TGZ"

# Verify all tarballs exist
for tgz in "$SDK_TGZ" "$TEMPLATES_TGZ" "$CLI_TGZ" "$MCP_TGZ"; do
  [ -f "$PACK_DIR/$tgz" ] || fail "Tarball not found: $PACK_DIR/$tgz"
done

# ── Step 3: Show tarball contents ──────────────────────────────────────
step "Checking tarball contents"
for tgz in "$SDK_TGZ" "$TEMPLATES_TGZ" "$CLI_TGZ" "$MCP_TGZ"; do
  echo -e "${BOLD}$tgz${NC}"
  tar tzf "$PACK_DIR/$tgz" | head -20
  FILE_COUNT=$(tar tzf "$PACK_DIR/$tgz" | wc -l | tr -d ' ')
  echo "  ($FILE_COUNT files total)"
  echo ""
done

# ── Step 4: Create isolated test project ───────────────────────────────
step "Creating isolated test project"
TEST_DIR="$TEMP_DIR/test-project"
mkdir -p "$TEST_DIR"

cat > "$TEST_DIR/package.json" <<'EOF'
{
  "name": "test-publish-smoke",
  "version": "1.0.0",
  "private": true,
  "type": "module"
}
EOF

# ── Step 5: Install tarballs ──────────────────────────────────────────
step "Installing from tarballs (simulates npm install)"
cd "$TEST_DIR"
npm install \
  "$PACK_DIR/$SDK_TGZ" \
  "$PACK_DIR/$TEMPLATES_TGZ" \
  "$PACK_DIR/$CLI_TGZ" \
  "$PACK_DIR/$MCP_TGZ" \
  2>&1

# Show what got installed
log "Installed packages:"
ls node_modules/ | grep -E "^(agentlaunch|agent-launch)" || true

# ── Step 6: Copy and run smoke tests ──────────────────────────────────
step "Running smoke tests"
cp "$SCRIPT_DIR/smoke-tests/"* "$TEST_DIR/" 2>/dev/null || true

PASSED=0
FAILED=0
TESTS=()

# Discover all test files (.mjs and .cjs)
for test_file in "$TEST_DIR"/test-*.mjs "$TEST_DIR"/test-*.cjs; do
  [ -f "$test_file" ] && TESTS+=("$(basename "$test_file")")
done

if [ ${#TESTS[@]} -eq 0 ]; then
  fail "No smoke tests found in scripts/smoke-tests/"
fi

for test in "${TESTS[@]}"; do
  if node "$TEST_DIR/$test" 2>&1; then
    echo -e "  ${GREEN}PASS${NC}  $test"
    PASSED=$((PASSED + 1))
  else
    echo -e "  ${RED}FAIL${NC}  $test"
    FAILED=$((FAILED + 1))
  fi
done

# ── Results ────────────────────────────────────────────────────────────
echo ""
step "Results"
echo -e "  ${GREEN}$PASSED passed${NC}"
[ $FAILED -gt 0 ] && echo -e "  ${RED}$FAILED failed${NC}"
echo ""

if [ $FAILED -gt 0 ]; then
  fail "Some smoke tests failed. Fix issues before publishing."
fi

log "All smoke tests passed. Safe to publish."
