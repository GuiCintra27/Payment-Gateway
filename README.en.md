# Payment Gateway

[PT-BR](./README.md) | **EN**

Event-driven payment gateway project built to demonstrate backend engineering fundamentals in distributed systems.

## Overview

The project simulates payment processing with synchronous and asynchronous paths:
- `go-gateway`: accounts and transfers API, idempotency, outbox, and DLQ replay.
- `nestjs-anti-fraud`: anti-fraud analysis (HTTP API + Kafka worker).
- `next-frontend`: onboarding, API key login, transfer creation, timeline, and PDF download.
- Kafka + Postgres + observability/logging stacks.

## Technologies

- Go (`chi`, `slog`, Swagger)
- NestJS + Prisma
- Next.js (App Router + Server Actions)
- Kafka (Redpanda)
- Postgres
- Prometheus/Grafana + Loki/Promtail

## Quick Start

```bash
cp go-gateway/.env.example go-gateway/.env.local
cp nestjs-anti-fraud/.env.example nestjs-anti-fraud/.env.local
cp next-frontend/.env.example next-frontend/.env.local

./start-dev.sh
```

Optional (start observability in the same command):

```bash
ENABLE_OBSERVABILITY=true ./start-dev.sh
```

Main URLs:
- Frontend: `http://localhost:3000`
- Gateway API: `http://localhost:8080`
- Swagger: `http://localhost:8080/swagger/index.html`

Complete startup and troubleshooting guides:
- `docs/projects/en/QUICK-START.md`
- `docs/projects/en/RUNBOOK.md`

## What This Project Demonstrates

- Event-driven flow with `pending_transactions` and `transactions_result`.
- Reliability patterns: idempotency, outbox, deduplication, retry/backoff, and DLQ + replay.
- Security baseline: API key HMAC rotation, rate limiting, secure cookies in production, and CORS hardening.
- Observability: API/worker metrics, dashboards, structured logs, and centralized log persistence.

## Documentation Map

Start here:
- `docs/projects/en/INDEX.md`

Core docs:
- `docs/projects/en/ARCHITECTURE.md`
- `docs/projects/en/INTEGRATIONS.md`
- `docs/projects/en/SECURITY.md`
- `docs/projects/en/OBSERVABILITY.md`
- `docs/projects/en/TECHNICAL-REFERENCE.md`

Service docs:
- `go-gateway/docs/projects/en/INDEX.md`
- `nestjs-anti-fraud/docs/projects/en/INDEX.md`
- `next-frontend/docs/projects/en/INDEX.md`

## Release and CI

- CI and smoke: `./scripts/ci.sh`
- E2E flow: `./scripts/e2e.sh`
- Automated releases: `release-please` (`.github/workflows/release-please.yml`)

## Quick Troubleshooting

- Busy ports: `FORCE_KILL_PORTS=true ./start-dev.sh`
- Stale Docker resources: `docker compose down --remove-orphans`
- Full operations guide: `docs/projects/en/RUNBOOK.md`
