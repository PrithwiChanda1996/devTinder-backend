import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { TokensService } from './tokens.service';
import { RefreshToken, RefreshTokenSchema } from './entities/refresh-token.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: RefreshToken.name, schema: RefreshTokenSchema }]),
    JwtModule.register({}),
  ],
  providers: [TokensService],
  exports: [TokensService],
})
export class TokensModule {}
