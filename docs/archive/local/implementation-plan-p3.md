# Plano P3 — Payment Gateway (Detalhamento Executavel)

Voltar ao plano principal: `docs/local/architecture-improvements.md`

## Resumo
Esta fase P3 foca em maturidade operacional e resiliencia do ecossistema apos a base P0/P1/P2.
Escopo da P3:
1. Fechar pendencias de testes P1 (integracao + e2e cross-service)
2. Inbox pattern no antifraude
3. Replay seguro da DLQ
4. Limites por conta com politicas configuraveis
5. Chaos test local controlado
6. Persistencia de logs para ambiente de producao

## Status de implementacao (2026-02-10)
- [x] `P3.0` Fechamento de testes P1: integracao concluida; e2e script validado.
- [x] `P3.1` Inbox no antifraude (dedup com tabela `ProcessedEvent`).
- [x] `P3.2` Replay de DLQ (CLI + auditoria em DB).
- [x] `P3.3` Limites por conta (policy + validacao no gateway).
- [x] `P3.4` Chaos test local (script `scripts/chaos.sh`).
- [x] `P3.5` Persistencia de logs (Loki + Promtail + Grafana).

## Dependencia de qualidade
Antes de considerar P3 concluida, finalizar os itens marcados como `[~]` em P1 no arquivo principal (`docs/local/architecture-improvements.md`), com evidencia de execucao.

## P3.0 — Fechamento dos testes P1 (gate obrigatorio)

### Objetivo
Concluir cobertura de validacao dos fluxos cross-service que ainda estao pendentes em P1.

### Escopo
- Testes de integracao no gateway para cenarios de falha e reprocessamento.
- Teste e2e completo: `create account -> create pending invoice -> antifraude -> settlement`.

### Criterios de aceitacao
- `go test` com suite de integracao passando.
- `./scripts/e2e.sh` passando em ambiente limpo.
- Evidencia registrada em `docs/local/implementation-plan-p0-p1.md`.

### Checklist
- [ ] Suite de integracao gateway cobrindo cenario feliz + falha de broker
- [ ] Reprocessamento confirmado apos recuperacao do Kafka
- [ ] E2E cross-service verde
- [ ] Evidencias registradas no plano P0/P1

## P3.1 — Inbox pattern no antifraude

### Objetivo
Garantir deduplicacao simetrica no consumer do antifraude para reduzir risco de processamento duplicado.

### Mudancas tecnicas
- Criar tabela `processed_events_antifraud` no Postgres antifraude.
- No worker, verificar `event_id` antes de processar payload.
- Persistir `event_id` apos processamento bem-sucedido.
- Definir estrategia em falha de persistencia (nao confirmar offset ate garantir integridade).

### Criterios de aceitacao
- Evento duplicado com mesmo `event_id` nao gera nova analise.
- Logs mostram `event skipped` com motivo `duplicate_event`.

### Checklist
- [ ] Migration criada e aplicada
- [ ] Consumer com fluxo `check -> process -> save`
- [ ] Teste de duplicidade passando
- [ ] Documentacao Kafka/antifraude atualizada

## P3.2 — Replay seguro da DLQ

### Objetivo
Permitir reprocessar mensagens da `transactions_result_dlq` de forma controlada e auditavel.

### Mudancas tecnicas
- Criar comando administrativo (script ou endpoint protegido) para replay.
- Suportar modo `dry-run` e modo `execute`.
- Registrar auditoria minima: `event_id`, timestamp, operador, resultado.
- Evitar replay infinito com limite de tentativas por evento.

### Criterios de aceitacao
- Replay em lote controlado funciona sem quebrar deduplicacao.
- Auditoria de replay consultavel.

### Checklist
- [ ] Ferramenta de replay implementada
- [ ] `dry-run` validado
- [ ] `execute` validado em ambiente local
- [ ] Auditoria persistida

## P3.3 — Limites por conta (politicas configuraveis)

### Objetivo
Adicionar controles de risco/negocio por conta para reforcar maturidade de produto financeiro.

### Mudancas tecnicas
- Definir politicas por conta:
  - `max_amount_per_tx_cents`
  - `max_daily_volume_cents`
  - `max_daily_transactions`
- Aplicar validacao no gateway antes de publicar/autorizar transacao.
- Retornar erro padronizado quando limite for excedido.

### Criterios de aceitacao
- Transacoes fora da politica sao bloqueadas com resposta explicita.
- Politicas podem ser configuradas sem alterar codigo (DB/env/admin config).

### Checklist
- [ ] Modelo/persistencia de politicas implementado
- [ ] Validacao aplicada no fluxo de criacao de invoice
- [ ] Testes cobrindo limites diarios e por transacao
- [ ] Docs de configuracao atualizadas

## P3.4 — Chaos test local (resiliencia)

### Objetivo
Demonstrar resiliencia do sistema com falhas controladas reproduziveis localmente.

