# Plano P0/P1 — Payment Gateway (Detalhamento Executavel)

Link principal: `docs/local/architecture-improvements.md`

## Resumo
Este plano detalha as tasks P0 e P1 para elevar a confiabilidade, seguranca e sinais de senioridade do projeto. O foco e fechar gaps de idempotencia, outbox, contrato de eventos, headers de seguranca, observabilidade ponta-a-ponta, OpenAPI e hardening de dinheiro no antifraude.

## Status de implementacao
- Implementado: idempotencia no `POST /invoice`, outbox no gateway, contrato de eventos v2, CORS + headers de seguranca, correlation ID ponta a ponta, OpenAPI (Swaggo), testes basicos (unit + e2e script), antifraude com `Decimal`.
- Pendente: CI automatizada (GitHub Actions) e testes integrados no antifraude (nao ha specs no repo).

## Validacao executada (P0/P1)
- Idempotencia: mesma `Idempotency-Key` + mesmo payload retornou a mesma fatura; payload diferente retornou `409`.
- Persistencia: `idempotency_keys` gravou `status=completed`, `status_code=201` e `expires_at` com TTL de 24h.
- Outbox: evento `pending_transaction` foi criado e enviado; payload contem `schema_version=2`, `amount_cents` e `correlation_id`.
- Invoice events: `created -> pending_published -> approved -> balance_applied` com `request_id`.
- Correlation ID: `X-Request-Id` propagou para `outbox_events.correlation_id` e logs do antifraude.
- Async antifraude: invoice pendente foi processada pelo worker e passou para `approved`.
- OpenAPI: `GET /swagger/index.html` retornou `200`.
- CORS/headers: `OPTIONS /invoice` retornou `204` com `Access-Control-Allow-Origin` e headers de seguranca.
- Metrics: `GET /metrics` respondeu em gateway, antifraude HTTP e antifraude worker.
- Antifraude Decimal: coluna `amount` do Prisma foi criada como `numeric` no Postgres.
- Testes: `./scripts/ci.sh gateway` e `./scripts/ci.sh gateway-integration` passaram.

Observacoes:
- `./scripts/e2e.sh` agora usa email dinamico + warm-up de `/accounts` e passou (create account -> create pending invoice -> antifraude -> status aprovado).
- A validacao incluiu os ajustes de tipagem no Kafka do antifraude feitos na P1/P2.

## Como testar (checklist)

### Infra
- Subir stack completa: `docker compose up -d --build`
- Ou infra apenas: `docker compose -f docker-compose.infra.yaml up -d`

### Gateway (Go)
- Rodar migracoes (gateway): aplicar `go-gateway/migrations/000004_add_idempotency_and_outbox.*` no Postgres do gateway.
- Health: `curl http://localhost:8080/health`
- Swagger: `http://localhost:8080/swagger/index.html`
 - Metrics: `curl http://localhost:8080/metrics`

### Idempotencia
- Criar fatura com `Idempotency-Key` e repetir a mesma request.
- Esperado: mesma resposta (status + body) sem criar nova fatura.
- Repetir com payload diferente e mesma key -> `409 Conflict`.
 - Confirmar persistencia em `idempotency_keys` com `status=completed`.

### Outbox
- Criar fatura `pending` (valor alto) e garantir que o evento entra na outbox e e publicado.
- Em falha de Kafka, evento permanece `pending/failed` e e reenviado.
 - Verificar `schema_version` e `amount_cents` no payload.

### Correlation ID end-to-end
- Enviar `X-Request-Id` no request do gateway.
- Verificar logs do antifraude e header `x-request-id` no `transactions_result`.
 - Confirmar `correlation_id` no `outbox_events`.

### Antifraude Decimal
- Rodar migracao Prisma: `npx prisma migrate dev` (ou `deploy`).
- Verificar que `Invoice.amount` esta como Decimal no banco.
 - Metrics worker: `curl http://localhost:3101/metrics`

### E2E
- Script completo: `./scripts/e2e.sh`

## Decisoes ja fechadas
- Idempotencia: DB + response cache (persistir key + hash + response).
- Outbox: tabela outbox + worker (publicacao assincrona com retry).
- Correlation: X-Request-Id end-to-end (HTTP + Kafka headers).
- OpenAPI: Swaggo annotations no Gateway Go.
- CORS: restrita a localhost (config via env).
- Testes: escopo mais completo (unit, integracao e e2e).
- Antifraude money: Decimal no Prisma.

## P0 — Confiabilidade e Seguranca (Execucao Detalhada)

### P0.1 Idempotencia no `POST /invoice`
- Tabela `idempotency_keys` no gateway:
  - `id` UUID
  - `key` (varchar, unique com `endpoint`)
  - `endpoint` (varchar)
  - `request_hash` (sha256 do body + api_key)
  - `response_body` (jsonb)
  - `status_code` (int)
  - `status` (processing/completed)
  - `created_at`, `updated_at`, `expires_at`
