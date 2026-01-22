# Metrics

Endpoints:

- `GET /metrics` (HTTP app)
- `GET /metrics` (worker Kafka, porta definida por `ANTIFRAUD_WORKER_PORT`)

Campos:

- `processed_total`
- `approved_total`
- `rejected_total`
- `failed_total`
- `last_processed_at`
- `uptime_seconds`

Exemplo (worker Kafka):

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
