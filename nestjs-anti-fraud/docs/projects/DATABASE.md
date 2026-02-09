# Database

## Schema (Prisma)

### Account

- `id` (string, pk)
- `isSuspicious` (boolean)
- `createdAt`, `updatedAt`

### Invoice

- `id` (string, pk)
- `accountId` (fk -> Account)
- `amount` (decimal)
- `status` (APPROVED | REJECTED)
- `createdAt`, `updatedAt`
- `fraudHistory` (optional)

### FraudHistory

- `id` (uuid, pk)
- `invoiceId` (unique)
- `reason` (SUSPICIOUS_ACCOUNT | UNUSUAL_PATTERN | FREQUENT_HIGH_VALUE)
- `description` (optional)
- `createdAt`, `updatedAt`
