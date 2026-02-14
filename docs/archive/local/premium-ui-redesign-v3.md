# Plano - Redesign UI V3 (Premium Black, Modern Edge)

Objetivo: criar uma identidade premium black com personalidade moderna e tech-forward. Inspirado no C6, mas com elementos visuais contemporaneos que diferenciam o produto. Equilibrio entre "fintech confiavel" e "startup inovadora".

## 1) Direcao criativa

### Filosofia
- **"Dark luxury meets modern tech"** - elegancia com edge tecnologico.
- Premium sem ser conservador, moderno sem ser infantil.
- Profundidade visual atraves de camadas, blur e luz controlada.
- Motion como parte da identidade, nao apenas decoracao.

### Principios visuais
- Base obsidian com profundidade (nao flat, mas com elevation real).
- Acentos luminosos controlados (glow sutil, nao neon).
- Glassmorphism elegante em elementos flutuantes (modals, dropdowns, tooltips).
- Gradientes sofisticados (metallic, nao rainbow).
- Microanimacoes que comunicam estado e qualidade.

## 2) Paleta de cores

### Core (Dark foundation)
```css
--background: #08090A;        /* Obsidian base */
--background-subtle: #0D0E10; /* Elevation 1 */
--surface: #121416;           /* Cards, panels */
--surface-elevated: #181A1E;  /* Modals, dropdowns */
--border: rgba(255,255,255,0.08);
--border-subtle: rgba(255,255,255,0.04);
```

### Text
```css
--foreground: #F4F4F5;        /* Primary text */
--foreground-muted: #A1A1AA;  /* Secondary text */
--foreground-subtle: #71717A; /* Tertiary/disabled */
```

### Accent (Dual-tone system)
```css
/* Primary: Warm metallic (CTAs, highlights) */
--primary: #C9A962;           /* Gold/champagne */
--primary-hover: #D4B978;     /* Lighter on hover */
--primary-glow: rgba(201,169,98,0.15); /* Bloom effect */

/* Secondary: Cool tech (links, info, contrast) */
--accent: #38BDF8;            /* Sky blue */
--accent-muted: #0EA5E9;      /* Darker variant */
--accent-glow: rgba(56,189,248,0.10);
```

### Semantic
```css
/* Success */
--success-bg: #052E1C;
--success-border: #065F38;
--success-text: #34D399;

/* Warning */
--warning-bg: #2D1F04;
--warning-border: #854D0E;
--warning-text: #FBBF24;

/* Danger */
--danger-bg: #2D0A0A;
--danger-border: #991B1B;
--danger-text: #F87171;
```

### Gradients
```css
/* Hero/feature sections */
--gradient-hero: radial-gradient(ellipse at top, #1a1a2e 0%, #08090A 70%);

/* Metallic accent (borders, highlights) */
--gradient-metallic: linear-gradient(135deg, #C9A962 0%, #8B7355 50%, #C9A962 100%);

/* Subtle surface gradient */
--gradient-surface: linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%);
```

## 3) Tipografia

### Font stack
- **Primary:** Inter (versatil, moderna, excelente legibilidade)
- **Display (titulos hero):** Sora ou Outfit (mais personalidade)
- **Mono (dados tecnicos):** JetBrains Mono

### Escala
```css
--text-xs: 0.75rem;    /* 12px - labels, captions */
--text-sm: 0.875rem;   /* 14px - body small, table */
--text-base: 1rem;     /* 16px - body */
--text-lg: 1.125rem;   /* 18px - lead text */
--text-xl: 1.25rem;    /* 20px - section titles */
--text-2xl: 1.5rem;    /* 24px - card titles */
--text-3xl: 2rem;      /* 32px - page titles */
--text-4xl: 2.5rem;    /* 40px - hero */
--text-5xl: 3.5rem;    /* 56px - hero display */
```

### Tratamento
- Titulos: weight 600-700, tracking -0.02em
- Body: weight 400-500, tracking normal
- Labels: weight 500, uppercase, tracking 0.05em
- Numeros/valores: tabular-nums, peso 600

## 4) Efeitos e profundidade

### Glassmorphism (uso controlado)
```css
/* Para modals, dropdowns, tooltips */
.glass {
  background: rgba(18, 20, 22, 0.80);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.06);
}

/* Variante mais sutil para hover states */
.glass-subtle {
  background: rgba(255,255,255,0.03);
  backdrop-filter: blur(8px);
}
```

