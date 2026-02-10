import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InvoiceProcessedEvent } from './invoice-processed.event';
import * as kafkaLib from '@confluentinc/kafka-javascript';

@Injectable()
export class PublishProcessedInvoiceListener implements OnModuleInit {
  private logger = new Logger(PublishProcessedInvoiceListener.name);
  private kafkaProducer: kafkaLib.KafkaJS.Producer;

  constructor(private kafkaInst: kafkaLib.KafkaJS.Kafka) {}

  async onModuleInit() {
    this.kafkaProducer = this.kafkaInst.producer();
    await this.kafkaProducer.connect();
  }

  @OnEvent('invoice.processed')
  async handle(event: InvoiceProcessedEvent) {
    const headers = event.requestId
      ? { 'x-request-id': event.requestId }
      : undefined;

    await this.kafkaProducer.send({
      topic: 'transactions_result',
      messages: [
        {
          value: JSON.stringify({
            schema_version: 2,
            event_id: event.event_id,
            invoice_id: event.invoice.id,
            status: event.fraudResult.hasFraud ? 'rejected' : 'approved',
          }),
          headers,
        },
      ],
    });
    this.logger.log(
      `Invoice ${event.invoice.id} processed event published request_id=${event.requestId || '-'}`,
    );
  }
}
