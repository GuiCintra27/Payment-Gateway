package handlers

import (
	"net/mail"
	"strings"
	"time"
	"unicode"

	"github.com/GuiCintra27/payment-gateway/go-gateway/internal/dto"
)

func validateCreateAccountInput(input dto.CreateAccountInput) map[string]string {
	errors := make(map[string]string)

	if strings.TrimSpace(input.Name) == "" {
		errors["name"] = "name is required"
	}

	if strings.TrimSpace(input.Email) == "" {
		errors["email"] = "email is required"
	} else if _, err := mail.ParseAddress(input.Email); err != nil {
		errors["email"] = "invalid email"
	}

	if len(errors) == 0 {
		return nil
	}

	return errors
}

func validateCreateInvoiceInput(input dto.CreateInvoiceInput) map[string]string {
	errors := make(map[string]string)

	if input.Amount <= 0 {
		errors["amount"] = "amount must be greater than zero"
	}

	if strings.TrimSpace(input.Description) == "" {
		errors["description"] = "description is required"
	}

	if strings.TrimSpace(input.PaymentType) == "" {
		errors["payment_type"] = "payment_type is required"
	} else if input.PaymentType != "credit_card" && input.PaymentType != "boleto" {
		errors["payment_type"] = "payment_type must be credit_card or boleto"
	}

	if input.PaymentType == "credit_card" {
		if len(input.CardNumber) < 12 || len(input.CardNumber) > 19 {
			errors["card_number"] = "card_number must have 12 to 19 digits"
		} else if !isDigits(input.CardNumber) {
			errors["card_number"] = "card_number must contain only digits"
		}

		if len(input.CVV) < 3 || len(input.CVV) > 4 {
			errors["cvv"] = "cvv must have 3 to 4 digits"
		} else if !isDigits(input.CVV) {
			errors["cvv"] = "cvv must contain only digits"
		}

		if input.ExpiryMonth < 1 || input.ExpiryMonth > 12 {
			errors["expiry_month"] = "expiry_month must be between 1 and 12"
		}

		currentTime := time.Now()
		if input.ExpiryYear < currentTime.Year() {
			errors["expiry_year"] = "card expired"
		} else if input.ExpiryYear == currentTime.Year() && input.ExpiryMonth < int(currentTime.Month()) {
			errors["expiry_year"] = "card expired"
		}

		if strings.TrimSpace(input.CardholderName) == "" {
			errors["cardholder_name"] = "cardholder_name is required"
		}
	}

	if len(errors) == 0 {
		return nil
	}

	return errors
}

func isDigits(value string) bool {
	for _, r := range value {
		if !unicode.IsDigit(r) {
			return false
		}
	}
	return true
}
