# Technical Reference

[PT-BR](../TECHNICAL-REFERENCE.md) | **EN**

## Services and Ports

- Local frontend: `3000`
- Frontend via docker compose: `3002`
- Go Gateway API: `8080`
- NestJS Anti-fraud API: `3001`
- NestJS worker metrics: `3101`
- Kafka (redpanda): `9092`
- Gateway Postgres: `5434`
- Anti-fraud Postgres: `5433`

## Main Endpoints

### Gateway

- `POST /accounts`
- `GET /accounts`
- `POST /demo`
- `POST /invoice`
- `GET /invoice`
- `GET /invoice/{id}`
- `GET /invoice/{id}/events`
- `GET /health`
- `GET /ready`
- `GET /metrics`
- `GET /metrics/prom`
- `GET /swagger/index.html`

### Anti-fraud

- `GET /invoices`
- `GET /invoices/:id`
- `GET /metrics`
- `GET /metrics/prom`

### Anti-fraud Worker

- `GET /metrics`
- `GET /metrics/prom`

## Event Topics (Kafka)

- `pending_transactions` (gateway -> anti-fraud)
- `transactions_result` (anti-fraud -> gateway)
- `transactions_result_dlq` (gateway DLQ)

Event contracts documented in:
- `go-gateway/docs/projects/KAFKA.md`
- `nestjs-anti-fraud/docs/projects/EVENTS.md`

## Transfer Decision Criteria

- `amount <= 10000`:
  - local gateway decision.
  - current rule: random (`~70% approved`, `~30% rejected`).
  - does not publish `pending_transactions`.
- `amount > 10000`:
  - initial status is `pending`.
  - publishes `pending_transactions` (via outbox) to anti-fraud.
  - anti-fraud decides `approved/rejected` through rules:
    - `SUSPICIOUS_ACCOUNT`
    - `FREQUENT_HIGH_VALUE`
    - `UNUSUAL_PATTERN`

## Environment Variables by Service

### Gateway (`go-gateway/.env.local`)

- Server: `HTTP_PORT`
- Security: `API_KEY_SECRETS`, `API_KEY_ACTIVE_KEY_ID`, `API_RATE_LIMIT_PER_MINUTE`, `API_RATE_LIMIT_BURST`
- Limits: `ACCOUNT_LIMIT_MAX_AMOUNT_PER_TX_CENTS`, `ACCOUNT_LIMIT_MAX_DAILY_VOLUME_CENTS`, `ACCOUNT_LIMIT_MAX_DAILY_TRANSACTIONS`
- Database: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSL_MODE`
- Kafka: `KAFKA_BROKER`, `KAFKA_PRODUCER_TOPIC`, `KAFKA_CONSUMER_TOPIC`, `KAFKA_DLQ_TOPIC`, `KAFKA_CONSUMER_GROUP_ID`, `KAFKA_CONSUMER_MAX_RETRIES`

### Anti-fraud (`nestjs-anti-fraud/.env.local`)

- `DATABASE_URL`
- `KAFKA_BROKER`
- `SUSPICIOUS_VARIATION_PERCENTAGE`
- `INVOICES_HISTORY_COUNT`
- `SUSPICIOUS_INVOICES_COUNT`
- `SUSPICIOUS_TIMEFRAME_HOURS`
- `ANTIFRAUD_WORKER_PORT`

### Frontend (`next-frontend/.env.local`)

- `API_BASE_URL`

## Additional References

- Architecture: `docs/projects/ARCHITECTURE.md`
- Security: `docs/projects/SECURITY.md`
- Observability: `docs/projects/OBSERVABILITY.md`
- Infra: `docs/projects/INFRA.md`
- Runbook: `docs/projects/RUNBOOK.md`
