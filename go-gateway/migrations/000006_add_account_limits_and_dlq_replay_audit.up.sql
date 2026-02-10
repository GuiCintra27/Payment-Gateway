CREATE TABLE IF NOT EXISTS account_limits (
    account_id UUID PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
    max_amount_per_tx_cents BIGINT NOT NULL DEFAULT 0,
    max_daily_volume_cents BIGINT NOT NULL DEFAULT 0,
    max_daily_transactions INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_account_limits_account_id ON account_limits(account_id);

CREATE TABLE IF NOT EXISTS dlq_replay_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id VARCHAR(255),
    invoice_id UUID,
    status VARCHAR(50),
    reason TEXT,
    replay_mode VARCHAR(20) NOT NULL,
    replayed_by VARCHAR(255),
    success BOOLEAN NOT NULL DEFAULT false,
    error TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dlq_replay_audits_event_id ON dlq_replay_audits(event_id);
CREATE INDEX IF NOT EXISTS idx_dlq_replay_audits_invoice_id ON dlq_replay_audits(invoice_id);
