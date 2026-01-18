# Go Gateway

API principal do sistema de pagamentos. Responsavel por contas, transferencias, integracao com Kafka e atualizacao de saldo.

## Como rodar

### Via script (na raiz)

```bash
./start-dev.sh
```

### Local (infra no Docker)

```bash
# na raiz

docker compose -f docker-compose.infra.yaml up -d
```

Depois:

```bash
cd go-gateway
cp .env.example .env.local

go run cmd/app/main.go
```

## Variaveis de ambiente

Veja `go-gateway/.env.example`:

- `HTTP_PORT`
- `API_KEY_SECRET`
- `API_RATE_LIMIT_PER_MINUTE`
- `API_RATE_LIMIT_BURST`
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSL_MODE`
- `KAFKA_BROKER`
- `KAFKA_PRODUCER_TOPIC`
- `KAFKA_CONSUMER_TOPIC`
- `KAFKA_DLQ_TOPIC`
- `KAFKA_CONSUMER_GROUP_ID`
- `KAFKA_CONSUMER_MAX_RETRIES`

## Endpoints

- `POST /accounts`
- `GET /accounts`
- `POST /demo`
- `POST /invoice`
- `GET /invoice`
- `GET /invoice/{id}`
- `GET /health`
- `GET /ready`
- `GET /metrics`

## Documentacao

- `go-gateway/docs/projects/API.md`
- `go-gateway/docs/projects/DOMAIN.md`
- `go-gateway/docs/projects/DATABASE.md`
- `go-gateway/docs/projects/KAFKA.md`
- `go-gateway/docs/projects/ERRORS.md`
- `go-gateway/docs/projects/TROUBLESHOOTING.md`
