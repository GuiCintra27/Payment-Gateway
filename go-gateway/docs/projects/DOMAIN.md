# Dominio

## Status de transferência

- `pending`
- `approved`
- `rejected`

## Regras principais

1. Ao criar transferência, o gateway valida o payload.
2. Se `amount > 10000`:
   - status inicial `pending`.
   - evento `pending_transactions` e enviado ao Kafka.
3. Se `amount <= 10000`:
   - status aprovado ou rejeitado localmente.
   - decisao aleatoria com 70% de aprovação.
4. Quando o antifraude retorna o resultado:
   - status só pode ser atualizado se a transferência estiver `pending`.
   - se aprovado, o saldo da conta e atualizado.

## Idempotencia e deduplicacao

- Eventos de resultado tem `event_id`.
- O gateway ignora eventos duplicados usando `processed_events`.
