#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_NAME="payment-gateway"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

GATEWAY_PORT="${GATEWAY_PORT:-8080}"
ANTIFRAUD_PORT="${ANTIFRAUD_PORT:-3001}"
ANTIFRAUD_WORKER_PORT="${ANTIFRAUD_WORKER_PORT:-3101}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"

START_ANTIFRAUD_WORKER="${START_ANTIFRAUD_WORKER:-true}"
SKIP_INFRA="${SKIP_INFRA:-false}"
FORCE_KILL_PORTS="${FORCE_KILL_PORTS:-false}"
STOP_INFRA_ON_EXIT="${STOP_INFRA_ON_EXIT:-false}"
AUTO_PORTS="${AUTO_PORTS:-false}"
LOG_TO_FILE="${LOG_TO_FILE:-false}"
LOG_DIR="${LOG_DIR:-${ROOT_DIR}/.logs}"
INFRA_START_TIMEOUT="${INFRA_START_TIMEOUT:-60}"
SERVICE_START_TIMEOUT="${SERVICE_START_TIMEOUT:-25}"

KAFKA_REQUIRED="${KAFKA_REQUIRED:-${START_ANTIFRAUD_WORKER}}"

COMPOSE_CMD=""
INFRA_STARTED="false"
INFRA_ALREADY_RUNNING="false"

declare -a PROCESS_PIDS=()
declare -a PROCESS_PGIDS=()
declare -a PROCESS_NAMES=()
declare -a PROCESS_LOGS=()
declare -A RESERVED_PORTS=()

log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

die() {
  log_error "$1"
  exit 1
}

require_cmd() {
  local cmd="$1"
  command -v "${cmd}" >/dev/null 2>&1 || die "${cmd} not found. Install it first."
}

read_env_var() {
  local file="$1"
  local key="$2"
  if [ -f "${file}" ]; then
    grep -E "^${key}=" "${file}" | tail -n1 | cut -d= -f2- | tr -d '"'
  fi
}

port_pids() {
  local port="$1"
  if command -v lsof >/dev/null 2>&1; then
    lsof -iTCP:${port} -sTCP:LISTEN -t 2>/dev/null || true
    return 0
  fi
  if command -v fuser >/dev/null 2>&1; then
    fuser -n tcp "${port}" 2>/dev/null || true
    return 0
  fi
  echo ""
}

port_in_use() {
  local port="$1"
  local pids
  pids="$(port_pids "${port}")"
  if [ -n "${pids}" ]; then
    return 0
  fi
  if command -v nc >/dev/null 2>&1; then
    nc -z 127.0.0.1 "${port}" >/dev/null 2>&1 && return 0 || return 1
  fi
  (echo >/dev/tcp/127.0.0.1/"${port}") >/dev/null 2>&1 && return 0 || return 1
}

is_port_free() {
  local port="$1"
  ! port_in_use "${port}"
}

kill_pids_gracefully() {
  local pids=("$@")
  if [ "${#pids[@]}" -eq 0 ]; then
    return 0
  fi

  log_warn "Sending TERM to PIDs: ${pids[*]}"
  kill "${pids[@]}" 2>/dev/null || true

  for _ in {1..10}; do
    local alive=()
    for pid in "${pids[@]}"; do
      if kill -0 "${pid}" 2>/dev/null; then
        alive+=("${pid}")
      fi
    done
    if [ "${#alive[@]}" -eq 0 ]; then
      return 0
    fi
    sleep 0.5
    pids=("${alive[@]}")
  done

  log_warn "Sending KILL to PIDs: ${pids[*]}"
  kill -9 "${pids[@]}" 2>/dev/null || true
}

find_free_port() {
  local base="$1"
  local owner="$2"
  local max_tries="${3:-20}"
  local port="${base}"
  for _ in $(seq 0 "${max_tries}"); do
    if is_port_available_for_owner "${port}" "${owner}"; then
      echo "${port}"
      return 0
    fi
    port=$((port + 1))
  done
  return 1
}

reserve_port() {
  local owner="$1"
  local port="$2"
  RESERVED_PORTS["${port}"]="${owner}"
}

release_port() {
  local owner="$1"
  local port="$2"
  if [ "${RESERVED_PORTS["${port}"]:-}" = "${owner}" ]; then
    unset "RESERVED_PORTS[${port}]"
  fi
}

is_reserved_by_other_owner() {
  local port="$1"
  local owner="$2"
  local reserved_owner="${RESERVED_PORTS["${port}"]:-}"
  [ -n "${reserved_owner}" ] && [ "${reserved_owner}" != "${owner}" ]
}

is_port_available_for_owner() {
  local port="$1"
  local owner="$2"
  if is_reserved_by_other_owner "${port}" "${owner}"; then
    return 1
  fi
  is_port_free "${port}"
}

