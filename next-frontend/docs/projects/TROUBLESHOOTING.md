# Resolucao de problemas

[**PT-BR**](./TROUBLESHOOTING.md) | [EN](./en/TROUBLESHOOTING.md)

## API base URL errado

- Verifique `API_BASE_URL` em `.env.local`.
- Default: `http://localhost:8080`.

## Loop de redirect para /login

- Cookie `apiKey` ausente ou expirado.
- Faca login novamente ou entre em modo demo.

## Erros de hidratacao

- Limpe cache do navegador.
- Verifique se extensoes não estão modificando o HTML.

## Falha ao criar transferência

- Verifique se o gateway esta ativo.
- Confira logs do `createInvoiceAction`.

## Transação fica pendente para sempre

- O worker Kafka do antifraude pode não estar rodando.
- Rode `START_ANTIFRAUD_WORKER=true ./start-dev.sh` ou `npm run start:kafka:dev` em `nestjs-anti-fraud`.
- No Docker, verifique `docker compose logs -f nestjs-worker` e `http://localhost:3101/metrics`.
