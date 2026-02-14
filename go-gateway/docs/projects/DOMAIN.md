# Dominio

## Status de transferencia

- `pending`
- `approved`
- `rejected`

## Regras principais

1. Ao criar transferencia, o gateway valida o payload.
2. Se `amount > 10000`:
   - status inicial `pending`.
   - evento `pending_transactions` e enviado ao Kafka.
3. Se `amount <= 10000`:
   - status aprovado ou rejeitado localmente.
   - decisao aleatoria com 70% de aprovacao.
4. Quando o antifraude retorna o resultado:
   - status so pode ser atualizado se a transferencia estiver `pending`.
   - se aprovado, o saldo da conta e atualizado.

## Idempotencia e deduplicacao

- Eventos de resultado tem `event_id`.
- O gateway ignora eventos duplicados usando `processed_events`.
