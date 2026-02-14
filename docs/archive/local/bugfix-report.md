# Relatorio - Bugs corrigidos (Gateway + Antifraude) - 2026/01/22

Objetivo: registrar os bugs confirmados, a correção aplicada e o motivo tecnico da escolha.

## 1) Antifraude nao consumia mensagens Kafka no dev

**Problema**  
O fluxo de `start-dev.sh` iniciava apenas o HTTP do NestJS. O consumer Kafka nao era iniciado, entao mensagens `pending_transactions` ficavam sem processamento.

**Correção aplicada**  
Mover o Kafka consumer para um worker separado e garantir que o `start-dev.sh` suba esse worker por padrao (`START_ANTIFRAUD_WORKER=true`).

**Por que e uma boa ideia**  
Garante isolamento entre HTTP e processamento assíncrono, e evita que o fluxo de antifraude fique parado no dev. O setup continua simples e mais proximo de producao.

Arquivos:

- `nestjs-anti-fraud/src/main.ts`
- `nestjs-anti-fraud/src/cmd/kafka.cmd.ts`
- `start-dev.sh`

## 2) Duplicidade de eventos gerava erro e reprocessamento

**Problema**  
Se o antifraude recebesse o mesmo `invoice_id` novamente, o service lançava erro e o consumer re-emitia falhas. Isso causava retries e ruído desnecessario.

**Correção aplicada**  
Tornar o processamento idempotente: se a invoice ja existe, retorna o resultado atual sem erro.

**Por que e uma boa ideia**  
Kafka pode entregar mensagens duplicadas. Idempotencia e a abordagem mais comum em sistemas distribuidos e evita reprocessamentos e DLQ desnecessarios.

Arquivo:

- `nestjs-anti-fraud/src/invoices/fraud/fraud.service.ts`

## 3) Atualizacao de saldo concorrente podia sobrescrever valores

**Problema**  
O saldo era lido fora da transacao e atualizado com um valor calculado em memoria. Em concorrencia, poderia ocorrer perda de updates.

**Correção aplicada**  
Criado `AddBalance(accountID, amount)` no repository para atualizar saldo de forma atomica com `balance = balance + amount`.

**Por que e uma boa ideia**  
Mantem consistencia em concorrencia sem exigir lock no application layer. E o padrao mais seguro para somas financeiras em banco.

Arquivos:

- `go-gateway/internal/repository/account_repository.go`
- `go-gateway/internal/service/account_service.go`
- `go-gateway/internal/service/demo_service.go`
- `go-gateway/internal/domain/repository.go`

## 4) Consistencia no fluxo de criacao de transacao

**Problema**  
Eventos ou atualizacao de saldo podiam ocorrer antes da invoice estar persistida, causando estado invalido em caso de erro no DB.

**Correção aplicada**  
Reordenar a criacao: salvar a invoice primeiro e so depois publicar evento/atualizar saldo.

**Por que e uma boa ideia**  
Reduz inconsistencia sem adicionar complexidade (outbox). Mantem o fluxo simples e mais correto para o nivel do projeto.

Arquivo:

- `go-gateway/internal/service/invoice_service.go`
