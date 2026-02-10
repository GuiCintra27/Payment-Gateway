package repository

import (
	"database/sql"
	"time"
)

type DlqReplayAudit struct {
	EventID    string
	InvoiceID  string
	Status     string
	Reason     string
	Mode       string
	ReplayedBy string
	Success    bool
	Error      string
	CreatedAt  time.Time
}

// DlqReplayRepository persiste auditoria de replays da DLQ.
type DlqReplayRepository struct {
	db *sql.DB
}

func NewDlqReplayRepository(db *sql.DB) *DlqReplayRepository {
	return &DlqReplayRepository{db: db}
}

func (r *DlqReplayRepository) Save(audit DlqReplayAudit) error {
	_, err := r.db.Exec(`
		INSERT INTO dlq_replay_audits (event_id, invoice_id, status, reason, replay_mode, replayed_by, success, error, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`, audit.EventID, nullableUUID(audit.InvoiceID), audit.Status, audit.Reason, audit.Mode, audit.ReplayedBy, audit.Success, audit.Error, audit.CreatedAt)
	return err
}

func nullableUUID(value string) interface{} {
	if value == "" {
		return nil
	}
	return value
}
