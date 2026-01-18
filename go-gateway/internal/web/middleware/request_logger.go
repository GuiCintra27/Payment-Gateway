package middleware

import (
	"log/slog"
	"net/http"
	"time"
)

type loggingRecorder struct {
	http.ResponseWriter
	status int
	bytes  int
}

func (r *loggingRecorder) WriteHeader(status int) {
	r.status = status
	r.ResponseWriter.WriteHeader(status)
}

func (r *loggingRecorder) Write(data []byte) (int, error) {
	size, err := r.ResponseWriter.Write(data)
	r.bytes += size
	return size, err
}

func RequestLogger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		recorder := &loggingRecorder{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(recorder, r)

		slog.Info("http_request",
			"method", r.Method,
			"path", r.URL.Path,
			"status", recorder.status,
			"bytes", recorder.bytes,
			"duration_ms", time.Since(start).Milliseconds(),
			"request_id", RequestIDFromContext(r.Context()),
		)
	})
}
