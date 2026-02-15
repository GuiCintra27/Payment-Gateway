# QA Fix Checklist Prioritized (2026-02-14)

Referência: `docs/archive/local/qa/qa-bug-report-2026-02-14.md`

## Prioridade P1 (médio)

- [x] **Login submit button sem rótulo acessível**
  - Área: `next-frontend` (`/login`)
  - Ação:
    - adicionar texto visível no botão (ex.: `Entrar`) e/ou `aria-label` explícito.
    - garantir contraste/estado de loading sem remover acessibilidade.
  - Critério de aceite:
    - snapshot de acessibilidade exibe botão com nome acessível.
    - fluxo de login continua funcionando para chave válida/inválida.

## Prioridade P2 (baixa)

- [x] **Título da home com espaçamento incorreto (`Gateway dePagamentos`)**
  - Área: `next-frontend` (`/`)
  - Ação:
    - corrigir copy para `Gateway de Pagamentos`.
  - Critério de aceite:
    - título renderiza corretamente em desktop e mobile.

- [x] **Lista de transações pode ficar temporariamente desatualizada após processamento assíncrono**
  - Área: `next-frontend` (`/invoices`)
  - Ação:
    - implementar revalidação/polling curto (ex.: `router.refresh` periódico quando existir status `pending`) ou invalidação otimizada após retorno do detalhe.
  - Critério de aceite:
    - criar transação `pending` e observar transição para `approved/rejected` sem refresh manual prolongado.
    - não gerar loop de requisições excessivas.

- [x] **Dataset demo com timeline incompleta em item pendente**
  - Área: fluxo `/demo` + seed de transações
  - Ação:
    - revisar geração de eventos demo para pendentes (incluir evento de publicação/etapa de antifraude quando aplicável).
  - Critério de aceite:
    - item pendente de demo exibe timeline coerente com estado.

## Ordem sugerida de execução

1. Corrigir acessibilidade do login (P1).
2. Corrigir copy da home (P2 rápido).
3. Ajustar atualização da lista de transações (P2 com maior impacto de UX).
4. Ajustar consistência do dataset demo (P2).

## Revalidação após correções

- [x] Repetir fluxo `/login` com key válida e inválida.
- [x] Repetir criação de transação `pending` e observar atualização da listagem.
- [x] Validar página inicial e detalhe/timeline no modo demo.
- [ ] Executar smoke básico do frontend (`npm run lint` e navegação manual principal).

## Status atual

- Implementação concluída em 2026-02-14.
- Revalidação funcional/manual executada em 2026-02-14 (rodada 2).
- Pendência residual (baixa): ordem de eventos no seed demo (`pending_published` podendo vir antes de `created` por timestamp).
