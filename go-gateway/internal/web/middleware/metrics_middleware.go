package middleware

import (
	"net/http"
	"time"

	"github.com/GuiCintra27/payment-gateway/go-gateway/internal/metrics"
)

type statusRecorder struct {
	http.ResponseWriter
	status int
}

func (r *statusRecorder) WriteHeader(status int) {
	r.status = status
	r.ResponseWriter.WriteHeader(status)
}

func Metrics(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		metrics.HTTP.IncInFlight()
		defer metrics.HTTP.DecInFlight()

		recorder := &statusRecorder{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(recorder, r)

		metrics.HTTP.Observe(r.Method, r.URL.Path, recorder.status, time.Since(start))
	})
}
