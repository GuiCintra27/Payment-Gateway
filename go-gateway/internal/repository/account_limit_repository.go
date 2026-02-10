package repository

import (
	"database/sql"
	"time"

	"github.com/GuiCintra27/payment-gateway/go-gateway/internal/domain"
)

// AccountLimitRepository lida com politicas de limite por conta.
type AccountLimitRepository struct {
	db *sql.DB
}

func NewAccountLimitRepository(db *sql.DB) *AccountLimitRepository {
	return &AccountLimitRepository{db: db}
}

func (r *AccountLimitRepository) EnsureDefaults(accountID string, defaults domain.AccountLimit) (*domain.AccountLimit, error) {
	_, err := r.db.Exec(`
		INSERT INTO account_limits (account_id, max_amount_per_tx_cents, max_daily_volume_cents, max_daily_transactions, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (account_id) DO NOTHING
	`, accountID, defaults.MaxAmountPerTxCents, defaults.MaxDailyVolumeCents, defaults.MaxDailyTransactions, time.Now(), time.Now())
	if err != nil {
		return nil, err
	}

	return r.GetByAccountID(accountID)
}

func (r *AccountLimitRepository) GetByAccountID(accountID string) (*domain.AccountLimit, error) {
	var limit domain.AccountLimit
	var createdAt, updatedAt time.Time
	row := r.db.QueryRow(`
		SELECT account_id, max_amount_per_tx_cents, max_daily_volume_cents, max_daily_transactions, created_at, updated_at
		FROM account_limits
		WHERE account_id = $1
	`, accountID)
	if err := row.Scan(
		&limit.AccountID,
		&limit.MaxAmountPerTxCents,
		&limit.MaxDailyVolumeCents,
		&limit.MaxDailyTransactions,
		&createdAt,
		&updatedAt,
	); err != nil {
		if err == sql.ErrNoRows {
			return nil, domain.ErrAccountNotFound
		}
		return nil, err
	}
	limit.CreatedAt = createdAt
	limit.UpdatedAt = updatedAt
	return &limit, nil
}
