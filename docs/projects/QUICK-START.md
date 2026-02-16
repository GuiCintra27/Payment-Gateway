# Início rápido

[**PT-BR**](./QUICK-START.md) | [EN](./en/QUICK-START.md)

## Pré-requisitos

- Docker + Docker Compose
- Go 1.23+
- Node.js 20+
- npm 10+

## Preparar arquivos de ambiente

```bash
cp go-gateway/.env.example go-gateway/.env.local
cp nestjs-anti-fraud/.env.example nestjs-anti-fraud/.env.local
cp next-frontend/.env.example next-frontend/.env.local
```

## Inicialização recomendada

```bash
./start-dev.sh
```

Isso inicia:
- Gateway (Go) em `:8080`
- API Antifraude (NestJS) em `:3001`
- Métricas do worker antifraude em `:3101`
- Frontend (Next.js) em `:3000`
- Infra de Kafka + Postgres via Docker

### Subir com observabilidade em um comando

```bash
ENABLE_OBSERVABILITY=true ./start-dev.sh
```

Isso adiciona:
- Prometheus em `:9090`
- Grafana de métricas em `:3004` (`admin/admin`)
- Loki em `:3100`
- Grafana de logs em `:3005` (`admin/admin`)
- Coleta de logs locais dos processos do `start-dev` via Loki (`job="startdev-local"`).

## URLs principais

- Frontend: `http://localhost:3000`
- Gateway API: `http://localhost:8080`
- Gateway Swagger: `http://localhost:8080/swagger/index.html`
- Métricas do antifraude: `http://localhost:3001/metrics`
- Métricas do worker: `http://localhost:3101/metrics`

## Smoke e E2E

```bash
./scripts/ci.sh smoke
./scripts/e2e.sh
```

## Stacks de observabilidade

Alternativa manual (sem `ENABLE_OBSERVABILITY`):

```bash
docker compose -f docker-compose.monitoring.yaml up -d
docker compose -f docker-compose.logging.yaml up -d
```

- Prometheus: `http://localhost:9090`
- Grafana de métricas: `http://localhost:3004`
- Grafana de logs: `http://localhost:3005`