### Shadows com profundidade
```css
/* Elevation system */
--shadow-sm: 0 1px 2px rgba(0,0,0,0.4);
--shadow-md: 0 4px 12px rgba(0,0,0,0.5);
--shadow-lg: 0 8px 24px rgba(0,0,0,0.6);
--shadow-xl: 0 16px 48px rgba(0,0,0,0.7);

/* Glow para elementos primarios (CTAs, focus) */
--shadow-glow-primary: 0 0 20px var(--primary-glow), 0 4px 12px rgba(0,0,0,0.4);
--shadow-glow-accent: 0 0 20px var(--accent-glow), 0 4px 12px rgba(0,0,0,0.4);
```

### Border radius
```css
--radius-sm: 6px;   /* Badges, small buttons */
--radius-md: 10px;  /* Buttons, inputs */
--radius-lg: 14px;  /* Cards */
--radius-xl: 20px;  /* Modals, large cards */
```

## 5) Componentes

### Buttons

**Primary (CTA principal)**
```css
.btn-primary {
  background: var(--primary);
  color: #0D0E10;
  font-weight: 600;
  box-shadow: var(--shadow-md);
  transition: all 0.2s ease;
}
.btn-primary:hover {
  background: var(--primary-hover);
  box-shadow: var(--shadow-glow-primary);
  transform: translateY(-1px);
}
```

**Secondary (outline metalico)**
```css
.btn-secondary {
  background: transparent;
  border: 1px solid rgba(201,169,98,0.4);
  color: var(--primary);
}
.btn-secondary:hover {
  background: rgba(201,169,98,0.08);
  border-color: var(--primary);
}
```

**Ghost**
```css
.btn-ghost {
  background: transparent;
  color: var(--foreground-muted);
}
.btn-ghost:hover {
  background: rgba(255,255,255,0.05);
  color: var(--foreground);
}
```

### Cards

**Standard card**
```css
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  /* Sutil gradient no topo */
  background-image: var(--gradient-surface);
}
.card:hover {
  border-color: rgba(255,255,255,0.12);
  box-shadow: var(--shadow-md);
}
```

**Feature card (destaque)**
```css
.card-feature {
  background: var(--surface);
  border: 1px solid transparent;
  background-image:
    linear-gradient(var(--surface), var(--surface)),
    var(--gradient-metallic);
  background-origin: border-box;
  background-clip: padding-box, border-box;
}
```

**Glass card (modals, floating)**
```css
.card-glass {
  background: rgba(18, 20, 22, 0.85);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: var(--shadow-xl);
}
```

### Inputs

```css
.input {
  background: var(--background-subtle);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--foreground);
  transition: all 0.15s ease;
}
.input:hover {
  border-color: rgba(255,255,255,0.12);
}
.input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-glow);
  outline: none;
}
```

### Badges

**Status badges com icone**
```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: 500;
}

.badge-success {
  background: var(--success-bg);
  color: var(--success-text);
  border: 1px solid var(--success-border);
}

.badge-warning {
  background: var(--warning-bg);
  color: var(--warning-text);
  border: 1px solid var(--warning-border);
}

.badge-danger {
  background: var(--danger-bg);
  color: var(--danger-text);
  border: 1px solid var(--danger-border);
}
```

### Table

```css
.table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.table th {
  font-size: var(--text-xs);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--foreground-muted);
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
}

.table td {
  padding: 16px;
  border-bottom: 1px solid var(--border-subtle);
}

.table tr:hover td {
  background: rgba(255,255,255,0.02);
}
```

## 6) Motion e animacoes

### Principios
- Animacoes rapidas e responsivas (150-300ms)
- Easing natural (ease-out para entrada, ease-in para saida)
- Stagger em listas (20-40ms delay entre items)
- Spring physics para interacoes de drag/resize

### Transicoes base
```css
--transition-fast: 150ms ease-out;
--transition-base: 200ms ease-out;
--transition-slow: 300ms ease-out;
--transition-spring: 400ms cubic-bezier(0.34, 1.56, 0.64, 1);
```

### Animacoes de entrada
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

### Hover states
- Buttons: lift sutil (translateY -1px) + glow
- Cards: border brighten + shadow increase
- Links: color transition + underline animation
- Icons: scale 1.05 + color

## 7) Background e elementos decorativos

