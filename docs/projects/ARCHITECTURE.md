# Arquitetura

## Diagrama (Mermaid)

```mermaid
flowchart LR
  UI[Next.js Frontend] -->|HTTP| GW[Go Gateway]
  GW -->|SQL| DB1[(Postgres Gateway)]
  GW -->|pending_transactions| KAFKA[(Kafka)]
  AF[NestJS Antifraude] -->|transactions_result| KAFKA
  AF -->|SQL| DB2[(Postgres Antifraude)]
  KAFKA -->|pending_transactions| AF
```

## Visao geral

O sistema e dividido em tres servicos principais e dois bancos de dados separados:

- `next-frontend` (UI e fluxo do usuario)
- `go-gateway` (API de contas e transferencias)
- `nestjs-anti-fraud` (analise antifraude)
- Postgres do gateway (contas, transferencias e eventos processados)
- Postgres do antifraude (contas, transferencias processadas e historico)

Fluxo macro (sincrono + assincroano):

```
[Next.js] -> [Go Gateway] -> [Postgres gateway]
                      |
                      | publish pending_transactions
                      v
                 [Kafka]
                      ^
                      | publish transactions_result
             [NestJS Antifraude] -> [Postgres antifraude]
```

## Responsabilidades por servico

### Frontend (Next.js)

- Onboarding: criar conta e modo demo
- Autenticacao baseada em API key via cookie
- Fluxo de transferencias: listagem, detalhes e criacao
- Server Actions para chamadas ao Gateway

### Gateway (Go)

- CRUD minimo de contas e transferencias
- Regra de status:
  - valores > 10000 ficam `pending` e vao para antifraude
  - valores menores tem aprovacao/rejeicao imediata
- Publica eventos de transacoes pendentes no Kafka
- Consome resultados do antifraude e atualiza transferencias
- Rate limit por API key
- Hash de API key (HMAC) no armazenamento

### Antifraude (NestJS)

- HTTP app expõe API/metrics (porta 3001)
- Worker Kafka consome eventos de transacoes pendentes e expõe metrics (porta 3101)
- Aplica regras de fraude (specifications)
- Persiste resultado em banco proprio
- Publica o resultado no Kafka

## Confiabilidade e resiliencia

- Gateway salva eventos pendentes via outbox (`outbox_events`) e publica assincrono.
- Gateway faz deduplicacao por `event_id` (tabela `processed_events`) antes de aplicar resultado.
- Antifraude usa inbox (`processed_events`) para dedup de mensagens consumidas do Kafka.
- Consumer do Gateway faz retry com backoff e envia para DLQ apos N tentativas.
- DLQ topic: `transactions_result_dlq` com replay auditado (`dlq_replay_audits`).
- Eventos de auditoria em `invoice_events` para timeline no frontend.
- Logs estruturados no gateway com `request_id` e propagacao no Kafka (`x-request-id`).
- Health endpoints para readiness e liveness.

## Ownership de dados

- Gateway e a fonte de verdade para contas e transferencias exibidas na UI.
- Antifraude mantem seu proprio historico (nao replica dados do gateway).
- A integracao entre servicos acontece apenas via Kafka.
