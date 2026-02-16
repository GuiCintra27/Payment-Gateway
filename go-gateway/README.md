# Go Gateway

[**PT-BR**](./README.md) | [EN](./docs/projects/en/INDEX.md)

Serviço principal da API de pagamentos (contas, transferências, idempotência, outbox e replay de DLQ).

## Como rodar

Na raiz do repositório:

```bash
./start-dev.sh
```

Modo local (infra via Docker):

```bash
docker compose -f docker-compose.infra.yaml up -d
cd go-gateway
cp .env.example .env.local
go run cmd/app/main.go
```

## Endpoints principais

- `POST /accounts`
- `POST /invoice`
- `GET /invoice/{id}/events`
- `GET /health`
- `GET /ready`
- `GET /metrics`
- `GET /metrics/prom`
- `GET /swagger/index.html`

## Documentação

- Índice do serviço: `go-gateway/docs/projects/INDEX.md`
- Service docs (EN): `go-gateway/docs/projects/en/INDEX.md`
- Índice do projeto: `docs/projects/INDEX.md`
