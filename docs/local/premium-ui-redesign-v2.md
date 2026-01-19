# Plano - Redesign UI (Premium Black, C6-inspired)

Objetivo: entregar uma identidade premium e mais “black”, inspirada no C6, mas com assinatura propria do Payment Gateway. O foco e reduzir o vazio visual com composicao de layout, blocos informativos e elementos grafico-estruturais discretos (sem exageros fora do tema financeiro).

## 1) Direcao criativa

- Base “Black Carbon”: fundo quase preto com variacoes de 2-5% para separar planos.
- Destaques “Metallic Champagne”: acento pontual (CTA, foco, badge primario, divisorias).
- Tipografia forte e elegante, com hierarquia clara e tracking levemente negativo nos titulos.
- Interface “densa, mas respiravel”: mais conteudo util em tela sem parecer poluida.
- Visual moderno, mas contido: nada de neon, nada de vidro, zero brilho exagerado.

## 2) Identidade visual propria (sem copiar o C6)

- Monograma discreto “PG” para uso em cantos de cards ou vazios grandes.
- Pattern sutil: linhas diagonais ou grid tecnico com alpha 2-3%.
- Barras de acento metalico em headings (ex.: linha fina ao lado do titulo).
- Taglines tecnicas curtas (ex.: “Secure by default”, “Event-driven settlement”).
- Microchips / “modules”: pequenos cards informativos que preenchem gaps.

## 3) Tokens de tema (dark premium)

Paleta sugerida (HSL ou HEX):
- Background: #0B0B0C
- Surface/Card: #121316
- Surface-2: #16181C
- Border: rgba(255,255,255,0.06)
- Foreground: #EDEDED
- Muted: #9AA0A6
- Primary (champagne): #D0B77E
- Primary-foreground: #1A1B1E
- Accent metalico: #BFA46A (linhas/ícones)
- Success: #1D3C2B (bg) / #86C19B (text)
- Warning: #3D2F18 (bg) / #E1B877 (text)
- Danger: #3A1F24 (bg) / #E49A9A (text)

Tipografia (sugestao):
- Primary: Sora ou IBM Plex Sans (mais corporativa e firme).
- Titulo: 32-44px, peso 600-700, tracking -0.02em.
- Labels: 11-12px, uppercase, tracking 0.2em.

## 4) Estrutura para reduzir “vazios”

### Blocos “preenchedores” de valor
- “KPI Strip” no topo das listas: 3-4 cards com numeros (ex.: Volume, Aprovacao, Pendencias, Fraude).
- “Atividade recente” em cards estreitos (ultima transferencia, ultima rejeicao, ultimo pagamento aprovado).
- “Status de infraestrutura” (Kafka, Anti-fraud, Gateway) com indicadores simples.
- “Ajuda rapida” (links curtos + docs).

### Estruturas grafico-funcionais
- Divisorias finas em secoes.
- Headers com subtitulo tecnico em 1 linha.
- Sidebar contextual (em pages de detalhe/criacao) com “Resumo” e “Regras”.

## 5) Componentes premium (ajustes de estilo)

- Cards: matte, borda fina, sombra curta (sem flutuar demais).
- Buttons:
  - Primary: champagne solido, texto escuro.
  - Secondary: outline com borda metalica.
  - Ghost: hover com wash leve (3%).
- Inputs: fundo solido escuro, borda fina, placeholder discreto.
- Table: linhas com hover wash, header mais compacto e uppercase.
- Badges: fundo escuro + texto claro + icone (check/clock/x).
- Alerts: barra esquerda colorida (sem glow).

## 6) Layout por pagina (sem mexer no fluxo)

### Home (Criar conta / Demo)
- Hero com titulo maior + subtitulo tecnico.
- Adicionar faixa de “KPI strip” logo abaixo do hero.
- Cards de Criar conta / Demo ficam em grid com “panel header” e corpo mais denso.
- Pequeno painel lateral com “Seguranca e compliance” (bullet list).

### Login (API Key)
- Card central menor, mas com “header premium”.
- Colocar “mini panel” abaixo com dicas (rate limit, hashing, ambiente demo).
- Adicionar microtexto “Powered by event-driven settlement”.

### Lista de transferencias
- Topo: titulo + subtitulo + CTA.
- Logo abaixo: KPI strip.
- Tabela ocupa mais altura; paginação minimal.
- Coluna de “Acoes” com tooltips e icones discretos.

### Nova transferencia
- Layout 2 colunas permanece, mas:
  - Coluna direita com “Resumo da transacao” (card).
  - CTA fica no rodape do card de pagamento.
  - Adicionar um “painel de seguranca” (AVS/CVV simulados).

### Detalhe da transferencia
- Header com ID + badge + acoes.
- Cards principais + bloco “Eventos” maior (audit trail).
- Adicionar lateral “Risk summary” (mesmo placeholder).

## 7) Detalhes de personalidade (premium sem exagero)

- Linha metalica (1px) ao lado de headings.
- Pequena badge “Premium Demo” no topo, quando em demo.
- Background com vignette + grid ultra sutil.

## 8) Arquivos alvo (para quando implementarmos)

- `next-frontend/src/app/globals.css`
- `next-frontend/src/app/layout.tsx`
- `next-frontend/src/components/ui/*`
- `next-frontend/src/components/header.tsx`
- `next-frontend/src/components/breadcrumb.tsx`
- `next-frontend/src/app/page.tsx`
- `next-frontend/src/app/login/page.tsx`
- `next-frontend/src/app/invoices/invoice-list.tsx`
- `next-frontend/src/app/invoices/create/InvoiceForm.tsx`
- `next-frontend/src/app/invoices/[id]/page.tsx`

## 9) Sequencia de implementacao

1) Atualizar tokens + tipografia.
2) Ajustar componentes base (button/input/card/badge).
3) Criar blocos preenchendo vazios (KPI strip + panels).
4) Ajustar paginas principais (home, list, create, detail).
5) QA visual (contraste, responsividade, densidade).
