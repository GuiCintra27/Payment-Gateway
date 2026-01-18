# Events

## Entrada (pending_transactions)

```json
{
  "event_id": "uuid",
  "account_id": "uuid",
  "invoice_id": "uuid",
  "amount": 15200
}
```

## Saida (transactions_result)

```json
{
  "event_id": "uuid",
  "invoice_id": "uuid",
  "status": "approved"
}
```

## Regras de publicacao

- O evento `invoice.processed` dispara o publish para o Kafka.
- O status e `approved` quando nao ha fraude, `rejected` quando ha fraude.
