#!/usr/bin/env bash
# Tests for skills/checking-for-secrets-before-commit/scripts/check-secrets.
# Every fixture value is fake. The core promise under test: findings name
# file, line and kind, and the secret value itself never reaches the output.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SCRIPT_UNDER_TEST="$REPO_ROOT/skills/checking-for-secrets-before-commit/scripts/check-secrets"

FAILURES=0
TEST_ROOT="$(mktemp -d)"

cleanup() {
  rm -rf "$TEST_ROOT"
}
trap cleanup EXIT

pass() {
  echo "  [PASS] $1"
}

fail() {
  echo "  [FAIL] $1"
  FAILURES=$((FAILURES + 1))
}

assert_contains() {
  if printf '%s' "$1" | grep -Fq -- "$2"; then pass "$3"; else fail "$3 (expected: $2)"; fi
}

assert_not_contains() {
  if printf '%s' "$1" | grep -Fq -- "$2"; then fail "$3 (must not contain: $2)"; else pass "$3"; fi
}

assert_exit() {
  if [ "$1" -eq "$2" ]; then pass "$3"; else fail "$3 (exit $1, expected $2)"; fi
}

new_repo() {
  local dir="$TEST_ROOT/$1"
  mkdir -p "$dir"
  git -C "$dir" init -q -b main
  git -C "$dir" config user.name Test
  git -C "$dir" config user.email test@example.com
  printf 'node_modules/\n' >"$dir/.gitignore"
  git -C "$dir" add .gitignore
  git -C "$dir" commit -q -m base
  printf '%s' "$dir"
}

run_check() {
  local rc=0
  OUTPUT="$(cd "$1" && bash "$SCRIPT_UNDER_TEST" 2>&1)" || rc=$?
  RC=$rc
}

STRIPE_FAKE='sk_''live_51FAKEfixture000000000000000000'
AWS_FAKE='AKIAFAKEFIXTURE00000'
PASSWORD_FAKE='hunter2-fake-fixture-value'

echo "check-secrets"

echo " clean staged change passes"
repo="$(new_repo clean)"
printf 'export const answer = 42;\n' >"$repo/app.js"
git -C "$repo" add app.js
run_check "$repo"
assert_exit "$RC" 0 "exit 0 when nothing is found"
assert_contains "$OUTPUT" "no secrets found" "says the staged set is clean"

echo " hardcoded key in staged code"
repo="$(new_repo hardcoded)"
printf '// client\nconst API_KEY = '"'"'%s'"'"';\nmodule.exports = {};\n' "$STRIPE_FAKE" >"$repo/gateway.js"
git -C "$repo" add gateway.js
run_check "$repo"
assert_exit "$RC" 1 "exit 1 on a finding"
assert_contains "$OUTPUT" "gateway.js:2" "names file and line"
assert_contains "$OUTPUT" "Stripe" "names the kind of secret"
assert_not_contains "$OUTPUT" "$STRIPE_FAKE" "never prints the value"
assert_not_contains "$OUTPUT" "51FAKEfixture" "never prints part of the value"

echo " several kinds on separate lines"
repo="$(new_repo several)"
printf 'a = 1\naws = "%s"\npassword = "%s"\n' "$AWS_FAKE" "$PASSWORD_FAKE" >"$repo/config.py"
git -C "$repo" add config.py
run_check "$repo"
assert_contains "$OUTPUT" "config.py:2" "finds the AWS key line"
assert_contains "$OUTPUT" "config.py:3" "finds the password assignment line"
assert_not_contains "$OUTPUT" "$AWS_FAKE" "never prints the AWS value"
assert_not_contains "$OUTPUT" "$PASSWORD_FAKE" "never prints the password value"

echo " private key block"
repo="$(new_repo pem)"
printf -- '-----BEGIN RSA PRIVATE KEY-----\nFAKEFAKEFAKE\n-----END RSA PRIVATE KEY-----\n' >"$repo/deploy.pem"
git -C "$repo" add deploy.pem
run_check "$repo"
assert_exit "$RC" 1 "exit 1 for a private key"
assert_contains "$OUTPUT" "deploy.pem" "flags the key file"
assert_not_contains "$OUTPUT" "FAKEFAKEFAKE" "never prints key material"

echo " staged .env file"
repo="$(new_repo envfile)"
printf 'DB_URL=postgres://fake\n' >"$repo/.env"
git -C "$repo" add -f .env
run_check "$repo"
assert_exit "$RC" 1 "exit 1 when .env is staged"
assert_contains "$OUTPUT" ".env" "names the .env file"
assert_not_contains "$OUTPUT" "postgres://fake" "never prints .env content"

echo " .env.example is allowed"
repo="$(new_repo example)"
printf 'DB_URL=\nAPI_KEY=\n' >"$repo/.env.example"
git -C "$repo" add .env.example
run_check "$repo"
assert_exit "$RC" 0 "exit 0 for an empty-value example file"

echo " unignored .env in the working tree"
repo="$(new_repo unignored)"
printf 'TOKEN=fake\n' >"$repo/.env"
printf 'x = 1\n' >"$repo/ok.txt"
git -C "$repo" add ok.txt
run_check "$repo"
assert_exit "$RC" 1 "exit 1 when .env exists and is not ignored"
assert_contains "$OUTPUT" ".gitignore" "says to add it to .gitignore"

echo " removed lines are not findings"
repo="$(new_repo removed)"
printf 'const k = '"'"'%s'"'"';\n' "$STRIPE_FAKE" >"$repo/old.js"
git -C "$repo" add old.js
git -C "$repo" commit -q -m "old secret" --no-verify
printf 'const k = process.env.STRIPE_KEY;\n' >"$repo/old.js"
git -C "$repo" add old.js
run_check "$repo"
assert_exit "$RC" 0 "exit 0 when the change removes a secret"

echo " env lookups are not findings"
repo="$(new_repo lookups)"
printf 'const password = process.env.DB_PASSWORD;\napi_key = os.environ["API_KEY"]\n' >"$repo/read.js"
git -C "$repo" add read.js
run_check "$repo"
assert_exit "$RC" 0 "exit 0 for code that reads secrets from the environment"

echo " nothing staged"
repo="$(new_repo empty)"
run_check "$repo"
assert_exit "$RC" 0 "exit 0 with nothing staged"
assert_contains "$OUTPUT" "nothing staged" "says nothing is staged"

if [ "$FAILURES" -gt 0 ]; then
  echo "FAILED: $FAILURES"
  exit 1
fi
echo "PASS: check-secrets"
