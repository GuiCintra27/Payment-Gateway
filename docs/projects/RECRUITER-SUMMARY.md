# Payment Gateway — resumo para recrutadores

Projeto full stack que simula um gateway de pagamentos com arquitetura distribuída orientada a eventos, cobrindo criação de contas, emissão de transações, análise antifraude assíncrona, processamento idempotente e observabilidade ponta a ponta.

## O que foi construído
- `go-gateway` (Go): API principal com autenticação via API key, gestão de contas/saldo, criação de invoices e publicação de eventos em Kafka.
- `nestjs-anti-fraud` (NestJS): serviço antifraude com API administrativa e worker Kafka dedicado para decisão assíncrona de risco.
- `next-frontend` (Next.js): interface de operação com listagem, detalhes, timeline de eventos e exportação.
- Infra local reproduzível com Docker Compose (Postgres, Redpanda/Kafka, Prometheus, Grafana, Loki, Promtail).

## Sinais de senioridade técnica
- Arquitetura orientada a eventos com desacoplamento entre processamento síncrono e assíncrono.
- Idempotência aplicada no fluxo transacional e no consumo de eventos, reduzindo efeitos de retries/duplicações.
- Contrato de eventos versionado e compatível entre serviços.
- Outbox pattern + deduplicação (`processed_events`) + DLQ para resiliência operacional.
- Segurança por padrão: API keys com HMAC, não persistência de CVV, storage apenas dos 4 últimos dígitos do cartão.
- Rotação de segredo HMAC (`key_id`) com estratégia de migração segura.
- Auditoria de transições por `invoice_events`, permitindo rastreabilidade de lifecycle.
- Observabilidade completa: métricas, logs centralizados, dashboards e correlação por `request_id`.
- Ready/health checks e runbook operacional para troubleshooting e recuperação.
- CI com lint, testes e smoke de ambiente para reduzir regressões.
- Documentação técnica estruturada (PT/EN), com quick start, arquitetura, segurança e referência operacional.

## Valor para produto e negócio
- Demonstra capacidade de projetar sistemas financeiros com foco em consistência, auditabilidade e operação.
- Mostra domínio de integração entre múltiplas stacks (Go, NestJS, Next.js, Kafka, Postgres, observabilidade).
- Facilita evolução para cenários reais: regras antifraude avançadas, maior volume de eventos e hardening de produção.
