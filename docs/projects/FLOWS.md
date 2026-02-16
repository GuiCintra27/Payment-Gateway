# Fluxos

[**PT-BR**](./FLOWS.md) | [EN](./en/FLOWS.md)

## Criar conta

1. UI envia `POST /accounts` com nome e email.
2. Gateway cria conta e retorna `api_key`.
3. Frontend salva cookies e redireciona para `/welcome`.

## Modo demo

1. UI envia `POST /demo`.
2. Gateway cria conta de demo + 5 transferências com status variados.
3. API key é exibida uma única vez no frontend.

## Criar transferência

1. UI envia `POST /invoice` com `X-API-KEY` e dados do pagamento.
2. Opcional: `Idempotency-Key` evita duplicidade para o mesmo payload.
3. Gateway valida payload, converte `amount` para centavos e cria transferência.
4. Se `amount <= 10000`:
   - transferência aprovada/rejeitada localmente (sem antifraude async).
   - critério atual: decisão aleatória no gateway (`~70% approved`, `~30% rejected`).
5. Se `amount > 10000`:
   - transferência fica `pending`.
   - evento `pending_transactions` e gravado na outbox.
   - worker da outbox publica no Kafka.

## Análise antifraude

1. Antifraude consome `pending_transactions`.
2. Aplica regras de fraude (specifications), em ordem:
   - `SUSPICIOUS_ACCOUNT`: rejeita se conta já estiver marcada suspeita.
   - `FREQUENT_HIGH_VALUE`: rejeita se volume de invoices recentes ultrapassar limite configurado.
   - `UNUSUAL_PATTERN`: rejeita se valor atual estiver acima da variação permitida sobre média histórica.
3. Se nenhuma regra disparar, aprova.
4. Persiste resultado no banco antifraude.
5. Publica `transactions_result` no Kafka.

## Atualização de status

1. Gateway consome `transactions_result`.
2. Faz deduplicação por `event_id`.
3. Atualiza status da transferência (transação DB).
4. Se aprovado, atualiza saldo da conta.
5. Registra evento na timeline (`invoice_events`).
6. Em falhas, envia payload para `transactions_result_dlq`.
