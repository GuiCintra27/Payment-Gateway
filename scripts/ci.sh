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
  if [[ ! -f "$ROOT_DIR/nestjs-anti-fraud/.env" ]]; then
    if [[ -f "$ROOT_DIR/nestjs-anti-fraud/.env.example" ]]; then
      log "Seeding nestjs-anti-fraud/.env from .env.example for CI smoke"
      cp "$ROOT_DIR/nestjs-anti-fraud/.env.example" "$ROOT_DIR/nestjs-anti-fraud/.env"
    else
      log "Missing nestjs-anti-fraud/.env and .env.example"
      return 1
    fi
  fi
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

cleanup() {
  if [[ "$SCOPE" == "smoke" || "$SCOPE" == "all" ]]; then
    log "Cleaning up docker compose"
    (cd "$ROOT_DIR" && docker compose down)
  fi
}

trap cleanup EXIT

case "$SCOPE" in
  gateway)
    run_gateway
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
  all)
    run_gateway
    run_frontend
    run_antifraud
    run_smoke
    ;;
  *)
    echo "Usage: $0 [gateway|frontend|antifraud|smoke|all]"
    exit 1
    ;;
esac
