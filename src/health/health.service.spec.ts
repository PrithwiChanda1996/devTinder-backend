import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken } from '@nestjs/mongoose';
import { HealthService } from './health.service';
import { mockConnection } from '../../test/helpers/mock-factories';

describe('HealthService', () => {
  let service: HealthService;

  const createModule = async (readyState: number) => {
    const mockConn = mockConnection(readyState);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: getConnectionToken(),
          useValue: mockConn,
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);

    return module;
  };

  it('should be defined', async () => {
    await createModule(1);
    expect(service).toBeDefined();
  });

  describe('getHealthStatus', () => {
    it('should return health status when database is connected', async () => {
      await createModule(1);
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';

      const result = await service.getHealthStatus();

      expect(result).toEqual({
        status: 'ok',
        timestamp: expect.any(String),
        uptime: expect.stringMatching(/^\d+s$/),
        database: {
          status: 'connected',
          name: 'devTinder',
        },
        environment: 'test',
        version: '1.0.0',
      });

      process.env.NODE_ENV = originalEnv;
    });

    it('should return disconnected status when database is not connected', async () => {
      await createModule(0);

      const result = await service.getHealthStatus();

      expect(result.database.status).toBe('disconnected');
    });

    it('should return disconnected for readyState 2 (connecting)', async () => {
      await createModule(2);

      const result = await service.getHealthStatus();

      expect(result.database.status).toBe('disconnected');
    });

    it('should return disconnected for readyState 3 (disconnecting)', async () => {
      await createModule(3);

      const result = await service.getHealthStatus();

      expect(result.database.status).toBe('disconnected');
    });

    it('should include correct timestamp format', async () => {
      await createModule(1);

      const result = await service.getHealthStatus();

      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    });

    it('should include uptime in seconds', async () => {
      await createModule(1);

      const result = await service.getHealthStatus();

      expect(result.uptime).toMatch(/^\d+s$/);
      const uptimeValue = parseInt(result.uptime.replace('s', ''));
      expect(uptimeValue).toBeGreaterThanOrEqual(0);
    });

    it('should default to development environment if NODE_ENV is not set', async () => {
      await createModule(1);
      const originalEnv = process.env.NODE_ENV;
      delete process.env.NODE_ENV;

      const result = await service.getHealthStatus();

      expect(result.environment).toBe('development');

      process.env.NODE_ENV = originalEnv;
    });

    it('should include database name from connection', async () => {
      await createModule(1);

      const result = await service.getHealthStatus();

      expect(result.database.name).toBe('devTinder');
    });

    it('should return version 1.0.0', async () => {
      await createModule(1);

      const result = await service.getHealthStatus();

      expect(result.version).toBe('1.0.0');
    });
  });
});