resolve_port() {
  local var="$1"
  local name="$2"
  local owner="$3"
  local port="${!var}"

  if is_port_available_for_owner "${port}" "${owner}"; then
    reserve_port "${owner}" "${port}"
    return 0
  fi

  local pids
  pids="$(port_pids "${port}")"

  if [ -n "${pids}" ] && [ "${FORCE_KILL_PORTS}" = "true" ] && ! is_reserved_by_other_owner "${port}" "${owner}"; then
    log_warn "Port ${port} in use for ${name}. Killing processes: ${pids}"
    kill_pids_gracefully ${pids}
  fi

  if is_port_available_for_owner "${port}" "${owner}"; then
    reserve_port "${owner}" "${port}"
    return 0
  fi

  if [ "${AUTO_PORTS}" = "true" ]; then
    local new_port
    new_port="$(find_free_port "${port}" "${owner}" 50)" || die "No free port found for ${name} starting at ${port}."
    log_warn "Port ${port} busy for ${name}. Using ${new_port} instead."
    printf -v "${var}" "%s" "${new_port}"
    reserve_port "${owner}" "${new_port}"
    return 0
  fi

  die "Port ${port} is busy for ${name}. Stop it or set FORCE_KILL_PORTS=true (or AUTO_PORTS=true)."
}

revalidate_port_before_start() {
  local var="$1"
  local name="$2"
  local owner="$3"
  local port="${!var}"

  if is_port_available_for_owner "${port}" "${owner}"; then
    reserve_port "${owner}" "${port}"
    return 0
  fi

  local pids
  pids="$(port_pids "${port}")"
  if [ -n "${pids}" ] && [ "${FORCE_KILL_PORTS}" = "true" ] && ! is_reserved_by_other_owner "${port}" "${owner}"; then
    log_warn "Port ${port} became busy for ${name}. Killing processes: ${pids}"
    kill_pids_gracefully ${pids}
  fi

  if is_port_available_for_owner "${port}" "${owner}"; then
    reserve_port "${owner}" "${port}"
    return 0
  fi

  if [ "${AUTO_PORTS}" = "true" ]; then
    local new_port
    new_port="$(find_free_port "${port}" "${owner}" 100)" || die "No free port found for ${name} during startup."
    release_port "${owner}" "${port}"
    reserve_port "${owner}" "${new_port}"
    printf -v "${var}" "%s" "${new_port}"
    log_warn "${name} port switched to ${new_port} during startup (port ${port} became busy)."
    return 0
  fi

  die "Port ${port} became busy for ${name} during startup."
}

wait_for_port() {
  local host="$1"
  local port="$2"
  local name="$3"
  local timeout="${4:-30}"

  log_info "Waiting for ${name} (${host}:${port})..."
  local start
  start="$(date +%s)"

  while true; do
    if command -v nc >/dev/null 2>&1; then
      nc -z "${host}" "${port}" >/dev/null 2>&1 && { log_info "${name} is ready."; return 0; }
    elif (echo >/dev/tcp/"${host}"/"${port}") >/dev/null 2>&1; then
      log_info "${name} is ready."
      return 0
    fi
    local now
    now="$(date +%s)"
    if [ $((now - start)) -ge "${timeout}" ]; then
      log_error "${name} did not become ready in ${timeout}s."
      return 1
    fi
    sleep 1
  done
}

start_process() {
  local name="$1"
  local cmd="$2"
  local log_file=""
  local pgid=""

  if [ "${LOG_TO_FILE}" = "true" ]; then
    mkdir -p "${LOG_DIR}"
    log_file="${LOG_DIR}/${name}.log"
    : > "${log_file}"
  fi

  if command -v setsid >/dev/null 2>&1; then
    if [ -n "${log_file}" ]; then
      setsid bash -c "${cmd}" >> "${log_file}" 2>&1 &
    else
      setsid bash -c "${cmd}" &
    fi
    pgid="$!"
  else
    if [ -n "${log_file}" ]; then
      bash -c "${cmd}" >> "${log_file}" 2>&1 &
    else
      bash -c "${cmd}" &
    fi
  fi

  local pid=$!
  PROCESS_PIDS+=("${pid}")
  PROCESS_PGIDS+=("${pgid}")
  PROCESS_NAMES+=("${name}")
  PROCESS_LOGS+=("${log_file}")

  sleep 2
  if ! kill -0 "${pid}" 2>/dev/null; then
    log_error "${name} failed to start."
    if [ -n "${log_file}" ]; then
      log_error "Last logs from ${log_file}:"
      tail -n 80 "${log_file}" || true
    fi
    exit 1
  fi
}

