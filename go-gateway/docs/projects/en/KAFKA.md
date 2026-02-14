# Kafka

[PT-BR](../KAFKA.md) | **EN**

## Configuration

Main variables:

- `KAFKA_BROKER`
- `KAFKA_PRODUCER_TOPIC` (default: pending_transactions)
- `KAFKA_CONSUMER_TOPIC` (default: transactions_result)
- `KAFKA_DLQ_TOPIC` (default: transactions_result_dlq)
- `KAFKA_CONSUMER_GROUP_ID`
- `KAFKA_CONSUMER_MAX_RETRIES`

## Producer

Publishes `pending_transactions` when transfer status is `pending`.
Publishing is done through outbox (table + worker) to avoid event loss.

Payload includes `schema_version` and `amount_cents` (keeps `amount` for compatibility).

## Consumer

Consumes `transactions_result` and updates transfer statuses.

Payload includes `schema_version`.

Headers:

- `x-request-id` propagated when present.

- Deduplication by `event_id` in `processed_events`.
- Retry with exponential backoff.
- DLQ for parsing, dedup, or processing failures.

## DLQ

`transactions_result_dlq` receives an envelope with error and original payload.

### Controlled replay

To reprocess DLQ messages with auditability:

```bash
go run cmd/dlq-replay/main.go --dry-run --max 10
go run cmd/dlq-replay/main.go --max 50 --operator local
```

Audit data is stored in `dlq_replay_audits` (gateway DB).
