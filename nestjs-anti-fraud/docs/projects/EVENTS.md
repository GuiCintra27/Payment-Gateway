# Eventos

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

## Saida (transactions_result)

```json
{
  "schema_version": 2,
  "event_id": "uuid",
  "invoice_id": "uuid",
  "status": "approved"
}
```

## Regras de publicacao

- O evento `invoice.processed` dispara o publish para o Kafka.
- O status e `approved` quando nao ha fraude, `rejected` quando ha fraude.
- O header `x-request-id` e propagado quando presente.
