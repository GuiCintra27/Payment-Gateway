package domain

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
)

// Account representa uma conta com suas informações e saldo protegido para acessos concorrentes
type Account struct {
	ID           string
	Name         string
	Email        string
	APIKey       string
	APIKeyKeyID  string
	BalanceCents int64
	mu           sync.RWMutex
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

// generateAPIKey gera uma chave API segura usando crypto/rand
func generateAPIKey() (string, error) {
	// Usa crypto/rand para garantir chaves API seguras
	b := make([]byte, 16)
	n, err := rand.Read(b)
	if err != nil {
		return "", err
	}
	if n != len(b) {
		return "", fmt.Errorf("random bytes insuficientes: %d", n)
	}
	return hex.EncodeToString(b), nil
}

// NewAccount cria uma conta com ID único, API Key segura e timestamps iniciais
func NewAccount(name, email string) (*Account, error) {
	apiKey, err := generateAPIKey()
	if err != nil {
		return nil, err
	}

	account := &Account{
		ID:           uuid.New().String(),
		Name:         name,
		Email:        email,
		BalanceCents: 0,
		APIKey:       apiKey,
		APIKeyKeyID:  "",
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	return account, nil
}

// AddBalance modifica o saldo da conta de forma thread-safe
func (a *Account) AddBalance(amountCents int64) {
	// Mutex garante exclusão mútua no acesso ao saldo
	a.mu.Lock()
	defer a.mu.Unlock()
	a.BalanceCents += amountCents
	a.UpdatedAt = time.Now()
}
