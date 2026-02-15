# Guia operacional

[**PT-BR**](./RUNBOOK.md) | [EN](./en/RUNBOOK.md)

## Subir localmente (script)

```bash
./start-dev.sh
```

Variáveis uteis:

- `SKIP_INFRA=true` (não sobe Kafka/Postgres)
- `FORCE_KILL_PORTS=true` (libera portas automaticamente)
- `STOP_INFRA_ON_EXIT=true` (derruba infra ao sair)
- `ENABLE_OBSERVABILITY=true` (sobe Prometheus/Grafana/Loki/Promtail junto do start-dev)
- `ANTIFRAUD_WORKER_PORT=3101` (porta do worker/metrics)
- `AUTO_PORTS=true` (escolhe a proxima porta livre automaticamente)
- `LOG_TO_FILE=true` (salva logs em arquivo)
- `LOG_DIR=./.logs` (pasta dos logs quando `LOG_TO_FILE=true`)
- `INFRA_START_TIMEOUT=60` (timeout para Kafka/Postgres)
- `SERVICE_START_TIMEOUT=25` (timeout para APIs/Frontend)
- `KAFKA_REQUIRED=true` (falha se Kafka não estiver disponivel com o worker ativo)

Observação:
- Com `ENABLE_OBSERVABILITY=true`, o script força `LOG_TO_FILE=true` para enviar logs locais ao Loki.
- Em Linux, o monitoring do start-dev usa override com host network para scrape confiável dos serviços locais.
- O teardown das stacks de observabilidade segue `STOP_INFRA_ON_EXIT`.

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

## Logging (Loki + Promtail + Grafana)

```bash
docker compose -f docker-compose.logging.yaml up -d
```

Portas:

- Loki: `http://localhost:3100`
- Grafana (logs): `http://localhost:3005` (admin/admin)

## Alertas basicos (sugeridos)

- Taxa de erro 5xx acima de 1% por 5 minutos.
- Nenhum evento processado no antifraude em 10 minutos (possible backlog).
- Lag de processamento acima de 10s por 5 minutos.

## Replay de DLQ (gateway)

Dry-run (não publica):

```bash
cd go-gateway
go run cmd/dlq-replay/main.go --dry-run --max 10
```

Replay real:

```bash
cd go-gateway
go run cmd/dlq-replay/main.go --max 50 --operator local
```

Auditoria fica em `dlq_replay_audits` (Postgres gateway).

## Parar tudo

```bash
# Docker full
docker compose down

# Infra only
docker compose -f docker-compose.infra.yaml down
```

## Matriz de troubleshooting rapido

| Sintoma | Causa comum | Diagnostico | Ação |
|---|---|---|---|
| `Port ... is busy` no `start-dev.sh` | Processo antigo ocupando porta | `lsof -iTCP:<porta> -sTCP:LISTEN` | `FORCE_KILL_PORTS=true ./start-dev.sh` |
| `localhost:3004/9090/3005/3100` recusando conexão | Observabilidade não habilitada no start-dev | `echo $ENABLE_OBSERVABILITY` e `docker compose -f docker-compose.monitoring.yaml ps` | Rodar `ENABLE_OBSERVABILITY=true ./start-dev.sh` ou subir stacks manualmente |
| Dashboards vazios no modo local | Observabilidade ativa sem tráfego ou portas dinâmicas | Validar serviços em `http://localhost:8080/metrics/prom`, `:3001/metrics/prom`, `:3101/metrics/prom` | Gerar tráfego e checar se `START_ANTIFRAUD_WORKER=true`; se usar `AUTO_PORTS=true`, reiniciar start-dev com observabilidade |
| `lookup gateway-db` / `lookup kafka` no local | Config local com host de container | `cat go-gateway/.env.local` e `cat nestjs-anti-fraud/.env.local` | Recriar `.env.local` a partir de `.env.example` |
| `EACCES` em `dist`, `.next`, `node_modules` | Permissao herdada de container | `ls -ld <pasta>` | Reexecutar `./start-dev.sh` (autocorrecao) ou ajustar ownership manual |
| Antifraude não sobe apos migrate | DB não pronto ou migration pendente | `docker compose -f docker-compose.infra.yaml ps` e logs do processo | Subir infra novamente e repetir `./start-dev.sh` |
| Warning de orphan containers | Containers antigos no projeto | `docker compose ps -a` | `docker compose down --remove-orphans` |
| Kafka fora do ar | Infra não iniciada ou broker indisponivel | `docker compose -f docker-compose.infra.yaml ps` | `docker compose -f docker-compose.infra.yaml up -d` |
