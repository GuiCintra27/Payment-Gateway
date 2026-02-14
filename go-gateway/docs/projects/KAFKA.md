# Kafka

[**PT-BR**](./KAFKA.md) | [EN](./en/KAFKA.md)

## Configuração

Variáveis principais:

- `KAFKA_BROKER`
- `KAFKA_PRODUCER_TOPIC` (default: pending_transactions)
- `KAFKA_CONSUMER_TOPIC` (default: transactions_result)
- `KAFKA_DLQ_TOPIC` (default: transactions_result_dlq)
- `KAFKA_CONSUMER_GROUP_ID`
- `KAFKA_CONSUMER_MAX_RETRIES`

## Producer

Publica `pending_transactions` quando a transferência fica `pending`.
O publish e feito via outbox (tabela + worker) para evitar perda de eventos.

Payload inclui `schema_version` e `amount_cents` (mantem `amount` por compatibilidade).

## Consumer

Consome `transactions_result` e atualiza status das transferências.

Payload inclui `schema_version`.

Headers:

- `x-request-id` propagado quando presente.

- Deduplicacao por `event_id` em `processed_events`.
- Retry com backoff exponencial.
- DLQ para falhas de parsing, dedup ou processamento.

## DLQ

`transactions_result_dlq` recebe um envelope com erro e payload original.

### Replay controlado

Para reprocessar mensagens da DLQ de forma auditavel:

```bash
go run cmd/dlq-replay/main.go --dry-run --max 10
go run cmd/dlq-replay/main.go --max 50 --operator local
```

Auditoria fica em `dlq_replay_audits` (gateway DB).
