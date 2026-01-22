# Infra

## Docker Compose

O repositorio possui dois arquivos principais:

- `docker-compose.yaml`: sobe toda a stack (frontend + gateway + antifraude + kafka + postgres).
- `docker-compose.infra.yaml`: sobe apenas a infra (kafka + postgres + migrations).

### Servicos (docker-compose.yaml)

- `gateway-db` (Postgres)
- `nestjs-db` (Postgres)
- `kafka` (redpanda)
- `kafka-init` (cria topicos)
- `go-migrate` (aplica migrations do gateway)
- `nestjs-migrate` (aplica migrations do antifraude)
- `go-gateway`
- `nestjs-anti-fraud`
- `nestjs-worker`
- `next-frontend`

### Servicos (docker-compose.infra.yaml)

- `gateway-db`
- `nestjs-db`
- `kafka`
- `kafka-init`
- `go-migrate`

## Volumes

- `gateway_db_data`
- `nestjs_db_data`

## Redes

Todos os servicos compartilham a rede `gateway-network`.

## Portas

- Gateway: 8080
- Antifraude: 3001
- Antifraude worker metrics: 3101
- Frontend: 3002 (docker)
- Postgres gateway: 5434
- Postgres antifraude: 5433
- Kafka: 9092

## Execucao local

Para rodar apps localmente com infra no Docker:

```bash
docker compose -f docker-compose.infra.yaml up -d
```

Depois rode os servicos em cada pasta (ver `README.md` da raiz).

## UID/GID

Os containers do frontend e antifraude aceitam `LOCAL_UID` e `LOCAL_GID` para evitar arquivos criados como root.
