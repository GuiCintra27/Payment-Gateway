import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { FraudService } from './fraud/fraud.service';
import { MetricsService } from '../metrics/metrics.service';

export type PendingInvoicesMessage = {
  event_id: string;
  account_id: string;
  amount: number;
  invoice_id: string;
};

@Controller() //injeções
export class InvoicesConsumer {
  private logger = new Logger(InvoicesConsumer.name);

  constructor(
    private fraudService: FraudService,
    private metricsService: MetricsService,
  ) {}

  @EventPattern('pending_transactions')
  async handlePendingInvoices(@Payload() message: PendingInvoicesMessage) {
    this.logger.log(`Processing invoice: ${message.invoice_id}`);
    if (!message.event_id) {
      this.metricsService.recordFailed();
      this.logger.warn(`Missing event_id for invoice: ${message.invoice_id}`);
      return;
    }
    try {
      const result = await this.fraudService.processInvoice({
        event_id: message.event_id,
        account_id: message.account_id,
        amount: message.amount,
        invoice_id: message.invoice_id,
      });
      this.metricsService.recordProcessed(result.fraudResult.hasFraud);
      this.logger.log(`Invoice processed: ${message.invoice_id}`);
    } catch (error) {
      this.metricsService.recordFailed();
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Invoice failed: ${message.invoice_id}`, errorMessage);
      throw error;
    }
  }
}

// juntamente com http
// em um processo separado
