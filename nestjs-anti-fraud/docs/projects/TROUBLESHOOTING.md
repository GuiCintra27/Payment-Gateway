# Troubleshooting

## Prisma migration falha

- Verifique `DATABASE_URL` em `.env.local`.
- Confira se `nestjs-db` esta ativo.

## Kafka nao conecta

- Verifique `KAFKA_BROKER`.
- Confirme que `kafka` esta ativo no Docker.

## Falhas de consumo

- Mensagens sem `event_id` sao descartadas.
- Erros de processamento sao registrados em log e incrementam `failed_total`.
