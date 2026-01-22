# Security

## API key

- A API key e gerada no gateway com `crypto/rand`.
- No banco do gateway, a chave e armazenada como HMAC-SHA256.
- O segredo e definido em `API_KEY_SECRET` (arquivo `.env`).
- Sem `API_KEY_SECRET`, o gateway falha, exceto quando `ENV=dev`/`APP_ENV=dev`.

## Rate limit

- Rate limit por API key no gateway.
- Configuracao via `API_RATE_LIMIT_PER_MINUTE` e `API_RATE_LIMIT_BURST`.

## Cookies (frontend)

- `apiKey`: cookie httpOnly para autenticacao.
- `apiKeyPreview`: cookie temporario para exibir a chave apenas uma vez.

## Dados sensiveis

- O gateway nao persiste numero completo do cartao nem CVV.
- Apenas os ultimos 4 digitos sao armazenados em `card_last_digits`.

## Recomendacoes

- Gere um `API_KEY_SECRET` forte em ambientes nao locais.
- Mantenha `.env` fora do controle de versao.
