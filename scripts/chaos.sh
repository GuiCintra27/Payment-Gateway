#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCENARIO="${1:-}"
DURATION="${2:-10}"

log() {
  printf "\n[chaos] %s\n" "$1"
}

wait_for() {
  local url="$1"
  local label="$2"
  local retries="${3:-30}"
  local sleep_time="${4:-2}"

  for _ in $(seq 1 "$retries"); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      log "OK: $label"
      return 0
    fi
    sleep "$sleep_time"
  done

  log "FAIL: $label"
  return 1
}

if [[ -z "$SCENARIO" ]]; then
  echo "Usage: $0 <kafka|gateway-db|antifraud-db|worker-delay> [duration_seconds]" >&2
  exit 1
fi

cd "$ROOT_DIR"

case "$SCENARIO" in
  kafka)
    log "Stopping kafka for ${DURATION}s"
    docker compose stop kafka
    sleep "$DURATION"
    docker compose start kafka
    wait_for "http://localhost:8080/health" "gateway health" 60 2
    ;;
  gateway-db)
    log "Stopping gateway-db for ${DURATION}s"
    docker compose stop gateway-db
    sleep "$DURATION"
    docker compose start gateway-db
    wait_for "http://localhost:8080/health" "gateway health" 60 2
    ;;
  antifraud-db)
    log "Stopping nestjs-db for ${DURATION}s"
    docker compose stop nestjs-db
    sleep "$DURATION"
    docker compose start nestjs-db
    wait_for "http://localhost:3001/metrics" "antifraud metrics" 60 2
    ;;
  worker-delay)
    log "Pausing nestjs-worker for ${DURATION}s"
    docker compose pause nestjs-worker
    sleep "$DURATION"
    docker compose unpause nestjs-worker
    wait_for "http://localhost:3101/metrics" "antifraud worker metrics" 60 2
    ;;
  *)
    echo "Unknown scenario: $SCENARIO" >&2
    exit 1
    ;;
esac

log "Scenario '$SCENARIO' completed"
