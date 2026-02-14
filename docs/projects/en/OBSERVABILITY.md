# Observability

[PT-BR](../OBSERVABILITY.md) | **EN**

## Gateway (Go)

Endpoints:

- `GET /metrics` (expvar JSON)
- `GET /metrics/prom` (Prometheus)

Main metrics:

- `http_requests_total` (by method + path)
- `http_requests_errors_total`
- `http_request_duration_ms_sum`
- `http_request_duration_ms_count`
- `http_requests_inflight`

Logs:

- `slog` with `request_id`, status, duration, and bytes.
- `X-Request-Id` can be sent by client.
- `X-Request-Id` is propagated to Kafka via `x-request-id` header.

## Persisted Logs (Loki + Promtail)

For local/production-like setup, logs stack uses Loki + Promtail + Grafana.

Start stack:

```bash
docker compose -f docker-compose.logging.yaml up -d
```

Logs Grafana: `http://localhost:3005` (admin/admin)

Suggested query:

```
{service=\"go-gateway\"} |= \"request_id=\"
```

Expected standard fields:

- `service`
- `level`
- `request_id`
- `event_id` (when present)
- `replayed` (when message came from DLQ)

## Anti-fraud (NestJS)

Endpoints:

- `GET /metrics` (HTTP app, port 3001)
- `GET /metrics` (Kafka worker, port 3101)
- `GET /metrics/prom` (HTTP app, port 3001)
- `GET /metrics/prom` (Kafka worker, port 3101)

Kafka worker concentrates processing counters.

Correlation ID:

- Worker reads `x-request-id` from Kafka headers and includes it in logs.
- Published `transactions_result` keeps the same header.

Sample worker payload:

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

## Health Checks

- Gateway: `GET /health` (liveness) and `GET /ready` (DB + Kafka).

## Initial SLOs (proposal)

- Gateway availability: 99.5% monthly (5xx / total).
- `POST /invoice` p95 latency: <= 300ms (local/demo mode).
- Anti-fraud failure rate: <= 1% (`failed_total` / `processed_total`).
- Processing lag: time between `pending_published` and `approved/rejected` <= 5s (local mode).
