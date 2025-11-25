import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    if (err || !user) {
      if (info?.name === 'TokenExpiredError') {
        throw new UnauthorizedException({
          message: 'Access token has expired. Please refresh your token.',
          code: 'TOKEN_EXPIRED',
        });
      }
      throw err || new UnauthorizedException('Invalid access token');
    }
    return user;
  }
}
