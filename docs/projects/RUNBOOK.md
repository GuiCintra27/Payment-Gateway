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
- `AUTO_PORTS=true` (escolhe a proxima porta livre automaticamente)
- `LOG_TO_FILE=true` (salva logs em arquivo)
- `LOG_DIR=./.logs` (pasta dos logs quando `LOG_TO_FILE=true`)
- `INFRA_START_TIMEOUT=60` (timeout para Kafka/Postgres)
- `SERVICE_START_TIMEOUT=25` (timeout para APIs/Frontend)
- `KAFKA_REQUIRED=true` (falha se Kafka nao estiver disponivel com o worker ativo)

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
- Gateway metrics (Prometheus): `GET /metrics/prom`
- Antifraude metrics (HTTP): `GET /metrics`
- Antifraude metrics (worker Kafka): `GET /metrics` em `ANTIFRAUD_WORKER_PORT`
- Antifraude metrics (Prometheus): `GET /metrics/prom` (API + worker)

## Monitoring (Prometheus + Grafana)

```bash
docker compose -f docker-compose.monitoring.yaml up -d
```

Portas:

- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3004` (admin/admin)

## Alertas basicos (sugeridos)

- Taxa de erro 5xx acima de 1% por 5 minutos.
- Nenhum evento processado no antifraude em 10 minutos (possible backlog).
- Lag de processamento acima de 10s por 5 minutos.

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
