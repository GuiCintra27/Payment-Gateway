# Runbook

## Subir localmente (script)

```bash
./start-dev.sh
```

Variaveis uteis:

- `SKIP_INFRA=true` (nao sobe Kafka/Postgres)
- `FORCE_KILL_PORTS=true` (libera portas automaticamente)
- `STOP_INFRA_ON_EXIT=true` (derruba infra ao sair)
- `ANTIFRAUD_WORKER_PORT=3101` (porta do worker/metrics)

## Subir tudo via Docker

```bash
docker compose up -d --build
```

## Subir apenas infra

```bash
docker compose -f docker-compose.infra.yaml up -d
```

## Verificar saude

- Gateway liveness: `GET /health`
- Gateway readiness: `GET /ready`
- Gateway metrics: `GET /metrics`
- Antifraude metrics (HTTP): `GET /metrics`
- Antifraude metrics (worker Kafka): `GET /metrics` em `ANTIFRAUD_WORKER_PORT`

## Parar tudo

```bash
# Docker full
docker compose down

# Infra only
docker compose -f docker-compose.infra.yaml down
```

## Problemas comuns

- Porta ocupada: finalize o processo ou use `FORCE_KILL_PORTS=true`.
- Kafka fora do ar: verifique `docker compose -f docker-compose.infra.yaml ps`.
- Erros de permissao em pastas: ajuste `LOCAL_UID`/`LOCAL_GID` no compose.
