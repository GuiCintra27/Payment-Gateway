# Plano - Validacoes de formularios (React Hook Form)

Objetivo: padronizar validacao, tipagem e exibicao de erros nos formularios do frontend usando React Hook Form.

## Escopo (formularios)

1) Criar conta (home)
- Arquivo atual: `next-frontend/src/app/page.tsx`
- Campos: `name`, `email`

2) Login (API key)
- Arquivo atual: `next-frontend/src/app/login/AuthForm.tsx`
- Campos: `apiKey`

3) Criar transferencia
- Arquivos atuais:
  - `next-frontend/src/app/invoices/create/InvoiceForm.tsx`
  - `next-frontend/src/app/invoices/create/create-invoice-action.ts`
- Campos: `amount`, `description`, `cardNumber`, `expiryDate`, `cvv`, `cardholderName`

## Dependencias

- `react-hook-form`
- `zod`
- `@hookform/resolvers`

## Estrategia tecnica

- Manter Server Actions para escrever cookies (conta e login).
- Formularios viram Client Components com RHF.
- `onSubmit` vai:
  - validar via Zod
  - montar `FormData`
  - chamar Server Action
- Server Actions passam a retornar resultado estruturado ao inves de `redirect` imediato.
  - Exemplo retorno: `{ ok: boolean, fieldErrors?: Record<string,string>, formError?: string, redirectTo?: string }`
  - No client, exibir erros com RHF e usar `router.push()` quando `redirectTo` existir.

## Estrutura sugerida

- `next-frontend/src/lib/forms/schemas.ts`
  - `createAccountSchema`
  - `loginSchema`
  - `createTransferSchema`

- `next-frontend/src/lib/forms/types.ts`
  - tipos inferidos via Zod (`z.infer`)

- `next-frontend/src/lib/forms/api-errors.ts`
  - helper para mapear erro do gateway (`code` + `details`) para `setError` do RHF

## Regras de validacao (alinhadas ao gateway)

### Criar conta
- `name`: obrigatorio, min 2 caracteres
- `email`: obrigatorio, formato valido

### Login
- `apiKey`: obrigatorio, min 16 caracteres (ajustar conforme padrao do gateway)

### Criar transferencia
- `amount`: numero > 0
- `description`: obrigatorio, min 3
- `cardNumber`: somente digitos, 12-19 caracteres
- `expiryDate`: formato `MM/AA` ou `MM/AAAA`, mes 1-12
- `cvv`: somente digitos, 3-4 caracteres
- `cardholderName`: obrigatorio, min 3

## Tratamento de erros (UI)

- Erros de campo aparecem abaixo de cada input.
- Erro geral (ex: 500) aparece em Alert no topo do formulario.
- Se o gateway retornar `details`, mapear para campos:
  - `amount`, `description`, `card_number`, `cvv`, `expiry_month`, `expiry_year`, `cardholder_name`

## Etapas de implementacao

1) Preparar dependencias e utilitarios
- adicionar pacotes ao `next-frontend/package.json`
- criar `lib/forms/schemas.ts` e `types.ts`

2) Criar helpers de erro
- `api-errors.ts` para converter payload do gateway em `setError`

3) Refatorar formularios
- Home: criar componente client `CreateAccountForm`
- Login: migrar `AuthForm` para RHF
- Transferencia: migrar `InvoiceForm` para RHF

4) Ajustar Server Actions
- retornar objeto com status ao inves de `redirect`
- padronizar payload de erro

5) UX e estados
- desabilitar botao enquanto envia
- mostrar loading/feedback
- limpar erros ao editar

6) Verificacao
- validar erros de campo (client)
- simular erro do gateway (email duplicado, invalid_api_key, validation_error)
- conferir redirecionamentos

## Resultado esperado

- Tipagem centralizada e consistente.
- Erros exibidos no lugar certo sem query params.
- Fluxo de submit mais claro para usuario.
