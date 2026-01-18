import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { InvoicesModule } from './invoices/invoices.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MetricsModule } from './metrics/metrics.module';

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
      }),
    }),
    EventEmitterModule.forRoot(),
    MetricsModule,
    InvoicesModule,
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
//ES7 - Decorators
//MVC - Controller - request regra de negocio response
