package service

import (
	"context"
	"encoding/json"
	"log/slog"
	"os"
	"strings"
	"time"

	"github.com/GuiCintra27/payment-gateway/go-gateway/internal/domain/events"
	"github.com/GuiCintra27/payment-gateway/go-gateway/internal/telemetry"
	"github.com/segmentio/kafka-go"
)

type KafkaProducerInterface interface {
	SendingPendingTransaction(ctx context.Context, event events.PendingTransaction) error
	Close() error
}

type KafkaConsumerInterface interface {
	Consume(ctx context.Context) error
	Close() error
}

type ProcessedEventStore interface {
	Exists(eventID string) (bool, error)
	Save(eventID, invoiceID string) error
}

type KafkaConfig struct {
	Brokers []string
	Topic   string
}

// WithTopic cria uma nova configuração com um tópico diferente
func (c *KafkaConfig) WithTopic(topic string) *KafkaConfig {
	return &KafkaConfig{
		Brokers: c.Brokers,
		Topic:   topic,
	}
}

func NewKafkaConfig() *KafkaConfig {
	broker := os.Getenv("KAFKA_BROKER")
	if broker == "" {
		broker = "localhost:9092"
	}

	topic := os.Getenv("KAFKA_PRODUCER_TOPIC")
	if topic == "" {
		topic = "pending_transactions"
	}

	return &KafkaConfig{
		Brokers: strings.Split(broker, ","),
		Topic:   topic,
	}
}

type KafkaProducer struct {
	writer  *kafka.Writer
	topic   string
	brokers []string
}

func NewKafkaProducer(config *KafkaConfig) *KafkaProducer {
	writer := &kafka.Writer{
		Addr:     kafka.TCP(config.Brokers...),
		Topic:    config.Topic,
		Balancer: &kafka.LeastBytes{},
	}

	slog.Info("kafka producer iniciado", "brokers", config.Brokers, "topic", config.Topic)
	return &KafkaProducer{
		writer:  writer,
		topic:   config.Topic,
		brokers: config.Brokers,
	}
}

func (s *KafkaProducer) SendingPendingTransaction(ctx context.Context, event events.PendingTransaction) error {
	value, err := json.Marshal(event)
	if err != nil {
		slog.Error("erro ao converter evento para json", "error", err)
		return err
	}

	var headers []kafka.Header
	if requestID := telemetry.RequestIDFromContext(ctx); requestID != "" {
		headers = append(headers, kafka.Header{Key: "x-request-id", Value: []byte(requestID)})
	}

	msg := kafka.Message{
		Value:   value,
		Headers: headers,
	}

	slog.Info("enviando mensagem para o kafka",
		"topic", s.topic,
		"message", string(value))

	if err := s.writer.WriteMessages(ctx, msg); err != nil {
		slog.Error("erro ao enviar mensagem para o kafka", "error", err)
		return err
	}

	slog.Info("mensagem enviada com sucesso para o kafka", "topic", s.topic)
	return nil
}

func (s *KafkaProducer) Close() error {
	slog.Info("fechando conexao com o kafka")
	return s.writer.Close()
}

type KafkaConsumer struct {
	reader         *kafka.Reader
	topic          string
	brokers        []string
	groupID        string
	invoiceService *InvoiceService
	processedStore ProcessedEventStore
	dlqWriter      *kafka.Writer
	dlqTopic       string
	maxRetries     int
}

func NewKafkaConsumer(
	config *KafkaConfig,
	groupID string,
	invoiceService *InvoiceService,
	processedStore ProcessedEventStore,
	dlqTopic string,
	maxRetries int,
) *KafkaConsumer {
	if maxRetries < 1 {
		maxRetries = 3
	}

	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers: config.Brokers,
		Topic:   config.Topic,
		GroupID: groupID,
	})

	dlqWriter := &kafka.Writer{
		Addr:     kafka.TCP(config.Brokers...),
		Topic:    dlqTopic,
		Balancer: &kafka.LeastBytes{},
	}

	slog.Info("kafka consumer iniciado",
		"brokers", config.Brokers,
		"topic", config.Topic,
		"group_id", groupID)

	return &KafkaConsumer{
		reader:         reader,
		topic:          config.Topic,
		brokers:        config.Brokers,
		groupID:        groupID,
		invoiceService: invoiceService,
		processedStore: processedStore,
		dlqWriter:      dlqWriter,
		dlqTopic:       dlqTopic,
		maxRetries:     maxRetries,
	}
}

