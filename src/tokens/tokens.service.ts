import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RefreshToken, RefreshTokenDocument } from './entities/refresh-token.entity';
import { UserDocument } from '../users/entities/user.entity';

@Injectable()
export class TokensService {
  constructor(
    @InjectModel(RefreshToken.name)
    private refreshTokenModel: Model<RefreshTokenDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  generateAccessToken(user: UserDocument): string {
    const payload = {
      id: user._id,
      username: user.username,
      email: user.email,
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get('jwt.accessSecret'),
      expiresIn: this.configService.get('jwt.accessExpiry'),
    });
  }

  generateRefreshToken(user: UserDocument): string {
    const payload = {
      id: user._id,
      type: 'refresh',
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get('jwt.refreshSecret'),
      expiresIn: this.configService.get('jwt.refreshExpiry'),
    });
  }

  async storeRefreshToken(
    token: string,
    userId: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<RefreshTokenDocument> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const refreshToken = new this.refreshTokenModel({
      token,
      userId,
      expiresAt,
      userAgent,
      ipAddress,
    });

    return refreshToken.save();
  }

  async verifyRefreshToken(token: string): Promise<any> {
    try {
      const decoded = this.jwtService.verify(token, {
        secret: this.configService.get('jwt.refreshSecret'),
      });

      if (decoded.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      const storedToken = await this.refreshTokenModel.findOne({
        token,
        userId: decoded.id,
        isRevoked: false,
      });

      if (!storedToken) {
        throw new UnauthorizedException('Refresh token not found or has been revoked');
      }

      if (storedToken.expiresAt < new Date()) {
        throw new UnauthorizedException('Refresh token has expired');
      }

      return decoded;
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid refresh token');
      } else if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Refresh token has expired');
      }
      throw error;
    }
  }

  async revokeRefreshToken(token: string): Promise<void> {
    await this.refreshTokenModel.updateOne({ token }, { isRevoked: true });
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.refreshTokenModel.updateMany({ userId }, { isRevoked: true });
  }
}
