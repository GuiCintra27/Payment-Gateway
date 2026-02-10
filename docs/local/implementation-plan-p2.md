# Plano P2 — Payment Gateway (Detalhamento Executavel)

Voltar ao plano principal: `docs/local/architecture-improvements.md`

## Resumo
Este plano cobre apenas os itens da secao **P2** do `docs/local/architecture-improvements.md`:
1. Auditoria de transicoes de invoice com timeline real no frontend
2. CI minima (lint + tests + smoke compose) + scripts locais equivalentes
3. SLOs e dashboard simples
4. Rotacao de segredo HMAC de API key com estrategia de migracao segura

## Status de implementacao (2026-02-09)

- [x] P2.1 Auditoria de transicoes de invoice + endpoint + timeline real no frontend.
- [x] P2.2 CI minima (script local + GitHub Actions).
- [x] P2.3 SLOs + monitoring (Prometheus/Grafana + dashboards).
- [x] P2.4 Rotacao de segredo HMAC (API_KEY_SECRETS + API_KEY_ACTIVE_KEY_ID).

## Como testar (quando tiver tempo)

### P2.1 Auditoria e timeline

1. Suba o stack local (`./start-dev.sh`) ou via Docker (`docker compose up -d --build`).
2. Crie uma invoice via UI ou API.
3. Consulte eventos:

```bash
curl http://localhost:8080/invoice/<id>/events -H "X-API-KEY: <api_key>"
```

4. Abra o detalhe da invoice no frontend e valide a timeline.

### P2.2 CI local

```bash
./scripts/ci.sh
```

### P2.3 Monitoring

```bash
docker compose -f docker-compose.monitoring.yaml up -d
```

- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3004` (admin/admin)

### P2.4 Rotacao HMAC

1. Configure env:

```bash
API_KEY_SECRETS=v1:secret1,v2:secret2
API_KEY_ACTIVE_KEY_ID=v2
```

2. Crie conta nova e valide autenticação.
3. Verifique que contas antigas continuam autenticando com `v1`.

---

## P2.1 Auditoria de transicoes de invoice (timeline real)

### Objetivo
Registrar eventos de transicao do ciclo de vida da invoice e expor timeline no frontend (pagina de detalhe).

### Mudancas tecnicas
**DB (gateway)**
- Nova tabela `invoice_events`:
  - `id` UUID
  - `invoice_id`
  - `event_type` (string, ex.: `created`, `pending_published`, `approved`, `rejected`, `balance_applied`)
  - `from_status`, `to_status` (nullable)
  - `metadata` (jsonb)
  - `request_id` (nullable)
  - `created_at`

**Gateway**
- Repository: `InvoiceEventRepository` com `Create` e `ListByInvoiceID`.
- Criar eventos nos pontos:
  - `POST /invoice`: evento `created` (sempre)
  - Se `pending`: evento `pending_published` quando criar outbox
  - Se aprovado/rejeitado imediato: evento `approved`/`rejected`
  - `ProcessTransactionResult`: evento `approved`/`rejected` + `balance_applied` quando saldo atualizado
- Novo endpoint: `GET /invoice/{id}/events` (protegido por API key)

**Frontend**
- Consumir `GET /invoice/{id}/events` e renderizar timeline no detalhe de invoice.
- Reutilizar a secao “Eventos” existente com layout consistente.

### Testes e aceitacao
- Criar invoice pending -> timeline deve mostrar `created`, `pending_published`, `approved/rejected`.
- Criar invoice aprovada imediata -> timeline deve ter `created` + `approved`.
- Autorizacao: API key errada deve retornar 403/401.

---

## P2.2 CI minima + scripts locais equivalentes

### Objetivo
Pipeline automatizado para lint/tests e smoke de compose, + scripts locais para reproduzir no dev.

### Mudancas tecnicas
**Scripts locais**
- `scripts/ci.sh`:
  - `go test ./...` em `go-gateway`
  - `npm ci && npm run lint` em `next-frontend`
  - `npm ci && npm run lint && npm test` em `nestjs-anti-fraud`
  - Smoke: `docker compose -f docker-compose.yaml up -d --build` + health checks (gateway/antifraude) + `down`

**GitHub Actions**
- Criar `.github/workflows/ci.yml`:
  - Jobs: `gateway`, `frontend`, `antifraud`, `smoke`
  - Cache de npm/go
  - Usa `scripts/ci.sh` como entrypoint

### Testes e aceitacao
- Rodar `./scripts/ci.sh` localmente sem falhas.
- Pipeline GitHub Actions verde em PR.

---

## P2.3 SLOs e dashboard simples

### Objetivo
Evidenciar maturidade operacional com SLOs e visualizacao basica.

### Mudancas tecnicas
**Docs**
- `docs/projects/OBSERVABILITY.md`: definir SLOs iniciais (ex.: disponibilidade 99.5%, taxa de falha, lag de processamento).
- `docs/projects/RUNBOOK.md`: incluir alertas simples e o que fazer.

**Dashboard simples**
- Criar `docker-compose.monitoring.yaml` com Prometheus + Grafana.
- Prometheus scrape:
  - Gateway: `http://gateway:8080/metrics/prom`
  - Antifraude: `http://antifraude:3001/metrics/prom` e `http://antifraude-worker:3101/metrics/prom`
- Dashboard Grafana JSON com:
  - throughput
  - erros
  - aprovadas vs rejeitadas
  - backlog/lag (aprox via timestamp ou counters)

### Testes e aceitacao
- Subir `docker compose -f docker-compose.monitoring.yaml up -d`
- Abrir Grafana e visualizar dashboards com dados.

---

## P2.4 Rotacao de segredo HMAC (API key)

### Objetivo
Permitir rotacao segura de HMAC sem invalidar chaves antigas.

### Mudancas tecnicas
**DB (gateway)**
- Adicionar coluna `api_key_key_id` em `accounts` (default `v1`).

**Env**
- `API_KEY_SECRETS` no formato `v1:secret1,v2:secret2`
- `API_KEY_ACTIVE_KEY_ID` define o segredo usado para novas chaves

**Gateway**
- `HashAPIKey(apiKey, keyID)` usa segredo pelo key_id.
- Ao criar conta: usar `API_KEY_ACTIVE_KEY_ID`.
- Autenticacao: usar `api_key_key_id` da conta para validar.

**Migracao**
- Script/migration para popular `api_key_key_id` em contas existentes.

### Testes e aceitacao
- Criar conta nova com `v2`, autenticar com `v2`.
- Conta antiga com `v1` continua autenticando.
- Trocar `API_KEY_ACTIVE_KEY_ID` nao quebra contas antigas.

---

## Mudancas em APIs/Interfaces
- Novo endpoint `GET /invoice/{id}/events`
- Sem mudanca no contrato HTTP principal (headers/requests existentes)

---

## Assumptions e defaults
- Escopo P2 **somente** itens da secao P2 (sem “Novas features” e sem “Entregaveis”).
- CI via GitHub Actions + script local `scripts/ci.sh`.
- Rotacao HMAC via `API_KEY_SECRETS` + `API_KEY_ACTIVE_KEY_ID` e coluna `api_key_key_id`.