### Mudancas tecnicas
- Criar script `scripts/chaos.sh` com cenarios:
  - indisponibilidade temporaria do Kafka
  - indisponibilidade de um banco
  - atraso no worker antifraude
- Coletar saida resumida com status final dos componentes.

### Criterios de aceitacao
- Cada cenario termina com recuperacao e estado consistente.
- Falhas conhecidas disparam caminhos de retry/DLQ esperados.

### Checklist
- [ ] Script de chaos criado
- [ ] Cenarios documentados e reproduziveis
- [ ] Resultado esperado definido por cenario
- [ ] Evidencia de execucao registrada

## P3.5 — Persistencia de logs (padrao producao)

### Objetivo
Persistir logs estruturados para busca historica e troubleshooting por `request_id`/`event_id`.

### Mudancas tecnicas
- Stack de logs local/producao-like:
  - Loki + Promtail + Grafana
- Coleta:
  - gateway
  - antifraude API
  - antifraude worker
- Padronizar campos minimos de log:
  - `timestamp`
  - `service`
  - `level`
  - `request_id`
  - `event_id` (quando houver)
  - `message`
- Definir retention e politica de volume para ambiente local.

### Criterios de aceitacao
- Logs consultaveis no Grafana Explore por `request_id`.
- Consulta cruzada entre gateway e antifraude usando mesmo correlation id.

### Checklist
- [x] Compose de logging criado (`docker-compose.logging.yaml`)
- [x] Promtail coletando logs (via tail de arquivos)
- [ ] Dashboard/queries basicas prontas no Grafana
- [x] Runbook de troubleshooting atualizado

## Testes e validacao da P3

### Gate P3
- [x] P1 pendencias de testes fechadas (integracao OK; e2e OK)

### Validacao funcional
- [x] Inbox evita reprocessamento duplicado (duplicate event ignorado)
- [x] Replay da DLQ funciona com auditoria (dry-run + execute)
- [x] Limites por conta bloqueiam cenario excedido
- [x] Chaos test cobre indisponibilidade e recuperacao (cenario kafka)
- [x] Busca de logs por `request_id` funciona no Loki (query validada)

## Resultados da validacao (2026-02-10)

### P3.0 — Fechamento P1
- `./scripts/ci.sh gateway` e `./scripts/ci.sh gateway-integration` passaram.
- `./scripts/e2e.sh` passou apos ajuste de email dinamico + warm-up.

### P3.1 — Inbox antifraude
- Duplicata enviada em `pending_transactions` com mesmo `event_id`.
- `ProcessedEvent` manteve 1 registro e logs mostram `Duplicate event ignored`.

### P3.2 — Replay DLQ
- Topico `transactions_result_dlq` criado manualmente.
- Replay `--dry-run --max 1` executado e auditoria gravada em `dlq_replay_audits` (`replay_mode=dry_run`).
- Replay `--max 1` executado e auditoria gravada (`replay_mode=execute`, `success=true`).

### P3.3 — Limites por conta
- Politica configurada (`max_amount_per_tx_cents=500`).
- `POST /invoice` retornou `422 limit_exceeded` com `reason=max_amount_per_tx_exceeded`.

### P3.4 — Chaos test
- `./scripts/chaos.sh kafka 5` executado com recuperacao e health check OK.

### P3.5 — Logs persistidos
- `docker compose -f docker-compose.logging.yaml up -d` executado.
- Grafana Logs respondeu `200` em `/api/health` (porta 3005).
- Loki respondeu `ready` em `http://localhost:3100/ready`.
- Query no Loki retornou logs com `request_id=qa-log-1` usando `query={job="docker"} |= "qa-log-1"`.
- Observacao: promtail em modo file-based (labels `job` + `filename`).

#### Racional da tecnologia (Loki + Promtail)
- Balanceio entre maturidade e simplicidade: stack leve, com baixo custo operacional e setup rapido.
- Adequado para demo: Grafana Explore + labels viabilizam rastreio por `request_id` sem overkill.
- Modelo eficiente: Loki indexa labels (nao o payload inteiro), reduzindo custo de storage/consulta.
- Integracao nativa com logs Docker via Promtail, sem sidecar complexo.
- Alternativas (ELK/Splunk/Datadog) exigem mais infraestrutura, custo ou credenciais externas, pouco praticas para um repo publico.

## Mudancas em APIs/Interfaces esperadas
- Possivel endpoint/admin command para replay DLQ (a definir no inicio da implementacao).
- Possivel endpoint/admin para politicas por conta (se optar por gestao via API).
- Sem quebra de contrato nos endpoints atuais de cliente.

## Assumptions e defaults
- `P3.0` (fechamento P1) e requisito para declarar P3 concluida.
- Replays serao restritos a ambiente administrativo/autenticado.
- Politicas de conta iniciam com defaults permissivos e podem ser endurecidas por config.
