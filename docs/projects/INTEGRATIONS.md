# Integracoes

## Frontend -> Gateway (HTTP)

Autenticacao sempre via header `X-API-KEY` (exceto `POST /accounts` e `POST /demo`).

Idempotencia opcional via header `Idempotency-Key` no `POST /invoice`.

Principais endpoints:

- `POST /accounts`
- `GET /accounts`
- `POST /demo`
- `POST /invoice`
- `GET /invoice`
- `GET /invoice/{id}`
- `GET /invoice/{id}/events`

Erros sao retornados em JSON:

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

- `x-request-id` propagado do gateway para o antifraude e de volta no `transactions_result`.

### Topic: `pending_transactions`

Publicado pelo gateway quando uma transferencia e classificada como `pending` (valor alto).

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

Publicado pelo antifraude apos processar a transferencia.

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

Publicado pelo gateway quando o processamento falha ou o payload e invalido.

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

## Antifraude

- Consome `pending_transactions` via `@EventPattern`.
- Emite evento `invoice.processed` e publica `transactions_result`.
- Exibe status via API REST: `GET /invoices` e `GET /invoices/:id`.
