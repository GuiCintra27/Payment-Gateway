package service

import (
	"time"

	"github.com/GuiCintra27/payment-gateway/go-gateway/internal/domain"
	"github.com/GuiCintra27/payment-gateway/go-gateway/internal/domain/events"
	"github.com/GuiCintra27/payment-gateway/go-gateway/internal/dto"
	"github.com/GuiCintra27/payment-gateway/go-gateway/internal/outbox"
)

type InvoiceService struct {
	invoiceRepository domain.InvoiceRepository
	accountService    AccountService
	kafkaProducer     KafkaProducerInterface
	limitService      *AccountLimitService
}

func NewInvoiceService(
	invoiceRepository domain.InvoiceRepository,
	accountService AccountService,
	kafkaProducer KafkaProducerInterface,
	limitService *AccountLimitService,
) *InvoiceService {
	return &InvoiceService{
		invoiceRepository: invoiceRepository,
		accountService:    accountService,
		kafkaProducer:     kafkaProducer,
		limitService:      limitService,
	}
}

func (s *InvoiceService) Create(input dto.CreateInvoiceInput) (*dto.InvoiceOutput, error) {
	accountOutput, err := s.accountService.FindByAPIKey(input.APIKey)
	if err != nil {
		return nil, err
	}

	amountCents := domain.AmountToCents(input.Amount)
	if s.limitService != nil {
		if err := s.limitService.Validate(accountOutput.ID, amountCents, time.Now()); err != nil {
			return nil, err
		}
	}

	invoice, err := dto.ToInvoice(input, accountOutput.ID)
	if err != nil {
		return nil, err
	}

	if err := invoice.Process(); err != nil {
		return nil, err
	}

	requestID := ""
	if value, ok := input.Metadata["request_id"]; ok {
		requestID = value
	}

	// Se o status for pending, significa que e uma transacao de alto valor.
	if invoice.Status == domain.StatusPending {
		pendingTransaction := events.NewPendingTransaction(
			invoice.AccountID,
			invoice.ID,
			domain.CentsToAmount(invoice.AmountCents),
			invoice.AmountCents,
		)

		payload, err := outbox.EncodePayload(pendingTransaction)
		if err != nil {
			return nil, err
		}

		correlationID := ""
		if requestID, ok := input.Metadata["request_id"]; ok {
			correlationID = requestID
		}

		if err := s.invoiceRepository.SaveWithOutbox(invoice, "pending_transaction", payload, correlationID); err != nil {
			return nil, err
		}
	} else {
		if err := s.invoiceRepository.Save(invoice, requestID); err != nil {
			return nil, err
		}
	}

	// Para transacoes aprovadas, atualizar o saldo
	if invoice.Status == domain.StatusApproved {
		_, err = s.accountService.UpdateBalanceByAccountID(invoice.AccountID, invoice.AmountCents)
		if err != nil {
			return nil, err
		}
	}

	return dto.FromInvoice(invoice), nil
}

func (s *InvoiceService) GetByID(id, apiKey string) (*dto.InvoiceOutput, error) {
	invoice, err := s.invoiceRepository.FindByID(id)
	if err != nil {
		return nil, err
	}

	accountOutput, err := s.accountService.FindByAPIKey(apiKey)
	if err != nil {
		return nil, err
	}

	if invoice.AccountID != accountOutput.ID {
		return nil, domain.ErrUnauthorizedAccess
	}

	return dto.FromInvoice(invoice), nil
}

func (s *InvoiceService) ListByAccount(accountID string) ([]*dto.InvoiceOutput, error) {
	invoices, err := s.invoiceRepository.FindByAccountID(accountID)
	if err != nil {
		return nil, err
	}

	output := make([]*dto.InvoiceOutput, len(invoices))
	for i, invoice := range invoices {
		output[i] = dto.FromInvoice(invoice)
	}
	return output, nil
}

// ListByAccountAPIKey lista as faturas de uma conta através de uma API Key
func (s *InvoiceService) ListByAccountAPIKey(apiKey string) ([]*dto.InvoiceOutput, error) {
	accountOutput, err := s.accountService.FindByAPIKey(apiKey)
	if err != nil {
		return nil, err
	}

	return s.ListByAccount(accountOutput.ID)
}

// ProcessTransactionResult processa o resultado de uma transação após análise de fraude
func (s *InvoiceService) ProcessTransactionResult(invoiceID string, status domain.Status, requestID string) error {
	return s.invoiceRepository.ApplyTransactionResult(invoiceID, status, requestID)
}

// ListEventsByInvoiceID retorna eventos de uma fatura garantindo autorizacao.
func (s *InvoiceService) ListEventsByInvoiceID(invoiceID, apiKey string) ([]*dto.InvoiceEventOutput, error) {
	invoice, err := s.invoiceRepository.FindByID(invoiceID)
	if err != nil {
		return nil, err
	}

	accountOutput, err := s.accountService.FindByAPIKey(apiKey)
	if err != nil {
		return nil, err
	}

	if invoice.AccountID != accountOutput.ID {
		return nil, domain.ErrUnauthorizedAccess
	}

	events, err := s.invoiceRepository.ListEventsByInvoiceID(invoiceID)
	if err != nil {
		return nil, err
	}
	return dto.FromInvoiceEvents(events), nil
}
