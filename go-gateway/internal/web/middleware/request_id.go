package middleware

import (
	"net/http"

	"github.com/GuiCintra27/payment-gateway/go-gateway/internal/telemetry"
	"github.com/google/uuid"
)

func RequestID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestID := r.Header.Get("X-Request-Id")
		if requestID == "" {
			requestID = uuid.NewString()
		}

		w.Header().Set("X-Request-Id", requestID)
		ctx := telemetry.WithRequestID(r.Context(), requestID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
