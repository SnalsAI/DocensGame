import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Liveness check - is the service running?' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  async check() {
    return this.healthService.check();
  }

  @Get('live')
  @ApiOperation({ summary: 'Kubernetes liveness probe' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  async live(@Res() res: Response) {
    const health = await this.healthService.check();
    res.status(HttpStatus.OK).json(health);
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness check - is the service ready to accept traffic?' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  async ready(@Res() res: Response) {
    const result = await this.healthService.ready();
    const status = result.status === 'ready' ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;
    res.status(status).json(result);
  }

  @Get('detailed')
  @ApiOperation({ summary: 'Detailed health check with system metrics' })
  @ApiResponse({ status: 200, description: 'Detailed health information' })
  async detailed() {
    return this.healthService.detailed();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Application statistics' })
  @ApiResponse({ status: 200, description: 'Application stats' })
  async stats() {
    return this.healthService.getStats();
  }
}
