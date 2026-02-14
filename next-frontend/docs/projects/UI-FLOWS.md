# Fluxos de UI

## Home (`/`)

- Formulario para criar conta (nome + email).
- Botao para entrar no modo demo.
- Link para login com API key existente.

## Login (`/login`)

- Formulario simples para API key.
- Redireciona para `/invoices` em caso de sucesso.

## Welcome (`/welcome`)

- Exibe a API key apenas uma vez.
- Botao para copiar e seguir para a lista.

## Lista de transferências (`/invoices`)

- Lista com status e valores.
- Página de detalhes via `/invoices/[id]`.
- Paginação via query params `page` e `size`.

## Criar transferência (`/invoices/create`)

- Formulario de cartão + dados da transferência.
- Envia via Server Action para `POST /invoice`.
- Erros são exibidos no topo.
