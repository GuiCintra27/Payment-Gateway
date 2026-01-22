# NestJS Anti-fraud

Servico de antifraude que consome eventos de transacoes pendentes, aplica regras de deteccao e publica o resultado no Kafka.

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
cd nestjs-anti-fraud
cp .env.example .env.local

npm install
npx prisma migrate dev
npm run start:dev
```

Em outro terminal, inicie o worker Kafka:

```bash
cd nestjs-anti-fraud
npm run start:kafka:dev
```

## Variaveis de ambiente

Veja `nestjs-anti-fraud/.env.example`:

- `DATABASE_URL`
- `KAFKA_BROKER`
- `SUSPICIOUS_VARIATION_PERCENTAGE`
- `INVOICES_HISTORY_COUNT`
- `SUSPICIOUS_INVOICES_COUNT`
- `SUSPICIOUS_TIMEFRAME_HOURS`
- `ANTIFRAUD_WORKER_PORT` (porta do worker/metrics)

## Endpoints

- `GET /invoices`
- `GET /invoices/:id`
- `GET /metrics` (HTTP)
- `GET /metrics` (worker Kafka, porta 3101)

## Documentacao

- `nestjs-anti-fraud/docs/projects/CONSUMER.md`
- `nestjs-anti-fraud/docs/projects/DATABASE.md`
- `nestjs-anti-fraud/docs/projects/EVENTS.md`
- `nestjs-anti-fraud/docs/projects/METRICS.md`
- `nestjs-anti-fraud/docs/projects/TROUBLESHOOTING.md`
