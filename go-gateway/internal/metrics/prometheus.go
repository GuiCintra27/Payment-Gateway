package metrics

import (
	"strconv"
	"time"

	"github.com/prometheus/client_golang/prometheus"
)

type PrometheusMetrics struct {
	requestsTotal   *prometheus.CounterVec
	requestsErrors  *prometheus.CounterVec
	requestDuration *prometheus.HistogramVec
	inflight        prometheus.Gauge
}

func NewPrometheusMetrics() *PrometheusMetrics {
	requestsTotal := prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "http_requests_total",
			Help: "Total HTTP requests by method, path and status.",
		},
		[]string{"method", "path", "status"},
	)
	requestsErrors := prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "http_requests_errors_total",
			Help: "Total HTTP errors by method, path and status.",
		},
		[]string{"method", "path", "status"},
	)
	requestDuration := prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "http_request_duration_seconds",
			Help:    "HTTP request duration in seconds.",
			Buckets: prometheus.DefBuckets,
		},
		[]string{"method", "path"},
	)
	inflight := prometheus.NewGauge(prometheus.GaugeOpts{
		Name: "http_requests_inflight",
		Help: "Current number of in-flight HTTP requests.",
	})

	prometheus.MustRegister(requestsTotal, requestsErrors, requestDuration, inflight)

	return &PrometheusMetrics{
		requestsTotal:   requestsTotal,
		requestsErrors:  requestsErrors,
		requestDuration: requestDuration,
		inflight:        inflight,
	}
}

func (m *PrometheusMetrics) Observe(method, path string, status int, duration time.Duration) {
	statusLabel := strconv.Itoa(status)
	m.requestsTotal.WithLabelValues(method, path, statusLabel).Inc()
	if status >= 400 {
		m.requestsErrors.WithLabelValues(method, path, statusLabel).Inc()
	}
	m.requestDuration.WithLabelValues(method, path).Observe(duration.Seconds())
}

func (m *PrometheusMetrics) IncInFlight() {
	m.inflight.Inc()
}

func (m *PrometheusMetrics) DecInFlight() {
	m.inflight.Dec()
}

var Prom = NewPrometheusMetrics()
