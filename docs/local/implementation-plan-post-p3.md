# Plano Pos-P3 — Consolidacao e Go-Live de Portfolio

Documento principal relacionado: [`docs/local/architecture-improvements.md`](docs/local/architecture-improvements.md)

## Objetivo

Consolidar o projeto para apresentacao tecnica (portfolio/recrutadores), garantindo operacao local previsivel, documentacao atualizada, narrativa de demo consistente e automacao de release.

## Escopo

- Inclui:
  - Hardening de DX local (setup/start/troubleshooting).
  - Atualizacao e sincronizacao da documentacao principal.
  - Criacao de roteiro de demo tecnica de 5 minutos.
  - Automacao de release/tag via `release-please` integrado ao CI.
  - Backlog de otimizações Next.js para executar logo em seguida.
- Nao inclui:
  - Mudancas de regra de negocio.
  - Refactor estrutural de arquitetura.

---

## Bloco 1 — DX e Setup Local

Status atual: concluido em 2026-02-10.

### Objetivo
Deixar o `./start-dev.sh` e o onboarding local robustos em ambiente limpo.

### Tasks
- [x] Revisar `README.md` com fluxo unico de setup (`./start-dev.sh`) e fallback de compose.
- [x] Garantir que exemplos `.env` estejam sincronizados com as variaveis reais usadas em runtime.
- [x] Adicionar matriz de troubleshooting rapida (porta ocupada, permissao, Docker orfao, migrate falhando).
- [x] Validar setup em maquina limpa/sessao nova com checklist.

### Criterios de aceite
- [x] Um dev novo sobe o projeto local sem ajuste manual adicional.
- [x] Troubleshooting cobre os 5 erros mais comuns observados.

### Validacao executada (2026-02-10)

- `./start-dev.sh` validado com sucesso (gateway, antifraude API, antifraude worker e frontend iniciaram nas portas esperadas).
- Fluxo de migracao local do antifraude confirmado com `npx prisma migrate deploy` (nao interativo).
- Correcao automatica de permissao validada em `nestjs-anti-fraud/dist` e `next-frontend/.next`.

Checklist da validacao:
- [x] Gateway pronto em `http://localhost:8080`
- [x] Antifraude API pronto em `http://localhost:3001`
- [x] Antifraude worker pronto em `http://localhost:3101/metrics`
- [x] Frontend pronto em `http://localhost:3000`
- [x] Nenhum prompt interativo de migration durante startup

---

## Bloco 2 — Atualizacao de Documentacao

### Objetivo
Atualizar docs de alto nivel com base no que ja foi implementado em P0/P1/P2/P3.

### Tasks
- [ ] Atualizar `docs/projects/ARCHITECTURE.md` com estado atual (outbox, inbox, DLQ replay, observabilidade).
- [ ] Atualizar `docs/projects/INFRA.md` com stacks auxiliares (`monitoring` e `logging`).
- [ ] Atualizar `docs/projects/FLOWS.md` com fluxos sincrono/assincrono e pontos de falha.
- [ ] Atualizar `docs/projects/OBSERVABILITY.md` e `docs/projects/RUNBOOK.md` com comandos de diagnostico.
- [ ] Revisar `README.md` para refletir arquitetura e validacoes atuais.

### Criterios de aceite
- [ ] Nao existir contradicao entre `docs/local` e `docs/projects`.
- [ ] README refletir com precisao o comportamento atual da stack.

---

## Bloco 3 — Roteiro de Demo (5 minutos)

### Objetivo
Padronizar uma demonstracao tecnica curta, com narrativa de senioridade.

### Entregavel
- [ ] Novo documento `docs/projects/DEMO-SCRIPT.md`.

### Estrutura minima do roteiro
- [ ] Contexto: problema, arquitetura e stack.
- [ ] Fluxo principal: criar conta -> criar invoice pending -> retorno antifraude.
- [ ] Confiabilidade: idempotencia, outbox/inbox, dedup, DLQ replay.
- [ ] Operacao: metrics e logs por `request_id`.
- [ ] Encerramento: tradeoffs e proximos passos.

### Criterios de aceite
- [ ] Roteiro executavel em 5-7 minutos.
- [ ] Inclui comandos/copias prontas para demo ao vivo.

---

## Bloco 4 — Release Automatica (CI + release-please)

### Objetivo
Automatizar changelog, PR de release e tags sem depender de processo manual.

### Implementacao proposta
- [ ] Adicionar workflow `.github/workflows/release-please.yml`.
- [ ] Configurar `release-please` (modo monorepo simples ou raiz unica).
- [ ] Definir padrao de commit (`feat`, `fix`, `chore`, etc.) para versionamento.
- [ ] Gerar `CHANGELOG.md` automaticamente a cada release.
- [ ] Publicar tag ao merge do PR de release.

### Criterios de aceite
- [ ] PR de release gerado automaticamente apos merges na `master`.
- [ ] Tag publicada automaticamente no merge da release.
- [ ] Changelog consistente com os commits.

---

## Bloco 5 — Otimizacoes Next.js (proxima iteracao)

### Objetivo
Entrar em performance frontend com base em medicao, sem risco desnecessario.

### Ordem recomendada
- [ ] Medir baseline: `next build`, analise de bundle, Web Vitals/Lighthouse.
- [ ] Aplicar otimizações de baixo risco:
  - [ ] code-splitting/import dinamico em componentes pesados.
  - [ ] cache de fetch/server actions quando aplicavel.
  - [ ] reduzir JS enviado para cliente em paginas server-first.
- [ ] Avaliar React Compiler como experimento controlado (A/B local), sem tornar obrigatorio de imediato.

### Criterios de aceite
- [ ] Decisao de React Compiler baseada em metrica comparativa.
- [ ] Nenhuma regressao funcional nos fluxos principais.

---

## Checklist de Execucao

- [x] Bloco 1 concluido
- [ ] Bloco 2 concluido
- [ ] Bloco 3 concluido
- [ ] Bloco 4 concluido
- [ ] Bloco 5 concluido

## Observacao

Este plano complementa o fechamento tecnico de P0/P1/P2/P3 e prepara o projeto para apresentacao publica com governanca de release e narrativa tecnica clara.
