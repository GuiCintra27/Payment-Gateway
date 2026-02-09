package repository

import (
	"database/sql"
	"time"

	"github.com/GuiCintra27/payment-gateway/go-gateway/internal/domain"
)

type InvoiceRepository struct {
	db *sql.DB
}

func NewInvoiceRepository(db *sql.DB) *InvoiceRepository {
	return &InvoiceRepository{db: db}
}

// Save salva uma fatura no banco de dados
func (r *InvoiceRepository) Save(invoice *domain.Invoice) error {
	_, err := r.db.Exec(
		"INSERT INTO invoices (id, account_id, amount_cents, status, description, payment_type, card_last_digits, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
		invoice.ID, invoice.AccountID, invoice.AmountCents, invoice.Status, invoice.Description, invoice.PaymentType, invoice.CardLastDigits, invoice.CreatedAt, invoice.UpdatedAt,
	)
	if err != nil {
		return err
	}

	return nil
}

// SaveWithOutbox salva a fatura e cria um evento de outbox na mesma transacao.
func (r *InvoiceRepository) SaveWithOutbox(invoice *domain.Invoice, eventType string, payload []byte, correlationID string) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	_, err = tx.Exec(
		"INSERT INTO invoices (id, account_id, amount_cents, status, description, payment_type, card_last_digits, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
		invoice.ID, invoice.AccountID, invoice.AmountCents, invoice.Status, invoice.Description, invoice.PaymentType, invoice.CardLastDigits, invoice.CreatedAt, invoice.UpdatedAt,
	)
	if err != nil {
		return err
	}

	_, err = tx.Exec(
		`INSERT INTO outbox_events (id, aggregate_id, type, payload, status, attempts, next_attempt_at, correlation_id, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, 'pending', 0, NOW(), $4, NOW(), NOW())`,
		invoice.ID, eventType, payload, correlationID,
	)
	if err != nil {
		return err
	}

	return tx.Commit()
}

// FindByID busca uma fatura pelo ID
func (r *InvoiceRepository) FindByID(id string) (*domain.Invoice, error) {
	var invoice domain.Invoice
	err := r.db.QueryRow(`
		SELECT id, account_id, amount_cents, status, description, payment_type, card_last_digits, created_at, updated_at
		FROM invoices
		WHERE id = $1
	`, id).Scan(
		&invoice.ID,
		&invoice.AccountID,
		&invoice.AmountCents,
		&invoice.Status,
		&invoice.Description,
		&invoice.PaymentType,
		&invoice.CardLastDigits,
		&invoice.CreatedAt,
		&invoice.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, domain.ErrInvoiceNotFound
	}

	if err != nil {
		return nil, err
	}

	return &invoice, nil
}

// FindByAccountID busca todas as faturas de um determinado accountID
func (r *InvoiceRepository) FindByAccountID(accountID string) ([]*domain.Invoice, error) {
	rows, err := r.db.Query(`
		SELECT id, account_id, amount_cents, status, description, payment_type, card_last_digits, created_at, updated_at
		FROM invoices
		WHERE account_id = $1
	`, accountID)
	if err != nil {
		return nil, err
	}

	defer rows.Close()

	var invoices []*domain.Invoice
	for rows.Next() {
		var invoice domain.Invoice
		err := rows.Scan(
			&invoice.ID, &invoice.AccountID, &invoice.AmountCents, &invoice.Status, &invoice.Description, &invoice.PaymentType, &invoice.CardLastDigits, &invoice.CreatedAt, &invoice.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		invoices = append(invoices, &invoice)
	}

	return invoices, nil
}

// UpdateStatus atualiza o status de uma fatura
func (r *InvoiceRepository) UpdateStatus(invoice *domain.Invoice) error {
	rows, err := r.db.Exec(
		"UPDATE invoices SET status = $1, updated_at = $2 WHERE id = $3",
		invoice.Status, invoice.UpdatedAt, invoice.ID,
	)
	if err != nil {
		return err
	}

	rowsAffected, err := rows.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return domain.ErrInvoiceNotFound
	}

	return nil
}

// ApplyTransactionResult aplica status e saldo em uma única transação.
func (r *InvoiceRepository) ApplyTransactionResult(invoiceID string, status domain.Status) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	var currentStatus string
	var accountID string
	var amountCents int64

	err = tx.QueryRow(`
		SELECT status, account_id, amount_cents
		FROM invoices
		WHERE id = $1
		FOR UPDATE
	`, invoiceID).Scan(&currentStatus, &accountID, &amountCents)
	if err == sql.ErrNoRows {
		return domain.ErrInvoiceNotFound
	}
	if err != nil {
		return err
	}

	if domain.Status(currentStatus) != domain.StatusPending {
		if domain.Status(currentStatus) == status {
			return tx.Commit()
		}
		return domain.ErrInvalidStatus
	}

	_, err = tx.Exec(
		"UPDATE invoices SET status = $1, updated_at = $2 WHERE id = $3",
		status, time.Now(), invoiceID,
	)
	if err != nil {
		return err
	}

	if status == domain.StatusApproved {
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
	}

	return tx.Commit()
}
