import { Injectable } from '@nestjs/common';
import { Counter, Gauge, Registry, collectDefaultMetrics } from 'prom-client';

@Injectable()
export class MetricsService {
  private processedTotal = 0;
  private approvedTotal = 0;
  private rejectedTotal = 0;
  private failedTotal = 0;
  private lastProcessedAt: string | null = null;

  private readonly registry: Registry;
  private readonly processedCounter: Counter;
  private readonly approvedCounter: Counter;
  private readonly rejectedCounter: Counter;
  private readonly failedCounter: Counter;
  private readonly lastProcessedGauge: Gauge;

  constructor() {
    this.registry = new Registry();
    collectDefaultMetrics({ register: this.registry });

    this.processedCounter = new Counter({
      name: 'antifraud_processed_total',
      help: 'Total processed antifraud events.',
      registers: [this.registry],
    });
    this.approvedCounter = new Counter({
      name: 'antifraud_approved_total',
      help: 'Total approved antifraud events.',
      registers: [this.registry],
    });
    this.rejectedCounter = new Counter({
      name: 'antifraud_rejected_total',
      help: 'Total rejected antifraud events.',
      registers: [this.registry],
    });
    this.failedCounter = new Counter({
      name: 'antifraud_failed_total',
      help: 'Total failed antifraud events.',
      registers: [this.registry],
    });
    this.lastProcessedGauge = new Gauge({
      name: 'antifraud_last_processed_timestamp',
      help: 'Unix timestamp of last processed event.',
      registers: [this.registry],
    });
  }

  recordProcessed(hasFraud: boolean) {
    this.processedTotal += 1;
    this.processedCounter.inc();
    if (hasFraud) {
      this.rejectedTotal += 1;
      this.rejectedCounter.inc();
    } else {
      this.approvedTotal += 1;
      this.approvedCounter.inc();
    }
    this.lastProcessedAt = new Date().toISOString();
    this.lastProcessedGauge.set(Date.now() / 1000);
  }

  recordFailed() {
    this.failedTotal += 1;
    this.failedCounter.inc();
    this.lastProcessedAt = new Date().toISOString();
    this.lastProcessedGauge.set(Date.now() / 1000);
  }

  snapshot() {
    return {
      processed_total: this.processedTotal,
      approved_total: this.approvedTotal,
      rejected_total: this.rejectedTotal,
      failed_total: this.failedTotal,
      last_processed_at: this.lastProcessedAt,
      uptime_seconds: Math.floor(process.uptime()),
    };
  }

  async prometheusSnapshot() {
    return this.registry.metrics();
  }

  prometheusContentType() {
    return this.registry.contentType;
  }
}
