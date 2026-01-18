package response

import (
	"encoding/json"
	"net/http"
)

type ErrorResponse struct {
	Code    string            `json:"code"`
	Message string            `json:"message"`
	Details map[string]string `json:"details,omitempty"`
}

func JSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func Error(w http.ResponseWriter, status int, code, message string, details map[string]string) {
	JSON(w, status, ErrorResponse{
		Code:    code,
		Message: message,
		Details: details,
	})
}
