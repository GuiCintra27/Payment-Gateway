# Script de demo (5-7 min)

Objetivo: demonstrar arquitetura, fluxo principal, confiabilidade e operacao do Payment Gateway em uma apresentacao curta.

## Preparacao (antes da demo)

1. Subir a stack:

```bash
./start-dev.sh
```

2. Confirmar endpoints:

```bash
curl -s http://localhost:8080/health
curl -s http://localhost:3001/metrics >/dev/null && echo "antifraud api ok"
curl -s http://localhost:3101/metrics >/dev/null && echo "antifraud worker ok"
```

3. Definir variaveis da demo:

```bash
export BASE_URL="http://localhost:8080"
export REQUEST_ID="demo-$(date +%s)"
```

## Roteiro por tempo

### 00:00-00:45 - Contexto

- Problema: processar transferencias com decisao antifraude assincrona para casos de alto valor.
- Arquitetura: Next.js (UI), Go Gateway (API), NestJS (antifraude API + worker), Kafka e Postgres.
- Resultado: fluxo resiliente com idempotencia, outbox/inbox, deduplicacao e DLQ.

### 00:45-02:00 - Fluxo principal (conta + invoice pending)

1. Criar conta:

```bash
ACCOUNT_RESPONSE=$(curl -s -X POST "$BASE_URL/accounts" \
  -H "Content-Type: application/json" \
  -d '{"name":"Demo Company","email":"demo@company.local"}')
echo "$ACCOUNT_RESPONSE"
export API_KEY=$(echo "$ACCOUNT_RESPONSE" | sed -n 's/.*"api_key":"\([^"]*\)".*/\1/p')
echo "API_KEY=$API_KEY"
```

2. Criar invoice de alto valor (vai para `pending`):

```bash
INVOICE_RESPONSE=$(curl -s -X POST "$BASE_URL/invoice" \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $API_KEY" \
  -H "X-Request-Id: $REQUEST_ID" \
  -H "Idempotency-Key: demo-pending-001" \
  -d '{
    "amount": 15200,
    "description": "Transferencia corporativa - lote demo",
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

3. Aguardar mudanca de status:

```bash
for i in $(seq 1 15); do
  CURRENT=$(curl -s "$BASE_URL/invoice/$INVOICE_ID" -H "X-API-KEY: $API_KEY")
  STATUS=$(echo "$CURRENT" | sed -n 's/.*"status":"\([^"]*\)".*/\1/p')
  echo "tentativa=$i status=$STATUS"
  [ "$STATUS" != "pending" ] && break
  sleep 1
done
```

### 02:00-03:30 - Confiabilidade

1. Timeline de eventos (auditoria):

```bash
curl -s "$BASE_URL/invoice/$INVOICE_ID/events" -H "X-API-KEY: $API_KEY"
```

2. Idempotencia (mesma key + mesmo payload, sem duplicar):

```bash
curl -s -X POST "$BASE_URL/invoice" \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: $API_KEY" \
  -H "Idempotency-Key: demo-pending-001" \
  -d '{
    "amount": 15200,
    "description": "Transferencia corporativa - lote demo",
    "payment_type": "credit_card",
    "card_number": "4242424242424242",
    "cvv": "123",
    "expiry_month": 12,
    "expiry_year": 2030,
    "cardholder_name": "Demo Owner"
  }'
```

Falar durante a demo:
- Outbox evita perda de evento entre persistencia e publicacao.
- Inbox/dedup evita reprocessamento duplicado.
- Falhas do consumer seguem para DLQ com replay controlado.

### 03:30-05:00 - Operacao e observabilidade

1. Correlation por request id:

```bash
echo "request_id usado: $REQUEST_ID"
```

2. Metricas Prometheus:

```bash
curl -s http://localhost:8080/metrics/prom | head -n 30
curl -s http://localhost:3001/metrics/prom | head -n 30
curl -s http://localhost:3101/metrics/prom | head -n 30
```

3. Logs no Grafana/Loki (se stack de logging estiver ativa):

```bash
docker compose -f docker-compose.logging.yaml up -d
echo "Abra o Grafana e filtre por request_id=$REQUEST_ID"
```

### 05:00-06:30 - Encerramento

- Tradeoffs: simplicidade de operacao local vs. componentes separados para producao.
- Evolucao: hardening de testes cross-service e automatizacao de release ja integrada ao CI.
- Mensagem final: projeto pronto para demonstrar nivel pleno+ em backend distribuido.

## Roteiro resumido para cola rapida

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
  -d '{"amount":15200,"description":"Transferencia demo","payment_type":"credit_card","card_number":"4242424242424242","cvv":"123","expiry_month":12,"expiry_year":2030,"cardholder_name":"Demo Owner"}')
export INVOICE_ID=$(echo "$INVOICE_RESPONSE" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')

curl -s "$BASE_URL/invoice/$INVOICE_ID/events" -H "X-API-KEY: $API_KEY"
echo "request_id=$REQUEST_ID"
```
