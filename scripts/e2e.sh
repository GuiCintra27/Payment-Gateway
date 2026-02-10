#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

function wait_for_url() {
  local url="$1"
  local timeout="$2"
  local start
  start=$(date +%s)
  while true; do
    if curl -fsS "$url" >/dev/null 2>&1; then
      return 0
    fi
    if [[ $(( $(date +%s) - start )) -ge $timeout ]]; then
      echo "Timeout waiting for $url" >&2
      return 1
    fi
    sleep 1
  done
}

function json_get_key() {
  local key="$1"
  if command -v jq >/dev/null 2>&1; then
    jq -r ".${key}"
  else
    local raw
    raw=$(cat)
    RAW="$raw" KEY="$key" python3 - <<'PY'
import json
import os

raw = os.environ.get("RAW", "")
key = os.environ.get("KEY", "")
try:
    data = json.loads(raw)
except Exception:
    data = {}
print(data.get(key, ""))
PY
  fi
}

function create_account() {
  local email="$1"
  curl -s -X POST http://localhost:8080/accounts \
    -H 'Content-Type: application/json' \
    -d "{\"name\":\"E2E\",\"email\":\"${email}\"}"
}

cd "$ROOT_DIR"

echo "[e2e] Subindo stack"
docker compose up -d --build

wait_for_url "http://localhost:8080/health" 120
wait_for_url "http://localhost:8080/ready" 120
wait_for_url "http://localhost:3001/metrics" 120

echo "[e2e] Aguardando /accounts ficar disponivel"
for _ in {1..30}; do
  code=$(curl -s -o /tmp/e2e_warmup.json -w "%{http_code}" -X POST http://localhost:8080/accounts \
    -H 'Content-Type: application/json' \
    -d '{"name":"E2E-Warmup","email":"e2e-warmup@local"}')
  if [[ "$code" == "201" || "$code" == "409" ]]; then
    break
  fi
  sleep 2
done

echo "[e2e] Criando conta"
EMAIL="e2e+$(date +%s)@local"
ACCOUNT_JSON=""
for _ in {1..10}; do
  ACCOUNT_JSON=$(create_account "$EMAIL")
  if [[ -n "$ACCOUNT_JSON" && "$ACCOUNT_JSON" == *"api_key"* ]]; then
    break
  fi
  echo "[e2e] create account retry: $ACCOUNT_JSON" >&2
  sleep 2
done

if [[ -z "$ACCOUNT_JSON" ]]; then
  echo "E2E failed: empty response on account creation" >&2
  exit 1
fi
API_KEY=$(echo "$ACCOUNT_JSON" | json_get_key "api_key")
ACCOUNT_ID=$(echo "$ACCOUNT_JSON" | json_get_key "id")
if [[ -z "$API_KEY" || -z "$ACCOUNT_ID" ]]; then
  echo "E2E failed: invalid account response" >&2
  echo "$ACCOUNT_JSON" >&2
  exit 1
fi

echo "[e2e] Criando fatura pending"
INVOICE_JSON=$(curl -fsS -X POST http://localhost:8080/invoice \
  -H 'Content-Type: application/json' \
  -H "X-API-KEY: $API_KEY" \
  -H 'Idempotency-Key: e2e-1' \
  -d '{"amount":20000,"description":"E2E","payment_type":"credit_card","card_number":"4242424242424242","cvv":"123","expiry_month":12,"expiry_year":2030,"cardholder_name":"E2E"}')
INVOICE_ID=$(echo "$INVOICE_JSON" | json_get_key "id")

STATUS="pending"
for i in {1..30}; do
  INVOICE_STATUS_JSON=$(curl -fsS http://localhost:8080/invoice/$INVOICE_ID \
    -H "X-API-KEY: $API_KEY")
  STATUS=$(echo "$INVOICE_STATUS_JSON" | json_get_key "status")
  if [[ "$STATUS" != "pending" ]]; then
    break
  fi
  sleep 2
 done

echo "[e2e] Status final: $STATUS"
if [[ "$STATUS" == "pending" ]]; then
  echo "E2E failed: status ainda pending" >&2
  exit 1
fi

echo "[e2e] OK"
