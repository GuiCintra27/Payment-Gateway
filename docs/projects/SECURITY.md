# Segurança

[**PT-BR**](./SECURITY.md) | [EN](./en/SECURITY.md)

## API key

- A API key e gerada no gateway com `crypto/rand`.
- No banco do gateway, a chave e armazenada como HMAC-SHA256.
- Segredos são definidos via `API_KEY_SECRETS` (ex.: `v1:secret1,v2:secret2`).
- `API_KEY_ACTIVE_KEY_ID` indica o segredo usado para novas chaves.
- Em setups simples, `API_KEY_SECRET` ainda funciona como `v1`.
- Sem segredo configurado, o gateway falha, exceto quando `ENV=dev`/`APP_ENV=dev`.

## Rate limit

- Rate limit por API key no gateway.
- Configuração via `API_RATE_LIMIT_PER_MINUTE` e `API_RATE_LIMIT_BURST`.

## CORS e headers

- CORS restrito via `CORS_ALLOWED_ORIGINS`.
- Headers de segurança no gateway: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`.

## Cookies (frontend)

- `apiKey`: cookie httpOnly para autenticação.
- `apiKeyPreview`: cookie temporario para exibir a chave apenas uma vez.

## Dados sensiveis

- O gateway não persiste número completo do cartão nem CVV.
- Apenas os últimos 4 digitos são armazenados em `card_last_digits`.

## Recomendações

- Gere segredos fortes e mantenha `API_KEY_ACTIVE_KEY_ID` sincronizado.
- Mantenha `.env` fora do controle de versão.
