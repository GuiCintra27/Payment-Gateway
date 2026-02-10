import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { MetricsService } from './metrics.service';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  getMetrics() {
    return this.metricsService.snapshot();
  }

  @Get('prom')
  async getPrometheus(@Res() res: Response) {
    const metrics = await this.metricsService.prometheusSnapshot();
    res.setHeader('Content-Type', this.metricsService.prometheusContentType());
    res.send(metrics);
  }
}
