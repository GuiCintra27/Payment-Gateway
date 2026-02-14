# Infrastructure

[PT-BR](../INFRA.md) | **EN**

## Docker Compose

The repository includes four main files:

- `docker-compose.yaml`: full stack (frontend + gateway + anti-fraud + kafka + postgres).
- `docker-compose.infra.yaml`: infra only (kafka + postgres + migrations).
- `docker-compose.monitoring.yaml`: Prometheus + Grafana (dashboards).
- `docker-compose.logging.yaml`: Loki + Promtail + Grafana (logs).

### Services (`docker-compose.yaml`)

- `gateway-db` (Postgres)
- `nestjs-db` (Postgres)
- `kafka` (redpanda)
- `kafka-init` (creates topics)
- `go-migrate` (applies gateway migrations)
- `nestjs-migrate` (applies anti-fraud migrations)
- `go-gateway`
- `nestjs` (anti-fraud API)
- `nestjs-worker`
- `next-frontend`

### Services (`docker-compose.infra.yaml`)

- `gateway-db`
- `nestjs-db`
- `kafka`
- `kafka-init`
- `go-migrate`

### Services (`docker-compose.monitoring.yaml`)

- `prometheus`
- `grafana`

### Services (`docker-compose.logging.yaml`)

- `loki`
- `promtail`
- `grafana-logs`

## Volumes

- `gateway_postgres_data`
- `nestjs_node_modules`
- `next_node_modules`

## Networks

All services share the default compose network (`payment-gateway_default`).

## Ports

- Gateway: 8080
- Anti-fraud API: 3001
- Anti-fraud worker metrics: 3101
- Frontend: 3002 (docker)
- Gateway Postgres: 5434
- Anti-fraud Postgres: 5433
- Kafka: 9092
- Prometheus: 9090
- Grafana: 3004
- Grafana (logs): 3005

## Local Execution

To run apps locally while keeping infra in Docker:

```bash
docker compose -f docker-compose.infra.yaml up -d
```

Then start each app from its own folder (see root `README.md`).

## UID/GID

Frontend and anti-fraud containers support `LOCAL_UID` and `LOCAL_GID` to avoid root-owned files.
