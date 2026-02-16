# Referência técnica

[**PT-BR**](./TECHNICAL-REFERENCE.md) | [EN](./en/TECHNICAL-REFERENCE.md)

## Serviços e portas

- Frontend local: `3000`
- Frontend via docker compose: `3002`
- Go Gateway API: `8080`
- API NestJS Antifraude: `3001`
- Métricas do worker NestJS: `3101`
- Kafka (redpanda): `9092`
- Gateway Postgres: `5434`
- Antifraud Postgres: `5433`

## Endpoints principais

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

### Antifraude

- `GET /invoices`
- `GET /invoices/:id`
- `GET /metrics`
- `GET /metrics/prom`

### Worker Antifraude

- `GET /metrics`
- `GET /metrics/prom`

## Tópicos de evento (Kafka)

- `pending_transactions` (gateway -> antifraude)
- `transactions_result` (antifraude -> gateway)
- `transactions_result_dlq` (gateway DLQ)

Contratos de evento documentados em:
- `go-gateway/docs/projects/KAFKA.md`
- `nestjs-anti-fraud/docs/projects/EVENTS.md`

## Critérios de decisão de transferência

- `amount <= 10000`:
  - decisão local no gateway.
  - regra atual: aleatório (`~70% approved`, `~30% rejected`).
  - não publica `pending_transactions`.
- `amount > 10000`:
  - status inicial `pending`.
  - publica `pending_transactions` (via outbox) para antifraude.
  - antifraude decide `approved/rejected` por regras:
    - `SUSPICIOUS_ACCOUNT`
    - `FREQUENT_HIGH_VALUE`
    - `UNUSUAL_PATTERN`

## Variáveis de ambiente por serviço

### Gateway (`go-gateway/.env.local`)

- Servidor: `HTTP_PORT`
- Segurança: `API_KEY_SECRETS`, `API_KEY_ACTIVE_KEY_ID`, `API_RATE_LIMIT_PER_MINUTE`, `API_RATE_LIMIT_BURST`
- Limites: `ACCOUNT_LIMIT_MAX_AMOUNT_PER_TX_CENTS`, `ACCOUNT_LIMIT_MAX_DAILY_VOLUME_CENTS`, `ACCOUNT_LIMIT_MAX_DAILY_TRANSACTIONS`
- Banco: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSL_MODE`
- Kafka: `KAFKA_BROKER`, `KAFKA_PRODUCER_TOPIC`, `KAFKA_CONSUMER_TOPIC`, `KAFKA_DLQ_TOPIC`, `KAFKA_CONSUMER_GROUP_ID`, `KAFKA_CONSUMER_MAX_RETRIES`

### Antifraude (`nestjs-anti-fraud/.env.local`)

- `DATABASE_URL`
- `KAFKA_BROKER`
- `SUSPICIOUS_VARIATION_PERCENTAGE`
- `INVOICES_HISTORY_COUNT`
- `SUSPICIOUS_INVOICES_COUNT`
- `SUSPICIOUS_TIMEFRAME_HOURS`
- `ANTIFRAUD_WORKER_PORT`

### Frontend (`next-frontend/.env.local`)

- `API_BASE_URL`

## Referências adicionais

- Arquitetura: `docs/projects/ARCHITECTURE.md`
- Segurança: `docs/projects/SECURITY.md`
- Observabilidade: `docs/projects/OBSERVABILITY.md`
- Infra: `docs/projects/INFRA.md`
- Guia operacional: `docs/projects/RUNBOOK.md`