func (c *KafkaConsumer) Consume(ctx context.Context) error {
	for {
		msg, err := c.reader.FetchMessage(ctx)
		if err != nil {
			slog.Error("erro ao ler mensagem do kafka", "error", err)
			time.Sleep(500 * time.Millisecond)
			continue
		}

		var result events.TransactionResult
		if err := json.Unmarshal(msg.Value, &result); err != nil {
			slog.Error("erro ao converter mensagem para TransactionResult", "error", err)
			c.sendToDLQ(ctx, msg.Value, "", "", "", "invalid_payload")
			c.commitMessage(ctx, msg)
			continue
		}

		if result.EventID == "" {
			slog.Error("mensagem sem event_id", "invoice_id", result.InvoiceID)
			c.sendToDLQ(ctx, msg.Value, result.EventID, result.InvoiceID, result.Status, "missing_event_id")
			c.commitMessage(ctx, msg)
			continue
		}

		processed, err := c.processedStore.Exists(result.EventID)
		if err != nil {
			slog.Error("erro ao checar deduplicacao", "error", err, "event_id", result.EventID)
			c.sendToDLQ(ctx, msg.Value, result.EventID, result.InvoiceID, result.Status, "dedup_check_failed")
			c.commitMessage(ctx, msg)
			continue
		}
		if processed {
			slog.Info("evento duplicado ignorado", "event_id", result.EventID, "invoice_id", result.InvoiceID)
			c.commitMessage(ctx, msg)
			continue
		}

		slog.Info("mensagem recebida do kafka",
			"topic", c.topic,
			"event_id", result.EventID,
			"invoice_id", result.InvoiceID,
			"status", result.Status)

		requestID := getHeader(msg.Headers, "x-request-id")

		// Processa o resultado da transação
		if err := c.processWithRetry(ctx, result, requestID); err != nil {
			slog.Error("erro ao processar resultado da transacao",
				"error", err,
				"invoice_id", result.InvoiceID,
				"status", result.Status,
				"event_id", result.EventID)
			c.sendToDLQ(ctx, msg.Value, result.EventID, result.InvoiceID, result.Status, err.Error())
			c.commitMessage(ctx, msg)
			continue
		}

		if err := c.processedStore.Save(result.EventID, result.InvoiceID); err != nil {
			slog.Error("erro ao salvar evento processado", "error", err, "event_id", result.EventID)
			time.Sleep(500 * time.Millisecond)
			continue
		}

		slog.Info("transação processada com sucesso",
			"invoice_id", result.InvoiceID,
			"event_id", result.EventID,
			"status", result.Status,
			"request_id", requestID)

		c.commitMessage(ctx, msg)
	}
}

func (c *KafkaConsumer) Close() error {
	slog.Info("fechando conexao com o kafka consumer")
	if c.dlqWriter != nil {
		_ = c.dlqWriter.Close()
	}
	return c.reader.Close()
}

func getHeader(headers []kafka.Header, key string) string {
	for _, header := range headers {
		if strings.EqualFold(header.Key, key) {
			return string(header.Value)
		}
	}
	return ""
}

func (c *KafkaConsumer) commitMessage(ctx context.Context, msg kafka.Message) {
	if err := c.reader.CommitMessages(ctx, msg); err != nil {
		slog.Error("erro ao commitar offset no kafka", "error", err, "topic", c.topic)
	}
}

type dlqMessage struct {
	EventID   string    `json:"event_id,omitempty"`
	InvoiceID string    `json:"invoice_id,omitempty"`
	Status    string    `json:"status,omitempty"`
	Error     string    `json:"error"`
	Payload   string    `json:"payload"`
	FailedAt  time.Time `json:"failed_at"`
}

func (c *KafkaConsumer) processWithRetry(ctx context.Context, result events.TransactionResult, requestID string) error {
	backoff := 200 * time.Millisecond
	for attempt := 1; attempt <= c.maxRetries; attempt++ {
		if err := c.invoiceService.ProcessTransactionResult(result.InvoiceID, result.ToDomainStatus(), requestID); err != nil {
			if attempt == c.maxRetries {
				return err
			}
			time.Sleep(backoff)
			backoff *= 2
			continue
		}
		return nil
	}
	return nil
}

func (c *KafkaConsumer) sendToDLQ(ctx context.Context, payload []byte, eventID, invoiceID, status, reason string) {
	if c.dlqWriter == nil {
		slog.Error("dlq writer nao configurado", "reason", reason)
		return
	}

	message := dlqMessage{
		EventID:   eventID,
		InvoiceID: invoiceID,
		Status:    status,
		Error:     reason,
		Payload:   string(payload),
		FailedAt:  time.Now(),
	}

	value, err := json.Marshal(message)
	if err != nil {
		slog.Error("erro ao serializar mensagem dlq", "error", err)
		return
	}

	if err := c.dlqWriter.WriteMessages(ctx, kafka.Message{Value: value}); err != nil {
		slog.Error("erro ao enviar mensagem para dlq", "error", err, "topic", c.dlqTopic)
	}
}
