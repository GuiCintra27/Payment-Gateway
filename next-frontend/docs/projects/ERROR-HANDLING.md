# Tratamento de erros

[**PT-BR**](./ERROR-HANDLING.md) | [EN](./en/ERROR-HANDLING.md)

## Home (`/`)

Query params usados:

- `?error=account_create_failed`
- `?error=demo_unavailable`

## Login (`/login`)

- `?error=invalid_api_key`

## Criar transferência (`/invoices/create`)

- `?error=invalid_expiry`
- `?error=validation_error`
- `?error=invoice_create_failed`

## Origem dos erros

- Falhas no gateway geram redirect com query param.
- Mensagens são convertidas em alertas no topo da página.
