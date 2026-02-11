# Observability

## Gateway (Go)

Endpoint:

- `GET /metrics` (expvar JSON)
- `GET /metrics/prom` (Prometheus)

Principais metricas:

- `http_requests_total` (por metodo + path)
- `http_requests_errors_total`
- `http_request_duration_ms_sum`
- `http_request_duration_ms_count`
- `http_requests_inflight`

Logs:

- `slog` com `request_id`, status, duracao e bytes.
- `X-Request-Id` pode ser enviado pelo cliente.
- `X-Request-Id` e propagado para o Kafka via header `x-request-id`.
## Logs persistidos (Loki + Promtail)

Para ambiente local/producao-like, a stack de logs usa Loki + Promtail + Grafana.

Subir stack:

```bash
docker compose -f docker-compose.logging.yaml up -d
```

Grafana (logs): `http://localhost:3005` (admin/admin)

Consulta sugerida:

```
{service=\"go-gateway\"} |= \"request_id=\"
```

Campos padronizados esperados:

- `service`
- `level`
- `request_id`
- `event_id` (quando houver)
- `replayed` (quando mensagem veio da DLQ)

## Antifraude (NestJS)

Endpoints:

- `GET /metrics` (HTTP app, porta 3001)
- `GET /metrics` (worker Kafka, porta 3101)
- `GET /metrics/prom` (HTTP app, porta 3001)
- `GET /metrics/prom` (worker Kafka, porta 3101)

O worker Kafka concentra os contadores de processamento.

Correlation ID:

- O worker le `x-request-id` dos headers Kafka e inclui nos logs.
- O resultado publicado em `transactions_result` replica o mesmo header.

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

## SLOs iniciais (proposta)

- Disponibilidade do Gateway: 99.5% mensal (5xx / total).
- Latencia p95 de `POST /invoice`: <= 300ms (modo local/demo).
- Taxa de falha do antifraude: <= 1% (failed_total / processed_total).
- Lag de processamento: tempo entre `pending_published` e `approved/rejected` <= 5s (modo local).
