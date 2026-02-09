import { FraudReason, Invoice } from '@prisma/client';

export class InvoiceProcessedEvent {
  constructor(
    readonly invoice: Invoice,
    readonly fraudResult: {
      hasFraud: boolean;
      reason?: FraudReason;
      description?: string;
    },
    readonly event_id: string,
    readonly requestId?: string,
  ) {}
}
