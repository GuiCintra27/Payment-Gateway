ALTER TABLE accounts
ADD COLUMN IF NOT EXISTS api_key_key_id varchar(20) NOT NULL DEFAULT 'v1';

CREATE TABLE IF NOT EXISTS invoice_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  event_type varchar(50) NOT NULL,
  from_status varchar(20),
  to_status varchar(20),
  metadata jsonb,
  request_id varchar(100),
  created_at timestamp NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoice_events_invoice_id
  ON invoice_events (invoice_id);

CREATE INDEX IF NOT EXISTS idx_invoice_events_created_at
  ON invoice_events (created_at);
