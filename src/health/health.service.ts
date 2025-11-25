import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class HealthService {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  async getHealthStatus() {
    const dbStatus = this.connection.readyState === 1 ? 'connected' : 'disconnected';
    const uptime = process.uptime();

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(uptime)}s`,
      database: {
        status: dbStatus,
        name: this.connection.name,
      },
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
    };
  }
}
