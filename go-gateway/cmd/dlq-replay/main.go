package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"log/slog"
	"os"
	"strings"
	"time"

	"github.com/GuiCintra27/payment-gateway/go-gateway/internal/repository"
	_ "github.com/lib/pq"
	"github.com/segmentio/kafka-go"
)

type dlqMessage struct {
	EventID   string `json:"event_id,omitempty"`
	InvoiceID string `json:"invoice_id,omitempty"`
	Status    string `json:"status,omitempty"`
	Error     string `json:"error"`
	Payload   string `json:"payload"`
	FailedAt  string `json:"failed_at"`
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func main() {
	var (
		dryRun   = flag.Bool("dry-run", false, "do not publish messages, only audit")
		max      = flag.Int("max", 0, "max messages to replay (0 = unlimited)")
		operator = flag.String("operator", getEnv("REPLAY_OPERATOR", "local"), "replay operator identifier")
		groupID  = flag.String("group", getEnv("DLQ_REPLAY_GROUP_ID", "dlq-replay"), "consumer group id")
	)
	flag.Parse()

	broker := getEnv("KAFKA_BROKER", "localhost:9092")
	dlqTopic := getEnv("KAFKA_DLQ_TOPIC", "transactions_result_dlq")
	targetTopic := getEnv("KAFKA_CONSUMER_TOPIC", "transactions_result")

	connStr := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		getEnv("DB_HOST", "localhost"),
		getEnv("DB_PORT", "5432"),
		getEnv("DB_USER", "postgres"),
		getEnv("DB_PASSWORD", "postgres"),
		getEnv("DB_NAME", "gateway"),
		getEnv("DB_SSL_MODE", "disable"),
	)

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatalf("error connecting to database: %v", err)
	}
	defer db.Close()

	auditRepo := repository.NewDlqReplayRepository(db)

	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers: strings.Split(broker, ","),
		Topic:   dlqTopic,
		GroupID: *groupID,
	})
	defer reader.Close()

	writer := &kafka.Writer{
		Addr:     kafka.TCP(strings.Split(broker, ",")...),
		Topic:    targetTopic,
		Balancer: &kafka.LeastBytes{},
	}
	defer writer.Close()

	ctx := context.Background()
	processed := 0

	for {
		if *max > 0 && processed >= *max {
			break
		}

		msg, err := reader.FetchMessage(ctx)
		if err != nil {
			slog.Error("dlq replay: fetch message failed", "error", err)
			time.Sleep(500 * time.Millisecond)
			continue
		}

		var payload dlqMessage
		if err := json.Unmarshal(msg.Value, &payload); err != nil {
			slog.Error("dlq replay: invalid payload", "error", err)
			auditRepo.Save(repository.DlqReplayAudit{
				EventID:    "",
				InvoiceID:  "",
				Status:     "",
				Reason:     "invalid_payload",
				Mode:       modeLabel(*dryRun),
				ReplayedBy: *operator,
				Success:    false,
				Error:      err.Error(),
				CreatedAt:  time.Now(),
			})
			_ = reader.CommitMessages(ctx, msg)
			continue
		}

		if *dryRun {
			slog.Info("dlq replay dry-run", "event_id", payload.EventID, "invoice_id", payload.InvoiceID)
			_ = auditRepo.Save(repository.DlqReplayAudit{
				EventID:    payload.EventID,
				InvoiceID:  payload.InvoiceID,
				Status:     payload.Status,
				Reason:     payload.Error,
				Mode:       modeLabel(true),
				ReplayedBy: *operator,
				Success:    true,
				CreatedAt:  time.Now(),
			})
			_ = reader.CommitMessages(ctx, msg)
			processed++
			continue
		}

		if err := writer.WriteMessages(ctx, kafka.Message{Value: []byte(payload.Payload), Headers: []kafka.Header{{Key: "x-replayed", Value: []byte("true")}}}); err != nil {
			slog.Error("dlq replay: publish failed", "error", err, "event_id", payload.EventID)
			_ = auditRepo.Save(repository.DlqReplayAudit{
				EventID:    payload.EventID,
				InvoiceID:  payload.InvoiceID,
				Status:     payload.Status,
				Reason:     payload.Error,
				Mode:       modeLabel(false),
				ReplayedBy: *operator,
				Success:    false,
				Error:      err.Error(),
				CreatedAt:  time.Now(),
			})
			continue
		}

		_ = auditRepo.Save(repository.DlqReplayAudit{
			EventID:    payload.EventID,
			InvoiceID:  payload.InvoiceID,
			Status:     payload.Status,
			Reason:     payload.Error,
			Mode:       modeLabel(false),
			ReplayedBy: *operator,
			Success:    true,
			CreatedAt:  time.Now(),
		})

		if err := reader.CommitMessages(ctx, msg); err != nil {
			slog.Error("dlq replay: commit failed", "error", err)
		}
		processed++
	}

	slog.Info("dlq replay finished", "processed", processed, "dry_run", *dryRun)
}

func modeLabel(dryRun bool) string {
	if dryRun {
		return "dry_run"
	}
	return "execute"
}
