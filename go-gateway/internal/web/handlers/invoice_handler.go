package handlers

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"io"
	"net/http"
	"time"

	"github.com/GuiCintra27/payment-gateway/go-gateway/internal/domain"
	"github.com/GuiCintra27/payment-gateway/go-gateway/internal/dto"
	"github.com/GuiCintra27/payment-gateway/go-gateway/internal/repository"
	"github.com/GuiCintra27/payment-gateway/go-gateway/internal/service"
	"github.com/GuiCintra27/payment-gateway/go-gateway/internal/telemetry"
	"github.com/GuiCintra27/payment-gateway/go-gateway/internal/web/response"
	"github.com/go-chi/chi/v5"
)

type InvoiceHandler struct {
	service          *service.InvoiceService
	idempotencyStore *repository.IdempotencyRepository
}

func NewInvoiceHandler(service *service.InvoiceService, idempotencyStore *repository.IdempotencyRepository) *InvoiceHandler {
	return &InvoiceHandler{
		service:          service,
		idempotencyStore: idempotencyStore,
	}
}

// Create cria uma nova fatura.
// @Summary Criar fatura
// @Description Cria uma fatura e dispara antifraude quando o valor e alto.
// @Tags invoices
// @Accept json
// @Produce json
// @Param X-API-KEY header string true "API key"
// @Param Idempotency-Key header string false "Idempotency key"
// @Param request body CreateInvoiceRequest true "Invoice payload"
// @Success 201 {object} dto.InvoiceOutput
// @Failure 400 {object} response.ErrorResponse
// @Failure 401 {object} response.ErrorResponse
// @Failure 409 {object} response.ErrorResponse
// @Failure 422 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /invoice [post]
func (h *InvoiceHandler) Create(w http.ResponseWriter, r *http.Request) {
	idempotencyKey := r.Header.Get("Idempotency-Key")

	var bodyBytes []byte
	if idempotencyKey != "" && h.idempotencyStore != nil {
		payload, err := io.ReadAll(r.Body)
		if err != nil {
			response.Error(w, http.StatusBadRequest, "invalid_payload", "invalid request payload", nil)
			return
		}
		bodyBytes = payload
		r.Body = io.NopCloser(bytes.NewReader(bodyBytes))
	}

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
	input.Metadata = map[string]string{
		"request_id": telemetry.RequestIDFromContext(r.Context()),
	}

	if idempotencyKey != "" {
		if len(bodyBytes) == 0 {
			reencoded, err := json.Marshal(input)
			if err == nil {
				bodyBytes = reencoded
			}
		}
		endpoint := r.Method + ":" + r.URL.Path
		requestHash := hashIdempotency(bodyBytes, apiKey)

		_ = h.idempotencyStore.DeleteExpired(r.Context())
		existing, err := h.idempotencyStore.Get(r.Context(), idempotencyKey, endpoint)
		if err != nil {
			response.Error(w, http.StatusInternalServerError, "internal_error", "internal server error", nil)
			return
		}
		if existing != nil {
			if time.Now().After(existing.ExpiresAt) {
				_ = h.idempotencyStore.Delete(r.Context(), idempotencyKey, endpoint)
			} else {
				if existing.RequestHash != requestHash {
					response.Error(w, http.StatusConflict, "idempotency_conflict", "idempotency key payload mismatch", nil)
					return
				}
				if existing.Status != "completed" {
					response.Error(w, http.StatusConflict, "idempotency_in_progress", "request with this idempotency key is still processing", nil)
					return
				}
				writeCachedResponse(w, existing.StatusCode, existing.ResponseBody)
				return
			}
		}

		created, err := h.idempotencyStore.CreateProcessing(r.Context(), idempotencyKey, endpoint, requestHash, time.Now().Add(24*time.Hour))
		if err != nil {
			response.Error(w, http.StatusInternalServerError, "internal_error", "internal server error", nil)
			return
		}
		if !created {
			existing, err := h.idempotencyStore.Get(r.Context(), idempotencyKey, endpoint)
			if err != nil {
				response.Error(w, http.StatusInternalServerError, "internal_error", "internal server error", nil)
				return
			}
			if existing != nil && existing.Status == "completed" && existing.RequestHash == requestHash {
				writeCachedResponse(w, existing.StatusCode, existing.ResponseBody)
				return
			}
			response.Error(w, http.StatusConflict, "idempotency_in_progress", "request with this idempotency key is still processing", nil)
			return
		}
	}

	if validationErrors := validateCreateInvoiceInput(input); validationErrors != nil {
		writeWithIdempotency(w, h.idempotencyStore, r, idempotencyKey, http.StatusUnprocessableEntity, response.ErrorResponse{
			Code:    "validation_error",
			Message: "invalid invoice data",
			Details: validationErrors,
		})
		return
	}

	output, err := h.service.Create(input)
	if err != nil {
		switch err {
		case domain.ErrAccountNotFound:
			writeWithIdempotency(w, h.idempotencyStore, r, idempotencyKey, http.StatusUnauthorized, response.ErrorResponse{
				Code:    "invalid_api_key",
				Message: "invalid api key",
			})
			return
		case domain.ErrInvalidAmount, domain.ErrInvalidCardNumber:
			writeWithIdempotency(w, h.idempotencyStore, r, idempotencyKey, http.StatusUnprocessableEntity, response.ErrorResponse{
				Code:    "validation_error",
				Message: err.Error(),
			})
			return
		default:
			writeWithIdempotency(w, h.idempotencyStore, r, idempotencyKey, http.StatusInternalServerError, response.ErrorResponse{
				Code:    "internal_error",
				Message: "internal server error",
			})
			return
		}
	}

	writeWithIdempotency(w, h.idempotencyStore, r, idempotencyKey, http.StatusCreated, output)
}

