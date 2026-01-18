# Flows

## Criar conta

1. UI envia `POST /accounts` com nome e email.
2. Gateway cria conta e retorna `api_key`.
3. Frontend salva cookies e redireciona para `/welcome`.

## Modo demo

1. UI envia `POST /demo`.
2. Gateway cria conta de demo + 5 transferencias com status variados.
3. API key e exibida uma unica vez no frontend.

## Criar transferencia

1. UI envia `POST /invoice` com `X-API-KEY` e dados do pagamento.
2. Gateway valida payload e cria transferencia.
3. Se `amount <= 10000`:
   - transferencia aprovada/rejeitada localmente.
4. Se `amount > 10000`:
   - transferencia fica `pending`.
   - evento `pending_transactions` e publicado no Kafka.

## Analise antifraude

1. Antifraude consome `pending_transactions`.
2. Aplica regras de fraude (specifications).
3. Persiste resultado no banco antifraude.
4. Publica `transactions_result` no Kafka.

## Atualizacao de status

1. Gateway consome `transactions_result`.
2. Faz deduplicacao por `event_id`.
3. Atualiza status da transferencia.
4. Se aprovado, atualiza saldo da conta.
5. Em falhas, envia payload para `transactions_result_dlq`.