- Regras:
  - Sem `Idempotency-Key`: fluxo normal.
  - Key existente e hash igual: retornar `response_body` + `status_code`.
  - Key existente e hash diferente: `409 Conflict`.
  - `processing` bloqueia concorrencia.
  - TTL recomendada: 24h.
- Implementacao:
  - Middleware ou handler no `POST /invoice`.
  - Repository `IdempotencyRepository` com `Get/Create/Update/Delete`.
- Docs:
  - Atualizar `go-gateway/docs/projects/API.md`.
  - Atualizar `docs/projects/INTEGRATIONS.md`.
- Testes:
  - Mesma request com mesma key retorna resposta identica.
  - Key com payload diferente retorna 409.

### P0.2 Outbox pattern para `pending_transactions`
- Tabela `outbox_events`:
  - `id` UUID
  - `aggregate_id` (invoice_id)
  - `type` (ex.: `pending_transaction`)
  - `payload` (jsonb)
  - `status` (pending/processing/sent/failed)
  - `attempts`, `next_attempt_at`, `created_at`, `updated_at`
  - `correlation_id`
- Fluxo:
  - Ao salvar invoice pending, gravar outbox na mesma transacao.
  - Worker varre `outbox_events` com `FOR UPDATE SKIP LOCKED`.
  - Publica no Kafka e marca como `sent`.
  - Retry com backoff em caso de erro.
- Implementacao:
  - Novo package `outbox` no Go.
  - Worker iniciado no `main.go` (goroutine).
  - Ajustar `InvoiceService.Create` para inserir outbox quando `pending`.
- Testes:
  - Falha Kafka: evento permanece pending e reenvia.
  - Evento sai apenas uma vez apos `sent`.

### P0.3 Contrato de evento com versionamento
- Adicionar `schema_version` nos eventos Kafka.
- Evolucao:
  - `pending_transactions`: adicionar `schema_version`, `amount_cents`, manter `amount` por compatibilidade.
  - `transactions_result`: adicionar `schema_version`.
- Implementacao:
  - Atualizar structs `PendingTransaction` e `TransactionResult`.
  - Atualizar antifraude para aceitar v1/v2.
  - Atualizar docs `go-gateway/docs/projects/KAFKA.md` e `docs/projects/INTEGRATIONS.md`.

### P0.4 CORS + headers de seguranca
- Middleware no gateway:
  - `Access-Control-Allow-Origin` (lista via `CORS_ALLOWED_ORIGINS`).
  - `Access-Control-Allow-Headers`: `Content-Type, X-API-KEY, Idempotency-Key, X-Request-Id`.
  - `Access-Control-Allow-Methods`: `GET, POST, OPTIONS`.
- Headers adicionais:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: no-referrer`
  - `Permissions-Policy` minimal
- Testes:
  - Preflight OPTIONS responde 204.
  - Origem nao permitida bloqueada.

## P1 — Sinais fortes de senioridade

### P1.1 Correlation ID end-to-end
- Gateway gera `X-Request-Id` e propaga para headers Kafka.
- Antifraude le header `x-request-id` e inclui em logs + resultado publicado.
- Documentar no `docs/projects/OBSERVABILITY.md`.
- Teste:
  - Criar invoice pending e verificar logs do antifraude com o mesmo request_id.

### P1.2 OpenAPI via Swaggo
- Adicionar annotations nos handlers do Go.
- Gerar swagger em `/swagger/*`.
- Documentar em `go-gateway/README.md`.

### P1.3 Testes completos (unit + integracao + e2e)
- Go gateway: unit tests no dominio (invoice/status).
- Integracao: DB + Kafka (tag `integration`).
- Antifraude: reforcar testes existentes (specs + consumer).
- E2E:
  - Script `./scripts/e2e.sh`:
    - sobe stack
    - cria conta demo
    - cria invoice pending
    - verifica status aprovado/rejeitado
  - Playwright opcional para UI.

### P1.4 Antifraude com Decimal (money hardening)
- Prisma: `amount Decimal` no schema.
- Ajustar antifraude para usar Decimal (converter para float apenas para comparacoes).
- Ajustar parsing do payload Kafka (preferir `amount_cents` quando presente).

## Mudancas em APIs/Interfaces
- `POST /invoice`: suporta `Idempotency-Key`.
- Kafka events: adicionam `schema_version` e `amount_cents`.
- Gateway: passa a ter `/swagger/*` (OpenAPI).

## Testes e criterios de aceitacao
- Idempotencia: repeticao com mesma key retorna resposta identica sem duplicar invoice.
- Outbox: falha Kafka e reprocessamento posterior.
- Correlation ID: logs no antifraude carregam o mesmo `X-Request-Id`.
- OpenAPI acessivel e consistente com handlers reais.
- Decimal no antifraude sem regressao em calculo de fraude.

## Assumptions e Defaults
- `CORS_ALLOWED_ORIGINS` default: `http://localhost:3000,http://localhost:3002`.
- TTL idempotencia: 24h.
- Event schema v2 mantem retrocompatibilidade com v1.
