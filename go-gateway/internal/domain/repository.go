package domain

import "time"

type AccountRepository interface {
	Save(account *Account) error
	FindByAPIKey(apiKey string) (*Account, error)
	FindByEmail(email string) (*Account, error)
	FindByID(id string) (*Account, error)
	UpdateBalance(account *Account) error
	AddBalance(accountID string, amountCents int64) error
}

type InvoiceRepository interface {
	Save(invoice *Invoice, requestID string) error
	SaveWithOutbox(invoice *Invoice, eventType string, payload []byte, correlationID string) error
	FindByID(id string) (*Invoice, error)
	FindByAccountID(accountID string) ([]*Invoice, error)
	GetDailyUsage(accountID string, start, end time.Time) (*DailyUsage, error)
	UpdateStatus(invoice *Invoice) error
	ApplyTransactionResult(invoiceID string, status Status, requestID string) error
	ListEventsByInvoiceID(invoiceID string) ([]*InvoiceEvent, error)
}
