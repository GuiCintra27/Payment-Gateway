# Troubleshooting

## Prisma migration falha

- Verifique `DATABASE_URL` em `.env.local`.
- Confira se `nestjs-db` esta ativo.

## Kafka nao conecta

- Verifique `KAFKA_BROKER`.
- Confirme que `kafka` esta ativo no Docker.
- Certifique-se de que o worker Kafka esta em execucao (`npm run start:kafka:dev`).
- Confira se `ANTIFRAUD_WORKER_PORT` (padrao 3101) esta livre para o worker expor metrics.

## Falhas de consumo

- Mensagens sem `event_id` sao descartadas.
- Erros de processamento sao registrados em log e incrementam `failed_total`.
