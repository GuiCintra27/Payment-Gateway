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
ENABLE_OBSERVABILITY="${ENABLE_OBSERVABILITY:-false}"
AUTO_PORTS="${AUTO_PORTS:-false}"
LOG_TO_FILE="${LOG_TO_FILE:-false}"
LOG_DIR="${LOG_DIR:-${ROOT_DIR}/.logs}"
INFRA_START_TIMEOUT="${INFRA_START_TIMEOUT:-60}"
SERVICE_START_TIMEOUT="${SERVICE_START_TIMEOUT:-25}"

KAFKA_REQUIRED="${KAFKA_REQUIRED:-${START_ANTIFRAUD_WORKER}}"

COMPOSE_CMD=""
INFRA_STARTED="false"
INFRA_ALREADY_RUNNING="false"
OBS_MONITORING_STARTED="false"
OBS_MONITORING_ALREADY_RUNNING="false"
OBS_LOGGING_STARTED="false"
OBS_LOGGING_ALREADY_RUNNING="false"
OBS_PROMETHEUS_CONFIG_TMP=""
OBS_PROMTAIL_CONFIG_PATH=""
OBS_LOCAL_LOGS_PATH=""
OBS_PROMETHEUS_TARGET_HOST="host.docker.internal"
OBS_MONITORING_HOST_MODE="false"
OBS_GRAFANA_HTTP_PORT="3004"

declare -a PROCESS_PIDS=()
declare -a PROCESS_PGIDS=()
declare -a PROCESS_NAMES=()
declare -a PROCESS_LOGS=()
declare -a OBS_MONITORING_COMPOSE_FILES=()
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

ensure_writable_path() {
  local path="$1"
  local label="$2"

  if [ ! -e "${path}" ] || [ -w "${path}" ]; then
    return 0
  fi

  log_warn "${label} is not writable (${path}). Attempting ownership fix..."

  if command -v docker >/dev/null 2>&1; then
    local uid gid
    uid="$(id -u)"
    gid="$(id -g)"

    if docker run --rm -v "${path}:/target" alpine:3.19 sh -c "chown -R ${uid}:${gid} /target" >/dev/null 2>&1; then
      log_info "Ownership fixed for ${label}."
      return 0
    fi
  fi

  die "Cannot write to ${path}. Fix permissions manually (e.g. chown -R $(id -u):$(id -g) ${path})."
}

