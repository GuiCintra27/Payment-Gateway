# NestJS Antifraude

Serviço antifraude que consome eventos de pagamentos pendentes e publica o resultado das analises.

## Como rodar

Na raiz do repositorio:

```bash
./start-dev.sh
```

Modo local (infra via Docker):

```bash
docker compose -f docker-compose.infra.yaml up -d
cd nestjs-anti-fraud
cp .env.example .env.local
npm install
npx prisma migrate deploy
npm run start:dev
npm run start:kafka:dev
```

## Endpoints

- `GET /invoices`
- `GET /invoices/:id`
- `GET /metrics`
- `GET /metrics/prom`

## Documentação

- Indice do serviço: `nestjs-anti-fraud/docs/projects/INDEX.md`
- Indice do projeto: `docs/projects/INDEX.md`
