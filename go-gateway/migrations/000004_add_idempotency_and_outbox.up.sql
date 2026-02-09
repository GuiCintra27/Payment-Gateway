CREATE TABLE IF NOT EXISTS idempotency_keys (
  id UUID PRIMARY KEY,
  key VARCHAR(255) NOT NULL,
  endpoint VARCHAR(255) NOT NULL,
  request_hash VARCHAR(64) NOT NULL,
  response_body JSONB,
  status_code INT,
  status VARCHAR(20) NOT NULL DEFAULT 'processing',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idempotency_keys_key_endpoint_idx
  ON idempotency_keys (key, endpoint);

CREATE TABLE IF NOT EXISTS outbox_events (
  id UUID PRIMARY KEY,
  aggregate_id VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  attempts INT NOT NULL DEFAULT 0,
  next_attempt_at TIMESTAMP NOT NULL DEFAULT NOW(),
  correlation_id VARCHAR(100),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS outbox_events_status_idx
  ON outbox_events (status, next_attempt_at);

CREATE EXTENSION IF NOT EXISTS pgcrypto;
