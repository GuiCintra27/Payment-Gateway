package domain

import "time"

// AccountLimit define politicas de limite por conta.
type AccountLimit struct {
	AccountID            string
	MaxAmountPerTxCents  int64
	MaxDailyVolumeCents  int64
	MaxDailyTransactions int64
	CreatedAt            time.Time
	UpdatedAt            time.Time
}

type DailyUsage struct {
	TotalCents int64
	Count      int64
}

// LimitExceededError representa violacoes de politica da conta.
type LimitExceededError struct {
	Reason string
}

func (e LimitExceededError) Error() string {
	return e.Reason
}
