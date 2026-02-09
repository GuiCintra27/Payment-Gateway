import { Prisma } from '@prisma/client';

export class ProcessInvoiceFraudDto {
  event_id: string;
  invoice_id: string;
  account_id: string;
  amount: Prisma.Decimal;
  amountCents: number;
  requestId?: string;
}
