# Server Actions

[PT-BR](../SERVER-ACTIONS.md) | **EN**

## account-actions.ts

- `createAccountAction`: creates account via `POST /accounts`, stores cookies, and redirects to `/welcome`.
- `createDemoAccountAction`: creates demo account via `POST /demo`, stores cookies, and redirects to `/welcome?mode=demo`.

## login/AuthForm.tsx

- `loginAction`: validates API key via `GET /accounts` and stores `apiKey` cookie.

## invoices/create/create-invoice-action.ts

- `createInvoiceAction`: sends `POST /invoice`, handles errors, and redirects.

## welcome/page.tsx

- `dismissPreviewAction`: removes `apiKeyPreview` and redirects to `/invoices`.