stop_process() {
  local name="$1"
  local pid="$2"
  local pgid="$3"

  if [ -z "${pid}" ]; then
    return 0
  fi

  if kill -0 "${pid}" 2>/dev/null; then
    log_warn "Stopping ${name} (PID ${pid})..."
    if [ -n "${pgid}" ]; then
      kill -TERM -- -"${pgid}" 2>/dev/null || true
    else
      kill -TERM "${pid}" 2>/dev/null || true
      if command -v pkill >/dev/null 2>&1; then
        pkill -TERM -P "${pid}" 2>/dev/null || true
      fi
    fi
  fi
}

cleanup() {
  local exit_code=$?

  for i in "${!PROCESS_PIDS[@]}"; do
    stop_process "${PROCESS_NAMES[$i]}" "${PROCESS_PIDS[$i]}" "${PROCESS_PGIDS[$i]}"
  done

  sleep 1

  for i in "${!PROCESS_PIDS[@]}"; do
    local pid="${PROCESS_PIDS[$i]}"
    local pgid="${PROCESS_PGIDS[$i]}"
    if [ -n "${pgid}" ]; then
      kill -0 "${pid}" 2>/dev/null && kill -KILL -- -"${pgid}" 2>/dev/null || true
    else
      kill -0 "${pid}" 2>/dev/null && kill -KILL "${pid}" 2>/dev/null || true
      if command -v pkill >/dev/null 2>&1; then
        pkill -KILL -P "${pid}" 2>/dev/null || true
      fi
    fi
  done

  wait 2>/dev/null || true

  if [ "${exit_code}" -ne 0 ] && [ "${INFRA_STARTED}" = "true" ] && [ -n "${COMPOSE_CMD}" ]; then
    log_warn "Error detected. Stopping infra containers..."
    ${COMPOSE_CMD} -f "${ROOT_DIR}/docker-compose.infra.yaml" down || true
  fi

  if [ "${STOP_INFRA_ON_EXIT}" = "true" ] && [ "${INFRA_STARTED}" = "true" ] && [ -n "${COMPOSE_CMD}" ]; then
    log_warn "Stopping infra containers..."
    ${COMPOSE_CMD} -f "${ROOT_DIR}/docker-compose.infra.yaml" down || true
  fi

  exit "${exit_code}"
}

trap cleanup EXIT

log_info "Starting ${PROJECT_NAME} (local dev)..."

require_cmd docker
require_cmd go
require_cmd node
require_cmd npm

if docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD="docker-compose"
else
  die "docker compose not found."
fi

resolve_port GATEWAY_PORT "API Gateway" "gateway"
resolve_port ANTIFRAUD_PORT "Anti-fraud" "antifraud"
if [ "${START_ANTIFRAUD_WORKER}" = "true" ]; then
  resolve_port ANTIFRAUD_WORKER_PORT "Anti-fraud worker" "antifraud-worker"
fi
resolve_port FRONTEND_PORT "Frontend" "frontend"

log_info "Ports selected: gateway=${GATEWAY_PORT}, antifraud=${ANTIFRAUD_PORT}, worker=${ANTIFRAUD_WORKER_PORT}, frontend=${FRONTEND_PORT}"

if [ "${SKIP_INFRA}" != "true" ]; then
  if ${COMPOSE_CMD} -f "${ROOT_DIR}/docker-compose.infra.yaml" ps 2>/dev/null | grep -E "(gateway-db|nestjs-db|kafka)" | grep -E "Up|running" >/dev/null; then
    INFRA_ALREADY_RUNNING="true"
    log_warn "Infra containers already running. Reusing existing infra."
  fi
  log_info "Starting infra (Postgres + Kafka)..."
  if ! ${COMPOSE_CMD} -f "${ROOT_DIR}/docker-compose.infra.yaml" up -d; then
    log_error "Failed to start infra. Check if ports 5433/5434/9092 are free."
    if command -v lsof >/dev/null 2>&1; then
      lsof -iTCP:5433 -sTCP:LISTEN -n -P || true
      lsof -iTCP:5434 -sTCP:LISTEN -n -P || true
      lsof -iTCP:9092 -sTCP:LISTEN -n -P || true
    fi
    exit 1
  fi
  if [ "${INFRA_ALREADY_RUNNING}" = "false" ]; then
    INFRA_STARTED="true"
  fi

  wait_for_port 127.0.0.1 5434 "Postgres gateway" "${INFRA_START_TIMEOUT}" || exit 1
  wait_for_port 127.0.0.1 5433 "Postgres antifraud" "${INFRA_START_TIMEOUT}" || exit 1
  wait_for_port 127.0.0.1 9092 "Kafka" "${INFRA_START_TIMEOUT}" || exit 1
else
  log_warn "SKIP_INFRA=true set, skipping infra startup."
fi

