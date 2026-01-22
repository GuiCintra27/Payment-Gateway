# Payment Gateway — Bugs/Correções (guia) - 2026/01/22

Olhei o ZIP novo e foquei em **bugs comprováveis só pelo código** (e, principalmente, nos pontos que eu tinha apontado antes).

## ✅ Correções que você fez (confirmadas no código)

### 1) **Saldo não atualizava no fluxo assíncrono (hash do hash)**

Você corrigiu do jeito certo:

- Criou `UpdateBalanceByAccountID(accountID, amount)` no `AccountService`
- E passou a usar **accountID** (não API key) nos dois lugares críticos:
  - `InvoiceService.Create()` (quando `approved`)
  - `InvoiceService.ProcessTransactionResult()` (quando resultado do antifraude é `approved`)

Isso elimina o bug original de “pegar api_key hash do banco e depois hashear de novo”.

Arquivos:

- `go-gateway/internal/service/account_service.go`
- `go-gateway/internal/service/invoice_service.go`

### 2) **Publicar evento antes de persistir invoice**

Agora você **salva a invoice primeiro** e **só depois** publica no Kafka (pending) / atualiza saldo (approved). Isso remove o cenário “evento referenciando invoice inexistente”.

Arquivo:

- `go-gateway/internal/service/invoice_service.go` (`Create()`)

---

# ⚠️ Bugs/problemas **comprovados** que ainda existem (por inspeção)

Abaixo não é “melhoria”, é coisa que **pode dar errado de forma determinística** conforme o próprio código.

## 1) Random de aprovação pode repetir **idêntico** no mesmo segundo

Em `Invoice.Process()` você cria um rand novo com seed `time.Now().Unix()` (segundos):

- Se duas invoices forem processadas **dentro do mesmo segundo**, o seed é igual → o primeiro `Float64()` tende a sair igual → decisões iguais.

Arquivo:

- `go-gateway/internal/domain/invoice.go`

**Correção simples:** usar `UnixNano()` ou (melhor) seed global uma vez e reutilizar.

---

## 2) `crypto/rand.Read` ignorando erro ao gerar API key

Em `generateAPIKey()` você faz:

- `rand.Read(b)` **sem checar erro**

Se `rand.Read` falhar (ou ler parcial), você pode gerar chave fraca/zerada sem perceber.

Arquivo:

- `go-gateway/internal/domain/account.go`

**Correção simples:** checar `(n, err)` e garantir `n == len(b)` (ou falhar explicitamente).

---

## 3) “Money as float” é bug de precisão (gateway)

Você usa `float64` pra valor e saldo (`Amount`, `Balance`, `AddBalance` e `UPDATE balance = balance + $1`).

Isso **pode** gerar erro de centavos (IEEE 754 é impreciso). É um bug real em domínio financeiro.

Arquivos (exemplos):

- `go-gateway/internal/domain/account.go`
- `go-gateway/internal/domain/invoice.go`
- `go-gateway/internal/repository/account_repository.go`

**Correção padrão:** armazenar centavos como `int64` (ex.: `amount_cents`).

---

## 4) Hash de API key cai pra `dev_secret` se env não existir

`HashAPIKey()` usa `"dev_secret"` se `API_KEY_SECRET` não estiver setado.

Isso é **falha de segurança comprovada**: se alguém roda sem env (muito comum), todas as chaves ficam “protegidas” por um segredo público/conhecido.

Arquivo:

- `go-gateway/internal/security/apikey.go`

**Correção:** em produção, falhar se não tiver secret (ou exigir `ENV=dev` pra permitir fallback).

---

# O que eu **não consigo** “garantir” daqui

Eu não consegui rodar build/testes automatizados porque o ambiente aqui não baixa dependências externas (Go modules / npm). Então:

- Eu validei **por leitura** e por consistência do fluxo.
- Pra “garantir que não há mais bugs” no sistema todo, só rodando testes/e2e/local stack.

Se você quiser, eu te passo um checklist bem direto de comandos (no seu ambiente) pra você rodar e a gente analisar os outputs juntos (Go + Nest + Next + Kafka + Postgres) — sem inventar bug, só o que falhar de fato.