// GetByID retorna uma fatura pelo ID.
// @Summary Buscar fatura por ID
// @Tags invoices
// @Produce json
// @Param X-API-KEY header string true "API key"
// @Param id path string true "Invoice ID"
// @Success 200 {object} dto.InvoiceOutput
// @Failure 400 {object} response.ErrorResponse
// @Failure 401 {object} response.ErrorResponse
// @Failure 403 {object} response.ErrorResponse
// @Failure 404 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /invoice/{id} [get]
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

// ListEvents retorna o historico de eventos de uma fatura.
// @Summary Listar eventos da fatura
// @Tags invoices
// @Produce json
// @Param X-API-KEY header string true "API key"
// @Param id path string true "Invoice ID"
// @Success 200 {array} dto.InvoiceEventOutput
// @Failure 400 {object} response.ErrorResponse
// @Failure 401 {object} response.ErrorResponse
// @Failure 403 {object} response.ErrorResponse
// @Failure 404 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /invoice/{id}/events [get]
func (h *InvoiceHandler) ListEvents(w http.ResponseWriter, r *http.Request) {
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

	events, err := h.service.ListEventsByInvoiceID(id, apiKey)
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

	response.JSON(w, http.StatusOK, events)
}

func writeCachedResponse(w http.ResponseWriter, status int, body []byte) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_, _ = w.Write(body)
}

func writeWithIdempotency(w http.ResponseWriter, store *repository.IdempotencyRepository, r *http.Request, key string, status int, payload interface{}) {
	body, _ := json.Marshal(payload)
	if key != "" && store != nil {
		endpoint := r.Method + ":" + r.URL.Path
		if status >= 500 {
			_ = store.Delete(r.Context(), key, endpoint)
		} else {
			_ = store.UpdateResponse(r.Context(), key, endpoint, status, body)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_, _ = w.Write(body)
}

func hashIdempotency(body []byte, apiKey string) string {
	hash := sha256.New()
	_, _ = hash.Write(body)
	_, _ = hash.Write([]byte(apiKey))
	return hex.EncodeToString(hash.Sum(nil))
}

// ListByAccount lista as faturas da conta.
// @Summary Listar faturas
// @Tags invoices
// @Produce json
// @Param X-API-KEY header string true "API key"
// @Success 200 {array} dto.InvoiceOutput
// @Failure 401 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /invoice [get]
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
