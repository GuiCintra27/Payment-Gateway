# Observability

## Gateway (Go)

Endpoint:

- `GET /metrics` (expvar JSON)

Principais metricas:

- `http_requests_total` (por metodo + path)
- `http_requests_errors_total`
- `http_request_duration_ms_sum`
- `http_request_duration_ms_count`
- `http_requests_inflight`

Logs:

- `slog` com `request_id`, status, duracao e bytes.
- `X-Request-Id` pode ser enviado pelo cliente.

## Antifraude (NestJS)

Endpoints:

- `GET /metrics` (HTTP app, porta 3001)
- `GET /metrics` (worker Kafka, porta 3101)

O worker Kafka concentra os contadores de processamento.

Payload exemplo (worker Kafka):

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

## Healthchecks

- Gateway: `GET /health` (liveness) e `GET /ready` (DB + Kafka).
