# QA Bug Report (Chrome DevTools MCP) - 2026-02-14

## Contexto

Teste manual end-to-end realizado via navegador (MCP Chrome DevTools), cobrindo:

- onboarding de conta
- login/logout
- criacao de transacoes (imediatas e pendentes)
- listagem, paginacao, detalhe e timeline de transacao
- modo demo
- tentativa de erros no frontend (validacoes de formulario e autenticacao)

## Resultado geral

- Fluxos criticos: **OK**
- Sem bugs bloqueantes/criticos encontrados
- Bugs encontrados: **4** (1 medio, 3 baixos)

## Bugs

### 1) Botao de submit sem rotulo na tela de login

- Severidade: **Media** (acessibilidade/usabilidade)
- Area: `next-frontend` / pagina `/login`
- Reproducao:
1. Abrir `/login`
2. Inspecionar elementos do formulario
3. Observar botao de submit sem texto acessivel (aparece apenas como `button`)
- Comportamento atual:
  - Botao sem label textual/aria clara no snapshot de acessibilidade.
- Comportamento esperado:
  - Botao com texto visivel (ex: `Entrar`) e/ou `aria-label` explicito.

### 2) Titulo principal da home com texto sem espaco

- Severidade: **Baixa** (UI copy)
- Area: `next-frontend` / pagina `/`
- Reproducao:
1. Abrir `/`
2. Ver titulo principal
- Comportamento atual:
  - Texto renderizado como `Gateway dePagamentos`.
- Comportamento esperado:
  - Texto com espacamento correto (`Gateway de Pagamentos`).

### 3) Lista pode ficar momentaneamente desatualizada apos transacao pendente

- Severidade: **Baixa** (UX de consistencia temporal)
- Area: `next-frontend` / pagina `/invoices`
- Reproducao:
1. Criar transacao com valor > 10000
2. Voltar para lista e observar status inicial `PENDENTE`
3. Abrir detalhe da mesma transacao alguns segundos depois
- Comportamento atual:
  - Detalhe ja pode estar `APROVADO/REJEITADO` enquanto lista ainda mostra `PENDENTE` ate refresh/navegacao.
- Comportamento esperado:
  - Lista refletir atualizacao automaticamente (polling curto, revalidacao, ou auto-refresh).

### 4) Inconsistencia de timeline em item pendente do modo demo

- Severidade: **Baixa** (consistencia de dados de demo)
- Area: `next-frontend` + dados demo (`/demo`)
- Reproducao:
1. Entrar em modo demo
2. Abrir uma transacao `PENDENTE` de exemplo
3. Ver historico de eventos
- Comportamento atual:
  - Em alguns itens demo pendentes, timeline mostra apenas `Transacao criada`.
- Comportamento esperado:
  - Dataset demo com timeline coerente com estado pendente (ex: incluir evento de publicacao para analise).

## Evidencias funcionais validadas (sem bug)

- Criacao de conta e exibicao unica de API key
- Login com API key valida e bloqueio para key invalida
- Protecao de rota `/invoices` sem sessao
- Validacoes de formulario (cartao invalido, validade invalida)
- Criacao de transacoes imediatas e pendentes
- Processamento async de antifraude refletido em detalhes/timeline
- Paginacao da listagem (6 itens -> 2 paginas)
- Detalhe da transacao com status, dados de pagamento e eventos
- Modo demo com carga inicial de transacoes

## Reteste de correcoes (rodada 2)

Data: 2026-02-14 (noite)

Resultado:

- Correcao 1 (botao login com rotulo): **OK**
- Correcao 2 (titulo home com espaco): **OK**
- Correcao 3 (auto-refresh para pendentes): **OK**
- Correcao 4 (evento demo pendente): **PARCIAL**

Validacoes executadas:

- Login invalido bloqueado com mensagem de erro e login valido funcionando.
- Fluxo pending com worker pausado e retomado: lista atualizou sem refresh manual (`PENDENTE` -> `REJEITADO`).
- Endpoint `GET /invoice/{id}/events`:
  - com chave valida retorna eventos completos;
  - com chave invalida retorna `401`;
  - `request_id` propagado corretamente quando enviado (`X-Request-Id`).

### Novo bug residual identificado

5) Ordem de timeline inconsistente em invoice pendente do demo seed

- Severidade: **Baixa**
- Area: `go-gateway` seed demo + timeline de eventos
- Reproducao:
1. Criar conta demo via `POST /demo`
2. Selecionar invoice pendente retornada no payload
3. Buscar `GET /invoice/{id}/events`
- Comportamento atual:
  - `pending_published` pode aparecer com `created_at` anterior ao evento `created`, quebrando ordem cronologica esperada.
- Comportamento esperado:
  - timeline sempre ordenada com `created` antes de `pending_published`.
