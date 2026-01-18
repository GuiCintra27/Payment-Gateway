# Database

## accounts

- `id` (uuid, pk)
- `name`
- `email` (unique)
- `api_key` (unique, HMAC hash)
- `balance`
- `created_at`, `updated_at`

## invoices

- `id` (uuid, pk)
- `account_id` (fk)
- `amount`
- `status`
- `description`
- `payment_type`
- `card_last_digits`
- `created_at`, `updated_at`

## processed_events

- `event_id` (uuid, pk)
- `invoice_id`
- `processed_at`

## Migrations

- `000001_create_accounts_table.up.sql`
- `000002_create_processed_events.up.sql`
