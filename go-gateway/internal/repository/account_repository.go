package repository

import (
	"database/sql"
	"time"

	"github.com/GuiCintra27/payment-gateway/go-gateway/internal/domain"
	"github.com/GuiCintra27/payment-gateway/go-gateway/internal/security"
)

// AccountRepository implementa operações de persistência para Account
type AccountRepository struct {
	db *sql.DB
}

// NewAccountRepository cria um novo repositório de contas
func NewAccountRepository(db *sql.DB) *AccountRepository {
	return &AccountRepository{db: db}
}

// Save persiste uma nova conta no banco de dados
// Retorna erro se houver falha na inserção
func (r *AccountRepository) Save(account *domain.Account) error {
	keyID := account.APIKeyKeyID
	var apiKeyHash string
	var err error

	if keyID == "" {
		apiKeyHash, keyID, err = security.HashAPIKeyWithActiveKey(account.APIKey)
		if err != nil {
			return err
		}
		account.APIKeyKeyID = keyID
	} else {
		apiKeyHash, err = security.HashAPIKey(account.APIKey, keyID)
		if err != nil {
			return err
		}
	}

	stmt, err := r.db.Prepare(`
        INSERT INTO accounts (id, name, email, api_key, api_key_key_id, balance_cents, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `)
	if err != nil {
		return err
	}
	defer stmt.Close()

	_, err = stmt.Exec(
		account.ID,
		account.Name,
		account.Email,
		apiKeyHash,
		account.APIKeyKeyID,
		account.BalanceCents,
		account.CreatedAt,
		account.UpdatedAt,
	)
	if err != nil {
		return err
	}
	return nil
}

// FindByAPIKey busca uma conta pelo API Key
// Retorna ErrAccountNotFound se não encontrada
func (r *AccountRepository) FindByAPIKey(apiKey string) (*domain.Account, error) {
	candidates, err := security.HashAPIKeyCandidates(apiKey)
	if err != nil {
		return nil, err
	}

	for _, candidate := range candidates {
		var account domain.Account
		var createdAt, updatedAt time.Time

		err := r.db.QueryRow(`
			SELECT id, name, email, api_key, api_key_key_id, balance_cents, created_at, updated_at
			FROM accounts
			WHERE api_key = $1 AND api_key_key_id = $2
		`, candidate.Hash, candidate.KeyID).Scan(
			&account.ID,
			&account.Name,
			&account.Email,
			&account.APIKey,
			&account.APIKeyKeyID,
			&account.BalanceCents,
			&createdAt,
			&updatedAt,
		)
		if err == sql.ErrNoRows {
			continue
		}
		if err != nil {
			return nil, err
		}

		account.CreatedAt = createdAt
		account.UpdatedAt = updatedAt
		return &account, nil
	}

	return nil, domain.ErrAccountNotFound
}

// FindByEmail busca uma conta pelo email
// Retorna ErrAccountNotFound se não encontrada
func (r *AccountRepository) FindByEmail(email string) (*domain.Account, error) {
	var account domain.Account
	var createdAt, updatedAt time.Time

	err := r.db.QueryRow(`
		SELECT id, name, email, api_key, api_key_key_id, balance_cents, created_at, updated_at
		FROM accounts
		WHERE email = $1
	`, email).Scan(
		&account.ID,
		&account.Name,
		&account.Email,
		&account.APIKey,
		&account.APIKeyKeyID,
		&account.BalanceCents,
		&createdAt,
		&updatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, domain.ErrAccountNotFound
	}
	if err != nil {
		return nil, err
	}

	account.CreatedAt = createdAt
	account.UpdatedAt = updatedAt
	return &account, nil
}

// FindByID busca uma conta pelo ID
// Retorna ErrAccountNotFound se não encontrada
func (r *AccountRepository) FindByID(id string) (*domain.Account, error) {
	var account domain.Account
	var createdAt, updatedAt time.Time

	err := r.db.QueryRow(`
		SELECT id, name, email, api_key, api_key_key_id, balance_cents, created_at, updated_at
		FROM accounts
		WHERE id = $1
	`, id).Scan(
		&account.ID,
		&account.Name,
		&account.Email,
		&account.APIKey,
		&account.APIKeyKeyID,
		&account.BalanceCents,
		&createdAt,
		&updatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, domain.ErrAccountNotFound
	}
	if err != nil {
		return nil, err
	}

	account.CreatedAt = createdAt
	account.UpdatedAt = updatedAt
	return &account, nil
}

// UpdateBalance atualiza o saldo da conta usando SELECT FOR UPDATE para consistência em acessos concorrentes
// Retorna ErrAccountNotFound se a conta não existir
func (r *AccountRepository) UpdateBalance(account *domain.Account) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// SELECT FOR UPDATE previne race conditions no saldo
	var currentBalance int64
	err = tx.QueryRow(`SELECT balance_cents FROM accounts WHERE id = $1 FOR UPDATE`,
		account.ID).Scan(&currentBalance)

	if err == sql.ErrNoRows {
		return domain.ErrAccountNotFound
	}
	if err != nil {
		return err
	}

	_, err = tx.Exec(`
        UPDATE accounts
        SET balance_cents = $1, updated_at = $2
        WHERE id = $3
    `, account.BalanceCents, time.Now(), account.ID)
	if err != nil {
		return err
	}
	return tx.Commit()
}

// AddBalance atualiza o saldo somando o amount de forma atômica.
func (r *AccountRepository) AddBalance(accountID string, amountCents int64) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	result, err := tx.Exec(`
        UPDATE accounts
        SET balance_cents = balance_cents + $1, updated_at = $2
        WHERE id = $3
    `, amountCents, time.Now(), accountID)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return domain.ErrAccountNotFound
	}

	return tx.Commit()
}
