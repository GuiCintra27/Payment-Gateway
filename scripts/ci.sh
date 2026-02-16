#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCOPE="${1:-${CI_SCOPE:-all}}"
SMOKE_COMPOSE_ARGS=(-f docker-compose.yaml)
SMOKE_NESTJS_ENV=""
SMOKE_NESTJS_ENV_BACKUP=""
SMOKE_NESTJS_ENV_CREATED="false"
SMOKE_TMP_ENV=""
SMOKE_TMP_OVERRIDE=""

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
  local compose_args=("${SMOKE_COMPOSE_ARGS[@]}")
  (cd "$ROOT_DIR" && docker compose "${compose_args[@]}" logs --no-color --tail=200 nestjs nestjs-worker) || true
}

write_smoke_env() {
  cat <<'EOF'
DATABASE_URL=postgresql://postgres:root@nestjs-db:5432/mydb?schema=public
KAFKA_BROKER=kafka:29092
SUSPICIOUS_VARIATION_PERCENTAGE=50
INVOICES_HISTORY_COUNT=5
SUSPICIOUS_INVOICES_COUNT=3
SUSPICIOUS_TIMEFRAME_HOURS=1
ANTIFRAUD_WORKER_PORT=3101
EOF
}

run_smoke() {
  log "Running smoke (docker compose)"
  SMOKE_NESTJS_ENV="$ROOT_DIR/nestjs-anti-fraud/.env"
  SMOKE_NESTJS_ENV_BACKUP="$ROOT_DIR/nestjs-anti-fraud/.env.ci.bak"

  if [[ -w "$(dirname "$SMOKE_NESTJS_ENV")" ]]; then
    if [[ -f "$SMOKE_NESTJS_ENV" ]]; then
      log "Backing up existing nestjs-anti-fraud/.env for smoke"
      cp "$SMOKE_NESTJS_ENV" "$SMOKE_NESTJS_ENV_BACKUP"
    else
      SMOKE_NESTJS_ENV_CREATED="true"
    fi

    log "Seeding nestjs-anti-fraud/.env for docker compose smoke"
    write_smoke_env >"$SMOKE_NESTJS_ENV"
  else
    log "No write permission for nestjs-anti-fraud/.env, using temp env override for smoke"
    SMOKE_TMP_ENV="$(mktemp -t payment-gateway-smoke-env.XXXXXX)"
    SMOKE_TMP_OVERRIDE="$(mktemp -t payment-gateway-smoke-override.XXXXXX.yaml)"
    write_smoke_env >"$SMOKE_TMP_ENV"

    cat >"$SMOKE_TMP_OVERRIDE" <<EOF
services:
  nestjs:
    env_file:
      - $SMOKE_TMP_ENV
  nestjs-worker:
    env_file:
      - $SMOKE_TMP_ENV
  nestjs-migrate:
    env_file:
      - $SMOKE_TMP_ENV
EOF
    SMOKE_COMPOSE_ARGS=(-f docker-compose.yaml -f "$SMOKE_TMP_OVERRIDE")
  fi

  local compose_args=("${SMOKE_COMPOSE_ARGS[@]}")
  (
    cd "$ROOT_DIR"
    NESTJS_START_CMD=start NESTJS_WORKER_CMD=start:kafka:dev docker compose "${compose_args[@]}" up -d --build
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
    local compose_args=("${SMOKE_COMPOSE_ARGS[@]}")
    (cd "$ROOT_DIR" && docker compose "${compose_args[@]}" down)
  fi

  if [[ -n "$SMOKE_NESTJS_ENV_BACKUP" && -f "$SMOKE_NESTJS_ENV_BACKUP" ]]; then
    log "Restoring nestjs-anti-fraud/.env from CI backup"
    if ! mv "$SMOKE_NESTJS_ENV_BACKUP" "$SMOKE_NESTJS_ENV"; then
      log "WARN: failed to move backup .env, trying copy fallback"
      cp "$SMOKE_NESTJS_ENV_BACKUP" "$SMOKE_NESTJS_ENV" 2>/dev/null || true
      rm -f "$SMOKE_NESTJS_ENV_BACKUP" || true
    fi
  elif [[ "$SMOKE_NESTJS_ENV_CREATED" == "true" && -f "$SMOKE_NESTJS_ENV" ]]; then
    log "Removing temporary nestjs-anti-fraud/.env created for smoke"
    rm -f "$SMOKE_NESTJS_ENV" || true
  fi

  if [[ -n "$SMOKE_TMP_ENV" && -f "$SMOKE_TMP_ENV" ]]; then
    rm -f "$SMOKE_TMP_ENV" || true
  fi

  if [[ -n "$SMOKE_TMP_OVERRIDE" && -f "$SMOKE_TMP_OVERRIDE" ]]; then
    rm -f "$SMOKE_TMP_OVERRIDE" || true
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
