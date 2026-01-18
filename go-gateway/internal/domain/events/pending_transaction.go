package events

import (
	"time"

	"github.com/google/uuid"
)

type PendingTransaction struct {
	EventID    string    `json:"event_id"`
	AccountID  string    `json:"account_id"`
	InvoiceID  string    `json:"invoice_id"`
	Amount     float64   `json:"amount"`
	OccurredAt time.Time `json:"occurred_at"`
}

func NewPendingTransaction(accountID, invoiceID string, amount float64) *PendingTransaction {
	return &PendingTransaction{
		EventID:    uuid.NewString(),
		AccountID:  accountID,
		InvoiceID:  invoiceID,
		Amount:     amount,
		OccurredAt: time.Now(),
	}
}
