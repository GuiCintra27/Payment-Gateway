# Modelo de dados

[**PT-BR**](./DATA-MODEL.md) | [EN](./en/DATA-MODEL.md)

## Gateway (Postgres)

### accounts

- `id` (uuid, pk)
- `name` (varchar)
- `email` (unique)
- `api_key` (unique, HMAC hash)
- `api_key_key_id` (varchar)
- `balance_cents` (bigint)
- `created_at`, `updated_at`

Indexes:

- `idx_accounts_api_key`
- `idx_accounts_email`

### invoices

- `id` (uuid, pk)
- `account_id` (fk -> accounts.id)
- `amount_cents` (bigint)
- `status` (pending | approved | rejected)
- `description` (text)
- `payment_type` (credit_card | boleto)
- `card_last_digits` (varchar(4))
- `created_at`, `updated_at`

Indexes:

- `idx_invoices_account_id`
- `idx_invoices_status`
- `idx_invoices_created_at`

### processed_events

- `event_id` (uuid, pk)
- `invoice_id` (uuid)
- `processed_at`

Indexes:

- `idx_processed_events_invoice_id`

### invoice_events

- `id` (uuid, pk)
- `invoice_id` (uuid)
- `event_type` (varchar)
- `from_status`, `to_status` (nullable)
- `metadata` (jsonb)
- `request_id` (nullable)
- `created_at`

Indexes:

- `idx_invoice_events_invoice_id`
- `idx_invoice_events_created_at`

## Antifraude (Postgres via Prisma)

### Account

- `id` (string, pk)
- `isSuspicious` (boolean)
- `createdAt`, `updatedAt`

### Invoice

- `id` (string, pk)
- `accountId` (fk -> Account.id)
- `amount` (float)
- `status` (APPROVED | REJECTED)
- `createdAt`, `updatedAt`
- `fraudHistory` (optional)

### FraudHistory

- `id` (uuid, pk)
- `invoiceId` (unique)
- `reason` (SUSPICIOUS_ACCOUNT | UNUSUAL_PATTERN | FREQUENT_HIGH_VALUE)
- `description` (optional)
- `createdAt`, `updatedAt`
