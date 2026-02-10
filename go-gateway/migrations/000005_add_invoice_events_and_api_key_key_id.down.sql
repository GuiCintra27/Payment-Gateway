DROP TABLE IF EXISTS invoice_events;

ALTER TABLE accounts
DROP COLUMN IF EXISTS api_key_key_id;
