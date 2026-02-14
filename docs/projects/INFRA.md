# Infra

## Docker Compose

O repositorio possui dois arquivos principais:

- `docker-compose.yaml`: sobe toda a stack (frontend + gateway + antifraude + kafka + postgres).
- `docker-compose.infra.yaml`: sobe apenas a infra (kafka + postgres + migrations).
- `docker-compose.monitoring.yaml`: sobe Prometheus + Grafana (dashboard).
- `docker-compose.logging.yaml`: sobe Loki + Promtail + Grafana (logs).

### Serviços (docker-compose.yaml)

- `gateway-db` (Postgres)
- `nestjs-db` (Postgres)
- `kafka` (redpanda)
- `kafka-init` (cria topicos)
- `go-migrate` (aplica migrations do gateway)
- `nestjs-migrate` (aplica migrations do antifraude)
- `go-gateway`
- `nestjs` (API antifraude)
- `nestjs-worker`
- `next-frontend`

### Serviços (docker-compose.infra.yaml)

- `gateway-db`
- `nestjs-db`
- `kafka`
- `kafka-init`
- `go-migrate`

### Serviços (docker-compose.monitoring.yaml)

- `prometheus`
- `grafana`

### Serviços (docker-compose.logging.yaml)

- `loki`
- `promtail`
- `grafana-logs`

## Volumes

- `gateway_postgres_data`
- `nestjs_node_modules`
- `next_node_modules`

## Redes

Todos os serviços compartilham a rede default do compose (`payment-gateway_default`).

## Portas

- Gateway: 8080
- Antifraude: 3001
- Antifraude worker metrics: 3101
- Frontend: 3002 (docker)
- Postgres gateway: 5434
- Postgres antifraude: 5433
- Kafka: 9092
- Prometheus: 9090
- Grafana: 3004
- Grafana (logs): 3005

## Execução local

Para rodar apps localmente com infra no Docker:

```bash
docker compose -f docker-compose.infra.yaml up -d
```

Depois rode os serviços em cada pasta (ver `README.md` da raiz).

## UID/GID

Os containers do frontend e antifraude aceitam `LOCAL_UID` e `LOCAL_GID` para evitar arquivos criados como root.
