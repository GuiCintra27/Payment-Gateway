# Integrations

[PT-BR](../INTEGRATIONS.md) | **EN**

## Frontend -> Gateway (HTTP)

Authentication always uses `X-API-KEY` header (except `POST /accounts` and `POST /demo`).

Optional idempotency through `Idempotency-Key` header on `POST /invoice`.

Main endpoints:

- `POST /accounts`
- `GET /accounts`
- `POST /demo`
- `POST /invoice`
- `GET /invoice`
- `GET /invoice/{id}`
- `GET /invoice/{id}/events`

Errors are returned as JSON:

```json
{
  "code": "validation_error",
  "message": "invalid invoice data",
  "details": {
    "amount": "amount must be greater than zero"
  }
}
```

## Kafka

Headers:

- `x-request-id` is propagated from gateway to anti-fraud and back in `transactions_result`.

### Topic: `pending_transactions`

Published by gateway when a transfer is classified as `pending` (high value).

Payload:

```json
{
  "schema_version": 2,
  "event_id": "uuid",
  "account_id": "uuid",
  "invoice_id": "uuid",
  "amount": 15200,
  "amount_cents": 1520000,
  "occurred_at": "2025-01-10T12:00:00Z"
}
```

### Topic: `transactions_result`

Published by anti-fraud after processing the transfer.

Payload:

```json
{
  "schema_version": 2,
  "event_id": "uuid",
  "invoice_id": "uuid",
  "status": "approved"
}
```

### Topic: `transactions_result_dlq`

Published by gateway when processing fails or payload is invalid.

Payload:

```json
{
  "event_id": "uuid",
  "invoice_id": "uuid",
  "status": "approved",
  "error": "dedup_check_failed",
  "payload": "{...}",
  "failed_at": "2025-01-10T12:10:00Z"
}
```

## Anti-fraud

- Consumes `pending_transactions` via `@EventPattern`.
- Emits `invoice.processed` and publishes `transactions_result`.
- Exposes status via REST API: `GET /invoices` and `GET /invoices/:id`.
