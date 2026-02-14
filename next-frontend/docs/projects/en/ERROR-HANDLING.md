# Error Handling

[PT-BR](../ERROR-HANDLING.md) | **EN**

## Home (`/`)

Used query params:

- `?error=account_create_failed`
- `?error=demo_unavailable`

## Login (`/login`)

- `?error=invalid_api_key`

## Create Transfer (`/invoices/create`)

- `?error=invalid_expiry`
- `?error=validation_error`
- `?error=invoice_create_failed`

## Error sources

- Gateway failures trigger redirects with query params.
- Messages are converted into alerts at top of page.
