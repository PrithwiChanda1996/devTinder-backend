import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { mockConfigService } from '../../../test/helpers/mock-factories';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: mockConfigService(),
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return user object from JWT payload', async () => {
      const payload = {
        id: '507f1f77bcf86cd799439011',
        username: 'johndoe',
        email: 'john.doe@example.com',
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        id: payload.id,
        username: payload.username,
        email: payload.email,
      });
    });

    it('should extract only id, username, and email from payload', async () => {
      const payload = {
        id: '507f1f77bcf86cd799439011',
        username: 'johndoe',
        email: 'john.doe@example.com',
        iat: 1234567890,
        exp: 1234567890,
        extraField: 'should not be included',
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        id: payload.id,
        username: payload.username,
        email: payload.email,
      });
      expect(result).not.toHaveProperty('iat');
      expect(result).not.toHaveProperty('exp');
      expect(result).not.toHaveProperty('extraField');
    });
  });
});
