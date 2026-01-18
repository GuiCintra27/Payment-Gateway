package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/GuiCintra27/payment-gateway/go-gateway/internal/web/response"
)

type RateLimitMiddleware struct {
	limiter *rateLimiter
}

type rateLimiter struct {
	ratePerSecond float64
	burst         float64
	mu            sync.Mutex
	clients       map[string]*clientLimiter
}

type clientLimiter struct {
	tokens   float64
	lastSeen time.Time
	lastTime time.Time
}

func NewRateLimitMiddleware(ratePerMinute int, burst int) *RateLimitMiddleware {
	if ratePerMinute <= 0 {
		ratePerMinute = 60
	}
	if burst <= 0 {
		burst = 10
	}

	limiter := &rateLimiter{
		ratePerSecond: float64(ratePerMinute) / 60.0,
		burst:         float64(burst),
		clients:       make(map[string]*clientLimiter),
	}

	return &RateLimitMiddleware{limiter: limiter}
}

func (m *RateLimitMiddleware) Limit(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		apiKey := r.Header.Get("X-API-KEY")
		if apiKey == "" {
			next.ServeHTTP(w, r)
			return
		}

		if !m.limiter.allow(apiKey) {
			response.Error(w, http.StatusTooManyRequests, "rate_limited", "too many requests", nil)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func (l *rateLimiter) allow(key string) bool {
	now := time.Now()

	l.mu.Lock()
	defer l.mu.Unlock()

	client, ok := l.clients[key]
	if !ok {
		l.clients[key] = &clientLimiter{
			tokens:   l.burst - 1,
			lastSeen: now,
			lastTime: now,
		}
		return true
	}

	elapsed := now.Sub(client.lastTime).Seconds()
	client.tokens = min(l.burst, client.tokens+(elapsed*l.ratePerSecond))
	client.lastTime = now
	client.lastSeen = now

	if client.tokens < 1 {
		return false
	}

	client.tokens -= 1
	return true
}

func min(a, b float64) float64 {
	if a < b {
		return a
	}
	return b
}
