import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;
  let healthService: jest.Mocked<HealthService>;

  beforeEach(async () => {
    const mockHealthService = {
      getHealthStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: mockHealthService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthService = module.get(HealthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('checkHealth', () => {
    it('should return health status from service', async () => {
      const mockHealthStatus = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: '3600s',
        database: {
          status: 'connected',
          name: 'devTinder',
        },
        environment: 'test',
        version: '1.0.0',
      };

      healthService.getHealthStatus.mockResolvedValue(mockHealthStatus);

      const result = await controller.checkHealth();

      expect(healthService.getHealthStatus).toHaveBeenCalled();
      expect(result).toEqual(mockHealthStatus);
    });

    it('should handle disconnected database', async () => {
      const mockHealthStatus = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: '100s',
        database: {
          status: 'disconnected',
          name: 'devTinder',
        },
        environment: 'production',
        version: '1.0.0',
      };

      healthService.getHealthStatus.mockResolvedValue(mockHealthStatus);

      const result = await controller.checkHealth();

      expect(result.database.status).toBe('disconnected');
    });
  });
});
