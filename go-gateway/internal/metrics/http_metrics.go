package metrics

import (
	"expvar"
	"time"
)

type HTTPMetrics struct {
	requestsTotal         *expvar.Map
	requestsErrors        *expvar.Map
	requestDurationMsSum  *expvar.Map
	requestDurationMsCount *expvar.Map
	inflight              *expvar.Int
}

func NewHTTPMetrics() *HTTPMetrics {
	return &HTTPMetrics{
		requestsTotal:         expvar.NewMap("http_requests_total"),
		requestsErrors:        expvar.NewMap("http_requests_errors_total"),
		requestDurationMsSum:  expvar.NewMap("http_request_duration_ms_sum"),
		requestDurationMsCount: expvar.NewMap("http_request_duration_ms_count"),
		inflight:              expvar.NewInt("http_requests_inflight"),
	}
}

func (m *HTTPMetrics) Observe(method, path string, status int, duration time.Duration) {
	key := method + " " + path
	m.requestsTotal.Add(key, 1)
	if status >= 400 {
		m.requestsErrors.Add(key, 1)
	}
	m.requestDurationMsSum.Add(key, duration.Milliseconds())
	m.requestDurationMsCount.Add(key, 1)
}

func (m *HTTPMetrics) IncInFlight() {
	m.inflight.Add(1)
}

func (m *HTTPMetrics) DecInFlight() {
	m.inflight.Add(-1)
}

var HTTP = NewHTTPMetrics()
