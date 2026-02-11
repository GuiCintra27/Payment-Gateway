package server

import (
	"expvar"
	"net/http"

	"github.com/GuiCintra27/payment-gateway/go-gateway/internal/repository"
	"github.com/GuiCintra27/payment-gateway/go-gateway/internal/service"
	"github.com/GuiCintra27/payment-gateway/go-gateway/internal/web/handlers"
	"github.com/GuiCintra27/payment-gateway/go-gateway/internal/web/middleware"
	"github.com/go-chi/chi/v5"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	httpSwagger "github.com/swaggo/http-swagger/v2"
)

type Server struct {
	router         *chi.Mux
	server         *http.Server
	accountService *service.AccountService
	invoiceService *service.InvoiceService
	idempotency    *repository.IdempotencyRepository
	demoService    *service.DemoService
	healthHandler  *handlers.HealthHandler
	rateLimit      *middleware.RateLimitMiddleware
	port           string
}

func NewServer(
	accountService *service.AccountService,
	invoiceService *service.InvoiceService,
	idempotencyStore *repository.IdempotencyRepository,
	demoService *service.DemoService,
	healthHandler *handlers.HealthHandler,
	rateLimit *middleware.RateLimitMiddleware,
	port string,
) *Server {
	return &Server{
		router:         chi.NewRouter(),
		accountService: accountService,
		invoiceService: invoiceService,
		idempotency:    idempotencyStore,
		demoService:    demoService,
		healthHandler:  healthHandler,
		rateLimit:      rateLimit,
		port:           port,
	}
}

func (s *Server) ConfigureRoutes() {
	accountHandler := handlers.NewAccountHandler(s.accountService)
	invoiceHandler := handlers.NewInvoiceHandler(s.invoiceService, s.idempotency)
	authMiddleware := middleware.NewAuthMiddleware(s.accountService)
	demoHandler := handlers.NewDemoHandler(s.demoService)

	s.router.Use(middleware.RequestID)
	s.router.Use(middleware.RequestLogger)
	s.router.Use(middleware.Metrics)
	s.router.Use(middleware.SecurityHeaders)
	s.router.Use(middleware.CORS)

	s.router.With(s.rateLimit.Limit).Post("/accounts", accountHandler.Create)
	s.router.With(s.rateLimit.Limit).Get("/accounts", accountHandler.Get)
	s.router.With(s.rateLimit.Limit).Post("/demo", demoHandler.Create)
	s.router.Get("/swagger/*", httpSwagger.WrapHandler)
	s.router.Get("/health", s.healthHandler.Liveness)
	s.router.Get("/ready", s.healthHandler.Readiness)
	s.router.Handle("/metrics", expvar.Handler())
	s.router.Handle("/metrics/prom", promhttp.Handler())

	s.router.Group(func(r chi.Router) {
		r.Use(authMiddleware.Authenticate)
		r.Use(s.rateLimit.Limit)
		r.Post("/invoice", invoiceHandler.Create)
		r.Get("/invoice/{id}", invoiceHandler.GetByID)
		r.Get("/invoice/{id}/events", invoiceHandler.ListEvents)
		r.Get("/invoice", invoiceHandler.ListByAccount)
	})
}

func (s *Server) Start() error {
	s.server = &http.Server{
		Addr:    ":" + s.port,
		Handler: s.router,
	}
	return s.server.ListenAndServe()
}
