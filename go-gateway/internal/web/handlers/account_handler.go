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

// Create cria uma conta e retorna a API key.
// @Summary Criar conta
// @Tags accounts
// @Accept json
// @Produce json
// @Param request body dto.CreateAccountInput true "Account payload"
// @Success 201 {object} dto.AccountOutput
// @Failure 400 {object} response.ErrorResponse
// @Failure 409 {object} response.ErrorResponse
// @Failure 422 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /accounts [post]
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

// Get retorna dados da conta via API key.
// @Summary Buscar conta
// @Tags accounts
// @Produce json
// @Param X-API-KEY header string true "API key"
// @Success 200 {object} dto.AccountOutput
// @Failure 401 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /accounts [get]
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
