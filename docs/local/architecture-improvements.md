## Objetivo

Elevar o projeto para um case de backend pleno, com fluxo de uso mais simples e arquitetura mais robusta, sem inflar demais o escopo.

## Diagnostico rapido da arquitetura atual

- Servicos: frontend (Next.js), gateway (Go), antifraude (Nest.js), Kafka, 2x Postgres.
- Integracao: gateway publica transacoes e antifraude responde via Kafka.
- Usuario: login por API Key manual, sem cadastro; fluxo inicial gera frustracao.
- Operacao: pouca observabilidade, sem health checks no Go, sem padrao de erros, sem idempotencia.
- Segurança: API key em texto puro, dados de cartao sem mascaramento/validacao forte.

## Melhorias de arquitetura (prioridade alta)

### 1) Fluxo de uso e primeira impressao

- Criar pagina de "Cadastrar conta" que chama `POST /accounts`.
- Exibir API Key apenas uma vez com opcao "Copiar" + salvar cookie automaticamente.
- Adicionar "Demo mode" (seed) com dados ricos para acesso rapido.
- Tela inicial com passo a passo: criar conta -> copiar API key -> criar fatura.
- Mensagens de erro amigaveis no login e vazio de faturas.

### 2) API Gateway (Go)

- Padronizar erros em JSON (code, message, details).
- Adicionar endpoints de health:
  - `GET /health` (liveness)
  - `GET /ready` (readiness com DB + Kafka)
- Implementar idempotencia no `POST /invoice` (header `Idempotency-Key`).
- Validacao forte de payload (ex: valores, datas, cvv).
- Mascarar dados de cartao (guardar apenas last4 e expiry).

### 3) Mensageria e consistencia

- Definir contrato de evento em JSON com schema version.
- Garantir deduplicacao no consumo de `transactions_result` (por event_id e invoice_id).
- Aplicar retry com backoff no publisher/consumer e DLQ apos N tentativas.
- Estado da fatura como state machine:
  - `created -> pending/approved/rejected`
  - transicao valida e auditavel

### 4) Antifraude (Nest.js)

- Separar "API" e "worker Kafka" (profiles) para rodar apenas o consumidor.
- Registrar motivo do score e salvar historico de analises.
- Expor endpoint interno para consulta do resultado da analise.

### 5) Observabilidade

- Logs estruturados no Go (request_id, account_id, invoice_id).
- Correlation ID do frontend ate o antifraude (header).
- Metricas basicas (latencia, erros, taxa de aprovacao).

### 6) Segurança

- Hash de API keys (armazenar hash, comparar via HMAC).
- Rate limiting por API key.
- Nunca armazenar CVV; mascarar e validar dados.
- CORS limitado e headers de seguranca no gateway.

### 7) Qualidade e DX

- OpenAPI/Swagger para API Gateway.
- Testes: unitarios (dominio), integracao (DB), e2e (fluxo).
- Seeds e scripts para demo (1 comando).

## Melhorias de UX (frontend)

- "Cadastro rapido" com retorno de API key e auto-login.
- UI com estado vazio (sem faturas) e call-to-action.
- Mensagens claras nos erros de autenticao e falha de API.
- Botao "Gerar fatura demo" para test drive.
- Indicadores de status e timeline da fatura.

## Roadmap sugerido (fases)

### Fase 1 (1-2 dias) - Primeira impressao e confiabilidade basica

- Tela de cadastro + auto-login.
- Demo mode com seed e dados ricos (1 conta + 5 faturas de status variados).
- Padrao de erro JSON no Go.
- Health endpoints.
- Validacoes de payload e mascaramento de cartao.

### Fase 2 (2-4 dias) - Resiliencia e observabilidade

- Idempotencia no create invoice.
- Deduplicacao no consumer (event_id) + tabela de processados.
- Retry/backoff no Kafka + DLQ (transactions_result_dlq).
- Metricas Prometheus no Go e Nest (latencia, erros, throughput).
- Logs estruturados + correlation ID.

### Fase 3 (3-5 dias) - Nivel pleno forte

- OpenAPI + testes integrados.
- Rate limiting e API key hash.
- Tracing simples.
- Estado de faturas com historico e auditoria.

## Entregaveis de alto impacto para recrutadores

- README com fluxo de demo em 3 passos.
- Diagrama de arquitetura atualizado.
- Exemplos de requests (curl ou api.http).
- Testes automatizados e CI simples (lint + test).

## Escopo ideal (pedido atual)

- Demo mode com seed (via script ou comando Docker).
- Metricas (Prometheus) em Go e Nest.
- Hash de API key + rate limit no Gateway.
- DLQ e deduplicacao no consumo do Kafka.
