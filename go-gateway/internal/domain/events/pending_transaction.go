package events

import (
	"time"

	"github.com/google/uuid"
)

type PendingTransaction struct {
	SchemaVersion int       `json:"schema_version"`
	EventID       string    `json:"event_id"`
	AccountID     string    `json:"account_id"`
	InvoiceID     string    `json:"invoice_id"`
	Amount        float64   `json:"amount"`
	AmountCents   int64     `json:"amount_cents"`
	OccurredAt    time.Time `json:"occurred_at"`
}

func NewPendingTransaction(accountID, invoiceID string, amount float64, amountCents int64) *PendingTransaction {
	return &PendingTransaction{
		SchemaVersion: 2,
		EventID:       uuid.NewString(),
		AccountID:     accountID,
		InvoiceID:     invoiceID,
		Amount:        amount,
		AmountCents:   amountCents,
		OccurredAt:    time.Now(),
	}
}
