# Revisao de Seguranca — Payment Gateway

Data: 2026-02-12

## Resumo executivo

O projeto ja possui bases de seguranca adequadas para um demo tecnico (API key com HMAC, rate limit, deduplicacao, headers de seguranca, CVV nao persistido). Ainda assim, havia dois pontos praticos de endurecimento que valia aplicar agora sem aumentar a complexidade: cookies de sessao com flag `secure` em producao e rate limit para endpoints publicos (`/accounts` e `/demo`) usando IP quando nao ha API key.

## Pontos fortes observados

- Autenticacao por API key com HMAC e rotacao via `API_KEY_SECRETS`.
- `CVV` nao persistido; apenas ultimos 4 digitos do cartao.
- Rate limit por API key (com burst configuravel).
- Headers de seguranca basicos no gateway (`X-Frame-Options`, `nosniff`, `Referrer-Policy`).
- Idempotencia e deduplicacao para evitar reprocessamento.

## Melhorias aplicadas nesta revisao

### 1) Cookies httpOnly com `secure` em producao

**Motivo:** evitar envio do cookie em conexoes HTTP nao seguras quando rodando em ambiente real.

**Mudancas:**
- `next-frontend/src/app/actions/auth-actions.ts`
- `next-frontend/src/app/actions/account-actions.ts`

**Detalhe:** `secure` agora depende de `NODE_ENV === "production"`, mantendo compatibilidade local. Adicionado `path: "/"`.

### 2) Rate limit em endpoints publicos por IP

**Motivo:** reduzir abuso em `/accounts` e `/demo`, que sao publicos e podem ser atacados por automacao.

**Mudancas:**
- `go-gateway/internal/web/middleware/rate_limit.go`: fallback para IP quando `X-API-KEY` nao existe.
- `go-gateway/internal/web/server/server.go`: aplica rate limit nos endpoints publicos.

## Riscos remanescentes e recomendacoes (nao implementado agora)

- **TLS/HTTPS:** o gateway nao termina TLS. Em producao, deve ficar atras de proxy com TLS.
- **CSP para a UI:** nao configurado no frontend. Pode ser adicionado depois.
- **Protecao adicional de metrics:** endpoints `/metrics` estao abertos (ok em demo, mas em prod devem ser restritos).
- **Logs persistentes sensiveis:** garantir que `X-API-KEY` nunca apareca em logs (hoje nao aparece).

## Validacao rapida sugerida

1. Login e criacao de conta continuam funcionando (cookies ok no ambiente local).
2. `POST /accounts` e `POST /demo` agora recebem `rate_limited` em abuso por IP.

## Conclusao

As mudancas aplicadas foram pequenas e profissionais, focadas em reduzir risco sem aumentar complexidade. Para um projeto de portfolio, a postura de seguranca esta alinhada ao nivel esperado, com gaps documentados para um eventual hardening de producao.
