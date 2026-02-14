# Tratamento de erros

## Home (`/`)

Query params usados:

- `?error=account_create_failed`
- `?error=demo_unavailable`

## Login (`/login`)

- `?error=invalid_api_key`

## Criar transferencia (`/invoices/create`)

- `?error=invalid_expiry`
- `?error=validation_error`
- `?error=invoice_create_failed`

## Origem dos erros

- Falhas no gateway geram redirect com query param.
- Mensagens sao convertidas em alertas no topo da pagina.
