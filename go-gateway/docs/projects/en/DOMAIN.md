# Domain

[PT-BR](../DOMAIN.md) | **EN**

## Transfer Status

- `pending`
- `approved`
- `rejected`

## Main Rules

1. On transfer creation, gateway validates payload.
2. If `amount > 10000`:
   - initial status is `pending`.
   - `pending_transactions` event is sent to Kafka.
3. If `amount <= 10000`:
   - status is approved or rejected locally.
   - random decision with 70% approval.
4. When anti-fraud returns result:
   - status can only be updated if transfer is `pending`.
   - if approved, account balance is updated.

## Idempotency and Deduplication

- Result events have `event_id`.
- Gateway ignores duplicates using `processed_events`.
