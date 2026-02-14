# API

[PT-BR](../API.md) | **EN**

Base URL: `http://localhost:8080`

## Authentication

- Required header: `X-API-KEY`
- Exceptions: `POST /accounts` and `POST /demo`

## POST /accounts

Request:

```bash
curl -X POST http://localhost:8080/accounts \
  -H 'Content-Type: application/json' \
  -d '{"name":"Demo Store","email":"demo@local"}'
```

Response (201):

```json
{
  "id": "uuid",
  "name": "Demo Store",
  "email": "demo@local",
  "balance": 0,
  "api_key": "...",
  "created_at": "2025-01-10T12:00:00Z",
  "updated_at": "2025-01-10T12:00:00Z"
}
```

## GET /accounts

```bash
curl http://localhost:8080/accounts \
  -H 'X-API-KEY: <api_key>'
```

## POST /demo

```bash
curl -X POST http://localhost:8080/demo
```

Response (201):

```json
{
  "account": { "api_key": "..." },
  "invoices": []
}
```

## POST /invoice

```bash
curl -X POST http://localhost:8080/invoice \
  -H 'Content-Type: application/json' \
  -H 'X-API-KEY: <api_key>' \
  -H 'Idempotency-Key: <uuid>' \
  -d '{
    "amount": 129.9,
    "description": "Subscription",
    "payment_type": "credit_card",
    "card_number": "4242424242424242",
    "cvv": "123",
    "expiry_month": 12,
    "expiry_year": 2030,
    "cardholder_name": "Demo User"
  }'
```

Response (201):

```json
{
  "id": "uuid",
  "account_id": "uuid",
  "amount": 129.9,
  "status": "approved",
  "description": "Subscription",
  "payment_type": "credit_card",
  "card_last_digits": "4242",
  "created_at": "2025-01-10T12:00:00Z",
  "updated_at": "2025-01-10T12:00:00Z"
}
```

Notes:

- `Idempotency-Key` is optional. If provided, gateway returns the same response for the same payload.
- Reusing the same key with a different payload returns `409 Conflict`.

## GET /invoice

```bash
curl http://localhost:8080/invoice \
  -H 'X-API-KEY: <api_key>'
```

## GET /invoice/{id}

```bash
curl http://localhost:8080/invoice/<id> \
  -H 'X-API-KEY: <api_key>'
```

## GET /invoice/{id}/events

```bash
curl http://localhost:8080/invoice/<id>/events \
  -H 'X-API-KEY: <api_key>'
```

Response (200):

```json
[
  {
    "id": "uuid",
    "invoice_id": "uuid",
    "event_type": "created",
    "to_status": "pending",
    "created_at": "2025-01-10T12:00:00Z"
  },
  {
    "id": "uuid",
    "invoice_id": "uuid",
    "event_type": "pending_published",
    "from_status": "pending",
    "to_status": "pending",
    "created_at": "2025-01-10T12:00:01Z"
  }
]
```

## Errors

Errors follow this format:

```json
{
  "code": "validation_error",
  "message": "invalid invoice data",
  "details": {
    "amount": "amount must be greater than zero"
  }
}
```

See `ERRORS.md` for full list.
