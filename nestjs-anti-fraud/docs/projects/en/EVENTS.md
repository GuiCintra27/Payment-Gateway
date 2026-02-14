# Events

[PT-BR](../EVENTS.md) | **EN**

## Input (`pending_transactions`)

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

## Output (`transactions_result`)

```json
{
  "schema_version": 2,
  "event_id": "uuid",
  "invoice_id": "uuid",
  "status": "approved"
}
```

## Publishing rules

- `invoice.processed` event triggers Kafka publish.
- Status is `approved` when no fraud is detected; `rejected` otherwise.
- `x-request-id` header is propagated when present.
