# Demo Script (5-7 min)

[PT-BR](../DEMO-SCRIPT.md) | **EN**

Goal: present architecture, main flow, reliability, and operations of the Payment Gateway in a short demo.

## Preparation (before demo)

1. Start the stack:

```bash
./start-dev.sh
```

2. Confirm endpoints:

```bash
curl -s http://localhost:8080/health
curl -s http://localhost:3001/metrics >/dev/null && echo "antifraud api ok"
curl -s http://localhost:3101/metrics >/dev/null && echo "antifraud worker ok"
```

3. Set demo variables:

```bash
export BASE_URL="http://localhost:8080"
export REQUEST_ID="demo-$(date +%s)"
```

## Timeboxed Script

### 00:00-00:45 - Context

- Problem: process transfers with asynchronous anti-fraud decisions for high-value operations.
- Architecture: Next.js (UI), Go Gateway (API), NestJS (anti-fraud API + worker), Kafka, and Postgres.
- Outcome: resilient flow with idempotency, outbox/inbox, deduplication, and DLQ.

### 00:45-02:00 - Main flow (account + pending invoice)

1. Create account:

```bash
ACCOUNT_RESPONSE=$(curl -s -X POST "$BASE_URL/accounts" \
  -H "Content-Type: application/json" \
  -d '{"name":"Demo Company","email":"demo@company.local"}')
echo "$ACCOUNT_RESPONSE"
export API_KEY=$(echo "$ACCOUNT_RESPONSE" | sed -n 's/.*"api_key":"\([^"]*\)".*/\1/p')
echo "API_KEY=$API_KEY"
```

2. Create high-value invoice (goes to `pending`):

```bash
INVOICE_RESPONSE=$(curl -s -X POST "$BASE_URL/invoice" \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $API_KEY" \
  -H "X-Request-Id: $REQUEST_ID" \
  -H "Idempotency-Key: demo-pending-001" \
  -d '{
    "amount": 15200,
    "description": "Corporate transfer - demo batch",
    "payment_type": "credit_card",
    "card_number": "4242424242424242",
    "cvv": "123",
    "expiry_month": 12,
    "expiry_year": 2030,
    "cardholder_name": "Demo Owner"
  }')
echo "$INVOICE_RESPONSE"
export INVOICE_ID=$(echo "$INVOICE_RESPONSE" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')
echo "INVOICE_ID=$INVOICE_ID"
```

3. Wait for status transition:

```bash
for i in $(seq 1 15); do
  CURRENT=$(curl -s "$BASE_URL/invoice/$INVOICE_ID" -H "X-API-KEY: $API_KEY")
  STATUS=$(echo "$CURRENT" | sed -n 's/.*"status":"\([^"]*\)".*/\1/p')
  echo "attempt=$i status=$STATUS"
  [ "$STATUS" != "pending" ] && break
  sleep 1
done
```

### 02:00-03:30 - Reliability

1. Event timeline (audit):

```bash
curl -s "$BASE_URL/invoice/$INVOICE_ID/events" -H "X-API-KEY: $API_KEY"
```

2. Idempotency (same key + same payload, no duplicate):

```bash
curl -s -X POST "$BASE_URL/invoice" \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $API_KEY" \
  -H "Idempotency-Key: demo-pending-001" \
  -d '{
    "amount": 15200,
    "description": "Corporate transfer - demo batch",
    "payment_type": "credit_card",
    "card_number": "4242424242424242",
    "cvv": "123",
    "expiry_month": 12,
    "expiry_year": 2030,
    "cardholder_name": "Demo Owner"
  }'
```

Talking points:
- Outbox prevents event loss between persistence and publish.
- Inbox/dedup prevents duplicate processing.
- Consumer failures go to DLQ with controlled replay.

### 03:30-05:00 - Operations and observability

1. Correlation by request id:

```bash
echo "request_id used: $REQUEST_ID"
```

2. Prometheus metrics:

```bash
curl -s http://localhost:8080/metrics/prom | head -n 30
curl -s http://localhost:3001/metrics/prom | head -n 30
curl -s http://localhost:3101/metrics/prom | head -n 30
```

3. Logs in Grafana/Loki (if logging stack is up):

```bash
docker compose -f docker-compose.logging.yaml up -d
echo "Open Grafana and filter by request_id=$REQUEST_ID"
```

### 05:00-06:30 - Closing

- Tradeoffs: local operational simplicity vs. separated production components.
- Evolution: stronger cross-service tests and release automation already integrated into CI.
- Final message: portfolio-ready project for senior backend/distributed systems discussion.

## Quick Cheat Sheet

```bash
export BASE_URL="http://localhost:8080"
export REQUEST_ID="demo-$(date +%s)"

ACCOUNT_RESPONSE=$(curl -s -X POST "$BASE_URL/accounts" \
  -H "Content-Type: application/json" \
  -d '{"name":"Demo Company","email":"demo@company.local"}')
export API_KEY=$(echo "$ACCOUNT_RESPONSE" | sed -n 's/.*"api_key":"\([^"]*\)".*/\1/p')

INVOICE_RESPONSE=$(curl -s -X POST "$BASE_URL/invoice" \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $API_KEY" \
  -H "X-Request-Id: $REQUEST_ID" \
  -H "Idempotency-Key: demo-pending-001" \
  -d '{"amount":15200,"description":"Demo transfer","payment_type":"credit_card","card_number":"4242424242424242","cvv":"123","expiry_month":12,"expiry_year":2030,"cardholder_name":"Demo Owner"}')
export INVOICE_ID=$(echo "$INVOICE_RESPONSE" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')

curl -s "$BASE_URL/invoice/$INVOICE_ID/events" -H "X-API-KEY: $API_KEY"
echo "request_id=$REQUEST_ID"
```
