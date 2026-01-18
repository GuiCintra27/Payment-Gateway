# API

Base URL: `http://localhost:8080`

## Autenticacao

- Header obrigatorio: `X-API-KEY`
- Excecoes: `POST /accounts` e `POST /demo`

## POST /accounts

Request:

```bash
curl -X POST http://localhost:8080/accounts \
  -H 'Content-Type: application/json' \
  -d '{"name":"Loja Demo","email":"demo@local"}'
```

Response (201):

```json
{
  "id": "uuid",
  "name": "Loja Demo",
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
  -d '{
    "amount": 129.9,
    "description": "Assinatura",
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
  "description": "Assinatura",
  "payment_type": "credit_card",
  "card_last_digits": "4242",
  "created_at": "2025-01-10T12:00:00Z",
  "updated_at": "2025-01-10T12:00:00Z"
}
```

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

## Erros

Erros seguem o formato:

```json
{
  "code": "validation_error",
  "message": "invalid invoice data",
  "details": {
    "amount": "amount must be greater than zero"
  }
}
```

Veja `ERRORS.md` para lista completa.
