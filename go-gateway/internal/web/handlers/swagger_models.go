package handlers

// CreateInvoiceRequest representa o payload do POST /invoice (swagger).
type CreateInvoiceRequest struct {
	Amount         float64 `json:"amount" example:"129.9"`
	Description    string  `json:"description" example:"Assinatura"`
	PaymentType    string  `json:"payment_type" example:"credit_card"`
	CardNumber     string  `json:"card_number" example:"4242424242424242"`
	CVV            string  `json:"cvv" example:"123"`
	ExpiryMonth    int     `json:"expiry_month" example:"12"`
	ExpiryYear     int     `json:"expiry_year" example:"2030"`
	CardholderName string  `json:"cardholder_name" example:"Demo User"`
}
