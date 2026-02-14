# Errors

[PT-BR](../ERRORS.md) | **EN**

Standard format:

```json
{
  "code": "validation_error",
  "message": "invalid invoice data",
  "details": {
    "amount": "amount must be greater than zero"
  }
}
```

## Common codes

- `invalid_payload` (400)
- `validation_error` (422)
- `api_key_required` (401)
- `invalid_api_key` (401)
- `email_already_exists` (409)
- `api_key_conflict` (409)
- `invoice_not_found` (404)
- `invoice_id_required` (400)
- `forbidden` (403)
- `idempotency_conflict` (409)
- `idempotency_in_progress` (409)
- `internal_error` (500)
