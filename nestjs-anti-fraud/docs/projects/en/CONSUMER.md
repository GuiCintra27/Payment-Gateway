# Consumer

[PT-BR](../CONSUMER.md) | **EN**

## Input (Kafka)

- Topic: `pending_transactions`
- Expected fields:
  - `event_id`
  - `account_id`
  - `invoice_id`
  - `amount`
  - `amount_cents` (preferred when present)
  - `schema_version`
  - Header `x-request-id` (correlation)

## Flow

1. Kafka worker receives message via `@EventPattern`.
2. If `event_id` is missing, it records failure and skips.
3. Calls `FraudService.processInvoice`.
4. Updates success/failure metrics.
5. On error, exception is propagated to runtime.

## Result

Analysis result is published to `transactions_result` through `invoice.processed` event listener.

## Metrics

- Worker exposes `GET /metrics` on `ANTIFRAUD_WORKER_PORT` (default: 3101).
