# QA Observability Checklist - 2026-02-15

Escopo executado: `docker-compose.yaml` + `docker-compose.monitoring.yaml` + `docker-compose.logging.yaml` com chaos leve.

## Fase 0 - Baseline e subida controlada

- [x] `docker compose up -d --build`
- [x] `docker compose -f docker-compose.monitoring.yaml up -d`
- [x] `docker compose -f docker-compose.logging.yaml up -d`
- [x] `docker compose ps` coletado
- [x] Todos os serviços estáveis sem restart loop
  - Revalidação: **passou** (frontend estável com `next dev --webpack` no compose).

## Fase 1 - Saude tecnica e interfaces base

- [x] `GET /health` (gateway) -> `200`
- [x] `GET /ready` (gateway) -> `2xx`
  - Revalidação: **passou** (`200`, checks `database:ok`, `kafka:ok`).
- [x] `GET /metrics` (gateway) acessivel
- [x] `GET /metrics/prom` (gateway) acessivel
- [x] `GET /metrics` (antifraude API) -> `200`
- [x] `GET /metrics/prom` (antifraude API) -> `200`
- [x] `GET /metrics` (antifraude worker) -> `200`
- [x] `GET /metrics/prom` (antifraude worker) -> `200`
- [x] `GET /swagger/index.html` (gateway) -> `200` via `GET`

## Fase 2 - Prometheus (targets + queries)

- [x] `GET /api/v1/targets` com `gateway`, `antifraud`, `antifraud_worker` em `up`
- [x] Query `sum(rate(http_requests_total[5m]))` com serie valida
- [x] Query `sum(rate(http_requests_errors_total[5m]))` com serie valida
- [x] Query `sum(rate(antifraud_processed_total[5m]))` com serie valida apos trafego
- [x] Query `sum(rate(antifraud_approved_total[5m]))` com serie valida apos trafego
- [x] Query `sum(rate(antifraud_rejected_total[5m]))` com serie valida apos trafego

## Fase 3 - Geracao de trafego observavel

- [x] Criar conta via gateway e capturar `api_key`
  - Revalidação: **passou** (`POST /accounts` retorna `201`).
- [x] Criar invoices baixa/alta via gateway
  - Revalidação: **passou** (`POST /invoice` retorna `201` em baixa e alta).
- [x] Gerar trafego async no antifraude via Kafka (`pending_transactions`) com `x-request-id`
- [x] Confirmar processamento no worker por logs e metricas

## Fase 4 - Grafana monitoring (3004)

- [x] Login em `http://localhost:3004`
- [x] Datasource `Prometheus` provisionado
- [x] Dashboard `Payment Gateway - Overview` encontrado
- [x] Paineis renderizados:
  - `Gateway RPS`
  - `Gateway Errors (5xx/4xx)`
  - `Antifraude Processed`
  - `Antifraude Approved vs Rejected`

## Fase 5 - Loki/Promtail/Grafana Logs (3005)

- [x] `GET http://localhost:3100/ready` (com transicao inicial de warming)
- [x] Promtail ativo, sem loop de erro fatal de push
- [x] Login em `http://localhost:3005`
- [x] Datasource `Loki` provisionado
- [x] Query LogQL `{job="docker"} |= "request_id="` retorna linhas
- [x] Query LogQL por `obs-kafka-*` retorna logs do worker
- [x] Query de exemplo `{job="docker"} |= "go-gateway"` retorna linhas relevantes
  - Revalidação: **passou** (logs do gateway com prefixo `[go-gateway]` retornando no Loki).

## Fase 6 - Correlacao ponta a ponta

- [x] Correlacao por `request_id` em logs do worker (`obs-kafka-*`, `chaos-a-*`, `chaos-b-*`)
- [x] Correlacao por `request_id` em logs do gateway (`obs-req-account-1`)
- [x] Correlacao completa API -> `invoice_events` -> processamento
  - Revalidação: **passou** (`request_id` presente no `invoice_events` e no processamento async).

## Fase 7 - Chaos leve

- [x] Cenario A: `nestjs-worker` parado e target `up=0`
- [x] Cenario A: eventos enfileirados com worker parado
- [x] Cenario A: worker retomado, backlog drenado (`chaos-a-*` processado)
- [x] Cenario B: `kafka` parado e erros observaveis no worker
- [x] Cenario B: `kafka` retomado e worker volta a consumir (`chaos-b-recover-1`)
- [x] Cenario B: `GET /ready` degradar e recuperar no gateway
  - Revalidação: **passou** (`503` com Kafka parado e retorno para `200` após restart).

## Fase 8 - Regressao rapida de interfaces funcionais

- [x] Frontend docker (`http://localhost:3002`) acessivel
  - Revalidação: **passou** (`200`, sem restart loop).
- [x] Fluxos login/criacao/detalhe no frontend docker
  - Revalidação: **passou** (logout -> login com API key -> criação de transação -> detalhe com timeline).
- [x] `GET /invoice/{id}/events` com API key invalida retorna `401`
  - Revalidação: **passou** (`401` com body `invalid_api_key`).

## Fase 9 - Evidencias e consolidacao

- [x] Checklist consolidado
- [x] Relatorio detalhado criado em `docs/archive/local/qa/qa-observability-report-2026-02-15.md`
