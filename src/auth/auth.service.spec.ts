import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { AuthService } from './auth.service';
import { TokensService } from '../tokens/tokens.service';
import { User } from '../users/entities/user.entity';
import { createMockModel, mockUser } from '../../test/helpers/mock-factories';
import {
  validSignupDto,
  validLoginDto,
  validLoginWithUsernameDto,
  validLoginWithMobileDto,
} from '../../test/helpers/test-fixtures';

describe('AuthService', () => {
  let service: AuthService;
  let userModel: any;
  let tokensService: jest.Mocked<TokensService>;

  beforeEach(async () => {
    const mockUserModel = createMockModel(mockUser());

    const mockTokensService = {
      generateAccessToken: jest.fn().mockReturnValue('mock-access-token'),
      generateRefreshToken: jest.fn().mockReturnValue('mock-refresh-token'),
      storeRefreshToken: jest.fn().mockResolvedValue(undefined),
      verifyRefreshToken: jest.fn(),
      revokeRefreshToken: jest.fn().mockResolvedValue(undefined),
      revokeAllUserTokens: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: TokensService,
          useValue: mockTokensService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userModel = module.get(getModelToken(User.name));
    tokensService = module.get(TokensService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signup', () => {
    it('should successfully create a new user', async () => {
      const newUser = mockUser({ ...validSignupDto });
      userModel.findOne.mockResolvedValue(null);
      userModel.mockImplementation(() => ({
        ...newUser,
        save: jest.fn().mockResolvedValue(newUser),
      }));

      const result = await service.signup(validSignupDto, 'Mozilla/5.0', '127.0.0.1');

      expect(userModel.findOne).toHaveBeenCalledWith({
        $or: [
          { email: validSignupDto.email },
          { username: validSignupDto.username },
          { mobileNumber: validSignupDto.mobileNumber },
        ],
      });
      expect(result.user).toEqual({
        id: newUser._id.toString(),
        username: newUser.username,
        accessToken: 'mock-access-token',
      });
      expect(result.refreshToken).toBe('mock-refresh-token');
      expect(tokensService.generateAccessToken).toHaveBeenCalled();
      expect(tokensService.generateRefreshToken).toHaveBeenCalled();
      expect(tokensService.storeRefreshToken).toHaveBeenCalledWith(
        'mock-refresh-token',
        newUser._id.toString(),
        'Mozilla/5.0',
        '127.0.0.1',
      );
    });

    it('should successfully create user without userAgent and ipAddress', async () => {
      const newUser = mockUser({ ...validSignupDto });
      userModel.findOne.mockResolvedValue(null);
      userModel.mockImplementation(() => ({
        ...newUser,
        save: jest.fn().mockResolvedValue(newUser),
      }));

      const result = await service.signup(validSignupDto);

      expect(result.user.accessToken).toBe('mock-access-token');
      expect(tokensService.storeRefreshToken).toHaveBeenCalledWith(
        'mock-refresh-token',
        newUser._id.toString(),
        undefined,
        undefined,
      );
    });

    it('should throw ConflictException for duplicate email', async () => {
      const existingUser = mockUser({ email: validSignupDto.email });
      userModel.findOne.mockResolvedValue(existingUser);

      await expect(service.signup(validSignupDto)).rejects.toThrow(
        new ConflictException('User with this email already exists'),
      );
    });

    it('should throw ConflictException for duplicate username', async () => {
      const existingUser = mockUser({
        email: 'different@example.com',
        username: validSignupDto.username,
      });
      userModel.findOne.mockResolvedValue(existingUser);

      await expect(service.signup(validSignupDto)).rejects.toThrow(
        new ConflictException('Username is already taken'),
      );
    });

    it('should throw ConflictException for duplicate mobile number', async () => {
      const existingUser = mockUser({
        email: 'different@example.com',
        username: 'differentuser',
        mobileNumber: validSignupDto.mobileNumber,
      });
      userModel.findOne.mockResolvedValue(existingUser);

      await expect(service.signup(validSignupDto)).rejects.toThrow(
        new ConflictException('Mobile number is already registered'),
      );
    });
  });

  describe('login', () => {
    it('should successfully login with email', async () => {
      const user = mockUser({ comparePassword: jest.fn().mockResolvedValue(true) });
      userModel.findOne.mockResolvedValue(user);

      const result = await service.login(validLoginDto, 'Mozilla/5.0', '127.0.0.1');

      expect(userModel.findOne).toHaveBeenCalledWith({ email: validLoginDto.email.toLowerCase() });
      expect(user.comparePassword).toHaveBeenCalledWith(validLoginDto.password);
      expect(result.user).toEqual({
        id: user._id.toString(),
        username: user.username,
        accessToken: 'mock-access-token',
      });
      expect(result.refreshToken).toBe('mock-refresh-token');
    });

    it('should successfully login with username', async () => {
      const user = mockUser({ comparePassword: jest.fn().mockResolvedValue(true) });
      userModel.findOne.mockResolvedValue(user);

      const result = await service.login(validLoginWithUsernameDto, 'Mozilla/5.0', '127.0.0.1');

      expect(userModel.findOne).toHaveBeenCalledWith({
        username: validLoginWithUsernameDto.username.toLowerCase(),
      });
      expect(result.user.accessToken).toBe('mock-access-token');
    });

    it('should successfully login with mobile number', async () => {
      const user = mockUser({ comparePassword: jest.fn().mockResolvedValue(true) });
      userModel.findOne.mockResolvedValue(user);

      const result = await service.login(validLoginWithMobileDto, 'Mozilla/5.0', '127.0.0.1');

      expect(userModel.findOne).toHaveBeenCalledWith({
        mobileNumber: validLoginWithMobileDto.mobileNumber,
      });
      expect(result.user.accessToken).toBe('mock-access-token');
    });

    it('should successfully login without userAgent and ipAddress', async () => {
      const user = mockUser({ comparePassword: jest.fn().mockResolvedValue(true) });
      userModel.findOne.mockResolvedValue(user);

      await service.login(validLoginDto);

      expect(tokensService.storeRefreshToken).toHaveBeenCalledWith(
        'mock-refresh-token',
        user._id.toString(),
        undefined,
        undefined,
      );
    });

    it('should throw NotFoundException if user not found with email', async () => {
      userModel.findOne.mockResolvedValue(null);

      await expect(service.login(validLoginDto)).rejects.toThrow(
        new NotFoundException('User not found. Please sign up first'),
      );
    });

    it('should throw NotFoundException if user not found with username', async () => {
      userModel.findOne.mockResolvedValue(null);

      await expect(service.login(validLoginWithUsernameDto)).rejects.toThrow(
        new NotFoundException('User not found. Please sign up first'),
      );
    });

    it('should throw NotFoundException if user not found with mobile', async () => {
      userModel.findOne.mockResolvedValue(null);

      await expect(service.login(validLoginWithMobileDto)).rejects.toThrow(
        new NotFoundException('User not found. Please sign up first'),
      );
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      const user = mockUser({ comparePassword: jest.fn().mockResolvedValue(false) });
      userModel.findOne.mockResolvedValue(user);

      await expect(service.login(validLoginDto)).rejects.toThrow(
        new UnauthorizedException('Invalid password'),
      );
    });
  });

  describe('refreshAccessToken', () => {
    it('should successfully refresh access token', async () => {
      const decoded = { id: '507f1f77bcf86cd799439011' };
      const user = mockUser();
      tokensService.verifyRefreshToken.mockResolvedValue(decoded);
      userModel.findById.mockResolvedValue(user);

      const result = await service.refreshAccessToken('valid-refresh-token');

      expect(tokensService.verifyRefreshToken).toHaveBeenCalledWith('valid-refresh-token');
      expect(userModel.findById).toHaveBeenCalledWith(decoded.id);
      expect(result).toBe('mock-access-token');
    });

    it('should throw NotFoundException if user not found', async () => {
      const decoded = { id: '507f1f77bcf86cd799439011' };
      tokensService.verifyRefreshToken.mockResolvedValue(decoded);
      userModel.findById.mockResolvedValue(null);

      await expect(service.refreshAccessToken('valid-refresh-token')).rejects.toThrow(
        new NotFoundException('User not found'),
      );
    });
  });

  describe('logout', () => {
    it('should successfully logout with token', async () => {
      await service.logout('valid-refresh-token');

      expect(tokensService.revokeRefreshToken).toHaveBeenCalledWith('valid-refresh-token');
    });

    it('should handle logout without token', async () => {
      await service.logout(null);

      expect(tokensService.revokeRefreshToken).not.toHaveBeenCalled();
    });
  });

  describe('logoutAllDevices', () => {
    it('should successfully logout from all devices', async () => {
      const userId = '507f1f77bcf86cd799439011';

      await service.logoutAllDevices(userId);

      expect(tokensService.revokeAllUserTokens).toHaveBeenCalledWith(userId);
    });
  });
});
