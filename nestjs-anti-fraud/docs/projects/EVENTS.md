# Eventos

[**PT-BR**](./EVENTS.md) | [EN](./en/EVENTS.md)

## Entrada (pending_transactions)

```json
{
  "schema_version": 2,
  "event_id": "uuid",
  "account_id": "uuid",
  "invoice_id": "uuid",
  "amount": 15200,
  "amount_cents": 1520000
}
```

## Saída (transactions_result)

```json
{
  "schema_version": 2,
  "event_id": "uuid",
  "invoice_id": "uuid",
  "status": "approved"
}
```

## Regras de publicação

- O evento `invoice.processed` dispara o publish para o Kafka.
- O status é `approved` quando não há fraude, `rejected` quando há fraude.
- O header `x-request-id` é propagado quando presente.
