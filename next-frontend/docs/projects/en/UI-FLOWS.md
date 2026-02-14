# UI Flows

[PT-BR](../UI-FLOWS.md) | **EN**

## Home (`/`)

- Form to create account (name + email).
- Button to enter demo mode.
- Link to login with existing API key.

## Login (`/login`)

- Simple API key form.
- Redirects to `/invoices` on success.

## Welcome (`/welcome`)

- Shows API key only once.
- Copy button and continue to list.

## Transfers list (`/invoices`)

- List with statuses and values.
- Details page at `/invoices/[id]`.
- Pagination through `page` and `size` query params.

## Create transfer (`/invoices/create`)

- Card form + transfer data.
- Sends request through Server Action to `POST /invoice`.
- Errors are shown at top.
