# Troubleshooting

## Porta ocupada

- Verifique: `lsof -iTCP:8080 -sTCP:LISTEN`
- Use `FORCE_KILL_PORTS=true ./start-dev.sh` se for seguro.

## Banco nao conecta

- Verifique `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.
- Confirme se `gateway-db` esta ativo no Docker.

## Kafka indisponivel

- Verifique `KAFKA_BROKER` e se `kafka` esta ativo.
- Logs: `docker compose -f docker-compose.infra.yaml logs kafka`.

## DLQ crescendo

- Verifique schema do payload em `transactions_result`.
- Confirme se `event_id` esta presente.
