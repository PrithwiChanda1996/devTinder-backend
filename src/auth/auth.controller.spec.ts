import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { mockConfigService } from '../../test/helpers/mock-factories';
import {
  validSignupDto,
  validLoginDto,
  mockRequest,
  mockResponse,
} from '../../test/helpers/test-fixtures';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  let configService: any;

  beforeEach(async () => {
    const mockAuthService = {
      signup: jest.fn(),
      login: jest.fn(),
      refreshAccessToken: jest.fn(),
      logout: jest.fn(),
      logoutAllDevices: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService(),
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
    configService = module.get(ConfigService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signup', () => {
    it('should create a new user and set refresh token cookie', async () => {
      const mockResult = {
        user: {
          id: '507f1f77bcf86cd799439011',
          username: 'johndoe',
          accessToken: 'mock-access-token',
        },
        refreshToken: 'mock-refresh-token',
      };

      authService.signup.mockResolvedValue(mockResult);

      const req = mockRequest();
      const res = mockResponse();

      const result = await controller.signup(validSignupDto, req as any, res as any);

      expect(authService.signup).toHaveBeenCalledWith(
        validSignupDto,
        req.headers['user-agent'],
        req.ip,
      );
      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'mock-refresh-token',
        configService.get('cookie'),
      );
      expect(result).toEqual({
        success: true,
        message: 'User registered successfully',
        data: mockResult.user,
      });
    });
  });

  describe('login', () => {
    it('should login user and set refresh token cookie', async () => {
      const mockResult = {
        user: {
          id: '507f1f77bcf86cd799439011',
          username: 'johndoe',
          accessToken: 'mock-access-token',
        },
        refreshToken: 'mock-refresh-token',
      };

      authService.login.mockResolvedValue(mockResult);

      const req = mockRequest();
      const res = mockResponse();

      const result = await controller.login(validLoginDto, req as any, res as any);

      expect(authService.login).toHaveBeenCalledWith(
        validLoginDto,
        req.headers['user-agent'],
        req.ip,
      );
      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'mock-refresh-token',
        configService.get('cookie'),
      );
      expect(result).toEqual({
        success: true,
        message: 'Login successful',
        data: mockResult.user,
      });
    });
  });

  describe('refreshToken', () => {
    it('should refresh access token from cookie', async () => {
      authService.refreshAccessToken.mockResolvedValue('new-access-token');

      const req = mockRequest({ cookies: { refreshToken: 'valid-refresh-token' } });

      const result = await controller.refreshToken(req as any);

      expect(authService.refreshAccessToken).toHaveBeenCalledWith('valid-refresh-token');
      expect(result).toEqual({
        success: true,
        message: 'Access token refreshed successfully',
        data: { accessToken: 'new-access-token' },
      });
    });

    it('should throw UnauthorizedException if no refresh token cookie', async () => {
      const req = mockRequest({ cookies: {} });

      await expect(controller.refreshToken(req as any)).rejects.toThrow(
        new UnauthorizedException('Refresh token not found'),
      );
      expect(authService.refreshAccessToken).not.toHaveBeenCalled();
    });

    it('should handle undefined cookies', async () => {
      const req = mockRequest({ cookies: undefined });

      await expect(controller.refreshToken(req as any)).rejects.toThrow(
        new UnauthorizedException('Refresh token not found'),
      );
    });
  });

  describe('logout', () => {
    it('should logout user and clear refresh token cookie', async () => {
      const req = mockRequest({ cookies: { refreshToken: 'valid-refresh-token' } });
      const res = mockResponse();

      const result = await controller.logout(req as any, res as any);

      expect(authService.logout).toHaveBeenCalledWith('valid-refresh-token');
      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', configService.get('cookie'));
      expect(result).toEqual({
        success: true,
        message: 'Logged out successfully',
      });
    });

    it('should handle logout without refresh token', async () => {
      const req = mockRequest({ cookies: {} });
      const res = mockResponse();

      const result = await controller.logout(req as any, res as any);

      expect(authService.logout).toHaveBeenCalledWith(undefined);
      expect(result.success).toBe(true);
    });
  });

  describe('logoutAllDevices', () => {
    it('should logout from all devices and clear cookie', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const res = mockResponse();

      const result = await controller.logoutAllDevices(userId, res as any);

      expect(authService.logoutAllDevices).toHaveBeenCalledWith(userId);
      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', configService.get('cookie'));
      expect(result).toEqual({
        success: true,
        message: 'Logged out from all devices successfully',
      });
    });
  });
});
