#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_NAME="payment-gateway"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

BACKEND_PID=""
ANTIFRAUD_PID=""
ANTIFRAUD_WORKER_PID=""
FRONTEND_PID=""
COMPOSE_CMD=""
INFRA_STARTED="false"

log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

cleanup() {
  local exit_code=$?

  if [ -n "${FRONTEND_PID}" ] && kill -0 "${FRONTEND_PID}" 2>/dev/null; then
    log_warn "Stopping frontend (PID ${FRONTEND_PID})..."
    kill "${FRONTEND_PID}" 2>/dev/null || true
  fi

  if [ -n "${ANTIFRAUD_PID}" ] && kill -0 "${ANTIFRAUD_PID}" 2>/dev/null; then
    log_warn "Stopping antifraud (PID ${ANTIFRAUD_PID})..."
    kill "${ANTIFRAUD_PID}" 2>/dev/null || true
  fi

  if [ -n "${ANTIFRAUD_WORKER_PID}" ] && kill -0 "${ANTIFRAUD_WORKER_PID}" 2>/dev/null; then
    log_warn "Stopping antifraud worker (PID ${ANTIFRAUD_WORKER_PID})..."
    kill "${ANTIFRAUD_WORKER_PID}" 2>/dev/null || true
  fi

  if [ -n "${BACKEND_PID}" ] && kill -0 "${BACKEND_PID}" 2>/dev/null; then
    log_warn "Stopping gateway (PID ${BACKEND_PID})..."
    kill "${BACKEND_PID}" 2>/dev/null || true
  fi

  wait 2>/dev/null || true

  if [ "${exit_code}" -ne 0 ] && [ "${INFRA_STARTED}" = "true" ] && [ -n "${COMPOSE_CMD}" ]; then
    log_warn "Error detected. Stopping infra containers..."
    ${COMPOSE_CMD} -f "${ROOT_DIR}/docker-compose.infra.yaml" down || true
  fi

  if [ "${STOP_INFRA_ON_EXIT:-false}" = "true" ] && [ "${INFRA_STARTED}" = "true" ] && [ -n "${COMPOSE_CMD}" ]; then
    log_warn "Stopping infra containers..."
    ${COMPOSE_CMD} -f "${ROOT_DIR}/docker-compose.infra.yaml" down || true
  fi

  exit ${exit_code}
}

trap cleanup EXIT

log_info "Starting ${PROJECT_NAME} (local dev)..."

command -v docker >/dev/null 2>&1 || { log_error "docker not found. Install Docker first."; exit 1; }
command -v go >/dev/null 2>&1 || { log_error "go not found. Install Go first."; exit 1; }
command -v node >/dev/null 2>&1 || { log_error "node not found. Install Node.js first."; exit 1; }
command -v npm >/dev/null 2>&1 || { log_error "npm not found. Install npm first."; exit 1; }

if docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD="docker-compose"
else
  log_error "docker compose not found."
  exit 1
fi

if [ "${SKIP_INFRA:-false}" != "true" ]; then
  log_info "Starting infra (Postgres + Kafka)..."
  INFRA_STARTED="true"
  ${COMPOSE_CMD} -f "${ROOT_DIR}/docker-compose.infra.yaml" up -d
else
  log_warn "SKIP_INFRA=true set, skipping infra startup."
fi

check_ports() {
  local port="$1"
  local name="$2"

  if ! command -v lsof >/dev/null 2>&1; then
    log_warn "lsof not found, skipping port check for ${name}."
    return 0
  fi

  local pids
  pids="$(lsof -iTCP:${port} -sTCP:LISTEN -t 2>/dev/null || true)"
  if [ -n "${pids}" ]; then
    log_warn "Port ${port} in use for ${name}. PIDs: ${pids}"
    if [ "${FORCE_KILL_PORTS:-false}" = "true" ]; then
      log_warn "FORCE_KILL_PORTS=true set. Killing processes on port ${port}..."
      echo "${pids}" | xargs kill -9 2>/dev/null || true
      sleep 1
    else
      log_error "Port ${port} is busy. Stop it or set FORCE_KILL_PORTS=true."
      exit 1
    fi
  fi
}

GATEWAY_PORT="${GATEWAY_PORT:-8080}"
ANTIFRAUD_PORT="${ANTIFRAUD_PORT:-3001}"
ANTIFRAUD_WORKER_PORT="${ANTIFRAUD_WORKER_PORT:-3101}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"

check_ports "${GATEWAY_PORT}" "API Gateway"
check_ports "${ANTIFRAUD_PORT}" "Anti-fraud"
if [ "${START_ANTIFRAUD_WORKER:-true}" = "true" ]; then
  check_ports "${ANTIFRAUD_WORKER_PORT}" "Anti-fraud worker"
fi
check_ports "${FRONTEND_PORT}" "Frontend"

