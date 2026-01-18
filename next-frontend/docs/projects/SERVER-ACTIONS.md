# Server Actions

## account-actions.ts

- `createAccountAction`: cria conta via `POST /accounts`, grava cookies e redireciona para `/welcome`.
- `createDemoAccountAction`: cria conta demo via `POST /demo`, grava cookies e redireciona para `/welcome?mode=demo`.

## login/AuthForm.tsx

- `loginAction`: valida API key via `GET /accounts` e salva cookie `apiKey`.

## invoices/create/create-invoice-action.ts

- `createInvoiceAction`: envia `POST /invoice`, trata erros e redireciona.

## welcome/page.tsx

- `dismissPreviewAction`: remove `apiKeyPreview` e redireciona para `/invoices`.
