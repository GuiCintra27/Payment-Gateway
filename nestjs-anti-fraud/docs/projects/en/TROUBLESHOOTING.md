# Troubleshooting

[PT-BR](../TROUBLESHOOTING.md) | **EN**

## Prisma migration fails

- Check `DATABASE_URL` in `.env.local`.
- Confirm `nestjs-db` is running.

## Kafka does not connect

- Check `KAFKA_BROKER`.
- Confirm `kafka` is running in Docker.
- Ensure Kafka worker is running (`npm run start:kafka:dev`).
- Confirm `ANTIFRAUD_WORKER_PORT` (default 3101) is free for worker metrics.

## Consumption failures

- Messages without `event_id` are discarded.
- Processing errors are logged and increase `failed_total`.
