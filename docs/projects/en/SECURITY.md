# Security

[PT-BR](../SECURITY.md) | **EN**

## API Key

- API keys are generated in the gateway using `crypto/rand`.
- In gateway DB, keys are stored as HMAC-SHA256 hashes.
- Secrets are configured through `API_KEY_SECRETS` (e.g. `v1:secret1,v2:secret2`).
- `API_KEY_ACTIVE_KEY_ID` defines the secret used for new keys.
- In simpler setups, `API_KEY_SECRET` still works as `v1`.
- Without configured secrets, gateway startup fails, except when `ENV=dev` or `APP_ENV=dev`.

## Rate Limiting

- API key-based rate limiting is enforced in the gateway.
- Configuration via `API_RATE_LIMIT_PER_MINUTE` and `API_RATE_LIMIT_BURST`.

## CORS and Headers

- CORS is restricted with `CORS_ALLOWED_ORIGINS`.
- Security headers in gateway: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`.

## Cookies (Frontend)

- `apiKey`: `httpOnly` cookie for authentication.
- `apiKeyPreview`: temporary cookie to show the key only once.

## Sensitive Data

- Gateway never persists full card number or CVV.
- Only the last 4 digits are stored in `card_last_digits`.

## Recommendations

- Use strong secrets and keep `API_KEY_ACTIVE_KEY_ID` synchronized.
- Keep `.env` files out of version control.
