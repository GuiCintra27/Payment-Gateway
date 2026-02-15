package service

import (
	"fmt"
	"time"

	"github.com/GuiCintra27/payment-gateway/go-gateway/internal/domain"
	"github.com/GuiCintra27/payment-gateway/go-gateway/internal/dto"
)

const demoAccountName = "Demo Store"

type DemoService struct {
	accountRepository domain.AccountRepository
	invoiceRepository domain.InvoiceRepository
}

func NewDemoService(accountRepository domain.AccountRepository, invoiceRepository domain.InvoiceRepository) *DemoService {
	return &DemoService{
		accountRepository: accountRepository,
		invoiceRepository: invoiceRepository,
	}
}

func (s *DemoService) SeedDemo() (*dto.DemoOutput, error) {
	demoEmail := fmt.Sprintf("demo+%d@gateway.local", time.Now().UnixNano())
	account, err := domain.NewAccount(demoAccountName, demoEmail)
	if err != nil {
		return nil, err
	}
	if err := s.accountRepository.Save(account); err != nil {
		return nil, err
	}

	if err := s.seedInvoices(account); err != nil {
		return nil, err
	}

	invoices, err := s.invoiceRepository.FindByAccountID(account.ID)
	if err != nil {
		return nil, err
	}

	output := &dto.DemoOutput{
		Account: dto.FromAccount(account),
	}

	output.Invoices = make([]*dto.InvoiceOutput, len(invoices))
	for i, invoice := range invoices {
		output.Invoices[i] = dto.FromInvoice(invoice)
	}

	return output, nil
}

type demoInvoiceSeed struct {
	amount      float64
	description string
	status      domain.Status
	daysAgo     int
}

func (s *DemoService) seedInvoices(account *domain.Account) error {
	now := time.Now()
	seeds := []demoInvoiceSeed{
		{amount: 129.90, description: "Assinatura Pro - Janeiro", status: domain.StatusApproved, daysAgo: 18},
		{amount: 980.00, description: "Licencas equipe - 5 seats", status: domain.StatusApproved, daysAgo: 12},
		{amount: 15200.00, description: "Campanha sazonal - lote 1", status: domain.StatusPending, daysAgo: 7},
		{amount: 249.90, description: "Compra unica - plano anual", status: domain.StatusRejected, daysAgo: 4},
		{amount: 5120.00, description: "Upgrade corporativo", status: domain.StatusRejected, daysAgo: 1},
	}

	var approvedTotalCents int64
	for _, seed := range seeds {
		card := domain.CreditCard{
			Number:         "4242424242424242",
			CVV:            "123",
			ExpiryMonth:    12,
			ExpiryYear:     now.Year() + 2,
			CardholderName: "Demo User",
		}

		amountCents := domain.AmountToCents(seed.amount)
		invoice, err := domain.NewInvoice(
			account.ID,
			amountCents,
			seed.description,
			"credit_card",
			card,
		)
		if err != nil {
			return err
		}

		if seed.status != domain.StatusPending {
			if err := invoice.UpdateStatus(seed.status); err != nil {
				return err
			}
		}

		createdAt := now.AddDate(0, 0, -seed.daysAgo)
		invoice.CreatedAt = createdAt
		invoice.UpdatedAt = createdAt.Add(2 * time.Hour)

		if err := s.invoiceRepository.Save(invoice, ""); err != nil {
			return err
		}

		if seed.status == domain.StatusPending {
			pendingStatus := domain.StatusPending
			pendingPublishedAt := createdAt.Add(1 * time.Minute)
			metadata := map[string]any{
				"source": "demo_seed",
			}

			if err := s.invoiceRepository.AddInvoiceEvent(
				invoice.ID,
				"pending_published",
				&pendingStatus,
				&pendingStatus,
				metadata,
				"demo-seed",
				&pendingPublishedAt,
			); err != nil {
				return err
			}
		}

		if seed.status == domain.StatusApproved {
			approvedTotalCents += amountCents
		}
	}

	if approvedTotalCents > 0 {
		account.AddBalance(approvedTotalCents)
		if err := s.accountRepository.AddBalance(account.ID, approvedTotalCents); err != nil {
			return err
		}
	}

	return nil
}
