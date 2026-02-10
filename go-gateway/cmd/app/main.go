// @title Payment Gateway API
// @version 1.0
// @description Gateway API para contas e transferencias com antifraude assincrono.
// @host localhost:8080
// @BasePath /
// @schemes http
package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"
	"strconv"
	"time"

	_ "github.com/GuiCintra27/payment-gateway/go-gateway/docs"
	"github.com/GuiCintra27/payment-gateway/go-gateway/internal/outbox"
	"github.com/GuiCintra27/payment-gateway/go-gateway/internal/repository"
	"github.com/GuiCintra27/payment-gateway/go-gateway/internal/service"
	"github.com/GuiCintra27/payment-gateway/go-gateway/internal/web/handlers"
	"github.com/GuiCintra27/payment-gateway/go-gateway/internal/web/middleware"
	"github.com/GuiCintra27/payment-gateway/go-gateway/internal/web/server"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
	"github.com/segmentio/kafka-go"
)

// getEnv retorna variável de ambiente ou valor padrão se não definida
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func main() {
	// Carrega variaveis de ambiente locais quando existirem
	if err := godotenv.Load(".env"); err != nil {
		log.Print("missing .env, using defaults")
	}
	if err := godotenv.Load(".env.local"); err != nil {
		log.Print("missing .env.local, using defaults")
	}

	// Configura conexão com PostgreSQL usando variáveis de ambiente
	connStr := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		getEnv("DB_HOST", "db"),
		getEnv("DB_PORT", "5432"),
		getEnv("DB_USER", "postgres"),
		getEnv("DB_PASSWORD", "postgres"),
		getEnv("DB_NAME", "gateway"),
		getEnv("DB_SSL_MODE", "disable"),
	)

	// Inicializa conexão com o banco
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal("Error connecting to database: ", err)
	}
	defer db.Close()

	// Configura e inicializa o Kafka
	baseKafkaConfig := service.NewKafkaConfig()

	// Configura e inicializa o produtor Kafka
	producerTopic := getEnv("KAFKA_PRODUCER_TOPIC", "pending_transactions")
	producerConfig := baseKafkaConfig.WithTopic(producerTopic)
	kafkaProducer := service.NewKafkaProducer(producerConfig)
	defer kafkaProducer.Close()

	// Inicializa camadas da aplicação (repository -> service -> server)
	accountRepository := repository.NewAccountRepository(db)
	accountService := service.NewAccountService(accountRepository)

	invoiceRepository := repository.NewInvoiceRepository(db)
	invoiceService := service.NewInvoiceService(invoiceRepository, *accountService, kafkaProducer)
	demoService := service.NewDemoService(accountRepository, invoiceRepository)
	healthHandler := handlers.NewHealthHandler(db, baseKafkaConfig.Brokers)
	idempotencyRepository := repository.NewIdempotencyRepository(db)

	ratePerMinute, err := strconv.Atoi(getEnv("API_RATE_LIMIT_PER_MINUTE", "60"))
	if err != nil {
		log.Printf("invalid API_RATE_LIMIT_PER_MINUTE, using default: %v", err)
		ratePerMinute = 60
	}
	rateBurst, err := strconv.Atoi(getEnv("API_RATE_LIMIT_BURST", "10"))
	if err != nil {
		log.Printf("invalid API_RATE_LIMIT_BURST, using default: %v", err)
		rateBurst = 10
	}
	rateLimitMiddleware := middleware.NewRateLimitMiddleware(ratePerMinute, rateBurst)

	// Configura e inicializa o consumidor Kafka
	consumerTopic := getEnv("KAFKA_CONSUMER_TOPIC", "transactions_result")
	consumerConfig := baseKafkaConfig.WithTopic(consumerTopic)
	groupID := getEnv("KAFKA_CONSUMER_GROUP_ID", "gateway-group")
	dlqTopic := getEnv("KAFKA_DLQ_TOPIC", "transactions_result_dlq")
	maxRetries, err := strconv.Atoi(getEnv("KAFKA_CONSUMER_MAX_RETRIES", "3"))
	if err != nil {
		log.Printf("invalid KAFKA_CONSUMER_MAX_RETRIES, using default: %v", err)
		maxRetries = 3
	}
	processedEventRepository := repository.NewProcessedEventRepository(db)
	kafkaConsumer := service.NewKafkaConsumer(
		consumerConfig,
		groupID,
		invoiceService,
		processedEventRepository,
		dlqTopic,
		maxRetries,
	)
	defer kafkaConsumer.Close()

	// Inicia o consumidor Kafka em uma goroutine
	go func() {
		if err := kafkaConsumer.Consume(context.Background()); err != nil {
			log.Printf("Error consuming kafka messages: %v", err)
		}
	}()

	// Inicia o worker de outbox para publicar eventos pendentes
	outboxRepo := outbox.NewRepository(db)
	outboxWriter := &kafka.Writer{
		Addr:     kafka.TCP(baseKafkaConfig.Brokers...),
		Topic:    producerTopic,
		Balancer: &kafka.LeastBytes{},
	}
	defer outboxWriter.Close()
	outboxWorker := outbox.NewWorker(outboxRepo, outboxWriter, 500*time.Millisecond, 10, 5)
	go outboxWorker.Start(context.Background())

	// Configura e inicia o servidor HTTP
	port := getEnv("HTTP_PORT", "8080")
	srv := server.NewServer(accountService, invoiceService, idempotencyRepository, demoService, healthHandler, rateLimitMiddleware, port)
	srv.ConfigureRoutes()

	if err := srv.Start(); err != nil {
		log.Fatal("Error starting server: ", err)
	}
}