log_info "Starting API Gateway (Go)..."
check_ports "${GATEWAY_PORT}" "API Gateway"
(
  cd "${ROOT_DIR}/go-gateway"
  go run cmd/app/main.go
) &
BACKEND_PID=$!

sleep 2
if ! kill -0 "${BACKEND_PID}" 2>/dev/null; then
  log_error "Gateway failed to start. Check logs above."
  exit 1
fi
echo -e "${GREEN}[OK]${NC} Gateway running at http://localhost:${GATEWAY_PORT}"

log_info "Starting Anti-fraud (NestJS)..."
check_ports "${ANTIFRAUD_PORT}" "Anti-fraud"
(
  cd "${ROOT_DIR}/nestjs-anti-fraud"
  if [ ! -d "node_modules" ]; then
    log_info "Installing antifraud dependencies..."
    npm install
  fi
  if [ -f ".env.local" ]; then
    set -a
    . ./.env.local
    set +a
  fi
  npx prisma migrate dev
  PORT="${ANTIFRAUD_PORT}" npm run start:dev
) &
ANTIFRAUD_PID=$!

sleep 3
if ! kill -0 "${ANTIFRAUD_PID}" 2>/dev/null; then
  log_error "Antifraud failed to start. Check logs above."
  exit 1
fi
echo -e "${GREEN}[OK]${NC} Antifraud running at http://localhost:${ANTIFRAUD_PORT}"

if [ "${START_ANTIFRAUD_WORKER:-true}" = "true" ]; then
  log_info "Starting Anti-fraud worker (Kafka)..."
  (
    cd "${ROOT_DIR}/nestjs-anti-fraud"
    if [ ! -d "node_modules" ]; then
      log_info "Installing antifraud dependencies..."
      npm install
    fi
    if [ -f ".env.local" ]; then
      set -a
      . ./.env.local
      set +a
    fi
    ANTIFRAUD_WORKER_PORT="${ANTIFRAUD_WORKER_PORT:-3101}" npm run start:kafka:dev
  ) &
  ANTIFRAUD_WORKER_PID=$!

  sleep 3
  if ! kill -0 "${ANTIFRAUD_WORKER_PID}" 2>/dev/null; then
    log_error "Antifraud worker failed to start. Check logs above."
    exit 1
  fi
  echo -e "${GREEN}[OK]${NC} Antifraud worker running (Kafka consumer)"
else
  log_warn "START_ANTIFRAUD_WORKER=false set, skipping Kafka worker."
fi

log_info "Starting Frontend (Next.js)..."
check_ports "${FRONTEND_PORT}" "Frontend"
(
  cd "${ROOT_DIR}/next-frontend"
  if [ ! -d "node_modules" ]; then
    log_info "Installing frontend dependencies..."
    npm install
  fi
  PORT="${FRONTEND_PORT}" npm run dev -- --hostname 0.0.0.0 --port "${FRONTEND_PORT}"
) &
FRONTEND_PID=$!

sleep 3
if ! kill -0 "${FRONTEND_PID}" 2>/dev/null; then
  log_error "Frontend failed to start. Check logs above."
  exit 1
fi
echo -e "${GREEN}[OK]${NC} Frontend running at http://localhost:${FRONTEND_PORT}"

echo ""
echo -e "${GREEN}====================================================${NC}"
echo -e "${GREEN}${PROJECT_NAME} is running locally${NC}"
echo -e "${GREEN}====================================================${NC}"
echo ""
echo -e "Frontend:           ${BLUE}http://localhost:${FRONTEND_PORT}${NC}"
echo -e "Gateway API:        ${BLUE}http://localhost:${GATEWAY_PORT}${NC}"
echo -e "Gateway metrics:    ${BLUE}http://localhost:${GATEWAY_PORT}/metrics${NC}"
echo -e "Anti-fraud API:     ${BLUE}http://localhost:${ANTIFRAUD_PORT}${NC}"
echo -e "Anti-fraud metrics: ${BLUE}http://localhost:${ANTIFRAUD_PORT}/metrics${NC}"
if [ "${START_ANTIFRAUD_WORKER:-true}" = "true" ]; then
  echo -e "Anti-fraud worker:  ${BLUE}running (Kafka consumer)${NC}"
  echo -e "Worker metrics:     ${BLUE}http://localhost:${ANTIFRAUD_WORKER_PORT}/metrics${NC}"
fi
echo ""
echo -e "${YELLOW}Hot-reload is enabled.${NC}"
echo -e "Press ${GREEN}Ctrl+C${NC} to stop local services."
echo ""

if [ -n "${ANTIFRAUD_WORKER_PID}" ]; then
  wait "${BACKEND_PID}" "${ANTIFRAUD_PID}" "${ANTIFRAUD_WORKER_PID}" "${FRONTEND_PID}"
else
  wait "${BACKEND_PID}" "${ANTIFRAUD_PID}" "${FRONTEND_PID}"
fi
