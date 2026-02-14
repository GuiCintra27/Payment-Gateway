# Sessão de autenticação

[**PT-BR**](./AUTH-SESSION.md) | [EN](./en/AUTH-SESSION.md)

## Cookies

- `apiKey`: usado para autenticar requests no gateway.
- `apiKeyPreview`: usado para exibir a chave uma única vez.

## Middleware

O middleware do Next redireciona rotas `/invoices/*` para `/login` quando não ha `apiKey`.

## Server Actions

As actions leem `apiKey` via `cookies()` e enviam no header `X-API-KEY`.
