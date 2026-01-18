# Metrics

Endpoint: `GET /metrics`

Campos:

- `processed_total`
- `approved_total`
- `rejected_total`
- `failed_total`
- `last_processed_at`
- `uptime_seconds`

Exemplo:

```json
{
  "processed_total": 10,
  "approved_total": 7,
  "rejected_total": 3,
  "failed_total": 1,
  "last_processed_at": "2025-01-10T12:00:00Z",
  "uptime_seconds": 3600
}
```
