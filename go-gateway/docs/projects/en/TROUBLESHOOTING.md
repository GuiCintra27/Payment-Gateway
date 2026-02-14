# Troubleshooting

[PT-BR](../TROUBLESHOOTING.md) | **EN**

## Busy port

- Check: `lsof -iTCP:8080 -sTCP:LISTEN`
- Use `FORCE_KILL_PORTS=true ./start-dev.sh` when safe.

## Database connection failure

- Check `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.
- Confirm `gateway-db` is running in Docker.

## Kafka unavailable

- Check `KAFKA_BROKER` and whether `kafka` is running.
- Logs: `docker compose -f docker-compose.infra.yaml logs kafka`.

## Growing DLQ

- Validate `transactions_result` payload schema.
- Confirm `event_id` is present.
