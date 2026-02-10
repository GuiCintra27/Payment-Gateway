package repository

import (
	"database/sql"
	"encoding/json"
	"time"

	"github.com/GuiCintra27/payment-gateway/go-gateway/internal/domain"
)

type InvoiceRepository struct {
	db *sql.DB
}

func NewInvoiceRepository(db *sql.DB) *InvoiceRepository {
	return &InvoiceRepository{db: db}
}

// Save salva uma fatura no banco de dados e registra eventos iniciais.
func (r *InvoiceRepository) Save(invoice *domain.Invoice, requestID string) error {
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

	if err := r.insertInvoiceEvent(tx, invoice.ID, "created", nil, &invoice.Status, nil, requestID); err != nil {
		return err
	}

	switch invoice.Status {
	case domain.StatusApproved:
		if err := r.insertInvoiceEvent(tx, invoice.ID, "approved", nil, &invoice.Status, nil, requestID); err != nil {
			return err
		}
	case domain.StatusRejected:
		if err := r.insertInvoiceEvent(tx, invoice.ID, "rejected", nil, &invoice.Status, nil, requestID); err != nil {
			return err
		}
	}

	return tx.Commit()
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

	if err := r.insertInvoiceEvent(tx, invoice.ID, "created", nil, &invoice.Status, nil, correlationID); err != nil {
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

	if err := r.insertInvoiceEvent(tx, invoice.ID, "pending_published", &invoice.Status, &invoice.Status, nil, correlationID); err != nil {
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
func (r *InvoiceRepository) ApplyTransactionResult(invoiceID string, status domain.Status, requestID string) error {
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

	current := domain.Status(currentStatus)
	if current != domain.StatusPending {
		if current == status {
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

	fromStatus := current
	if err := r.insertInvoiceEvent(tx, invoiceID, string(status), &fromStatus, &status, nil, requestID); err != nil {
		return err
	}

	if status == domain.StatusApproved {
		metadata := map[string]any{
			"amount_cents": amountCents,
			"account_id":   accountID,
		}
		if err := r.insertInvoiceEvent(tx, invoiceID, "balance_applied", &status, &status, metadata, requestID); err != nil {
			return err
		}
	}

	return tx.Commit()
}

// ListEventsByInvoiceID retorna eventos ordenados por data.
func (r *InvoiceRepository) ListEventsByInvoiceID(invoiceID string) ([]*domain.InvoiceEvent, error) {
	rows, err := r.db.Query(`
		SELECT id, invoice_id, event_type, from_status, to_status, metadata, request_id, created_at
		FROM invoice_events
		WHERE invoice_id = $1
		ORDER BY created_at ASC
	`, invoiceID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var events []*domain.InvoiceEvent
	for rows.Next() {
		var event domain.InvoiceEvent
		var fromStatus sql.NullString
		var toStatus sql.NullString
		var metadata []byte
		var requestID sql.NullString

		if err := rows.Scan(
			&event.ID,
			&event.InvoiceID,
			&event.EventType,
			&fromStatus,
			&toStatus,
			&metadata,
			&requestID,
			&event.CreatedAt,
		); err != nil {
			return nil, err
		}

		if fromStatus.Valid {
			value := domain.Status(fromStatus.String)
			event.FromStatus = &value
		}
		if toStatus.Valid {
			value := domain.Status(toStatus.String)
			event.ToStatus = &value
		}
		if len(metadata) > 0 {
			event.Metadata = json.RawMessage(metadata)
		}
		if requestID.Valid {
			event.RequestID = &requestID.String
		}

		events = append(events, &event)
	}

	return events, nil
}

func (r *InvoiceRepository) insertInvoiceEvent(
	tx *sql.Tx,
	invoiceID string,
	eventType string,
	fromStatus *domain.Status,
	toStatus *domain.Status,
	metadata map[string]any,
	requestID string,
) error {
	var fromValue sql.NullString
	if fromStatus != nil {
		fromValue = sql.NullString{String: string(*fromStatus), Valid: true}
	}
	var toValue sql.NullString
	if toStatus != nil {
		toValue = sql.NullString{String: string(*toStatus), Valid: true}
	}

	var metadataValue []byte
	if metadata != nil {
		payload, err := json.Marshal(metadata)
		if err != nil {
			return err
		}
		metadataValue = payload
	}

	requestValue := sql.NullString{}
	if requestID != "" {
		requestValue = sql.NullString{String: requestID, Valid: true}
	}

	_, err := tx.Exec(
		`INSERT INTO invoice_events (id, invoice_id, event_type, from_status, to_status, metadata, request_id, created_at)
		 VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW())`,
		invoiceID,
		eventType,
		fromValue,
		toValue,
		metadataValue,
		requestValue,
	)
	return err
}
