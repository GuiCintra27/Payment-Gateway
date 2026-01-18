# Errors

Formato padrao:

```json
{
  "code": "validation_error",
  "message": "invalid invoice data",
  "details": {
    "amount": "amount must be greater than zero"
  }
}
```

## Codigos comuns

- `invalid_payload` (400)
- `validation_error` (422)
- `api_key_required` (401)
- `invalid_api_key` (401)
- `email_already_exists` (409)
- `api_key_conflict` (409)
- `invoice_not_found` (404)
- `invoice_id_required` (400)
- `forbidden` (403)
- `internal_error` (500)
