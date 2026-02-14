# Banco de dados

## accounts

- `id` (uuid, pk)
- `name`
- `email` (unique)
- `api_key` (unique, HMAC hash)
- `api_key_key_id`
- `balance_cents`
- `created_at`, `updated_at`

## invoices

- `id` (uuid, pk)
- `account_id` (fk)
- `amount_cents`
- `status`
- `description`
- `payment_type`
- `card_last_digits`
- `created_at`, `updated_at`

## processed_events

- `event_id` (uuid, pk)
- `invoice_id`
- `processed_at`

## invoice_events

- `id` (uuid, pk)
- `invoice_id`
- `event_type`
- `from_status`, `to_status`
- `metadata`
- `request_id`
- `created_at`

## idempotency_keys

- `id` (uuid, pk)
- `key` (unique com `endpoint`)
- `endpoint`
- `request_hash`
- `response_body`
- `status_code`
- `status`
- `created_at`, `updated_at`, `expires_at`

## outbox_events

- `id` (uuid, pk)
- `aggregate_id` (invoice_id)
- `type`
- `payload`
- `status` (pending/processing/sent/failed)
- `attempts`, `next_attempt_at`
- `correlation_id`
- `created_at`, `updated_at`

## Migrations

- `000001_create_accounts_table.up.sql`
- `000002_create_processed_events.up.sql`
- `000003_convert_money_to_cents.up.sql`
- `000004_add_idempotency_and_outbox.up.sql`
- `000005_add_invoice_events_and_api_key_key_id.up.sql`
