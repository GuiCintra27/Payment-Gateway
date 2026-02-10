package dto

import (
	"encoding/json"
	"time"

	"github.com/GuiCintra27/payment-gateway/go-gateway/internal/domain"
)

type InvoiceEventOutput struct {
	ID         string          `json:"id"`
	InvoiceID  string          `json:"invoice_id"`
	EventType  string          `json:"event_type"`
	FromStatus *string         `json:"from_status,omitempty"`
	ToStatus   *string         `json:"to_status,omitempty"`
	Metadata   json.RawMessage `json:"metadata,omitempty"`
	RequestID  *string         `json:"request_id,omitempty"`
	CreatedAt  time.Time       `json:"created_at"`
}

func FromInvoiceEvent(event *domain.InvoiceEvent) *InvoiceEventOutput {
	var fromStatus *string
	if event.FromStatus != nil {
		value := string(*event.FromStatus)
		fromStatus = &value
	}
	var toStatus *string
	if event.ToStatus != nil {
		value := string(*event.ToStatus)
		toStatus = &value
	}

	return &InvoiceEventOutput{
		ID:         event.ID,
		InvoiceID:  event.InvoiceID,
		EventType:  event.EventType,
		FromStatus: fromStatus,
		ToStatus:   toStatus,
		Metadata:   event.Metadata,
		RequestID:  event.RequestID,
		CreatedAt:  event.CreatedAt,
	}
}

func FromInvoiceEvents(events []*domain.InvoiceEvent) []*InvoiceEventOutput {
	output := make([]*InvoiceEventOutput, 0, len(events))
	for _, event := range events {
		output = append(output, FromInvoiceEvent(event))
	}
	return output
}