### Grid pattern (ultra sutil)
```css
.bg-grid {
  background-image:
    linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
  background-size: 64px 64px;
}
```

### Gradient mesh (hero sections)
```css
.bg-hero {
  background:
    radial-gradient(ellipse 80% 50% at 50% -20%, rgba(201,169,98,0.08), transparent),
    radial-gradient(ellipse 60% 40% at 80% 50%, rgba(56,189,248,0.04), transparent),
    var(--background);
}
```

### Noise texture (opcional, 2-3% opacity)
- Adiciona textura organica ao fundo
- Usar SVG noise ou imagem otimizada

### Vignette
```css
.bg-vignette {
  box-shadow: inset 0 0 150px 50px rgba(0,0,0,0.3);
}
```

## 8) Layout por pagina

### Home / Landing
- Hero: titulo grande (text-5xl) + subtitulo tech + CTA primary com glow
- Gradient mesh no background do hero
- KPI strip: 3-4 cards com numeros em destaque (font mono, peso bold)
- Cards de acao: border gradient metallic, hover com lift
- Footer discreto com status de servicos

### Login
- Card centralizado com glass effect
- Input com focus glow
- CTA primary como unico elemento de cor forte
- Microtexto tech abaixo ("Secured with HMAC-256")

### Dashboard / Lista
- Header: titulo + badge de ambiente (demo/prod) + CTA
- KPI strip horizontal com mini-sparklines (opcional)
- Tabela com hover states, sorting indicators
- Empty state: ilustracao sutil + CTA

### Formulario (Nova transacao)
- Layout 2 colunas (form + resumo)
- Cards bem definidos com headers
- Resumo em tempo real no card lateral
- CTA no footer do card principal
- Validacao inline com cores semanticas

### Detalhe
- Header: ID (mono font) + badge status + acoes
- Grid de cards com informacoes
- Timeline de eventos (audit trail)
- Lateral com risk indicators (quando houver)

## 9) Identidade e branding

### Logo / Monograma
- "PG" em peso bold, tracking negativo
- Versao com acento metalico (gradiente na borda)
- Uso em: header, empty states, loading

### Taglines tecnicas (uso pontual)
- "Event-driven settlement"
- "Real-time fraud analysis"
- "Secure by default"

### Elementos de assinatura
- Linha metalica (1px) ao lado de headings principais
- Dot indicators com glow para status
- Corner accents em cards de destaque

## 10) Responsividade

### Breakpoints
```css
--screen-sm: 640px;
--screen-md: 768px;
--screen-lg: 1024px;
--screen-xl: 1280px;
--screen-2xl: 1536px;
```

### Adaptacoes mobile
- Cards empilhados verticalmente
- Tabela vira lista de cards
- KPI strip: 2x2 grid ou carousel
- Menu hamburger com drawer glass
- Touch targets minimo 44px

## 11) Checklist de implementacao

### Fase 1: Foundation
- [ ] Configurar tokens no Tailwind config
- [ ] Atualizar globals.css com variaveis
- [ ] Importar fontes (Inter, Sora, JetBrains Mono)
- [ ] Criar utilitarios de glass e glow

### Fase 2: Componentes base
- [ ] Button (primary, secondary, ghost)
- [ ] Input, Textarea, Select
- [ ] Card (standard, feature, glass)
- [ ] Badge (status variants)
- [ ] Table
- [ ] Modal/Dialog (glass)

### Fase 3: Layout
- [ ] Header com logo e nav
- [ ] Container e spacing system
- [ ] KPI Strip component
- [ ] Empty states

### Fase 4: Paginas
- [ ] Home/Landing
- [ ] Login
- [ ] Dashboard/Lista
- [ ] Formulario
- [ ] Detalhe

### Fase 5: Polish
- [ ] Animacoes de entrada
- [ ] Hover states refinados
- [ ] Loading states
- [ ] Responsive adjustments
- [ ] QA de contraste e acessibilidade

## 12) Referencias visuais

### Inspiracoes (combinar elementos de):
- **Linear.app** - motion design, glassmorphism elegante
- **Vercel** - tipografia, dark mode execution
- **Stripe Dashboard** - densidade de informacao, profissionalismo
- **Raycast** - command palette, micro-interacoes
- **C6 Bank** - premium black base, confianca

### Evitar
- Neon/cyberpunk extremo
- Gradientes rainbow
- Excesso de animacao
- Glass em tudo (usar com moderacao)
- Cores muito saturadas
