package repository

import (
	"database/sql"

	"github.com/lib/pq"
)

type ProcessedEventRepository struct {
	db *sql.DB
}

func NewProcessedEventRepository(db *sql.DB) *ProcessedEventRepository {
	return &ProcessedEventRepository{db: db}
}

func (r *ProcessedEventRepository) Exists(eventID string) (bool, error) {
	var exists bool
	err := r.db.QueryRow(
		`SELECT EXISTS (SELECT 1 FROM processed_events WHERE event_id = $1)`,
		eventID,
	).Scan(&exists)
	if err != nil {
		return false, err
	}
	return exists, nil
}

func (r *ProcessedEventRepository) Save(eventID, invoiceID string) error {
	_, err := r.db.Exec(
		`INSERT INTO processed_events (event_id, invoice_id) VALUES ($1, $2)`,
		eventID,
		invoiceID,
	)
	if err != nil {
		if pqErr, ok := err.(*pq.Error); ok && pqErr.Code == "23505" {
			return nil
		}
		return err
	}
	return nil
}
