# Payment Gateway

Projeto de estudo com arquitetura de microservicos para processamento de pagamentos e analise antifraude. O fluxo combina API Gateway (Go), processamento assincroano via Kafka, servico de antifraude (NestJS) e interface web (Next.js).

## Stack

- Gateway API: Go + chi
- Antifraude: NestJS + Prisma
- Frontend: Next.js + Tailwind
- Mensageria: Kafka (redpanda)
- Banco de dados: Postgres (gateway + antifraude)

## Inicio rapido

### Preparar ambiente local (uma vez)

```bash
cp go-gateway/.env.example go-gateway/.env.local
cp nestjs-anti-fraud/.env.example nestjs-anti-fraud/.env.local
cp next-frontend/.env.example next-frontend/.env.local
```

### Opcao 1: script local (recomendado)

```bash
./start-dev.sh
```

Variaveis uteis:

- `GATEWAY_PORT` (padrao: 8080)
- `ANTIFRAUD_PORT` (padrao: 3001)
- `ANTIFRAUD_WORKER_PORT` (padrao: 3101)
- `FRONTEND_PORT` (padrao: 3000)
- `START_ANTIFRAUD_WORKER=true` para subir o consumer Kafka do antifraude (padrao: true)
- `SKIP_INFRA=true` para nao subir Postgres/Kafka via Docker
- `FORCE_KILL_PORTS=true` para liberar portas ocupadas
- `STOP_INFRA_ON_EXIT=true` para derrubar infra ao sair
- `AUTO_PORTS=true` para escolher automaticamente a proxima porta livre
- `LOG_TO_FILE=true` grava logs em arquivos (padrao: false)
- `LOG_DIR=./.logs` pasta dos logs quando `LOG_TO_FILE=true`
- `INFRA_START_TIMEOUT=60` timeout (s) para Kafka/Postgres
- `SERVICE_START_TIMEOUT=25` timeout (s) para APIs/Frontend
- `KAFKA_REQUIRED=true` falha se Kafka nao estiver disponivel quando o worker estiver ativo

### Opcao 2: tudo via Docker

```bash
docker compose up -d --build
```

Para parar:

```bash
docker compose down
```

### Opcao 3: infra no Docker + apps locais

```bash
docker compose -f docker-compose.infra.yaml up -d
```

Depois rode cada servico localmente:

```bash
cd go-gateway
cp .env.example .env.local

go run cmd/app/main.go
```

```bash
cd nestjs-anti-fraud
cp .env.example .env.local

npm install
npx prisma migrate deploy
npm run start:dev
```

Em outro terminal, inicie o worker Kafka:

```bash
cd nestjs-anti-fraud
npm run start:kafka:dev
```

```bash
cd next-frontend
cp .env.example .env.local

npm install
npm run dev
```

Para parar a infra:

```bash
docker compose -f docker-compose.infra.yaml down
```

## Endpoints e portas

- Frontend (local script): http://localhost:3000
- Frontend (docker compose): http://localhost:3002
- Gateway API: http://localhost:8080
- Swagger: http://localhost:8080/swagger/index.html
- Gateway metrics: http://localhost:8080/metrics
- Gateway metrics (Prometheus): http://localhost:8080/metrics/prom
- Antifraude API: http://localhost:3001
- Antifraude metrics: http://localhost:3001/metrics
- Antifraude metrics (Prometheus): http://localhost:3001/metrics/prom
- Antifraude worker metrics: http://localhost:3101/metrics
- Antifraude worker metrics (Prometheus): http://localhost:3101/metrics/prom
- Postgres gateway: localhost:5434
- Postgres antifraude: localhost:5433
- Kafka: localhost:9092

## Monitoring

```bash
docker compose -f docker-compose.monitoring.yaml up -d
```

- Prometheus: http://localhost:9090
- Grafana: http://localhost:3004 (admin/admin)

## Demo rapido

- UI: acesse `/` e clique em "Entrar no demo".
- API: `POST /demo` cria uma conta com transferencias seed e retorna a API key.

A API key aparece apenas uma vez na tela de boas-vindas.

## Aviso de simulacao

Este projeto e um simulador. Use apenas dados ficticios no formulario de cartao.

## Documentacao

Root:
- Arquitetura: [docs/projects/ARCHITECTURE.md](docs/projects/ARCHITECTURE.md)
- Demo script (5-7 min): [docs/projects/DEMO-SCRIPT.md](docs/projects/DEMO-SCRIPT.md)
- `docs/projects/ARCHITECTURE.md`
- `docs/projects/INTEGRATIONS.md`
- `docs/projects/INFRA.md`
- `docs/projects/DATA-MODEL.md`
- `docs/projects/SECURITY.md`
- `docs/projects/OBSERVABILITY.md`
- `docs/projects/FLOWS.md`
- `docs/projects/RUNBOOK.md`

Por servico:
- `go-gateway/README.md` e `go-gateway/docs/projects/*`
- `nestjs-anti-fraud/README.md` e `nestjs-anti-fraud/docs/projects/*`
- `next-frontend/README.md` e `next-frontend/docs/projects/*`

## Release automatica

O repositorio esta configurado com `release-please` para gerar PR de release, atualizar `CHANGELOG.md` e criar tag automaticamente ao merge da release.

- Workflow: `.github/workflows/release-please.yml`
- Config: `release-please-config.json`
- Manifest de versao: `.release-please-manifest.json`

Requisitos para funcionamento:
- Criar o secret `RELEASE_PLEASE_TOKEN` com um PAT do GitHub (escopo `repo`).
- Alternativa: habilitar em Settings > Actions > Workflow permissions a criacao de PRs por Actions (ainda assim recomendamos o token dedicado).

Padrao de commits para versionamento:
- `feat`: incrementa minor
- `fix`: incrementa patch
- `feat!`/`fix!` ou `BREAKING CHANGE`: incrementa major
- `docs`, `chore`, `refactor`, `test`: entram no changelog conforme convencao

## Testes

- E2E (stack completa): `./scripts/e2e.sh`
- CI local (lint/test/smoke): `./scripts/ci.sh`

## Troubleshooting rapido

| Sintoma | Causa comum | Acao recomendada |
|---|---|---|
| `Port ... is busy` ao subir | Porta ocupada por processo antigo | `FORCE_KILL_PORTS=true ./start-dev.sh` ou `lsof -iTCP:<porta> -sTCP:LISTEN` |
| `lookup gateway-db` / `lookup kafka` no modo local | `.env.local` ausente ou com valores de Docker | Recriar `.env.local` a partir de `.env.example` |
| `EACCES` em `dist`, `.next` ou `node_modules` | Arquivos gerados por UID diferente (Docker) | Rodar `./start-dev.sh` novamente (script corrige ownership automaticamente) |
| Erro de migration no antifraude | Banco ainda nao pronto ou estado local divergente | Verificar `docker compose -f docker-compose.infra.yaml ps` e repetir `./start-dev.sh` |
| Containers `orphan` em `docker compose` | Stack antiga ainda ativa | `docker compose down --remove-orphans` e subir novamente |

Guia operacional completo: `docs/projects/RUNBOOK.md`
