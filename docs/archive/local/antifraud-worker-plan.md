# Plano - Worker antifraude separado (NestJS + Kafka)

Objetivo: mover o consumo Kafka do antifraude para um worker dedicado, mantendo o HTTP isolado. O fluxo deve continuar simples no dev, com opcao de iniciar o worker via `start-dev.sh`.

## 1) Arquitetura alvo

- **HTTP App** (NestJS):
  - Somente API/metrics.
  - Nao conecta microservice Kafka.
- **Worker Kafka** (NestJS microservice):
  - Processo separado.
  - Responsavel por consumir `pending_transactions` e publicar `transactions_result`.

Beneficios: isolamento de falhas, escalabilidade independente, fluxo assíncrono mais realista.

## 2) Mudancas no NestJS

### 2.1 main.ts (HTTP)

- Remover `connectMicroservice` e `startAllMicroservices`.
- Manter apenas `app.listen(...)`.

### 2.2 Kafka worker (cmd)

- Padronizar o bootstrap no `src/cmd/kafka.cmd.ts`:
  - Usar `KAFKA_BROKER` do `.env.local/.env`.
  - Log claro indicando que e o worker.

### 2.3 Scripts npm

- Adicionar script dedicado:
  - `start:kafka` -> `node dist/cmd/kafka.cmd.js` (prod)
  - `start:kafka:dev` -> `nest start --watch --entryFile cmd/kafka.cmd` (dev)
- Manter `start:dev` para HTTP apenas.

### 2.4 Observabilidade

- Log explicito ao iniciar worker e ao conectar no broker.
- Se necessario, expor metrics no worker (opcional).

## 3) start-dev.sh (root)

Adicionar suporte a worker antifraude:

- Flag `START_ANTIFRAUD_WORKER=true` (default: true para dev).
- Fluxo proposto:
  1. Inicia infra (Postgres + Kafka) como hoje.
  2. Inicia Go gateway.
  3. Inicia NestJS HTTP (`npm run start:dev`).
  4. Inicia NestJS Kafka worker (`npm run start:kafka:dev`).

Notas:

- Garantir que o worker seja finalizado no cleanup (PID separado).
- Se `START_ANTIFRAUD_WORKER=false`, nao inicia o worker.

## 4) Docker / Compose (opcional mas recomendado)

Separar serviços no compose:

- `nestjs-api` -> `npm run start`
- `nestjs-worker` -> `npm run start:kafka`

Ambos com o mesmo volume/codigo e env. Escala independente.

## 5) Documentação

Atualizar docs:

- `AGENTS.md` (explicar worker separado e flag).
- `README.md` (comando de dev + worker).
- `docs/projects/ARCHITECTURE.md` (diagrama/descricao do fluxo).
- `docs/projects/TROUBLESHOOTING.md` (se worker nao subir).

## 6) Checklist de validacao

- Criar transacao > 10k:
  - Gateway publica `pending_transactions`.
  - Worker consome e publica `transactions_result`.
  - Gateway atualiza status e saldo.
- Derrubar worker e confirmar que HTTP continua de pe.
- Subir worker novamente e verificar processamento pendente.

## 7) Sequencia sugerida

1. Ajustar scripts npm no `nestjs-anti-fraud/package.json`.
2. Atualizar `main.ts` e `cmd/kafka.cmd.ts`.
3. Ajustar `start-dev.sh` com flag e cleanup.
4. Atualizar docs.
5. Validar fluxo end-to-end.
