## Objetivo

Elevar o projeto para um case de backend pleno+, com fluxo de uso mais simples, arquitetura resiliente e sinais claros de engenharia de produto.

## Atualizacao do diagnostico (2026-02-09)

- Arquitetura atual: frontend (Next.js), gateway (Go), antifraude API + worker (NestJS), Kafka e 2x Postgres.
- Fluxo principal: gateway cria transacao, publica `pending_transactions` para alto valor, antifraude processa e devolve `transactions_result`.
- Confiabilidade: deduplicacao por `event_id`, DLQ, retry/backoff, commit de offset apos processamento e aplicacao atomica de resultado no gateway.
- Seguranca: API key com HMAC, rate limit por API key, CVV nao persistido, fallback de segredo restrito a dev.
- Observabilidade: health/readiness no gateway, metrics no gateway e antifraude (API + worker), logs estruturados com `request_id`.
- UX: onboarding com criacao de conta, auto-login, demo mode, welcome com API key exibida uma vez e fluxo inicial mais claro.
- Gap atual para nivel pleno+: reforco de testes de integracao/e2e (cross-service) e observabilidade de logs persistidos em producao.

## Status do plano original (checklist)

### 1) Fluxo de uso e primeira impressao

- [x] Criar pagina de "Cadastrar conta" que chama `POST /accounts`.
- [x] Exibir API Key apenas uma vez com opcao "Copiar" + salvar cookie automaticamente.
- [x] Adicionar "Demo mode" (seed) com dados ricos para acesso rapido.
- [~] Tela inicial com passo a passo: criar conta -> copiar API key -> criar fatura.
- [x] Mensagens de erro amigaveis no login e vazio de faturas.

### 2) API Gateway (Go)

- [x] Padronizar erros em JSON (`code`, `message`, `details`).
- [x] Adicionar endpoints de health (`GET /health`, `GET /ready`).
- [x] Implementar idempotencia no `POST /invoice` (header `Idempotency-Key`).
- [~] Validacao forte de payload (ja valida campos principais; ainda sem validacao mais robusta como Luhn e regras de cartao por bandeira).
- [x] Mascarar dados de cartao (persistencia apenas de `last4`, sem CVV).

### 3) Mensageria e consistencia

- [x] Definir contrato de evento em JSON com schema version.
- [x] Garantir deduplicacao no consumo de `transactions_result` (event_id + store dedicado).
- [x] Aplicar retry com backoff no consumer e DLQ apos N tentativas.
- [x] Estado da fatura como state machine com transicoes validas + trilha de auditoria.

### 4) Antifraude (NestJS)

- [x] Separar API e worker Kafka.
- [x] Registrar motivo do score e salvar historico de analises.
- [x] Expor endpoint para consulta do resultado da analise.

### 5) Observabilidade

- [x] Logs estruturados no Go (`request_id` e contexto da requisicao).
- [x] Correlation ID de ponta a ponta (frontend -> gateway -> Kafka -> antifraude -> retorno).
- [x] Metricas basicas (latencia/erros no gateway e contadores no antifraude).

### 6) Seguranca

- [x] Hash de API keys (HMAC).
- [x] Rate limiting por API key.
- [x] Nunca armazenar CVV e validar payload.
- [x] CORS limitado e headers de seguranca no gateway.

### 7) Qualidade e DX

- [x] OpenAPI/Swagger para API Gateway.
- [~] Testes unitarios/integracao/e2e (Nest possui base de testes; falta cobertura forte no gateway e testes de fluxo cross-service).
- [x] Seeds e scripts para demo em 1 comando.

## Priorizacao recomendada (proximos ciclos)

Detalhamento executavel P0/P1: `docs/local/implementation-plan-p0-p1.md`

### P0 - Alta prioridade (impacto direto em confiabilidade de produto)

- [x] Idempotencia HTTP no `POST /invoice` com `Idempotency-Key` + persistencia de resposta.
- [x] Outbox pattern no gateway para `pending_transactions` (evita perda de evento entre `save invoice` e `publish`).
- [x] Contrato de eventos versionado (`schema_version`) com validacao de payload no producer/consumer.
- [x] CORS restritivo + security headers no gateway (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, etc.).

### P1 - Media prioridade (forte sinal de maturidade tecnica)

- [x] Correlation ID fim a fim com propagacao em headers Kafka.
- [x] OpenAPI no gateway + colecao de requests de referencia.
- [~] Testes de integracao no gateway (DB + Kafka fake/real) para cenarios de falha e reprocessamento.
- [~] Teste e2e de fluxo completo (create account -> invoice pending -> antifraude -> settlement).
- [x] Hardening do antifraude para dinheiro em centavos/decimal (hoje `Float` no Prisma).

### P2 - Diferenciais pleno+ (portfolio/recrutador)

Detalhamento executavel P2: `docs/local/implementation-plan-p2.md`

- [x] Auditoria de transicoes de invoice (`invoice_events`) com timeline real no frontend.
- [x] CI com pipeline minima: lint + test + smoke test de compose.
- [x] SLOs e dashboard simples (taxa de aprovacao, erro por endpoint, lag de processamento).
- [x] Rotacao de segredo de API key/HMAC com estrategia de migracao segura.

### P3 - Operacao resiliente e maturidade de plataforma

Detalhamento executavel P3: `docs/local/implementation-plan-p3.md`

- [~] Finalizar bateria de testes pendentes da P1 (integracao + e2e cross-service) antes do fechamento de release.
- [x] Inbox pattern no antifraude para dedup de consumo por `event_id` (simetria com gateway).
- [x] Backfill/replay seguro da DLQ com comando administrativo controlado.
- [x] Limites por conta (ex.: maximo diario de volume) com politicas configuraveis.
- [x] Modo "chaos test" local (falhar publish/consumer) para demonstrar resiliencia.
- [x] Persistencia de logs em producao (ex.: Loki + Promtail + Grafana, com retention e filtros por `request_id`).

## Entregaveis recomendados para recrutadores

- [ ] README com "Demo em 3 minutos" + arquitetura atualizada + tradeoffs tecnicos.
- [ ] Diagrama de sequencia do fluxo async (pending -> antifraude -> settlement).
- [ ] Evidencia de qualidade: relatorio de testes e cenarios de falha cobertos.
- [ ] Runbook de incidentes curtos (Kafka down, DB down, retries/DLQ).
