# Go Gateway

Servico principal da API de pagamentos (contas, transferencias, idempotencia, outbox e replay de DLQ).

## Como rodar

Na raiz do repositorio:

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

## Documentacao

- Indice do servico: `go-gateway/docs/projects/INDEX.md`
- Indice do projeto: `docs/projects/INDEX.md`
