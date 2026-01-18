package middleware

import (
	"net/http"

	"github.com/GuiCintra27/payment-gateway/go-gateway/internal/domain"
	"github.com/GuiCintra27/payment-gateway/go-gateway/internal/service"
	"github.com/GuiCintra27/payment-gateway/go-gateway/internal/web/response"
)

type AuthMiddleware struct {
	accountService *service.AccountService
}

func NewAuthMiddleware(accountService *service.AccountService) *AuthMiddleware {
	return &AuthMiddleware{
		accountService: accountService,
	}
}

func (m *AuthMiddleware) Authenticate(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		apiKey := r.Header.Get("X-API-KEY")
		if apiKey == "" {
			response.Error(w, http.StatusUnauthorized, "api_key_required", "api key is required", nil)
			return
		}

		_, err := m.accountService.FindByAPIKey(apiKey)
		if err != nil {
			if err == domain.ErrAccountNotFound {
				response.Error(w, http.StatusUnauthorized, "invalid_api_key", "invalid api key", nil)
				return
			}

			response.Error(w, http.StatusInternalServerError, "internal_error", "internal server error", nil)
			return
		}

		next.ServeHTTP(w, r)
	})
}
