import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/entities/user.entity';
import { TokensService } from '../tokens/tokens.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private tokensService: TokensService,
  ) {}

  async signup(
    signupDto: SignupDto,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<{ user: AuthResponseDto; refreshToken: string }> {
    const { email, username, mobileNumber } = signupDto;

    // Check for existing user
    const existingUser = await this.userModel.findOne({
      $or: [{ email }, { username }, { mobileNumber }],
    });

    if (existingUser) {
      const duplicateChecks = [
        {
          field: 'email',
          value: email,
          message: 'User with this email already exists',
        },
        {
          field: 'username',
          value: username,
          message: 'Username is already taken',
        },
        {
          field: 'mobileNumber',
          value: mobileNumber,
          message: 'Mobile number is already registered',
        },
      ];

      for (const check of duplicateChecks) {
        if (existingUser[check.field] === check.value) {
          throw new ConflictException(check.message);
        }
      }
    }

    // Create user
    const newUser = new this.userModel(signupDto);
    await newUser.save();

    // Generate tokens
    const accessToken = this.tokensService.generateAccessToken(newUser);
    const refreshToken = this.tokensService.generateRefreshToken(newUser);

    // Store refresh token
    await this.tokensService.storeRefreshToken(
      refreshToken,
      newUser._id.toString(),
      userAgent,
      ipAddress,
    );

    return {
      user: {
        id: newUser._id.toString(),
        username: newUser.username,
        accessToken,
      },
      refreshToken,
    };
  }

  async login(
    loginDto: LoginDto,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<{ user: AuthResponseDto; refreshToken: string }> {
    const { email, username, mobileNumber, password } = loginDto;

    // Find user
    let user: UserDocument;
    if (email) {
      user = await this.userModel.findOne({ email: email.toLowerCase() });
    } else if (username) {
      user = await this.userModel.findOne({ username: username.toLowerCase() });
    } else if (mobileNumber) {
      user = await this.userModel.findOne({ mobileNumber });
    }

    if (!user) {
      throw new NotFoundException('User not found. Please sign up first');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    // Generate tokens
    const accessToken = this.tokensService.generateAccessToken(user);
    const refreshToken = this.tokensService.generateRefreshToken(user);

    // Store refresh token
    await this.tokensService.storeRefreshToken(
      refreshToken,
      user._id.toString(),
      userAgent,
      ipAddress,
    );

    return {
      user: {
        id: user._id.toString(),
        username: user.username,
        accessToken,
      },
      refreshToken,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<string> {
    const decoded = await this.tokensService.verifyRefreshToken(refreshToken);

    const user = await this.userModel.findById(decoded.id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.tokensService.generateAccessToken(user);
  }

  async logout(refreshToken: string): Promise<void> {
    if (refreshToken) {
      await this.tokensService.revokeRefreshToken(refreshToken);
    }
  }

  async logoutAllDevices(userId: string): Promise<void> {
    await this.tokensService.revokeAllUserTokens(userId);
  }
}
