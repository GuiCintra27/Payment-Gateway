package repository

import (
	"context"
	"database/sql"
	"time"
)

type IdempotencyKey struct {
	ID           string
	Key          string
	Endpoint     string
	RequestHash  string
	ResponseBody []byte
	StatusCode   int
	Status       string
	ExpiresAt    time.Time
}

type IdempotencyRepository struct {
	db *sql.DB
}

func NewIdempotencyRepository(db *sql.DB) *IdempotencyRepository {
	return &IdempotencyRepository{db: db}
}

func (r *IdempotencyRepository) Get(ctx context.Context, key, endpoint string) (*IdempotencyKey, error) {
	var item IdempotencyKey
	row := r.db.QueryRowContext(ctx, `
		SELECT id, key, endpoint, request_hash, response_body, status_code, status, expires_at
		FROM idempotency_keys
		WHERE key = $1 AND endpoint = $2
	`, key, endpoint)

	err := row.Scan(
		&item.ID,
		&item.Key,
		&item.Endpoint,
		&item.RequestHash,
		&item.ResponseBody,
		&item.StatusCode,
		&item.Status,
		&item.ExpiresAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *IdempotencyRepository) CreateProcessing(ctx context.Context, key, endpoint, requestHash string, expiresAt time.Time) (bool, error) {
	result, err := r.db.ExecContext(ctx, `
		INSERT INTO idempotency_keys (id, key, endpoint, request_hash, status, expires_at, created_at, updated_at)
		VALUES (gen_random_uuid(), $1, $2, $3, 'processing', $4, NOW(), NOW())
		ON CONFLICT (key, endpoint) DO NOTHING
	`, key, endpoint, requestHash, expiresAt)
	if err != nil {
		return false, err
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return false, err
	}
	return rows > 0, nil
}

func (r *IdempotencyRepository) UpdateResponse(ctx context.Context, key, endpoint string, statusCode int, responseBody []byte) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE idempotency_keys
		SET status = 'completed', status_code = $1, response_body = $2, updated_at = NOW()
		WHERE key = $3 AND endpoint = $4
	`, statusCode, responseBody, key, endpoint)
	return err
}

func (r *IdempotencyRepository) Delete(ctx context.Context, key, endpoint string) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM idempotency_keys WHERE key = $1 AND endpoint = $2`, key, endpoint)
	return err
}

func (r *IdempotencyRepository) DeleteExpired(ctx context.Context) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM idempotency_keys WHERE expires_at < NOW()`)
	return err
}
