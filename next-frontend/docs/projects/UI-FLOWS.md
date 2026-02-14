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

## Lista de transferencias (`/invoices`)

- Lista com status e valores.
- Pagina de detalhes via `/invoices/[id]`.
- Paginacao via query params `page` e `size`.

## Criar transferencia (`/invoices/create`)

- Formulario de cartao + dados da transferencia.
- Envia via Server Action para `POST /invoice`.
- Erros sao exibidos no topo.
