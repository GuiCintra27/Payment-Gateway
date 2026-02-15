# Quick Start

[PT-BR](../QUICK-START.md) | **EN**

## Prerequisites

- Docker + Docker Compose
- Go 1.23+
- Node.js 20+
- npm 10+

## Prepare Environment Files

```bash
cp go-gateway/.env.example go-gateway/.env.local
cp nestjs-anti-fraud/.env.example nestjs-anti-fraud/.env.local
cp next-frontend/.env.example next-frontend/.env.local
```

## Recommended Startup

```bash
./start-dev.sh
```

This starts:
- Gateway (Go) on `:8080`
- Anti-fraud API (NestJS) on `:3001`
- Anti-fraud worker metrics on `:3101`
- Frontend (Next.js) on `:3000`
- Kafka + Postgres infra via Docker

### Start with observability in one command

```bash
ENABLE_OBSERVABILITY=true ./start-dev.sh
```

This also starts:
- Prometheus on `:9090`
- Metrics Grafana on `:3004` (`admin/admin`)
- Loki on `:3100`
- Logs Grafana on `:3005` (`admin/admin`)
- Loki ingestion for local `start-dev` process logs (`job="startdev-local"`).

## Main URLs

- Frontend: `http://localhost:3000`
- Gateway API: `http://localhost:8080`
- Gateway Swagger: `http://localhost:8080/swagger/index.html`
- Anti-fraud metrics: `http://localhost:3001/metrics`
- Worker metrics: `http://localhost:3101/metrics`

## Smoke and E2E

```bash
./scripts/ci.sh smoke
./scripts/e2e.sh
```

## Observability Stacks

Manual alternative (without `ENABLE_OBSERVABILITY`):

```bash
docker compose -f docker-compose.monitoring.yaml up -d
docker compose -f docker-compose.logging.yaml up -d
```

- Prometheus: `http://localhost:9090`
- Metrics Grafana: `http://localhost:3004`
- Logs Grafana: `http://localhost:3005`
