# Flows

[PT-BR](../FLOWS.md) | **EN**

## Create Account

1. UI sends `POST /accounts` with name and email.
2. Gateway creates account and returns `api_key`.
3. Frontend stores cookies and redirects to `/welcome`.

## Demo Mode

1. UI sends `POST /demo`.
2. Gateway creates a demo account plus 5 transfers with mixed statuses.
3. API key is shown only once in frontend.

## Create Transfer

1. UI sends `POST /invoice` with `X-API-KEY` and payment data.
2. Optional: `Idempotency-Key` prevents duplicates for the same payload.
3. Gateway validates payload, converts `amount` to cents, and creates transfer.
4. If `amount <= 10000`:
   - transfer is immediately approved/rejected locally (no async anti-fraud).
   - current criteria: random gateway decision (`~70% approved`, `~30% rejected`).
5. If `amount > 10000`:
   - transfer stays `pending`.
   - `pending_transactions` event is written to outbox.
   - outbox worker publishes to Kafka.

## Anti-fraud Analysis

1. Anti-fraud consumes `pending_transactions`.
2. Fraud rules are applied (specifications), in order:
   - `SUSPICIOUS_ACCOUNT`: reject if account is already flagged as suspicious.
   - `FREQUENT_HIGH_VALUE`: reject if recent invoice volume exceeds configured limit.
   - `UNUSUAL_PATTERN`: reject if current amount is above allowed variation over account average.
3. If no rule is triggered, approve.
4. Result is persisted in anti-fraud database.
5. `transactions_result` is published to Kafka.

## Status Update

1. Gateway consumes `transactions_result`.
2. Deduplicates by `event_id`.
3. Updates transfer status (DB transaction).
4. If approved, updates account balance.
5. Registers timeline event (`invoice_events`).
6. On failures, sends payload to `transactions_result_dlq`.
