# QA Observability Report - 2026-02-15

## Resumo executivo

Status final da rodada apos correcoes: **pass**.

Bloqueadores reportados na primeira execucao foram corrigidos e revalidados:

1. Gateway em Docker usando `localhost` para DB/Kafka (corrigido).
2. Frontend em restart loop por erro do Turbopack (corrigido).
3. Query operacional do Loki para `go-gateway` sem retorno consistente (corrigido).
4. `GET /invoice/{id}/events` com API key invalida retornando `500` por efeito colateral (corrigido).

## Correcao aplicada

### 1) Gateway env precedence (Docker vs `.env.local`)

- Arquivo: `go-gateway/cmd/app/main.go`
- Mudanca:
  - remocao de `godotenv.Overload(".env.local")`.
  - novo carregamento com precedencia: **runtime env > .env.local > .env**.
- Resultado:
  - `GET /ready` voltou para `200`.
  - `POST /accounts` e `POST /invoice` voltaram para `201` no Docker full stack.

### 2) Frontend Docker sem restart loop

- Arquivo: `docker-compose.yaml`
- Mudanca:
  - comando do frontend alterado para `npx next dev --webpack --hostname 0.0.0.0 --port 3000`.
- Resultado:
  - container `frontend` estavel (`Up`) em `3002`.
  - UI navegavel sem crash do Turbopack.

### 3) Query Loki por `go-gateway`

- Arquivo: `go-gateway/cmd/app/main.go`
- Mudanca:
  - prefixo de log adicionado: `[go-gateway]`.
- Resultado:
  - query `{job="docker"} |= "go-gateway"` retorna linhas relevantes do gateway.

### 4) Promtail estabilizado

- Arquivo: `monitoring/promtail-config.yml`
- Mudanca:
  - revert para scrape por arquivo (`/var/lib/docker/containers/*/*-json.log`), removendo `docker_sd_configs` que estava incompatível com a API do Docker local.
- Resultado:
  - ingestao de logs normal.
  - query `{job="docker"} |= "request_id="` funcional.

## Evidencias de revalidacao

- Gateway readiness:
  - `GET /ready` -> `200`, body `{\"checks\":{\"database\":\"ok\",\"kafka\":\"ok\"},\"status\":\"ok\"}`.
- Operacoes de negocio via API:
  - `POST /accounts` -> `201`.
  - `POST /invoice` (baixa e alta) -> `201`.
  - Eventos retornados:
    - baixa: `created,approved`
    - alta: `created,pending_published,approved,balance_applied`
- Autorizacao:
  - `GET /invoice/{id}/events` com chave invalida -> `401` (`invalid_api_key`).
- Frontend:
  - `http://localhost:3002` -> `200`.
  - fluxo validado na UI:
    - logout -> login com API key -> criar transacao -> abrir detalhe com timeline.
- Prometheus:
  - targets `gateway`, `antifraud`, `antifraud_worker` em `up`.
- Loki:
  - `{job="docker"} |= "request_id="` -> com retorno.
  - `{job="docker"} |= "go-gateway"` -> com retorno.

## Chaos leve (revalidado)

- Kafka down:
  - `GET /ready` -> `503` com `kafka:error`.
- Kafka up:
  - `GET /ready` -> `200` com `kafka:ok`.

## Nota sobre smoke local

Durante a tentativa de `./scripts/ci.sh smoke`, houve falha local por permissao ao criar `nestjs-anti-fraud/.env.ci.bak` (ownership do arquivo no host).  
Isso nao indica regressao funcional das correcoes de observabilidade; e uma questao local de permissao de arquivo.

## Conclusao

Os erros da rodada anterior foram corrigidos e revalidados.  
Observabilidade (Prometheus/Grafana/Loki/Promtail), readiness do gateway, fluxos principais de API e frontend em Docker estao operando normalmente no escopo desta bateria.
