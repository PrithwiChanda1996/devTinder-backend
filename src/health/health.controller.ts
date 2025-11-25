import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    schema: {
      example: {
        status: 'ok',
        timestamp: '2024-11-19T17:30:00.000Z',
        uptime: '3600s',
        database: {
          status: 'connected',
          name: 'devTinder',
        },
        environment: 'development',
        version: '1.0.0',
      },
    },
  })
  async checkHealth() {
    return this.healthService.getHealthStatus();
  }
}
