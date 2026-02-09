package events

import (
	"time"

	"github.com/GuiCintra27/payment-gateway/go-gateway/internal/domain"
	"github.com/google/uuid"
)

type TransactionResult struct {
	SchemaVersion int       `json:"schema_version"`
	EventID       string    `json:"event_id"`
	InvoiceID     string    `json:"invoice_id"`
	Status        string    `json:"status"`
	OccurredAt    time.Time `json:"occurred_at"`
}

func NewTransactionResult(invoiceID string, status string) *TransactionResult {
	return &TransactionResult{
		SchemaVersion: 2,
		EventID:       uuid.NewString(),
		InvoiceID:     invoiceID,
		Status:        status,
		OccurredAt:    time.Now(),
	}
}

func (t *TransactionResult) ToDomainStatus() domain.Status {
	return domain.Status(t.Status)
}
