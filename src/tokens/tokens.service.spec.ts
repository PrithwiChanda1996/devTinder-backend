import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { TokensService } from './tokens.service';
import { RefreshToken } from './entities/refresh-token.entity';
import {
  createMockModel,
  mockUser,
  mockRefreshToken,
  mockJwtService,
  mockConfigService,
} from '../../test/helpers/mock-factories';

describe('TokensService', () => {
  let service: TokensService;
  let refreshTokenModel: any;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const mockRefreshTokenModel = createMockModel(mockRefreshToken());

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokensService,
        {
          provide: getModelToken(RefreshToken.name),
          useValue: mockRefreshTokenModel,
        },
        {
          provide: JwtService,
          useValue: mockJwtService(),
        },
        {
          provide: ConfigService,
          useValue: mockConfigService(),
        },
      ],
    }).compile();

    service = module.get<TokensService>(TokensService);
    refreshTokenModel = module.get(getModelToken(RefreshToken.name));
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateAccessToken', () => {
    it('should generate valid JWT access token', () => {
      const user = mockUser();
      jwtService.sign.mockReturnValue('mock-access-token');

      const result = service.generateAccessToken(user as any);

      expect(jwtService.sign).toHaveBeenCalledWith(
        {
          id: user._id,
          username: user.username,
          email: user.email,
        },
        {
          secret: 'test-access-secret',
          expiresIn: '15m',
        },
      );
      expect(result).toBe('mock-access-token');
    });

    it('should include correct payload fields', () => {
      const user = mockUser();

      service.generateAccessToken(user as any);

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          id: user._id,
          username: user.username,
          email: user.email,
        }),
        expect.any(Object),
      );
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate valid JWT refresh token', () => {
      const user = mockUser();
      jwtService.sign.mockReturnValue('mock-refresh-token');

      const result = service.generateRefreshToken(user as any);

      expect(jwtService.sign).toHaveBeenCalledWith(
        {
          id: user._id,
          type: 'refresh',
        },
        {
          secret: 'test-refresh-secret',
          expiresIn: '7d',
        },
      );
      expect(result).toBe('mock-refresh-token');
    });

    it('should include type field in payload', () => {
      const user = mockUser();

      service.generateRefreshToken(user as any);

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'refresh',
        }),
        expect.any(Object),
      );
    });
  });

  describe('storeRefreshToken', () => {
    it('should save refresh token to database with metadata', async () => {
      const token = 'refresh-token-123';
      const userId = '507f1f77bcf86cd799439011';
      const userAgent = 'Mozilla/5.0';
      const ipAddress = '127.0.0.1';

      const saveMock = jest.fn().mockResolvedValue({ token, userId, userAgent, ipAddress });
      refreshTokenModel.mockImplementation(() => ({
        save: saveMock,
      }));

      await service.storeRefreshToken(token, userId, userAgent, ipAddress);

      expect(saveMock).toHaveBeenCalled();
    });

    it('should set expiration date to 7 days from now', async () => {
      const token = 'refresh-token-123';
      const userId = '507f1f77bcf86cd799439011';

      let capturedExpiresAt: Date;
      refreshTokenModel.mockImplementation((data) => {
        capturedExpiresAt = data.expiresAt;
        return {
          save: jest.fn().mockResolvedValue(data),
        };
      });

      await service.storeRefreshToken(token, userId);

      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + 7);

      expect(capturedExpiresAt).toBeDefined();
      expect(capturedExpiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('should handle optional userAgent and ipAddress', async () => {
      const token = 'refresh-token-123';
      const userId = '507f1f77bcf86cd799439011';

      refreshTokenModel.mockImplementation((data) => ({
        ...data,
        save: jest.fn().mockResolvedValue(data),
      }));

      await service.storeRefreshToken(token, userId);

      expect(refreshTokenModel).toHaveBeenCalledWith(
        expect.objectContaining({
          token,
          userId,
        }),
      );
    });
  });

  describe('verifyRefreshToken', () => {
    it('should successfully verify valid refresh token', async () => {
      const token = 'valid-refresh-token';
      const decoded = { id: '507f1f77bcf86cd799439011', type: 'refresh' };
      const storedToken = mockRefreshToken({
        token,
        userId: decoded.id,
        isRevoked: false,
        expiresAt: new Date(Date.now() + 86400000),
      });

      jwtService.verify.mockReturnValue(decoded);
      refreshTokenModel.findOne.mockResolvedValue(storedToken);

      const result = await service.verifyRefreshToken(token);

      expect(jwtService.verify).toHaveBeenCalledWith(token, {
        secret: 'test-refresh-secret',
      });
      expect(refreshTokenModel.findOne).toHaveBeenCalledWith({
        token,
        userId: decoded.id,
        isRevoked: false,
      });
      expect(result).toEqual(decoded);
    });

    it('should throw UnauthorizedException for invalid token type', async () => {
      const token = 'invalid-type-token';
      const decoded = { id: '507f1f77bcf86cd799439011', type: 'access' };

      jwtService.verify.mockReturnValue(decoded);

      await expect(service.verifyRefreshToken(token)).rejects.toThrow(
        new UnauthorizedException('Invalid token type'),
      );
    });

    it('should throw UnauthorizedException if token not found in database', async () => {
      const token = 'not-stored-token';
      const decoded = { id: '507f1f77bcf86cd799439011', type: 'refresh' };

      jwtService.verify.mockReturnValue(decoded);
      refreshTokenModel.findOne.mockResolvedValue(null);

      await expect(service.verifyRefreshToken(token)).rejects.toThrow(
        new UnauthorizedException('Refresh token not found or has been revoked'),
      );
    });

    it('should throw UnauthorizedException if token is revoked', async () => {
      const token = 'revoked-token';
      const decoded = { id: '507f1f77bcf86cd799439011', type: 'refresh' };

      jwtService.verify.mockReturnValue(decoded);
      refreshTokenModel.findOne.mockResolvedValue(null);

      await expect(service.verifyRefreshToken(token)).rejects.toThrow(
        new UnauthorizedException('Refresh token not found or has been revoked'),
      );
    });

    it('should throw UnauthorizedException if token is expired', async () => {
      const token = 'expired-token';
      const decoded = { id: '507f1f77bcf86cd799439011', type: 'refresh' };
      const storedToken = mockRefreshToken({
        token,
        userId: decoded.id,
        isRevoked: false,
        expiresAt: new Date(Date.now() - 86400000),
      });

      jwtService.verify.mockReturnValue(decoded);
      refreshTokenModel.findOne.mockResolvedValue(storedToken);

      await expect(service.verifyRefreshToken(token)).rejects.toThrow(
        new UnauthorizedException('Refresh token has expired'),
      );
    });

    it('should throw UnauthorizedException on JsonWebTokenError', async () => {
      const token = 'malformed-token';
      const error = new Error('jwt malformed');
      error.name = 'JsonWebTokenError';

      jwtService.verify.mockImplementation(() => {
        throw error;
      });

      await expect(service.verifyRefreshToken(token)).rejects.toThrow(
        new UnauthorizedException('Invalid refresh token'),
      );
    });

    it('should throw UnauthorizedException on TokenExpiredError', async () => {
      const token = 'expired-jwt-token';
      const error = new Error('jwt expired');
      error.name = 'TokenExpiredError';

      jwtService.verify.mockImplementation(() => {
        throw error;
      });

      await expect(service.verifyRefreshToken(token)).rejects.toThrow(
        new UnauthorizedException('Refresh token has expired'),
      );
    });

    it('should rethrow other errors', async () => {
      const token = 'error-token';
      const error = new Error('Database error');

      jwtService.verify.mockImplementation(() => {
        throw error;
      });

      await expect(service.verifyRefreshToken(token)).rejects.toThrow(error);
    });
  });

  describe('revokeRefreshToken', () => {
    it('should mark token as revoked', async () => {
      const token = 'token-to-revoke';
      refreshTokenModel.updateOne.mockResolvedValue({ modifiedCount: 1 });

      await service.revokeRefreshToken(token);

      expect(refreshTokenModel.updateOne).toHaveBeenCalledWith({ token }, { isRevoked: true });
    });
  });

  describe('revokeAllUserTokens', () => {
    it('should mark all user tokens as revoked', async () => {
      const userId = '507f1f77bcf86cd799439011';
      refreshTokenModel.updateMany.mockResolvedValue({ modifiedCount: 3 });

      await service.revokeAllUserTokens(userId);

      expect(refreshTokenModel.updateMany).toHaveBeenCalledWith({ userId }, { isRevoked: true });
    });
  });
});
