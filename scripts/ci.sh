#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCOPE="${1:-${CI_SCOPE:-all}}"

log() {
  printf "\n[ci] %s\n" "$1"
}

run_gateway() {
  log "Running Go tests (gateway)"
  (cd "$ROOT_DIR/go-gateway" && go test ./...)
}

run_gateway_integration() {
  log "Running Go integration tests (gateway)"
  (cd "$ROOT_DIR/go-gateway" && go test -tags=integration ./...)
}

run_frontend() {
  log "Running frontend lint (next-frontend)"
  (cd "$ROOT_DIR/next-frontend" && npm ci && npm run lint)
}

run_antifraud() {
  log "Running antifraud lint + tests (nestjs-anti-fraud)"
  (cd "$ROOT_DIR/nestjs-anti-fraud" && npm ci && npm run lint && npm test)
}

wait_for() {
  local url="$1"
  local label="$2"
  local retries="${3:-30}"
  local sleep_time="${4:-2}"

  for _ in $(seq 1 "$retries"); do
    if curl -fsS "$url" >/dev/null; then
      log "OK: $label"
      return 0
    fi
    sleep "$sleep_time"
  done

  log "FAIL: $label"
  return 1
}

dump_logs() {
  log "Dumping docker compose logs (nestjs, nestjs-worker)"
  (cd "$ROOT_DIR" && docker compose logs --no-color --tail=200 nestjs nestjs-worker) || true
}

run_smoke() {
  log "Running smoke (docker compose)"
  local nestjs_env="$ROOT_DIR/nestjs-anti-fraud/.env"
  local nestjs_env_backup="$ROOT_DIR/nestjs-anti-fraud/.env.ci.bak"

  if [[ -f "$nestjs_env" ]]; then
    log "Backing up existing nestjs-anti-fraud/.env for smoke"
    cp "$nestjs_env" "$nestjs_env_backup"
  fi

  log "Seeding nestjs-anti-fraud/.env for docker compose smoke"
  cat >"$nestjs_env" <<'EOF'
DATABASE_URL=postgresql://postgres:root@nestjs-db:5432/mydb?schema=public
KAFKA_BROKER=kafka:29092
SUSPICIOUS_VARIATION_PERCENTAGE=50
INVOICES_HISTORY_COUNT=5
SUSPICIOUS_INVOICES_COUNT=3
SUSPICIOUS_TIMEFRAME_HOURS=1
ANTIFRAUD_WORKER_PORT=3101
EOF
  (
    cd "$ROOT_DIR"
    NESTJS_START_CMD=start NESTJS_WORKER_CMD=start:kafka:dev docker compose up -d --build
  )

  wait_for "http://localhost:8080/health" "gateway health"
  if ! wait_for "http://localhost:3001/metrics" "antifraud metrics" 60 2; then
    dump_logs
    return 1
  fi

  log "Smoke OK"
}

run_e2e() {
  log "Running E2E flow"
  (cd "$ROOT_DIR" && ./scripts/e2e.sh)
}

cleanup() {
  if [[ "$SCOPE" == "smoke" || "$SCOPE" == "all" ]]; then
    log "Cleaning up docker compose"
    (cd "$ROOT_DIR" && docker compose down)
  fi

  local nestjs_env="$ROOT_DIR/nestjs-anti-fraud/.env"
  local nestjs_env_backup="$ROOT_DIR/nestjs-anti-fraud/.env.ci.bak"
  if [[ -f "$nestjs_env_backup" ]]; then
    log "Restoring nestjs-anti-fraud/.env from CI backup"
    mv "$nestjs_env_backup" "$nestjs_env"
  fi
}

trap cleanup EXIT

case "$SCOPE" in
  gateway)
    run_gateway
    ;;
  gateway-integration)
    run_gateway_integration
    ;;
  frontend)
    run_frontend
    ;;
  antifraud)
    run_antifraud
    ;;
  smoke)
    run_smoke
    ;;
  e2e)
    run_e2e
    ;;
  all)
    run_gateway
    run_frontend
    run_antifraud
    run_smoke
    ;;
  *)
    echo "Usage: $0 [gateway|gateway-integration|frontend|antifraud|smoke|e2e|all]"
    exit 1
    ;;
esac
