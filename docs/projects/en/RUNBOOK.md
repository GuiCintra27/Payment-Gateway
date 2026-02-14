# Runbook

[PT-BR](../RUNBOOK.md) | **EN**

## Start Locally (script)

```bash
./start-dev.sh
```

Useful variables:

- `SKIP_INFRA=true` (does not start Kafka/Postgres)
- `FORCE_KILL_PORTS=true` (frees busy ports automatically)
- `STOP_INFRA_ON_EXIT=true` (stops infra on exit)
- `ANTIFRAUD_WORKER_PORT=3101` (worker/metrics port)
- `AUTO_PORTS=true` (automatically picks next free port)
- `LOG_TO_FILE=true` (writes logs to files)
- `LOG_DIR=./.logs` (logs folder when `LOG_TO_FILE=true`)
- `INFRA_START_TIMEOUT=60` (Kafka/Postgres timeout)
- `SERVICE_START_TIMEOUT=25` (API/frontend startup timeout)
- `KAFKA_REQUIRED=true` (fails if Kafka is unavailable while worker is active)

## Start Full Stack with Docker

```bash
docker compose up -d --build
```

## Start Infra Only

```bash
docker compose -f docker-compose.infra.yaml up -d
```

## Health Checks

- Gateway liveness: `GET /health`
- Gateway readiness: `GET /ready`
- Gateway metrics: `GET /metrics`
- Gateway metrics (Prometheus): `GET /metrics/prom`
- Anti-fraud metrics (HTTP): `GET /metrics`
- Anti-fraud metrics (Kafka worker): `GET /metrics` on `ANTIFRAUD_WORKER_PORT`
- Anti-fraud metrics (Prometheus): `GET /metrics/prom` (API + worker)

## Monitoring (Prometheus + Grafana)

```bash
docker compose -f docker-compose.monitoring.yaml up -d
```

Ports:

- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3004` (admin/admin)

## Logging (Loki + Promtail + Grafana)

```bash
docker compose -f docker-compose.logging.yaml up -d
```

Ports:

- Loki: `http://localhost:3100`
- Logs Grafana: `http://localhost:3005` (admin/admin)

## Basic Alerts (suggested)

- 5xx error rate above 1% for 5 minutes.
- No anti-fraud events processed in 10 minutes (possible backlog).
- Processing lag above 10s for 5 minutes.

## DLQ Replay (gateway)

Dry-run (does not publish):

```bash
cd go-gateway
go run cmd/dlq-replay/main.go --dry-run --max 10
```

Real replay:

```bash
cd go-gateway
go run cmd/dlq-replay/main.go --max 50 --operator local
```

Audit records are stored in `dlq_replay_audits` (gateway Postgres).

## Stop Everything

```bash
# Docker full stack
docker compose down

# Infra only
docker compose -f docker-compose.infra.yaml down
```

## Troubleshooting Matrix

| Symptom | Common cause | Diagnosis | Action |
|---|---|---|---|
| `Port ... is busy` in `start-dev.sh` | Old process still using port | `lsof -iTCP:<port> -sTCP:LISTEN` | `FORCE_KILL_PORTS=true ./start-dev.sh` |
| `lookup gateway-db` / `lookup kafka` on local app | Local env uses container hostnames | `cat go-gateway/.env.local` and `cat nestjs-anti-fraud/.env.local` | Recreate `.env.local` from `.env.example` |
| `EACCES` in `dist`, `.next`, `node_modules` | Permission inherited from container | `ls -ld <folder>` | Re-run `./start-dev.sh` (auto-fix) or adjust ownership manually |
| Anti-fraud fails after migrate | DB not ready or migration pending | `docker compose -f docker-compose.infra.yaml ps` and process logs | Start infra again and rerun `./start-dev.sh` |
| Orphan containers warning | Old containers still present | `docker compose ps -a` | `docker compose down --remove-orphans` |
| Kafka unavailable | Infra not started or broker down | `docker compose -f docker-compose.infra.yaml ps` | `docker compose -f docker-compose.infra.yaml up -d` |
