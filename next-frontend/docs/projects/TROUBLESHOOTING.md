# Troubleshooting

## API base URL errado

- Verifique `API_BASE_URL` em `.env.local`.
- Default: `http://localhost:8080`.

## Loop de redirect para /login

- Cookie `apiKey` ausente ou expirado.
- Faca login novamente ou entre em modo demo.

## Erros de hidratacao

- Limpe cache do navegador.
- Verifique se extensoes nao estao modificando o HTML.

## Falha ao criar transferencia

- Verifique se o gateway esta ativo.
- Confira logs do `createInvoiceAction`.
