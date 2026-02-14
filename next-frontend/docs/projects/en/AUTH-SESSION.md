# Session and Authentication

[PT-BR](../AUTH-SESSION.md) | **EN**

## Cookies

- `apiKey`: used to authenticate requests in gateway.
- `apiKeyPreview`: used to show the key only once.

## Middleware

Next middleware redirects `/invoices/*` routes to `/login` when `apiKey` is missing.

## Server Actions

Actions read `apiKey` via `cookies()` and send it in `X-API-KEY` header.
