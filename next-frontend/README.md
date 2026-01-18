# Next Frontend

Interface web para onboarding, login via API key e gerenciamento de transferencias.

## Como rodar

### Via script (na raiz)

```bash
./start-dev.sh
```

### Local (infra no Docker)

```bash
cd next-frontend
cp .env.example .env.local

npm install
npm run dev
```

## Variaveis de ambiente

- `API_BASE_URL` (default: http://localhost:8080)

## Rotas principais

- `/` (criar conta + demo)
- `/login` (login com API key)
- `/welcome` (exibe API key uma unica vez)
- `/invoices` (lista)
- `/invoices/create` (criar transferencia)
- `/invoices/[id]` (detalhe)

## Documentacao

- `next-frontend/docs/projects/UI-FLOWS.md`
- `next-frontend/docs/projects/AUTH-SESSION.md`
- `next-frontend/docs/projects/SERVER-ACTIONS.md`
- `next-frontend/docs/projects/ERROR-HANDLING.md`
- `next-frontend/docs/projects/TROUBLESHOOTING.md`
