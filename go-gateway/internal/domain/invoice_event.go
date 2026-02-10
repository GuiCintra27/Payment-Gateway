package domain

import (
	"encoding/json"
	"time"
)

type InvoiceEvent struct {
	ID         string
	InvoiceID  string
	EventType  string
	FromStatus *Status
	ToStatus   *Status
	Metadata   json.RawMessage
	RequestID  *string
	CreatedAt  time.Time
}
