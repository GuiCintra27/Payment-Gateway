# Plano - Redesign UI (Payment Gateway, C6-inspired)

Objetivo: atualizar o visual para uma identidade premium, neutra e confiavel (C6-inspired), sem alterar fluxos, logica ou integracoes. Apenas tema, componentes e classes.

## 1) Direcao visual

- Base: Carbon (dark) + Marble/Silver em contraste.
- Sem glow, sem gradientes chamativos.
- Acento principal: gold/champagne discreto.
- Bordas com baixo contraste, sombras sutis.
- Tipografia corporativa (Manrope ou Sora).

## 2) Tokens de tema (globals.css / tailwind config)

### Escolha do tema
- Manter dark (Carbon) como base.
- Background principal com leve textura (grid/linhas discretas).

### Tokens sugeridos (CSS vars)

- `--background`: #0F1113 (carbon)
- `--card`: #14171B (3-5% mais claro)
- `--border`: rgba(255,255,255,0.08)
- `--foreground`: #E6E7E8
- `--muted`: #9AA0A6
- `--primary`: #D9C08C (gold/champagne)
- `--secondary`: #20242A
- `--success`: #1B3A2A (bg) / #85C59A (text)
- `--warning`: #3A2E17 (bg) / #E1B877 (text)
- `--danger`: #3A1F24 (bg) / #E49A9A (text)

### Radius / shadow / focus
- Radius: 12px a 16px
- Shadow: 0 4px 18px rgba(0,0,0,0.25)
- Focus: ring 1-2px em `--primary` (sem glow)

Arquivos alvo:
- `next-frontend/src/app/globals.css`
- `next-frontend/tailwind.config.ts`
- `next-frontend/src/components/ui/*`

## 3) Tipografia

- Trocar fonte para Manrope (ou Sora).
- Title: 32-40px, weight 600-700, tracking levemente negativo.
- Labels: 12-13px, uppercase opcional nas tabelas.

Arquivos alvo:
- `next-frontend/src/app/layout.tsx`
- `next-frontend/src/app/globals.css`

## 4) Componentes base (shadcn/ui)

### Inputs
- Fundo sólido (sem translucido).
- Borda fina, placeholder sutil.
- Focus ring fino no primary.

### Buttons
- Primary: gold/champagne, texto escuro.
- Secondary: outline/ghost neutro.
- Destructive: apenas hover vermelho.

### Cards
- Matte surface, sem glass.
- Bordas e sombras suaves.

### Badges
- Approved: bg verde escuro + texto verde claro + icone check.
- Pending: bg ambar discreto + texto dourado + icone clock.
- Declined: bg vinho escuro + texto rosado + icone x.

Arquivos alvo:
- `next-frontend/src/components/ui/button.tsx`
- `next-frontend/src/components/ui/input.tsx`
- `next-frontend/src/components/ui/textarea.tsx`
- `next-frontend/src/components/ui/card.tsx`
- `next-frontend/src/components/ui/badge.tsx`
- `next-frontend/src/components/StatusBadge.tsx`

## 5) Layout e estrutura

### Header
- Altura reduzida.
- Logo/nome a esquerda.
- Usuario + logout a direita (ghost, sem vermelho forte).

Arquivos:
- `next-frontend/src/components/header.tsx`

### Breadcrumb
- Implementar componente simples.
- Inserir em paginas internas: lista, create, detalhe.

Arquivos:
- `next-frontend/src/components/breadcrumb.tsx` (novo)
- `next-frontend/src/app/invoices/page.tsx`
- `next-frontend/src/app/invoices/create/page.tsx`
- `next-frontend/src/app/invoices/[id]/page.tsx`

### Container
- Max width consistente (1040-1200px).
- Mais respiro entre secoes.
- Subtitulos com tom muted.

Arquivos:
- `next-frontend/src/app/layout.tsx`
- `next-frontend/src/app/invoices/invoice-list.tsx`

## 6) Paginas

### A) Login
- Card menor, mais respiro.
- Subtexto tecnico: "API keys are hashed (HMAC) and rate-limited".
- Botao primary gold.

Arquivos:
- `next-frontend/src/app/login/page.tsx`
- `next-frontend/src/app/login/AuthForm.tsx`

### B) Lista de transferencias
- Header com titulo + subtitulo curto.
- Tabela mais acima (menos vazio).
- Actions como icones com tooltip.

Arquivos:
- `next-frontend/src/app/invoices/invoice-list.tsx`

### C) Nova transferencia
- Layout 2 colunas com cards bem definidos.
- CTA no rodape do card.
- Cancelar ghost.

Arquivos:
- `next-frontend/src/app/invoices/create/InvoiceForm.tsx`
- `next-frontend/src/app/invoices/create/page.tsx`

### D) Detalhe da transferencia
- Header com ID + badge + download.
- Cards alinhados em grid.
- Secao "Eventos" (placeholder audit trail).

Arquivos:
- `next-frontend/src/app/invoices/[id]/page.tsx`

## 7) Microinteracoes

- Hover com leve wash (2-3%).
- Transicoes curtas (120-180ms).
- Alerts com borda esquerda colorida.

Arquivos:
- `next-frontend/src/components/ui/alert.tsx`
- `next-frontend/src/components/ui/button.tsx`
- `next-frontend/src/components/ui/card.tsx`

## 8) Background decorativo sutil

- Grid ou linhas diagonais com alpha 2-3%.
- Aplicar no body ou em wrapper externo.

Arquivos:
- `next-frontend/src/app/globals.css`

## 9) Checklist de QA visual

- Contraste acessivel (minimo AA).
- Botao primary visivel em todos os estados.
- Badge legivel em dark background.
- Header e breadcrumb consistentes.
- Sem regressao de layout em mobile.

## 10) Sequencia de implementacao sugerida

1) Tokens + tipografia (globals + layout).
2) Componentes base (button, input, card, badge, alert).
3) Header + breadcrumb.
4) Paginas: login, lista, create, detalhe.
5) Ajustes finais e QA.
