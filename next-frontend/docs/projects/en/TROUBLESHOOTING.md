# Troubleshooting

[PT-BR](../TROUBLESHOOTING.md) | **EN**

## Wrong API base URL

- Check `API_BASE_URL` in `.env.local`.
- Default: `http://localhost:8080`.

## Redirect loop to `/login`

- `apiKey` cookie is missing or expired.
- Login again or switch to demo mode.

## Hydration errors

- Clear browser cache.
- Verify extensions are not changing page HTML.

## Transfer creation fails

- Check if gateway is running.
- Inspect `createInvoiceAction` logs.

## Transfer remains pending forever

- Anti-fraud Kafka worker may not be running.
- Run `START_ANTIFRAUD_WORKER=true ./start-dev.sh` or `npm run start:kafka:dev` in `nestjs-anti-fraud`.
- In Docker, check `docker compose logs -f nestjs-worker` and `http://localhost:3101/metrics`.
