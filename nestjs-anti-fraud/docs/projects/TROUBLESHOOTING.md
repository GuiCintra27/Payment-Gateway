# Resolução de problemas

[**PT-BR**](./TROUBLESHOOTING.md) | [EN](./en/TROUBLESHOOTING.md)

## Prisma migration falha

- Verifique `DATABASE_URL` em `.env.local`.
- Confira se `nestjs-db` esta ativo.

## Kafka não conecta

- Verifique `KAFKA_BROKER`.
- Confirme que `kafka` esta ativo no Docker.
- Certifique-se de que o worker Kafka esta em execução (`npm run start:kafka:dev`).
- Confira se `ANTIFRAUD_WORKER_PORT` (padrão 3101) esta livre para o worker expor metrics.

## Falhas de consumo

- Mensagens sem `event_id` são descartadas.
- Erros de processamento são registrados em log e incrementam `failed_total`.
