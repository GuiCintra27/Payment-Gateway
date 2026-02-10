package service

import (
	"os"
	"strconv"
	"time"

	"github.com/GuiCintra27/payment-gateway/go-gateway/internal/domain"
	"github.com/GuiCintra27/payment-gateway/go-gateway/internal/repository"
)

// AccountLimitService valida politicas de limite por conta.
type AccountLimitService struct {
	limitsRepo  *repository.AccountLimitRepository
	invoiceRepo domain.InvoiceRepository
	defaults    domain.AccountLimit
}

func NewAccountLimitService(limitsRepo *repository.AccountLimitRepository, invoiceRepo domain.InvoiceRepository) *AccountLimitService {
	defaults := domain.AccountLimit{
		MaxAmountPerTxCents:  parseEnvInt64("ACCOUNT_LIMIT_MAX_AMOUNT_PER_TX_CENTS", 0),
		MaxDailyVolumeCents:  parseEnvInt64("ACCOUNT_LIMIT_MAX_DAILY_VOLUME_CENTS", 0),
		MaxDailyTransactions: parseEnvInt64("ACCOUNT_LIMIT_MAX_DAILY_TRANSACTIONS", 0),
	}
	return &AccountLimitService{limitsRepo: limitsRepo, invoiceRepo: invoiceRepo, defaults: defaults}
}

func (s *AccountLimitService) Validate(accountID string, amountCents int64, now time.Time) error {
	limits, err := s.limitsRepo.EnsureDefaults(accountID, domain.AccountLimit{
		AccountID:            accountID,
		MaxAmountPerTxCents:  s.defaults.MaxAmountPerTxCents,
		MaxDailyVolumeCents:  s.defaults.MaxDailyVolumeCents,
		MaxDailyTransactions: s.defaults.MaxDailyTransactions,
	})
	if err != nil {
		return err
	}

	if limits.MaxAmountPerTxCents > 0 && amountCents > limits.MaxAmountPerTxCents {
		return domain.LimitExceededError{Reason: "max_amount_per_tx_exceeded"}
	}

	start := time.Date(now.UTC().Year(), now.UTC().Month(), now.UTC().Day(), 0, 0, 0, 0, time.UTC)
	end := start.Add(24 * time.Hour)

	usage, err := s.invoiceRepo.GetDailyUsage(accountID, start, end)
	if err != nil {
		return err
	}

	if limits.MaxDailyVolumeCents > 0 && usage.TotalCents+amountCents > limits.MaxDailyVolumeCents {
		return domain.LimitExceededError{Reason: "max_daily_volume_exceeded"}
	}

	if limits.MaxDailyTransactions > 0 && usage.Count+1 > limits.MaxDailyTransactions {
		return domain.LimitExceededError{Reason: "max_daily_transactions_exceeded"}
	}

	return nil
}

func parseEnvInt64(key string, fallback int64) int64 {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	parsed, err := strconv.ParseInt(value, 10, 64)
	if err != nil {
		return fallback
	}
	return parsed
}
