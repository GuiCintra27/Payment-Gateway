# Consumer

## Input (Kafka)

- Topic: `pending_transactions`
- Campos esperados:
  - `event_id`
  - `account_id`
  - `invoice_id`
  - `amount`
  - `amount_cents` (preferido quando presente)
  - `schema_version`
  - Header `x-request-id` (correlation)

## Fluxo

1. Worker Kafka recebe mensagem via `@EventPattern`.
2. Se `event_id` estiver ausente, registra falha e ignora.
3. Chama `FraudService.processInvoice`.
4. Atualiza metricas de sucesso/falha.
5. Em caso de erro, a excecao e propagada para o runtime.

## Resultado

O resultado da analise e publicado em `transactions_result` via listener do evento `invoice.processed`.

## Metrics

- O worker expõe `GET /metrics` na porta definida por `ANTIFRAUD_WORKER_PORT` (padrao: 3101).
