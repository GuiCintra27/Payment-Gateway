# Next Frontend

Interface web para onboarding, login por API key, gerenciamento de transferencias e visualizacao de timeline.

## Como rodar

Na raiz do repositorio:

```bash
./start-dev.sh
```

Somente frontend:

```bash
cd next-frontend
cp .env.example .env.local
npm install
npm run dev
```

## Rotas principais

- `/`
- `/login`
- `/welcome`
- `/invoices`
- `/invoices/create`
- `/invoices/[id]`

## Documentacao

- Indice do servico: `next-frontend/docs/projects/INDEX.md`
- Indice do projeto: `docs/projects/INDEX.md`
