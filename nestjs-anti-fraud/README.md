# NestJS Antifraude

[**PT-BR**](./README.md) | [EN](./docs/projects/en/INDEX.md)

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
- Service docs (EN): `nestjs-anti-fraud/docs/projects/en/INDEX.md`
- Indice do projeto: `docs/projects/INDEX.md`
