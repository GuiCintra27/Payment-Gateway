import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload } from '@nestjs/microservices';
import { FraudService } from './fraud/fraud.service';
import { MetricsService } from '../metrics/metrics.service';
import { ConfluentKafkaContext } from '../kafka/confluent-kafka-context';
import { Prisma } from '@prisma/client';

export type PendingInvoicesMessage = {
  schema_version?: number;
  event_id: string;
  account_id: string;
  amount: number;
  amount_cents?: number;
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
  async handlePendingInvoices(
    @Payload() message: PendingInvoicesMessage,
    @Ctx() context: ConfluentKafkaContext,
  ) {
    const requestId = this.getHeader(context, 'x-request-id');
    this.logger.log(
      `Processing invoice: ${message.invoice_id} request_id=${requestId || '-'}`,
    );
    if (!message.event_id) {
      this.metricsService.recordFailed();
      this.logger.warn(
        `Missing event_id for invoice: ${message.invoice_id} request_id=${requestId || '-'}`,
      );
      return;
    }
    const amountCents =
      typeof message.amount_cents === 'number'
        ? message.amount_cents
        : Math.round(message.amount * 100);
    const amountDecimal = new Prisma.Decimal(amountCents).div(100);
    try {
      const result = await this.fraudService.processInvoice({
        event_id: message.event_id,
        account_id: message.account_id,
        amount: amountDecimal,
        amountCents,
        invoice_id: message.invoice_id,
        requestId,
      });
      this.metricsService.recordProcessed(result.fraudResult.hasFraud);
      this.logger.log(
        `Invoice processed: ${message.invoice_id} request_id=${requestId || '-'}`,
      );
    } catch (error) {
      this.metricsService.recordFailed();
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Invoice failed: ${message.invoice_id} request_id=${requestId || '-'}`,
        errorMessage,
      );
      throw error;
    }
  }

  private getHeader(context: ConfluentKafkaContext, key: string): string {
    const headers = context.getMessage().headers || {};
    const raw = headers[key] as Buffer | string | undefined;
    if (!raw) {
      return '';
    }
    if (Buffer.isBuffer(raw)) {
      return raw.toString();
    }
    return raw;
  }
}

// juntamente com http
// em um processo separado
