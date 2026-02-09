package domain

import "testing"

func TestInvoiceUpdateStatusIdempotent(t *testing.T) {
	invoice := &Invoice{Status: StatusPending}
	if err := invoice.UpdateStatus(StatusPending); err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	if invoice.Status != StatusPending {
		t.Fatalf("expected status pending, got %v", invoice.Status)
	}
}

func TestInvoiceProcessKeepsPendingForHighValue(t *testing.T) {
	invoice := &Invoice{AmountCents: pendingThresholdCents + 1, Status: StatusPending}
	if err := invoice.Process(); err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	if invoice.Status != StatusPending {
		t.Fatalf("expected status pending, got %v", invoice.Status)
	}
}