log_info "Starting API Gateway (Go)..."
revalidate_port_before_start GATEWAY_PORT "API Gateway" "gateway"
start_process "gateway" "cd \"${ROOT_DIR}/go-gateway\" && go run cmd/app/main.go"
wait_for_port 127.0.0.1 "${GATEWAY_PORT}" "Gateway API" "${SERVICE_START_TIMEOUT}" || exit 1
echo -e "${GREEN}[OK]${NC} Gateway running at http://localhost:${GATEWAY_PORT}"

log_info "Starting Anti-fraud (NestJS)..."
revalidate_port_before_start ANTIFRAUD_PORT "Anti-fraud" "antifraud"
start_process "antifraud" "cd \"${ROOT_DIR}/nestjs-anti-fraud\" && if [ ! -d \"node_modules\" ]; then echo '[INFO] Installing antifraud dependencies...'; npm install; fi && if [ -f \".env.local\" ]; then set -a; . ./.env.local; set +a; fi && npx prisma migrate dev && PORT=\"${ANTIFRAUD_PORT}\" npm run start:dev"
wait_for_port 127.0.0.1 "${ANTIFRAUD_PORT}" "Anti-fraud API" "${SERVICE_START_TIMEOUT}" || exit 1
echo -e "${GREEN}[OK]${NC} Antifraud running at http://localhost:${ANTIFRAUD_PORT}"

if [ "${START_ANTIFRAUD_WORKER}" = "true" ]; then
  log_info "Starting Anti-fraud worker (Kafka)..."
  KAFKA_BROKER="${KAFKA_BROKER:-$(read_env_var "${ROOT_DIR}/nestjs-anti-fraud/.env.local" "KAFKA_BROKER")}"
  KAFKA_BROKER="${KAFKA_BROKER:-localhost:9092}"
  KAFKA_HOST="${KAFKA_BROKER%:*}"
  KAFKA_PORT="${KAFKA_BROKER##*:}"

  if ! wait_for_port "${KAFKA_HOST}" "${KAFKA_PORT}" "Kafka broker" "${INFRA_START_TIMEOUT}"; then
    if [ "${KAFKA_REQUIRED}" = "true" ]; then
      die "Kafka broker not reachable at ${KAFKA_BROKER}. Fix it or set START_ANTIFRAUD_WORKER=false."
    else
      log_warn "Kafka broker not reachable at ${KAFKA_BROKER}. Skipping worker (KAFKA_REQUIRED=false)."
      START_ANTIFRAUD_WORKER="false"
    fi
  fi
fi

if [ "${START_ANTIFRAUD_WORKER}" = "true" ]; then
  revalidate_port_before_start ANTIFRAUD_WORKER_PORT "Anti-fraud worker" "antifraud-worker"
  start_process "antifraud-worker" "cd \"${ROOT_DIR}/nestjs-anti-fraud\" && if [ ! -d \"node_modules\" ]; then echo '[INFO] Installing antifraud dependencies...'; npm install; fi && if [ -f \".env.local\" ]; then set -a; . ./.env.local; set +a; fi && ANTIFRAUD_WORKER_PORT=\"${ANTIFRAUD_WORKER_PORT}\" npm run start:kafka:dev"
  wait_for_port 127.0.0.1 "${ANTIFRAUD_WORKER_PORT}" "Anti-fraud worker metrics" "${SERVICE_START_TIMEOUT}" || exit 1
  echo -e "${GREEN}[OK]${NC} Antifraud worker running (Kafka consumer)"
else
  log_warn "START_ANTIFRAUD_WORKER=false set, skipping Kafka worker."
fi

log_info "Starting Frontend (Next.js)..."
revalidate_port_before_start FRONTEND_PORT "Frontend" "frontend"
start_process "frontend" "cd \"${ROOT_DIR}/next-frontend\" && if [ ! -d \"node_modules\" ]; then echo '[INFO] Installing frontend dependencies...'; npm install; fi && PORT=\"${FRONTEND_PORT}\" npm run dev -- --hostname 0.0.0.0 --port \"${FRONTEND_PORT}\""
wait_for_port 127.0.0.1 "${FRONTEND_PORT}" "Frontend" "${SERVICE_START_TIMEOUT}" || exit 1
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
if [ "${START_ANTIFRAUD_WORKER}" = "true" ]; then
  echo -e "Anti-fraud worker:  ${BLUE}running (Kafka consumer)${NC}"
  echo -e "Worker metrics:     ${BLUE}http://localhost:${ANTIFRAUD_WORKER_PORT}/metrics${NC}"
fi
echo ""
echo -e "${YELLOW}Hot-reload is enabled.${NC}"
echo -e "Press ${GREEN}Ctrl+C${NC} to stop local services."
if [ "${LOG_TO_FILE}" = "true" ]; then
  echo -e "Logs dir:           ${BLUE}${LOG_DIR}${NC}"
fi
echo ""

wait "${PROCESS_PIDS[@]}"
