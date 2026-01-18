CREATE TABLE IF NOT EXISTS processed_events (
    event_id UUID PRIMARY KEY,
    invoice_id UUID NOT NULL,
    processed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_processed_events_invoice_id ON processed_events(invoice_id);
