# Corrections Log - 2026/01/22

Registro das correcoes aplicadas para aumentar confiabilidade, seguranca e consistencia.

## Kafka e resiliencia

- Offset commit apos processamento (FetchMessage + CommitMessages) para evitar perda de mensagens em falha.
- Retry nao comita quando o dedup save falha, garantindo reprocessamento seguro.
- Consumer isolado em worker (NestJS) para garantir consumo ativo no dev e facilitar observabilidade.

## Consistencia de transacoes

- Aplicacao atomica de status + saldo via transacao no repositorio do gateway.
- UpdateStatus idempotente quando o status destino e o mesmo, evitando falhas em retry.

## Seguranca

- Geracao de API key valida erro/bytes do crypto/rand.
- API_KEY_SECRET obrigatorio fora de ambiente dev (ENV/APP_ENV).

## Dinheiro e precisao

- Valores monetarios em centavos (int64) no gateway.
- Migrations para balance_cents/amount_cents.
- DTOs convertem cents <-> float para manter compatibilidade da API.

## Infra e dev workflow

- docker-compose com worker e service de migrations do antifraude.
- start-dev.sh com porta e status do worker.

## Docs atualizados

- Arquitetura, observabilidade, infraestrutura, fluxo e seguranca.
