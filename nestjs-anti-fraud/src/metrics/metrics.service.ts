import { Injectable } from '@nestjs/common';

@Injectable()
export class MetricsService {
  private processedTotal = 0;
  private approvedTotal = 0;
  private rejectedTotal = 0;
  private failedTotal = 0;
  private lastProcessedAt: string | null = null;

  recordProcessed(hasFraud: boolean) {
    this.processedTotal += 1;
    if (hasFraud) {
      this.rejectedTotal += 1;
    } else {
      this.approvedTotal += 1;
    }
    this.lastProcessedAt = new Date().toISOString();
  }

  recordFailed() {
    this.failedTotal += 1;
    this.lastProcessedAt = new Date().toISOString();
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
}
