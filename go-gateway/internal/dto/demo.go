package dto

type DemoOutput struct {
	Account  AccountOutput    `json:"account"`
	Invoices []*InvoiceOutput `json:"invoices"`
}
