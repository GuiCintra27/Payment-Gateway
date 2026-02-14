# Payment Gateway

Projeto de gateway de pagamentos orientado a eventos, criado para demonstrar fundamentos de engenharia backend em sistemas distribuídos.

## Visao geral

O projeto simula um fluxo de pagamento com caminhos sincrono e assincrono:
- `go-gateway`: API de contas e transferencias, idempotencia, outbox e replay de DLQ.
- `nestjs-anti-fraud`: analise antifraude (API + worker Kafka).
- `next-frontend`: onboarding, login, criacao de transferencia, timeline e download de PDF.
- stacks de Kafka + Postgres + observabilidade/logs.

## Tecnologias

- Go (`chi`, `slog`, Swagger)
- NestJS + Prisma
- Next.js (App Router + Server Actions)
- Kafka (Redpanda)
- Postgres
- Prometheus/Grafana + Loki/Promtail

## Inicio rapido

```bash
cp go-gateway/.env.example go-gateway/.env.local
cp nestjs-anti-fraud/.env.example nestjs-anti-fraud/.env.local
cp next-frontend/.env.example next-frontend/.env.local

./start-dev.sh
```

URLs principais:
- Frontend: `http://localhost:3000`
- Gateway API: `http://localhost:8080`
- Swagger: `http://localhost:8080/swagger/index.html`

Guias completos de inicializacao e troubleshooting:
- `docs/projects/QUICK-START.md`
- `docs/projects/RUNBOOK.md` (guia operacional)

## O que este projeto demonstra

- Fluxo orientado a eventos com `pending_transactions` e `transactions_result`.
- Padroes de confiabilidade: idempotencia, outbox, deduplicacao, retry/backoff e DLQ + replay.
- Base de seguranca: rotacao de HMAC da API key, rate limit, cookies `secure` em producao e hardening de CORS.
- Observabilidade: metricas de API/worker, dashboards, logs estruturados e persistencia centralizada de logs.

## Demo (5-7 min)

Use:
- `docs/projects/DEMO-SCRIPT.md`

## Mapa de documentacao

Comece aqui:
- `docs/projects/INDEX.md`

Documentacao principal:
- `docs/projects/ARCHITECTURE.md`
- `docs/projects/INTEGRATIONS.md`
- `docs/projects/SECURITY.md`
- `docs/projects/OBSERVABILITY.md`
- `docs/projects/TECHNICAL-REFERENCE.md`

Documentacao por servico:
- `go-gateway/docs/projects/INDEX.md`
- `nestjs-anti-fraud/docs/projects/INDEX.md`
- `next-frontend/docs/projects/INDEX.md`

## Release e CI

- CI e smoke: `./scripts/ci.sh`
- Fluxo E2E: `./scripts/e2e.sh`
- Releases automatizadas: `release-please` (`.github/workflows/release-please.yml`)

## Troubleshooting rapido

- Portas ocupadas: `FORCE_KILL_PORTS=true ./start-dev.sh`
- Sobras de Docker: `docker compose down --remove-orphans`
- Guia operacional completo: `docs/projects/RUNBOOK.md`
