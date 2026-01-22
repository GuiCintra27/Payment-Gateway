import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { EventEmitterModule } from '@nestjs/event-emitter';
import * as kafkaLib from '@confluentinc/kafka-javascript';

import { MetricsModule } from '../metrics/metrics.module';
import { PrismaModule } from '../prisma/prisma.module';
import { FraudService } from '../invoices/fraud/fraud.service';
import { FrequentHighValueSpecification } from '../invoices/fraud/specifications/frequent-high-value.specification';
import { SuspiciousAccountSpecification } from '../invoices/fraud/specifications/suspicious-account.specification';
import { UnusualAmountSpecification } from '../invoices/fraud/specifications/unusual-amount.specification';
import { FraudAggregateSpecification } from '../invoices/fraud/specifications/fraud-aggregate.specification';
import { InvoicesConsumer } from '../invoices/invoices.consumer';
import { PublishProcessedInvoiceListener } from '../invoices/events/publish-processed-invoice.listener';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().uri().required(),
        KAFKA_BROKER: Joi.string().required(),
        SUSPICIOUS_VARIATION_PERCENTAGE: Joi.number(),
        INVOICES_HISTORY_COUNT: Joi.number(),
        SUSPICIOUS_INVOICES_COUNT: Joi.number(),
        SUSPICIOUS_TIMEFRAME_HOURS: Joi.number(),
        ANTIFRAUD_WORKER_PORT: Joi.number(),
      }),
    }),
    EventEmitterModule.forRoot(),
    MetricsModule,
    PrismaModule,
  ],
  controllers: [InvoicesConsumer],
  providers: [
    FraudService,
    FrequentHighValueSpecification,
    SuspiciousAccountSpecification,
    UnusualAmountSpecification,
    FraudAggregateSpecification,
    {
      provide: 'FRAUD_SPECIFICATIONS',
      useFactory: (
        frequentHighValueSpec: FrequentHighValueSpecification,
        suspiciousAccountSpec: SuspiciousAccountSpecification,
        unusualAmountSpec: UnusualAmountSpecification,
      ) => {
        return [
          frequentHighValueSpec,
          suspiciousAccountSpec,
          unusualAmountSpec,
        ];
      },
      inject: [
        FrequentHighValueSpecification,
        SuspiciousAccountSpecification,
        UnusualAmountSpecification,
      ],
    },
    {
      provide: kafkaLib.KafkaJS.Kafka,
      useValue: new kafkaLib.KafkaJS.Kafka({
        'bootstrap.servers': process.env.KAFKA_BROKER || 'localhost:9092',
      }),
    },
    PublishProcessedInvoiceListener,
  ],
})
export class WorkerModule {}
