package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/GuiCintra27/payment-gateway/go-gateway/internal/domain"
	"github.com/GuiCintra27/payment-gateway/go-gateway/internal/dto"
	"github.com/GuiCintra27/payment-gateway/go-gateway/internal/service"
	"github.com/GuiCintra27/payment-gateway/go-gateway/internal/web/response"
)

// AccountHandler processa requisições HTTP relacionadas a contas
type AccountHandler struct {
	accountService *service.AccountService
}

// NewAccountHandler cria um novo handler de contas
func NewAccountHandler(accountService *service.AccountService) *AccountHandler {
	return &AccountHandler{accountService: accountService}
}

// Create processa POST /accounts
// Retorna 201 Created ou erro 400/500
func (h *AccountHandler) Create(w http.ResponseWriter, r *http.Request) {
	var input dto.CreateAccountInput
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&input); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid_payload", "invalid request payload", nil)
		return
	}

	if validationErrors := validateCreateAccountInput(input); validationErrors != nil {
		response.Error(w, http.StatusUnprocessableEntity, "validation_error", "invalid account data", validationErrors)
		return
	}

	output, err := h.accountService.CreateAccount(input)
	if err != nil {
		switch err {
		case domain.ErrEmailAlreadyExists:
			response.Error(w, http.StatusConflict, "email_already_exists", "email already exists", nil)
			return
		case domain.ErrDuplicatedAPIKey:
			response.Error(w, http.StatusConflict, "api_key_conflict", "api key conflict", nil)
			return
		default:
			response.Error(w, http.StatusInternalServerError, "internal_error", "internal server error", nil)
			return
		}
	}

	response.JSON(w, http.StatusCreated, output)
}

// Get processa GET /accounts
// Requer X-API-Key no header
func (h *AccountHandler) Get(w http.ResponseWriter, r *http.Request) {
	apiKey := r.Header.Get("X-API-KEY")
	if apiKey == "" {
		response.Error(w, http.StatusUnauthorized, "api_key_required", "api key is required", nil)
		return
	}

	output, err := h.accountService.FindByAPIKey(apiKey)
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
