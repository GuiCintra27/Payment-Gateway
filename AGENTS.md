# AGENTS.md - Payment Gateway

README for AI coding agents working on this repo.

## Project overview

Payment Gateway is a microservices demo for transferencias with async antifraud.

- Go Gateway (accounts + transferencias)
- NestJS Antifraude (fraud detection)
- Next.js Frontend (UI)
- Kafka (redpanda)
- Postgres (gateway + antifraude)

## Setup commands

### Local dev (recommended)

```bash
./start-dev.sh
```

Env flags:

- `GATEWAY_PORT` (default: 8080)
- `ANTIFRAUD_PORT` (default: 3001)
- `ANTIFRAUD_WORKER_PORT` (default: 3101)
- `FRONTEND_PORT` (default: 3000)
- `START_ANTIFRAUD_WORKER=true` (start Kafka consumer worker; default: true)
- `SKIP_INFRA=true` (do not start Docker infra)
- `FORCE_KILL_PORTS=true` (free occupied ports)
- `STOP_INFRA_ON_EXIT=true` (stop infra on exit)

### Docker full stack

```bash
docker compose up -d --build
```

### Infra only

```bash
docker compose -f docker-compose.infra.yaml up -d
```

## Endpoints and ports

- Frontend (local): http://localhost:3000
- Frontend (docker): http://localhost:3002
- Gateway API: http://localhost:8080
- Gateway metrics: http://localhost:8080/metrics
- Antifraude API: http://localhost:3001
- Antifraude metrics: http://localhost:3001/metrics
- Antifraude worker metrics: http://localhost:3101/metrics
- Kafka: localhost:9092
- Postgres gateway: localhost:5434
- Postgres antifraude: localhost:5433

## Environment files

- `go-gateway/.env.local` (copy from `.env.example`)
- `nestjs-anti-fraud/.env.local` (copy from `.env.example`)
- `next-frontend/.env.local` (copy from `.env.example`)

## Code style

### Go (gateway)

- Keep services thin and handlers focused on HTTP concerns.
- Prefer small, explicit functions with clear error handling.
- Keep request validation centralized in handlers.
- Use `slog` for structured logs.

### TypeScript (frontend)

- Server Actions for API calls.
- Keep pages as Server Components by default.
- Use shadcn/ui components from `components/ui`.
- Avoid new state libs unless required.

### NestJS (antifraude)

- Business rules live in Fraud specifications.
- Use Prisma for DB access.
- Keep Kafka event payloads stable.

## Architecture notes

- Gateway publishes `pending_transactions` for high-value transferencias.
- Antifraude processes events and publishes `transactions_result`.
- Gateway consumes results, updates status, and applies balance updates.
- Dedup is stored in `processed_events`.
- DLQ: `transactions_result_dlq`.
- Kafka consumer runs in a separate worker process in dev.

## Critical gotchas

- API keys are stored as HMAC hashes in the gateway DB.
- Only last 4 digits of cards are stored; CVV is never persisted.
- If ports are busy, the start script fails by default; use `FORCE_KILL_PORTS=true`.
- Docker file ownership can be fixed with `LOCAL_UID`/`LOCAL_GID` in compose.

## Project structure

```
payment-gateway/
- go-gateway/          # Go API (accounts + transferencias)
- nestjs-anti-fraud/   # Antifraude service
- next-frontend/       # Next.js UI
- docs/                # Root docs (architecture, infra, flows)
- docker-compose.yaml  # Full stack
- docker-compose.infra.yaml
- start-dev.sh
```

## Common tasks

### Create demo data

```bash
curl -X POST http://localhost:8080/demo
```

### Health checks

```bash
curl http://localhost:8080/health
curl http://localhost:8080/ready
curl http://localhost:3001/metrics
```

## Branch workflow (P2 and higher)

Use this flow before opening PRs:

1. Checkout the feature branch (ex: `p2-implementation`).
2. Merge `master` into the feature branch and resolve conflicts there.
3. Run validations on the feature branch.
4. Open PR from feature branch to `master`.
5. Merge after review/approval.
