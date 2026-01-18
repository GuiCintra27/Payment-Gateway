package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/GuiCintra27/payment-gateway/go-gateway/internal/domain"
	"github.com/GuiCintra27/payment-gateway/go-gateway/internal/dto"
	"github.com/GuiCintra27/payment-gateway/go-gateway/internal/service"
	"github.com/GuiCintra27/payment-gateway/go-gateway/internal/web/response"
	"github.com/go-chi/chi/v5"
)

type InvoiceHandler struct {
	service *service.InvoiceService
}

func NewInvoiceHandler(service *service.InvoiceService) *InvoiceHandler {
	return &InvoiceHandler{
		service: service,
	}
}

// Request autenticação via X-API-KEY
// Endpoint: /invoice
// Method: POST
func (h *InvoiceHandler) Create(w http.ResponseWriter, r *http.Request) {
	var input dto.CreateInvoiceInput
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&input); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid_payload", "invalid request payload", nil)
		return
	}

	apiKey := r.Header.Get("X-API-KEY")
	if apiKey == "" {
		response.Error(w, http.StatusUnauthorized, "api_key_required", "api key is required", nil)
		return
	}

	input.APIKey = apiKey

	if validationErrors := validateCreateInvoiceInput(input); validationErrors != nil {
		response.Error(w, http.StatusUnprocessableEntity, "validation_error", "invalid invoice data", validationErrors)
		return
	}

	output, err := h.service.Create(input)
	if err != nil {
		switch err {
		case domain.ErrAccountNotFound:
			response.Error(w, http.StatusUnauthorized, "invalid_api_key", "invalid api key", nil)
			return
		case domain.ErrInvalidAmount, domain.ErrInvalidCardNumber:
			response.Error(w, http.StatusUnprocessableEntity, "validation_error", err.Error(), nil)
			return
		default:
			response.Error(w, http.StatusInternalServerError, "internal_error", "internal server error", nil)
			return
		}
	}

	response.JSON(w, http.StatusCreated, output)
}

// Endpoint: /invoice/{id}
// Method: GET
func (h *InvoiceHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		response.Error(w, http.StatusBadRequest, "invoice_id_required", "invoice id is required", nil)
		return
	}

	apiKey := r.Header.Get("X-API-KEY")
	if apiKey == "" {
		response.Error(w, http.StatusUnauthorized, "api_key_required", "api key is required", nil)
		return
	}

	output, err := h.service.GetByID(id, apiKey)
	if err != nil {
		switch err {
		case domain.ErrInvoiceNotFound:
			response.Error(w, http.StatusNotFound, "invoice_not_found", "invoice not found", nil)
			return
		case domain.ErrAccountNotFound:
			response.Error(w, http.StatusUnauthorized, "invalid_api_key", "invalid api key", nil)
			return
		case domain.ErrUnauthorizedAccess:
			response.Error(w, http.StatusForbidden, "forbidden", "forbidden", nil)
			return
		default:
			response.Error(w, http.StatusInternalServerError, "internal_error", "internal server error", nil)
			return
		}
	}

	response.JSON(w, http.StatusOK, output)
}

// Endpoint: /invoice
// Method: GET
func (h *InvoiceHandler) ListByAccount(w http.ResponseWriter, r *http.Request) {
	apiKey := r.Header.Get("X-API-KEY")
	if apiKey == "" {
		response.Error(w, http.StatusUnauthorized, "api_key_required", "api key is required", nil)
		return
	}

	output, err := h.service.ListByAccountAPIKey(apiKey)
	if err != nil {
		switch err {
		case domain.ErrAccountNotFound:
			response.Error(w, http.StatusUnauthorized, "invalid_api_key", "invalid api key", nil)
			return
		default:
			response.Error(w, http.StatusInternalServerError, "internal_error", "internal server error", nil)
			return
		}
	}

	response.JSON(w, http.StatusOK, output)
}
