package telemetry

import "context"

type requestIDKey struct{}

func WithRequestID(ctx context.Context, requestID string) context.Context {
	return context.WithValue(ctx, requestIDKey{}, requestID)
}

func RequestIDFromContext(ctx context.Context) string {
	if value := ctx.Value(requestIDKey{}); value != nil {
		if requestID, ok := value.(string); ok {
			return requestID
		}
	}
	return ""
}
