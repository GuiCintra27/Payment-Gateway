# Kafka

## Configuracao

Variaveis principais:

- `KAFKA_BROKER`
- `KAFKA_PRODUCER_TOPIC` (default: pending_transactions)
- `KAFKA_CONSUMER_TOPIC` (default: transactions_result)
- `KAFKA_DLQ_TOPIC` (default: transactions_result_dlq)
- `KAFKA_CONSUMER_GROUP_ID`
- `KAFKA_CONSUMER_MAX_RETRIES`

## Producer

Publica `pending_transactions` quando a transferencia fica `pending`.

## Consumer

Consome `transactions_result` e atualiza status das transferencias.

- Deduplicacao por `event_id` em `processed_events`.
- Retry com backoff exponencial.
- DLQ para falhas de parsing, dedup ou processamento.

## DLQ

`transactions_result_dlq` recebe um envelope com erro e payload original.
