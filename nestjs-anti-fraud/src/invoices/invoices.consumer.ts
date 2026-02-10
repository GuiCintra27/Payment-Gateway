import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload } from '@nestjs/microservices';
import { FraudService } from './fraud/fraud.service';
import { MetricsService } from '../metrics/metrics.service';
import { ConfluentKafkaContext } from '../kafka/confluent-kafka-context';
import { Prisma, ProcessedEventStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

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
    private prismaService: PrismaService,
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
    const shouldProcess = await this.claimEvent(message.event_id);
    if (!shouldProcess) {
      this.logger.warn(
        `Duplicate event ignored: ${message.event_id} invoice_id=${message.invoice_id} request_id=${requestId || '-'}`,
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
      await this.markEventCompleted(message.event_id);
      this.logger.log(
        `Invoice processed: ${message.invoice_id} request_id=${requestId || '-'}`,
      );
    } catch (error) {
      this.metricsService.recordFailed();
      await this.markEventFailed(message.event_id, error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
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

  private async claimEvent(eventId: string): Promise<boolean> {
    try {
      await this.prismaService.processedEvent.create({
        data: { eventId, status: ProcessedEventStatus.PROCESSING },
      });
      return true;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const existing = await this.prismaService.processedEvent.findUnique({
          where: { eventId },
        });
        if (!existing) {
          return true;
        }
        if (existing.status === ProcessedEventStatus.COMPLETED) {
          return false;
        }
        await this.prismaService.processedEvent.update({
          where: { eventId },
          data: { status: ProcessedEventStatus.PROCESSING, lastError: null },
        });
        return true;
      }
      throw error;
    }
  }

  private async markEventCompleted(eventId: string) {
    await this.prismaService.processedEvent.update({
      where: { eventId },
      data: { status: ProcessedEventStatus.COMPLETED, lastError: null },
    });
  }

  private async markEventFailed(eventId: string, error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    await this.prismaService.processedEvent.update({
      where: { eventId },
      data: { status: ProcessedEventStatus.FAILED, lastError: message },
    });
  }
}

// juntamente com http
// em um processo separado
