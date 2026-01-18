package handlers

import (
	"net/http"

	"github.com/GuiCintra27/payment-gateway/go-gateway/internal/service"
	"github.com/GuiCintra27/payment-gateway/go-gateway/internal/web/response"
)

type DemoHandler struct {
	demoService *service.DemoService
}

func NewDemoHandler(demoService *service.DemoService) *DemoHandler {
	return &DemoHandler{demoService: demoService}
}

// Create processa POST /demo
func (h *DemoHandler) Create(w http.ResponseWriter, r *http.Request) {
	output, err := h.demoService.SeedDemo()
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "internal_error", "internal server error", nil)
		return
	}

	response.JSON(w, http.StatusCreated, output)
}
