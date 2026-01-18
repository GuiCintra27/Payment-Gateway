package handlers

import (
	"context"
	"database/sql"
	"errors"
	"net/http"
	"time"

	"github.com/GuiCintra27/payment-gateway/go-gateway/internal/web/response"
	"github.com/segmentio/kafka-go"
)

type HealthHandler struct {
	db      *sql.DB
	brokers []string
}

func NewHealthHandler(db *sql.DB, brokers []string) *HealthHandler {
	return &HealthHandler{
		db:      db,
		brokers: brokers,
	}
}

func (h *HealthHandler) Liveness(w http.ResponseWriter, r *http.Request) {
	response.JSON(w, http.StatusOK, map[string]string{
		"status": "ok",
	})
}

func (h *HealthHandler) Readiness(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
	defer cancel()

	checks := map[string]string{}
	status := http.StatusOK

	if err := h.db.PingContext(ctx); err != nil {
		checks["database"] = "error"
		status = http.StatusServiceUnavailable
	} else {
		checks["database"] = "ok"
	}

	if err := h.pingKafka(ctx); err != nil {
		checks["kafka"] = "error"
		status = http.StatusServiceUnavailable
	} else {
		checks["kafka"] = "ok"
	}

	response.JSON(w, status, map[string]interface{}{
		"status": statusLabel(status),
		"checks": checks,
	})
}

func statusLabel(status int) string {
	if status == http.StatusOK {
		return "ok"
	}
	return "unready"
}

func (h *HealthHandler) pingKafka(ctx context.Context) error {
	if len(h.brokers) == 0 {
		return errors.New("no kafka brokers configured")
	}

	dialer := &kafka.Dialer{
		Timeout:   2 * time.Second,
		ClientID: "gateway-healthcheck",
	}

	conn, err := dialer.DialContext(ctx, "tcp", h.brokers[0])
	if err != nil {
		return err
	}
	_ = conn.SetDeadline(time.Now().Add(2 * time.Second))
	_ = conn.Close()
	return nil
}