reset_build_dir() {
  local base_dir="$1"
  local rel_dir="$2"
  local label="$3"
  local abs_dir="${base_dir}/${rel_dir}"
  local uid gid
  uid="$(id -u)"
  gid="$(id -g)"

  if command -v docker >/dev/null 2>&1; then
    if docker run --rm -v "${base_dir}:/workspace" alpine:3.19 sh -c "rm -rf /workspace/${rel_dir} && mkdir -p /workspace/${rel_dir} && chown -R ${uid}:${gid} /workspace/${rel_dir}" >/dev/null 2>&1; then
      log_info "Reset ${label} directory."
      return 0
    fi
  fi

  rm -rf "${abs_dir}" 2>/dev/null || true
  mkdir -p "${abs_dir}" 2>/dev/null || true
  if [ -e "${abs_dir}" ] && [ -w "${abs_dir}" ]; then
    return 0
  fi
  die "Cannot reset ${label} directory at ${abs_dir}."
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

ensure_docker_network() {
  local network_name="$1"
  if docker network inspect "${network_name}" >/dev/null 2>&1; then
    return 0
  fi
  log_warn "Docker network ${network_name} not found. Creating it for observability stack..."
  docker network create "${network_name}" >/dev/null
}

write_prometheus_startdev_config() {
  local config_path="$1"
  cat >"${config_path}" <<EOF
global:
  scrape_interval: 5s
  evaluation_interval: 5s

scrape_configs:
  - job_name: gateway
    metrics_path: /metrics/prom
    static_configs:
      - targets: ["${OBS_PROMETHEUS_TARGET_HOST}:${GATEWAY_PORT}"]

  - job_name: antifraud
    metrics_path: /metrics/prom
    static_configs:
      - targets: ["${OBS_PROMETHEUS_TARGET_HOST}:${ANTIFRAUD_PORT}"]
EOF

  if [ "${START_ANTIFRAUD_WORKER}" = "true" ]; then
    cat >>"${config_path}" <<EOF

  - job_name: antifraud_worker
    metrics_path: /metrics/prom
    static_configs:
      - targets: ["${OBS_PROMETHEUS_TARGET_HOST}:${ANTIFRAUD_WORKER_PORT}"]
EOF
  fi
}

setup_observability_monitoring_mode() {
  OBS_MONITORING_COMPOSE_FILES=("-f" "${ROOT_DIR}/docker-compose.monitoring.yaml")
  OBS_MONITORING_HOST_MODE="false"
  OBS_PROMETHEUS_TARGET_HOST="host.docker.internal"

  local os_name
  os_name="$(uname -s 2>/dev/null || echo unknown)"
  if [ "${os_name}" = "Linux" ]; then
    OBS_MONITORING_HOST_MODE="true"
    OBS_PROMETHEUS_TARGET_HOST="127.0.0.1"
    OBS_MONITORING_COMPOSE_FILES=("-f" "${ROOT_DIR}/docker-compose.monitoring.startdev.yaml")
    log_warn "Linux detected. Using host-network monitoring override to ensure Prometheus scrape of local services."
  fi
}

start_observability_stack() {
  if [ "${ENABLE_OBSERVABILITY}" != "true" ]; then
    return 0
  fi

  if [ "${LOG_TO_FILE}" != "true" ]; then
    log_warn "ENABLE_OBSERVABILITY=true detected. Forcing LOG_TO_FILE=true to ingest local process logs in Loki."
    LOG_TO_FILE="true"
  fi

  mkdir -p "${LOG_DIR}"
  ensure_writable_path "${LOG_DIR}" "local logs directory"

  setup_observability_monitoring_mode

  OBS_PROMETHEUS_CONFIG_TMP="$(mktemp -t payment-gateway-prometheus.startdev.XXXXXX.yml)"
  write_prometheus_startdev_config "${OBS_PROMETHEUS_CONFIG_TMP}"
  chmod 644 "${OBS_PROMETHEUS_CONFIG_TMP}"

  OBS_PROMTAIL_CONFIG_PATH="${ROOT_DIR}/monitoring/promtail.local-config.yml"
  OBS_LOCAL_LOGS_PATH="${LOG_DIR}"

  if [ "${OBS_MONITORING_HOST_MODE}" != "true" ]; then
    ensure_docker_network "payment-gateway_default"
  fi

  if ${COMPOSE_CMD} "${OBS_MONITORING_COMPOSE_FILES[@]}" ps 2>/dev/null | grep -E "(prometheus|grafana)" | grep -E "Up|running" >/dev/null; then
    OBS_MONITORING_ALREADY_RUNNING="true"
    log_warn "Monitoring stack already running. Reusing existing services."
  fi

  local prometheus_url="http://prometheus:9090"
  local grafana_http_port="3000"
  if [ "${OBS_MONITORING_HOST_MODE}" = "true" ]; then
    prometheus_url="http://127.0.0.1:9090"
    grafana_http_port="${OBS_GRAFANA_HTTP_PORT}"
  fi

  log_info "Starting observability monitoring stack (Prometheus + Grafana)..."
  if ! env PROMETHEUS_CONFIG_PATH="${OBS_PROMETHEUS_CONFIG_TMP}" PROMETHEUS_URL="${prometheus_url}" GRAFANA_HTTP_PORT="${grafana_http_port}" ${COMPOSE_CMD} "${OBS_MONITORING_COMPOSE_FILES[@]}" up -d; then
    die "Failed to start monitoring stack."
  fi
  if [ "${OBS_MONITORING_ALREADY_RUNNING}" = "false" ]; then
    OBS_MONITORING_STARTED="true"
  fi

  if ${COMPOSE_CMD} -f "${ROOT_DIR}/docker-compose.logging.yaml" ps 2>/dev/null | grep -E "(loki|promtail|grafana-logs)" | grep -E "Up|running" >/dev/null; then
    OBS_LOGGING_ALREADY_RUNNING="true"
    log_warn "Logging stack already running. Reusing existing services."
  fi

  log_info "Starting observability logging stack (Loki + Promtail + Grafana)..."
  if ! env PROMTAIL_CONFIG_PATH="${OBS_PROMTAIL_CONFIG_PATH}" PROMTAIL_LOCAL_LOGS_PATH="${OBS_LOCAL_LOGS_PATH}" ${COMPOSE_CMD} -f "${ROOT_DIR}/docker-compose.logging.yaml" up -d; then
    die "Failed to start logging stack."
  fi
  if [ "${OBS_LOGGING_ALREADY_RUNNING}" = "false" ]; then
    OBS_LOGGING_STARTED="true"
  fi

  wait_for_port 127.0.0.1 9090 "Prometheus" "${INFRA_START_TIMEOUT}" || die "Prometheus did not become ready."
  wait_for_port 127.0.0.1 3004 "Grafana (monitoring)" "${INFRA_START_TIMEOUT}" || die "Grafana (monitoring) did not become ready."
  wait_for_port 127.0.0.1 3100 "Loki" "${INFRA_START_TIMEOUT}" || die "Loki did not become ready."
  wait_for_port 127.0.0.1 3005 "Grafana (logs)" "${INFRA_START_TIMEOUT}" || die "Grafana (logs) did not become ready."
}

stop_observability_stack() {
  if [ "${ENABLE_OBSERVABILITY}" != "true" ] || [ -z "${COMPOSE_CMD}" ]; then
    return 0
  fi

  local should_stop="${1:-false}"
  if [ "${should_stop}" != "true" ]; then
    return 0
  fi

  if [ "${OBS_MONITORING_STARTED}" = "true" ]; then
    log_warn "Stopping observability monitoring stack..."
    if [ "${#OBS_MONITORING_COMPOSE_FILES[@]}" -eq 0 ]; then
      OBS_MONITORING_COMPOSE_FILES=("-f" "${ROOT_DIR}/docker-compose.monitoring.yaml")
    fi
    ${COMPOSE_CMD} "${OBS_MONITORING_COMPOSE_FILES[@]}" down || true
  fi
  if [ "${OBS_LOGGING_STARTED}" = "true" ]; then
    log_warn "Stopping observability logging stack..."
    ${COMPOSE_CMD} -f "${ROOT_DIR}/docker-compose.logging.yaml" down || true
  fi
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
  local observability_stopped="false"

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

  if [ "${exit_code}" -ne 0 ]; then
    stop_observability_stack "true"
    observability_stopped="true"
  fi

  if [ "${STOP_INFRA_ON_EXIT}" = "true" ] && [ "${INFRA_STARTED}" = "true" ] && [ -n "${COMPOSE_CMD}" ]; then
    log_warn "Stopping infra containers..."
    ${COMPOSE_CMD} -f "${ROOT_DIR}/docker-compose.infra.yaml" down || true
  fi

  if [ "${STOP_INFRA_ON_EXIT}" = "true" ] && [ "${observability_stopped}" = "false" ]; then
    stop_observability_stack "true"
  fi

  if [ -n "${OBS_PROMETHEUS_CONFIG_TMP}" ] && [ -f "${OBS_PROMETHEUS_CONFIG_TMP}" ]; then
    rm -f "${OBS_PROMETHEUS_CONFIG_TMP}"
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

if [ "${START_ANTIFRAUD_WORKER}" = "true" ]; then
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

start_observability_stack

log_info "Starting API Gateway (Go)..."
revalidate_port_before_start GATEWAY_PORT "API Gateway" "gateway"
GATEWAY_ENV_FILE=""
if [ -f "${ROOT_DIR}/go-gateway/.env.local" ]; then
  GATEWAY_ENV_FILE="${ROOT_DIR}/go-gateway/.env.local"
elif [ -f "${ROOT_DIR}/go-gateway/.env" ]; then
  GATEWAY_ENV_FILE="${ROOT_DIR}/go-gateway/.env"
fi
start_process "gateway" "cd \"${ROOT_DIR}/go-gateway\" && if [ -n \"${GATEWAY_ENV_FILE}\" ]; then set -a; . \"${GATEWAY_ENV_FILE}\"; set +a; fi && HTTP_PORT=\"${GATEWAY_PORT}\" go run cmd/app/main.go"
wait_for_port 127.0.0.1 "${GATEWAY_PORT}" "Gateway API" "${SERVICE_START_TIMEOUT}" || exit 1
echo -e "${GREEN}[OK]${NC} Gateway running at http://localhost:${GATEWAY_PORT}"

log_info "Starting Anti-fraud (NestJS)..."
revalidate_port_before_start ANTIFRAUD_PORT "Anti-fraud" "antifraud"
ensure_writable_path "${ROOT_DIR}/nestjs-anti-fraud" "antifraud workspace"
reset_build_dir "${ROOT_DIR}/nestjs-anti-fraud" "dist" "antifraud dist"
ensure_writable_path "${ROOT_DIR}/nestjs-anti-fraud/dist" "antifraud dist"
ensure_writable_path "${ROOT_DIR}/nestjs-anti-fraud/node_modules" "antifraud node_modules"
if command -v chown >/dev/null 2>&1; then
  chown -R "$(id -u):$(id -g)" "${ROOT_DIR}/nestjs-anti-fraud/dist" >/dev/null 2>&1 || true
fi
start_process "antifraud" "cd \"${ROOT_DIR}/nestjs-anti-fraud\" && if [ ! -d \"node_modules\" ]; then echo '[INFO] Installing antifraud dependencies...'; npm install; fi && if [ -f \".env.local\" ]; then set -a; . ./.env.local; set +a; fi && npx prisma migrate deploy && PORT=\"${ANTIFRAUD_PORT}\" npm run start:dev"
wait_for_port 127.0.0.1 "${ANTIFRAUD_PORT}" "Anti-fraud API" "${SERVICE_START_TIMEOUT}" || exit 1
echo -e "${GREEN}[OK]${NC} Antifraud running at http://localhost:${ANTIFRAUD_PORT}"

if [ "${START_ANTIFRAUD_WORKER}" = "true" ]; then
  log_info "Starting Anti-fraud worker (Kafka)..."
  revalidate_port_before_start ANTIFRAUD_WORKER_PORT "Anti-fraud worker" "antifraud-worker"
  start_process "antifraud-worker" "cd \"${ROOT_DIR}/nestjs-anti-fraud\" && if [ ! -d \"node_modules\" ]; then echo '[INFO] Installing antifraud dependencies...'; npm install; fi && if [ -f \".env.local\" ]; then set -a; . ./.env.local; set +a; fi && ANTIFRAUD_WORKER_PORT=\"${ANTIFRAUD_WORKER_PORT}\" npm run start:kafka:dev"
  wait_for_port 127.0.0.1 "${ANTIFRAUD_WORKER_PORT}" "Anti-fraud worker metrics" "${SERVICE_START_TIMEOUT}" || exit 1
  echo -e "${GREEN}[OK]${NC} Antifraud worker running (Kafka consumer)"
else
  log_warn "START_ANTIFRAUD_WORKER=false set, skipping Kafka worker."
fi

log_info "Starting Frontend (Next.js)..."
revalidate_port_before_start FRONTEND_PORT "Frontend" "frontend"
ensure_writable_path "${ROOT_DIR}/next-frontend" "frontend workspace"
reset_build_dir "${ROOT_DIR}/next-frontend" ".next" "frontend .next"
ensure_writable_path "${ROOT_DIR}/next-frontend/.next" "frontend .next"
ensure_writable_path "${ROOT_DIR}/next-frontend/node_modules" "frontend node_modules"
ensure_writable_path "${ROOT_DIR}/next-frontend/package-lock.json" "frontend package-lock.json"
if command -v chown >/dev/null 2>&1; then
  chown -R "$(id -u):$(id -g)" "${ROOT_DIR}/next-frontend/.next" >/dev/null 2>&1 || true
fi
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
if [ "${ENABLE_OBSERVABILITY}" = "true" ]; then
  echo -e "Prometheus:         ${BLUE}http://localhost:9090${NC}"
  echo -e "Grafana metrics:    ${BLUE}http://localhost:3004${NC}"
  echo -e "Loki health:        ${BLUE}http://localhost:3100/ready${NC}"
  echo -e "Grafana logs:       ${BLUE}http://localhost:3005${NC}"
fi
echo ""
echo -e "${YELLOW}Hot-reload is enabled.${NC}"
echo -e "Press ${GREEN}Ctrl+C${NC} to stop local services."
if [ "${LOG_TO_FILE}" = "true" ]; then
  echo -e "Logs dir:           ${BLUE}${LOG_DIR}${NC}"
fi
echo ""

wait "${PROCESS_PIDS[@]}"
