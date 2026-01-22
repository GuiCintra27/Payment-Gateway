package domain

import (
	"math/rand"
	"time"

	"github.com/google/uuid"
)

func init() {
	rand.Seed(time.Now().UnixNano())
}

type Status string

const (
	StatusPending  Status = "pending"
	StatusApproved Status = "approved"
	StatusRejected Status = "rejected"
)

const pendingThresholdCents int64 = 10000 * centsFactor

type Invoice struct {
	ID             string
	AccountID      string
	AmountCents    int64
	Status         Status
	Description    string
	PaymentType    string
	CardLastDigits string
	CreatedAt      time.Time
	UpdatedAt      time.Time
}

type CreditCard struct {
	Number         string
	CVV            string
	ExpiryMonth    int
	ExpiryYear     int
	CardholderName string
}

func NewInvoice(accountID string, amountCents int64, description string, paymentType string, card CreditCard) (*Invoice, error) {
	if amountCents <= 0 {
		return nil, ErrInvalidAmount
	}

	if len(card.Number) < 4 {
		return nil, ErrInvalidCardNumber
	}

	lastDigits := card.Number[len(card.Number)-4:]

	return &Invoice{
		ID:             uuid.New().String(),
		AccountID:      accountID,
		AmountCents:    amountCents,
		Status:         StatusPending,
		Description:    description,
		PaymentType:    paymentType,
		CardLastDigits: lastDigits,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}, nil
}

func (i *Invoice) Process() error {
	if i.AmountCents > pendingThresholdCents {
		return nil
	}

	var newStatus Status

	if rand.Float64() <= 0.7 {
		newStatus = StatusApproved
	} else {
		newStatus = StatusRejected
	}

	i.Status = newStatus
	return nil
}

func (i *Invoice) UpdateStatus(newStatus Status) error {
	if i.Status == newStatus {
		return nil
	}
	if i.Status != StatusPending {
		return ErrInvalidStatus
	}

	i.Status = newStatus
	i.UpdatedAt = time.Now()
	return nil
}
