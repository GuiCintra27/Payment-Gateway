//go:build integration

package repository

import (
	"database/sql"
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/GuiCintra27/payment-gateway/go-gateway/internal/domain"
	"github.com/google/uuid"
	_ "github.com/lib/pq"
)

func openIntegrationDB(t *testing.T) *sql.DB {
	t.Helper()

	if dsn := os.Getenv("INTEGRATION_DB_DSN"); dsn != "" {
		db, err := sql.Open("postgres", dsn)
		if err != nil {
			t.Fatalf("failed to open db: %v", err)
		}
		return db
	}

	host := os.Getenv("DB_HOST")
	port := os.Getenv("DB_PORT")
	user := os.Getenv("DB_USER")
	pass := os.Getenv("DB_PASSWORD")
	name := os.Getenv("DB_NAME")
	ssl := os.Getenv("DB_SSL_MODE")

	if host == "" || port == "" || user == "" || pass == "" || name == "" {
		t.Skip("missing DB envs for integration test")
	}
	if ssl == "" {
		ssl = "disable"
	}

	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s", host, port, user, pass, name, ssl)
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		t.Fatalf("failed to open db: %v", err)
	}
	return db
}

func TestApplyTransactionResult_UpdatesBalance(t *testing.T) {
	db := openIntegrationDB(t)
	defer db.Close()

	repo := NewInvoiceRepository(db)
	accountID := uuid.New().String()
	invoiceID := uuid.New().String()
	amountCents := int64(1500)

	_, err := db.Exec(`INSERT INTO accounts (id, name, email, api_key, api_key_key_id, balance_cents, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
		accountID, "integration", "integration@test.local", uuid.New().String(), "v1", 0, time.Now(), time.Now())
	if err != nil {
		t.Fatalf("failed to insert account: %v", err)
	}
	defer db.Exec("DELETE FROM accounts WHERE id = $1", accountID)

	_, err = db.Exec(`INSERT INTO invoices (id, account_id, amount_cents, status, description, payment_type, card_last_digits, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
		invoiceID, accountID, amountCents, domain.StatusPending, "test", "credit_card", "4242", time.Now(), time.Now())
	if err != nil {
		t.Fatalf("failed to insert invoice: %v", err)
	}
	defer db.Exec("DELETE FROM invoices WHERE id = $1", invoiceID)

	if err := repo.ApplyTransactionResult(invoiceID, domain.StatusApproved, "integration"); err != nil {
		t.Fatalf("apply transaction result failed: %v", err)
	}

	var balance int64
	if err := db.QueryRow("SELECT balance_cents FROM accounts WHERE id = $1", accountID).Scan(&balance); err != nil {
		t.Fatalf("failed to query balance: %v", err)
	}

	if balance != amountCents {
		t.Fatalf("expected balance %d, got %d", amountCents, balance)
	}
}
