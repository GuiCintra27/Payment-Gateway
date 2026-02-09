package outbox

import (
	"context"
	"database/sql"
	"encoding/json"
	"log/slog"
	"time"

	"github.com/segmentio/kafka-go"
)

type Event struct {
	ID            string
	AggregateID   string
	Type          string
	Payload       []byte
	Status        string
	Attempts      int
	NextAttemptAt time.Time
	CorrelationID sql.NullString
}

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) ClaimPending(ctx context.Context, limit int) ([]Event, error) {
	if limit <= 0 {
		limit = 10
	}

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	rows, err := tx.QueryContext(ctx, `
		SELECT id, aggregate_id, type, payload, status, attempts, next_attempt_at, correlation_id
		FROM outbox_events
		WHERE status IN ('pending', 'failed') AND next_attempt_at <= NOW()
		ORDER BY created_at ASC
		LIMIT $1
		FOR UPDATE SKIP LOCKED
	`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var events []Event
	for rows.Next() {
		var ev Event
		if err := rows.Scan(&ev.ID, &ev.AggregateID, &ev.Type, &ev.Payload, &ev.Status, &ev.Attempts, &ev.NextAttemptAt, &ev.CorrelationID); err != nil {
			return nil, err
		}
		events = append(events, ev)
	}

	for _, ev := range events {
		_, err := tx.ExecContext(ctx, `
			UPDATE outbox_events
			SET status = 'processing', attempts = attempts + 1, updated_at = NOW()
			WHERE id = $1
		`, ev.ID)
		if err != nil {
			return nil, err
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return events, nil
}

func (r *Repository) MarkSent(ctx context.Context, id string) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE outbox_events
		SET status = 'sent', updated_at = NOW()
		WHERE id = $1
	`, id)
	return err
}

func (r *Repository) MarkFailed(ctx context.Context, id string, nextAttemptAt time.Time) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE outbox_events
		SET status = 'failed', next_attempt_at = $2, updated_at = NOW()
		WHERE id = $1
	`, id, nextAttemptAt)
	return err
}

type Worker struct {
	repo        *Repository
	writer      *kafka.Writer
	pollEvery   time.Duration
	batchSize   int
	maxAttempts int
}

func NewWorker(repo *Repository, writer *kafka.Writer, pollEvery time.Duration, batchSize int, maxAttempts int) *Worker {
	if pollEvery <= 0 {
		pollEvery = 500 * time.Millisecond
	}
	if batchSize <= 0 {
		batchSize = 10
	}
	if maxAttempts <= 0 {
		maxAttempts = 5
	}

	return &Worker{
		repo:        repo,
		writer:      writer,
		pollEvery:   pollEvery,
		batchSize:   batchSize,
		maxAttempts: maxAttempts,
	}
}

func (w *Worker) Start(ctx context.Context) {
	ticker := time.NewTicker(w.pollEvery)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			events, err := w.repo.ClaimPending(ctx, w.batchSize)
			if err != nil {
				slog.Error("outbox claim failed", "error", err)
				continue
			}
			for _, ev := range events {
				if err := w.publish(ctx, ev); err != nil {
					backoff := time.Duration(1<<min(ev.Attempts, w.maxAttempts)) * time.Second
					if backoff > 30*time.Second {
						backoff = 30 * time.Second
					}
					slog.Error("outbox publish failed", "error", err, "event_id", ev.ID)
					_ = w.repo.MarkFailed(ctx, ev.ID, time.Now().Add(backoff))
					continue
				}
				_ = w.repo.MarkSent(ctx, ev.ID)
			}
		}
	}
}

func (w *Worker) publish(ctx context.Context, ev Event) error {
	var headers []kafka.Header
	if ev.CorrelationID.Valid {
		headers = append(headers, kafka.Header{Key: "x-request-id", Value: []byte(ev.CorrelationID.String)})
	}

	msg := kafka.Message{
		Value:   ev.Payload,
		Headers: headers,
	}

	return w.writer.WriteMessages(ctx, msg)
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func EncodePayload(payload interface{}) ([]byte, error) {
	return json.Marshal(payload)
}
