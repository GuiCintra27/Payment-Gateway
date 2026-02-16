# Payment Gateway

[**PT-BR**](./README.md) | [EN](./README.en.md)

Projeto de gateway de pagamentos orientado a eventos, criado para demonstrar fundamentos de engenharia backend em sistemas distribuídos.

## Visão geral

O projeto simula um fluxo de pagamento com caminhos síncrono e assíncrono:
- `go-gateway`: API de contas e transferências, idempotência, outbox e replay de DLQ.
- `nestjs-anti-fraud`: análise antifraude (API + worker Kafka).
- `next-frontend`: onboarding, login, criação de transferência, timeline e download de PDF.
- stacks de Kafka + Postgres + observabilidade/logs.

## Tecnologias

- Go (`chi`, `slog`, Swagger)
- NestJS + Prisma
- Next.js (App Router + Server Actions)
- Kafka (Redpanda)
- Postgres
- Prometheus/Grafana + Loki/Promtail

## Início rápido

```bash
cp go-gateway/.env.example go-gateway/.env.local
cp nestjs-anti-fraud/.env.example nestjs-anti-fraud/.env.local
cp next-frontend/.env.example next-frontend/.env.local

./start-dev.sh
```

Opcional (subir observabilidade no mesmo comando):

```bash
ENABLE_OBSERVABILITY=true ./start-dev.sh
```

URLs principais:
- Frontend: `http://localhost:3000`
- Gateway API: `http://localhost:8080`
- Swagger: `http://localhost:8080/swagger/index.html`

Guias completos de inicialização e troubleshooting:
- `docs/projects/QUICK-START.md`
- `docs/projects/RUNBOOK.md` (guia operacional)

## O que este projeto demonstra

- Fluxo orientado a eventos com `pending_transactions` e `transactions_result`.
- Padrões de confiabilidade: idempotência, outbox, deduplicação, retry/backoff e DLQ + replay.
- Base de segurança: rotação de HMAC da API key, rate limit, cookies `secure` em produção e hardening de CORS.
- Observabilidade: métricas de API/worker, dashboards, logs estruturados e persistência centralizada de logs.

## Mapa de documentação

Comece aqui:
- `docs/projects/INDEX.md`
- English docs entrypoint: `docs/projects/en/INDEX.md`

Documentação principal:
- `docs/projects/ARCHITECTURE.md`
- `docs/projects/INTEGRATIONS.md`
- `docs/projects/SECURITY.md`
- `docs/projects/OBSERVABILITY.md`
- `docs/projects/TECHNICAL-REFERENCE.md`

Documentação por serviço:
- `go-gateway/docs/projects/INDEX.md`
- `nestjs-anti-fraud/docs/projects/INDEX.md`
- `next-frontend/docs/projects/INDEX.md`
- `go-gateway/docs/projects/en/INDEX.md`
- `nestjs-anti-fraud/docs/projects/en/INDEX.md`
- `next-frontend/docs/projects/en/INDEX.md`

## Release e CI

- CI e smoke: `./scripts/ci.sh`
- Fluxo E2E: `./scripts/e2e.sh`
- Releases automatizadas: `release-please` (`.github/workflows/release-please.yml`)

## Troubleshooting rápido

- Portas ocupadas: `FORCE_KILL_PORTS=true ./start-dev.sh`
- Sobras de Docker: `docker compose down --remove-orphans`
- Guia operacional completo: `docs/projects/RUNBOOK.md`
